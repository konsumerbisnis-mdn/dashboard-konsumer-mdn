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
      const cv = await snap(sec);
      if (kind === "png") { const b = await new Promise(r => cv.toBlob(r, "image/png")); saveFile(name + ".png", b); return; }
      await lib("pdf"); const { jsPDF } = window.jspdf;
      const land = cv.width > cv.height * 1.1, doc = new jsPDF({ orientation: land ? "landscape" : "portrait", unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), m = 28, top = 46, iw = W - m * 2, scale = iw / cv.width, pageH = (H - top - m) / scale;
      for (let y = 0, p = 0; y < cv.height; y += pageH, p++) {
        if (p) doc.addPage();
        doc.setFontSize(11); doc.setTextColor(30); doc.text((ctxOf() + " · " + title).slice(0, 110), m, 26);
        doc.setFontSize(8); doc.setTextColor(120); doc.text("Dashboard Konsumer Region I - Medan · diunduh " + new Date().toLocaleString("id-ID") + (p ? " · hal. " + (p + 1) : ""), m, 38);
        const h = Math.min(pageH, cv.height - y), part = document.createElement("canvas"); part.width = cv.width; part.height = Math.ceil(h);
        part.getContext("2d").drawImage(cv, 0, y, cv.width, h, 0, 0, cv.width, h);
        doc.addImage(part.toDataURL("image/jpeg", .92), "JPEG", m, top, iw, h * scale);
      }
      saveFile(name + ".pdf", doc.output("blob"));
    } catch (er) { toast(er.message || "Gagal membuat file."); }
  }
  // cetak satu menu utuh ke PDF (A4 mendatar): tiap blok di layar digambar terpisah lalu disusun per halaman,
  // blok hanya dipotong bila lebih tinggi dari satu halaman. Tabel dicetak sebanyak baris yang sedang tampil.
  async function page() {
    const v = $("#view"), title = ctxOf();
    const vis = e => !SKIP(e) && e.getClientRects().length && e.offsetHeight > 0;
    const top0 = [...v.children].filter(vis); if (!top0.length) { toast("Tidak ada isi untuk dicetak."); return; }
    toast("Menyiapkan PDF " + title + "…");
    try {
      await lib("pdf"); const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), m = 28, top = 50, bot = H - 30, iw = W - m * 2, gap = 10;
      const bw = Math.max(...top0.map(e => e.offsetWidth)), pagePx = (bot - top) * bw / iw;
      const user = (($("#uName") || {}).textContent || "").trim(), when = new Date().toLocaleString("id-ID");
      const head = () => { doc.setFontSize(12); doc.setTextColor(30); doc.text(title.slice(0, 110), m, 26);
        doc.setFontSize(8); doc.setTextColor(120); doc.text(APP_CONFIG.APP_NAME + " · dicetak " + when + (user && user !== "-" ? " oleh " + user : ""), m, 38); };
      // blok pembungkus (grid) yang terlalu tinggi dipecah menjadi isinya agar potongan halaman jatuh di antara panel
      const blocks = [], walk = el => [...el.children].filter(vis).forEach(c => {
        const kids = [...c.children].filter(vis);
        if (c.offsetHeight > pagePx && kids.length > 1 && !c.matches("section, table, canvas, .panel")) walk(c); else blocks.push(c);
      });
      walk(v);
      head(); let y = top;
      const next = () => { doc.addPage(); head(); y = top; };
      for (const b of blocks) {
        // batas potong yang rapi (bawah baris tabel / panel), dalam piksel kanvas
        let cuts = [];
        const cv = await snap(b, false, pr => { const t = b.getBoundingClientRect().top;
          cuts = [...b.querySelectorAll("tr, section, .panel-h, .grid > *")].map(e => Math.round((e.getBoundingClientRect().bottom - t) * pr)).sort((a, c) => a - c); });
        const pr = cv._pr || 1, k = Math.min(iw / bw, iw * pr / cv.width) / pr; // pt per piksel kanvas
        if (y > top && y + cv.height * k > bot) next();
        for (let sy = 0; sy < cv.height;) {
          const room = Math.floor((bot - y) / k), cut = sy + room < cv.height ? cuts.filter(c => c > sy + room * .5 && c <= sy + room).pop() : null;
          const h = cut ? cut - sy : Math.min(room, cv.height - sy), part = document.createElement("canvas"); part.width = cv.width; part.height = h;
          part.getContext("2d").drawImage(cv, 0, sy, cv.width, h, 0, 0, cv.width, h);
          doc.addImage(part.toDataURL("image/jpeg", .92), "JPEG", m, y, cv.width * k, h * k);
          sy += h; y += h * k + gap; if (sy < cv.height) next();
        }
      }
      const n = doc.getNumberOfPages();
      for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120); doc.text("hal. " + i + " / " + n, W - m, H - 14, { align: "right" }); }
      saveFile(fname(title) + "-" + iso(new Date()) + ".pdf", doc.output("blob"));
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
