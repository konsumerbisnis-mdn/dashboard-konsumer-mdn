/* ================= foto RM / ikon KC: klik / ketuk → tampil besar di tengah layar ================= */
(() => {
  let ov = null; const close = () => { if (ov) ov.classList.remove("on"); };
  document.addEventListener("click", e => {
    const im = e.target instanceof Element ? e.target.closest(".av img") : null;
    if (!im) { close(); return; }
    e.preventDefault(); e.stopPropagation();
    if (!ov) { ov = document.createElement("div"); ov.className = "foto-lb"; ov.innerHTML = "<div class='fl-box'><img alt=''></div>"; document.body.appendChild(ov); ov.addEventListener("click", ev => { ev.stopPropagation(); close(); }); }
    ov.querySelector("img").src = im.currentSrc || im.src; ov.querySelector(".fl-box").classList.toggle("kc", !!im.closest(".av.kc")); ov.classList.add("on");
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
})();
