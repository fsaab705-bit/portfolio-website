/* BEDROOM — the camera orbits the room through its five real views.
   Each change is a crossfade plus a lateral pan toward the next bearing; the dial rotates with it.
   Ends with "lights off": a soft vignette closes, then black.
   Timeline marks (0–1): orbit .02–.88 · title out .30–.45 · vignette .86–.95 · lights .92–1 */
SCENES.bedroom = (el, ctx) => {
  const data = SITE.bedroom.views, $ = (s) => el.querySelector(s);
  const views = [...el.querySelectorAll(".view")], imgs = views.map((v) => v.querySelector("img")), n = views.length;
  const camG = $(".cam-g"), poem = [...el.querySelectorAll(".poem span")];
  const A = 0.02, B = 0.88, span = (B - A) / (n - 1);
  const PAN = 4.5;     // % lateral travel per transition (images are overscanned by scale 1.1)

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  views.forEach((v, i) => gsap.set(v, { zIndex: i, opacity: i ? 0 : 1 }));
  if (!ctx.reduced) gsap.set(imgs, { scale: 1.1 });
  gsap.set(camG, { rotation: data[0].bearing, svgOrigin: "0 0" });

  for (let i = 0; i < n - 1; i++) {
    const s = A + i * span, dir = Math.sign(data[i + 1].bearing - data[i].bearing) || 1;
    tl.fromTo(views[i + 1], { opacity: 0 }, { opacity: 1, duration: span * 0.5, ease: "power1.inOut" }, s + span * 0.45);
    if (!ctx.reduced) {
      /* pan: outgoing slides away against the turn, incoming arrives from the side we turn toward */
      tl.fromTo(imgs[i], { xPercent: 0 }, { xPercent: -dir * PAN, duration: span, ease: "power1.inOut", immediateRender: false }, s)
        .fromTo(imgs[i + 1], { xPercent: dir * PAN }, { xPercent: 0, duration: span, ease: "power2.out" }, s + span * 0.2);
    }
    tl.to(camG, { rotation: data[i + 1].bearing, svgOrigin: "0 0", duration: span * 0.7, ease: "power2.inOut" }, s + span * 0.3);
  }
  tl.fromTo($(".btitle"), { opacity: 1 }, { opacity: 0, duration: 0.15 }, 0.3)
    .fromTo($(".vignette"), { opacity: 0 }, { opacity: 1, duration: 0.09, ease: "power1.in" }, 0.86)
    .fromTo($(".lights"), { opacity: 0 }, { opacity: 1, duration: 0.08, ease: "power2.in" }, 0.92);

  let near = 0;
  const cues = ctx.cues([
    [0.91, () => { AudioManager.play("thump"); AudioManager.dark(true); }, () => AudioManager.dark(false)],
  ]);
  return {
    tl,
    onUpdate(p) {
      const L = gsap.utils.clamp(0, n - 1, (p - A) / span);
      const k = Math.round(L);
      if (k !== near) {
        const dir = k > near ? 1 : -1; near = k;
        Reveal.roll($(".b-count"), `View ${pad2(k + 1)} / ${pad2(n)}`, dir);
        Reveal.roll($(".b-name"), data[k].name, dir);
      }
      poem.forEach((s, i) => s.classList.toggle("on", L >= i * 1.4 - 0.2));
      cues(p);
    },
  };
};
