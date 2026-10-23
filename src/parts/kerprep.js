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
    const gp = (a, r, low) => `<td class="r">${r == null ? "–" : fd(a - r, low)}</td>`;   // gap thd RKA = aktual − RKA
    const rows = HL_SEG.map(([p, l]) => ({ p, l, c: calc(p) }));
    const tr = x => { const c = x.c, cu = c.cur, rk = c.rk || {};
      return `<tr class="${x.p === "konsumer" ? "ktot" : ""}"><td class="sk1" style="left:0"><b>${x.l}</b></td><td class="r">${nf0.format(cu.os)}</td>${pc(capUp(cu.os, rk.os))}${gp(cu.os, rk.os)}<td class="r">${fd(c.pm ? cu.os - c.pm.os : null)}</td><td class="r">${fd(c.py ? cu.os - c.py.os : null)}</td>`
        + `<td class="r">${nf0.format(cu.sml)}</td><td class="r">${pct(cu.psml, 2)}</td>${pc(capLo(cu.sml, rk.sml))}${gp(cu.sml, rk.sml, 1)}<td class="r">${fd(c.pm ? cu.sml - c.pm.sml : null, 1)}</td>`
        + `<td class="r">${nf0.format(cu.npl)}</td><td class="r">${pct(cu.pnpl, 2)}</td>${pc(capLo(cu.npl, rk.npl))}${gp(cu.npl, rk.npl, 1)}<td class="r">${fd(c.pm ? cu.npl - c.pm.npl : null, 1)}</td>`
        + `<td class="r">${nf0.format(cu.deb)}</td>${pc(capUp(cu.deb, rk.deb))}</tr>`; };
    html = `<div class="table-wrap"><table class="kt"><thead><tr><th rowspan="2" class="sk1" style="left:0">Segmen</th><th colspan="5">OS</th><th colspan="5">SML</th><th colspan="5">NPL</th><th colspan="2">Debitur</th></tr>
      <tr><th>Posisi</th><th>%Penc ${BULAN[+d.slice(5, 7) - 1]}</th><th>Gap thd RKA</th><th>MtD</th><th>YtD</th><th>Nominal</th><th>%</th><th>%Penc</th><th>Gap thd RKA</th><th>MtD</th><th>Nominal</th><th>%</th><th>%Penc</th><th>Gap thd RKA</th><th>MtD</th><th>Posisi</th><th>%Penc</th></tr></thead>
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
  return html + `<p class="note" style="margin:8px 0 0">Nominal Rp juta · %Penc OS & Debitur = aktual ÷ RKA, SML & NPL = RKA ÷ aktual (maks. 120%) · Gap thd RKA = aktual − RKA · warna: hijau ≥100%, kuning 95–100%, merah &lt;95% · angka dalam kurung = minus · Total Konsumer = Briguna Ritel + Briguna Mikro + KPR${mode !== "ro" ? " · TOTAL tanpa RO Medan" : ""}.</p>`;
}
