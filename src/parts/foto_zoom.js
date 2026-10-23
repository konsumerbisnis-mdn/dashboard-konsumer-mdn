/* ================= foto RM / ikon KC: kursor di atas foto → tampil besar ================= */
(() => {
  // layar sentuh: ketuk foto → tampil besar di tengah layar; ketuk di mana saja untuk menutup
  if (!matchMedia("(hover: hover)").matches) {
    let ov = null; const close = () => { if (ov) ov.classList.remove("on"); };
    document.addEventListener("click", e => {
      const im = e.target instanceof Element ? e.target.closest(".av img") : null;
      if (!im) { close(); return; }
      e.preventDefault(); e.stopPropagation();
      if (!ov) { ov = document.createElement("div"); ov.className = "foto-lb"; ov.innerHTML = "<div class='fl-box'><img alt=''></div>"; document.body.appendChild(ov); ov.addEventListener("click", ev => { ev.stopPropagation(); close(); }); }
      ov.querySelector("img").src = im.currentSrc || im.src; ov.querySelector(".fl-box").classList.toggle("kc", !!im.closest(".av.kc")); ov.classList.add("on");
    }, true);
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    return;
  }
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
