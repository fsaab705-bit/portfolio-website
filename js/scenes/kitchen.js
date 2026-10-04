/* KITCHEN — vertical scroll becomes a horizontal walk past the views.
   Inertia comes from the scrub; each image has its own parallax and "focuses" as it reaches centre.
   Desktop: the track can also be dragged. */
SCENES.kitchen = (el, ctx) => {
  const $ = (s) => el.querySelector(s);
  const track = $(".track"), items = [...el.querySelectorAll(".item")], imgs = items.map((it) => it.querySelector("img"));
  const count = $(".k-count"), bar = $(".pbar i"), n = items.length;
  let max = 0, centers = [];

  const size = () => {
    gsap.set(track, { x: 0 });
    centers = items.map((it) => it.offsetLeft + it.offsetWidth / 2);   // measured once per refresh, not per frame
    max = Math.max(0, centers[centers.length - 1] - ctx.vw() / 2);     // the walk ends with the last view centred
  };
  size(); ScrollTrigger.addEventListener("refreshInit", size);
  if (!ctx.reduced) gsap.set(imgs, { scale: 1.14 });
  const setX = imgs.map((im) => gsap.quickSetter(im, "xPercent"));

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  tl.fromTo(track, { x: 0 }, { x: () => -max, duration: 0.92, ease: "power1.inOut" }, 0.04);

  let cur = -1, lastSlide = 0;
  const update = (p) => {
    const x = gsap.getProperty(track, "x"), vw = ctx.vw();
    let best = 0, bestD = Infinity;
    items.forEach((it, i) => {
      const c = (centers[i] + x - vw / 2) / vw;                   // −1…1 distance from screen centre
      if (!ctx.reduced) setX[i](-c * 7);
      const focus = Math.abs(c) < 0.2;
      if (focus !== it._f) { it._f = focus; it.classList.toggle("focus", focus); if (focus) it.classList.add("seen"); }
      if (Math.abs(c) < bestD) { bestD = Math.abs(c); best = i; }
    });
    if (best !== cur) { Reveal.roll(count, `${pad2(best + 1)} / ${pad2(n)}`, best > cur ? 1 : -1); cur = best; }
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    /* faint slide whoosh, scaled with scroll velocity (throttled inside AudioManager) */
    const v = Math.abs(Engine.velocity());
    if (v > 600 && performance.now() - lastSlide > 200) { lastSlide = performance.now(); AudioManager.play("slide", { v: Math.min(1, v / 4000) }); }
  };

  /* drag-to-scroll (mouse only): maps horizontal drag to the pinned scroll distance */
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let down = null;
    track.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const st = Engine.triggers.kitchen; if (!st) return;
      down = { x: e.clientX, y: scrollY, ratio: (st.end - st.start) / Math.max(1, max) * 0.92 };
      track.setPointerCapture(e.pointerId); track.classList.add("dragging");
    });
    track.addEventListener("pointermove", (e) => {
      if (!down) return;
      const st = Engine.triggers.kitchen;
      const y = gsap.utils.clamp(st.start, st.end, down.y - (e.clientX - down.x) * down.ratio);
      Engine.lenis ? Engine.lenis.scrollTo(y, { lerp: 0.12 }) : window.scrollTo(0, y);
    });
    const up = () => { down = null; track.classList.remove("dragging"); };
    track.addEventListener("pointerup", up); track.addEventListener("pointercancel", up);
    track.addEventListener("dragstart", (e) => e.preventDefault());
  }

  return { tl, onUpdate: update };
};
