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
