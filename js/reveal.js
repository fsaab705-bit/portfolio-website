/* =========================================================
   H. PAGE POLISH — split-text reveals, image wipes, hairlines,
   Selected Works (velocity skew, hover follow, count-up), parallax, contact, copy
   ========================================================= */
const Reveal = {
  reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
  fine: matchMedia("(hover: hover) and (pointer: fine)").matches,
  d: (s) => s * MOTION.speed,

  /* custom splitter: wraps every character of an element's text nodes in .ch (keeps spaces, <em>, <br>) */
  splitChars(el) {
    if (el.dataset.split) return [...el.querySelectorAll(".ch")];
    el.dataset.split = "1";
    const walk = (node) => [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach((c) => {
          if (c === " ") { frag.append(" "); return; }
          const s = document.createElement("span"); s.className = "ch"; s.textContent = c; s.setAttribute("aria-hidden", "true"); frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el);
    return [...el.querySelectorAll(".ch")];
  },

  /* vertical text roll for labels (sheet indicator, counters) */
  roll(box, text, dir = 1) {
    if (!box) return;
    const cur = box.lastElementChild;
    if (cur && cur.textContent === text) return;
    if (this.reduced || !cur) { box.innerHTML = `<span>${text}</span>`; return; }
    const nx = document.createElement("span"); nx.textContent = text; box.append(nx);
    gsap.killTweensOf(box.children);
    [...box.children].slice(0, -2).forEach((n) => n.remove());
    gsap.fromTo(nx, { yPercent: 100 * dir }, { yPercent: 0, duration: this.d(0.7), ease: "expo.out" });
    gsap.to(cur, { yPercent: -100 * dir, duration: this.d(0.7), ease: "expo.out", onComplete: () => cur.remove() });
  },

  init() {
    const R = this.reduced;
    /* --- line-mask headings --- */
    document.querySelectorAll(".rv-text").forEach((el) => {
      if (el.closest("#hero")) return;                       // hero runs its own intro
      const spans = el.querySelectorAll(".ln>span");
      if (R) return;
      gsap.set(spans, { yPercent: 110 });
      ScrollTrigger.create({ trigger: el, start: "top 86%", once: true,
        onEnter: () => gsap.to(spans, { yPercent: 0, duration: this.d(1.2), ease: "expo.out", stagger: this.d(0.09) }) });
    });

    /* --- image reveals: clip-path wipe + scale settle; direction varies per figure --- */
    const CLIP = { up: "inset(100% 0% 0% 0%)", down: "inset(0% 0% 100% 0%)", left: "inset(0% 100% 0% 0%)", right: "inset(0% 0% 0% 100%)", iris: "inset(22% 22% 22% 22%)" };
    document.querySelectorAll(".rv-img").forEach((fig) => {
      const frame = fig.querySelector(".frame"), img = frame.querySelector("img");
      if (!img) return;
      const end = fig.closest(".work") ? "inset(1.6% 1.6% 1.6% 1.6%)" : "inset(0% 0% 0% 0%)";
      if (R) { gsap.set(frame, { clipPath: end, opacity: 0 }); }
      else gsap.set(frame, { clipPath: CLIP[fig.dataset.dir] || CLIP.up });
      ScrollTrigger.create({ trigger: fig, start: "top 85%", once: true, onEnter: () => {
        AudioManager.play("whoosh");
        if (R) { gsap.to(frame, { opacity: 1, duration: 0.6 }); return; }
        gsap.fromTo(frame, { clipPath: CLIP[fig.dataset.dir] || CLIP.up }, { clipPath: end, duration: this.d(1.5), ease: "expo.inOut" });
        gsap.fromTo(img, { scale: 1.22 }, { scale: fig.closest(".work") ? 1.08 : 1, duration: this.d(2.1), ease: "expo.out" });
      } });
    });
    /* drawings: a sand hairline sweeps across like a plotter pen */
    document.querySelectorAll(".rv-wipe").forEach((fig) => {
      const frame = fig.querySelector(".frame");
      if (R) return;
      gsap.set(frame, { clipPath: "inset(0% 100% 0% 0%)" });
      ScrollTrigger.create({ trigger: fig, start: "top 82%", once: true, onEnter: () => {
        AudioManager.play("whoosh");
        gsap.fromTo(frame, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: this.d(2.2), ease: "power2.inOut" });
      } });
    });

    /* --- hairlines draw in (instead of fading every paragraph) --- */
    document.querySelectorAll(".rv-rules").forEach((list) => {
      [...list.children].forEach((c, i) => c.style.setProperty("--i", i));
      ScrollTrigger.create({ trigger: list, start: "top 88%", once: true, onEnter: () => list.classList.add("in") });
    });
    /* colour swatches open like paint chips */
    document.querySelectorAll(".rv-swatch").forEach((row) => {
      if (R) return;
      gsap.set(row.children, { clipPath: "inset(100% 0% 0% 0%)" });
      ScrollTrigger.create({ trigger: row, start: "top 88%", once: true,
        onEnter: () => gsap.fromTo(row.children, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: this.d(1.1), ease: "expo.inOut", stagger: this.d(0.08) }) });
    });

    /* --- parallax (off for reduced motion) --- */
    if (!R) document.querySelectorAll("[data-parallax]").forEach((fig) => {
      const k = +fig.dataset.parallax, img = fig.querySelector("img");
      gsap.fromTo(img, { yPercent: -k * 100, scale: 1 + k * 2.2 }, { yPercent: k * 100, ease: "none",
        scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true } });
    });

    this.works();
    this.contact();
    this.copy();
    this.hoverTicks();
  },

  /* --- Selected Works: velocity skew, hover follow + edge reveal, number count-up --- */
  works() {
    const works = [...document.querySelectorAll(".work")];
    const frames = works.map((w) => w.querySelector(".frame"));
    if (!this.reduced) {
      const skew = gsap.quickTo(frames, "skewY", { duration: 0.6, ease: "power3.out" });
      const sy = gsap.quickTo(frames, "scaleY", { duration: 0.6, ease: "power3.out" });
      let live = false;
      ScrollTrigger.create({ trigger: "#work", start: "top bottom", end: "bottom top", onToggle: (s) => { live = s.isActive; if (!live) { skew(0); sy(1); } } });
      gsap.ticker.add(() => {
        if (!live) return;
        const v = gsap.utils.clamp(-1, 1, Engine.velocity() / 3000);
        skew(v * MOTION.skewMax); sy(1 + Math.abs(v) * 0.02);
      });
    }
    const count = (el) => {
      const n = +el.dataset.count, o = { v: 0 };
      if (this.reduced) return;
      gsap.to(o, { v: n, duration: this.d(0.9), ease: "power2.out", onUpdate: () => (el.textContent = pad2(Math.round(o.v))) });
    };
    works.forEach((w) => {
      const num = w.querySelector("[data-count]");
      ScrollTrigger.create({ trigger: w, start: "top 80%", once: true, onEnter: () => count(num) });
      if (!this.fine || this.reduced) return;
      const img = w.querySelector(".frame img"), frame = w.querySelector(".frame");
      const mx = gsap.quickTo(img, "xPercent", { duration: 0.9, ease: "power3.out" });
      const my = gsap.quickTo(img, "yPercent", { duration: 0.9, ease: "power3.out" });
      w.addEventListener("pointerenter", () => {
        count(num);
        gsap.fromTo(frame, { clipPath: "inset(1.6% 1.6% 1.6% 1.6%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.out" });
        gsap.to(img, { scale: 1.08 * 1.04, duration: 1.2, ease: "expo.out" });
      });
      w.addEventListener("pointermove", (e) => {
        const r = frame.getBoundingClientRect();
        mx(((e.clientX - r.left) / r.width - 0.5) * -3); my(((e.clientY - r.top) / r.height - 0.5) * -3);
      });
      w.addEventListener("pointerleave", () => {
        mx(0); my(0);
        gsap.fromTo(frame, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(1.6% 1.6% 1.6% 1.6%)", duration: 0.9, ease: "expo.out" });
        gsap.to(img, { scale: 1.08, duration: 1.2, ease: "expo.out" });
      });
    });
  },

  /* --- Contact: the giant line assembles word by word on scroll --- */
  contact() {
    const words = document.querySelectorAll("#contact .wd");
    if (this.reduced) return;
    gsap.fromTo(words, { yPercent: 115, rotate: 4 }, { yPercent: 0, rotate: 0, ease: "power3.out", stagger: 0.12,
      scrollTrigger: { trigger: "#contact", start: "top 75%", end: "top 10%", scrub: 0.8 } });
  },

  copy() {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-copy]"); if (!b) return;
      const done = () => {
        AudioManager.play("tok");
        b.classList.add("done");
        if (!this.reduced) gsap.fromTo(b, { scale: 0.94 }, { scale: 1, duration: 0.7, ease: "elastic.out(1,0.45)" });
        clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("done"), 1800);
      };
      (navigator.clipboard?.writeText(b.dataset.copy) || Promise.reject()).then(done).catch(() => {
        const r = document.createRange(); r.selectNodeContents(b.previousElementSibling);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      });
    });
  },

  /* soft tick on hover of links and works; tok on clicks */
  hoverTicks() {
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("a,button,[data-cursor]");
      if (t && !t.contains(e.relatedTarget)) AudioManager.play("tick");
    });
    document.addEventListener("click", (e) => { if (e.target.closest("a,button:not([data-copy]):not(#sound-toggle)")) AudioManager.play("tok"); });
  },
};
