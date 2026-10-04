/* =========================================================
   F. MOTION ENGINE — Lenis smooth scroll + GSAP ScrollTrigger
   Pins each [data-scene] section and scrubs its SCENES timeline,
   tweens section tones, drives the sheet indicator and anchor links.
   ========================================================= */
const SCENES = {};        // filled by js/scenes/*.js — one builder per scene

const Engine = {
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  lenis: null, page: null, triggers: {},

  init() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    history.scrollRestoration = "manual";
    if (!this.reduced && window.Lenis) {
      this.lenis = new Lenis({ lerp: MOTION.lenisLerp, smoothWheel: true });
      this.lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => this.lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
      /* pin spacers change the page height: keep Lenis's scroll limit in sync */
      ScrollTrigger.addEventListener("refresh", () => this.lenis.resize());
    }
    this.stop();
    this.page = ScrollTrigger.create({ start: 0, end: "max" });   // whole-page velocity source
    this.buildScenes();
    this.buildTones();
    this.buildSheet();
    this.bindAnchors();
  },

  stop() { this.lenis ? this.lenis.stop() : document.documentElement.classList.add("lenis-stopped"); },
  start() { this.lenis ? this.lenis.start() : document.documentElement.classList.remove("lenis-stopped"); ScrollTrigger.refresh(); },
  velocity() { return this.page ? this.page.getVelocity() : 0; },          // px / s
  scrollTo(y, opts = {}) {
    if (this.lenis) this.lenis.scrollTo(y, { duration: 1.6, ...opts });
    else window.scrollTo({ top: typeof y === "number" ? y : y.getBoundingClientRect().top + scrollY, behavior: this.reduced ? "auto" : "smooth" });
  },

  /* Each SCENES[key](el, ctx) returns { tl, onUpdate?(p), intro?() }.
     The timeline is built on a 0→1 time axis; the engine pins the section and scrubs it. */
  buildScenes() {
    document.querySelectorAll("[data-scene]").forEach((el) => {
      const key = el.dataset.scene, def = SCENES[key];
      if (!def) return;
      const ctx = {
        key, reduced: this.reduced, engine: this,
        vw: () => innerWidth, vh: () => innerHeight,
        /* fire fwd() when the playhead crosses `at` going forward, back() going backward */
        cues: (list) => { let last = 0; return (p) => { list.forEach(([at, fwd, back]) => { if (last < at && p >= at) fwd && fwd(); else if (last >= at && p < at) back && back(); }); last = p; }; },
      };
      const scene = def(el, ctx);
      const tl = scene.tl;
      tl.set({}, {}, 1);                       // normalise every timeline to 1s = whole scene
      if (scene.onUpdate) tl.eventCallback("onUpdate", () => scene.onUpdate(tl.progress()));
      this.triggers[key] = ScrollTrigger.create({
        trigger: el, pin: true, start: "top top",
        end: () => "+=" + innerHeight * Math.max(0.2, (SCENE_LENGTH[key] - 100) / 100),
        scrub: this.reduced ? true : MOTION.scrub,
        animation: tl, invalidateOnRefresh: true, anticipatePin: 1,
        onToggle: (self) => el.classList.toggle("live", self.isActive),
      });
      this.triggers[key].scene = scene;
    });
  },

  /* Tone changes are colour tweens tied to scroll, not hard cuts:
     each section fades its own background in from the previous tone while it enters. */
  buildTones() {
    const css = getComputedStyle(document.documentElement);
    const C = { ivory: css.getPropertyValue("--ivory").trim(), stone: css.getPropertyValue("--stone").trim(),
                dark: css.getPropertyValue("--charcoal").trim(), deep: css.getPropertyValue("--deep").trim() };
    const toned = [...document.querySelectorAll("section[data-tone]")];
    toned.forEach((el, i) => {
      const tone = el.dataset.tone, prev = i ? toned[i - 1].dataset.tone : tone;
      const box = el.matches(".scene") ? el.querySelector(".stage") : el;
      if (prev !== tone && !this.reduced) {
        gsap.fromTo(box, { backgroundColor: C[prev] }, { backgroundColor: C[tone], ease: "none", immediateRender: false,
          scrollTrigger: { trigger: el, start: "top bottom", end: "top 35%", scrub: true } });
      }
      /* film grain only over dark tones */
      if (tone === "deep" || tone === "dark") {
        ScrollTrigger.create({ trigger: el, start: "top 50%", end: () => "bottom 50%",
          onToggle: (self) => document.documentElement.classList.toggle("dark-zone", self.isActive) });
      }
    });
  },

  /* Sheet indicator: label rolls vertically when the section at mid-screen changes */
  buildSheet() {
    const sheets = [...document.querySelectorAll("[data-sheet]")], box = document.getElementById("sheet");
    const set = (i) => {
      if (i === this.sheetIx) return; const dir = i > (this.sheetIx ?? -1) ? 1 : -1; this.sheetIx = i;
      Reveal.roll(box.querySelector(".s-n"), `Sheet ${pad2(i)}`, dir);
      Reveal.roll(box.querySelector(".s-t"), sheets[i].dataset.sheet, dir);
    };
    sheets.forEach((el, i) => ScrollTrigger.create({ trigger: el, start: "top 50%", end: "bottom 50%",
      onEnter: () => set(i), onEnterBack: () => set(i) }));
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: (s) => box.style.setProperty("--doc", s.progress.toFixed(3)) });
  },

  bindAnchors() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const target = document.querySelector(a.getAttribute("href")); if (!target) return;
      e.preventDefault();
      this.scrollTo(target.id === "hero" ? 0 : target);
    });
  },
};
