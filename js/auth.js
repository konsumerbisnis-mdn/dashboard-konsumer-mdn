/* Autentikasi, sesi, RBAC, dan helper enkripsi.
   - Password tidak pernah dikirim mentah: browser mengirim SHA-256("briguna|username|password"),
     server menyimpan hash ulang ber-salt (1.000 iterasi) sehingga isi sheet users tidak bisa dipakai login.
   - Token sesi disimpan di sessionStorage dalam bentuk terenkripsi AES-GCM. Kuncinya CryptoKey
     non-extractable di IndexedDB, jadi salinan sessionStorage tidak bisa dipakai di browser lain.
   - RBAC di sini hanya mengatur tampilan; pemeriksaan sebenarnya dilakukan di Apps Script. */
(function () {
  "use strict";
  const CFG = window.APP_CONFIG;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  const b64 = u8 => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  /* ---------- hash & enkripsi ---------- */
  async function sha256(text) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(text))); }
  const pwHash = (username, password) => sha256(`${CFG.HASH_PREFIX}|${String(username).trim().toLowerCase()}|${password}`);

  const KeyStore = {
    db: null,
    open() { return new Promise((res, rej) => { const r = indexedDB.open("ksm-auth", 1); r.onupgradeneeded = () => r.result.createObjectStore("k"); r.onsuccess = () => { this.db = r.result; res(); }; r.onerror = () => rej(r.error); }); },
    get(id) { return new Promise(res => { const q = this.db.transaction("k").objectStore("k").get(id); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); },
    put(id, v) { return new Promise(res => { const t = this.db.transaction("k", "readwrite"); t.objectStore("k").put(v, id); t.oncomplete = () => res(); t.onerror = () => res(); }); },
    del(id) { return new Promise(res => { const t = this.db.transaction("k", "readwrite"); t.objectStore("k").delete(id); t.oncomplete = () => res(); t.onerror = () => res(); }); }
  };
  let memKey = null;
  async function getKey(create) {
    if (memKey) return memKey;
    try {
      if (!KeyStore.db) await KeyStore.open();
      let k = await KeyStore.get("sess");
      if (!k && create) { k = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); await KeyStore.put("sess", k); }
      memKey = k; return k;
    } catch { // IndexedDB tidak tersedia (mode privat): kunci hanya di memori tab ini
      if (create) memKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
      return memKey;
    }
  }
  const Crypt = {
    async encrypt(obj) { const key = await getKey(true), iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)))); return b64(iv) + "." + b64(ct); },
    async decrypt(str) { const key = await getKey(false); if (!key || !str) return null;
      try { const [iv, ct] = str.split("."); return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(ct)))); } catch { return null; } },
    // dekompresi payload gzip+base64 dari Apps Script
    async gunzip(b64str) {
      if (b64str == null) return null;
      const bin = unb64(b64str), ds = new DecompressionStream("gzip");
      return JSON.parse(await new Response(new Blob([bin]).stream().pipeThrough(ds)).text());
    }
  };

  /* ---------- sesi ---------- */
  const SKEY = "ksm.sess";
  let SESSION = null, idleTimer = null;
  async function saveSession(s) { SESSION = s; try { sessionStorage.setItem(SKEY, await Crypt.encrypt(s)); } catch {} }
  async function loadSession() {
    let s = null; try { s = await Crypt.decrypt(sessionStorage.getItem(SKEY)); } catch {}
    if (s && s.exp > Date.now()) { SESSION = s; return s; }
    clearSession(); return null;
  }
  function clearSession() { SESSION = null; try { sessionStorage.removeItem(SKEY); } catch {} }

  /* ---------- API ke Apps Script ---------- */
  class ApiError extends Error { constructor(msg, code) { super(msg); this.code = code; } }
  async function call(action, payload = {}) {
    if (!/^https:\/\/script\.google\.com\//.test(CFG.API_URL) && !/^https?:\/\/(localhost|127\.0\.0\.1)/.test(CFG.API_URL))
      throw new ApiError("API_URL di js/config.js belum diisi dengan URL Web App Apps Script.", "config");
    // sync membangun ulang seluruh cache di server (bisa 5–6 menit), jadi ditunggu lebih lama dari request biasa
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), (action === "sync" ? (CFG.SYNC_TIMEOUT_SEC || 420) : CFG.TIMEOUT_SEC) * 1000);
    let res;
    try {
      // text/plain agar tidak memicu preflight CORS (Apps Script tidak menjawab OPTIONS)
      res = await fetch(CFG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, token: SESSION ? SESSION.token : undefined, ...payload }), signal: ctl.signal, redirect: "follow", credentials: "omit" });
    } catch (e) { throw new ApiError(e.name === "AbortError" ? "Server tidak menjawab. Periksa koneksi lalu coba lagi." : "Tidak bisa terhubung ke server.", "net"); }
    finally { clearTimeout(to); }
    let j; try { j = await res.json(); } catch { throw new ApiError("Jawaban server tidak bisa dibaca.", "parse"); }
    if (!j.ok) {
      if (j.code === "auth") { clearSession(); window.dispatchEvent(new CustomEvent("auth:expired")); }
      throw new ApiError(j.error || "Permintaan gagal.", j.code);
    }
    touch();
    return j;
  }

  /* ---------- login / logout ---------- */
  async function login(username, password) {
    const phash = await pwHash(username, password);
    const j = await call("login", { username: String(username).trim().toLowerCase(), phash });
    await saveSession({ token: j.token, user: j.user, exp: j.exp });
    startIdle(); return j.user;
  }
  async function logout(reason) {
    try { if (SESSION) await call("logout"); } catch {}
    clearSession(); stopIdle(); window.dispatchEvent(new CustomEvent("auth:logout", { detail: reason || "" }));
  }
  async function changePassword(oldPw, newPw) {
    const u = SESSION.user.username;
    return call("changePassword", { oldHash: await pwHash(u, oldPw), newHash: await pwHash(u, newPw) });
  }

  /* ---------- idle timeout ---------- */
  function touch() { if (SESSION) { clearTimeout(idleTimer); idleTimer = setTimeout(() => logout("idle"), CFG.IDLE_MINUTES * 60000); } }
  function startIdle() { ["click", "keydown", "touchstart", "scroll"].forEach(ev => window.addEventListener(ev, touch, { passive: true })); touch(); }
  function stopIdle() { clearTimeout(idleTimer); ["click", "keydown", "touchstart", "scroll"].forEach(ev => window.removeEventListener(ev, touch)); }

  /* ---------- RBAC (tampilan) ---------- */
  const PERM = {
    beranda: ["admin", "rm", "guest"], keragaan: ["admin", "rm", "guest"], produktivitas: ["admin", "rm", "guest"],
    nominatif: ["admin", "rm"], kualitas: ["admin", "rm", "guest"], pipeline: ["admin", "rm", "guest"], simulasi: ["admin", "rm", "guest"],
    detail: ["admin", "rm"], admin: ["admin"]
  };
  const can = feature => !!(SESSION && PERM[feature] && PERM[feature].includes(SESSION.user.role));
  const ROLE_LABEL = { admin: "Admin", rm: "RM", guest: "Guest" };

  /* ---------- sanitasi (XSS) ---------- */
  const esc = s => String(s ?? "").replace(/[&<>"'`=\/]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;", "=": "&#61;", "/": "&#47;" }[c]));
  const cleanInput = (s, max = 120) => String(s ?? "").replace(/[<>"'`\u0000-\u001f]/g, "").trim().slice(0, max);

  window.Auth = {
    sha256, pwHash, Crypt, call, login, logout, changePassword, loadSession, startIdle, can, esc, cleanInput, ROLE_LABEL, ApiError,
    get session() { return SESSION; }, get user() { return SESSION ? SESSION.user : null }
  };
})();
