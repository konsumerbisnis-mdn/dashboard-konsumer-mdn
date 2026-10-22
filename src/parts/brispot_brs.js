/* ================= Brispot Briguna: Warm / Hot Leads per RM, KC, Mantri, Unit (laporan 4 sheet template) ================= */
// Aturan: docs/ketentuan_olah_data/18_brispot_warm_hot_leads.md. File sumber = "Brispot Briguna - <tgl> (<jam>) Temp.xlsx":
// sheet Nominatif (data mentah), Rule, RM BGRITEL & Mantri BGMIKRO (daftar RM/Mantri, guidance, rencana realisasi), KC BGRITEL & Unit BGMIKRO (urutan KC/Unit).
// DB.brs = { asof, jam, file, ren:{R,M}, rm[], kc[], mantri[], unit[], warn{} }
// baris: { kode, kc, unit?, nama, dh?, n?, g, ren:[deb,net], w:[deb,plaf], h:[[deb,plaf]×3 (putusan, approved, pencairan)], c:[deb,plaf,net] }  — nominal Rp juta
const BRS_RULE = { "menunggu proses putusan kredit": ["h", 0], "prakarsa telah diputus & siap cair": ["h", 1], "prakarsa dalam proses verifikasi pencairan": ["h", 2],
  "prakarsa menunggu putusan pencairan": ["h", 2], "putusan berhasil diverifikasi adk": ["h", 2], "pencairan sukses": ["c"], "sedang dalam proses prakarsa": ["w"] };
const brsK = s => String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim();
const BRS_BLN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
function brsRp(v) {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  let s = String(v == null ? "" : v).replace(/Rp|\s/gi, "").replace(/,-+$/, ""); if (!/\d/.test(s)) return 0;
  s = /,\d{1,2}$/.test(s) ? s.replace(/\./g, "").replace(",", ".") : s.replace(/[.,](?=\d{3}(\D|$))/g, "");
  const n = parseFloat(s.replace(/[^\d.\-]/g, "")); return isFinite(n) ? n : 0;
}
function brsIso(v) {
  if (v instanceof Date && !isNaN(v)) return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0") + "-" + String(v.getDate()).padStart(2, "0");
  if (typeof v === "number" && v > 20000 && v < 80000) return new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10);
  const s = String(v == null ? "" : v).trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1] + "-" + m[2].padStart(2, "0") + "-" + m[3].padStart(2, "0");
  if ((m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/))) return m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0");
  return null;
}
const brsStamp = v => v instanceof Date ? v.getTime() : typeof v === "number" ? v : Date.parse(String(v || "")) || 0;
function brsSim(a, b) {   // kemiripan nama (1 = sama), dipakai untuk ejaan yang berbeda antara Brispot dan master
  if (a === b) return 1; if (!a || !b) return 0;
  let p = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const q = [i]; for (let j = 1; j <= b.length; j++) q[j] = Math.min(p[j] + 1, q[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = q; }
  return 1 - p[b.length] / Math.max(a.length, b.length);
}
function brsSheet(wb, name) {   // sheet menurut nama (huruf besar/kecil & spasi bebas); jangkauan dibatasi supaya sheet template (16 ribu kolom) tidak membengkak
  const k = brsK(name).replace(/ /g, ""), nm = wb.SheetNames.find(n => brsK(n).replace(/ /g, "") === k); if (!nm) return null;
  const ws = wb.Sheets[nm], r = XLSX.utils.decode_range(ws["!ref"] || "A1"); r.e.c = Math.min(r.e.c, 70); r.e.r = Math.min(r.e.r, 6000);
  return XLSX.utils.sheet_to_json(Object.assign({}, ws, { "!ref": XLSX.utils.encode_range(r) }), { header: 1, raw: true, defval: null });
}
// struktur sheet template: baris data dimulai dari baris di bawah header "No" sampai baris "TOTAL"; kolom dicari dari teks header
function brsLayout(aoa, nameHdr) {
  const hr = aoa.findIndex(r => r && r.some(c => String(c).trim() === "No")); if (hr < 0) return null;
  const hdr = c => { for (let r = hr; r <= hr + 2; r++) { const x = (aoa[r] || [])[c]; if (x != null && String(x).trim()) return String(x).trim(); } return ""; };
  const find = (txt, from = 0) => { for (let r = hr; r <= hr + 2; r++) { const i = (aoa[r] || []).findIndex((c, k) => k >= from && c != null && brsK(c) === brsK(txt)); if (i >= 0) return i; } return -1; };
  const nameC = find(nameHdr), rows = [];
  for (let r = hr + 3; r < aoa.length; r++) { const a = aoa[r] || []; if (String(a[0]).trim().toUpperCase() === "TOTAL") break; if (a[0] == null && a[nameC] == null && a[2] == null) continue; rows.push(a); }
  return { hr, find, hdr, nameC, rows, aoa };
}
function brsRencana(aoa, hr, mainNameC, nameHdr) {   // tabel samping "Rencana Realisasi": Kanca / [Unit] / Nama / produk (Deb, OS) / Total (Deb, OS) + tanggal rencana
  const hdrRow = aoa[hr + 2] || [], lblRow = aoa[hr + 1] || [];
  const nC = hdrRow.findIndex((c, k) => k > mainNameC + 6 && brsK(c).startsWith("nama"));
  let tC = lblRow.findIndex((c, k) => k > nC && brsK(c) === "total");
  if (tC < 0) tC = hdrRow.reduce((m, c, k) => k > nC && brsK(c) === "deb" ? k : m, -1);   // sheet mantri tanpa label "Total": pasangan Deb/OS terakhir
  if (nC < 0 || tC < 0) return { map: new Map(), date: null };
  const map = new Map(); let date = null;
  for (let r = hr + 3; r < aoa.length; r++) { const a = aoa[r] || []; if (a[nC] == null || !String(a[nC]).trim()) continue;
    const k = nmKey(a[nC]), o = map.get(k) || { deb: 0, net: 0 }; o.deb += brsRp(a[tC]); o.net += brsRp(a[tC + 1]); map.set(k, o); if (!date) date = brsIso(a[tC + 2]); }
  return { map, date };
}
function parseBrispot(wb, fname) {
  const nom = brsSheet(wb, "Nominatif"), rmS = brsSheet(wb, "RM BGRITEL"), mkS = brsSheet(wb, "Mantri BGMIKRO");
  if (!nom || !rmS || !mkS) return null;
  const kcS = brsSheet(wb, "KC BGRITEL"), unS = brsSheet(wb, "Unit BGMIKRO"), ruleS = brsSheet(wb, "Rule");
  const LR = brsLayout(rmS, "Nama RM"), LM = brsLayout(mkS, "Nama Mantri"); if (!LR || !LM) return null;
  // ---------- nominatif ----------
  const hi = nom.findIndex(r => r && r.some(c => brsK(c) === "refno")); if (hi < 0) return null;
  const H = nom[hi].map(c => String(c == null ? "" : c).trim().toUpperCase()), ix = (...ks) => { for (const k of ks) { const i = H.indexOf(k); if (i >= 0) return i; } return -1; };
  const iN = ix("NAMA PEMRAKARSA"), iNik = ix("NIK"), iSt = ix("STATUS KREDIT"), iPl = ix("PLAFON"), iNet = ix("NET OS"), iTg = ix("TANGGAL PENGAJUAN"), iCair = ix("TANGGAL PENCAIRAN SUKSES", "TANGGAL PENCAIRAN"), iRef = ix("REFNO");
  if ([iN, iSt, iPl, iNet].some(i => i < 0)) return null;
  const rule = Object.assign({}, BRS_RULE);
  if (ruleS) { const sm = { "menunggu putusan": ["h", 0], approved: ["h", 1], "menunggu pencairan": ["h", 2], prakarsa: ["w"], "pencairan sukses": ["c"] };
    ruleS.forEach(r => { const s = r && brsK(r[0]), t = r && sm[brsK(r[1])]; if (s && t && brsK(r[0]) !== "status kredit") rule[s] = t; }); }
  const rank = c => !c ? 0 : c[0] === "w" ? 1 : c[0] === "h" ? 2 : 3;
  const best = new Map(), loose = [];
  nom.slice(hi + 1).forEach(r => { if (!r || r[iRef] == null || !String(r[iRef]).trim() || String(r[iN] == null ? "" : r[iN]).trim() === "") return;
    const cat = rule[brsK(r[iSt])] || null, nik = String(r[iNik] == null ? "" : r[iNik]).replace(/\D/g, ""), o = { r, cat, t: brsStamp(r[iTg]) };
    if (!nik) { loose.push(o); return; }
    const b = best.get(nik); if (!b || rank(o.cat) > rank(b.cat) || (rank(o.cat) === rank(b.cat) && o.t > b.t)) best.set(nik, o); });
  const leads = [...best.values(), ...loose].filter(o => o.cat);
  // ---------- daftar RM & mantri dari template ----------
  const mk = (a, L, extra) => Object.assign({ kode: a[1] != null ? String(a[1]).replace(/\.0+$/, "") : "", kc: String(a[2] == null ? "" : a[2]).trim(), nama: String(a[L.nameC]).trim(), g: brsRp(a[L.find("Guidance")]),
    ren: [0, 0], w: [0, 0], h: [[0, 0], [0, 0], [0, 0]], c: [0, 0, 0] }, extra);
  const rm = LR.rows.filter(a => a[LR.nameC]).map(a => mk(a, LR));
  const mantri = LM.rows.filter(a => a[LM.nameC]).map(a => mk(a, LM, { unit: String(a[3] == null ? "" : a[3]).trim(), dh: String(a[LM.find("D / H")] || "").trim() }));
  const RR = brsRencana(rmS, LR.hr, LR.nameC, "Nama RM"), RM = brsRencana(mkS, LM.hr, LM.nameC, "Nama Mantri");
  // tanggal posisi & jam dari nama file: "Brispot Briguna - (21 Okt 26 (14.16) Temp.xlsx"
  let asof = RR.date || RM.date, jam = "";
  const mt = /(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2,4}).*?\((\d{1,2})[.:](\d{2})\)/.exec(fname || "");
  if (mt) { jam = mt[4].padStart(2, "0") + ":" + mt[5]; const mi = ["jan", "feb", "mar", "apr", "mei", "may", "jun", "jul", "agu", "aug", "sep", "okt", "oct", "nov", "des", "dec"].findIndex(x => brsK(mt[2]).startsWith(x));
    if (mi >= 0) { const m = [0, 1, 2, 3, 4, 4, 5, 6, 7, 7, 8, 9, 9, 10, 11, 11][mi] + 1, y = mt[3].length === 2 ? "20" + mt[3] : mt[3]; asof = asof || y + "-" + String(m).padStart(2, "0") + "-" + mt[1].padStart(2, "0"); } }
  const ren = { R: RR.date || asof, M: RM.date || asof };
  rm.forEach(x => { const o = RR.map.get(nmKey(x.nama)); if (o) x.ren = [o.deb, o.net]; });
  mantri.forEach(x => { const o = RM.map.get(nmKey(x.nama)); if (o) x.ren = [o.deb, o.net]; });
  // ---------- atribusi lead ke RM / mantri ----------
  const idx = new Map(); rm.forEach(x => idx.set(nmKey(x.nama), { x, seg: "R" })); mantri.forEach(x => idx.set(nmKey(x.nama), { x, seg: "M" }));
  const fuzzy = [], miss = {}; const keys = [...idx.keys()];
  const memo = new Map();
  const pick = nm => { const k = nmKey(nm); if (memo.has(k)) return memo.get(k); let hit = idx.get(k) || null;
    if (!hit && k) { let bs = 0, bk = null; keys.forEach(c => { const s = brsSim(k, c); if (s > bs) { bs = s; bk = c; } }); if (bs >= .9) { hit = idx.get(bk); fuzzy.push({ dari: String(nm).trim(), ke: hit.x.nama, skor: Math.round(bs * 100) / 100 }); } }
    memo.set(k, hit); return hit; };
  let dropped = 0;
  leads.forEach(o => { const hit = pick(o.r[iN]); if (!hit) { dropped++; miss[String(o.r[iN]).trim()] = (miss[String(o.r[iN]).trim()] || 0) + 1; return; }
    const x = hit.x, pl = brsRp(o.r[iPl]) / 1e6, net = brsRp(o.r[iNet]) / 1e6, cat = o.cat;
    if (cat[0] === "w") { x.w[0]++; x.w[1] += pl; }
    else if (cat[0] === "h") { x.h[cat[1]][0]++; x.h[cat[1]][1] += pl; }
    else if (brsIso(o.r[iCair]) && brsIso(o.r[iCair]) === ren[hit.seg]) { x.c[0]++; x.c[1] += pl; x.c[2] += net; } });
  // ---------- agregasi KC (dari RM) dan Unit (dari mantri) mengikuti urutan sheet template ----------
  const sumInto = (t, x) => { t.g += x.g; t.ren[0] += x.ren[0]; t.ren[1] += x.ren[1]; t.w[0] += x.w[0]; t.w[1] += x.w[1]; x.h.forEach((a, i) => { t.h[i][0] += a[0]; t.h[i][1] += a[1]; }); t.c[0] += x.c[0]; t.c[1] += x.c[1]; t.c[2] += x.c[2]; t.n++; };
  const blank = (o) => Object.assign({ g: 0, n: 0, ren: [0, 0], w: [0, 0], h: [[0, 0], [0, 0], [0, 0]], c: [0, 0, 0] }, o);
  const lay = (aoa) => { const L = aoa && brsLayout(aoa, "Kantor Cabang"); return L ? L.rows : []; };
  const kcRows = lay(kcS).filter(a => a[2]).map(a => blank({ kode: a[1] != null ? String(a[1]).replace(/\.0+$/, "") : "", kc: String(a[2]).trim() }));
  rm.forEach(x => { let t = kcRows.find(k => nmKey(k.kc) === nmKey(x.kc)); if (!t) kcRows.push(t = blank({ kode: x.kode, kc: x.kc })); sumInto(t, x); });
  const unRows = lay(unS).filter(a => a[2]).map(a => blank({ kode: a[1] != null ? String(a[1]).replace(/\.0+$/, "") : "", kc: String(a[2]).trim(), unit: String(a[3] == null ? "" : a[3]).trim() }));
  mantri.forEach(x => { let t = unRows.find(k => nmKey(k.kc) === nmKey(x.kc) && nmKey(k.unit) === nmKey(x.unit)); if (!t) unRows.push(t = blank({ kode: x.kode, kc: x.kc, unit: x.unit })); sumInto(t, x); });
  [...rm, ...mantri, ...kcRows, ...unRows].forEach(x => { x.w[1] = Math.round(x.w[1] * 100) / 100; x.h.forEach(a => a[1] = Math.round(a[1] * 100) / 100); x.c[1] = Math.round(x.c[1] * 100) / 100; x.c[2] = Math.round(x.c[2] * 100) / 100; });
  return { asof, jam, file: fname || "", ren, rm, kc: kcRows, mantri, unit: unRows, warn: { fuzzy, tidakCocok: dropped, namaTidakCocok: Object.entries(miss).sort((a, b) => b[1] - a[1]).slice(0, 15) }, updated: new Date().toISOString() };
}

/* ---------- tampilan ---------- */
const BRS = Object.assign({ tab: "rm" }, lsGet(STORE + "-brs") || {});
const BRS_TABS = [["rm", "RM Briguna Ritel", "R", "Ritel", "RM"], ["kc", "KC Briguna Ritel", "R", "Ritel", "KC"], ["mantri", "Mantri Briguna Mikro", "M", "Mikro", "Mantri"], ["unit", "Unit Briguna Mikro", "M", "Mikro", "Unit"]];
const brsTgl = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${+m[3]} ${BRS_BLN_PANJANG[+m[2] - 1]} ${m[1]}` : "–"; };
const brsTglPendek = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${m[3]}-${BULAN[+m[2] - 1]}-${m[1].slice(2)}` : "–"; };
function brsTable(tab, rows, ren) {
  const unit = tab === "mantri" || tab === "unit", nama = tab === "unit" ? "Jumlah Mantri" : tab === "kc" ? "Jumlah RM" : tab === "mantri" ? "Nama Mantri" : "Nama RM", agg = tab === "kc" || tab === "unit", dh = tab === "mantri";
  const nz = x => x ? nf0.format(Math.round(x)) : "–", gapF = x => x < 0 ? `<span class="ng">(${nf0.format(Math.round(-x))})</span>` : nz(x);
  const ht = r => [r.h[0][0] + r.h[1][0] + r.h[2][0], r.h[0][1] + r.h[1][1] + r.h[2][1]];
  const nums = r => { const t = ht(r), gh = t[1] - r.g, gr = r.c[2] - r.ren[1];
    return `<td class="r">${nz(r.ren[0])}</td><td class="r">${nz(r.ren[1])}</td><td class="r bw">${nz(r.w[0])}</td><td class="r bw">${nz(r.w[1])}</td>
      ${r.h.map(a => `<td class="r">${nz(a[0])}</td><td class="r">${nz(a[1])}</td>`).join("")}<td class="r bh">${nz(t[0])}</td><td class="r bh">${nz(t[1])}</td>
      <td class="r">${nz(r.g)}</td><td class="r">${gapF(gh)}</td><td class="r bc">${nz(r.c[0])}</td><td class="r bc">${nz(r.c[1])}</td><td class="r bc">${nz(r.c[2])}</td><td class="r">${gapF(gr)}</td>`; };
  const lead = r => `<td>${esc(r.kc)}</td>${unit ? `<td>${esc(r.unit || "–")}</td>` : ""}${agg ? `<td class="r">${nz(r.n)}</td>` : `<td>${esc(r.nama)}</td>`}${dh ? `<td class="c">${esc(r.dh || "")}</td>` : ""}`;
  const T = { g: 0, n: 0, ren: [0, 0], w: [0, 0], h: [[0, 0], [0, 0], [0, 0]], c: [0, 0, 0] };
  rows.forEach(r => { T.g += r.g; T.n += r.n || 0; T.ren[0] += r.ren[0]; T.ren[1] += r.ren[1]; T.w[0] += r.w[0]; T.w[1] += r.w[1]; r.h.forEach((a, i) => { T.h[i][0] += a[0]; T.h[i][1] += a[1]; }); T.c[0] += r.c[0]; T.c[1] += r.c[1]; T.c[2] += r.c[2]; });
  const lbl = 2 + (unit ? 1 : 0) + (dh ? 1 : 0) + (agg ? 0 : 1);   // No + KC + [Unit] + [Nama] + [D/H]
  return `<div class="table-wrap"><table class="kt brs"><thead>
    <tr><th rowspan="3">No</th><th rowspan="3">Kantor Cabang</th>${unit ? '<th rowspan="3">Unit</th>' : ""}<th rowspan="3">${nama}</th>${dh ? '<th rowspan="3">D / H</th>' : ""}
      <th colspan="2" rowspan="2" class="g0">Rencana Realisasi<br>${brsTglPendek(ren)}</th><th colspan="2" class="gw">WARM LEADS</th><th colspan="10" class="gh">Hot Leads</th><th colspan="2" class="g0">Target Disburse</th><th colspan="3" rowspan="2" class="gc">Pencairan Sukses</th><th rowspan="3" class="g0">Gap Rencana Real vs Pencairan Sukses</th></tr>
    <tr><th colspan="2" class="gw">Prakarsa</th><th colspan="2" class="gh">Menunggu putusan</th><th colspan="2" class="gh">Approved</th><th colspan="2" class="gh">Menunggu Pencairan</th><th colspan="2" class="gh t">TOTAL</th><th rowspan="2" class="g0">Guidance</th><th rowspan="2" class="g0">Gap Hot Leads thd Guidance</th></tr>
    <tr><th class="g0">Deb</th><th class="g0">Net</th>${["gw", "gh", "gh", "gh", "gh t"].map(c => `<th class="${c}">Deb</th><th class="${c}">Plaf.</th>`).join("")}<th class="gc">Deb</th><th class="gc">Plaf.</th><th class="gc">Net</th></tr></thead>
    <tbody>${rows.length ? rows.map((r, i) => `<tr><td class="r">${i + 1}</td>${lead(r)}${nums(r)}</tr>`).join("") : `<tr><td colspan="${lbl + 17}" class="empty">Tidak ada data.</td></tr>`}</tbody>
    <tfoot><tr class="knv"><td colspan="${lbl}"><b>TOTAL</b></td>${agg ? `<td class="r">${nz(T.n)}</td>` : ""}${nums(T)}</tr></tfoot></table></div>`;
}
function brsSorted(rows) {
  const t = r => r.h[0][1] + r.h[1][1] + r.h[2][1];
  return [...rows].sort((a, b) => b.c[2] - a.c[2] || t(b) - t(a) || b.w[1] - a.w[1] || a.kc.localeCompare(b.kc));
}
function renderBrs() {
  const el = $("#brsWrap"); if (!el) return;
  const B = DB.brs, seg = segBarHTML();
  function segBarHTML() { return `<div class="seg" role="tablist" aria-label="Laporan Brispot Briguna">${BRS_TABS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${BRS.tab === k}" data-brs="${k}">${l}</button>`).join("")}</div>`; }
  if (!B) { el.innerHTML = `<section class="panel"><div class="panel-h"><h2>Brispot Briguna · Warm &amp; Hot Leads</h2></div><div class="empty">Belum ada data Warm / Hot Leads. ${isAdmin() ? "Upload file <b>Brispot Briguna</b> lewat Admin → Kelola data." : "Hubungi admin untuk upload file Brispot Briguna."}</div></section>`; return; }
  if (!BRS_TABS.some(t => t[0] === BRS.tab)) BRS.tab = "rm";
  const T = BRS_TABS.find(t => t[0] === BRS.tab), rows = B[BRS.tab], ren = B.ren[T[2]], pos = brsTgl(B.asof), jam = B.jam || "";
  const wa = `Berikut disampaikan Brispot Briguna ${T[3]} per ${T[4]} posisi ${pos} Brispot (Update ${jam} WIB).`;
  const w = B.warn || {}, warn = (w.fuzzy && w.fuzzy.length) || w.tidakCocok ? `<p class="note" style="margin:0">${w.fuzzy && w.fuzzy.length ? `Ejaan nama disamakan otomatis: ${w.fuzzy.map(f => `${esc(f.dari)} → ${esc(f.ke)}`).join("; ")}. ` : ""}${w.tidakCocok ? `${nf0.format(w.tidakCocok)} lead tidak masuk tabel karena nama pemrakarsa tidak ada di daftar RM/Mantri${w.namaTidakCocok && w.namaTidakCocok.length ? " (" + w.namaTidakCocok.slice(0, 5).map(x => esc(x[0]) + " " + x[1]).join(", ") + ")" : ""}.` : ""}</p>` : "";
  el.innerHTML = `<section class="panel" id="brsH" style="padding:12px 16px"><div class="panel-h"><h2>Brispot Briguna · Warm &amp; Hot Leads</h2><span class="sub">posisi ${pos}${jam ? " · pukul " + jam : ""} · Rp juta</span></div>${seg}
      <p class="note" style="margin:0">Warm = Prakarsa · Hot = Menunggu putusan + Approved + Menunggu pencairan (plafon) · Pencairan sukses = tanggal ${brsTgl(ren)} (plafon &amp; net OS) · 1 NIK dihitung 1 lead (status paling maju) · Gap Hot = Total Hot Plaf − Guidance · Gap Rencana = Net cair − Net rencana.</p>${warn}</section>
    <section class="panel" id="brsA"><div class="panel-h"><h2>Hot Leads Brispot Briguna per ${esc(T[4])} · urutan master</h2><span class="sub">${esc(T[1])}</span></div>${brsTable(BRS.tab, rows, ren)}</section>
    <section class="panel" id="brsB"><div class="panel-h"><h2>Hot Leads Brispot Briguna per ${esc(T[4])} · urut kirim (SORT BY)</h2><span class="sub">Pencairan Sukses Net ↓ · Total Hot ↓ · Warm ↓</span></div>
      <p class="note" style="margin:0">Posisi tanggal : ${pos}${jam ? " · Pukul : " + jam : ""}</p>${brsTable(BRS.tab, brsSorted(rows), ren)}
      <div class="brs-wa"><span id="brsWa">${esc(wa)}</span><button class="btn" type="button" id="brsCp">Salin teks</button></div></section>`;
  el.querySelectorAll("[data-brs]").forEach(b => b.onclick = () => { BRS.tab = b.dataset.brs; lsSet(STORE + "-brs", { tab: BRS.tab }); renderBrs(); if (window.Exp) Exp.decorate(el); });
  $("#brsCp").onclick = async () => { try { await navigator.clipboard.writeText(wa); toast("Teks disalin."); } catch { toast("Tidak bisa menyalin otomatis."); } };
}
// pasang wadah laporan di bawah panel pilihan segmen (hanya segmen Briguna)
function brsMount(v) {
  if (SEG.pipe !== "B") return;
  const first = v.firstElementChild; if (!first) return;
  const d = document.createElement("div"); d.id = "brsWrap"; d.className = "grid"; first.insertAdjacentElement("afterend", d);
  renderBrs();
}
