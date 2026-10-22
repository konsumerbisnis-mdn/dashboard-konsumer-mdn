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
    o.rm = x.rm; o.kc = x.kc; o.jg = x.jg || o.jg; o.area = x.area || o.area; if (x.tDisb > 0) { o.t += x.tDisb; o.hasT = true; }
    if (x.pd) { o.pd = o.pd || {}; for (const pr in x.pd) { const a = o.pd[pr] || (o.pd[pr] = [0, 0, 0, 0]); x.pd[pr].forEach((v, i) => a[i] += v); } } meta.set(k, o); }));
  const tx = P.tx.filter(t => t.d >= from && t.d <= to), hasPr = P.tx.some(t => t.pr), usePd = !hasPr && !custom && P.months.some(x => x.pd), all = RS.area === "ALL" && RS.kc === "ALL", agg = new Map();
  tx.forEach(t => { const k = key(t.rm); if (!meta.has(k)) { if (!all) return; meta.set(k, { rm: t.rm, kc: t.kc, jg: "", area: kcArea(t.kc), t: 0, hasT: false }); }
    const o = agg.get(k) || { deb: 0, os: 0, p: {} }; o.deb += t.deb; o.os += t.pl;
    if (t.pr) { const a = o.p[t.pr] || (o.p[t.pr] = [0, 0, 0, 0]), i = t.jenis === "Suplesi" ? 2 : 0; a[i] += t.deb; a[i + 1] += t.pl; } agg.set(k, o); });
  const rows = [...meta.entries()].map(([k, m]) => { const a = agg.get(k) || { deb: 0, os: 0, p: {} }, pen = m.hasT ? a.os / m.t : null;
    return { ...m, deb: a.deb, os: a.os, g: pr => (hasPr ? a.p[pr] : usePd ? m.pd && m.pd[pr] : null) || [0, 0, 0, 0], pen, gap: m.hasT ? a.os - m.t : null }; })
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
  el.innerHTML = head + (hasPr ? "" : `<p class="note" style="margin:0"><b>Rincian produk (Karya / Pra-Purna / Purna) ${usePd ? "memakai data lama server (hanya per bulan penuh)" : "belum tersedia dari server"}.</b> Pasang Apps Script versi terbaru, lalu admin menekan <b>Sync produktivitas</b>${isM ? " (Mikro baru ada rinciannya setelah itu)" : ""}.${custom && !usePd ? " Rentang khusus butuh versi terbaru." : ""}</p>`) + `
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
