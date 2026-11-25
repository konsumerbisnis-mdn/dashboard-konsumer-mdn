/* ================= Marketshare Konsumer Region I - Medan: industri vs BRI per kantor cabang, klaster & posisi bank lain ================= */
// Sumber: file "Marketshare_konsumer_per <bulan>.xlsx" sheet "tanpa RO Medan" (Rp juta). Diolah di browser (parseMarketshare), disimpan sebagai bagian data "ms_K".
// DB.ms = { asof, per[{k:"yyyy-mm", l}], biz:{ konsumer|briguna|ritel|mikro|kpr: { rows[{n, kduk, t, i[], b[]}] } } }
//   i = posisi INDUSTRI per periode, b = posisi BRI per periode (pada baris peers, b = posisi kelompok bank itu); %marketshare = b / i.
const MS_BIZ = [["konsumer", "Konsumer", "KONSUMER TOTAL"], ["briguna", "Briguna Total", "SBL (RITEL + MIKRO)"], ["ritel", "Briguna Ritel", "SBL RITEL"], ["mikro", "Briguna Mikro", "SBL MIKRO"], ["kpr", "KPR", "KPR"]];
const MS_MON = ["jan", "feb", "mar", "apr", "mei|may", "jun", "jul", "agu|aug", "sep", "okt|oct", "nov", "des|dec"];
function parseMarketshare(wb, fname) {
  const nm = wb.SheetNames.find(n => /tanpa\s*ro/i.test(n)); if (!nm) return null;
  const ws = wb.Sheets[nm], rg = XLSX.utils.decode_range(ws["!ref"] || "A1"); rg.e.c = Math.min(rg.e.c, 200); rg.e.r = Math.min(rg.e.r, 600);
  const a = XLSX.utils.sheet_to_json(Object.assign({}, ws, { "!ref": XLSX.utils.encode_range(rg) }), { header: 1, raw: true, defval: null });
  const starts = []; a.forEach((r, i) => { const t = String(r && r[2] || "").trim().toUpperCase(), b = MS_BIZ.find(x => x[2] === t); if (b && r[3] != null && /industri/i.test(String(r[3]))) starts.push([i, b[0]]); });
  if (!starts.length) return null;
  const t0 = starts[0][0], hdr = a[t0], i0 = hdr.findIndex(x => /industri/i.test(String(x))), i1 = hdr.findIndex((x, k) => k > i0 && /^bri$/i.test(String(x).trim()));
  if (i0 < 0 || i1 < 0) return null;
  const n = i1 - i0, yrs = a[t0 + 1] || [], lbl = a[t0 + 2] || [], per = [];
  for (let k = 0; k < n; k++) {
    const y = +yrs[i0 + k], l = lbl[i0 + k]; let m = -1;
    if (typeof l === "number" && l > 20000) m = new Date(Math.round((l - 25569) * 864e5)).getUTCMonth();
    else m = MS_MON.findIndex(p => new RegExp("^(" + p + ")", "i").test(String(l == null ? "" : l).trim()));
    if (!y || m < 0) return null;
    per.push({ k: y + "-" + String(m + 1).padStart(2, "0"), l: BULAN[m] + "'" + String(y).slice(2) });
  }
  const num = v => typeof v === "number" && isFinite(v) ? Math.round(v * 10) / 10 : null, biz = {};
  starts.forEach(([t, key]) => {
    const rows = [];
    for (let r = t + 3; r < a.length; r++) {
      const x = a[r]; if (!x || x[2] == null || !String(x[2]).trim()) break;
      const name = String(x[2]).trim(), kduk = typeof x[1] === "number" ? x[1] : null;
      const tp = kduk != null ? "kc" : /^(urban|rural)/i.test(name) ? "zona" : /^(kanca metro|klaster)/i.test(name) ? "klaster" : /^bank/i.test(name) ? "peer" : /^ro\b/i.test(name) ? "ro" : "lain";
      rows.push({ n: name, kduk, t: tp, i: per.map((_, k) => num(x[i0 + k])), b: per.map((_, k) => num(x[i1 + k])) });
    }
    biz[key] = { rows };
  });
  const ro = (biz.konsumer || Object.values(biz)[0]).rows.find(r => r.t === "ro"), last = ro ? per.map((p, k) => ro.b[k] != null && ro.i[k] ? k : -1).filter(k => k >= 0).pop() : per.length - 1;
  return { asof: per[last >= 0 ? last : per.length - 1].k, unit: "Rp juta", per, biz, file: fname || "", updated: new Date().toISOString() };
}

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

// Admin: upload file marketshare
async function upMs(f, inp) {
  const pg = progOf("msK");
  try {
    pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
    const wb = await readWB(f); pg.set("Mengolah…"); await new Promise(r => setTimeout(r, 20));
    const data = parseMarketshare(wb, f.name);
    if (!data) throw new Error("File ini bukan data Marketshare Konsumer (butuh sheet “tanpa RO Medan” dengan blok INDUSTRI dan BRI).");
    pg.set("Mengirim ke server…");
    await Auth.call("partUpload", { name: "ms_K", data });
    await loadParts(["meta", "ms_K"], null, true);
    okCard("msK"); toast(`Marketshare posisi ${perL(data.asof)}: ${Object.keys(data.biz).length} bisnis · tersimpan.`); render(); refreshDataUI();
  } catch (er) { toast(er.message); }
  pg.done(); if (inp) inp.value = "";
}
