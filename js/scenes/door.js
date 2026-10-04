/* EXTERIOR — façade, camera pushes in to the front door, the façade swings open as a
   double door on 3D hinges, warm light spills out, the camera settles in the kitchen.
   Timeline marks (0–1): push .10–.50 · "through" .36–.62 · swing .50–.78 · light .50–.95 · arrive .82–1 */
SCENES.door = (el, ctx) => {
  const x = SITE.exterior, $ = (s) => el.querySelector(s), $$ = (s) => [...el.querySelectorAll(s)];
  const halves = $$(".half"), plates = $$(".half .plate"), knock = $(".knock");
  const insideImg = $(".inside img"), dim = $(".inside .dim"), light = $(".light");
  let W = 0, H = 0;

  const size = () => {
    const vw = ctx.vw(), vh = ctx.vh();
    W = Math.max(vw, vh * x.ratio); H = W / x.ratio;
    plates.forEach((p) => {
      Object.assign(p.style, { width: W + "px", height: H + "px", marginLeft: -W / 2 + "px", marginTop: -H / 2 + "px" });
      gsap.set(p, { transformOrigin: `${x.door[0] * 100}% ${x.door[1] * 100}%` });
    });
    /* the Enter ring sits on the door */
    gsap.set(knock, { x: vw / 2 + (x.door[0] - 0.5) * W, y: vh / 2 + (x.door[1] - 0.5) * H });
  };
  size(); ScrollTrigger.addEventListener("refreshInit", size);
  /* exterior.jpg is 2000px wide → push-in capped at MOTION.maxUpscale × native */
  const zoom = () => Math.max(1.4, Math.min(7.5, (MOTION.maxUpscale * 2000) / W));
  const insideStart = () => Math.max(1, Math.min(1.5, (MOTION.maxUpscale * 2000) / Math.max(ctx.vw(), ctx.vh() * x.ratio)));

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  tl.to(knock, { opacity: 0, scale: 0.6, duration: 0.08 }, 0.06)
    .to($(".title"), { opacity: 0, y: -60, duration: 0.16 }, 0.1)
    .to($(".meta"), { opacity: 0, duration: 0.1 }, 0.1);

  if (ctx.reduced) {
    tl.to(halves, { opacity: 0, duration: 0.2 }, 0.5)
      .fromTo(dim, { opacity: 1 }, { opacity: 0.15, duration: 0.3 }, 0.52)
      .fromTo($(".through"), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.36).to($(".through"), { opacity: 0, duration: 0.06 }, 0.56)
      .fromTo($(".arrive"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.82);
  } else {
    tl.fromTo(plates, { x: 0, y: 0, scale: 1 },
        { x: () => -(x.door[0] - 0.5) * W, y: () => -(x.door[1] - 0.5) * H, scale: zoom, duration: 0.4, ease: "power2.inOut" }, 0.1)
      .fromTo($$(".through .ln>span"), { yPercent: 110 }, { yPercent: 0, duration: 0.1, stagger: 0.03, ease: "power3.out" }, 0.34)
      .to($$(".through .ln>span"), { yPercent: -110, duration: 0.08, stagger: 0.02, ease: "power2.in" }, 0.56)
      /* the double door: each half hinges on its outer edge and swings away, into the house */
      .fromTo(halves[0], { rotateY: 0 }, { rotateY: 100, duration: 0.28, ease: "power2.inOut" }, 0.5)
      .fromTo(halves[1], { rotateY: 0 }, { rotateY: -100, duration: 0.28, ease: "power2.inOut" }, 0.5)
      .fromTo($$(".half .shadow"), { opacity: 0 }, { opacity: 0.95, duration: 0.24, ease: "power1.in" }, 0.5)
      .set(halves, { autoAlpha: 0 }, 0.78)
      /* warm light spills through the gap, then the room comes up */
      .fromTo(light, { opacity: 0, scale: 0.15 }, { opacity: 1, scale: 1.1, duration: 0.2, ease: "power2.out" }, 0.5)
      .to(light, { opacity: 0, scale: 1.6, duration: 0.2 }, 0.75)
      .fromTo(dim, { opacity: 1 }, { opacity: 0.12, duration: 0.3, ease: "power1.inOut" }, 0.54)
      .fromTo(insideImg, { scale: insideStart }, { scale: 1, duration: 0.5, ease: "power2.out" }, 0.5)
      .fromTo($(".arrive"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" }, 0.84)
      .fromTo($$(".arrive .ln>span"), { yPercent: 110 }, { yPercent: 0, duration: 0.14, ease: "power3.out" }, 0.84);
  }

  /* arrival: a short camera shake/settle (time-based, so it feels physical) */
  const settle = () => {
    if (ctx.reduced) return;
    gsap.fromTo($(".rig"), { x: 0, y: 0 }, { keyframes: { x: [0, -4, 3, -1.5, 0.6, 0], y: [0, 3, -2, 1, -0.4, 0] }, duration: 0.9, ease: "power2.out" });
  };
  const cues = ctx.cues([
    [0.5, () => { AudioManager.play("door"); AudioManager.duck(2); }],
    [0.8, () => { AudioManager.play("room"); settle(); }],
  ]);

  /* clicking the ring scrolls to the moment the doors open */
  knock.addEventListener("click", () => {
    const st = Engine.triggers.door;
    if (st) Engine.scrollTo(st.start + (st.end - st.start) * 0.62, { duration: 2.6 });
  });

  return { tl, onUpdate: cues };
};
