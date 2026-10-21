/* ================= Pipeline: tabel format laporan (rencana realisasi, rekap per KC, ringkasan jadwal akad) ================= */
const BULAN_L = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const nfR = x => x ? nf0.format(Math.round(x)) : "–";
// minggu ke-n dalam bulan: minggu 1 dimulai Senin pertama bulan itu (hari sebelumnya ikut minggu 1)
const weekOf = d => { const t = new Date(d + "T00:00:00"), f = new Date(t.getFullYear(), t.getMonth(), 1), m1 = 1 + (8 - f.getDay()) % 7;
  return t.getDate() < m1 ? 1 : Math.floor((t.getDate() - m1) / 7) + 1; };
const dShort = d => +d.slice(8) + "-" + BULAN[+d.slice(5, 7) - 1];

// rencana realisasi RM: kolom per tanggal dikelompokkan per minggu + total minggu + grand total bulan
function pipeRencana(el, R0) {
  const rows = R0.rows.filter(x => (PS.area === "ALL" || kcArea(x.kc) === PS.area) && (PS.kc === "ALL" || x.kc === PS.kc) && (PS.rm === "ALL" || x.rm === PS.rm))
    .map(x => ({ kc: x.kc, rm: x.rm, v: R0.dates.map((_, i) => x.v[i] || 0) })).sort((a, b) => a.kc.localeCompare(b.kc) || a.rm.localeCompare(b.rm));
  const wk = []; R0.dates.forEach((d, i) => { const k = d.slice(0, 7) + "|" + weekOf(d), g = wk.find(w => w.k === k); g ? g.ix.push(i) : wk.push({ k, n: weekOf(d), ix: [i] }); });
  const months = uniq(R0.dates.map(d => BULAN_L[+d.slice(5, 7) - 1]));
  const ws = (r, w) => w.ix.reduce((a, i) => a + r.v[i], 0), tot = r => r.v.reduce((a, b) => a + b, 0);
  const T = { v: R0.dates.map((_, i) => sum(rows.map(r => ({ x: r.v[i] })), "x")) };
  const range = w => { const a = R0.dates[w.ix[0]], b = R0.dates[w.ix[w.ix.length - 1]]; return +a.slice(8) + (a === b ? "" : "–" + +b.slice(8)) + " " + BULAN[+b.slice(5, 7) - 1]; };
  const line = (r, cls) => `<tr${cls ? ` class="${cls}"` : ""}>${cls ? `<td colspan="2"><b>TOTAL</b></td>` : `<td>${esc(r.kc)}</td><td>${esc(r.rm)}</td>`}
    ${wk.map(w => w.ix.map(i => `<td class="r">${nfR(r.v[i])}</td>`).join("") + `<td class="r tw"><b>${nfR(ws(r, w))}</b></td>`).join("")}<td class="r gt"><b>${nfR(tot(r))}</b></td></tr>`;
  el.innerHTML = `<div class="table-wrap"><table class="kt rp"><thead>
    <tr><th rowspan="2">KANCA</th><th rowspan="2">RM (PEMRAKARSA)</th>${wk.map(w => `<th colspan="${w.ix.length + 1}" class="wk">WEEK ${w.n} (${range(w)})</th>`).join("")}<th rowspan="2" class="gt">GRAND TOTAL<br>RENCANA ${esc(months.join(" – ").toUpperCase())}</th></tr>
    <tr>${wk.map(w => w.ix.map(i => `<th class="wk">${dShort(R0.dates[i])}</th>`).join("") + `<th class="wk">TOTAL<br>W${w.n}</th>`).join("")}</tr></thead>
    <tbody>${rows.length ? rows.map(r => line(r)).join("") : `<tr><td colspan="${3 + R0.dates.length + wk.length}" class="empty">Tidak ada data yang cocok.</td></tr>`}</tbody>
    ${rows.length > 1 ? `<tfoot>${line(T, "ktl")}</tfoot>` : ""}</table></div>`;
}

// rekap per kantor cabang: per jenis (Subsidi/Komersil atau Ritel/Mikro) × tahap, debitur & plafon; grand total & per area
const RK_ST = [["On Hand", [0], "oh"], ["Dalam Prakarsa", [1], "yl"], ["Dalam Proses Rekomen", [2], "yl"], ["Proses Penilaian Agunan", [3], "yl"], ["Proses Analis", [4], "yl"],
  ["Menunggu Putusan Kredit", [5], "rd"], ["Putus & Siap Cair", [6, 7], "rd"]];
// urutan kanca mengikuti master (per area); kanca di luar master di akhir
const kcOrd = kc => { const u = kcByName(kc), i = u ? KC_MASTER.indexOf(u) : -1; return i < 0 ? 999 : i; };
function pipeKcRekap(el, aktif) {
  // tahap Rekomen & Penilaian Agunan selalu tampil untuk Komersil; jenis lain hanya bila ada berkasnya (mis. Subsidi KPR tidak)
  const grp = PL.j.map(j => { const a = aktif.filter(x => x.jenis === j);
    return { j, a, st: RK_ST.filter(s => !(s[1][0] === 2 || s[1][0] === 3) || j === "Komersil" || a.some(x => s[1].includes(x.tahap))) }; });
  const cells = a => grp.map(g => g.st.map(s => { const b = a.filter(x => x.jenis === g.j && s[1].includes(x.tahap)); return `<td class="r">${nfR(b.length)}</td><td class="r">${nfR(sum(b, "plafon"))}</td>`; }).join("")).join("")
    + `<td class="r"><b>${nfR(a.length)}</b></td><td class="r"><b>${nfR(sum(a, "plafon"))}</b></td>`;
  const kcs = uniq(aktif.map(x => x.kc)).map(kc => ({ kc, a: aktif.filter(x => x.kc === kc) })).sort((x, y) => kcOrd(x.kc) - kcOrd(y.kc) || x.kc.localeCompare(y.kc));
  const areas = uniq(aktif.map(x => x.area || "")).filter(Boolean).sort();
  el.innerHTML = `<div class="table-wrap"><table class="kt rk"><thead>
    <tr><th rowspan="3">KANTOR CABANG</th>${grp.map(g => `<th colspan="${g.st.length * 2}" class="sb">${esc(g.j.toUpperCase())}</th>`).join("")}<th colspan="2" rowspan="2" class="nv">TOTAL</th></tr>
    <tr>${grp.map(g => g.st.map(s => `<th colspan="2" class="${s[2]}">${s[0]}</th>`).join("")).join("")}</tr>
    <tr>${grp.map(g => g.st.map(() => `<th class="lt">Deb</th><th class="lt">Plafon</th>`).join("")).join("")}<th class="nv">Deb</th><th class="nv">Plafon</th></tr></thead>
    <tbody>${kcs.length ? kcs.map(k => `<tr><td><b>${esc(k.kc)}</b></td>${cells(k.a)}</tr>`).join("") : `<tr><td colspan="99" class="empty">Tidak ada data yang cocok.</td></tr>`}</tbody>
    ${kcs.length ? `<tfoot><tr class="knv"><td>GRAND TOTAL</td>${cells(aktif)}</tr>${areas.length > 1 ? areas.map(ar => `<tr class="knv"><td>${esc(ar.replace(/\s*\/\s*/, "/"))}</td>${cells(aktif.filter(x => x.area === ar))}</tr>`).join("") : ""}</tfoot>` : ""}</table></div>`;
}

// pilihan ceklis (bisa lebih dari satu): PS[key] = nilai terpilih; kosong = semua. opts = [[nilai, label, jumlah deb]]
function msPicker(el, key, opts, allLbl, short, onChange) {
  const lbl = () => { const v = PS[key]; return !v.length ? allLbl : v.length <= 2 ? v.map(x => short(x)).join(", ") : v.length + " dipilih"; };
  el.innerHTML = `<details class="ms"><summary class="ctl">${esc(lbl())}</summary><div class="ms-pop">
    ${opts.length ? opts.map(([v, l, n]) => `<label class="check"><input type="checkbox" value="${esc(v)}" ${PS[key].includes(v) ? "checked" : ""}> ${l}${n != null ? ` <small class="note">${nf0.format(n)} deb</small>` : ""}</label>`).join("") : '<span class="note">Belum ada pilihan.</span>'}
    <div class="toolbar"><button class="btn" type="button" data-ms="all">Pilih semua</button><button class="btn" type="button" data-ms="clr">Hapus pilihan</button></div></div></details>`;
  const set = v => { PS[key] = v; el.querySelector("summary").textContent = lbl(); onChange(); };
  const order = opts.map(o => o[0]);
  el.querySelectorAll("input").forEach(i => i.onchange = () => set([...el.querySelectorAll("input:checked")].map(x => x.value).sort((a, b) => order.indexOf(a) - order.indexOf(b))));
  el.querySelectorAll("[data-ms]").forEach(b => b.onclick = () => { const on = b.dataset.ms === "all"; el.querySelectorAll("input").forEach(i => i.checked = on); set(on ? [...order] : []); });
}
// saringan Proses (HOT/WARM/COLD/BATAL) dan Jenis di daftar pipeline. Tanpa pilihan: semua berkas aktif (batal tidak ikut);
// BATAL dicentang: berkas batal ikut tampil (hanya batal bila tidak ada HOT/WARM/COLD yang dicentang)
const prosesIn = x => { const v = PS.prosesM, hwc = v.filter(p => p !== "BATAL");
  return !v.length ? !x.batal : x.batal ? v.includes("BATAL") : hwc.includes(x.proses); };
const jenisIn = x => !PS.jenisM.length || PS.jenisM.includes(x.jenis);
document.addEventListener("click", e => document.querySelectorAll("details.ms[open]").forEach(d => { if (!d.contains(e.target)) d.open = false; }));

// ringkasan debitur pada jadwal akad terpilih
function pipeAkadSum(el, rows) {
  if (!PS.akad.length) { el.innerHTML = ""; el.hidden = true; return; }
  const a = rows.filter(x => x.akad && PS.akad.includes(x.akad)).sort((x, y) => x.kc.localeCompare(y.kc) || (x.rm || "").localeCompare(y.rm || "") || x.debitur.localeCompare(y.debitur));
  const multi = PS.akad.length > 1, nom = x => (x.pengajuan || x.plafon || 0) * 1e6, rp = x => "Rp " + nf0.format(Math.round(x));
  const hari = h => h == null ? "–" : nf1.format(h / 24) + " hari";
  el.hidden = false;
  el.innerHTML = `<div class="panel-h"><h2>Jadwal akad ${esc(PS.akad.map(d => tglS(d)).join(", "))} (${nf0.format(a.length)} debitur)</h2></div>
    <div class="table-wrap"><table class="kt as"><thead><tr><th>CABANG</th><th>NAMA DEBITUR</th><th>NAMA PEMRAKARSA</th>${multi ? "<th>JADWAL AKAD</th>" : ""}<th>JENIS PUTUSAN</th><th>TAT UKER</th><th>STATUS</th><th class="r">NOMINAL PENGAJUAN</th></tr></thead>
    <tbody>${a.length ? a.map(x => `<tr><td>${esc(x.kc)}</td><td>${esc(x.debitur)}</td><td>${esc(x.rm || "")}</td>${multi ? `<td>${tglS(x.akad)}</td>` : ""}<td>${esc(x.putusan || "–")}</td><td>${hari(x.tatUker)}</td><td>${esc(x.status || PTAHAP[x.tahap] || "")}</td><td class="r">${rp(nom(x))}</td></tr>`).join("")
      : `<tr><td colspan="${multi ? 8 : 7}" class="empty">Tidak ada debitur pada jadwal akad terpilih dengan saringan saat ini.</td></tr>`}</tbody>
    <tfoot><tr class="knv"><td colspan="${multi ? 7 : 6}">Jumlah Debitur: ${nf0.format(a.length)}</td><td class="r">${rp(sum(a.map(x => ({ v: nom(x) })), "v"))}</td></tr></tfoot></table></div>`;
}
