/* =========================================================
   I. CHROME — custom cursor, magnetic links, film grain, preloader, sound toggle
   ========================================================= */

/* ---------- Cursor: ivory dot + lagging ring that grows into a label (fine pointers only) ---------- */
const Cursor = {
  init() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.insertAdjacentHTML("beforeend", `<div id="cursor" aria-hidden="true"><i class="c-dot"></i><span class="c-ring"></span><span class="c-label"></span></div>`);
    document.documentElement.classList.add("has-cursor");
    const root = document.getElementById("cursor"), dot = root.querySelector(".c-dot"), ring = root.querySelector(".c-ring"), label = root.querySelector(".c-label");
    const lag = reduced ? 0.01 : 0.45;
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo([ring, label], "x", { duration: lag, ease: "power3.out" }), ry = gsap.quickTo([ring, label], "y", { duration: lag, ease: "power3.out" });
    gsap.set([dot, ring, label], { x: -100, y: -100 });
    addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); }, { passive: true });
    document.addEventListener("pointerleave", () => gsap.to(root, { opacity: 0, duration: 0.3 }));
    document.addEventListener("pointerenter", () => gsap.to(root, { opacity: 1, duration: 0.3 }));

    let state = "";
    const set = (mode, text = "") => {
      if (mode === state && label.textContent === text) return; state = mode;
      if (mode === "label") {
        label.textContent = text;
        gsap.to(ring, { scale: 2.5, opacity: 1, duration: 0.6, ease: "expo.out" });
        gsap.to(label, { opacity: 1, duration: 0.4, delay: 0.08 });
        gsap.to(dot, { scale: 0, duration: 0.3 });
      } else if (mode === "link") {
        gsap.to(ring, { scale: 1.5, opacity: 1, duration: 0.5, ease: "expo.out" });
        gsap.to(label, { opacity: 0, duration: 0.2 }); gsap.to(dot, { scale: 0.5, duration: 0.3 });
      } else {
        gsap.to(ring, { scale: 1, opacity: 0.6, duration: 0.5, ease: "expo.out" });
        gsap.to(label, { opacity: 0, duration: 0.2 }); gsap.to(dot, { scale: 1, duration: 0.3 });
      }
    };
    document.addEventListener("pointerover", (e) => {
      const c = e.target.closest("[data-cursor]");
      if (c) return set("label", c.dataset.cursor);
      if (e.target.closest("a,button")) return set("link");
      set("");
    });
    addEventListener("pointerdown", () => gsap.to(ring, { scale: "*=0.85", duration: 0.2, yoyo: true, repeat: 1 }));

    /* magnetic pull on nav links and buttons */
    if (reduced) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" }), my = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.35); my((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener("pointerleave", () => { gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.4)" }); });
    });
  },
};

/* ---------- Film grain: a canvas-generated noise tile, shown only over dark scenes ---------- */
const Grain = {
  init() {
    const c = document.createElement("canvas"); c.width = c.height = 180;
    const g = c.getContext("2d"), img = g.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const el = document.createElement("div"); el.id = "grain"; el.setAttribute("aria-hidden", "true");
    el.style.backgroundImage = `url(${c.toDataURL("image/png")})`;
    el.style.mixBlendMode = "overlay";
    document.body.append(el);
  },
};

/* ---------- Sound toggle in the nav ---------- */
const SoundToggle = {
  init() {
    const b = document.getElementById("sound-toggle"), s = b.querySelector(".snd-s");
    const sync = (on) => { b.setAttribute("aria-pressed", String(on)); s.textContent = on ? "on" : "off"; };
    AudioManager.subscribe(sync);
    b.addEventListener("click", () => AudioManager.toggle());
  },
};

/* ---------- Preloader: hairline + 0–100 counter, decode scene images, name rises, sound choice ---------- */
const Preloader = {
  run(urls) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches, d = (s) => (reduced ? 0.01 : s * MOTION.speed);
    const pref = AudioManager.pref();
    document.body.insertAdjacentHTML("afterbegin", `
      <div id="loader" role="dialog" aria-modal="true" aria-label="Loading portfolio">
        <div class="ld-in">
          <h2 class="ld-name" aria-label="${SITE.person.name}">${SITE.person.name.toUpperCase()}</h2>
          <div class="ld-row"><span class="label" style="color:rgba(242,239,232,.5)">Portfolio</span><span class="ld-count num">0</span></div>
          <div class="ld-line"><i></i></div>
          <div class="ld-choice">
            <button type="button" data-sound="on" class="${pref === "on" ? "pref" : ""}">Enter with sound</button>
            <button type="button" data-sound="off" class="${pref !== "on" ? "pref" : ""}">Enter in silence</button>
          </div>
          <p class="ld-note">Ambient music and soft interface sounds · toggle anytime</p>
        </div>
      </div>`);
    const L = document.getElementById("loader"), line = L.querySelector(".ld-line i"), count = L.querySelector(".ld-count");
    const chars = Reveal.splitChars(L.querySelector(".ld-name"));
    gsap.set(chars, { yPercent: 110 });
    const shown = { v: 0 };
    const draw = gsap.quickTo(shown, "v", { duration: 0.6, ease: "power2.out",
      onUpdate: () => { count.textContent = Math.round(shown.v); line.style.transform = `scaleX(${shown.v / 100})`; } });

    let loaded = 0;
    const load = (src) => new Promise((res) => {
      const im = new Image(); im.src = src;
      (im.decode ? im.decode() : new Promise((r) => (im.onload = r))).catch(() => {}).finally(() => { loaded++; draw((loaded / urls.length) * 100); res(); });
    });
    const minTime = new Promise((r) => setTimeout(r, reduced ? 0 : 900));
    const timeout = new Promise((r) => setTimeout(r, 12000));          // never trap visitors on a slow link
    const ready = Promise.race([Promise.all([...urls.map(load), minTime]), timeout]);

    return ready.then(() => new Promise((resolve) => {
      draw(100);
      const tl = gsap.timeline({ delay: d(0.6) });
      tl.to(chars, { yPercent: 0, duration: d(1.2), ease: "expo.out", stagger: d(0.045) })
        .to(L.querySelectorAll(".ld-choice button"), { opacity: 1, duration: d(0.8), stagger: d(0.1) }, "-=0.6")
        .to(L.querySelector(".ld-note"), { opacity: 1, duration: d(0.8) }, "<0.2")
        .add(() => L.querySelector(".ld-choice .pref").focus({ preventScroll: true }));

      let done = false;
      const enter = (withSound) => {
        if (done) return; done = true;
        removeEventListener("wheel", silent); removeEventListener("keydown", onKey);
        if (withSound) AudioManager.enable().then(() => setTimeout(() => AudioManager.play("chime"), 120)).catch(() => {});
        else AudioManager.disable();
        gsap.timeline({ onComplete: () => { L.remove(); } })
          .to(L.querySelectorAll(".ld-row,.ld-line,.ld-choice,.ld-note"), { opacity: 0, duration: d(0.5) })
          .to(chars, { yPercent: -110, duration: d(0.8), ease: "expo.in", stagger: d(0.025) }, 0)
          .fromTo(L, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: d(1.1), ease: "expo.inOut" }, d(0.55))
          .add(resolve, d(0.75));
      };
      const silent = () => enter(false);
      const onKey = (e) => { if (e.key === "Escape") enter(false); };
      L.querySelectorAll("[data-sound]").forEach((b) => b.addEventListener("click", () => enter(b.dataset.sound === "on")));
      addEventListener("wheel", silent, { passive: true, once: true });
      addEventListener("keydown", onKey);
    }));
  },
};
