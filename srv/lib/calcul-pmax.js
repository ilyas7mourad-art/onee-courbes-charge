'use strict'

// ── Configuration ─────────────────────────────────────────────────────────────
//
// VALEUR_EST_PUISSANCE = true  : VAL_CADRAN est déjà une puissance en kW.
//                                Utilisation directe pour le calcul du Pmax.
//
// VALEUR_EST_PUISSANCE = false : VAL_CADRAN est une énergie en kWh sur un intervalle.
//                                Conversion : P(kW) = E(kWh) / (DUREE_INTERVALLE_MIN / 60)
//
// ⚠ À confirmer avec un vrai fichier ELSTER : si les valeurs brutes sont des kWh
//   cumulés sur 10 min, passer VALEUR_EST_PUISSANCE = false.
//
const VALEUR_EST_PUISSANCE = true   // ← ajuster selon le format ELSTER réel
const DUREE_INTERVALLE_MIN = 10     // durée nominale d'un intervalle en minutes

// ── Plages horaires par saison ────────────────────────────────────────────────
const TRANCHES = {
    HIVER: {                              // 1er nov → 31 mars
        PAIHP : { debut: 17, fin: 22 },   // Pointe  17h00–22h00
        PAIHC : { debut: 22, fin:  7 },   // Creuse  22h00–07h00 (traverse minuit)
        PAIHPL: { debut:  7, fin: 17 }    // Pleine  07h00–17h00
    },
    ETE: {                                // 1er avr → 31 oct
        PAIHP : { debut: 18, fin: 23 },   // Pointe  18h00–23h00
        PAIHC : { debut: 23, fin:  8 },   // Creuse  23h00–08h00 (traverse minuit)
        PAIHPL: { debut:  8, fin: 18 }    // Pleine  08h00–18h00
    }
}

/**
 * Détermine la saison à partir d'une date ISO YYYY-MM-DD.
 * HIVER : 1er nov → 31 mars   |   ETE : 1er avr → 31 oct
 */
function getSaison(dateIso) {
    const mm = parseInt(dateIso.slice(5, 7), 10)
    return (mm >= 11 || mm <= 3) ? 'HIVER' : 'ETE'
}

/**
 * Retourne la tranche tarifaire pour une date + heure données.
 * Gère le passage de minuit pour la tranche creuse (HC).
 *
 * @param {string} dateIso   YYYY-MM-DD
 * @param {string} heureIso  HH:MM:SS
 * @returns {'PAIHP'|'PAIHC'|'PAIHPL'}
 */
function getTranche(dateIso, heureIso) {
    const saison = getSaison(dateIso)
    const h      = parseInt(heureIso.slice(0, 2), 10)   // 0-23
    const plages = TRANCHES[saison]

    for (const cod of ['PAIHP', 'PAIHC', 'PAIHPL']) {
        const { debut, fin } = plages[cod]
        // Tranche normale   (fin > debut) : debut ≤ h < fin
        // Traverse minuit   (fin < debut) : h ≥ debut  OU  h < fin
        if (fin > debut ? (h >= debut && h < fin) : (h >= debut || h < fin)) return cod
    }
    return 'PAIHPL'  // fallback (ne devrait pas arriver, les 3 tranches couvrent 24h)
}

/**
 * Calcule les Pmax par tranche tarifaire à partir d'un ensemble de relevés.
 *
 * @param {Array}   releves  Relevés bruts (après QC) — chaque objet doit avoir :
 *                           .statut     V/A/E (les 'E' sont exclus du calcul)
 *                           .datReleve  YYYY-MM-DD
 *                           .heuReleve  HH:MM:SS
 *                           .valCadran  valeur numérique
 *                           .serge      numéro de série du compteur
 * @param {Object}  options
 * @param {boolean} [options.valeurEstPuissance]  Surcharge de VALEUR_EST_PUISSANCE.
 *
 * @returns {Array<{serge, codCadran, pmax, datePmax, heurePmax, saison}>}
 *   Jusqu'à 3 entrées par compteur (une par tranche ayant au moins un relevé valide).
 */
function calculerPmax(releves, options = {}) {
    const estPuissance = options.valeurEstPuissance ?? VALEUR_EST_PUISSANCE

    // 1. Relevés exploitables : non bloquant, valeur numérique valide, date+heure présentes
    const exploitables = releves.filter(r =>
        r.statut !== 'E'          &&
        r.datReleve               &&
        r.heuReleve               &&
        r.valCadran !== null      &&
        r.valCadran !== undefined &&
        !isNaN(Number(r.valCadran))
    )

    if (!exploitables.length) return []

    // 2. Pour chaque relevé : calcul puissance + détermination de la tranche
    const groupes = new Map()   // clé : "<SERGE>_<TRANCHE>"

    for (const r of exploitables) {
        const valeur    = Number(r.valCadran)
        const puissance = estPuissance ? valeur : valeur / (DUREE_INTERVALLE_MIN / 60)
        const codCadran = getTranche(r.datReleve, r.heuReleve)
        const saison    = getSaison(r.datReleve)
        const serge     = String(r.serge || '').slice(0, 20)
        const cle       = `${serge}_${codCadran}`

        const actuel = groupes.get(cle)
        if (!actuel || puissance > actuel.pmax) {
            groupes.set(cle, { serge, codCadran, pmax: puissance,
                                datePmax: r.datReleve, heurePmax: r.heuReleve, saison })
        }
    }

    return Array.from(groupes.values())
}

module.exports = { getSaison, getTranche, calculerPmax, VALEUR_EST_PUISSANCE, DUREE_INTERVALLE_MIN }
