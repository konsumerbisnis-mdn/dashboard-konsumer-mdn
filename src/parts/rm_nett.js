/* ================= Produktivitas Nett RM Briguna Ritel: tabel format laporan (produk × baru/suplesi, target JG, kuadran) ================= */
// months[].pd = { KA: Karya, PP: Pra-Purna, PU: Purna } → [Deb Baru, OS Baru, Deb Suplesi, OS Suplesi] (dari Apps Script, Rp juta)
const NETT_PROD = [["KA", "Karya", "ka"], ["PP", "Pra-Purna", "pp"], ["PU", "Purna", "pu"]];
const nettPeriode = (ym, isCur, asof) => {
  const y = ym.slice(0, 4), m = +ym.slice(5, 7) - 1, last = isCur ? +asof.slice(8) : new Date(+y, m + 1, 0).getDate();
  return `1 ${BULAN[m]} sd ${last} ${BULAN_L[m]} ${y}`;
};
function renderRmNett({ P, inScope, ym, isCur }) {
  const el = $("#rNett"); if (!el) return;
  const nz = x => x ? nf0.format(Math.round(x)) : "–";
  const gapF = x => x == null ? "–" : x < 0 ? `<span class="ng">(${nf0.format(Math.round(-x))})</span>` : nf0.format(Math.round(x));
  const src = P.months.filter(x => x.ym === ym && inScope(x));
  const rows = src.map(x => { const pd = x.pd || {}, g = k => pd[k] || [0, 0, 0, 0], hasT = x.tDisb > 0, pen = hasT ? x.os / x.tDisb : null;
    return { x, g, area: x.area, hasT, pen, gap: hasT ? x.os - x.tDisb : null }; })
    .sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.x.os - a.x.os || a.x.rm.localeCompare(b.x.rm));
  const periode = nettPeriode(ym, isCur, P.asof);
  const hasPd = src.some(x => x.pd);
  const head = `<div class="panel-h"><h2>Produktivitas Nett RM Briguna Ritel</h2><span class="sub">${periode} · Rp juta</span></div>`;
  if (!rows.length) { el.innerHTML = head + `<div class="empty">Tidak ada RM pada filter ini.</div>`; return; }
  const cell = r => `<td class="r">${nz(r.deb)}</td><td class="r">${nz(r.os)}</td>`;
  const sumPd = (rs, k, i) => rs.reduce((a, r) => a + r.g(k)[i], 0);
  const prodCells = (rs, one) => NETT_PROD.map(([k]) => [0, 1, 2, 3].map(i => `<td class="r">${nz(one ? one.g(k)[i] : sumPd(rs, k, i))}</td>`).join("")).join("");
  const tot = rs => { const tg = rs.filter(r => r.hasT), os = sum(rs.map(r => r.x), "os"), t = sum(tg.map(r => r.x), "tDisb");
    return { deb: sum(rs.map(r => r.x), "deb"), os, t, gap: tg.reduce((a, r) => a + r.gap, 0), pen: t ? os / t : null }; };
  const pctCell = (pen, cls) => pen == null ? `<td class="r">–</td>` : `<td class="r np ${cls}">${pct(pen, 2)}</td>`;
  const kuadCell = pen => { const k = kuadOf(pen); return k ? `<td class="nk">Kuadran ${k}</td>` : `<td class="nk">–</td>`; };
  const sumLine = (label, rs, cls) => { const t = tot(rs); return `<tr class="${cls}"><td colspan="4"><b>${esc(label)}</b></td>${prodCells(rs)}<td class="r">${nz(t.deb)}</td><td class="r">${nz(t.os)}</td>
    <td class="r">${nz(t.t)}</td><td class="r">${t.t ? gapF(t.gap) : "–"}</td>${pctCell(t.pen, "k" + (kuadOf(t.pen) || 0))}<td class="nk"></td></tr>`; };
  const areas = uniq(rows.map(r => r.area)).filter(Boolean).sort();
  const aLbl = a => String(a).split("/")[0].trim().toUpperCase();
  el.innerHTML = head + (hasPd ? "" : `<p class="note" style="margin:0"><b>Rincian produk (Karya / Pra-Purna / Purna) belum tersedia dari server.</b> Pasang Apps Script versi terbaru, lalu admin menekan <b>Sync produktivitas</b> di Admin → Kelola data.</p>`) + `
    <div class="table-wrap"><table class="kt nett"><thead>
      <tr><th rowspan="4">No</th><th rowspan="4">Kanca</th><th rowspan="4">Nama RM</th><th rowspan="4">JG RM</th>
        <th colspan="12" class="nt">PRODUKTIVITAS NETT RM BRIGUNA RITEL - ${periode}</th>
        <th colspan="2" rowspan="3" class="nt">TOTAL NETT DISBURSE<br>${periode}</th><th colspan="2" rowspan="2" class="nt">TARGET<br>${periode}</th><th rowspan="4" class="nt">Pencapaian<br>Target JG</th><th rowspan="4" class="nt">Kuadran</th></tr>
      <tr>${NETT_PROD.map(([, l, c]) => `<th colspan="4" class="np-${c}">${l}</th>`).join("")}</tr>
      <tr>${NETT_PROD.map(([, , c]) => ["Baru", "Suplesi"].map(j => `<th colspan="2" class="np-${c} s">${j}</th>`).join("")).join("")}
        <th rowspan="2" class="nt">Target JG</th><th rowspan="2" class="nt">GAP Target JG</th></tr>
      <tr>${NETT_PROD.map(([, , c]) => ["Deb", "OS", "Deb", "OS"].map(h => `<th class="np-${c} s">${h}</th>`).join("")).join("")}<th class="nt">Deb</th><th class="nt">Os</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr><td class="r">${i + 1}</td><td>${esc(r.x.kc)}</td><td>${esc(r.x.rm)}</td><td class="c">${esc(r.x.jg || "")}</td>${prodCells(null, r)}
      <td class="r tb">${nz(r.x.deb)}</td><td class="r tb">${nz(r.x.os)}</td><td class="r">${r.hasT ? nz(r.x.tDisb) : "–"}</td><td class="r tg">${gapF(r.gap)}</td>
      ${pctCell(r.pen ?? (r.x.os ? null : 0), "k" + (kuadOf(r.pen) || 4))}${kuadCell(r.pen)}</tr>`).join("")}</tbody>
    <tfoot>${sumLine("Grand Total", rows, "knv")}${areas.length > 1 ? areas.map(a => sumLine(aLbl(a), rows.filter(r => r.area === a), "knv a")).join("") : ""}</tfoot></table></div>
    <p class="note" style="margin:0">Net disburse = Delta Suplesi (Rp juta) · Karya = Kretap, Purna = Kresun, Pra-Purna = Umum · GAP = realisasi − Target JG · kuadran: K1 ≥105%, K2 100–105%, K3 50–100%, K4 &lt;50%.</p>`;
}
