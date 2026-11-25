/* ================= Portofolio Eksisting Briguna (Ritel + Mikro): instansi per uker, % kualitas SML & NPL berwarna, tombol PKS ================= */
// Sumber: sheet "database instansi" di Google Sheets (dibaca Apps Script saat Sync portofolio), nominal Rp juta.
// DB.ins = { asof, cab[[kode, nama]], uker[[kode, nama, cabIdx, 0 = kantor cabang (Ritel) · 1 = unit (Mikro)]], ins[[id, nama]], rows[[ukerIdx, insIdx, deb, os, sml, npl]], pks{ rowIdx: [jenis, no, jatuhTempo, payroll, pegawai] } }
// Batas warna % SML / NPL: hijau di bawah batas pertama, kuning sampai batas kedua, merah di atasnya; default 1% dan 2%, diubah admin (meta.cfg.insThr).
const PFX = Object.assign({ kc: "ALL", uk: "ALL", jn: "ALL", q: "" }, lsGet(STORE + "-pf") || {});
const savePFX = () => lsSet(STORE + "-pf", PFX);
const insThr = () => { const c = (DB.meta && DB.meta.cfg && DB.meta.cfg.insThr) || {}; return { sml: Array.isArray(c.sml) ? c.sml : [1, 2], npl: Array.isArray(c.npl) ? c.npl : [1, 2] }; };
const insCls = (v, th) => v == null ? "neutral" : v * 100 < th[0] ? "good" : v * 100 <= th[1] ? "warn" : "crit";
const insChip = (v, th) => v == null ? "–" : chip(pct(v, 2), insCls(v, th));
const nfTh = x => nf2.format(x).replace(/,00$/, "").replace(/(,\d)0$/, "$1");
const jenisUker = u => u[3] ? "Mikro (unit)" : "Ritel (kantor cabang)";

function pfAgg(rows, keyOf) {   // jumlahkan baris per kunci (instansi atau uker)
  const m = new Map();
  rows.forEach(([ri, r]) => { const k = keyOf(r), o = m.get(k) || { k, deb: 0, os: 0, sml: 0, npl: 0, ri: [] }; o.deb += r[2]; o.os += r[3]; o.sml += r[4]; o.npl += r[5]; o.ri.push(ri); m.set(k, o); });
  return [...m.values()].map(o => ({ ...o, psml: o.os ? o.sml / o.os : null, pnpl: o.os ? o.npl / o.os : null }));
}
function viewPortofolio(v) {
  const D = DB.ins;
  if (!D) { v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data portofolio eksisting</p>${isAdmin() ? "Buat sheet <code>database instansi</code> di Google Sheets (dari file Database_instansi.xlsx), lalu klik <b>Sync portofolio</b> di Admin → Kelola data." : "Hubungi admin untuk memuat data portofolio."}</div></section>`; return; }
  const th = insThr(), cabs = D.cab.map((c, i) => ({ i, kode: c[0], nama: c[1] })).sort((a, b) => a.nama.localeCompare(b.nama));
  if (PFX.kc !== "ALL" && !D.cab[+PFX.kc]) PFX.kc = "ALL";
  const ukers = D.uker.map((u, i) => ({ i, kode: u[0], nama: u[1], cab: u[2], unit: u[3] })).filter(u => PFX.kc === "ALL" || u.cab === +PFX.kc).sort((a, b) => a.unit - b.unit || a.nama.localeCompare(b.nama));
  if (PFX.uk !== "ALL" && !ukers.some(u => String(u.i) === PFX.uk)) PFX.uk = "ALL";
  const okU = D.uker.map((u, i) => (PFX.kc === "ALL" || u[2] === +PFX.kc) && (PFX.uk === "ALL" || String(i) === PFX.uk) && (PFX.jn === "ALL" || (PFX.jn === "ritel" ? !u[3] : !!u[3])));
  const scoped = D.rows.map((r, ri) => [ri, r]).filter(([, r]) => okU[r[0]]);
  const q = PFX.q.trim().toLowerCase();
  const insRows = pfAgg(scoped, r => r[1]).map(o => ({ ...o, id: D.ins[o.k][0], nama: D.ins[o.k][1], npks: o.ri.filter(ri => D.pks[ri]).length })).filter(o => !q || (o.nama + " " + o.id).toLowerCase().includes(q));
  const T = { deb: 0, os: 0, sml: 0, npl: 0 }; scoped.forEach(([, r]) => { T.deb += r[2]; T.os += r[3]; T.sml += r[4]; T.npl += r[5]; });
  const tp = { sml: T.os ? T.sml / T.os : null, npl: T.os ? T.npl / T.os : null };
  const scopeL = PFX.uk !== "ALL" ? D.uker[+PFX.uk][1] : PFX.kc !== "ALL" ? D.cab[+PFX.kc][1] : "Seluruh RO Medan";
  const optKc = `<option value="ALL">Semua kantor cabang</option>` + cabs.map(c => `<option value="${c.i}" ${String(c.i) === PFX.kc ? "selected" : ""}>${esc(c.nama)}</option>`).join("");
  const optUk = `<option value="ALL">Semua uker${PFX.kc !== "ALL" ? " di cabang ini" : ""}</option>` + ukers.map(u => `<option value="${u.i}" ${String(u.i) === PFX.uk ? "selected" : ""}>${u.unit ? "" : "★ "}${esc(u.nama)}${u.unit ? "" : " (kantor cabang · Ritel)"}</option>`).join("");
  const rule = k => `hijau &lt; ${nfTh(th[k][0])}% · kuning ${nfTh(th[k][0])}–${nfTh(th[k][1])}% · merah &gt; ${nfTh(th[k][1])}%`;
  v.innerHTML = `
    <section class="panel" style="padding:12px 16px">
      <div class="toolbar">
        <label class="field" style="flex:1 1 220px"><span class="note" style="font-weight:700">Kantor cabang</span><select class="ctl" id="pfKc">${optKc}</select></label>
        <label class="field" style="flex:1 1 260px"><span class="note" style="font-weight:700">Uker</span><select class="ctl" id="pfUk">${optUk}</select></label>
        <label class="field" style="flex:1 1 190px"><span class="note" style="font-weight:700">Jenis</span><select class="ctl" id="pfJn"><option value="ALL">Briguna Ritel + Mikro</option><option value="ritel" ${PFX.jn === "ritel" ? "selected" : ""}>Briguna Ritel (kantor cabang)</option><option value="mikro" ${PFX.jn === "mikro" ? "selected" : ""}>Briguna Mikro (unit)</option></select></label>
        <label class="field" style="flex:1 1 200px"><span class="note" style="font-weight:700">Cari instansi</span><input class="ctl" type="search" id="pfQ" value="${esc(PFX.q)}" placeholder="nama atau ID instansi"></label>
      </div>
      <p class="note" style="margin:0">${esc(scopeL)} · posisi ${D.asof ? perL(D.asof) : "–"} · nominal Rp juta · % kualitas = SML (atau NPL) ÷ OS instansi ·
        <b>%SML</b>: ${rule("sml")} · <b>%NPL</b>: ${rule("npl")}${isAdmin() ? ` · <button type="button" class="linkish" id="pfThr">Atur batas warna</button>` : ""}</p>
    </section>
    <div class="grid tiles">
      ${tile({ label: "Instansi", value: nf0.format(insRows.length), sub: q ? "hasil pencarian" : "dalam cakupan terpilih" })}
      ${tile({ label: "Debitur", value: nf0.format(T.deb), sub: "Briguna " + (PFX.jn === "ritel" ? "Ritel" : PFX.jn === "mikro" ? "Mikro" : "Ritel + Mikro") })}
      ${tile({ label: "OS", value: rpM(T.os), sub: "baki debet" })}
      ${tile({ label: "% SML", value: insChip(tp.sml, th.sml), sub: `${rpM(T.sml)} dari OS` })}
      ${tile({ label: "% NPL", value: insChip(tp.npl, th.npl), sub: `${rpM(T.npl)} dari OS` })}
    </div>
    <section class="panel"><div class="panel-h"><h2>Kualitas per uker</h2><span class="sub">klik nama uker untuk melihat instansinya</span></div><div id="pfUkT"></div></section>
    <section class="panel"><div class="panel-h"><h2>Instansi di ${esc(scopeL)}</h2><span class="sub">warna mengikuti batas % SML / NPL · tombol PKS menampilkan data kerja sama</span></div><div id="pfInT"></div></section>`;
  const go = () => { savePFX(); render(); };
  $("#pfKc").onchange = e => { PFX.kc = e.target.value; PFX.uk = "ALL"; go(); };
  $("#pfUk").onchange = e => { PFX.uk = e.target.value; go(); };
  $("#pfJn").onchange = e => { PFX.jn = e.target.value; go(); };
  let qt; $("#pfQ").oninput = e => { clearTimeout(qt); qt = setTimeout(() => { PFX.q = e.target.value; savePFX(); render(); const el = $("#pfQ"); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 350); };
  if ($("#pfThr")) $("#pfThr").onclick = openInsThr;
  // per uker (semua uker dalam cakupan kantor cabang / jenis terpilih, tanpa menyaring uker)
  const scopedU = D.rows.map((r, ri) => [ri, r]).filter(([, r]) => { const u = D.uker[r[0]]; return (PFX.kc === "ALL" || u[2] === +PFX.kc) && (PFX.jn === "ALL" || (PFX.jn === "ritel" ? !u[3] : !!u[3])); });
  const ukRows = pfAgg(scopedU, r => r[0]).map(o => ({ ...o, nama: D.uker[o.k][1], kode: D.uker[o.k][0], unit: D.uker[o.k][3], kc: D.cab[D.uker[o.k][2]][1], nIns: new Set(o.ri.map(ri => D.rows[ri][1])).size }));
  table($("#pfUkT"), [{ key: "nama", label: "Uker", fmt: (x, r) => `<button class="linkish" data-uk="${r.k}">${esc(x)}</button><br><small class="note">${r.kode} · ${esc(jenisUker(D.uker[r.k]))}${PFX.kc === "ALL" ? " · " + esc(r.kc) : ""}</small>` },
    { key: "nIns", label: "Instansi", r: 1, fmt: x => nf0.format(x) }, { key: "deb", label: "Debitur", r: 1, fmt: x => nf0.format(x) }, { key: "os", label: "OS (Rp juta)", r: 1, fmt: x => nf0.format(x) },
    { key: "psml", label: "% SML", r: 1, sortVal: r => r.psml ?? -1, fmt: x => insChip(x, th.sml) }, { key: "pnpl", label: "% NPL", r: 1, sortVal: r => r.pnpl ?? -1, fmt: x => insChip(x, th.npl) },
    { key: "sml", label: "SML (Rp juta)", r: 1, fmt: x => nf0.format(x) }, { key: "npl", label: "NPL (Rp juta)", r: 1, fmt: x => nf0.format(x) }], ukRows,
    { sortKey: "os", page: 15, after: el => el.querySelectorAll("[data-uk]").forEach(b => b.onclick = () => { PFX.uk = b.dataset.uk; PFX.kc = String(D.uker[+b.dataset.uk][2]); go(); window.scrollTo(0, 0); }) });
  // instansi
  table($("#pfInT"), [{ key: "nama", label: "Instansi", fmt: (x, r) => `<b>${esc(x)}</b>${r.id ? `<br><small class="note">${esc(r.id)}</small>` : ""}` },
    { key: "deb", label: "Debitur", r: 1, fmt: x => nf0.format(x) }, { key: "os", label: "OS (Rp juta)", r: 1, fmt: x => nf0.format(x) }, { key: "sh", label: "% dari OS", r: 1, sortVal: r => r.os, fmt: (x, r) => pct(T.os ? r.os / T.os : 0, 1) },
    { key: "psml", label: "% SML", r: 1, sortVal: r => r.psml ?? -1, fmt: x => insChip(x, th.sml) }, { key: "pnpl", label: "% NPL", r: 1, sortVal: r => r.pnpl ?? -1, fmt: x => insChip(x, th.npl) },
    { key: "sml", label: "SML (Rp juta)", r: 1, fmt: x => nf0.format(x) }, { key: "npl", label: "NPL (Rp juta)", r: 1, fmt: x => nf0.format(x) },
    { key: "npks", label: "PKS", nosort: 1, fmt: (x, r) => `<button class="btn" type="button" data-pks="${r.k}">PKS${x ? ` <small>(${x})</small>` : ""}</button>` }], insRows,
    { sortKey: "os", page: 25, foot: insRows.length > 1 ? { nama: "Total", deb: nf0.format(T.deb), os: nf0.format(T.os), sh: "100%", psml: insChip(tp.sml, th.sml), pnpl: insChip(tp.npl, th.npl), sml: nf0.format(T.sml), npl: nf0.format(T.npl), npks: "" } : null,
      after: el => el.querySelectorAll("[data-pks]").forEach(b => b.onclick = () => openPks(+b.dataset.pks, scoped)) });
}
// PKS instansi: kolom Jenis PKS, No PKS, Tanggal Jatuh Tempo, Payroll / Non-Payroll, Jumlah Pegawai (+ penetrasi debitur terhadap pegawai) per uker
function openPks(ii, scoped) {
  const D = DB.ins, inScope = new Set(scoped.map(([ri]) => ri)), mine = D.rows.map((r, ri) => [ri, r]).filter(([, r]) => r[1] === ii);
  const withP = mine.filter(([ri]) => D.pks[ri]).sort((a, b) => (inScope.has(b[0]) ? 1 : 0) - (inScope.has(a[0]) ? 1 : 0) || D.uker[a[1][0]][1].localeCompare(D.uker[b[1][0]][1]));
  const dueCls = t => { if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ""; const d = (new Date(t) - new Date(new Date().toISOString().slice(0, 10))) / 864e5; return d < 0 ? "crit" : d <= 90 ? "warn" : "good"; };
  const tg = t => /^\d{4}-\d{2}-\d{2}$/.test(t) ? tglS(t) : (t || "–");
  $("#dlgTitle").textContent = "PKS · " + D.ins[ii][1];
  $("#dlgBody").innerHTML = `<p class="note" style="margin:0 0 8px">${esc(D.ins[ii][0] || "")}${D.ins[ii][0] ? " · " : ""}${nf0.format(mine.length)} uker memiliki debitur instansi ini · ${nf0.format(withP.length)} uker ada data PKS${inScope.size && withP.some(([ri]) => inScope.has(ri)) ? " · uker dalam cakupan terpilih ditampilkan lebih dulu" : ""}</p>
    ${withP.length ? `<div class="table-wrap"><table class="kt"><thead><tr><th>Uker</th><th>Jenis PKS</th><th>No PKS</th><th>Tanggal jatuh tempo</th><th>Payroll / Non-Payroll</th><th class="r">Jumlah pegawai</th><th class="r">Debitur</th><th class="r">Penetrasi</th></tr></thead>
      <tbody>${withP.map(([ri, r]) => { const p = D.pks[ri], u = D.uker[r[0]], pen = p[4] ? r[2] / p[4] : null; return `<tr${inScope.has(ri) ? "" : ' style="opacity:.75"'}><td>${esc(u[1])}<br><small class="note">${esc(D.cab[u[2]][1])}</small></td><td>${esc(p[0] || "–")}</td><td>${esc(p[1] || "–")}</td>
        <td>${dueCls(p[2]) ? chip(tg(p[2]), dueCls(p[2])) : esc(tg(p[2]))}</td><td>${esc(p[3] || "–")}</td><td class="r">${p[4] == null ? "–" : nf0.format(p[4])}</td><td class="r">${nf0.format(r[2])}</td><td class="r">${pen == null ? "–" : pct(pen, 1)}</td></tr>`; }).join("")}</tbody></table></div>
      <p class="note" style="margin:8px 0 0">Penetrasi = debitur Briguna ÷ jumlah pegawai · tanggal jatuh tempo: merah = sudah lewat, kuning = ≤ 90 hari.</p>`
      : `<div class="empty"><p style="font-weight:700;margin:0 0 6px">Belum ada data PKS untuk instansi ini</p>Isi kolom <b>Jenis PKS, No PKS, Tanggal Jatuh Tempo PKS, Payroll/Non Payroll, Jumlah Pegawai</b> pada sheet <code>database instansi</code>, lalu klik Sync portofolio.</div>`}
    <div class="toolbar"><button class="btn" type="button" data-close>Tutup</button></div>`;
  $("#dlg").showModal();
}
// admin: atur batas warna % SML dan % NPL
function openInsThr() {
  const th = insThr(); $("#dlgTitle").textContent = "Batas warna % kualitas";
  const f = (id, l, val) => `<div class="field"><label for="${id}">${l}</label><input class="ctl" id="${id}" type="number" step="0.1" min="0" max="100" value="${val}"></div>`;
  $("#dlgBody").innerHTML = `<form id="thrForm" class="form" novalidate><p class="note full" style="margin:0">Hijau bila persentase di bawah batas pertama, kuning sampai batas kedua (termasuk), merah di atas batas kedua. Berlaku untuk semua pengguna.</p>
    ${f("thSa", "%SML hijau di bawah (%)", th.sml[0])}${f("thSb", "%SML merah di atas (%)", th.sml[1])}${f("thNa", "%NPL hijau di bawah (%)", th.npl[0])}${f("thNb", "%NPL merah di atas (%)", th.npl[1])}
    <div class="toolbar full"><button class="btn primary" type="submit">Simpan</button><button class="btn" type="button" id="thDef">Kembalikan 1% / 2%</button><button class="btn" type="button" data-close>Batal</button></div><p id="thErr" class="lg-msg full" hidden></p></form>`;
  $("#thDef").onclick = () => { ["thSa", "thNa"].forEach(i => $("#" + i).value = 1); ["thSb", "thNb"].forEach(i => $("#" + i).value = 2); };
  $("#thrForm").onsubmit = async e => {
    e.preventDefault(); const n = i => parseFloat(String($("#" + i).value).replace(",", ".")), v = { sml: [n("thSa"), n("thSb")], npl: [n("thNa"), n("thNb")] }, err = $("#thErr");
    if ([...v.sml, ...v.npl].some(x => !isFinite(x) || x < 0 || x > 100) || v.sml[0] > v.sml[1] || v.npl[0] > v.npl[1]) { err.hidden = false; err.textContent = "Isi angka 0–100 dan batas hijau tidak boleh lebih besar dari batas merah."; return; }
    try { await Auth.call("configSave", { key: "insThr", value: v }); await loadParts(["meta"], null, true); $("#dlg").close(); toast("Batas warna disimpan."); render(); }
    catch (er) { err.hidden = false; err.textContent = /tidak dikenal/i.test(er.message) ? "Server belum mendukung pengaturan ini. Pasang Apps Script versi terbaru." : er.message; }
  };
  $("#dlg").showModal();
}
