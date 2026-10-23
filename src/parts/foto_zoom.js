/* ================= foto RM / ikon KC: kursor di atas foto → tampil besar ================= */
(() => {
  if (!matchMedia("(hover: hover)").matches) return;
  let box = null, cur = null;
  const hide = () => { if (box) box.classList.remove("on"); cur = null; };
  const place = e => { if (!box) return; const s = box.offsetWidth || 280, W = innerWidth, H = innerHeight;
    let x = e.clientX + 22, y = e.clientY - s / 2; if (x + s > W - 8) x = e.clientX - s - 22; y = Math.max(8, Math.min(H - s - 8, y)); box.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`; };
  document.addEventListener("mouseover", e => {
    const im = e.target instanceof Element ? e.target.closest(".av img") : null; if (!im) { if (cur) hide(); return; }
    if (im === cur) return; cur = im;
    if (!box) { box = document.createElement("div"); box.className = "foto-zoom"; box.innerHTML = "<img alt=''>"; document.body.appendChild(box); }
    box.querySelector("img").src = im.currentSrc || im.src; box.classList.toggle("kc", !!im.closest(".av.kc")); box.classList.add("on"); place(e);
  });
  document.addEventListener("mousemove", e => { if (cur) place(e); });
  document.addEventListener("scroll", hide, true); document.addEventListener("click", hide, true);
})();
