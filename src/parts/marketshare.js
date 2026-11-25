/* ================= Marketshare Konsumer Region I - Medan: industri vs BRI per kantor cabang, klaster & posisi bank lain ================= */
// Sumber: sheet "marketshare" di Google Sheets, format panjang (Kode KC, Kanca, Tanggal, Segmen Bisnis, Jenis, OS; Rp juta), dibaca Apps Script saat Sync marketshare
// DB.ms = { asof, per[{k:"yyyy-mm", l}], biz:{ konsumer|briguna|ritel|mikro|kpr: { rows[{n, kduk, t, i[], b[]}] } } }
//   i = posisi INDUSTRI per periode, b = posisi BRI per periode (pada baris peers, b = posisi kelompok bank itu); %marketshare = b / i.
const MS_BIZ = [["konsumer", "Konsumer", "KONSUMER TOTAL"], ["briguna", "Briguna Total", "SBL (RITEL + MIKRO)"], ["ritel", "Briguna Ritel", "SBL RITEL"], ["mikro", "Briguna Mikro", "SBL MIKRO"], ["kpr", "KPR", "KPR"]];
// data dari Apps Script (sheet "marketshare"): periode hanya berisi kunci yyyy-mm, label dibuat di sini
function msPrep(o) { o.per.forEach(p => { if (!p.l) p.l = BULAN[+p.k.slice(5, 7) - 1] + "'" + p.k.slice(2, 4); }); return o; }

/* ---------- tampilan ---------- */
const MSX = Object.assign({ biz: "konsumer", per: null }, lsGet(STORE + "-ms") || {});
const saveMSX = () => lsSet(STORE + "-ms", MSX);
const perL = k => { const m = /^(\d{4})-(\d{2})$/.exec(k || ""); return m ? BULAN[+m[2] - 1] + " " + m[1] : "–"; };
function viewMarketshare(v) {
  const M = DB.ms;
  if (!M) { v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data marketshare</p>${isAdmin() ? "Upload file <b>Marketshare Konsumer</b> (sheet “tanpa RO Medan”) lewat Admin → Kelola data." : "Hubungi admin untuk upload data marketshare."}</div></section>`; return; }
  if (!M.biz[MSX.biz]) MSX.biz = "konsumer";
  const per = M.per, B = M.biz[MSX.biz], bl = MS_BIZ.find(x => x[0] === MSX.biz);
  let pi = per.findIndex(p => p.k === MSX.per); if (pi < 0) pi = per.findIndex(p => p.k === M.asof); if (pi < 0) pi = per.length - 1;
  const hasD = k => per.some((p, i) => B.rows.some(r => r.b[i] != null) && p.k === k);
  const idxOf = (y, m) => per.findIndex(p => p.k === y + "-" + String(m).padStart(2, "0"));
  const yoyI = i => idxOf(+per[i].k.slice(0, 4) - 1, per[i].k.slice(5)), prevI = i => { let y = +per[i].k.slice(0, 4), m = +per[i].k.slice(5) - 1; if (m < 1) { m = 12; y--; } return idxOf(y, m); };
  const msOf = (r, i) => i >= 0 && r.i[i] && r.b[i] != null ? r.b[i] / r.i[i] : null, grOf = (a, i, j) => i >= 0 && j >= 0 && a[i] != null && a[j] ? a[i] / a[j] - 1 : null;
  const yI = yoyI(pi), mI = prevI(pi);
  const met = r => { const s = msOf(r, pi), sy = msOf(r, yI), sm = msOf(r, mI), gI = grOf(r.i, pi, yI), gB = grOf(r.b, pi, yI);
    return { ...r, ind: r.i[pi], bri: r.b[pi], ms: s, msY: sy, dY: s != null && sy != null ? s - sy : null, dM: s != null && sm != null ? s - sm : null, gI, gB, gap: gI != null && gB != null ? gB - gI : null }; };
  const ro = B.rows.find(r => r.t === "ro"), R = ro ? met(ro) : null;
  const kc = B.rows.filter(r => r.t === "kc").map(met), zona = B.rows.filter(r => r.t === "zona" || r.t === "klaster").map(met), peers = B.rows.filter(r => r.t === "peer").map(met);
  const sg = (x, d = 1) => x == null ? "–" : (x >= 0 ? "+" : "−") + pct(Math.abs(x), d);
  const dl = x => x == null ? "–" : `<span class="delta ${dCls(x)}">${dPP(x)}</span>`;
  const bn = x => x == null ? "–" : nf0.format(x / 1000);   // Rp miliar
  const opts = [...per].reverse().filter(p => B.rows.some(r => r.b[per.indexOf(p)] != null)).map(p => `<option value="${p.k}" ${p.k === per[pi].k ? "selected" : ""}>${perL(p.k)}</option>`).join("");
  v.innerHTML = `
    <section class="panel" style="padding:12px 16px">
      <div class="seg" role="tablist" aria-label="Bisnis">${MS_BIZ.map(([k, l]) => `<button type="button" role="tab" data-msb="${k}" aria-selected="${k === MSX.biz}">${l}</button>`).join("")}</div>
      <div class="toolbar"><label class="field" style="flex:1 1 170px"><span class="note" style="font-weight:700">Periode</span><select class="ctl" id="msP">${opts}</select></label></div>
      <p class="note" style="margin:0">${esc(bl[1])} · posisi ${perL(per[pi].k)} · Region I Medan (tanpa RO Medan) · nominal Rp miliar · %marketshare = posisi BRI ÷ posisi industri · Δ YoY dibanding ${yI >= 0 ? perL(per[yI].k) : "periode yang sama tahun lalu (belum ada)"}${MSX.biz === "ritel" || MSX.biz === "mikro" ? " · <b>industri = industri SBL total (Ritel + Mikro)</b>, tidak dipisah per segmen, sehingga %marketshare Ritel + Mikro = %marketshare Briguna Total" : ""}</p>
    </section>
    ${R ? `<div class="grid tiles">
      ${tile({ label: "Industri " + esc(bl[1]), value: rpM(R.ind), sub: R.gI != null ? `YoY ${sg(R.gI)}` : "" })}
      ${tile({ label: "BRI " + esc(bl[1]), value: rpM(R.bri), sub: R.gB != null ? `YoY ${sg(R.gB)}` : "" })}
      ${tile({ label: "% Marketshare BRI", value: pct(R.ms, 2), sub: R.dY != null ? `Δ YoY ${dl(R.dY)}` : "" })}
      ${tile({ label: "Δ MtD marketshare", value: R.dM == null ? "–" : `<span class="delta ${dCls(R.dM)}" style="font-size:inherit">${dPP(R.dM)}</span>`, sub: mI >= 0 ? "vs " + perL(per[mI].k) : "" })}
      ${tile({ label: "Growth BRI − industri", value: R.gap == null ? "–" : `<span class="delta ${dCls(R.gap)}" style="font-size:inherit">${dPP(R.gap)}</span>`, sub: "pertumbuhan YoY BRI dikurangi industri" })}
    </div>` : ""}
    <div class="grid cols-2">
      <section class="panel"><div class="panel-h"><h2>Tren % marketshare</h2><span class="sub">RO Medan: BRI vs kelompok bank lain</span></div><div class="chart"><canvas id="cMsTr"></canvas></div></section>
      <section class="panel"><div class="panel-h"><h2>% marketshare per kantor cabang</h2><span class="sub">${perL(per[pi].k)}</span></div><div class="chart" style="height:${Math.max(340, kc.length * 28 + 40)}px"><canvas id="cMsKc"></canvas></div></section>
    </div>
    <section class="panel"><div class="panel-h"><h2>Marketshare ${esc(bl[1])} per kantor cabang</h2><span class="sub">Rp miliar · klik judul kolom untuk mengurutkan</span></div><div id="msKc"></div></section>
    <section class="panel"><div class="panel-h"><h2>Per wilayah &amp; klaster</h2><span class="sub">urban / rural dan klaster Kanwil</span></div><div id="msZn"></div></section>
    <section class="panel"><div class="panel-h"><h2>Posisi industri: BRI dan bank lain</h2><span class="sub">pangsa tiap kelompok bank terhadap industri RO Medan</span></div><div id="msPr"></div></section>`;
  v.querySelectorAll("[data-msb]").forEach(b => b.onclick = () => { MSX.biz = b.dataset.msb; saveMSX(); render(); });
  $("#msP").onchange = e => { MSX.per = e.target.value; saveMSX(); render(); };
  const cols = (first, withKd) => [first,
    { key: "ind", label: "Industri", r: 1, fmt: bn }, { key: "bri", label: "BRI", r: 1, fmt: bn },
    { key: "ms", label: "% Marketshare", r: 1, sortVal: r => r.ms ?? -1, fmt: x => x == null ? "–" : `<b>${pct(x, 2)}</b>` },
    { key: "msY", label: "MS tahun lalu", r: 1, sortVal: r => r.msY ?? -1, fmt: x => x == null ? "–" : pct(x, 2) },
    { key: "dY", label: "Δ YoY MS", r: 1, sortVal: r => r.dY ?? -9, fmt: dl }, { key: "dM", label: "Δ MtD MS", r: 1, sortVal: r => r.dM ?? -9, fmt: dl },
    { key: "gI", label: "Growth industri YoY", r: 1, sortVal: r => r.gI ?? -9, fmt: x => sg(x) }, { key: "gB", label: "Growth BRI YoY", r: 1, sortVal: r => r.gB ?? -9, fmt: x => sg(x) },
    { key: "gap", label: "BRI − industri", r: 1, sortVal: r => r.gap ?? -9, fmt: dl }];
  const foot = R ? { n: "RO Medan (BRI)", ind: bn(R.ind), bri: bn(R.bri), ms: `<b>${pct(R.ms, 2)}</b>`, msY: R.msY == null ? "–" : pct(R.msY, 2), dY: dl(R.dY), dM: dl(R.dM), gI: sg(R.gI), gB: sg(R.gB), gap: dl(R.gap) } : null;
  table($("#msKc"), cols({ key: "n", label: "Kantor cabang", fmt: (x, r) => `${esc(x)}<br><small class="note">${r.kduk}</small>` }), kc, { sortKey: "bri", foot });
  table($("#msZn"), cols({ key: "n", label: "Wilayah / klaster", fmt: x => esc(x) }), zona, { sortKey: "n", sortDir: 1 });
  table($("#msPr"), [{ key: "n", label: "Kelompok bank", fmt: x => esc(x) }, { key: "ind", label: "Industri", r: 1, fmt: bn }, { key: "bri", label: "Posisi", r: 1, fmt: bn },
    { key: "ms", label: "% dari industri", r: 1, sortVal: r => r.ms ?? -1, fmt: x => x == null ? "–" : `<b>${pct(x, 2)}</b>` }, { key: "msY", label: "Tahun lalu", r: 1, sortVal: r => r.msY ?? -1, fmt: x => x == null ? "–" : pct(x, 2) },
    { key: "dY", label: "Δ YoY", r: 1, sortVal: r => r.dY ?? -9, fmt: dl }, { key: "gB", label: "Growth posisi YoY", r: 1, sortVal: r => r.gB ?? -9, fmt: x => sg(x) }],
    R ? [...peers, { ...R, n: "RO Medan (BRI)" }] : peers, { sortKey: "ms" });
  // grafik
  const s1 = cssv("--s1"), s2 = cssv("--s2"), s3 = cssv("--s3"), ink2 = cssv("--ink-2");
  const line = (rw, label, col, dash) => ({ type: "line", label, data: per.map((_, i) => msOf(rw, i)), borderColor: col, backgroundColor: col, borderWidth: 2.2, borderDash: dash || [], pointRadius: 2, tension: .2, spanGaps: true });
  const peer = nm => peers.find(p => p.n === nm), ds = [];
  if (ro) ds.push(line(ro, "BRI", s1));
  [["Bank BUMN & BUMD (Excl. BRI)", "BUMN & BUMD (tanpa BRI)", s2], ["Bank Swasta Nasional", "Swasta nasional", s3], ["Bank Lainnya", "Lainnya", "#9aa7bd"]].forEach(([nm, l, c]) => { const p = peer(nm); if (p) ds.push(line(p, l, c, [5, 4])); });
  const pctY = { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x * 100) + "%" } };
  mkChart("cMsTr", { type: "line", data: { labels: per.map(p => p.l), datasets: ds }, options: baseOpts({ plugins: { ...baseOpts().plugins, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => c.parsed.y == null ? "" : ` ${c.dataset.label}: ${pct(c.parsed.y, 2)}` } } }, scales: { ...baseOpts().scales, y: pctY } }) });
  const kb = kc.filter(r => r.ms != null).sort((a, b) => b.ms - a.ms);
  mkChart("cMsKc", { type: "bar", data: { labels: kb.map(r => r.n), datasets: [{ label: "% marketshare", data: kb.map(r => r.ms), backgroundColor: s1, borderRadius: 3, maxBarThickness: 16 }] },
    options: baseOpts({ indexAxis: "y", plugins: { ...baseOpts().plugins, legend: { display: false }, tooltip: { ...baseOpts().plugins.tooltip, callbacks: { label: c => ` ${pct(c.parsed.x, 2)} · BRI ${rpM(kb[c.dataIndex].bri)} dari industri ${rpM(kb[c.dataIndex].ind)}` } } },
      scales: { x: { ...baseOpts().scales.y, ticks: { ...baseOpts().scales.y.ticks, callback: x => nf0.format(x * 100) + "%" } }, y: { ...baseOpts().scales.x, ticks: { ...baseOpts().scales.x.ticks, color: ink2, font: { size: 11 } } } } }) });
}
