/* =========================================================
   G. AUDIO — AudioManager (Web Audio API, no downloads)
   Graph:  music voices → padFilter → (dry + reverb) → musicBus → musicFilter → duck ─┐
           sfx voices   → sfxBus (+ short reverb send) ──────────────────────────────┼→ master → limiter → speakers
   Everything is generated in the browser. To use a recorded track instead,
   set AUDIO.file (see CHANGELOG.md → How to tweak).
   ========================================================= */
const AUDIO = {
  master: 0.8,        // overall volume 0..1
  music: 0.42,        // music bus level 0..1 — "lower music volume" = lower this
  sfxRelDb: -18,      // SFX peak level relative to music peaks, in dB (−18 = subtle)
  fadeIn: 3,          // seconds for the music to fade in
  duckDb: -6,         // music dip during big transitions
  bpm: 64,            // tempo of the generative bed
  file: null,         // e.g. "audio/ambient.mp3" — a local, seamlessly looping file replaces the generative bed
  storageKey: "fs-sound",
};

const AudioManager = (() => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ctx = null, nodes = null, noise = null, musicTimer = null, fileSrc = null;
  const st = { on: false, sfxOn: !reduced, nextChord: 0, chordIx: 0, last: {}, recent: [] };
  const listeners = new Set();

  const dB = (d) => Math.pow(10, d / 20);
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* ---------- preferences ---------- */
  function loadPref() { try { return localStorage.getItem(AUDIO.storageKey); } catch (e) { return null; } }
  function savePref(v) { try { localStorage.setItem(AUDIO.storageKey, v); } catch (e) { /* storage blocked: fine */ } }

  /* ---------- graph ---------- */
  function impulse(seconds, decay) {
    const rate = ctx.sampleRate, len = Math.floor(rate * seconds), buf = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const g = (v = 1) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    const master = g(0), limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10; limiter.ratio.value = 6; limiter.attack.value = 0.003; limiter.release.value = 0.25;
    master.connect(limiter).connect(ctx.destination);

    const duck = g(1), musicFilter = ctx.createBiquadFilter();
    musicFilter.type = "lowpass"; musicFilter.frequency.value = 9000; musicFilter.Q.value = 0.5;
    const musicBus = g(0);
    musicBus.connect(musicFilter).connect(duck).connect(master);

    const padFilter = ctx.createBiquadFilter(); padFilter.type = "lowpass"; padFilter.frequency.value = 1500; padFilter.Q.value = 0.4;
    const padDry = g(0.55), verb = ctx.createConvolver(), verbWet = g(0.75);
    verb.buffer = impulse(4.2, 2.6);
    padFilter.connect(padDry).connect(musicBus);
    padFilter.connect(verb); verb.connect(verbWet).connect(musicBus);

    /* music peaks ≈ 0.55 × bus level → SFX bus sits sfxRelDb under that */
    const sfxBus = g(AUDIO.music * 0.55 * dB(AUDIO.sfxRelDb));
    const sfxVerb = ctx.createConvolver(), sfxVerbWet = g(0.35);
    sfxVerb.buffer = impulse(1.8, 3);
    sfxBus.connect(master); sfxVerb.connect(sfxVerbWet).connect(sfxBus);

    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    noise = nb;
    nodes = { master, duck, musicFilter, musicBus, padFilter, verb, sfxBus, sfxVerb };
  }

  /* ---------- generative ambient bed: Cmaj7 → Am9 → Fmaj7 → G6, two bars each ---------- */
  const CHORDS = [
    { bass: 48, notes: [52, 55, 59, 64], hi: [76, 79, 83, 84] },   // Cmaj7
    { bass: 45, notes: [55, 59, 60, 64], hi: [76, 79, 81, 83] },   // Am9
    { bass: 41, notes: [52, 57, 60, 64], hi: [72, 76, 77, 81] },   // Fmaj7
    { bass: 43, notes: [55, 59, 62, 64], hi: [74, 76, 79, 83] },   // G6
  ];
  function padVoice(freq, t0, dur, level, out) {
    const env = ctx.createGain(); env.gain.value = 0; env.connect(out);
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(level, t0 + 2.6);
    env.gain.setValueAtTime(level, t0 + dur - 0.2);
    env.gain.setTargetAtTime(0, t0 + dur - 0.2, 1.1);
    [["triangle", -6], ["sine", 6]].forEach(([type, cents]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; o.detune.value = cents + (Math.random() * 4 - 2);
      o.connect(env); o.start(t0); o.stop(t0 + dur + 6);
    });
  }
  function bell(freq, t0, level) {   // soft felt-piano / celesta tone
    const env = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 2600;
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(level, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
    env.connect(lp); lp.connect(nodes.padFilter);
    [[1, 1], [2, 0.18], [3, 0.05]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator(), a = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq * mult; a.gain.value = amp;
      o.connect(a).connect(env); o.start(t0); o.stop(t0 + 3.4);
    });
  }
  function scheduleMusic() {
    const beat = 60 / AUDIO.bpm, chordLen = beat * 8;
    while (st.nextChord < ctx.currentTime + 1.5) {
      const c = CHORDS[st.chordIx % CHORDS.length], t0 = st.nextChord;
      c.notes.forEach((n) => padVoice(midi(n), t0, chordLen + 1.2, 0.05, nodes.padFilter));
      padVoice(midi(c.bass), t0, chordLen + 1.2, 0.07, nodes.padFilter);
      for (let b = 1; b < 8; b++) {
        if (Math.random() < 0.32) bell(midi(c.hi[(Math.random() * c.hi.length) | 0]), t0 + b * beat + Math.random() * 0.06, 0.05 + Math.random() * 0.03);
      }
      st.nextChord += chordLen; st.chordIx++;
    }
  }
  async function startMusic() {
    const now = ctx.currentTime, bus = nodes.musicBus.gain;
    bus.cancelScheduledValues(now); bus.setValueAtTime(bus.value, now);
    bus.linearRampToValueAtTime(AUDIO.music, now + AUDIO.fadeIn);
    if (AUDIO.file) {
      if (fileSrc) return;
      try {
        const buf = await ctx.decodeAudioData(await (await fetch(AUDIO.file)).arrayBuffer());
        fileSrc = ctx.createBufferSource(); fileSrc.buffer = buf; fileSrc.loop = true;
        fileSrc.connect(nodes.musicBus); fileSrc.start();
        return;
      } catch (e) { /* file missing → fall back to the generative bed */ }
    }
    if (musicTimer) return;
    st.nextChord = Math.max(st.nextChord, ctx.currentTime + 0.1);
    scheduleMusic();
    musicTimer = setInterval(scheduleMusic, 400);
  }
  function stopMusic(fade = 0.8) {
    if (!ctx) return;
    const now = ctx.currentTime, bus = nodes.musicBus.gain;
    bus.cancelScheduledValues(now); bus.setValueAtTime(bus.value, now); bus.linearRampToValueAtTime(0, now + fade);
    clearInterval(musicTimer); musicTimer = null;
    if (fileSrc) { const s = fileSrc; fileSrc = null; setTimeout(() => s.stop(), fade * 1000 + 50); }
  }

  /* ---------- SFX (all short, soft attack) ---------- */
  const env = (node, t0, peak, attack, decay) => {
    const e = ctx.createGain();
    e.gain.setValueAtTime(0, t0);
    e.gain.linearRampToValueAtTime(peak, t0 + attack);
    e.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    node.connect(e); return e;
  };
  const noiseSrc = (t0, dur) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05); return s; };
  const filt = (type, f, q = 1) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const out = (n, verb = 0) => { n.connect(nodes.sfxBus); if (verb) { const s = ctx.createGain(); s.gain.value = verb; n.connect(s).connect(nodes.sfxVerb); } };
  const vary = (amt = 0.05) => 1 + (Math.random() * 2 - 1) * amt;     // ±5 % pitch variation

  const SFX = {
    tick(t) {                                  // hover on links / works
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = 2900 * vary(0.04);
      o.start(t); o.stop(t + 0.05);
      out(env(o, t, 0.35, 0.003, 0.03));
    },
    tok(t) {                                   // click / copy: muted wooden tok
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(640 * vary(0.03), t); o.frequency.exponentialRampToValueAtTime(360, t + 0.06);
      o.start(t); o.stop(t + 0.16);
      out(env(o, t, 0.9, 0.004, 0.11), 0.2);
      const n = noiseSrc(t, 0.05), bp = filt("bandpass", 1300, 3); n.connect(bp);
      out(env(bp, t, 0.35, 0.002, 0.03));
    },
    whoosh(t) {                                // image reveal: faint air
      const r = vary(0.05), n = noiseSrc(t, 0.75), bp = filt("bandpass", 500 * r, 0.9);
      bp.frequency.setValueAtTime(420 * r, t); bp.frequency.exponentialRampToValueAtTime(2100 * r, t + 0.32); bp.frequency.exponentialRampToValueAtTime(900 * r, t + 0.7);
      n.connect(bp); out(env(bp, t, 0.55, 0.22, 0.48), 0.25);
    },
    shimmer(t) {                               // garden colour flood
      [1568, 2093, 2637, 3136, 3951].forEach((f, i) => {
        const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain();
        o.type = "sine"; o.frequency.value = f * vary(0.01);
        lfo.frequency.value = 5 + i; lg.gain.value = f * 0.004; lfo.connect(lg).connect(o.frequency);
        const t0 = t + i * 0.07; o.start(t0); lfo.start(t0); o.stop(t0 + 2.2); lfo.stop(t0 + 2.2);
        out(env(o, t0, 0.12, 0.3, 1.7), 0.6);
      });
    },
    door(t) {                                  // latch, then a low wooden creak
      [0, 0.07].forEach((d) => { const n = noiseSrc(t + d, 0.03), bp = filt("bandpass", 2400, 4); n.connect(bp); out(env(bp, t + d, 0.7, 0.002, 0.025)); });
      const o = ctx.createOscillator(), bp = filt("bandpass", 420, 9), bp2 = filt("bandpass", 860, 6), t0 = t + 0.18;
      o.type = "sawtooth";
      o.frequency.setValueAtTime(18, t0); o.frequency.linearRampToValueAtTime(34, t0 + 0.35);
      o.frequency.linearRampToValueAtTime(22, t0 + 0.7); o.frequency.linearRampToValueAtTime(40, t0 + 1.05); o.frequency.linearRampToValueAtTime(26, t0 + 1.4);
      bp.frequency.setValueAtTime(380, t0); bp.frequency.linearRampToValueAtTime(470, t0 + 1.4);
      o.connect(bp); o.connect(bp2); o.start(t0); o.stop(t0 + 1.7);
      const e = ctx.createGain(); e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(0.9, t0 + 0.25);
      e.gain.setValueAtTime(0.9, t0 + 1.1); e.gain.linearRampToValueAtTime(0, t0 + 1.6);
      bp.connect(e); bp2.connect(e); out(e, 0.3);
    },
    room(t) {                                  // room-tone swell on arrival
      const n = noiseSrc(t, 4.2), lp = filt("lowpass", 380, 0.5);
      n.connect(lp);
      const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(0.55, t + 1.4); e.gain.linearRampToValueAtTime(0, t + 4.1);
      lp.connect(e); out(e, 0.4);
    },
    slide(t, { v = 0.5 } = {}) {               // kitchen track, scaled with velocity
      const n = noiseSrc(t, 0.5), bp = filt("bandpass", 800 * vary(0.08), 0.7);
      bp.frequency.setValueAtTime(700, t); bp.frequency.exponentialRampToValueAtTime(1500, t + 0.35);
      n.connect(bp); out(env(bp, t, 0.25 + 0.55 * v, 0.08, 0.36));
    },
    thump(t) {                                 // bedroom lights off
      const o = ctx.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(78, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.4);
      o.start(t); o.stop(t + 0.8);
      out(env(o, t, 1, 0.006, 0.6), 0.3);
      const n = noiseSrc(t, 0.2), lp = filt("lowpass", 200); n.connect(lp); out(env(lp, t, 0.5, 0.004, 0.15));
    },
    chime(t) {                                 // preloader complete: one warm chime
      [[1046.5, 0], [1318.5, 0.11]].forEach(([f, d], k) => {
        [[1, 1], [2.01, 0.3], [2.76, 0.16], [4.07, 0.06]].forEach(([m, a]) => {
          const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
          o.start(t + d); o.stop(t + d + 3.4);
          out(env(o, t + d, a * (k ? 0.45 : 0.7), 0.006, 3), 0.7);
        });
      });
    },
  };
  /* minimum gap per sound, ms — keeps fast scrolling from spamming */
  const GAP = { tick: 80, tok: 60, whoosh: 260, shimmer: 1800, door: 1800, room: 2500, slide: 200, thump: 1500, chime: 1000 };

  /* ---------- public API ---------- */
  const api = {
    get on() { return st.on; },
    get sfxOn() { return st.sfxOn; },
    pref: () => loadPref(),
    subscribe(fn) { listeners.add(fn); },
    async enable() {
      if (!ctx) build();
      if (ctx.state !== "running") await ctx.resume();
      st.on = true; savePref("on");
      const now = ctx.currentTime, m = nodes.master.gain;
      m.cancelScheduledValues(now); m.setValueAtTime(m.value, now); m.linearRampToValueAtTime(AUDIO.master, now + 0.4);
      startMusic();
      listeners.forEach((fn) => fn(true));
    },
    disable() {
      st.on = false; savePref("off");
      if (ctx) {
        stopMusic(0.6);
        const now = ctx.currentTime, m = nodes.master.gain;
        m.cancelScheduledValues(now); m.setValueAtTime(m.value, now); m.linearRampToValueAtTime(0, now + 0.7);
        setTimeout(() => { if (!st.on && ctx.state === "running") ctx.suspend(); }, 900);
      }
      listeners.forEach((fn) => fn(false));
    },
    toggle() { return st.on ? api.disable() : api.enable(); },
    setSfx(v) { st.sfxOn = !!v; },
    play(name, opts) {
      if (!st.on || !st.sfxOn || !ctx || ctx.state !== "running" || !SFX[name] || document.hidden) return;
      const now = performance.now();
      if (now - (st.last[name] || 0) < (GAP[name] || 100)) return;
      st.recent = st.recent.filter((t) => now - t < 1000);
      if (st.recent.length >= 6) return;                       // global cap: 6 sounds / second
      st.last[name] = now; st.recent.push(now);
      SFX[name](ctx.currentTime + 0.005, opts);
    },
    duck(hold = 1.4) {                                          // −6 dB dip for big transitions
      if (!st.on || !ctx) return;
      const g = nodes.duck.gain, now = ctx.currentTime;
      g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(dB(AUDIO.duckDb), now + 0.35);
      g.setValueAtTime(dB(AUDIO.duckDb), now + 0.35 + hold);
      g.linearRampToValueAtTime(1, now + 0.35 + hold + 1.6);
    },
    dark(on) {                                                   // "lights off": filter sweep on the music
      if (!ctx) return;
      const f = nodes.musicFilter.frequency, now = ctx.currentTime;
      f.cancelScheduledValues(now); f.setValueAtTime(f.value, now);
      f.exponentialRampToValueAtTime(on ? 320 : 9000, now + (on ? 1.8 : 1.2));
    },
  };

  /* tab hidden → fade out and suspend; back → resume and fade in */
  document.addEventListener("visibilitychange", () => {
    if (!ctx || !st.on) return;
    const m = nodes.master.gain, now = ctx.currentTime;
    m.cancelScheduledValues(now); m.setValueAtTime(m.value, now);
    if (document.hidden) {
      m.linearRampToValueAtTime(0, now + 0.6);
      setTimeout(() => { if (document.hidden) ctx.suspend(); }, 700);
    } else {
      ctx.resume().then(() => { const t = ctx.currentTime; m.setValueAtTime(0, t); m.linearRampToValueAtTime(AUDIO.master, t + 1.2); });
    }
  });

  return api;
})();
