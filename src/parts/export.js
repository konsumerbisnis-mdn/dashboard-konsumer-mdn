/* ================= unduh tabel / grafik: Excel, CSV, PDF, gambar (PNG) ================= */
// Tiap section yang berisi tabel atau grafik mendapat tombol "Unduh". Excel/CSV = data tabel (semua baris, bukan hanya yang tampil);
// PDF & gambar = tampilan tabel/grafik section itu (tabel yang terpotong halaman dibuka penuh dulu).
let XMODE = null;
const Exp = (() => {
  const LIBS = { h2i: "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.js", pdf: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" };
  const loaded = {};
  const lib = k => loaded[k] || (loaded[k] = new Promise((res, rej) => { const s = document.createElement("script"); s.src = LIBS[k]; s.onload = res; s.onerror = () => { delete loaded[k]; rej(new Error("Pustaka unduhan gagal dimuat. Periksa koneksi internet.")); }; document.head.appendChild(s); }));
  const ICO = '<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v3h16v-3"/></svg>';
  const txt = h => { const d = document.createElement("div"); d.innerHTML = String(h ?? "").replace(/<br\s*\/?>/gi, " · "); return d.textContent.replace(/\s+/g, " ").replace(/^ · | · $/g, "").trim(); };
  const numOf = s => { const t = String(s).trim(); if (/^\(?-?−?[\d.]+(,\d+)?\)?$/.test(t) && /\d/.test(t)) { let n = parseFloat(t.replace(/[()−]/g, m => m === "−" ? "-" : "").replace(/\./g, "").replace(",", ".")); if (/^\(.*\)$/.test(t)) n = -Math.abs(n); return isFinite(n) ? n : t; } return t; };
  const fname = s => String(s || "data").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70);
  const titleOf = sec => { const h = sec.querySelector(".panel-h h2, .l-qvh h3, h2, h3"); return h ? h.textContent.trim() : "data"; };
  const ctxOf = () => { const t = ($("#pageTitle") || {}).textContent || ""; return t; };
  // data tabel dari helper table() (semua baris) atau dari DOM tabel apa adanya (dengan baris kepala bertingkat)
  function aoaOf(sec) {
    const out = [];
    const hosts = [...sec.querySelectorAll("*")].filter(e => e._tbl);
    const tables = [...sec.querySelectorAll("table")];
    if (hosts.length) hosts.forEach((h, i) => { const { cols, rows } = h._tbl; if (i) out.push([]);
      out.push(cols.map(c => txt(c.label)));
      rows.forEach(r => out.push(cols.map(c => numOf(txt(c.fmt ? c.fmt(r[c.key], r) : r[c.key])))));
      const foot = h._tbl.foot; if (foot && rows.length) out.push(cols.map(c => numOf(txt(foot[c.key] ?? "")))); });
    tables.filter(t => !hosts.some(h => h.contains(t))).forEach(t => { if (out.length) out.push([]);
      const grid = []; [...t.rows].forEach((tr, ri) => { grid[ri] = grid[ri] || []; let ci = 0;
        [...tr.cells].forEach(td => { while (grid[ri][ci] !== undefined) ci++; const v = numOf(txt(td.innerHTML)), cs = td.colSpan || 1, rs = td.rowSpan || 1;
          for (let a = 0; a < rs; a++) for (let b = 0; b < cs; b++) { grid[ri + a] = grid[ri + a] || []; grid[ri + a][ci + b] = a || b ? "" : v; } ci += cs; }); });
      grid.forEach(r => out.push(r.map(x => x ?? ""))); });
    if (!out.length) [...sec.querySelectorAll("canvas")].forEach(cv => { const c = charts[cv.id]; if (!c) return; if (out.length) out.push([]);
      const ds = c.data.datasets.filter(d => !d.hidden); out.push([titleOf(sec), ...ds.map(d => d.label || "")]);
      c.data.labels.forEach((l, i) => out.push([Array.isArray(l) ? l.join(" ") : l, ...ds.map(d => { const v = d.data[i]; return v == null ? "" : typeof v === "object" ? v.y ?? v.x : v; })])); });
    return out;
  }
  function saveXlsx(name, aoa) {
    const ws = XLSX.utils.aoa_to_sheet(aoa), wb = XLSX.utils.book_new();
    ws["!cols"] = (aoa[0] || []).map((_, j) => ({ wch: Math.min(40, Math.max(8, ...aoa.slice(0, 200).map(r => String(r[j] ?? "").length + 1))) }));
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveFile(name + ".xlsx", new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  }
  function saveCsv(name, aoa) {
    const q = v => { const s = typeof v === "number" ? String(v).replace(".", ",") : String(v ?? ""); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    saveFile(name + ".csv", "﻿" + aoa.map(r => r.map(q).join(";")).join("\n"), "text/csv");
  }
  const SKIP = n => n.classList && ["xp", "xp-pop", "xp-legacy", "sec-ctl", "zoomctl"].some(c => n.classList.contains(c));
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (c && !/^(transparent|rgba\(.*,\s*0\))$/.test(c)) return c; } return "#fff"; };
  async function snap(sec, all = true, onLayout) {
    await lib("h2i");
    // buka semua baris tabel berhalaman agar ikut tergambar, lalu lebarkan section selebar tabelnya
    if (all) { sec.querySelectorAll("[data-all]").forEach(b => b.click()); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 60))); }
    const wide = Math.ceil(Math.max(sec.scrollWidth, ...[...sec.querySelectorAll(".table-wrap")].map(w => w.scrollWidth + 34)));
    sec.classList.add("xp-shot"); sec.style.setProperty("--xpw", wide + "px");
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
    try {
      const bg = bgOf(sec), h = sec.scrollHeight, w = sec.scrollWidth;
      const pr = Math.max(1, Math.min(2, 14000 / Math.max(w, h)));
      if (onLayout) onLayout(pr);
      const cv = await window.htmlToImage.toCanvas(sec, { backgroundColor: bg, pixelRatio: pr, skipFonts: true, cacheBust: false, width: w, height: h,
        filter: n => !SKIP(n) && !(all === false && n.matches && n.matches("[data-more], [data-all]")) });
      cv._pr = pr; return cv;
    } finally { sec.classList.remove("xp-shot"); sec.style.removeProperty("--xpw"); }
  }
  // kop PDF: logo Danantara | judul biru "<judul> - Posisi <tanggal>" | logo BRI, garis biru di bawahnya;
  // kaki halaman: nama aplikasi, waktu cetak, pengguna, nomor halaman
  const LOGO = { dan: "assets/logo-danantara-hitam.png", bri: "assets/logo-bri-biru.png" }, logos = {};
  const logo = k => logos[k] || (logos[k] = new Promise(res => { const im = new Image();
    im.onload = () => { const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight; c.getContext("2d").drawImage(im, 0, 0); res({ src: c.toDataURL("image/png"), r: im.naturalWidth / im.naturalHeight }); };
    im.onerror = () => { delete logos[k]; res(null); }; im.src = LOGO[k]; }));
  const BLUE = [37, 99, 214];
  async function pdfNew(orientation, title) {
    await lib("pdf"); const { jsPDF } = window.jspdf, [dan, bri] = await Promise.all([logo("dan"), logo("bri")]);
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" }), W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), m = 28;
    const pos = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), full = /\bs\.d\.|posisi/i.test(title) ? title : title + " - Posisi " + pos;
    const head = () => {
      const cy = 30; let x = m, xr = W - m;
      if (dan) { const h = 22, w = h * dan.r; doc.addImage(dan.src, "PNG", x, cy - h / 2, w, h); x += w + 12; doc.setDrawColor(205); doc.setLineWidth(.8); doc.line(x, cy - 12, x, cy + 12); x += 12; }
      if (bri) { const h = 22, w = h * bri.r; doc.addImage(bri.src, "PNG", xr - w, cy - h / 2, w, h); xr -= w + 14; }
      doc.setFont("helvetica", "bold"); doc.setTextColor(...BLUE);
      let fs = 17; doc.setFontSize(fs); while (fs > 9 && doc.getTextWidth(full) > xr - x) doc.setFontSize(--fs);
      doc.text(doc.splitTextToSize(full, xr - x)[0], x, cy + fs * .35);
      doc.setDrawColor(...BLUE); doc.setLineWidth(2); doc.line(0, 56, W, 56); doc.setFont("helvetica", "normal");
    };
    const finish = () => {
      const n = doc.getNumberOfPages(), user = (($("#uName") || {}).textContent || "").trim(), when = new Date().toLocaleString("id-ID");
      for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120);
        doc.text(APP_CONFIG.APP_NAME + " · dicetak " + when + (user && user !== "-" ? " oleh " + user : ""), m, H - 14);
        doc.text("hal. " + i + " / " + n, W - m, H - 14, { align: "right" }); }
      return doc.output("blob");
    };
    head();
    return { doc, W, H, m, top: 70, bot: H - 30, head, finish };
  }
  // tata letak untuk pembagian halaman (dalam piksel kanvas, relatif ke atas elemen akar):
  // keep = unit yang harus utuh dalam satu halaman (tabel, grafik, deret kotak, judul + isi berikutnya), dengan rentang kepala tabel (h0–h1);
  // cuts = titik potong yang diperbolehkan (bawah baris tabel, panel, unit)
  const KEEP = ".table-wrap, .chart, .grid.tiles, .rd-box, .rmc, .funnel, .kpis, .lb-row, .ds, .banner";
  function layoutOf(root, pr) {
    const t = root.getBoundingClientRect().top, Y = v => Math.round((v - t) * pr), keep = [], cuts = new Set();
    const vis = e => e.getClientRects().length && !SKIP(e);
    root.querySelectorAll(KEEP).forEach(e => { if (!vis(e)) return; const r = e.getBoundingClientRect(), th = e.querySelector("thead"), hr = th && th.getBoundingClientRect();
      // pre = awal panel tempat tabel berada (judul, saringan) agar tidak tertinggal sendirian di halaman sebelumnya
      const sec = e.closest("section.panel"), pre = sec && root.contains(sec) ? Y(sec.getBoundingClientRect().top) : null;
      keep.push({ a: Y(r.top), b: Y(r.bottom), h0: hr ? Y(hr.top) : null, h1: hr ? Y(hr.bottom) : null, pre: pre != null && pre < Y(r.top) ? pre : null }); });
    // judul (panel-h / h3) tidak boleh tertinggal sendirian di bawah halaman: satukan dengan unit sesudahnya
    root.querySelectorAll(".panel-h, h3, .note").forEach(e => { const n = e.nextElementSibling; if (!vis(e) || !n || !vis(n)) return;
      keep.push({ a: Y(e.getBoundingClientRect().top), b: Y(n.getBoundingClientRect().bottom), glue: 1 }); });
    root.querySelectorAll("tr, section, .panel-h, .grid > *, .rd-grid > *, " + KEEP).forEach(e => { if (vis(e)) { const r = e.getBoundingClientRect(); cuts.add(Y(r.bottom)); cuts.add(Y(r.top)); } });
    return { keep, cuts: [...cuts].sort((a, b) => a - b) };
  }
  // susun satu kanvas ke halaman PDF tanpa memotong unit: unit yang tidak muat di sisa halaman pindah ke halaman baru;
  // unit sedikit lebih tinggi dari satu halaman diperkecil agar muat; hanya tabel yang jauh lebih panjang dari satu halaman
  // dipotong di batas baris, dengan kepala tabel diulang di halaman lanjutan
  const FIT = .7;
  function place(P, cv, L, k) {
    const { doc, m, top, bot } = P, gap = 10;
    const draw = (sy, h, kk) => { const c = document.createElement("canvas"); c.width = cv.width; c.height = Math.max(1, Math.round(h));
      c.getContext("2d").drawImage(cv, 0, sy, cv.width, h, 0, 0, cv.width, h);
      doc.addImage(c.toDataURL("image/jpeg", .92), "JPEG", m, P.y, cv.width * kk, h * kk); P.y += h * kk; };
    const pageH = (bot - top) / k, keep = L.keep.filter(r => r.b - r.a <= pageH / FIT);
    // tabel yang jauh lebih panjang dari satu halaman: boleh dipotong di batas baris, tetapi kepala tabel + 3 baris pertama tidak dipisah
    const bigT = L.keep.filter(r => r.h1 != null && r.b - r.a > pageH / FIT);
    const inside = c => keep.some(r => r.a + 2 < c && c < r.b - 2) || bigT.some(r => (r.pre != null && r.a - r.pre < pageH * .3 ? r.pre : r.a) + 2 < c && c < r.h1 + 3 * (r.h1 - r.h0));
    const cont = c => bigT.find(r => c > r.h1 && c < r.b - 2) || null;
    let sy = 0, hdr = null;
    while (sy < cv.height - 2) {
      let avail = (bot - P.y) / k;
      // kepala tabel diulang di halaman lanjutan
      if (hdr && sy > hdr.h1 && sy < hdr.b && P.y === top) { draw(hdr.h0, hdr.h1 - hdr.h0, k); avail = (bot - P.y) / k; }
      const rest = cv.height - sy;
      if (rest * .85 <= avail) { draw(sy, rest, Math.min(k, avail * k / rest)); P.y += gap; return; }
      const safe = L.cuts.filter(c => c > sy + 4 && c <= sy + avail && !inside(c)).pop();
      if (safe) { draw(sy, safe - sy, k); sy = safe; hdr = cont(sy); P.next(); continue; }
      if (P.y > top) { P.next(); continue; }
      // di awal halaman dan tidak ada titik potong aman: unit pertama lebih tinggi dari satu halaman
      const u = keep.filter(r => r.a <= sy + 4 && r.b > sy + avail).sort((x, y) => y.b - x.b)[0];
      if (u) { const h = u.b - sy, kk = Math.min(k, (bot - P.y) / h); draw(sy, h, kk); sy = u.b; P.next(); continue; }
      // tidak ada batas baris yang pas (baris sangat tinggi): potong pada batas halaman
      const c = L.cuts.filter(x => x > sy + avail * .3 && x <= sy + avail).pop() || Math.floor(sy + avail);
      draw(sy, c - sy, k); sy = c; hdr = cont(sy); P.next();
    }
  }
  async function run(sec, kind) {
    const title = titleOf(sec), name = fname(ctxOf() + "-" + title) + "-" + iso(new Date());
    if (kind === "csv" || kind === "xlsx") {
      const leg = sec.querySelector(".xp-legacy");
      if (leg) { XMODE = kind; try { leg.click(); } finally { XMODE = null; } return; }
      const aoa = aoaOf(sec); if (!aoa.length) { toast("Tidak ada tabel atau grafik di bagian ini."); return; }
      if (kind === "xlsx") saveXlsx(name, [[ctxOf() + " · " + title], [], ...aoa]); else saveCsv(name, aoa);
      return;
    }
    toast("Menyiapkan " + (kind === "pdf" ? "PDF" : "gambar") + "…");
    try {
      // unduh satu bagian: judul bagian sudah ada di kop, jadi tidak digambar ulang
      let L = null; sec.classList.add("xp-one");
      const cv = await snap(sec, true, pr => { L = layoutOf(sec, pr); }).finally(() => sec.classList.remove("xp-one"));
      if (kind === "png") { const b = await new Promise(r => cv.toBlob(r, "image/png")); saveFile(name + ".png", b); return; }
      const P = await pdfNew(cv.width > cv.height * 1.1 ? "landscape" : "portrait", ctxOf() + " · " + title);
      P.y = P.top; P.next = () => { P.doc.addPage(); P.head(); P.y = P.top; };
      place(P, cv, L, (P.W - P.m * 2) / cv.width);
      saveFile(name + ".pdf", P.finish());
    } catch (er) { toast(er.message || "Gagal membuat file."); }
  }
  // cetak satu menu utuh ke PDF (A4 mendatar): tiap blok di layar digambar terpisah lalu disusun per halaman tanpa memotong
  // tabel/grafik (lihat place). Tabel dicetak sebanyak baris yang sedang tampil.
  async function page() {
    const v = $("#view"), title = ctxOf();
    const vis = e => !SKIP(e) && e.getClientRects().length && e.offsetHeight > 0;
    const top0 = [...v.children].filter(vis); if (!top0.length) { toast("Tidak ada isi untuk dicetak."); return; }
    toast("Menyiapkan PDF " + title + "…");
    try {
      const P = await pdfNew("landscape", title), iw = P.W - P.m * 2;
      P.y = P.top; P.next = () => { P.doc.addPage(); P.head(); P.y = P.top; };
      const bw = Math.max(...top0.map(e => e.offsetWidth)), pagePx = (P.bot - P.top) * bw / iw;
      // blok pembungkus (grid) yang terlalu tinggi dipecah menjadi isinya agar potongan halaman jatuh di antara panel
      const blocks = [], walk = el => [...el.children].filter(vis).forEach(c => {
        const kids = [...c.children].filter(vis);
        if (c.offsetHeight > pagePx && kids.length > 1 && !c.matches("section, table, canvas, .panel")) walk(c); else blocks.push(c);
      });
      walk(v);
      for (const b of blocks) {
        let L = null;
        const cv = await snap(b, false, pr => { L = layoutOf(b, pr); L.keep.push({ a: 0, b: Math.round(b.scrollHeight * pr) }); });
        const pr = cv._pr || 1;
        place(P, cv, L, Math.min(iw / bw, iw * pr / cv.width) / pr);
      }
      saveFile(fname(title) + "-" + iso(new Date()) + ".pdf", P.finish());
    } catch (er) { toast(er.message || "Gagal membuat PDF."); }
  }
  let pop = null;
  const close = () => { if (pop) { pop.remove(); pop = null; } };
  function open(btn, sec) {
    close(); y0 = scrollY; pop = document.createElement("div"); pop.className = "xp-pop"; pop.setAttribute("role", "menu");
    pop.innerHTML = [["xlsx", "Excel (.xlsx)", "data tabel"], ["csv", "CSV", "data tabel"], ["pdf", "PDF", "tampilan tabel / grafik"], ["png", "Gambar (PNG)", "tampilan tabel / grafik"]]
      .map(([k, l, s]) => `<button type="button" role="menuitem" data-xk="${k}"><b>${l}</b><small>${s}</small></button>`).join("");
    document.body.appendChild(pop);
    const r = btn.getBoundingClientRect(), pw = 210; pop.style.top = Math.min(innerHeight - 200, r.bottom + 6) + "px"; pop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.right - pw)) + "px";
    pop.querySelectorAll("[data-xk]").forEach(b => b.onclick = e => { e.stopPropagation(); const k = b.dataset.xk; close(); run(sec, k); });
  }
  document.addEventListener("click", e => { if (pop && !e.target.closest(".xp-pop, .xp")) close(); }, true);
  let y0 = 0; addEventListener("scroll", () => { if (pop && Math.abs(scrollY - y0) > 80) close(); }, { passive: true }); addEventListener("resize", close);
  function decorate(root) {
    if (!root) return;
    [...root.querySelectorAll("section.panel, .l-qvp")].forEach(sec => {
      const h = sec.querySelector(":scope > .panel-h, :scope > .l-qvh"); if (!h) return;
      h.querySelectorAll(":scope button.btn, :scope .toolbar > button.btn").forEach(b => { if (/^Ekspor CSV$/i.test(b.textContent.trim())) b.classList.add("xp-legacy"); });
      const has = sec.querySelector("table, canvas");
      let b = h.querySelector(":scope > .xp, :scope .toolbar > .xp");
      if (!has) { if (b) b.remove(); return; }
      if (b) return;
      b = document.createElement("button"); b.type = "button"; b.className = "btn xp"; b.title = "Unduh tabel / grafik"; b.innerHTML = ICO + "<span>Unduh</span>";
      b.onclick = e => { e.stopPropagation(); open(b, sec); };
      const tb = h.querySelector(":scope > .toolbar"); (tb || h).appendChild(b);
    });
  }
  return { decorate, run, page };
})();
window.Exp = Exp;
