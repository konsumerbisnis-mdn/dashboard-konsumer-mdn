
(() => {
"use strict";
/* ================= konstanta & util ================= */
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const STORE = "ksm-dash-v1";
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sum = (arr, k) => arr.reduce((a, x) => a + (+x[k] || 0), 0);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uniq = a => [...new Set(a)];
const nf0 = new Intl.NumberFormat("id-ID", {maximumFractionDigits: 0});
const nf1 = new Intl.NumberFormat("id-ID", {minimumFractionDigits: 1, maximumFractionDigits: 1});
const nf2 = new Intl.NumberFormat("id-ID", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const perLabel = k => { const [y, m] = String(k).split("-"); return (BULAN[+m - 1] || m) + " " + y; };
// nominal dalam juta rupiah
function rp(j) {
  const a = Math.abs(j);
  if (a >= 1e6) return "Rp " + nf2.format(j / 1e6) + " T";
  if (a >= 1e3) return "Rp " + nf2.format(j / 1e3) + " M";
  return "Rp " + nf0.format(j) + " Jt";
}
const rpFull = v => "Rp " + nf0.format(Math.round(v));
const pct = (v, d = 1) => (v != null && isFinite(v) ? [nf0, nf1, nf2][d].format(v * 100) : "–") + "%";
const capaiCls = v => v >= 1 ? "good" : v >= .8 ? "warn" : "crit";
const nplCls = v => v <= .02 ? "good" : v <= .03 ? "warn" : "crit";
const chip = (txt, cls) => `<span class="chip ${cls}">${txt}</span>`;
const daysBetween = (a, b) => Math.max(0, Math.round((b - a) / 864e5));
const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const iso = d => d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
const lsGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const lsDel = k => { try { localStorage.removeItem(k); } catch {} };
function toast(msg) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}

/* ================= master kanca, area & unit dedicated (Ketentuan LW321 Lampiran A & B) ================= */
const AREA_L = { "AREA 1": "AREA 1 / MEDAN", "AREA 2": "AREA 2 / PEMATANG SIANTAR", "AREA 3": "AREA 3 / LUBUK PAKAM", "AREA 4": "AREA 4 / PADANG SIDEMPUAN" };
const KC_MASTER = [[53,"KC Medan Putri Hijau",1],[336,"KC Medan Iskandar Muda",1],[367,"KC Medan Sisingamangaraja",1],[404,"KC Medan Gatot Subroto",1],[633,"KC Medan Thamrin",1],
  [113,"KC Pematang Siantar",2],[144,"KC Kabanjahe",2],[194,"KC Sidikalang",2],[228,"KC Rantau Prapat",2],[314,"KC Balige",2],[636,"KC Perdagangan",2],[2062,"KC Kota Pinang",2],
  [154,"KC Tanjung Balai",3],[238,"KC Binjai",3],[266,"KC Lubuk Pakam",3],[283,"KC Tebing Tinggi",3],[323,"KC Kisaran",3],[638,"KC Stabat",3],
  [85,"KC Sibolga",4],[99,"KC Tarutung",4],[135,"KC Padang Sidempuan",4],[176,"KC Gunung Sitoli",4],[637,"KC Panyabungan",4],[1097,"KC Sibuhuan",4],[201,"RO Medan",0]]
  .map(([boc, nama, a]) => ({ boc, nama, area: a ? AREA_L["AREA " + a] : "REGIONAL OFFICE" }));
const KC_BY = new Map(KC_MASTER.map(u => [String(u.boc), u]));
const UD_MASTER = [[3275,"Unit Sei Sikambing",404],[3382,"Unit Gatot Subroto",404],[3383,"Unit Kapten Muslim",404],[3530,"Unit Setiabudi",404],[5325,"Unit Pasar Glugur",404],
  [3342,"Unit Belawan",336],[3532,"Unit Pasar Pringgan",336],[5328,"Unit Simpang Pos",336],[5329,"Unit Titi Kuning",367],[5326,"Unit Sidorame",633],
  [3352,"Unit Pasar Horas",113],[5342,"Unit Parluasan",113],[3375,"Unit Jatinegara Binjai",238],[3376,"Unit Bangkatan Binjai",238],[3276,"Unit Stabat",638],
  [3538,"Unit Sei Rampah",283],[3834,"Unit Ahmad Yani Tebing Tinggi",283],[3535,"Unit Sisingamangaraja Sibolga",85],[3536,"Unit Sisingamangaraja Sidikalang",194],[5376,"Unit Salak",194],
  [3832,"Unit Teluk Dalam",176],[5266,"Unit Diponegoro Gunung Sitoli",176],[3833,"Unit Lau Cimba",144],[5288,"Unit Ahmad Dahlan Lubuk Pakam",266],[5338,"Unit Padang Matinggi",135],
  [5339,"Unit Sisingamangaraja Padang Sidempuan",135],[5384,"Unit Teluk Nibung",154],[5393,"Unit Silindung Tarutung",99],[7039,"Unit Samosir",314]];
const UD_BY = new Map(UD_MASTER.map(([c, n, k]) => [String(c), { nama: n, kc: k }]));
const kcName = code => (KC_BY.get(String(+code || code)) || {}).nama || (code ? "Uker " + code : "");
const kcAreaOf = code => (KC_BY.get(String(+code || code)) || {}).area || "LAINNYA";
// nama kanca dari teks bebas: "KC Binjai", "BINJAI", "00238 -- KC Binjai(Konsolidasi)" → master
const kcKey = s => String(s || "").toLowerCase().replace(/^\s*\d+\s*-+\s*/, "").replace(/\(.*?\)/g, "").replace(/^\s*(kc|kantor cabang)\s+/, "").replace(/y/g, "i").replace(/[^a-z]/g, "");
const KC_BYKEY = new Map(KC_MASTER.map(u => [kcKey(u.nama), u]));
const kcByName = nm => KC_BYKEY.get(kcKey(nm));
const kcArea = kc => { const u = kcByName(kc); return u ? u.area : ""; };
const kcClean = (code, txt) => { const u = KC_BY.get(String(+code)); if (u) return u.nama; const m = kcByName(txt); return m ? m.nama : String(txt || "").replace(/^\s*\d+\s*-+\s*/, "").replace(/\(.*?\)/g, "").trim(); };
const titleCase = s => String(s || "").toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase()).replace(/\s+/g, " ").trim();
/* ================= state (data dari Apps Script, tidak disimpan permanen di perangkat) ================= */
// DB.ker = keragaan & RKA semua produk · DB.rmkSets = produktivitas {R: Briguna Ritel, M: Briguna Mikro, K: KPR}
// DB.pipeSets = pipeline {B: Briguna, K: KPR} · DB.lwSets = LW321 {B, K} · DB.gerak = agregat DG/UG · DB.rate = suku bunga KPR · DB.foto = {rm, kc}
const DB = { source: "server", rmkSets: {}, pipeSets: {}, lwSets: {}, gerak: {}, foto: { rm: {}, kc: {} } };
const S = { periode: null, unit: "ALL" };
const LOADING = { core: true, lw: true };
let KER_LOADING = true, RM_LOADING = true, PIPE_LOADING = true, RATE_LOADING = true;
// segmen aktif per menu (diingat per perangkat)
const SEG = Object.assign({ rm: "R", pipe: "B", lw: "B", sim: "brg" }, lsGet(STORE + "-seg") || {});
const saveSEG = () => lsSet(STORE + "-seg", SEG);
const RML = {
  R: { key: "R", seg: "Briguna Ritel", role: "Relationship Manager Briguna", who: "RM", s: "Baru", k: "Suplesi", isS: t => t.jenis === "Baru",
    note: "Baru = realisasi baru; Suplesi = tambahan plafon (net Delta Suplesi, Rp juta). Target dari sheet list RM ritel." },
  M: { key: "M", seg: "Briguna Mikro", role: "Mantri Briguna Mikro", who: "Mantri", s: "Baru", k: "Suplesi", isS: t => t.jenis === "Baru",
    note: "Baru = realisasi baru; Suplesi = tambahan plafon (net Delta Suplesi, Rp juta). Nama mantri dicocokkan lewat PN dari sheet list mantri mikro." },
  K: { key: "K", seg: "KPR", role: "Relationship Manager KPR", who: "RM", s: "Subsidi", k: "Komersil", isS: t => t.jenis === "KPRS",
    note: "Subsidi = KPR Sejahtera (FLPP); Komersil = Tier 1–3, Secondary, Take Over & Top Up." }
};
let RL = RML.K;
function useRM(seg) {
  SEG.rm = RML[seg] ? seg : "R"; RL = RML[SEG.rm];
  const P = DB.rmkSets[SEG.rm]; DB.rmk = P && P.months && P.months.length ? P : null;
}
const PIPEL = { B: { key: "B", seg: "Briguna Ritel & Mikro", j: ["Ritel", "Mikro"] }, K: { key: "K", seg: "KPR", j: ["Subsidi", "Komersil"] } };
let PL = PIPEL.K;
function usePipe(seg) { SEG.pipe = PIPEL[seg] ? seg : "B"; PL = PIPEL[SEG.pipe]; DB.pipe = DB.pipeSets[SEG.pipe] || null; }
const LWL = { B: { key: "B", seg: "Briguna Ritel & Mikro" }, K: { key: "K", seg: "KPR" } };
const isMidMonth = d => +d.slice(8) < new Date(+d.slice(0, 4), +d.slice(5, 7), 0).getDate();
const role = () => (Auth.user || {}).role || "guest";
const isAdmin = () => role() === "admin";
/* ================= chart helpers ================= */
const charts = {};
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function mkChart(id, cfg) {
  const el = document.getElementById(id); if (!el) return;
  if (charts[id]) charts[id].destroy();
  if (typeof Chart === "undefined") { el.parentElement.innerHTML = '<div class="empty">Grafik butuh koneksi internet untuk memuat pustaka grafik.</div>'; return; }
  charts[id] = new Chart(el, chartTheme(cfg));
}
function baseOpts(extra = {}) {
  const ink2 = cssv("--ink-2"), muted = cssv("--muted"), line = cssv("--line");
  return Object.assign({
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top", align: "start", labels: { color: ink2, usePointStyle: true, pointStyle: "rectRounded", boxWidth: 10, boxHeight: 10, font: { family: cssv("--f-body"), size: 12 } } },
      tooltip: { padding: 10, cornerRadius: 8, titleFont: { family: cssv("--f-body"), weight: "700" }, bodyFont: { family: cssv("--f-body") } }
    },
    scales: {
      x: { grid: { display: false }, border: { color: line }, ticks: { color: muted, font: { size: 11 } } },
      y: { grid: { color: line }, border: { display: false }, ticks: { color: muted, font: { size: 11, family: cssv("--f-body") } }, beginAtZero: true }
    }
  }, extra);
}
const rpTick = v => { const a = Math.abs(v); return a >= 1e3 ? nf0.format(v / 1e3) + " M" : nf0.format(v) + " Jt"; };

/* ================= tema grafik: palet seragam + label angka di setiap data ================= */
// palet (biru, biru tua, biru muda, abu tua); garis pembanding di grafik batang memakai abu muda
const CP_BAR = ["#2b7ff6", "#0a50c8", "#cddff7", "#4d4d4d", "#7fb2f9", "#8c8c8c"];
const CP_LINE = ["#2b7ff6", "#0a50c8", "#4d4d4d", "#7fb2f9", "#163a73", "#8c8c8c"];
const CP_DASH = "#a6a6a6";
const CP_REF = "#c9c9c9";
const isLight = c => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(c || "")); if (!m) return false;
  const [r, g, b] = m.slice(1).map(h => parseInt(h, 16)); return .299 * r + .587 * g + .114 * b > 170; };
function chartTheme(cfg) {
  const ds = (cfg.data && cfg.data.datasets) || [], type = cfg.type;
  if (type !== "bar" && type !== "line") return cfg;
  const tOf = d => d.type || type, nBar = ds.filter(d => tOf(d) === "bar").length;
  // garis utama (paling tebal / terakhir) mendapat biru
  const lines = ds.filter(d => tOf(d) === "line" && !(d.borderDash && d.borderDash.length));
  const main = lines.reduce((a, d) => !a || (d.borderWidth || 2) >= (a.borderWidth || 2) ? d : a, null);
  let bi = 0, li = 1;
  ds.forEach(d => {
    if (tOf(d) === "bar") {
      if (Array.isArray(d.backgroundColor)) return;   // warna per batang (mis. baik/buruk) dipertahankan
      const c = CP_BAR[bi++ % CP_BAR.length]; d.backgroundColor = c; d.hoverBackgroundColor = c;
    } else {
      const dash = d.borderDash && d.borderDash.length;
      const c = dash ? CP_DASH : nBar ? CP_REF : d === main ? CP_LINE[0] : CP_LINE[li++ % CP_LINE.length];
      // grafik area: isi transparan dengan warna garis
      d.borderColor = c; d.backgroundColor = d.fill ? c + "29" : c; d.pointBackgroundColor = c; d.pointBorderColor = c;
      if (nBar && !dash) d.borderWidth = Math.max(d.borderWidth || 0, 3);
    }
  });
  const o = cfg.options = cfg.options || {};
  o.layout = o.layout || {}; const p = o.layout.padding || {};
  o.layout.padding = typeof p === "number" ? { top: Math.max(p, 24), right: Math.max(p, 14), left: p, bottom: p } : { ...p, top: Math.max(p.top || 0, 24), right: Math.max(p.right || 0, 14) };
  cfg.plugins = [...(cfg.plugins || []), DATA_LBL];
  return cfg;
}
// teks label: persen mengikuti format sumbu; angka lain ditulis lengkap (pemisah ribuan)
function lblText(ch, d, v) {
  const ax = ch.scales[(ch.options.indexAxis === "y" ? d.xAxisID : d.yAxisID) || (ch.options.indexAxis === "y" ? "x" : "y")];
  const cb = ax && ax.options && ax.options.ticks && ax.options.ticks.callback;
  if (cb) { try { const t = String(cb.call(ax, v, 0, [])); if (/%/.test(t)) return t.replace(/\s+/g, ""); } catch (e) {} }
  const a = Math.abs(v); return a >= 100 || Number.isInteger(v) ? nf0.format(Math.round(v)) : a >= 10 ? nf1.format(v) : nf2.format(v);
}
const DATA_LBL = { id: "dataLbl", afterDatasetsDraw(ch) {
  const g = ch.ctx, A = ch.chartArea, horiz = ch.options.indexAxis === "y", placed = [], fs = 11, H = fs + 6;
  g.save(); g.font = `700 ${fs}px Inter, system-ui, sans-serif`; g.textBaseline = "middle"; g.textAlign = "center";
  const hit = r => placed.some(q => r.x < q.x + q.w + 2 && q.x < r.x + r.w + 2 && r.y < q.y + q.h + 1 && q.y < r.y + r.h + 1);
  const inCanvas = r => r.x >= 0 && r.x + r.w <= ch.width && r.y >= 0 && r.y + r.h <= ch.height;
  const put = (cx, cy, t, fill, cands) => { const w = g.measureText(t).width + 8;
    for (const [dx, dy] of cands) { const r = { x: cx + dx - w / 2, y: cy + dy - H / 2, w, h: H }; if (inCanvas(r) && !hit(r)) { placed.push(r);
      g.fillStyle = fill; g.beginPath(); g.roundRect ? g.roundRect(r.x, r.y, r.w, r.h, 3) : g.rect(r.x, r.y, r.w, r.h); g.fill();
      g.fillStyle = isLight(fill) ? "#262626" : "#fff"; g.fillText(t, r.x + r.w / 2, r.y + r.h / 2 + .5); return; } } };
  const steps = s => [0, -1, 1, -2, 2, -3, 3].map(k => k * s);
  const stacked = !horiz && ch.options.scales && ch.options.scales.y && ch.options.scales.y.stacked;
  // batang bertumpuk: total di atas tumpukan (prioritas pertama)
  if (stacked) { const bars = ch.data.datasets.map((d, i) => i).filter(i => (ch.data.datasets[i].type || ch.config.type) === "bar" && ch.getDatasetMeta(i).visible);
    (ch.data.labels || []).forEach((_, k) => { let tot = 0, top = Infinity, x = null;
      bars.forEach(i => { const v = ch.data.datasets[i].data[k], el = ch.getDatasetMeta(i).data[k]; if (v == null || !el) return; tot += +v || 0; top = Math.min(top, el.y, el.base); x = el.x; });
      if (x != null && tot && bars.length > 1) put(x, top - H / 2 - 3, lblText(ch, ch.data.datasets[bars[0]], tot), "#4d4d4d", [0, 1, 2].map(j => [0, -j * (H + 1)])); }); }
  // batang dulu (prioritas), lalu garis
  const order = ch.data.datasets.map((d, i) => i).sort((a, b) => ((ch.data.datasets[a].type || ch.config.type) === "bar" ? 0 : 1) - ((ch.data.datasets[b].type || ch.config.type) === "bar" ? 0 : 1));
  order.forEach(i => {
    const d = ch.data.datasets[i], meta = ch.getDatasetMeta(i); if (!meta.visible || d.datalabels === false) return;
    const isBar = (d.type || ch.config.type) === "bar", n = meta.data.length;
    const vals = d.data.map(v => v == null ? null : typeof v === "object" ? (horiz ? v.x : v.y) : v);
    const lastI = vals.reduce((a, v, k) => v != null ? k : a, -1);
    const dash = d.borderDash && d.borderDash.length, pr = d.pointRadius;
    meta.data.forEach((el, k) => {
      const v = vals[k]; if (v == null || !isFinite(v) || (isBar && v === 0)) return;
      if (!isBar) {
        // garis padat (banyak titik) atau garis target: hanya titik terakhir dan titik yang ditandai
        const marked = Array.isArray(pr) ? pr[k] > 0 : false;
        if ((dash || n > 14) && k !== lastI && !marked) return;
      }
      const t = lblText(ch, d, v), fill = isBar ? (Array.isArray(d.backgroundColor) ? d.backgroundColor[k] : d.backgroundColor) : (d.borderColor === CP_REF ? "#e3e3e3" : d.borderColor === CP_DASH ? "#d9d9d9" : d.borderColor);
      if (isBar) {
        if (horiz) { const w = g.measureText(t).width + 8; put(el.x + w / 2 + 4, el.y, t, fill, [[0, 0], [-(w + 8), 0], ...steps(H + 1).map(s => [0, s])]); return; }
        const top = Math.min(el.y, el.base), hgt = Math.abs(el.base - el.y), bw = el.width || 20, w = g.measureText(t).width + 8;
        // tumpukan: di tengah segmen bila muat, selain itu di samping segmen
        if (stacked) { put(el.x, top + hgt / 2, t, fill, hgt >= H + 2 ? [[0, 0]] : [[bw / 2 + w / 2 + 2, 0], [-(bw / 2 + w / 2 + 2), 0]]); return; }
        const up = v >= 0; put(el.x, up ? el.y - H / 2 - 3 : el.y + H / 2 + 3, t, fill, [0, 1, 2, 3].map(k => [0, (up ? -1 : 1) * k * (H + 1)]));
      } else put(el.x, el.y, t, fill, [[0, 0], [0, -(H + 2)], [0, H + 2], [0, -2 * (H + 2)], [0, 2 * (H + 2)], [-(H * 1.5), 0], [H * 1.5, 0]]);
    });
  });
  g.restore();
} };
/* ================= table helper ================= */
// section yang bisa diminimize (klik judul). Pipeline Brispot: awalnya semua section diminimize. Pilihan diingat per perangkat.
const SEC_DEFAULT_MIN = { pipeline: true };
const SEC_MIN = lsGet(STORE + "-min") || {};
const secKey = (view, sec) => view + ":" + (sec.id || (sec.querySelector(":scope > .panel-h h2") || {}).textContent || "").trim();
function secIsMin(view, sec) { const k = secKey(view, sec); return k in SEC_MIN ? SEC_MIN[k] : !!SEC_DEFAULT_MIN[view] && !/^brs/.test(sec.id || ""); }
function secApply(view, sec) {
  const min = secIsMin(view, sec), h = sec.querySelector(":scope > .panel-h");
  sec.classList.toggle("min", min); if (h) { h.setAttribute("aria-expanded", String(!min)); h.setAttribute("role", "button"); h.tabIndex = 0; }
}
function setupSections(v, view) {
  const secs = [...v.querySelectorAll("section.panel")].filter(x => x.querySelector(":scope > .panel-h") && !x.hasAttribute("data-nosec"));
  if (!secs.length) return;
  secs.forEach(sec => { sec.classList.add("sec"); secApply(view, sec); });
  if (!v.querySelector(".sec-ctl")) {
    const bar = document.createElement("div"); bar.className = "sec-ctl";
    bar.innerHTML = '<button type="button" data-sec="open">Buka semua</button><button type="button" data-sec="close">Minimize semua</button>';
    const host = secs[0].parentElement.classList.contains("grid") ? secs[0].parentElement : secs[0]; host.parentElement.insertBefore(bar, host);
  }
}
function secToggle(sec, view, force) {
  const k = secKey(view, sec); SEC_MIN[k] = force == null ? !secIsMin(view, sec) : force; lsSet(STORE + "-min", SEC_MIN); secApply(view, sec);
  if (!SEC_MIN[k]) requestAnimationFrame(() => Object.values(charts).forEach(c => { try { c.resize(); } catch {} }));
}
document.addEventListener("click", e => {
  const v = $("#view"); if (!v || !v.contains(e.target)) return; const view = curView();
  const all = e.target.closest("[data-sec]");
  if (all) { v.querySelectorAll("section.panel.sec").forEach(sec => secToggle(sec, view, all.dataset.sec === "close")); return; }
  const h = e.target.closest(".panel.sec > .panel-h"); if (!h || e.target.closest("button, a, select, input, label, .seg")) return;
  secToggle(h.parentElement, view);
});
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".panel.sec > .panel-h")) { e.preventDefault(); secToggle(e.target.parentElement, curView()); } });
function table(el, cols, rows, opt = {}) {
  const st = opt.state || (el._sort = el._sort || { key: opt.sortKey, dir: opt.sortDir || -1 });
  el._tbl = { cols, rows, foot: opt.foot };
  let shown = opt.page || Infinity;
  const render = () => {
    let sorted = [...rows];
    if (st.key) { const c = cols.find(c => c.key === st.key); const g = c.sortVal || (r => r[c.key]);
      sorted.sort((a, b) => { const x = g(a), y = g(b); return (typeof x === "string" ? x.localeCompare(y) : x - y) * st.dir; }); }
    const total = sorted.length; sorted = sorted.slice(0, shown);
    el.innerHTML = `<div class="table-wrap"><table><thead><tr>${cols.map(c =>
      `<th class="${c.r ? "r " : ""}${c.nosort ? "" : "sortable"}" data-k="${c.key}" ${st.key === c.key ? `aria-sort="${st.dir > 0 ? "ascending" : "descending"}"` : ""} ${c.nosort ? "" : 'tabindex="0"'}>${c.label}</th>`).join("")}</tr></thead>
      <tbody>${sorted.length ? sorted.map(r => `<tr>${cols.map(c => `<td class="${c.r ? "r" : ""}">${c.fmt ? c.fmt(r[c.key], r) : esc(r[c.key])}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${cols.length}" class="empty">Tidak ada data yang cocok.</td></tr>`}</tbody>
      ${opt.foot && shown >= total ? `<tfoot><tr>${cols.map(c => `<td class="${c.r ? "r" : ""}">${opt.foot[c.key] ?? ""}</td>`).join("")}</tr></tfoot>` : ""}</table></div>${total > shown ? `<div class="toolbar" style="justify-content:center;margin-top:10px"><span class="note">${shown} dari ${total} baris</span><button class="btn" type="button" data-more>Tampilkan ${Math.min(opt.page, total - shown)} lagi</button><button class="btn" type="button" data-all>Semua</button></div>` : ""}`;
    const mb = el.querySelector("[data-more]"); if (mb) mb.onclick = () => { shown += opt.page; render(); };
    const ab = el.querySelector("[data-all]"); if (ab) ab.onclick = () => { shown = Infinity; render(); };
    el.querySelectorAll("th.sortable").forEach(th => {
      const go = () => { const k = th.dataset.k; st.dir = st.key === k ? -st.dir : -1; st.key = k; render(); };
      th.onclick = go; th.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } };
    });
    opt.after && opt.after(el);
  };
  render();
}
async function saveFile(name, data, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(typeof data === "string" ? new Blob([data], { type }) : data);
  a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast("Mengunduh " + name);
}
function exportCSV(name, cols, rows) {
  if (XMODE === "xlsx") { const aoa = [cols.map(c => c[1]), ...rows.map(r => cols.map(c => { const v = r[c[0]]; return v == null ? "" : typeof v === "string" && /^'\d/.test(v) ? v.slice(1) : v; }))];
    const ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Data");
    saveFile(name + ".xlsx", new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })); return; }
  const q = v => { const s = String(v ?? ""); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const csv = [cols.map(c => q(c[1])).join(";"), ...rows.map(r => cols.map(c => q(r[c[0]])).join(";"))].join("\n");
  saveFile(name + ".csv", "\ufeff" + csv, "text/csv");
}

/* ================= komponen kecil ================= */
function tile({ label, value, sub = "", delta = null, goodUp = true, meter = null, deltaFmt }) {
  let d = "";
  if (delta !== null && isFinite(delta)) {
    const cls = Math.abs(delta) < 1e-9 ? "flat" : (delta > 0) === goodUp ? "up" : "down";
    d = `<span class="delta ${cls}">${delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} ${deltaFmt ? deltaFmt(Math.abs(delta)) : pct(Math.abs(delta))}</span>`;
  }
  const m = meter !== null ? `<div class="meter" role="img" aria-label="capaian ${pct(meter)}"><i style="width:${clamp(meter, 0, 1) * 100}%;background:var(--${capaiCls(meter)})"></i></div>` : "";
  return `<div class="tile"><span class="lbl">${label}</span><span class="val">${value}</span><span class="sub">${d}${sub}</span>${m}</div>`;
}
const ICON = {
  keragaan: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  produktivitas: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="m16 9 2 2 4-4"/></svg>',
  pipeline: '<svg viewBox="0 0 24 24"><path d="M3 4h18l-7 8v6l-4 2v-8z"/></svg>',
  nominatif: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h3M8 16h6M15 13h1"/></svg>',
  kualitas: '<svg viewBox="0 0 24 24"><path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/></svg>',
  simulasi: '<svg viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h4"/></svg>'
};

/* ================= VIEW: Beranda ================= */
// latar halaman depan: pita garis data yang mengalir pelan + denyut cahaya di sepanjang garis (berhenti otomatis saat halaman depan tidak tampil)
let lpRaf = 0;
function landingParticles(cv) {
  cancelAnimationFrame(lpRaf); if (!cv) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ctx = cv.getContext("2d"), land = $("#landing"), dpr = Math.min(2, devicePixelRatio || 1);
  let W = 0, H = 0; const fit = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; };
  fit();
  const TAU = Math.PI * 2;
  // dua pita: utama (bawah, melengkung naik ke kanan) dan tipis (atas)
  const ribbons = [
    { n: 26, y: .70, rise: .16, amp: .06, gap: 5.2, sp: .16, a: .34, f: 1.1 },
    { n: 16, y: .30, rise: -.08, amp: .04, gap: 4.2, sp: -.11, a: .18, f: 1.5 }
  ];
  const lineY = (r, i, x, t) => {
    const u = x / W, mid = (i - r.n / 2);
    return H * (r.y - r.rise * u) + Math.sin(u * TAU * .55 * r.f + t * r.sp + i * .045) * H * r.amp
      + Math.sin(u * TAU * 1.3 * r.f - t * r.sp * 1.4 + i * .02) * H * r.amp * .35
      + mid * r.gap * (.55 + .45 * Math.sin(u * TAU * .7 + t * .22));
  };
  const pulses = Array.from({ length: 4 }, (_, k) => ({ i: Math.floor(Math.random() * 26), u: Math.random(), s: .035 + Math.random() * .03, d: k % 2 ? -1 : 1 }));
  let last = performance.now();
  const step = now => {
    if (!cv.isConnected || land.hidden) return;
    if (cv.clientWidth !== W || cv.clientHeight !== H) fit();
    const dt = Math.min(.05, (now - last) / 1000); last = now; const t = reduce ? 8 : now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const step_ = Math.max(8, W / 140);
    ribbons.forEach(r => {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.25, `rgba(190,225,255,${r.a})`); g.addColorStop(.7, `rgba(255,255,255,${r.a * 1.15})`); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      for (let i = 0; i < r.n; i++) {
        ctx.lineWidth = i % 5 === 0 ? 1.2 : .7; ctx.beginPath();
        for (let x = -step_; x <= W + step_; x += step_) { const y = lineY(r, i, x, t); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
    });
    // denyut cahaya bergerak di sepanjang garis pita utama
    const r0 = ribbons[0];
    pulses.forEach(p => {
      if (!reduce) { p.u += p.s * dt * p.d; if (p.u > 1.05 || p.u < -.05) { p.d = Math.random() < .5 ? 1 : -1; p.u = p.d > 0 ? -.05 : 1.05; p.i = Math.floor(Math.random() * r0.n); p.s = .035 + Math.random() * .03; } }
      const x = p.u * W, y = lineY(r0, p.i, x, t), edge = Math.min(1, Math.min(p.u, 1 - p.u) * 6);
      if (edge <= 0) return;
      const gl = ctx.createRadialGradient(x, y, 0, x, y, 16); gl.addColorStop(0, `rgba(255,255,255,${.75 * edge})`); gl.addColorStop(.3, `rgba(170,215,255,${.35 * edge})`); gl.addColorStop(1, "rgba(170,215,255,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
    });
    if (!reduce) lpRaf = requestAnimationFrame(step);
  };
  lpRaf = requestAnimationFrame(step);
  // jam & tanggal berjalan
  const nowEl = $("#lNow");
  if (nowEl) { const tick = () => { if (!nowEl.isConnected) return clearInterval(iv); const d = new Date();
      nowEl.textContent = d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB"; };
    const iv = setInterval(tick, 15000); tick(); }
}
// ---- lihat data cepat di halaman depan: satu tabel dari menu mana pun tanpa membuka menunya
const LQV = { key: lsGet(STORE + "-qv") || "" };
const QV = [
  ["Keragaan Konsumer", "keragaan", [["k_hl", "Highlight Konsumer per segmen"], ["k_hla", "Highlight Konsumer per area"], ["k_hlk", "Highlight Konsumer per kanca"],
    ["k_sum", "Highlight produk terpilih (ringkasan)"], ["k_all", "Semua KPI per KC"], ["k_os", "OS per KC"], ["k_sml", "SML per KC"], ["k_npl", "NPL per KC"], ["k_deb", "Debitur per KC"], ["k_tss", "Time Series SML"], ["k_tsn", "Time Series NPL"]], () => DB.ker],
  ["Produktivitas RM", "produktivitas", [["r_rank_R", "Peringkat RM Briguna Ritel"], ["r_kc_R", "Pencapaian per cabang · Briguna Ritel"], ["r_rank_M", "Peringkat mantri Briguna Mikro"], ["r_kc_M", "Pencapaian per cabang · Briguna Mikro"],
    ["r_rank_K", "Peringkat RM KPR"], ["r_kc_K", "Pencapaian per cabang · KPR"]], k => !!(DB.rmkSets[k.slice(-1)] && DB.rmkSets[k.slice(-1)].months && DB.rmkSets[k.slice(-1)].months.length)],
  ["Kualitas Kredit", "kualitas", [["q_B", "DG/UG per kanca · Briguna"], ["q_K", "DG/UG per kanca · KPR"]], k => !!(DB.gerak[k.slice(-1)] && DB.gerak[k.slice(-1)].prevAsof)],
  ["Pipeline Brispot", "pipeline", [["p_kc_B", "Pipeline per KC · Briguna"], ["p_akad_B", "Jadwal akad terdekat · Briguna"], ["p_kc_K", "Pipeline per KC · KPR"], ["p_akad_K", "Jadwal akad terdekat · KPR"]], k => !!DB.pipeSets[k.slice(-1)]],
  ["Simulasi Suku Bunga", "simulasi", [["s_rate", "Tabel suku bunga program KPR"]], () => !!DB.rate]
];
function qvOptions() {
  return `<option value="">Pilih data…</option>` + QV.map(([g, , items, ok]) => `<optgroup label="${g}">${items.map(([k, l]) => `<option value="${k}" ${LQV.key === k ? "selected" : ""} ${ok(k) ? "" : "disabled"}>${l}${ok(k) ? "" : " (belum ada data)"}</option>`).join("")}</optgroup>`).join("");
}
function qvRender(el) {
  if (!el) return; const k = LQV.key; el.hidden = !k; if (!k) { el.innerHTML = ""; return; }
  const grp = QV.find(g => g[2].some(x => x[0] === k)); if (!grp || !grp[3](k)) { el.innerHTML = '<div class="empty">Data belum tersedia.</div>'; return; }
  const label = grp[2].find(x => x[0] === k)[1];
  el.innerHTML = `<div class="l-qvh"><div><small>${grp[0]}</small><h3>${label}</h3><p class="note" id="lQvSub"></p></div><a class="btn" href="#${grp[1]}" data-qvgo="${k}">Buka menu lengkap <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2"><path d="m9 6 6 6-6 6"/></svg></a></div><div id="lQvB"></div>`;
  el.querySelector("[data-qvgo]").addEventListener("click", () => { const s = k.slice(-1); if (k[0] === "r") SEG.rm = s; if (k[0] === "p") SEG.pipe = s; if (k[0] === "q") SEG.lw = s; saveSEG(); });
  const body = $("#lQvB"), sub = $("#lQvSub");
  if (k[0] === "k") {
    const keep = KV; setKV(KS.prod || "konsumer");
    const d = KV.dates[KV.dates.length - 1], us = KV.units.map((u, i) => ({ ...u, i }));
    if (k.startsWith("k_hl")) { sub.textContent = "Seluruh KC · posisi " + tglS(d); body.innerHTML = hlKonsumer(d, () => true, { k_hl: "ro", k_hla: "area", k_hlk: "kc" }[k]); }
    else { sub.textContent = prodL(KV.p) + " · seluruh KC · posisi " + tglS(d) + (k === "k_sum" ? " · nominal Rp juta" : "");
      body.innerHTML = k === "k_tss" ? kTsTable(d, us, "sml", false) : k === "k_tsn" ? kTsTable(d, us, "npl", false) : kpiTable(d, us, { k_sum: "sum", k_all: "all", k_os: "os", k_sml: "sml", k_npl: "npl", k_deb: "deb" }[k], "nom"); }
    KV = keep;
  } else if (k[0] === "r") {
    const seg = k.slice(-1), P = DB.rmkSets[seg], L = RML[seg], ym = (P.asof || P.months[P.months.length - 1].ym).slice(0, 7), rows = P.months.filter(x => x.ym === ym && (x.tDisb > 0 || x.os > 0)).map(x => ({ ...x, pen: x.tDisb ? x.os / x.tDisb : null }));
    sub.textContent = (seg === "K" ? "Disbursement" : "Net disburse") + " s.d. " + tglS(P.asof) + " · Rp juta";
    if (k.startsWith("r_rank")) {
      const lb = rows.sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os).map((x, i) => ({ ...x, no: i + 1, kq: kuadOf(x.pen) }));
      table(body, [{ key: "no", label: "#", r: 1 }, { key: "rm", label: L.who, fmt: (x, r) => `<span class="lb-name wav">${rmAvatar(x, 30)}<span><b>${esc(x)}</b><small>${esc(r.kc)}${r.jg ? " · " + esc(r.jg) : ""}</small></span></span>` },
        { key: "tDisb", label: "Target", r: 1, fmt: x => x ? nf0.format(x) : "–" }, { key: "os", label: "Realisasi", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` },
        { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "kq", label: "Kuadran", r: 1, sortVal: r => r.kq ?? 9, fmt: q => kq(q) },
        { key: "sOs", label: L.s, r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.sDeb} deb</small>` }, { key: "kOs", label: L.k, r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.kDeb} deb</small>` }], lb, { state: { key: "no", dir: 1 }, page: 15 });
    } else {
      const kr = uniq(rows.map(x => x.kc)).map(kc => { const a = rows.filter(x => x.kc === kc), t = sum(a.filter(x => x.tDisb > 0), "tDisb"), o = sum(a, "os");
        return { kc, rm: a.length, t, os: o, pen: t ? o / t : null, sub: sum(a, "sOs"), kom: sum(a, "kOs"), deb: sum(a, "deb") }; });
      const T = sum(kr, "t"), O = sum(kr, "os");
      table(body, [{ key: "kc", label: "Kantor cabang" }, { key: "rm", label: L.who, r: 1 }, { key: "t", label: "Target", r: 1, fmt: x => nf0.format(x) }, { key: "os", label: "Realisasi", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` },
        { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "sub", label: L.s, r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: L.k, r: 1, fmt: x => nf1.format(x) }, { key: "deb", label: "Deb", r: 1 }], kr,
        { sortKey: "pen", foot: { kc: "Total", rm: sum(kr, "rm"), t: nf0.format(T), os: `<b>${nf1.format(O)}</b>`, pen: T ? chip(pct(O / T, 0), capaiCls(O / T)) : "–", sub: nf1.format(sum(kr, "sub")), kom: nf1.format(sum(kr, "kom")), deb: sum(kr, "deb") } });
    }
  } else if (k[0] === "q") {
    const G = DB.gerak[k.slice(-1)]; sub.textContent = `${LWL[k.slice(-1)].seg} · LW321 ${nS(G.prevAsof)} → ${nS(G.asof)} · OS Rp juta`;
    gerakKcTable(body, G, () => true);
  } else if (k[0] === "p") {
    const keepP = DB.pipe, keepL = PL; usePipe(k.slice(-1));
    const aktif = pipeRows().filter(x => !x.batal); sub.textContent = PL.seg + " · posisi " + tglS(DB.pipe.asof) + " · plafon Rp juta · tanpa berkas batal";
    if (k.startsWith("p_kc")) {
      const kr = uniq(aktif.map(x => x.kc)).filter(Boolean).map(kc => { const a = aktif.filter(x => x.kc === kc), sc = a.filter(x => x.tahap >= 6);
        return { kc, n: a.length, pl: sum(a, "plafon"), sub: sum(a.filter(x => x.jenis === PL.j[0]), "plafon"), kom: sum(a.filter(x => x.jenis !== PL.j[0]), "plafon"), oh: a.filter(x => x.tahap === 0).length, sc: sc.length, scPl: sum(sc, "plafon") }; });
      table(body, [{ key: "kc", label: "Kantor cabang" }, { key: "n", label: "Deb", r: 1 }, { key: "pl", label: "Plafon", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` }, { key: "sub", label: PL.j[0], r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: PL.j[1], r: 1, fmt: x => nf1.format(x) },
        { key: "oh", label: "On hand", r: 1 }, { key: "sc", label: "Siap cair", r: 1, fmt: (x, r) => `${x}<br><small class="note">${nf1.format(r.scPl)}</small>` }], kr,
        { sortKey: "pl", foot: { kc: "Total", n: aktif.length, pl: `<b>${nf1.format(sum(kr, "pl"))}</b>`, sub: nf1.format(sum(kr, "sub")), kom: nf1.format(sum(kr, "kom")), oh: sum(kr, "oh"), sc: sum(kr, "sc") } });
    } else {
      const ak = aktif.filter(x => x.akad && x.akad >= DB.pipe.asof).sort((a, b) => a.akad.localeCompare(b.akad) || b.plafon - a.plafon);
      table(body, [{ key: "akad", label: "Akad", fmt: x => `<b>${tglS(x)}</b>` }, { key: "debitur", label: "Debitur", fmt: (x, r) => `${esc(x)}${r.developer ? `<br><small class="note">${esc(r.developer)}</small>` : ""}` }, { key: "kc", label: "KC / RM", fmt: (x, r) => `${esc(x)}<br><small class="note">${esc(r.rm || "")}</small>` },
        { key: "plafon", label: "Plafon", r: 1, fmt: x => nf1.format(x) }, { key: "jenis", label: "Jenis" }, { key: "tahap", label: "Tahap", fmt: t => esc(PTAHAP[t] || "") }], ak, { state: { key: "akad", dir: 1 }, page: 25 });
    }
    DB.pipe = keepP; PL = keepL;
  } else {
    const R = DB.rate; sub.textContent = R.title || "";
    table(body, [{ key: "prog", label: "Program" }, { key: "prod", label: "Skema", fmt: (x, r) => `${esc(x)}${r.kel ? `<br><small class="note">${esc(r.kel)}</small>` : ""}` }, { key: "tenor", label: "Min tenor", r: 1, fmt: x => x ? x + " th" : "–" },
      { key: "st", label: "Suku bunga per tahap", nosort: 1, fmt: st => (st || []).map((t, i) => `${pct(t.r, 2)} <small class="note">${i ? "th " + ((st[i - 1].sd || 0) + 1) + "–" + t.sd : "s.d. th " + t.sd}</small>`).join("<br>") }], R.rows, { page: 30 });
  }
}
function viewBeranda(v) {
  const tgl = d => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const alerts = [], ks = kerSummary();
  if (ks) {
    const rows = ks.us.map(u => ({ u, c: kSnap(ks.r.di, [u]), r: kRka(ks.d.slice(0, 7), [u]) })).filter(x => x.c.os > 0 && x.r && x.r.os);
    const low = rows.filter(x => x.c.os / x.r.os < .95).sort((a, b) => a.c.os / a.r.os - b.c.os / b.r.os);
    if (low.length) alerts.push(["warn", low.length + " KC", `OS Konsumer di bawah 95% RKA: ${low.slice(0, 4).map(x => `${esc(x.u.nama)} (${pct(x.c.os / x.r.os, 1)})`).join(", ")}${low.length > 4 ? ", dll." : ""}`]);
    const nplHi = rows.filter(x => x.r.npl != null && x.c.npl > x.r.npl * 1.2 && x.c.npl > 0);
    if (nplHi.length) alerts.push(["red", nplHi.length + " KC", `NPL Konsumer lebih dari 120% RKA: ${nplHi.slice(0, 4).map(x => esc(x.u.nama)).join(", ")}${nplHi.length > 4 ? ", dll." : ""}`]);
    ["ritel", "mikro", "kpr"].forEach(p => { const keep = KV; setKV(p); const us = KV.units.map((u, i) => ({ ...u, i })), c = kSnap(ks.r.di, us), r = kRka(ks.d.slice(0, 7), us); KV = keep;
      if (c && r && r.sml != null && c.sml > r.sml) alerts.push(["warn", "SML " + prodS(p), `SML ${prodL(p)} ${pct(c.psml, 2)} di atas RKA (${pct(r.psml, 2)}) posisi ${tglS(ks.d)}.${isMidMonth(ks.d) && p !== "kpr" ? " Bulan berjalan: SML Briguna mengikuti tanggal gajian." : ""}`]); });
  }
  const rsum = {}; ["R", "M", "K"].forEach(s => { const P = DB.rmkSets[s]; if (!P || !P.months || !P.months.length || !P.asof) return;
    const ym = P.asof.slice(0, 7), rows = P.months.filter(x => x.ym === ym && (x.tDisb > 0 || x.os > 0)), tgt = rows.filter(x => x.tDisb > 0);
    rsum[s] = { os: sum(rows, "os"), capai: tgt.filter(x => x.os >= x.tDisb).length, n: tgt.length, asof: P.asof };
    if (+P.asof.slice(8) >= 10) { const nol = tgt.filter(x => !x.os); if (nol.length) alerts.push(["warn", nol.length + " " + RML[s].who, `${RML[s].seg}: belum ada pencairan s.d. ${tglS(P.asof)}: ${nol.slice(0, 4).map(x => esc(x.rm)).join(", ")}${nol.length > 4 ? ", dll." : ""}`]); } });
  const psum = {}; ["B", "K"].forEach(s => { const P = DB.pipeSets[s]; if (!P) return; const keepP = DB.pipe, keepL = PL; usePipe(s);
    const all = pipeRows().filter(x => !x.batal), siap = all.filter(x => x.tahap >= 6); psum[s] = { pl: sum(all, "plafon"), n: all.length, siap: siap.length, asof: P.asof };
    const lewat = all.filter(x => x.akad && x.akad < P.asof); if (lewat.length) alerts.push(["red", lewat.length + " deb", `Pipeline ${PL.seg}: jadwal akad sudah lewat tetapi belum cair (${rpJ(sum(lewat, "plafon"))}).`]);
    DB.pipe = keepP; PL = keepL; });
  const lsum = {}; ["B", "K"].forEach(s => { const L = DB.lwSets[s]; if (!L) return; const T = todayN(); let os = 0, sml = 0, npl = 0, akan = 0, akOs = 0;
    for (let i = 0; i < L.n; i++) { os += L.os[i]; if (L.kol[i] === 2) sml += L.os[i]; if (L.kol[i] >= 3) npl += L.os[i]; }
    if (s === SEG.lw) { LWR.forEach(r => { if (r.npl90 != null && r.npl90 <= T + 30) { akan++; akOs += r.os; } }); if (akan) alerts.push(["red", akan + " rek", `${LWL[s].seg}: SML akan tembus NPL dalam 30 hari (${rpJ(akOs / 1e6)}) bila tidak ada pembayaran.`]); }
    lsum[s] = { n: L.n, os, sml, npl, asof: L.asof }; });
  const gs = {}; ["B", "K"].forEach(s => { const G = DB.gerak[s]; if (!G || !G.prevAsof) return; const c = k => G.cat.filter(x => x[2] === k).reduce((a, x) => a + x[3], 0);
    gs[s] = { dg: c("dgLS") + c("dgSN") + c("dgLN"), ug: c("ugSL") + c("ugNS") + c("ugNL"), asof: G.asof }; });
  const chev = '<svg class="l-chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
  let ci = 0;
  const card = (href, ico, title, desc, badge, cls = "") => `<a class="l-card" href="#${href}" style="--i:${ci++}"><span class="l-ico">${ico}</span>
    <span><h3>${title}</h3><p>${desc}</p><span class="l-badge ${cls}">${badge}</span></span>${chev}</a>`;
  const ld = (x, txt) => x ? "Memuat data…" : txt;
  const rsAsof = Object.values(rsum).map(x => x.asof).sort().pop(), psAsof = Object.values(psum).map(x => x.asof).sort().pop();
  const lwAsof = Object.values(lsum).map(x => x.asof).sort().pop(), gsAsof = Object.values(gs).map(x => x.asof).sort().pop();
  const canNom = Auth.can("nominatif");
  v.innerHTML = `
    <div class="l-bg" aria-hidden="true"><i class="lb1"></i><i class="lb2"></i><span class="l-grid"></span><span class="l-vig"></span><canvas id="lPart"></canvas></div>
    <div class="l-top">
      <img class="dan" src="assets/logo-danantara.png" alt="Danantara Indonesia">
      <img class="bri" src="assets/logo-bri.png" alt="BRI">
    </div>
    <div class="l-center">
      <div class="l-head">
        <h1>Dashboard Konsumer Region I - Medan</h1>
        <span class="l-rule"></span>
        <p>Halo, ${esc((Auth.user || {}).nama || (Auth.user || {}).username || "")} · silakan pilih dashboard</p>
        <span class="l-now" id="lNow"></span>
      </div>
      <nav class="l-cards" aria-label="Pilih dashboard">
        ${ks ? card("keragaan", ICON.keragaan, "Keragaan Konsumer", `OS ${rpM(ks.cur.os)}${ks.rka && ks.rka.os ? " · " + pct(ks.cur.os / ks.rka.os, 1) + " RKA" : ""} · SML ${pct(ks.cur.psml, 2)} · NPL ${pct(ks.cur.pnpl, 2)}`, "Tersedia · posisi " + tglS(ks.d))
          : card("keragaan", ICON.keragaan, "Keragaan Konsumer", "OS, SML, NPL & debitur Briguna Ritel, Mikro & KPR per KC", ld(KER_LOADING, "Belum ada data"), "warn")}
        ${rsAsof ? card("produktivitas", ICON.produktivitas, "Produktivitas RM", ["R", "M", "K"].filter(s => rsum[s]).map(s => `${s === "R" ? "Ritel" : s === "M" ? "Mikro" : "KPR"} ${rpJ(rsum[s].os)}`).join(" · "), "Tersedia · s.d. " + tglS(rsAsof))
          : card("produktivitas", ICON.produktivitas, "Produktivitas RM", "Per bulan & carry over: Briguna Ritel, Mikro & KPR", ld(RM_LOADING, "Belum ada data"), "warn")}
        ${canNom ? (lwAsof ? card("nominatif", ICON.nominatif, "Nominatif Portofolio", ["B", "K"].filter(s => lsum[s]).map(s => `${s === "B" ? "Briguna" : "KPR"} ${nf0.format(lsum[s].n)} rek`).join(" · "), "Tersedia · LW321 " + nS(lwAsof))
          : card("nominatif", ICON.nominatif, "Nominatif Portofolio", "Per debitur: ringkasan, EWS, peluang & tindak lanjut", ld(LOADING.lw, "Belum ada LW321"), "warn")) : ""}
        ${gsAsof ? card("kualitas", ICON.kualitas, "Kualitas Kredit", ["B", "K"].filter(s => gs[s]).map(s => `${s === "B" ? "Briguna" : "KPR"} DG ${nf0.format(gs[s].dg)} · UG ${nf0.format(gs[s].ug)}`).join(" · "), "Tersedia · posisi " + nS(gsAsof))
          : card("kualitas", ICON.kualitas, "Kualitas Kredit", "SML & NPL, pergerakan DG / UG dibanding bulan lalu", ld(LOADING.core, "Perlu LW321 bulan ini & bulan lalu"), "warn")}
        ${psAsof ? card("pipeline", ICON.pipeline, "Pipeline Brispot RM", ["B", "K"].filter(s => psum[s]).map(s => `${s === "B" ? "Briguna" : "KPR"} ${rpJ(psum[s].pl)} · ${nf0.format(psum[s].n)} deb`).join(" · "), "Tersedia · posisi " + tglS(psAsof))
          : card("pipeline", ICON.pipeline, "Pipeline Brispot RM", "Funnel, jadwal akad, TAT & rencana realisasi RM", ld(PIPE_LOADING, "Belum ada data"), "warn")}
        ${card("simulasi", ICON.simulasi, "Simulasi Suku Bunga", `Briguna (max plafond & angsuran) · KPR ${DB.rate ? uniq(DB.rate.rows.map(x => x.prog)).length + " program" : ""}`, DB.rate ? (String(DB.rate.title || "").replace(/^.*PROGRAM\s*/i, "Program ") || "Tersedia") : "Tersedia")}
      </nav>
      <div class="l-qv">
        <span class="l-qv-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
        <label for="lQv">Lihat data cepat</label>
        <select id="lQv" class="ctl">${qvOptions()}</select>
        <button type="button" class="l-qv-x" id="lQvX" aria-label="Tutup data" ${LQV.key ? "" : "hidden"}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </div>
      <section class="l-qvp" id="lQvP" ${LQV.key ? "" : "hidden"}></section>
      ${alerts.length ? `<details class="l-alert"><summary><span class="l-badge red">${alerts.length}</span> Catatan perlu perhatian</summary>
        <ul>${alerts.map(a => `<li><span class="l-badge ${a[0]}">${a[1]}</span><span>${a[2]}</span></li>`).join("")}</ul></details>` : ""}
      <div class="l-meta">
        <span>${ks ? `Keragaan posisi <b>${tglS(ks.d)}</b>${DB.meta && DB.meta.updated ? ", data server diperbarui " + tgl(new Date(DB.meta.updated)) + " pukul " + new Date(DB.meta.updated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}.` : KER_LOADING ? "Memuat data…" : "Data keragaan belum tersedia."}
          ${rsAsof ? `Produktivitas s.d. <b>${tglS(rsAsof)}</b>.` : ""} ${psAsof ? `Pipeline posisi <b>${tglS(psAsof)}</b>.` : ""} ${lwAsof ? `LW321 posisi <b>${nS(lwAsof)}</b>.` : ""}</span>
        <span style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">${isAdmin() ? `<button type="button" id="lData">Kelola data</button>` : ""}<button type="button" id="lSnd"></button><button type="button" id="lOut">Keluar</button></span>
      </div>
    </div>
    <div class="l-foot">
      <div><b>Satu Bank Untuk Semua</b>
        <div class="contact"><span class="cbox">CONTACT BRI<span>1500017</span></span><span>www.bri.co.id</span></div></div>
      <small>BRI merupakan peserta penjaminan LPS, serta berizin dan diawasi Otoritas Jasa Keuangan &amp; Bank Indonesia</small>
    </div>`;
  landingParticles($("#lPart"));
  const qs = $("#lQv"), setQv = k => { LQV.key = k; lsSet(STORE + "-qv", k); qs.value = k; $("#lQvX").hidden = !k; document.body.classList.toggle("qv-open", !!k); qvRender($("#lQvP")); };
  qs.onchange = () => setQv(qs.value); $("#lQvX").onclick = () => setQv("");
  if (LQV.key) qvRender($("#lQvP"));
  if ($("#lData")) $("#lData").onclick = openData;
  $("#lOut").onclick = () => Auth.logout("manual");
  sndLabel();
}
/* ---------- keragaan per produk (data dari sheet keragaan & RKA) ---------- */
// Desc → produk. Briguna Ritel = Karya + Purna + Pra-Purna (anti double-count; "Pra0Purna" = Pra-Purna). Konsumer = Briguna Ritel + Mikro + KPR.
const KER_M = ["os", "sml", "npl", "deb", "dsml", "dnpl"];
const PRODS = [["konsumer", "Konsumer (Briguna + KPR)", "Konsumer"], ["ritel", "Briguna Ritel", "Briguna Ritel"], ["mikro", "Briguna Mikro", "Briguna Mikro"], ["kpr", "KPR", "KPR"],
  ["brg", "Briguna Ritel + Mikro", "Briguna"], ["karya", "Briguna Karya", "Karya"], ["purna", "Briguna Purna", "Purna"], ["prapurna", "Briguna Pra-Purna", "Pra-Purna"], ["mikrod", "Mikro Unit Dedicated", "Mikro D"]];
const prodL = p => (PRODS.find(x => x[0] === p) || PRODS[0])[1], prodS = p => (PRODS.find(x => x[0] === p) || PRODS[0])[2];
const addMat = (a, b) => a.map((row, i) => row.map((v, j) => Math.round(((v || 0) + (b && b[i] ? b[i][j] || 0 : 0)) * 10) / 10));
function prepKer() {
  const K = DB.ker; if (!K || !K.P || !K.dates || !K.dates.length) { DB.ker = null; return; }
  const z = () => K.dates.map(() => K.kcU.map(() => 0));
  ["karya", "purna", "prapurna", "mikro", "kpr"].forEach(p => { if (!K.P[p]) { K.P[p] = {}; } KER_M.forEach(k => { if (!K.P[p][k]) K.P[p][k] = z(); }); });
  K.P.ritel = {}; K.P.brg = {}; K.P.konsumer = {};
  KER_M.forEach(k => { K.P.ritel[k] = addMat(addMat(K.P.karya[k], K.P.purna[k]), K.P.prapurna[k]); K.P.brg[k] = addMat(K.P.ritel[k], K.P.mikro[k]); K.P.konsumer[k] = addMat(K.P.brg[k], K.P.kpr[k]); });
  const R = K.rka; if (R) {
    R.P = R.P || {}; R.T = R.T || {};
    const sumP = (a, b) => a && b ? a.map((row, i) => K.kcU.map((_, j) => row[j] == null || b[i]?.[j] == null ? null : row[j] + b[i][j])) : null;
    const sumT = (a, b) => a && b ? a.map((v, i) => v == null || b[i] == null ? null : v + b[i]) : null;
    R.P.brg = {}; R.T.brg = {}; R.P.konsumer = {}; R.T.konsumer = {};
    ["os", "sml", "npl", "deb"].forEach(k => {
      const pr = (R.P.ritel || {})[k], pm = (R.P.mikro || {})[k], pk = (R.P.kpr || {})[k], tr = (R.T.ritel || {})[k], tm = (R.T.mikro || {})[k], tk = (R.T.kpr || {})[k];
      const b = sumP(pr, pm); if (b) R.P.brg[k] = b; const kk = sumP(b, pk); if (kk) R.P.konsumer[k] = kk;
      const tb = sumT(tr, tm); if (tb) R.T.brg[k] = tb; const tkk = sumT(tb, tk); if (tkk) R.T.konsumer[k] = tkk;
    });
  }
  // nama unit dedicated yang belum ada di master: dari LW321 (kode uker → nama uker & kanca induk)
  const L = DB.lwSets && DB.lwSets.B;
  K.udInfo = K.udU.map(c => { const m = UD_BY.get(String(c)); if (m) return { boc: +c, nama: m.nama, kcb: m.kc };
    const lw = L && L.uk && L.uk[c]; return { boc: +c, nama: lw ? titleCase(lw.n) : "Unit " + c, kcb: lw ? +lw.k : null }; });
}
// KV = tampilan keragaan untuk produk terpilih: units, m (metrik per tanggal × uker), rka per uker & total
let KV = null;
function setKV(p) {
  const K = DB.ker; if (!K) { KV = null; return null; }
  p = PRODS.some(x => x[0] === p) ? p : "konsumer";
  const ud = p === "mikrod";
  const units = ud ? K.udInfo.map(u => ({ ...u, area: u.kcb ? kcAreaOf(u.kcb) : "LAINNYA" })) : K.kcU.map(c => { const u = KC_BY.get(String(c)); return u ? { ...u } : { boc: +c || c, nama: "Uker " + c, area: "LAINNYA" }; });
  const R = K.rka, ra = R && R.P[p] ? R.P[p] : {}, rt = R && R.T[p] ? R.T[p] : {};
  KV = { p, ud, dates: K.dates, units, m: K.P[p], rka: R ? { months: R.months, has: { os: !!ra.os, sml: !!ra.sml, npl: !!ra.npl, deb: !!ra.deb }, P: ra, T: rt } : null };
  return KV;
}
const isBrgProd = p => ["ritel", "karya", "purna", "prapurna", "mikro", "mikrod", "brg"].includes(p);
const grpL = () => KV && KV.p === "kpr" ? "KPR" : "BRIGUNA";

/* ---------- Highlight Konsumer: per segmen (RO / area / kanca terpilih), per area, atau per kanca ---------- */
const HL_SEG = [["ritel", "Briguna Ritel"], ["mikro", "Briguna Mikro"], ["kpr", "KPR"], ["konsumer", "Total Konsumer"]];
function hlKonsumer(d, filt, mode) {
  const keep = KV, out = {};
  const unitsOf = () => KV.units.map((u, i) => ({ ...u, i })).filter(filt);
  const calc = (p, sel) => { setKV(p); const us = unitsOf().filter(sel || (() => true)), R = kRefs(d), cur = kSnap(R.di, us), pm = kSnap(R.mtd, us), py = kSnap(R.ytd, us), rk = kRka(d.slice(0, 7), us);
    return { cur: cur || { os: 0, sml: 0, npl: 0, deb: 0, psml: 0, pnpl: 0 }, pm, py, rk }; };
  const capUp = (a, r) => r == null ? null : !r ? null : Math.min(1.2, a / r), capLo = (a, r) => r == null ? null : !a ? 1.2 : Math.min(1.2, r / a);
  const pc = v => v == null ? `<td class="kp">–</td>` : `<td class="kp ${osCls(v)}">${pct(v, 1)}</td>`;
  const fd = (x, low) => { if (x == null || Math.abs(x) < 1e-9) return "-"; const bad = low ? x > 0 : x < 0, t = nf0.format(Math.abs(x)); return `<span class="${bad ? "bad" : ""}">${x < 0 ? "(" + t + ")" : t}</span>`; };
  let html;
  if (mode === "ro") {
    const rows = HL_SEG.map(([p, l]) => ({ p, l, c: calc(p) }));
    const tr = x => { const c = x.c, cu = c.cur, rk = c.rk || {};
      return `<tr class="${x.p === "konsumer" ? "ktot" : ""}"><td class="sk1" style="left:0"><b>${x.l}</b></td><td class="r">${nf0.format(cu.os)}</td>${pc(capUp(cu.os, rk.os))}<td class="r">${fd(c.pm ? cu.os - c.pm.os : null)}</td><td class="r">${fd(c.py ? cu.os - c.py.os : null)}</td>`
        + `<td class="r">${nf0.format(cu.sml)}</td><td class="r">${pct(cu.psml, 2)}</td>${pc(capLo(cu.sml, rk.sml))}<td class="r">${fd(c.pm ? cu.sml - c.pm.sml : null, 1)}</td>`
        + `<td class="r">${nf0.format(cu.npl)}</td><td class="r">${pct(cu.pnpl, 2)}</td>${pc(capLo(cu.npl, rk.npl))}<td class="r">${fd(c.pm ? cu.npl - c.pm.npl : null, 1)}</td>`
        + `<td class="r">${nf0.format(cu.deb)}</td>${pc(capUp(cu.deb, rk.deb))}<td class="r">${fd(c.pm ? cu.deb - c.pm.deb : null)}</td></tr>`; };
    html = `<div class="table-wrap"><table class="kt"><thead><tr><th rowspan="2" class="sk1" style="left:0">Segmen</th><th colspan="4">OS</th><th colspan="4">SML</th><th colspan="4">NPL</th><th colspan="3">Debitur</th></tr>
      <tr><th>Posisi</th><th>%Penc ${BULAN[+d.slice(5, 7) - 1]}</th><th>MtD</th><th>YtD</th><th>Nominal</th><th>%</th><th>%Penc</th><th>MtD</th><th>Nominal</th><th>%</th><th>%Penc</th><th>MtD</th><th>Posisi</th><th>%Penc</th><th>MtD</th></tr></thead>
      <tbody>${rows.map(tr).join("")}</tbody></table></div>`;
  } else {
    setKV("konsumer"); const base = unitsOf().filter(u => !/^RO\b/i.test(u.nama));
    const groups = mode === "area" ? uniq(base.map(u => u.area)).filter(a => /^AREA/i.test(a)).sort().map(a => ({ name: areaS(a), sel: u => u.area === a }))
      : base.map(u => ({ name: u.nama, sel: x => x.i === u.i, area: u.area }));
    const segs = HL_SEG.map(x => x[0]);
    const rows = groups.map(g => ({ g, c: Object.fromEntries(segs.map(p => [p, calc(p, g.sel)])) })).filter(x => x.c.konsumer.cur.os > 0)
      .sort((a, b) => b.c.konsumer.cur.os - a.c.konsumer.cur.os);
    const tot = { g: { name: "TOTAL" }, c: Object.fromEntries(segs.map(p => [p, calc(p, u => !/^RO\b/i.test(u.nama))])) };
    const cells = c => segs.map(p => { const x = c[p], cu = x.cur, rk = x.rk || {}; return `<td class="r">${nf0.format(cu.os)}</td>${pc(capUp(cu.os, rk.os))}<td class="r">${pct(cu.psml, 2)}</td><td class="r">${pct(cu.pnpl, 2)}</td>`; }).join("");
    html = `<div class="table-wrap"><table class="kt"><thead><tr><th rowspan="2" class="sk1" style="left:0">${mode === "area" ? "Area" : "Kantor Cabang"}</th>${HL_SEG.map(x => `<th colspan="4">${x[1]}</th>`).join("")}</tr>
      <tr>${HL_SEG.map(() => `<th>OS</th><th>%Penc</th><th>%SML</th><th>%NPL</th>`).join("")}</tr></thead>
      <tbody>${rows.map(x => `<tr><td class="sk1" style="left:0">${esc(x.g.name)}${mode === "kc" ? `<br><small class="note">${esc(areaS(x.g.area).replace(/ · .*/, ""))}</small>` : ""}</td>${cells(x.c)}</tr>`).join("")}
      <tr class="ktot"><td class="sk1" style="left:0">TOTAL</td>${cells(tot.c)}</tr></tbody></table></div>`;
  }
  KV = keep;
  return html + `<p class="note" style="margin:8px 0 0">Nominal Rp juta · %Penc OS & Debitur = aktual ÷ RKA, SML & NPL = RKA ÷ aktual (maks. 120%) · warna: hijau ≥100%, kuning 95–100%, merah &lt;95% · angka dalam kurung = minus · Total Konsumer = Briguna Ritel + Briguna Mikro + KPR${mode !== "ro" ? " · TOTAL tanpa RO Medan" : ""}.</p>`;
}
/* ================= VIEW: Keragaan (dari Master Keragaan) ================= */
// DB.ker = { dates[], units[{boc,nama,area}], m:{os,sml,npl,deb,dsml,dnpl}[date][unit] (juta), rka:{months[], os,sml,npl,deb [month][unit]} }
const KS = Object.assign({ date: null, area: "ALL", kc: "ALL", trend: "os", kpi: "all", kmode: "nom", prod: "konsumer", hlm: "ro" }, lsGet(STORE + "-ker") || {});
const saveKS = () => lsSet(STORE + "-ker", KS);
const rpM = j => (j < 0 ? "−" : "") + "Rp " + nf2.format(Math.abs(j) / 1000) + " M";
const dM = j => (j >= 0 ? "+" : "−") + nf2.format(Math.abs(j) / 1000) + " M";
const dN = j => (j >= 0 ? "+" : "−") + nf0.format(Math.abs(j));
const dPP = v => (v >= 0 ? "+" : "−") + nf2.format(Math.abs(v) * 100) + " pp";
const tglS = d => d ? `${+d.slice(8)} ${BULAN[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}` : "–";
const blnS = ym => BULAN[+ym.slice(5, 7) - 1] + "'" + ym.slice(2, 4);
const areaS = a => String(a || "").replace(/^AREA\s*(\d+)\s*\/\s*/i, "Area $1 · ").replace(/\b([A-Z])([A-Z]+)\b/g, (m, a, b) => a + b.toLowerCase());
const osCls = v => v == null ? "neutral" : v >= 1 ? "good" : v >= .95 ? "warn" : "crit";
const lowCls = (akt, rka) => !rka ? "neutral" : akt <= rka ? "good" : akt <= rka * 1.2 ? "warn" : "crit";
const dCls = (v, goodUp = true) => Math.abs(v) < 1e-9 ? "flat" : (v > 0) === goodUp ? "up" : "down";
function kIdxBefore(d) { const ds = KV.dates; let r = -1; for (let i = 0; i < ds.length && ds[i] < d; i++) r = i; return r; }
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
// tabel KPI per KC: histori, RKA, %pencapaian, delta & YoY; kpi "all" = ringkasan semua KPI per KC
function kpiTable(d, us, kpi, kmode) {
  const ds = KV.dates, R = kRefs(d), ym = d.slice(0, 7), yr = d.slice(0, 4);
  const lastOf = m => m + "-" + String(new Date(+m.slice(0, 4), +m.slice(5), 0).getDate()).padStart(2, "0");
  const inM = (i, m) => i >= 0 && ds[i].startsWith(m) ? i : -1;
  const lyM = (+yr - 1) + ym.slice(4), iLy = inM(kIdxOnOrBefore(lastOf(lyM)), lyM);
  const tS = x => x ? tglS(x).replace(/ \d\d(\d\d)$/, "'$1") : "–";
  const hist = [[blnS(lyM), iLy], ["Des'" + String(+yr - 1).slice(2), R.ytd], [R.mtd >= 0 ? blnS(ds[R.mtd].slice(0, 7)) : "–", R.mtd], [tS(ds[R.dtd]), R.dtd], [tS(d), R.di]];
  const mon = BULAN[+ym.slice(5) - 1] + " " + yr;
  const rmSet = kRmSet(ym), isRO = u => /^RO\b/i.test(u.nama);
  const capP = (akt, rka, up) => { if (rka == null) return null; let v; if (up) v = !rka ? 1.2 : akt / rka; else v = !akt ? 1.2 : !rka ? 0 : rka / akt; return Math.min(1.2, Math.max(0, v)); };
  const pctMode = (kpi === "sml" || kpi === "npl") && kmode === "pct";
  const metric = kpi === "all" ? null : { k: pctMode ? "p" + kpi : kpi, up: kpi === "os" || kpi === "deb", p: pctMode, n: kpi === "deb" };
  const fv = (x, m) => x == null ? "–" : m.p ? pct(x, 2) : !x ? "-" : nf0.format(x);
  const fd = (x, m) => { if (x == null || Math.abs(x) < 1e-9) return "-"; const bad = m.up ? x < 0 : x > 0, t = m.p ? nf2.format(Math.abs(x) * 100) + " pp" : nf0.format(Math.abs(x)); return `<span class="${bad ? "bad" : ""}">${x < 0 ? "(" + t + ")" : t}</span>`; };
  const fy = (x, m) => { if (x == null) return "-"; const bad = m.up ? x < 0 : x > 0, t = m.p ? nf2.format(Math.abs(x) * 100) + " pp" : nf2.format(Math.abs(x) * 100) + "%"; return `<span class="${bad ? "bad" : ""}">${x < 0 ? "(" + t + ")" : t}</span>`; };
  const pc = v => v == null ? `<td class="kp">–</td>` : `<td class="kp ${osCls(v)}">${pct(v, 2)}</td>`;
  const calc = uu => {
    const sn = hist.map(([, i]) => kSnap(i, uu)), cur = sn[4] || { os: 0, sml: 0, npl: 0, deb: 0, psml: 0, pnpl: 0 };
    return { sn, cur, ly: sn[0], pd: sn[3], pm: sn[2], py: sn[1], rk: kRka(ym, uu), rkD: kRka(yr + "-12", uu) };
  };
  const units = us.map(u => ({ u, c: calc([u]) }));
  const sk = metric ? metric.k : "os", sup = metric ? metric.up : true, pv = c => capP(c.cur[sk], c.rk?.[sk], sup) ?? -1;
  const sortP = arr => arr.sort((a, b) => isRO(a.u) - isRO(b.u) || pv(b.c) - pv(a.c) || b.c.cur.os - a.c.cur.os);
  const g1 = sortP(units.filter(x => rmSet.has(normKey(x.u.nama)))), g2 = sortP(units.filter(x => !rmSet.has(normKey(x.u.nama))));
  const areas = uniq(us.map(u => u.area)).filter(a => /^AREA/i.test(a || "")).sort(), narrow = matchMedia("(max-width: 640px)").matches, AC = narrow ? 1 : 2;
  const subs = (areas.length > 1 ? areas.map(a => ({ name: a, c: calc(us.filter(u => u.area === a)), cls: "ksub" })) : []).concat(us.length > 1 ? [{ name: "TOTAL", c: calc(us), cls: "ktot" }] : []);
  let no = 0;
  const cellsM = (c, m) => {
    const k = m.k, g = x => x ? x[k] : null, cv = c.cur[k], rk = g(c.rk), rkD = g(c.rkD);
    const dl = x => x ? cv - x[k] : null, yoy = c.ly ? (m.p ? cv - c.ly[k] : c.ly[k] ? cv / c.ly[k] - 1 : null) : null;
    return c.sn.map(x => `<td class="r">${fv(g(x), m)}</td>`).join("") + `<td class="r">${fv(rk, m)}</td><td class="r">${fv(rkD, m)}</td>${pc(capP(cv, rk, m.up))}${pc(capP(cv, rkD, m.up))}`
      + [dl(c.pd), dl(c.pm), dl(c.py), rk == null ? null : cv - rk, rkD == null ? null : cv - rkD].map(x => `<td class="r">${fd(x, m)}</td>`).join("") + `<td class="r">${fy(yoy, m)}</td>`;
  };
  const histHead = (first, rs) => `<tr><th rowspan="2" class="sk1" ${rs ? "" : 'style="left:0"'}>${first}</th><th colspan="5">Histori</th><th rowspan="2">RKA<br>${mon}</th><th rowspan="2">RKA<br>Des ${yr}</th><th colspan="2">%Penc</th><th colspan="5">Delta</th><th rowspan="2">YoY<br><small>vs ${blnS(lyM)}</small></th></tr>
       <tr>${hist.map(h => `<th>${h[0]}</th>`).join("")}<th>${mon}</th><th>Des ${yr}</th><th>DtD</th><th>MtD</th><th>YtD</th><th>RKA ${BULAN[+ym.slice(5) - 1]}</th><th>RKA Des</th></tr>`;
  if (kpi === "sum") {
    const PS_ = prodS(KV.p), c = calc(us), L = [["OS " + PS_, "os", 1, 0, 0], ["SML " + PS_, "sml", 0, 0, 0], ["% SML", "psml", 0, 1, 0], ["NPL " + PS_, "npl", 0, 0, 0], ["% NPL", "pnpl", 0, 1, 0], ["Debitur", "deb", 1, 0, 1]];
    return `<div class="table-wrap"><table class="kt"><thead>${histHead("Indikator")}</thead><tbody>${L.map(([l, k, up, p, n]) => `<tr><td class="sk1" style="left:0"><b>${l}</b></td>${cellsM(c, { k, up: !!up, p: !!p, n: !!n })}</tr>`).join("")}</tbody></table></div>
      <p class="note" style="margin:8px 0 0">Nominal dalam Rp juta · rasio terhadap OS, delta rasio dalam pp · angka dalam kurung = minus · %Penc SML & NPL = RKA ÷ aktual (maks. 120%).</p>`;
  }
  const cells = metric ? c => cellsM(c, metric) : c => {
    const os = { up: true }, lo = { up: false }, nd = { up: true }, cu = c.cur, rk = c.rk || {};
    return `<td class="r">${fv(cu.os, os)}</td>${pc(capP(cu.os, rk.os, true))}<td class="r">${fd(c.pm ? cu.os - c.pm.os : null, os)}</td><td class="r">${fd(c.py ? cu.os - c.py.os : null, os)}</td>`
      + `<td class="r">${fv(cu.sml, lo)}</td><td class="r">${pct(cu.psml, 2)}</td>${pc(capP(cu.sml, rk.sml, false))}`
      + `<td class="r">${fv(cu.npl, lo)}</td><td class="r">${pct(cu.pnpl, 2)}</td>${pc(capP(cu.npl, rk.npl, false))}`
      + `<td class="r">${fv(cu.deb, nd)}</td>${pc(capP(cu.deb, rk.deb, true))}<td class="r">${fd(c.pm ? cu.deb - c.pm.deb : null, nd)}</td>`;
  };
  const nCols = (metric ? 19 : 16) - (narrow ? 1 : 0);
  const head = metric
    ? `<tr><th rowspan="2" class="sk0">NO</th><th rowspan="2" class="sk1">${KV.ud ? "Unit Dedicated" : "Kantor Cabang"}</th>${narrow ? "" : `<th rowspan="2">Area</th>`}<th colspan="5">Histori</th><th rowspan="2">RKA<br>${mon}</th><th rowspan="2">RKA<br>Des ${yr}</th><th colspan="2">%Penc</th><th colspan="5">Delta</th><th rowspan="2">YoY<br><small>vs ${blnS(lyM)}</small></th></tr>
       <tr>${hist.map(h => `<th>${h[0]}</th>`).join("")}<th>${mon}</th><th>Des ${yr}</th><th>DtD</th><th>MtD</th><th>YtD</th><th>RKA ${BULAN[+ym.slice(5) - 1]}</th><th>RKA Des</th></tr>`
    : `<tr><th rowspan="2" class="sk0">NO</th><th rowspan="2" class="sk1">${KV.ud ? "Unit Dedicated" : "Kantor Cabang"}</th>${narrow ? "" : `<th rowspan="2">Area</th>`}<th colspan="4">OS ${prodS(KV.p)}</th><th colspan="3">SML</th><th colspan="3">NPL</th><th colspan="3">Debitur</th></tr>
       <tr><th>Posisi</th><th>%Penc ${BULAN[+ym.slice(5) - 1]}</th><th>MtD</th><th>YtD</th><th>Nominal</th><th>%</th><th>%Penc</th><th>Nominal</th><th>%</th><th>%Penc</th><th>Posisi</th><th>%Penc</th><th>MtD</th></tr>`;
  const row = x => `<tr><td class="sk0">${++no}</td><td class="sk1">${esc(x.u.nama)}</td>${narrow ? "" : `<td>${esc(areaS(x.u.area))}</td>`}${cells(x.c)}</tr>`;
  const body = g1.map(row).join("") + (g2.length ? (g1.length ? `<tr class="kgrp"><td class="sk0"></td><td class="sk1" colspan="${AC}">KC NON RM ${grpL()}</td><td colspan="${nCols - 3}"></td></tr>` : "") + g2.map(row).join("") : "")
    + subs.map(x => `<tr class="${x.cls}"><td class="sk0"></td><td class="sk1" colspan="${AC}">${esc(x.name === "TOTAL" ? "TOTAL" : String(x.name).toUpperCase())}</td>${cells(x.c)}</tr>`).join("");
  const unit = metric ? (metric.p ? "rasio terhadap OS, delta dalam pp" : metric.n ? "jumlah debitur" : "nominal dalam Rp juta") : "nominal dalam Rp juta";
  return `<div class="table-wrap"><table class="kt"><thead>${head}</thead><tbody>${body}</tbody></table></div>
    <p class="note" style="margin:8px 0 0">${unit} · urut %Penc ${metric ? KPI_L[kpi] : "OS"} ${mon} · angka dalam kurung = minus · warna %Penc: hijau ≥100%, kuning 95–100%, merah &lt;95%.</p>`;
}
// time series SML / NPL per KC: akhir tahun lalu, tanggal sama 3 bulan terakhir, posisi, RATAS 3 bulan & gap
function kTsTable(d, us, k, asPct) {
  const ds = KV.dates, R = kRefs(d), ym = d.slice(0, 7), day = +d.slice(8), yr = d.slice(0, 4);
  const same = back => { const dt = new Date(+yr, +ym.slice(5) - 1 - back, 1), mm = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
    const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate(), want = mm + "-" + String(Math.min(day, last)).padStart(2, "0"), i = kIdxOnOrBefore(want);
    return { i: i >= 0 && ds[i].startsWith(mm) ? i : -1, lbl: tglS(want).replace(/ \d\d(\d\d)$/, "'$1") }; };
  const cols = [{ i: R.ytd, lbl: R.ytd >= 0 ? blnS(ds[R.ytd].slice(0, 7)) : "Des'" + String(+yr - 1).slice(2) }, same(3), same(2), same(1), { i: R.di, lbl: tglS(d).replace(/ \d\d(\d\d)$/, "'$1") }];
  const kk = asPct ? "p" + k : k;
  const calc = uu => { const v = cols.map(c => { const sn = kSnap(c.i, uu); return sn ? sn[kk] : null; }), p = v.slice(1, 4).filter(x => x != null);
    const rt = p.length === 3 ? (p[0] + p[1] + p[2]) / 3 : null; return { v, rt, gap: rt == null || v[4] == null ? null : v[4] - rt }; };
  const fv = x => x == null ? "–" : asPct ? pct(x, 2) : Math.abs(x) < .5 ? "-" : nf0.format(x);
  const fg = x => { if (x == null || Math.abs(x) < (asPct ? 1e-6 : .5)) return "-"; const t = asPct ? nf2.format(Math.abs(x) * 100) + " pp" : nf0.format(Math.abs(x)); return x < 0 ? `<span class="good">(${t})</span>` : `<span class="bad">${t}</span>`; };
  const rmSet = kRmSet(ym), isRO = u => /^RO\b/i.test(u.nama);
  const rows = us.map(u => ({ u, c: calc([u]) })), srt = a => a.sort((x, y) => isRO(x.u) - isRO(y.u) || (y.c.gap ?? -1e15) - (x.c.gap ?? -1e15) || (y.c.v[4] || 0) - (x.c.v[4] || 0));
  const g1 = srt(rows.filter(x => rmSet.has(normKey(x.u.nama)))), g2 = srt(rows.filter(x => !rmSet.has(normKey(x.u.nama))));
  const tr = (name, c, cls = "") => `<tr class="${cls}"><td class="sk1" style="left:0">${name}</td>${c.v.map(x => `<td class="r">${fv(x)}</td>`).join("")}<td class="r rt">${fv(c.rt)}</td><td class="r rt">${fg(c.gap)}</td></tr>`;
  const grp = (t, a) => a.length ? `<tr class="kgrp lt"><td class="sk1" style="left:0">${t}</td><td colspan="7"></td></tr>` + a.map(x => tr(esc(x.u.nama), x.c)).join("") : "";
  const L = (k === "sml" ? "SML " : "NPL ") + prodS(KV.p);
  return `<h3 style="font-size:14px;margin:4px 0 8px">Time Series ${L}${asPct ? " (rasio)" : ""}</h3>
    <div class="table-wrap" style="margin-bottom:18px"><table class="kt ts"><thead><tr><th rowspan="2" class="sk1" style="left:0">Kantor Cabang</th><th colspan="5">Time Series ${L}</th><th rowspan="2" class="or">RATAS<br>3 BLN</th><th rowspan="2" class="or">GAP thd<br>RATAS</th></tr>
      <tr>${cols.map(c => `<th>${c.lbl}</th>`).join("")}</tr></thead>
      <tbody>${g2.length ? grp("KC RM " + grpL(), g1) + grp("KC NON RM " + grpL(), g2) : g1.map(x => tr(esc(x.u.nama), x.c)).join("")}${us.length > 1 ? tr("TOTAL", calc(us.filter(u => !isRO(u))), "ktot") : ""}</tbody></table></div>${k === "npl" ? `<p class="note" style="margin:-10px 0 0">${asPct ? "Rasio terhadap OS, gap dalam pp" : "Nominal dalam Rp juta"} · RATAS = rata-rata 3 bulan sebelumnya pada tanggal yang sama · TOTAL tanpa RO Medan · gap hijau dalam kurung = turun dari RATAS (membaik).</p>` : ""}`;
}
function viewKeragaan(v) {
  if (!DB.ker && KER_LOADING) { v.innerHTML = `<section class="panel"><div class="empty">Memuat data keragaan…</div></section>`; return; }
  if (!DB.ker) { v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data keragaan</p>Pastikan sheet <code>keragaan</code> dan <code>RKA</code> di Google Sheets sudah terisi, lalu tekan <b>Sync</b>.</div></section>`; return; }
  setKV(KS.prod); KS.prod = KV.p; const K = KV, ds = K.dates, PSn = prodS(KV.p), PL_ = prodL(KV.p);
  if (!ds.includes(KS.date)) KS.date = ds[ds.length - 1];
  const areas = uniq(K.units.map(u => u.area)).filter(Boolean).sort();
  if (KS.area !== "ALL" && !areas.includes(KS.area)) KS.area = "ALL";
  const kcList = (KV.ud ? uniq(K.units.map(u => u.kcb)).filter(Boolean).map(b => KC_BY.get(String(b))).filter(Boolean) : K.units).filter(u => KS.area === "ALL" || u.area === KS.area).sort((a, b) => a.nama.localeCompare(b.nama));
  if (KS.kc !== "ALL" && !kcList.some(u => String(u.boc) === KS.kc)) KS.kc = "ALL";
  const d = KS.date, ym = d.slice(0, 7), yr = d.slice(0, 4), us = kUnits(), R = kRefs(d);
  const cur = kSnap(R.di, us), pd = kSnap(R.dtd, us), pm = kSnap(R.mtd, us), py = kSnap(R.ytd, us), yy = kSnap(R.yoy, us);
  const rk = kRka(ym, us), rkD = kRka(yr + "-12", us);
  const scopeU = KS.kc !== "ALL" ? esc(kcName(KS.kc)) : KS.area !== "ALL" ? esc(areaS(KS.area)) : "RO Medan (seluruh KC)";
  const scope = esc(PL_) + " · " + (KS.kc !== "ALL" ? esc(kcName(KS.kc)) : KS.area !== "ALL" ? esc(areaS(KS.area)) : KV.ud ? "seluruh unit dedicated" : "Seluruh KC");
  const gm = pm ? cur.os - pm.os : 0, gd = pd ? cur.os - pd.os : 0, gy = py ? cur.os - py.os : 0, yoy = yy && yy.os ? cur.os / yy.os - 1 : null;
  const optsD = [...ds].reverse().map(x => `<option value="${x}" ${x === d ? "selected" : ""}>${tglS(x)}</option>`).join("");
  v.innerHTML = `
    <section class="panel" style="padding:12px 16px">
      <div class="toolbar">
        <label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Produk</span><select class="ctl" id="kPr">${PRODS.map(([k, l]) => `<option value="${k}" ${KS.prod === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Posisi</span><select class="ctl" id="kD">${optsD}</select></label>
        <label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Area</span><select class="ctl" id="kA"><option value="ALL">Semua area</option>${areas.map(a => `<option value="${esc(a)}" ${a === KS.area ? "selected" : ""}>${esc(areaS(a))}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 200px"><span class="note" style="font-weight:700">Kantor Cabang</span><select class="ctl" id="kK"><option value="ALL">Semua KC</option>${kcList.map(u => `<option value="${u.boc}" ${String(u.boc) === KS.kc ? "selected" : ""}>${esc(u.nama)}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 130px"><span class="note" style="font-weight:700">KPI</span><select class="ctl" id="kP">${Object.entries(KPI_L).map(([k, l]) => `<option value="${k}" ${KS.kpi === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      </div>
      <p class="note" style="margin:0">${scope} · posisi ${tglS(d)} · kartu ringkasan dalam Rp miliar (M), tabel dalam Rp juta${isMidMonth(d) && isBrgProd(KV.p) ? " · <b>posisi bulan berjalan:</b> SML Briguna mengikuti tanggal gajian, bandingkan dengan tanggal yang sama bulan lalu" : ""}${KV.rka && !(KV.rka.has.sml || (KV.rka.T.sml && KV.rka.T.sml.some(x => x != null))) ? " · RKA " + esc(PSn) + " hanya tersedia untuk OS" : ""}</p>
    </section>
    <div class="grid tiles">
      ${tile({ label: "OS " + esc(PSn), value: rpM(cur.os), sub: rk && rk.os ? `${pct(cur.os / rk.os, 2)} dari RKA ${blnS(ym)} ${rpM(rk.os)}` : "RKA bulan ini belum ada", meter: rk && rk.os ? cur.os / rk.os : null })}
      ${tile({ label: "Growth MtD", value: `<span class="delta ${dCls(gm)}" style="font-size:inherit">${dM(gm)}</span>`, sub: `DtD <span class="delta ${dCls(gd)}">${dM(gd)}</span> · YtD <span class="delta ${dCls(gy)}">${dM(gy)}</span>${yoy != null ? ` · YoY <span class="delta ${dCls(yoy)}">${(yoy >= 0 ? "+" : "−") + pct(Math.abs(yoy))}</span>` : ""}` })}
      ${tile({ label: "SML " + esc(PSn), value: pct(cur.psml, 2), sub: `${rpM(cur.sml)}${rk && rk.sml != null ? " · RKA " + pct(rk.psml, 2) + " " + chip("Penc " + pct(rk.sml / (cur.sml || 1), 0), lowCls(cur.sml, rk.sml)) : " · RKA –"}${cur.dsml ? ` · ${nf0.format(cur.dsml)} deb` : ""}` })}
      ${tile({ label: "NPL " + esc(PSn), value: pct(cur.pnpl, 2), sub: `${rpM(cur.npl)}${rk && rk.npl != null ? " · RKA " + pct(rk.pnpl, 2) + " " + chip("Penc " + pct(rk.npl / (cur.npl || 1), 0), lowCls(cur.npl, rk.npl)) : " · RKA –"}${cur.dnpl ? ` · ${nf0.format(cur.dnpl)} deb` : ""}` })}
      ${tile({ label: "Debitur " + esc(PSn), value: nf0.format(cur.deb), sub: `MtD <span class="delta ${dCls(pm ? cur.deb - pm.deb : 0)}">${dN(pm ? cur.deb - pm.deb : 0)}</span>${rk && rk.deb ? ` · ${pct(cur.deb / rk.deb, 1)} dari RKA` : ""}`, meter: rk && rk.deb ? cur.deb / rk.deb : null })}
    </div>
    ${KV.ud ? "" : `<section class="panel" id="kHk"><div class="panel-h"><div class="k-hlh"><h2>Highlight Konsumer</h2><div class="seg" role="tablist" aria-label="Tingkat highlight">${[["ro", "RO / pilihan"], ["area", "Per area"], ["kc", "Per kanca"]].map(([k, l]) => `<button type="button" data-hlm="${k}" aria-selected="${KS.hlm === k}">${l}</button>`).join("")}</div></div><span class="sub">${KS.hlm === "ro" ? scopeU : KS.hlm === "area" ? "seluruh area" : KS.area !== "ALL" ? esc(areaS(KS.area)) : "seluruh kanca"} · Briguna Ritel, Briguna Mikro & KPR · posisi ${tglS(d)}</span></div><div id="kHkB"></div></section>`}
    <section class="panel"><div class="panel-h"><div class="k-hlh"><h2>Highlight ${esc(PL_)}${KS.kpi !== "all" ? " · " + KPI_L[KS.kpi] : ""}</h2>${KS.kpi === "sml" || KS.kpi === "npl" || KS.kpi === "ts" ? `<div class="seg" role="tablist"><button type="button" data-km="nom" aria-selected="${KS.kmode !== "pct"}">Nominal</button><button type="button" data-km="pct" aria-selected="${KS.kmode === "pct"}">Rasio %</button></div>` : ""}</div><span class="sub">${KS.kpi === "ts" ? "SML & NPL pada tanggal yang sama tiap bulan" : "pencapaian SML & NPL = RKA ÷ aktual (maks. 120%)"}</span></div><div id="kHl"></div></section>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>OS ${esc(PSn)} vs RKA ${yr}</h2><span class="sub">posisi akhir bulan</span></div><div class="chart"><canvas id="cKOs"></canvas></div></section>
      <section class="panel"><div class="panel-h"><h2>Tren harian</h2><select class="ctl" id="kT" style="height:30px" aria-label="Indikator tren">${[["os","OS " + PSn],["psml","% SML"],["pnpl","% NPL"],["deb","Debitur"]].map(([k, l]) => `<option value="${k}" ${KS.trend === k ? "selected" : ""}>${l}</option>`).join("")}</select></div><div class="chart"><canvas id="cKTr"></canvas></div></section>
    </div>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>SML tanggal ${+d.slice(8)} tiap bulan</h2><span class="sub">dibanding RATAS 3 bulan</span></div><div class="chart"><canvas id="cKSd"></canvas></div></section>
      <section class="panel"><div class="panel-h"><h2>NPL tanggal ${+d.slice(8)} tiap bulan</h2><span class="sub">dibanding RATAS 3 bulan</span></div><div class="chart"><canvas id="cKNd"></canvas></div></section>
    </div>
    <section class="panel"><div class="panel-h"><h2>SML & NPL vs RKA ${yr}</h2><span class="sub">% terhadap OS, akhir bulan${+d.slice(8) < new Date(+yr, +d.slice(5, 7), 0).getDate() ? " · bulan berjalan = posisi " + tglS(d) : ""}</span></div><div class="chart"><canvas id="cKQ"></canvas></div></section>
    ${KS.kc === "ALL" && KS.area === "ALL" ? `<section class="panel"><div class="panel-h"><h2>Per area</h2><span class="sub">klik nama area untuk menyaring</span></div><div id="kAr"></div></section>` : ""}
    ${["ritel", "brg", "konsumer"].includes(KV.p) ? `<section class="panel"><div class="panel-h"><h2>Komposisi produk</h2><span class="sub">${esc(PL_)} · posisi ${tglS(d)}</span></div><div id="kKom"></div></section>` : ""}
    <section class="panel"><div class="panel-h"><h2>${KV.ud ? "Per unit dedicated" : "Per kantor cabang"}</h2><div class="toolbar"><span class="sub">${KV.ud ? "unit Briguna Mikro dedicated" : "klik nama KC untuk detail"}</span><button class="btn" id="kExp" type="button">Ekspor CSV</button></div></div><div id="kKc"></div></section>`;

  $("#kD").onchange = e => { KS.date = e.target.value; saveKS(); render(); };
  $("#kPr").onchange = e => { KS.prod = e.target.value; saveKS(); render(); };
  v.querySelectorAll("[data-hlm]").forEach(b => b.onclick = () => { KS.hlm = b.dataset.hlm; saveKS(); hlDraw(); v.querySelectorAll("[data-hlm]").forEach(x => x.setAttribute("aria-selected", x === b)); });
  const hlDraw = () => { const el = $("#kHkB"); if (!el) return; const m = KS.hlm;
    el.innerHTML = hlKonsumer(d, m === "ro" ? (u => (KS.area === "ALL" || u.area === KS.area) && (KS.kc === "ALL" || String(u.boc) === KS.kc)) : (u => KS.area === "ALL" || u.area === KS.area), m); };
  hlDraw();
  $("#kA").onchange = e => { KS.area = e.target.value; KS.kc = "ALL"; saveKS(); render(); };
  $("#kK").onchange = e => { KS.kc = e.target.value; saveKS(); render(); };
  $("#kT").onchange = e => { KS.trend = e.target.value; saveKS(); render(); };
  $("#kP").onchange = e => { KS.kpi = e.target.value; const t = { os: "os", sml: "psml", npl: "pnpl", deb: "deb", ts: "psml" }[KS.kpi]; if (t) KS.trend = t; saveKS(); render(); };
  v.querySelectorAll("[data-km]").forEach(b => b.onclick = () => { KS.kmode = b.dataset.km; saveKS(); render(); });

  // Highlight
  $("#kHl").innerHTML = KS.kpi === "ts" ? kTsTable(d, us, "sml", KS.kmode === "pct") + kTsTable(d, us, "npl", KS.kmode === "pct") : (KS.kpi === "all" ? kpiTable(d, us, "sum") + `<h3 class="k-sub" style="margin:18px 0 8px;font-size:14px">Per kantor cabang · semua KPI</h3>` : "") + kpiTable(d, us, KS.kpi, KS.kmode);

  // OS akhir bulan vs RKA
  const months = Array.from({ length: 12 }, (_, i) => yr + "-" + String(i + 1).padStart(2, "0"));
  const meIdx = months.map(m => m > ym ? -1 : m === ym ? R.di : kIdxBefore(m.slice(0, 4) + "-" + String(+m.slice(5) + 1).padStart(2, "0") + "-01"));
  const meIdxOk = months.map((m, i) => meIdx[i] >= 0 && ds[meIdx[i]].startsWith(m) ? meIdx[i] : -1);
  const mSnap = meIdxOk.map(i => i >= 0 ? kSnap(i, us) : null), mRka = months.map(m => kRka(m, us));
  const lastDay = new Date(+yr, +d.slice(5, 7), 0).getDate(), mLbl = months.map(m => m === ym && +d.slice(8) < lastDay ? blnS(m) + " (" + +d.slice(8) + ")" : blnS(m));
  const s1 = cssv("--s1"), s2 = cssv("--s2"), ink2 = cssv("--ink-2");
  const yM = x => nf0.format(x / 1000);
  const moneyOpts = () => baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.parsed.y == null ? "" : ` ${c.dataset.label}: ${rpM(c.parsed.y)}` } } },
    scales: { ...baseOpts().scales, y: { ...baseOpts().scales.y, beginAtZero: false, ticks: { ...baseOpts().scales.y.ticks, callback: x => yM(x) + " M" } } } });
  mkChart("cKOs", { type: "line", data: { labels: mLbl, datasets: [
    { type: "line", label: "Aktual", data: mSnap.map(s => s ? s.os : null), borderColor: s1, backgroundColor: s1, borderWidth: 2, pointRadius: 3.5, tension: .2, order: 2 },
    { type: "line", label: "RKA", data: mRka.map(r => r ? r.os : null), borderColor: ink2, borderDash: [5, 4], borderWidth: 2, pointRadius: 0, order: 1, spanGaps: true }] }, options: moneyOpts() });

  // tren harian 90 hari
  const from = Math.max(0, R.di - 89), idx = []; for (let i = from; i <= R.di; i++) idx.push(i);
  const tk = KS.trend, tSnaps = idx.map(i => kSnap(i, us));
  const isP = tk === "psml" || tk === "pnpl";
  mkChart("cKTr", { type: "line", data: { labels: idx.map(i => tglS(ds[i]).replace(/ \d{4}$/, "")), datasets: [{ label: { os: "OS " + PSn, psml: "% SML", pnpl: "% NPL", deb: "Debitur" }[tk], data: tSnaps.map(s => s[tk]), borderColor: s1, backgroundColor: s1 + "22", fill: true, tension: .25, borderWidth: 2, pointRadius: idx.map((_, i) => i === idx.length - 1 ? 4 : 0), pointBackgroundColor: s1 }] },
    options: baseOpts({ plugins: { ...baseOpts().plugins, legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => " " + (isP ? pct(c.parsed.y, 2) : tk === "deb" ? nf0.format(c.parsed.y) : rpM(c.parsed.y)) } } },
      scales: { x: { ...baseOpts().scales.x, ticks: { ...baseOpts().scales.x.ticks, maxTicksLimit: 8, maxRotation: 0 } }, y: { ...baseOpts().scales.y, beginAtZero: false, ticks: { ...baseOpts().scales.y.ticks, callback: x => isP ? nf1.format(x * 100) + "%" : tk === "deb" ? nf0.format(x) : yM(x) + " M" } } } }) });

  // SML & NPL % vs RKA
  const pOpts = baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.parsed.y == null ? "" : ` ${c.dataset.label}: ${pct(c.parsed.y, 2)}` } } },
    scales: { ...baseOpts().scales, y: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf1.format(x * 100) + "%" } } } });
  mkChart("cKQ", { type: "line", data: { labels: mLbl, datasets: [
    { label: "% SML", data: mSnap.map(s => s ? s.psml : null), borderColor: s2, backgroundColor: s2, borderWidth: 2, pointRadius: 3, tension: .2 },
    { label: "RKA % SML", data: mRka.map(r => r ? r.psml : null), borderColor: s2, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0 },
    { label: "% NPL", data: mSnap.map(s => s ? s.pnpl : null), borderColor: s1, backgroundColor: s1, borderWidth: 2, pointRadius: 3, tension: .2 },
    { label: "RKA % NPL", data: mRka.map(r => r ? r.pnpl : null), borderColor: s1, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0 }] }, options: pOpts });

  // SML pada tanggal yang sama tiap bulan (13 bulan) + RATAS 3 bulan
  const day = +d.slice(8), sd = [];
  for (let k = 12; k >= 0; k--) {
    const dt = new Date(+yr, +d.slice(5, 7) - 1 - k, 1), mm = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0");
    const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate(), want = mm + "-" + String(Math.min(day, last)).padStart(2, "0");
    const i = kIdxOnOrBefore(want); sd.push({ mm, d: want, s: i >= 0 && ds[i].startsWith(mm) ? kSnap(i, us) : null });
  }
  const sameDayChart = (id, k, nk, col) => {
    const ratas = sd.map((x, i) => { const p = sd.slice(Math.max(0, i - 3), i).filter(y => y.s); return p.length === 3 ? p.reduce((a, y) => a + y.s[k], 0) / 3 : null; });
    mkChart(id, { type: "bar", data: { labels: sd.map(x => blnS(x.mm)), datasets: [
      { type: "bar", label: (k === "psml" ? "% SML" : "% NPL") + " tgl " + day, data: sd.map(x => x.s ? x.s[k] : null), backgroundColor: sd.map((x, i) => i === sd.length - 1 ? col : col + "99"), borderRadius: 4, maxBarThickness: 24, order: 2 },
      { type: "line", label: "RATAS 3 bln", data: ratas, borderColor: ink2, borderDash: [5, 4], borderWidth: 2, pointRadius: 0, order: 1, spanGaps: true }] },
      options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.parsed.y == null ? "" : ` ${c.dataset.label}: ${pct(c.parsed.y, 2)}` + (c.datasetIndex === 0 && sd[c.dataIndex].s ? ` (${rpM(sd[c.dataIndex].s[nk])})` : "") } } },
        scales: { ...baseOpts().scales, y: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf1.format(x * 100).replace(/,0$/, "") + "%" } } } }) });
  };
  sameDayChart("cKSd", "psml", "sml", s2); sameDayChart("cKNd", "pnpl", "npl", s1);

  // tabel per area & per KC
  const rowOf = (name, uu, extra = {}) => {
    const c = kSnap(R.di, uu), a = kSnap(R.dtd, uu), m = kSnap(R.mtd, uu), y = kSnap(R.ytd, uu), r = kRka(ym, uu);
    return { name, ...extra, os: c.os, dtd: a ? c.os - a.os : 0, mtd: m ? c.os - m.os : 0, ytd: y ? c.os - y.os : 0, rka: r ? r.os : 0, prka: r && r.os ? c.os / r.os : null,
      sml: c.sml, psml: c.psml, rsml: r ? r.psml : 0, npl: c.npl, pnpl: c.pnpl, rnpl: r ? r.pnpl : 0, deb: c.deb, dmtd: m ? c.deb - m.deb : 0 };
  };
  const cols = first => [first,
    { key: "os", label: "OS (M)", r: 1, fmt: x => nf2.format(x / 1000) },
    { key: "dtd", label: "DtD", r: 1, fmt: x => `<span class="delta ${dCls(x)}">${dM(x).replace(" M", "")}</span>` },
    { key: "mtd", label: "MtD", r: 1, fmt: x => `<span class="delta ${dCls(x)}">${dM(x).replace(" M", "")}</span>` },
    { key: "ytd", label: "YtD", r: 1, fmt: x => `<span class="delta ${dCls(x)}">${dM(x).replace(" M", "")}</span>` },
    { key: "prka", label: "%RKA " + blnS(ym), r: 1, sortVal: r => r.prka ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 1), osCls(x)) },
    { key: "psml", label: "% SML", r: 1, fmt: (x, r) => chip(pct(x, 2), lowCls(x, r.rsml)) },
    { key: "pnpl", label: "% NPL", r: 1, fmt: (x, r) => chip(pct(x, 2), lowCls(x, r.rnpl)) },
    { key: "sml", label: "SML (M)", r: 1, fmt: x => nf2.format(x / 1000) },
    { key: "npl", label: "NPL (M)", r: 1, fmt: x => nf2.format(x / 1000) },
    { key: "deb", label: "Debitur", r: 1, fmt: x => nf0.format(x) },
    { key: "dmtd", label: "Deb MtD", r: 1, fmt: x => `<span class="delta ${dCls(x)}">${dN(x)}</span>` }];
  if ($("#kAr")) {
    const ar = areas.map(a => rowOf(a, K.units.map((u, i) => ({ ...u, i })).filter(u => u.area === a), { area: a })).filter(r => r.os > 0);
    table($("#kAr"), cols({ key: "name", label: "Area", fmt: (x, r) => `<button class="linkish" data-area="${esc(r.area)}">${esc(areaS(x))}</button>` }), ar,
      { sortKey: "os", after: el => el.querySelectorAll("[data-area]").forEach(b => b.onclick = () => { KS.area = b.dataset.area; KS.kc = "ALL"; saveKS(); render(); }) });
  }
  const kr = us.filter(u => kSnap(R.di, [u]).os > 0).map(u => rowOf(u.nama, [u], { boc: u.boc, area: u.area, kcb: u.kcb }));
  const kcCols = cols({ key: "name", label: KV.ud ? "Unit" : "Kantor cabang", fmt: (x, r) => KV.ud ? `${esc(x)}<br><small class="note">${r.boc} · ${esc(kcName(r.kcb))}</small>` : `<button class="linkish" data-kc="${r.boc}">${esc(x)}</button><br><small class="note">${r.boc} · ${esc(areaS(r.area).replace(/ · .*/, ""))}</small>` });
  table($("#kKc"), kcCols, kr, { sortKey: "os", foot: kr.length > 1 ? { name: "Total", os: nf2.format(cur.os / 1000), dtd: dM(gd).replace(" M", ""), mtd: dM(gm).replace(" M", ""), ytd: dM(gy).replace(" M", ""), prka: rk ? chip(pct(cur.os / rk.os, 1), osCls(cur.os / rk.os)) : "–", psml: pct(cur.psml, 2), pnpl: pct(cur.pnpl, 2), sml: nf2.format(cur.sml / 1000), npl: nf2.format(cur.npl / 1000), deb: nf0.format(cur.deb), dmtd: dN(pm ? cur.deb - pm.deb : 0) } : null,
    after: el => el.querySelectorAll("[data-kc]").forEach(b => b.onclick = () => { KS.kc = b.dataset.kc; saveKS(); render(); window.scrollTo(0, 0); }) });
  if ($("#kKom")) {
    const parts = KV.p === "konsumer" ? ["karya", "purna", "prapurna", "mikro", "kpr"] : KV.p === "brg" ? ["karya", "purna", "prapurna", "mikro"] : ["karya", "purna", "prapurna"];
    const comp = parts.map(p => { const m = DB.ker.P[p]; const snap = k => us.reduce((a, u) => a + (m[k][R.di]?.[u.i] || 0), 0);
      const o = { p: prodL(p), os: snap("os"), sml: snap("sml"), npl: snap("npl"), deb: snap("deb") }; o.psml = o.os ? o.sml / o.os : 0; o.pnpl = o.os ? o.npl / o.os : 0; return o; });
    table($("#kKom"), [{ key: "p", label: "Produk" }, { key: "deb", label: "Debitur", r: 1, fmt: x => nf0.format(x) }, { key: "sd", label: "% deb", r: 1, sortVal: r => r.deb, fmt: (x, r) => pct(cur.deb ? r.deb / cur.deb : 0, 1) },
      { key: "os", label: "OS (M)", r: 1, fmt: x => nf2.format(x / 1000) }, { key: "so", label: "% OS", r: 1, sortVal: r => r.os, fmt: (x, r) => pct(cur.os ? r.os / cur.os : 0, 1) },
      { key: "sml", label: "SML (M)", r: 1, fmt: x => nf2.format(x / 1000) }, { key: "psml", label: "% SML", r: 1, fmt: x => pct(x, 2) }, { key: "npl", label: "NPL (M)", r: 1, fmt: x => nf2.format(x / 1000) }, { key: "pnpl", label: "% NPL", r: 1, fmt: x => chip(pct(x, 2), nplCls(x)) }], comp,
      { sortKey: "os", foot: { p: "Total", deb: nf0.format(cur.deb), sd: "100%", os: nf2.format(cur.os / 1000), so: "100%", sml: nf2.format(cur.sml / 1000), psml: pct(cur.psml, 2), npl: nf2.format(cur.npl / 1000), pnpl: pct(cur.pnpl, 2) } });
  }
  $("#kExp").onclick = () => exportCSV("keragaan-" + KV.p + "-" + d, [["boc","BOC"],["name","Kantor Cabang"],["area","Area"],["os","OS (juta)"],["dtd","DtD"],["mtd","MtD"],["ytd","YtD"],["rka","RKA (juta)"],["prka","%RKA"],["sml","SML"],["psml","%SML"],["npl","NPL"],["pnpl","%NPL"],["deb","Debitur"],["dmtd","Deb MtD"]], kr);
}

/* ---------- impor file Master Keragaan ---------- */
function findSheet(wb, need) {
  for (const n of wb.SheetNames) {
    const a = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null, blankrows: false });
    for (let h = 0; h < Math.min(5, a.length); h++) { const hd = (a[h] || []).map(x => normKey(x ?? "")); if (need.every(k => hd.includes(k))) return { rows: a.slice(h + 1), h: hd, name: n }; }
  }
  return null;
}
const numX = v => { if (typeof v === "number") return isFinite(v) ? v : 0; const s = String(v ?? "").trim(); if (!s || /^-+$/.test(s)) return 0; const n = parseFloat(s.replace(/[^\d.\-]/g, "")); return isFinite(n) ? n : 0; };
const isoX = v => typeof v === "number" ? new Date(Math.round((v - 25569) * 864e5)).toISOString().slice(0, 10) : v instanceof Date ? iso(v) : normDate(v);
/* ================= VIEW: Produktivitas RM (dari Database history + database harian) ================= */
// DB.rmk = { months[{ym,kc,rm,jg,area,tDeb,tDisb,sDeb,sOs,kDeb,kOs,deb,os,kuad}], tx[{d,rm,kc,pl,deb,jenis}], asof }
const RS = Object.assign({ ym: null, area: "ALL", kc: "ALL", cmp: "mtd", cmpG: "kc", sel: null, selKc: null, pm: "rm", selYr: null, co: "berjalan", rkm: "m", apxG: "kc" }, lsGet(STORE + "-rm") || {});
const saveRS = () => lsSet(STORE + "-rm", RS);
const kuadOf = p => p == null ? null : p >= 1.05 ? 1 : p >= 1 ? 2 : p >= .5 ? 3 : 4;
const kq = k => k ? `<span class="kq k${k}" title="Kuadran ${k}">K${k}</span>` : `<span class="kq k0">–</span>`;
const nmKey = s => String(s || "").toLowerCase().replace(/y/g, "i").replace(/[^a-z]/g, "");
const ymS = ym => BULAN[+ym.slice(5, 7) - 1] + "'" + ym.slice(2, 4);
const jenisOf = j => { j = String(j || "").toLowerCase(); return /kprs|subsidi|flpp/.test(j) ? "KPRS" : /tier\s*1/.test(j) ? "Tier 1" : /tier\s*2/.test(j) ? "Tier 2" : /tier\s*3/.test(j) ? "Tier 3" : /second|take|top/.test(j) ? "Secondary / TO / Top Up" : "Lainnya"; };
const JENIS = ["KPRS", "Tier 1", "Tier 2", "Tier 3", "Secondary / TO / Top Up", "Lainnya"];
function rmAreaOf(kc) { const a = DB.rmk.months.find(x => x.kc === kc && x.area); return a ? a.area : kcArea(kc); }
function rmSummary(ym) {
  const P = DB.rmk; ym = ym || P.asof.slice(0, 7);
  const rows = P.months.filter(x => x.ym === ym && (x.tDisb > 0 || x.os > 0));
  const tgt = rows.filter(x => x.tDisb > 0);
  return { ym, rows, os: sum(rows, "os"), tDisb: sum(tgt, "tDisb"), capai: tgt.filter(x => x.os >= x.tDisb).length, n: tgt.length };
}
// warna kartu RM/cabang: atas = kuadran bulan berjalan, bawah = kuadran carry over (K1 biru, K2 hijau, K3 kuning, K4 merah)
// [atas (lebih terang), bawah (lebih dalam)]; warna dicampur lewat jalur rona oklch yang dipilih per pasangan agar transisi tetap cerah
const RMC_Q = { 0: ["#8d9bb8", "#55637f"], 1: ["#5b9cf0", "#2a5fc4"], 2: ["#3cc08c", "#13845a"], 3: ["#f0b93e", "#d48f0e"], 4: ["#f0737f", "#c4364c"] };
const RMC_OK = typeof CSS !== "undefined" && CSS.supports("background", "linear-gradient(in oklch longer hue, red, blue)");
function rmcBg(a, b) {
  const A = RMC_Q[a][0], B = RMC_Q[b][1], k = a + "" + b;
  const how = !a || !b ? "in oklab" : { "42": "in oklch longer hue", "24": "in oklch longer hue", "13": "in oklch decreasing hue", "23": "in oklch", "32": "in oklch" }[k] || "in oklch";
  const hl = "radial-gradient(70% 55% at 8% 0%,rgba(255,255,255,.26),rgba(255,255,255,0) 70%),radial-gradient(60% 60% at 100% 100%,rgba(0,0,0,.14),rgba(0,0,0,0) 70%)";
  return `${hl},linear-gradient(${RMC_OK ? how + " " : ""}170deg,${A} 0%,${B} 100%)`;
}
// foto RM (DB.foto.map, kunci = nmKey nama); tanpa foto tampil inisial berwarna
const AV_COL = ["#1d63c4", "#0b7a75", "#7a4fd1", "#c2410c", "#0f766e", "#be185d", "#4d7c0f", "#1e40af"];
function rmAvatar(name, size = 36, cls = "") {
  const k = nmKey(name), src = DB.foto && DB.foto.rm ? DB.foto.rm[k] : null;
  const ini = String(name || "?").trim().split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
  let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<span class="av ${cls}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;--av:${AV_COL[h % AV_COL.length]}">${src ? `<img src="${src}" alt="Foto ${esc(name)}" loading="lazy">` : ini}</span>`;
}
// ikon / logo kantor cabang dari sheet "RM & KC card"; tanpa ikon tampil gambar gedung
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
  }
  const P = DB.rmk, yms = uniq(P.months.filter(x => x.os > 0 || x.deb > 0).map(x => x.ym)).sort();
  if (!yms.includes(RS.ym)) RS.ym = P.asof && yms.includes(P.asof.slice(0, 7)) ? P.asof.slice(0, 7) : yms[yms.length - 1];
  const ym = RS.ym, yr = ym.slice(0, 4), isCur = P.asof && P.asof.startsWith(ym), day = isCur ? +P.asof.slice(8) : 31;
  const areas = uniq(P.months.map(x => x.area)).filter(Boolean).sort();
  const kcs = uniq(P.months.filter(x => RS.area === "ALL" || x.area === RS.area).map(x => x.kc)).filter(Boolean).sort();
  if (RS.kc !== "ALL" && !kcs.includes(RS.kc)) RS.kc = "ALL";
  const inScope = x => (RS.area === "ALL" || x.area === RS.area) && (RS.kc === "ALL" || x.kc === RS.kc);
  const rows = P.months.filter(x => x.ym === ym && inScope(x) && (x.tDisb > 0 || x.os > 0)).map(x => ({ ...x, pen: x.tDisb ? x.os / x.tDisb : null }));
  const prevYm = (() => { const d = new Date(+yr, +ym.slice(5, 7) - 2, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); })();
  const rmSet = new Set(P.months.filter(inScope).map(x => nmKey(x.rm)));
  const txIn = (m, maxDay = 31) => P.tx.filter(t => t.d.startsWith(m) && +t.d.slice(8) <= maxDay && (rmSet.has(nmKey(t.rm)) || (RS.area === "ALL" && RS.kc === "ALL")));
  const hasTx = P.tx.some(t => t.d.startsWith(ym)), hasPrevTx = P.tx.some(t => t.d.startsWith(prevYm));
  const os = sum(rows, "os"), deb = sum(rows, "deb"), tgtRows = rows.filter(x => x.tDisb > 0), tDisb = sum(tgtRows, "tDisb"), tDeb = sum(tgtRows, "tDeb");
  let pOs = null, pDeb = null, pLbl = "";
  if (hasPrevTx && hasTx) { const pt = txIn(prevYm, day); pOs = sum(pt, "pl"); pDeb = sum(pt, "deb"); pLbl = isCur ? `s.d. ${day} ${BULAN[+prevYm.slice(5) - 1]}` : ymS(prevYm); }
  else { const pr = P.months.filter(x => x.ym === prevYm && inScope(x)); if (pr.length) { pOs = sum(pr, "os"); pDeb = sum(pr, "deb"); pLbl = ymS(prevYm); } }
  const kc4 = [1, 2, 3, 4].map(k => tgtRows.filter(x => kuadOf(x.pen) === k).length);
  const capai = kc4[0] + kc4[1];
  const per = isCur ? `s.d. ${tglS(P.asof)}` : ymS(ym);
  v.innerHTML = `
    <section class="panel" style="padding:12px 16px">
      ${segB}
      <div class="rm-mode" role="group" aria-label="Lihat produktivitas">
        <button type="button" data-rmm="rm" aria-pressed="${RS.pm !== "kc"}"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.9-4 4-6 8-6s7.1 2 8 6"/></svg>Per RM</button>
        <button type="button" data-rmm="kc" aria-pressed="${RS.pm === "kc"}"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/></svg>Per Cabang</button>
      </div>
      <div class="toolbar">
        <label class="field" style="flex:1 1 140px"><span class="note" style="font-weight:700">Bulan</span><select class="ctl" id="rY">${[...yms].reverse().map(m => `<option value="${m}" ${m === ym ? "selected" : ""}>${ymS(m)}${P.asof && P.asof.startsWith(m) ? " (berjalan)" : ""}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Area</span><select class="ctl" id="rA"><option value="ALL">Semua area</option>${areas.map(a => `<option value="${esc(a)}" ${a === RS.area ? "selected" : ""}>${esc(areaS(a))}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 200px"><span class="note" style="font-weight:700">Kantor Cabang</span><select class="ctl" id="rK"><option value="ALL">Semua KC</option>${kcs.map(k => `<option ${k === RS.kc ? "selected" : ""}>${esc(k)}</option>`).join("")}</select></label>
      </div>
      <p class="note" style="margin:0">${esc(RL.seg)} · ${SEG.rm === "K" ? "disbursement" : "net disburse"} ${per} · Rp juta · kuadran: K1 ≥105%, K2 100–105%, K3 50–100%, K4 &lt;50% dari target disbursement</p>
    </section>
    <div class="grid tiles">
      ${tile({ label: "Disbursement " + per, value: rpJ(os), sub: pOs != null ? `vs ${rpJ(pOs)} (${pLbl}) <span class="delta ${dCls(os - pOs)}">${(os - pOs >= 0 ? "+" : "−") + nf0.format(Math.abs(os - pOs))} Jt</span>` : "" })}
      ${tile({ label: "Pencapaian target", value: tDisb ? pct(os / tDisb, 1) : "–", sub: `target ${rpJ(tDisb)}`, meter: tDisb ? os / tDisb : null })}
      ${tile({ label: "Jumlah debitur", value: nf0.format(deb), sub: `${tDeb ? "target " + nf0.format(tDeb) + " · " : ""}${pDeb != null ? `vs ${nf0.format(pDeb)} <span class="delta ${dCls(deb - pDeb)}">${dN(deb - pDeb)}</span>` : ""}` })}
      ${tile({ label: "Rata-rata plafon / deb", value: rpJ(deb ? os / deb : 0), sub: `${nf0.format(rows.length)} RM aktif` })}
      ${tile({ label: RL.who + " capai target", value: `${capai} <small style="font-size:14px;color:var(--muted)">/ ${tgtRows.length}</small>`, sub: chip(pct(tgtRows.length ? capai / tgtRows.length : 0, 0) + " RM", capai / (tgtRows.length || 1) >= .5 ? "good" : capai / (tgtRows.length || 1) >= .25 ? "warn" : "crit") })}
      ${tile({ label: "Sebaran kuadran", value: `<span style="white-space:nowrap;letter-spacing:-.02em">${kc4.join("<small style=\"opacity:.45;margin:0 .18em\">·</small>")}</span>`, sub: [1, 2, 3, 4].map(k => kq(k)).join(" ") })}
    </div>
    ${SEG.rm !== "K" ? '<section class="panel" id="rNett"></section>' : ""}
    <section class="panel" id="rPer"></section>
    <section class="panel" id="rDay"></section>
    <section class="panel" id="rCmp"></section>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Disbursement bulanan vs target</h2><span class="sub">${RL.s} & ${RL.k}</span></div><div class="chart"><canvas id="cRmMon"></canvas></div></section>
      <section class="panel"><div class="panel-h"><h2>Komposisi ${RL.s} & ${RL.k}</h2><span class="sub">${per}</span></div><div class="chart"><canvas id="cRmJen"></canvas></div></section>
    </div>
    <section class="panel" ${RS.pm === "kc" ? "hidden" : ""}><div class="panel-h"><h2>Peringkat ${RL.who}</h2><div class="toolbar"><div class="seg" role="tablist" aria-label="Dasar peringkat"><button type="button" role="tab" aria-selected="${RS.rkm !== "co"}" data-rkm="m">Bulan berjalan</button><button type="button" role="tab" aria-selected="${RS.rkm === "co"}" data-rkm="co">Carry over</button></div><span class="sub" id="rLbS">garis = 100% target · klik nama untuk lihat pencapaiannya</span><button class="btn" id="rExp" type="button">Ekspor CSV</button></div></div><div class="lb" id="rLb"></div></section>
    <section class="panel" ${RS.pm === "kc" ? "" : "hidden"}><div class="panel-h"><h2>Per kantor cabang</h2><span class="sub">${ymS(ym)}</span></div><div id="rKc"></div></section>
    <section class="panel" ${RS.pm === "kc" ? "hidden" : ""}><div class="panel-h"><h2>History kuadran ${RL.who} ${yr}</h2><span class="sub">per bulan</span></div><div id="rHq"></div></section>
    <section class="panel" id="rApx" data-nosec></section>`;
  $("#rY").onchange = e => { RS.ym = e.target.value; saveRS(); render(); };
  bindSeg();
  v.querySelectorAll("[data-rmm]").forEach(b => b.onclick = () => { if (RS.pm === b.dataset.rmm) return; RS.pm = RS.cmpG = b.dataset.rmm; RS.selYr = null; saveRS(); render(); });
  $("#rA").onchange = e => { RS.area = e.target.value; RS.kc = "ALL"; saveRS(); render(); };
  $("#rK").onchange = e => { RS.kc = e.target.value; saveRS(); render(); };

  // peringkat
  const coEnd = (RS.co === "des" ? 12 : +RS.co) || (yr < (P.asof || "9").slice(0, 4) ? 12 : +(P.asof || "").slice(5, 7) || 12), isCo = RS.rkm === "co";
  const coMs = Array.from({ length: coEnd }, (_, i) => yr + "-" + String(i + 1).padStart(2, "0"));
  const coRows = () => uniq(P.months.filter(x => coMs.includes(x.ym) && inScope(x) && (x.tDisb > 0 || x.os > 0)).map(x => nmKey(x.rm))).map(k => {
    const a = P.months.filter(x => coMs.includes(x.ym) && inScope(x) && nmKey(x.rm) === k), l = a[a.length - 1];
    const o = { rm: l.rm, kc: l.kc, jg: l.jg, tDisb: sum(a, "tDisb"), tDeb: sum(a, "tDeb"), os: sum(a, "os"), deb: sum(a, "deb"), sDeb: sum(a, "sDeb"), sOs: sum(a, "sOs"), kDeb: sum(a, "kDeb"), kOs: sum(a, "kOs") };
    o.pen = o.tDisb ? o.os / o.tDisb : null; return o; });
  const lb = [...(isCo ? coRows() : rows)].sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os);
  $("#rLbS").textContent = (isCo ? `carry over Jan s.d. ${BULAN[coEnd - 1]} ${yr} · ` : `${ymS(ym)} · `) + "garis = 100% target · klik nama untuk lihat pencapaiannya";
  v.querySelectorAll("[data-rkm]").forEach(b => b.onclick = () => { if (RS.rkm === b.dataset.rkm) return; RS.rkm = b.dataset.rkm; saveRS(); render(); });
  const last6 = (() => { const out = []; for (let i = 5; i >= 0; i--) { const d = new Date(+yr, +ym.slice(5, 7) - 1 - i, 1); out.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")); } return out; })();
  const kOf = (rm, m) => { const r = P.months.find(x => x.ym === m && nmKey(x.rm) === nmKey(rm)); return r && r.tDisb ? kuadOf(r.os / r.tDisb) : null; };
  $("#rLb").innerHTML = lb.length ? lb.map((x, i) => `<div class="lb-row" style="grid-template-columns:28px minmax(0,1.4fr) minmax(0,2fr) auto">
      <span class="lb-rank">${i + 1}</span>
      <div class="lb-name wav">${rmAvatar(x.rm, 34)}<div><button class="linkish" data-rm="${esc(x.rm)}">${esc(x.rm)}</button><small>${esc(x.kc)}${x.jg ? " · " + esc(x.jg) : ""}</small></div></div>
      <div class="lb-mid"><div class="lb-bar"><i style="width:${clamp((x.pen || 0) / 1.5, 0, 1) * 100}%;background:var(--${x.pen == null ? "muted" : capaiCls(x.pen)})"></i><span class="tick"></span></div>
        <div class="lb-val">${rpJ(x.os)} / ${x.tDisb ? rpJ(x.tDisb) : "tanpa target"} · ${x.deb} deb (${RL.s[0]} ${x.sDeb} · ${RL.k[0]} ${x.kDeb}) · ${last6.map(m => kq(kOf(x.rm, m))).join("")}</div></div>
      <span style="display:flex;gap:6px;align-items:center">${x.pen != null ? chip(pct(x.pen, 0), capaiCls(x.pen)) : ""}${kq(kuadOf(x.pen))}</span></div>`).join("") : '<div class="empty">Tidak ada RM pada filter ini.</div>';
  $("#rLb").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => openRM(b.dataset.rm));
  if (!RS.sel || !P.months.some(x => nmKey(x.rm) === nmKey(RS.sel) && inScope(x))) RS.sel = lb.length ? lb[0].rm : null;
  renderRMPer(inScope);
  if (SEG.rm !== "K") renderRmNett({ P, inScope, ym, isCur });
  $("#rExp").onclick = () => exportCSV("produktivitas-" + RL.seg.toLowerCase().replace(/\W+/g, "-") + "-" + (isCo ? "carry-over-" + yr + "-" + String(coEnd).padStart(2, "0") : ym), [["rm","RM"],["kc","KC"],["jg","JG"],["tDisb","Target disb (juta)"],["os","Realisasi (juta)"],["pen","Pencapaian"],["tDeb","Target deb"],["deb","Deb"],["sDeb","Deb " + RL.s.toLowerCase()],["sOs",RL.s + " (juta)"],["kDeb","Deb " + RL.k.toLowerCase()],["kOs",RL.k + " (juta)"]], lb);

  // per KC
  const kcRows = uniq(rows.map(x => x.kc)).map(kc => { const a = rows.filter(x => x.kc === kc), t = a.filter(x => x.tDisb > 0), tt = sum(t, "tDisb"), o = sum(a, "os");
    return { kc, rm: a.length, os: o, t: tt, pen: tt ? o / tt : null, deb: sum(a, "deb"), k12: t.filter(x => x.os >= x.tDisb).length }; });
  table($("#rKc"), [{ key: "kc", label: "Kantor cabang" }, { key: "rm", label: "RM", r: 1 }, { key: "os", label: "Realisasi", r: 1, fmt: x => nf1.format(x) },
    { key: "t", label: "Target", r: 1, fmt: x => nf0.format(x) }, { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) },
    { key: "deb", label: "Deb", r: 1 }, { key: "k12", label: "RM ≥100%", r: 1, fmt: (x, r) => `${x}/${r.rm}` }], kcRows,
    { sortKey: "pen", foot: kcRows.length > 1 ? { kc: "Total", rm: rows.length, os: nf1.format(os), t: nf0.format(tDisb), pen: tDisb ? chip(pct(os / tDisb, 0), capaiCls(os / tDisb)) : "–", deb, k12: `${capai}/${rows.length}` } : null });

  // history kuadran
  const yrMonths = Array.from({ length: 12 }, (_, i) => yr + "-" + String(i + 1).padStart(2, "0")).filter(m => m <= (P.asof || "9").slice(0, 7));
  const hq = uniq(P.months.filter(x => x.ym.startsWith(yr) && inScope(x) && x.tDisb > 0).map(x => x.rm)).map(rm => {
    const o = { rm, kc: (P.months.find(x => x.rm === rm && x.ym.startsWith(yr)) || {}).kc };
    yrMonths.forEach((m, i) => o["m" + i] = kOf(rm, m)); const ks = yrMonths.map((m, i) => o["m" + i]).filter(Boolean);
    o.avg = ks.length ? ks.reduce((a, b) => a + b, 0) / ks.length : 9; o.k12 = ks.filter(k => k <= 2).length; return o; });
  table($("#rHq"), [{ key: "rm", label: "RM", fmt: (x, r) => `${esc(x)}<br><small class="note">${esc(r.kc || "")}</small>` },
    ...yrMonths.map((m, i) => ({ key: "m" + i, label: ymS(m).replace(/'.*/, ""), r: 1, sortVal: r => r["m" + i] ?? 9, fmt: k => kq(k) })),
    { key: "k12", label: "Bulan ≥100%", r: 1 }, { key: "avg", label: "Rata kuadran", r: 1, fmt: x => x === 9 ? "–" : nf1.format(x) }], hq, { state: { key: "avg", dir: 1 }, page: 20 });

  // grafik
  const s1 = cssv("--s1"), s2 = cssv("--s2"), ink2 = cssv("--ink-2");
  const sk = [[RL.s, sum(rows, "sOs"), sum(rows, "sDeb"), s1], [RL.k, sum(rows, "kOs"), sum(rows, "kDeb"), s2]];
  mkChart("cRmJen", { type: "bar", data: { labels: sk.map(x => x[0]), datasets: [{ label: "Disbursement", data: sk.map(x => x[1]), backgroundColor: sk.map(x => x[3]), borderRadius: 4, maxBarThickness: 34 }] },
    options: baseOpts({ indexAxis: "y", interaction: { mode: "nearest", intersect: true }, plugins: { ...baseOpts().plugins, legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${rpJ(c.parsed.x)} · ${nf0.format(sk[c.dataIndex][2])} deb · ${pct(os ? sk[c.dataIndex][1] / os : 0, 1)}` } } },
      scales: { x: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1000) + " M" } }, y: { ...baseOpts().scales.x, ticks: { ...baseOpts().scales.x.ticks, color: ink2, font: { size: 12 } } } } }) });
  renderRMDaily({ P, txIn, ym, isCur, day });
  renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day });
  renderRMAppx({ P, txIn, ym, isCur, day, inScope, yr });
  const allYm = uniq(P.months.map(x => x.ym)).sort().filter(m => m <= (P.asof || "9").slice(0, 7)).slice(-18);
  const mAgg = allYm.map(m => { const a = P.months.filter(x => x.ym === m && inScope(x)); return { s: sum(a, "sOs"), k: sum(a, "kOs"), t: sum(a.filter(x => x.tDisb > 0), "tDisb") }; });
  mkChart("cRmMon", { type: "bar", data: { labels: allYm.map(ymS), datasets: [
    { type: "bar", label: RL.s, data: mAgg.map(x => x.s), backgroundColor: s1, borderColor: cssv("--surface"), borderWidth: { top: 2 }, borderRadius: 2, maxBarThickness: 22, stack: "a", order: 2 },
    { type: "bar", label: RL.k, data: mAgg.map(x => x.k), backgroundColor: s2, borderColor: cssv("--surface"), borderWidth: { bottom: 2 }, borderRadius: 2, maxBarThickness: 22, stack: "a", order: 2 },
    { type: "line", label: "Target", data: mAgg.map(x => x.t || null), borderColor: ink2, borderDash: [5, 4], borderWidth: 2, pointRadius: 0, order: 1 }] },
    options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${c.dataset.label}: ${rpJ(c.parsed.y)}` } } },
      scales: { x: { ...baseOpts().scales.x, stacked: true }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1000) + " M" } } } }) });
}
// perbandingan: bulan berjalan s.d. tanggal yang sama vs 3 bulan sebelumnya, dan tahun lalu vs tahun ini
function renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day }) {
  const el = $("#rCmp"); if (!el) return;
  const mode = "yoy", grp = RS.cmpG === "rm" ? "rm" : "kc", y1 = String(+yr - 1);
  const addM = (m, k) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + k, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const nDays = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const D = isCur ? day : nDays(ym);
  const kcMap = new Map(P.months.map(x => [x.ym + "|" + nmKey(x.rm), x.kc]));
  const gOf = t => grp === "rm" ? t.rm : (kcMap.get(t.d.slice(0, 7) + "|" + nmKey(t.rm)) || t.kc);
  const pal = [cssv("--s1"), cssv("--s2"), cssv("--s3"), "#eda100"], ink2 = cssv("--ink-2");
  const pc = (a, b) => b ? (a / b - 1) : null, dl = v => v == null ? "–" : `<span class="delta ${dCls(v)}">${(v >= 0 ? "+" : "−") + pct(Math.abs(v), 1)}</span>`;
  const dJ = v => `<span class="delta ${dCls(v)}">${(v >= 0 ? "+" : "−") + nf1.format(Math.abs(v))}</span>`;
  const yo = mode === "yoy";
  el.innerHTML = `<div class="panel-h"><h2>Perbandingan disbursement ${y1} vs ${yr}</h2></div>
    <p class="note" style="margin:0">${yo ? `Disbursement per bulan ${y1} dibanding ${yr} dan kumulatif (YtD). ${isCur ? `${BULAN[+ym.slice(5, 7) - 1]} ${yr} baru s.d. ${tglS(P.asof)}, sedangkan ${BULAN[+ym.slice(5, 7) - 1]} ${y1} sebulan penuh (data harian ${y1} tidak tersedia), jadi selisih bulan ini belum sebanding.` : ""}` : `Disbursement s.d. tanggal ${D} di ${ymS(ym)} dibanding tanggal yang sama di 3 bulan sebelumnya. Rp juta.`}</p>
    <div class="chart tall"><canvas id="cCmp"></canvas></div>
    <div id="tCmp"></div>`;
  el.querySelectorAll("[data-cmp]").forEach(b => b.onclick = () => { RS.cmp = b.dataset.cmp; saveRS(); renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day }); });
  el.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { RS.cmpG = b.dataset.g; saveRS(); renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day }); });
  if (!yo) {
    const ms = [addM(ym, -3), addM(ym, -2), addM(ym, -1), ym];
    if (!ms.some(m => P.tx.some(t => t.d.startsWith(m)))) { $("#cCmp").parentElement.innerHTML = '<div class="empty">Belum ada data pencairan harian untuk bulan-bulan ini.</div>'; return; }
    const tx = ms.map(m => txIn(m)), cut = tx.map(a => a.filter(t => +t.d.slice(8) <= D));
    const full = ms.map((m, i) => { const r = P.months.filter(x => x.ym === m && inScope(x)); return r.length ? { os: sum(r, "os"), t: sum(r.filter(x => x.tDisb > 0), "tDisb") } : { os: sum(tx[i], "pl"), t: 0 }; });
    const maxD = Math.max(...ms.map(nDays));
    mkChart("cCmp", { type: "line", data: { labels: Array.from({ length: maxD }, (_, i) => i + 1), datasets: ms.map((m, i) => i).reverse().map(i => { const m = ms[i];
      const last = m === ym ? D : nDays(m), out = []; let c = 0;
      for (let d = 1; d <= last; d++) { c += sum(tx[i].filter(t => +t.d.slice(8) === d), "pl"); out.push(c); }
      return { label: ymS(m), data: out, borderColor: pal[3 - i] , backgroundColor: pal[3 - i], borderWidth: m === ym ? 3 : 1.6, pointRadius: out.map((_, k) => m === ym && k === out.length - 1 ? 5 : k === D - 1 ? 3 : 0), tension: .15, order: m === ym ? 0 : 1 }; }) },
      options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { title: c => "s.d. tanggal " + c[0].label, label: c => ` ${c.dataset.label}: ${rpJ(c.parsed.y)}` } } },
        scales: { x: { ...baseOpts().scales.x, ticks: { ...baseOpts().scales.x.ticks, maxTicksLimit: 16, maxRotation: 0, color: c => c.index === D - 1 ? cssv("--ink") : cssv("--muted") } }, y: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1000) + " M" } } } }) });
    const cur = sum(cut[3], "pl");
    const rows = ms.map((m, i) => { const o = sum(cut[i], "pl"); return { m, os: o, deb: sum(cut[i], "deb"), full: full[i].os, t: full[i].t, pen: full[i].t ? o / full[i].t : null, vs: m === ym ? null : cur - o, vsP: m === ym ? null : pc(cur, o) }; }).reverse();
    const avg3 = sum(rows.slice(1), "os") / 3;
    table($("#tCmp"), [{ key: "m", label: "Bulan", fmt: m => `<b>${ymS(m)}</b>${m === ym ? ' <small class="note">berjalan</small>' : ""}` },
      { key: "os", label: `Disb s.d. tgl ${D}`, r: 1, fmt: x => `<b>${nf1.format(x)}</b>` }, { key: "deb", label: "Deb", r: 1 },
      { key: "pen", label: "% target s.d. tgl", r: 1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) },
      { key: "vs", label: `${ymS(ym)} vs bulan ini`, r: 1, fmt: (x, r) => x == null ? "–" : `${dJ(x)}<br><small>${dl(r.vsP)}</small>` },
      { key: "full", label: "Total sebulan", r: 1, fmt: (x, r) => r.m === ym ? `<span class="note">berjalan</span>` : nf1.format(x) }], rows,
      { state: { key: "m", dir: -1 }, foot: { m: "Rata-rata 3 bulan", os: nf1.format(avg3), vs: `${dJ(cur - avg3)}<br><small>${dl(pc(cur, avg3))}</small>` } });
    const keys = uniq(cut.flat().map(gOf)).filter(Boolean);
    const gr = keys.map(k => { const o = { k }; ms.forEach((m, i) => o["m" + i] = sum(cut[i].filter(t => gOf(t) === k), "pl")); o.avg = (o.m0 + o.m1 + o.m2) / 3; o.d = o.m3 - o.avg; o.dp = pc(o.m3, o.avg); return o; });
    if ($("#tCmpG")) table($("#tCmpG"), [{ key: "k", label: grp === "rm" ? "RM" : "Kantor cabang" }, ...ms.map((m, i) => ({ key: "m" + i, label: ymS(m), r: 1, fmt: x => i === 3 ? `<b>${nf1.format(x)}</b>` : (x ? nf1.format(x) : `<span class="note">–</span>`) })),
      { key: "avg", label: "Rata 3 bln", r: 1, fmt: x => nf1.format(x) }, { key: "d", label: "Δ vs rata", r: 1, fmt: (x, r) => `${dJ(x)}<br><small>${dl(r.dp)}</small>` }], gr,
      { sortKey: "m3", page: grp === "rm" ? 15 : undefined, foot: { k: "Total", ...Object.fromEntries(ms.map((m, i) => ["m" + i, nf1.format(sum(gr, "m" + i))])), avg: nf1.format(sum(gr, "avg")), d: dJ(sum(gr, "m3") - sum(gr, "avg")) } });
  } else {
    const M = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")), curM = +ym.slice(5, 7);
    const agg = (y, m) => { const r = P.months.filter(x => x.ym === y + "-" + m && inScope(x)); return { os: sum(r, "os"), deb: sum(r, "deb") }; };
    let c1 = 0, c2 = 0;
    const rows = M.map((m, i) => { const a = agg(y1, m), b = agg(yr, m), fut = yr + "-" + m > (P.asof || "9").slice(0, 7); c1 += a.os; if (!fut) c2 += b.os;
      return { m: i + 1, a: a.os, ad: a.deb, b: fut ? null : b.os, bd: b.deb, d: fut ? null : b.os - a.os, dp: fut ? null : pc(b.os, a.os), ca: c1, cb: fut ? null : c2, cp: fut ? null : pc(c2, c1), mtd: isCur && i + 1 === curM }; });
    mkChart("cCmp", { type: "bar", data: { labels: M.map(m => BULAN[+m - 1]), datasets: [
      { label: y1, data: rows.map(r => r.a), backgroundColor: pal[1], borderRadius: 4, maxBarThickness: 22 },
      { label: yr, data: rows.map(r => r.b), backgroundColor: pal[0], borderRadius: 4, maxBarThickness: 22 }] },
      options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.parsed.y == null ? "" : ` ${c.dataset.label}: ${rpJ(c.parsed.y)}` + (c.datasetIndex === 1 && rows[c.dataIndex].mtd ? ` (s.d. ${tglS(P.asof)})` : "") } } },
        scales: { ...baseOpts().scales, y: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1000) + " M" } } } }) });
    table($("#tCmp"), [{ key: "m", label: "Bulan", fmt: (m, r) => `<b>${BULAN[m - 1]}</b>${r.mtd ? ` <small class="note">s.d. ${+P.asof.slice(8)}</small>` : ""}` },
      { key: "a", label: y1, r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.ad} deb</small>` },
      { key: "b", label: yr, r: 1, fmt: (x, r) => x == null ? "–" : `<b>${nf1.format(x)}</b><br><small class="note">${r.bd} deb</small>` },
      { key: "d", label: "Selisih", r: 1, fmt: (x, r) => x == null ? "–" : `${dJ(x)}<br><small>${dl(r.dp)}</small>` },
      { key: "ca", label: `Kum. ${y1}`, r: 1, fmt: x => nf1.format(x) }, { key: "cb", label: `Kum. ${yr}`, r: 1, fmt: x => x == null ? "–" : `<b>${nf1.format(x)}</b>` },
      { key: "cp", label: "Growth YtD", r: 1, fmt: x => dl(x) }], rows, { state: { key: "m", dir: 1 } });
    const fullM = isCur && curM > 1 ? curM - 1 : curM, upto = M.slice(0, fullM), gKey = x => grp === "rm" ? x.rm : x.kc;
    const yRows = P.months.filter(x => inScope(x) && (x.ym.startsWith(y1 + "-") || x.ym.startsWith(yr + "-")) && upto.includes(x.ym.slice(5)));
    const gr = uniq(yRows.map(gKey)).filter(Boolean).map(k => { const a = yRows.filter(x => gKey(x) === k);
      const o = { k, a: sum(a.filter(x => x.ym.startsWith(y1)), "os"), b: sum(a.filter(x => x.ym.startsWith(yr)), "os"), ad: sum(a.filter(x => x.ym.startsWith(y1)), "deb"), bd: sum(a.filter(x => x.ym.startsWith(yr)), "deb") }; o.d = o.b - o.a; o.dp = pc(o.b, o.a); return o; });
    if ($("#tCmpG")) table($("#tCmpG"), [{ key: "k", label: grp === "rm" ? "RM" : "Kantor cabang" },
      { key: "a", label: `YtD ${y1}`, r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.ad} deb</small>` },
      { key: "b", label: `YtD ${yr}`, r: 1, fmt: (x, r) => `<b>${nf1.format(x)}</b><br><small class="note">${r.bd} deb</small>` },
      { key: "d", label: "Selisih", r: 1, fmt: x => dJ(x) }, { key: "dp", label: "Growth", r: 1, sortVal: r => r.dp ?? -9, fmt: x => dl(x) }], gr,
      { sortKey: "b", page: grp === "rm" ? 15 : undefined, foot: { k: "Total", a: nf1.format(sum(gr, "a")), b: `<b>${nf1.format(sum(gr, "b"))}</b>`, d: dJ(sum(gr, "b") - sum(gr, "a")), dp: dl(pc(sum(gr, "b"), sum(gr, "a"))) } });
  }
}

// klik nama RM: tampilkan di bagian "Pencapaian per RM"
function openRM(name) { const sw = RS.pm === "kc"; RS.sel = name; RS.pm = RS.cmpG = "rm"; RS.selYr = null; saveRS(); sw ? render() : renderRMPer(); const el = $("#rPer"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
function renderRMPer(inScope) {
  const el = $("#rPer"); if (!el || !DB.rmk) return;
  const P = DB.rmk, asofYm = (P.asof || "9999-12").slice(0, 7), isKc = RS.pm === "kc";
  inScope = inScope || (x => (RS.area === "ALL" || x.area === RS.area) && (RS.kc === "ALL" || x.kc === RS.kc));
  const act = P.months.filter(x => inScope(x) && (x.tDisb > 0 || x.os > 0));
  const rmList = uniq(act.map(x => x.rm)).sort((a, b) => a.localeCompare(b)), kcList = uniq(act.map(x => x.kc)).filter(Boolean).sort();
  if (!kcList.includes(RS.selKc)) RS.selKc = RS.kc !== "ALL" ? RS.kc : kcList[0];
  if (isKc ? !RS.selKc : !RS.sel) { el.innerHTML = '<div class="empty">Pilih RM atau cabang untuk melihat pencapaian.</div>'; return; }
  const key = nmKey(RS.sel);
  const mine = P.months.filter(x => isKc ? x.kc === RS.selKc : nmKey(x.rm) === key), years = uniq(mine.map(x => x.ym.slice(0, 4))).sort();
  if (!years.includes(RS.selYr)) RS.selYr = years.includes(asofYm.slice(0, 4)) ? asofYm.slice(0, 4) : years[years.length - 1];
  // carry over Jan s.d. bulan pilihan (1–12); "berjalan" = bulan posisi data (tahun lampau: s.d. Des)
  const yr = RS.selYr, nowM = yr < asofYm.slice(0, 4) ? 12 : +asofYm.slice(5, 7), endM = (RS.co === "des" ? 12 : +RS.co) || nowM;
  const ms = Array.from({ length: 12 }, (_, i) => yr + "-" + String(i + 1).padStart(2, "0"));
  const me = mine.filter(x => x.ym.startsWith(yr)).pop() || mine[mine.length - 1] || {};
  // rincian per bulan: Subsidi (KPRS/FLPP) & Komersil dari history; bulan tanpa history dari data pencairan harian
  const rows = ms.map((m, i) => {
    const hs = mine.filter(x => x.ym === m), ks = new Set(hs.map(x => nmKey(x.rm))), h = hs.length ? hs : null;
    const tx = h ? [] : P.tx.filter(t => t.d.startsWith(m) && (isKc ? false : nmKey(t.rm) === key)), txS = tx.filter(t => RL.isS(t)), txK = tx.filter(t => !RL.isS(t));
    const o = { m, i, tDisb: h ? sum(hs, "tDisb") : 0, tDeb: h ? sum(hs, "tDeb") : 0, os: h ? sum(hs, "os") : sum(tx, "pl"), deb: h ? sum(hs, "deb") : sum(tx, "deb"), future: m > asofYm, nRm: hs.filter(x => x.tDisb > 0 || x.os > 0).length,
      sub: h ? sum(hs, "sOs") : sum(txS, "pl"), dSub: h ? sum(hs, "sDeb") : sum(txS, "deb"), kom: h ? sum(hs, "kOs") : sum(txK, "pl"), dKom: h ? sum(hs, "kDeb") : sum(txK, "deb") };
    o.pen = o.tDisb ? o.os / o.tDisb : null; o.k = o.future ? null : kuadOf(o.pen); return o;
  });
  const inCo = rows.filter(r => r.i < endM), coT = sum(inCo, "tDisb"), coO = sum(inCo, "os"), coD = sum(inCo, "deb"), coTD = sum(inCo, "tDeb");
  const elapsed = inCo.filter(r => !r.future && (r.tDisb > 0 || r.os > 0)).length || 1, coPen = coT ? coO / coT : null, coK = kuadOf(coPen);
  const coS = sum(inCo, "sub"), coSD = sum(inCo, "dSub"), coKm = sum(inCo, "kom"), coKD = sum(inCo, "dKom");
  const cell = (o, d) => o ? `${nf1.format(o)}${d ? `<br><small class="note">${nf0.format(d)} deb</small>` : ""}` : `<span class="note">–</span>`;
  const coLbl = `Jan s.d. ${BULAN[endM - 1]} ${yr}`;
  // kartu RM / cabang
  const rkYm = RS.ym || asofYm, coMs = ms.slice(0, endM);
  // RM di cabang terpilih: carry over, kuadran CO & kuadran bulan kartu
  const rr = !isKc ? [] : uniq(mine.filter(x => (coMs.includes(x.ym) || x.ym === rkYm) && (x.tDisb > 0 || x.os > 0)).map(x => x.rm)).map(rm => {
    const a = mine.filter(x => coMs.includes(x.ym) && x.rm === rm), t = sum(a, "tDisb"), o = sum(a, "os"), o2 = { rm, jg: (a[a.length - 1] || mine.find(x => x.rm === rm) || {}).jg || "", t, os: o, deb: sum(a, "deb"), sub: sum(a, "sOs"), kom: sum(a, "kOs"), pen: t ? o / t : null };
    const xm = mine.find(y => y.ym === rkYm && y.rm === rm); o2.kM = xm && xm.tDisb ? kuadOf(xm.os / xm.tDisb) : null;
    o2.k = kuadOf(o2.pen); o2.ks = coMs.filter(m => m <= asofYm).map(m => { const x = a.find(y => y.ym === m); return x && x.tDisb ? kuadOf(x.os / x.tDisb) : null; }); return o2; });
  const dist = key => `<span class="qd">${[1, 2, 3, 4].map(q => `${kq(q)}<b>${rr.filter(r => r[key] === q).length}</b>`).join("")}</span>`, rkL = P.months.filter(x => x.ym === rkYm && x.tDisb > 0).map(x => ({ rm: x.rm, kc: x.kc, pen: x.os / x.tDisb, os: x.os }));
  const rkRm = [...rkL].sort((a, b) => b.pen - a.pen || b.os - a.os), myRk = rkRm.findIndex(x => nmKey(x.rm) === key);
  const kcAgg = uniq(rkL.map(x => x.kc)).map(kc => { const a = P.months.filter(x => x.ym === rkYm && x.kc === kc && x.tDisb > 0); return { kc, pen: sum(a, "os") / (sum(a, "tDisb") || 1) }; }).sort((a, b) => b.pen - a.pen);
  const myKcRk = kcAgg.findIndex(x => x.kc === RS.selKc), thisM = rows.find(r => r.m === rkYm);
  const C = 2 * Math.PI * 46, ringV = coPen == null ? 0 : Math.min(1, coPen);
  const qNow = thisM && thisM.tDisb && !thisM.future ? thisM.k : 0;
  const qBg = rmcBg(qNow || 0, coK || 0);
  const holo = qNow === 1 && coK === 1;
  const spark = holo ? Array.from({ length: 6 }, (_, i) => `<i style="left:${(7 + Math.random() * 86).toFixed(1)}%;top:${(8 + Math.random() * 84).toFixed(1)}%;--d:${(Math.random() * 6).toFixed(2)}s;--t:${(4 + Math.random() * 3).toFixed(2)}s;--s:${(.55 + Math.random() * .8).toFixed(2)}"></i>`).join("") : "";
  const card = `<div class="rmc${holo ? " holo" : ""}" style="--qb:${RMC_Q[coK || 0][1]};background:${qBg}" title="Warna atas = kuadran ${ymS(rkYm)}${qNow ? " (K" + qNow + ")" : ""} · bawah = kuadran carry over${coK ? " (K" + coK + ")" : ""}">
      ${holo ? `<span class="holo-fx" aria-hidden="true"></span><span class="holo-foil" aria-hidden="true"></span><span class="holo-sheen" aria-hidden="true"></span><span class="holo-spark" aria-hidden="true">${spark}</span>` : ""}
      ${isKc ? kcAvatar(RS.selKc, 104) : rmAvatar(RS.sel, 104)}
      <div class="rmc-info"><div class="rmc-tag">${isKc ? "Kantor Cabang" : RL.role}${holo ? ` <span class="holo-badge" title="K1 di bulan berjalan dan K1 carry over">✦ BRILIAN</span>` : ""}</div>
        <h3>${esc(isKc ? RS.selKc : (rmList.find(n => nmKey(n) === key) || RS.sel))}</h3>
        <p class="rmc-meta">${isKc ? `${esc(areaS(me.area || ""))} · ${uniq(mine.filter(x => x.ym === rkYm && (x.tDisb > 0 || x.os > 0)).map(x => x.rm)).length} RM aktif ${ymS(rkYm)}` : `${esc(me.kc || "")}${me.jg ? " · " + esc(me.jg) : ""}${me.area ? " · " + esc(areaS(me.area)) : ""}`}</p>
        </div><div class="rmc-chips">
          ${isKc ? (myKcRk >= 0 ? `<span>Peringkat cabang #${myKcRk + 1} dari ${kcAgg.length} · ${ymS(rkYm)}</span>` : "") : (myRk >= 0 ? `<span>Peringkat #${myRk + 1} dari ${rkRm.length} RM · ${ymS(rkYm)}</span>` : "")}
          ${thisM && thisM.tDisb ? `<button type="button" class="rmc-q" data-kgo="kM" title="Lihat rincian">Kuadran ${ymS(rkYm)} ${kq(thisM.k)}${isKc ? dist("kM") : ""}<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>` : ""}
          <button type="button" class="rmc-q" data-kgo="k" title="Lihat rincian">Kuadran carry over ${kq(coK)}${isKc ? dist("k") : ""}<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
          <span>${RL.s} ${nf0.format(coSD)} deb · ${RL.k} ${nf0.format(coKD)} deb</span>
        </div>
      <div class="rmc-ring"><div class="rw"><svg viewBox="0 0 112 112"><circle class="bg" cx="56" cy="56" r="46"/><circle class="fg" cx="56" cy="56" r="46" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - ringV)}"/></svg><span class="val">${coPen == null ? "–" : pct(coPen, 0)}</span></div><small>Pencapaian carry over<br>${coLbl}</small></div>
    </div>`;
  el.innerHTML = `<div class="panel-h"><h2>Pencapaian ${isKc ? "per cabang" : "per RM"}</h2></div>
    <div class="toolbar">
      ${isKc ? `<label class="field" style="flex:2 1 220px"><span class="note" style="font-weight:700">Kantor cabang</span><select class="ctl" id="pKcSel">${kcList.map(n => `<option ${n === RS.selKc ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`
        : `<label class="field" style="flex:2 1 220px"><span class="note" style="font-weight:700">Nama ${RL.who}</span><select class="ctl" id="pRmSel">${rmList.map(n => `<option ${nmKey(n) === key ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`}
      <label class="field" style="flex:1 1 110px"><span class="note" style="font-weight:700">Tahun</span><select class="ctl" id="pRmYr">${years.map(y => `<option ${y === yr ? "selected" : ""}>${y}</option>`).join("")}</select></label>
      <label class="field" style="flex:1 1 200px"><span class="note" style="font-weight:700">Carry over</span><select class="ctl" id="pRmCo"><option value="berjalan">Jan s.d. bulan berjalan (${BULAN[nowM - 1]})</option>${BULAN.map((b, i) => `<option value="${i + 1}" ${(RS.co === "des" ? 12 : +RS.co) === i + 1 ? "selected" : ""}>Jan s.d. ${b}</option>`).join("")}</select></label>
    </div>
    ${card}
    <p class="note" style="margin:0">Rp juta · carry over ${coLbl}</p>
    <div class="grid tiles">
      ${tile({ label: "Disbursement carry over", value: rpJ(coO), sub: `${nf0.format(coD)} deb · ${RL.s} ${rpJ(coS)} (${coSD} deb) · ${RL.k} ${rpJ(coKm)} (${coKD} deb)` })}
      ${tile({ label: "Target carry over", value: rpJ(coT), sub: `${coTD ? nf0.format(coTD) + " deb · " : ""}${coLbl}` })}
      ${tile({ label: "Pencapaian", value: coPen == null ? "–" : pct(coPen, 1), sub: kq(coK) + (coK ? " kuadran carry over" : ""), meter: coPen })}
      ${tile({ label: "Gap terhadap target", value: `<span class="delta ${dCls(coO - coT)}" style="font-size:inherit">${(coO - coT >= 0 ? "+" : "−") + nf1.format(Math.abs(coO - coT))}</span>`, sub: "Rp juta" })}
      ${tile({ label: isKc ? "Ratas cabang per bulan" : "Ratas per bulan", value: rpJ(coO / elapsed), sub: `${elapsed} bulan aktif${inCo.some(r => r.future) ? ` · perlu ${rpJ(Math.max(0, coT - coO) / inCo.filter(r => r.future).length)}/bln s.d. ${BULAN[endM - 1]}` : ""}` })}
    </div>
    <details class="rm-more" ${RS.perOpen ? "open" : ""}><summary>Rincian per bulan ${yr}${isKc ? " & RM di cabang" : ""} <small class="note">grafik & tabel Jan–Des, carry over ${coLbl}</small></summary>
    <div class="chart"><canvas id="cRmPer"></canvas></div>
    <div id="tRmPer"></div>
    ${isKc ? `<h3 style="font-size:14px;margin-top:4px">RM di ${esc(RS.selKc)} · carry over ${coLbl}</h3><div id="tKcRm"></div>` : ""}
    </details>
    <p class="note" style="margin:0">${RL.note} Kuadran: K1 ≥105%, K2 100–105%, K3 50–100%, K4 &lt;50%.</p>`;
  if ($("#pRmSel")) $("#pRmSel").onchange = e => { RS.sel = e.target.value; RS.selYr = null; saveRS(); renderRMPer(); };
  if ($("#pKcSel")) $("#pKcSel").onchange = e => { RS.selKc = e.target.value; RS.selYr = null; saveRS(); renderRMPer(); };
  $("#pRmYr").onchange = e => { RS.selYr = e.target.value; saveRS(); renderRMPer(); };
  $("#pRmCo").onchange = e => { RS.co = e.target.value; saveRS(); if (RS.rkm === "co") render(); else renderRMPer(); };
  { const dt = el.querySelector("details.rm-more"); if (dt) dt.ontoggle = () => { RS.perOpen = dt.open; if (dt.open && charts.cRmPer) charts.cRmPer.resize(); }; }
  // kartu hologram: kilau mengikuti arah kursor / sentuhan (miring halus)
  const hc = el.querySelector(".rmc.holo");
  if (hc && !reduceMotion) {
    const mv = e => { const r = hc.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      hc.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); hc.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      hc.style.transform = `perspective(900px) rotateX(${((.5 - y) * 3).toFixed(2)}deg) rotateY(${((x - .5) * 4).toFixed(2)}deg)`; };
    hc.addEventListener("pointermove", mv); hc.addEventListener("pointerleave", () => { hc.style.transform = ""; hc.style.removeProperty("--mx"); hc.style.removeProperty("--my"); });
  }
  // klik kuadran di kartu: urutkan & loncat ke tabel rinciannya
  el.querySelectorAll("[data-kgo]").forEach(b => b.onclick = () => {
    if (isKc) { RS.kcSort = { key: b.dataset.kgo, dir: 1 }; saveRS(); renderRMPer(); }
    const dt = el.querySelector("details.rm-more"); if (dt && !dt.open) dt.open = true;
    const tg = $(isKc ? "#tKcRm" : "#tRmPer"); if (!tg) return;
    tg.scrollIntoView({ behavior: "smooth", block: "start" }); tg.classList.remove("flash"); void tg.offsetWidth; tg.classList.add("flash");
  });
  const cols = [{ key: "m", label: "Bulan", fmt: (m, r) => `<b>${ymS(m)}</b>${r.future ? ' <small class="note">belum berjalan</small>' : isKc && r.nRm ? `<br><small class="note">${r.nRm} RM</small>` : ""}` },
    { key: "tDisb", label: "Target", r: 1, fmt: (x, r) => x ? `${nf0.format(x)}${r.tDeb ? `<br><small class="note">${r.tDeb} deb</small>` : ""}` : "–" },
    { key: "sub", label: RL.s, r: 1, fmt: (x, r) => cell(x, r.dSub) },
    { key: "kom", label: RL.k, r: 1, fmt: (x, r) => cell(x, r.dKom) },
    { key: "os", label: "Total", r: 1, fmt: (x, r) => `<b>${nf1.format(x)}</b><br><small class="note">${nf0.format(r.deb)} deb</small>` },
    { key: "pen", label: "% capai", r: 1, fmt: (x, r) => x == null || r.future ? "–" : chip(pct(x, 0), capaiCls(x)) },
    { key: "k", label: "Kuadran", r: 1, fmt: k => kq(k) }];
  const foot = { m: `Carry over<br><small class="note">${coLbl}</small>`, tDisb: nf0.format(coT), os: `<b>${nf1.format(coO)}</b><br><small class="note">${nf0.format(coD)} deb</small>`, pen: coPen == null ? "–" : chip(pct(coPen, 1), capaiCls(coPen)), k: kq(coK) };
  foot.sub = cell(coS, coSD); foot.kom = cell(coKm, coKD);
  table($("#tRmPer"), cols, rows, { state: { key: "m", dir: 1 }, foot });
  if (isKc) {
    table($("#tKcRm"), [{ key: "rm", label: "RM", fmt: (x, r) => `<span class="lb-name wav">${rmAvatar(x, 30)}<span><button class="linkish" data-rm="${esc(x)}">${esc(x)}</button>${r.jg ? `<small>${esc(r.jg)}</small>` : ""}</span></span>` },
      { key: "t", label: "Target CO", r: 1, fmt: x => x ? nf0.format(x) : "–" }, { key: "sub", label: RL.s, r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: RL.k, r: 1, fmt: x => nf1.format(x) }, { key: "os", label: "Total", r: 1, fmt: (x, r) => `<b>${nf1.format(x)}</b><br><small class="note">${r.deb} deb</small>` },
      { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "k", label: "Kuadran CO", r: 1, sortVal: r => r.k ?? 9, fmt: k => kq(k) },
      { key: "kM", label: "Kuadran " + ymS(rkYm), r: 1, sortVal: r => r.kM ?? 9, fmt: k => kq(k) },
      { key: "ks", label: "Kuadran bulanan", nosort: 1, fmt: ks => ks.map(k => kq(k)).join("") }], rr,
      { state: RS.kcSort && RS.kcSort.key ? { ...RS.kcSort } : { key: "pen", dir: -1 }, after: t => t.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { RS.sel = b.dataset.rm; RS.pm = RS.cmpG = "rm"; RS.selYr = yr; saveRS(); render(); const e2 = $("#rPer"); if (e2) e2.scrollIntoView({ behavior: "smooth", block: "start" }); }) });
  }
  const ds = [[RL.s, "sub", cssv("--s1")], [RL.k, "kom", cssv("--s2")]].map(([label, k, c]) => ({ label, data: rows.map(r => r[k] || null), backgroundColor: c, type: "bar", stack: "a", borderColor: cssv("--surface"), borderWidth: 1, maxBarThickness: 26, order: 2 }));
  mkChart("cRmPer", { type: "bar", data: { labels: ms.map(ymS), datasets: [...ds, { type: "line", label: "Target", data: rows.map(r => r.tDisb || null), borderColor: cssv("--ink-2"), borderDash: [5, 4], borderWidth: 2, pointRadius: 0, order: 1 }] },
    options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.parsed.y ? ` ${c.dataset.label}: ${rpJ(c.parsed.y)}` : "" } } },
      scales: { x: { ...baseOpts().scales.x, stacked: true }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x) + " Jt" } } } }) });
}

/* ================= Produktivitas: laporan disburse realisasi harian (format laporan harian) ================= */
// grafik kumulatif harian 3 bulan terakhir, perbandingan per cabang s.d. tanggal yang sama bulan lalu + pencapaian RKA (OS keragaan),
// dan total realisasi bulan berjalan per jenis produk
const RD_PAL = ["#f2b705", "#22a854", "#1f6fd1"];
const rdR = x => Math.round(Math.round(x * 100) / 100);   // bulatkan ke juta tanpa galat pecahan (mis. 0,3 + 0,2)
// OS keragaan vs RKA per kanca (produk sesuai segmen) pada posisi keragaan terakhir s.d. tanggal t
function rkaByKc(seg, t) {
  const K = DB.ker, p = { R: "ritel", M: "mikro", K: "kpr" }[seg]; if (!K || !K.P[p] || !K.rka || !K.rka.P || !K.rka.P[p] || !K.rka.P[p].os) return null;
  const ds = K.dates.filter(d => d <= t), d = ds[ds.length - 1] || K.dates[K.dates.length - 1], di = K.dates.indexOf(d), mi = K.rka.months.indexOf(d.slice(0, 7));
  if (mi < 0) return null;
  const out = new Map(); K.kcU.forEach((c, i) => { const u = KC_BY.get(String(c)); if (!u) return; const os = K.P[p].os[di]?.[i], rk = K.rka.P[p].os[mi]?.[i]; if (rk) out.set(u.nama, { os: os || 0, rka: rk }); });
  return { d, m: out };
}
function renderRMDaily({ P, txIn, ym, isCur, day }) {
  const el = $("#rDay"); if (!el) return;
  const addM = (m, k) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + k, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const nDays = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const ms = [addM(ym, -2), addM(ym, -1), ym], D = isCur ? day : nDays(ym);
  if (!P.tx.some(t => t.d.startsWith(ym))) { el.innerHTML = `<div class="panel-h"><h2>Disburse realisasi harian ${esc(RL.seg)}</h2></div><div class="empty">Belum ada data pencairan harian ${ymS(ym)}.</div>`; return; }
  const mL = (m, d) => `${d} ${BULAN[+m.slice(5, 7) - 1]}'${m.slice(2, 4)}`;
  const tx = ms.map(m => txIn(m)), cut = tx.map(a => a.filter(t => +t.d.slice(8) <= D));
  const kcMap = new Map(P.months.map(x => [x.ym + "|" + nmKey(x.rm), x.kc])), kcOf = t => kcMap.get(t.d.slice(0, 7) + "|" + nmKey(t.rm)) || t.kc || "Lainnya";
  const asofT = isCur ? P.asof : ym + "-" + String(D).padStart(2, "0"), RK = rkaByKc(SEG.rm, asofT);
  // perbandingan per cabang
  const kcs = uniq([...cut[1], ...cut[2]].map(kcOf)).filter(Boolean);
  const rows = kcs.map(kc => { const a = sum(cut[1].filter(t => kcOf(t) === kc), "pl"), b = sum(cut[2].filter(t => kcOf(t) === kc), "pl"), r = RK && RK.m.get(kc);
    return { kc, a, b, d: b - a, dp: a ? b / a - 1 : null, gap: r ? r.os - r.rka : null, prk: r ? r.os / r.rka : null }; })
    .sort((x, y) => (y.prk ?? -1) - (x.prk ?? -1) || y.b - x.b);
  const tA = sum(rows, "a"), tB = sum(rows, "b"), rkR = rows.filter(r => r.prk != null), tGap = rkR.length ? sum(rkR, "gap") : null;
  const tPrk = rkR.length ? (() => { let o = 0, k = 0; rkR.forEach(r => { const x = RK.m.get(r.kc); o += x.os; k += x.rka; }); return k ? o / k : null; })() : null;
  const n = x => x == null ? "–" : rdR(x) === 0 ? "–" : x < 0 ? `<span class="neg">(${nf0.format(Math.abs(rdR(x)))})</span>` : nf0.format(rdR(x));
  const pc = x => x == null ? "–" : x < 0 ? `(${pct(Math.abs(x), 1)})` : "+" + pct(x, 1);
  const mCls = x => x == null ? "" : x <= -.5 ? "c-r" : x < 0 ? "c-y" : x >= .5 ? "c-g" : "c-lg";
  const rCls = x => x == null ? "" : x >= 1 ? "c-g" : x >= .95 ? "c-y" : "c-r";
  // total realisasi bulan berjalan per jenis
  const KPRG = SEG.rm === "K";
  const cats = KPRG ? [["KPR", ["Tier 1", "Tier 2", "Tier 3"]], ["KPRS", ["KPRS"]], ["Secondary / Take Over / Top Up", ["Secondary / TO / Top Up"]]]
    : [["", uniq(tx[2].map(t => t.jenis)).filter(Boolean)]];
  if (KPRG && tx[2].some(t => t.jenis === "Lainnya")) cats.push(["Lainnya", ["Lainnya"]]);
  const leaves = cats.flatMap(c => c[1]);
  const tot = (a, j) => { const b = j ? a.filter(t => t.jenis === j) : a; return { deb: sum(b, "deb"), os: sum(b, "pl") }; };
  const scope = RS.kc !== "ALL" ? RS.kc : RS.area !== "ALL" ? areaS(RS.area) : "RO Medan";
  const prRow = (lbl, a, b, cls) => { const x = tot(b), y = tot(a), d = x.os - y.os;
    return `<tr${cls ? ` class="${cls}"` : ""}><td><b>${esc(lbl)}</b></td>${leaves.map(j => { const z = tot(b, j); return `<td class="r">${n(z.deb)}</td><td class="r">${n(z.os)}</td>`; }).join("")}
      <td class="r">${n(x.deb)}</td><td class="r">${n(x.os)}</td><td class="r">${n(y.deb)}</td><td class="r">${n(y.os)}</td><td class="r">${n(d)}</td><td class="r ${mCls(y.os ? d / y.os : null)}">${pc(y.os ? d / y.os : null)}</td></tr>`; };
  el.innerHTML = `<div class="panel-h"><h2>Disburse realisasi harian ${esc(RL.seg)} – (s.d. ${mL(ym, D)})</h2><span class="sub">Rp juta · ${esc(scope)}</span></div>
    <div class="rd-grid">
      <div><h3 class="rd-h">Tren realisasi ${esc(RL.seg)} 3 bulan terakhir</h3>
        <div class="rd-box">${ms.map((m, i) => `<span style="--c:${RD_PAL[i]}"><b>${mL(m, Math.min(D, nDays(m)))}</b><i>${nf0.format(rdR(sum(cut[i], "pl")))}</i></span>`).join("")}</div>
        <div class="chart tall"><canvas id="cRDay"></canvas></div></div>
      <div><div class="table-wrap"><table class="kt rd"><thead>
        <tr><th colspan="${RK ? 8 : 6}" class="nv">PERBANDINGAN DISBURSEMENT PER CABANG</th></tr>
        <tr><th rowspan="2">NO</th><th rowspan="2">Kantor Cabang</th><th colspan="2">Disb Akumulasi</th><th colspan="2">MoM</th>${RK ? `<th colspan="2">Penc RKA</th>` : ""}</tr>
        <tr><th>Disb s.d ${mL(ms[1], Math.min(D, nDays(ms[1])))}</th><th>Disb s.d ${mL(ym, D)}</th><th>Rp</th><th>%</th>${RK ? "<th>GAP OS</th><th>%RKA</th>" : ""}</tr></thead>
        <tbody>${rows.map((r, i) => `<tr><td class="c">${i + 1}</td><td>${esc(r.kc)}</td><td class="r">${n(r.a)}</td><td class="r">${n(r.b)}</td><td class="r">${n(r.d)}</td><td class="r ${mCls(r.dp)}"><b>${pc(r.dp)}</b></td>${RK ? `<td class="r">${n(r.gap)}</td><td class="r ${rCls(r.prk)}">${r.prk == null ? "–" : pct(r.prk, 2)}</td>` : ""}</tr>`).join("")}</tbody>
        <tfoot><tr class="knv"><td colspan="2">GRAND TOTAL</td><td class="r">${n(tA)}</td><td class="r">${n(tB)}</td><td class="r">${n(tB - tA)}</td><td class="r">${pc(tA ? tB / tA - 1 : null)}</td>${RK ? `<td class="r">${n(tGap)}</td><td class="r">${tPrk == null ? "–" : pct(tPrk, 2)}</td>` : ""}</tr></tfoot></table></div>
        ${RK ? `<p class="note" style="margin:6px 0 0">Penc RKA = OS ${esc(RL.seg)} keragaan posisi ${tglS(RK.d)} terhadap RKA OS ${BULAN[+RK.d.slice(5, 7) - 1]} ${RK.d.slice(0, 4)}.</p>` : `<p class="note" style="margin:6px 0 0">Pencapaian RKA tampil bila data keragaan & RKA tersedia.</p>`}</div>
    </div>
    <div class="table-wrap" style="margin-top:14px"><table class="kt rd2"><thead>
      <tr><th rowspan="${KPRG ? 4 : 3}">Kantor Cabang</th><th colspan="${leaves.length * 2}" class="big">Total Realisasi ${BULAN[+ym.slice(5, 7) - 1]}'${ym.slice(2, 4)}</th>
        <th colspan="2" rowspan="${KPRG ? 3 : 2}">Disb s.d ${mL(ym, D)}</th><th colspan="2" rowspan="${KPRG ? 3 : 2}" class="yl">Disb s.d ${mL(ms[1], Math.min(D, nDays(ms[1])))}</th><th colspan="2" rowspan="${KPRG ? 3 : 2}" class="gr">MoM Disb ${mL(ms[1], Math.min(D, nDays(ms[1])))} thd Disb ${BULAN[+ym.slice(5, 7) - 1]}'${ym.slice(2, 4)}</th></tr>
      ${KPRG ? `<tr>${cats.map(c => `<th colspan="${c[1].length * 2}" ${c[1].length === 1 ? 'rowspan="2"' : ""} class="lt">${esc(c[0])}</th>`).join("")}</tr>
      <tr>${cats.filter(c => c[1].length > 1).map(c => c[1].map(j => `<th colspan="2" class="lt">${esc(j)}</th>`).join("")).join("")}</tr>`
      : `<tr>${leaves.map(j => `<th colspan="2" class="lt">${esc(j)}</th>`).join("")}</tr>`}
      <tr>${leaves.map(() => '<th class="lt">DEB</th><th class="lt">OS</th>').join("")}<th>DEB</th><th>OS</th><th class="yl">DEB</th><th class="yl">OS</th><th class="gr">OS</th><th class="gr">%</th></tr></thead>
      <tbody>${prRow(scope, cut[1], cut[2], "ktl")}</tbody></table></div>`;
  const maxD = Math.max(...ms.map(nDays));
  mkChart("cRDay", { type: "line", data: { labels: Array.from({ length: maxD }, (_, i) => i + 1), datasets: ms.map((m, i) => {
    const last = m === ym ? D : nDays(m), out = []; let c = 0;
    for (let d = 1; d <= last; d++) { c += sum(tx[i].filter(t => +t.d.slice(8) === d), "pl"); out.push(Math.round(c)); }
    return { label: BULAN_L[+m.slice(5, 7) - 1] + " " + m.slice(0, 4), data: out, borderColor: RD_PAL[i], backgroundColor: RD_PAL[i], borderWidth: m === ym ? 3 : 2, tension: .15,
      pointRadius: out.map((_, k) => k === out.length - 1 || k === D - 1 ? 4 : 0) }; }) },
    options: baseOpts({ layout: { padding: { top: 18, right: 26 } }, plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { title: c => "s.d. tanggal " + c[0].label, label: c => ` ${c.dataset.label}: ${nf0.format(c.parsed.y)} jt` } } },
      scales: { x: { ...baseOpts().scales.x, title: { display: true, text: "Tanggal" }, ticks: { ...baseOpts().scales.x.ticks, maxRotation: 0, autoSkip: true, autoSkipPadding: 2, color: c => c.index === D - 1 ? cssv("--ink") : cssv("--muted") } },
        y: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x) } } } }) });
}

// lampiran (paling bawah, tertutup secara bawaan; dibuka lewat menu "Buka lampiran" atau klik judulnya):
// 1 = disbursement per cabang / RM s.d. tanggal yang sama, 3 bulan lalu + bulan berjalan; 2 = YtD tahun lalu vs tahun ini per cabang / RM
const APX_OPEN = new Set();
function renderRMAppx(A) {
  const { P, txIn, ym, isCur, day, inScope, yr } = A, el = $("#rApx"); if (!el) return;
  const addM = (m, k) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + k, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const nDays = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const ms = [addM(ym, -3), addM(ym, -2), addM(ym, -1), ym], D = isCur ? day : nDays(ym), grp = RS.apxG === "rm" ? "rm" : "kc", gL = grp === "rm" ? RL.who : "cabang";
  const y1 = String(+yr - 1), curM = +ym.slice(5, 7), fullM = isCur && curM > 1 ? curM - 1 : curM;
  const L = [["1", `Disbursement per ${gL} s.d. tanggal ${D} · ${ymS(ms[0])}–${ymS(ym)}`, `Disbursement s.d. tanggal ${D} di ${ymS(ym)} dibanding tanggal yang sama di 3 bulan sebelumnya · Rp juta.`],
    ["2", `YtD Jan s.d. ${BULAN[fullM - 1]}${isCur ? " (bulan penuh)" : ""} per ${gL} · ${y1} vs ${yr}`, `Disbursement Jan s.d. ${BULAN[fullM - 1]} ${y1} dibanding periode yang sama ${yr}${isCur ? " (bulan berjalan belum dihitung)" : ""} · Rp juta.`]];
  el.innerHTML = `<div class="panel-h"><h2>Lampiran</h2><div class="toolbar">
      <select class="ctl" id="apxSel" aria-label="Buka lampiran"><option value="">Buka lampiran…</option>${L.map(l => `<option value="${l[0]}">Lampiran ${l[0]} · ${esc(l[1])}</option>`).join("")}<option value="all">Buka semua lampiran</option><option value="none">Tutup semua lampiran</option></select>
      <div class="seg" role="tablist" aria-label="Kelompokkan"><button type="button" role="tab" aria-selected="${grp === "kc"}" data-ag="kc">Per cabang</button><button type="button" role="tab" aria-selected="${grp === "rm"}" data-ag="rm">Per ${RL.who}</button></div></div></div>
    ${L.map(l => `<details class="apx" data-apx="${l[0]}" ${APX_OPEN.has(l[0]) ? "open" : ""}><summary><b>Lampiran ${l[0]}</b> · ${esc(l[1])}</summary><p class="note" style="margin:0 0 8px">${esc(l[2])}</p><div id="tApx${l[0]}"></div></details>`).join("")}`;
  el.querySelectorAll("[data-ag]").forEach(b => b.onclick = () => { RS.apxG = b.dataset.ag; saveRS(); renderRMAppx(A); });
  el.querySelectorAll("details.apx").forEach(d => d.ontoggle = () => { d.open ? APX_OPEN.add(d.dataset.apx) : APX_OPEN.delete(d.dataset.apx); });
  $("#apxSel").onchange = e => { const v = e.target.value; e.target.value = "";
    el.querySelectorAll("details.apx").forEach(d => d.open = v === "all" || d.dataset.apx === v);
    const t = v === "all" || v === "none" ? el : el.querySelector(`details[data-apx="${v}"]`); if (t && v !== "none") t.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const pc = (a, b) => b ? (a / b - 1) : null, dl = v => v == null ? "–" : `<span class="delta ${dCls(v)}">${(v >= 0 ? "+" : "−") + pct(Math.abs(v), 1)}</span>`;
  const dJ = v => `<span class="delta ${dCls(v)}">${(v >= 0 ? "+" : "−") + nf1.format(Math.abs(v))}</span>`, kLbl = grp === "rm" ? RL.who : "Kantor cabang";
  // lampiran 1
  if (!ms.some(m => P.tx.some(t => t.d.startsWith(m)))) $("#tApx1").innerHTML = '<div class="empty">Belum ada data pencairan harian untuk bulan-bulan ini.</div>';
  else {
    const kcMap = new Map(P.months.map(x => [x.ym + "|" + nmKey(x.rm), x.kc]));
    const gOf = t => grp === "rm" ? t.rm : (kcMap.get(t.d.slice(0, 7) + "|" + nmKey(t.rm)) || t.kc);
    const cut = ms.map(m => txIn(m).filter(t => +t.d.slice(8) <= D));
    const gr = uniq(cut.flat().map(gOf)).filter(Boolean).map(k => { const o = { k }; ms.forEach((m, i) => o["m" + i] = sum(cut[i].filter(t => gOf(t) === k), "pl")); o.avg = (o.m0 + o.m1 + o.m2) / 3; o.d = o.m3 - o.avg; o.dp = pc(o.m3, o.avg); return o; });
    table($("#tApx1"), [{ key: "k", label: kLbl }, ...ms.map((m, i) => ({ key: "m" + i, label: ymS(m), r: 1, fmt: x => i === 3 ? `<b>${nf1.format(x)}</b>` : (x ? nf1.format(x) : `<span class="note">–</span>`) })),
      { key: "avg", label: "Rata 3 bln", r: 1, fmt: x => nf1.format(x) }, { key: "d", label: "Δ vs rata", r: 1, fmt: (x, r) => `${dJ(x)}<br><small>${dl(r.dp)}</small>` }], gr,
      { sortKey: "m3", page: grp === "rm" ? 15 : undefined, foot: { k: "Total", ...Object.fromEntries(ms.map((m, i) => ["m" + i, nf1.format(sum(gr, "m" + i))])), avg: nf1.format(sum(gr, "avg")), d: dJ(sum(gr, "m3") - sum(gr, "avg")) } });
  }
  // lampiran 2
  const upto = Array.from({ length: fullM }, (_, i) => String(i + 1).padStart(2, "0")), gKey = x => grp === "rm" ? x.rm : x.kc;
  const yRows = P.months.filter(x => inScope(x) && (x.ym.startsWith(y1 + "-") || x.ym.startsWith(yr + "-")) && upto.includes(x.ym.slice(5)));
  const g2 = uniq(yRows.map(gKey)).filter(Boolean).map(k => { const a = yRows.filter(x => gKey(x) === k);
    const o = { k, a: sum(a.filter(x => x.ym.startsWith(y1)), "os"), b: sum(a.filter(x => x.ym.startsWith(yr)), "os"), ad: sum(a.filter(x => x.ym.startsWith(y1)), "deb"), bd: sum(a.filter(x => x.ym.startsWith(yr)), "deb") }; o.d = o.b - o.a; o.dp = pc(o.b, o.a); return o; });
  table($("#tApx2"), [{ key: "k", label: kLbl },
    { key: "a", label: `YtD ${y1}`, r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.ad} deb</small>` },
    { key: "b", label: `YtD ${yr}`, r: 1, fmt: (x, r) => `<b>${nf1.format(x)}</b><br><small class="note">${r.bd} deb</small>` },
    { key: "d", label: "Selisih", r: 1, fmt: x => dJ(x) }, { key: "dp", label: "Growth", r: 1, sortVal: r => r.dp ?? -9, fmt: x => dl(x) }], g2,
    { sortKey: "b", page: grp === "rm" ? 15 : undefined, foot: { k: "Total", a: nf1.format(sum(g2, "a")), b: `<b>${nf1.format(sum(g2, "b"))}</b>`, d: dJ(sum(g2, "b") - sum(g2, "a")), dp: dl(pc(sum(g2, "b"), sum(g2, "a"))) } });
}
/* ================= Produktivitas Nett RM / Mantri Briguna: tabel format laporan (produk × baru/suplesi, target JG, kuadran) + rentang tanggal ================= */
// Dihitung di browser dari tx[{d, rm, kc, pl, deb, jenis (Baru/Suplesi), pr (KA Karya · PP Pra-Purna · PU Purna)}] (Apps Script, Rp juta)
// sehingga rentang tanggal bebas bisa dipilih. Target JG = jumlah target bulanan dari bulan yang disentuh rentang.
const NETT_PROD = [["KA", "Karya", "ka"], ["PP", "Pra-Purna", "pp"], ["PU", "Purna", "pu"]];
const nettDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const nettIso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const nettAdd = (iso, n) => { const d = nettDate(iso); d.setDate(d.getDate() + n); return nettIso(d); };
const nettPeriode = (from, to) => {
  const a = nettDate(from), b = nettDate(to); if (!a || !b) return "";
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${a.getDate()} ${BULAN[a.getMonth()]} sd ${b.getDate()} ${BULAN_L[b.getMonth()]} ${b.getFullYear()}`;
  return `${a.getDate()} ${BULAN[a.getMonth()]} ${a.getFullYear()} sd ${b.getDate()} ${BULAN_L[b.getMonth()]} ${b.getFullYear()}`;
};
function nettMonths(from, to) {   // daftar bulan (yyyy-mm) yang disentuh rentang
  const out = []; let y = +from.slice(0, 4), m = +from.slice(5, 7);
  while (y < +to.slice(0, 4) || (y === +to.slice(0, 4) && m <= +to.slice(5, 7))) { out.push(y + "-" + String(m).padStart(2, "0")); if (++m > 12) { m = 1; y++; } }
  return out;
}
function renderRmNett(ctx) {
  const { P, inScope, ym, isCur } = ctx, el = $("#rNett"); if (!el) return;
  const isM = SEG.rm === "M", who = isM ? "Mantri" : "RM", prodN = isM ? "MIKRO" : "RITEL";
  const nz = x => x ? nf0.format(Math.round(x)) : "–";
  const gapF = x => x == null ? "–" : x < 0 ? `<span class="ng">(${nf0.format(Math.round(-x))})</span>` : nf0.format(Math.round(x));
  // ---------- rentang tanggal ----------
  if (!P._nd) { let lo = "9999", hi = "0"; P.tx.forEach(t => { if (t.d < lo) lo = t.d; if (t.d > hi) hi = t.d; }); P._nd = [lo, hi]; }
  const [dMin, dMax] = P._nd, mEnd = isCur ? P.asof : nettIso(new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0));
  if (RS.nYm !== ym) { RS.nFrom = RS.nTo = null; RS.nYm = ym; }
  let from = RS.nFrom || ym + "-01", to = RS.nTo || mEnd; if (from > to) [from, to] = [to, from];
  const periode = nettPeriode(from, to), months = nettMonths(from, to), custom = !!(RS.nFrom || RS.nTo);
  // ---------- baris per RM / mantri ----------
  const key = r => /^pn\s*\d/i.test(r) ? "pn" + String(r).replace(/\D/g, "") : nmKey(r), meta = new Map();   // nama belum ada di list: dibedakan lewat PN-nya
  months.forEach(m => P.months.filter(x => x.ym === m && inScope(x)).forEach(x => { const k = key(x.rm), o = meta.get(k) || { rm: x.rm, kc: x.kc, jg: x.jg, area: x.area, t: 0, hasT: false };
    o.rm = x.rm; o.kc = x.kc; o.jg = x.jg || o.jg; o.area = x.area || o.area; if (x.tDisb > 0) { o.t += x.tDisb; o.hasT = true; } meta.set(k, o); }));
  const tx = P.tx.filter(t => t.d >= from && t.d <= to), hasPr = P.tx.some(t => t.pr), all = RS.area === "ALL" && RS.kc === "ALL", agg = new Map();
  tx.forEach(t => { const k = key(t.rm); if (!meta.has(k)) { if (!all) return; meta.set(k, { rm: t.rm, kc: t.kc, jg: "", area: kcArea(t.kc), t: 0, hasT: false }); }
    const o = agg.get(k) || { deb: 0, os: 0, p: {} }; o.deb += t.deb; o.os += t.pl;
    if (t.pr) { const a = o.p[t.pr] || (o.p[t.pr] = [0, 0, 0, 0]), i = t.jenis === "Suplesi" ? 2 : 0; a[i] += t.deb; a[i + 1] += t.pl; } agg.set(k, o); });
  const rows = [...meta.entries()].map(([k, m]) => { const a = agg.get(k) || { deb: 0, os: 0, p: {} }, pen = m.hasT ? a.os / m.t : null;
    return { ...m, deb: a.deb, os: a.os, g: pr => a.p[pr] || [0, 0, 0, 0], pen, gap: m.hasT ? a.os - m.t : null }; })
    .sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os || a.rm.localeCompare(b.rm));
  // ---------- kepala + kalender ----------
  const head = `<div class="panel-h"><h2>Produktivitas Nett ${who} Briguna ${isM ? "Mikro" : "Ritel"}</h2><div class="toolbar nrange">
      <label>Dari <input class="ctl" type="date" id="nFrom" value="${from}" min="${dMin}" max="${dMax}"></label><label>Sampai <input class="ctl" type="date" id="nTo" value="${to}" min="${dMin}" max="${dMax}"></label>
      <button class="btn" type="button" data-np="mon">Bulan terpilih</button><button class="btn" type="button" data-np="7">7 hari</button><button class="btn" type="button" data-np="30">30 hari</button>
      <span class="sub">${periode} · Rp juta${custom ? " · rentang khusus" : ""}</span></div></div>`;
  const bind = () => {
    const set = (f, t) => { RS.nFrom = f; RS.nTo = t; saveRS(); renderRmNett(ctx); Exp.decorate(el.parentElement); };
    $("#nFrom").onchange = e => set(e.target.value || null, RS.nTo || to); $("#nTo").onchange = e => set(RS.nFrom || from, e.target.value || null);
    el.querySelectorAll("[data-np]").forEach(b => b.onclick = () => { const k = b.dataset.np, end = dMax < to ? to : dMax;
      if (k === "mon") set(null, null); else { const f = nettAdd(end, 1 - +k); set(f < dMin ? dMin : f, end); } });
  };
  if (!rows.length) { el.innerHTML = head + `<div class="empty">Tidak ada ${who} pada filter ini.</div>`; bind(); return; }
  // ---------- tabel ----------
  const sumP = (rs, k, i) => rs.reduce((a, r) => a + r.g(k)[i], 0);
  const prodCells = (rs, one) => NETT_PROD.map(([k]) => [0, 1, 2, 3].map(i => `<td class="r">${nz(one ? one.g(k)[i] : sumP(rs, k, i))}</td>`).join("")).join("");
  const tot = rs => { const tg = rs.filter(r => r.hasT), os = sum(rs, "os"), t = sum(tg, "t");
    return { deb: sum(rs, "deb"), os, t, gap: tg.reduce((a, r) => a + r.gap, 0), pen: t ? os / t : null }; };
  const pctCell = (pen, cls) => pen == null ? `<td class="r">–</td>` : `<td class="r np ${cls}">${pct(pen, 2)}</td>`;
  const kuadCell = pen => { const k = kuadOf(pen); return k ? `<td class="nk">Kuadran ${k}</td>` : `<td class="nk">–</td>`; };
  const sumLine = (label, rs, cls) => { const t = tot(rs); return `<tr class="${cls}"><td colspan="4"><b>${esc(label)}</b></td>${prodCells(rs)}<td class="r">${nz(t.deb)}</td><td class="r">${nz(t.os)}</td>
    <td class="r">${nz(t.t)}</td><td class="r">${t.t ? gapF(t.gap) : "–"}</td>${pctCell(t.pen, "k" + (kuadOf(t.pen) || 0))}<td class="nk"></td></tr>`; };
  const areas = uniq(rows.map(r => r.area)).filter(Boolean).sort(), aLbl = a => String(a).split("/")[0].trim().toUpperCase();
  el.innerHTML = head + (hasPr ? "" : `<p class="note" style="margin:0"><b>Rincian produk (Karya / Pra-Purna / Purna) belum tersedia dari server.</b> Pasang Apps Script versi terbaru, lalu admin menekan <b>Sync menu ini</b>.</p>`) + `
    <div class="table-wrap"><table class="kt nett"><thead>
      <tr><th rowspan="4">No</th><th rowspan="4">Kanca</th><th rowspan="4">Nama ${who}</th><th rowspan="4">JG</th>
        <th colspan="12" class="nt">PRODUKTIVITAS NETT ${who.toUpperCase()} BRIGUNA ${prodN} - ${periode}</th>
        <th colspan="2" rowspan="3" class="nt">TOTAL NETT DISBURSE<br>${periode}</th><th colspan="2" rowspan="2" class="nt">TARGET<br>${periode}</th><th rowspan="4" class="nt">Pencapaian<br>Target JG</th><th rowspan="4" class="nt">Kuadran</th></tr>
      <tr>${NETT_PROD.map(([, l, c]) => `<th colspan="4" class="np-${c}">${l}</th>`).join("")}</tr>
      <tr>${NETT_PROD.map(([, , c]) => ["Baru", "Suplesi"].map(j => `<th colspan="2" class="np-${c} s">${j}</th>`).join("")).join("")}
        <th rowspan="2" class="nt">Target JG</th><th rowspan="2" class="nt">GAP Target JG</th></tr>
      <tr>${NETT_PROD.map(([, , c]) => ["Deb", "OS", "Deb", "OS"].map(h => `<th class="np-${c} s">${h}</th>`).join("")).join("")}<th class="nt">Deb</th><th class="nt">Os</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr><td class="r">${i + 1}</td><td>${esc(r.kc)}</td><td>${esc(r.rm)}</td><td class="c">${esc(r.jg || "")}</td>${prodCells(null, r)}
      <td class="r tb">${nz(r.deb)}</td><td class="r tb">${nz(r.os)}</td><td class="r">${r.hasT ? nz(r.t) : "–"}</td><td class="r tg">${gapF(r.gap)}</td>
      ${pctCell(r.pen ?? (r.os ? null : 0), "k" + (kuadOf(r.pen) || 4))}${kuadCell(r.pen)}</tr>`).join("")}</tbody>
    <tfoot>${sumLine("Grand Total", rows, "knv")}${areas.length > 1 ? areas.map(a => sumLine(aLbl(a), rows.filter(r => r.area === a), "knv a")).join("") : ""}</tfoot></table></div>
    <p class="note" style="margin:0">Net disburse = Delta Suplesi (Rp juta) · Karya = Kretap, Purna = Kresun, Pra-Purna = Umum · Target JG = jumlah target bulanan pada bulan yang tersentuh rentang${months.length > 1 || custom ? " (rentang yang tidak penuh sebulan dibandingkan dengan target sebulan)" : ""} · GAP = realisasi − Target JG · kuadran: K1 ≥105%, K2 100–105%, K3 50–100%, K4 &lt;50%.</p>`;
  bind();
}
/* ================= VIEW: Pipeline Brispot (dari file Pipeline BRISPOT) ================= */
// DB.pipe = { asof, items[{kc,debitur,rm,pic,plafon,pengajuan,pencairan,putusan,tglPutusan,tatPrakarsa,tatClf,tatUker,tatTotal,status,tahap,akad,batal,proses,developer,jenis}], onhand[], rencana{dates[],rows[{kc,rm,v[]}]} }
const PTAHAP = ["On Hand", "Prakarsa", "Rekomendasi", "Penilaian Agunan", "Analis", "Menunggu Putusan", "Putus & Siap Cair", "Verifikasi Pencairan"];
const PS = Object.assign({ area: "ALL", kc: "ALL", rm: "ALL", jenis: "ALL", proses: "ALL", tahap: "ALL", usia: "ALL", q: "", batal: false, akad: [], prosesM: [], jenisM: [] }, lsGet(STORE + "-pipe") || {});
["akad", "prosesM", "jenisM"].forEach(k => { if (!Array.isArray(PS[k])) PS[k] = []; });
PS.proses = "ALL"; PS.batal = false;
const savePS = () => lsSet(STORE + "-pipe", { ...PS, q: "" });
const tahapOf = s => { s = String(s || "").toLowerCase();
  return /verifikasi pencairan/.test(s) ? 7 : /diputus|siap cair/.test(s) ? 6 : /menunggu.*putusan/.test(s) ? 5 : /analis/.test(s) ? 4 : /agunan|penilaian/.test(s) ? 3 : /rekomendasi/.test(s) ? 2 : /prakarsa/.test(s) ? 1 : 1; };
const jamS = h => h == null ? "–" : h >= 48 ? nf1.format(h / 24) + " hr" : nf0.format(h) + " jam";
const tatCls = h => h == null ? "neutral" : h > 14 * 24 ? "crit" : h > 7 * 24 ? "warn" : "good";
const prosesCls = p => p === "HOT" ? "crit" : p === "WARM" ? "warn" : p === "COLD" ? "neutral" : "neutral";
const rpJ = j => j >= 1000 ? rpM(j) : "Rp " + nf1.format(j) + " Jt";
function pipeRows() {
  const P = DB.pipe; if (!P) return [];
  const all = [...P.items.map(x => ({ ...x, src: "pipeline" })), ...P.onhand.map(x => ({ ...x, src: "onhand", tahap: 0, status: "On Hand", proses: "", batal: false }))];
  const dn = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ""); return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5) : null; };
  const t0 = new Date(), todayN = Math.floor(Date.UTC(t0.getFullYear(), t0.getMonth(), t0.getDate()) / 864e5), asofN = dn(P.asof);
  return all.map(x => {
    // usia pipeline (hari): HOT = hari ini − tanggal putusan; WARM/COLD = hari ini − tanggal prakarsa
    // (tanggal prakarsa dari kolom TANGGAL PRAKARSA bila ada; bila tidak, diperkirakan dari posisi data − TAT total)
    let usia = null, dasar = "";
    if (x.proses === "HOT") { const d = dn(x.tglPutusan); if (d != null) { usia = todayN - d; dasar = "putusan"; } }
    else if (x.proses === "WARM" || x.proses === "COLD") {
      const d = dn(x.tglPrakarsa); if (d != null) { usia = todayN - d; dasar = "prakarsa"; }
      else if (x.tatTotal != null && asofN != null) { usia = todayN - (asofN - Math.round(x.tatTotal / 24)); dasar = "prakarsa*"; }
    }
    return { ...x, area: kcArea(x.kc), usia: usia == null ? null : Math.max(0, usia), usiaDasar: dasar };
  });
}
const USIA_OPT = [["w12", "1–2 minggu", 7, 14], ["w2", "Di atas 2 minggu", 14, Infinity], ["m1", "Di atas 1 bulan", 30, Infinity], ["m2", "Di atas 2 bulan", 60, Infinity], ["m3", "Di atas 3 bulan", 90, Infinity]];
const usiaIn = (x, k) => { const o = USIA_OPT.find(o => o[0] === k); return !o || (x.usia != null && (o[0] === "w12" ? x.usia >= o[2] && x.usia <= o[3] : x.usia > o[2])); };
const usiaCls = u => u <= 14 ? "good" : u <= 30 ? "neutral" : u <= 60 ? "warn" : "crit";
const usiaS = u => u == null ? "–" : u + " hari";
const usiaAlt = u => u < 14 ? "" : u < 60 ? "± " + nf1.format(u / 7) + " minggu" : "± " + nf1.format(u / 30) + " bulan";
function pipeFilter(rows, opt = {}) {
  const q = PS.q.trim().toLowerCase();
  return rows.filter(x => (PS.area === "ALL" || x.area === PS.area) && (PS.kc === "ALL" || x.kc === PS.kc) && (PS.rm === "ALL" || x.rm === PS.rm)
    && (PS.jenis === "ALL" || x.jenis === PS.jenis) && (opt.noProses || PS.proses === "ALL" || x.proses === PS.proses)
    && (opt.noUsia || PS.usia === "ALL" || usiaIn(x, PS.usia))
    && (opt.noTahap || PS.tahap === "ALL" || String(x.tahap) === PS.tahap) && (opt.withBatal || PS.batal ? true : !x.batal)
    && (!q || (x.debitur + " " + x.rm + " " + x.kc + " " + (x.developer || "")).toLowerCase().includes(q)));
}
function viewPipeline(v) {
  usePipe(SEG.pipe);
  const segB = segBar(SEG.pipe, [["B", "Briguna Ritel & Mikro"], ["K", "KPR"]], "data-pseg");
  const bindSeg = () => v.querySelectorAll("[data-pseg]").forEach(b => b.onclick = () => { if (SEG.pipe === b.dataset.pseg) return; SEG.pipe = b.dataset.pseg; saveSEG(); usePipe(SEG.pipe); PS.jenis = "ALL"; PS.kc = "ALL"; PS.rm = "ALL"; savePS(); render(); });
  if (PS.jenis !== "ALL" && !PL.j.includes(PS.jenis)) PS.jenis = "ALL";
  if (!DB.pipe) {
    v.innerHTML = `<section class="panel" style="padding:12px 16px">${segB}</section>` + (PIPE_LOADING ? `<section class="panel"><div class="empty">Memuat data pipeline…</div></section>`
      : `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data pipeline ${esc(PL.seg)}</p>${isAdmin() ? "Upload file <b>Pipeline BRISPOT</b> lewat menu Admin → Kelola data." : "Hubungi admin untuk upload Pipeline BRISPOT."}</div></section>`);
    brsMount(v); bindSeg(); return;
  }
  const P = DB.pipe, base = pipeRows(), asof = P.asof;
  const areas = uniq(base.map(x => x.area)).filter(Boolean).sort();
  const kcs = uniq(base.filter(x => PS.area === "ALL" || x.area === PS.area).map(x => x.kc)).sort();
  if (PS.kc !== "ALL" && !kcs.includes(PS.kc)) PS.kc = "ALL";
  const rms = uniq(base.filter(x => (PS.area === "ALL" || x.area === PS.area) && (PS.kc === "ALL" || x.kc === PS.kc)).map(x => x.rm)).filter(Boolean).sort();
  if (PS.rm !== "ALL" && !rms.includes(PS.rm)) PS.rm = "ALL";
  const scoped = pipeFilter(base, { noProses: true, noTahap: true, withBatal: true });
  const aktif = scoped.filter(x => !x.batal), batal = scoped.filter(x => x.batal);
  const siap = aktif.filter(x => x.tahap >= 6);
  const end7 = iso(new Date(new Date(asof).getTime() + 6 * 864e5));
  const akad7 = aktif.filter(x => x.akad && x.akad >= asof && x.akad <= end7);
  const lewatAkad = aktif.filter(x => x.akad && x.akad < asof);
  const proc = aktif.filter(x => x.tahap >= 1 && x.tahap <= 5), tats = proc.map(x => x.tatUker).filter(x => x != null).sort((a, b) => a - b);
  const med = tats.length ? tats[tats.length >> 1] : null;
  const usiaBase = pipeFilter(base, { noUsia: true, noProses: true, noTahap: true }), usiaCnt = Object.fromEntries(USIA_OPT.map(o => [o[0], usiaBase.filter(x => usiaIn(x, o[0])).length]));
  const sel = (id, label, all, list, cur, fmt = x => x) => `<label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">${label}</span><select class="ctl" id="${id}"><option value="ALL">${all}</option>${list.map(x => `<option value="${esc(x)}" ${String(x) === String(cur) ? "selected" : ""}>${esc(fmt(x))}</option>`).join("")}</select></label>`;
  v.innerHTML = `
    <section class="panel" style="padding:12px 16px">
      ${segB}
      <div class="toolbar">
        ${sel("pA", "Area", "Semua area", areas, PS.area, areaS)}
        ${sel("pK", "Kantor Cabang", "Semua KC", kcs, PS.kc)}
        ${sel("pR", "RM pemrakarsa", "Semua RM", rms, PS.rm)}
        ${sel("pJ", "Jenis", PL.j.join(" & "), PL.j, PS.jenis)}
        <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Usia pipeline</span><select class="ctl" id="pU"><option value="ALL">Semua usia (${nf0.format(usiaBase.length)})</option>${USIA_OPT.map(o => `<option value="${o[0]}" ${PS.usia === o[0] ? "selected" : ""}>${o[1]} (${nf0.format(usiaCnt[o[0]])})</option>`).join("")}</select></label>
      </div>
      <p class="note" style="margin:0">${esc(PL.seg)} · posisi pipeline ${tglS(asof)}${P.masked ? " · <b>nama debitur disembunyikan untuk Guest</b>" : P.scoped ? " · berkas pemrakarsa Anda" : ""} · plafon dalam Rp · berkas BATAL tidak dihitung · usia: HOT = hari ini − tgl putusan, WARM/COLD = hari ini − tgl prakarsa (*diperkirakan dari TAT total)${PS.usia !== "ALL" ? " · berkas on hand tidak memiliki usia sehingga tidak tampil" : ""}</p>
    </section>
    <div class="grid tiles">
      ${tile({ label: "Pipeline aktif", value: rpJ(sum(aktif, "plafon")), sub: `${nf0.format(aktif.length)} debitur · ${PS.usia === "ALL" ? "termasuk on hand" : "tanpa on hand"}` })}
      ${tile({ label: "Putus & siap cair", value: rpJ(sum(siap, "plafon")), sub: `${nf0.format(siap.length)} debitur` })}
      ${tile({ label: "Akad 7 hari ke depan", value: rpJ(sum(akad7, "plafon")), sub: `${nf0.format(akad7.length)} debitur · s.d. ${tglS(end7)}${lewatAkad.length ? " " + chip(lewatAkad.length + " lewat jadwal", "crit") : ""}` })}
      ${tile({ label: "HOT · WARM · COLD", value: ["HOT", "WARM", "COLD"].map(p => nf0.format(aktif.filter(x => x.proses === p).length)).join(" · "), sub: `${chip("HOT " + rpJ(sum(aktif.filter(x => x.proses === "HOT"), "plafon")), "crit")}` })}
      ${tile({ label: "TAT uker (median)", value: jamS(med), sub: `berkas dalam proses · ${chip(proc.filter(x => x.tatUker > 14 * 24).length + " > 14 hari", proc.some(x => x.tatUker > 14 * 24) ? "crit" : "good")}` })}
      ${tile({ label: "Batal", value: nf0.format(batal.length), sub: rpJ(sum(batal, "pengajuan")) + " pengajuan" })}
    </div>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Funnel pipeline</h2><span class="sub">debitur · plafon per tahap</span></div>
        <div class="funnel" id="pFun"></div>
        <div class="toolbar note" style="gap:14px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--s1);margin-right:5px"></i>${PL.j[0]}</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--s2);margin-right:5px"></i>${PL.j[1]}</span></div>
      </section>
      <section class="panel"><div class="panel-h"><h2>Jadwal akad</h2><span class="sub">plafon per tanggal</span></div><div class="chart"><canvas id="cAkad"></canvas></div></section>
    </div>
    ${P.rencana && P.rencana.rows.length ? `<section class="panel"><div class="panel-h"><h2>Rencana realisasi RM</h2><span class="sub">Rp juta per hari</span></div><div id="pRen"></div></section>` : ""}
    <section class="panel"><div class="panel-h"><h2>Rekap per kantor cabang</h2><span class="sub">debitur / plafon (Rp juta) per tahap</span></div><div id="pKc"></div></section>
    <section class="panel"><div class="panel-h"><h2>Per RM pemrakarsa</h2><span class="sub">klik nama RM untuk menyaring</span></div><div id="pRm"></div></section>
    <section class="panel">
      <div class="panel-h"><h2>Daftar pipeline</h2><button class="btn" id="pExp" type="button">Ekspor CSV</button></div>
      <div class="toolbar">
        <input class="ctl" id="pq" type="search" placeholder="Cari debitur / RM / developer" value="${esc(PS.q)}">
        <select class="ctl" id="pT"><option value="ALL">Semua tahap</option>${PTAHAP.map((t, i) => `<option value="${i}" ${PS.tahap === String(i) ? "selected" : ""}>${t}</option>`).join("")}</select>
        <div id="pPr"></div>
        <div id="pJn"></div>
        <div id="pAk"></div>
      </div>
      <div id="pAkS" class="ak-sum" hidden></div>
      <div id="pList"></div>
    </section>`;
  const go = () => { savePS(); render(); };
  brsMount(v); bindSeg();
  $("#pA").onchange = e => { PS.area = e.target.value; PS.kc = "ALL"; PS.rm = "ALL"; go(); };
  $("#pK").onchange = e => { PS.kc = e.target.value; PS.rm = "ALL"; go(); };
  $("#pR").onchange = e => { PS.rm = e.target.value; go(); };
  $("#pJ").onchange = e => { PS.jenis = e.target.value; go(); };
  $("#pU").onchange = e => { PS.usia = e.target.value; go(); };

  // funnel: bar = plafon per tahap, terbagi Subsidi/Komersil
  const st = PTAHAP.map((t, i) => { const a = aktif.filter(x => x.tahap === i); return { t, n: a.length, s: sum(a.filter(x => x.jenis === PL.j[0]), "plafon"), k: sum(a.filter(x => x.jenis === PL.j[1]), "plafon") }; });
  const mx = Math.max(1, ...st.map(x => x.s + x.k));
  $("#pFun").innerHTML = st.map((x, i) => `<div class="f-row" style="grid-template-columns:128px minmax(0,1fr) 92px"><button class="linkish st" data-t="${i}" style="color:var(--ink)">${x.t}</button>
    <div class="bar" title="${x.n} debitur"><i style="width:${x.s / mx * 100}%;background:var(--s1)"></i><i style="left:calc(${x.s / mx * 100}% + ${x.s && x.k ? 2 : 0}px);width:${x.k / mx * 100}%;background:var(--s2)"></i><span>${x.n} deb</span></div>
    <span class="cv">${rpJ(x.s + x.k)}</span></div>`).join("");
  $("#pFun").querySelectorAll("[data-t]").forEach(b => b.onclick = () => { PS.tahap = b.dataset.t; savePS(); render(); setTimeout(() => $("#pList").scrollIntoView({ behavior: "smooth" }), 50); });

  // jadwal akad
  const ad = uniq(aktif.filter(x => x.akad).map(x => x.akad)).sort();
  const s1 = cssv("--s1"), s2 = cssv("--s2");
  mkChart("cAkad", { type: "bar", data: { labels: ad.map(d => tglS(d).replace(/ \d{4}$/, "")), datasets: PL.j.map((j, k) => ({ label: j, data: ad.map(d => sum(aktif.filter(x => x.akad === d && x.jenis === j), "plafon")), backgroundColor: k ? s2 : s1, borderColor: cssv("--surface"), borderWidth: k ? { bottom: 2 } : { top: 2 }, borderRadius: 2, maxBarThickness: 30 })) },
    options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${c.dataset.label}: ${rpJ(c.parsed.y)} (${aktif.filter(x => x.akad === ad[c.dataIndex] && x.jenis === c.dataset.label).length} deb)` } } },
      scales: { x: { ...baseOpts().scales.x, stacked: true, ticks: { ...baseOpts().scales.x.ticks, color: c => ad[c.index] < asof ? cssv("--crit") : cssv("--muted") } }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x) + " Jt" } } } }) });

  if ($("#pRen")) pipeRencana($("#pRen"), P.rencana);

  pipeKcRekap($("#pKc"), aktif);

  // per RM
  const rmRows = uniq(aktif.map(x => x.rm)).filter(Boolean).map(rm => { const a = aktif.filter(x => x.rm === rm), t = a.map(x => x.tatUker).filter(x => x != null);
    const nextAkad = a.map(x => x.akad).filter(d => d && d >= asof).sort()[0] || "";
    return { rm, kc: uniq(a.map(x => x.kc)).join(", "), deb: a.length, pl: sum(a, "plafon"), siap: a.filter(x => x.tahap >= 6).length, hot: a.filter(x => x.proses === "HOT").length, akad: nextAkad, akadN: a.filter(x => x.akad && x.akad >= asof && x.akad <= end7).length, tat: t.length ? t.reduce((p, c) => p + c, 0) / t.length : null }; });
  table($("#pRm"), [{ key: "rm", label: "RM", fmt: (x, r) => `<button class="linkish" data-rm="${esc(x)}">${esc(x)}</button><br><small class="note">${esc(r.kc)}</small>` },
    { key: "deb", label: "Debitur", r: 1 }, { key: "pl", label: "Plafon", r: 1, fmt: rpJ }, { key: "siap", label: "Siap cair", r: 1 }, { key: "hot", label: "HOT", r: 1 },
    { key: "akadN", label: "Akad 7 hr", r: 1 }, { key: "akad", label: "Akad terdekat", r: 1, fmt: x => x ? tglS(x) : "–" },
    { key: "tat", label: "Rata TAT uker", r: 1, sortVal: r => r.tat ?? -1, fmt: x => chip(jamS(x), tatCls(x)) }], rmRows,
    { sortKey: "pl", page: 15, after: el => el.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { PS.rm = b.dataset.rm; savePS(); render(); window.scrollTo(0, 0); }) });

  // daftar
  const tstate = { key: "tahap", dir: -1 };
  const draw = () => {
    const all = pipeFilter(base, { noProses: true, withBatal: true }).filter(x => prosesIn(x) && jenisIn(x)), rows = PS.akad.length ? all.filter(x => x.akad && PS.akad.includes(x.akad)) : all;
    pipeAkadSum($("#pAkS"), rows);
    table($("#pList"), [
      { key: "debitur", label: "Debitur", fmt: (x, r) => `<b>${esc(x)}</b>${r.batal ? " " + chip("BATAL", "crit") : ""}<br><small class="note">${esc(r.developer && r.developer !== "-" ? r.developer : "")}</small>` },
      { key: "kc", label: "KC / RM", fmt: (x, r) => `${esc(x)}<br><small class="note">${esc(r.rm || "")}</small>` },
      { key: "jenis", label: "Jenis" },
      { key: "plafon", label: "Plafon", r: 1, fmt: x => nf1.format(x) + " Jt" },
      { key: "tahap", label: "Tahap", sortVal: r => r.tahap, fmt: (t, r) => `${PTAHAP[t]}${r.putusan ? `<br><small class="note">${esc(r.putusan)}${r.tglPutusan ? " · " + tglS(r.tglPutusan) : ""}</small>` : ""}` },
      { key: "proses", label: "Proses", fmt: x => x ? chip(x, prosesCls(x)) : "–" },
      { key: "usia", label: "Usia pipeline", r: 1, sortVal: r => r.usia ?? -1, fmt: (x, r) => x == null ? "–" : `${chip(usiaS(x), usiaCls(x))}<br><small class="note">${usiaAlt(x) ? usiaAlt(x) + " · " : ""}dari ${r.usiaDasar === "putusan" ? "putusan" : r.usiaDasar === "prakarsa" ? "prakarsa" : "prakarsa*"}</small>` },
      { key: "akad", label: "Jadwal akad", r: 1, sortVal: r => r.akad || "9", fmt: x => x ? (x < asof ? chip(tglS(x), "crit") : tglS(x)) : "–" },
      { key: "tatUker", label: "TAT uker", r: 1, sortVal: r => r.tatUker ?? -1, fmt: (x, r) => r.tahap === 0 ? "–" : chip(jamS(x), r.tahap >= 6 ? "neutral" : tatCls(x)) }], rows, { state: tstate, page: 25 });
    $("#pExp").onclick = () => exportCSV("pipeline-brispot-" + (SEG.pipe === "K" ? "kpr" : "briguna") + "-" + asof, [["debitur","Debitur"],["kc","KC"],["rm","RM"],["jenis","Jenis"],["plafon","Plafon (juta)"],["status","Status"],["proses","Proses"],["usia","Usia pipeline (hari)"],["usiaDasar","Dasar usia"],["putusan","Putusan"],["tglPutusan","Tgl putusan"],["akad","Jadwal akad"],["tatUker","TAT uker (jam)"],["tatTotal","TAT total (jam)"],["developer","Developer"],["batal","Batal"]], rows);
  };
  // pilihan jadwal akad: tanggal dari pipeline aktif dalam saringan area/KC/RM/jenis
  const akD = uniq(aktif.filter(x => x.akad).map(x => x.akad)).sort();
  PS.akad = PS.akad.filter(d => akD.includes(d));
  msPicker($("#pAk"), "akad", akD.map(d => [d, tglS(d), aktif.filter(x => x.akad === d).length]), "Semua jadwal akad", d => tglS(d).replace(/ \d{4}$/, ""), () => { savePS(); draw(); });
  const lst = pipeFilter(base, { noProses: true, withBatal: true });
  PS.prosesM = PS.prosesM.filter(p => ["HOT", "WARM", "COLD", "BATAL"].includes(p)); PS.jenisM = PS.jenisM.filter(j => PL.j.includes(j));
  msPicker($("#pPr"), "prosesM", ["HOT", "WARM", "COLD", "BATAL"].map(p => [p, chip(p, p === "BATAL" ? "crit" : prosesCls(p)), lst.filter(x => p === "BATAL" ? x.batal : !x.batal && x.proses === p).length]), "HOT/WARM/COLD/BATAL", p => p, () => { savePS(); draw(); });
  msPicker($("#pJn"), "jenisM", PL.j.map(j => [j, j, lst.filter(x => !x.batal && x.jenis === j).length]), PL.j.join(" & "), j => j, () => { savePS(); draw(); });
  draw();
  $("#pq").oninput = e => { PS.q = e.target.value; draw(); };
  $("#pT").onchange = e => { PS.tahap = e.target.value; savePS(); draw(); };

}

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
/* ================= Pipeline: tabel format laporan (rencana realisasi, rekap per KC, ringkasan jadwal akad) ================= */
const BULAN_L = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const nfR = x => x ? nf0.format(Math.round(x)) : "–";
// minggu ke-n dalam bulan: minggu 1 dimulai Senin pertama bulan itu (hari sebelumnya ikut minggu 1)
const weekOf = d => { const t = new Date(d + "T00:00:00"), f = new Date(t.getFullYear(), t.getMonth(), 1), m1 = 1 + (8 - f.getDay()) % 7;
  return t.getDate() < m1 ? 1 : Math.floor((t.getDate() - m1) / 7) + 1; };
const dShort = d => +d.slice(8) + "-" + BULAN[+d.slice(5, 7) - 1];

// rencana realisasi RM: kolom per tanggal dikelompokkan per minggu + total minggu + grand total bulan
function pipeRencana(el, R0) {
  const rows = R0.rows.filter(x => (PS.area === "ALL" || kcArea(x.kc) === PS.area) && (PS.kc === "ALL" || x.kc === PS.kc) && (PS.rm === "ALL" || x.rm === PS.rm))
    .map(x => ({ kc: x.kc, rm: x.rm, v: R0.dates.map((_, i) => x.v[i] || 0) })).sort((a, b) => a.kc.localeCompare(b.kc) || a.rm.localeCompare(b.rm));
  const wk = []; R0.dates.forEach((d, i) => { const k = d.slice(0, 7) + "|" + weekOf(d), g = wk.find(w => w.k === k); g ? g.ix.push(i) : wk.push({ k, n: weekOf(d), ix: [i] }); });
  const months = uniq(R0.dates.map(d => BULAN_L[+d.slice(5, 7) - 1]));
  const ws = (r, w) => w.ix.reduce((a, i) => a + r.v[i], 0), tot = r => r.v.reduce((a, b) => a + b, 0);
  const T = { v: R0.dates.map((_, i) => sum(rows.map(r => ({ x: r.v[i] })), "x")) };
  const range = w => { const a = R0.dates[w.ix[0]], b = R0.dates[w.ix[w.ix.length - 1]]; return +a.slice(8) + (a === b ? "" : "–" + +b.slice(8)) + " " + BULAN[+b.slice(5, 7) - 1]; };
  const line = (r, cls) => `<tr${cls ? ` class="${cls}"` : ""}>${cls ? `<td colspan="2"><b>TOTAL</b></td>` : `<td>${esc(r.kc)}</td><td>${esc(r.rm)}</td>`}
    ${wk.map(w => w.ix.map(i => `<td class="r">${nfR(r.v[i])}</td>`).join("") + `<td class="r tw"><b>${nfR(ws(r, w))}</b></td>`).join("")}<td class="r gt"><b>${nfR(tot(r))}</b></td></tr>`;
  el.innerHTML = `<div class="table-wrap"><table class="kt rp"><thead>
    <tr><th rowspan="2">KANCA</th><th rowspan="2">RM (PEMRAKARSA)</th>${wk.map(w => `<th colspan="${w.ix.length + 1}" class="wk">WEEK ${w.n} (${range(w)})</th>`).join("")}<th rowspan="2" class="gt">GRAND TOTAL<br>RENCANA ${esc(months.join(" – ").toUpperCase())}</th></tr>
    <tr>${wk.map(w => w.ix.map(i => `<th class="wk">${dShort(R0.dates[i])}</th>`).join("") + `<th class="wk">TOTAL<br>W${w.n}</th>`).join("")}</tr></thead>
    <tbody>${rows.length ? rows.map(r => line(r)).join("") : `<tr><td colspan="${3 + R0.dates.length + wk.length}" class="empty">Tidak ada data yang cocok.</td></tr>`}</tbody>
    ${rows.length > 1 ? `<tfoot>${line(T, "ktl")}</tfoot>` : ""}</table></div>`;
}

// rekap per kantor cabang: per jenis (Subsidi/Komersil atau Ritel/Mikro) × tahap, debitur & plafon; grand total & per area
const RK_ST = [["On Hand", [0], "oh"], ["Dalam Prakarsa", [1], "yl"], ["Dalam Proses Rekomen", [2], "yl"], ["Proses Penilaian Agunan", [3], "yl"], ["Proses Analis", [4], "yl"],
  ["Menunggu Putusan Kredit", [5], "rd"], ["Putus & Siap Cair", [6, 7], "rd"]];
// urutan kanca mengikuti master (per area); kanca di luar master di akhir
const kcOrd = kc => { const u = kcByName(kc), i = u ? KC_MASTER.indexOf(u) : -1; return i < 0 ? 999 : i; };
function pipeKcRekap(el, aktif) {
  // tahap Rekomen & Penilaian Agunan selalu tampil untuk Komersil; jenis lain hanya bila ada berkasnya (mis. Subsidi KPR tidak)
  const grp = PL.j.map(j => { const a = aktif.filter(x => x.jenis === j);
    return { j, a, st: RK_ST.filter(s => !(s[1][0] === 2 || s[1][0] === 3) || j === "Komersil" || a.some(x => s[1].includes(x.tahap))) }; });
  const cells = a => grp.map(g => g.st.map(s => { const b = a.filter(x => x.jenis === g.j && s[1].includes(x.tahap)); return `<td class="r">${nfR(b.length)}</td><td class="r">${nfR(sum(b, "plafon"))}</td>`; }).join("")).join("")
    + `<td class="r"><b>${nfR(a.length)}</b></td><td class="r"><b>${nfR(sum(a, "plafon"))}</b></td>`;
  const kcs = uniq(aktif.map(x => x.kc)).map(kc => ({ kc, a: aktif.filter(x => x.kc === kc) })).sort((x, y) => kcOrd(x.kc) - kcOrd(y.kc) || x.kc.localeCompare(y.kc));
  const areas = uniq(aktif.map(x => x.area || "")).filter(Boolean).sort();
  el.innerHTML = `<div class="table-wrap"><table class="kt rk"><thead>
    <tr><th rowspan="3">KANTOR CABANG</th>${grp.map(g => `<th colspan="${g.st.length * 2}" class="sb">${esc(g.j.toUpperCase())}</th>`).join("")}<th colspan="2" rowspan="2" class="nv">TOTAL</th></tr>
    <tr>${grp.map(g => g.st.map(s => `<th colspan="2" class="${s[2]}">${s[0]}</th>`).join("")).join("")}</tr>
    <tr>${grp.map(g => g.st.map(() => `<th class="lt">Deb</th><th class="lt">Plafon</th>`).join("")).join("")}<th class="nv">Deb</th><th class="nv">Plafon</th></tr></thead>
    <tbody>${kcs.length ? kcs.map(k => `<tr><td><b>${esc(k.kc)}</b></td>${cells(k.a)}</tr>`).join("") : `<tr><td colspan="99" class="empty">Tidak ada data yang cocok.</td></tr>`}</tbody>
    ${kcs.length ? `<tfoot><tr class="knv"><td>GRAND TOTAL</td>${cells(aktif)}</tr>${areas.length > 1 ? areas.map(ar => `<tr class="knv"><td>${esc(ar.replace(/\s*\/\s*/, "/"))}</td>${cells(aktif.filter(x => x.area === ar))}</tr>`).join("") : ""}</tfoot>` : ""}</table></div>`;
}

// pilihan ceklis (bisa lebih dari satu): PS[key] = nilai terpilih; kosong = semua. opts = [[nilai, label, jumlah deb]]
function msPicker(el, key, opts, allLbl, short, onChange) {
  const lbl = () => { const v = PS[key]; return !v.length ? allLbl : v.length <= 2 ? v.map(x => short(x)).join(", ") : v.length + " dipilih"; };
  el.innerHTML = `<details class="ms"><summary class="ctl">${esc(lbl())}</summary><div class="ms-pop">
    ${opts.length ? opts.map(([v, l, n]) => `<label class="check"><input type="checkbox" value="${esc(v)}" ${PS[key].includes(v) ? "checked" : ""}> ${l}${n != null ? ` <small class="note">${nf0.format(n)} deb</small>` : ""}</label>`).join("") : '<span class="note">Belum ada pilihan.</span>'}
    <div class="toolbar"><button class="btn" type="button" data-ms="all">Pilih semua</button><button class="btn" type="button" data-ms="clr">Hapus pilihan</button></div></div></details>`;
  const set = v => { PS[key] = v; el.querySelector("summary").textContent = lbl(); onChange(); };
  const order = opts.map(o => o[0]);
  el.querySelectorAll("input").forEach(i => i.onchange = () => set([...el.querySelectorAll("input:checked")].map(x => x.value).sort((a, b) => order.indexOf(a) - order.indexOf(b))));
  el.querySelectorAll("[data-ms]").forEach(b => b.onclick = () => { const on = b.dataset.ms === "all"; el.querySelectorAll("input").forEach(i => i.checked = on); set(on ? [...order] : []); });
}
// saringan Proses (HOT/WARM/COLD/BATAL) dan Jenis di daftar pipeline. Tanpa pilihan: semua berkas aktif (batal tidak ikut);
// BATAL dicentang: berkas batal ikut tampil (hanya batal bila tidak ada HOT/WARM/COLD yang dicentang)
const prosesIn = x => { const v = PS.prosesM, hwc = v.filter(p => p !== "BATAL");
  return !v.length ? !x.batal : x.batal ? v.includes("BATAL") : hwc.includes(x.proses); };
const jenisIn = x => !PS.jenisM.length || PS.jenisM.includes(x.jenis);
document.addEventListener("click", e => document.querySelectorAll("details.ms[open]").forEach(d => { if (!d.contains(e.target)) d.open = false; }));

// ringkasan debitur pada jadwal akad terpilih
function pipeAkadSum(el, rows) {
  if (!PS.akad.length) { el.innerHTML = ""; el.hidden = true; return; }
  const a = rows.filter(x => x.akad && PS.akad.includes(x.akad)).sort((x, y) => x.kc.localeCompare(y.kc) || (x.rm || "").localeCompare(y.rm || "") || x.debitur.localeCompare(y.debitur));
  const multi = PS.akad.length > 1, nom = x => (x.pengajuan || x.plafon || 0) * 1e6, rp = x => "Rp " + nf0.format(Math.round(x));
  const hari = h => h == null ? "–" : nf1.format(h / 24) + " hari";
  el.hidden = false;
  el.innerHTML = `<div class="panel-h"><h2>Jadwal akad ${esc(PS.akad.map(d => tglS(d)).join(", "))} (${nf0.format(a.length)} debitur)</h2></div>
    <div class="table-wrap"><table class="kt as"><thead><tr><th>CABANG</th><th>NAMA DEBITUR</th><th>NAMA PEMRAKARSA</th>${multi ? "<th>JADWAL AKAD</th>" : ""}<th>JENIS PUTUSAN</th><th>TAT UKER</th><th>STATUS</th><th class="r">NOMINAL PENGAJUAN</th></tr></thead>
    <tbody>${a.length ? a.map(x => `<tr><td>${esc(x.kc)}</td><td>${esc(x.debitur)}</td><td>${esc(x.rm || "")}</td>${multi ? `<td>${tglS(x.akad)}</td>` : ""}<td>${esc(x.putusan || "–")}</td><td>${hari(x.tatUker)}</td><td>${esc(x.status || PTAHAP[x.tahap] || "")}</td><td class="r">${rp(nom(x))}</td></tr>`).join("")
      : `<tr><td colspan="${multi ? 8 : 7}" class="empty">Tidak ada debitur pada jadwal akad terpilih dengan saringan saat ini.</td></tr>`}</tbody>
    <tfoot><tr class="knv"><td colspan="${multi ? 7 : 6}">Jumlah Debitur: ${nf0.format(a.length)}</td><td class="r">${rp(sum(a.map(x => ({ v: nom(x) })), "v"))}</td></tr></tfoot></table></div>`;
}
/* ---------- impor file Pipeline BRISPOT ---------- */
const dateX = v => { if (v == null || v === "" || v === "-") return null; if (typeof v === "number") return isoX(v);
  const s = String(v).trim(), a = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/); if (a) return `${a[1]}-${a[2].padStart(2, "0")}-${a[3].padStart(2, "0")}`;
  const b = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); return b ? `${b[3]}-${b[2].padStart(2, "0")}-${b[1].padStart(2, "0")}` : null; };
const jamX = v => { const m = String(v ?? "").match(/(\d+(?:[.,]\d+)?)/); return m ? parseFloat(m[1].replace(",", ".")) : null; };
function parsePipeline(wb, set = "K") {
  const brgJ = (...v) => /mikro|\bunit\b/i.test(v.filter(x => x != null).map(String).join(" ")) ? "Mikro" : "Ritel";
  const pp = findSheet(wb, ["nama_branch", "nama_debitur", "status"]); if (!pp) return null;
  const c = k => pp.h.indexOf(k), g = (r, k) => c(k) >= 0 ? r[c(k)] : null;
  const bt = findSheet(wb, ["nama_debitur", "keterangan"]), batalSet = new Set();
  if (bt) bt.rows.forEach(r => { const n = r[bt.h.indexOf("nama_debitur")]; if (n && /batal/i.test(String(r[bt.h.indexOf("keterangan")] ?? ""))) batalSet.add(String(n).trim().toUpperCase()); });
  const items = pp.rows.filter(r => g(r, "nama_debitur")).map(r => {
    const deb = String(g(r, "nama_debitur")).trim(), pj = numX(g(r, "nominal_pengajuan")) / 1e6, pc = numX(g(r, "nominal_pencairan")) / 1e6, pl0 = numX(g(r, "plafon"));
    const plafon = pl0 > 0 ? pl0 : pj > 0 ? pj : pc;
    const akadRaw = g(r, "jadwal_akad"), batal = /batal/i.test(String(akadRaw ?? "")) || batalSet.has(deb.toUpperCase());
    const pic = String(g(r, "nama_pic") ?? "").trim();
    return { kc: String(g(r, "nama_branch") ?? "").trim(), debitur: deb, rm: String(g(r, "nama_pemrakarsa") ?? "").trim(), pic: pic === "-" ? "" : pic,
      pengajuan: Math.round(pj * 100) / 100, pencairan: Math.round(pc * 100) / 100, plafon: Math.round(plafon * 100) / 100,
      putusan: String(g(r, "jenis_putusan") ?? "").trim(), tglPutusan: dateX(g(r, "tanggal_putusan")), tglPrakarsa: dateX(g(r, "tanggal_prakarsa")),
      tatPrakarsa: jamX(g(r, "tat_prakarsa")), tatClf: jamX(g(r, "tat_clf_awal")), tatUker: jamX(g(r, "tat_uker")), tatTotal: jamX(g(r, "tat_total")),
      status: String(g(r, "status") ?? "").trim(), tahap: tahapOf(g(r, "status")), akad: batal ? null : dateX(akadRaw), batal,
      proses: String(g(r, "proses") ?? "").trim().toUpperCase(), developer: String(g(r, "developer") ?? "").trim(),
      jenis: set === "B" ? brgJ(g(r, "produk"), g(r, "jenis_produk"), g(r, "nama_produk"), g(r, "segmen"), g(r, "segment"), g(r, "nama_branch")) : /flpp|subsidi/i.test(deb) || (plafon > 0 && plafon <= 185) ? "Subsidi" : "Komersil" };
  });
  const oh = findSheet(wb, ["nama_rm", "kantor_cabang", "nama_debitur"]), onhand = [];
  if (oh) oh.rows.forEach(r => { const o = k => r[oh.h.indexOf(k)]; if (!o("nama_debitur")) return;
    const pl = numX(o("plafond_rp") ?? o("plafon_rp") ?? o("plafond") ?? o("plafon")); const plafon = Math.round((pl > 1e5 ? pl / 1e6 : pl) * 100) / 100;
    const jal = String(o("jalur") ?? "").trim();
    onhand.push({ kc: String(o("kantor_cabang") ?? "").trim(), rm: String(o("nama_rm") ?? "").trim(), debitur: String(o("nama_debitur")).trim(), developer: String(o("nama_perumahan") ?? "").trim(), plafon, jenis: set === "B" ? brgJ(o("produk"), o("jenis_produk"), o("segmen"), jal, o("kantor_cabang")) : /subsidi/i.test(jal) ? "Subsidi" : /komersil/i.test(jal) ? "Komersil" : plafon <= 185 ? "Subsidi" : "Komersil" }); });
  // rencana realisasi: header KANCA | RM (PEMRAKARSA), baris berikutnya berisi tanggal "19-Oct"
  let rencana = null; const rs = findSheet(wb, ["kanca", "rm_pemrakarsa"]);
  const yr = (items.map(x => x.tglPutusan).filter(Boolean).sort().pop() || iso(today())).slice(0, 4);
  const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, mei: 5, jun: 6, jul: 7, aug: 8, agu: 8, agt: 8, sep: 9, oct: 10, okt: 10, nov: 11, dec: 12, des: 12 };
  if (rs && rs.rows.length) {
    const hdr = rs.rows[0], cols = [];
    hdr.forEach((x, i) => { const m = String(x ?? "").trim().match(/^(\d{1,2})[-\s]([A-Za-z]{3})/); if (m && MON[m[2].toLowerCase()]) cols.push([i, `${yr}-${String(MON[m[2].toLowerCase()]).padStart(2, "0")}-${m[1].padStart(2, "0")}`]);
      else if (typeof x === "number" && x > 40000) cols.push([i, isoX(x)]); });
    const iK = rs.h.indexOf("kanca"), iR = rs.h.indexOf("rm_pemrakarsa");
    const rows = rs.rows.slice(1).filter(r => r[iK] && r[iR] && !/total/i.test(String(r[iK]))).map(r => ({ kc: String(r[iK]).trim(), rm: String(r[iR]).trim(), v: cols.map(([i]) => Math.round(numX(r[i]) * 100) / 100) }));
    if (cols.length) rencana = { dates: cols.map(x => x[1]), rows };
  }
  const asof = (rencana && rencana.dates[0]) || iso(today());
  return { asof, items, onhand, rencana, source: pp.name };
}

/* ================= VIEW: Simulasi KPR (Tabel Suku Bunga KPP) ================= */
// DB.rate = { title, src, counter0, selisih0, rows[{prog,kel,prod,tenor,st[{r,sd}]}], info{prog:{...}} }
const SIM = Object.assign({ view: "bulan", start: null, prog: null, harga: 750000000, diskon: 0, booking: 0, dp: 75000000, counter: null, selisih: null, gaji: 25000000, dsr: 40, sel: 0, ten: {} }, lsGet(STORE + "-sim2") || {});
const saveSIM = () => lsSet(STORE + "-sim2", SIM);
const isMuda = p => /brimuda/i.test(p);
const isFloatKel = k => /floating|retensi/i.test(k);
function tenorRange(row) {
  if (/berjenjang/i.test(row.kel)) return [row.tenor, row.tenor];
  if (/fixed all/i.test(row.kel)) { const n = (row.prod.match(/\d+/g) || []).map(Number); return /^\s*fixed all tenor\s*>/i.test(row.prod) || /> *\d/.test(row.prod) ? [n[0] + 1, row.tenor] : [1, row.tenor]; }
  return [row.tenor, 25];
}
// hitung seperti sheet "Hitung": tiap tahap angsuran anuitas dari sisa pokok untuk sisa tenor
function calcProd(row, P, tenorY, c, s) {
  const R = DB.rate, n = Math.round(tenorY * 12), fl = isFloatKel(row.kel), bj = /berjenjang/i.test(row.kel);
  const st = row.st.map((x, i) => ({ ...x, float: fl && i > 0 })), out = [], yearly = [], monthly = [], sched = [];
  let os = P, start = 0, bunga = 0;
  st.forEach((x, i) => {
    if (start >= n) return;
    const end = i === st.length - 1 ? n : Math.min(n, Math.round(x.sd * 12));
    if (end <= start) return;
    const r = x.float ? c + (isMuda(row.prog) ? s : 0) + (x.r - R.counter0 - (isMuda(row.prog) ? R.selisih0 : 0)) : x.r;
    const m = r / 12, rem = n - start, a = m ? os * m / (1 - Math.pow(1 + m, -rem)) : os / rem;
    const y1 = Math.floor(start / 12) + 1, y2 = Math.ceil(end / 12);
    out.push({ label: (fl ? (x.float ? "Floating " : "Fixed ") : "") + "Tahun " + y1 + (y2 > y1 ? " s.d " + y2 : ""), rate: r, ang: bj ? Math.ceil(a / 100) * 100 : a, osAwal: os, float: x.float });
    for (let k = start; k < end; k++) { const it = os * m, pk = a - it; os -= pk; bunga += it; monthly.push(a);
      sched.push({ ke: k + 1, tahap: out.length, label: out[out.length - 1].label, rate: r, ang: a, pokok: pk, bunga: it, sisa: Math.max(0, os) });
      const y = Math.floor(k / 12); yearly[y] = yearly[y] || { tahun: y + 1, ang: 0, pokok: 0, bunga: 0, sisa: 0 }; yearly[y].ang += a; yearly[y].pokok += pk; yearly[y].bunga += it; yearly[y].sisa = Math.max(0, os); }
    start = end;
  });
  return { stages: out, bunga, total: P + bunga, n, yearly, monthly, sched, maxAng: Math.max(...out.map(x => x.ang)) };
}
const biayaPct = (txt, P) => { const t = String(txt || ""); if (/free|gratis/i.test(t)) return 0; const m = t.match(/([\d.,]+)\s*%/); return m ? parseFloat(m[1].replace(",", ".")) / 100 * P : null; };
function viewSimulasi(v) {
  if (!DB.rate) { v.innerHTML = RATE_LOADING ? '<section class="panel"><div class="empty">Memuat tabel suku bunga…</div></section>' : '<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada tabel suku bunga</p>${isAdmin() ? "Upload file <b>Tabel Perhitungan Suku Bunga KPR</b> lewat menu Admin → Kelola data." : "Hubungi admin untuk upload tabel suku bunga KPR."}</div></section>'; return; }
  const R = DB.rate, progs = uniq(R.rows.map(x => x.prog));
  if (!progs.includes(SIM.prog)) SIM.prog = progs.includes("Exclusive") ? "Exclusive" : progs[0];
  if (!/^\d{4}-\d{2}$/.test(SIM.start || "")) { const d = new Date(); d.setMonth(d.getMonth() + 1); SIM.start = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  if (SIM.counter == null) SIM.counter = R.counter0 * 100; if (SIM.selisih == null) SIM.selisih = R.selisih0 * 100;
  const f = (id, label, val, hint = "", money = true) => `<div class="field"><label for="${id}">${label}</label><input class="ctl num" id="${id}" type="text" inputmode="${money ? "numeric" : "decimal"}" autocomplete="off" value="${money ? nf0.format(val) : String(val).replace(".", ",")}">${hint !== null ? `<span class="hint" id="${id}-h">${hint}</span>` : ""}</div>`;
  v.innerHTML = `
    <section class="panel" style="padding:12px 16px"><p class="note" style="margin:0"><b>${esc(R.title || "Tabel suku bunga")}</b>${R.src ? " · " + esc(R.src.replace(/Sel biru.*$/, "")) : ""}</p></section>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Data pengajuan</h2><span class="sub">ubah angka, hasil langsung dihitung</span></div>
        <div class="form">
          <div class="field full"><label for="sProg">Program</label><select class="ctl" id="sProg">${progs.map(p => `<option ${p === SIM.prog ? "selected" : ""}>${esc(p)}</option>`).join("")}</select></div>
          ${f("sHarga", "Harga rumah (Rp)", SIM.harga, "dalam rupiah penuh, mis. 750.000.000")}
          ${f("sDiskon", "Diskon (Rp)", SIM.diskon, "isi jika ada")}
          ${f("sDp", "Down payment (Rp)", SIM.dp, "")}
          ${f("sDpP", "Down payment (%)", SIM.harga ? Math.round(SIM.dp / SIM.harga * 1000) / 10 : 0, "dari harga rumah", false)}
          ${f("sBook", "Booking fee (Rp)", SIM.booking, "isi jika ada, dihitung sebagai DP")}
          ${f("sGaji", "Penghasilan per bulan (Rp)", SIM.gaji, "")}
          ${f("sCounter", "Floating / counter rate (% p.a.)", SIM.counter, "setelah masa fixed", false)}
          ${f("sSel", "Selisih counter BRIMuda (%)", SIM.selisih, "khusus program BRIMuda", false)}
          ${f("sDsr", "Batas RPC (%)", SIM.dsr, "maks. angsuran / penghasilan", false)}
        </div>
        <dl class="kv" id="sSum"></dl>
      </section>
      <section class="panel" id="sInfo"></section>
    </div>
    <section class="panel"><div class="panel-h"><h2>Rincian suku bunga & angsuran per bulan</h2><span class="sub">klik baris untuk melihat detail</span></div><div id="sTab"></div>
      <p class="note" style="margin:0">Angsuran per tahap dihitung ulang dari sisa pokok untuk sisa tenor. Angsuran skema Berjenjang dibulatkan ke atas per Rp100. Tenor mengikuti tenor produk (min tenor); ubah di detail.</p></section>
    <section class="panel" id="sDet"></section>`;
  const money = { sHarga: "harga", sDiskon: "diskon", sBook: "booking", sDp: "dp", sGaji: "gaji" }, pctF = { sCounter: "counter", sSel: "selisih", sDsr: "dsr" };
  const dpPct = () => { $("#sDpP").value = SIM.harga ? String(Math.round(SIM.dp / SIM.harga * 1000) / 10).replace(".", ",") : "0"; };
  Object.entries(money).forEach(([id, k]) => $("#" + id).addEventListener("input", e => {
    const el = e.target, digits = el.value.replace(/\D/g, ""), fromEnd = el.value.length - el.selectionEnd;
    SIM[k] = digits ? +digits : 0; el.value = digits ? nf0.format(SIM[k]) : "";
    const pos = Math.max(0, el.value.length - fromEnd); try { el.setSelectionRange(pos, pos); } catch {}
    if (k === "dp" || k === "harga") dpPct(); saveSIM(); calc(); }));
  Object.entries(pctF).forEach(([id, k]) => $("#" + id).addEventListener("input", e => { const x = parseFloat(e.target.value.replace(",", ".")); if (isFinite(x)) { SIM[k] = x; saveSIM(); calc(); } }));
  $("#sDpP").addEventListener("input", e => { const x = parseFloat(e.target.value.replace(",", ".")); if (isFinite(x)) { SIM.dp = Math.round(SIM.harga * x / 100); $("#sDp").value = nf0.format(SIM.dp); saveSIM(); calc(); } });
  $("#sProg").onchange = e => { SIM.prog = e.target.value; SIM.sel = 0; saveSIM(); calc(); };
  function calc() {
    const totDp = SIM.dp + SIM.booking, P = Math.max(0, SIM.harga - SIM.diskon - totDp), c = SIM.counter / 100, s = SIM.selisih / 100;
    $("#sHarga-h").textContent = SIM.harga ? rpFull(SIM.harga) + (SIM.harga < 10000000 ? " · terlalu kecil? isi rupiah penuh" : "") : "dalam rupiah penuh, mis. 750.000.000";
    $("#sDp-h").textContent = rpFull(SIM.dp); $("#sGaji-h").textContent = rpFull(SIM.gaji);
    const info = R.info[SIM.prog] || {}, prov = biayaPct(info.provisi, P), adm = biayaPct(info.admin, P);
    $("#sSum").innerHTML = `<dt>Total DP (DP + booking fee)</dt><dd>${rpFull(totDp)}${SIM.harga ? " · " + pct(totDp / SIM.harga, 1) : ""}</dd><dt><b>Plafon pinjaman</b></dt><dd><b>${rpFull(P)}</b></dd>`;
    $("#sInfo").innerHTML = `<div class="panel-h"><h2>Keterangan program</h2><span class="sub">${esc(SIM.prog)}</span></div>
      <p style="margin:0">${esc(info.tujuan || "")}</p>
      <dl class="kv" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)">
        <dt>Biaya provisi</dt><dd style="text-align:left;font-family:var(--f-body);font-weight:500">${esc(info.provisi || "–")}${prov ? ` <b class="num">≈ ${rpFull(prov)}</b>` : ""}</dd>
        <dt>Biaya administrasi</dt><dd style="text-align:left;font-family:var(--f-body);font-weight:500">${esc(info.admin || "–")}${adm ? ` <b class="num">≈ ${rpFull(adm)}</b>` : ""}</dd>
        <dt>Pengendapan dana</dt><dd style="text-align:left;font-family:var(--f-body);font-weight:500">${esc(info.endap || "–")}</dd>
        <dt>Penalti pelunasan sebagian</dt><dd style="text-align:left;font-family:var(--f-body);font-weight:500">${esc(info.penSebagian || "–")}</dd>
        <dt>Penalti pelunasan seluruh</dt><dd style="text-align:left;font-family:var(--f-body);font-weight:500">${esc(info.penSeluruh || "–")}</dd>
        <dt>Uang muka</dt><dd style="text-align:left;font-family:var(--f-body);font-weight:500">${esc(info.dp || "–")}</dd>
        ${info.catatan ? `<dt>Catatan</dt><dd style="text-align:left;font-family:var(--f-body);font-weight:500">${esc(info.catatan)}</dd>` : ""}
      </dl>
      <div class="result-big" style="background:var(--surface-2)"><small>Perkiraan dana yang disiapkan di awal (DP + provisi + admin)</small><b style="color:var(--ink);font-size:22px">${rpFull(totDp + (prov || 0) + (adm || 0))}</b></div>`;
    const rows = R.rows.filter(x => x.prog === SIM.prog);
    if (SIM.sel >= rows.length) SIM.sel = 0;
    if (P <= 0) {
      $("#sTab").innerHTML = `<div class="banner" style="margin-top:4px"><span><b>Plafon pinjaman masih Rp 0.</b> Total DP (${rpFull(totDp)}) + diskon (${rpFull(SIM.diskon)}) sudah sama atau melebihi harga rumah (${rpFull(SIM.harga)}). Isi harga rumah dalam rupiah penuh atau kurangi DP.</span></div>`;
      $("#sDet").innerHTML = ""; return;
    }
    const res = rows.map((x, i) => { const key = x.prog + "|" + x.prod, [lo, hi] = tenorRange(x), t = clamp(SIM.ten[key] || x.tenor, lo, hi); return { x, i, t, lo, hi, key, r: calcProd(x, P, t, c, s) }; });
    const maxSt = Math.max(...res.map(z => z.r.stages.length));
    $("#sTab").innerHTML = `<div class="table-wrap"><table><thead><tr><th>Produk / skema</th><th class="r">Tenor</th>${Array.from({ length: maxSt }, (_, k) => `<th class="r">Tahap ${k + 1}</th>`).join("")}<th class="r">Total bunga</th><th class="r">Total bayar</th><th class="r">RPC</th></tr></thead><tbody>
      ${res.map(z => { const d = SIM.gaji ? z.r.maxAng / SIM.gaji : null;
        return `<tr data-i="${z.i}" style="cursor:pointer;${z.i === SIM.sel ? "background:var(--accent-soft)" : ""}"><td style="white-space:normal;min-width:200px"><b>${esc(z.x.prod)}</b><br><small class="note">${esc(z.x.kel)}</small></td><td class="r">${z.t} th</td>
        ${Array.from({ length: maxSt }, (_, k) => { const g = z.r.stages[k]; return g ? `<td class="r">${rpFull(g.ang)}<br><small class="note">${esc(g.label)} · ${nf2.format(g.rate * 100)}%</small></td>` : "<td></td>"; }).join("")}
        <td class="r">${rpFull(z.r.bunga)}</td><td class="r">${rpFull(z.r.total)}</td><td class="r">${d == null ? "–" : chip(pct(d, 0), d <= SIM.dsr / 100 ? "good" : "crit")}</td></tr>`; }).join("")}</tbody></table></div>`;
    $("#sTab").querySelectorAll("tr[data-i]").forEach(tr => tr.onclick = () => { SIM.sel = +tr.dataset.i; saveSIM(); calc(); $("#sDet").scrollIntoView({ behavior: "smooth", block: "start" }); });
    const z = res[SIM.sel]; if (!z) { $("#sDet").innerHTML = ""; return; }
    const d = SIM.gaji ? z.r.maxAng / SIM.gaji : null, ok = d != null && d <= SIM.dsr / 100;
    $("#sDet").innerHTML = `<div class="panel-h"><h2>${esc(z.x.prod)}</h2>${d != null ? chip(ok ? "Layak · RPC " + pct(d) : "Melebihi RPC · " + pct(d), ok ? "good" : "crit") : ""}</div>
      <div class="grid cols-2">
        <div class="grid" style="gap:12px;align-content:start">
          ${z.lo !== z.hi ? `<div class="field"><label for="sTen">Tenor (tahun) · ${z.lo}–${z.hi}</label><input class="ctl num" id="sTen" type="number" min="${z.lo}" max="${z.hi}" step="1" value="${z.t}"></div>` : `<p class="note" style="margin:0">Tenor ${z.t} tahun (tetap untuk skema ini)</p>`}
          ${z.r.stages.map((g, k) => `<div class="result-big" ${k ? 'style="background:var(--surface-2)"' : ""}><small>${esc(g.label)} · bunga ${nf2.format(g.rate * 100)}% ${g.float ? "(floating)" : "fixed"}</small><b ${k ? 'style="color:var(--ink)"' : ""}>${rpFull(g.ang)}</b></div>`).join("")}
          <dl class="kv">
            <dt>Plafon</dt><dd>${rpFull(P)}</dd>
            <dt>Jangka waktu</dt><dd>${z.r.n} bulan</dd>
            <dt>Total bunga</dt><dd>${rpFull(z.r.bunga)}</dd>
            <dt>Total pembayaran</dt><dd>${rpFull(z.r.total)}</dd>
            <dt>Angsuran tertinggi</dt><dd>${rpFull(z.r.maxAng)}</dd>
            <dt>Penghasilan minimal (RPC ${SIM.dsr}%)</dt><dd>${rpFull(z.r.maxAng / (SIM.dsr / 100))}</dd>
          </dl>
          <div class="toolbar"><button class="btn" id="copySim" type="button">Salin ringkasan</button></div>
          <textarea id="simTxt" class="ctl" rows="8" readonly hidden style="height:auto;padding:8px;font-size:12px"></textarea>
        </div>
        <div class="grid" style="gap:12px;align-content:start"><div class="chart"><canvas id="cSim"></canvas></div></div>
      </div>
      <div class="panel-h" style="margin-top:6px"><h3 style="font-size:15px">Jadwal cicilan</h3>
        <div class="toolbar">
          <label class="check" for="sStart">Mulai angsuran <input class="ctl" id="sStart" type="month" value="${SIM.start}" style="height:32px;width:auto"></label>
          <div class="seg" role="tablist" aria-label="Tampilan jadwal"><button type="button" role="tab" aria-selected="${SIM.view !== "tahun"}" data-sv="bulan">Per bulan</button><button type="button" role="tab" aria-selected="${SIM.view === "tahun"}" data-sv="tahun">Per tahun</button></div>
          <button class="btn" id="sExp" type="button">Ekspor CSV</button>
        </div></div>
      <div id="tSim"></div>
      <p class="note" style="margin:0">Pokok + bunga dihitung dari angsuran anuitas tanpa pembulatan (sama dengan sheet Hitung)${/berjenjang/i.test(z.x.kel) ? "; angsuran yang ditagihkan skema Berjenjang dibulatkan ke atas per Rp100" : ""}.</p>`;
    if ($("#sTen")) $("#sTen").onchange = e => { SIM.ten[z.key] = clamp(Math.round(+e.target.value || z.t), z.lo, z.hi); saveSIM(); calc(); };
    $("#copySim").onclick = () => {
      const P2 = SIM.harga - SIM.diskon - SIM.dp - SIM.booking;
      const txt = `Simulasi KPR ${SIM.prog}\n${z.x.prod}\nHarga rumah: ${rpFull(SIM.harga)}${SIM.diskon ? `\nDiskon: ${rpFull(SIM.diskon)}` : ""}\nTotal DP: ${rpFull(SIM.dp + SIM.booking)}\nPlafon: ${rpFull(P2)}\nTenor: ${z.t} tahun\n` + z.r.stages.map(g => `${g.label} (${nf2.format(g.rate * 100)}%): ${rpFull(g.ang)}/bln`).join("\n") + `\nPenghasilan minimal: ${rpFull(z.r.maxAng / (SIM.dsr / 100))}\n*Simulasi, bukan penawaran resmi. ${R.title || ""}`;
      const ta = $("#simTxt"); ta.value = txt;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast("Ringkasan disalin")).catch(() => { ta.hidden = false; ta.select(); toast("Tekan salin pada teks yang dipilih"); });
    };
    mkChart("cSim", { type: "bar", data: { labels: z.r.yearly.map(y => "Th " + y.tahun), datasets: [
        { label: "Pokok", data: z.r.yearly.map(y => y.pokok), backgroundColor: cssv("--s1"), borderColor: cssv("--surface"), borderWidth: { top: 2 }, borderRadius: 2, maxBarThickness: 26 },
        { label: "Bunga", data: z.r.yearly.map(y => y.bunga), backgroundColor: cssv("--s2"), borderColor: cssv("--surface"), borderWidth: { bottom: 2 }, borderRadius: 2, maxBarThickness: 26 }] },
      options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${c.dataset.label}: ${rpFull(c.parsed.y)}` } } },
        scales: { x: { ...baseOpts().scales.x, stacked: true }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1e6) + " Jt" } } } }) });
    const mLbl = k => { const [y, m] = SIM.start.split("-").map(Number), d = new Date(y, m - 1 + k - 1, 1); return BULAN[d.getMonth()] + " " + d.getFullYear(); };
    const drawSched = () => {
      if (SIM.view === "tahun") table($("#tSim"), [{ key: "tahun", label: "Tahun", r: 1 }, { key: "ang", label: "Angsuran / bln", r: 1, fmt: (x, r) => rpFull(x / Math.max(1, Math.min(12, z.r.n - (r.tahun - 1) * 12))) },
        { key: "pokok", label: "Pokok setahun", r: 1, fmt: rpFull }, { key: "bunga", label: "Bunga setahun", r: 1, fmt: rpFull }, { key: "sisa", label: "Sisa pokok", r: 1, fmt: rpFull }], z.r.yearly,
        { state: { key: "tahun", dir: 1 }, foot: { tahun: "Total", ang: "", pokok: rpFull(sum(z.r.yearly, "pokok")), bunga: rpFull(sum(z.r.yearly, "bunga")), sisa: "" } });
      else table($("#tSim"), [{ key: "ke", label: "Bulan ke", r: 1, fmt: x => `<b>${x}</b>` }, { key: "periode", label: "Periode", nosort: 1, fmt: (x, r) => mLbl(r.ke) },
        { key: "label", label: "Tahap", nosort: 1, fmt: (x, r) => `${esc(x)}<br><small class="note">${nf2.format(r.rate * 100)}%</small>` },
        { key: "ang", label: "Angsuran", r: 1, fmt: x => `<b>${rpFull(x)}</b>` }, { key: "pokok", label: "Pokok", r: 1, fmt: rpFull }, { key: "bunga", label: "Bunga", r: 1, fmt: rpFull }, { key: "sisa", label: "Sisa pokok", r: 1, fmt: rpFull }],
        z.r.sched, { state: { key: "ke", dir: 1 }, page: 24, foot: { ke: "Total", ang: rpFull(sum(z.r.sched, "ang")), pokok: rpFull(sum(z.r.sched, "pokok")), bunga: rpFull(sum(z.r.sched, "bunga")) } });
    };
    drawSched();
    $("#sDet").querySelectorAll("[data-sv]").forEach(b => b.onclick = () => { SIM.view = b.dataset.sv; saveSIM(); $("#sDet").querySelectorAll("[data-sv]").forEach(x => x.setAttribute("aria-selected", x === b)); drawSched(); });
    $("#sStart").onchange = e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) { SIM.start = e.target.value; saveSIM(); drawSched(); } };
    $("#sExp").onclick = () => exportCSV("jadwal-cicilan-" + (SIM.prog + "-" + z.x.prod).replace(/[^\w]+/g, "-").slice(0, 60),
      [["ke", "Bulan ke"], ["periode", "Periode"], ["label", "Tahap"], ["rate", "Bunga p.a."], ["ang", "Angsuran"], ["pokok", "Pokok"], ["bunga", "Bunga"], ["sisa", "Sisa pokok"]],
      z.r.sched.map(r => ({ ...r, periode: mLbl(r.ke), rate: nf2.format(r.rate * 100) + "%", ang: Math.round(r.ang), pokok: Math.round(r.pokok), bunga: Math.round(r.bunga), sisa: Math.round(r.sisa) })));
  }
  calc();
}

/* ---------- impor Tabel Perhitungan Suku Bunga KPR ---------- */
function parseRates(wb) {
  const s = findSheet(wb, ["program", "kelompok", "produk"]); if (!s) return null;
  const sh = wb.Sheets[s.name], cv = a => sh[a] ? sh[a].v : null, rk = wb.Sheets["Rekap"];
  const rows = s.rows.filter(r => r[0] && r[2] && typeof r[3] === "number").map(r => {
    const st = []; for (let k = 4; k + 1 < 12; k += 2) if (typeof r[k] === "number" && typeof r[k + 1] === "number") st.push({ r: r[k], sd: r[k + 1] });
    return { prog: String(r[0]).trim(), kel: String(r[1] || "").trim(), prod: String(r[2]).trim(), tenor: r[3], st };
  }).filter(x => x.st.length);
  const h = s.h, ip = h.lastIndexOf("program"), info = {};
  if (ip > 0) s.rows.forEach(r => { if (!r[ip]) return; const g = k => { const i = h.indexOf(k); return i >= 0 && r[i] != null ? String(r[i]).trim() : ""; };
    const ti = h.findIndex(k => k.startsWith("tujuan"));
    info[String(r[ip]).trim()] = { tujuan: ti >= 0 && r[ti] != null ? String(r[ti]).trim() : "", provisi: g("biaya_provisi"), admin: g("biaya_administrasi"), endap: g("pengendapan_dana"), penSebagian: g("penalti_pelunasan_sebagian"), penSeluruh: g("penalti_pelunasan_seluruh"), dp: g("uang_muka"), catatan: g("catatan_lain") }; });
  const c0 = rk && rk.C9 && typeof rk.C9.v === "number" ? rk.C9.v : 0.125, s0 = rk && rk.C10 && typeof rk.C10.v === "number" ? rk.C10.v : -0.02;
  return rows.length ? { title: String(cv("A1") || "").trim(), src: String(cv("A2") || "").trim(), counter0: c0, selisih0: s0, rows, info } : null;
}

/* ================= VIEW: Simulasi Suku Bunga (Briguna & KPR) ================= */
// Briguna: kalkulator max plafond (THP & RPC), angsuran anuitas / flat, dan jadwal angsuran. Semua dihitung di browser.
const SB = Object.assign({ thp: 8500000, oth: 0, rpc: (window.APP_CONFIG.SIM_BRIGUNA || {}).RPC || 70, rate: (window.APP_CONFIG.SIM_BRIGUNA || {}).RATE || 11, ten: (window.APP_CONFIG.SIM_BRIGUNA || {}).TENOR || 120,
  met: "anuitas", pl: 250000000, by: 0, start: null, view: "bulan" }, lsGet(STORE + "-simb") || {});
const saveSB = () => lsSet(STORE + "-simb", SB);
const annuity = (P, rateYear, n) => { const i = rateYear / 1200; return i ? P * i / (1 - Math.pow(1 + i, -n)) : P / n; };
const pvAnnuity = (A, rateYear, n) => { const i = rateYear / 1200; return i ? A * (1 - Math.pow(1 + i, -n)) / i : A * n; };
const flatA = (P, rateYear, n) => P / n + P * rateYear / 1200;
const pvFlat = (A, rateYear, n) => A / (1 / n + rateYear / 1200);
function schedB(P, rateYear, n, method, startYm) {
  const rows = []; let sisa = P; const i = rateYear / 1200, A = method === "flat" ? flatA(P, rateYear, n) : annuity(P, rateYear, n);
  const [y0, m0] = (startYm || "").split("-").map(Number);
  for (let k = 1; k <= n; k++) {
    const bunga = method === "flat" ? P * i : sisa * i;
    let pokok = method === "flat" ? P / n : A - bunga; if (k === n) pokok = sisa;
    sisa = Math.max(0, sisa - pokok);
    const d = y0 ? new Date(y0, m0 - 1 + k - 1, 1) : null;
    rows.push({ ke: k, periode: d ? BULAN[d.getMonth()] + " " + d.getFullYear() : "", ang: pokok + bunga, pokok, bunga, sisa });
  }
  return { A, rows, bunga: rows.reduce((a, r) => a + r.bunga, 0), total: rows.reduce((a, r) => a + r.ang, 0) };
}
function effFromFlat(rateFlat, n) {
  const A = flatA(1, rateFlat, n); let r = rateFlat * 1.8 / 1200;
  for (let it = 0; it < 60; it++) { const f = r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) - A, h = 1e-7, f2 = (r + h) * Math.pow(1 + r + h, n) / (Math.pow(1 + r + h, n) - 1) - A; r -= f / ((f2 - f) / h); }
  return r * 1200;
}
function viewSimAll(v) {
  const bar = `<section class="panel" style="padding:12px 16px">${segBar(SEG.sim, [["brg", "Briguna"], ["kpr", "KPR"]], "data-simseg")}<p class="note" style="margin:0">${SEG.sim === "kpr" ? "Simulasi KPR mengikuti Tabel Perhitungan Suku Bunga KPR (per program & skema)." : "Simulasi Briguna: max plafond dari take home pay & batas RPC, angsuran anuitas atau flat, dan jadwal angsuran."} RPC = <i>repayment capacity</i>, batas angsuran terhadap penghasilan.</p></section>`;
  const host = document.createElement("div"); host.className = "grid"; host.style.gap = "18px";
  v.innerHTML = bar; v.appendChild(host);
  if (SEG.sim === "kpr") viewSimulasi(host); else viewSimBrg(host);
  v.querySelectorAll("[data-simseg]").forEach(b => b.onclick = () => { if (SEG.sim === b.dataset.simseg) return; SEG.sim = b.dataset.simseg; saveSEG(); render(); });
  // tombol & input di dalam host sudah terpasang oleh viewSimulasi/viewSimBrg
}
function viewSimBrg(v) {
  if (!/^\d{4}-\d{2}$/.test(SB.start || "")) { const d = new Date(); d.setMonth(d.getMonth() + 1); SB.start = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); }
  const f = (id, label, val, hint = "", money = true) => `<div class="field"><label for="${id}">${label}</label><input class="ctl num" id="${id}" type="text" inputmode="${money ? "numeric" : "decimal"}" autocomplete="off" value="${money ? nf0.format(val) : String(val).replace(".", ",")}">${hint !== null ? `<span class="hint" id="${id}-h">${hint}</span>` : ""}</div>`;
  const met = (id, cur) => `<div class="field"><label for="${id}">Metode</label><select class="ctl" id="${id}"><option value="anuitas" ${cur === "anuitas" ? "selected" : ""}>Anuitas</option><option value="flat" ${cur === "flat" ? "selected" : ""}>Flat</option></select><span class="hint">anuitas = bunga dari sisa pokok</span></div>`;
  v.innerHTML = `
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Kalkulator max plafond</h2><span class="sub">berdasarkan take home pay & RPC</span></div>
        <div class="form">
          ${f("bThp", "Take home pay / bulan (Rp)", SB.thp, "")}
          ${f("bOth", "Angsuran lain berjalan (Rp)", SB.oth, "isi 0 bila tidak ada")}
          ${f("bRpc", "Batas RPC (%)", SB.rpc, "maks. angsuran ÷ take home pay", false)}
          ${f("bRate", "Suku bunga (% p.a.)", SB.rate, "", false)}
          ${f("bTen", "Tenor (bulan)", SB.ten, "", false)}
          ${met("bMet", SB.met)}
        </div>
        <div id="bMax"></div>
      </section>
      <section class="panel"><div class="panel-h"><h2>Kalkulator angsuran</h2><span class="sub">ubah angka, hasil langsung dihitung</span></div>
        <div class="form">
          ${f("bPl", "Plafond (Rp)", SB.pl, "")}
          ${f("bBy", "Provisi + administrasi (%)", SB.by, "dipotong dari plafond", false)}
          <div class="field"><label>Suku bunga, tenor, metode</label><p class="note" style="margin:0" id="bSame"></p></div>
        </div>
        <div id="bAng"></div>
      </section>
    </div>
    <section class="panel" id="bSch"><div class="panel-h"><h2>Jadwal angsuran Briguna</h2>
      <div class="toolbar">
        <label class="check" for="bStart">Mulai angsuran <input class="ctl" id="bStart" type="month" value="${SB.start}" style="height:32px;width:auto"></label>
        <div class="seg" role="tablist" aria-label="Tampilan jadwal"><button type="button" role="tab" aria-selected="${SB.view !== "tahun"}" data-bv="bulan">Per bulan</button><button type="button" role="tab" aria-selected="${SB.view === "tahun"}" data-bv="tahun">Per tahun</button></div>
        <button class="btn" id="bExp" type="button">Ekspor CSV</button>
      </div></div>
      <div class="grid cols-2"><div id="bSum"></div><div class="chart"><canvas id="cSimB"></canvas></div></div>
      <div id="tSimB"></div>
      <p class="note" style="margin:0">Simulasi, bukan penawaran resmi. Anuitas: angsuran tetap, porsi bunga menurun. Flat: bunga dihitung dari plafond awal.</p></section>`;
  const money = { bThp: "thp", bOth: "oth", bPl: "pl" }, nums = { bRpc: "rpc", bRate: "rate", bTen: "ten", bBy: "by" };
  Object.entries(money).forEach(([id, k]) => $("#" + id).addEventListener("input", e => {
    const el = e.target, digits = el.value.replace(/\D/g, ""), fromEnd = el.value.length - el.selectionEnd;
    SB[k] = digits ? +digits : 0; el.value = digits ? nf0.format(SB[k]) : "";
    const pos = Math.max(0, el.value.length - fromEnd); try { el.setSelectionRange(pos, pos); } catch {}
    saveSB(); calc(); }));
  Object.entries(nums).forEach(([id, k]) => $("#" + id).addEventListener("input", e => { const x = parseFloat(e.target.value.replace(",", ".")); if (isFinite(x)) { SB[k] = k === "ten" ? Math.max(1, Math.min(360, Math.round(x))) : x; saveSB(); calc(); } }));
  $("#bMet").onchange = e => { SB.met = e.target.value; saveSB(); calc(); };
  $("#bStart").onchange = e => { if (/^\d{4}-\d{2}$/.test(e.target.value)) { SB.start = e.target.value; saveSB(); calc(); } };
  v.querySelectorAll("[data-bv]").forEach(b => b.onclick = () => { SB.view = b.dataset.bv; saveSB(); v.querySelectorAll("[data-bv]").forEach(x => x.setAttribute("aria-selected", x === b)); calc(); });
  function calc() {
    $("#bThp-h").textContent = rpFull(SB.thp); $("#bPl-h").textContent = rpFull(SB.pl);
    $("#bSame").textContent = `${nf2.format(SB.rate)}% p.a. · ${SB.ten} bulan (${nf1.format(SB.ten / 12)} th) · ${SB.met}, diambil dari kalkulator max plafond`;
    const n = SB.ten, maxA = Math.max(0, SB.thp * SB.rpc / 100 - SB.oth), P = SB.met === "flat" ? pvFlat(maxA, SB.rate, n) : pvAnnuity(maxA, SB.rate, n), Pr = Math.floor(P / 1e5) * 1e5;
    $("#bMax").innerHTML = !SB.thp ? `<p class="note">Isi take home pay untuk melihat hasil.</p>` : `<div class="result-big"><small>Max plafond (dibulatkan ke bawah per Rp100 ribu)</small><b>${rpFull(Pr)}</b></div>
      <dl class="kv"><dt>Max angsuran (${nf0.format(SB.rpc)}% × THP − angsuran lain)</dt><dd>${rpFull(maxA)}</dd><dt>RPC terpakai angsuran lain</dt><dd>${pct(SB.thp ? SB.oth / SB.thp : 0, 1)}</dd><dt>Tenor</dt><dd>${n} bln</dd></dl>
      ${maxA <= 0 ? `<div class="banner"><span><b>Angsuran lain sudah melebihi batas RPC.</b> Tidak ada ruang plafond.</span></div>` : `<div class="toolbar"><button type="button" class="btn primary" id="bUse">Pakai sebagai plafond</button></div>`}`;
    const u = $("#bUse"); if (u) u.onclick = () => { SB.pl = Pr; $("#bPl").value = nf0.format(Pr); saveSB(); calc(); $("#bPl").scrollIntoView({ behavior: "smooth", block: "center" }); };
    if (!SB.pl || !n) { $("#bAng").innerHTML = `<p class="note">Isi plafond untuk melihat angsuran.</p>`; $("#tSimB").innerHTML = ""; $("#bSum").innerHTML = ""; return; }
    const S = schedB(SB.pl, SB.rate, n, SB.met, SB.start), rpcPakai = SB.thp ? (S.A + SB.oth) / SB.thp : null, ok = rpcPakai != null && rpcPakai <= SB.rpc / 100;
    $("#bAng").innerHTML = `<div class="result-big"><small>Angsuran per bulan${SB.met === "flat" ? " (flat)" : ""}</small><b>${rpFull(S.A)}</b></div>
      <dl class="kv"><dt>Total bunga</dt><dd>${rpFull(S.bunga)}</dd><dt>Total pembayaran</dt><dd>${rpFull(S.total)}</dd><dt>Biaya provisi + admin</dt><dd>${rpFull(SB.pl * SB.by / 100)}</dd><dt>Dana diterima</dt><dd>${rpFull(SB.pl * (1 - SB.by / 100))}</dd>
        ${SB.met === "flat" ? `<dt>Setara bunga efektif</dt><dd>${nf2.format(effFromFlat(SB.rate, n))}% p.a.</dd>` : ""}<dt>Penghasilan minimal (RPC ${nf0.format(SB.rpc)}%)</dt><dd>${rpFull((S.A + SB.oth) / (SB.rpc / 100))}</dd>
        ${rpcPakai != null ? `<dt>RPC terpakai (dengan angsuran lain)</dt><dd>${chip(pct(rpcPakai, 1), ok ? "good" : "crit")}</dd>` : ""}</dl>`;
    $("#bSum").innerHTML = `<dl class="kv"><dt>Plafond</dt><dd>${rpFull(SB.pl)}</dd><dt>Suku bunga</dt><dd>${nf2.format(SB.rate)}% ${SB.met}</dd><dt>Jangka waktu</dt><dd>${n} bulan</dd><dt>Angsuran</dt><dd>${rpFull(S.A)}</dd><dt>Total bunga</dt><dd>${rpFull(S.bunga)}</dd><dt>Total pembayaran</dt><dd>${rpFull(S.total)}</dd></dl>`;
    const yr = []; S.rows.forEach(r => { const y = Math.ceil(r.ke / 12); const o = yr[y - 1] || (yr[y - 1] = { tahun: y, ang: 0, pokok: 0, bunga: 0, sisa: 0, n: 0 }); o.ang += r.ang; o.pokok += r.pokok; o.bunga += r.bunga; o.sisa = r.sisa; o.n++; });
    mkChart("cSimB", { type: "bar", data: { labels: yr.map(y => "Th " + y.tahun), datasets: [
      { label: "Pokok", data: yr.map(y => y.pokok), backgroundColor: cssv("--s1"), borderColor: cssv("--surface"), borderWidth: { top: 2 }, borderRadius: 2, maxBarThickness: 26 },
      { label: "Bunga", data: yr.map(y => y.bunga), backgroundColor: cssv("--s2"), borderColor: cssv("--surface"), borderWidth: { bottom: 2 }, borderRadius: 2, maxBarThickness: 26 }] },
      options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${c.dataset.label}: ${rpFull(c.parsed.y)}` } } },
        scales: { x: { ...baseOpts().scales.x, stacked: true }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1e6) + " Jt" } } } }) });
    if (SB.view === "tahun") table($("#tSimB"), [{ key: "tahun", label: "Tahun", r: 1 }, { key: "ang", label: "Angsuran / bln", r: 1, fmt: (x, r) => rpFull(x / r.n) },
      { key: "pokok", label: "Pokok setahun", r: 1, fmt: rpFull }, { key: "bunga", label: "Bunga setahun", r: 1, fmt: rpFull }, { key: "sisa", label: "Sisa pokok", r: 1, fmt: rpFull }], yr,
      { state: { key: "tahun", dir: 1 }, foot: { tahun: "Total", pokok: rpFull(sum(yr, "pokok")), bunga: rpFull(sum(yr, "bunga")) } });
    else table($("#tSimB"), [{ key: "ke", label: "Bulan ke", r: 1, fmt: x => `<b>${x}</b>` }, { key: "periode", label: "Periode", nosort: 1 },
      { key: "ang", label: "Angsuran", r: 1, fmt: x => `<b>${rpFull(x)}</b>` }, { key: "pokok", label: "Pokok", r: 1, fmt: rpFull }, { key: "bunga", label: "Bunga", r: 1, fmt: rpFull }, { key: "sisa", label: "Sisa pokok", r: 1, fmt: rpFull }],
      S.rows, { state: { key: "ke", dir: 1 }, page: 24, foot: { ke: "Total", ang: rpFull(S.total), pokok: rpFull(SB.pl), bunga: rpFull(S.bunga) } });
    $("#bExp").onclick = () => exportCSV("jadwal-angsuran-briguna-" + Math.round(SB.pl / 1e6) + "jt-" + n + "bln", [["ke", "Bulan ke"], ["periode", "Periode"], ["ang", "Angsuran"], ["pokok", "Pokok"], ["bunga", "Bunga"], ["sisa", "Sisa pokok"]],
      S.rows.map(r => ({ ...r, ang: Math.round(r.ang), pokok: Math.round(r.pokok), bunga: Math.round(r.bunga), sisa: Math.round(r.sisa) })));
  }
  calc();
}
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
/* ================= ADMIN: kelola data (upload), user, access log ================= */
const ICO_UP = '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>';
const dIco = p => `<span class="dc-ico"><svg viewBox="0 0 24 24">${p}</svg></span>`;
const updS = iso => iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–";
function dataCards() {
  const M = DB.meta || {}, K = DB.ker, lw = M.lw || {}, R = DB.rmkSets;
  const rmSt = s => { const P = R[s]; return P && P.months && P.months.length ? `<b>${uniq(P.months.filter(x => x.tDisb > 0).map(x => x.rm)).length}</b> ${RML[s].who.toLowerCase()} bertarget · s.d. <b>${tglS(P.asof)}</b>` : "belum ada data"; };
  const lwSt = s => { const x = lw[s]; return x ? `<b>${nf0.format(x.n)} rekening</b>, posisi <b>${nS(x.asof)}</b>${x.prev ? " · pembanding " + nS(x.prev) : " · <span class='bad'>belum ada bulan lalu</span>"}` : "belum ada data"; };
  const pSt = s => { const x = M["pipe_" + s]; return x ? `<b>${nf0.format(x.n)} berkas</b> + ${nf0.format(x.oh)} on hand, posisi <b>${tglS(x.asof)}</b> · diunggah ${updS(x.updated)}` : "belum ada data"; };
  const bSt = () => { const x = M.brs_B; return x ? `posisi <b>${tglS(x.asof)}</b>${x.jam ? " pukul <b>" + esc(x.jam) + "</b>" : ""} · ${nf0.format(x.n)} RM &amp; mantri · diunggah ${updS(x.updated)}` : "belum ada data"; };
  const card = (k, ico, title, st, note, body) => `<section class="dcard" data-k="${k}"><div class="dc-h">${ico}<div><h3>${title}</h3><p class="dc-st">${st}</p></div></div><p class="note">${note}</p>${body}<p class="note dc-prog" id="pr_${k}" hidden></p></section>`;
  const file = (k, accept = ".xlsx,.xlsm,.xls,.csv", multi = false, lbl = "Upload") => `<label class="btn" for="f_${k}">${ICO_UP}${lbl}</label><input type="file" id="f_${k}" data-up="${k}" accept="${accept}" ${multi ? "multiple" : ""} hidden>`;
  const lwBody = s => `<div class="toolbar"><select class="ctl" id="m_lw${s}" style="flex:1 1 180px"><option value="cur">Posisi terkini</option><option value="prev">Bulan lalu (pembanding DG/UG)</option></select>${file("lw" + s, undefined, true)}</div><p class="note" style="margin:6px 0 0">Bisa pilih 2 file sekaligus (posisi terkini &amp; bulan lalu): yang tanggalnya lebih baru otomatis jadi posisi terkini.</p><div id="i_lw${s}"></div>`;
  return `<p class="note" style="margin:0">Data keragaan, RKA, disburse, list RM/mantri, dan produktivitas KPR dibaca langsung dari Google Sheets lewat <b>Sync</b>. File di bawah diolah di browser lalu disimpan ke Google Sheets / Drive milik admin, dan langsung tampil untuk semua pengguna sesuai perannya.</p>
    <div class="dgrid">
      ${card("sync", dIco('<path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7"/><path d="M18 2v4.5h-4.5M6 22v-4.5h4.5"/>'), "Google Sheets",
        `Keragaan s.d. <b>${K ? tglS(K.dates[K.dates.length - 1]) : "–"}</b>${K && K.rka ? " · RKA " + blnS(K.rka.months[0]) + "–" + blnS(K.rka.months[K.rka.months.length - 1]) : ""}<br>Ritel: ${rmSt("R")}<br>Mikro: ${rmSt("M")}<br>KPR: ${rmSt("K")}<br>Cache server: ${updS(M.updated)}`,
        "Sheet: keragaan, RKA, disburse ritel 2025/2026, disburse mikro, list RM ritel, list mantri mikro, produktivitas KPR (Database History & Database Monthly), RM & KC card.",
        `<button class="btn primary" type="button" id="btnSyncF">${'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7"/><path d="M18 2v4.5h-4.5M6 22v-4.5h4.5"/></svg>'}Sync sekarang</button> <button class="btn" type="button" id="btnSyncR" title="Bangun ulang hanya produktivitas Briguna Ritel & Mikro (cepat)">Sync produktivitas</button>${syncResHtml()}`)}
      ${card("lwB", dIco('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h3M8 16h6"/>'), "LW321 Briguna", lwSt("B"),
        "LW321 Briguna Ritel + Mikro (semua sheet dibaca, rekening ganda dibuang, produk non-Briguna diabaikan). Posisi terkini yang lebih baru sebulan otomatis menggeser yang lama menjadi pembanding bulan lalu.", lwBody("B"))}
      ${card("lwK", dIco('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'), "LW321 KPR", lwSt("K"),
        "LW321 KPR (deskripsi KPR / Kredit Pemilikan Rumah). Subsidi bila FLPP/Sejahtera atau plafon ≤ Rp185 juta.", lwBody("K"))}
      ${card("pipeB", dIco('<path d="M3 4h18l-7 8v6l-4 2v-8z"/>'), "Pipeline Brispot Briguna", pSt("B"),
        "File Pipeline BRISPOT Briguna (sheet Pipeline, OnHand, Ref_Batal, Rencana Realisasi RM). Jenis Ritel/Mikro dari kolom produk/segmen bila ada. Menggantikan data sebelumnya.", file("pipeB"))}
      ${card("brsB", dIco('<path d="M4 6h16M4 12h10M4 18h7"/><path d="M16 16l2.2 2.2L22 14"/>'), "Brispot Briguna · Warm / Hot Leads", bSt(),
        "File <b>Brispot Briguna</b> per jam (sheet Nominatif, Rule, RM BGRITEL, Mantri BGMIKRO, KC BGRITEL, Unit BGMIKRO). Dihitung otomatis menjadi tabel Warm / Hot Leads &amp; Pencairan Sukses per RM, KC, Mantri dan Unit di menu Pipeline Brispot. Menggantikan data sebelumnya.", file("brsB"))}
      ${card("pipeK", dIco('<path d="M3 4h18l-7 8v6l-4 2v-8z"/>'), "Pipeline Brispot KPR", pSt("K"),
        "File Pipeline BRISPOT KPR (sheet Pipeline, OnHand, Ref_Batal, Rencana Realisasi RM). Menggantikan data sebelumnya.", file("pipeK"))}
      ${card("rate", dIco('<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h4"/>'), "Tabel suku bunga KPR",
        M.rate ? `<b>${esc(String(M.rate.title || "Tabel suku bunga").replace(/^TABEL SUKU BUNGA KPP\s*-\s*/i, ""))}</b>, ${M.rate.n} skema · ${updS(M.rate.updated)}` : DB.rate ? `${DB.rate.rows.length} skema` : "belum ada data",
        "File Tabel Perhitungan Suku Bunga KPR (sheet Tabel Suku Bunga & Rekap). Dipakai di Simulasi KPR.", file("rate"))}
      ${card("fotoRm", dIco('<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>'), "Foto RM (RM card)",
        `<b>${Object.keys(DB.foto.rm || {}).length} foto</b> tersimpan`, "Pilih satu atau beberapa foto. <b>Nama file = nama RM / mantri</b> (mis. <code>Melva Novelina S.jpg</code>). Dipotong persegi otomatis; foto lama bernama sama diganti. Tercatat di sheet <code>RM &amp; KC card</code>.", file("fotoRm", "image/*", true, "Upload foto"))}
      ${card("fotoKc", dIco('<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/>'), "Ikon kantor cabang (KC card)",
        `<b>${Object.keys(DB.foto.kc || {}).length} ikon</b> tersimpan`, "Pilih gambar ikon/logo tiap KC. <b>Nama file = nama KC</b> (mis. <code>KC Binjai.png</code> atau <code>Binjai.png</code>). Tampil di kartu Per Cabang.", file("fotoKc", "image/*", true, "Upload ikon"))}
    </div>`;
}
function bindDataCards(root) {
  const b = root.querySelector("#btnSyncF"); if (b) b.onclick = () => doSync(true, b);
  const br = root.querySelector("#btnSyncR"); if (br) br.onclick = () => doSyncRmk(br);
  root.querySelectorAll("input[type=file][data-up]").forEach(inp => inp.addEventListener("change", e => {
    const k = inp.dataset.up, files = [...e.target.files]; if (!files.length) return;
    (k === "brsB" ? upBrs(files[0], inp) : k === "fotoRm" || k === "fotoKc" ? upFoto(files, k === "fotoKc" ? "kc" : "rm", inp) : k.startsWith("lw") ? upLW(files, k.slice(-1), inp) : upPart(files[0], k, inp));
  }));
}
function openData() { if (!isAdmin()) return; const b = $("#dataBody"); b.innerHTML = dataCards(); bindDataCards(b); $("#dlgData").showModal(); }
const progOf = k => { const p = document.querySelector("#pr_" + k); if (p) p.hidden = false; return { set: t => { if (p) p.textContent = t; }, done: () => { if (p) p.hidden = true; } }; };
const okCard = k => { const c = document.querySelector(`.dcard[data-k="${k}"]`); if (c) { c.classList.add("ok"); setTimeout(() => c.classList.remove("ok"), 2500); } };
async function readWB(f) { if (typeof XLSX === "undefined") throw new Error("Pustaka Excel gagal dimuat. Periksa koneksi internet."); return XLSX.read(await f.arrayBuffer(), { cellDates: false }); }
function refreshDataUI() { const b = $("#dataBody"); if ($("#dlgData").open) { b.innerHTML = dataCards(); bindDataCards(b); } if (curView() === "admin") renderAdminTab(); }
// LW321: 1 file (posisi mengikuti pilihan, dijaga urutan tanggalnya) atau 2 file sekaligus (yang lebih baru = posisi terkini, yang lebih lama = bulan lalu)
async function upLW(files, set, inp) {
  const pg = progOf("lw" + set), info = $("#i_lw" + set);
  try {
    if (files.length > 2) throw new Error("Pilih paling banyak 2 file: posisi terkini dan bulan lalu.");
    const L = [];
    for (const f of files) {
      pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
      const wb = await readWB(f); pg.set("Mengolah " + f.name + "…"); await new Promise(r => setTimeout(r, 20));
      L.push({ f, P: parseLWUpload(wb, set) });
    }
    pg.done();
    let warn = "";
    if (L.length === 2) {
      L.sort((a, b) => b.P.asof.localeCompare(a.P.asof));
      if (!L[0].P.asof || L[0].P.asof === L[1].P.asof) throw new Error(`Kedua file berposisi sama (${tglS(L[0].P.asof)}). Pilih file posisi terkini dan file bulan lalu.`);
      L[0].mode = "cur"; L[1].mode = "prev";
    } else {
      // jaga urutan posisi: file lebih lama dari posisi terkini disimpan sebagai bulan lalu, dan sebaliknya
      // posisi tersimpan di meta berupa nomor hari (lihat nS) → ubah ke yyyy-mm-dd agar bisa dibandingkan
      const P = L[0].P, cm = ((DB.meta || {}).lw || {})[set] || {}, cur = { asof: typeof cm.asof === "number" ? nIso(cm.asof) : cm.asof ? dateX(cm.asof) : "" }; let mode = $("#m_lw" + set).value;
      if (cur.asof && P.asof && mode === "cur" && P.asof < cur.asof) { mode = "prev"; warn = `File ini posisi <b>${tglS(P.asof)}</b>, lebih lama dari posisi terkini <b>${tglS(cur.asof)}</b>, jadi disimpan sebagai <b>bulan lalu</b>.`; }
      else if (cur.asof && P.asof && mode === "prev" && P.asof >= cur.asof) { mode = "cur"; warn = `File ini posisi <b>${tglS(P.asof)}</b>, tidak lebih lama dari posisi terkini <b>${tglS(cur.asof)}</b>, jadi disimpan sebagai <b>posisi terkini</b>.`; }
      if (warn) $("#m_lw" + set).value = mode;
      L[0].mode = mode;
    }
    const mLbl = m => m === "cur" ? "posisi terkini" : "bulan lalu";
    const desc = ({ f, P, mode }) => { const segN = {}; P.rows.forEach(r => segN[r[19]] = (segN[r[19]] || 0) + 1);
      return `<div class="ds"><b>${esc(f.name)}</b><br><b>${nf0.format(P.rows.length)} rekening</b> · posisi <b>${tglS(P.asof)}</b> · ${Object.entries(segN).map(([k, n]) => esc(prodLbl(k)) + " " + nf0.format(n)).join(" · ")}${P.dropped ? ` · <span class="note">${nf0.format(P.dropped)} baris produk lain diabaikan</span>` : ""}<br>sheet: ${esc(P.sheets.join(", "))} · disimpan sebagai <b>${mLbl(mode)}</b></div>`; };
    info.innerHTML = `${warn ? `<div class="banner"><span>${warn}</span></div>` : ""}${L.map(desc).join("")}
      <div class="toolbar"><button class="btn primary" type="button" id="go_lw${set}">Kirim ke database</button><button class="btn" type="button" id="no_lw${set}">Batal</button></div>`;
    $("#no_lw" + set).onclick = () => { info.innerHTML = ""; };
    $("#go_lw" + set).onclick = async ev => {
      ev.currentTarget.disabled = true; const N = window.APP_CONFIG.UPLOAD_CHUNK || 4000, done = [];
      try {
        // posisi terkini dikirim lebih dulu, lalu bulan lalu
        for (const [k, { P, mode }] of L.entries()) {
          const total = Math.ceil(P.rows.length / N);
          for (let i = 0; i < total; i++) { pg.set(`${L.length > 1 ? `File ${k + 1}/${L.length} · ` : ""}Mengirim ${i + 1} / ${total}…`); await Auth.call("lwUpload", { set, mode, seq: i, total, asof: P.asof, rows: P.rows.slice(i * N, (i + 1) * N) }); }
          done.push(`${nf0.format(P.rows.length)} rekening posisi ${tglS(P.asof)} sebagai ${mLbl(mode)}`);
        }
        pg.set("Memuat ulang data…"); await loadParts(["meta", "gerak", "lw_" + set]);
        render(); refreshDataUI(); const inf = $("#i_lw" + set); if (inf) inf.innerHTML = `<div class="ds">Upload selesai: ${done.join("; ")}.</div>`;
        okCard("lw" + set); toast("LW321 " + LWL[set].seg + " tersimpan.");
      } catch (er) { const inf = $("#i_lw" + set) || info; inf.innerHTML = `<div class="banner"><span>Upload gagal: ${esc(er.message)}.${done.length ? " Sudah tersimpan: " + esc(done.join("; ")) + "." : ""} Ulangi dari awal.</span></div>`; }
      pg.done();
    };
  } catch (er) { pg.done(); toast(er.message); }
  if (inp) inp.value = "";
}
// Brispot Briguna: file diolah di browser (parseBrispot) menjadi tabel RM / KC / Mantri / Unit, lalu disimpan sebagai bagian data "brs_B"
async function upBrs(f, inp) {
  const pg = progOf("brsB");
  try {
    pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
    const wb = await readWB(f); pg.set("Mengolah…"); await new Promise(r => setTimeout(r, 20));
    const data = parseBrispot(wb, f.name);
    if (!data) throw new Error("File ini bukan Brispot Briguna (butuh sheet Nominatif, RM BGRITEL dan Mantri BGMIKRO).");
    if (!data.asof) throw new Error("Tanggal posisi tidak terbaca. Pastikan nama file memuat tanggal & jam, mis. \"Brispot Briguna - (21 Okt 26 (14.16) Temp.xlsx\".");
    pg.set("Mengirim ke server…");
    await Auth.call("partUpload", { name: "brs_B", data });
    await loadParts(["meta", "brs_B"]);
    okCard("brsB"); const w = data.warn || {};
    toast(`Brispot Briguna posisi ${tglS(data.asof)}${data.jam ? " " + data.jam : ""}: ${data.rm.length} RM, ${data.mantri.length} mantri · tersimpan.${w.tidakCocok ? " " + w.tidakCocok + " lead tanpa RM/mantri cocok." : ""}`);
    render(); refreshDataUI();
  } catch (er) { toast(er.message); }
  pg.done(); if (inp) inp.value = "";
}
async function upPart(f, k, inp) {
  const pg = progOf(k);
  try {
    pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
    const wb = await readWB(f); let name, data, msg;
    if (k === "rate") { data = parseRates(wb); if (!data) throw new Error("File ini bukan Tabel Perhitungan Suku Bunga KPR (sheet dengan kolom Program, Kelompok, Produk)."); name = "rate"; msg = `Tabel suku bunga: ${uniq(data.rows.map(x => x.prog)).length} program, ${data.rows.length} skema`; }
    else { const set = k === "pipeB" ? "B" : "K"; data = parsePipeline(wb, set); if (!data) throw new Error("File ini bukan Pipeline BRISPOT (sheet Pipeline dengan kolom Nama Branch, Nama Debitur, Status)."); name = "pipe_" + set; msg = `Pipeline ${PIPEL[set].seg} posisi ${tglS(data.asof)}: ${data.items.length} berkas + ${data.onhand.length} on hand`; }
    pg.set("Mengirim ke server…");
    await Auth.call("partUpload", { name, data });
    await loadParts(["meta", name]);
    okCard(k); toast(msg + " · tersimpan."); render(); refreshDataUI();
  } catch (er) { toast(er.message); }
  pg.done(); if (inp) inp.value = "";
}
// foto RM / ikon KC: nama file dicocokkan ke nama RM/mantri (produktivitas & LW321) atau nama KC (master), dipotong persegi lalu diperkecil
async function upFoto(files, kind, inp) {
  const pg = progOf(kind === "kc" ? "fotoKc" : "fotoRm");
  const names = kind === "kc" ? KC_MASTER.map(u => u.nama) : uniq([...Object.values(DB.rmkSets).flatMap(P => P && P.months ? P.months.map(x => x.rm) : []), ...Object.values(DB.lwSets).flatMap(L => L && L.rmN ? L.rmN : [])]).filter(n => n && !/^PN |^\(?Tanpa/.test(n));
  const keys = names.map(nmKey), ok = [], miss = [], items = [];
  for (const f of files) {
    pg.set("Memproses " + f.name + "…");
    const base = f.name.replace(/\.[^.]+$/, "");
    let nm = null;
    if (kind === "kc") { const u = kcByName(base); nm = u ? u.nama : null; }
    else { const k = nmKey(base), i = keys.indexOf(k) >= 0 ? keys.indexOf(k) : keys.findIndex(x => x && k && (x.startsWith(k) || k.startsWith(x))); nm = i >= 0 ? names[i] : null; }
    if (!nm) { miss.push(base); continue; }
    try {
      const bmp = await createImageBitmap(f), S = kind === "kc" ? 256 : 320, cv = document.createElement("canvas"); cv.width = cv.height = S; const c2 = cv.getContext("2d");
      if (kind === "kc") { const sc = Math.min(S / bmp.width, S / bmp.height), w = bmp.width * sc, h = bmp.height * sc; c2.drawImage(bmp, (S - w) / 2, (S - h) / 2, w, h); }
      else { const side = Math.min(bmp.width, bmp.height), sx = (bmp.width - side) / 2, sy = bmp.height > bmp.width ? (bmp.height - side) * .2 : 0; c2.drawImage(bmp, sx, sy, side, side, 0, 0, S, S); }
      let url = cv.toDataURL("image/webp", .82); if (!url.startsWith("data:image/webp")) url = cv.toDataURL(kind === "kc" ? "image/png" : "image/jpeg", .85);
      items.push({ kind, name: nm, data: url }); ok.push(nm);
    } catch { miss.push(base); }
  }
  try {
    for (let i = 0; i < items.length; i += 6) { pg.set(`Mengirim ${Math.min(items.length, i + 6)} / ${items.length}…`); await Auth.call("fotoUpload", { items: items.slice(i, i + 6) }); }
    if (items.length) { await loadParts(["foto", "meta"]); toast(`${ok.length} ${kind === "kc" ? "ikon KC" : "foto RM"} tersimpan.`); okCard(kind === "kc" ? "fotoKc" : "fotoRm"); render(); refreshDataUI(); }
  } catch (er) { toast("Upload gagal: " + er.message); }
  if (miss.length) setTimeout(() => toast(`Nama ${kind === "kc" ? "KC" : "RM"} tidak ditemukan untuk: ${miss.slice(0, 5).join(", ")}${miss.length > 5 ? ", dll." : ""}. Samakan nama file.`), 900);
  pg.done(); if (inp) inp.value = "";
}
// hasil sync terakhir (sesi ini): ditampilkan di kartu Google Sheets dan sebagai notifikasi
let SYNC_RES = null;
const syncJam = t => new Date(t).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function syncResHtml() {
  if (!SYNC_RES) return "";
  const R = SYNC_RES, cls = R.state === "ok" ? "ok" : R.state === "run" ? "run" : R.state === "skip" ? "skip" : "err";
  return `<div class="sync-res ${cls}" role="status">${R.state === "run" ? '<span class="spin" aria-hidden="true"></span>' : R.state === "ok" ? "✓ " : R.state === "skip" ? "ℹ " : "✕ "}${R.msg}</div>`;
}
async function doSync(force, btn) {
  if (btn) btn.disabled = true; const st = $("#syncSt"); if (st) st.textContent = "sinkronisasi…";
  SYNC_RES = { state: "run", msg: "Sinkronisasi berjalan… server membaca ulang semua sheet (bisa 3–6 menit). Jangan tutup atau refresh halaman." }; refreshDataUI();
  try {
    const j = await Auth.call("sync", { force: !!force && isAdmin() }); await loadAll(true);
    const upd = j.updated || (DB.meta && DB.meta.updated) || new Date().toISOString();
    SYNC_RES = j.skipped ? { state: "skip", msg: `Data sudah terbaru (sync terakhir kurang dari 2 menit lalu) · update terakhir <b>${syncJam(upd)}</b>` }
      : { state: "ok", msg: `Data berhasil di-sync · update terbaru <b>${syncJam(upd)}</b>` };
    toast(j.skipped ? "Data sudah terbaru · update terakhir " + syncJam(upd) : "✓ Data berhasil di-sync · update terbaru " + syncJam(upd));
  } catch (er) { SYNC_RES = { state: "err", msg: "Sync belum selesai: " + esc(er.message) + " Server mungkin masih memproses; tunggu beberapa menit lalu refresh halaman sebelum mencoba lagi." }; toast("Sync gagal: " + er.message); }
  refreshDataUI(); if (btn && btn.isConnected) btn.disabled = false; syncLabel();
}

// sync cepat: hanya produktivitas Briguna Ritel & Mikro (rincian produk Karya / Pra-Purna / Purna), tanpa membangun ulang semua data
async function doSyncRmk(btn) {
  if (btn) btn.disabled = true;
  SYNC_RES = { state: "run", msg: "Membangun ulang produktivitas Briguna Ritel & Mikro… biasanya kurang dari 1–2 menit." }; refreshDataUI();
  try {
    const j = await Auth.call("syncParts", { parts: ["rmk"] }); await loadParts(["meta", "rmk_R", "rmk_M"], null, true);
    const upd = j.updated || new Date().toISOString(), st = j.stats || {};
    SYNC_RES = { state: "ok", msg: `Produktivitas Ritel & Mikro diperbarui · <b>${syncJam(upd)}</b>${st.ms ? " · " + Math.round(st.ms / 1000) + " dtk" : ""}` };
    toast("✓ Produktivitas Ritel & Mikro diperbarui"); render();
  } catch (er) { SYNC_RES = { state: "err", msg: "Sync produktivitas gagal: " + esc(er.message) }; toast("Sync produktivitas gagal: " + er.message); }
  refreshDataUI(); if (btn && btn.isConnected) btn.disabled = false;
}

// sync per menu (admin): tiap menu hanya membangun ulang datanya sendiri lewat action syncParts, tanpa menunggu sync penuh
const SP_LBL = { ker: "keragaan", rmk: "produktivitas Ritel & Mikro", kpr: "produktivitas KPR", lw: "LW321 & DG/UG" };
const SP_LOAD = { ker: ["ker"], rmk: ["rmk_R", "rmk_M"], kpr: ["rmk_K"], lw: ["gerak", "lw_B", "lw_K"] };
const syncPartsOf = k => k === "keragaan" ? ["ker"] : k === "produktivitas" ? [SEG.rm === "K" ? "kpr" : "rmk"] : k === "nominatif" || k === "kualitas" ? ["lw"] : [];
function updateSyncPart(k) {
  const b = $("#btnSyncPart"); if (!b) return; const p = syncPartsOf(k); b.hidden = !(isAdmin() && p.length); b.dataset.p = p.join(",");
  const sp = b.querySelector("span"); if (sp) sp.textContent = "Sync " + (p.length ? SP_LBL[p[0]] : "menu ini"); b.title = "Sync hanya " + (p.length ? SP_LBL[p[0]] : "data menu ini") + " (admin)";
}
async function doSyncPart(btn) {
  const parts = (btn.dataset.p || "").split(",").filter(Boolean); if (!parts.length) return;
  const name = parts.map(p => SP_LBL[p]).join(" + "), sp = btn.querySelector("span"), old = sp.textContent;
  btn.disabled = true; sp.textContent = "Menyinkronkan…";
  try {
    const j = await Auth.call("syncParts", { parts }); await loadParts(["meta", ...parts.flatMap(p => SP_LOAD[p])], null, true);
    const st = j.stats || {}, ms = parts.reduce((a, p) => a + (st["ms_" + p] || 0), 0);
    toast(`✓ ${name} diperbarui${ms ? " · " + Math.round(ms / 1000) + " dtk" : ""}`); render();
  } catch (er) { toast("Sync " + name + " gagal: " + er.message); }
  btn.disabled = false; sp.textContent = old;
}

/* ---------- VIEW: Admin ---------- */
const AD = { tab: lsGet(STORE + "-adtab") || "data" };
function viewAdmin(v) {
  if (!isAdmin()) { v.innerHTML = `<section class="panel"><div class="empty">Menu ini khusus admin.</div></section>`; return; }
  v.innerHTML = `<nav class="ptabs" role="tablist">${[["data", "Kelola data"], ["users", "User"], ["log", "Access log"]].map(([k, l]) => `<button type="button" role="tab" data-at="${k}" aria-selected="${AD.tab === k}">${l}</button>`).join("")}</nav><div id="adBody" class="grid"></div>`;
  v.querySelectorAll("[data-at]").forEach(b => b.onclick = () => { AD.tab = b.dataset.at; lsSet(STORE + "-adtab", AD.tab); v.querySelectorAll("[data-at]").forEach(x => x.setAttribute("aria-selected", x === b)); renderAdminTab(); });
  renderAdminTab();
}
function renderAdminTab() {
  const el = $("#adBody"); if (!el) return;
  if (AD.tab === "users") return adUsers(el);
  if (AD.tab === "log") return adLog(el);
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>Kelola data</h2><span class="sub">khusus admin</span></div>${dataCards()}</section>`; bindDataCards(el);
}
async function adUsers(el) {
  el.innerHTML = `<section class="panel"><div class="empty">Memuat user…</div></section>`;
  let j; try { j = await Auth.call("usersList"); } catch (er) { el.innerHTML = `<section class="panel"><div class="empty">${esc(er.message)}</div></section>`; return; }
  const users = j.users || [];
  const rmNames = uniq([...Object.values(DB.rmkSets).flatMap(P => P && P.months ? P.months.map(x => x.rm) : []), ...Object.values(DB.lwSets).flatMap(L => L && L.rmN ? L.rmN : [])]).filter(n => n && !/^PN |^\(?Tanpa/.test(n)).sort((a, b) => a.localeCompare(b));
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>User</h2><button class="btn primary" type="button" id="uNew">Tambah user</button></div><div id="uTbl"></div>
    <p class="note" style="margin:0">RM hanya melihat debitur & pipeline yang <b>Nama RM</b> atau <b>PN</b>-nya cocok dengan data LW321 / Pipeline. Guest hanya melihat angka agregat (tanpa nama & rekening debitur).</p></section>
    <datalist id="rmList">${rmNames.map(n => `<option value="${esc(n)}">`).join("")}</datalist>`;
  table($("#uTbl"), [{ key: "username", label: "Username", fmt: x => `<b>${esc(x)}</b>` }, { key: "nama", label: "Nama" }, { key: "role", label: "Peran", fmt: x => chip(esc(Auth.ROLE_LABEL[x] || x), x === "admin" ? "crit" : x === "rm" ? "good" : "neutral") },
    { key: "rm_name", label: "Nama RM (data)", fmt: x => esc(x || "–") }, { key: "pn", label: "PN", fmt: x => esc(x || "–") }, { key: "active", label: "Status", fmt: x => x ? chip("aktif", "good") : chip("nonaktif", "neutral") },
    { key: "last_login", label: "Login terakhir", fmt: x => x ? new Date(x).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "–" },
    { key: "_e", label: "", nosort: 1, fmt: (x, r) => `<button class="linkish" data-u="${esc(r.username)}">Ubah</button>${r.username === (Auth.user || {}).username ? "" : ` <button class="linkish bad" data-del="${esc(r.username)}">Hapus</button>`}` }], users,
    { sortKey: "username", sortDir: 1, after: t => { t.querySelectorAll("[data-u]").forEach(b => b.onclick = () => form(users.find(u => u.username === b.dataset.u)));
      t.querySelectorAll("[data-del]").forEach(b => b.onclick = () => hapus(users.find(u => u.username === b.dataset.del))); } });
  const hapus = async u => {
    if (!u || !confirm(`Hapus user "${u.username}" (${Auth.ROLE_LABEL[u.role] || u.role})? User ini tidak bisa login lagi dan tindakan ini tidak bisa dibatalkan.`)) return;
    try { await Auth.call("userDelete", { username: u.username }); toast("User " + u.username + " dihapus."); adUsers(el); } catch (er) { toast(er.message); }
  };
  const form = u => {
    $("#dlgTitle").textContent = u ? "Ubah user " + u.username : "Tambah user";
    $("#dlgBody").innerHTML = `<form id="uForm" class="form" novalidate>
      <div class="field"><label for="fUn">Username</label><input class="ctl" id="fUn" value="${esc(u ? u.username : "")}" ${u ? "readonly" : ""} maxlength="60" autocapitalize="none" required></div>
      <div class="field"><label for="fNm">Nama lengkap</label><input class="ctl" id="fNm" value="${esc(u ? u.nama : "")}" maxlength="80"></div>
      <div class="field"><label for="fRo">Peran</label><select class="ctl" id="fRo">${["admin", "rm", "guest"].map(r => `<option value="${r}" ${u && u.role === r ? "selected" : !u && r === "rm" ? "selected" : ""}>${Auth.ROLE_LABEL[r]}</option>`).join("")}</select></div>
      <div class="field"><label for="fUrm">Nama RM / mantri di data</label><input class="ctl" id="fUrm" list="rmList" value="${esc(u ? u.rm_name : "")}" maxlength="80" placeholder="ketik untuk mencari"></div>
      <div class="field"><label for="fPn">PN (opsional)</label><input class="ctl" id="fPn" value="${esc(u ? u.pn : "")}" inputmode="numeric" maxlength="12"></div>
      <div class="field"><label for="fPw">${u ? "Password baru (kosongkan bila tetap)" : "Password awal (min. 8)"}</label><input class="ctl" id="fPw" type="password" autocomplete="new-password" minlength="8" maxlength="100"></div>
      <label class="check full"><input type="checkbox" id="fAc" ${!u || u.active ? "checked" : ""}> Aktif</label>
      <div class="toolbar full"><button class="btn primary" type="submit">Simpan</button><button class="btn" type="button" data-close>Batal</button></div><p id="uMsg" class="lg-msg full" hidden></p></form>`;
    $("#dlg").showModal();
    $("#uForm").onsubmit = async e => { e.preventDefault(); const msg = $("#uMsg"), pw = $("#fPw").value, un = Auth.cleanInput($("#fUn").value, 60).toLowerCase();
      if (!u && pw.length < 8) { msg.hidden = false; msg.textContent = "Password awal minimal 8 karakter."; return; }
      if (pw && pw.length < 8) { msg.hidden = false; msg.textContent = "Password minimal 8 karakter."; return; }
      try { await Auth.call("userSave", { user: { username: un, nama: Auth.cleanInput($("#fNm").value, 80), role: $("#fRo").value, rm_name: Auth.cleanInput($("#fUrm").value, 80), pn: Auth.cleanInput($("#fPn").value, 12), active: $("#fAc").checked, phash: pw ? await Auth.pwHash(un, pw) : undefined } });
        $("#dlg").close(); toast("User tersimpan."); adUsers(el); } catch (er) { msg.hidden = false; msg.textContent = er.message; } };
  };
  $("#uNew").onclick = () => form(null);
}
async function adLog(el) {
  el.innerHTML = `<section class="panel"><div class="empty">Memuat log…</div></section>`;
  let j; try { j = await Auth.call("logList", { limit: 500 }); } catch (er) { el.innerHTML = `<section class="panel"><div class="empty">${esc(er.message)}</div></section>`; return; }
  const rows = (j.rows || []).map(r => ({ t: r[0], u: r[1], ro: r[2], a: r[3], s: r[4], d: r[5] }));
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>Access log</h2><span class="sub">500 aktivitas terakhir</span></div><input class="ctl" type="search" id="lgQ" placeholder="Cari user, aktivitas, status"><div id="lgT"></div></section>`;
  const draw = q => table($("#lgT"), [{ key: "t", label: "Waktu", fmt: x => new Date(x).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" }) }, { key: "u", label: "User", fmt: x => esc(x) }, { key: "ro", label: "Peran", fmt: x => esc(x) },
    { key: "a", label: "Aktivitas", fmt: x => esc(x) }, { key: "s", label: "Status", fmt: x => chip(esc(x), x === "OK" ? "good" : /FAIL|DENIED|LOCKED|RATE|ERR/.test(x) ? "crit" : "neutral") }, { key: "d", label: "Keterangan", fmt: x => esc(x) }],
    q ? rows.filter(r => (r.u + " " + r.a + " " + r.s + " " + r.d).toLowerCase().includes(q)) : rows, { sortKey: "t", page: 50 });
  draw(""); let qt; $("#lgQ").oninput = e => { clearTimeout(qt); qt = setTimeout(() => draw(e.target.value.trim().toLowerCase()), 200); };
}
function openPw() {
  $("#userMenu").hidden = true; $("#dlgTitle").textContent = "Ganti password";
  $("#dlgBody").innerHTML = `<form id="pwF" class="form" novalidate><div class="field full"><label for="pw0">Password lama</label><input class="ctl" type="password" id="pw0" autocomplete="current-password"></div>
    <div class="field"><label for="pw1">Password baru (min. 8)</label><input class="ctl" type="password" id="pw1" autocomplete="new-password"></div><div class="field"><label for="pw2">Ulangi password baru</label><input class="ctl" type="password" id="pw2" autocomplete="new-password"></div>
    <div class="toolbar full"><button class="btn primary" type="submit">Simpan</button><button class="btn" type="button" data-close>Batal</button></div><p id="pwM" class="lg-msg full" hidden></p></form>`;
  $("#dlg").showModal();
  $("#pwF").onsubmit = async e => { e.preventDefault(); const m = $("#pwM"), a = $("#pw1").value;
    if (a.length < 8) { m.hidden = false; m.textContent = "Password baru minimal 8 karakter."; return; } if (a !== $("#pw2").value) { m.hidden = false; m.textContent = "Ulangan password tidak sama."; return; }
    try { await Auth.changePassword($("#pw0").value, a); $("#dlg").close(); toast("Password diganti."); } catch (er) { m.hidden = false; m.textContent = er.message; } };
}
/* ================= unduh tabel / grafik: Excel, CSV, PDF, gambar (PNG) ================= */
// Tiap section yang berisi tabel atau grafik mendapat tombol "Unduh". Excel/CSV = data tabel (semua baris, bukan hanya yang tampil);
// PDF & gambar = tampilan tabel/grafik section itu (tabel yang terpotong halaman dibuka penuh dulu).
let XMODE = null;
const Exp = (() => {
  const LIBS = { h2i: "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js", pdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" };
  const loaded = {};
  const lib = k => loaded[k] || (loaded[k] = new Promise((res, rej) => { const s = document.createElement("script"); s.src = LIBS[k]; s.onload = res; s.onerror = () => { delete loaded[k]; rej(new Error("Pustaka unduhan gagal dimuat. Periksa koneksi internet.")); }; document.head.appendChild(s); }));
  const ICO = '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/></svg>';
  const txt = h => { const d = document.createElement("div"); d.innerHTML = String(h ?? "").replace(/<br\s*\/?>/gi, " · "); return d.textContent.replace(/\s+/g, " ").replace(/^ · | · $/g, "").trim(); };
  const numOf = s => { const t = String(s).trim(); if (/^\(?-?−?[\d.]+(,\d+)?\)?$/.test(t) && /\d/.test(t)) { let n = parseFloat(t.replace(/[()−]/g, m => m === "−" ? "-" : "").replace(/\./g, "").replace(",", ".")); if (/^\(.*\)$/.test(t)) n = -Math.abs(n); return isFinite(n) ? n : t; } return t; };
  const fname = s => String(s || "data").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  const titleOf = sec => { const h = sec.querySelector(".panel-h h2, .l-qvh h3, h2, h3"); return h ? h.textContent.trim() : "data"; };
  const ctxOf = () => { const t = ($("#pageTitle") || {}).textContent || ""; return t; };
  // data tabel dari helper table() (semua baris) atau dari DOM tabel apa adanya (dengan baris kepala bertingkat)
  function aoaOf(sec) {
    const out = [];
    const hosts = [...sec.querySelectorAll("*")].filter(e => e._tbl);
    const tables = [...sec.querySelectorAll("table")];
    if (hosts.length) hosts.forEach((h, i) => { const { cols, rows } = h._tbl; if (i) out.push([]);
      out.push(cols.map(c => txt(c.label)));
      rows.forEach(r => out.push(cols.map(c => numOf(txt(c.fmt ? c.fmt(r[c.key], r) : r[c.key])))));
      const foot = h._tbl.foot; if (foot && rows.length) out.push(cols.map(c => numOf(txt(foot[c.key] ?? "")))); });
    tables.filter(t => !hosts.some(h => h.contains(t))).forEach(t => { if (out.length) out.push([]);
      const grid = []; [...t.rows].forEach((tr, ri) => { grid[ri] = grid[ri] || []; let ci = 0;
        [...tr.cells].forEach(td => { while (grid[ri][ci] !== undefined) ci++; const v = numOf(txt(td.innerHTML)), cs = td.colSpan || 1, rs = td.rowSpan || 1;
          for (let a = 0; a < rs; a++) for (let b = 0; b < cs; b++) { grid[ri + a] = grid[ri + a] || []; grid[ri + a][ci + b] = a || b ? "" : v; } ci += cs; }); });
      grid.forEach(r => out.push(r.map(x => x ?? ""))); });
    if (!out.length) [...sec.querySelectorAll("canvas")].forEach(cv => { const c = charts[cv.id]; if (!c) return; if (out.length) out.push([]);
      const ds = c.data.datasets.filter(d => !d.hidden); out.push([titleOf(sec), ...ds.map(d => d.label || "")]);
      c.data.labels.forEach((l, i) => out.push([Array.isArray(l) ? l.join(" ") : l, ...ds.map(d => { const v = d.data[i]; return v == null ? "" : typeof v === "object" ? v.y ?? v.x : v; })])); });
    return out;
  }
  function saveXlsx(name, aoa) {
    const ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new();
    ws["!cols"] = (aoa[0] || []).map((_, j) => ({ wch: Math.min(40, Math.max(8, ...aoa.slice(0, 200).map(r => String(r[j] ?? "").length + 1))) }));
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveFile(name + ".xlsx", new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  }
  function saveCsv(name, aoa) {
    const q = v => { const s = typeof v === "number" ? String(v).replace(".", ",") : String(v ?? ""); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    saveFile(name + ".csv", "﻿" + aoa.map(r => r.map(q).join(";")).join("\n"), "text/csv");
  }
  const SKIP = n => n.classList && ["xp", "xp-pop", "xp-legacy", "sec-ctl", "zoomctl"].some(c => n.classList.contains(c));
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/^(transparent|rgba\(.*,\s*0\))$/.test(c)) return c; } return "#fff"; };
  async function snap(sec, all = true, onLayout) {
    await lib("h2i");
    // buka semua baris tabel berhalaman agar ikut tergambar, lalu lebarkan section selebar tabelnya
    if (all) { sec.querySelectorAll("[data-all]").forEach(b => b.click()); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 60))); }
    const wide = Math.ceil(Math.max(sec.scrollWidth, ...[...sec.querySelectorAll(".table-wrap")].map(w => w.scrollWidth + 34)));
    sec.classList.add("xp-shot"); sec.style.setProperty("--xpw", wide + "px");
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
    try {
      const bg = bgOf(sec), h = sec.scrollHeight, w = sec.scrollWidth;
      const pr = Math.max(1, Math.min(2, 14000 / Math.max(w, h)));
      if (onLayout) onLayout(pr);
      const cv = await window.htmlToImage.toCanvas(sec, { backgroundColor: bg, pixelRatio: pr, skipFonts: true, cacheBust: false, width: w, height: h,
        filter: n => !SKIP(n) && !(all === false && n.matches && n.matches("[data-more], [data-all]")) });
      cv._pr = pr; return cv;
    } finally { sec.classList.remove("xp-shot"); sec.style.removeProperty("--xpw"); }
  }
  // kop PDF: logo Danantara | judul biru "<judul> - Posisi <tanggal>" | logo BRI, garis biru di bawahnya;
  // kaki halaman: nama aplikasi, waktu cetak, pengguna, nomor halaman
  const LOGO = { dan: "assets/logo-danantara-hitam.png", bri: "assets/logo-bri-biru.png" }, logos = {};
  const logo = k => logos[k] || (logos[k] = new Promise(res => { const im = new Image();
    im.onload = () => { const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0); res({ src: c.toDataURL("image/png"), r: im.naturalWidth / im.naturalHeight }); };
    im.onerror = () => { delete logos[k]; res(null); }; im.src = LOGO[k]; }));
  const BLUE = [37, 99, 214];
  async function pdfNew(orientation, title) {
    await lib("pdf"); const { jsPDF } = window.jspdf, [dan, bri] = await Promise.all([logo("dan"), logo("bri")]);
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" }), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), m = 28;
    const pos = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), full = /\bs\.d\.|posisi/i.test(title) ? title : title + " - Posisi " + pos;
    const head = () => {
      const cy = 30; let x = m, xr = W - m;
      if (dan) { const h = 22, w = h * dan.r; doc.addImage(dan.src, "PNG", x, cy - h / 2, w, h); x += w + 12; doc.setDrawColor(205); doc.setLineWidth(.8); doc.line(x, cy - 12, x, cy + 12); x += 12; }
      if (bri) { const h = 22, w = h * bri.r; doc.addImage(bri.src, "PNG", xr - w, cy - h / 2, w, h); xr -= w + 14; }
      doc.setFont("helvetica", "bold"); doc.setTextColor(...BLUE);
      let fs = 17; doc.setFontSize(fs); while (fs > 9 && doc.getTextWidth(full) > xr - x) doc.setFontSize(--fs);
      doc.text(doc.splitTextToSize(full, xr - x)[0], x, cy + fs * .35);
      doc.setDrawColor(...BLUE); doc.setLineWidth(2); doc.line(0, 56, W, 56); doc.setFont("helvetica", "normal");
    };
    const finish = () => {
      const n = doc.getNumberOfPages(), user = (($("#uName") || {}).textContent || "").trim(), when = new Date().toLocaleString("id-ID");
      for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120);
        doc.text(APP_CONFIG.APP_NAME + " · dicetak " + when + (user && user !== "-" ? " oleh " + user : ""), m, H - 14);
        doc.text("hal. " + i + " / " + n, W - m, H - 14, { align: "right" }); }
      return doc.output("blob");
    };
    head();
    return { doc, W, H, m, top: 70, bot: H - 30, head, finish };
  }
  // tata letak untuk pembagian halaman (dalam piksel kanvas, relatif ke atas elemen akar):
  // keep = unit yang harus utuh dalam satu halaman (tabel, grafik, deret kotak, judul + isi berikutnya), dengan rentang kepala tabel (h0–h1);
  // cuts = titik potong yang diperbolehkan (bawah baris tabel, panel, unit)
  const KEEP = ".table-wrap, .chart, .grid.tiles, .rd-box, .rmc, .funnel, .kpis, .lb-row, .ds, .banner";
  function layoutOf(root, pr) {
    const t = root.getBoundingClientRect().top, Y = v => Math.round((v - t) * pr), keep = [], cuts = new Set();
    const vis = e => e.getClientRects().length && !SKIP(e);
    root.querySelectorAll(KEEP).forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(), th = e.querySelector("thead"), hr = th && th.getBoundingClientRect();
      // pre = awal panel tempat tabel berada (judul, saringan) agar tidak tertinggal sendirian di halaman sebelumnya
      const sec = e.closest("section.panel"), pre = sec && root.contains(sec) ? Y(sec.getBoundingClientRect().top) : null;
      keep.push({ a: Y(r.top), b: Y(r.bottom), h0: hr ? Y(hr.top) : null, h1: hr ? Y(hr.bottom) : null, pre: pre != null && pre < Y(r.top) ? pre : null }); });
    // judul (panel-h / h3) tidak boleh tertinggal sendirian di bawah halaman: satukan dengan unit sesudahnya
    root.querySelectorAll(".panel-h, h3, .note").forEach(e => { const n = e.nextElementSibling; if (!vis(e) || !n || !vis(n)) return;
      keep.push({ a: Y(e.getBoundingClientRect().top), b: Y(n.getBoundingClientRect().bottom), glue: 1 }); });
    root.querySelectorAll("tr, section, .panel-h, .grid > *, .rd-grid > *, " + KEEP).forEach(e => { if (vis(e)) { const r = e.getBoundingClientRect(); cuts.add(Y(r.bottom)); cuts.add(Y(r.top)); } });
    return { keep, cuts: [...cuts].sort((a, b) => a - b) };
  }
  // susun satu kanvas ke halaman PDF tanpa memotong unit: unit yang tidak muat di sisa halaman pindah ke halaman baru;
  // unit sedikit lebih tinggi dari satu halaman diperkecil agar muat; hanya tabel yang jauh lebih panjang dari satu halaman
  // dipotong di batas baris, dengan kepala tabel diulang di halaman lanjutan
  const FIT = .7;
  function place(P, cv, L, k) {
    const { doc, m, top, bot } = P, gap = 10;
    const draw = (sy, h, kk) => { const c = document.createElement("canvas"); c.width = cv.width; c.height = Math.max(1, Math.round(h));
      c.getContext("2d").drawImage(cv, 0, sy, cv.width, h, 0, 0, cv.width, h);
      doc.addImage(c.toDataURL("image/jpeg", .92), "JPEG", m, P.y, cv.width * kk, h * kk); P.y += h * kk; };
    const pageH = (bot - top) / k, keep = L.keep.filter(r => r.b - r.a <= pageH / FIT);
    // tabel yang jauh lebih panjang dari satu halaman: boleh dipotong di batas baris, tetapi kepala tabel + 3 baris pertama tidak dipisah
    const bigT = L.keep.filter(r => r.h1 != null && r.b - r.a > pageH / FIT);
    const inside = c => keep.some(r => r.a + 2 < c && c < r.b - 2) || bigT.some(r => (r.pre != null && r.a - r.pre < pageH * .3 ? r.pre : r.a) + 2 < c && c < r.h1 + 3 * (r.h1 - r.h0));
    const cont = c => bigT.find(r => c > r.h1 && c < r.b - 2) || null;
    let sy = 0, hdr = null;
    while (sy < cv.height - 2) {
      let avail = (bot - P.y) / k;
      // kepala tabel diulang di halaman lanjutan
      if (hdr && sy > hdr.h1 && sy < hdr.b && P.y === top) { draw(hdr.h0, hdr.h1 - hdr.h0, k); avail = (bot - P.y) / k; }
      const rest = cv.height - sy;
      if (rest * .85 <= avail) { draw(sy, rest, Math.min(k, avail * k / rest)); P.y += gap; return; }
      const safe = L.cuts.filter(c => c > sy + 4 && c <= sy + avail && !inside(c)).pop();
      if (safe) { draw(sy, safe - sy, k); sy = safe; hdr = cont(sy); P.next(); continue; }
      if (P.y > top) { P.next(); continue; }
      // di awal halaman dan tidak ada titik potong aman: unit pertama lebih tinggi dari satu halaman
      const u = keep.filter(r => r.a <= sy + 4 && r.b > sy + avail).sort((x, y) => y.b - x.b)[0];
      if (u) { const h = u.b - sy, kk = Math.min(k, (bot - P.y) / h); draw(sy, h, kk); sy = u.b; P.next(); continue; }
      // tidak ada batas baris yang pas (baris sangat tinggi): potong pada batas halaman
      const c = L.cuts.filter(x => x > sy + avail * .3 && x <= sy + avail).pop() || Math.floor(sy + avail);
      draw(sy, c - sy, k); sy = c; hdr = cont(sy); P.next();
    }
  }
  async function run(sec, kind) {
    const title = titleOf(sec), name = fname(ctxOf() + "-" + title) + "-" + iso(new Date());
    if (kind === "csv" || kind === "xlsx") {
      const leg = sec.querySelector(".xp-legacy");
      if (leg) { XMODE = kind; try { leg.click(); } finally { XMODE = null; } return; }
      const aoa = aoaOf(sec); if (!aoa.length) { toast("Tidak ada tabel atau grafik di bagian ini."); return; }
      if (kind === "xlsx") saveXlsx(name, [[ctxOf() + " · " + title], [], ...aoa]); else saveCsv(name, aoa);
      return;
    }
    toast("Menyiapkan " + (kind === "pdf" ? "PDF" : "gambar") + "…");
    try {
      // unduh satu bagian: judul bagian sudah ada di kop, jadi tidak digambar ulang
      let L = null; sec.classList.add("xp-one");
      const cv = await snap(sec, true, pr => { L = layoutOf(sec, pr); }).finally(() => sec.classList.remove("xp-one"));
      if (kind === "png") { const b = await new Promise(r => cv.toBlob(r, "image/png")); saveFile(name + ".png", b); return; }
      const P = await pdfNew(cv.width > cv.height * 1.1 ? "landscape" : "portrait", ctxOf() + " · " + title);
      P.y = P.top; P.next = () => { P.doc.addPage(); P.head(); P.y = P.top; };
      place(P, cv, L, (P.W - P.m * 2) / cv.width);
      saveFile(name + ".pdf", P.finish());
    } catch (er) { toast(er.message || "Gagal membuat file."); }
  }
  // cetak satu menu utuh ke PDF (A4 mendatar): tiap blok di layar digambar terpisah lalu disusun per halaman tanpa memotong
  // tabel/grafik (lihat place). Tabel dicetak sebanyak baris yang sedang tampil.
  async function page() {
    const v = $("#view"), title = ctxOf();
    const vis = e => !SKIP(e) && e.getClientRects().length && e.offsetHeight > 0;
    const top0 = [...v.children].filter(vis); if (!top0.length) { toast("Tidak ada isi untuk dicetak."); return; }
    toast("Menyiapkan PDF " + title + "…");
    try {
      const P = await pdfNew("landscape", title), iw = P.W - P.m * 2;
      P.y = P.top; P.next = () => { P.doc.addPage(); P.head(); P.y = P.top; };
      const bw = Math.max(...top0.map(e => e.offsetWidth)), pagePx = (P.bot - P.top) * bw / iw;
      // blok pembungkus (grid) yang terlalu tinggi dipecah menjadi isinya agar potongan halaman jatuh di antara panel
      const blocks = [], walk = el => [...el.children].filter(vis).forEach(c => {
        const kids = [...c.children].filter(vis);
        if (c.offsetHeight > pagePx && kids.length > 1 && !c.matches("section, table, canvas, .panel")) walk(c); else blocks.push(c);
      });
      walk(v);
      for (const b of blocks) {
        let L = null;
        const cv = await snap(b, false, pr => { L = layoutOf(b, pr); L.keep.push({ a: 0, b: Math.round(b.scrollHeight * pr) }); });
        const pr = cv._pr || 1;
        place(P, cv, L, Math.min(iw / bw, iw * pr / cv.width) / pr);
      }
      saveFile(fname(title) + "-" + iso(new Date()) + ".pdf", P.finish());
    } catch (er) { toast(er.message || "Gagal membuat PDF."); }
  }
  let pop = null;
  const close = () => { if (pop) { pop.remove(); pop = null; } };
  function open(btn, sec) {
    close(); y0 = scrollY; pop = document.createElement("div"); pop.className = "xp-pop"; pop.setAttribute("role", "menu");
    pop.innerHTML = [["xlsx", "Excel (.xlsx)", "data tabel"], ["csv", "CSV", "data tabel"], ["pdf", "PDF", "tampilan tabel / grafik"], ["png", "Gambar (PNG)", "tampilan tabel / grafik"]]
      .map(([k, l, s]) => `<button type="button" role="menuitem" data-xk="${k}"><b>${l}</b><small>${s}</small></button>`).join("");
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect(), pw = 210; pop.style.top = Math.min(innerHeight - 200, r.bottom + 6) + "px"; pop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.right - pw)) + "px";
    pop.querySelectorAll("[data-xk]").forEach(b => b.onclick = e => { e.stopPropagation(); const k = b.dataset.xk; close(); run(sec, k); });
  }
  document.addEventListener("click", e => { if (pop && !e.target.closest(".xp-pop, .xp")) close(); }, true);
  let y0 = 0; addEventListener("scroll", () => { if (pop && Math.abs(scrollY - y0) > 80) close(); }, { passive: true }); addEventListener("resize", close);
  function decorate(root) {
    if (!root) return;
    [...root.querySelectorAll("section.panel, .l-qvp")].forEach(sec => {
      const h = sec.querySelector(":scope > .panel-h, :scope > .l-qvh"); if (!h) return;
      h.querySelectorAll(":scope button.btn, :scope .toolbar > button.btn").forEach(b => { if (/^Ekspor CSV$/i.test(b.textContent.trim())) b.classList.add("xp-legacy"); });
      const has = sec.querySelector("table, canvas");
      let b = h.querySelector(":scope > .xp, :scope .toolbar > .xp");
      if (!has) { if (b) b.remove(); return; }
      if (b) return;
      b = document.createElement("button"); b.type = "button"; b.className = "btn xp"; b.title = "Unduh tabel / grafik"; b.innerHTML = ICO + "<span>Unduh</span>";
      b.onclick = e => { e.stopPropagation(); open(b, sec); };
      const tb = h.querySelector(":scope > .toolbar"); (tb || h).appendChild(b);
    });
  }
  return { decorate, run, page };
})();
window.Exp = Exp;
/* ================= router & shell ================= */
const VIEWS = {
  beranda: ["Beranda", "Dashboard Konsumer", viewBeranda],
  keragaan: ["Keragaan Konsumer", "Menu 1", viewKeragaan],
  produktivitas: ["Produktivitas RM", "Menu 2", viewRM],
  nominatif: ["Nominatif Portofolio", "Menu 3", viewNom],
  kualitas: ["Kualitas Kredit", "Menu 4", viewKual],
  pipeline: ["Pipeline Brispot RM", "Menu 5", viewPipeline],
  simulasi: ["Simulasi Suku Bunga", "Menu 6", viewSimAll],
  admin: ["Admin", "Admin", viewAdmin]
};
const curView = () => { const h = location.hash.slice(1); return VIEWS[h] && Auth.can(h) ? h : "beranda"; };
function render() {
  if (!Auth.session) return;
  const k = curView(), [title, eb, fn] = VIEWS[k], home = k === "beranda";
  $("#landing").hidden = !home; $("#app").hidden = home; document.body.classList.toggle("at-home", home); document.body.classList.toggle("qv-open", !!LQV.key);
  const v = home ? $("#landing") : $("#view");
  document.querySelectorAll(".nav a").forEach(a => a.dataset.v === k ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  $("#pageTitle").textContent = title; $("#eyebrow").textContent = eb; $("#btnPdf").hidden = home || k === "admin"; updateSyncPart(k);
  { const tt = document.querySelector(".topbar .ttl"); if (tt && tt.dataset.v !== title) { tt.dataset.v = title; tt.classList.remove("tb-in"); void tt.offsetWidth; tt.classList.add("tb-in"); } }
  Object.keys(charts).forEach(id => { charts[id].destroy(); delete charts[id]; });
  try { fn(v); } catch (er) { console.error(er); v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Bagian ini belum bisa ditampilkan</p>${esc(er.message || er)}</div></section>`; }
  setupSections(v, k); Exp.decorate(v);
}
// tombol Unduh tetap ada saat isi section digambar ulang (sub-tab, filter di dalam section)
{ let t = 0; const deco = () => { clearTimeout(t); t = setTimeout(() => { Exp.decorate($("#view")); Exp.decorate($("#landing")); }, 60); };
  new MutationObserver(deco).observe(document.body, { childList: true, subtree: true }); }
// impor (dipakai parser file upload)
const normKey = k => String(k).trim().toLowerCase().replace(/[\s\-\/]+/g, "_").replace(/[^a-z0-9_]/g, "");
function normDate(v) {
  if (v instanceof Date) return iso(v);
  if (typeof v === "number") { const d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().slice(0, 10); }
  const s = String(v).trim(), m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : s.slice(0, 10);
}
document.querySelectorAll("dialog").forEach(d => {
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
});
$("#btnData").onclick = () => { if (curView() === "admin") { AD.tab = "data"; renderAdminTab(); } else openData(); };
$("#btnSync").onclick = e => doSync(isAdmin(), e.currentTarget);
$("#btnSyncPart").onclick = e => doSyncPart(e.currentTarget);
$("#btnPdf").onclick = () => Exp.page();
$("#btnTheme").onclick = () => {
  const root = document.documentElement, dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark"; lsSet(STORE + "-theme", root.dataset.theme);
};
const th = lsGet(STORE + "-theme"); if (th) document.documentElement.dataset.theme = th;
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
// banner atas memotong isinya (overflow hidden), jadi menu profil memakai posisi fixed yang dihitung dari tombolnya
const placeUserMenu = () => { const m = $("#userMenu"), r = $("#btnUser").getBoundingClientRect(); if (m.parentElement !== document.body) document.body.appendChild(m); m.style.top = Math.round(r.bottom + 6) + "px"; m.style.right = Math.max(8, Math.round(innerWidth - r.right)) + "px"; };
$("#btnUser").onclick = () => { const m = $("#userMenu"); m.hidden = !m.hidden; if (!m.hidden) placeUserMenu(); $("#btnUser").setAttribute("aria-expanded", String(!m.hidden)); };
addEventListener("resize", () => { if (!$("#userMenu").hidden) placeUserMenu(); });
document.addEventListener("click", e => { if (!e.target.closest(".umenu, #userMenu")) $("#userMenu").hidden = true; });
$("#umOut").onclick = () => Auth.logout("manual");
$("#umPw").onclick = openPw;
function syncLabel() { const M = DB.meta; const s = $("#syncSt"); if (s) s.textContent = M && M.updated ? "update " + new Date(M.updated).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; }
// perpindahan layar yang halus: View Transitions bila didukung browser, selain itu animasi masuk CSS
let lastView = null;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function navTo() {
  if (!Auth.session) return;
  const k = curView(), changed = k !== lastView, prev = lastView; lastView = k;
  if (changed && prev !== null) uiSound(k === "beranda" ? "home" : "nav");
  if (!changed || prev === null || reduceMotion) { render(); if (changed) window.scrollTo(0, 0); return; }
  // beranda → menu: zoom in; menu → beranda: zoom out; antar menu: naik (menu di bawahnya) atau turun (menu di atasnya)
  const order = Object.keys(VIEWS), kind = prev === "beranda" ? "zin" : k === "beranda" ? "zout" : order.indexOf(k) > order.indexOf(prev) ? "up" : "down";
  if (document.startViewTransition) {
    document.documentElement.dataset.vt = kind;
    const vt = document.startViewTransition(() => { render(); window.scrollTo(0, 0); });
    // perpindahan yang dilewati (pindah menu cepat-cepat) menolak janji transisinya: tangkap supaya tidak muncul sebagai galat
    vt.ready.catch(() => {}); vt.updateCallbackDone.catch(() => {}); vt.finished.catch(() => {}).finally(() => { delete document.documentElement.dataset.vt; });
  } else {
    render(); window.scrollTo(0, 0);
    const el = k === "beranda" ? $("#landing") : $("#view"), cls = ["v-zin", "v-zout", "v-up", "v-down"]; el.classList.remove(...cls); void el.offsetWidth;
    el.classList.add("v-" + kind); setTimeout(() => el.classList.remove(...cls), 700);
  }
}
window.addEventListener("hashchange", navTo);

/* ---------- suara antarmuka: file SFX (sfx/*.mp3) sesuai Panduan Coding Sound ---------- */
// satu arah gerak = satu arah nada: masuk dashboard naik (enter), kembali ke beranda turun (back)
const uiSound = kind => SFX.play({ nav: "enter", home: "back", move: "hover", on: "on", close: "close" }[kind] || "click", kind === "move" ? { minGap: 70 } : {});
function sndLabel() {
  const on = SFX.enabled, b = $("#btnSnd"); if (b) { b.setAttribute("aria-pressed", String(on)); b.style.opacity = on ? 1 : .55; b.title = on ? "Suara klik: aktif" : "Suara klik: mati"; }
  const l = $("#lSnd"); if (l) l.textContent = on ? "Suara klik: aktif" : "Suara klik: mati";
}
const toggleSnd = () => { SFX.enabled = !SFX.enabled; sndLabel(); if (SFX.enabled) { SFX.load(); uiSound("on"); } };
$("#btnSnd").onclick = toggleSnd;
document.addEventListener("click", e => { if (e.target.closest("#lSnd")) toggleSnd(); }, true);
document.addEventListener("click", e => {
  const t = e.target.closest("a, button, [data-rm], [data-area], [data-kc], tr[data-i], summary, th.sortable, label.check"); if (!t) return;
  if (t.matches("#btnSnd, #lSnd, #inSkip, #inGate")) return;
  // pindah layar: suaranya dibunyikan oleh navTo (naik = masuk dashboard, turun = kembali ke beranda)
  if (t.matches('a[href^="#"]') && t.getAttribute("href").slice(1) !== location.hash.slice(1) && !(t.getAttribute("href") === "#beranda" && curView() === "beranda")) return;
  if (t.matches(".l-card, .nav a, .ttl a")) uiSound("nav");
  else if (t.matches("[data-close]")) uiSound("close");
  else uiSound("tick");
}, true);
document.addEventListener("change", e => { if (e.target.matches("select, input[type=checkbox], input[type=month]")) uiSound("tick"); }, true);
// sorot kartu & menu (hanya perangkat dengan mouse), dibatasi agar tidak beruntun
if (matchMedia("(hover: hover) and (pointer: fine)").matches) document.addEventListener("pointerover", e => {
  const t = e.target.closest(".l-card, .nav a, .rm-mode button, .seg button, .ptabs button"); if (!t || t.contains(e.relatedTarget)) return;
  uiSound("move");
});
sndLabel();
// zoom tabel di HP (40%–170%) atau "pas layar": tiap tabel diperkecil sampai semua kolom muat; disimpan per perangkat
const UZ = { v: +lsGet(STORE + "-zoom") || 1, fit: lsGet(STORE + "-zfit") === true }, narrowQ = matchMedia("(max-width: 959px)");
function fitTables() {
  document.querySelectorAll(".table-wrap > table").forEach(t => {
    if (!UZ.fit || !narrowQ.matches) { if (t.style.zoom) t.style.zoom = ""; return; }
    const wr = t.parentElement, cs = getComputedStyle(wr), w = wr.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    t.style.zoom = 1; let z = Math.min(1, (w - 1) / t.offsetWidth);
    for (let k = 0; k < 3 && z < 1; k++) { t.style.zoom = z.toFixed(3); const over = wr.scrollWidth - wr.clientWidth; if (over <= 0) break; z *= (wr.scrollWidth - over) / wr.scrollWidth; }
    t.style.zoom = Math.max(.25, z).toFixed(3);
  });
}
let fitT = 0; const fitSoon = () => { if (!UZ.fit) return; clearTimeout(fitT); fitT = setTimeout(fitTables, 30); };
new MutationObserver(fitSoon).observe(document.body, { childList: true, subtree: true });
addEventListener("resize", fitSoon); narrowQ.addEventListener("change", () => { fitTables(); });
function applyZoom() { UZ.v = Math.round(clamp(UZ.v, .4, 1.7) * 10) / 10; document.documentElement.style.setProperty("--uz", UZ.v); const z = $("#zoomCtl");
  z.querySelector(".zv").textContent = UZ.fit ? "Pas" : Math.round(UZ.v * 100) + "%"; z.classList.toggle("on", UZ.fit || UZ.v !== 1); z.classList.toggle("fit", UZ.fit);
  lsSet(STORE + "-zoom", UZ.v); lsSet(STORE + "-zfit", UZ.fit); fitTables(); }
$("#zoomCtl").addEventListener("click", e => { const b = e.target.closest("[data-z]"); if (!b) return; const d = b.dataset.z;
  if (d === "fit") UZ.fit = !UZ.fit; else { UZ.fit = false; UZ.v = +d ? UZ.v + +d * .1 : 1; } applyZoom(); });
applyZoom();

/* ================= login & pemuatan data dari Apps Script ================= */
function applyPart(p, o) {
  if (p === "meta") DB.meta = o || {};
  else if (p === "ker") { DB.ker = o && o.dates ? o : null; prepKer(); }
  else if (p.startsWith("rmk_")) DB.rmkSets[p.slice(-1)] = o && o.months ? o : null;
  else if (p.startsWith("pipe_")) DB.pipeSets[p.slice(-1)] = o && o.items ? o : null;
  else if (p.startsWith("lw_")) DB.lwSets[p.slice(-1)] = o && o.n ? o : null;
  else if (p === "gerak") DB.gerak = o || {};
  else if (p === "foto") DB.foto = o && o.rm ? o : { rm: {}, kc: {} };
  else if (p === "rate") DB.rate = o && o.rows ? o : null;
  else if (p === "brs_B") DB.brs = o && o.rm ? o : null;
}
// soft = true: satu bagian data yang gagal / lambat tidak menggagalkan bagian lain; yang gagal dikembalikan sebagai [[nama, pesan], ...]
async function loadParts(parts, onEach, soft) {
  const bad = [];
  await Promise.all(parts.map(async p => {
    try { const j = await Auth.call("data", { part: p }); applyPart(p, await Auth.Crypt.gunzip(j.gz)); }
    catch (er) { if (!soft || er.code === "auth") throw er; bad.push([p, er.message]); }
    if (onEach) onEach(p);
  }));
  if (parts.some(p => p.startsWith("rmk_"))) useRM(SEG.rm);
  if (parts.some(p => p.startsWith("pipe_"))) usePipe(SEG.pipe);
  if (parts.some(p => p.startsWith("lw_"))) { prepKer(); useLW(SEG.lw); }
  syncLabel(); return bad;
}
const bootMsg = (t, q) => { const b = $("#boot"); b.hidden = !t; if (t) { $("#bootMsg").textContent = t; $("#bootBar").style.width = Math.round((q || 0) * 100) + "%"; } };
let LOAD_SEQ = 0;
async function loadAll(silent) {
  const seq = ++LOAD_SEQ, core = ["ker", "rmk_R", "rmk_M", "rmk_K", "gerak", "foto", "rate", "pipe_B", "pipe_K"];
  LOADING.core = LOADING.lw = true; KER_LOADING = RM_LOADING = PIPE_LOADING = RATE_LOADING = true;
  let n = 0; const tot = core.length + 1;
  if (!silent) bootMsg("Menyiapkan data…", .05);
  const pend = new Set(core), t0 = Date.now(); let bad = [];
  // bila ada bagian yang lama menjawab, sebutkan namanya di bilah muat supaya terlihat apa yang ditunggu
  const tick = setInterval(() => { if (!silent && pend.size && Date.now() - t0 > 20000) bootMsg("Memuat data… " + Math.round(n / tot * 100) + "% · menunggu " + [...pend].join(", "), n / tot); }, 2000);
  try {
    await loadParts(["meta"]); n++;   // meta dulu: bila cache server belum ada, dibangun sekali di sini
    if (!silent) bootMsg("Memuat data…", n / tot);
    bad = await loadParts(core, p => { n++; pend.delete(p); if (!silent) bootMsg("Memuat data… " + Math.round(n / tot * 100) + "%", n / tot); }, true);
  } catch (er) { if (seq === LOAD_SEQ) toast(er.message); }
  clearInterval(tick);
  if (bad.length && seq === LOAD_SEQ) toast("Sebagian data tidak termuat: " + bad.map(b => b[0]).join(", ") + " (" + bad[0][1] + ")");
  if (seq !== LOAD_SEQ) return;
  LOADING.core = false; KER_LOADING = RM_LOADING = PIPE_LOADING = RATE_LOADING = false; bootMsg("");
  KS.date = KS.date || null; render();
  // laporan Brispot Warm/Hot dimuat terpisah: tidak menahan data inti dan boleh gagal tanpa mengganggu
  loadParts(["brs_B"], null, true).then(() => { if (seq === LOAD_SEQ && curView() === "pipeline") render(); }).catch(() => {});
  if (Auth.can("detail")) { try { await loadParts(["lw_B", "lw_K"]); } catch (er) { toast("LW321: " + er.message); } }
  if (seq !== LOAD_SEQ) return;
  LOADING.lw = false;
  if (["beranda", "nominatif", "kualitas", "keragaan"].includes(curView())) render();
}
function showLogin(msg) {
  $("#app").hidden = true; $("#landing").hidden = true; $("#login").hidden = false; bootMsg("");
  document.body.classList.remove("at-home", "qv-open"); document.body.classList.add("at-login");
  const m = $("#lgMsg"); if (msg) { m.hidden = false; m.textContent = msg; } else m.hidden = true;
  setTimeout(() => { if (!$("#intro") || $("#intro").hidden) $("#lgUser").focus(); }, 60);
}
function enterApp() {
  const u = Auth.user; $("#login").hidden = true; document.body.classList.remove("at-login");
  $("#uName").textContent = u.nama || u.username; $("#uRole").textContent = Auth.ROLE_LABEL[u.role] || u.role;
  $("#uAv").textContent = String(u.nama || u.username).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  document.querySelectorAll("[data-perm]").forEach(a => a.hidden = !Auth.can(a.dataset.perm));
  document.documentElement.dataset.role = u.role;
  lastView = curView(); render(); loadAll();
}
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault(); const b = $("#lgBtn"), m = $("#lgMsg"), un = Auth.cleanInput($("#lgUser").value, 60), pw = $("#lgPass").value;
  if (!un || !pw) { m.hidden = false; m.textContent = "Isi username dan password."; return; }
  b.disabled = true; b.textContent = "Memeriksa…"; m.hidden = true;
  try { await Auth.login(un, pw); $("#lgPass").value = ""; uiSound("nav"); enterApp(); }
  catch (er) { m.hidden = false; m.textContent = er.message; }
  b.disabled = false; b.textContent = "Masuk";
});
$("#lgEye").onclick = () => { const i = $("#lgPass"); i.type = i.type === "password" ? "text" : "password"; $("#lgEye").setAttribute("aria-label", i.type === "password" ? "Tampilkan password" : "Sembunyikan password"); };
function resetData() {
  ++LOAD_SEQ; Object.assign(DB, { meta: null, ker: null, rmk: null, pipe: null, lw: null, rate: null, brs: null, rmkSets: {}, pipeSets: {}, lwSets: {}, gerak: {}, foto: { rm: {}, kc: {} } });
  LWR = []; LWK = new Map(); LWCIF = new Map(); LWPK = new Map(); LWPCIF = new Map(); KV = null;
  Object.keys(charts).forEach(id => { charts[id].destroy(); delete charts[id]; }); $("#view").innerHTML = ""; $("#landing").innerHTML = "";
  document.querySelectorAll("dialog[open]").forEach(d => d.close());
}
window.addEventListener("auth:expired", () => { resetData(); showLogin("Sesi berakhir. Silakan login lagi."); });
window.addEventListener("auth:logout", e => { resetData(); showLogin(e.detail === "idle" ? "Anda keluar otomatis karena 30 menit tidak aktif." : ""); });

/* ---------- mulai ---------- */
(async function start() {
  document.title = window.APP_CONFIG.APP_NAME || "Dashboard Konsumer";
  let s = null; try { s = await Auth.loadSession(); } catch {}
  if (s) { Auth.startIdle(); enterApp(); } else showLogin();
  window.__appReady = true;
})();
/* ---------- animasi pembuka (mengacu video referensi, durasi mengikuti audio ±7 detik) ---------- */
(function intro() {
  const el = $("#intro"); if (!el) return;
  const h = location.hash.slice(1);
  if (h && h !== "beranda") return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const au = $("#inAudio"), cv = $("#inCv"), ctx = cv.getContext("2d"), END = 7.0;
  const D1 = $("#inD1"), D2 = $("#inD2"), ICON = $("#inIcon"), EMB = $("#inEmb"), BLUE = $("#inBlue"), FULL = $("#inFull"), CAP = $("#inCap"), WIPE = $("#inWipe"), RINGS = [...el.querySelectorAll(".in-rings i")];
  const COLORS = ["#0b3f8f", "#1859b8", "#2f86ea", "#4aa3ff", "#7cc0ff", "#1f6fd1"];
  let W = 0, Hh = 0, dpr = 1, t0 = 0, running = false, done = false, trail = COLORS.map(() => []);
  const cl = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => cl((t - a) / (b - a));
  const eOut = x => 1 - Math.pow(1 - x, 3), eIn = x => x * x * x, eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eBack = x => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  function size() {
    dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; Hh = innerHeight; cv.width = W * dpr; cv.height = Hh * dpr;
    const sw = Math.min(W * .74, 460); el.style.setProperty("--W", sw + "px"); el.style.setProperty("--H", sw * 285 / 640 + "px");
  }
  function dots(t) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, Hh);
    if (t < .3 || t > 3.0) return;
    const R = Math.min(W, Hh) * .26, grow = eOut(seg(t, .3, 1.15)), shrink = 1 - eIn(seg(t, 1.95, 2.85)), r = R * grow * shrink;
    const base = t * 2.2 + Math.pow(seg(t, 1.6, 2.9), 2) * 9, sz = Math.max(5, Math.min(W, Hh) * .013) * (.4 + .6 * grow) * (.35 + .65 * shrink);
    COLORS.forEach((c, i) => {
      const a = base + i * Math.PI * 2 / COLORS.length + Math.sin(t * 3 + i) * .18 * shrink;
      const rr = r * (1 + .12 * Math.sin(t * 4 + i * 1.7));
      const x = W / 2 + Math.cos(a) * rr, y = Hh / 2 + Math.sin(a) * rr * .92;
      const tr = trail[i]; tr.push([x, y]); if (tr.length > 9) tr.shift();
      ctx.lineCap = "round";
      for (let k = 1; k < tr.length; k++) { ctx.strokeStyle = c; ctx.globalAlpha = k / tr.length * .55; ctx.lineWidth = Math.max(1, sz * .28); ctx.beginPath(); ctx.moveTo(tr[k - 1][0], tr[k - 1][1]); ctx.lineTo(tr[k][0], tr[k][1]); ctx.stroke(); }
      const p = tr[Math.max(0, tr.length - 3)], ang = Math.atan2(y - p[1], x - p[0]), sp = Math.min(2.2, 1 + Math.hypot(x - p[0], y - p[1]) / (sz * 2.5));
      ctx.globalAlpha = .22; ctx.fillStyle = "#6d7f9c"; ctx.beginPath(); ctx.ellipse(x + sz * 1.6, y + sz * 2.1, sz * sp, sz, ang, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, sz * sp, sz, ang, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  function frame(t) {
    dots(t);
    // lingkaran timbul pembuka, lalu piringan tempat logo muncul
    // lingkaran pembuka melanjutkan lingkaran logo yang diketuk (ukuran sama), lalu membesar sedikit sambil memudar
    D1.style.transform = `scale(${1.08 * eOut(seg(t, 0, .95))})`; D1.style.opacity = running ? 1 - eIO(seg(t, .6, 1.4)) : 0;
    const d2 = eBack(seg(t, 2.55, 3.05)); D2.style.transform = `scale(${d2 * .62})`; D2.style.opacity = seg(t, 2.55, 2.7) * (1 - seg(t, 3.9, 4.6));
    // ikon: muncul timbul sambil berputar, berubah biru, berputar lagi, lalu bergeser membuka logo penuh
    const ap = seg(t, 2.9, 4.0), sp2 = eIO(seg(t, 4.55, 5.25)), un = eIO(seg(t, 5.15, 5.95));
    const off = (W && el.style.getPropertyValue("--W")) ? (parseFloat(el.style.getPropertyValue("--W")) - parseFloat(el.style.getPropertyValue("--H"))) / 2 : 0;
    ICON.style.opacity = cl(ap * 3);
    ICON.style.transform = `translateX(${off * (1 - un)}px) rotateY(${-220 * (1 - eOut(ap)) + 360 * sp2}deg) scale(${.55 + .45 * eOut(ap)})`;
    BLUE.style.opacity = eIO(seg(t, 3.85, 4.5)); EMB.style.opacity = 1 - seg(t, 4.3, 4.6);
    const sw = parseFloat(el.style.getPropertyValue("--W")) || 1, ih = parseFloat(el.style.getPropertyValue("--H")) || 0;
    const X = Math.max(44.7, (off * (1 - un) + ih) / sw * 100);
    FULL.style.opacity = un > 0 ? 1 : 0; FULL.style.clipPath = `inset(0 ${(100 - X) * (1 - un)}% 0 ${X}%)`;
    CAP.style.opacity = eOut(seg(t, 5.6, 6.2)); CAP.style.transform = `translateY(${10 * (1 - eOut(seg(t, 5.6, 6.2)))}px)`;
    RINGS.forEach((g, i) => { const q = seg(t, 3.0 + i * .45, 5.6 + i * .45); g.style.opacity = Math.sin(q * Math.PI) * .9; g.style.transform = `scale(${.45 + q * 1.25})`; });
    WIPE.style.clipPath = `circle(${eIn(seg(t, 6.35, 7.0)) * 150}% at 50% 50%)`;
  }
  function tick() {
    if (done) return;
    const t = au && !au.paused && au.currentTime > 0 ? au.currentTime : (performance.now() - t0) / 1000;
    frame(t);
    if (t >= END) return finish();
    requestAnimationFrame(tick);
  }
  function start() {
    if (running) return; running = true;
    const g = $("#inGate"); if (!g.hidden) { g.classList.add("leaving"); setTimeout(() => { g.hidden = true; }, 320); } t0 = performance.now(); requestAnimationFrame(tick); }
  // turunkan volume perlahan saat dilewati (akhir audio sudah diberi fade out di filenya)
  let gain = null, actx = null;
  function fadeAudio(sec) {
    if (!au || au.paused) return;
    if (gain && actx) { const n = actx.currentTime; gain.gain.cancelScheduledValues(n); gain.gain.setValueAtTime(gain.gain.value, n); gain.gain.linearRampToValueAtTime(0.0001, n + sec); }
    else { const v0 = au.volume, t1 = performance.now(); const step = () => { const q = Math.min(1, (performance.now() - t1) / (sec * 1000)); try { au.volume = v0 * (1 - q); } catch {} if (q < 1) requestAnimationFrame(step); }; step(); }
    setTimeout(() => { try { au.pause(); } catch {} }, sec * 1000 + 80);
  }
  function finish() {
    if (done) return; done = true;
    if (au && !au.paused && au.currentTime < 6.8) fadeAudio(.9);
    el.style.transition = "opacity .6s ease"; el.style.opacity = "0";
    setTimeout(() => { el.hidden = true; if (!$("#login").hidden) $("#lgUser").focus(); }, 620);
  }
  size(); addEventListener("resize", size);
  el.hidden = false; frame(0);
  $("#inSkip").onclick = finish;
  addEventListener("keydown", e => { if (!done && (e.key === "Escape")) finish(); });
  if (reduce) { setTimeout(finish, 300); return; }
  // coba putar dengan suara; bila browser menahan suara, tampilkan "Ketuk untuk mulai" agar animasi & suara mulai bersamaan
  const tryPlay = () => au ? au.play() : Promise.reject();
  tryPlay().then(start).catch(() => {
    const g = $("#inGate"); g.hidden = false;
    const go = e => { if (running || done || (e && e.target.closest && e.target.closest("#inSkip"))) return; tryPlay().catch(() => {}).finally(start); };
    g.onclick = go; el.addEventListener("click", go);
    addEventListener("keydown", e => { if (!running && !done && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(); } });
  });
})();
})();
