/* HERO — slow push-in with a gentle drift, the name splits apart, the thesis line fades through */
SCENES.hero = (el, ctx) => {
  const $ = (s) => el.querySelector(s), $$ = (s) => [...el.querySelectorAll(s)];
  const cam = $(".cam"), img = $(".cam img"), bg = $(".bg");
  const lns = $$("h1 .ln>span"), chars = lns.map((l) => Reveal.splitChars(l));
  const ui = [$(".sub"), $(".topmeta"), $(".scrollcue")], words = $$(".thesis .w");
  const d = (s) => (ctx.reduced ? 0.01 : s * MOTION.speed);
  const tl = gsap.timeline({ defaults: { ease: "none" } });

  /* starting state for the intro (played after the preloader) */
  if (!ctx.reduced) {
    gsap.set(bg, { clipPath: "inset(18% 22% 18% 22%)" });
    gsap.set(img, { scale: 1.12 });
    gsap.set(chars.flat(), { yPercent: 115 });
    gsap.set($$(".sub .ln>span"), { yPercent: 110 });
  }
  gsap.set(ui.slice(1), { opacity: 0 });

  if (ctx.reduced) {
    tl.to([...ui, $("h1")], { opacity: 0, duration: 0.25 }, 0.05)
      .to($(".dark"), { opacity: 0.72, duration: 0.35 }, 0.25)
      .fromTo($(".thesis"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.38)
      .to(words, { opacity: 1, duration: 0.2 }, 0.4)
      .to($(".thesis"), { opacity: 0, duration: 0.12 }, 0.88);
  } else {
    /* camera: push-in + drift (kitchen-2 is 2000px wide: 1.45× stays under MOTION.maxUpscale) */
    tl.fromTo(cam, { scale: 1, xPercent: 0, yPercent: 0 }, { scale: 1.45, xPercent: -1.5, yPercent: -3, ease: "power2.inOut", duration: 0.75 }, 0);
    /* the name splits apart: FARID drifts left, SAAB right, letters spread from the gap */
    const spread = (arr, side) => tl.to(arr, { x: (i) => side * ctx.vw() * (0.35 + 0.05 * (side < 0 ? arr.length - i : i + 1)), ease: "power2.inOut", duration: 0.38 }, 0.03);
    spread(chars[0], -1); spread(chars[1] || [], 1);
    tl.to(lns, { opacity: 0, duration: 0.22 }, 0.16)
      .fromTo(ui, { opacity: 1, y: 0 }, { opacity: 0, y: -20, duration: 0.22, immediateRender: false }, 0.04)
      .to($(".dark"), { opacity: 0.72, duration: 0.4 }, 0.25)
      .fromTo($(".thesis"), { y: 40, opacity: 0 }, { y: -16, duration: 0.6 }, 0.4)
      .to($(".thesis"), { opacity: 1, duration: 0.04 }, 0.4)
      .to(words, { opacity: 1, duration: 0.06, stagger: 0.018 }, 0.42)
      .to($(".thesis"), { opacity: 0, duration: 0.1 }, 0.9);
  }

  /* gentle idle drift while the hero is on screen */
  const drift = ctx.reduced ? null : gsap.to(img, { xPercent: 1.2, yPercent: -0.8, duration: 9, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true });
  ScrollTrigger.create({ trigger: el, start: "top bottom", end: "bottom top", onToggle: (s) => drift && (s.isActive ? drift.play() : drift.pause()) });

  return {
    tl,
    intro() {
      const it = gsap.timeline();
      if (ctx.reduced) return it.to(ui.slice(1), { opacity: 1, duration: 0.4 });
      it.fromTo(bg, { clipPath: "inset(18% 22% 18% 22%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: d(1.9), ease: "expo.inOut" }, 0)
        .to(img, { scale: 1, duration: d(2.8), ease: "expo.out" }, 0.2)
        .to(chars.flat(), { yPercent: 0, duration: d(1.3), ease: "expo.out", stagger: d(0.035) }, d(0.7))
        .to($$(".sub .ln>span"), { yPercent: 0, duration: d(1.1), ease: "expo.out", stagger: d(0.08) }, d(0.9))
        .to(ui.slice(1), { opacity: 1, duration: d(1.2) }, d(1.3));
      return it;
    },
  };
};
