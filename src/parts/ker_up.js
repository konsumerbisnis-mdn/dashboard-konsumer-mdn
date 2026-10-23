/* ================= Keragaan: upload sheet "Database" (file Gabung KAP/DLY) tanpa Sync ================= */
// Baris dikirim ke server (action kerUpload) yang menggabungkannya ke data keragaan: tanggal yang sama diganti, tanggal lain dipertahankan.
const KER_DESC = { "briguna karya": "karya", "briguna purna": "purna", "briguna pra-purna": "prapurna", "briguna pra purna": "prapurna", "briguna pra0purna": "prapurna", "briguna mikro": "mikro", "briguna mikro d": "mikrod", "kpr": "kpr" };
function parseKerDb(wb) {
  const nm = wb.SheetNames.find(n => n.trim().toLowerCase() === "database") || wb.SheetNames.find(n => /database/i.test(n)); if (!nm) return null;
  const a = XLSX.utils.sheet_to_json(wb.Sheets[nm], { header: 1, raw: true, defval: null, blankrows: false });
  const hi = a.findIndex(r => r.some(x => String(x).trim().toLowerCase() === "uker") && r.some(x => String(x).trim().toLowerCase() === "tanggal") && r.some(x => String(x).trim().toLowerCase() === "desc")); if (hi < 0) return null;
  const H = a[hi].map(x => String(x == null ? "" : x).trim().toLowerCase()), ix = (...k) => { for (const n of k) { const i = H.indexOf(n); if (i >= 0) return i; } return -1; };
  const iU = ix("uker"), iT = ix("tanggal"), iC = ix("desc"), iDeb = ix("deb"), iOs = ix("os"), iS = ix("dpk", "sml"), iN = ix("npl"), iDs = ix("deb bpk", "deb dpk", "deb sml"), iDn = ix("deb npl");
  if ([iDeb, iOs, iS, iN].some(i => i < 0)) return null;
  const num = v => { const n = typeof v === "number" ? v : parseFloat(String(v == null ? "" : v).replace(/[^\d.\-]/g, "")); return isFinite(n) ? n : 0; };
  const rows = [], dates = {}, skip = {};
  a.slice(hi + 1).forEach(r => {
    const raw = String(r[iC] || "").trim().toLowerCase().replace(/\s+/g, " "); if (!raw) return;
    const p = KER_DESC[raw]; if (!p) { skip[raw] = 1; return; }
    let d = r[iT]; d = typeof d === "number" ? nIso(d - 25569) : /^\d{4}-\d{2}-\d{2}/.test(String(d)) ? String(d).slice(0, 10) : null; if (!d) return;
    const u = String(r[iU] == null ? "" : r[iU]).trim().replace(/\.0+$/, ""); if (!u) return;
    dates[d] = 1;
    rows.push({ p, d, u, typo: raw.indexOf("pra0") >= 0 ? 1 : 0, v: [num(r[iOs]), num(r[iS]), num(r[iN]), num(r[iDeb]), iDs >= 0 ? num(r[iDs]) : 0, iDn >= 0 ? num(r[iDn]) : 0] });
  });
  return { rows, dates: Object.keys(dates).sort(), skip: Object.keys(skip) };
}
