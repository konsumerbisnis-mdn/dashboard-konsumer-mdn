/* ================= animasi halus: kartu muncul bertahap + angka menghitung naik ================= */
// Hanya gerak (transform / opacity / teks angka); warna dan tema tidak diubah. Mati otomatis bila perangkat memakai "kurangi gerakan".
// mode ringan: semua animasi hiasan dimatikan (otomatis bila perangkat terasa lambat, atau dipilih lewat tombol "Animasi" di beranda)
const LITE = { on: lsGet(STORE + "-lite") === "1" };
const setLite = on => { LITE.on = on; lsSet(STORE + "-lite", on ? "1" : "0"); document.documentElement.classList.toggle("lite", on); aniLabel(); };
const aniLabel = () => { const l = $("#lAni"); if (l) l.textContent = LITE.on ? "Animasi: ringan" : "Animasi: penuh"; };
document.documentElement.classList.toggle("lite", LITE.on);
const Anim = (() => {
  const mq = matchMedia("(prefers-reduced-motion: reduce)"), prev = new Map();
  let lastView = null;
  const NUM = /[-+−]?\d{1,3}(?:\.\d{3})+(?:,\d+)?|[-+−]?\d+(?:,\d+)?/g;
  const parse = s => { const neg = /^[-−]/.test(s), body = s.replace(/^[-+−]/, ""), dec = (body.split(",")[1] || "").length,
    v = parseFloat(body.replace(/\./g, "").replace(",", ".")); return { v: neg ? -v : v, dec, th: body.split(",")[0].includes("."), plus: s[0] === "+", minus: s[0] === "−" ? "−" : "-" }; };
  const fmt = (v, p) => { const a = Math.abs(v), t = a.toLocaleString("id-ID", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec, useGrouping: p.th });
    return (v < 0 && a >= Math.pow(10, -p.dec) / 2 ? p.minus : p.plus ? "+" : "") + t; };
  const ease = t => 1 - Math.pow(1 - t, 3);
  // angka di dalam elemen (hanya node teks) dihitung dari nilai sebelumnya (atau 0) ke nilai akhir
  function countUp(el, key, dur) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), items = [];
    for (let n; (n = walker.nextNode());) { const s = n.nodeValue, m = s.match(NUM); if (m && m.length) items.push({ n, s, ps: m.map(parse), parts: s.split(NUM) }); }
    if (!items.length) return;
    const flat = items.flatMap(it => it.ps), old = prev.get(key), from = flat.map((p, i) => old && old.length === flat.length && isFinite(old[i]) ? old[i] : 0);
    prev.set(key, flat.map(p => p.v));
    if (flat.every((p, i) => p.v === from[i])) return;
    const t0 = performance.now(); let lastT = 0;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t); let k = 0;
      if (t < 1 && now - lastT < 33) { requestAnimationFrame(step); return; } lastT = now;   // ±30 fps: cukup halus untuk angka, lebih ringan
      items.forEach(it => { it.n.nodeValue = t >= 1 ? it.s : it.parts.reduce((o, part, i) => o + part + (i < it.ps.length ? fmt(from[k + i] + (it.ps[i].v - from[k + i]) * e, it.ps[i]) : ""), ""); k += it.ps.length; });
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const stagger = (els, base, gap, cls) => els.filter(el => !el.hidden && el.getBoundingClientRect().top < innerHeight * 1.05).slice(0, 12).forEach((el, i) => {   // hanya yang terlihat (maks. 12) el.style.setProperty("--si", base + i * gap + "ms"); el.classList.add(cls);
    el.addEventListener("animationend", function f(e) { if (e.target !== el) return; el.classList.remove(cls); el.style.removeProperty("--si"); el.removeEventListener("animationend", f); }); });
  // pantau kelancaran 1,6 dtk sesudah pindah halaman; bila sering tersendat 2x berturut-turut, pindah ke mode ringan otomatis
  let strikes = 0;
  function watch(k) {
    if (k === "beranda" && strikes === 0) return;
    const t0 = performance.now(); let last = t0, bad = 0;
    const f = t => { const d = t - last; last = t; if (t - t0 > 120 && d > 40 && d < 450) bad++; if (t - t0 < 1600) requestAnimationFrame(f); else { strikes = bad >= 7 ? strikes + 1 : 0; if (strikes >= 2 && !LITE.on) { setLite(true); toast("Animasi diringankan otomatis agar tidak patah-patah. Bisa dikembalikan lewat tombol Animasi di beranda."); } } };
    requestAnimationFrame(f);
  }
  function run(v, k) {
    if (mq.matches || LITE.on || !v) return;
    watch(k);
    const first = lastView !== k; lastView = k;
    if (first) {
      if (k === "beranda") stagger([...v.querySelectorAll(".l-head, .l-card, .l-qv, .l-side, .l-meta")], 0, 70, "stg");
      else { const top = [...v.children].filter(e => e.tagName !== "STYLE"); stagger(top, 0, 70, "stg"); stagger([...v.querySelectorAll(".tile")], 140, 55, "stg"); }
    }
    v.querySelectorAll(".tile .val, .rmc-ring .val").forEach((el, i) => countUp(el, k + "|" + i + "|" + ((el.closest(".tile") || {}).firstElementChild || {}).textContent, first ? 750 : 450));
  }
  return { run };
})();
