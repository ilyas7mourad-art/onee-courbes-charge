'use strict'

const cds = require('@sap/cds')
const { parsePrn }         = require('./lib/parser-prn')
const { parseXlsx }        = require('./lib/parser-xlsx')
const { controlerReleves } = require('./lib/controles-qualite')
const { calculerPmax, getTranche, getSaison } = require('./lib/calcul-pmax')
const { COMPTEURS, genererPuissance } = require('./lib/simulateur')

module.exports = cds.service.impl(async function (srv) {

    const db = await cds.connect.to('db')

    // ═══════════════════════════════════════════════════════════════
    //  Import de fichier
    // ═══════════════════════════════════════════════════════════════

    srv.on('importerFichier', async (req) => {
        const { serge: sergeParam, nomFichier, contenuBase64 } = req.data

        const ext = (nomFichier ?? '').split('.').pop().toLowerCase()
        const formatDetecte = ext === 'prn' ? 'prn' : ext === 'xlsx' ? 'xlsx' : null

        if (!formatDetecte) return erreur(`Format non supporté : .${ext || '?'}`, ext)
        if (!contenuBase64)  return erreur('Contenu du fichier manquant', formatDetecte)

        let releves, sousType = null
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

        controlerReleves(releves)

        const relevesAInserer = releves.filter(r => !r._exclure)
        const nbDoublons      = releves.length - relevesAInserer.length

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
            ERNAM      : 'IMPORT', ERDAT: erdat, ERZET: erzet,
            AENAM      : 'IMPORT', AEDAT: erdat, AEZET: erzet
        }))

        if (rows.length) {
            try {
                await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesIndexs').entries(rows))
            } catch (e) {
                return erreur(`Erreur d'insertion : ${e.message}`, formatDetecte)
            }
        }

        let nbPmaxCalcules = 0
        try {
            const pmaxResults = calculerPmax(relevesAInserer)
            if (pmaxResults.length) {
                const pmaxRows = pmaxResults.map(r => buildPmaxRow(r, erdat, erzet))
                await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesCalculed').entries(pmaxRows))
                nbPmaxCalcules = pmaxRows.length
            }
        } catch (e) {
            cds.log('calcul-pmax').error('Erreur calcul Pmax :', e.message)
        }

        const nbBlockants      = relevesAInserer.filter(r => r.statut === 'E').length
        const nbAvertissements = relevesAInserer.filter(r => r.statut === 'A').length
        const nbAnomalies      = nbBlockants + nbAvertissements + nbDoublons

        const statutGlobal = (nbBlockants + nbDoublons) > 0 ? 'E'
                           : nbAvertissements > 0           ? 'A'
                           :                                  'V'

        const parties = [
            `${rows.length} relevé(s) importé(s), ${nbAnomalies} anomalie(s) (${nbBlockants} bloquante(s))`
        ]
        if (nbDoublons)       parties.push(`${nbDoublons} doublon(s) ignoré(s)`)
        if (nbAvertissements) parties.push(`${nbAvertissements} avertissement(s)`)
        if (nbPmaxCalcules)   parties.push(`${nbPmaxCalcules} Pmax calculé(s)`)
        if (sousType)         parties.push(`[${sousType}]`)

        const cleMetier = [sergeEffectif, erdat.replace(/-/g, ''), sousType ?? formatDetecte].join('_')

        return {
            cleMetier, statut: statutGlobal, formatDetecte,
            nbLignes: rows.length, nbAnomalies, nbPmaxCalcules,
            message: parties.join(' — ')
        }
    })

    // ═══════════════════════════════════════════════════════════════
    //  Simulateur temps réel
    // ═══════════════════════════════════════════════════════════════

    // Horloge de départ : 2024-01-15 00:00 (HIVER — PAIHP = 17h-22h)
    const SIM_START_MS  = new Date('2024-01-15T00:00:00Z').getTime()
    const SIM_TICK_MS   = 2000    // 2 s réels = 1 h simulée
    const SERGES_SIM    = COMPTEURS.map(c => c.serge)

    const SIM = {
        active      : false,
        intervalId  : null,
        clockMs     : SIM_START_MS,
        nbReleves   : 0,
        pmaxCache   : new Map()   // "SERGE_TRANCHE" → {pmax, datePmax, heurePmax, saison}
    }

    // ── Tick : génère 20 relevés + met à jour les Pmax en mémoire ──
    async function simTick() {
        const clock   = new Date(SIM.clockMs)
        const dateIso = clock.toISOString().slice(0, 10)
        const heureIso = clock.toISOString().slice(11, 19)

        const now   = new Date()
        const erdat = now.toISOString().slice(0, 10)
        const erzet = now.toTimeString().slice(0, 8)

        // Génère les 20 relevés du tick
        const rows = COMPTEURS.map(c => ({
            MANDT      : '100',
            SERGE      : c.serge,
            DAT_RELEVE : dateIso,
            HEU_RELEVE : heureIso,
            COD_CADRAN : 'EA',
            VAL_CADRAN : genererPuissance(c.serge, dateIso, heureIso),
            STATUT     : 'V',
            MESSAGE    : `Sim/${c.profilNom}`,
            ERNAM      : 'SIM', ERDAT: erdat, ERZET: erzet,
            AENAM      : 'SIM', AEDAT: erdat, AEZET: erzet
        }))

        await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesIndexs').entries(rows))
        SIM.nbReleves += rows.length

        // Met à jour le cache Pmax en mémoire (ne garde que le max par tranche)
        const tranche    = getTranche(dateIso, heureIso)
        const saison     = getSaison(dateIso)
        const pmaxUpdates = []

        for (const row of rows) {
            const key = `${row.SERGE}_${tranche}`
            const val = Number(row.VAL_CADRAN)
            const cur = SIM.pmaxCache.get(key)
            if (!cur || val > cur.pmax) {
                const entry = { serge: row.SERGE, codCadran: tranche, pmax: val,
                                datePmax: dateIso, heurePmax: heureIso, saison }
                SIM.pmaxCache.set(key, entry)
                pmaxUpdates.push(entry)
            }
        }

        // Persistance des Pmax mis à jour (CLE_METIER fixe = SERGE_TRANCHE → 1 ligne par combo)
        if (pmaxUpdates.length) {
            const pmaxRows = pmaxUpdates.map(r => ({
                MANDT             : '100',
                CLE_METIER        : `${r.serge}_${r.codCadran}`.slice(0, 50),
                CHAMPS_AGREGATION : `SERGE=${r.serge};CADRAN=${r.codCadran};PMAX=${r.pmax.toFixed(3)};DATE=${r.datePmax};HEURE=${r.heurePmax};SAISON=${r.saison}`.slice(0, 100),
                STATUT            : 'V',
                MESSAGE           : `Pmax ${r.codCadran} = ${r.pmax.toFixed(3)} kW — ${r.datePmax} ${r.heurePmax}`,
                ERNAM             : 'SIM', ERDAT: erdat, ERZET: erzet,
                AENAM             : 'SIM', AEDAT: erdat, AEZET: erzet,
                serge             : r.serge,
                codCadran         : r.codCadran,
                pmax              : r.pmax,
                datePmax          : r.datePmax,
                heurePmax         : r.heurePmax,
                saison            : r.saison
            }))
            await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesCalculed').entries(pmaxRows))
        }

        // Avance l'horloge simulée de 1 heure
        SIM.clockMs += 3600000
    }

    // ── Réponse standardisée ────────────────────────────────────
    function simStatus(statut, message) {
        const ts = new Date(SIM.clockMs)
        const heureSimulee = SIM.clockMs === SIM_START_MS && !SIM.active
            ? '--'
            : ts.toISOString().slice(0, 16).replace('T', ' ')
        return {
            statut,
            nbReleves    : SIM.nbReleves,
            heureSimulee : heureSimulee,
            message      : message || (statut === 'active' ? 'Simulation en cours' : 'Simulation inactive')
        }
    }

    // ── Handlers ────────────────────────────────────────────────

    srv.on('demarrerSimulation', () => {
        if (SIM.active) return simStatus('active', 'Simulation déjà active')
        SIM.active = true
        SIM.intervalId = setInterval(() => {
            simTick().catch(e => cds.log('sim').error('Tick error:', e.message))
        }, SIM_TICK_MS)
        return simStatus('active', `Simulation démarrée — ${COMPTEURS.length} compteurs (${SIM_TICK_MS / 1000} s/h)`)
    })

    srv.on('arreterSimulation', () => {
        if (!SIM.active) return simStatus('inactive', 'Simulation déjà arrêtée')
        clearInterval(SIM.intervalId)
        SIM.intervalId = null
        SIM.active = false
        return simStatus('inactive', `Simulation arrêtée — ${SIM.nbReleves} relevés générés`)
    })

    srv.on('resetSimulation', async () => {
        // Arrêt si actif
        if (SIM.active) {
            clearInterval(SIM.intervalId)
            SIM.intervalId = null
            SIM.active = false
        }

        // Suppression des données SIM* en base
        try {
            // Relevés : DELETE par SERGE (clé partielle)
            for (const serge of SERGES_SIM) {
                await db.run(DELETE.from('onee.courbes.ZccCourbeChargesIndexs').where({ SERGE: serge }))
            }
            // Pmax : CLE_METIER = "SIMxxxx_TRANCHE" — on supprime par ce pattern
            const pmaxKeys = SERGES_SIM.flatMap(s =>
                ['PAIHP', 'PAIHC', 'PAIHPL'].map(t => `${s}_${t}`)
            )
            await db.run(DELETE.from('onee.courbes.ZccCourbeChargesCalculed')
                               .where({ CLE_METIER: pmaxKeys }))
        } catch (e) {
            cds.log('sim').error('Erreur reset :', e.message)
        }

        // Réinitialisation de l'état en mémoire
        SIM.clockMs   = SIM_START_MS
        SIM.nbReleves = 0
        SIM.pmaxCache.clear()

        return simStatus('inactive', 'Simulation réinitialisée — données SIM* supprimées')
    })

    srv.on('statutSimulation', () => simStatus(SIM.active ? 'active' : 'inactive'))

    // ═══════════════════════════════════════════════════════════════
    //  Helpers partagés
    // ═══════════════════════════════════════════════════════════════

    function buildPmaxRow(r, erdat, erzet) {
        const cleMetier = `${r.serge}_${r.codCadran}_${r.datePmax}`.slice(0, 50)
        const champsAg  = `SERGE=${r.serge};CADRAN=${r.codCadran};PMAX=${r.pmax.toFixed(3)};DATE=${r.datePmax};HEURE=${r.heurePmax};SAISON=${r.saison}`.slice(0, 100)
        const message   = `Pmax tranche ${r.codCadran} = ${r.pmax.toFixed(3)} kW atteint le ${r.datePmax} a ${r.heurePmax}`
        return {
            MANDT: '100', CLE_METIER: cleMetier, CHAMPS_AGREGATION: champsAg,
            STATUT: 'V', MESSAGE: message,
            ERNAM: 'CALCUL', ERDAT: erdat, ERZET: erzet,
            AENAM: 'CALCUL', AEDAT: erdat, AEZET: erzet,
            serge: r.serge, codCadran: r.codCadran, pmax: r.pmax,
            datePmax: r.datePmax, heurePmax: r.heurePmax, saison: r.saison
        }
    }

    function erreur(message, formatDetecte) {
        return { cleMetier: null, statut: 'E', formatDetecte: formatDetecte ?? 'inconnu',
                 nbLignes: 0, nbAnomalies: 0, nbPmaxCalcules: 0, message }
    }
})
