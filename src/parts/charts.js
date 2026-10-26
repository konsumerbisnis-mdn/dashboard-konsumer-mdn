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
  // animasi: batang tumbuh bergantian dari dasar; garis tergambar dari kiri ke kanan (dimatikan bila perangkat memakai "kurangi gerakan")
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || LITE.on) o.animation = false;
  else if (o.animation === undefined) { const n = Math.max(1, ...ds.map(d => (d.data || []).length)); o.animation = { duration: 520, easing: "easeOutCubic", delay: c => c.type === "data" && c.mode === "default" ? c.dataIndex * Math.min(24, 320 / n) + (c.datasetIndex || 0) * 30 : 0,
    onComplete: c => { const ch = c.chart; if (ch.$lblWait) { ch.$lblWait = false; ch.draw(); } } }; }
  // tooltip: muncul / berpindah dengan transisi singkat dan halus
  o.plugins = o.plugins || {}; o.plugins.tooltip = { animation: { duration: 160, easing: "easeOutQuart" }, ...(o.plugins.tooltip || {}) };
  const motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  cfg.plugins = [...(cfg.plugins || []), ...(o.animation ? [LBL_WAIT] : []), ...(nBar && motion ? [HOVER_FOCUS] : []), DATA_LBL, ...(type === "line" && !nBar && o.animation ? [REVEAL] : [])];
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
  if (ch.$lblWait) return;   // sedang animasi tumbuh: label menyusul setelah selesai
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
// garis tergambar dari kiri ke kanan: area gambar dipotong sebesar kemajuan animasi (label angka ikut tersingkap)
const REVEAL = { id: "reveal", afterInit(ch) { ch.$t0 = performance.now(); },
  beforeDatasetsDraw(ch) { const A = ch.chartArea, p = Math.min(1, (performance.now() - (ch.$t0 || 0)) / 1000); if (!A || p >= 1) return; const e = 1 - Math.pow(1 - p, 3);
    ch.ctx.save(); ch.ctx.beginPath(); ch.ctx.rect(0, 0, A.left + (A.right - A.left) * e + 2, ch.height); ch.ctx.clip(); ch.$clip = true; },
  afterDatasetsDraw(ch) { if (!ch.$clip) return; ch.ctx.restore(); ch.$clip = false; if (ch.$raf) return; ch.$raf = requestAnimationFrame(() => { ch.$raf = 0; if (ch.canvas && ch.ctx) ch.draw(); }); } };
// sorot batang: kursor di atas satu kolom → kolom lain meredup halus (label angka tetap jelas)
const HOVER_FOCUS = { id: "hoverFocus",
  afterEvent(ch, args) { const e = args.event, A = ch.chartArea, h = ch.$hf = ch.$hf || { idx: -1, a: 0 }, horiz = ch.options.indexAxis === "y"; let idx = -1;
    if (A && e && e.type !== "mouseout" && e.x != null && e.x >= A.left && e.x <= A.right && e.y >= A.top && e.y <= A.bottom) { const n = (ch.data.labels || []).length;
      if (n > 1) idx = Math.min(n - 1, Math.floor(horiz ? (e.y - A.top) / ((A.bottom - A.top) / n) : (e.x - A.left) / ((A.right - A.left) / n))); }
    if (idx !== h.idx) { h.idx = idx; h.to = idx < 0 ? 0 : 1; HOVER_FOCUS.tick(ch); } },
  tick(ch) { const h = ch.$hf; if (!h || h.raf) return; const step = () => { h.raf = 0; if (!ch.canvas || !ch.ctx) return; h.a += (h.to - h.a) * .35; if (Math.abs(h.to - h.a) < .02) h.a = h.to; ch.draw(); if (h.a !== h.to) h.raf = requestAnimationFrame(step); }; h.raf = requestAnimationFrame(step); },
  afterDatasetsDraw(ch) { const h = ch.$hf, A = ch.chartArea; if (!h || !h.a || !A) return; const n = (ch.data.labels || []).length, horiz = ch.options.indexAxis === "y", g = ch.ctx, keep = h.idx < 0 ? (h.last == null ? -1 : h.last) : (h.last = h.idx);
    g.save(); g.fillStyle = cssv("--surface"); g.globalAlpha = .55 * h.a; const w = (horiz ? A.bottom - A.top : A.right - A.left) / n;
    for (let i = 0; i < n; i++) { if (i === keep) continue; if (horiz) g.fillRect(A.left, A.top + i * w, A.right - A.left, w); else g.fillRect(A.left + i * w, A.top, w, A.bottom - A.top); }
    g.restore(); } };
// label angka ditahan selama animasi tumbuh (berat bila digambar tiap frame); cadangan waktu bila animasi tidak pernah "selesai"
const LBL_WAIT = { id: "lblWait", afterInit(ch) { ch.$lblWait = true; setTimeout(() => { if (ch.$lblWait && ch.canvas) { ch.$lblWait = false; ch.draw(); } }, 1400); } };
