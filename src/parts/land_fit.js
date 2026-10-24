/* ================= beranda: seluruh isi muat dalam satu layar (desktop) ================= */
// Bila isi beranda lebih tinggi dari layar (mis. ada catatan & keterangan data tambahan), bagian tengah diperkecil sedikit
// agar kartu, catatan, dan footer terlihat tanpa menggulir. Layar kecil / HP tetap menggulir. Catatan yang dibuka boleh menggulir.
(() => {
  const land = document.getElementById("landing"); if (!land) return;
  let raf = 0;
  const fit = () => {
    raf = 0; if (land.hidden) return;
    const c = land.querySelector(".l-center"); if (!c) return; c.style.zoom = "";
    const wide = innerWidth >= 1100, al = land.querySelector(".l-alert");
    if (al && land.dataset.w !== String(wide)) { land.dataset.w = String(wide); al.open = wide; }   // layar lebar: catatan selalu terbuka di panel kanan; layar sempit: tertutup
    if (innerWidth < 720 || (al && al.open && !wide)) return;
    const over = land.offsetHeight - innerHeight; if (over <= 2) return;   // tinggi elemen (bukan scrollHeight: hiasan latar ikut terhitung)
    const h = c.offsetHeight; if (!h) return;   // offsetHeight: tidak terpengaruh animasi masuk (transform)
    c.style.zoom = String(Math.max(.7, Math.floor((h - over - 2) / h * 100) / 100));
  };
  const sched = () => { if (!raf) raf = requestAnimationFrame(fit); };
  new MutationObserver(sched).observe(land, { childList: true, subtree: true, attributes: true, attributeFilter: ["open", "hidden"] });
  addEventListener("resize", sched);
})();
