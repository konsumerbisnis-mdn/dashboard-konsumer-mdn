#!/usr/bin/env python3
"""Bangun js/app.js dan css/app.css dari kode Dashboard KPR (src/kpr.js, src/kpr.css) + modul Konsumer (src/parts)."""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
K = open(os.path.join(HERE, 'kpr.js'), encoding='utf8').read()
P = lambda f: open(os.path.join(HERE, 'parts', f), encoding='utf8').read()

def cut(a, b):
    i = K.index(a); j = K.index(b, i + 1) if b else len(K)
    return K[i:j]
def rep(s, a, b, cnt=1):
    n = s.count(a)
    assert n == cnt, (n, a[:120])
    return s.replace(a, b)

# ---------- util ----------
util = cut('/* ================= konstanta & util ================= */', '/* ================= data contoh ================= */')
util = rep(util, 'const STAGES = ["Prospek","Kunjungan","Pengajuan","Analisa","Putusan","Akad","Cair"];\n', '')
util = rep(util, 'const PRODUK = [["subsidi","KPR Subsidi (FLPP)"],["non_subsidi","KPR Non Subsidi"],["take_over","Take Over"],["top_up","Top Up"]];\n', '')
util = rep(util, 'const SLA_HARI = 14;\nconst STORE = "kpr-dash-v1";', 'const STORE = "ksm-dash-v1";')
util = rep(util, 'const pct = (v, d = 1) => (isFinite(v) ? [', 'const pct = (v, d = 1) => (v != null && isFinite(v) ? [')

chart = cut('/* ================= chart helpers ================= */', '/* ================= table helper ================= */')

tbl = cut('/* ================= table helper ================= */', '/* ================= komponen kecil ================= */')
tbl = rep(tbl, '  const st = opt.state || (el._sort = el._sort || { key: opt.sortKey, dir: opt.sortDir || -1 });\n',
          '  const st = opt.state || (el._sort = el._sort || { key: opt.sortKey, dir: opt.sortDir || -1 });\n  el._tbl = { cols, rows, foot: opt.foot };\n')
tbl = rep(tbl, '''  const dl = window.claude ? await window.claude.use("downloads").catch(() => null) : null;
  if (dl) { try { await dl.save({ filename: name, data: typeof data === "string" ? new Blob([data], { type }) : data }); toast("Tersimpan: " + name); } catch (e) { if (e && e.code !== "cancelled" && e.code !== "declined") toast("Unduhan tidak bisa dilakukan di sini."); } return; }
''', '')
tbl = rep(tbl, '''function exportCSV(name, cols, rows) {
''', '''function exportCSV(name, cols, rows) {
  if (XMODE === "xlsx") { const aoa = [cols.map(c => c[1]), ...rows.map(r => cols.map(c => { const v = r[c[0]]; return v == null ? "" : typeof v === "string" && /^'\\d/.test(v) ? v.slice(1) : v; }))];
    const ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data");
    saveFile(name + ".xlsx", new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })); return; }
''')

# laporan Brispot Warm/Hot (id brs*) tampil terbuka walau section Pipeline lain awalnya diminimize
tbl = rep(tbl, 'function secIsMin(view, sec) { const k = secKey(view, sec); return k in SEC_MIN ? SEC_MIN[k] : !!SEC_DEFAULT_MIN[view]; }',
          'function secIsMin(view, sec) { const k = secKey(view, sec); return k in SEC_MIN ? SEC_MIN[k] : !!SEC_DEFAULT_MIN[view] && !/^brs/.test(sec.id || ""); }')
comp = cut('/* ================= komponen kecil ================= */', '/* ================= VIEW: Beranda ================= */')
comp = rep(comp, '''  pipeline: '<svg viewBox="0 0 24 24"><path d="M3 4h18l-7 8v6l-4 2v-8z"/></svg>',''', '''  pipeline: '<svg viewBox="0 0 24 24"><path d="M3 4h18l-7 8v6l-4 2v-8z"/></svg>',
  nominatif: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h3M8 16h6M15 13h1"/></svg>',
  kualitas: '<svg viewBox="0 0 24 24"><path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/></svg>',''')
comp = rep(comp, '''const pipeItems = () => DB.pipeline.filter(byUnit).map(x => ({ ...x, umur: daysBetween(new Date(x.tgl_masuk), today()) }));
const umurChip = (u, tahap) => tahap === "Cair" ? chip("selesai", "neutral") : chip(u + " hr", u > SLA_HARI ? "crit" : u > SLA_HARI * .6 ? "warn" : "good");
''', '')

land = cut('/* ================= VIEW: Beranda ================= */', '// ---- lihat data cepat di halaman depan')

# ---------- keragaan ----------
ker = cut('/* ================= VIEW: Keragaan (dari Master Keragaan) ================= */', '/* ---------- impor file Master Keragaan ---------- */')
ker = rep(ker, 'let KER_LOADING = /^https?:/.test(location.protocol);\n', '')
ker = rep(ker, 'const KS = Object.assign({ date: null, area: "ALL", kc: "ALL", trend: "os", kpi: "all", kmode: "nom" }, lsGet(STORE + "-ker") || {});',
               'const KS = Object.assign({ date: null, area: "ALL", kc: "ALL", trend: "os", kpi: "all", kmode: "nom", prod: "konsumer", hlm: "ro" }, lsGet(STORE + "-ker") || {});')
a = ker.index('function kIdxBefore(d) {'); b = ker.index('// tabel KPI per KC: histori')
ker = ker[:a] + r'''function kIdxBefore(d) { const ds = KV.dates; let r = -1; for (let i = 0; i < ds.length && ds[i] < d; i++) r = i; return r; }
function kIdxOnOrBefore(d) { const ds = KV.dates; let r = -1; for (let i = 0; i < ds.length && ds[i] <= d; i++) r = i; return r; }
function kUnits() { return KV.units.map((u, i) => ({ ...u, i })).filter(u => (KS.area === "ALL" || u.area === KS.area) && (KS.kc === "ALL" || String(u.kcb ?? u.boc) === KS.kc)); }
function kSnap(di, us) {
  const o = { os: 0, sml: 0, npl: 0, deb: 0, dsml: 0, dnpl: 0 }; if (di < 0) return null;
  us.forEach(u => { for (const k in o) o[k] += KV.m[k][di]?.[u.i] || 0; });
  o.psml = o.os ? o.sml / o.os : 0; o.pnpl = o.os ? o.npl / o.os : 0; return o;
}
// RKA: bila seluruh uker dipilih pakai baris total (kode B / D), selain itu jumlah per uker; metrik tanpa RKA = null
function kRka(ym, us) {
  const r = KV.rka, mi = r ? r.months.indexOf(ym) : -1; if (mi < 0) return null;
  const full = us.length === KV.units.length, o = {};
  ["os", "sml", "npl", "deb"].forEach(k => {
    const t = r.T[k] ? r.T[k][mi] : null;
    if (full && t != null) { o[k] = t; return; }
    if (!r.P[k]) { o[k] = full && t != null ? t : null; return; }
    let v = 0, any = false; us.forEach(u => { const x = r.P[k][mi]?.[u.i]; if (x != null) { v += x; any = true; } }); o[k] = any ? v : null;
  });
  if (o.os == null && o.sml == null && o.npl == null && o.deb == null) return null;
  o.psml = o.os && o.sml != null ? o.sml / o.os : null; o.pnpl = o.os && o.npl != null ? o.npl / o.os : null; return o;
}
// indeks posisi: hari sebelumnya, akhir bulan lalu, akhir tahun lalu, tanggal sama tahun lalu
function kRefs(d) {
  const ds = KV.dates, di = ds.indexOf(d);
  return { di, dtd: di - 1, mtd: kIdxBefore(d.slice(0, 7) + "-01"), ytd: kIdxBefore(d.slice(0, 4) + "-01-01"), yoy: kIdxOnOrBefore((+d.slice(0, 4) - 1) + d.slice(4)) };
}
function kerSummary() {
  if (!DB.ker) return null;
  setKV("konsumer");
  const d = KV.dates[KV.dates.length - 1], us = KV.units.map((u, i) => ({ ...u, i })), r = kRefs(d);
  return { d, us, r, cur: kSnap(r.di, us), rka: kRka(d.slice(0, 7), us) };
}
const KPI_L = { all: "All", os: "OS", sml: "SML", npl: "NPL", deb: "Debitur", ts: "Time Series" };
// KC yang memiliki RM: Briguna Ritel dari list RM ritel, KPR dari produktivitas KPR (bulan posisi; cadangan daftar tetap). Produk lain tidak dikelompokkan.
const RM_KC_DEF = ["KC Binjai", "KC Gunung Sitoli", "KC Kabanjahe", "KC Kisaran", "KC Lubuk Pakam", "KC Medan Iskandar Muda", "KC Medan Putri Hijau", "KC Medan Sisingamangaraja", "KC Pematang Siantar", "KC Rantau Prapat", "KC Sibolga", "KC Stabat", "KC Tebing Tinggi"];
function kRmSet(ym) {
  const all = new Set(KV.units.map(u => normKey(u.nama)));
  const src = ["ritel", "karya", "purna", "prapurna"].includes(KV.p) ? DB.rmkSets.R : KV.p === "kpr" ? DB.rmkSets.K : null;
  if (!src || !src.months) return KV.p === "kpr" ? new Set(RM_KC_DEF.map(normKey)) : all;
  const ms = src.months.filter(x => x.tDisb > 0), yms = uniq(ms.map(x => x.ym)).filter(m => m <= ym).sort(), m = yms[yms.length - 1] || uniq(ms.map(x => x.ym)).sort()[0];
  const set = new Set(m ? ms.filter(x => x.ym === m).map(x => normKey(x.kc)) : []);
  return set.size ? set : KV.p === "kpr" ? new Set(RM_KC_DEF.map(normKey)) : all;
}
''' + ker[b:]
ker = rep(ker, '  const ds = DB.ker.dates, R = kRefs(d), ym = d.slice(0, 7), yr = d.slice(0, 4);\n  const lastOf', '  const ds = KV.dates, R = kRefs(d), ym = d.slice(0, 7), yr = d.slice(0, 4);\n  const lastOf')
ker = rep(ker, '  const ds = DB.ker.dates, R = kRefs(d), ym = d.slice(0, 7), day = +d.slice(8), yr = d.slice(0, 4);', '  const ds = KV.dates, R = kRefs(d), ym = d.slice(0, 7), day = +d.slice(8), yr = d.slice(0, 4);')
ker = rep(ker, '''  const capP = (akt, rka, up) => { let v; if (up) v = !rka ? 1.2 : akt / rka; else v = !akt ? 1.2 : !rka ? 0 : rka / akt; return Math.min(1.2, Math.max(0, v)); };''',
'''  const capP = (akt, rka, up) => { if (rka == null) return null; let v; if (up) v = !rka ? 1.2 : akt / rka; else v = !akt ? 1.2 : !rka ? 0 : rka / akt; return Math.min(1.2, Math.max(0, v)); };''')
ker = rep(ker, '''  const pc = v => `<td class="kp ${osCls(v)}">${pct(v, 2)}</td>`;''', '''  const pc = v => v == null ? `<td class="kp">–</td>` : `<td class="kp ${osCls(v)}">${pct(v, 2)}</td>`;''')
ker = rep(ker, '''pv = c => capP(c.cur[sk], c.rk?.[sk], sup);''', '''pv = c => capP(c.cur[sk], c.rk?.[sk], sup) ?? -1;''')
ker = rep(ker, '''    const c = calc(us), L = [["OS KPR", "os", 1, 0, 0], ["SML KPR", "sml", 0, 0, 0], ["% SML", "psml", 0, 1, 0], ["NPL KPR", "npl", 0, 0, 0], ["% NPL", "pnpl", 0, 1, 0], ["Debitur", "deb", 1, 0, 1]];''',
'''    const PS_ = prodS(KV.p), c = calc(us), L = [["OS " + PS_, "os", 1, 0, 0], ["SML " + PS_, "sml", 0, 0, 0], ["% SML", "psml", 0, 1, 0], ["NPL " + PS_, "npl", 0, 0, 0], ["% NPL", "pnpl", 0, 1, 0], ["Debitur", "deb", 1, 0, 1]];''')
ker = rep(ker, '''<th colspan="5">OS KPR</th>''', '''<th colspan="5">OS ${prodS(KV.p)}</th>''')
ker = rep(ker, '''<td class="sk1" colspan="${AC}">KC NON RM KPR</td>''', '''<td class="sk1" colspan="${AC}">KC NON RM ${grpL()}</td>''')
ker = rep(ker, '''<th rowspan="2" class="sk1">Kantor Cabang</th>''', '''<th rowspan="2" class="sk1">${KV.ud ? "Unit Dedicated" : "Kantor Cabang"}</th>''', 2)
ker = rep(ker, '''  const L = k === "sml" ? "SML" : "NPL";
  return `<h3 style="font-size:14px;margin:4px 0 8px">Time Series ${L} KPR${asPct ? " (rasio)" : ""}</h3>''', '''  const L = (k === "sml" ? "SML " : "NPL ") + prodS(KV.p);
  return `<h3 style="font-size:14px;margin:4px 0 8px">Time Series ${L}${asPct ? " (rasio)" : ""}</h3>''')
ker = rep(ker, '''<th colspan="5">Time Series ${L} KPR</th>''', '''<th colspan="5">Time Series ${L}</th>''')
ker = rep(ker, '''<tbody>${grp("KC RM KPR", g1)}${grp("KC NON RM KPR", g2)}''', '''<tbody>${g2.length ? grp("KC RM " + grpL(), g1) + grp("KC NON RM " + grpL(), g2) : g1.map(x => tr(esc(x.u.nama), x.c)).join("")}''')
# viewKeragaan
ker = rep(ker, '''  if (!DB.ker && KER_LOADING) { v.innerHTML = `<section class="panel"><div class="empty">Memuat data keragaan…</div></section>`; return; }
  if (!DB.ker) { v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data keragaan</p>Impor file <b>Master Keragaan</b> (sheet <code>Database</code> dan <code>Database RKA</code>) lewat tombol Data.</div><div class="toolbar" style="justify-content:center"><button class="btn primary" id="kImp" type="button">Impor Master Keragaan</button></div></section>`; $("#kImp").onclick = openData; return; }
  const K = DB.ker, ds = K.dates;''', '''  if (!DB.ker && KER_LOADING) { v.innerHTML = `<section class="panel"><div class="empty">Memuat data keragaan…</div></section>`; return; }
  if (!DB.ker) { v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data keragaan</p>Pastikan sheet <code>keragaan</code> dan <code>RKA</code> di Google Sheets sudah terisi, lalu tekan <b>Sync</b>.</div></section>`; return; }
  setKV(KS.prod); KS.prod = KV.p; const K = KV, ds = K.dates, PSn = prodS(KV.p), PL_ = prodL(KV.p);''')
ker = rep(ker, '''  const kcList = K.units.filter(u => KS.area === "ALL" || u.area === KS.area);
  if (KS.kc !== "ALL" && !kcList.some(u => String(u.boc) === KS.kc)) KS.kc = "ALL";''', '''  const kcList = (KV.ud ? uniq(K.units.map(u => u.kcb)).filter(Boolean).map(b => KC_BY.get(String(b))).filter(Boolean) : K.units).filter(u => KS.area === "ALL" || u.area === KS.area).sort((a, b) => a.nama.localeCompare(b.nama));
  if (KS.kc !== "ALL" && !kcList.some(u => String(u.boc) === KS.kc)) KS.kc = "ALL";''')
ker = rep(ker, '''  const scope = KS.kc !== "ALL" ? esc(K.units.find(u => String(u.boc) === KS.kc)?.nama) : KS.area !== "ALL" ? esc(areaS(KS.area)) : "Seluruh KC";''',
'''  const scopeU = KS.kc !== "ALL" ? esc(kcName(KS.kc)) : KS.area !== "ALL" ? esc(areaS(KS.area)) : "RO Medan (seluruh KC)";
  const scope = esc(PL_) + " · " + (KS.kc !== "ALL" ? esc(kcName(KS.kc)) : KS.area !== "ALL" ? esc(areaS(KS.area)) : KV.ud ? "seluruh unit dedicated" : "Seluruh KC");''')
ker = rep(ker, '''        <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Posisi</span>''', '''        <label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Produk</span><select class="ctl" id="kPr">${PRODS.map(([k, l]) => `<option value="${k}" ${KS.prod === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Posisi</span>''')
ker = rep(ker, '''      <p class="note" style="margin:0">${scope} · posisi ${tglS(d)} · kartu ringkasan dalam Rp miliar (M), tabel dalam Rp juta</p>''', '''      <p class="note" style="margin:0">${scope} · posisi ${tglS(d)} · kartu ringkasan dalam Rp miliar (M), tabel dalam Rp juta${isMidMonth(d) && isBrgProd(KV.p) ? " · <b>posisi bulan berjalan:</b> SML Briguna mengikuti tanggal gajian, bandingkan dengan tanggal yang sama bulan lalu" : ""}${KV.rka && !(KV.rka.has.sml || (KV.rka.T.sml && KV.rka.T.sml.some(x => x != null))) ? " · RKA " + esc(PSn) + " hanya tersedia untuk OS" : ""}</p>''')
ker = rep(ker, '''      ${tile({ label: "OS KPR", value: rpM(cur.os), sub: rk ? `${pct(cur.os / rk.os, 2)} dari RKA ${blnS(ym)} ${rpM(rk.os)}` : "RKA bulan ini belum ada", meter: rk ? cur.os / rk.os : null })}''',
'''      ${tile({ label: "OS " + esc(PSn), value: rpM(cur.os), sub: rk && rk.os ? `${pct(cur.os / rk.os, 2)} dari RKA ${blnS(ym)} ${rpM(rk.os)}` : "RKA bulan ini belum ada", meter: rk && rk.os ? cur.os / rk.os : null })}''')
ker = rep(ker, '''      ${tile({ label: "SML KPR", value: pct(cur.psml, 2), sub: `${rpM(cur.sml)}${rk ? " · RKA " + pct(rk.psml, 2) : ""} ${chip(rk ? "Penc " + pct(rk.sml / (cur.sml || 1), 0) : "–", lowCls(cur.sml, rk?.sml))}` })}
      ${tile({ label: "NPL KPR", value: pct(cur.pnpl, 2), sub: `${rpM(cur.npl)}${rk ? " · RKA " + pct(rk.pnpl, 2) : ""} ${chip(rk ? "Penc " + pct(rk.npl / (cur.npl || 1), 0) : "–", lowCls(cur.npl, rk?.npl))}` })}
      ${tile({ label: "Debitur KPR", value: nf0.format(cur.deb), sub: `MtD <span class="delta ${dCls(pm ? cur.deb - pm.deb : 0)}">${dN(pm ? cur.deb - pm.deb : 0)}</span>${rk ? ` · ${pct(cur.deb / rk.deb, 1)} dari RKA` : ""}`, meter: rk && rk.deb ? cur.deb / rk.deb : null })}''',
'''      ${tile({ label: "SML " + esc(PSn), value: pct(cur.psml, 2), sub: `${rpM(cur.sml)}${rk && rk.sml != null ? " · RKA " + pct(rk.psml, 2) + " " + chip("Penc " + pct(rk.sml / (cur.sml || 1), 0), lowCls(cur.sml, rk.sml)) : " · RKA –"}${cur.dsml ? ` · ${nf0.format(cur.dsml)} deb` : ""}` })}
      ${tile({ label: "NPL " + esc(PSn), value: pct(cur.pnpl, 2), sub: `${rpM(cur.npl)}${rk && rk.npl != null ? " · RKA " + pct(rk.pnpl, 2) + " " + chip("Penc " + pct(rk.npl / (cur.npl || 1), 0), lowCls(cur.npl, rk.npl)) : " · RKA –"}${cur.dnpl ? ` · ${nf0.format(cur.dnpl)} deb` : ""}` })}
      ${tile({ label: "Debitur " + esc(PSn), value: nf0.format(cur.deb), sub: `MtD <span class="delta ${dCls(pm ? cur.deb - pm.deb : 0)}">${dN(pm ? cur.deb - pm.deb : 0)}</span>${rk && rk.deb ? ` · ${pct(cur.deb / rk.deb, 1)} dari RKA` : ""}`, meter: rk && rk.deb ? cur.deb / rk.deb : null })}''')
ker = rep(ker, '''    </div>
    <section class="panel"><div class="panel-h"><div class="k-hlh"><h2>Highlight KPR${KS.kpi''', '''    </div>
    ${KV.ud ? "" : `<section class="panel" id="kHk"><div class="panel-h"><div class="k-hlh"><h2>Highlight Konsumer</h2><div class="seg" role="tablist" aria-label="Tingkat highlight">${[["ro", "RO / pilihan"], ["area", "Per area"], ["kc", "Per kanca"]].map(([k, l]) => `<button type="button" data-hlm="${k}" aria-selected="${KS.hlm === k}">${l}</button>`).join("")}</div></div><span class="sub">${KS.hlm === "ro" ? scopeU : KS.hlm === "area" ? "seluruh area" : KS.area !== "ALL" ? esc(areaS(KS.area)) : "seluruh kanca"} · Briguna Ritel, Briguna Mikro & KPR · posisi ${tglS(d)}</span></div><div id="kHkB"></div></section>`}
    <section class="panel"><div class="panel-h"><div class="k-hlh"><h2>Highlight KPR${KS.kpi''')
ker = rep(ker, '''<h2>Highlight KPR${KS.kpi !== "all" ? " · " + KPI_L[KS.kpi] : ""}</h2>''', '''<h2>Highlight ${esc(PL_)}${KS.kpi !== "all" ? " · " + KPI_L[KS.kpi] : ""}</h2>''')
ker = rep(ker, '''<h2>OS KPR vs RKA ${yr}</h2>''', '''<h2>OS ${esc(PSn)} vs RKA ${yr}</h2>''')
ker = rep(ker, '''${[["os","OS KPR"],["psml","% SML"],["pnpl","% NPL"],["deb","Debitur"]].map(''', '''${[["os","OS " + PSn],["psml","% SML"],["pnpl","% NPL"],["deb","Debitur"]].map(''')
ker = rep(ker, '''label: { os: "OS KPR", psml: "% SML", pnpl: "% NPL", deb: "Debitur" }[tk]''', '''label: { os: "OS " + PSn, psml: "% SML", pnpl: "% NPL", deb: "Debitur" }[tk]''')
ker = rep(ker, '''    <section class="panel"><div class="panel-h"><h2>Per kantor cabang</h2><div class="toolbar"><span class="sub">klik nama KC untuk detail</span><button class="btn" id="kExp" type="button">Ekspor CSV</button></div></div><div id="kKc"></div></section>`;''',
'''    ${["ritel", "brg", "konsumer"].includes(KV.p) ? `<section class="panel"><div class="panel-h"><h2>Komposisi produk</h2><span class="sub">${esc(PL_)} · posisi ${tglS(d)}</span></div><div id="kKom"></div></section>` : ""}
    <section class="panel"><div class="panel-h"><h2>${KV.ud ? "Per unit dedicated" : "Per kantor cabang"}</h2><div class="toolbar"><span class="sub">${KV.ud ? "unit Briguna Mikro dedicated" : "klik nama KC untuk detail"}</span><button class="btn" id="kExp" type="button">Ekspor CSV</button></div></div><div id="kKc"></div></section>`;''')
ker = rep(ker, '''  $("#kD").onchange = e => { KS.date = e.target.value; saveKS(); render(); };''', '''  $("#kD").onchange = e => { KS.date = e.target.value; saveKS(); render(); };
  $("#kPr").onchange = e => { KS.prod = e.target.value; saveKS(); render(); };
  v.querySelectorAll("[data-hlm]").forEach(b => b.onclick = () => { KS.hlm = b.dataset.hlm; saveKS(); hlDraw(); v.querySelectorAll("[data-hlm]").forEach(x => x.setAttribute("aria-selected", x === b)); });
  const hlDraw = () => { const el = $("#kHkB"); if (!el) return; const m = KS.hlm;
    el.innerHTML = hlKonsumer(d, m === "ro" ? (u => (KS.area === "ALL" || u.area === KS.area) && (KS.kc === "ALL" || String(u.boc) === KS.kc)) : (u => KS.area === "ALL" || u.area === KS.area), m); };
  hlDraw();''')
ker = rep(ker, '''  const kcCols = cols({ key: "name", label: "Kantor cabang", fmt: (x, r) => `<button class="linkish" data-kc="${r.boc}">${esc(x)}</button><br><small class="note">${r.boc} · ${esc(areaS(r.area).replace(/ · .*/, ""))}</small>` });''',
'''  const kcCols = cols({ key: "name", label: KV.ud ? "Unit" : "Kantor cabang", fmt: (x, r) => KV.ud ? `${esc(x)}<br><small class="note">${r.boc} · ${esc(kcName(r.kcb))}</small>` : `<button class="linkish" data-kc="${r.boc}">${esc(x)}</button><br><small class="note">${r.boc} · ${esc(areaS(r.area).replace(/ · .*/, ""))}</small>` });''')
ker = rep(ker, '''  const kr = us.filter(u => kSnap(R.di, [u]).os > 0).map(u => rowOf(u.nama, [u], { boc: u.boc, area: u.area }));''',
'''  const kr = us.filter(u => kSnap(R.di, [u]).os > 0).map(u => rowOf(u.nama, [u], { boc: u.boc, area: u.area, kcb: u.kcb }));''')
ker = rep(ker, '''  $("#kExp").onclick = () => exportCSV("keragaan-kpr-" + d,''', '''  if ($("#kKom")) {
    const parts = KV.p === "konsumer" ? ["karya", "purna", "prapurna", "mikro", "kpr"] : KV.p === "brg" ? ["karya", "purna", "prapurna", "mikro"] : ["karya", "purna", "prapurna"];
    const comp = parts.map(p => { const m = DB.ker.P[p]; const snap = k => us.reduce((a, u) => a + (m[k][R.di]?.[u.i] || 0), 0);
      const o = { p: prodL(p), os: snap("os"), sml: snap("sml"), npl: snap("npl"), deb: snap("deb") }; o.psml = o.os ? o.sml / o.os : 0; o.pnpl = o.os ? o.npl / o.os : 0; return o; });
    table($("#kKom"), [{ key: "p", label: "Produk" }, { key: "deb", label: "Debitur", r: 1, fmt: x => nf0.format(x) }, { key: "sd", label: "% deb", r: 1, sortVal: r => r.deb, fmt: (x, r) => pct(cur.deb ? r.deb / cur.deb : 0, 1) },
      { key: "os", label: "OS (M)", r: 1, fmt: x => nf2.format(x / 1000) }, { key: "so", label: "% OS", r: 1, sortVal: r => r.os, fmt: (x, r) => pct(cur.os ? r.os / cur.os : 0, 1) },
      { key: "sml", label: "SML (M)", r: 1, fmt: x => nf2.format(x / 1000) }, { key: "psml", label: "% SML", r: 1, fmt: x => pct(x, 2) }, { key: "npl", label: "NPL (M)", r: 1, fmt: x => nf2.format(x / 1000) }, { key: "pnpl", label: "% NPL", r: 1, fmt: x => chip(pct(x, 2), nplCls(x)) }], comp,
      { sortKey: "os", foot: { p: "Total", deb: nf0.format(cur.deb), sd: "100%", os: nf2.format(cur.os / 1000), so: "100%", sml: nf2.format(cur.sml / 1000), psml: pct(cur.psml, 2), npl: nf2.format(cur.npl / 1000), pnpl: pct(cur.pnpl, 2) } });
  }
  $("#kExp").onclick = () => exportCSV("keragaan-" + KV.p + "-" + d,''')

kimp = cut('/* ---------- impor file Master Keragaan ---------- */', 'function parseMaster(wb) {')

# ---------- produktivitas ----------
rm = cut('/* ================= VIEW: Produktivitas RM', '/* ---------- impor file Produktivitas RM ---------- */')
rm = rep(rm, 'let RM_LOADING = /^https?:/.test(location.protocol);\n', '')
rm = rep(rm, '''  const k = nmKey(name), src = DB.foto && DB.foto.map ? DB.foto.map[k] : null;''', '''  const k = nmKey(name), src = DB.foto && DB.foto.rm ? DB.foto.rm[k] : null;''')
rm = rep(rm, '''function viewRM(v) {
  if (!DB.rmk) {
    v.innerHTML = RM_LOADING ? `<section class="panel"><div class="empty">Memuat data produktivitas…</div></section>`
      : `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data produktivitas RM</p>Upload file <b>Produktivitas RM History</b> (sheet Database) lalu <b>Database bulan berjalan</b> lewat tombol Data.</div></section>`;
    return;
  }''', '''// ikon / logo kantor cabang dari sheet "RM & KC card"; tanpa ikon tampil gambar gedung
function kcAvatar(name, size = 104) {
  const src = DB.foto && DB.foto.kc ? DB.foto.kc[nmKey(name)] || (kcByName(name) ? DB.foto.kc[nmKey(kcByName(name).nama)] : null) : null;
  return src ? `<span class="av kc img" style="width:${size}px;height:${size}px"><img src="${src}" alt="Ikon ${esc(name)}" loading="lazy"></span>` : `<span class="av kc"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/></svg></span>`;
}
function viewRM(v) {
  useRM(SEG.rm);
  const segB = segBar(SEG.rm, [["R", "Briguna Ritel"], ["M", "Briguna Mikro"], ["K", "KPR"]], "data-rseg");
  const bindSeg = () => v.querySelectorAll("[data-rseg]").forEach(b => b.onclick = () => { if (SEG.rm === b.dataset.rseg) return; SEG.rm = b.dataset.rseg; saveSEG(); useRM(SEG.rm); RS.ym = null; RS.kc = "ALL"; RS.area = "ALL"; RS.selKc = null; RS.sel = null; saveRS(); render(); });
  if (!DB.rmk) {
    v.innerHTML = `<section class="panel" style="padding:12px 16px">${segB}</section>` + (RM_LOADING ? `<section class="panel"><div class="empty">Memuat data produktivitas…</div></section>`
      : `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data produktivitas ${esc(RL.seg)}</p>${SEG.rm === "K" ? "Isi sheet produktivitas KPR (<code>Database History</code> & <code>Database Monthly</code>) di Google Sheets lalu tekan <b>Sync</b>." : SEG.rm === "M" ? "Isi sheet <code>disburse mikro</code> & <code>list mantri mikro</code> lalu tekan <b>Sync</b>." : "Isi sheet <code>disburse ritel</code> & <code>list RM ritel</code> lalu tekan <b>Sync</b>."}</div></section>`);
    bindSeg(); return;
  }''')
rm = rep(rm, '''    <section class="panel" style="padding:12px 16px">
      <div class="rm-mode" role="group" aria-label="Lihat produktivitas">''', '''    <section class="panel" style="padding:12px 16px">
      ${segB}
      <div class="rm-mode" role="group" aria-label="Lihat produktivitas">''')
rm = rep(rm, '''  $("#rY").onchange = e => { RS.ym = e.target.value; saveRS(); render(); };''', '''  $("#rY").onchange = e => { RS.ym = e.target.value; saveRS(); render(); };
  bindSeg();''')
rm = rep(rm, '''<p class="note" style="margin:0">Disbursement ${per} · Rp juta · kuadran:''', '''<p class="note" style="margin:0">${esc(RL.seg)} · ${SEG.rm === "K" ? "disbursement" : "net disburse"} ${per} · Rp juta · kuadran:''')
rm = rep(rm, '''<span class="sub">Subsidi & Komersil</span>''', '''<span class="sub">${RL.s} & ${RL.k}</span>''')
rm = rep(rm, '''<h2>Komposisi Subsidi & Komersil</h2>''', '''<h2>Komposisi ${RL.s} & ${RL.k}</h2>''')
rm = rep(rm, '''· ${x.deb} deb (S ${x.sDeb} · K ${x.kDeb}) ·''', '''· ${x.deb} deb (${RL.s[0]} ${x.sDeb} · ${RL.k[0]} ${x.kDeb}) ·''')
rm = rep(rm, '''["sDeb","Deb subsidi"],["sOs","Subsidi (juta)"],["kDeb","Deb komersil"],["kOs","Komersil (juta)"]]''', '''["sDeb","Deb " + RL.s.toLowerCase()],["sOs",RL.s + " (juta)"],["kDeb","Deb " + RL.k.toLowerCase()],["kOs",RL.k + " (juta)"]]''')
rm = rep(rm, '''exportCSV("produktivitas-rm-" + ym,''', '''exportCSV("produktivitas-" + RL.seg.toLowerCase().replace(/\\W+/g, "-") + "-" + ym,''')
rm = rep(rm, '''  const sk = [["Subsidi", sum(rows, "sOs"), sum(rows, "sDeb"), s1], ["Komersil", sum(rows, "kOs"), sum(rows, "kDeb"), s2]];''', '''  const sk = [[RL.s, sum(rows, "sOs"), sum(rows, "sDeb"), s1], [RL.k, sum(rows, "kOs"), sum(rows, "kDeb"), s2]];''')
rm = rep(rm, '''    { type: "bar", label: "Subsidi", data: mAgg.map(x => x.s),''', '''    { type: "bar", label: RL.s, data: mAgg.map(x => x.s),''')
rm = rep(rm, '''    { type: "bar", label: "Komersil", data: mAgg.map(x => x.k),''', '''    { type: "bar", label: RL.k, data: mAgg.map(x => x.k),''')
rm = rep(rm, '''<h2>Peringkat RM</h2>''', '''<h2>Peringkat ${RL.who}</h2>''')
rm = rep(rm, '''tile({ label: "RM capai target",''', '''tile({ label: RL.who + " capai target",''')
rm = rep(rm, '''<h2>History kuadran RM ${yr}</h2>''', '''<h2>History kuadran ${RL.who} ${yr}</h2>''')
rm = rep(rm, '''txS = tx.filter(t => t.jenis === "KPRS"), txK = tx.filter(t => t.jenis !== "KPRS");''', '''txS = tx.filter(t => RL.isS(t)), txK = tx.filter(t => !RL.isS(t));''')
rm = rep(rm, '''      ${isKc ? `<span class="av kc"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/></svg></span>` : rmAvatar(RS.sel, 104)}''', '''      ${isKc ? kcAvatar(RS.selKc, 104) : rmAvatar(RS.sel, 104)}''')
rm = rep(rm, '''"Relationship Manager KPR"''', '''RL.role''')
rm = rep(rm, '''<span>Subsidi ${nf0.format(coSD)} deb · Komersil ${nf0.format(coKD)} deb</span>''', '''<span>${RL.s} ${nf0.format(coSD)} deb · ${RL.k} ${nf0.format(coKD)} deb</span>''')
rm = rep(rm, '''· Subsidi ${rpJ(coS)} (${coSD} deb) · Komersil ${rpJ(coKm)} (${coKD} deb)''', '''· ${RL.s} ${rpJ(coS)} (${coSD} deb) · ${RL.k} ${rpJ(coKm)} (${coKD} deb)''')
rm = rep(rm, '''<p class="note" style="margin:0">Subsidi = KPR Sejahtera (FLPP); Komersil = Tier 1–3, Secondary, Take Over & Top Up. Kuadran:''', '''<p class="note" style="margin:0">${RL.note} Kuadran:''')
rm = rep(rm, '''    { key: "sub", label: "Subsidi", r: 1, fmt: (x, r) => cell(x, r.dSub) },
    { key: "kom", label: "Komersil", r: 1, fmt: (x, r) => cell(x, r.dKom) },''', '''    { key: "sub", label: RL.s, r: 1, fmt: (x, r) => cell(x, r.dSub) },
    { key: "kom", label: RL.k, r: 1, fmt: (x, r) => cell(x, r.dKom) },''')
rm = rep(rm, '''{ key: "sub", label: "Subsidi", r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: "Komersil", r: 1, fmt: x => nf1.format(x) }''', '''{ key: "sub", label: RL.s, r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: RL.k, r: 1, fmt: x => nf1.format(x) }''')
rm = rep(rm, '''  const ds = [["Subsidi", "sub", cssv("--s1")], ["Komersil", "kom", cssv("--s2")]].map(''', '''  const ds = [[RL.s, "sub", cssv("--s1")], [RL.k, "kom", cssv("--s2")]].map(''')
rm = rep(rm, '''<span class="note" style="font-weight:700">Nama RM</span>''', '''<span class="note" style="font-weight:700">Nama ${RL.who}</span>''')
# tabel Produktivitas Nett RM / Mantri Briguna (parts/rm_nett.js), untuk segmen Ritel dan Mikro
rm = rep(rm, '''    <section class="panel" id="rPer"></section>''', '''    ${SEG.rm !== "K" ? '<section class="panel" id="rNett"></section>' : ""}
    <section class="panel" id="rPer"></section>''')
rm = rep(rm, '''  renderRMPer(inScope);
''', '''  renderRMPer(inScope);
  if (SEG.rm !== "K") renderRmNett({ P, inScope, ym, isCur });
''')

# tema grafik (src/parts/charts.js): palet seragam + label angka
chart = rep(chart, '  charts[id] = new Chart(el, cfg);', '  charts[id] = new Chart(el, chartTheme(cfg));')
chart = rep(chart, 'family: cssv("--f-num")', 'family: cssv("--f-body")', 2)

# laporan disburse realisasi harian (src/parts/rm_rep.js) di atas bagian perbandingan
rm = rep(rm, '''    <section class="panel" id="rCmp"></section>''', '''    <section class="panel" id="rDay"></section>
    <section class="panel" id="rCmp"></section>''')
rm = rep(rm, '''  renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day });
  const allYm''', '''  renderRMDaily({ P, txIn, ym, isCur, day });
  renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day });
  renderRMAppx({ P, txIn, ym, isCur, day, inScope, yr });
  const allYm''')
# perbandingan: hanya tahun lalu vs tahun ini (bulan berjalan vs 3 bulan lalu sudah ada di laporan harian; per cabang/RM jadi lampiran)
rm = rep(rm, 'const mode = RS.cmp === "yoy" ? "yoy" : "mtd", grp', 'const mode = "yoy", grp')
# tabel YtD per cabang / RM dipindah ke Lampiran 2
i0 = rm.index('    <div class="panel-h" style="margin-top:6px"><h3 style="font-size:14px">${yo ?'); i1 = rm.index('<div id="tCmpG"></div>', i0) + len('<div id="tCmpG"></div>')
rm = rm[:i0].rstrip() + rm[i1:]
rm = rep(rm, 'table($("#tCmpG"), [{ key: "k"', 'if ($("#tCmpG")) table($("#tCmpG"), [{ key: "k"', 2)
rm = rep(rm, '''<h2>Perbandingan disbursement</h2><div class="seg" role="tablist" aria-label="Jenis perbandingan">
      <button type="button" role="tab" aria-selected="${!yo}" data-cmp="mtd">Bulan berjalan vs 3 bulan lalu</button><button type="button" role="tab" aria-selected="${yo}" data-cmp="yoy">${y1} vs ${yr}</button></div></div>''', '''<h2>Perbandingan disbursement ${y1} vs ${yr}</h2></div>''')
rm = rep(rm, '''<span class="sub">per bulan</span></div><div id="rHq"></div></section>`;''', '''<span class="sub">per bulan</span></div><div id="rHq"></div></section>
    <section class="panel" id="rApx" data-nosec></section>`;''')
# peringkat RM: bulan berjalan atau carry over (Jan s.d. batas carry over yang sama dengan Pencapaian per RM)
rm = rep(rm, 'pm: "rm", selYr: null, co: "berjalan" }', 'pm: "rm", selYr: null, co: "berjalan", rkm: "m", apxG: "kc" }')
rm = rep(rm, '''<div class="toolbar"><span class="sub">garis = 100% target · klik nama untuk lihat pencapaiannya</span>''', '''<div class="toolbar"><div class="seg" role="tablist" aria-label="Dasar peringkat"><button type="button" role="tab" aria-selected="${RS.rkm !== "co"}" data-rkm="m">Bulan berjalan</button><button type="button" role="tab" aria-selected="${RS.rkm === "co"}" data-rkm="co">Carry over</button></div><span class="sub" id="rLbS">garis = 100% target · klik nama untuk lihat pencapaiannya</span>''')
rm = rep(rm, '''  const lb = [...rows].sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os);''', '''  const coEnd = (RS.co === "des" ? 12 : +RS.co) || (yr < (P.asof || "9").slice(0, 4) ? 12 : +(P.asof || "").slice(5, 7) || 12), isCo = RS.rkm === "co";
  const coMs = Array.from({ length: coEnd }, (_, i) => yr + "-" + String(i + 1).padStart(2, "0"));
  const coRows = () => uniq(P.months.filter(x => coMs.includes(x.ym) && inScope(x) && (x.tDisb > 0 || x.os > 0)).map(x => nmKey(x.rm))).map(k => {
    const a = P.months.filter(x => coMs.includes(x.ym) && inScope(x) && nmKey(x.rm) === k), l = a[a.length - 1];
    const o = { rm: l.rm, kc: l.kc, jg: l.jg, tDisb: sum(a, "tDisb"), tDeb: sum(a, "tDeb"), os: sum(a, "os"), deb: sum(a, "deb"), sDeb: sum(a, "sDeb"), sOs: sum(a, "sOs"), kDeb: sum(a, "kDeb"), kOs: sum(a, "kOs") };
    o.pen = o.tDisb ? o.os / o.tDisb : null; return o; });
  const lb = [...(isCo ? coRows() : rows)].sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os);
  $("#rLbS").textContent = (isCo ? `carry over Jan s.d. ${BULAN[coEnd - 1]} ${yr} · ` : `${ymS(ym)} · `) + "garis = 100% target · klik nama untuk lihat pencapaiannya";
  v.querySelectorAll("[data-rkm]").forEach(b => b.onclick = () => { if (RS.rkm === b.dataset.rkm) return; RS.rkm = b.dataset.rkm; saveRS(); render(); });''')
rm = rep(rm, '''.replace(/\\W+/g, "-") + "-" + ym,''', '''.replace(/\\W+/g, "-") + "-" + (isCo ? "carry-over-" + yr + "-" + String(coEnd).padStart(2, "0") : ym),''')
# peringkat: pilih bulan sendiri + histori kuadran 5 bulan sebelum bulan itu (carry over: sebelum bulan batas carry over)
rm = rep(rm, """co: "berjalan", rkm: "m", apxG: "kc" }""", """co: "berjalan", rkm: "m", rkMonth: null, apxG: "kc" }""")
rm = rep(rm, """$("#rY").onchange = e => { RS.ym = e.target.value; saveRS(); render(); };""", """$("#rY").onchange = e => { RS.ym = e.target.value; RS.rkMonth = null; saveRS(); render(); };""")
rm = rep(rm, """const ym = RS.ym, yr = ym.slice(0, 4), isCur = P.asof && P.asof.startsWith(ym), day = isCur ? +P.asof.slice(8) : 31;""",
         """const ym = RS.ym, yr = ym.slice(0, 4), isCur = P.asof && P.asof.startsWith(ym), day = isCur ? +P.asof.slice(8) : 31;
  const rkYm = yms.includes(RS.rkMonth) ? RS.rkMonth : ym;""")
rm = rep(rm, """data-rkm="m">Bulan berjalan</button><button type="button" role="tab" aria-selected="${RS.rkm === "co"}" data-rkm="co">Carry over</button></div>""",
         """data-rkm="m">Pilih bulan</button><button type="button" role="tab" aria-selected="${RS.rkm === "co"}" data-rkm="co">Carry over</button></div>${RS.rkm === "co" ? "" : `<select class="ctl rk-sel" id="rkMonth" aria-label="Pilih bulan peringkat">${[...yms].reverse().map(m => `<option value="${m}" ${m === rkYm ? "selected" : ""}>${ymS(m)}${P.asof && P.asof.startsWith(m) ? " (berjalan)" : ""}</option>`).join("")}</select>`}""")
rm = rep(rm, """  const lb = [...(isCo ? coRows() : rows)].sort(""", """  const rowsRk = rkYm === ym ? rows : P.months.filter(x => x.ym === rkYm && inScope(x) && (x.tDisb > 0 || x.os > 0)).map(x => ({ ...x, pen: x.tDisb ? x.os / x.tDisb : null }));
  const lb = [...(isCo ? coRows() : rowsRk)].sort(""")
rm = rep(rm, """`${ymS(ym)} · `) + "garis = 100% target""", """`${ymS(rkYm)} · `) + "garis = 100% target""")
rm = rep(rm, """RS.rkm = b.dataset.rkm; saveRS(); render(); });""", """RS.rkm = b.dataset.rkm; saveRS(); render(); });
  { const rs = $("#rkMonth"); if (rs) rs.onchange = e => { RS.rkMonth = e.target.value; RS.rkm = "m"; saveRS(); render(); }; }""")
rm = rep(rm, """String(coEnd).padStart(2, "0") : ym),""", """String(coEnd).padStart(2, "0") : rkYm),""")
rm = rep(rm, """const last6 = (() => { const out = []; for (let i = 5; i >= 0; i--) { const d = new Date(+yr, +ym.slice(5, 7) - 1 - i, 1); out.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")); } return out; })();""",
         """const rkBase = isCo ? yr + "-" + String(coEnd).padStart(2, "0") : rkYm;
  const hist5 = (() => { const out = []; for (let i = 5; i >= 1; i--) { const d = new Date(+rkBase.slice(0, 4), +rkBase.slice(5, 7) - 1 - i, 1); out.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")); } return out; })();""")
rm = rep(rm, """const kOf = (rm, m) => { const r = P.months.find(x => x.ym === m && nmKey(x.rm) === nmKey(rm)); return r && r.tDisb ? kuadOf(r.os / r.tDisb) : null; };""",
         """const kOf = (rm, m) => { const r = P.months.find(x => x.ym === m && nmKey(x.rm) === nmKey(rm)); return r && r.tDisb ? kuadOf(r.os / r.tDisb) : null; };
  const histChip = (rm, m) => { const r = P.months.find(x => x.ym === m && nmKey(x.rm) === nmKey(rm)), p = r && r.tDisb ? r.os / r.tDisb : null; return `<span class="rk-h" title="${ymS(m)}: ${p == null ? "tanpa target" : pct(p, 0)}"><small>${BULAN[+m.slice(5, 7) - 1]}</small>${kq(kuadOf(p))}</span>`; };
  $("#rLbS").textContent += ` · histori kuadran ${ymS(hist5[0])}–${ymS(hist5[4])}`;""")
rm = rep(rm, """${last6.map(m => kq(kOf(x.rm, m))).join("")}""", """<span class="rk-hist">${hist5.map(m => histChip(x.rm, m)).join("")}</span>""")
# pencapaian per RM / cabang: rincian bulanan (grafik & tabel Jan s.d. Des, RM di cabang) disembunyikan, dibuka bila perlu
rm = rep(rm, '''    <div class="chart"><canvas id="cRmPer"></canvas></div>
    <div id="tRmPer"></div>''', '''    <details class="rm-more" ${RS.perOpen ? "open" : ""}><summary>Rincian per bulan ${yr}${isKc ? " & RM di cabang" : ""} <small class="note">grafik & tabel Jan–Des, carry over ${coLbl}</small></summary>
    <div class="chart"><canvas id="cRmPer"></canvas></div>
    <div id="tRmPer"></div>''')
rm = rep(rm, '''<div id="tKcRm"></div>` : ""}''', '''<div id="tKcRm"></div>` : ""}
    </details>''')
rm = rep(rm, '''    const tg = $(isKc ? "#tKcRm" : "#tRmPer"); if (!tg) return;''', '''    const dt = el.querySelector("details.rm-more"); if (dt && !dt.open) dt.open = true;
    const tg = $(isKc ? "#tKcRm" : "#tRmPer"); if (!tg) return;''')
rm = rep(rm, '''  $("#pRmCo").onchange = e => { RS.co = e.target.value; saveRS(); renderRMPer(); };''', '''  $("#pRmCo").onchange = e => { RS.co = e.target.value; saveRS(); if (RS.rkm === "co") render(); else renderRMPer(); };
  { const dt = el.querySelector("details.rm-more"); if (dt) dt.ontoggle = () => { RS.perOpen = dt.open; if (dt.open && charts.cRmPer) charts.cRmPer.resize(); }; }''')


# ---------- pipeline ----------
pipe = cut('/* ================= VIEW: Pipeline Brispot', '// gabungkan data baru ke riwayat')
pipe = rep(pipe, 'let PIPE_LOADING = /^https?:/.test(location.protocol);\n', '')
pipe = rep(pipe, '''const kcArea = kc => { const u = DB.ker && DB.ker.units.find(u => u.nama.toLowerCase() === String(kc).toLowerCase()); return u ? u.area : ""; };\n''', '')
pipe = rep(pipe, '''function viewPipeline(v) {
  if (!DB.pipe) {
    v.innerHTML = PIPE_LOADING ? `<section class="panel"><div class="empty">Memuat data pipeline…</div></section>`
      : `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data pipeline</p>Upload file <b>Pipeline BRISPOT</b> (sheet Pipeline, OnHand, Ref_Batal, Rencana Realisasi RM) lewat tombol Data.</div></section>`;
    return;
  }''', '''function viewPipeline(v) {
  usePipe(SEG.pipe);
  const segB = segBar(SEG.pipe, [["B", "Briguna Ritel & Mikro"], ["K", "KPR"]], "data-pseg");
  const bindSeg = () => v.querySelectorAll("[data-pseg]").forEach(b => b.onclick = () => { if (SEG.pipe === b.dataset.pseg) return; SEG.pipe = b.dataset.pseg; saveSEG(); usePipe(SEG.pipe); PS.jenis = "ALL"; PS.kc = "ALL"; PS.rm = "ALL"; savePS(); render(); });
  if (PS.jenis !== "ALL" && !PL.j.includes(PS.jenis)) PS.jenis = "ALL";
  if (!DB.pipe) {
    v.innerHTML = `<section class="panel" style="padding:12px 16px">${segB}</section>` + (PIPE_LOADING ? `<section class="panel"><div class="empty">Memuat data pipeline…</div></section>`
      : `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data pipeline ${esc(PL.seg)}</p>${isAdmin() ? "Upload file <b>Pipeline BRISPOT</b> lewat menu Admin → Kelola data." : "Hubungi admin untuk upload Pipeline BRISPOT."}</div></section>`);
    bindSeg(); return;
  }''')
pipe = rep(pipe, '''    <section class="panel" style="padding:12px 16px">
      <div class="toolbar">
        ${sel("pA", "Area", "Semua area", areas, PS.area, areaS)}''', '''    <section class="panel" style="padding:12px 16px">
      ${segB}
      <div class="toolbar">
        ${sel("pA", "Area", "Semua area", areas, PS.area, areaS)}''')
pipe = rep(pipe, '''${sel("pJ", "Jenis", "Subsidi & Komersil", ["Subsidi", "Komersil"], PS.jenis)}''', '''${sel("pJ", "Jenis", PL.j.join(" & "), PL.j, PS.jenis)}''')
pipe = rep(pipe, '''<p class="note" style="margin:0">Posisi pipeline ${tglS(asof)} · plafon dalam Rp''', '''<p class="note" style="margin:0">${esc(PL.seg)} · posisi pipeline ${tglS(asof)}${P.masked ? " · <b>nama debitur disembunyikan untuk Guest</b>" : P.scoped ? " · berkas pemrakarsa Anda" : ""} · plafon dalam Rp''')
pipe = rep(pipe, '''  const go = () => { savePS(); render(); };''', '''  const go = () => { savePS(); render(); };
  bindSeg();''')
pipe = rep(pipe, '''s: sum(a.filter(x => x.jenis === "Subsidi"), "plafon"), k: sum(a.filter(x => x.jenis === "Komersil"), "plafon")''', '''s: sum(a.filter(x => x.jenis === PL.j[0]), "plafon"), k: sum(a.filter(x => x.jenis === PL.j[1]), "plafon")''')
pipe = rep(pipe, '''background:var(--s1);margin-right:5px"></i>Subsidi</span>''', '''background:var(--s1);margin-right:5px"></i>${PL.j[0]}</span>''')
pipe = rep(pipe, '''background:var(--s2);margin-right:5px"></i>Komersil</span>''', '''background:var(--s2);margin-right:5px"></i>${PL.j[1]}</span>''')
pipe = rep(pipe, '''datasets: ["Subsidi", "Komersil"].map((j, k) =>''', '''datasets: PL.j.map((j, k) =>''')
# tabel format laporan (src/parts/pipe_rep.js): rencana realisasi per minggu, rekap per KC per tahap, ringkasan jadwal akad
pipe = rep(pipe, 'tahap: "ALL", usia: "ALL", q: "", batal: false }, lsGet(STORE + "-pipe") || {});', 'tahap: "ALL", usia: "ALL", q: "", batal: false, akad: [], prosesM: [], jenisM: [] }, lsGet(STORE + "-pipe") || {});\n["akad", "prosesM", "jenisM"].forEach(k => { if (!Array.isArray(PS[k])) PS[k] = []; });\nPS.proses = "ALL"; PS.batal = false;')
i0 = pipe.index('  // rencana realisasi RM\n'); i2 = pipe.index('  // per RM\n')
pipe = pipe[:i0] + '  if ($("#pRen")) pipeRencana($("#pRen"), P.rencana);\n\n  pipeKcRekap($("#pKc"), aktif);\n\n' + pipe[i2:]
pipe = rep(pipe, '<h2>Rekap per kantor cabang</h2><span class="sub">debitur / plafon (Rp juta)</span>', '<h2>Rekap per kantor cabang</h2><span class="sub">debitur / plafon (Rp juta) per tahap</span>')
pipe = rep(pipe, '''        <select class="ctl" id="pP"><option value="ALL">HOT/WARM/COLD</option>${["HOT", "WARM", "COLD"].map(p => `<option ${PS.proses === p ? "selected" : ""}>${p}</option>`).join("")}</select>
        <label class="check"><input type="checkbox" id="pB" ${PS.batal ? "checked" : ""}> Tampilkan batal</label>
      </div>
      <div id="pList"></div>''', '''        <div id="pPr"></div>
        <div id="pJn"></div>
        <div id="pAk"></div>
      </div>
      <div id="pAkS" class="ak-sum" hidden></div>
      <div id="pList"></div>''')
pipe = rep(pipe, '''    const rows = pipeFilter(base);
    table($("#pList"),''', '''    const all = pipeFilter(base, { noProses: true, withBatal: true }).filter(x => prosesIn(x) && jenisIn(x)), rows = PS.akad.length ? all.filter(x => x.akad && PS.akad.includes(x.akad)) : all;
    pipeAkadSum($("#pAkS"), rows);
    table($("#pList"),''')
pipe = rep(pipe, '''  draw();
  $("#pq").oninput''', '''  // pilihan jadwal akad: tanggal dari pipeline aktif dalam saringan area/KC/RM/jenis
  const akD = uniq(aktif.filter(x => x.akad).map(x => x.akad)).sort();
  PS.akad = PS.akad.filter(d => akD.includes(d));
  msPicker($("#pAk"), "akad", akD.map(d => [d, tglS(d), aktif.filter(x => x.akad === d).length]), "Semua jadwal akad", d => tglS(d).replace(/ \\d{4}$/, ""), () => { savePS(); draw(); });
  const lst = pipeFilter(base, { noProses: true, withBatal: true });
  PS.prosesM = PS.prosesM.filter(p => ["HOT", "WARM", "COLD", "BATAL"].includes(p)); PS.jenisM = PS.jenisM.filter(j => PL.j.includes(j));
  msPicker($("#pPr"), "prosesM", ["HOT", "WARM", "COLD", "BATAL"].map(p => [p, chip(p, p === "BATAL" ? "crit" : prosesCls(p)), lst.filter(x => p === "BATAL" ? x.batal : !x.batal && x.proses === p).length]), "HOT/WARM/COLD/BATAL", p => p, () => { savePS(); draw(); });
  msPicker($("#pJn"), "jenisM", PL.j.map(j => [j, j, lst.filter(x => !x.batal && x.jenis === j).length]), PL.j.join(" & "), j => j, () => { savePS(); draw(); });
  draw();
  $("#pq").oninput''')
pipe = rep(pipe, '''  $("#pP").onchange = e => { PS.proses = e.target.value; savePS(); draw(); };
''', '')
pipe = rep(pipe, '''  $("#pB").onchange = e => { PS.batal = e.target.checked; savePS(); draw(); };
''', '')
pipe = rep(pipe, '''exportCSV("pipeline-brispot-" + asof,''', '''exportCSV("pipeline-brispot-" + (SEG.pipe === "K" ? "kpr" : "briguna") + "-" + asof,''')

# laporan Brispot Briguna (Warm/Hot Leads, parts/brispot_brs.js): wadah dipasang di bawah panel segmen, hanya untuk Briguna
pipe = rep(pipe, """    bindSeg(); return;
  }
  const P = DB.pipe, base""", """    brsMount(v); bindSeg(); return;
  }
  const P = DB.pipe, base""")
pipe = rep(pipe, """  const go = () => { savePS(); render(); };
  bindSeg();
""", """  const go = () => { savePS(); render(); };
  brsMount(v); bindSeg();
""")
pimp = cut('/* ---------- impor file Pipeline BRISPOT ---------- */', '/* ================= VIEW: Simulasi KPR')
pimp = rep(pimp, 'function parsePipeline(wb) {', 'function parsePipeline(wb, set = "K") {\n  const brgJ = (...v) => /mikro|\\bunit\\b/i.test(v.filter(x => x != null).map(String).join(" ")) ? "Mikro" : "Ritel";')
pimp = rep(pimp, '''      jenis: /flpp|subsidi/i.test(deb) || (plafon > 0 && plafon <= 185) ? "Subsidi" : "Komersil" };''',
'''      jenis: set === "B" ? brgJ(g(r, "produk"), g(r, "jenis_produk"), g(r, "nama_produk"), g(r, "segmen"), g(r, "segment"), g(r, "nama_branch")) : /flpp|subsidi/i.test(deb) || (plafon > 0 && plafon <= 185) ? "Subsidi" : "Komersil" };''')
pimp = rep(pimp, '''jenis: /subsidi/i.test(jal) ? "Subsidi" : /komersil/i.test(jal) ? "Komersil" : plafon <= 185 ? "Subsidi" : "Komersil" }); });''',
'''jenis: set === "B" ? brgJ(o("produk"), o("jenis_produk"), o("segmen"), jal, o("kantor_cabang")) : /subsidi/i.test(jal) ? "Subsidi" : /komersil/i.test(jal) ? "Komersil" : plafon <= 185 ? "Subsidi" : "Komersil" }); });''')

sim = cut('/* ================= VIEW: Simulasi KPR', '/* ================= router & shell ================= */')
sim = rep(sim, 'let RATE_LOADING = /^https?:/.test(location.protocol);\n', '')
sim = rep(sim, '''Upload file <b>Tabel Perhitungan Suku Bunga KPR</b> lewat tombol Data.''', '''${isAdmin() ? "Upload file <b>Tabel Perhitungan Suku Bunga KPR</b> lewat menu Admin → Kelola data." : "Hubungi admin untuk upload tabel suku bunga KPR."}''')
assert 'DSR' in sim
sim = sim.replace('DSR', 'RPC')

zoom = cut('// zoom tabel di HP', '// mulai aplikasi; bila data/pengaturan lama')
intro = cut('/* ---------- animasi pembuka', None)
intro = rep(intro, '''    setTimeout(() => { el.hidden = true; }, 620);''', '''    setTimeout(() => { el.hidden = true; if (!$("#login").hidden) $("#lgUser").focus(); }, 620);''')

start = '''
/* ---------- mulai ---------- */
(async function start() {
  document.title = window.APP_CONFIG.APP_NAME || "Dashboard Konsumer";
  let s = null; try { s = await Auth.loadSession(); } catch {}
  if (s) { Auth.startIdle(); enterApp(); } else showLogin();
  window.__appReady = true;
})();
'''
js = '\n(() => {\n"use strict";\n' + util + P('master.js') + P('state.js') + chart + P('charts.js') + tbl + comp + land + P('beranda.js') + P('kerprep.js') + ker + kimp + rm + P('rm_rep.js') + P('rm_nett.js') + pipe + P('brispot_brs.js') + P('pipe_rep.js') + pimp + sim \
     + P('sim_brg.js') + P('nominatif.js') + P('ker_up.js') + P('admin.js') + P('export.js') + P('router.js') + P('foto_zoom.js') + P('land_fit.js') + zoom + P('boot.js') + start + intro
# bagian bertanda data-nosec (mis. Lampiran, yang sudah punya buka-tutup per lampiran) tidak diberi tombol minimize
js = rep(js, '''const secs = [...v.querySelectorAll("section.panel")].filter(x => x.querySelector(":scope > .panel-h"));''', '''const secs = [...v.querySelectorAll("section.panel")].filter(x => x.querySelector(":scope > .panel-h") && !x.hasAttribute("data-nosec"));''')
open(os.path.join(ROOT, 'js', 'app.js'), 'w', encoding='utf8').write(js)
css = open(os.path.join(HERE, 'kpr.css'), encoding='utf8').read() + '\n' + P('extra.css')
open(os.path.join(ROOT, 'css', 'app.css'), 'w', encoding='utf8').write(css)
# versi di tautan index.html (hash isi) supaya browser/CDN tidak memakai app.js / app.css lama sesudah update
import hashlib, re
ix = os.path.join(ROOT, 'index.html'); h = open(ix, encoding='utf8').read()
vj = hashlib.md5(js.encode('utf8')).hexdigest()[:8]; vc = hashlib.md5(css.encode('utf8')).hexdigest()[:8]
h = re.sub(r'js/app\.js(\?v=\w+)?"', 'js/app.js?v=' + vj + '"', h); h = re.sub(r'css/app\.css(\?v=\w+)?"', 'css/app.css?v=' + vc + '"', h)
open(ix, 'w', encoding='utf8').write(h)
print('app.js', len(js), 'app.css', len(css))
