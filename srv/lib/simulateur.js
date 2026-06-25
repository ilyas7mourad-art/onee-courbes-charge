'use strict'

// ── Profils de consommation ──────────────────────────────────────────────────
// Chaque profil définit une courbe horaire (facteur 0→1, h=0..23),
// un intervalle de puissance de base et d'amplitude.

const PROFILS = {
    industriel: {
        // Fonctionnement 24h, base haute, plateau élevé la journée
        baseMin: 180, baseMax: 260,
        ampMin:  80,  ampMax:  130,
        courbe: [
        //   0h    1h    2h    3h    4h    5h    6h    7h    8h    9h   10h   11h
            .62,  .59,  .57,  .56,  .58,  .63,  .72,  .84,  .93,  .97,  .99, 1.00,
        //  12h   13h   14h   15h   16h   17h   18h   19h   20h   21h   22h   23h
            .97,  .94,  .96,  .97,  .98,  .96,  .91,  .86,  .81,  .77,  .71,  .66
        ]
    },
    tertiaire: {
        // Bureaux : double pic matin + après-midi, nuit quasi nulle
        baseMin: 25,  baseMax: 55,
        ampMin:  110, ampMax:  190,
        courbe: [
        //   0h    1h    2h    3h    4h    5h    6h    7h    8h    9h   10h   11h
            .05,  .04,  .04,  .04,  .05,  .09,  .20,  .54,  .86,  .96,  .99, 1.00,
        //  12h   13h   14h   15h   16h   17h   18h   19h   20h   21h   22h   23h
            .79,  .73,  .82,  .92,  .96,  .88,  .62,  .36,  .18,  .10,  .07,  .06
        ]
    },
    mixte: {
        // Intermédiaire : activité jour + pic soir modéré
        baseMin: 55,  baseMax: 95,
        ampMin:  95,  ampMax:  155,
        courbe: [
        //   0h    1h    2h    3h    4h    5h    6h    7h    8h    9h   10h   11h
            .28,  .24,  .21,  .20,  .21,  .27,  .37,  .57,  .73,  .83,  .90,  .92,
        //  12h   13h   14h   15h   16h   17h   18h   19h   20h   21h   22h   23h
            .89,  .84,  .86,  .90,  .93,  .97, 1.00,  .97,  .91,  .79,  .61,  .40
        ]
    },
    residentiel: {
        // Agrégé résidentiel : pic soir prononcé, creux journée
        baseMin: 15,  baseMax: 40,
        ampMin:  140, ampMax:  270,
        courbe: [
        //   0h    1h    2h    3h    4h    5h    6h    7h    8h    9h   10h   11h
            .18,  .14,  .11,  .10,  .11,  .16,  .28,  .58,  .65,  .54,  .44,  .42,
        //  12h   13h   14h   15h   16h   17h   18h   19h   20h   21h   22h   23h
            .44,  .41,  .41,  .47,  .57,  .77,  .96, 1.00,  .97,  .88,  .66,  .36
        ]
    }
}

const PROFIL_LIST = ['industriel', 'tertiaire', 'mixte', 'residentiel']

// ── 20 compteurs virtuels ────────────────────────────────────────────────────
// Chaque compteur reçoit un profil (cyclé), une base et une amplitude
// déterministes (pas de Math.random() pour assurer la reproductibilité).

const COMPTEURS = Array.from({ length: 20 }, (_, i) => {
    const serge    = `SIM${String(i + 1).padStart(4, '0')}`
    const profilNom = PROFIL_LIST[i % PROFIL_LIST.length]
    const profil   = PROFILS[profilNom]

    // Variance déterministe dans [0,1) sans aléatoire : hash linéaire de l'index
    const t = (i * 7 + 3) / 20
    const base = profil.baseMin + t * (profil.baseMax - profil.baseMin)
    const amp  = profil.ampMin  + t * (profil.ampMax  - profil.ampMin)

    return { serge, profilNom, profil, base: Math.round(base * 100) / 100, amp: Math.round(amp * 100) / 100 }
})

// ── Bruit déterministe ───────────────────────────────────────────────────────
// Retourne une valeur dans [0,1) pour (serge, dateIso, heure).
// Identique entre appels — garantit que genererPuissance est pure/idempotente.

function noiseDet(serge, dateIso, heureStr) {
    const s = serge + dateIso + heureStr
    let h = 5381
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i)
    return Math.abs(h % 1000) / 1000   // [0, 1)
}

// ── API principale ───────────────────────────────────────────────────────────

/**
 * Retourne une puissance en kW réaliste pour un compteur à une date/heure données.
 *
 * @param {string} serge     SIM0001 … SIM0020
 * @param {string} dateIso   YYYY-MM-DD
 * @param {string} heureStr  HH:MM:SS
 * @returns {number} puissance arrondie à 3 décimales
 */
function genererPuissance(serge, dateIso, heureStr) {
    const c = COMPTEURS.find(x => x.serge === serge)
    if (!c) return 0

    const h       = parseInt(heureStr.slice(0, 2), 10)   // 0-23
    const facteur = c.profil.courbe[h]

    // Variation journalière légère ± 4 %  (cyclique sur le numéro du jour)
    const dd  = parseInt(dateIso.slice(8, 10), 10)
    const mm  = parseInt(dateIso.slice(5, 7),  10)
    const varJ = 1 + 0.04 * Math.sin((dd + mm * 3) * 0.9)

    // Bruit ± 3 %
    const bruit = 1 + (noiseDet(serge, dateIso, heureStr) - 0.5) * 0.06

    const kw = c.base + c.amp * facteur * varJ * bruit
    return Math.max(0, Math.round(kw * 1000) / 1000)
}

module.exports = { COMPTEURS, PROFIL_LIST, genererPuissance }
