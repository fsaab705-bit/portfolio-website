/* =========================================================
   D. BOOT — render → engine → polish → preloader → intro
   ========================================================= */
(() => {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const app = document.getElementById("app");
  app.innerHTML = ORDER.map((k) => SECTIONS[k](SITE)).join("");

  /* No GSAP (CDN blocked/offline)? Leave a static, fully readable page. */
  if (!window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add("static");
    return;
  }
  document.documentElement.classList.add("js");
  scrollTo(0, 0);

  Engine.init();
  Reveal.init();
  Cursor.init();
  Grain.init();
  SoundToggle.init();

  /* everything a pinned scene shows, so nothing pops in mid-scroll */
  const S = SITE;
  const urls = [...new Set([S.hero.img, S.garden.plan, S.garden.sitePlan, S.garden.hero, S.exterior.img, S.exterior.inside,
    ...S.kitchen.items.map((i) => i.src), ...S.bedroom.views.map((v) => v.src)])];

  Preloader.run(urls).then(() => {
    if (!location.hash) scrollTo(0, 0);      // the browser may restore an old position while loading
    Engine.start();
    const target = /^#[\w-]+$/.test(location.hash) ? document.querySelector(location.hash) : null;
    if (Engine.lenis) Engine.lenis.scrollTo(target || 0, { immediate: true, force: true });
    const hero = Engine.triggers.hero && Engine.triggers.hero.scene;
    if (hero && hero.intro) hero.intro();
  });
})();
