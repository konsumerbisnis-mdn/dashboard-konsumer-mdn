
(() => {
"use strict";
// salinan halaman sebelum diisi, untuk fitur Snapshot HTML
const PRISTINE = "<!doctype html>\n" + document.documentElement.outerHTML;
/* ================= konstanta & util ================= */
const STAGES = ["Prospek","Kunjungan","Pengajuan","Analisa","Putusan","Akad","Cair"];
const PRODUK = [["subsidi","KPR Subsidi (FLPP)"],["non_subsidi","KPR Non Subsidi"],["take_over","Take Over"],["top_up","Top Up"]];
const BULAN = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const SLA_HARI = 14;
const STORE = "kpr-dash-v1";
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
const pct = (v, d = 1) => (isFinite(v) ? [nf0, nf1, nf2][d].format(v * 100) : "–") + "%";
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

/* ================= data contoh ================= */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function buildSample() {
  const r = mulberry32(20261019), rnd = (a, b) => a + r() * (b - a), pick = a => a[Math.floor(r() * a.length)];
  const units = ["KC Medan Kota","KC Medan Baru","KC Medan Johor","KC Binjai","KC Lubuk Pakam","KC Tebing Tinggi"];
  const depan = ["Ahmad","Siti","Rizky","Dewi","Hendra","Nurul","Fajar","Lestari","Budi","Rina","Yusuf","Maya","Agus","Fitri","Dimas","Wulan","Irfan","Sari","Taufik","Indah","Reza","Putri"];
  const belakang = ["Siregar","Nasution","Lubis","Harahap","Sinaga","Simanjuntak","Pane","Ginting","Tarigan","Sembiring","Hasibuan","Situmorang","Batubara","Damanik","Rangkuti"];
  const periods = [];
  for (let i = 0; i < 12; i++) { const d = new Date(2025, 9 + i, 1); periods.push(d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0")); }
  const rmList = depan.map((n, i) => ({ nama: n + " " + belakang[(i * 7) % belakang.length], unit: units[i % units.length],
    target: [1000,1250,1500,2000][Math.floor(r() * 4)], skill: rnd(.45, 1.45) }));
  const rm = [];
  periods.forEach((p, mi) => rmList.forEach(x => {
    const season = 1 + .15 * Math.sin(mi / 1.8);
    const real = Math.round(x.target * x.skill * rnd(.65, 1.3) * season / 5) * 5;
    rm.push({ periode: p, rm: x.nama, unit: x.unit, target: x.target, realisasi: real, noa: Math.max(0, Math.round(real / rnd(280, 420))) });
  }));
  const keragaan = [];
  units.forEach(u => {
    let os = rnd(60000, 180000), noa = Math.round(os / rnd(220, 300)), npl = rnd(.012, .036), sml = rnd(.03, .07);
    const w = [rnd(.35,.55), rnd(.25,.4), rnd(.08,.15), rnd(.05,.1)], ws = w.reduce((a, b) => a + b);
    periods.forEach(p => {
      const rows = rm.filter(x => x.periode === p && x.unit === u);
      const real = sum(rows, "realisasi"), tgt = sum(rows, "target"), nn = sum(rows, "noa");
      os = os * (1 - rnd(.007, .011)) + real; noa = Math.round(noa * .996) + nn;
      npl = clamp(npl + rnd(-.003, .0032), .006, .05); sml = clamp(sml + rnd(-.006, .006), .015, .09);
      const n = os * npl, s = os * sml, prod = w.map(x => Math.round(real * x / ws));
      keragaan.push({ periode: p, unit: u, os: Math.round(os), realisasi: real, target: tgt, noa,
        kol1: Math.round(os - n - s), kol2: Math.round(s), kol3: Math.round(n * .3), kol4: Math.round(n * .2), kol5: Math.round(n * .5),
        subsidi: prod[0], non_subsidi: prod[1], take_over: prod[2], top_up: prod[3] });
    });
  });
  const pipeline = [], t0 = today();
  for (let i = 0; i < 78; i++) {
    const x = pick(rmList), st = Math.min(6, Math.floor(-Math.log(1 - r() * .985) * 2.1));
    const d = new Date(t0); d.setDate(d.getDate() - Math.floor(Math.pow(r(), 1.6) * 26));
    const pr = r() < .42 ? PRODUK[0] : r() < .75 ? PRODUK[1] : r() < .6 ? PRODUK[2] : PRODUK[3];
    const plafon = pr[0] === "subsidi" ? Math.round(rnd(140, 185)) : Math.round(rnd(250, 1200) / 5) * 5;
    pipeline.push({ id: "PL-" + (1001 + i), debitur: (r() < .5 ? "Bpk. " : "Ibu ") + pick(depan) + " " + pick(belakang),
      rm: x.nama, unit: x.unit, produk: pr[1], plafon, tahap: STAGES[st], tgl_masuk: iso(d) });
  }
  return { source: "contoh", keragaan, rm, pipeline };
}

/* ================= state ================= */
let EMBED = null; try { EMBED = JSON.parse(document.getElementById("kpr-data").textContent); } catch {}
const LOCAL = lsGet(STORE);
// snapshot yang tertanam dipakai bila lebih baru dari data lokal di perangkat ini
// tiap bagian data (keragaan, pipeline, RM, suku bunga) memakai versi yang paling baru: tertanam di file atau tersimpan di perangkat
let DB = Object.assign(buildSample(), LOCAL || {});
if (EMBED) ["ker", "pipe", "rmk", "rate", "foto"].forEach(k => { if (EMBED[k] && (!DB[k] || String(EMBED[k].updated || "") >= String(DB[k].updated || ""))) DB[k] = EMBED[k]; });
const saveDB = () => { if (DB.source !== "contoh" || DB.ker) lsSet(STORE, DB); };
const S = Object.assign({ periode: null, unit: "ALL" }, lsGet(STORE + "-ui") || {});
const saveUI = () => lsSet(STORE + "-ui", { periode: S.periode, unit: S.unit });
const periods = () => uniq([...DB.keragaan, ...DB.rm].map(x => x.periode)).sort();
const units = () => uniq([...DB.keragaan, ...DB.rm, ...DB.pipeline].map(x => x.unit)).filter(Boolean).sort();
const byUnit = x => S.unit === "ALL" || x.unit === S.unit;
const K = p => DB.keragaan.filter(x => x.periode === p && byUnit(x));
const R = p => DB.rm.filter(x => x.periode === p && byUnit(x));
const prevOf = p => { const ps = periods(), i = ps.indexOf(p); return i > 0 ? ps[i - 1] : null; };
const last12 = p => { const ps = periods().filter(x => x <= p); return ps.slice(-12); };
function aggK(rows) {
  const o = {}; ["os","realisasi","target","noa","kol1","kol2","kol3","kol4","kol5","subsidi","non_subsidi","take_over","top_up"].forEach(k => o[k] = sum(rows, k));
  o.npl = o.os ? (o.kol3 + o.kol4 + o.kol5) / o.os : 0; o.sml = o.os ? o.kol2 / o.os : 0; o.capai = o.target ? o.realisasi / o.target : 0;
  return o;
}

/* ================= chart helpers ================= */
const charts = {};
const cssv = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function mkChart(id, cfg) {
  const el = document.getElementById(id); if (!el) return;
  if (charts[id]) charts[id].destroy();
  if (typeof Chart === "undefined") { el.parentElement.innerHTML = '<div class="empty">Grafik butuh koneksi internet untuk memuat pustaka grafik.</div>'; return; }
  charts[id] = new Chart(el, cfg);
}
function baseOpts(extra = {}) {
  const ink2 = cssv("--ink-2"), muted = cssv("--muted"), line = cssv("--line");
  return Object.assign({
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { position: "top", align: "start", labels: { color: ink2, usePointStyle: true, pointStyle: "rectRounded", boxWidth: 10, boxHeight: 10, font: { family: cssv("--f-body"), size: 12 } } },
      tooltip: { padding: 10, cornerRadius: 8, titleFont: { family: cssv("--f-body"), weight: "700" }, bodyFont: { family: cssv("--f-num") } }
    },
    scales: {
      x: { grid: { display: false }, border: { color: line }, ticks: { color: muted, font: { size: 11 } } },
      y: { grid: { color: line }, border: { display: false }, ticks: { color: muted, font: { size: 11, family: cssv("--f-num") } }, beginAtZero: true }
    }
  }, extra);
}
const rpTick = v => { const a = Math.abs(v); return a >= 1e3 ? nf0.format(v / 1e3) + " M" : nf0.format(v) + " Jt"; };

/* ================= table helper ================= */
// section yang bisa diminimize (klik judul). Pipeline Brispot: awalnya semua section diminimize. Pilihan diingat per perangkat.
const SEC_DEFAULT_MIN = { pipeline: true };
const SEC_MIN = lsGet(STORE + "-min") || {};
const secKey = (view, sec) => view + ":" + (sec.id || (sec.querySelector(":scope > .panel-h h2") || {}).textContent || "").trim();
function secIsMin(view, sec) { const k = secKey(view, sec); return k in SEC_MIN ? SEC_MIN[k] : !!SEC_DEFAULT_MIN[view]; }
function secApply(view, sec) {
  const min = secIsMin(view, sec), h = sec.querySelector(":scope > .panel-h");
  sec.classList.toggle("min", min); if (h) { h.setAttribute("aria-expanded", String(!min)); h.setAttribute("role", "button"); h.tabIndex = 0; }
}
function setupSections(v, view) {
  const secs = [...v.querySelectorAll("section.panel")].filter(x => x.querySelector(":scope > .panel-h"));
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
  const dl = window.claude ? await window.claude.use("downloads").catch(() => null) : null;
  if (dl) { try { await dl.save({ filename: name, data: typeof data === "string" ? new Blob([data], { type }) : data }); toast("Tersimpan: " + name); } catch (e) { if (e && e.code !== "cancelled" && e.code !== "declined") toast("Unduhan tidak bisa dilakukan di sini."); } return; }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(typeof data === "string" ? new Blob([data], { type }) : data);
  a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast("Mengunduh " + name);
}
function exportCSV(name, cols, rows) {
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
  simulasi: '<svg viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h4"/></svg>'
};
const pipeItems = () => DB.pipeline.filter(byUnit).map(x => ({ ...x, umur: daysBetween(new Date(x.tgl_masuk), today()) }));
const umurChip = (u, tahap) => tahap === "Cair" ? chip("selesai", "neutral") : chip(u + " hr", u > SLA_HARI ? "crit" : u > SLA_HARI * .6 ? "warn" : "good");

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
  ["Keragaan KPR", "keragaan", [["k_sum", "Highlight KPR (ringkasan)"], ["k_all", "Semua KPI per KC"], ["k_os", "OS KPR per KC"], ["k_sml", "SML per KC"], ["k_npl", "NPL per KC"], ["k_deb", "Debitur per KC"], ["k_tss", "Time Series SML"], ["k_tsn", "Time Series NPL"]], () => DB.ker],
  ["Produktivitas RM", "produktivitas", [["r_rank", "Peringkat RM bulan berjalan"], ["r_kc", "Pencapaian per cabang"]], () => DB.rmk],
  ["Pipeline Brispot", "pipeline", [["p_kc", "Pipeline per KC"], ["p_akad", "Jadwal akad terdekat"]], () => DB.pipe],
  ["Simulasi KPR", "simulasi", [["s_rate", "Tabel suku bunga program"]], () => DB.rate]
];
function qvOptions() {
  return `<option value="">Pilih data…</option>` + QV.map(([g, , items, ok]) => `<optgroup label="${g}">${items.map(([k, l]) => `<option value="${k}" ${LQV.key === k ? "selected" : ""} ${ok() ? "" : "disabled"}>${l}${ok() ? "" : " (belum ada data)"}</option>`).join("")}</optgroup>`).join("");
}
function qvRender(el) {
  if (!el) return; const k = LQV.key; el.hidden = !k; if (!k) { el.innerHTML = ""; return; }
  const grp = QV.find(g => g[2].some(x => x[0] === k)); if (!grp || !grp[3]()) { el.innerHTML = '<div class="empty">Data belum tersedia.</div>'; return; }
  const label = grp[2].find(x => x[0] === k)[1];
  el.innerHTML = `<div class="l-qvh"><div><small>${grp[0]}</small><h3>${label}</h3><p class="note" id="lQvSub"></p></div><a class="btn" href="#${grp[1]}">Buka menu lengkap <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2"><path d="m9 6 6 6-6 6"/></svg></a></div><div id="lQvB"></div>`;
  const body = $("#lQvB"), sub = $("#lQvSub");
  if (k[0] === "k") {
    const d = DB.ker.dates[DB.ker.dates.length - 1], us = DB.ker.units.map((u, i) => ({ ...u, i }));
    sub.textContent = "Seluruh KC · posisi " + tglS(d) + (k === "k_sum" ? " · nominal Rp juta" : "");
    body.innerHTML = k === "k_tss" ? kTsTable(d, us, "sml", false) : k === "k_tsn" ? kTsTable(d, us, "npl", false) : kpiTable(d, us, { k_sum: "sum", k_all: "all", k_os: "os", k_sml: "sml", k_npl: "npl", k_deb: "deb" }[k], "nom");
  } else if (k[0] === "r") {
    const P = DB.rmk, ym = P.asof.slice(0, 7), rows = P.months.filter(x => x.ym === ym && (x.tDisb > 0 || x.os > 0)).map(x => ({ ...x, pen: x.tDisb ? x.os / x.tDisb : null }));
    sub.textContent = "Disbursement s.d. " + tglS(P.asof) + " · Rp juta";
    if (k === "r_rank") {
      const lb = rows.sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os).map((x, i) => ({ ...x, no: i + 1, kq: kuadOf(x.pen) }));
      table(body, [{ key: "no", label: "#", r: 1 }, { key: "rm", label: "RM", fmt: (x, r) => `<span class="lb-name wav">${rmAvatar(x, 30)}<span><b>${esc(x)}</b><small>${esc(r.kc)}${r.jg ? " · " + esc(r.jg) : ""}</small></span></span>` },
        { key: "tDisb", label: "Target", r: 1, fmt: x => x ? nf0.format(x) : "–" }, { key: "os", label: "Realisasi", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` },
        { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "kq", label: "Kuadran", r: 1, sortVal: r => r.kq ?? 9, fmt: q => kq(q) },
        { key: "sOs", label: "Subsidi", r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.sDeb} deb</small>` }, { key: "kOs", label: "Komersil", r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.kDeb} deb</small>` }], lb, { state: { key: "no", dir: 1 }, page: 15 });
    } else {
      const kr = uniq(rows.map(x => x.kc)).map(kc => { const a = rows.filter(x => x.kc === kc), t = sum(a.filter(x => x.tDisb > 0), "tDisb"), o = sum(a, "os");
        return { kc, rm: a.length, t, os: o, pen: t ? o / t : null, sub: sum(a, "sOs"), kom: sum(a, "kOs"), deb: sum(a, "deb") }; });
      const T = sum(kr, "t"), O = sum(kr, "os");
      table(body, [{ key: "kc", label: "Kantor cabang" }, { key: "rm", label: "RM", r: 1 }, { key: "t", label: "Target", r: 1, fmt: x => nf0.format(x) }, { key: "os", label: "Realisasi", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` },
        { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "sub", label: "Subsidi", r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: "Komersil", r: 1, fmt: x => nf1.format(x) }, { key: "deb", label: "Deb", r: 1 }], kr,
        { sortKey: "pen", foot: { kc: "Total", rm: sum(kr, "rm"), t: nf0.format(T), os: `<b>${nf1.format(O)}</b>`, pen: T ? chip(pct(O / T, 0), capaiCls(O / T)) : "–", sub: nf1.format(sum(kr, "sub")), kom: nf1.format(sum(kr, "kom")), deb: sum(kr, "deb") } });
    }
  } else if (k[0] === "p") {
    const aktif = pipeRows().filter(x => !x.batal); sub.textContent = "Posisi " + tglS(DB.pipe.asof) + " · plafon Rp juta · tanpa berkas batal";
    if (k === "p_kc") {
      const kr = uniq(aktif.map(x => x.kc)).filter(Boolean).map(kc => { const a = aktif.filter(x => x.kc === kc), sc = a.filter(x => x.tahap >= 6);
        return { kc, n: a.length, pl: sum(a, "plafon"), sub: sum(a.filter(x => x.jenis === "Subsidi"), "plafon"), kom: sum(a.filter(x => x.jenis !== "Subsidi"), "plafon"), oh: a.filter(x => x.tahap === 0).length, sc: sc.length, scPl: sum(sc, "plafon") }; });
      table(body, [{ key: "kc", label: "Kantor cabang" }, { key: "n", label: "Deb", r: 1 }, { key: "pl", label: "Plafon", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` }, { key: "sub", label: "Subsidi", r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: "Komersil", r: 1, fmt: x => nf1.format(x) },
        { key: "oh", label: "On hand", r: 1 }, { key: "sc", label: "Siap cair", r: 1, fmt: (x, r) => `${x}<br><small class="note">${nf1.format(r.scPl)}</small>` }], kr,
        { sortKey: "pl", foot: { kc: "Total", n: aktif.length, pl: `<b>${nf1.format(sum(kr, "pl"))}</b>`, sub: nf1.format(sum(kr, "sub")), kom: nf1.format(sum(kr, "kom")), oh: sum(kr, "oh"), sc: sum(kr, "sc") } });
    } else {
      const ak = aktif.filter(x => x.akad && x.akad >= DB.pipe.asof).sort((a, b) => a.akad.localeCompare(b.akad) || b.plafon - a.plafon);
      table(body, [{ key: "akad", label: "Akad", fmt: x => `<b>${tglS(x)}</b>` }, { key: "debitur", label: "Debitur", fmt: (x, r) => `${esc(x)}${r.developer ? `<br><small class="note">${esc(r.developer)}</small>` : ""}` }, { key: "kc", label: "KC / RM", fmt: (x, r) => `${esc(x)}<br><small class="note">${esc(r.rm || "")}</small>` },
        { key: "plafon", label: "Plafon", r: 1, fmt: x => nf1.format(x) }, { key: "jenis", label: "Jenis" }, { key: "tahap", label: "Tahap", fmt: t => esc(PTAHAP[t] || "") }], ak, { state: { key: "akad", dir: 1 }, page: 25 });
    }
  } else {
    const R = DB.rate; sub.textContent = R.title || "";
    table(body, [{ key: "prog", label: "Program" }, { key: "prod", label: "Skema", fmt: (x, r) => `${esc(x)}${r.kel ? `<br><small class="note">${esc(r.kel)}</small>` : ""}` }, { key: "tenor", label: "Min tenor", r: 1, fmt: x => x ? x + " th" : "–" },
      { key: "st", label: "Suku bunga per tahap", nosort: 1, fmt: st => (st || []).map((t, i) => `${pct(t.r, 2)} <small class="note">${i ? "th " + ((st[i - 1].sd || 0) + 1) + "–" + t.sd : "s.d. th " + t.sd}</small>`).join("<br>") }], R.rows, { page: 30 });
  }
}
function viewBeranda(v) {
  const rs = DB.rmk ? rmSummary() : null;
  const tgl = d => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const alerts = [], ks = kerSummary();
  if (ks) {
    const rows = ks.us.map(u => ({ u, c: kSnap(ks.r.di, [u]), r: kRka(ks.d.slice(0, 7), [u]) })).filter(x => x.c.os > 0 && x.r && x.r.os);
    const low = rows.filter(x => x.c.os / x.r.os < .95).sort((a, b) => a.c.os / a.r.os - b.c.os / b.r.os);
    if (low.length) alerts.push(["warn", low.length + " KC", `OS di bawah 95% RKA: ${low.slice(0, 4).map(x => `${esc(x.u.nama)} (${pct(x.c.os / x.r.os, 1)})`).join(", ")}${low.length > 4 ? ", dll." : ""}`]);
    const nplHi = rows.filter(x => x.c.npl > x.r.npl * 1.2 && x.c.npl > 0);
    if (nplHi.length) alerts.push(["red", nplHi.length + " KC", `NPL lebih dari 120% RKA: ${nplHi.slice(0, 4).map(x => esc(x.u.nama)).join(", ")}${nplHi.length > 4 ? ", dll." : ""}`]);
    if (ks.rka && ks.cur.sml > ks.rka.sml) alerts.push(["warn", "SML " + pct(ks.cur.psml, 2), `SML posisi ${tglS(ks.d)} di atas RKA (${pct(ks.rka.psml, 2)}).`]);
  }
  if (rs && DB.rmk.asof && +DB.rmk.asof.slice(8) >= 10) { const nol = rs.rows.filter(x => x.tDisb > 0 && !x.os);
    if (nol.length) alerts.push(["warn", nol.length + " RM", `Belum ada pencairan s.d. ${tglS(DB.rmk.asof)}: ${nol.slice(0, 4).map(x => esc(x.rm)).join(", ")}${nol.length > 4 ? ", dll." : ""}`]); }
  const pp = DB.pipe ? (() => { const all = pipeRows().filter(x => !x.batal); return { aktif: all, siap: all.filter(x => x.tahap >= 6) }; })() : null;
  if (pp) {
    const lewatAkad = pp.aktif.filter(x => x.akad && x.akad < DB.pipe.asof), lama = pp.aktif.filter(x => x.tahap >= 1 && x.tahap <= 5 && x.tatUker > 14 * 24);
    if (lewatAkad.length) alerts.push(["red", lewatAkad.length + " deb", `Jadwal akad sudah lewat tetapi belum cair (${rpJ(sum(lewatAkad, "plafon"))}).`]);
    if (lama.length) alerts.push(["warn", lama.length + " berkas", `Pipeline dengan TAT uker lebih dari 14 hari: ${lama.sort((a, b) => b.tatUker - a.tatUker).slice(0, 3).map(x => esc(x.debitur) + " (" + jamS(x.tatUker) + ")").join(", ")}${lama.length > 3 ? ", dll." : ""}`]);
  }
  const chev = '<svg class="l-chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
  let ci = 0;
  const card = (href, ico, title, desc, badge, cls = "") => `<a class="l-card" href="#${href}" style="--i:${ci++}"><span class="l-ico">${ico}</span>
    <span><h3>${title}</h3><p>${desc}</p><span class="l-badge ${cls}">${badge}</span></span>${chev}</a>`;
  const isContoh = DB.source !== "impor";
  v.innerHTML = `
    <div class="l-bg" aria-hidden="true"><i class="lb1"></i><i class="lb2"></i><span class="l-grid"></span><span class="l-vig"></span><canvas id="lPart"></canvas></div>
    <div class="l-top">
      <img class="dan" src="assets/asset_7f00ad08.png" alt="Danantara Indonesia">
      <img class="bri" src="assets/asset_dbf5b96d.png" alt="BRI KPR">
    </div>
    <div class="l-center">
      <div class="l-head">
        <h1>Dashboard KPR RO Medan</h1>
        <span class="l-rule"></span>
        <p>Silakan pilih dashboard</p>
        <span class="l-now" id="lNow"></span>
      </div>
      <nav class="l-cards" aria-label="Pilih dashboard">
        ${ks ? card("keragaan", ICON.keragaan, "Keragaan KPR", `OS ${rpM(ks.cur.os)}${ks.rka ? " · " + pct(ks.cur.os / ks.rka.os, 1) + " RKA" : ""} · NPL ${pct(ks.cur.pnpl, 2)}`, "Tersedia · posisi " + tglS(ks.d)) : card("keragaan", ICON.keragaan, "Keragaan KPR", "OS, SML, NPL & pencapaian RKA per KC", KER_LOADING ? "Memuat data…" : "Belum ada data", "warn")}
        ${rs ? card("produktivitas", ICON.produktivitas, "Produktivitas RM", `Disb ${rpJ(rs.os)} · ${rs.capai} dari ${rs.n} RM capai target`, "Tersedia · s.d. " + tglS(DB.rmk.asof)) : card("produktivitas", ICON.produktivitas, "Produktivitas RM", "Peringkat, kuadran & disbursement per RM", RM_LOADING ? "Memuat data…" : "Belum ada data", "warn")}
        ${pp ? card("pipeline", ICON.pipeline, "Pipeline Brispot RM", `Aktif ${rpJ(sum(pp.aktif, "plafon"))} · ${pp.aktif.length} deb · siap cair ${pp.siap.length}`, "Tersedia · posisi " + tglS(DB.pipe.asof)) : card("pipeline", ICON.pipeline, "Pipeline Brispot RM", "Funnel, jadwal akad, TAT & rencana realisasi RM", PIPE_LOADING ? "Memuat data…" : "Belum ada data", "warn")}
        ${card("simulasi", ICON.simulasi, "Simulasi KPR", DB.rate ? `${uniq(DB.rate.rows.map(x => x.prog)).length} program · ${DB.rate.rows.length} skema suku bunga` : "Angsuran per tahap, fixed–floating & berjenjang", DB.rate ? (DB.rate.title.replace(/^.*PROGRAM\s*/i, "Program ") || "Tersedia") : "Tersedia")}
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
        <span>${ks ? `Data keragaan posisi <b>${tglS(ks.d)}</b>${DB.ker.updated ? ", diperbarui " + tgl(new Date(DB.ker.updated)) + " pukul " + new Date(DB.ker.updated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}.` : "Data keragaan belum diimpor."}
          ${DB.pipe ? `Pipeline posisi <b>${tglS(DB.pipe.asof)}</b>.` : ""} ${DB.rmk ? `Produktivitas RM s.d. <b>${tglS(DB.rmk.asof)}</b>.` : ""}</span>
        <span style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><button type="button" id="lData">Kelola data</button><button type="button" id="lSnd"></button></span>
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
  $("#lData").onclick = openData; sndLabel(); if (document.documentElement.classList.contains("viewer")) $("#lData").hidden = true;
}

/* ================= VIEW: Keragaan (dari Master Keragaan) ================= */
// DB.ker = { dates[], units[{boc,nama,area}], m:{os,sml,npl,deb,dsml,dnpl}[date][unit] (juta), rka:{months[], os,sml,npl,deb [month][unit]} }
let KER_LOADING = /^https?:/.test(location.protocol);
const KS = Object.assign({ date: null, area: "ALL", kc: "ALL", trend: "os", kpi: "all", kmode: "nom" }, lsGet(STORE + "-ker") || {});
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
function kIdxBefore(d) { const ds = DB.ker.dates; let r = -1; for (let i = 0; i < ds.length && ds[i] < d; i++) r = i; return r; }
function kIdxOnOrBefore(d) { const ds = DB.ker.dates; let r = -1; for (let i = 0; i < ds.length && ds[i] <= d; i++) r = i; return r; }
function kUnits() { return DB.ker.units.map((u, i) => ({ ...u, i })).filter(u => (KS.area === "ALL" || u.area === KS.area) && (KS.kc === "ALL" || String(u.boc) === KS.kc)); }
function kSnap(di, us) {
  const o = { os: 0, sml: 0, npl: 0, deb: 0 }; if (di < 0) return null;
  us.forEach(u => { for (const k in o) o[k] += DB.ker.m[k][di]?.[u.i] || 0; });
  o.psml = o.os ? o.sml / o.os : 0; o.pnpl = o.os ? o.npl / o.os : 0; return o;
}
function kRka(ym, us) {
  const r = DB.ker.rka, mi = r ? r.months.indexOf(ym) : -1; if (mi < 0) return null;
  const o = { os: 0, sml: 0, npl: 0, deb: 0 }; us.forEach(u => { for (const k in o) o[k] += r[k][mi]?.[u.i] || 0; });
  o.psml = o.os ? o.sml / o.os : 0; o.pnpl = o.os ? o.npl / o.os : 0; return o;
}
// indeks posisi: hari sebelumnya, akhir bulan lalu, akhir tahun lalu, tanggal sama tahun lalu
function kRefs(d) {
  const ds = DB.ker.dates, di = ds.indexOf(d);
  return { di, dtd: di - 1, mtd: kIdxBefore(d.slice(0, 7) + "-01"), ytd: kIdxBefore(d.slice(0, 4) + "-01-01"), yoy: kIdxOnOrBefore((+d.slice(0, 4) - 1) + d.slice(4)) };
}
function kerSummary() {
  if (!DB.ker) return null;
  const d = DB.ker.dates[DB.ker.dates.length - 1], us = DB.ker.units.map((u, i) => ({ ...u, i })), r = kRefs(d);
  return { d, us, r, cur: kSnap(r.di, us), rka: kRka(d.slice(0, 7), us) };
}
const KPI_L = { all: "All", os: "OS", sml: "SML", npl: "NPL", deb: "Debitur", ts: "Time Series" };
// KC yang memiliki RM KPR: diambil dari data Produktivitas RM bulan posisi (cadangan: daftar tetap)
const RM_KC_DEF = ["KC Binjai", "KC Gunung Sitoli", "KC Kabanjahe", "KC Kisaran", "KC Lubuk Pakam", "KC Medan Iskandar Muda", "KC Medan Putri Hijau", "KC Medan Sisingamangaraja", "KC Pematang Siantar", "KC Rantau Prapat", "KC Sibolga", "KC Stabat", "KC Tebing Tinggi"];
function kRmSet(ym) {
  const ms = DB.rmk?.months || [], yms = uniq(ms.map(x => x.ym)).filter(m => m <= ym).sort(), m = yms[yms.length - 1];
  const set = new Set(m ? ms.filter(x => x.ym === m).map(x => normKey(x.kc)) : []);
  return set.size ? set : new Set(RM_KC_DEF.map(normKey));
}
// tabel KPI per KC: histori, RKA, %pencapaian, delta & YoY; kpi "all" = ringkasan semua KPI per KC
function kpiTable(d, us, kpi, kmode) {
  const ds = DB.ker.dates, R = kRefs(d), ym = d.slice(0, 7), yr = d.slice(0, 4);
  const lastOf = m => m + "-" + String(new Date(+m.slice(0, 4), +m.slice(5), 0).getDate()).padStart(2, "0");
  const inM = (i, m) => i >= 0 && ds[i].startsWith(m) ? i : -1;
  const lyM = (+yr - 1) + ym.slice(4), iLy = inM(kIdxOnOrBefore(lastOf(lyM)), lyM);
  const tS = x => x ? tglS(x).replace(/ \d\d(\d\d)$/, "'$1") : "–";
  const hist = [[blnS(lyM), iLy], ["Des'" + String(+yr - 1).slice(2), R.ytd], [R.mtd >= 0 ? blnS(ds[R.mtd].slice(0, 7)) : "–", R.mtd], [tS(ds[R.dtd]), R.dtd], [tS(d), R.di]];
  const mon = BULAN[+ym.slice(5) - 1] + " " + yr;
  const rmSet = kRmSet(ym), isRO = u => /^RO\b/i.test(u.nama);
  const capP = (akt, rka, up) => { let v; if (up) v = !rka ? 1.2 : akt / rka; else v = !akt ? 1.2 : !rka ? 0 : rka / akt; return Math.min(1.2, Math.max(0, v)); };
  const pctMode = (kpi === "sml" || kpi === "npl") && kmode === "pct";
  const metric = kpi === "all" ? null : { k: pctMode ? "p" + kpi : kpi, up: kpi === "os" || kpi === "deb", p: pctMode, n: kpi === "deb" };
  const fv = (x, m) => x == null ? "–" : m.p ? pct(x, 2) : !x ? "-" : nf0.format(x);
  const fd = (x, m) => { if (x == null || Math.abs(x) < 1e-9) return "-"; const bad = m.up ? x < 0 : x > 0, t = m.p ? nf2.format(Math.abs(x) * 100) + " pp" : nf0.format(Math.abs(x)); return `<span class="${bad ? "bad" : ""}">${x < 0 ? "(" + t + ")" : t}</span>`; };
  const fy = (x, m) => { if (x == null) return "-"; const bad = m.up ? x < 0 : x > 0, t = m.p ? nf2.format(Math.abs(x) * 100) + " pp" : nf2.format(Math.abs(x) * 100) + "%"; return `<span class="${bad ? "bad" : ""}">${x < 0 ? "(" + t + ")" : t}</span>`; };
  const pc = v => `<td class="kp ${osCls(v)}">${pct(v, 2)}</td>`;
  const calc = uu => {
    const sn = hist.map(([, i]) => kSnap(i, uu)), cur = sn[4] || { os: 0, sml: 0, npl: 0, deb: 0, psml: 0, pnpl: 0 };
    return { sn, cur, ly: sn[0], pd: sn[3], pm: sn[2], py: sn[1], rk: kRka(ym, uu), rkD: kRka(yr + "-12", uu) };
  };
  const units = us.map(u => ({ u, c: calc([u]) }));
  const sk = metric ? metric.k : "os", sup = metric ? metric.up : true, pv = c => capP(c.cur[sk], c.rk?.[sk], sup);
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
    const c = calc(us), L = [["OS KPR", "os", 1, 0, 0], ["SML KPR", "sml", 0, 0, 0], ["% SML", "psml", 0, 1, 0], ["NPL KPR", "npl", 0, 0, 0], ["% NPL", "pnpl", 0, 1, 0], ["Debitur", "deb", 1, 0, 1]];
    return `<div class="table-wrap"><table class="kt"><thead>${histHead("Indikator")}</thead><tbody>${L.map(([l, k, up, p, n]) => `<tr><td class="sk1" style="left:0"><b>${l}</b></td>${cellsM(c, { k, up: !!up, p: !!p, n: !!n })}</tr>`).join("")}</tbody></table></div>
      <p class="note" style="margin:8px 0 0">Nominal dalam Rp juta · rasio terhadap OS, delta rasio dalam pp · angka dalam kurung = minus · %Penc SML & NPL = RKA ÷ aktual (maks. 120%).</p>`;
  }
  const cells = metric ? c => cellsM(c, metric) : c => {
    const os = { up: true }, lo = { up: false }, nd = { up: true }, cu = c.cur, rk = c.rk || {};
    const gap = (a, r, m) => `<td class="r">${r == null ? "–" : fd(a - r, m)}</td>`;   // gap thd RKA = aktual − RKA
    return `<td class="r">${fv(cu.os, os)}</td>${pc(capP(cu.os, rk.os, true))}${gap(cu.os, rk.os, os)}<td class="r">${fd(c.pm ? cu.os - c.pm.os : null, os)}</td><td class="r">${fd(c.py ? cu.os - c.py.os : null, os)}</td>`
      + `<td class="r">${fv(cu.sml, lo)}</td><td class="r">${pct(cu.psml, 2)}</td>${pc(capP(cu.sml, rk.sml, false))}${gap(cu.sml, rk.sml, lo)}`
      + `<td class="r">${fv(cu.npl, lo)}</td><td class="r">${pct(cu.pnpl, 2)}</td>${pc(capP(cu.npl, rk.npl, false))}${gap(cu.npl, rk.npl, lo)}`
      + `<td class="r">${fv(cu.deb, nd)}</td>${pc(capP(cu.deb, rk.deb, true))}`;
  };
  const nCols = (metric ? 19 : 18) - (narrow ? 1 : 0);
  const head = metric
    ? `<tr><th rowspan="2" class="sk0">NO</th><th rowspan="2" class="sk1">Kantor Cabang</th>${narrow ? "" : `<th rowspan="2">Area</th>`}<th colspan="5">Histori</th><th rowspan="2">RKA<br>${mon}</th><th rowspan="2">RKA<br>Des ${yr}</th><th colspan="2">%Penc</th><th colspan="5">Delta</th><th rowspan="2">YoY<br><small>vs ${blnS(lyM)}</small></th></tr>
       <tr>${hist.map(h => `<th>${h[0]}</th>`).join("")}<th>${mon}</th><th>Des ${yr}</th><th>DtD</th><th>MtD</th><th>YtD</th><th>RKA ${BULAN[+ym.slice(5) - 1]}</th><th>RKA Des</th></tr>`
    : `<tr><th rowspan="2" class="sk0">NO</th><th rowspan="2" class="sk1">Kantor Cabang</th>${narrow ? "" : `<th rowspan="2">Area</th>`}<th colspan="5">OS KPR</th><th colspan="4">SML</th><th colspan="4">NPL</th><th colspan="2">Debitur</th></tr>
       <tr><th>Posisi</th><th>%Penc ${BULAN[+ym.slice(5) - 1]}</th><th>Gap thd RKA</th><th>MtD</th><th>YtD</th><th>Nominal</th><th>%</th><th>%Penc</th><th>Gap thd RKA</th><th>Nominal</th><th>%</th><th>%Penc</th><th>Gap thd RKA</th><th>Posisi</th><th>%Penc</th></tr>`;
  const row = x => `<tr><td class="sk0">${++no}</td><td class="sk1">${esc(x.u.nama)}</td>${narrow ? "" : `<td>${esc(areaS(x.u.area))}</td>`}${cells(x.c)}</tr>`;
  const body = g1.map(row).join("") + (g2.length ? (g1.length ? `<tr class="kgrp"><td class="sk0"></td><td class="sk1" colspan="${AC}">KC NON RM KPR</td><td colspan="${nCols - 3}"></td></tr>` : "") + g2.map(row).join("") : "")
    + subs.map(x => `<tr class="${x.cls}"><td class="sk0"></td><td class="sk1" colspan="${AC}">${esc(x.name === "TOTAL" ? "TOTAL" : String(x.name).toUpperCase())}</td>${cells(x.c)}</tr>`).join("");
  const unit = metric ? (metric.p ? "rasio terhadap OS, delta dalam pp" : metric.n ? "jumlah debitur" : "nominal dalam Rp juta") : "nominal dalam Rp juta";
  return `<div class="table-wrap"><table class="kt"><thead>${head}</thead><tbody>${body}</tbody></table></div>
    <p class="note" style="margin:8px 0 0">${unit} · urut %Penc ${metric ? KPI_L[kpi] : "OS"} ${mon} · angka dalam kurung = minus · warna %Penc: hijau ≥100%, kuning 95–100%, merah &lt;95%.</p>`;
}
// time series SML / NPL per KC: akhir tahun lalu, tanggal sama 3 bulan terakhir, posisi, RATAS 3 bulan & gap
function kTsTable(d, us, k, asPct) {
  const ds = DB.ker.dates, R = kRefs(d), ym = d.slice(0, 7), day = +d.slice(8), yr = d.slice(0, 4);
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
  const L = k === "sml" ? "SML" : "NPL";
  return `<h3 style="font-size:14px;margin:4px 0 8px">Time Series ${L} KPR${asPct ? " (rasio)" : ""}</h3>
    <div class="table-wrap" style="margin-bottom:18px"><table class="kt ts"><thead><tr><th rowspan="2" class="sk1" style="left:0">Kantor Cabang</th><th colspan="5">Time Series ${L} KPR</th><th rowspan="2" class="or">RATAS<br>3 BLN</th><th rowspan="2" class="or">GAP thd<br>RATAS</th></tr>
      <tr>${cols.map(c => `<th>${c.lbl}</th>`).join("")}</tr></thead>
      <tbody>${grp("KC RM KPR", g1)}${grp("KC NON RM KPR", g2)}${us.length > 1 ? tr("TOTAL", calc(us.filter(u => !isRO(u))), "ktot") : ""}</tbody></table></div>${k === "npl" ? `<p class="note" style="margin:-10px 0 0">${asPct ? "Rasio terhadap OS, gap dalam pp" : "Nominal dalam Rp juta"} · RATAS = rata-rata 3 bulan sebelumnya pada tanggal yang sama · TOTAL tanpa RO Medan · gap hijau dalam kurung = turun dari RATAS (membaik).</p>` : ""}`;
}
function viewKeragaan(v) {
  if (!DB.ker && KER_LOADING) { v.innerHTML = `<section class="panel"><div class="empty">Memuat data keragaan…</div></section>`; return; }
  if (!DB.ker) { v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data keragaan</p>Impor file <b>Master Keragaan</b> (sheet <code>Database</code> dan <code>Database RKA</code>) lewat tombol Data.</div><div class="toolbar" style="justify-content:center"><button class="btn primary" id="kImp" type="button">Impor Master Keragaan</button></div></section>`; $("#kImp").onclick = openData; return; }
  const K = DB.ker, ds = K.dates;
  if (!ds.includes(KS.date)) KS.date = ds[ds.length - 1];
  const areas = uniq(K.units.map(u => u.area)).filter(Boolean).sort();
  if (KS.area !== "ALL" && !areas.includes(KS.area)) KS.area = "ALL";
  const kcList = K.units.filter(u => KS.area === "ALL" || u.area === KS.area);
  if (KS.kc !== "ALL" && !kcList.some(u => String(u.boc) === KS.kc)) KS.kc = "ALL";
  const d = KS.date, ym = d.slice(0, 7), yr = d.slice(0, 4), us = kUnits(), R = kRefs(d);
  const cur = kSnap(R.di, us), pd = kSnap(R.dtd, us), pm = kSnap(R.mtd, us), py = kSnap(R.ytd, us), yy = kSnap(R.yoy, us);
  const rk = kRka(ym, us), rkD = kRka(yr + "-12", us);
  const scope = KS.kc !== "ALL" ? esc(K.units.find(u => String(u.boc) === KS.kc)?.nama) : KS.area !== "ALL" ? esc(areaS(KS.area)) : "Seluruh KC";
  const gm = pm ? cur.os - pm.os : 0, gd = pd ? cur.os - pd.os : 0, gy = py ? cur.os - py.os : 0, yoy = yy && yy.os ? cur.os / yy.os - 1 : null;
  const optsD = [...ds].reverse().map(x => `<option value="${x}" ${x === d ? "selected" : ""}>${tglS(x)}</option>`).join("");
  v.innerHTML = `
    <section class="panel" style="padding:12px 16px">
      <div class="toolbar">
        <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Posisi</span><select class="ctl" id="kD">${optsD}</select></label>
        <label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Area</span><select class="ctl" id="kA"><option value="ALL">Semua area</option>${areas.map(a => `<option value="${esc(a)}" ${a === KS.area ? "selected" : ""}>${esc(areaS(a))}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 200px"><span class="note" style="font-weight:700">Kantor Cabang</span><select class="ctl" id="kK"><option value="ALL">Semua KC</option>${kcList.map(u => `<option value="${u.boc}" ${String(u.boc) === KS.kc ? "selected" : ""}>${esc(u.nama)}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 130px"><span class="note" style="font-weight:700">KPI</span><select class="ctl" id="kP">${Object.entries(KPI_L).map(([k, l]) => `<option value="${k}" ${KS.kpi === k ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      </div>
      <p class="note" style="margin:0">${scope} · posisi ${tglS(d)} · kartu ringkasan dalam Rp miliar (M), tabel dalam Rp juta</p>
    </section>
    <div class="grid tiles">
      ${tile({ label: "OS KPR", value: rpM(cur.os), sub: rk ? `${pct(cur.os / rk.os, 2)} dari RKA ${blnS(ym)} ${rpM(rk.os)}` : "RKA bulan ini belum ada", meter: rk ? cur.os / rk.os : null })}
      ${tile({ label: "Growth MtD", value: `<span class="delta ${dCls(gm)}" style="font-size:inherit">${dM(gm)}</span>`, sub: `DtD <span class="delta ${dCls(gd)}">${dM(gd)}</span> · YtD <span class="delta ${dCls(gy)}">${dM(gy)}</span>${yoy != null ? ` · YoY <span class="delta ${dCls(yoy)}">${(yoy >= 0 ? "+" : "−") + pct(Math.abs(yoy))}</span>` : ""}` })}
      ${tile({ label: "SML KPR", value: pct(cur.psml, 2), sub: `${rpM(cur.sml)}${rk ? " · RKA " + pct(rk.psml, 2) : ""} ${chip(rk ? "Penc " + pct(rk.sml / (cur.sml || 1), 0) : "–", lowCls(cur.sml, rk?.sml))}` })}
      ${tile({ label: "NPL KPR", value: pct(cur.pnpl, 2), sub: `${rpM(cur.npl)}${rk ? " · RKA " + pct(rk.pnpl, 2) : ""} ${chip(rk ? "Penc " + pct(rk.npl / (cur.npl || 1), 0) : "–", lowCls(cur.npl, rk?.npl))}` })}
      ${tile({ label: "Debitur KPR", value: nf0.format(cur.deb), sub: `MtD <span class="delta ${dCls(pm ? cur.deb - pm.deb : 0)}">${dN(pm ? cur.deb - pm.deb : 0)}</span>${rk ? ` · ${pct(cur.deb / rk.deb, 1)} dari RKA` : ""}`, meter: rk && rk.deb ? cur.deb / rk.deb : null })}
    </div>
    <section class="panel"><div class="panel-h"><div class="k-hlh"><h2>Highlight KPR${KS.kpi !== "all" ? " · " + KPI_L[KS.kpi] : ""}</h2>${KS.kpi === "sml" || KS.kpi === "npl" || KS.kpi === "ts" ? `<div class="seg" role="tablist"><button type="button" data-km="nom" aria-selected="${KS.kmode !== "pct"}">Nominal</button><button type="button" data-km="pct" aria-selected="${KS.kmode === "pct"}">Rasio %</button></div>` : ""}</div><span class="sub">${KS.kpi === "ts" ? "SML & NPL pada tanggal yang sama tiap bulan" : "pencapaian SML & NPL = RKA ÷ aktual (maks. 120%)"}</span></div><div id="kHl"></div></section>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>OS KPR vs RKA ${yr}</h2><span class="sub">posisi akhir bulan</span></div><div class="chart"><canvas id="cKOs"></canvas></div></section>
      <section class="panel"><div class="panel-h"><h2>Tren harian</h2><select class="ctl" id="kT" style="height:30px" aria-label="Indikator tren">${[["os","OS KPR"],["psml","% SML"],["pnpl","% NPL"],["deb","Debitur"]].map(([k, l]) => `<option value="${k}" ${KS.trend === k ? "selected" : ""}>${l}</option>`).join("")}</select></div><div class="chart"><canvas id="cKTr"></canvas></div></section>
    </div>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>SML tanggal ${+d.slice(8)} tiap bulan</h2><span class="sub">dibanding RATAS 3 bulan</span></div><div class="chart"><canvas id="cKSd"></canvas></div></section>
      <section class="panel"><div class="panel-h"><h2>NPL tanggal ${+d.slice(8)} tiap bulan</h2><span class="sub">dibanding RATAS 3 bulan</span></div><div class="chart"><canvas id="cKNd"></canvas></div></section>
    </div>
    <section class="panel"><div class="panel-h"><h2>SML & NPL vs RKA ${yr}</h2><span class="sub">% terhadap OS, akhir bulan${+d.slice(8) < new Date(+yr, +d.slice(5, 7), 0).getDate() ? " · bulan berjalan = posisi " + tglS(d) : ""}</span></div><div class="chart"><canvas id="cKQ"></canvas></div></section>
    ${KS.kc === "ALL" && KS.area === "ALL" ? `<section class="panel"><div class="panel-h"><h2>Per area</h2><span class="sub">klik nama area untuk menyaring</span></div><div id="kAr"></div></section>` : ""}
    <section class="panel"><div class="panel-h"><h2>Per kantor cabang</h2><div class="toolbar"><span class="sub">klik nama KC untuk detail</span><button class="btn" id="kExp" type="button">Ekspor CSV</button></div></div><div id="kKc"></div></section>`;

  $("#kD").onchange = e => { KS.date = e.target.value; saveKS(); render(); };
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
  mkChart("cKTr", { type: "line", data: { labels: idx.map(i => tglS(ds[i]).replace(/ \d{4}$/, "")), datasets: [{ label: { os: "OS KPR", psml: "% SML", pnpl: "% NPL", deb: "Debitur" }[tk], data: tSnaps.map(s => s[tk]), borderColor: s1, backgroundColor: s1 + "22", fill: true, tension: .25, borderWidth: 2, pointRadius: idx.map((_, i) => i === idx.length - 1 ? 4 : 0), pointBackgroundColor: s1 }] },
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
  const kr = us.filter(u => kSnap(R.di, [u]).os > 0).map(u => rowOf(u.nama, [u], { boc: u.boc, area: u.area }));
  const kcCols = cols({ key: "name", label: "Kantor cabang", fmt: (x, r) => `<button class="linkish" data-kc="${r.boc}">${esc(x)}</button><br><small class="note">${r.boc} · ${esc(areaS(r.area).replace(/ · .*/, ""))}</small>` });
  table($("#kKc"), kcCols, kr, { sortKey: "os", foot: kr.length > 1 ? { name: "Total", os: nf2.format(cur.os / 1000), dtd: dM(gd).replace(" M", ""), mtd: dM(gm).replace(" M", ""), ytd: dM(gy).replace(" M", ""), prka: rk ? chip(pct(cur.os / rk.os, 1), osCls(cur.os / rk.os)) : "–", psml: pct(cur.psml, 2), pnpl: pct(cur.pnpl, 2), sml: nf2.format(cur.sml / 1000), npl: nf2.format(cur.npl / 1000), deb: nf0.format(cur.deb), dmtd: dN(pm ? cur.deb - pm.deb : 0) } : null,
    after: el => el.querySelectorAll("[data-kc]").forEach(b => b.onclick = () => { KS.kc = b.dataset.kc; saveKS(); render(); window.scrollTo(0, 0); }) });
  $("#kExp").onclick = () => exportCSV("keragaan-kpr-" + d, [["boc","BOC"],["name","Kantor Cabang"],["area","Area"],["os","OS (juta)"],["dtd","DtD"],["mtd","MtD"],["ytd","YtD"],["rka","RKA (juta)"],["prka","%RKA"],["sml","SML"],["psml","%SML"],["npl","NPL"],["pnpl","%NPL"],["deb","Debitur"],["dmtd","Deb MtD"]], kr);
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
function parseMaster(wb) {
  // file Master (kolom SML) atau file harian Gabung KAP (kolom DPK, DEB BPK)
  const db = findSheet(wb, ["uker", "tanggal", "os", "sml", "npl"]) || findSheet(wb, ["uker", "tanggal", "os", "dpk", "npl"]); if (!db) return null;
  const H = k => db.h.indexOf(k), H2 = (...ks) => ks.map(H).find(i => i >= 0) ?? -1;
  const iU = H("uker"), iT = H("tanggal"), iC = H("desc"), iDeb = H("deb"), iOs = H("os"), iS = H2("sml", "dpk"), iN = H("npl"), iDs = H2("deb_sml", "deb_dpk", "deb_bpk"), iDn = H("deb_npl");
  let iA = db.h.findIndex(x => x === "area"); if (iA < 0) iA = db.rows.slice(0, 200).reduce((f, r) => f >= 0 ? f : r.findIndex(c => /^\s*AREA\s*\d/i.test(String(c ?? ""))), -1);
  const rec = new Map(), areaOf = {};
  db.rows.forEach(r => {
    if (r[iU] == null || r[iU] === "" || r[iT] == null || r[iT] === "") return;
    if (iC >= 0 && String(r[iC] ?? "").trim().toUpperCase() !== "KPR") return;
    const d = isoX(r[iT]), u = String(r[iU]).trim(), key = d + "|" + u, p = rec.get(key) || {};
    const val = (i, k) => i < 0 || r[i] == null || r[i] === "" ? (p[k] ?? 0) : numX(r[i]);
    rec.set(key, { d, u, os: val(iOs, "os"), sml: val(iS, "sml"), npl: val(iN, "npl"), deb: val(iDeb, "deb"), dsml: val(iDs, "dsml"), dnpl: val(iDn, "dnpl") });
    if (iA >= 0 && /AREA/i.test(String(r[iA] ?? ""))) areaOf[u] = String(r[iA]).trim().replace(/\s+/g, " ");
  });
  const names = {}, rk = findSheet(wb, ["boc", "kanca", "os"]);
  if (rk) rk.rows.forEach(r => { const b = r[rk.h.indexOf("boc")]; if (b != null && b !== "") names[String(b).trim()] = String(r[rk.h.indexOf("kanca")] ?? "").trim(); });
  const dates = uniq([...rec.values()].map(x => x.d)).sort(), ucodes = uniq([...rec.values()].map(x => x.u)).sort((a, b) => (+a || 0) - (+b || 0));
  const units = ucodes.map(u => ({ boc: isNaN(+u) ? u : +u, nama: names[u] || "Uker " + u, area: areaOf[u] || (names[u] && /^RO\b/i.test(names[u]) ? "REGIONAL OFFICE" : "LAINNYA") }));
  const di = new Map(dates.map((d, i) => [d, i])), ui = new Map(ucodes.map((u, i) => [u, i]));
  const m = {}; ["os", "sml", "npl", "deb", "dsml", "dnpl"].forEach(k => m[k] = dates.map(() => ucodes.map(() => 0)));
  const r1 = x => Math.round(x * 10) / 10;
  rec.forEach(x => { const a = di.get(x.d), b = ui.get(x.u); ["os", "sml", "npl"].forEach(k => m[k][a][b] = r1(x[k])); ["deb", "dsml", "dnpl"].forEach(k => m[k][a][b] = Math.round(x[k])); });
  let rka = null;
  if (rk) {
    const ix = k => rk.h.indexOf(k), iD = ix("date") >= 0 ? ix("date") : ix("tanggal");
    const rr = rk.rows.filter(r => r[iD] != null && r[iD] !== "" && r[ix("boc")] != null);
    const osVals = rr.map(r => numX(r[ix("os")])).sort((a, b) => a - b), scale = (osVals[osVals.length >> 1] || 0) > 1e8 ? 1e6 : 1;
    const months = uniq(rr.map(r => isoX(r[iD]).slice(0, 7))).sort(), mi = new Map(months.map((x, i) => [x, i]));
    rka = { months }; ["os", "sml", "npl", "deb"].forEach(k => rka[k] = months.map(() => ucodes.map(() => 0)));
    rr.forEach(r => { const a = mi.get(isoX(r[iD]).slice(0, 7)), b = ui.get(String(r[ix("boc")]).trim()); if (b == null) return;
      ["os", "sml", "npl"].forEach(k => rka[k][a][b] = r1(numX(r[ix(k)]) / scale)); rka.deb[a][b] = Math.round(numX(r[ix("deb")])); });
  }
  return { dates, units, m, rka, source: db.name };
}

/* ================= VIEW: Produktivitas RM (dari Database history + database harian) ================= */
// DB.rmk = { months[{ym,kc,rm,jg,area,tDeb,tDisb,sDeb,sOs,kDeb,kOs,deb,os,kuad}], tx[{d,rm,kc,pl,deb,jenis}], asof }
const RS = Object.assign({ ym: null, area: "ALL", kc: "ALL", cmp: "mtd", cmpG: "kc", sel: null, selKc: null, pm: "rm", selYr: null, co: "berjalan" }, lsGet(STORE + "-rm") || {});
const saveRS = () => lsSet(STORE + "-rm", RS);
let RM_LOADING = /^https?:/.test(location.protocol);
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
  const k = nmKey(name), src = DB.foto && DB.foto.map ? DB.foto.map[k] : null;
  const ini = String(name || "?").trim().split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
  let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<span class="av ${cls}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .36)}px;--av:${AV_COL[h % AV_COL.length]}">${src ? `<img src="${src}" alt="Foto ${esc(name)}" loading="lazy">` : ini}</span>`;
}
function viewRM(v) {
  if (!DB.rmk) {
    v.innerHTML = RM_LOADING ? `<section class="panel"><div class="empty">Memuat data produktivitas…</div></section>`
      : `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data produktivitas RM</p>Upload file <b>Produktivitas RM History</b> (sheet Database) lalu <b>Database bulan berjalan</b> lewat tombol Data.</div></section>`;
    return;
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
      <div class="rm-mode" role="group" aria-label="Lihat produktivitas">
        <button type="button" data-rmm="rm" aria-pressed="${RS.pm !== "kc"}"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.9-4 4-6 8-6s7.1 2 8 6"/></svg>Per RM</button>
        <button type="button" data-rmm="kc" aria-pressed="${RS.pm === "kc"}"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/></svg>Per Cabang</button>
      </div>
      <div class="toolbar">
        <label class="field" style="flex:1 1 140px"><span class="note" style="font-weight:700">Bulan</span><select class="ctl" id="rY">${[...yms].reverse().map(m => `<option value="${m}" ${m === ym ? "selected" : ""}>${ymS(m)}${P.asof && P.asof.startsWith(m) ? " (berjalan)" : ""}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Area</span><select class="ctl" id="rA"><option value="ALL">Semua area</option>${areas.map(a => `<option value="${esc(a)}" ${a === RS.area ? "selected" : ""}>${esc(areaS(a))}</option>`).join("")}</select></label>
        <label class="field" style="flex:1 1 200px"><span class="note" style="font-weight:700">Kantor Cabang</span><select class="ctl" id="rK"><option value="ALL">Semua KC</option>${kcs.map(k => `<option ${k === RS.kc ? "selected" : ""}>${esc(k)}</option>`).join("")}</select></label>
      </div>
      <p class="note" style="margin:0">Disbursement ${per} · Rp juta · kuadran: K1 ≥105%, K2 100–105%, K3 50–100%, K4 &lt;50% dari target disbursement</p>
    </section>
    <div class="grid tiles">
      ${tile({ label: "Disbursement " + per, value: rpJ(os), sub: pOs != null ? `vs ${rpJ(pOs)} (${pLbl}) <span class="delta ${dCls(os - pOs)}">${(os - pOs >= 0 ? "+" : "−") + nf0.format(Math.abs(os - pOs))} Jt</span>` : "" })}
      ${tile({ label: "Pencapaian target", value: tDisb ? pct(os / tDisb, 1) : "–", sub: `target ${rpJ(tDisb)}`, meter: tDisb ? os / tDisb : null })}
      ${tile({ label: "Jumlah debitur", value: nf0.format(deb), sub: `${tDeb ? "target " + nf0.format(tDeb) + " · " : ""}${pDeb != null ? `vs ${nf0.format(pDeb)} <span class="delta ${dCls(deb - pDeb)}">${dN(deb - pDeb)}</span>` : ""}` })}
      ${tile({ label: "Rata-rata plafon / deb", value: rpJ(deb ? os / deb : 0), sub: `${nf0.format(rows.length)} RM aktif` })}
      ${tile({ label: "RM capai target", value: `${capai} <small style="font-size:14px;color:var(--muted)">/ ${tgtRows.length}</small>`, sub: chip(pct(tgtRows.length ? capai / tgtRows.length : 0, 0) + " RM", capai / (tgtRows.length || 1) >= .5 ? "good" : capai / (tgtRows.length || 1) >= .25 ? "warn" : "crit") })}
      ${tile({ label: "Sebaran kuadran", value: `<span style="white-space:nowrap;letter-spacing:-.02em">${kc4.join("<small style=\"opacity:.45;margin:0 .18em\">·</small>")}</span>`, sub: [1, 2, 3, 4].map(k => kq(k)).join(" ") })}
    </div>
    <section class="panel" id="rPer"></section>
    <section class="panel" id="rCmp"></section>
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Disbursement bulanan vs target</h2><span class="sub">Subsidi & Komersil</span></div><div class="chart"><canvas id="cRmMon"></canvas></div></section>
      <section class="panel"><div class="panel-h"><h2>Komposisi Subsidi & Komersil</h2><span class="sub">${per}</span></div><div class="chart"><canvas id="cRmJen"></canvas></div></section>
    </div>
    <section class="panel" ${RS.pm === "kc" ? "hidden" : ""}><div class="panel-h"><h2>Peringkat RM</h2><div class="toolbar"><span class="sub">garis = 100% target · klik nama untuk lihat pencapaiannya</span><button class="btn" id="rExp" type="button">Ekspor CSV</button></div></div><div class="lb" id="rLb"></div></section>
    <section class="panel" ${RS.pm === "kc" ? "" : "hidden"}><div class="panel-h"><h2>Per kantor cabang</h2><span class="sub">${ymS(ym)}</span></div><div id="rKc"></div></section>
    <section class="panel" ${RS.pm === "kc" ? "hidden" : ""}><div class="panel-h"><h2>History kuadran RM ${yr}</h2><span class="sub">per bulan</span></div><div id="rHq"></div></section>`;
  $("#rY").onchange = e => { RS.ym = e.target.value; saveRS(); render(); };
  v.querySelectorAll("[data-rmm]").forEach(b => b.onclick = () => { if (RS.pm === b.dataset.rmm) return; RS.pm = RS.cmpG = b.dataset.rmm; RS.selYr = null; saveRS(); render(); });
  $("#rA").onchange = e => { RS.area = e.target.value; RS.kc = "ALL"; saveRS(); render(); };
  $("#rK").onchange = e => { RS.kc = e.target.value; saveRS(); render(); };

  // peringkat
  const lb = [...rows].sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os);
  const last6 = (() => { const out = []; for (let i = 5; i >= 0; i--) { const d = new Date(+yr, +ym.slice(5, 7) - 1 - i, 1); out.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0")); } return out; })();
  const kOf = (rm, m) => { const r = P.months.find(x => x.ym === m && nmKey(x.rm) === nmKey(rm)); return r && r.tDisb ? kuadOf(r.os / r.tDisb) : null; };
  $("#rLb").innerHTML = lb.length ? lb.map((x, i) => `<div class="lb-row" style="grid-template-columns:28px minmax(0,1.4fr) minmax(0,2fr) auto">
      <span class="lb-rank">${i + 1}</span>
      <div class="lb-name wav">${rmAvatar(x.rm, 34)}<div><button class="linkish" data-rm="${esc(x.rm)}">${esc(x.rm)}</button><small>${esc(x.kc)}${x.jg ? " · " + esc(x.jg) : ""}</small></div></div>
      <div class="lb-mid"><div class="lb-bar"><i style="width:${clamp((x.pen || 0) / 1.5, 0, 1) * 100}%;background:var(--${x.pen == null ? "muted" : capaiCls(x.pen)})"></i><span class="tick"></span></div>
        <div class="lb-val">${rpJ(x.os)} / ${x.tDisb ? rpJ(x.tDisb) : "tanpa target"} · ${x.deb} deb (S ${x.sDeb} · K ${x.kDeb}) · ${last6.map(m => kq(kOf(x.rm, m))).join("")}</div></div>
      <span style="display:flex;gap:6px;align-items:center">${x.pen != null ? chip(pct(x.pen, 0), capaiCls(x.pen)) : ""}${kq(kuadOf(x.pen))}</span></div>`).join("") : '<div class="empty">Tidak ada RM pada filter ini.</div>';
  $("#rLb").querySelectorAll("[data-rm]").forEach(b => b.onclick = () => openRM(b.dataset.rm));
  if (!RS.sel || !P.months.some(x => nmKey(x.rm) === nmKey(RS.sel) && inScope(x))) RS.sel = lb.length ? lb[0].rm : null;
  renderRMPer(inScope);
  $("#rExp").onclick = () => exportCSV("produktivitas-rm-" + ym, [["rm","RM"],["kc","KC"],["jg","JG"],["tDisb","Target disb (juta)"],["os","Realisasi (juta)"],["pen","Pencapaian"],["tDeb","Target deb"],["deb","Deb"],["sDeb","Deb subsidi"],["sOs","Subsidi (juta)"],["kDeb","Deb komersil"],["kOs","Komersil (juta)"]], lb);

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
  const sk = [["Subsidi", sum(rows, "sOs"), sum(rows, "sDeb"), s1], ["Komersil", sum(rows, "kOs"), sum(rows, "kDeb"), s2]];
  mkChart("cRmJen", { type: "bar", data: { labels: sk.map(x => x[0]), datasets: [{ label: "Disbursement", data: sk.map(x => x[1]), backgroundColor: sk.map(x => x[3]), borderRadius: 4, maxBarThickness: 34 }] },
    options: baseOpts({ indexAxis: "y", interaction: { mode: "nearest", intersect: true }, plugins: { ...baseOpts().plugins, legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${rpJ(c.parsed.x)} · ${nf0.format(sk[c.dataIndex][2])} deb · ${pct(os ? sk[c.dataIndex][1] / os : 0, 1)}` } } },
      scales: { x: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1000) + " M" } }, y: { ...baseOpts().scales.x, ticks: { ...baseOpts().scales.x.ticks, color: ink2, font: { size: 12 } } } } }) });
  renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day });
  const allYm = uniq(P.months.map(x => x.ym)).sort().filter(m => m <= (P.asof || "9").slice(0, 7)).slice(-18);
  const mAgg = allYm.map(m => { const a = P.months.filter(x => x.ym === m && inScope(x)); return { s: sum(a, "sOs"), k: sum(a, "kOs"), t: sum(a.filter(x => x.tDisb > 0), "tDisb") }; });
  mkChart("cRmMon", { type: "bar", data: { labels: allYm.map(ymS), datasets: [
    { type: "bar", label: "Subsidi", data: mAgg.map(x => x.s), backgroundColor: s1, borderColor: cssv("--surface"), borderWidth: { top: 2 }, borderRadius: 2, maxBarThickness: 22, stack: "a", order: 2 },
    { type: "bar", label: "Komersil", data: mAgg.map(x => x.k), backgroundColor: s2, borderColor: cssv("--surface"), borderWidth: { bottom: 2 }, borderRadius: 2, maxBarThickness: 22, stack: "a", order: 2 },
    { type: "line", label: "Target", data: mAgg.map(x => x.t || null), borderColor: ink2, borderDash: [5, 4], borderWidth: 2, pointRadius: 0, order: 1 }] },
    options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${c.dataset.label}: ${rpJ(c.parsed.y)}` } } },
      scales: { x: { ...baseOpts().scales.x, stacked: true }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x / 1000) + " M" } } } }) });
}
// perbandingan: bulan berjalan s.d. tanggal yang sama vs 3 bulan sebelumnya, dan tahun lalu vs tahun ini
function renderRMCmp({ P, inScope, txIn, ym, yr, isCur, day }) {
  const el = $("#rCmp"); if (!el) return;
  const mode = RS.cmp === "yoy" ? "yoy" : "mtd", grp = RS.cmpG === "rm" ? "rm" : "kc", y1 = String(+yr - 1);
  const addM = (m, k) => { const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + k, 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
  const nDays = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const D = isCur ? day : nDays(ym);
  const kcMap = new Map(P.months.map(x => [x.ym + "|" + nmKey(x.rm), x.kc]));
  const gOf = t => grp === "rm" ? t.rm : (kcMap.get(t.d.slice(0, 7) + "|" + nmKey(t.rm)) || t.kc);
  const pal = [cssv("--s1"), cssv("--s2"), cssv("--s3"), "#eda100"], ink2 = cssv("--ink-2");
  const pc = (a, b) => b ? (a / b - 1) : null, dl = v => v == null ? "–" : `<span class="delta ${dCls(v)}">${(v >= 0 ? "+" : "−") + pct(Math.abs(v), 1)}</span>`;
  const dJ = v => `<span class="delta ${dCls(v)}">${(v >= 0 ? "+" : "−") + nf1.format(Math.abs(v))}</span>`;
  const yo = mode === "yoy";
  el.innerHTML = `<div class="panel-h"><h2>Perbandingan disbursement</h2><div class="seg" role="tablist" aria-label="Jenis perbandingan">
      <button type="button" role="tab" aria-selected="${!yo}" data-cmp="mtd">Bulan berjalan vs 3 bulan lalu</button><button type="button" role="tab" aria-selected="${yo}" data-cmp="yoy">${y1} vs ${yr}</button></div></div>
    <p class="note" style="margin:0">${yo ? `Disbursement per bulan ${y1} dibanding ${yr} dan kumulatif (YtD). ${isCur ? `${BULAN[+ym.slice(5, 7) - 1]} ${yr} baru s.d. ${tglS(P.asof)}, sedangkan ${BULAN[+ym.slice(5, 7) - 1]} ${y1} sebulan penuh (data harian ${y1} tidak tersedia), jadi selisih bulan ini belum sebanding.` : ""}` : `Disbursement s.d. tanggal ${D} di ${ymS(ym)} dibanding tanggal yang sama di 3 bulan sebelumnya. Rp juta.`}</p>
    <div class="chart tall"><canvas id="cCmp"></canvas></div>
    <div id="tCmp"></div>
    <div class="panel-h" style="margin-top:6px"><h3 style="font-size:14px">${yo ? `YtD Jan s.d. ${BULAN[(isCur && +ym.slice(5, 7) > 1 ? +ym.slice(5, 7) - 1 : +ym.slice(5, 7)) - 1]}${isCur ? " (bulan penuh)" : ""}: ${y1} vs ${yr}` : `Per ${grp === "rm" ? "RM" : "cabang"} · s.d. tanggal ${D}`}</h3>
      <div class="seg" role="tablist" aria-label="Kelompokkan"><button type="button" role="tab" aria-selected="${grp === "kc"}" data-g="kc">Per cabang</button><button type="button" role="tab" aria-selected="${grp === "rm"}" data-g="rm">Per RM</button></div></div>
    <div id="tCmpG"></div>`;
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
    table($("#tCmpG"), [{ key: "k", label: grp === "rm" ? "RM" : "Kantor cabang" }, ...ms.map((m, i) => ({ key: "m" + i, label: ymS(m), r: 1, fmt: x => i === 3 ? `<b>${nf1.format(x)}</b>` : (x ? nf1.format(x) : `<span class="note">–</span>`) })),
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
    table($("#tCmpG"), [{ key: "k", label: grp === "rm" ? "RM" : "Kantor cabang" },
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
    const tx = h ? [] : P.tx.filter(t => t.d.startsWith(m) && (isKc ? false : nmKey(t.rm) === key)), txS = tx.filter(t => t.jenis === "KPRS"), txK = tx.filter(t => t.jenis !== "KPRS");
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
      ${isKc ? `<span class="av kc"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/></svg></span>` : rmAvatar(RS.sel, 104)}
      <div class="rmc-info"><div class="rmc-tag">${isKc ? "Kantor Cabang" : "Relationship Manager KPR"}${holo ? ` <span class="holo-badge" title="K1 di bulan berjalan dan K1 carry over">✦ BRILIAN</span>` : ""}</div>
        <h3>${esc(isKc ? RS.selKc : (rmList.find(n => nmKey(n) === key) || RS.sel))}</h3>
        <p class="rmc-meta">${isKc ? `${esc(areaS(me.area || ""))} · ${uniq(mine.filter(x => x.ym === rkYm && (x.tDisb > 0 || x.os > 0)).map(x => x.rm)).length} RM aktif ${ymS(rkYm)}` : `${esc(me.kc || "")}${me.jg ? " · " + esc(me.jg) : ""}${me.area ? " · " + esc(areaS(me.area)) : ""}`}</p>
        </div><div class="rmc-chips">
          ${isKc ? (myKcRk >= 0 ? `<span>Peringkat cabang #${myKcRk + 1} dari ${kcAgg.length} · ${ymS(rkYm)}</span>` : "") : (myRk >= 0 ? `<span>Peringkat #${myRk + 1} dari ${rkRm.length} RM · ${ymS(rkYm)}</span>` : "")}
          ${thisM && thisM.tDisb ? `<button type="button" class="rmc-q" data-kgo="kM" title="Lihat rincian">Kuadran ${ymS(rkYm)} ${kq(thisM.k)}${isKc ? dist("kM") : ""}<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>` : ""}
          <button type="button" class="rmc-q" data-kgo="k" title="Lihat rincian">Kuadran carry over ${kq(coK)}${isKc ? dist("k") : ""}<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button>
          <span>Subsidi ${nf0.format(coSD)} deb · Komersil ${nf0.format(coKD)} deb</span>
        </div>
      <div class="rmc-ring"><div class="rw"><svg viewBox="0 0 112 112"><circle class="bg" cx="56" cy="56" r="46"/><circle class="fg" cx="56" cy="56" r="46" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - ringV)}"/></svg><span class="val">${coPen == null ? "–" : pct(coPen, 0)}</span></div><small>Pencapaian carry over<br>${coLbl}</small></div>
    </div>`;
  el.innerHTML = `<div class="panel-h"><h2>Pencapaian ${isKc ? "per cabang" : "per RM"}</h2></div>
    <div class="toolbar">
      ${isKc ? `<label class="field" style="flex:2 1 220px"><span class="note" style="font-weight:700">Kantor cabang</span><select class="ctl" id="pKcSel">${kcList.map(n => `<option ${n === RS.selKc ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`
        : `<label class="field" style="flex:2 1 220px"><span class="note" style="font-weight:700">Nama RM</span><select class="ctl" id="pRmSel">${rmList.map(n => `<option ${nmKey(n) === key ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`}
      <label class="field" style="flex:1 1 110px"><span class="note" style="font-weight:700">Tahun</span><select class="ctl" id="pRmYr">${years.map(y => `<option ${y === yr ? "selected" : ""}>${y}</option>`).join("")}</select></label>
      <label class="field" style="flex:1 1 200px"><span class="note" style="font-weight:700">Carry over</span><select class="ctl" id="pRmCo"><option value="berjalan">Jan s.d. bulan berjalan (${BULAN[nowM - 1]})</option>${BULAN.map((b, i) => `<option value="${i + 1}" ${(RS.co === "des" ? 12 : +RS.co) === i + 1 ? "selected" : ""}>Jan s.d. ${b}</option>`).join("")}</select></label>
    </div>
    ${card}
    <p class="note" style="margin:0">Rp juta · carry over ${coLbl}</p>
    <div class="grid tiles">
      ${tile({ label: "Disbursement carry over", value: rpJ(coO), sub: `${nf0.format(coD)} deb · Subsidi ${rpJ(coS)} (${coSD} deb) · Komersil ${rpJ(coKm)} (${coKD} deb)` })}
      ${tile({ label: "Target carry over", value: rpJ(coT), sub: `${coTD ? nf0.format(coTD) + " deb · " : ""}${coLbl}` })}
      ${tile({ label: "Pencapaian", value: coPen == null ? "–" : pct(coPen, 1), sub: kq(coK) + (coK ? " kuadran carry over" : ""), meter: coPen })}
      ${tile({ label: "Gap terhadap target", value: `<span class="delta ${dCls(coO - coT)}" style="font-size:inherit">${(coO - coT >= 0 ? "+" : "−") + nf1.format(Math.abs(coO - coT))}</span>`, sub: "Rp juta" })}
      ${tile({ label: isKc ? "Ratas cabang per bulan" : "Ratas per bulan", value: rpJ(coO / elapsed), sub: `${elapsed} bulan aktif${inCo.some(r => r.future) ? ` · perlu ${rpJ(Math.max(0, coT - coO) / inCo.filter(r => r.future).length)}/bln s.d. ${BULAN[endM - 1]}` : ""}` })}
    </div>
    <div class="chart"><canvas id="cRmPer"></canvas></div>
    <div id="tRmPer"></div>
    ${isKc ? `<h3 style="font-size:14px;margin-top:4px">RM di ${esc(RS.selKc)} · carry over ${coLbl}</h3><div id="tKcRm"></div>` : ""}
    <p class="note" style="margin:0">Subsidi = KPR Sejahtera (FLPP); Komersil = Tier 1–3, Secondary, Take Over & Top Up. Kuadran: K1 ≥105%, K2 100–105%, K3 50–100%, K4 &lt;50%.</p>`;
  if ($("#pRmSel")) $("#pRmSel").onchange = e => { RS.sel = e.target.value; RS.selYr = null; saveRS(); renderRMPer(); };
  if ($("#pKcSel")) $("#pKcSel").onchange = e => { RS.selKc = e.target.value; RS.selYr = null; saveRS(); renderRMPer(); };
  $("#pRmYr").onchange = e => { RS.selYr = e.target.value; saveRS(); renderRMPer(); };
  $("#pRmCo").onchange = e => { RS.co = e.target.value; saveRS(); renderRMPer(); };
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
    const tg = $(isKc ? "#tKcRm" : "#tRmPer"); if (!tg) return;
    tg.scrollIntoView({ behavior: "smooth", block: "start" }); tg.classList.remove("flash"); void tg.offsetWidth; tg.classList.add("flash");
  });
  const cols = [{ key: "m", label: "Bulan", fmt: (m, r) => `<b>${ymS(m)}</b>${r.future ? ' <small class="note">belum berjalan</small>' : isKc && r.nRm ? `<br><small class="note">${r.nRm} RM</small>` : ""}` },
    { key: "tDisb", label: "Target", r: 1, fmt: (x, r) => x ? `${nf0.format(x)}${r.tDeb ? `<br><small class="note">${r.tDeb} deb</small>` : ""}` : "–" },
    { key: "sub", label: "Subsidi", r: 1, fmt: (x, r) => cell(x, r.dSub) },
    { key: "kom", label: "Komersil", r: 1, fmt: (x, r) => cell(x, r.dKom) },
    { key: "os", label: "Total", r: 1, fmt: (x, r) => `<b>${nf1.format(x)}</b><br><small class="note">${nf0.format(r.deb)} deb</small>` },
    { key: "pen", label: "% capai", r: 1, fmt: (x, r) => x == null || r.future ? "–" : chip(pct(x, 0), capaiCls(x)) },
    { key: "k", label: "Kuadran", r: 1, fmt: k => kq(k) }];
  const foot = { m: `Carry over<br><small class="note">${coLbl}</small>`, tDisb: nf0.format(coT), os: `<b>${nf1.format(coO)}</b><br><small class="note">${nf0.format(coD)} deb</small>`, pen: coPen == null ? "–" : chip(pct(coPen, 1), capaiCls(coPen)), k: kq(coK) };
  foot.sub = cell(coS, coSD); foot.kom = cell(coKm, coKD);
  table($("#tRmPer"), cols, rows, { state: { key: "m", dir: 1 }, foot });
  if (isKc) {
    table($("#tKcRm"), [{ key: "rm", label: "RM", fmt: (x, r) => `<span class="lb-name wav">${rmAvatar(x, 30)}<span><button class="linkish" data-rm="${esc(x)}">${esc(x)}</button>${r.jg ? `<small>${esc(r.jg)}</small>` : ""}</span></span>` },
      { key: "t", label: "Target CO", r: 1, fmt: x => x ? nf0.format(x) : "–" }, { key: "sub", label: "Subsidi", r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: "Komersil", r: 1, fmt: x => nf1.format(x) }, { key: "os", label: "Total", r: 1, fmt: (x, r) => `<b>${nf1.format(x)}</b><br><small class="note">${r.deb} deb</small>` },
      { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "k", label: "Kuadran CO", r: 1, sortVal: r => r.k ?? 9, fmt: k => kq(k) },
      { key: "kM", label: "Kuadran " + ymS(rkYm), r: 1, sortVal: r => r.kM ?? 9, fmt: k => kq(k) },
      { key: "ks", label: "Kuadran bulanan", nosort: 1, fmt: ks => ks.map(k => kq(k)).join("") }], rr,
      { state: RS.kcSort && RS.kcSort.key ? { ...RS.kcSort } : { key: "pen", dir: -1 }, after: t => t.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { RS.sel = b.dataset.rm; RS.pm = RS.cmpG = "rm"; RS.selYr = yr; saveRS(); render(); const e2 = $("#rPer"); if (e2) e2.scrollIntoView({ behavior: "smooth", block: "start" }); }) });
  }
  const ds = [["Subsidi", "sub", cssv("--s1")], ["Komersil", "kom", cssv("--s2")]].map(([label, k, c]) => ({ label, data: rows.map(r => r[k] || null), backgroundColor: c, type: "bar", stack: "a", borderColor: cssv("--surface"), borderWidth: 1, maxBarThickness: 26, order: 2 }));
  mkChart("cRmPer", { type: "bar", data: { labels: ms.map(ymS), datasets: [...ds, { type: "line", label: "Target", data: rows.map(r => r.tDisb || null), borderColor: cssv("--ink-2"), borderDash: [5, 4], borderWidth: 2, pointRadius: 0, order: 1 }] },
    options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.parsed.y ? ` ${c.dataset.label}: ${rpJ(c.parsed.y)}` : "" } } },
      scales: { x: { ...baseOpts().scales.x, stacked: true }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x) + " Jt" } } } }) });
}

/* ---------- impor file Produktivitas RM ---------- */
function parseRMHist(wb) {
  const s = findSheet(wb, ["bln", "thn", "kanca", "nama_rm", "target_deb", "target_disb"]); if (!s) return null;
  const h = s.h, c = k => h.indexOf(k), iS = c("subsidi"), iK = c("komersil"), iT = c("total"), iJ = c("jg");
  const months = [];
  s.rows.forEach(r => {
    const bl = r[c("bln")], th = r[c("thn")], rm = r[c("nama_rm")]; if (typeof bl !== "number" || typeof th !== "number" || !rm) return;
    let area = ""; for (let i = iJ + 1; i < Math.min(r.length, iJ + 6); i++) if (/AREA/i.test(String(r[i] ?? ""))) { area = String(r[i]).trim().replace(/\s+/g, " "); break; }
    const n = i => i >= 0 ? numX(r[i]) : 0, sOs = n(iS + 1), kOs = n(iK + 1);
    months.push({ ym: `${th}-${String(bl).padStart(2, "0")}`, kc: String(r[c("kanca")] ?? "").trim(), rm: String(rm).trim(), jg: iJ >= 0 && r[iJ] ? String(r[iJ]).trim() : "", area,
      tDeb: n(c("target_deb")), tDisb: n(c("target_disb")), sDeb: n(iS), sOs, kDeb: n(iK), kOs, deb: iT >= 0 ? n(iT) : n(iS) + n(iK), os: iT >= 0 ? n(iT + 1) : sOs + kOs });
  });
  return months.length ? months : null;
}
function parseRMTx(wb) {
  const s = findSheet(wb, ["tanggal", "nama_rm", "plafon", "deb", "jenis", "kanca"]); if (!s) return null;
  const h = s.h, iF = h.indexOf("nama_rm_full") >= 0 ? h.indexOf("nama_rm_full") : h.lastIndexOf("nama_rm");
  const tx = s.rows.filter(r => r[h.indexOf("tanggal")] != null && r[h.indexOf("tanggal")] !== "" && r[iF]).map(r => ({ d: dateX(r[h.indexOf("tanggal")]), rm: String(r[iF]).trim(), kc: String(r[h.indexOf("kanca")] ?? "").trim(),
    pl: Math.round(numX(r[h.indexOf("plafon")]) * 100) / 100, deb: numX(r[h.indexOf("deb")]), jenis: jenisOf(r[h.indexOf("jenis")]) })).filter(t => t.d);
  return tx.length ? tx : null;
}
// gabung: history menggantikan bulan-bulan yang dimuatnya; transaksi harian menggantikan bulan yang dimuatnya
// lalu realisasi RM bulan itu dihitung ulang (bila file hanya satu bulan, atau bulan itu belum ada realisasinya)
function mergeRM(old, hist, tx) {
  const R0 = old ? { months: old.months.map(x => ({ ...x })), tx: [...old.tx] } : { months: [], tx: [] };
  if (hist) { const hm = new Set(hist.map(x => x.ym)); R0.months = [...R0.months.filter(x => !hm.has(x.ym)), ...hist]; }
  if (tx) {
    const tm = uniq(tx.map(t => t.d.slice(0, 7))); R0.tx = [...R0.tx.filter(t => !tm.includes(t.d.slice(0, 7))), ...tx];
    tm.forEach(m => {
      const has = R0.months.some(x => x.ym === m && x.os > 0);
      if (tm.length > 1 && has) return;
      const tt = tx.filter(t => t.d.startsWith(m)), byRm = {};
      tt.forEach(t => { const k = nmKey(t.rm); (byRm[k] = byRm[k] || []).push(t); });
      R0.months.filter(x => x.ym === m).forEach(x => { const a = byRm[nmKey(x.rm)] || [], s = a.filter(t => t.jenis === "KPRS"), k = a.filter(t => t.jenis !== "KPRS");
        Object.assign(x, { sDeb: sum(s, "deb"), sOs: sum(s, "pl"), kDeb: sum(k, "deb"), kOs: sum(k, "pl"), deb: sum(a, "deb"), os: sum(a, "pl") }); delete byRm[nmKey(x.rm)]; });
      Object.values(byRm).forEach(a => { const s = a.filter(t => t.jenis === "KPRS"), k = a.filter(t => t.jenis !== "KPRS"), prev = R0.months.filter(x => nmKey(x.rm) === nmKey(a[0].rm)).pop() || {};
        R0.months.push({ ym: m, kc: prev.kc || a[0].kc, rm: prev.rm || a[0].rm, jg: prev.jg || "", area: prev.area || kcArea(a[0].kc), tDeb: 0, tDisb: 0, sDeb: sum(s, "deb"), sOs: sum(s, "pl"), kDeb: sum(k, "deb"), kOs: sum(k, "pl"), deb: sum(a, "deb"), os: sum(a, "pl") }); });
    });
  }
  R0.months.forEach(x => { x.os = Math.round(x.os * 100) / 100; x.sOs = Math.round(x.sOs * 100) / 100; x.kOs = Math.round(x.kOs * 100) / 100; });
  const asof = R0.tx.map(t => t.d).sort().pop() || (old && old.asof) || null;
  return { months: R0.months, tx: R0.tx, asof };
}

/* ================= VIEW: Pipeline Brispot (dari file Pipeline BRISPOT) ================= */
// DB.pipe = { asof, items[{kc,debitur,rm,pic,plafon,pengajuan,pencairan,putusan,tglPutusan,tatPrakarsa,tatClf,tatUker,tatTotal,status,tahap,akad,batal,proses,developer,jenis}], onhand[], rencana{dates[],rows[{kc,rm,v[]}]} }
const PTAHAP = ["On Hand", "Prakarsa", "Rekomendasi", "Penilaian Agunan", "Analis", "Menunggu Putusan", "Putus & Siap Cair", "Verifikasi Pencairan"];
const PS = Object.assign({ area: "ALL", kc: "ALL", rm: "ALL", jenis: "ALL", proses: "ALL", tahap: "ALL", usia: "ALL", q: "", batal: false }, lsGet(STORE + "-pipe") || {});
const savePS = () => lsSet(STORE + "-pipe", { ...PS, q: "" });
let PIPE_LOADING = /^https?:/.test(location.protocol);
const tahapOf = s => { s = String(s || "").toLowerCase();
  return /verifikasi pencairan/.test(s) ? 7 : /diputus|siap cair/.test(s) ? 6 : /menunggu.*putusan/.test(s) ? 5 : /analis/.test(s) ? 4 : /agunan|penilaian/.test(s) ? 3 : /rekomendasi/.test(s) ? 2 : /prakarsa/.test(s) ? 1 : 1; };
const kcArea = kc => { const u = DB.ker && DB.ker.units.find(u => u.nama.toLowerCase() === String(kc).toLowerCase()); return u ? u.area : ""; };
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
  if (!DB.pipe) {
    v.innerHTML = PIPE_LOADING ? `<section class="panel"><div class="empty">Memuat data pipeline…</div></section>`
      : `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data pipeline</p>Upload file <b>Pipeline BRISPOT</b> (sheet Pipeline, OnHand, Ref_Batal, Rencana Realisasi RM) lewat tombol Data.</div></section>`;
    return;
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
      <div class="toolbar">
        ${sel("pA", "Area", "Semua area", areas, PS.area, areaS)}
        ${sel("pK", "Kantor Cabang", "Semua KC", kcs, PS.kc)}
        ${sel("pR", "RM pemrakarsa", "Semua RM", rms, PS.rm)}
        ${sel("pJ", "Jenis", "Subsidi & Komersil", ["Subsidi", "Komersil"], PS.jenis)}
        <label class="field" style="flex:1 1 150px"><span class="note" style="font-weight:700">Usia pipeline</span><select class="ctl" id="pU"><option value="ALL">Semua usia (${nf0.format(usiaBase.length)})</option>${USIA_OPT.map(o => `<option value="${o[0]}" ${PS.usia === o[0] ? "selected" : ""}>${o[1]} (${nf0.format(usiaCnt[o[0]])})</option>`).join("")}</select></label>
      </div>
      <p class="note" style="margin:0">Posisi pipeline ${tglS(asof)} · plafon dalam Rp · berkas BATAL tidak dihitung · usia: HOT = hari ini − tgl putusan, WARM/COLD = hari ini − tgl prakarsa (*diperkirakan dari TAT total)${PS.usia !== "ALL" ? " · berkas on hand tidak memiliki usia sehingga tidak tampil" : ""}</p>
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
        <div class="toolbar note" style="gap:14px"><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--s1);margin-right:5px"></i>Subsidi</span><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--s2);margin-right:5px"></i>Komersil</span></div>
      </section>
      <section class="panel"><div class="panel-h"><h2>Jadwal akad</h2><span class="sub">plafon per tanggal</span></div><div class="chart"><canvas id="cAkad"></canvas></div></section>
    </div>
    ${P.rencana && P.rencana.rows.length ? `<section class="panel"><div class="panel-h"><h2>Rencana realisasi RM</h2><span class="sub">Rp juta per hari</span></div><div id="pRen"></div></section>` : ""}
    <section class="panel"><div class="panel-h"><h2>Rekap per kantor cabang</h2><span class="sub">debitur / plafon (Rp juta)</span></div><div id="pKc"></div></section>
    <section class="panel"><div class="panel-h"><h2>Per RM pemrakarsa</h2><span class="sub">klik nama RM untuk menyaring</span></div><div id="pRm"></div></section>
    <section class="panel">
      <div class="panel-h"><h2>Daftar pipeline</h2><button class="btn" id="pExp" type="button">Ekspor CSV</button></div>
      <div class="toolbar">
        <input class="ctl" id="pq" type="search" placeholder="Cari debitur / RM / developer" value="${esc(PS.q)}">
        <select class="ctl" id="pT"><option value="ALL">Semua tahap</option>${PTAHAP.map((t, i) => `<option value="${i}" ${PS.tahap === String(i) ? "selected" : ""}>${t}</option>`).join("")}</select>
        <select class="ctl" id="pP"><option value="ALL">HOT/WARM/COLD</option>${["HOT", "WARM", "COLD"].map(p => `<option ${PS.proses === p ? "selected" : ""}>${p}</option>`).join("")}</select>
        <label class="check"><input type="checkbox" id="pB" ${PS.batal ? "checked" : ""}> Tampilkan batal</label>
      </div>
      <div id="pList"></div>
    </section>`;
  const go = () => { savePS(); render(); };
  $("#pA").onchange = e => { PS.area = e.target.value; PS.kc = "ALL"; PS.rm = "ALL"; go(); };
  $("#pK").onchange = e => { PS.kc = e.target.value; PS.rm = "ALL"; go(); };
  $("#pR").onchange = e => { PS.rm = e.target.value; go(); };
  $("#pJ").onchange = e => { PS.jenis = e.target.value; go(); };
  $("#pU").onchange = e => { PS.usia = e.target.value; go(); };

  // funnel: bar = plafon per tahap, terbagi Subsidi/Komersil
  const st = PTAHAP.map((t, i) => { const a = aktif.filter(x => x.tahap === i); return { t, n: a.length, s: sum(a.filter(x => x.jenis === "Subsidi"), "plafon"), k: sum(a.filter(x => x.jenis === "Komersil"), "plafon") }; });
  const mx = Math.max(1, ...st.map(x => x.s + x.k));
  $("#pFun").innerHTML = st.map((x, i) => `<div class="f-row" style="grid-template-columns:128px minmax(0,1fr) 92px"><button class="linkish st" data-t="${i}" style="color:var(--ink)">${x.t}</button>
    <div class="bar" title="${x.n} debitur"><i style="width:${x.s / mx * 100}%;background:var(--s1)"></i><i style="left:calc(${x.s / mx * 100}% + ${x.s && x.k ? 2 : 0}px);width:${x.k / mx * 100}%;background:var(--s2)"></i><span>${x.n} deb</span></div>
    <span class="cv">${rpJ(x.s + x.k)}</span></div>`).join("");
  $("#pFun").querySelectorAll("[data-t]").forEach(b => b.onclick = () => { PS.tahap = b.dataset.t; savePS(); render(); setTimeout(() => $("#pList").scrollIntoView({ behavior: "smooth" }), 50); });

  // jadwal akad
  const ad = uniq(aktif.filter(x => x.akad).map(x => x.akad)).sort();
  const s1 = cssv("--s1"), s2 = cssv("--s2");
  mkChart("cAkad", { type: "bar", data: { labels: ad.map(d => tglS(d).replace(/ \d{4}$/, "")), datasets: ["Subsidi", "Komersil"].map((j, k) => ({ label: j, data: ad.map(d => sum(aktif.filter(x => x.akad === d && x.jenis === j), "plafon")), backgroundColor: k ? s2 : s1, borderColor: cssv("--surface"), borderWidth: k ? { bottom: 2 } : { top: 2 }, borderRadius: 2, maxBarThickness: 30 })) },
    options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${c.dataset.label}: ${rpJ(c.parsed.y)} (${aktif.filter(x => x.akad === ad[c.dataIndex] && x.jenis === c.dataset.label).length} deb)` } } },
      scales: { x: { ...baseOpts().scales.x, stacked: true, ticks: { ...baseOpts().scales.x.ticks, color: c => ad[c.index] < asof ? cssv("--crit") : cssv("--muted") } }, y: { ...baseOpts().scales.y, stacked: true, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x) + " Jt" } } } }) });

  // rencana realisasi RM
  if ($("#pRen")) {
    const R0 = P.rencana, rr = R0.rows.filter(x => (PS.area === "ALL" || kcArea(x.kc) === PS.area) && (PS.kc === "ALL" || x.kc === PS.kc) && (PS.rm === "ALL" || x.rm === PS.rm))
      .map(x => { const o = { kc: x.kc, rm: x.rm, total: x.v.reduce((a, b) => a + b, 0) }; R0.dates.forEach((d, i) => o["d" + i] = x.v[i]); return o; }).filter(x => x.total > 0);
    const cols = [{ key: "rm", label: "RM", fmt: (x, r) => `${esc(x)}<br><small class="note">${esc(r.kc)}</small>` },
      ...R0.dates.map((d, i) => ({ key: "d" + i, label: tglS(d).replace(/ \d{4}$/, ""), r: 1, fmt: x => x ? nf1.format(x) : `<span class="note">–</span>` })),
      { key: "total", label: "Total", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` }];
    const foot = { rm: "Total" }; R0.dates.forEach((d, i) => foot["d" + i] = nf1.format(sum(rr, "d" + i))); foot.total = nf1.format(sum(rr, "total"));
    table($("#pRen"), cols, rr, { sortKey: "total", foot: rr.length > 1 ? foot : null, page: 12 });
  }

  // rekap per KC (format Rekap Nominatif)
  const kcRows = uniq(aktif.map(x => x.kc)).map(kc => { const a = aktif.filter(x => x.kc === kc), s = a.filter(x => x.jenis === "Subsidi"), k = a.filter(x => x.jenis === "Komersil");
    return { kc, area: kcArea(kc), oh: a.filter(x => x.tahap === 0).length, proses: a.filter(x => x.tahap >= 1 && x.tahap <= 5).length, siap: a.filter(x => x.tahap >= 6).length, sDeb: s.length, sPl: sum(s, "plafon"), kDeb: k.length, kPl: sum(k, "plafon"), deb: a.length, pl: sum(a, "plafon") }; });
  const nfJ = x => nf1.format(x);
  table($("#pKc"), [{ key: "kc", label: "Kantor cabang", fmt: (x, r) => `${esc(x)}<br><small class="note">${esc(areaS(r.area).replace(/ · .*/, ""))}</small>` },
    { key: "oh", label: "On hand", r: 1 }, { key: "proses", label: "Proses", r: 1 }, { key: "siap", label: "Siap cair", r: 1 },
    { key: "sDeb", label: "Subsidi deb", r: 1 }, { key: "sPl", label: "Subsidi plafon", r: 1, fmt: nfJ }, { key: "kDeb", label: "Komersil deb", r: 1 }, { key: "kPl", label: "Komersil plafon", r: 1, fmt: nfJ },
    { key: "deb", label: "Total deb", r: 1, fmt: x => `<b>${x}</b>` }, { key: "pl", label: "Total plafon", r: 1, fmt: x => `<b>${nfJ(x)}</b>` }], kcRows,
    { sortKey: "pl", foot: kcRows.length > 1 ? { kc: "Total", oh: sum(kcRows, "oh"), proses: sum(kcRows, "proses"), siap: sum(kcRows, "siap"), sDeb: sum(kcRows, "sDeb"), sPl: nfJ(sum(kcRows, "sPl")), kDeb: sum(kcRows, "kDeb"), kPl: nfJ(sum(kcRows, "kPl")), deb: sum(kcRows, "deb"), pl: nfJ(sum(kcRows, "pl")) } : null });

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
    const rows = pipeFilter(base);
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
    $("#pExp").onclick = () => exportCSV("pipeline-brispot-" + asof, [["debitur","Debitur"],["kc","KC"],["rm","RM"],["jenis","Jenis"],["plafon","Plafon (juta)"],["status","Status"],["proses","Proses"],["usia","Usia pipeline (hari)"],["usiaDasar","Dasar usia"],["putusan","Putusan"],["tglPutusan","Tgl putusan"],["akad","Jadwal akad"],["tatUker","TAT uker (jam)"],["tatTotal","TAT total (jam)"],["developer","Developer"],["batal","Batal"]], rows);
  };
  draw();
  $("#pq").oninput = e => { PS.q = e.target.value; draw(); };
  $("#pT").onchange = e => { PS.tahap = e.target.value; savePS(); draw(); };
  $("#pP").onchange = e => { PS.proses = e.target.value; savePS(); draw(); };

  $("#pB").onchange = e => { PS.batal = e.target.checked; savePS(); draw(); };
}

// gabungkan data baru ke riwayat: tanggal yang ada di file baru menimpa, tanggal lain tetap
function mergeKer(old, neu) {
  if (!old) return neu;
  const key = u => String(u.boc), units = old.units.map(u => ({ ...u }));
  neu.units.forEach(u => { const o = units.find(x => key(x) === key(u));
    if (!o) units.push({ ...u });
    else { if (!/^Uker /.test(u.nama)) o.nama = u.nama; if (u.area && u.area !== "LAINNYA") o.area = u.area; } });
  const uIdx = (src, u) => src.units.findIndex(x => key(x) === key(u));
  const dates = uniq([...old.dates, ...neu.dates]).sort(), m = {};
  ["os", "sml", "npl", "deb", "dsml", "dnpl"].forEach(k => m[k] = dates.map(d => {
    const src = neu.dates.includes(d) ? neu : old, di = src.dates.indexOf(d);
    return units.map(u => { const ui = uIdx(src, u); return ui >= 0 ? (src.m[k][di]?.[ui] ?? 0) : 0; });
  }));
  let rka = neu.rka || old.rka;
  if (rka) { const src = neu.rka ? neu : old; const rr = { months: rka.months };
    ["os", "sml", "npl", "deb"].forEach(k => rr[k] = rka[k].map(row => units.map(u => { const ui = uIdx(src, u); return ui >= 0 ? (row[ui] ?? 0) : 0; }))); rka = rr; }
  return { dates, units, m, rka, source: neu.source };
}

/* ---------- impor file Pipeline BRISPOT ---------- */
const dateX = v => { if (v == null || v === "" || v === "-") return null; if (typeof v === "number") return isoX(v);
  const s = String(v).trim(), a = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/); if (a) return `${a[1]}-${a[2].padStart(2, "0")}-${a[3].padStart(2, "0")}`;
  const b = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/); return b ? `${b[3]}-${b[2].padStart(2, "0")}-${b[1].padStart(2, "0")}` : null; };
const jamX = v => { const m = String(v ?? "").match(/(\d+(?:[.,]\d+)?)/); return m ? parseFloat(m[1].replace(",", ".")) : null; };
function parsePipeline(wb) {
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
      jenis: /flpp|subsidi/i.test(deb) || (plafon > 0 && plafon <= 185) ? "Subsidi" : "Komersil" };
  });
  const oh = findSheet(wb, ["nama_rm", "kantor_cabang", "nama_debitur"]), onhand = [];
  if (oh) oh.rows.forEach(r => { const o = k => r[oh.h.indexOf(k)]; if (!o("nama_debitur")) return;
    const pl = numX(o("plafond_rp") ?? o("plafon_rp") ?? o("plafond") ?? o("plafon")); const plafon = Math.round((pl > 1e5 ? pl / 1e6 : pl) * 100) / 100;
    const jal = String(o("jalur") ?? "").trim();
    onhand.push({ kc: String(o("kantor_cabang") ?? "").trim(), rm: String(o("nama_rm") ?? "").trim(), debitur: String(o("nama_debitur")).trim(), developer: String(o("nama_perumahan") ?? "").trim(), plafon, jenis: /subsidi/i.test(jal) ? "Subsidi" : /komersil/i.test(jal) ? "Komersil" : plafon <= 185 ? "Subsidi" : "Komersil" }); });
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
let RATE_LOADING = /^https?:/.test(location.protocol);
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
  if (!DB.rate) { v.innerHTML = RATE_LOADING ? '<section class="panel"><div class="empty">Memuat tabel suku bunga…</div></section>' : '<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada tabel suku bunga</p>Upload file <b>Tabel Perhitungan Suku Bunga KPR</b> lewat tombol Data.</div></section>'; return; }
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
          ${f("sDsr", "Batas DSR (%)", SIM.dsr, "maks. angsuran / penghasilan", false)}
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
    $("#sTab").innerHTML = `<div class="table-wrap"><table><thead><tr><th>Produk / skema</th><th class="r">Tenor</th>${Array.from({ length: maxSt }, (_, k) => `<th class="r">Tahap ${k + 1}</th>`).join("")}<th class="r">Total bunga</th><th class="r">Total bayar</th><th class="r">DSR</th></tr></thead><tbody>
      ${res.map(z => { const d = SIM.gaji ? z.r.maxAng / SIM.gaji : null;
        return `<tr data-i="${z.i}" style="cursor:pointer;${z.i === SIM.sel ? "background:var(--accent-soft)" : ""}"><td style="white-space:normal;min-width:200px"><b>${esc(z.x.prod)}</b><br><small class="note">${esc(z.x.kel)}</small></td><td class="r">${z.t} th</td>
        ${Array.from({ length: maxSt }, (_, k) => { const g = z.r.stages[k]; return g ? `<td class="r">${rpFull(g.ang)}<br><small class="note">${esc(g.label)} · ${nf2.format(g.rate * 100)}%</small></td>` : "<td></td>"; }).join("")}
        <td class="r">${rpFull(z.r.bunga)}</td><td class="r">${rpFull(z.r.total)}</td><td class="r">${d == null ? "–" : chip(pct(d, 0), d <= SIM.dsr / 100 ? "good" : "crit")}</td></tr>`; }).join("")}</tbody></table></div>`;
    $("#sTab").querySelectorAll("tr[data-i]").forEach(tr => tr.onclick = () => { SIM.sel = +tr.dataset.i; saveSIM(); calc(); $("#sDet").scrollIntoView({ behavior: "smooth", block: "start" }); });
    const z = res[SIM.sel]; if (!z) { $("#sDet").innerHTML = ""; return; }
    const d = SIM.gaji ? z.r.maxAng / SIM.gaji : null, ok = d != null && d <= SIM.dsr / 100;
    $("#sDet").innerHTML = `<div class="panel-h"><h2>${esc(z.x.prod)}</h2>${d != null ? chip(ok ? "Layak · DSR " + pct(d) : "Melebihi DSR · " + pct(d), ok ? "good" : "crit") : ""}</div>
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
            <dt>Penghasilan minimal (DSR ${SIM.dsr}%)</dt><dd>${rpFull(z.r.maxAng / (SIM.dsr / 100))}</dd>
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

/* ================= router & shell ================= */
const VIEWS = {
  beranda: ["Beranda", "Dashboard KPR", viewBeranda],
  keragaan: ["Keragaan KPR", "Menu 1", viewKeragaan],
  produktivitas: ["Produktivitas RM", "Menu 2", viewRM],
  pipeline: ["Pipeline Brispot RM", "Menu 3", viewPipeline],
  simulasi: ["Simulasi KPR", "Menu 4", viewSimulasi]
};
const curView = () => { const h = location.hash.slice(1); return VIEWS[h] ? h : "beranda"; };
function fillFilters() {
  const ps = periods();
  if (!ps.includes(S.periode)) S.periode = ps[ps.length - 1];
  $("#fPeriode").innerHTML = [...ps].reverse().map(p => `<option value="${p}" ${p === S.periode ? "selected" : ""}>${perLabel(p)}</option>`).join("");
  const us = units(); if (S.unit !== "ALL" && !us.includes(S.unit)) S.unit = "ALL";
  $("#fUnit").innerHTML = `<option value="ALL">Semua unit</option>` + us.map(u => `<option ${u === S.unit ? "selected" : ""}>${esc(u)}</option>`).join("");
}
function render() {
  const k = curView(), [title, eb, fn] = VIEWS[k], home = k === "beranda";
  $("#landing").hidden = !home; $("#app").hidden = home; document.body.classList.toggle("at-home", home); document.body.classList.toggle("qv-open", !!LQV.key);
  const v = home ? $("#landing") : $("#view");
  document.querySelectorAll(".nav a").forEach(a => a.dataset.v === k ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  $("#pageTitle").textContent = title; $("#eyebrow").textContent = eb;
  { const tt = document.querySelector(".topbar .ttl"); if (tt && tt.dataset.v !== title) { tt.dataset.v = title; tt.classList.remove("tb-in"); void tt.offsetWidth; tt.classList.add("tb-in"); } }
  $("#fPeriode").hidden = true; $("#fUnit").hidden = true;
  Object.keys(charts).forEach(id => { charts[id].destroy(); delete charts[id]; });
  fn(v); setupSections(v, k);
  if (false && DB.source !== "impor" && !document.documentElement.classList.contains("viewer")) {
    const b = document.createElement("div"); b.className = "banner";
    b.innerHTML = `<span><b>Data contoh.</b> Angka di menu ini masih fiktif untuk peragaan. Impor file Excel Anda untuk memakai data asli.</span><button class="btn" type="button">Impor data</button>`;
    b.querySelector("button").onclick = openData; v.prepend(b);
  }
}
async function pushOnline(path, obj, okMsg, localMsg) {
  if (!ONLINE.canWrite) { toast(localMsg); return; }
  document.querySelectorAll(".dc-prog:not([hidden])").forEach(p => p.textContent = "Memperbarui link untuk semua anggota…");
  try { await ONLINE.art.publish({ [path]: JSON.stringify(obj) }); toast("Link diperbarui. " + okMsg + ". Semua anggota melihat data ini."); }
  catch (err) {
    const c = err && err.code;
    toast(c === "conflict" ? "Ada versi lebih baru di link; halaman dimuat ulang. Silakan upload lagi."
      : c === "not_writer" || c === "not_granted" || c === "capability_disabled" ? "Data tampil di perangkat ini saja. Hanya pemilik link yang bisa memperbarui untuk semua."
      : "Link gagal diperbarui (" + (c || "error") + "). Data tampil di perangkat ini saja.");
  }
}
function openDataStatus() {
  const upd = o => o && o.updated ? ` · diperbarui ${new Date(o.updated).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ${new Date(o.updated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "";
  const st = {
    ker: DB.ker ? `<b>${DB.ker.units.length} uker</b>, s.d. <b>${tglS(DB.ker.dates[DB.ker.dates.length - 1])}</b>${DB.ker.rka ? " · RKA " + blnS(DB.ker.rka.months[0]) + "–" + blnS(DB.ker.rka.months[DB.ker.rka.months.length - 1]) : ""}${upd(DB.ker)}` : "Belum ada data",
    pipe: DB.pipe ? `<b>${DB.pipe.items.length} berkas</b> + ${DB.pipe.onhand.length} on hand, posisi <b>${tglS(DB.pipe.asof)}</b>${upd(DB.pipe)}` : "Belum ada data",
    rm: DB.rmk ? `<b>${uniq(DB.rmk.months.map(x => x.rm)).length} RM</b>, pencairan s.d. <b>${tglS(DB.rmk.asof)}</b>${upd(DB.rmk)}` : "Belum ada data",
    foto: DB.foto && DB.foto.map ? `<b>${Object.keys(DB.foto.map).length} foto</b> RM${upd(DB.foto)}` : "Belum ada foto",
    rate: DB.rate ? `<b>${esc((DB.rate.title || "Tabel suku bunga").replace(/^TABEL SUKU BUNGA KPP\s*-\s*/i, ""))}</b>, ${DB.rate.rows.length} skema${upd(DB.rate)}` : "Belum ada data"
  };
  Object.entries(st).forEach(([k, v]) => { const e = $("#st_" + k); if (e) e.innerHTML = v; });
}
function openData() { openDataStatus(); $("#dlgData").showModal(); }
// impor
const normKey = k => String(k).trim().toLowerCase().replace(/[\s\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
function normPeriode(v) {
  if (v instanceof Date) return v.getFullYear() + "-" + String(v.getMonth() + 1).padStart(2, "0");
  if (typeof v === "number" && v > 20000) { const d = new Date(Math.round((v - 25569) * 864e5)); return d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"); }
  const s = String(v).trim(), m = s.match(/^(\d{4})[-\/.](\d{1,2})/); if (m) return m[1] + "-" + m[2].padStart(2, "0");
  const m2 = s.match(/^(\d{1,2})[-\/.](\d{4})$/); if (m2) return m2[2] + "-" + m2[1].padStart(2, "0");
  return s;
}
function normDate(v) {
  if (v instanceof Date) return iso(v);
  if (typeof v === "number") { const d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().slice(0, 10); }
  const s = String(v).trim(), m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : s.slice(0, 10);
}
function rowsOf(wb, name) {
  const sh = wb.SheetNames.find(n => normKey(n) === name); if (!sh) return null;
  return XLSX.utils.sheet_to_json(wb.Sheets[sh], { defval: "", raw: true }).map(r => { const o = {}; for (const k in r) o[normKey(k)] = r[k]; return o; });
}
const NUMK = ["os","realisasi","target","noa","kol1","kol2","kol3","kol4","kol5","subsidi","non_subsidi","take_over","top_up","plafon"];
const fixNums = o => { NUMK.forEach(k => { if (k in o) o[k] = +String(o[k]).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".") || 0; }); return o; };
const KIND_LABEL = { ker: "Keragaan KPR (Gabung KAP DLY / Master Keragaan)", pipe: "Pipeline BRISPOT", rm: "Produktivitas RM (Database bulan / Monthly / History)", rate: "Tabel Perhitungan Suku Bunga KPR" };
async function importFile(f, kind, input) {
  if (!f) return;
  if (typeof XLSX === "undefined") { toast("Pustaka Excel gagal dimuat. Periksa koneksi internet."); return; }
  const prog = $("#pr_" + kind) || $("#pr_ker"); const card = input && input.closest(".dcard");
  try {
    prog.hidden = false; prog.textContent = "Membaca " + f.name + "…";
    await new Promise(r => setTimeout(r, 30));
    const wb = XLSX.read(await f.arrayBuffer());
    const want = k => kind === "auto" || kind === k;
    let done = null;
    if (!done && want("ker")) { const master = parseMaster(wb); if (master) {
      const before = DB.ker ? DB.ker.dates.length : 0;
      DB.ker = { ...mergeKer(DB.ker, master), updated: new Date().toISOString() }; KS.date = null; lsSet(STORE, DB); render();
      const posisi = tglS(DB.ker.dates[DB.ker.dates.length - 1]), added = DB.ker.dates.length - before;
      prog.textContent = "Memperbarui…";
      await pushOnline("data/keragaan.json", { ker: DB.ker, updated: DB.ker.updated }, `Keragaan posisi s.d. ${posisi}`, `Keragaan diperbarui (${master.dates.length === 1 ? "posisi " + tglS(master.dates[0]) : master.dates.length + " tanggal"}${added > 0 ? ", " + added + " tanggal baru" : ""}). Posisi terakhir ${posisi}`);
      done = "ker"; } }
    if (!done && want("pipe")) { const pd = parsePipeline(wb); if (pd) {
      DB.pipe = { ...pd, updated: new Date().toISOString() }; lsSet(STORE, DB); render();
      const msg = `Pipeline posisi ${tglS(pd.asof)}: ${pd.items.length} berkas + ${pd.onhand.length} on hand`;
      await pushOnline("data/pipeline.json", { pipe: DB.pipe, updated: DB.pipe.updated }, msg, "Pipeline diperbarui. " + msg);
      done = "pipe"; } }
    if (!done && want("rate")) { const rates = parseRates(wb); if (rates) {
      DB.rate = { ...rates, updated: new Date().toISOString() }; SIM.counter = null; SIM.selisih = null; lsSet(STORE, DB); render();
      const msg = `Tabel suku bunga: ${uniq(rates.rows.map(x => x.prog)).length} program, ${rates.rows.length} skema`;
      await pushOnline("data/rate.json", { rate: DB.rate, updated: DB.rate.updated }, msg, "Simulasi diperbarui. " + msg);
      done = "rate"; } }
    if (!done && want("rm")) { const rmH = parseRMHist(wb), rmT = parseRMTx(wb); if (rmH || rmT) {
      DB.rmk = { ...mergeRM(DB.rmk, rmH, rmT), updated: new Date().toISOString() }; RS.ym = null; lsSet(STORE, DB); render();
      const msg = `Produktivitas RM${rmH ? ` (history ${ymS(uniq(rmH.map(x => x.ym)).sort()[0])}–${ymS(uniq(rmH.map(x => x.ym)).sort().pop())})` : ""}${rmT ? ` (${rmT.length} pencairan, ${uniq(rmT.map(t => t.d.slice(0, 7))).map(ymS).join(", ")})` : ""}${DB.rmk.asof ? " s.d. " + tglS(DB.rmk.asof) : ""}`;
      await pushOnline("data/rm.json", { rmk: DB.rmk, updated: DB.rmk.updated }, msg, "Diperbarui. " + msg);
      done = "rm"; } }
    if (!done) throw new Error(kind === "auto" ? "Jenis file tidak dikenali." : `File ini bukan file ${KIND_LABEL[kind]}. Data tidak diubah.`);
    DB.updated = new Date().toISOString(); openDataStatus();
    const c = card || document.querySelector(`.dcard[data-k="${done}"]`); if (c) { c.classList.add("ok"); setTimeout(() => c.classList.remove("ok"), 2500); }
  } catch (err) { toast(err.message.startsWith("File ini") || err.message.startsWith("Jenis") ? err.message : "Impor gagal: " + err.message); }
  prog.hidden = true;
  if (input) input.value = "";
}
document.querySelectorAll('#dlgData input[type=file][data-kind]').forEach(inp => inp.addEventListener("change", e => importFile(e.target.files[0], e.target.dataset.kind, e.target)));
// foto RM: nama file dicocokkan ke nama RM, dipotong persegi (fokus agak ke atas untuk foto potret) lalu diperkecil
async function importFoto(files, input) {
  const prog = $("#pr_foto"), names = DB.rmk ? uniq(DB.rmk.months.map(x => x.rm)) : [], keys = names.map(nmKey);
  const map = { ...(DB.foto && DB.foto.map || {}) }, ok = [], miss = [];
  prog.hidden = false;
  for (const f of files) {
    prog.textContent = "Memproses " + f.name + "…";
    const base = f.name.replace(/\.[^.]+$/, ""), k = nmKey(base);
    const i = keys.indexOf(k) >= 0 ? keys.indexOf(k) : keys.findIndex(x => x && (x.startsWith(k) || k.startsWith(x)));
    if (!k || i < 0) { miss.push(base); continue; }
    try {
      const bmp = await createImageBitmap(f), side = Math.min(bmp.width, bmp.height), sx = (bmp.width - side) / 2, sy = bmp.height > bmp.width ? (bmp.height - side) * .2 : 0;
      const cv = document.createElement("canvas"); cv.width = cv.height = 320; cv.getContext("2d").drawImage(bmp, sx, sy, side, side, 0, 0, 320, 320);
      let url = cv.toDataURL("image/webp", .82); if (!url.startsWith("data:image/webp")) url = cv.toDataURL("image/jpeg", .85);
      map[keys[i]] = url; ok.push(names[i]);
    } catch { miss.push(base); }
  }
  if (ok.length) {
    DB.foto = { map, updated: new Date().toISOString() }; lsSet(STORE, DB); render(); openDataStatus();
    const msg = `${ok.length} foto RM`;
    await pushOnline("data/foto.json", { foto: DB.foto, updated: DB.foto.updated }, msg, msg + " tersimpan");
  }
  if (miss.length) toast(`Nama RM tidak ditemukan untuk: ${miss.slice(0, 5).join(", ")}${miss.length > 5 ? ", dll." : ""}. Samakan nama file dengan nama RM.`);
  prog.hidden = true; if (input) input.value = "";
}
$("#f_foto").addEventListener("change", e => importFoto([...e.target.files], e.target));
function snapshot() {
  const snap = { ...DB, updated: DB.updated || new Date().toISOString() };
  const json = JSON.stringify(snap).replace(/</g, "\\u003c");
  const html = PRISTINE.replace(/<script id="kpr-data" type="application\/json">[\s\S]*?<\/script>/, () => `<script id="kpr-data" type="application/json">${json}<\/script>`);
  saveFile("Dashboard_KPR_Medan_" + iso(new Date()) + ".html", html, "text/html");
}
$("#btnSnap").onclick = snapshot;
$("#btnData").onclick = openData;
document.querySelectorAll("dialog").forEach(d => {
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
});
$("#fPeriode").onchange = e => { S.periode = e.target.value; saveUI(); render(); };
$("#fUnit").onchange = e => { S.unit = e.target.value; saveUI(); render(); };
$("#btnTheme").onclick = () => {
  const root = document.documentElement, dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark"; lsSet(STORE + "-theme", root.dataset.theme);
};
const th = lsGet(STORE + "-theme"); if (th) document.documentElement.dataset.theme = th;
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
// perpindahan layar yang halus: View Transitions bila didukung browser, selain itu animasi masuk CSS
let lastView = null;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function navTo() {
  const k = curView(), changed = k !== lastView, prev = lastView; lastView = k;
  if (changed && prev !== null) uiSound(k === "beranda" ? "home" : "nav");
  if (!changed || prev === null || reduceMotion) { render(); if (changed) window.scrollTo(0, 0); return; }
  const kind = k === "beranda" || prev === "beranda" ? "zoom" : "slide";
  if (document.startViewTransition) {
    document.documentElement.dataset.vt = kind;
    const vt = document.startViewTransition(() => { render(); window.scrollTo(0, 0); });
    vt.finished.finally(() => { delete document.documentElement.dataset.vt; });
  } else {
    render(); window.scrollTo(0, 0);
    const el = k === "beranda" ? $("#landing") : $("#view"); el.classList.remove("v-enter", "v-zoom"); void el.offsetWidth;
    el.classList.add(kind === "zoom" ? "v-zoom" : "v-enter"); setTimeout(() => el.classList.remove("v-enter", "v-zoom"), 600);
  }
}
window.addEventListener("hashchange", navTo);
// versi link online: data keragaan dibaca dari file data/keragaan.json milik link,
// pemilik/editor bisa memperbarui file itu langsung dari tombol Upload
const ONLINE = { art: null, canWrite: false };
async function bootOnline() {
  if (!/^https?:/.test(location.protocol)) return;
  try {
    const [r1, r2, r3, r4, r5] = await Promise.all(["data/keragaan.json", "data/pipeline.json", "data/rm.json", "data/rate.json", "data/foto.json"].map(u => fetch(u, { cache: "no-store" }).catch(() => null)));
    if (r5 && r5.ok) { const j = await r5.json().catch(() => null); if (j && j.foto && (!DB.foto || String(j.updated || "") >= String(DB.foto.updated || ""))) DB.foto = j.foto; }
    if (r4 && r4.ok) { const j = await r4.json(); if (j && j.rate && (!DB.rate || String(j.updated || "") >= String(DB.rate.updated || ""))) DB.rate = j.rate; }
    if (r3 && r3.ok) { const j = await r3.json(); if (j && j.rmk && (!DB.rmk || String(j.updated || "") >= String(DB.rmk.updated || ""))) DB.rmk = j.rmk; }
    if (r1 && r1.ok) { const j = await r1.json(); if (j && j.ker && (!DB.ker || String(j.updated || "") >= String(DB.ker.updated || ""))) { DB.ker = j.ker; KS.date = null; } }
    if (r2 && r2.ok) { const j = await r2.json(); if (j && j.pipe && (!DB.pipe || String(j.updated || "") >= String(DB.pipe.updated || ""))) DB.pipe = j.pipe; }
  } catch {}
  KER_LOADING = false; PIPE_LOADING = false; RM_LOADING = false; RATE_LOADING = false; render();
  if (!window.claude) return;
  const [art, user] = await Promise.all([window.claude.use("artifact").catch(() => null), window.claude.use("user").catch(() => null)]);
  const canEdit = user ? await user.canEdit().catch(() => false) : false;
  if (art && canEdit) {
    ONLINE.art = art; ONLINE.canWrite = true;
    $("#upNote").textContent = "Upload di tiap bagian hanya memperbarui data bagian itu, dan langsung tampil di link ini untuk semua yang membukanya.";
  } else if (user) {
    // anggota (hanya lihat): sembunyikan pengelolaan data
    $("#btnData").hidden = true; const l = $("#lData"); if (l) l.hidden = true; document.documentElement.classList.add("viewer");
  }
}
/* ---------- suara antarmuka bergaya konsol (disintesis Web Audio, tanpa file): ketukan jernih, denting kristal, gaung tipis ---------- */
const UISND = { on: lsGet(STORE + "-snd") !== false, ctx: null, bus: null, last: 0 };
function uiBus(c) {
  if (UISND.bus) return UISND.bus;
  // gaung pendek & lembut dari impuls derau yang meluruh, dicampur tipis ke sinyal kering
  const len = Math.round(c.sampleRate * .9), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  const master = c.createGain(), dry = c.createGain(), wet = c.createGain(), rev = c.createConvolver(), hp = c.createBiquadFilter(), comp = c.createDynamicsCompressor();
  rev.buffer = ir; hp.type = "highpass"; hp.frequency.value = 900; master.gain.value = 1.3; dry.gain.value = 1; wet.gain.value = .32;
  comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = .002; comp.release.value = .12;
  dry.connect(comp); hp.connect(rev); rev.connect(wet); wet.connect(comp); comp.connect(master); master.connect(c.destination);
  return (UISND.bus = { dry, send: hp });
}
function uiSound(kind) {
  if (!UISND.on) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = UISND.ctx || (UISND.ctx = new AC()); if (c.state === "suspended") c.resume();
    const B = uiBus(c), t0 = c.currentTime + .004;
    // nada sinus dengan serangan cepat & peluruhan eksponensial; send = porsi ke gaung
    const ping = (f, d, dur, g, send = .5, type = "sine", glide = 1, atk = .004, lpf = 0) => {
      const o = c.createOscillator(), a = c.createGain(), sg = c.createGain(), t = t0 + d; o.type = type;
      o.frequency.setValueAtTime(f, t); if (glide !== 1) o.frequency.exponentialRampToValueAtTime(f * glide, t + dur * .6);
      a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + atk); a.gain.exponentialRampToValueAtTime(.0001, t + dur);
      let src = o; if (lpf) { const f2 = c.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = lpf; f2.Q.value = .5; o.connect(f2); src = f2; }
      sg.gain.value = send; src.connect(a); a.connect(B.dry); a.connect(sg); sg.connect(B.send); o.start(t); o.stop(t + dur + .05);
    };
    // klik halus: semburan derau sangat pendek yang difilter (memberi "tekstur" ketukan)
    const click = (d, g, fq) => {
      const n = c.createBufferSource(), buf = c.createBuffer(1, Math.round(c.sampleRate * .012), c.sampleRate), x = buf.getChannelData(0);
      for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 4);
      const bp = c.createBiquadFilter(), a = c.createGain(); bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = 1.4; a.gain.value = g;
      n.buffer = buf; n.connect(bp); bp.connect(a); a.connect(B.dry); n.start(t0 + d);
    };
    if (kind === "nav") {        // pilih menu: nada sinus murni rendah (C5 → G5), serangan lambat, diredam — lembut seperti "pop" halus
      ping(523.25, 0, .42, .055, .3, "sine", 1, .035, 1400);
      ping(783.99, .07, .55, .042, .35, "sine", 1, .04, 1400);
    } else if (kind === "home") { // kembali ke beranda: kebalikan "nav" — nada turun G5 → C5
      ping(783.99, 0, .38, .05, .3, "sine", 1, .035, 1400);
      ping(523.25, .07, .6, .045, .35, "sine", 1, .04, 1400);
    } else if (kind === "move") { // sorot / arahkan: "plip" lembut & singkat
      ping(2093, 0, .09, .032, .55, "sine", 1.04); click(0, .018, 6500);
    } else if (kind === "on") {   // suara aktif: naik lembut
      ping(1046.5, 0, .3, .05, .6); ping(1568, .08, .5, .05, .75);
    } else if (kind === "close") { // kembali / tutup: turun lembut
      click(0, .03, 4200); ping(1567.98, 0, .16, .045, .55, "sine", .82); ping(1046.5, .05, .3, .03, .65);
    } else {                      // ketukan tombol: tick jernih bernada tinggi
      click(0, .045, 5600); ping(2637, 0, .07, .04, .5, "sine", .97); ping(5274, 0, .03, .008, .4);
    }
  } catch {}
}
function sndLabel() {
  const b = $("#btnSnd"); if (b) { b.setAttribute("aria-pressed", UISND.on); b.style.opacity = UISND.on ? 1 : .55; b.title = UISND.on ? "Suara klik: aktif" : "Suara klik: mati"; }
  const l = $("#lSnd"); if (l) l.textContent = UISND.on ? "Suara klik: aktif" : "Suara klik: mati";
}
const toggleSnd = () => { UISND.on = !UISND.on; lsSet(STORE + "-snd", UISND.on); sndLabel(); if (UISND.on) uiSound("on"); };
$("#btnSnd").onclick = toggleSnd;
document.addEventListener("click", e => { if (e.target.closest("#lSnd")) toggleSnd(); }, true);
document.addEventListener("click", e => {
  const t = e.target.closest("a, button, [data-rm], [data-area], [data-kc], tr[data-i], summary, th.sortable, label.check"); if (!t) return;
  if (t.matches("#btnSnd, #lSnd, #inSkip")) return;
  // pindah layar: suaranya dibunyikan oleh navTo (naik = masuk dashboard, turun = kembali ke beranda)
  if (t.matches('a[href^="#"]') && t.getAttribute("href").slice(1) !== location.hash.slice(1) && !(t.getAttribute("href") === "#beranda" && curView() === "beranda")) return;
  if (t.matches(".l-card, .nav a, .ttl a")) uiSound("nav");
  else if (t.matches("[data-close]")) uiSound("close");
  else uiSound("tick");
}, true);
document.addEventListener("change", e => { if (e.target.matches("select, input[type=checkbox], input[type=month]")) uiSound("tick"); }, true);
// sorot kartu & menu (hanya perangkat dengan mouse), dibatasi agar tidak beruntun
if (matchMedia("(hover: hover) and (pointer: fine)").matches) document.addEventListener("pointerover", e => {
  const t = e.target.closest(".l-card, .nav a, .rm-mode button, .seg button"); if (!t || t.contains(e.relatedTarget)) return;
  const now = performance.now(); if (now - UISND.last < 70) return; UISND.last = now; uiSound("move");
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

// mulai aplikasi; bila data/pengaturan lama yang tersimpan di browser membuat gagal, pulihkan otomatis memakai data bawaan file
function bootApp() { fillFilters(); render(); lastView = curView(); bootOnline(); }
try { bootApp(); }
catch (err) {
  console.error(err);
  try {
    const bak = {}; ["", "-ui", "-ker", "-rm", "-pipe", "-qv", "-zoom", "-zfit", "-min"].forEach(sfx => { const v = lsGet(STORE + sfx); if (v != null) { bak[sfx] = v; lsDel(STORE + sfx); } });
    lsSet(STORE + "-backup", bak);
    DB = Object.assign(buildSample(), {}); if (EMBED) ["ker", "pipe", "rmk", "rate", "foto"].forEach(k => { if (EMBED[k]) DB[k] = EMBED[k]; });
    Object.keys(S).forEach(k => delete S[k]); Object.assign(S, { periode: null, unit: "ALL" });
    LQV.key = ""; UZ.v = 1; UZ.fit = false;
    bootApp(); setTimeout(() => toast("Pengaturan lama di browser ini direset otomatis."), 600);
  } catch (err2) { throw err2; }
}
window.__kprReady = true;

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
    setTimeout(() => { el.hidden = true; }, 620);
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
