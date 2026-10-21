/* ================= NOMINATIF PORTOFOLIO & KUALITAS KREDIT (LW321 per debitur) ================= */
// DB.lw (set aktif) = { asof (hari), n, kolom per rekening (array sejajar), rmN[], uk{kode:{n,k}}, prev:{asof,key[],kol[],os[],nama[],cif[],kk[],ku[],pr[],rm[],rmN[]} }
const PRN = ["Karya", "Purna", "Pra-Purna", "Mikro", "Lainnya", "KPR Subsidi", "KPR Komersil"];
const prodLbl = p => /^KPR/.test(p) ? p : p === "Lainnya" ? "Lainnya" : "Briguna " + p;
const segOfPr = pr => pr === 3 ? "Mikro" : pr >= 5 ? "KPR" : "Ritel";
const dayN = v => { const d = dateX(v); return d ? Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 864e5) : null; };
const nIso = n => n == null ? null : new Date(n * 864e5).toISOString().slice(0, 10);
const nS = n => n == null ? "–" : tglS(nIso(n));
const nSS = n => n == null ? "–" : tglS(nIso(n)).replace(/ \d\d(\d\d)$/, "'$1");
const todayN = () => { const d = new Date(); return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const normRek = s => String(s ?? "").replace(/\D/g, "").replace(/^0+/, "");

/* ---------- baca file LW321 (admin upload) → baris sesuai kolom sheet LW321 di Apps Script ---------- */
// Briguna (B): Karya, Purna, Pra-Purna (termasuk Umum), Mikro. KPR (K): deskripsi KPR / Kredit Pemilikan Rumah; Subsidi bila FLPP/Sejahtera/Subsidi atau plafon ≤ Rp185 juta.
const prodCodeOf = (desc, pl, set, hasDesc = true) => {
  const d = String(desc || "").toUpperCase(), isKpr = /\bKPR\b|PEMILIKAN RUMAH/.test(d);
  if (!d && hasDesc) return -1; // baris tanpa deskripsi (subtotal / produk lain) diabaikan
  if (set === "K") return !d ? 6 : isKpr ? (/FLPP|SEJAHTERA|SUBSIDI|KPRS/.test(d) || (pl > 0 && pl <= 185e6) ? 5 : 6) : -1;
  if (isKpr) return -1;
  if (d.includes("MIKRO")) return 3; if (/PRA[\s-]?PURNA|UMUM/.test(d)) return 2; if (/PURNA|KRESUN/.test(d)) return 1; if (/KARYA|KRETAP/.test(d)) return 0;
  return !d || /BRIGUNA/.test(d) ? 4 : -1;
};
// nama RM dari "00401002 - Akbaruddinsyah Daulay": buang angka & simbol di 11 karakter pertama (ketentuan bagian 3 no. 9)
const rmClean = s => { s = String(s ?? ""); if (!s.trim() || /^\s*-\s*$/.test(s)) return { pn: "", nm: "(Tanpa RM)" };
  const pn = (s.match(/^\s*(\d+)/) || [])[1] || ""; const nm = (s.slice(0, 11).replace(/[^A-Za-z]/g, "") + s.slice(11)).trim().replace(/\s+/g, " "); return { pn, nm: nm || "(Tanpa RM)" }; };
const rmTitle = s => s === s.toUpperCase() ? titleCase(s) : s;
function parseLWUpload(wb, set) {
  const nk = k => normKey(k ?? ""), want = ["nomor_rekening", "kol_adk"], sheets = [];
  for (const n of wb.SheetNames) { const a = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null, blankrows: false });
    for (let h = 0; h < Math.min(25, a.length); h++) { const hd = (a[h] || []).map(nk); if (want.every(k => hd.includes(k))) { sheets.push({ n, rows: a.slice(h + 1), hd }); break; } } }
  if (!sheets.length) throw new Error("Kolom NOMOR_REKENING dan KOL_ADK tidak ditemukan. Pastikan file adalah LW321 atau data debitur.");
  sheets.sort((a, b) => b.rows.length - a.rows.length);
  const num = v => { if (typeof v === "number") return v; const s = String(v ?? "").replace(/[^\d,.\-]/g, ""); if (!s || s === "-") return 0; return parseFloat(/,\d{1,2}$/.test(s) && s.includes(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")) || 0; };
  const iso8 = v => { if (v == null || v === "") return ""; if (typeof v === "number" && v > 19000000 && v < 30000000) { const s = String(v); return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`; } return dateX(v) || ""; };
  const rows = [], seen = new Set(); let asof = "", dropped = 0;
  for (const s of sheets) {
    const c = (...ks) => { for (const k of ks) { const i = s.hd.indexOf(k); if (i >= 0) return i; } return -1; };
    const C = { per: c("periode"), kk: c("kode_kanca", "kode_cabang"), ku: c("kode_uker", "branch"), un: c("uker", "unit"), rek: c("nomor_rekening"), nama: c("nama_debitur"),
      pl: c("plafon_dalam_idr", "plafon"), nx: c("next_pmt_date", "tgl_next_pmt"), rate: c("rate"), rl: c("tgl_realisasi"), jt: c("tgl_jatuh_tempo"), jw: c("jangka_waktu"), rs: c("flag_restruk"),
      cif: c("cifno", "cif"), tp: c("tunggakan_pokok"), tb: c("tunggakan_bunga"), tpn: c("tunggakan_pinalti", "tunggakan_penalti"), desc: c("description"), kol: c("kol_adk"),
      rm: c("pn_pengelola_singlepn", "pn_pengelola_1", "pn_pengelola1", "rm_pengelola"), os: c("balance_dalam_idr", "os_idr", "baki_debet") };
    // tanpa kolom saldo: OS = jumlah kolom KOLEKTIBILITAS LANCAR s.d. MACET (format LW321 lengkap)
    const KOLC = ["kolektibilitas_lancar", "kolektibilitas_dpk", "kolektibilitas_kurang_lancar", "kolektibilitas_diragukan", "kolektibilitas_macet"].map(k => s.hd.indexOf(k)).filter(i => i >= 0);
    if (C.os < 0 && !KOLC.length) continue;
    const g = (r, i) => i < 0 ? null : r[i], osOf = r => C.os >= 0 ? num(g(r, C.os)) : KOLC.reduce((a, i) => a + num(r[i]), 0);
    s.rows.forEach(r => {
      const rek = String(g(r, C.rek) ?? "").trim(), key = normRek(rek); if (!key || seen.has(key)) return;
      const pl = Math.round(num(g(r, C.pl))), pr = prodCodeOf(g(r, C.desc), pl, set, C.desc >= 0); if (pr < 0) { dropped++; return; } seen.add(key);
      const per = iso8(g(r, C.per)); if (per > asof) asof = per;
      let rate = num(g(r, C.rate)); if (rate > 0 && rate < 1) rate = Math.round(rate * 10000) / 100;
      const R = rmClean(g(r, C.rm));
      rows.push([per, rek, String(g(r, C.nama) ?? "").trim(), String(g(r, C.cif) ?? "").trim().toUpperCase(), String(g(r, C.kk) ?? "").trim(), String(g(r, C.ku) ?? "").trim(), String(g(r, C.un) ?? "").trim(),
        pl, Math.round(osOf(r)), rate, iso8(g(r, C.nx)), iso8(g(r, C.rl)), iso8(g(r, C.jt)), parseInt(String(g(r, C.jw) ?? "")) || 0,
        String(g(r, C.rs) ?? "").trim().toUpperCase() === "Y" ? "Y" : "N", Math.round(num(g(r, C.tp))), Math.round(num(g(r, C.tb))), Math.round(num(g(r, C.tpn))), Math.max(1, Math.min(5, parseInt(g(r, C.kol)) || 1)),
        PRN[pr], rmTitle(R.nm), R.pn]);
    });
  }
  if (!rows.length) throw new Error(set === "K" ? "Tidak ada rekening KPR di file ini." : "Tidak ada rekening Briguna di file ini.");
  rows.forEach(r => { if (!r[0]) r[0] = asof; });
  return { rows, asof, sheets: sheets.map(s => s.n), dropped };
}

/* ---------- turunan: kualitas, kriteria kredit, one obligor (ketentuan 02) ---------- */
let LWR = [], LWK = new Map(), LWCIF = new Map(), LWPK = new Map(), LWPCIF = new Map();
function useLW(set) { SEG.lw = set === "K" ? "K" : "B"; DB.lw = DB.lwSets[SEG.lw] || null; prepLW(); }
function prepLW() {
  LWR = []; LWK = new Map(); LWCIF = new Map(); LWPK = new Map(); LWPCIF = new Map();
  const L = DB.lw; if (!L || !L.rek || !L.n) return;
  const per = L.asof;
  for (let i = 0; i < L.n; i++) {
    const kk = L.kk[i], ku = L.ku[i], pr = L.pr[i], seg = segOfPr(pr), mik = seg === "Mikro";
    const r = { i, rek: L.rek[i], key: normRek(L.rek[i]), nama: L.nama[i], cif: L.cif[i], kk, kc: kcName(kk), area: kcAreaOf(kk), ku, uker: mik ? titleCase((L.uk[ku] || {}).n || "Unit " + ku) : kcName(kk),
      pl: L.pl[i], os: L.os[i], rate: L.rate[i], nx: L.nx[i], rl: L.rl[i], jt: L.jt[i], jw: L.jw[i], restr: !!L.rs[i], tp: L.tp[i], tb: L.tb[i], tpn: L.tpn[i], kol: L.kol[i], pr, prod: PRN[pr] || "Lainnya", seg,
      rm: L.rmN[L.rm[i]] || "(Tanpa RM)", pn: (L.pn || [])[i] || "" };
    r.tgk = r.tp + r.tb + r.tpn; r.umur = r.nx != null && per != null ? per - r.nx : null; r.umurPinj = r.rl != null && per != null ? per - r.rl : null;
    r.kq = r.kol === 1 ? "Lancar" : r.kol === 2 ? "SML" : "NPL";
    const aligned = r.umur != null && (r.kol === 2 ? r.umur >= 0 && r.umur <= 89 : r.umur >= 90);
    r.oo = r.kol >= 2 && (r.tgk === 0 || !aligned);
    r.krit = r.kol === 1 ? "Lancar" : r.oo ? (r.kol === 2 ? "One Obligor SML" : "One Obligor NPL") : r.kol === 2 ? (r.umur < 30 ? "SML 1" : r.umur <= 60 ? "SML 2" : "SML 3")
      : r.umur <= 119 ? "NPL Baru" : (r.umurPinj != null && r.umurPinj < 730 ? "NPL Dibawah 2 Tahun" : "NPL");
    r.npl90 = r.kol === 2 && !r.oo && r.nx != null ? r.nx + 90 : null;
    LWR.push(r); LWK.set(r.key, r); if (!LWCIF.has(r.cif)) LWCIF.set(r.cif, []); LWCIF.get(r.cif).push(r);
  }
  const P = L.prev;
  if (P && P.key) P.key.forEach((k, j) => { const o = { key: k, kol: P.kol[j], os: P.os[j], nama: P.nama[j], cif: P.cif[j], kk: P.kk[j], ku: P.ku[j], pr: P.pr[j], rm: (P.rmN || [])[P.rm[j]] || "(Tanpa RM)" };
    LWPK.set(k, o); if (!LWPCIF.has(o.cif)) LWPCIF.set(o.cif, []); LWPCIF.get(o.cif).push(o); });
  LWR.forEach(r => { r.ooCause = null; r.prevKol = LWPK.has(r.key) ? LWPK.get(r.key).kol : null; if (!r.oo) return;
    const oth = (LWCIF.get(r.cif) || []).some(x => x !== r && x.kol >= 2 && x.tgk > 0) || (LWPCIF.get(r.cif) || []).some(x => x.key !== r.key && x.kol >= 2);
    r.ooCause = oth ? "Pinjaman lain" : "Tidak teridentifikasi"; });
}

/* ---------- state tampilan ---------- */
const NS = Object.assign({ sub: "ringkasan", subQ: "gerak", seg: "ALL", area: "ALL", kc: "ALL", uk: "ALL", rm: "ALL", pr: "ALL", f: {}, q: {}, ews: "akanNPL", pel: "suplesi", gerak: "dgLS",
  set: { supMin: 12, supMax: 70, supTenor: 12, lunasBln: 6, dueDays: 7 } }, lsGet(STORE + "-nom") || {});
NS.f = NS.f || {}; NS.q = {};
const saveNS = () => lsSet(STORE + "-nom", { ...NS, q: {} });
const NOTES = lsGet(STORE + "-notes") || {};
const saveNotes = () => lsSet(STORE + "-notes", NOTES);
const inPr = (pr, seg) => (NS.seg === "ALL" || segOfPr(pr) === NS.seg) && (NS.pr === "ALL" || PRN[pr] === NS.pr);
function portRows() {
  return LWR.filter(r => (NS.seg === "ALL" || r.seg === NS.seg) && (NS.area === "ALL" || r.area === NS.area) && (NS.kc === "ALL" || String(r.kk) === NS.kc)
    && (NS.uk === "ALL" || String(r.ku) === NS.uk) && (NS.rm === "ALL" || r.rm === NS.rm) && (NS.pr === "ALL" || r.prod === NS.pr));
}
function portPrev() {
  if (!DB.lw || !DB.lw.prev) return [];
  return [...LWPK.values()].filter(o => inPr(o.pr) && (NS.area === "ALL" || kcAreaOf(o.kk) === NS.area) && (NS.kc === "ALL" || String(o.kk) === NS.kc) && (NS.uk === "ALL" || String(o.ku) === NS.uk)
    && (NS.rm === "ALL" || o.rm === NS.rm));
}
const fJ = v => rpJ((v || 0) / 1e6), fJt = v => nf1.format((v || 0) / 1e6);
const kritCls = k => k === "Lancar" ? "good" : k.startsWith("One") ? "neutral" : k.startsWith("SML") ? "warn" : "crit";
const kolChip = k => `<span class="kolb k${k}">${k}</span>`;
function lwSummary() {
  if (!DB.lw || !LWR.length) return null;
  const A = LWR, T = todayN(), os = sum(A, "os"), sml = A.filter(r => r.kol === 2), npl = A.filter(r => r.kol >= 3);
  return { n: A.length, os, sml: sum(sml, "os"), npl: sum(npl, "os"), nS: sml.length, nN: npl.length, akan: A.filter(r => r.npl90 != null && r.npl90 <= T + 30) };
}

/* ---------- EWS & peluang ---------- */
function ewsDefs() { const T = todayN(), st = NS.set; return [
  { id: "akanNPL", sev: "crit", t: "SML akan tembus NPL ≤30 hari", d: "Tunggakan riil SML. Tanggal tembus 90 hari dihitung dari jatuh tempo angsuran tertunggak, bila belum ada pembayaran setelah posisi data.",
    f: r => r.npl90 != null && r.npl90 <= T + 30, m: r => r.npl90 < T ? "lewat " + nSS(r.npl90) : (r.npl90 - T) + " hari lagi", sort: (a, b) => a.npl90 - b.npl90, ml: "Tembus 90 hari" },
  { id: "sml1", sev: "warn", t: "SML 1 · baru menunggak", d: "Tunggakan 0–29 hari per posisi data. Paling mudah ditagih sebelum naik ke SML 2.", f: r => r.krit === "SML 1", m: r => r.umur + " hari", sort: (a, b) => b.os - a.os, ml: "Umur tgk" },
  { id: "nplBaru", sev: "crit", t: "NPL Baru (90–119 hari)", d: "Baru masuk NPL. Peluang UG ke SML/Lancar masih terbuka bila tunggakan dibayar.", f: r => r.krit === "NPL Baru", m: r => r.umur + " hari", sort: (a, b) => b.os - a.os, ml: "Umur tgk" },
  { id: "oo", sev: "neutral", t: "One obligor", d: "Kolektibilitas CIF turun bukan karena tunggakan rekening ini: pinjaman lain atau belum teridentifikasi.", f: r => r.oo, m: r => r.ooCause, sort: (a, b) => b.os - a.os, ml: "Penyebab" },
  { id: "due", sev: "warn", t: "Angsuran jatuh tempo ≤" + st.dueDays + " hari", d: "Rekening Lancar dengan jadwal angsuran setelah posisi data s.d. " + st.dueDays + " hari dari hari ini. Pastikan sudah terdebet.",
    f: r => r.kol === 1 && r.nx != null && r.nx > DB.lw.asof && r.nx <= T + st.dueDays, m: r => (r.nx < T ? "lewat " : "") + nSS(r.nx), sort: (a, b) => a.nx - b.nx, ml: "Jatuh tempo" },
  { id: "muda", sev: "crit", t: "Kredit muda bermasalah (<12 bln)", d: "SML/NPL dengan umur pinjaman di bawah 12 bulan. Indikasi kualitas akuisisi.", f: r => r.kol >= 2 && r.umurPinj != null && r.umurPinj < 365, m: r => Math.round(r.umurPinj / 30.4) + " bln", sort: (a, b) => a.umurPinj - b.umurPinj, ml: "Umur pinjaman" },
  { id: "restr", sev: "warn", t: "Rekening restrukturisasi", d: "Flag restruk = Y. Pantau pembayaran pasca-restruk.", f: r => r.restr, m: r => "Kol " + r.kol, sort: (a, b) => b.kol - a.kol || b.os - a.os, ml: "Kol" },
  { id: "dg", sev: "crit", t: "Turun kolek vs bulan lalu", d: "Kolektibilitas memburuk dibanding posisi LW321 bulan lalu.", need: 1, f: r => r.prevKol != null && r.kol > r.prevKol, m: r => "Kol " + r.prevKol + " → " + r.kol, sort: (a, b) => b.os - a.os, ml: "Pergerakan" },
  { id: "recov", sev: "neutral", t: "Baru membaik dari SML/NPL", d: "Bulan lalu SML/NPL, kini Lancar. Risiko kembali menunggak.", need: 1, f: r => r.prevKol != null && r.prevKol >= 2 && r.kol === 1, m: r => "Kol " + r.prevKol + " → 1", sort: (a, b) => b.os - a.os, ml: "Pergerakan" },
  { id: "janji", sev: "warn", t: "Janji bayar jatuh tempo", d: "Catatan tindak lanjut dengan tanggal janji hari ini atau sudah lewat, status belum \"Sudah bayar\".",
    f: r => { const n = NOTES[r.key]; return n && n.janji && dayN(n.janji) <= T && n.status !== "Sudah bayar"; }, m: r => "janji " + nSS(dayN(NOTES[r.key].janji)), sort: (a, b) => dayN(NOTES[a.key].janji) - dayN(NOTES[b.key].janji), ml: "Janji bayar" }
]; }
function pelDefs() { const st = NS.set, per = DB.lw.asof; return [
  { id: "suplesi", sev: "good", t: "Kandidat suplesi / top-up", d: `Lancar tanpa tunggakan, berjalan ≥${st.supMin} bln, OS ≤${st.supMax}% plafon, sisa tenor ≥${st.supTenor} bln, dan CIF tidak punya rekening SML/NPL. Diurutkan dari ruang plafon terbesar.`,
    f: r => r.kol === 1 && r.tgk === 0 && r.pl > 0 && r.umurPinj != null && r.umurPinj >= st.supMin * 30.4 && r.os / r.pl <= st.supMax / 100 && r.jt != null && (r.jt - per) >= st.supTenor * 30.4 && !(LWCIF.get(r.cif) || []).some(x => x.kol >= 2),
    m: r => fJ(r.pl - r.os), sort: (a, b) => (b.pl - b.os) - (a.pl - a.os), ml: "Ruang plafon" },
  { id: "lunas", sev: "neutral", t: `Segera lunas (≤${st.lunasBln} bln)`, d: "Kredit Lancar yang akan jatuh tempo. Tawarkan pinjaman baru agar OS tidak run-off.", f: r => r.kol === 1 && r.jt != null && r.jt >= per && r.jt <= per + st.lunasBln * 30.4, m: r => nSS(r.jt), sort: (a, b) => a.jt - b.jt, ml: "Jatuh tempo kredit" },
  { id: "baru", sev: "good", t: "Realisasi bulan posisi", d: "Rekening yang direalisasikan pada bulan posisi data.", f: r => r.rl != null && nIso(r.rl).slice(0, 7) === nIso(per).slice(0, 7), m: r => nSS(r.rl), sort: (a, b) => b.rl - a.rl, ml: "Realisasi" },
  { id: "besar", sev: "neutral", t: "Debitur prioritas (OS terbesar)", d: "50 rekening Lancar dengan OS terbesar. Jaga relasi, tawarkan produk lain.", f: r => r.kol === 1, m: r => prodLbl(r.prod), sort: (a, b) => b.os - a.os, limit: 50, ml: "Produk" }
]; }

/* ---------- komponen ---------- */
const PEXP = {};
function debTable(el, rows, opt = {}) {
  const id = opt.id || "x"; PEXP[id] = rows;
  const cols = [
    { key: "nama", label: "Debitur", fmt: (x, r) => `<button class="linkish" data-deb="${esc(r.key)}">${esc(x)}</button><br><small class="note num">${esc(r.rek)} · ${esc(r.cif)}</small>` },
    { key: "uker", label: "Kanca / Unit", fmt: (x, r) => `${esc(r.kc)}${r.seg === "Mikro" ? `<br><small class="note">${esc(x)}</small>` : ""}` },
    ...(NS.rm === "ALL" ? [{ key: "rm", label: "RM", fmt: x => esc(x) }] : []),
    { key: "prod", label: "Produk", fmt: x => esc(prodLbl(x)) },
    { key: "kol", label: "Kol", r: 1, fmt: k => kolChip(k) },
    { key: "krit", label: "Kriteria", fmt: k => chip(esc(k), kritCls(k)) },
    { key: "os", label: "OS (Jt)", r: 1, fmt: x => `<b>${fJt(x)}</b>` },
    { key: "tgk", label: "Tunggakan (Jt)", r: 1, fmt: x => x ? fJt(x) : "–" },
    { key: "umur", label: "Umur tgk", r: 1, sortVal: r => r.umur ?? -1e9, fmt: x => x == null ? "–" : x < 0 ? `<span class="note">${x}</span>` : x + " hr" },
    ...(opt.m ? [{ key: "_m", label: opt.ml || "Info", r: 1, nosort: 1, fmt: (x, r) => esc(opt.m(r)) }] : []),
    { key: "_n", label: "RTL", nosort: 1, fmt: (x, r) => { const n = NOTES[r.key]; return n && n.status ? chip(esc(n.status), n.status === "Sudah bayar" ? "good" : "neutral") : ""; } }];
  table(el, cols, rows, { state: opt.state || (opt.sort ? { key: null } : { key: "os", dir: -1 }), page: 25, after: t => t.querySelectorAll("[data-deb]").forEach(b => b.onclick = () => openDeb(b.dataset.deb)) });
}
function nomRows(L) { return L.map(r => ({ kk: r.kk, kc: r.kc, uker: r.seg === "Mikro" ? r.uker : "", rek: "'" + r.rek, nama: r.nama, cif: r.cif, kol: r.kol, prod: prodLbl(r.prod), rm: r.rm,
  umur: r.umur, os: r.os, tgk: r.tgk, kq: r.kq, krit: r.krit, oo: r.oo ? r.ooCause : "", pl: r.pl, rl: nIso(r.rl), jt: nIso(r.jt), nx: nIso(r.nx), st: (NOTES[r.key] || {}).status || "", janji: (NOTES[r.key] || {}).janji || "" })); }
const NOM_COLS = [["kk", "Kode Kanca"], ["kc", "Kanca"], ["uker", "Uker"], ["rek", "Nomor Rekening"], ["nama", "Nama Debitur"], ["cif", "CIF"], ["kol", "Kolek"], ["prod", "Produk"], ["rm", "RM Pengelola"],
  ["umur", "Umur Tunggakan"], ["os", "Baki Debet"], ["tgk", "Total Tunggakan"], ["kq", "Kualitas Kredit"], ["krit", "Kriteria Kredit"], ["oo", "Penyebab One Obligor"], ["pl", "Plafon"], ["rl", "Tgl Realisasi"], ["jt", "Tgl Jatuh Tempo"], ["nx", "Next Pmt Date"], ["st", "Status RTL"], ["janji", "Tgl Janji"]];
const expBtn = id => `<button class="btn" type="button" data-pexp="${id}">Ekspor CSV</button>`;
function bindExp(v) { v.querySelectorAll("[data-pexp]").forEach(b => b.onclick = () => { const L = PEXP[b.dataset.pexp] || []; if (!L.length) { toast("Tidak ada data untuk diekspor."); return; }
  exportCSV("nominatif-" + (SEG.lw === "K" ? "kpr" : "briguna") + "-" + b.dataset.pexp + "-" + nIso(DB.lw.asof) + (NS.rm !== "ALL" ? "-" + NS.rm.replace(/\W+/g, "_") : ""), NOM_COLS, nomRows(L)); }); }
function kolBar(A) { const t = sum(A, "os") || 1, by = [1, 2, 3, 4, 5].map(k => sum(A.filter(r => r.kol === k), "os")), nb = [1, 2, 3, 4, 5].map(k => A.filter(r => r.kol === k).length);
  return `<div class="stackbar" role="img" aria-label="Komposisi OS per kolektibilitas">${by.map((v, i) => v ? `<i style="width:${v / t * 100}%;background:var(--kol${i + 1})"></i>` : "").join("")}</div>
  <div class="kol-list">${by.map((v, i) => `<div class="kol-row"><span class="sw" style="background:var(--kol${i + 1})"></span><span>Kol ${i + 1} · ${["Lancar", "DPK / SML", "Kurang lancar", "Diragukan", "Macet"][i]}</span><span class="num">${fJ(v)} <small class="note">${nf0.format(nb[i])} rek</small></span><span class="num pc">${pct(v / t, 2)}</span></div>`).join("")}</div>`; }
function grpTable(el, A, keyFn, label, opt = {}) {
  const g = new Map(); A.forEach(r => { const k = keyFn(r); if (!g.has(k)) g.set(k, []); g.get(k).push(r); });
  const T = sum(A, "os");
  const rows = [...g].map(([k, a]) => { const os = sum(a, "os"), s = sum(a.filter(r => r.kol === 2), "os"), n = sum(a.filter(r => r.kol >= 3), "os");
    return { k, n: a.length, cif: new Set(a.map(r => r.cif)).size, os, sml: s, npl: n, psml: os ? s / os : 0, pnpl: os ? n / os : 0, sh: T ? os / T : 0 }; });
  const S = sum(rows, "sml"), N = sum(rows, "npl");
  table(el, [{ key: "k", label, fmt: x => opt.link ? `<button class="linkish" data-${opt.link}="${esc(x)}">${esc(x)}</button>` : esc(x) }, { key: "n", label: "Rek", r: 1, fmt: x => nf0.format(x) }, { key: "cif", label: "Deb (CIF)", r: 1, fmt: x => nf0.format(x) },
    { key: "os", label: "OS (Jt)", r: 1, fmt: x => `<b>${fJt(x)}</b>` }, { key: "sh", label: "Porsi", r: 1, fmt: x => pct(x, 1) },
    { key: "sml", label: "SML (Jt)", r: 1, fmt: x => x ? fJt(x) : "–" }, { key: "psml", label: "% SML", r: 1, fmt: x => chip(pct(x, 2), x <= .015 ? "good" : x <= .03 ? "warn" : "crit") },
    { key: "npl", label: "NPL (Jt)", r: 1, fmt: x => x ? fJt(x) : "–" }, { key: "pnpl", label: "% NPL", r: 1, fmt: x => chip(pct(x, 2), nplCls(x)) }], rows,
    { sortKey: opt.sortKey || "os", page: opt.page, foot: rows.length > 1 ? { k: "Total", n: nf0.format(A.length), cif: nf0.format(new Set(A.map(r => r.cif)).size), os: `<b>${fJt(T)}</b>`, sh: "100%", sml: fJt(S), psml: pct(T ? S / T : 0, 2), npl: fJt(N), pnpl: pct(T ? N / T : 0, 2) } : null,
      after: opt.after });
}

/* ---------- kerangka bersama: pilihan segmen + filter + tab ---------- */
const NSUB = [["ringkasan", "Ringkasan"], ["debitur", "Semua debitur"], ["ews", "EWS"], ["peluang", "Peluang"], ["rtl", "Tindak lanjut"]];
const QSUB = [["gerak", "DG / UG"], ["sml", "SML"], ["npl", "NPL"]];
function segBar(cur, opts, attr) { return `<div class="rm-mode segbar" role="group" aria-label="Segmen">${opts.map(([k, l]) => `<button type="button" ${attr}="${k}" aria-pressed="${cur === k}">${esc(l)}</button>`).join("")}</div>`; }
function nomHead(v, menu) {
  const isQ = menu === "kualitas", SUBS = isQ ? QSUB : NSUB, subKey = isQ ? "subQ" : "sub";
  const L = DB.lw, segs = [["B", "Briguna Ritel & Mikro"], ["K", "KPR"]];
  const head = `<section class="panel" style="padding:12px 16px">${segBar(SEG.lw, segs, "data-lwseg")}<div class="toolbar" id="nFlt"></div><p class="note" style="margin:0" id="nScope"></p></section>`;
  const bindSeg = () => v.querySelectorAll("[data-lwseg]").forEach(b => b.onclick = () => { if (SEG.lw === b.dataset.lwseg) return; useLW(b.dataset.lwseg); saveSEG(); NS.seg = "ALL"; NS.pr = "ALL"; NS.uk = "ALL"; NS.rm = "ALL"; saveNS(); render(); });
  if (!L) {
    v.innerHTML = head + `<section class="panel"><div class="empty">${LOADING.lw ? "Memuat data LW321…" : `<p style="font-weight:700;margin:0 0 6px">Belum ada data LW321 ${esc(LWL[SEG.lw].seg)}</p>${isAdmin() ? "Upload file LW321 lewat menu Admin → Kelola data." : "Hubungi admin untuk upload LW321."}`}</div></section>`;
    $("#nFlt").remove(); $("#nScope").remove(); bindSeg(); return null;
  }
  // pilihan filter mengikuti filter di atasnya
  const isB = SEG.lw === "B";
  if (!isB) NS.seg = "ALL";
  const base0 = LWR.filter(r => NS.seg === "ALL" || r.seg === NS.seg);
  const areas = uniq(base0.map(r => r.area)).sort(); if (NS.area !== "ALL" && !areas.includes(NS.area)) NS.area = "ALL";
  const base1 = base0.filter(r => NS.area === "ALL" || r.area === NS.area);
  const kcs = uniq(base1.map(r => String(r.kk))).sort((a, b) => kcName(a).localeCompare(kcName(b))); if (NS.kc !== "ALL" && !kcs.includes(NS.kc)) NS.kc = "ALL";
  const base2 = base1.filter(r => NS.kc === "ALL" || String(r.kk) === NS.kc);
  const uks = uniq(base2.filter(r => r.seg === "Mikro").map(r => String(r.ku))); if (NS.uk !== "ALL" && !uks.includes(NS.uk)) NS.uk = "ALL";
  const base3 = base2.filter(r => NS.uk === "ALL" || String(r.ku) === NS.uk);
  const rmCnt = {}; base3.forEach(r => rmCnt[r.rm] = (rmCnt[r.rm] || 0) + 1); const rms = Object.keys(rmCnt).sort((a, b) => a.localeCompare(b));
  if (NS.rm !== "ALL" && !rms.includes(NS.rm)) NS.rm = "ALL";
  const prs = PRN.filter(p => base3.some(r => r.prod === p)); if (NS.pr !== "ALL" && !prs.includes(NS.pr)) NS.pr = "ALL";
  const A = portRows(), T = todayN();
  const scope = NS.rm !== "ALL" ? esc(NS.rm) : NS.uk !== "ALL" ? esc(titleCase((L.uk[NS.uk] || {}).n || NS.uk)) : NS.kc !== "ALL" ? esc(kcName(NS.kc)) : NS.area !== "ALL" ? esc(areaS(NS.area)) : "Seluruh KC";
  const cnt = isQ ? { gerak: L.prev ? A.filter(r => r.prevKol != null && r.kol !== r.prevKol).length : 0, sml: A.filter(r => r.kol === 2).length, npl: A.filter(r => r.kol >= 3).length }
    : { ews: A.filter(r => r.npl90 != null && r.npl90 <= T + 30).length, rtl: A.filter(r => NOTES[r.key]).length };
  v.innerHTML = head + `<nav class="ptabs" role="tablist" aria-label="Bagian">${SUBS.map(([k, l]) => `<button type="button" role="tab" data-ps="${k}" aria-selected="${NS[subKey] === k}">${l}${cnt[k] ? ` <span class="pc ${k === "npl" || k === "ews" ? "crit" : k === "sml" || k === "gerak" ? "warn" : ""}">${nf0.format(cnt[k])}</span>` : ""}</button>`).join("")}</nav>
    <div id="pBody" class="grid"></div>`;
  $("#nFlt").innerHTML = `
    ${isB ? `<label class="field" style="flex:1 1 120px"><span class="note" style="font-weight:700">Segmen</span><select class="ctl" id="pSeg">${[["ALL", "Ritel + Mikro"], ["Ritel", "Ritel"], ["Mikro", "Mikro"]].map(([k, l]) => `<option value="${k}" ${NS.seg === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}
    <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Area</span><select class="ctl" id="pAr"><option value="ALL">Semua area</option>${areas.map(a => `<option value="${esc(a)}" ${a === NS.area ? "selected" : ""}>${esc(areaS(a))}</option>`).join("")}</select></label>
    <label class="field" style="flex:1 1 180px"><span class="note" style="font-weight:700">Kantor Cabang</span><select class="ctl" id="pKc"><option value="ALL">Semua KC</option>${kcs.map(k => `<option value="${k}" ${k === NS.kc ? "selected" : ""}>${esc(kcName(k))}</option>`).join("")}</select></label>
    ${uks.length > 1 || NS.uk !== "ALL" ? `<label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Unit (Mikro)</span><select class="ctl" id="pUk"><option value="ALL">Semua unit</option>${uks.map(k => `<option value="${k}" ${k === NS.uk ? "selected" : ""}>${esc(titleCase((L.uk[k] || {}).n || k))}</option>`).join("")}</select></label>` : ""}
    <label class="field" style="flex:2 1 200px"><span class="note" style="font-weight:700">RM / Mantri pengelola</span><select class="ctl" id="pRm"><option value="ALL">Semua (${rms.length})</option>${rms.map(n => `<option ${n === NS.rm ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
    <label class="field" style="flex:1 1 130px"><span class="note" style="font-weight:700">Produk</span><select class="ctl" id="pPr"><option value="ALL">Semua</option>${prs.map(p => `<option value="${esc(p)}" ${p === NS.pr ? "selected" : ""}>${esc(prodLbl(p))}</option>`).join("")}</select></label>`;
  $("#nScope").innerHTML = `${scope} · LW321 ${esc(LWL[SEG.lw].seg)} posisi ${nS(L.asof)}${L.prev ? " · pembanding " + nS(L.prev.asof) : ""} · ${nf0.format(A.length)} rekening${L.scoped ? " kelolaan Anda" : ""} · kartu dalam Rp, tabel dalam Rp juta`;
  const go = () => { saveNS(); render(); };
  if ($("#pSeg")) $("#pSeg").onchange = e => { NS.seg = e.target.value; NS.uk = "ALL"; go(); };
  $("#pAr").onchange = e => { NS.area = e.target.value; NS.kc = "ALL"; NS.uk = "ALL"; go(); };
  $("#pKc").onchange = e => { NS.kc = e.target.value; NS.uk = "ALL"; go(); };
  if ($("#pUk")) $("#pUk").onchange = e => { NS.uk = e.target.value; go(); };
  $("#pRm").onchange = e => { NS.rm = e.target.value; go(); };
  $("#pPr").onchange = e => { NS.pr = e.target.value; go(); };
  bindSeg();
  v.querySelectorAll("[data-ps]").forEach(b => b.onclick = () => { NS[subKey] = b.dataset.ps; saveNS(); renderPSub(A, menu); });
  return A;
}
function viewNom(v) { useLW(SEG.lw); const A = nomHead(v, "nominatif"); if (A) renderPSub(A, "nominatif"); }
function viewKual(v) {
  if (!Auth.can("detail")) return viewKualGuest(v);
  useLW(SEG.lw); const A = nomHead(v, "kualitas"); if (A) renderPSub(A, "kualitas");
}
function renderPSub(A, menu) {
  const isQ = menu === "kualitas", sub = isQ ? NS.subQ : NS.sub;
  document.querySelectorAll(".ptabs [data-ps]").forEach(b => b.setAttribute("aria-selected", b.dataset.ps === sub));
  Object.keys(charts).filter(k => k.startsWith("cP")).forEach(id => { charts[id].destroy(); delete charts[id]; });
  const el = $("#pBody");
  const f = isQ ? ({ gerak: pGerak, sml: x => pQuality(x, "sml"), npl: x => pQuality(x, "npl") }[sub] || pGerak)
    : ({ ringkasan: pRingkasan, ews: pEws, peluang: pPeluang, debitur: pDebitur, rtl: pRtl }[sub] || pRingkasan);
  f(A, el); bindExp(el); setupSections($("#view"), curView()); if (window.Exp) Exp.decorate($("#view"));
}
const reRender = A => renderPSub(A || portRows(), curView());
function pRingkasan(A, el) {
  const T = todayN(), os = sum(A, "os"), sml = A.filter(r => r.kol === 2), npl = A.filter(r => r.kol >= 3), osS = sum(sml, "os"), osN = sum(npl, "os"), akan = A.filter(r => r.npl90 != null && r.npl90 <= T + 30);
  const Q = portPrev(), pOs = Q.length ? sum(Q, "os") : null, pS = Q.length ? sum(Q.filter(r => r.kol === 2), "os") : null, pN = Q.length ? sum(Q.filter(r => r.kol >= 3), "os") : null;
  const dl = (a, b, lowGood) => b == null ? "" : `<span class="delta ${dCls(a - b, !lowGood)}">${a - b >= 0 ? "▲" : "▼"} ${fJ(Math.abs(a - b))}</span> vs ${nSS(DB.lw.prev.asof)}`;
  const KR = ["Lancar", "SML 1", "SML 2", "SML 3", "One Obligor SML", "NPL Baru", "NPL Dibawah 2 Tahun", "NPL", "One Obligor NPL"];
  const kr = KR.map(k => { const a = A.filter(r => r.krit === k); return { k, n: a.length, os: sum(a, "os"), sh: os ? sum(a, "os") / os : 0 }; }).filter(x => x.n);
  const multi = NS.kc === "ALL" ? "kc" : NS.rm === "ALL" ? "rm" : null;
  el.innerHTML = `
    <div class="grid tiles">
      ${tile({ label: "Baki debet", value: fJ(os), sub: `${nf0.format(A.length)} rek · ${nf0.format(new Set(A.map(r => r.cif)).size)} CIF${pOs != null ? "<br>" + dl(os, pOs, false) : ""}` })}
      ${tile({ label: "SML (Kol 2)", value: pct(os ? osS / os : 0, 2), sub: `${fJ(osS)} · ${nf0.format(sml.length)} rek${pS != null ? "<br>" + dl(osS, pS, true) : ""}` })}
      ${tile({ label: "NPL (Kol 3–5)", value: pct(os ? osN / os : 0, 2), sub: `${fJ(osN)} · ${nf0.format(npl.length)} rek${pN != null ? "<br>" + dl(osN, pN, true) : ""}` })}
      ${tile({ label: "Akan NPL ≤30 hari", value: nf0.format(akan.length), sub: `${fJ(sum(akan, "os"))} · ${chip("lihat EWS", akan.length ? "crit" : "good")}` })}
      ${tile({ label: "Total tunggakan", value: fJ(sum(A, "tgk")), sub: "pokok + bunga + pinalti" })}
      ${tile({ label: "Rata-rata OS / rek", value: fJ(A.length ? os / A.length : 0), sub: `rata plafon ${fJ(A.length ? sum(A, "pl") / A.length : 0)}` })}
    </div>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Kualitas portofolio</h2><span class="sub">OS per KOL_ADK</span></div>${kolBar(A)}</section>
      <section class="panel"><div class="panel-h"><h2>Per kriteria kredit</h2><span class="sub">klik baris untuk melihat daftar</span></div><div id="pKr"></div></section>
    </div>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Per produk</h2><span class="sub">rasio terhadap OS produk</span></div><div id="pPr2"></div></section>
      <section class="panel"><div class="panel-h"><h2>Vintage tahun realisasi</h2><span class="sub">batang = OS · garis = % OS bermasalah (Kol 2–5)</span></div><div class="chart"><canvas id="cPVin"></canvas></div></section>
    </div>
    ${multi ? `<section class="panel"><div class="panel-h"><h2>${multi === "kc" ? "Per kantor cabang" : "Per RM / mantri"}</h2><span class="sub">klik nama untuk menyaring</span></div><div id="pGrp"></div></section>` : ""}
    <section class="panel"><div class="panel-h"><h2>OS terbesar</h2>${expBtn("top")}</div><div id="pTop"></div></section>`;
  table($("#pKr"), [{ key: "k", label: "Kriteria", fmt: k => `<button class="linkish" data-kr="${esc(k)}">${esc(k)}</button>` }, { key: "n", label: "Rek", r: 1, fmt: x => nf0.format(x) }, { key: "os", label: "OS (Jt)", r: 1, fmt: x => fJt(x) }, { key: "sh", label: "% OS", r: 1, fmt: x => pct(x, 2) }],
    kr, { state: { key: null }, after: t => t.querySelectorAll("[data-kr]").forEach(b => b.onclick = () => { const k = b.dataset.kr;
      if (k === "Lancar") { NS.sub = "debitur"; NS.f.deb = "L"; saveNS(); reRender(); }
      else { const s = k.includes("SML"); NS.subQ = s ? "sml" : "npl"; NS.f[NS.subQ] = k; saveNS(); location.hash = "#kualitas"; } }) });
  grpTable($("#pPr2"), A, r => prodLbl(r.prod), "Produk");
  if (multi === "kc") grpTable($("#pGrp"), A, r => r.kc, "Kantor cabang", { link: "gkc", after: t => t.querySelectorAll("[data-gkc]").forEach(b => b.onclick = () => { const u = kcByName(b.dataset.gkc); if (u) { NS.kc = String(u.boc); saveNS(); render(); } }) });
  else if (multi === "rm") grpTable($("#pGrp"), A, r => r.rm, "RM / mantri", { link: "grm", page: 20, after: t => t.querySelectorAll("[data-grm]").forEach(b => b.onclick = () => { NS.rm = b.dataset.grm; saveNS(); render(); }) });
  debTable($("#pTop"), [...A].sort((a, b) => b.os - a.os).slice(0, 10), { id: "top" });
  const yrs = {}; A.forEach(r => { if (r.rl == null) return; const y = nIso(r.rl).slice(0, 4); const o = yrs[y] = yrs[y] || { y, os: 0, b: 0, n: 0 }; o.os += r.os; o.n++; if (r.kol >= 2) o.b += r.os; });
  const V = Object.values(yrs).sort((a, b) => a.y.localeCompare(b.y)), s1 = cssv("--s1"), s2 = cssv("--s2");
  mkChart("cPVin", { type: "bar", data: { labels: V.map(x => x.y), datasets: [
    { type: "bar", label: "OS", data: V.map(x => x.os / 1e6), backgroundColor: s1, borderRadius: 4, maxBarThickness: 28, yAxisID: "y", order: 2 },
    { type: "line", label: "% bermasalah", data: V.map(x => x.os ? x.b / x.os : 0), borderColor: s2, backgroundColor: s2, borderWidth: 2, pointRadius: 3, yAxisID: "y1", order: 1 }] },
    options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.datasetIndex ? ` % bermasalah: ${pct(c.parsed.y, 2)}` : ` OS: ${rpJ(c.parsed.y)} · ${nf0.format(V[c.dataIndex].n)} rek` } } },
      scales: { x: baseOpts().scales.x, y: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1000) + " M" } },
        y1: { position: "right", beginAtZero: true, grid: { display: false }, border: { display: false }, ticks: { color: cssv("--muted"), font: { size: 11, family: cssv("--f-num") }, callback: x => nf0.format(x * 100) + "%" } } } }) });
}
function ooTable(A) {
  const rows = new Map(); A.forEach(r => { const l = r.kc + (r.seg === "Mikro" && NS.kc !== "ALL" ? " · " + r.uker : ""); const o = rows.get(l) || { l, b: [0, 0], o: [0, 0], u: [0, 0] }; const k = !r.oo ? "b" : r.ooCause === "Pinjaman lain" ? "o" : "u"; o[k][0]++; o[k][1] += r.os; rows.set(l, o); });
  const R = [...rows.values()].sort((a, b) => (b.b[1] + b.o[1] + b.u[1]) - (a.b[1] + a.o[1] + a.u[1])), T = { b: [0, 0], o: [0, 0], u: [0, 0] };
  R.forEach(x => ["b", "o", "u"].forEach(k => { T[k][0] += x[k][0]; T[k][1] += x[k][1]; }));
  const cell = p => `<td class="r">${p[0] ? nf0.format(p[0]) : "-"}</td><td class="r">${p[1] ? fJt(p[1]) : "-"}</td>`, tot = x => [x.b[0] + x.o[0] + x.u[0], x.b[1] + x.o[1] + x.u[1]];
  const own = SEG.lw === "K" ? "KPR" : "Briguna";
  return `<div class="table-wrap"><table class="kt"><thead><tr><th rowspan="2" class="sk1" style="left:0">Kanca${NS.kc !== "ALL" ? " / Unit" : ""}</th><th colspan="2">DG karena ${own}</th><th colspan="2">DG karena pinjaman lain</th><th colspan="2">Belum teridentifikasi</th><th colspan="2">Total</th></tr>
    <tr><th>Deb</th><th>OS (Jt)</th><th>Deb</th><th>OS (Jt)</th><th>Deb</th><th>OS (Jt)</th><th>Deb</th><th>OS (Jt)</th></tr></thead>
    <tbody>${R.map(x => `<tr><td class="sk1" style="left:0">${esc(x.l)}</td>${cell(x.b)}${cell(x.o)}${cell(x.u)}${cell(tot(x))}</tr>`).join("")}
    ${R.length > 1 ? `<tr class="ktot"><td class="sk1" style="left:0">TOTAL</td>${cell(T.b)}${cell(T.o)}${cell(T.u)}${cell(tot(T))}</tr>` : ""}</tbody></table></div>`;
}
function pQuality(A0, kind) {
  const el = $("#pBody"), T = todayN(), tot = sum(A0, "os"), A = A0.filter(r => kind === "sml" ? r.kol === 2 : r.kol >= 3);
  const cats = kind === "sml" ? ["SML 1", "SML 2", "SML 3", "One Obligor SML"] : ["NPL Baru", "NPL Dibawah 2 Tahun", "NPL", "One Obligor NPL"];
  const cur = NS.f[kind] && cats.includes(NS.f[kind]) ? NS.f[kind] : "all", q = (NS.q[kind] || "").toLowerCase();
  let L = cur === "all" ? A : A.filter(r => r.krit === cur); if (q) L = L.filter(r => (r.nama + " " + r.rek + " " + r.cif + " " + r.rm).toLowerCase().includes(q));
  const osA = sum(A, "os"), riil = A.filter(r => !r.oo), oo = A.filter(r => r.oo), K = kind.toUpperCase();
  const m = kind === "sml" ? (r => r.npl90 == null ? (r.oo ? r.ooCause : "–") : r.npl90 < T ? "tembus " + nSS(r.npl90) : "NPL dlm " + (r.npl90 - T) + " hr") : (r => r.oo ? r.ooCause : r.umurPinj != null ? "pinjaman " + Math.round(r.umurPinj / 30.4) + " bln" : "–");
  el.innerHTML = `
    <div class="grid tiles">
      ${tile({ label: K + " nominal", value: fJ(osA), sub: `${nf0.format(A.length)} rek · ${nf0.format(new Set(A.map(r => r.cif)).size)} CIF` })}
      ${tile({ label: "Rasio " + K, value: pct(tot ? osA / tot : 0, 2), sub: "terhadap OS portofolio" })}
      ${tile({ label: "Total tunggakan", value: fJ(sum(A, "tgk")), sub: "pokok + bunga + pinalti" })}
      ${tile({ label: "Tunggakan riil", value: nf0.format(riil.length), sub: fJ(sum(riil, "os")) })}
      ${tile({ label: "One obligor", value: nf0.format(oo.length), sub: fJ(sum(oo, "os")) })}
      ${tile({ label: "Sudah ada RTL", value: nf0.format(A.filter(r => NOTES[r.key]).length), sub: "dari " + nf0.format(A.length) + " rek" })}
    </div>
    <section class="panel"><div class="panel-h"><h2>${K} per kriteria & kantor cabang</h2><span class="sub">rekening & OS (Rp juta)</span></div><div id="pQk"></div></section>
    <section class="panel"><div class="panel-h"><h2>Penyebab penurunan kolektibilitas ${K}</h2><span class="sub">tunggakan riil vs one obligor</span></div>${ooTable(A)}</section>
    <section class="panel"><div class="panel-h"><h2>Nominatif ${K}</h2><div class="toolbar"><span class="sub">${nf0.format(L.length)} rekening · ${fJ(sum(L, "os"))}</span>${expBtn(kind)}</div></div>
      <div class="seg wrap" role="tablist">${[["all", "Semua", A.length], ...cats.map(c => [c, c, A.filter(r => r.krit === c).length])].map(([k, l, n]) => `<button type="button" data-kf="${esc(k)}" aria-selected="${cur === k}">${esc(l)} <small class="note">${nf0.format(n)}</small></button>`).join("")}</div>
      <input class="ctl" type="search" id="pQ" placeholder="Cari nama, rekening, CIF, atau RM" value="${esc(NS.q[kind] || "")}">
      <div id="pL"></div>
      <p class="note" style="margin:0">${kind === "sml" ? "SML 1: 0–29 hari · SML 2: 30–60 · SML 3: 61–89. Tembus 90 hari = jatuh tempo angsuran tertunggak + 90 hari." : "NPL Baru: 90–119 hari · di atas 119 hari dipisah umur pinjaman < 2 tahun dan ≥ 2 tahun."} One obligor = tunggakan 0 atau umur tunggakan tidak sejalan dengan KOL_ADK.</p></section>`;
  // rekap per kanca × kriteria
  const kcs = uniq(A.map(r => r.kc)).sort();
  const qr = kcs.map(kc => { const a = A.filter(r => r.kc === kc), o = { kc, n: a.length, os: sum(a, "os"), base: sum(A0.filter(r => r.kc === kc), "os") }; cats.forEach((c, i) => { const b = a.filter(r => r.krit === c); o["n" + i] = b.length; o["o" + i] = sum(b, "os"); }); o.p = o.base ? o.os / o.base : 0; return o; });
  const foot = { kc: "Total", n: nf0.format(A.length), os: `<b>${fJt(osA)}</b>`, p: pct(tot ? osA / tot : 0, 2) }; cats.forEach((c, i) => { foot["o" + i] = `${fJt(sum(qr, "o" + i))}<br><small class="note">${nf0.format(sum(qr, "n" + i))} rek</small>`; });
  table($("#pQk"), [{ key: "kc", label: "Kantor cabang" }, ...cats.map((c, i) => ({ key: "o" + i, label: c, r: 1, fmt: (x, r) => r["n" + i] ? `${fJt(x)}<br><small class="note">${nf0.format(r["n" + i])} rek</small>` : "–" })),
    { key: "os", label: "Total " + K, r: 1, fmt: (x, r) => `<b>${fJt(x)}</b><br><small class="note">${nf0.format(r.n)} rek</small>` }, { key: "p", label: "% " + K, r: 1, fmt: x => chip(pct(x, 2), kind === "sml" ? (x <= .015 ? "good" : x <= .03 ? "warn" : "crit") : nplCls(x)) }], qr, { sortKey: "os", foot: qr.length > 1 ? foot : null });
  el.querySelectorAll("[data-kf]").forEach(b => b.onclick = () => { NS.f[kind] = b.dataset.kf; saveNS(); reRender(A0); });
  let qt; $("#pQ").oninput = e => { clearTimeout(qt); qt = setTimeout(() => { NS.q[kind] = e.target.value; const L2 = (cur === "all" ? A : A.filter(r => r.krit === cur)).filter(r => (r.nama + " " + r.rek + " " + r.cif + " " + r.rm).toLowerCase().includes(e.target.value.toLowerCase()));
    debTable($("#pL"), L2, { id: kind, m, ml: kind === "sml" ? "Tembus NPL" : "Keterangan", state: kind === "sml" ? { key: "umur", dir: -1 } : undefined }); }, 220); };
  debTable($("#pL"), L, { id: kind, m, ml: kind === "sml" ? "Tembus NPL" : "Keterangan", state: kind === "sml" ? { key: "umur", dir: -1 } : undefined });
}
function cardsList(A, defs, key, title, desc) {
  const el = $("#pBody"), has = !!(DB.lw && DB.lw.prev);
  defs.forEach(d => d._a = d.need && !has ? null : A.filter(d.f));
  const sel = defs.find(d => d.id === NS[key]) || defs[0];
  let L = sel._a ? [...sel._a].sort(sel.sort) : []; if (sel.limit) L = L.slice(0, sel.limit);
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>${title}</h2><span class="sub">${desc}</span></div>
    <div class="ewsg">${defs.map(d => `<button type="button" class="ewc" data-ec="${d.id}" aria-pressed="${d === sel}"><span class="ewh"><span class="ewt">${esc(d.t)}</span>${chip(d._a ? nf0.format(d._a.length) : "–", d.sev)}</span><span class="ewv num">${d._a ? fJ(sum(d._a, "os")) : "perlu LW321 bulan lalu"}</span></button>`).join("")}</div></section>
    <section class="panel"><div class="panel-h"><h2>${esc(sel.t)}</h2><div class="toolbar"><span class="sub">${nf0.format(L.length)} rekening</span>${sel._a ? expBtn(key) : ""}</div></div><p class="note" style="margin:0">${esc(sel.d)}</p>
      ${sel._a ? `<div id="pL"></div>` : `<div class="empty">Upload LW321 posisi bulan sebelumnya untuk mengaktifkan sinyal ini.</div>`}</section>`;
  el.querySelectorAll("[data-ec]").forEach(b => b.onclick = () => { NS[key] = b.dataset.ec; saveNS(); reRender(A); });
  if (sel._a) debTable($("#pL"), L, { id: key, m: sel.m, ml: sel.ml, state: { key: null } });
}
function pEws(A) { cardsList(A, ewsDefs(), "ews", "Early Warning Signal", `dihitung dari LW321 posisi ${nS(DB.lw.asof)} dan tanggal hari ini (${nS(todayN())}) · pilih kartu untuk melihat daftar`); }
function pPeluang(A) {
  cardsList(A, pelDefs(), "pel", "Peluang bisnis", "prospek dari portofolio sendiri: suplesi, retensi, cross-sell");
  const st = NS.set, el = $("#pBody"), s = document.createElement("section"); s.className = "panel";
  s.innerHTML = `<div class="panel-h"><h2>Kriteria kandidat suplesi</h2><span class="sub">tersimpan di perangkat ini</span></div>
    <div class="form"><div class="field"><label for="sMin">Min. bulan berjalan</label><input class="ctl" id="sMin" type="number" min="0" value="${st.supMin}"></div>
    <div class="field"><label for="sMax">Maks. OS ÷ plafon (%)</label><input class="ctl" id="sMax" type="number" min="1" max="100" value="${st.supMax}"></div>
    <div class="field"><label for="sTen">Min. sisa tenor (bulan)</label><input class="ctl" id="sTen" type="number" min="0" value="${st.supTenor}"></div>
    <div class="field"><label for="sLun">Horizon segera lunas (bulan)</label><input class="ctl" id="sLun" type="number" min="1" value="${st.lunasBln}"></div></div>
    <div class="toolbar"><button class="btn primary" type="button" id="sApply">Terapkan</button></div>`;
  el.appendChild(s);
  $("#sApply").onclick = () => { [["sMin", "supMin"], ["sMax", "supMax"], ["sTen", "supTenor"], ["sLun", "lunasBln"]].forEach(([i, k]) => { const v = +$("#" + i).value; if (v >= 0) NS.set[k] = v; }); saveNS(); reRender(A); toast("Kriteria diterapkan"); };
}

/* ---------- Kualitas Kredit: pergerakan DG / UG ---------- */
const GCAT = [["dgLS", "DG Lancar → SML", "crit"], ["dgSN", "DG SML → NPL", "crit"], ["dgLN", "DG Lancar → NPL", "crit"], ["ugSL", "UG SML → Lancar", "good"], ["ugNS", "UG NPL → SML", "good"], ["ugNL", "UG NPL → Lancar", "good"],
  ["new", "Rekening baru", "good"], ["lsL", "Lancar lunas / keluar", "neutral"], ["lsS", "SML hilang (lunas)", "neutral"], ["lsN", "NPL hilang (lunas / PH)", "neutral"]];
// agregat {cur, prev, mtx, cat}: baris [kk, pr, ..., n, os] — sama dengan yang dihitung Apps Script untuk Guest
function gerakFromRows(A, Q) {
  const g = k => k <= 1 ? "L" : k === 2 ? "S" : "N", CAT = { LS: "dgLS", SN: "dgSN", LN: "dgLN", SL: "ugSL", NS: "ugNS", NL: "ugNL" }, hasP = !!(DB.lw && DB.lw.prev);
  const cur = new Map(), prev = new Map(), mtx = new Map(), cat = new Map(), add = (m, k, os) => { const a = m.get(k) || [0, 0]; a[0]++; a[1] += os; m.set(k, a); };
  A.forEach(r => { add(cur, r.kk + "|" + r.pr + "|" + r.kol, r.os); if (!hasP) return; if (r.prevKol == null) { add(cat, r.kk + "|" + r.pr + "|new", r.os); return; }
    add(mtx, r.kk + "|" + r.pr + "|" + r.prevKol + "|" + r.kol, r.os); const c = CAT[g(r.prevKol) + g(r.kol)]; if (c) add(cat, r.kk + "|" + r.pr + "|" + c, r.os); });
  Q.forEach(o => { add(prev, o.kk + "|" + o.pr + "|" + o.kol, o.os); if (!LWK.has(o.key)) add(cat, o.kk + "|" + o.pr + "|" + (o.kol <= 1 ? "lsL" : o.kol === 2 ? "lsS" : "lsN"), o.os); });
  const flat = m => [...m].map(([k, v]) => k.split("|").map(x => /^\d+$/.test(x) ? +x : x).concat(v));
  return { asof: DB.lw.asof, prevAsof: hasP ? DB.lw.prev.asof : null, cur: flat(cur), prev: flat(prev), mtx: flat(mtx), cat: flat(cat) };
}
const gSum = (arr, f) => arr.filter(f).reduce((a, x) => [a[0] + x[x.length - 2], a[1] + x[x.length - 1]], [0, 0]);
function gerakKcTable(el, G, filt) {
  const kks = uniq([...G.cur, ...G.prev].filter(x => filt(x[0], x[1])).map(x => x[0]));
  const C = k => x => x[2] === k, rows = kks.map(kk => { const f = x => x[0] === kk && filt(x[0], x[1]), cat = G.cat.filter(f), o = { kk, kc: kcName(kk) };
    GCAT.forEach(([k]) => { const s = gSum(cat, C(k)); o["n_" + k] = s[0]; o[k] = s[1]; });
    const cu = G.cur.filter(f), pv = G.prev.filter(f), tot = a => gSum(a, () => true)[1];
    o.os = tot(cu); o.sml = gSum(cu, x => x[2] === 2)[1]; o.npl = gSum(cu, x => x[2] >= 3)[1]; o.pos = tot(pv); o.psml = gSum(pv, x => x[2] === 2)[1]; o.pnpl = gSum(pv, x => x[2] >= 3)[1];
    o.dg = o.dgLS + o.dgSN + o.dgLN; o.ug = o.ugSL + o.ugNS + o.ugNL; o.n_dg = o.n_dgLS + o.n_dgSN + o.n_dgLN; o.n_ug = o.n_ugSL + o.n_ugNS + o.n_ugNL; o.net = o.ug - o.dg; return o; }).filter(o => o.os || o.pos);
  const cell = k => (x, r) => r["n_" + k] ? `${fJt(x)}<br><small class="note">${nf0.format(r["n_" + k])} rek</small>` : `<span class="note">–</span>`;
  const T = {}; ["dgLS", "dgSN", "dgLN", "dg", "ugSL", "ugNS", "ugNL", "ug", "net", "os", "sml", "npl", "psml", "pnpl", "pos"].forEach(k => T[k] = sum(rows, k)); ["dgLS", "dgSN", "dgLN", "dg", "ugSL", "ugNS", "ugNL", "ug"].forEach(k => T["n_" + k] = sum(rows, "n_" + k));
  const f = k => `${fJt(T[k])}<br><small class="note">${nf0.format(T["n_" + k])} rek</small>`;
  table(el, [{ key: "kc", label: "Kantor cabang" },
    { key: "dgLS", label: "DG L→SML", r: 1, fmt: cell("dgLS") }, { key: "dgSN", label: "DG SML→NPL", r: 1, fmt: cell("dgSN") }, { key: "dgLN", label: "DG L→NPL", r: 1, fmt: cell("dgLN") },
    { key: "dg", label: "Total DG", r: 1, fmt: (x, r) => `<b class="bad">${fJt(x)}</b><br><small class="note">${nf0.format(r.n_dg)} rek</small>` },
    { key: "ugSL", label: "UG SML→L", r: 1, fmt: cell("ugSL") }, { key: "ugNS", label: "UG NPL→SML", r: 1, fmt: cell("ugNS") }, { key: "ugNL", label: "UG NPL→L", r: 1, fmt: cell("ugNL") },
    { key: "ug", label: "Total UG", r: 1, fmt: (x, r) => `<b class="good">${fJt(x)}</b><br><small class="note">${nf0.format(r.n_ug)} rek</small>` },
    { key: "net", label: "Net (UG−DG)", r: 1, fmt: x => `<span class="delta ${dCls(x)}">${(x >= 0 ? "+" : "−") + fJt(Math.abs(x))}</span>` },
    { key: "sml", label: "SML kini", r: 1, fmt: (x, r) => `${fJt(x)}<br><small class="note">${pct(r.os ? x / r.os : 0, 2)} · lalu ${pct(r.pos ? r.psml / r.pos : 0, 2)}</small>` },
    { key: "npl", label: "NPL kini", r: 1, fmt: (x, r) => `${fJt(x)}<br><small class="note">${pct(r.os ? x / r.os : 0, 2)} · lalu ${pct(r.pos ? r.pnpl / r.pos : 0, 2)}</small>` }], rows,
    { sortKey: "dg", foot: rows.length > 1 ? { kc: "Total", dgLS: f("dgLS"), dgSN: f("dgSN"), dgLN: f("dgLN"), dg: `<b>${f("dg")}</b>`, ugSL: f("ugSL"), ugNS: f("ugNS"), ugNL: f("ugNL"), ug: `<b>${f("ug")}</b>`,
      net: `<span class="delta ${dCls(T.net)}">${(T.net >= 0 ? "+" : "−") + fJt(Math.abs(T.net))}</span>`, sml: `${fJt(T.sml)}<br><small class="note">${pct(T.os ? T.sml / T.os : 0, 2)}</small>`, npl: `${fJt(T.npl)}<br><small class="note">${pct(T.os ? T.npl / T.os : 0, 2)}</small>` } : null });
}
function gerakBody(el, G, filt, detail) {
  const osP = gSum(G.prev.filter(x => filt(x[0], x[1])), () => true)[1], osC = gSum(G.cur.filter(x => filt(x[0], x[1])), () => true)[1];
  const kol = (a, f) => gSum(a.filter(x => filt(x[0], x[1])), f)[1];
  const smlC = kol(G.cur, x => x[2] === 2), smlP = kol(G.prev, x => x[2] === 2), nplC = kol(G.cur, x => x[2] >= 3), nplP = kol(G.prev, x => x[2] >= 3);
  const d = (a, b, low) => `<span class="delta ${dCls(a - b, !low)}">${a - b >= 0 ? "▲" : "▼"} ${fJ(Math.abs(a - b))}</span>`;
  const sel = GCAT.find(x => x[0] === NS.gerak) || GCAT[0];
  const catS = k => gSum(G.cat.filter(x => filt(x[0], x[1])), x => x[2] === k);
  const mtx = [1, 2, 3, 4, 5].map(a => [1, 2, 3, 4, 5].map(b => gSum(G.mtx.filter(x => filt(x[0], x[1])), x => x[2] === a && x[3] === b)));
  el.innerHTML = `<div class="grid tiles">
      ${tile({ label: "OS " + nSS(G.prevAsof), value: fJ(osP), sub: "posisi bulan lalu" })}
      ${tile({ label: "OS " + nSS(G.asof), value: fJ(osC), sub: d(osC, osP, false) })}
      ${tile({ label: "SML", value: fJ(smlC), sub: `${pct(osC ? smlC / osC : 0, 2)} · ${d(smlC, smlP, true)}` })}
      ${tile({ label: "NPL", value: fJ(nplC), sub: `${pct(osC ? nplC / osC : 0, 2)} · ${d(nplC, nplP, true)}` })}
      ${tile({ label: "Total DG", value: fJ(["dgLS", "dgSN", "dgLN"].reduce((a, k) => a + catS(k)[1], 0)), sub: nf0.format(["dgLS", "dgSN", "dgLN"].reduce((a, k) => a + catS(k)[0], 0)) + " rek memburuk" })}
      ${tile({ label: "Total UG", value: fJ(["ugSL", "ugNS", "ugNL"].reduce((a, k) => a + catS(k)[1], 0)), sub: nf0.format(["ugSL", "ugNS", "ugNL"].reduce((a, k) => a + catS(k)[0], 0)) + " rek membaik" })}</div>
    <section class="panel"><div class="panel-h"><h2>Pergerakan ${nSS(G.prevAsof)} → ${nSS(G.asof)}</h2><span class="sub">dicocokkan per nomor rekening · rekening hilang memakai OS bulan lalu${detail ? " · pilih kartu untuk melihat daftar" : ""}</span></div>
      <div class="ewsg">${GCAT.map(x => { const s = catS(x[0]); return `<button type="button" class="ewc" data-gk="${x[0]}" aria-pressed="${x === sel}" ${detail ? "" : "disabled"}><span class="ewh"><span class="ewt">${x[1]}</span>${chip(nf0.format(s[0]), x[2])}</span><span class="ewv num">${fJ(s[1])}</span></button>`; }).join("")}</div></section>
    <section class="panel"><div class="panel-h"><h2>DG / UG per kantor cabang</h2><span class="sub">OS Rp juta · rekening</span></div><div id="gKc"></div></section>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Matriks kolektibilitas</h2><span class="sub">baris = kol ${nSS(G.prevAsof)}, kolom = kol ${nSS(G.asof)} · jumlah rekening</span></div>
        <div class="table-wrap"><table class="kt"><thead><tr><th class="sk1" style="left:0">Bln lalu ↓ / Kini →</th>${[1, 2, 3, 4, 5].map(k => `<th>Kol ${k}</th>`).join("")}</tr></thead><tbody>
        ${mtx.map((row, i) => `<tr><td class="sk1" style="left:0"><b>Kol ${i + 1}</b></td>${row.map((c, j) => `<td class="r">${c[0] ? `<span class="${j > i ? "bad" : j < i ? "good" : ""}">${nf0.format(c[0])}</span>` : "·"}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>
      <section class="panel"><div class="panel-h"><h2>DG vs UG</h2><span class="sub">OS (Rp juta) per jenis pergerakan</span></div><div class="chart"><canvas id="cPGer"></canvas></div></section>
    </div>
    ${detail ? `<section class="panel"><div class="panel-h"><h2>${sel[1]}</h2><div class="toolbar"><span class="sub" id="gCnt"></span>${sel[0].startsWith("ls") ? "" : expBtn("gerak")}</div></div><div id="pL"></div></section>` : ""}`;
  gerakKcTable($("#gKc"), G, filt);
  const cats = GCAT.slice(0, 6), crit = cssv("--crit"), good = cssv("--good");
  mkChart("cPGer", { type: "bar", data: { labels: cats.map(x => x[1].replace(/^(DG|UG) /, "")), datasets: [{ label: "OS", data: cats.map(x => catS(x[0])[1] / 1e6), backgroundColor: cats.map(x => x[0].startsWith("dg") ? crit : good), borderRadius: 4, maxBarThickness: 34 }] },
    options: baseOpts({ indexAxis: "y", plugins: { ...baseOpts().plugins, legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${rpJ(c.parsed.x)} · ${nf0.format(catS(cats[c.dataIndex][0])[0])} rek` } } },
      scales: { x: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x) + " Jt" } }, y: { ...baseOpts().scales.x, ticks: { ...baseOpts().scales.x.ticks, color: cssv("--ink-2"), font: { size: 11.5 } } } } }) });
  return sel;
}
function pGerak(A) {
  const el = $("#pBody"), P = DB.lw.prev;
  if (!P) { el.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada LW321 bulan lalu</p>Upload LW321 posisi bulan sebelumnya (menu Admin → Kelola data) untuk melihat DG/UG, rekening lunas, dan rekening baru.</div></section>`; return; }
  const Q = portPrev(), G = gerakFromRows(A, Q), sel = gerakBody(el, G, () => true, true), pr = r => r.prevKol != null, g = k => k <= 1 ? "L" : k === 2 ? "S" : "N";
  const F = { dgLS: A.filter(r => pr(r) && g(r.prevKol) === "L" && r.kol === 2), dgSN: A.filter(r => pr(r) && g(r.prevKol) === "S" && r.kol >= 3), dgLN: A.filter(r => pr(r) && g(r.prevKol) === "L" && r.kol >= 3),
    ugSL: A.filter(r => pr(r) && g(r.prevKol) === "S" && r.kol === 1), ugNS: A.filter(r => pr(r) && g(r.prevKol) === "N" && r.kol === 2), ugNL: A.filter(r => pr(r) && g(r.prevKol) === "N" && r.kol === 1),
    new: A.filter(r => !pr(r)), lsL: Q.filter(o => !LWK.has(o.key) && o.kol === 1), lsS: Q.filter(o => !LWK.has(o.key) && o.kol === 2), lsN: Q.filter(o => !LWK.has(o.key) && o.kol >= 3) };
  const L = F[sel[0]] || []; $("#gCnt").textContent = nf0.format(L.length) + " rekening · " + fJ(sum(L, "os"));
  el.querySelectorAll("[data-gk]").forEach(b => b.onclick = () => { NS.gerak = b.dataset.gk; saveNS(); reRender(A); });
  if (sel[0].startsWith("ls")) table($("#pL"), [{ key: "nama", label: "Debitur", fmt: (x, r) => `${esc(x)}<br><small class="note num">${esc(r.key)} · ${esc(r.cif)}</small>` }, { key: "kk", label: "Kanca", fmt: x => esc(kcName(x)) }, { key: "rm", label: "RM" }, { key: "pr", label: "Produk", fmt: x => esc(prodLbl(PRN[x] || "")) },
    { key: "kol", label: "Kol bln lalu", r: 1, fmt: k => kolChip(k) }, { key: "os", label: "OS bln lalu (Jt)", r: 1, fmt: x => fJt(x) }], L, { sortKey: "os", page: 25 });
  else debTable($("#pL"), L, { id: "gerak", m: r => r.prevKol != null ? "Kol " + r.prevKol + " → " + r.kol : "real " + nSS(r.rl), ml: "Pergerakan" });
}
// Guest: hanya agregat DG/UG per kanca (tanpa data per rekening)
function viewKualGuest(v) {
  const segs = [["B", "Briguna Ritel & Mikro"], ["K", "KPR"]], G = DB.gerak[SEG.lw];
  v.innerHTML = `<section class="panel" style="padding:12px 16px">${segBar(SEG.lw, segs, "data-lwseg")}<div class="toolbar" id="nFlt"></div><p class="note" style="margin:0" id="nScope"></p></section><div id="pBody" class="grid"></div>`;
  v.querySelectorAll("[data-lwseg]").forEach(b => b.onclick = () => { SEG.lw = b.dataset.lwseg; saveSEG(); NS.pr = "ALL"; NS.seg = "ALL"; render(); });
  if (!G || !G.prevAsof) { $("#pBody").innerHTML = `<section class="panel"><div class="empty">${LOADING.core ? "Memuat data…" : "Data pergerakan belum tersedia (perlu LW321 posisi terkini dan bulan lalu)."}</div></section>`; return; }
  const isB = SEG.lw === "B", all = [...G.cur, ...G.prev];
  const areas = uniq(all.map(x => kcAreaOf(x[0]))).filter(a => a !== "LAINNYA").sort(); if (NS.area !== "ALL" && !areas.includes(NS.area)) NS.area = "ALL";
  const kcs = uniq(all.filter(x => NS.area === "ALL" || kcAreaOf(x[0]) === NS.area).map(x => String(x[0]))).sort((a, b) => kcName(a).localeCompare(kcName(b))); if (NS.kc !== "ALL" && !kcs.includes(NS.kc)) NS.kc = "ALL";
  const prs = PRN.filter((p, i) => all.some(x => x[1] === i)); if (NS.pr !== "ALL" && !prs.includes(NS.pr)) NS.pr = "ALL";
  if (!isB) NS.seg = "ALL";
  const filt = (kk, pr) => inPr(pr) && (NS.area === "ALL" || kcAreaOf(kk) === NS.area) && (NS.kc === "ALL" || String(kk) === NS.kc);
  $("#nFlt").innerHTML = `${isB ? `<label class="field" style="flex:1 1 120px"><span class="note" style="font-weight:700">Segmen</span><select class="ctl" id="pSeg">${[["ALL", "Ritel + Mikro"], ["Ritel", "Ritel"], ["Mikro", "Mikro"]].map(([k, l]) => `<option value="${k}" ${NS.seg === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>` : ""}
    <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Area</span><select class="ctl" id="pAr"><option value="ALL">Semua area</option>${areas.map(a => `<option value="${esc(a)}" ${a === NS.area ? "selected" : ""}>${esc(areaS(a))}</option>`).join("")}</select></label>
    <label class="field" style="flex:1 1 180px"><span class="note" style="font-weight:700">Kantor Cabang</span><select class="ctl" id="pKc"><option value="ALL">Semua KC</option>${kcs.map(k => `<option value="${k}" ${k === NS.kc ? "selected" : ""}>${esc(kcName(k))}</option>`).join("")}</select></label>
    <label class="field" style="flex:1 1 130px"><span class="note" style="font-weight:700">Produk</span><select class="ctl" id="pPr"><option value="ALL">Semua</option>${prs.map(p => `<option value="${esc(p)}" ${p === NS.pr ? "selected" : ""}>${esc(prodLbl(p))}</option>`).join("")}</select></label>`;
  $("#nScope").textContent = `${LWL[SEG.lw].seg} · LW321 ${nS(G.prevAsof)} → ${nS(G.asof)} · angka agregat (detail per rekening hanya untuk Admin & RM)`;
  const go = () => { saveNS(); render(); };
  if ($("#pSeg")) $("#pSeg").onchange = e => { NS.seg = e.target.value; go(); };
  $("#pAr").onchange = e => { NS.area = e.target.value; NS.kc = "ALL"; go(); };
  $("#pKc").onchange = e => { NS.kc = e.target.value; go(); };
  $("#pPr").onchange = e => { NS.pr = e.target.value; go(); };
  gerakBody($("#pBody"), G, filt, false);
}
function pDebitur(A) {
  const el = $("#pBody"), fk = NS.f.deb || "all";
  const flt = () => { let L = fk === "all" ? A : A.filter(r => (r.kol === 1 ? "L" : r.kol === 2 ? "S" : "N") === fk); const qq = (NS.q.deb || "").toLowerCase(); return qq ? L.filter(r => (r.nama + " " + r.rek + " " + r.cif + " " + r.rm + " " + r.uker).toLowerCase().includes(qq)) : L; };
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>Semua debitur</h2><div class="toolbar"><span class="sub" id="pDc"></span>${expBtn("deb")}</div></div>
    <div class="seg wrap" role="tablist">${[["all", "Semua", A.length], ["L", "Lancar", A.filter(r => r.kol === 1).length], ["S", "SML", A.filter(r => r.kol === 2).length], ["N", "NPL", A.filter(r => r.kol >= 3).length]].map(([k, l, n]) => `<button type="button" data-df="${k}" aria-selected="${fk === k}">${l} <small class="note">${nf0.format(n)}</small></button>`).join("")}</div>
    <input class="ctl" type="search" id="pQ" placeholder="Cari nama, rekening, CIF, RM, atau unit" value="${esc(NS.q.deb || "")}"><div id="pL"></div></section>`;
  const draw = () => { const L = flt(); $("#pDc").textContent = nf0.format(L.length) + " rekening · " + fJ(sum(L, "os")); debTable($("#pL"), L, { id: "deb", m: r => nSS(r.nx), ml: "Angsuran berikut" }); };
  el.querySelectorAll("[data-df]").forEach(b => b.onclick = () => { NS.f.deb = b.dataset.df; saveNS(); reRender(A); });
  let qt; $("#pQ").oninput = e => { clearTimeout(qt); qt = setTimeout(() => { NS.q.deb = e.target.value; draw(); }, 220); };
  draw();
}
function pRtl(A) {
  const el = $("#pBody"), T = todayN(), L = A.filter(r => NOTES[r.key]).sort((a, b) => (dayN(NOTES[a.key].janji) ?? 9e9) - (dayN(NOTES[b.key].janji) ?? 9e9));
  const st = {}; L.forEach(r => { const s = NOTES[r.key].status || "–"; st[s] = (st[s] || 0) + 1; });
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>Rencana tindak lanjut</h2><div class="toolbar"><span class="sub">${nf0.format(L.length)} rekening dengan catatan</span>${expBtn("rtl")}</div></div>
    <p class="note" style="margin:0">Catatan tersimpan di perangkat ini saja (tidak dikirim ke server). Tambahkan dari detail rekening mana pun.</p>
    ${Object.keys(st).length ? `<div class="toolbar">${Object.entries(st).map(([k, n]) => chip(esc(k) + " · " + n, "neutral")).join("")}</div>` : ""}
    ${L.length ? `<div id="pL"></div>` : `<div class="empty">Belum ada catatan. Buka rekening SML/NPL lalu isi status penagihan dan tanggal janji bayar.</div>`}</section>`;
  if (L.length) debTable($("#pL"), L, { id: "rtl", m: r => { const n = NOTES[r.key]; return n.janji ? (dayN(n.janji) < T && n.status !== "Sudah bayar" ? "lewat janji " : "janji ") + nSS(dayN(n.janji)) : (n.status || ""); }, ml: "Janji / status", state: { key: null } });
}

/* ---------- detail rekening ---------- */
const RTL_ST = ["", "Belum dihubungi", "Sudah dihubungi", "Janji bayar", "Kunjungan", "Sudah bayar", "Koordinasi instansi", "Restruk diajukan", "Eskalasi ke kanca", "Tawarkan suplesi", "Lainnya"];
function openDeb(key) {
  const r = LWK.get(key); if (!r) return;
  const T = todayN(), p = LWPK.get(key), sib = (LWCIF.get(r.cif) || []).filter(x => x !== r), n = NOTES[key] || {}, hist = (n.hist || []).slice().reverse();
  const prog = r.rl != null && r.jt != null && r.jt > r.rl ? clamp((DB.lw.asof - r.rl) / (r.jt - r.rl), 0, 1) : 0;
  const now = r.nx != null && r.kol >= 2 && r.tgk > 0 ? T - r.nx : null;
  const kv = (k, v) => `<dt>${k}</dt><dd>${v}</dd>`;
  $("#debTitle").textContent = r.nama;
  $("#debBody").innerHTML = `
    <div class="toolbar"><span class="note num">${esc(r.rek)} · CIF ${esc(r.cif)}</span>${kolChip(r.kol)}${chip(r.kq, r.kol === 1 ? "good" : r.kol === 2 ? "warn" : "crit")}${chip(esc(r.krit), kritCls(r.krit))}${r.restr ? chip("Restruk", "warn") : ""}</div>
    <div class="grid cols-2">
      <dl class="kv">${kv("Baki debet", rpFull(r.os))}${kv("Plafon", rpFull(r.pl))}${kv("Total tunggakan", rpFull(r.tgk))}${kv("· pokok", rpFull(r.tp))}${kv("· bunga", rpFull(r.tb))}${kv("· pinalti", rpFull(r.tpn))}</dl>
      <dl class="kv">${kv("Produk", esc(prodLbl(r.prod)))}${kv("Kanca", esc(r.kc))}${r.seg === "Mikro" ? kv("Unit", esc(r.uker)) : ""}${kv("RM / mantri", esc(r.rm))}${kv("Suku bunga", r.rate ? nf2.format(r.rate) + "%" : "–")}
        ${kv("Angsuran berikut", nS(r.nx))}${kv("Umur tunggakan (posisi)", r.umur == null ? "–" : r.umur + " hari")}${now != null ? kv("Umur tunggakan hari ini*", now + " hari") : ""}
        ${r.npl90 != null ? kv("Tembus 90 hari", nS(r.npl90) + (r.npl90 >= T ? ` (${r.npl90 - T} hari lagi)` : " (lewat)")) : ""}${p ? kv("Kol bulan lalu", p.kol + " · OS " + fJ(p.os)) : ""}</dl>
    </div>
    ${now != null ? `<p class="note">*Bila belum ada pembayaran sejak posisi data ${nS(DB.lw.asof)}.</p>` : ""}
    <div><div class="panel-h"><h2 style="font-size:13px">Perjalanan kredit · ${r.jw ? r.jw + " bln" : "–"}</h2><span class="sub">${Math.round(prog * 100)}% tenor · OS ${pct(r.pl ? r.os / r.pl : 0, 1)} plafon</span></div>
      <div class="meter"><i style="width:${prog * 100}%"></i></div><div class="toolbar note" style="justify-content:space-between;margin-top:4px"><span>Realisasi ${nS(r.rl)}</span><span>Jatuh tempo ${nS(r.jt)}</span></div></div>
    ${r.oo ? `<div class="banner" style="background:var(--accent-soft)"><span><b style="color:var(--accent)">One obligor · ${esc(r.ooCause)}.</b> ${r.ooCause === "Pinjaman lain" ? "Ada pinjaman lain a.n. CIF ini dengan kol ≥ 2 (lihat di bawah)." : "Rekening ini tidak menunggak; penyebab belum teridentifikasi (cek kartu kredit / pinjaman di bank lain)."}</span></div>` : ""}
    ${sib.length ? `<div><h3 style="font-size:13px;margin-bottom:6px">Rekening lain a.n. CIF ini</h3><div id="debSib"></div></div>` : ""}
    <form class="dsec" id="noteForm" data-key="${esc(key)}"><h3>Tindak lanjut</h3>
      <div class="form"><div class="field"><label for="nSt">Status</label><select class="ctl" id="nSt">${RTL_ST.map(s => `<option value="${s}" ${s === (n.status || "") ? "selected" : ""}>${s || "— pilih —"}</option>`).join("")}</select></div>
        <div class="field"><label for="nJj">Tanggal janji / tindak lanjut</label><input class="ctl" id="nJj" type="date" value="${esc(n.janji || "")}"></div>
        <div class="field full"><label for="nTx">Catatan</label><textarea class="ctl" id="nTx" rows="3" maxlength="500" placeholder="Hasil kontak, kondisi debitur…" style="height:auto;padding:8px 10px"></textarea></div></div>
      <div class="toolbar"><button class="btn primary" type="submit">Simpan catatan</button>${NOTES[key] ? `<button class="btn" type="button" id="nDel">Hapus catatan</button>` : ""}</div>
      ${hist.map(h => `<div class="ds"><b>${esc(h.status || "Catatan")}${h.janji ? " · " + esc(tglS(h.janji)) : ""}</b>${h.text ? `<br>${esc(h.text)}` : ""}<br><small class="note">${esc(h.at)}</small></div>`).join("")}</form>`;
  if (sib.length) table($("#debSib"), [{ key: "nama", label: "Rekening", fmt: (x, s) => `<button class="linkish" data-deb="${esc(s.key)}">${esc(s.rek)}</button><br><small class="note">${esc(prodLbl(s.prod))}</small>` }, { key: "kol", label: "Kol", r: 1, fmt: k => kolChip(k) }, { key: "os", label: "OS (Jt)", r: 1, fmt: x => fJt(x) }, { key: "tgk", label: "Tgk (Jt)", r: 1, fmt: x => x ? fJt(x) : "–" }], sib,
    { after: t => t.querySelectorAll("[data-deb]").forEach(b => b.onclick = () => openDeb(b.dataset.deb)) });
  $("#noteForm").onsubmit = e => { e.preventDefault(); const st = $("#nSt").value, jj = $("#nJj").value, tx = $("#nTx").value.trim().slice(0, 500);
    if (!st && !jj && !tx) { toast("Isi status, tanggal, atau catatan dulu."); return; }
    const o = NOTES[key] || { hist: [] }; o.status = st || o.status; o.janji = jj; o.hist = (o.hist || []).concat([{ status: st, janji: jj, text: tx, at: new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) }]);
    NOTES[key] = o; saveNotes(); toast("Catatan tersimpan"); openDeb(key); if (["nominatif", "kualitas"].includes(curView())) reRender(); };
  if ($("#nDel")) $("#nDel").onclick = () => { if (!$("#nDel").dataset.ok) { $("#nDel").dataset.ok = 1; $("#nDel").textContent = "Ketuk lagi untuk menghapus"; return; } delete NOTES[key]; saveNotes(); openDeb(key); if (["nominatif", "kualitas"].includes(curView())) reRender(); };
  const dlg = $("#dlgDeb"); if (!dlg.open) dlg.showModal();
}
