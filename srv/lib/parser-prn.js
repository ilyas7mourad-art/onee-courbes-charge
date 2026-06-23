'use strict'

/**
 * Parse an ELSTER .prn file (tab-separated, double-quote delimited).
 *
 * ELSTER column mapping → cadrans ZCC_ :
 *   kWh-Del   → COD_CADRAN = 'EA'  (énergie active importée)
 *   kVARh-Del → COD_CADRAN = 'ER'  (énergie réactive importée)
 *
 * ⚠ MAPPING PROVISOIRE — à revoir avec le vrai fichier ELSTER ONEE.
 *   Le référentiel cadrans actuel contient PAIHP/PAIHC/PAIHPL (tranches
 *   horaires tarifaires), pas des types d'énergie (EA/ER).
 *   Deux options à trancher avec l'équipe :
 *     A) Les relevés bruts gardent un code type d'énergie (EA/ER) → le
 *        référentiel ZccCadrans doit alors inclure EA et ER.
 *     B) Les relevés bruts sont directement rattachés à la tranche horaire
 *        (PAIHP/PAIHC/PAIHPL) → ce parser doit appeler getTranche() pour
 *        déterminer le COD_CADRAN à partir de la date+heure du relevé.
 *   En attendant, le calcul Pmax (calcul-pmax.js) fonctionne correctement
 *   car il reclasse chaque relevé par tranche via getTranche(), indépendamment
 *   du COD_CADRAN stocké dans ZccCourbeChargesIndexs.
 *
 * Each raw data line produces 2 ZccCourbeChargesIndexs entries.
 *
 * @param {string} texte  — file content decoded as latin1
 * @returns {{ serge, datReleve, heuReleve, codCadran, valCadran }[]}
 */
function parsePrn(texte) {
    const lines = texte.split(/\r?\n/)
    const results = []

    // ── 1. locate header line ─────────────────────────────────────
    let headerIdx = -1
    let colMeterID = 0, colDate = 1, colTime = 2, colKwh = 3, colKvarh = 5

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i]
        if (!raw.trim()) continue
        const cols = splitTab(raw)
        if (cols.some(c => c === 'Meter ID') || cols.some(c => c === 'Date')) {
            headerIdx  = i
            const idx  = (name) => { const p = cols.findIndex(c => c === name); return p !== -1 ? p : null }
            colMeterID = idx('Meter ID')  ?? 0
            colDate    = idx('Date')      ?? 1
            colTime    = idx('Time')      ?? 2
            colKwh     = idx('kWh-Del')   ?? 3
            colKvarh   = idx('kVARh-Del') ?? 5
            break
        }
    }

    if (headerIdx === -1) {
        throw new Error('En-tête non trouvé (colonne "Meter ID" ou "Date" introuvable)')
    }

    // ── 2. parse data lines ───────────────────────────────────────
    for (let i = headerIdx + 1; i < lines.length; i++) {
        const raw = lines[i]
        if (!raw.trim()) continue

        const cols     = splitTab(raw)
        const firstCol = cols[0] ?? ''

        // skip Units row
        if (firstCol === '' || firstCol.startsWith('Units:')) continue

        const serge   = cols[colMeterID] ?? ''
        const dateStr = cols[colDate]    ?? ''
        const timeStr = cols[colTime]    ?? ''
        const kwhStr  = cols[colKwh]     ?? ''
        const kvarhStr= cols[colKvarh]   ?? ''

        if (!serge || !dateStr || !timeStr) continue

        const datReleve = parseDate(dateStr)
        const heuReleve = parseTime(timeStr)
        if (!datReleve || !heuReleve) continue

        const valKwh   = parseDecimal(kwhStr)
        const valKvarh = parseDecimal(kvarhStr)

        if (valKwh !== null) {
            results.push({ serge, datReleve, heuReleve, codCadran: 'EA', valCadran: valKwh })
        }
        if (valKvarh !== null) {
            results.push({ serge, datReleve, heuReleve, codCadran: 'ER', valCadran: valKvarh })
        }
    }

    return results
}

// ── helpers ───────────────────────────────────────────────────────

function splitTab(line) {
    return line.split('\t').map(f => f.replace(/^"|"$/g, '').trim())
}

function parseDate(s) {
    // JJ/MM/AA or JJ/MM/AAAA
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
    if (!m) return null
    let [, dd, mm, yy] = m
    if (yy.length === 2) yy = String(2000 + parseInt(yy, 10))
    return `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

function parseTime(s) {
    // HH:MM  or  HH:MM:SS
    const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
    if (!m) return null
    return `${m[1].padStart(2, '0')}:${m[2]}:${m[3] ?? '00'}`
}

function parseDecimal(s) {
    if (!s) return null
    const n = parseFloat(s.replace(',', '.'))
    return isNaN(n) ? null : n
}

module.exports = { parsePrn }
