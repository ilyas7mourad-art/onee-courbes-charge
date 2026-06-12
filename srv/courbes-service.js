'use strict'

const cds = require('@sap/cds')
const { parsePrn }  = require('./lib/parser-prn')
const { parseXlsx } = require('./lib/parser-xlsx')

module.exports = cds.service.impl(async function (srv) {

    const db = await cds.connect.to('db')

    srv.on('importerFichier', async (req) => {
        const { serge: sergeParam, nomFichier, contenuBase64 } = req.data

        // ── 1. detect format ──────────────────────────────────────
        const ext = (nomFichier ?? '').split('.').pop().toLowerCase()
        const formatDetecte = ext === 'prn' ? 'prn' : ext === 'xlsx' ? 'xlsx' : null

        if (!formatDetecte) {
            return err(`Format non supporté : .${ext || '?'}`, ext)
        }
        if (!contenuBase64) {
            return err('Contenu du fichier manquant', formatDetecte)
        }

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
                // enrich releves whose serge was extracted from file
                if (result.serge) {
                    releves.forEach(r => { r.serge = r.serge || result.serge })
                }
            }
        } catch (e) {
            return err(`Erreur de parsing : ${e.message}`, formatDetecte)
        }

        if (!releves.length) {
            return err('Aucune ligne de données trouvée dans le fichier', formatDetecte)
        }

        // ── 3. build DB rows ──────────────────────────────────────
        const now   = new Date()
        const erdat = now.toISOString().slice(0, 10)
        const erzet = now.toTimeString().slice(0, 8)

        // SERGE : prefer value from file, then UI param
        const sergeEffectif = releves[0]?.serge || sergeParam || 'INCONNU'

        let nbAnomalies = 0
        const rows = releves.map(r => {
            const statut = r.etatCourbe === 'PDN' ? 'E' : 'V'
            if (statut === 'E') nbAnomalies++
            return {
                MANDT      : '100',
                SERGE      : String(r.serge || sergeEffectif).slice(0, 20),
                DAT_RELEVE : r.datReleve,
                HEU_RELEVE : r.heuReleve,
                COD_CADRAN : r.codCadran,
                VAL_CADRAN : r.valCadran,
                STATUT     : statut,
                MESSAGE    : statut === 'E' ? 'Panne détectée (PDN)' : '',
                ERNAM      : 'IMPORT',
                ERDAT      : erdat,
                ERZET      : erzet,
                AENAM      : 'IMPORT',
                AEDAT      : erdat,
                AEZET      : erzet
            }
        })

        // ── 4. upsert into DB (idempotent on re-import) ───────────
        try {
            // UPSERT: update if key already exists, insert otherwise
            await db.run(UPSERT.into('onee.courbes.ZccCourbeChargesIndexs').entries(rows))
        } catch (e) {
            return err(`Erreur d'insertion : ${e.message}`, formatDetecte)
        }

        // ── 5. build return value ─────────────────────────────────
        const cleMetier = [
            sergeEffectif,
            erdat.replace(/-/g, ''),
            sousType ?? formatDetecte
        ].join('_')

        return {
            cleMetier,
            statut      : nbAnomalies < rows.length ? 'V' : 'E',
            formatDetecte,
            nbLignes    : rows.length,
            nbAnomalies,
            message     : `${rows.length} relevé(s) importé(s), ${nbAnomalies} anomalie(s)`
                        + (sousType ? ` [${sousType}]` : '')
        }
    })

    // ── helpers ───────────────────────────────────────────────────
    function err(message, formatDetecte) {
        return { cleMetier: null, statut: 'E', formatDetecte: formatDetecte ?? 'inconnu',
                 nbLignes: 0, nbAnomalies: 0, message }
    }
})
