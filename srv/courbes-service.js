'use strict'

const cds = require('@sap/cds')
const { parsePrn }         = require('./lib/parser-prn')
const { parseXlsx }        = require('./lib/parser-xlsx')
const { controlerReleves } = require('./lib/controles-qualite')
const { calculerPmax }     = require('./lib/calcul-pmax')

module.exports = cds.service.impl(async function (srv) {

    const db = await cds.connect.to('db')

    srv.on('importerFichier', async (req) => {
        const { serge: sergeParam, nomFichier, contenuBase64 } = req.data

        // ── 1. detect format ──────────────────────────────────────
        const ext = (nomFichier ?? '').split('.').pop().toLowerCase()
        const formatDetecte = ext === 'prn' ? 'prn' : ext === 'xlsx' ? 'xlsx' : null

        if (!formatDetecte) return erreur(`Format non supporté : .${ext || '?'}`, ext)
        if (!contenuBase64)  return erreur('Contenu du fichier manquant', formatDetecte)

        // ── 2. parse ──────────────────────────────────────────────
        let releves
        let sousType = null

        try {
            if (formatDetecte === 'prn') {
                const texte = Buffer.from(contenuBase64, 'base64').toString('latin1')
                releves = parsePrn(texte)
            } else {
                const result = parseXlsx(contenuBase64)
                releves  = result.releves
                sousType = result.sousType
                if (result.serge) releves.forEach(r => { r.serge = r.serge || result.serge })
            }
        } catch (e) {
            return erreur(`Erreur de parsing : ${e.message}`, formatDetecte)
        }

        if (!releves.length) {
            return erreur('Aucune ligne de données trouvée dans le fichier', formatDetecte)
        }

        // ── 3. contrôles qualité QC-01 … QC-07 ───────────────────
        controlerReleves(releves)

        // doublons (QC-04) : exclus de l'insertion (non insérés)
        const relevesAInserer = releves.filter(r => !r._exclure)
        const nbDoublons      = releves.length - relevesAInserer.length

        // ── 4. build DB rows ──────────────────────────────────────
        const now   = new Date()
        const erdat = now.toISOString().slice(0, 10)
        const erzet = now.toTimeString().slice(0, 8)

        const sergeEffectif = releves[0]?.serge || sergeParam || 'INCONNU'

        const rows = relevesAInserer.map(r => ({
            MANDT      : '100',
            SERGE      : String(r.serge || sergeEffectif).slice(0, 20),
            DAT_RELEVE : r.datReleve,
            HEU_RELEVE : r.heuReleve,
            COD_CADRAN : r.codCadran,
            VAL_CADRAN : r.valCadran,
            STATUT     : r.statut,
            MESSAGE    : String(r.message ?? '').slice(0, 220),
            ERNAM      : 'IMPORT',
            ERDAT      : erdat,
            ERZET      : erzet,
            AENAM      : 'IMPORT',
            AEDAT      : erdat,
            AEZET      : erzet
        }))

        // ── 5. upsert relevés (idempotent on re-import) ───────────
        if (rows.length) {
            try {
                await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesIndexs').entries(rows))
            } catch (e) {
                return erreur(`Erreur d'insertion : ${e.message}`, formatDetecte)
            }
        }

        // ── 6. calcul des Pmax par tranche horaire ────────────────
        let nbPmaxCalcules = 0
        try {
            const pmaxResults = calculerPmax(relevesAInserer)
            if (pmaxResults.length) {
                const pmaxRows = pmaxResults.map(r => {
                    const cleMetier = `${r.serge}_${r.codCadran}_${r.datePmax}`.slice(0, 50)
                    const champsAg  = `SERGE=${r.serge};CADRAN=${r.codCadran};PMAX=${r.pmax.toFixed(3)};DATE=${r.datePmax};HEURE=${r.heurePmax};SAISON=${r.saison}`.slice(0, 100)
                    const message   = `Pmax tranche ${r.codCadran} = ${r.pmax.toFixed(3)} kW atteint le ${r.datePmax} a ${r.heurePmax}`
                    return {
                        MANDT             : '100',
                        CLE_METIER        : cleMetier,
                        CHAMPS_AGREGATION : champsAg,
                        STATUT            : 'V',
                        MESSAGE           : message,
                        ERNAM             : 'CALCUL',
                        ERDAT             : erdat,
                        ERZET             : erzet,
                        AENAM             : 'CALCUL',
                        AEDAT             : erdat,
                        AEZET             : erzet,
                        serge             : r.serge,
                        codCadran         : r.codCadran,
                        pmax              : r.pmax,
                        datePmax          : r.datePmax,
                        heurePmax         : r.heurePmax,
                        saison            : r.saison
                    }
                })
                await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesCalculed').entries(pmaxRows))
                nbPmaxCalcules = pmaxRows.length
            }
        } catch (e) {
            cds.log('calcul-pmax').error('Erreur calcul Pmax :', e.message)
            // pas bloquant : l'import est déjà sauvegardé
        }

        // ── 7. stats ──────────────────────────────────────────────
        const nbBlockants      = relevesAInserer.filter(r => r.statut === 'E').length
        const nbAvertissements = relevesAInserer.filter(r => r.statut === 'A').length
        const nbAnomalies      = nbBlockants + nbAvertissements + nbDoublons

        const statutGlobal = (nbBlockants + nbDoublons) > 0 ? 'E'
                           : nbAvertissements > 0           ? 'A'
                           :                                  'V'

        const parties = [
            `${rows.length} relevé(s) importé(s), ${nbAnomalies} anomalie(s) (${nbBlockants} bloquante(s))`
        ]
        if (nbDoublons)        parties.push(`${nbDoublons} doublon(s) ignoré(s)`)
        if (nbAvertissements)  parties.push(`${nbAvertissements} avertissement(s)`)
        if (nbPmaxCalcules)    parties.push(`${nbPmaxCalcules} Pmax calculé(s)`)
        if (sousType)          parties.push(`[${sousType}]`)

        const cleMetier = [sergeEffectif, erdat.replace(/-/g, ''), sousType ?? formatDetecte].join('_')

        return {
            cleMetier,
            statut          : statutGlobal,
            formatDetecte,
            nbLignes        : rows.length,
            nbAnomalies,
            nbPmaxCalcules,
            message         : parties.join(' — ')
        }
    })

    function erreur(message, formatDetecte) {
        return { cleMetier: null, statut: 'E', formatDetecte: formatDetecte ?? 'inconnu',
                 nbLignes: 0, nbAnomalies: 0, nbPmaxCalcules: 0, message }
    }
})
