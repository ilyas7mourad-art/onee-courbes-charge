'use strict'

const XLSX = require('xlsx')

/**
 * Parse a CLOU .xlsx file.
 *
 * Expected layout (CLOU standard) :
 *   Row 1, col C  → numéro de série (SERGE)
 *   Row 4         → headers (used for sub-type detection)
 *   Row 5+        → data  (col B = horodatage, col D = FST/PDN, col E = valeur)
 *
 * Sub-types :
 *   instantane → col E = index cumulatif ; on calcule la différence entre
 *                deux relevés consécutifs (skip première ligne)
 *   moyen      → col E = puissance déjà calculée, on la prend directement
 *
 * @param {string} contenuBase64
 * @returns {{ sousType, serge, releves: { serge, datReleve, heuReleve, codCadran, valCadran, etatCourbe }[] }}
 */
function parseXlsx(contenuBase64) {
    const buffer = Buffer.from(contenuBase64, 'base64')
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    if (!wb.SheetNames.length) throw new Error('Aucune feuille dans le classeur XLSX')

    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws || !ws['!ref']) throw new Error('Feuille vide ou sans données')

    // ── 1. serial number (row 1, col C=index 2; fallback B=1) ────
    const serge = String(ws['C1']?.v ?? ws['B1']?.v ?? '').trim()

    // ── 2. header row (row 4 = 0-indexed row 3) ──────────────────
    const range = XLSX.utils.decode_range(ws['!ref'])
    const headers = []
    for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r: 3, c })]
        headers.push(String(cell?.v ?? '').toLowerCase())
    }

    const joined = headers.join(' ')
    const sousType = /moyen|puissance|moyenne/.test(joined) ? 'moyen' : 'instantane'

    // ── 3. data rows (row 5 = 0-indexed row 4) ───────────────────
    const rawRows = []
    for (let r = 4; r <= range.e.r; r++) {
        const cellB = ws[XLSX.utils.encode_cell({ r, c: 1 })]   // col B
        const cellD = ws[XLSX.utils.encode_cell({ r, c: 3 })]   // col D
        const cellE = ws[XLSX.utils.encode_cell({ r, c: 4 })]   // col E

        if (!cellB?.v) continue

        const ts = parseTimestamp(cellB)
        if (!ts) continue

        const etatCourbe = String(cellD?.v ?? 'FST').trim().toUpperCase()
        const rawVal = parseDecimalCell(cellE)

        rawRows.push({ ...ts, etatCourbe, rawVal })
    }

    if (!rawRows.length) throw new Error('Aucune ligne de données dans la feuille (données attendues à partir de la ligne 5)')

    // ── 4. sort and compute values ────────────────────────────────
    rawRows.sort((a, b) =>
        a.datReleve.localeCompare(b.datReleve) || a.heuReleve.localeCompare(b.heuReleve)
    )

    const releves = []
    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i]
        let valCadran

        if (sousType === 'instantane') {
            if (i === 0) continue           // no previous index to diff against
            valCadran = Math.max(0, row.rawVal - rawRows[i - 1].rawVal)
        } else {
            valCadran = row.rawVal          // puissance moyenne directe
        }

        releves.push({
            serge,
            datReleve : row.datReleve,
            heuReleve : row.heuReleve,
            codCadran : 'EA',
            valCadran,
            etatCourbe: row.etatCourbe
        })
    }

    return { sousType, serge, releves }
}

// ── helpers ───────────────────────────────────────────────────────

function parseTimestamp(cell) {
    // SheetJS with cellDates:true may give a Date object
    if (cell.t === 'd' && cell.v instanceof Date) {
        const d = cell.v
        const datReleve = d.toISOString().slice(0, 10)
        const hh = String(d.getHours()).padStart(2, '0')
        const mn = String(d.getMinutes()).padStart(2, '0')
        const ss = String(d.getSeconds()).padStart(2, '0')
        return { datReleve, heuReleve: `${hh}:${mn}:${ss}` }
    }
    // Fallback: text "DD/MM/YYYY HH:MM:SS" or "DD/MM/YYYY HH:MM"
    const s = String(cell.v ?? '').trim()
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!m) return null
    const [, dd, mo, yyyy, hh, mn, sc] = m
    return {
        datReleve : `${yyyy}-${mo.padStart(2,'0')}-${dd.padStart(2,'0')}`,
        heuReleve : `${hh.padStart(2,'0')}:${mn}:${sc ?? '00'}`
    }
}

function parseDecimalCell(cell) {
    if (!cell) return 0
    if (typeof cell.v === 'number') return cell.v
    const n = parseFloat(String(cell.v ?? '').replace(',', '.'))
    return isNaN(n) ? 0 : n
}

module.exports = { parseXlsx }
