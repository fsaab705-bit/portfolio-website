/* GARDEN — the plan draws with a line sweep → colour floods out from the pergola →
   the camera dives to the pergola → we land standing in the 3D view.
   Timeline marks (0–1): draw .00–.22 · flood .22–.38 · dive .38–.62 · land .56–.80 · caption .80–.92 */
SCENES.garden = (el, ctx) => {
  const g = SITE.garden, $ = (s) => el.querySelector(s);
  const plate = $(".plate"), ren = $(".ren"), land = $(".land"), landImg = $(".land img");
  const steps = [...el.querySelectorAll(".steps li")], cap = $(".steps-cap"), bar = $(".pbar i");
  const ratio = 1600 / 1131;
  let W = 0, H = 0;

  /* contain-fit the plan; called on every ScrollTrigger refresh */
  const size = () => {
    const vw = ctx.vw(), vh = ctx.vh() * (vw < 1024 ? 0.8 : 1), fill = vw < 1024 ? 0.94 : 0.74;
    W = Math.min(vw * fill, vh * fill * ratio); H = W / ratio;
    Object.assign(plate.style, { width: W + "px", height: H + "px", marginLeft: -W / 2 + "px", marginTop: -H / 2 + "px" });
    gsap.set(plate, { transformOrigin: `${g.pergola[0] * 100}% ${g.pergola[1] * 100}%` });
  };
  size(); ScrollTrigger.addEventListener("refreshInit", size);
  const lift = () => (ctx.vw() < 1024 ? -ctx.vh() * 0.05 : 0);
  const shift = () => (ctx.vw() >= 1024 ? Math.min(150, ctx.vw() * 0.08) : 0);   // clear the steps list on desktop
  /* deepest zoom that keeps the site plan (1600px) under MOTION.maxUpscale */
  const zoom = () => Math.max(1.2, Math.min(4.2, (MOTION.maxUpscale * 1600) / W));
  const flood = (r) => `circle(${r}% at ${g.pergola[0] * 100}% ${g.pergola[1] * 100}%)`;
  /* landing view is 1279px wide: start scale capped the same way */
  const landStart = () => Math.max(1, Math.min(1.35, (MOTION.maxUpscale * 1279) / Math.max(ctx.vw(), ctx.vh() * (1279 / 717))));

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  if (ctx.reduced) {
    tl.fromTo(ren, { opacity: 0 }, { opacity: 1, duration: 0.16 }, 0.22)
      .fromTo(land, { opacity: 0 }, { opacity: 1, duration: 0.16 }, 0.56)
      .fromTo($(".big-cap"), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.8);
  } else {
    tl.fromTo($(".hline"), { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.06, ease: "power2.inOut" }, 0)
      .to($(".hline"), { opacity: 0, duration: 0.05 }, 0.08)
      .fromTo($(".drw"), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.18, ease: "power1.inOut" }, 0.04)
      .fromTo($(".sweep"), { x: 0, opacity: 1 }, { x: () => W, duration: 0.18, ease: "power1.inOut" }, 0.04)
      .to($(".sweep"), { opacity: 0, duration: 0.02 }, 0.21)
      .fromTo(ren, { clipPath: flood(0) }, { clipPath: flood(150), duration: 0.16, ease: "power2.in" }, 0.22)
      .fromTo(plate, { x: shift, y: lift, scale: 1 },
        { x: () => -(g.pergola[0] - 0.5) * W, y: () => -(g.pergola[1] - 0.5) * H + lift(), scale: zoom, duration: 0.24, ease: "power2.in" }, 0.38)
      .fromTo(land, { opacity: 0, clipPath: "circle(0% at 50% 50%)" }, { opacity: 1, clipPath: "circle(75% at 50% 50%)", duration: 0.2, ease: "power2.out" }, 0.56)
      .fromTo(landImg, { scale: landStart }, { scale: 1, duration: 0.44, ease: "power2.out" }, 0.56)
      .fromTo($(".big-cap"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.12, ease: "power2.out" }, 0.8);
  }

  /* steps list stays synced to the timeline playhead */
  const cues = ctx.cues([
    [0.22, () => AudioManager.play("shimmer")],
    [0.4, () => AudioManager.duck(1.2)],
  ]);
  let ix = -1;
  return {
    tl,
    onUpdate(p) {
      const i = p < 0.22 ? 0 : p < 0.38 ? 1 : p < 0.62 ? 2 : 3;
      if (i !== ix) { ix = i; steps.forEach((li, k) => li.classList.toggle("on", k === i)); }
      cap.classList.toggle("over", p > 0.64);
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
      cues(p);
    },
  };
};
