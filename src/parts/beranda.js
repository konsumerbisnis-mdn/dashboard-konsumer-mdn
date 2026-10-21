// ---- lihat data cepat di halaman depan: satu tabel dari menu mana pun tanpa membuka menunya
const LQV = { key: lsGet(STORE + "-qv") || "" };
const QV = [
  ["Keragaan Konsumer", "keragaan", [["k_hl", "Highlight Konsumer per segmen"], ["k_hla", "Highlight Konsumer per area"], ["k_hlk", "Highlight Konsumer per kanca"],
    ["k_sum", "Highlight produk terpilih (ringkasan)"], ["k_all", "Semua KPI per KC"], ["k_os", "OS per KC"], ["k_sml", "SML per KC"], ["k_npl", "NPL per KC"], ["k_deb", "Debitur per KC"], ["k_tss", "Time Series SML"], ["k_tsn", "Time Series NPL"]], () => DB.ker],
  ["Produktivitas RM", "produktivitas", [["r_rank_R", "Peringkat RM Briguna Ritel"], ["r_kc_R", "Pencapaian per cabang · Briguna Ritel"], ["r_rank_M", "Peringkat mantri Briguna Mikro"], ["r_kc_M", "Pencapaian per cabang · Briguna Mikro"],
    ["r_rank_K", "Peringkat RM KPR"], ["r_kc_K", "Pencapaian per cabang · KPR"]], k => !!(DB.rmkSets[k.slice(-1)] && DB.rmkSets[k.slice(-1)].months && DB.rmkSets[k.slice(-1)].months.length)],
  ["Kualitas Kredit", "kualitas", [["q_B", "DG/UG per kanca · Briguna"], ["q_K", "DG/UG per kanca · KPR"]], k => !!(DB.gerak[k.slice(-1)] && DB.gerak[k.slice(-1)].prevAsof)],
  ["Pipeline Brispot", "pipeline", [["p_kc_B", "Pipeline per KC · Briguna"], ["p_akad_B", "Jadwal akad terdekat · Briguna"], ["p_kc_K", "Pipeline per KC · KPR"], ["p_akad_K", "Jadwal akad terdekat · KPR"]], k => !!DB.pipeSets[k.slice(-1)]],
  ["Simulasi Suku Bunga", "simulasi", [["s_rate", "Tabel suku bunga program KPR"]], () => !!DB.rate]
];
function qvOptions() {
  return `<option value="">Pilih data…</option>` + QV.map(([g, , items, ok]) => `<optgroup label="${g}">${items.map(([k, l]) => `<option value="${k}" ${LQV.key === k ? "selected" : ""} ${ok(k) ? "" : "disabled"}>${l}${ok(k) ? "" : " (belum ada data)"}</option>`).join("")}</optgroup>`).join("");
}
function qvRender(el) {
  if (!el) return; const k = LQV.key; el.hidden = !k; if (!k) { el.innerHTML = ""; return; }
  const grp = QV.find(g => g[2].some(x => x[0] === k)); if (!grp || !grp[3](k)) { el.innerHTML = '<div class="empty">Data belum tersedia.</div>'; return; }
  const label = grp[2].find(x => x[0] === k)[1];
  el.innerHTML = `<div class="l-qvh"><div><small>${grp[0]}</small><h3>${label}</h3><p class="note" id="lQvSub"></p></div><a class="btn" href="#${grp[1]}" data-qvgo="${k}">Buka menu lengkap <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2"><path d="m9 6 6 6-6 6"/></svg></a></div><div id="lQvB"></div>`;
  el.querySelector("[data-qvgo]").addEventListener("click", () => { const s = k.slice(-1); if (k[0] === "r") SEG.rm = s; if (k[0] === "p") SEG.pipe = s; if (k[0] === "q") SEG.lw = s; saveSEG(); });
  const body = $("#lQvB"), sub = $("#lQvSub");
  if (k[0] === "k") {
    const keep = KV; setKV(KS.prod || "konsumer");
    const d = KV.dates[KV.dates.length - 1], us = KV.units.map((u, i) => ({ ...u, i }));
    if (k.startsWith("k_hl")) { sub.textContent = "Seluruh KC · posisi " + tglS(d); body.innerHTML = hlKonsumer(d, () => true, { k_hl: "ro", k_hla: "area", k_hlk: "kc" }[k]); }
    else { sub.textContent = prodL(KV.p) + " · seluruh KC · posisi " + tglS(d) + (k === "k_sum" ? " · nominal Rp juta" : "");
      body.innerHTML = k === "k_tss" ? kTsTable(d, us, "sml", false) : k === "k_tsn" ? kTsTable(d, us, "npl", false) : kpiTable(d, us, { k_sum: "sum", k_all: "all", k_os: "os", k_sml: "sml", k_npl: "npl", k_deb: "deb" }[k], "nom"); }
    KV = keep;
  } else if (k[0] === "r") {
    const seg = k.slice(-1), P = DB.rmkSets[seg], L = RML[seg], ym = (P.asof || P.months[P.months.length - 1].ym).slice(0, 7), rows = P.months.filter(x => x.ym === ym && (x.tDisb > 0 || x.os > 0)).map(x => ({ ...x, pen: x.tDisb ? x.os / x.tDisb : null }));
    sub.textContent = (seg === "K" ? "Disbursement" : "Net disburse") + " s.d. " + tglS(P.asof) + " · Rp juta";
    if (k.startsWith("r_rank")) {
      const lb = rows.sort((a, b) => (b.pen ?? -1) - (a.pen ?? -1) || b.os - a.os).map((x, i) => ({ ...x, no: i + 1, kq: kuadOf(x.pen) }));
      table(body, [{ key: "no", label: "#", r: 1 }, { key: "rm", label: L.who, fmt: (x, r) => `<span class="lb-name wav">${rmAvatar(x, 30)}<span><b>${esc(x)}</b><small>${esc(r.kc)}${r.jg ? " · " + esc(r.jg) : ""}</small></span></span>` },
        { key: "tDisb", label: "Target", r: 1, fmt: x => x ? nf0.format(x) : "–" }, { key: "os", label: "Realisasi", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` },
        { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "kq", label: "Kuadran", r: 1, sortVal: r => r.kq ?? 9, fmt: q => kq(q) },
        { key: "sOs", label: L.s, r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.sDeb} deb</small>` }, { key: "kOs", label: L.k, r: 1, fmt: (x, r) => `${nf1.format(x)}<br><small class="note">${r.kDeb} deb</small>` }], lb, { state: { key: "no", dir: 1 }, page: 15 });
    } else {
      const kr = uniq(rows.map(x => x.kc)).map(kc => { const a = rows.filter(x => x.kc === kc), t = sum(a.filter(x => x.tDisb > 0), "tDisb"), o = sum(a, "os");
        return { kc, rm: a.length, t, os: o, pen: t ? o / t : null, sub: sum(a, "sOs"), kom: sum(a, "kOs"), deb: sum(a, "deb") }; });
      const T = sum(kr, "t"), O = sum(kr, "os");
      table(body, [{ key: "kc", label: "Kantor cabang" }, { key: "rm", label: L.who, r: 1 }, { key: "t", label: "Target", r: 1, fmt: x => nf0.format(x) }, { key: "os", label: "Realisasi", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` },
        { key: "pen", label: "% capai", r: 1, sortVal: r => r.pen ?? -1, fmt: x => x == null ? "–" : chip(pct(x, 0), capaiCls(x)) }, { key: "sub", label: L.s, r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: L.k, r: 1, fmt: x => nf1.format(x) }, { key: "deb", label: "Deb", r: 1 }], kr,
        { sortKey: "pen", foot: { kc: "Total", rm: sum(kr, "rm"), t: nf0.format(T), os: `<b>${nf1.format(O)}</b>`, pen: T ? chip(pct(O / T, 0), capaiCls(O / T)) : "–", sub: nf1.format(sum(kr, "sub")), kom: nf1.format(sum(kr, "kom")), deb: sum(kr, "deb") } });
    }
  } else if (k[0] === "q") {
    const G = DB.gerak[k.slice(-1)]; sub.textContent = `${LWL[k.slice(-1)].seg} · LW321 ${nS(G.prevAsof)} → ${nS(G.asof)} · OS Rp juta`;
    gerakKcTable(body, G, () => true);
  } else if (k[0] === "p") {
    const keepP = DB.pipe, keepL = PL; usePipe(k.slice(-1));
    const aktif = pipeRows().filter(x => !x.batal); sub.textContent = PL.seg + " · posisi " + tglS(DB.pipe.asof) + " · plafon Rp juta · tanpa berkas batal";
    if (k.startsWith("p_kc")) {
      const kr = uniq(aktif.map(x => x.kc)).filter(Boolean).map(kc => { const a = aktif.filter(x => x.kc === kc), sc = a.filter(x => x.tahap >= 6);
        return { kc, n: a.length, pl: sum(a, "plafon"), sub: sum(a.filter(x => x.jenis === PL.j[0]), "plafon"), kom: sum(a.filter(x => x.jenis !== PL.j[0]), "plafon"), oh: a.filter(x => x.tahap === 0).length, sc: sc.length, scPl: sum(sc, "plafon") }; });
      table(body, [{ key: "kc", label: "Kantor cabang" }, { key: "n", label: "Deb", r: 1 }, { key: "pl", label: "Plafon", r: 1, fmt: x => `<b>${nf1.format(x)}</b>` }, { key: "sub", label: PL.j[0], r: 1, fmt: x => nf1.format(x) }, { key: "kom", label: PL.j[1], r: 1, fmt: x => nf1.format(x) },
        { key: "oh", label: "On hand", r: 1 }, { key: "sc", label: "Siap cair", r: 1, fmt: (x, r) => `${x}<br><small class="note">${nf1.format(r.scPl)}</small>` }], kr,
        { sortKey: "pl", foot: { kc: "Total", n: aktif.length, pl: `<b>${nf1.format(sum(kr, "pl"))}</b>`, sub: nf1.format(sum(kr, "sub")), kom: nf1.format(sum(kr, "kom")), oh: sum(kr, "oh"), sc: sum(kr, "sc") } });
    } else {
      const ak = aktif.filter(x => x.akad && x.akad >= DB.pipe.asof).sort((a, b) => a.akad.localeCompare(b.akad) || b.plafon - a.plafon);
      table(body, [{ key: "akad", label: "Akad", fmt: x => `<b>${tglS(x)}</b>` }, { key: "debitur", label: "Debitur", fmt: (x, r) => `${esc(x)}${r.developer ? `<br><small class="note">${esc(r.developer)}</small>` : ""}` }, { key: "kc", label: "KC / RM", fmt: (x, r) => `${esc(x)}<br><small class="note">${esc(r.rm || "")}</small>` },
        { key: "plafon", label: "Plafon", r: 1, fmt: x => nf1.format(x) }, { key: "jenis", label: "Jenis" }, { key: "tahap", label: "Tahap", fmt: t => esc(PTAHAP[t] || "") }], ak, { state: { key: "akad", dir: 1 }, page: 25 });
    }
    DB.pipe = keepP; PL = keepL;
  } else {
    const R = DB.rate; sub.textContent = R.title || "";
    table(body, [{ key: "prog", label: "Program" }, { key: "prod", label: "Skema", fmt: (x, r) => `${esc(x)}${r.kel ? `<br><small class="note">${esc(r.kel)}</small>` : ""}` }, { key: "tenor", label: "Min tenor", r: 1, fmt: x => x ? x + " th" : "–" },
      { key: "st", label: "Suku bunga per tahap", nosort: 1, fmt: st => (st || []).map((t, i) => `${pct(t.r, 2)} <small class="note">${i ? "th " + ((st[i - 1].sd || 0) + 1) + "–" + t.sd : "s.d. th " + t.sd}</small>`).join("<br>") }], R.rows, { page: 30 });
  }
}
function viewBeranda(v) {
  const tgl = d => d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const alerts = [], ks = kerSummary();
  if (ks) {
    const rows = ks.us.map(u => ({ u, c: kSnap(ks.r.di, [u]), r: kRka(ks.d.slice(0, 7), [u]) })).filter(x => x.c.os > 0 && x.r && x.r.os);
    const low = rows.filter(x => x.c.os / x.r.os < .95).sort((a, b) => a.c.os / a.r.os - b.c.os / b.r.os);
    if (low.length) alerts.push(["warn", low.length + " KC", `OS Konsumer di bawah 95% RKA: ${low.slice(0, 4).map(x => `${esc(x.u.nama)} (${pct(x.c.os / x.r.os, 1)})`).join(", ")}${low.length > 4 ? ", dll." : ""}`]);
    const nplHi = rows.filter(x => x.r.npl != null && x.c.npl > x.r.npl * 1.2 && x.c.npl > 0);
    if (nplHi.length) alerts.push(["red", nplHi.length + " KC", `NPL Konsumer lebih dari 120% RKA: ${nplHi.slice(0, 4).map(x => esc(x.u.nama)).join(", ")}${nplHi.length > 4 ? ", dll." : ""}`]);
    ["ritel", "mikro", "kpr"].forEach(p => { const keep = KV; setKV(p); const us = KV.units.map((u, i) => ({ ...u, i })), c = kSnap(ks.r.di, us), r = kRka(ks.d.slice(0, 7), us); KV = keep;
      if (c && r && r.sml != null && c.sml > r.sml) alerts.push(["warn", "SML " + prodS(p), `SML ${prodL(p)} ${pct(c.psml, 2)} di atas RKA (${pct(r.psml, 2)}) posisi ${tglS(ks.d)}.${isMidMonth(ks.d) && p !== "kpr" ? " Bulan berjalan: SML Briguna mengikuti tanggal gajian." : ""}`]); });
  }
  const rsum = {}; ["R", "M", "K"].forEach(s => { const P = DB.rmkSets[s]; if (!P || !P.months || !P.months.length || !P.asof) return;
    const ym = P.asof.slice(0, 7), rows = P.months.filter(x => x.ym === ym && (x.tDisb > 0 || x.os > 0)), tgt = rows.filter(x => x.tDisb > 0);
    rsum[s] = { os: sum(rows, "os"), capai: tgt.filter(x => x.os >= x.tDisb).length, n: tgt.length, asof: P.asof };
    if (+P.asof.slice(8) >= 10) { const nol = tgt.filter(x => !x.os); if (nol.length) alerts.push(["warn", nol.length + " " + RML[s].who, `${RML[s].seg}: belum ada pencairan s.d. ${tglS(P.asof)}: ${nol.slice(0, 4).map(x => esc(x.rm)).join(", ")}${nol.length > 4 ? ", dll." : ""}`]); } });
  const psum = {}; ["B", "K"].forEach(s => { const P = DB.pipeSets[s]; if (!P) return; const keepP = DB.pipe, keepL = PL; usePipe(s);
    const all = pipeRows().filter(x => !x.batal), siap = all.filter(x => x.tahap >= 6); psum[s] = { pl: sum(all, "plafon"), n: all.length, siap: siap.length, asof: P.asof };
    const lewat = all.filter(x => x.akad && x.akad < P.asof); if (lewat.length) alerts.push(["red", lewat.length + " deb", `Pipeline ${PL.seg}: jadwal akad sudah lewat tetapi belum cair (${rpJ(sum(lewat, "plafon"))}).`]);
    DB.pipe = keepP; PL = keepL; });
  const lsum = {}; ["B", "K"].forEach(s => { const L = DB.lwSets[s]; if (!L) return; const T = todayN(); let os = 0, sml = 0, npl = 0, akan = 0, akOs = 0;
    for (let i = 0; i < L.n; i++) { os += L.os[i]; if (L.kol[i] === 2) sml += L.os[i]; if (L.kol[i] >= 3) npl += L.os[i]; }
    if (s === SEG.lw) { LWR.forEach(r => { if (r.npl90 != null && r.npl90 <= T + 30) { akan++; akOs += r.os; } }); if (akan) alerts.push(["red", akan + " rek", `${LWL[s].seg}: SML akan tembus NPL dalam 30 hari (${rpJ(akOs / 1e6)}) bila tidak ada pembayaran.`]); }
    lsum[s] = { n: L.n, os, sml, npl, asof: L.asof }; });
  const gs = {}; ["B", "K"].forEach(s => { const G = DB.gerak[s]; if (!G || !G.prevAsof) return; const c = k => G.cat.filter(x => x[2] === k).reduce((a, x) => a + x[3], 0);
    gs[s] = { dg: c("dgLS") + c("dgSN") + c("dgLN"), ug: c("ugSL") + c("ugNS") + c("ugNL"), asof: G.asof }; });
  const chev = '<svg class="l-chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>';
  let ci = 0;
  const card = (href, ico, title, desc, badge, cls = "") => `<a class="l-card" href="#${href}" style="--i:${ci++}"><span class="l-ico">${ico}</span>
    <span><h3>${title}</h3><p>${desc}</p><span class="l-badge ${cls}">${badge}</span></span>${chev}</a>`;
  const ld = (x, txt) => x ? "Memuat data…" : txt;
  const rsAsof = Object.values(rsum).map(x => x.asof).sort().pop(), psAsof = Object.values(psum).map(x => x.asof).sort().pop();
  const lwAsof = Object.values(lsum).map(x => x.asof).sort().pop(), gsAsof = Object.values(gs).map(x => x.asof).sort().pop();
  const canNom = Auth.can("nominatif");
  v.innerHTML = `
    <div class="l-bg" aria-hidden="true"><i class="lb1"></i><i class="lb2"></i><span class="l-grid"></span><span class="l-vig"></span><canvas id="lPart"></canvas></div>
    <div class="l-top">
      <img class="dan" src="assets/logo-danantara.png" alt="Danantara Indonesia">
      <img class="bri" src="assets/logo-bri.png" alt="BRI">
    </div>
    <div class="l-center">
      <div class="l-head">
        <h1>Dashboard Konsumer Region I - Medan</h1>
        <span class="l-rule"></span>
        <p>Halo, ${esc((Auth.user || {}).nama || (Auth.user || {}).username || "")} · silakan pilih dashboard</p>
        <span class="l-now" id="lNow"></span>
      </div>
      <nav class="l-cards" aria-label="Pilih dashboard">
        ${ks ? card("keragaan", ICON.keragaan, "Keragaan Konsumer", `OS ${rpM(ks.cur.os)}${ks.rka && ks.rka.os ? " · " + pct(ks.cur.os / ks.rka.os, 1) + " RKA" : ""} · SML ${pct(ks.cur.psml, 2)} · NPL ${pct(ks.cur.pnpl, 2)}`, "Tersedia · posisi " + tglS(ks.d))
          : card("keragaan", ICON.keragaan, "Keragaan Konsumer", "OS, SML, NPL & debitur Briguna Ritel, Mikro & KPR per KC", ld(KER_LOADING, "Belum ada data"), "warn")}
        ${rsAsof ? card("produktivitas", ICON.produktivitas, "Produktivitas RM", ["R", "M", "K"].filter(s => rsum[s]).map(s => `${s === "R" ? "Ritel" : s === "M" ? "Mikro" : "KPR"} ${rpJ(rsum[s].os)}`).join(" · "), "Tersedia · s.d. " + tglS(rsAsof))
          : card("produktivitas", ICON.produktivitas, "Produktivitas RM", "Per bulan & carry over: Briguna Ritel, Mikro & KPR", ld(RM_LOADING, "Belum ada data"), "warn")}
        ${canNom ? (lwAsof ? card("nominatif", ICON.nominatif, "Nominatif Portofolio", ["B", "K"].filter(s => lsum[s]).map(s => `${s === "B" ? "Briguna" : "KPR"} ${nf0.format(lsum[s].n)} rek`).join(" · "), "Tersedia · LW321 " + nS(lwAsof))
          : card("nominatif", ICON.nominatif, "Nominatif Portofolio", "Per debitur: ringkasan, EWS, peluang & tindak lanjut", ld(LOADING.lw, "Belum ada LW321"), "warn")) : ""}
        ${gsAsof ? card("kualitas", ICON.kualitas, "Kualitas Kredit", ["B", "K"].filter(s => gs[s]).map(s => `${s === "B" ? "Briguna" : "KPR"} DG ${nf0.format(gs[s].dg)} · UG ${nf0.format(gs[s].ug)}`).join(" · "), "Tersedia · posisi " + nS(gsAsof))
          : card("kualitas", ICON.kualitas, "Kualitas Kredit", "SML & NPL, pergerakan DG / UG dibanding bulan lalu", ld(LOADING.core, "Perlu LW321 bulan ini & bulan lalu"), "warn")}
        ${psAsof ? card("pipeline", ICON.pipeline, "Pipeline Brispot RM", ["B", "K"].filter(s => psum[s]).map(s => `${s === "B" ? "Briguna" : "KPR"} ${rpJ(psum[s].pl)} · ${nf0.format(psum[s].n)} deb`).join(" · "), "Tersedia · posisi " + tglS(psAsof))
          : card("pipeline", ICON.pipeline, "Pipeline Brispot RM", "Funnel, jadwal akad, TAT & rencana realisasi RM", ld(PIPE_LOADING, "Belum ada data"), "warn")}
        ${card("simulasi", ICON.simulasi, "Simulasi Suku Bunga", `Briguna (max plafond & angsuran) · KPR ${DB.rate ? uniq(DB.rate.rows.map(x => x.prog)).length + " program" : ""}`, DB.rate ? (String(DB.rate.title || "").replace(/^.*PROGRAM\s*/i, "Program ") || "Tersedia") : "Tersedia")}
      </nav>
      <div class="l-qv">
        <span class="l-qv-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
        <label for="lQv">Lihat data cepat</label>
        <select id="lQv" class="ctl">${qvOptions()}</select>
        <button type="button" class="l-qv-x" id="lQvX" aria-label="Tutup data" ${LQV.key ? "" : "hidden"}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </div>
      <section class="l-qvp" id="lQvP" ${LQV.key ? "" : "hidden"}></section>
      ${alerts.length ? `<details class="l-alert"><summary><span class="l-badge red">${alerts.length}</span> Catatan perlu perhatian</summary>
        <ul>${alerts.map(a => `<li><span class="l-badge ${a[0]}">${a[1]}</span><span>${a[2]}</span></li>`).join("")}</ul></details>` : ""}
      <div class="l-meta">
        <span>${ks ? `Keragaan posisi <b>${tglS(ks.d)}</b>${DB.meta && DB.meta.updated ? ", data server diperbarui " + tgl(new Date(DB.meta.updated)) + " pukul " + new Date(DB.meta.updated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}.` : KER_LOADING ? "Memuat data…" : "Data keragaan belum tersedia."}
          ${rsAsof ? `Produktivitas s.d. <b>${tglS(rsAsof)}</b>.` : ""} ${psAsof ? `Pipeline posisi <b>${tglS(psAsof)}</b>.` : ""} ${lwAsof ? `LW321 posisi <b>${nS(lwAsof)}</b>.` : ""}</span>
        <span style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">${isAdmin() ? `<button type="button" id="lData">Kelola data</button>` : ""}<button type="button" id="lSnd"></button><button type="button" id="lOut">Keluar</button></span>
      </div>
    </div>
    <div class="l-foot">
      <div><b>Satu Bank Untuk Semua</b>
        <div class="contact"><span class="cbox">CONTACT BRI<span>1500017</span></span><span>www.bri.co.id</span></div></div>
      <small>BRI merupakan peserta penjaminan LPS, serta berizin dan diawasi Otoritas Jasa Keuangan &amp; Bank Indonesia</small>
    </div>`;
  landingParticles($("#lPart"));
  const qs = $("#lQv"), setQv = k => { LQV.key = k; lsSet(STORE + "-qv", k); qs.value = k; $("#lQvX").hidden = !k; document.body.classList.toggle("qv-open", !!k); qvRender($("#lQvP")); };
  qs.onchange = () => setQv(qs.value); $("#lQvX").onclick = () => setQv("");
  if (LQV.key) qvRender($("#lQvP"));
  if ($("#lData")) $("#lData").onclick = openData;
  $("#lOut").onclick = () => Auth.logout("manual");
  sndLabel();
}
