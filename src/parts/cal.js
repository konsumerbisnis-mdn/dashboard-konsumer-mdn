/* ================= pemilih tanggal berbentuk kalender (satu tanggal atau beberapa tanggal) ================= */
// calField(id, nilai, opsi) → tombol kalender + <input type="hidden" id> (handler "change" lama pada id itu tetap bekerja).
// opsi: min / max (yyyy-mm-dd), enabled (Set tanggal yang boleh dipilih), clear (boleh dikosongkan), placeholder,
//       multi + get() / set(arr) / label() / marks {tanggal: jumlah} untuk pilihan beberapa tanggal.
const CAL_BLN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const CAL_HR = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const CAL_ICO = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
const CALS = {};
let CAL_OPEN = null;
const calIso = (y, m, d) => y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
const calLabel = id => { const c = CALS[id] || {}, v = $("#" + id) ? $("#" + id).value : ""; return c.multi ? c.label() : v ? tglS(v) : (c.placeholder || "Pilih tanggal"); };
function calField(id, value, cfg = {}) {
  CALS[id] = cfg;
  return `<span class="calf"><input type="hidden" id="${id}" value="${esc(value || "")}"><button type="button" class="ctl cal-btn" data-cal="${id}" aria-haspopup="dialog"><span>${value ? tglS(value) : esc(cfg.placeholder || "Pilih tanggal")}</span>${CAL_ICO}</button></span>`;
}
function calClose() { if (CAL_OPEN) { CAL_OPEN.pop.remove(); CAL_OPEN = null; } }
function calOpen(btn) {
  const id = btn.dataset.cal, cfg = CALS[id]; if (!cfg) return;
  if (CAL_OPEN && CAL_OPEN.id === id) { calClose(); return; }
  calClose();
  const inp = $("#" + id), today = (() => { const t = new Date(); return calIso(t.getFullYear(), t.getMonth(), t.getDate()); })();
  const selOf = () => cfg.multi ? cfg.get() : (inp && inp.value ? [inp.value] : []);
  const base = selOf().slice().sort().pop() || cfg.max || today;
  let y = +base.slice(0, 4), m = +base.slice(5, 7) - 1;
  const minY = cfg.min ? +cfg.min.slice(0, 4) : y - 5, maxY = cfg.max ? +cfg.max.slice(0, 4) : y + 1;
  const pop = document.createElement("div"); pop.className = "cal-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Pilih tanggal");
  const ok = iso => (!cfg.min || iso >= cfg.min) && (!cfg.max || iso <= cfg.max) && (!cfg.enabled || cfg.enabled.has(iso));
  const setLabel = () => { const s = btn.querySelector("span"); if (s) s.textContent = calLabel(id); };
  const pick = iso => {
    if (cfg.multi) { const a = cfg.get().slice(), i = a.indexOf(iso); i >= 0 ? a.splice(i, 1) : a.push(iso); cfg.set(a.sort()); setLabel(); draw(); return; }
    inp.value = iso; setLabel(); inp.dispatchEvent(new Event("change", { bubbles: true })); calClose();
  };
  function draw() {
    const sel = new Set(selOf()), first = new Date(y, m, 1), off = (first.getDay() + 6) % 7, dim = new Date(y, m + 1, 0).getDate();
    const yrs = []; for (let k = Math.min(minY, y); k <= Math.max(maxY, y); k++) yrs.push(k);
    let cells = ""; for (let i = 0; i < off; i++) cells += '<span class="cal-e"></span>';
    for (let d = 1; d <= dim; d++) { const iso = calIso(y, m, d), on = ok(iso), n = cfg.marks && cfg.marks[iso];
      cells += `<button type="button" class="cal-d${on ? "" : " off"}${sel.has(iso) ? " sel" : ""}${iso === today ? " today" : ""}${n ? " has" : ""}" data-iso="${iso}" ${on ? "" : "disabled"} ${n ? `title="${n} debitur"` : ""}>${d}${n ? `<i>${n}</i>` : ""}</button>`; }
    const prevOk = !cfg.min || calIso(y, m, 1) > cfg.min, nextOk = !cfg.max || calIso(y, m + 1, 1) <= cfg.max;
    pop.innerHTML = `<div class="cal-h"><button type="button" class="cal-nav" data-nav="-1" aria-label="Bulan sebelumnya" ${prevOk ? "" : "disabled"}>‹</button>
        <select class="cal-m" aria-label="Bulan">${CAL_BLN.map((b, i) => `<option value="${i}" ${i === m ? "selected" : ""}>${b}</option>`).join("")}</select>
        <select class="cal-y" aria-label="Tahun">${yrs.map(k => `<option ${k === y ? "selected" : ""}>${k}</option>`).join("")}</select>
        <button type="button" class="cal-nav" data-nav="1" aria-label="Bulan berikutnya" ${nextOk ? "" : "disabled"}>›</button></div>
      <div class="cal-w">${CAL_HR.map(h => `<span>${h}</span>`).join("")}</div><div class="cal-g">${cells}</div>
      <div class="cal-f">${cfg.multi ? `<button type="button" data-act="all">Pilih semua</button><button type="button" data-act="none">Hapus pilihan</button>`
        : `${cfg.max ? `<button type="button" data-act="last">Terbaru</button>` : ""}${ok(today) ? `<button type="button" data-act="today">Hari ini</button>` : ""}${cfg.clear ? `<button type="button" data-act="clear">Hapus</button>` : ""}`}
        <button type="button" data-act="close">Tutup</button></div>`;
    pop.querySelectorAll("[data-nav]").forEach(b => b.onclick = () => { m += +b.dataset.nav; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); });
    pop.querySelector(".cal-m").onchange = e => { m = +e.target.value; draw(); };
    pop.querySelector(".cal-y").onchange = e => { y = +e.target.value; draw(); };
    pop.querySelectorAll("[data-iso]").forEach(b => b.onclick = () => pick(b.dataset.iso));
    pop.querySelectorAll("[data-act]").forEach(b => b.onclick = () => { const a = b.dataset.act;
      if (a === "close") return calClose();
      if (a === "today") return pick(today);
      if (a === "last") return pick(cfg.max);
      if (a === "clear") { inp.value = ""; setLabel(); inp.dispatchEvent(new Event("change", { bubbles: true })); return calClose(); }
      if (a === "all") { cfg.set([...cfg.enabled].filter(ok).sort()); setLabel(); draw(); }
      if (a === "none") { cfg.set([]); setLabel(); draw(); } });
  }
  draw();
  (document.fullscreenElement || document.body).appendChild(pop);
  const r = btn.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
  let top = r.bottom + 6; if (top + ph > innerHeight - 8 && r.top - ph - 6 > 8) top = r.top - ph - 6;
  pop.style.left = Math.max(8, Math.min(innerWidth - pw - 8, r.left)) + "px"; pop.style.top = Math.max(8, top) + "px";
  CAL_OPEN = { id, pop, y0: scrollY };
}
document.addEventListener("click", e => { const b = e.target.closest("[data-cal]"); if (b) { e.preventDefault(); calOpen(b); return; } if (CAL_OPEN && !e.target.closest(".cal-pop")) calClose(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && CAL_OPEN) calClose(); });
// halaman digulir jauh dari tombolnya: tutup (resize tidak menutup agar tidak hilang saat bilah alamat HP bergeser)
addEventListener("scroll", () => { if (CAL_OPEN && Math.abs(scrollY - CAL_OPEN.y0) > 140) calClose(); }, { passive: true });
