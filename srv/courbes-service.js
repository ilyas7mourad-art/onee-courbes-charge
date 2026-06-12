'use strict'

const cds = require('@sap/cds')
const { parsePrn }         = require('./lib/parser-prn')
const { parseXlsx }        = require('./lib/parser-xlsx')
const { controlerReleves } = require('./lib/controles-qualite')

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
            STATUT     : r.statut,                             // V / A / E from QC
            MESSAGE    : String(r.message ?? '').slice(0, 220),
            ERNAM      : 'IMPORT',
            ERDAT      : erdat,
            ERZET      : erzet,
            AENAM      : 'IMPORT',
            AEDAT      : erdat,
            AEZET      : erzet
        }))

        // ── 5. upsert (idempotent on re-import) ───────────────────
        if (rows.length) {
            try {
                await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesIndexs').entries(rows))
            } catch (e) {
                return erreur(`Erreur d'insertion : ${e.message}`, formatDetecte)
            }
        }

        // ── 6. stats ──────────────────────────────────────────────
        const nbBlockants      = relevesAInserer.filter(r => r.statut === 'E').length
        const nbAvertissements = relevesAInserer.filter(r => r.statut === 'A').length
        const nbAnomalies      = nbBlockants + nbAvertissements + nbDoublons

        // statut global : E si au moins un bloquant ou doublon, A si avert. seuls, V sinon
        const statutGlobal = (nbBlockants + nbDoublons) > 0 ? 'E'
                           : nbAvertissements > 0           ? 'A'
                           :                                  'V'

        const parties = [
            `${rows.length} relevé(s) importé(s), ${nbAnomalies} anomalie(s) (${nbBlockants} bloquante(s))`
        ]
        if (nbDoublons)      parties.push(`${nbDoublons} doublon(s) ignoré(s)`)
        if (nbAvertissements) parties.push(`${nbAvertissements} avertissement(s)`)
        if (sousType)        parties.push(`[${sousType}]`)

        const cleMetier = [sergeEffectif, erdat.replace(/-/g, ''), sousType ?? formatDetecte].join('_')

        return {
            cleMetier,
            statut      : statutGlobal,
            formatDetecte,
            nbLignes    : rows.length,
            nbAnomalies,
            message     : parties.join(' — ')
        }
    })

    function erreur(message, formatDetecte) {
        return { cleMetier: null, statut: 'E', formatDetecte: formatDetecte ?? 'inconnu',
                 nbLignes: 0, nbAnomalies: 0, message }
    }
})
