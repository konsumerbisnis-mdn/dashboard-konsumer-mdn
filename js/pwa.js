// pendaftaran service worker (agar web bisa dipasang sebagai aplikasi); gagal diam-diam bila tidak didukung
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
