/* ================= router & shell ================= */
const VIEWS = {
  beranda: ["Beranda", "Dashboard Konsumer", viewBeranda],
  keragaan: ["Keragaan Konsumer", "Menu 1", viewKeragaan],
  produktivitas: ["Produktivitas RM", "Menu 2", viewRM],
  nominatif: ["Nominatif Portofolio", "Menu 3", viewNom],
  kualitas: ["Kualitas Kredit", "Menu 4", viewKual],
  pipeline: ["Pipeline Brispot RM", "Menu 5", viewPipeline],
  simulasi: ["Simulasi Suku Bunga", "Menu 6", viewSimAll],
  admin: ["Admin", "Admin", viewAdmin]
};
const curView = () => { const h = location.hash.slice(1); return VIEWS[h] && Auth.can(h) ? h : "beranda"; };
function render() {
  if (!Auth.session) return;
  const k = curView(), [title, eb, fn] = VIEWS[k], home = k === "beranda";
  $("#landing").hidden = !home; $("#app").hidden = home; document.body.classList.toggle("at-home", home); document.body.classList.toggle("qv-open", !!LQV.key);
  const v = home ? $("#landing") : $("#view");
  document.querySelectorAll(".nav a").forEach(a => a.dataset.v === k ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  $("#pageTitle").textContent = title; $("#eyebrow").textContent = eb;
  { const tt = document.querySelector(".topbar .ttl"); if (tt && tt.dataset.v !== title) { tt.dataset.v = title; tt.classList.remove("tb-in"); void tt.offsetWidth; tt.classList.add("tb-in"); } }
  Object.keys(charts).forEach(id => { charts[id].destroy(); delete charts[id]; });
  try { fn(v); } catch (er) { console.error(er); v.innerHTML = `<section class="panel"><div class="empty"><p style="font-weight:700;margin:0 0 6px">Bagian ini belum bisa ditampilkan</p>${esc(er.message || er)}</div></section>`; }
  setupSections(v, k); Exp.decorate(v);
}
// tombol Unduh tetap ada saat isi section digambar ulang (sub-tab, filter di dalam section)
{ let t = 0; const deco = () => { clearTimeout(t); t = setTimeout(() => { Exp.decorate($("#view")); Exp.decorate($("#landing")); }, 60); };
  new MutationObserver(deco).observe(document.body, { childList: true, subtree: true }); }
// impor (dipakai parser file upload)
const normKey = k => String(k).trim().toLowerCase().replace(/[\s\-\/]+/g, "_").replace(/[^a-z0-9_]/g, "");
function normDate(v) {
  if (v instanceof Date) return iso(v);
  if (typeof v === "number") { const d = new Date(Math.round((v - 25569) * 864e5)); return d.toISOString().slice(0, 10); }
  const s = String(v).trim(), m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : s.slice(0, 10);
}
document.querySelectorAll("dialog").forEach(d => {
  d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) d.close(); });
});
$("#btnData").onclick = () => { if (curView() === "admin") { AD.tab = "data"; renderAdminTab(); } else openData(); };
$("#btnSync").onclick = e => doSync(isAdmin(), e.currentTarget);
$("#btnTheme").onclick = () => {
  const root = document.documentElement, dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark"; lsSet(STORE + "-theme", root.dataset.theme);
};
const th = lsGet(STORE + "-theme"); if (th) document.documentElement.dataset.theme = th;
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
$("#btnUser").onclick = () => { const m = $("#userMenu"); m.hidden = !m.hidden; $("#btnUser").setAttribute("aria-expanded", String(!m.hidden)); };
document.addEventListener("click", e => { if (!e.target.closest(".umenu")) $("#userMenu").hidden = true; });
$("#umOut").onclick = () => Auth.logout("manual");
$("#umPw").onclick = openPw;
function syncLabel() { const M = DB.meta; const s = $("#syncSt"); if (s) s.textContent = M && M.updated ? "data " + new Date(M.updated).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""; }
// perpindahan layar yang halus: View Transitions bila didukung browser, selain itu animasi masuk CSS
let lastView = null;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
function navTo() {
  if (!Auth.session) return;
  const k = curView(), changed = k !== lastView, prev = lastView; lastView = k;
  if (changed && prev !== null) uiSound(k === "beranda" ? "home" : "nav");
  if (!changed || prev === null || reduceMotion) { render(); if (changed) window.scrollTo(0, 0); return; }
  const kind = k === "beranda" || prev === "beranda" ? "zoom" : "slide";
  if (document.startViewTransition) {
    document.documentElement.dataset.vt = kind;
    const vt = document.startViewTransition(() => { render(); window.scrollTo(0, 0); });
    vt.finished.finally(() => { delete document.documentElement.dataset.vt; });
  } else {
    render(); window.scrollTo(0, 0);
    const el = k === "beranda" ? $("#landing") : $("#view"); el.classList.remove("v-enter", "v-zoom"); void el.offsetWidth;
    el.classList.add(kind === "zoom" ? "v-zoom" : "v-enter"); setTimeout(() => el.classList.remove("v-enter", "v-zoom"), 600);
  }
}
window.addEventListener("hashchange", navTo);

/* ---------- suara antarmuka: file SFX (sfx/*.mp3) sesuai Panduan Coding Sound ---------- */
// satu arah gerak = satu arah nada: masuk dashboard naik (enter), kembali ke beranda turun (back)
const uiSound = kind => SFX.play({ nav: "enter", home: "back", move: "hover", on: "on", close: "close" }[kind] || "click", kind === "move" ? { minGap: 70 } : {});
function sndLabel() {
  const on = SFX.enabled, b = $("#btnSnd"); if (b) { b.setAttribute("aria-pressed", String(on)); b.style.opacity = on ? 1 : .55; b.title = on ? "Suara klik: aktif" : "Suara klik: mati"; }
  const l = $("#lSnd"); if (l) l.textContent = on ? "Suara klik: aktif" : "Suara klik: mati";
}
const toggleSnd = () => { SFX.enabled = !SFX.enabled; sndLabel(); if (SFX.enabled) { SFX.load(); uiSound("on"); } };
$("#btnSnd").onclick = toggleSnd;
document.addEventListener("click", e => { if (e.target.closest("#lSnd")) toggleSnd(); }, true);
document.addEventListener("click", e => {
  const t = e.target.closest("a, button, [data-rm], [data-area], [data-kc], tr[data-i], summary, th.sortable, label.check"); if (!t) return;
  if (t.matches("#btnSnd, #lSnd, #inSkip, #inGate")) return;
  // pindah layar: suaranya dibunyikan oleh navTo (naik = masuk dashboard, turun = kembali ke beranda)
  if (t.matches('a[href^="#"]') && t.getAttribute("href").slice(1) !== location.hash.slice(1) && !(t.getAttribute("href") === "#beranda" && curView() === "beranda")) return;
  if (t.matches(".l-card, .nav a, .ttl a")) uiSound("nav");
  else if (t.matches("[data-close]")) uiSound("close");
  else uiSound("tick");
}, true);
document.addEventListener("change", e => { if (e.target.matches("select, input[type=checkbox], input[type=month]")) uiSound("tick"); }, true);
// sorot kartu & menu (hanya perangkat dengan mouse), dibatasi agar tidak beruntun
if (matchMedia("(hover: hover) and (pointer: fine)").matches) document.addEventListener("pointerover", e => {
  const t = e.target.closest(".l-card, .nav a, .rm-mode button, .seg button, .ptabs button"); if (!t || t.contains(e.relatedTarget)) return;
  uiSound("move");
});
sndLabel();
