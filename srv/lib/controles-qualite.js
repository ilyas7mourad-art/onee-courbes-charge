'use strict'

/**
 * ZCL_COURBE_CHARGE_UTIL — contrôles qualité des relevés avant insertion.
 *
 * Chaque relevé reçoit trois champs supplémentaires :
 *   statut       : 'V' | 'A' | 'E'
 *   message      : codes + descriptions concaténés (ex: "QC-02 VALEUR_NULLE : valeur à zéro")
 *   codeAnomalie : code du contrôle le plus grave déclenché (null si aucun)
 *
 * Règle de sévérité : E > A > V — on ne rétrograde jamais un statut.
 * Un relevé avec _exclure=true (QC-04) n'est pas inséré en base.
 */

const GRAVITE = { V: 0, A: 1, E: 2 }

// ── point d'entrée ────────────────────────────────────────────────

/**
 * @param {{ serge, datReleve, heuReleve, codCadran, valCadran, etatCourbe? }[]} releves
 * @param {{ intervalleAttenduMin?: number, toleranceMin?: number }} options
 * @returns same array, each element enriched with statut/message/codeAnomalie/_exclure
 */
function controlerReleves(releves, options = {}) {
    const intervalleAttenduMin = options.intervalleAttenduMin ?? 10
    const toleranceMin         = options.toleranceMin         ?? 1

    // initialisation
    for (const r of releves) {
        r.statut       = 'V'
        r.message      = ''
        r.codeAnomalie = null
        r._exclure     = false
    }

    // ── contrôles bloquants ───────────────────────────────────────
    qc05FormatInvalide(releves)
    qc07ValeurNegative(releves)
    qc04Doublon(releves)

    // ── contrôles basés sur des groupes (même SERGE+CADRAN) ───────
    const groupes = grouperParSergeCadran(releves)
    for (const groupe of groupes.values()) {
        qc01Lacune(groupe, intervalleAttenduMin, toleranceMin)
        qc03ValeurNulleSerie(groupe)
    }

    // ── contrôles non-bloquants standalone ────────────────────────
    qc02ValeurNulle(releves)
    qc06StatutPanne(releves)

    return releves
}

// ── QC-01  LACUNE ─────────────────────────────────────────────────
/**
 * Non-bloquant (A). Détecte un écart entre deux relevés consécutifs
 * supérieur à (intervalleAttenduMin + toleranceMin).
 * Marque le relevé SUIVANT la lacune.
 */
function qc01Lacune(groupe, intervalleAttenduMin, toleranceMin) {
    const limiteMs = (intervalleAttenduMin + toleranceMin) * 60_000
    for (let i = 1; i < groupe.length; i++) {
        const tsA = toMs(groupe[i - 1])
        const tsB = toMs(groupe[i])
        if (!tsA || !tsB) continue
        const ecartMs = tsB - tsA
        if (ecartMs > limiteMs) {
            const ecartMin = Math.round(ecartMs / 60_000)
            ajouterAnomalie(groupe[i], 'A', 'QC-01',
                `QC-01 LACUNE : écart de ${ecartMin} min détecté`)
        }
    }
}

// ── QC-02  VALEUR_NULLE ───────────────────────────────────────────
/**
 * Non-bloquant (A). Relevé individuel avec VAL_CADRAN === 0.
 */
function qc02ValeurNulle(releves) {
    for (const r of releves) {
        if (r.valCadran === 0) {
            ajouterAnomalie(r, 'A', 'QC-02', 'QC-02 VALEUR_NULLE : valeur à zéro')
        }
    }
}

// ── QC-03  VALEUR_NULLE_SERIE ─────────────────────────────────────
/**
 * Non-bloquant (A). Plus de 3 relevés consécutifs (même SERGE+CADRAN) à zéro.
 * Marque toutes les lignes de la série.
 */
function qc03ValeurNulleSerie(groupe) {
    let i = 0
    while (i < groupe.length) {
        if (groupe[i].valCadran === 0) {
            let j = i
            while (j < groupe.length && groupe[j].valCadran === 0) j++
            const runLen = j - i
            if (runLen > 3) {
                const desc = `QC-03 VALEUR_NULLE_SERIE : ${runLen} valeurs nulles consécutives`
                for (let k = i; k < j; k++) {
                    ajouterAnomalie(groupe[k], 'A', 'QC-03', desc)
                }
            }
            i = j
        } else {
            i++
        }
    }
}

// ── QC-04  DOUBLON ────────────────────────────────────────────────
/**
 * Bloquant (E). Deux relevés avec la même clé SERGE+DATE+HEURE+CADRAN.
 * Le premier est conservé ; les suivants reçoivent _exclure=true (non insérés).
 */
function qc04Doublon(releves) {
    const vus = new Set()
    for (const r of releves) {
        const cle = `${r.serge}|${r.datReleve}|${r.heuReleve}|${r.codCadran}`
        if (vus.has(cle)) {
            ajouterAnomalie(r, 'E', 'QC-04', 'QC-04 DOUBLON : clé déjà présente')
            r._exclure = true
        } else {
            vus.add(cle)
        }
    }
}

// ── QC-05  FORMAT_INVALIDE ────────────────────────────────────────
/**
 * Bloquant (E). datReleve ou heuReleve absents, ou VAL_CADRAN non numérique.
 */
function qc05FormatInvalide(releves) {
    for (const r of releves) {
        if (!r.datReleve || !r.heuReleve || typeof r.valCadran !== 'number' || isNaN(r.valCadran)) {
            ajouterAnomalie(r, 'E', 'QC-05', 'QC-05 FORMAT_INVALIDE : donnée illisible')
        }
    }
}

// ── QC-06  STATUT_PANNE ───────────────────────────────────────────
/**
 * Non-bloquant (A). etatCourbe différent de 'FST' (cas CLOU PDN, etc.).
 */
function qc06StatutPanne(releves) {
    for (const r of releves) {
        if (r.etatCourbe && r.etatCourbe !== 'FST') {
            ajouterAnomalie(r, 'A', 'QC-06',
                `QC-06 STATUT_PANNE : état courbe = ${r.etatCourbe}`)
        }
    }
}

// ── QC-07  VALEUR_NEGATIVE ────────────────────────────────────────
/**
 * Bloquant (E). VAL_CADRAN strictement négatif.
 */
function qc07ValeurNegative(releves) {
    for (const r of releves) {
        if (typeof r.valCadran === 'number' && r.valCadran < 0) {
            ajouterAnomalie(r, 'E', 'QC-07', 'QC-07 VALEUR_NEGATIVE : valeur négative')
        }
    }
}

// ── utilitaires internes ──────────────────────────────────────────

/**
 * Applique une anomalie sur un relevé.
 * - Monte le statut uniquement si gravite > statut actuel.
 * - codeAnomalie = code du premier 'E', ou premier 'A' si aucun 'E'.
 * - Concatène le message avec " | " comme séparateur.
 */
function ajouterAnomalie(r, gravite, code, desc) {
    const niveauActuel  = GRAVITE[r.statut] ?? 0
    const niveauNouveau = GRAVITE[gravite]  ?? 0

    if (niveauNouveau > niveauActuel) {
        r.statut       = gravite
        r.codeAnomalie = code
    } else if (niveauNouveau === niveauActuel && niveauNouveau > 0 && r.codeAnomalie === null) {
        r.codeAnomalie = code
    }

    r.message = r.message ? `${r.message} | ${desc}` : desc
}

/**
 * Regroupe les relevés par (SERGE, COD_CADRAN) et trie chaque groupe
 * par horodatage croissant. Retourne une Map<string, releve[]>.
 */
function grouperParSergeCadran(releves) {
    const map = new Map()
    for (const r of releves) {
        const cle = `${r.serge}|${r.codCadran}`
        if (!map.has(cle)) map.set(cle, [])
        map.get(cle).push(r)
    }
    for (const groupe of map.values()) {
        groupe.sort((a, b) => (toMs(a) ?? 0) - (toMs(b) ?? 0))
    }
    return map
}

/** Convertit datReleve (YYYY-MM-DD) + heuReleve (HH:MM:SS) en ms epoch. */
function toMs(r) {
    if (!r.datReleve || !r.heuReleve) return null
    const ts = Date.parse(`${r.datReleve}T${r.heuReleve}`)
    return isNaN(ts) ? null : ts
}

module.exports = { controlerReleves }
