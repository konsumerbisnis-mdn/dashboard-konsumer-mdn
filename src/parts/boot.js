/* ================= login & pemuatan data dari Apps Script ================= */
function applyPart(p, o) {
  if (p === "meta") DB.meta = o || {};
  else if (p === "ker") { DB.ker = o && o.dates ? o : null; prepKer(); }
  else if (p.startsWith("rmk_")) DB.rmkSets[p.slice(-1)] = o && o.months ? o : null;
  else if (p.startsWith("pipe_")) DB.pipeSets[p.slice(-1)] = o && o.items ? o : null;
  else if (p.startsWith("lw_")) DB.lwSets[p.slice(-1)] = o && o.n ? o : null;
  else if (p === "gerak") DB.gerak = o || {};
  else if (p === "foto") DB.foto = o && o.rm ? o : { rm: {}, kc: {} };
  else if (p === "rate") DB.rate = o && o.rows ? o : null;
  else if (p === "brs_B") DB.brs = o && o.rm ? o : null;
}
async function loadParts(parts, onEach) {
  await Promise.all(parts.map(async p => { const j = await Auth.call("data", { part: p }); applyPart(p, await Auth.Crypt.gunzip(j.gz)); if (onEach) onEach(p); }));
  if (parts.some(p => p.startsWith("rmk_"))) useRM(SEG.rm);
  if (parts.some(p => p.startsWith("pipe_"))) usePipe(SEG.pipe);
  if (parts.some(p => p.startsWith("lw_"))) { prepKer(); useLW(SEG.lw); }
  syncLabel();
}
const bootMsg = (t, q) => { const b = $("#boot"); b.hidden = !t; if (t) { $("#bootMsg").textContent = t; $("#bootBar").style.width = Math.round((q || 0) * 100) + "%"; } };
let LOAD_SEQ = 0;
async function loadAll(silent) {
  const seq = ++LOAD_SEQ, core = ["ker", "rmk_R", "rmk_M", "rmk_K", "gerak", "foto", "rate", "pipe_B", "pipe_K", "brs_B"];
  LOADING.core = LOADING.lw = true; KER_LOADING = RM_LOADING = PIPE_LOADING = RATE_LOADING = true;
  let n = 0; const tot = core.length + 1;
  if (!silent) bootMsg("Menyiapkan data…", .05);
  try {
    await loadParts(["meta"]); n++;   // meta dulu: bila cache server belum ada, dibangun sekali di sini
    if (!silent) bootMsg("Memuat data…", n / tot);
    await loadParts(core, () => { n++; if (!silent) bootMsg("Memuat data… " + Math.round(n / tot * 100) + "%", n / tot); });
  } catch (er) { if (seq === LOAD_SEQ) toast(er.message); }
  if (seq !== LOAD_SEQ) return;
  LOADING.core = false; KER_LOADING = RM_LOADING = PIPE_LOADING = RATE_LOADING = false; bootMsg("");
  KS.date = KS.date || null; render();
  if (Auth.can("detail")) { try { await loadParts(["lw_B", "lw_K"]); } catch (er) { toast("LW321: " + er.message); } }
  if (seq !== LOAD_SEQ) return;
  LOADING.lw = false;
  if (["beranda", "nominatif", "kualitas", "keragaan"].includes(curView())) render();
}
function showLogin(msg) {
  $("#app").hidden = true; $("#landing").hidden = true; $("#login").hidden = false; bootMsg("");
  document.body.classList.remove("at-home", "qv-open"); document.body.classList.add("at-login");
  const m = $("#lgMsg"); if (msg) { m.hidden = false; m.textContent = msg; } else m.hidden = true;
  setTimeout(() => { if (!$("#intro") || $("#intro").hidden) $("#lgUser").focus(); }, 60);
}
function enterApp() {
  const u = Auth.user; $("#login").hidden = true; document.body.classList.remove("at-login");
  $("#uName").textContent = u.nama || u.username; $("#uRole").textContent = Auth.ROLE_LABEL[u.role] || u.role;
  $("#uAv").textContent = String(u.nama || u.username).split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  document.querySelectorAll("[data-perm]").forEach(a => a.hidden = !Auth.can(a.dataset.perm));
  document.documentElement.dataset.role = u.role;
  lastView = curView(); render(); loadAll();
}
$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault(); const b = $("#lgBtn"), m = $("#lgMsg"), un = Auth.cleanInput($("#lgUser").value, 60), pw = $("#lgPass").value;
  if (!un || !pw) { m.hidden = false; m.textContent = "Isi username dan password."; return; }
  b.disabled = true; b.textContent = "Memeriksa…"; m.hidden = true;
  try { await Auth.login(un, pw); $("#lgPass").value = ""; uiSound("nav"); enterApp(); }
  catch (er) { m.hidden = false; m.textContent = er.message; }
  b.disabled = false; b.textContent = "Masuk";
});
$("#lgEye").onclick = () => { const i = $("#lgPass"); i.type = i.type === "password" ? "text" : "password"; $("#lgEye").setAttribute("aria-label", i.type === "password" ? "Tampilkan password" : "Sembunyikan password"); };
function resetData() {
  ++LOAD_SEQ; Object.assign(DB, { meta: null, ker: null, rmk: null, pipe: null, lw: null, rate: null, brs: null, rmkSets: {}, pipeSets: {}, lwSets: {}, gerak: {}, foto: { rm: {}, kc: {} } });
  LWR = []; LWK = new Map(); LWCIF = new Map(); LWPK = new Map(); LWPCIF = new Map(); KV = null;
  Object.keys(charts).forEach(id => { charts[id].destroy(); delete charts[id]; }); $("#view").innerHTML = ""; $("#landing").innerHTML = "";
  document.querySelectorAll("dialog[open]").forEach(d => d.close());
}
window.addEventListener("auth:expired", () => { resetData(); showLogin("Sesi berakhir. Silakan login lagi."); });
window.addEventListener("auth:logout", e => { resetData(); showLogin(e.detail === "idle" ? "Anda keluar otomatis karena 30 menit tidak aktif." : ""); });
