/* ================= feedback pengguna: tombol "Beri feedback" di menu atas + daftar feedback untuk admin ================= */
// Dikirim lewat action "feedback" ke Apps Script (sheet "feedback"); admin membacanya di Admin → Feedback (action "feedbackList").
const FB_KAT = ["Saran fitur / perbaikan", "Laporkan masalah (error)", "Angka / data tidak sesuai", "Tampilan / kemudahan pakai", "Lainnya"];
const FB_MAX = 1500;
const fbStars = n => "★".repeat(n) + "☆".repeat(Math.max(0, 5 - n));
function openFeedback() {
  const k = curView(), menu = (VIEWS[k] || [])[0] || "Menu utama";
  $("#dlgTitle").textContent = "Beri feedback";
  $("#dlgBody").innerHTML = `<form id="fbForm" class="form" novalidate>
    <p class="note full" style="margin:0">Masukan Anda membantu kami memperbaiki dashboard. Feedback dikirim bersama nama akun dan menu yang sedang dibuka (<b>${esc(menu)}</b>).</p>
    <div class="field full"><label id="fbRL">Penilaian dashboard <small class="note">(opsional)</small></label><div class="fb-stars" id="fbStars" role="radiogroup" aria-labelledby="fbRL">${[1, 2, 3, 4, 5].map(i => `<button type="button" role="radio" aria-checked="false" data-s="${i}" aria-label="${i} dari 5">★</button>`).join("")}</div></div>
    <div class="field full"><label for="fbKat">Jenis feedback</label><select class="ctl" id="fbKat">${FB_KAT.map(x => `<option>${x}</option>`).join("")}</select></div>
    <div class="field full"><label for="fbMsg">Pesan</label><textarea class="ctl" id="fbMsg" rows="5" maxlength="${FB_MAX}" placeholder="Tulis saran, kendala, atau hal yang menurut Anda perlu diperbaiki…" required></textarea><small class="note" id="fbCnt">0 / ${FB_MAX}</small></div>
    <div class="toolbar full"><button class="btn primary" type="submit" id="fbSend">Kirim feedback</button><button class="btn" type="button" data-close>Batal</button></div><p id="fbErr" class="lg-msg full" hidden></p></form>`;
  let rating = 0;
  const paint = () => $("#fbStars").querySelectorAll("button").forEach(b => { const on = +b.dataset.s <= rating; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(+b.dataset.s === rating)); });
  $("#fbStars").querySelectorAll("button").forEach(b => b.onclick = () => { rating = rating === +b.dataset.s ? 0 : +b.dataset.s; paint(); });
  $("#fbMsg").oninput = e => { $("#fbCnt").textContent = e.target.value.length + " / " + FB_MAX; };
  $("#fbForm").onsubmit = async e => {
    e.preventDefault(); const err = $("#fbErr"), msg = $("#fbMsg").value.replace(/\s+\n/g, "\n").trim();
    if (msg.length < 5) { err.hidden = false; err.textContent = "Tulis pesan feedback minimal 5 karakter."; return; }
    const btn = $("#fbSend"); btn.disabled = true; btn.textContent = "Mengirim…"; err.hidden = true;
    try { await Auth.call("feedback", { rating, kategori: $("#fbKat").value, menu, pesan: msg.slice(0, FB_MAX) }); $("#dlg").close(); toast("Terima kasih! Feedback Anda sudah terkirim."); }
    catch (er) { err.hidden = false; err.textContent = /tidak dikenal/i.test(er.message) ? "Fitur feedback belum aktif di server. Minta admin memasang Apps Script versi terbaru." : er.message; btn.disabled = false; btn.textContent = "Kirim feedback"; }
  };
  $("#dlg").showModal(); setTimeout(() => { const m = $("#fbMsg"); if (m) m.focus(); }, 60);
}
document.addEventListener("click", e => { if (e.target.closest("#btnFb, #btnFbHome")) openFeedback(); });

// admin: daftar feedback yang masuk
async function adFeedback(el) {
  el.innerHTML = `<section class="panel"><div class="empty">Memuat feedback…</div></section>`;
  let j; try { j = await Auth.call("feedbackList", { limit: 500 }); } catch (er) { el.innerHTML = `<section class="panel"><div class="empty">${esc(/tidak dikenal/i.test(er.message) ? "Fitur feedback belum aktif di server: pasang Apps Script versi terbaru." : er.message)}</div></section>`; return; }
  const rows = (j.rows || []).map(r => ({ t: r[0], u: r[1], nm: r[2], ro: r[3], mn: r[4], st: +r[5] || 0, kt: r[6], ps: r[7] }));
  const rated = rows.filter(r => r.st > 0), avg = rated.length ? rated.reduce((a, r) => a + r.st, 0) / rated.length : null;
  el.innerHTML = `<div class="grid tiles">${tile({ label: "Feedback masuk", value: nf0.format(rows.length), sub: "500 terbaru" })}${tile({ label: "Rata-rata penilaian", value: avg == null ? "–" : nf1.format(avg) + " / 5", sub: rated.length ? nf0.format(rated.length) + " memberi bintang" : "belum ada penilaian" })}</div>
    <section class="panel"><div class="panel-h"><h2>Feedback pengguna</h2><span class="sub">terbaru di atas</span></div><input class="ctl" type="search" id="fbQ" placeholder="Cari pesan, user, menu, jenis"><div id="fbT"></div></section>`;
  const draw = q => table($("#fbT"), [{ key: "t", label: "Waktu", fmt: x => new Date(x).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) }, { key: "u", label: "User", fmt: (x, r) => `${esc(r.nm || x)}<br><small class="note">${esc(x)} · ${esc(r.ro)}</small>` },
    { key: "mn", label: "Menu", fmt: x => esc(x) }, { key: "st", label: "Nilai", fmt: x => x ? `<span class="fb-st">${fbStars(x)}</span>` : "–" }, { key: "kt", label: "Jenis", fmt: x => esc(x) }, { key: "ps", label: "Pesan", fmt: x => `<div class="fb-ps">${esc(x)}</div>` }],
    q ? rows.filter(r => (r.ps + " " + r.u + " " + r.nm + " " + r.mn + " " + r.kt).toLowerCase().includes(q)) : rows, { sortKey: "t", page: 30 });
  draw(""); let qt; $("#fbQ").oninput = e => { clearTimeout(qt); qt = setTimeout(() => draw(e.target.value.trim().toLowerCase()), 200); };
}
