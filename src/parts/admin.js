/* ================= ADMIN: kelola data (upload), user, access log ================= */
const ICO_UP = '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v4h16v-4"/></svg>';
const dIco = p => `<span class="dc-ico"><svg viewBox="0 0 24 24">${p}</svg></span>`;
const updS = iso => iso ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–";
function dataCards() {
  const M = DB.meta || {}, K = DB.ker, lw = M.lw || {}, R = DB.rmkSets;
  const rmSt = s => { const P = R[s]; return P && P.months && P.months.length ? `<b>${uniq(P.months.filter(x => x.tDisb > 0).map(x => x.rm)).length}</b> ${RML[s].who.toLowerCase()} bertarget · s.d. <b>${tglS(P.asof)}</b>` : "belum ada data"; };
  const lwSt = s => { const x = lw[s]; return x ? `<b>${nf0.format(x.n)} rekening</b>, posisi <b>${nS(x.asof)}</b>${x.prev ? " · pembanding " + nS(x.prev) : " · <span class='bad'>belum ada bulan lalu</span>"}` : "belum ada data"; };
  const pSt = s => { const x = M["pipe_" + s]; return x ? `<b>${nf0.format(x.n)} berkas</b> + ${nf0.format(x.oh)} on hand, posisi <b>${tglS(x.asof)}</b> · diunggah ${updS(x.updated)}` : "belum ada data"; };
  const bSt = () => { const x = M.brs_B; return x ? `posisi <b>${tglS(x.asof)}</b>${x.jam ? " pukul <b>" + esc(x.jam) + "</b>" : ""} · ${nf0.format(x.n)} RM &amp; mantri · diunggah ${updS(x.updated)}` : "belum ada data"; };
  const card = (k, ico, title, st, note, body) => `<section class="dcard" data-k="${k}"><div class="dc-h">${ico}<div><h3>${title}</h3><p class="dc-st">${st}</p></div></div><p class="note">${note}</p>${body}<p class="note dc-prog" id="pr_${k}" hidden></p></section>`;
  const file = (k, accept = ".xlsx,.xlsm,.xls,.csv", multi = false, lbl = "Upload") => `<label class="btn" for="f_${k}">${ICO_UP}${lbl}</label><input type="file" id="f_${k}" data-up="${k}" accept="${accept}" ${multi ? "multiple" : ""} hidden>`;
  const lwBody = s => `<div class="toolbar"><select class="ctl" id="m_lw${s}" style="flex:1 1 180px"><option value="cur">Posisi terkini</option><option value="prev">Bulan lalu (pembanding DG/UG)</option></select>${file("lw" + s, undefined, true)}</div><p class="note" style="margin:6px 0 0">Bisa pilih 2 file sekaligus (posisi terkini &amp; bulan lalu): yang tanggalnya lebih baru otomatis jadi posisi terkini.</p><div id="i_lw${s}"></div>`;
  return `<p class="note" style="margin:0">Data keragaan, RKA, disburse, list RM/mantri, dan produktivitas KPR dibaca langsung dari Google Sheets lewat <b>Sync</b>. File di bawah diolah di browser lalu disimpan ke Google Sheets / Drive milik admin, dan langsung tampil untuk semua pengguna sesuai perannya.</p>
    <div class="dgrid">
      ${card("sync", dIco('<path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7"/><path d="M18 2v4.5h-4.5M6 22v-4.5h4.5"/>'), "Google Sheets",
        `Keragaan s.d. <b>${K ? tglS(K.dates[K.dates.length - 1]) : "–"}</b>${K && K.rka ? " · RKA " + blnS(K.rka.months[0]) + "–" + blnS(K.rka.months[K.rka.months.length - 1]) : ""}<br>Ritel: ${rmSt("R")}<br>Mikro: ${rmSt("M")}<br>KPR: ${rmSt("K")}<br>Cache server: ${updS(M.updated)}`,
        "Sheet: keragaan, RKA, disburse ritel 2025/2026, disburse mikro, list RM ritel, list mantri mikro, produktivitas KPR (Database History & Database Monthly), RM & KC card.",
        `<button class="btn primary" type="button" id="btnSyncF">${'<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7"/><path d="M18 2v4.5h-4.5M6 22v-4.5h4.5"/></svg>'}Sync sekarang</button> <button class="btn" type="button" id="btnSyncR" title="Bangun ulang hanya produktivitas Briguna Ritel & Mikro (cepat)">Sync produktivitas</button>${syncResHtml()}`)}
      ${card("kerDb", dIco('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'), "Keragaan Konsumer (tanpa Sync)", `Keragaan s.d. <b>${K ? tglS(K.dates[K.dates.length - 1]) : "–"}</b>${K ? " · " + K.dates.length + " tanggal" : ""}`,
        "File <b>Gabung KAP/DLY</b> (.xlsm): hanya sheet <b>Database</b> yang dibaca. Tanggal di file digabung ke data keragaan (tanggal yang sama diganti, tanggal lain tetap), langsung tampil tanpa Sync.", file("kerDb"))}
      ${card("lwB", dIco('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 13h3M8 16h6"/>'), "LW321 Briguna", lwSt("B"),
        "LW321 Briguna Ritel + Mikro (semua sheet dibaca, rekening ganda dibuang, produk non-Briguna diabaikan). Posisi terkini yang lebih baru sebulan otomatis menggeser yang lama menjadi pembanding bulan lalu.", lwBody("B"))}
      ${card("lwK", dIco('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'), "LW321 KPR", lwSt("K"),
        "LW321 KPR (deskripsi KPR / Kredit Pemilikan Rumah). Subsidi bila FLPP/Sejahtera atau plafon ≤ Rp185 juta.", lwBody("K"))}
      ${card("pipeB", dIco('<path d="M3 4h18l-7 8v6l-4 2v-8z"/>'), "Pipeline Brispot Briguna", pSt("B"),
        "File Pipeline BRISPOT Briguna (sheet Pipeline, OnHand, Ref_Batal, Rencana Realisasi RM). Jenis Ritel/Mikro dari kolom produk/segmen bila ada. Menggantikan data sebelumnya.", file("pipeB"))}
      ${card("brsB", dIco('<path d="M4 6h16M4 12h10M4 18h7"/><path d="M16 16l2.2 2.2L22 14"/>'), "Brispot Briguna · Warm / Hot Leads", bSt(),
        "File <b>Brispot Briguna</b> per jam (sheet Nominatif, Rule, RM BGRITEL, Mantri BGMIKRO, KC BGRITEL, Unit BGMIKRO). Dihitung otomatis menjadi tabel Warm / Hot Leads &amp; Pencairan Sukses per RM, KC, Mantri dan Unit di menu Pipeline Brispot. Menggantikan data sebelumnya.", file("brsB"))}
      ${card("pipeK", dIco('<path d="M3 4h18l-7 8v6l-4 2v-8z"/>'), "Pipeline Brispot KPR", pSt("K"),
        "File Pipeline BRISPOT KPR (sheet Pipeline, OnHand, Ref_Batal, Rencana Realisasi RM). Menggantikan data sebelumnya.", file("pipeK"))}
      ${card("rate", dIco('<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 6.5h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h4"/>'), "Tabel suku bunga KPR",
        M.rate ? `<b>${esc(String(M.rate.title || "Tabel suku bunga").replace(/^TABEL SUKU BUNGA KPP\s*-\s*/i, ""))}</b>, ${M.rate.n} skema · ${updS(M.rate.updated)}` : DB.rate ? `${DB.rate.rows.length} skema` : "belum ada data",
        "File Tabel Perhitungan Suku Bunga KPR (sheet Tabel Suku Bunga & Rekap). Dipakai di Simulasi KPR.", file("rate"))}
      ${card("fotoRm", dIco('<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>'), "Foto RM (RM card)",
        `<b>${Object.keys(DB.foto.rm || {}).length} foto</b> tersimpan`, "Pilih satu atau beberapa foto. <b>Nama file = nama RM / mantri</b> (mis. <code>Melva Novelina S.jpg</code>). Dipotong persegi otomatis; foto lama bernama sama diganti. Tercatat di sheet <code>RM &amp; KC card</code>.", file("fotoRm", "image/*", true, "Upload foto"))}
      ${card("fotoKc", dIco('<path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-5h6v5M9 11h.01M15 11h.01"/>'), "Ikon kantor cabang (KC card)",
        `<b>${Object.keys(DB.foto.kc || {}).length} ikon</b> tersimpan`, "Pilih gambar ikon/logo tiap KC. <b>Nama file = nama KC</b> (mis. <code>KC Binjai.png</code> atau <code>Binjai.png</code>). Tampil di kartu Per Cabang.", file("fotoKc", "image/*", true, "Upload ikon"))}
    </div>`;
}
function bindDataCards(root) {
  const b = root.querySelector("#btnSyncF"); if (b) b.onclick = () => doSync(true, b);
  const br = root.querySelector("#btnSyncR"); if (br) br.onclick = () => doSyncRmk(br);
  root.querySelectorAll("input[type=file][data-up]").forEach(inp => inp.addEventListener("change", e => {
    const k = inp.dataset.up, files = [...e.target.files]; if (!files.length) return;
    (k === "kerDb" ? upKer(files[0], inp) : k === "brsB" ? upBrs(files[0], inp) : k === "fotoRm" || k === "fotoKc" ? upFoto(files, k === "fotoKc" ? "kc" : "rm", inp) : k.startsWith("lw") ? upLW(files, k.slice(-1), inp) : upPart(files[0], k, inp));
  }));
}
function openData() { if (!isAdmin()) return; const b = $("#dataBody"); b.innerHTML = dataCards(); bindDataCards(b); $("#dlgData").showModal(); }
const progOf = k => { const p = document.querySelector("#pr_" + k); if (p) p.hidden = false; return { set: t => { if (p) p.textContent = t; }, done: () => { if (p) p.hidden = true; } }; };
const okCard = k => { const c = document.querySelector(`.dcard[data-k="${k}"]`); if (c) { c.classList.add("ok"); setTimeout(() => c.classList.remove("ok"), 2500); } };
async function readWB(f) { if (typeof XLSX === "undefined") throw new Error("Pustaka Excel gagal dimuat. Periksa koneksi internet."); return XLSX.read(await f.arrayBuffer(), { cellDates: false }); }
function refreshDataUI() { const b = $("#dataBody"); if ($("#dlgData").open) { b.innerHTML = dataCards(); bindDataCards(b); } if (curView() === "admin") renderAdminTab(); }
// LW321: 1 file (posisi mengikuti pilihan, dijaga urutan tanggalnya) atau 2 file sekaligus (yang lebih baru = posisi terkini, yang lebih lama = bulan lalu)
async function upLW(files, set, inp) {
  const pg = progOf("lw" + set), info = $("#i_lw" + set);
  try {
    if (files.length > 2) throw new Error("Pilih paling banyak 2 file: posisi terkini dan bulan lalu.");
    const L = [];
    for (const f of files) {
      pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
      const wb = await readWB(f); pg.set("Mengolah " + f.name + "…"); await new Promise(r => setTimeout(r, 20));
      L.push({ f, P: parseLWUpload(wb, set) });
    }
    pg.done();
    let warn = "";
    if (L.length === 2) {
      L.sort((a, b) => b.P.asof.localeCompare(a.P.asof));
      if (!L[0].P.asof || L[0].P.asof === L[1].P.asof) throw new Error(`Kedua file berposisi sama (${tglS(L[0].P.asof)}). Pilih file posisi terkini dan file bulan lalu.`);
      L[0].mode = "cur"; L[1].mode = "prev";
    } else {
      // jaga urutan posisi: file lebih lama dari posisi terkini disimpan sebagai bulan lalu, dan sebaliknya
      // posisi tersimpan di meta berupa nomor hari (lihat nS) → ubah ke yyyy-mm-dd agar bisa dibandingkan
      const P = L[0].P, cm = ((DB.meta || {}).lw || {})[set] || {}, cur = { asof: typeof cm.asof === "number" ? nIso(cm.asof) : cm.asof ? dateX(cm.asof) : "" }; let mode = $("#m_lw" + set).value;
      if (cur.asof && P.asof && mode === "cur" && P.asof < cur.asof) { mode = "prev"; warn = `File ini posisi <b>${tglS(P.asof)}</b>, lebih lama dari posisi terkini <b>${tglS(cur.asof)}</b>, jadi disimpan sebagai <b>bulan lalu</b>.`; }
      else if (cur.asof && P.asof && mode === "prev" && P.asof >= cur.asof) { mode = "cur"; warn = `File ini posisi <b>${tglS(P.asof)}</b>, tidak lebih lama dari posisi terkini <b>${tglS(cur.asof)}</b>, jadi disimpan sebagai <b>posisi terkini</b>.`; }
      if (warn) $("#m_lw" + set).value = mode;
      L[0].mode = mode;
    }
    const mLbl = m => m === "cur" ? "posisi terkini" : "bulan lalu";
    const desc = ({ f, P, mode }) => { const segN = {}; P.rows.forEach(r => segN[r[19]] = (segN[r[19]] || 0) + 1);
      return `<div class="ds"><b>${esc(f.name)}</b><br><b>${nf0.format(P.rows.length)} rekening</b> · posisi <b>${tglS(P.asof)}</b> · ${Object.entries(segN).map(([k, n]) => esc(prodLbl(k)) + " " + nf0.format(n)).join(" · ")}${P.dropped ? ` · <span class="note">${nf0.format(P.dropped)} baris produk lain diabaikan</span>` : ""}<br>sheet: ${esc(P.sheets.join(", "))} · disimpan sebagai <b>${mLbl(mode)}</b></div>`; };
    info.innerHTML = `${warn ? `<div class="banner"><span>${warn}</span></div>` : ""}${L.map(desc).join("")}
      <div class="toolbar"><button class="btn primary" type="button" id="go_lw${set}">Kirim ke database</button><button class="btn" type="button" id="no_lw${set}">Batal</button></div>`;
    $("#no_lw" + set).onclick = () => { info.innerHTML = ""; };
    $("#go_lw" + set).onclick = async ev => {
      ev.currentTarget.disabled = true; const N = window.APP_CONFIG.UPLOAD_CHUNK || 4000, done = [];
      try {
        // posisi terkini dikirim lebih dulu, lalu bulan lalu
        for (const [k, { P, mode }] of L.entries()) {
          const total = Math.ceil(P.rows.length / N);
          for (let i = 0; i < total; i++) { pg.set(`${L.length > 1 ? `File ${k + 1}/${L.length} · ` : ""}Mengirim ${i + 1} / ${total}…`); await Auth.call("lwUpload", { set, mode, seq: i, total, asof: P.asof, rows: P.rows.slice(i * N, (i + 1) * N) }); }
          done.push(`${nf0.format(P.rows.length)} rekening posisi ${tglS(P.asof)} sebagai ${mLbl(mode)}`);
        }
        pg.set("Memuat ulang data…"); await loadParts(["meta", "gerak", "lw_" + set]);
        render(); refreshDataUI(); const inf = $("#i_lw" + set); if (inf) inf.innerHTML = `<div class="ds">Upload selesai: ${done.join("; ")}.</div>`;
        okCard("lw" + set); toast("LW321 " + LWL[set].seg + " tersimpan.");
      } catch (er) { const inf = $("#i_lw" + set) || info; inf.innerHTML = `<div class="banner"><span>Upload gagal: ${esc(er.message)}.${done.length ? " Sudah tersimpan: " + esc(done.join("; ")) + "." : ""} Ulangi dari awal.</span></div>`; }
      pg.done();
    };
  } catch (er) { pg.done(); toast(er.message); }
  if (inp) inp.value = "";
}
// Brispot Briguna: file diolah di browser (parseBrispot) menjadi tabel RM / KC / Mantri / Unit, lalu disimpan sebagai bagian data "brs_B"
async function upBrs(f, inp) {
  const pg = progOf("brsB");
  try {
    pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
    const wb = await readWB(f); pg.set("Mengolah…"); await new Promise(r => setTimeout(r, 20));
    const data = parseBrispot(wb, f.name);
    if (!data) throw new Error("File ini bukan Brispot Briguna (butuh sheet Nominatif, RM BGRITEL dan Mantri BGMIKRO).");
    if (!data.asof) throw new Error("Tanggal posisi tidak terbaca. Pastikan nama file memuat tanggal & jam, mis. \"Brispot Briguna - (21 Okt 26 (14.16) Temp.xlsx\".");
    pg.set("Mengirim ke server…");
    await Auth.call("partUpload", { name: "brs_B", data });
    await loadParts(["meta", "brs_B"]);
    okCard("brsB"); const w = data.warn || {};
    toast(`Brispot Briguna posisi ${tglS(data.asof)}${data.jam ? " " + data.jam : ""}: ${data.rm.length} RM, ${data.mantri.length} mantri · tersimpan.${w.tidakCocok ? " " + w.tidakCocok + " lead tanpa RM/mantri cocok." : ""}`);
    render(); refreshDataUI();
  } catch (er) { toast(er.message); }
  pg.done(); if (inp) inp.value = "";
}
async function upKer(f, inp) {
  const pg = progOf("kerDb");
  try {
    pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
    const wb = await readWB(f); pg.set("Mengolah sheet Database…"); await new Promise(r => setTimeout(r, 20));
    const d = parseKerDb(wb);
    if (!d) throw new Error("Sheet Database tidak ditemukan (butuh kolom Uker, Tanggal, Desc, DEB, OS, DPK, NPL).");
    if (!d.rows.length) throw new Error("Tidak ada baris Briguna/KPR yang terbaca di sheet Database.");
    pg.set("Mengirim " + nf0.format(d.rows.length) + " baris ke server…");
    const j = await Auth.call("kerUpload", { rows: d.rows });
    await loadParts(["meta", "ker"], null, true);
    okCard("kerDb"); toast(`Keragaan posisi ${d.dates.map(tglS).join(", ")}: ${nf0.format(d.rows.length)} baris tersimpan${j && j.sheet === false ? " (cache saja, sheet tidak terisi)" : ""}.`);
    render(); refreshDataUI();
  } catch (er) { toast(er.message); }
  pg.done(); if (inp) inp.value = "";
}
async function upPart(f, k, inp) {
  const pg = progOf(k);
  try {
    pg.set("Membaca " + f.name + "…"); await new Promise(r => setTimeout(r, 40));
    const wb = await readWB(f); let name, data, msg;
    if (k === "rate") { data = parseRates(wb); if (!data) throw new Error("File ini bukan Tabel Perhitungan Suku Bunga KPR (sheet dengan kolom Program, Kelompok, Produk)."); name = "rate"; msg = `Tabel suku bunga: ${uniq(data.rows.map(x => x.prog)).length} program, ${data.rows.length} skema`; }
    else { const set = k === "pipeB" ? "B" : "K"; data = parsePipeline(wb, set); if (!data) throw new Error("File ini bukan Pipeline BRISPOT (sheet Pipeline dengan kolom Nama Branch, Nama Debitur, Status)."); name = "pipe_" + set; msg = `Pipeline ${PIPEL[set].seg} posisi ${tglS(data.asof)}: ${data.items.length} berkas + ${data.onhand.length} on hand`; }
    pg.set("Mengirim ke server…");
    await Auth.call("partUpload", { name, data });
    await loadParts(["meta", name]);
    okCard(k); toast(msg + " · tersimpan."); render(); refreshDataUI();
  } catch (er) { toast(er.message); }
  pg.done(); if (inp) inp.value = "";
}
// foto RM / ikon KC: nama file dicocokkan ke nama RM/mantri (produktivitas & LW321) atau nama KC (master), dipotong persegi lalu diperkecil
async function upFoto(files, kind, inp) {
  const pg = progOf(kind === "kc" ? "fotoKc" : "fotoRm");
  const names = kind === "kc" ? KC_MASTER.map(u => u.nama) : uniq([...Object.values(DB.rmkSets).flatMap(P => P && P.months ? P.months.map(x => x.rm) : []), ...Object.values(DB.lwSets).flatMap(L => L && L.rmN ? L.rmN : [])]).filter(n => n && !/^PN |^\(?Tanpa/.test(n));
  const keys = names.map(nmKey), ok = [], miss = [], items = [];
  for (const f of files) {
    pg.set("Memproses " + f.name + "…");
    const base = f.name.replace(/\.[^.]+$/, "");
    let nm = null;
    if (kind === "kc") { const u = kcByName(base); nm = u ? u.nama : null; }
    else { const k = nmKey(base), i = keys.indexOf(k) >= 0 ? keys.indexOf(k) : keys.findIndex(x => x && k && (x.startsWith(k) || k.startsWith(x))); nm = i >= 0 ? names[i] : null; }
    if (!nm) { miss.push(base); continue; }
    try {
      const bmp = await createImageBitmap(f), S = kind === "kc" ? 256 : 320, cv = document.createElement("canvas"); cv.width = cv.height = S; const c2 = cv.getContext("2d");
      if (kind === "kc") { const sc = Math.min(S / bmp.width, S / bmp.height), w = bmp.width * sc, h = bmp.height * sc; c2.drawImage(bmp, (S - w) / 2, (S - h) / 2, w, h); }
      else { const side = Math.min(bmp.width, bmp.height), sx = (bmp.width - side) / 2, sy = bmp.height > bmp.width ? (bmp.height - side) * .2 : 0; c2.drawImage(bmp, sx, sy, side, side, 0, 0, S, S); }
      let url = cv.toDataURL("image/webp", .82); if (!url.startsWith("data:image/webp")) url = cv.toDataURL(kind === "kc" ? "image/png" : "image/jpeg", .85);
      items.push({ kind, name: nm, data: url }); ok.push(nm);
    } catch { miss.push(base); }
  }
  try {
    for (let i = 0; i < items.length; i += 6) { pg.set(`Mengirim ${Math.min(items.length, i + 6)} / ${items.length}…`); await Auth.call("fotoUpload", { items: items.slice(i, i + 6) }); }
    if (items.length) { await loadParts(["foto", "meta"]); toast(`${ok.length} ${kind === "kc" ? "ikon KC" : "foto RM"} tersimpan.`); okCard(kind === "kc" ? "fotoKc" : "fotoRm"); render(); refreshDataUI(); }
  } catch (er) { toast("Upload gagal: " + er.message); }
  if (miss.length) setTimeout(() => toast(`Nama ${kind === "kc" ? "KC" : "RM"} tidak ditemukan untuk: ${miss.slice(0, 5).join(", ")}${miss.length > 5 ? ", dll." : ""}. Samakan nama file.`), 900);
  pg.done(); if (inp) inp.value = "";
}
// hasil sync terakhir (sesi ini): ditampilkan di kartu Google Sheets dan sebagai notifikasi
let SYNC_RES = null;
const syncJam = t => new Date(t).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
function syncResHtml() {
  if (!SYNC_RES) return "";
  const R = SYNC_RES, cls = R.state === "ok" ? "ok" : R.state === "run" ? "run" : R.state === "skip" ? "skip" : "err";
  return `<div class="sync-res ${cls}" role="status">${R.state === "run" ? '<span class="spin" aria-hidden="true"></span>' : R.state === "ok" ? "✓ " : R.state === "skip" ? "ℹ " : "✕ "}${R.msg}</div>`;
}
async function doSync(force, btn) {
  if (btn) btn.disabled = true; const st = $("#syncSt"); if (st) st.textContent = "sinkronisasi…";
  SYNC_RES = { state: "run", msg: "Sinkronisasi berjalan… server membaca ulang semua sheet (bisa 3–6 menit). Jangan tutup atau refresh halaman." }; refreshDataUI();
  try {
    const j = await Auth.call("sync", { force: !!force && isAdmin() }); await loadAll(true);
    const upd = j.updated || (DB.meta && DB.meta.updated) || new Date().toISOString();
    SYNC_RES = j.skipped ? { state: "skip", msg: `Data sudah terbaru (sync terakhir kurang dari 2 menit lalu) · update terakhir <b>${syncJam(upd)}</b>` }
      : { state: "ok", msg: `Data berhasil di-sync · update terbaru <b>${syncJam(upd)}</b>` };
    toast(j.skipped ? "Data sudah terbaru · update terakhir " + syncJam(upd) : "✓ Data berhasil di-sync · update terbaru " + syncJam(upd));
  } catch (er) { SYNC_RES = { state: "err", msg: "Sync belum selesai: " + esc(er.message) + " Server mungkin masih memproses; tunggu beberapa menit lalu refresh halaman sebelum mencoba lagi." }; toast("Sync gagal: " + er.message); }
  refreshDataUI(); if (btn && btn.isConnected) btn.disabled = false; syncLabel();
}

// sync cepat: hanya produktivitas Briguna Ritel & Mikro (rincian produk Karya / Pra-Purna / Purna), tanpa membangun ulang semua data
async function doSyncRmk(btn) {
  if (btn) btn.disabled = true;
  SYNC_RES = { state: "run", msg: "Membangun ulang produktivitas Briguna Ritel & Mikro… biasanya kurang dari 1–2 menit." }; refreshDataUI();
  try {
    const j = await Auth.call("syncParts", { parts: ["rmk"] }); await loadParts(["meta", "rmk_R", "rmk_M"], null, true);
    const upd = j.updated || new Date().toISOString(), st = j.stats || {};
    SYNC_RES = { state: "ok", msg: `Produktivitas Ritel & Mikro diperbarui · <b>${syncJam(upd)}</b>${st.ms ? " · " + Math.round(st.ms / 1000) + " dtk" : ""}` };
    toast("✓ Produktivitas Ritel & Mikro diperbarui"); render();
  } catch (er) { SYNC_RES = { state: "err", msg: "Sync produktivitas gagal: " + esc(er.message) }; toast("Sync produktivitas gagal: " + er.message); }
  refreshDataUI(); if (btn && btn.isConnected) btn.disabled = false;
}

// sync per menu (admin): tiap menu hanya membangun ulang datanya sendiri lewat action syncParts, tanpa menunggu sync penuh
const SP_LBL = { ker: "keragaan", rmk: "produktivitas Ritel & Mikro", kpr: "produktivitas KPR", lw: "LW321 & DG/UG" };
const SP_LOAD = { ker: ["ker"], rmk: ["rmk_R", "rmk_M"], kpr: ["rmk_K"], lw: ["gerak", "lw_B", "lw_K"] };
const syncPartsOf = k => k === "keragaan" ? ["ker"] : k === "produktivitas" ? [SEG.rm === "K" ? "kpr" : "rmk"] : k === "nominatif" || k === "kualitas" ? ["lw"] : [];
function updateSyncPart(k) {
  const b = $("#btnSyncPart"); if (!b) return; const p = syncPartsOf(k); b.hidden = !(isAdmin() && p.length); b.dataset.p = p.join(",");
  const sp = b.querySelector("span"); if (sp) sp.textContent = "Sync " + (p.length ? SP_LBL[p[0]] : "menu ini"); b.title = "Sync hanya " + (p.length ? SP_LBL[p[0]] : "data menu ini") + " (admin)";
}
async function doSyncPart(btn) {
  const parts = (btn.dataset.p || "").split(",").filter(Boolean); if (!parts.length) return;
  const name = parts.map(p => SP_LBL[p]).join(" + "), sp = btn.querySelector("span"), old = sp.textContent;
  btn.disabled = true; sp.textContent = "Menyinkronkan…";
  try {
    const j = await Auth.call("syncParts", { parts }); await loadParts(["meta", ...parts.flatMap(p => SP_LOAD[p])], null, true);
    const st = j.stats || {}, ms = parts.reduce((a, p) => a + (st["ms_" + p] || 0), 0);
    toast(`✓ ${name} diperbarui${ms ? " · " + Math.round(ms / 1000) + " dtk" : ""}`); render();
  } catch (er) { toast("Sync " + name + " gagal: " + er.message); }
  btn.disabled = false; sp.textContent = old;
}

/* ---------- VIEW: Admin ---------- */
const AD = { tab: lsGet(STORE + "-adtab") || "data" };
function viewAdmin(v) {
  if (!isAdmin()) { v.innerHTML = `<section class="panel"><div class="empty">Menu ini khusus admin.</div></section>`; return; }
  v.innerHTML = `<nav class="ptabs" role="tablist">${[["data", "Kelola data"], ["users", "User"], ["log", "Access log"]].map(([k, l]) => `<button type="button" role="tab" data-at="${k}" aria-selected="${AD.tab === k}">${l}</button>`).join("")}</nav><div id="adBody" class="grid"></div>`;
  v.querySelectorAll("[data-at]").forEach(b => b.onclick = () => { AD.tab = b.dataset.at; lsSet(STORE + "-adtab", AD.tab); v.querySelectorAll("[data-at]").forEach(x => x.setAttribute("aria-selected", x === b)); renderAdminTab(); });
  renderAdminTab();
}
function renderAdminTab() {
  const el = $("#adBody"); if (!el) return;
  if (AD.tab === "users") return adUsers(el);
  if (AD.tab === "log") return adLog(el);
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>Kelola data</h2><span class="sub">khusus admin</span></div>${dataCards()}</section>`; bindDataCards(el);
}
async function adUsers(el) {
  el.innerHTML = `<section class="panel"><div class="empty">Memuat user…</div></section>`;
  let j; try { j = await Auth.call("usersList"); } catch (er) { el.innerHTML = `<section class="panel"><div class="empty">${esc(er.message)}</div></section>`; return; }
  const users = j.users || [];
  const rmNames = uniq([...Object.values(DB.rmkSets).flatMap(P => P && P.months ? P.months.map(x => x.rm) : []), ...Object.values(DB.lwSets).flatMap(L => L && L.rmN ? L.rmN : [])]).filter(n => n && !/^PN |^\(?Tanpa/.test(n)).sort((a, b) => a.localeCompare(b));
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>User</h2><button class="btn primary" type="button" id="uNew">Tambah user</button></div><div id="uTbl"></div>
    <p class="note" style="margin:0">RM hanya melihat debitur & pipeline yang <b>Nama RM</b> atau <b>PN</b>-nya cocok dengan data LW321 / Pipeline. Guest hanya melihat angka agregat (tanpa nama & rekening debitur).</p></section>
    <datalist id="rmList">${rmNames.map(n => `<option value="${esc(n)}">`).join("")}</datalist>`;
  table($("#uTbl"), [{ key: "username", label: "Username", fmt: x => `<b>${esc(x)}</b>` }, { key: "nama", label: "Nama" }, { key: "role", label: "Peran", fmt: x => chip(esc(Auth.ROLE_LABEL[x] || x), x === "admin" ? "crit" : x === "rm" ? "good" : "neutral") },
    { key: "rm_name", label: "Nama RM (data)", fmt: x => esc(x || "–") }, { key: "pn", label: "PN", fmt: x => esc(x || "–") }, { key: "active", label: "Status", fmt: x => x ? chip("aktif", "good") : chip("nonaktif", "neutral") },
    { key: "last_login", label: "Login terakhir", fmt: x => x ? new Date(x).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "–" },
    { key: "_e", label: "", nosort: 1, fmt: (x, r) => `<button class="linkish" data-u="${esc(r.username)}">Ubah</button>${r.username === (Auth.user || {}).username ? "" : ` <button class="linkish bad" data-del="${esc(r.username)}">Hapus</button>`}` }], users,
    { sortKey: "username", sortDir: 1, after: t => { t.querySelectorAll("[data-u]").forEach(b => b.onclick = () => form(users.find(u => u.username === b.dataset.u)));
      t.querySelectorAll("[data-del]").forEach(b => b.onclick = () => hapus(users.find(u => u.username === b.dataset.del))); } });
  const hapus = async u => {
    if (!u || !confirm(`Hapus user "${u.username}" (${Auth.ROLE_LABEL[u.role] || u.role})? User ini tidak bisa login lagi dan tindakan ini tidak bisa dibatalkan.`)) return;
    try { await Auth.call("userDelete", { username: u.username }); toast("User " + u.username + " dihapus."); adUsers(el); } catch (er) { toast(er.message); }
  };
  const form = u => {
    $("#dlgTitle").textContent = u ? "Ubah user " + u.username : "Tambah user";
    $("#dlgBody").innerHTML = `<form id="uForm" class="form" novalidate>
      <div class="field"><label for="fUn">Username</label><input class="ctl" id="fUn" value="${esc(u ? u.username : "")}" ${u ? "readonly" : ""} maxlength="60" autocapitalize="none" required></div>
      <div class="field"><label for="fNm">Nama lengkap</label><input class="ctl" id="fNm" value="${esc(u ? u.nama : "")}" maxlength="80"></div>
      <div class="field"><label for="fRo">Peran</label><select class="ctl" id="fRo">${["admin", "rm", "guest"].map(r => `<option value="${r}" ${u && u.role === r ? "selected" : !u && r === "rm" ? "selected" : ""}>${Auth.ROLE_LABEL[r]}</option>`).join("")}</select></div>
      <div class="field"><label for="fUrm">Nama RM / mantri di data</label><input class="ctl" id="fUrm" list="rmList" value="${esc(u ? u.rm_name : "")}" maxlength="80" placeholder="ketik untuk mencari"></div>
      <div class="field"><label for="fPn">PN (opsional)</label><input class="ctl" id="fPn" value="${esc(u ? u.pn : "")}" inputmode="numeric" maxlength="12"></div>
      <div class="field"><label for="fPw">${u ? "Password baru (kosongkan bila tetap)" : "Password awal (min. 8)"}</label><input class="ctl" id="fPw" type="password" autocomplete="new-password" minlength="8" maxlength="100"></div>
      <label class="check full"><input type="checkbox" id="fAc" ${!u || u.active ? "checked" : ""}> Aktif</label>
      <div class="toolbar full"><button class="btn primary" type="submit">Simpan</button><button class="btn" type="button" data-close>Batal</button></div><p id="uMsg" class="lg-msg full" hidden></p></form>`;
    $("#dlg").showModal();
    $("#uForm").onsubmit = async e => { e.preventDefault(); const msg = $("#uMsg"), pw = $("#fPw").value, un = Auth.cleanInput($("#fUn").value, 60).toLowerCase();
      if (!u && pw.length < 8) { msg.hidden = false; msg.textContent = "Password awal minimal 8 karakter."; return; }
      if (pw && pw.length < 8) { msg.hidden = false; msg.textContent = "Password minimal 8 karakter."; return; }
      try { await Auth.call("userSave", { user: { username: un, nama: Auth.cleanInput($("#fNm").value, 80), role: $("#fRo").value, rm_name: Auth.cleanInput($("#fUrm").value, 80), pn: Auth.cleanInput($("#fPn").value, 12), active: $("#fAc").checked, phash: pw ? await Auth.pwHash(un, pw) : undefined } });
        $("#dlg").close(); toast("User tersimpan."); adUsers(el); } catch (er) { msg.hidden = false; msg.textContent = er.message; } };
  };
  $("#uNew").onclick = () => form(null);
}
async function adLog(el) {
  el.innerHTML = `<section class="panel"><div class="empty">Memuat log…</div></section>`;
  let j; try { j = await Auth.call("logList", { limit: 500 }); } catch (er) { el.innerHTML = `<section class="panel"><div class="empty">${esc(er.message)}</div></section>`; return; }
  const rows = (j.rows || []).map(r => ({ t: r[0], u: r[1], ro: r[2], a: r[3], s: r[4], d: r[5] }));
  el.innerHTML = `<section class="panel"><div class="panel-h"><h2>Access log</h2><span class="sub">500 aktivitas terakhir</span></div><input class="ctl" type="search" id="lgQ" placeholder="Cari user, aktivitas, status"><div id="lgT"></div></section>`;
  const draw = q => table($("#lgT"), [{ key: "t", label: "Waktu", fmt: x => new Date(x).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "medium" }) }, { key: "u", label: "User", fmt: x => esc(x) }, { key: "ro", label: "Peran", fmt: x => esc(x) },
    { key: "a", label: "Aktivitas", fmt: x => esc(x) }, { key: "s", label: "Status", fmt: x => chip(esc(x), x === "OK" ? "good" : /FAIL|DENIED|LOCKED|RATE|ERR/.test(x) ? "crit" : "neutral") }, { key: "d", label: "Keterangan", fmt: x => esc(x) }],
    q ? rows.filter(r => (r.u + " " + r.a + " " + r.s + " " + r.d).toLowerCase().includes(q)) : rows, { sortKey: "t", page: 50 });
  draw(""); let qt; $("#lgQ").oninput = e => { clearTimeout(qt); qt = setTimeout(() => draw(e.target.value.trim().toLowerCase()), 200); };
}
function openPw() {
  $("#userMenu").hidden = true; $("#dlgTitle").textContent = "Ganti password";
  $("#dlgBody").innerHTML = `<form id="pwF" class="form" novalidate><div class="field full"><label for="pw0">Password lama</label><input class="ctl" type="password" id="pw0" autocomplete="current-password"></div>
    <div class="field"><label for="pw1">Password baru (min. 8)</label><input class="ctl" type="password" id="pw1" autocomplete="new-password"></div><div class="field"><label for="pw2">Ulangi password baru</label><input class="ctl" type="password" id="pw2" autocomplete="new-password"></div>
    <div class="toolbar full"><button class="btn primary" type="submit">Simpan</button><button class="btn" type="button" data-close>Batal</button></div><p id="pwM" class="lg-msg full" hidden></p></form>`;
  $("#dlg").showModal();
  $("#pwF").onsubmit = async e => { e.preventDefault(); const m = $("#pwM"), a = $("#pw1").value;
    if (a.length < 8) { m.hidden = false; m.textContent = "Password baru minimal 8 karakter."; return; } if (a !== $("#pw2").value) { m.hidden = false; m.textContent = "Ulangan password tidak sama."; return; }
    try { await Auth.changePassword($("#pw0").value, a); $("#dlg").close(); toast("Password diganti."); } catch (er) { m.hidden = false; m.textContent = er.message; } };
}
