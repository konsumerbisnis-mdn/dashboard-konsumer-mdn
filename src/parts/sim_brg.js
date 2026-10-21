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
