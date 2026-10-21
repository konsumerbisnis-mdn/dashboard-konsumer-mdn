
/* layar diagnosis: bila ada error saat memuat, pesannya tampil di layar (untuk di-screenshot) */
(function () {
  var shown = 0, V = "v2026.10.20-d";
  function box(msg) {
    if (shown++ > 1) return;
    try {
      var d = document.createElement("div"); d.setAttribute("role", "alert");
      d.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#7d0f1b;color:#fff;font:12px/1.45 -apple-system,Segoe UI,sans-serif;padding:12px 14px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.4);word-break:break-word";
      d.innerHTML = "<b>Dashboard belum bisa dimuat sempurna</b><br>" + String(msg).replace(/</g, "&lt;") + "<br><span style='opacity:.8'>" + V + " · " + String(navigator.userAgent).slice(0, 110).replace(/</g, "&lt;") + "</span><br><span style='opacity:.9'>Mohon screenshot layar ini dan kirim ke Claude. </span><button style='margin-top:6px;border:0;border-radius:8px;padding:5px 12px;font-weight:700' onclick='this.parentNode.remove()'>Tutup</button>";
      (document.body || document.documentElement).appendChild(d);
    } catch (e) {}
  }
  try { if (location.hash === "#reset") { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf("kpr-dash-v1") === 0) ks.push(k); } ks.forEach(function (k) { localStorage.removeItem(k); }); history.replaceState(null, "", location.pathname + location.search); } } catch (e) {}
  window.addEventListener("error", function (e) { if (e.target && e.target !== window) return; box((e.message || "error") + (e.lineno ? " (baris " + e.lineno + ")" : "")); });
  window.addEventListener("unhandledrejection", function (e) { box("Promise: " + (e.reason && (e.reason.message || e.reason))); });
  setTimeout(function () { if (!window.__kprReady) box("Halaman belum selesai dimuat setelah 8 detik."); }, 8000);
})();
