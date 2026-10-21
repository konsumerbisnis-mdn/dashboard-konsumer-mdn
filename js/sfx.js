/* sfx.js — efek suara antarmuka (Panduan Coding Sound Dashboard KPR, Cara A: memutar file sfx/*.mp3).
   - Suara pertama baru dibunyikan setelah interaksi pengguna (aturan autoplay browser).
   - Pilihan aktif/mati diingat di localStorage ("sfx").
   - Bila file gagal dimuat (mis. dibuka dari file://), otomatis memakai nada sintesis Web Audio yang sama (Cara B). */
window.SFX = (() => {
  const FILES = {
    click: "sfx/ui-1-klik-tombol.mp3",
    hover: "sfx/ui-2-sorot-kartu.mp3",
    enter: "sfx/ui-3-masuk-dashboard.mp3",
    back:  "sfx/ui-4-kembali-ke-beranda.mp3",
    close: "sfx/ui-5-tutup.mp3",
    on:    "sfx/ui-6-suara-aktif.mp3"
  };
  // volume relatif tiap suara (0–1). Klik dan sorot sengaja lebih pelan dari suara navigasi
  const VOL = { click: .8, hover: .5, enter: 1, back: 1, close: .9, on: 1 };
  const ls = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  let ctx = null, master = null, bus = null;
  let enabled = ls.get("sfx") !== "off";
  const buffers = {}, lastPlay = {};
  let loading = null;
  const AC = window.AudioContext || window.webkitAudioContext;

  function ensure() {
    if (!AC) return null;
    if (!ctx) { ctx = new AC(); master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination); }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function load() {
    if (loading) return loading;
    const c = ensure(); if (!c) return Promise.resolve();
    loading = Promise.all(Object.entries(FILES).map(async ([k, url]) => {
      try { const res = await fetch(url); if (!res.ok) throw new Error(res.status); buffers[k] = await c.decodeAudioData(await res.arrayBuffer()); }
      catch (e) { console.warn("SFX gagal dimuat, memakai nada sintesis:", k); }
    }));
    return loading;
  }

  /* ---- cadangan: nada sintesis (sama dengan dashboard KPR) ---- */
  function synthBus(c) {
    if (bus) return bus;
    const len = Math.round(c.sampleRate * .9), ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    const m = c.createGain(), dry = c.createGain(), wet = c.createGain(), rev = c.createConvolver(), hp = c.createBiquadFilter(), comp = c.createDynamicsCompressor();
    rev.buffer = ir; hp.type = "highpass"; hp.frequency.value = 900; m.gain.value = 1.3; dry.gain.value = 1; wet.gain.value = .32;
    comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = .002; comp.release.value = .12;
    dry.connect(comp); hp.connect(rev); rev.connect(wet); wet.connect(comp); comp.connect(m); m.connect(c.destination);
    return (bus = { dry, send: hp });
  }
  function synth(name) {
    const c = ensure(); if (!c) return;
    try {
      const B = synthBus(c), t0 = c.currentTime + .004;
      const ping = (f, d, dur, g, send = .5, type = "sine", glide = 1, atk = .004, lpf = 0) => {
        const o = c.createOscillator(), a = c.createGain(), sg = c.createGain(), t = t0 + d; o.type = type;
        o.frequency.setValueAtTime(f, t); if (glide !== 1) o.frequency.exponentialRampToValueAtTime(f * glide, t + dur * .6);
        a.gain.setValueAtTime(.0001, t); a.gain.exponentialRampToValueAtTime(g, t + atk); a.gain.exponentialRampToValueAtTime(.0001, t + dur);
        let src = o; if (lpf) { const f2 = c.createBiquadFilter(); f2.type = "lowpass"; f2.frequency.value = lpf; f2.Q.value = .5; o.connect(f2); src = f2; }
        sg.gain.value = send; src.connect(a); a.connect(B.dry); a.connect(sg); sg.connect(B.send); o.start(t); o.stop(t + dur + .05);
      };
      const click = (d, g, fq) => {
        const n = c.createBufferSource(), buf = c.createBuffer(1, Math.round(c.sampleRate * .012), c.sampleRate), x = buf.getChannelData(0);
        for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 4);
        const bp = c.createBiquadFilter(), a = c.createGain(); bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = 1.4; a.gain.value = g;
        n.buffer = buf; n.connect(bp); bp.connect(a); a.connect(B.dry); n.start(t0 + d);
      };
      if (name === "enter") { ping(523.25, 0, .42, .055, .3, "sine", 1, .035, 1400); ping(783.99, .07, .55, .042, .35, "sine", 1, .04, 1400); }
      else if (name === "back") { ping(783.99, 0, .38, .05, .3, "sine", 1, .035, 1400); ping(523.25, .07, .6, .045, .35, "sine", 1, .04, 1400); }
      else if (name === "hover") { ping(2093, 0, .09, .032, .55, "sine", 1.04); click(0, .018, 6500); }
      else if (name === "on") { ping(1046.5, 0, .3, .05, .6); ping(1568, .08, .5, .05, .75); }
      else if (name === "close") { click(0, .03, 4200); ping(1567.98, 0, .16, .045, .55, "sine", .82); ping(1046.5, .05, .3, .03, .65); }
      else { click(0, .045, 5600); ping(2637, 0, .07, .04, .5, "sine", .97); ping(5274, 0, .03, .008, .4); }
    } catch {}
  }

  function play(name, { minGap = 0 } = {}) {
    if (!enabled) return;
    const now = performance.now();
    if (minGap && now - (lastPlay[name] || 0) < minGap) return;
    lastPlay[name] = now;
    const c = ensure(); if (!c) return;
    if (!buffers[name]) { if (loading) synth(name); return; }
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = buffers[name]; g.gain.value = VOL[name] ?? 1;
    src.connect(g); g.connect(master); src.start();
  }

  // buka kunci audio pada interaksi pertama pengguna mana pun
  const unlock = () => { load(); removeEventListener("pointerdown", unlock, true); removeEventListener("keydown", unlock, true); };
  addEventListener("pointerdown", unlock, true);
  addEventListener("keydown", unlock, true);

  return {
    play, load,
    get enabled() { return enabled; },
    set enabled(v) { enabled = !!v; ls.set("sfx", v ? "on" : "off"); }
  };
})();
