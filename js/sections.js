/* =========================================================
   B. COMPONENTS — small HTML builders
   ========================================================= */
const lines = (arr) => arr.map((t) => `<span class="ln"><span>${t}</span></span>`).join("");
const pad2 = (n) => String(n).padStart(2, "0");

/* reveal: "img" (clip wipe + scale settle) | "wipe" (drawing sweep) | "" (none)
   dir:    which edge the clip opens from — up | down | left | right | iris  */
function fig({ src, alt = "", cap = "", capR = "", cls = "", reveal = "img", dir = "up", parallax = 0, lazy = true } = {}) {
  const [w, h] = src ? dimsOf(src) : [0, 0];
  const media = src ? `<img src="${src}" alt="${alt}" width="${w}" height="${h}" ${lazy ? 'loading="lazy"' : ""} decoding="async">`
                    : `<div class="placeholder">Image not available<br>in source files</div>`;
  const cc = cap || capR ? `<figcaption><span>${cap}</span><span>${capR}</span></figcaption>` : "";
  return `<figure class="fig ${cls} ${reveal ? "rv-" + reveal : ""}" data-dir="${dir}"${parallax ? ` data-parallax="${parallax}"` : ""}><div class="frame">${media}</div>${cc}</figure>`;
}
/* scene image: eager (preloaded by the loader), with intrinsic size */
const simg = (src, alt = "", extra = "") => { const [w, h] = dimsOf(src); return `<img src="${src}" alt="${alt}" width="${w}" height="${h}" decoding="async" draggable="false" ${extra}>`; };

function sectionHead({ title, label, meta = [] }) {
  return `<div class="shead"><div><p class="label">${label}</p><h2 class="display rv-text">${lines(title)}</h2></div>
    <div class="meta">${meta.map((m) => `<span class="label">${m}</span>`).join("")}</div></div>`;
}
const indexList = (items) => `<ul class="index rv-rules">${items.map((it, i) => {
  const [a, b = ""] = Array.isArray(it) ? it : [it];
  return `<li><span class="n num">${pad2(i + 1)}</span><span>${a}</span><span class="v">${b}</span></li>`;
}).join("")}</ul>`;
/* scene shell: a full-screen section that the engine pins while its timeline scrubs */
const scene = (id, key, tone, inner, sheet) =>
  `<section id="${id}" class="scene" data-scene="${key}" data-tone="${tone}" ${sheet ? `data-sheet="${sheet}"` : ""}><div class="stage">${inner}</div></section>`;
/* a label that can roll vertically to new text (see Reveal.roll) */
const roll = (cls, text) => `<span class="roll ${cls}"><span>${text}</span></span>`;

/* =========================================================
   C. SECTIONS — one render function per section
   ========================================================= */
const SECTIONS = {
  nav: ({ nav, person }) => `
    <nav id="nav" aria-label="Main"><a class="mark" href="#hero" data-magnetic aria-label="${person.name}, back to top">F—S</a>
      <div class="nav-r">
        <ul>${nav.map(([t, h]) => `<li><a href="${h}" data-magnetic>${t}</a></li>`).join("")}</ul>
        <button type="button" class="snd" id="sound-toggle" aria-pressed="false" data-magnetic>
          <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          <span class="snd-l">Sound <span class="snd-s">off</span></span>
        </button>
      </div></nav>
    <div id="sheet" aria-hidden="true">${roll("s-n num", "Sheet 00")}<i></i>${roll("s-t", "Cover")}</div>`,

  hero: ({ person, hero }) => scene("hero", "hero", "deep", `
      <div class="bg"><div class="cam">${simg(hero.img, hero.alt, 'fetchpriority="high"')}</div></div>
      <div class="shade"></div>
      <div class="topmeta"><span class="label">Portfolio — Selected work</span><span class="label">${person.location}</span></div>
      <div class="content">
        <div><p class="sub rv-text">${lines(person.tagline)}</p>
          <h1 class="display" aria-label="${person.name}">${lines(person.name.split(" "))}</h1></div>
        <div class="scrollcue" aria-hidden="true"><span class="label">Scroll</span><i></i></div>
      </div>
      <div class="dark"></div>
      <div class="s-cap thesis"><div><span class="label">The walk-through</span><p>${hero.thesis.split(" ").map((w) => `<span class="w">${w}</span>`).join(" ")}</p></div></div>`, "Cover"),

  works: ({ works }) => `
    <section id="work" data-tone="ivory" data-sheet="Index" class="wrap pad">
      ${sectionHead({ title: ["Selected", "<em>Works</em>"], label: "Index", meta: [`${works.length} projects`, "Garden → façade → interiors"] })}
      ${works.map((w, i) => `
        <a class="work ${i % 2 ? "flip" : ""}" href="${w.href}" data-cursor="View">
          ${fig({ src: w.img, alt: w.title, dir: i % 2 ? "right" : "left" })}
          <div class="txt"><span class="n num" data-count="${+w.n}">${w.n}</span><h3>${w.title}</h3>
            <span class="label">${w.kind}</span><span class="go">View project <i></i></span></div>
        </a>`).join("")}
    </section>`,

  garden: ({ garden: g }) => `
    <section id="garden" data-tone="ivory" data-sheet="Private Garden" class="wrap" style="padding-top:var(--section-y)">
      <div class="shead"><div><p class="label">01 — Case study</p><h2 class="display g-title rv-text">${lines(g.title)}</h2></div>
        <div class="meta"><span class="label">${g.meta}</span></div></div>
    </section>
    ${scene("gscene", "garden", "ivory", `
      <div class="plate">
        <div class="drw">${simg(g.plan, "Garden plan drawing")}</div>
        <div class="ren">${simg(g.sitePlan, "Rendered site plan")}</div>
        <i class="hline" aria-hidden="true"></i><i class="sweep" aria-hidden="true"></i>
      </div>
      <div class="layer land">${simg(g.hero, "Private Garden: pergola and sitting zone")}</div>
      <div class="s-cap steps-cap"><ul class="steps">${g.steps.map((s, i) => `<li><span class="label num">${pad2(i + 1)}</span><span>${s}</span></li>`).join("")}</ul><div class="pbar"><i></i></div></div>
      <div class="s-cap big-cap"><h3 class="display">Standing in it.</h3><span class="label">Pergola · sitting zone · fabric shading</span></div>`, "Private Garden")}
    <section data-tone="ivory" class="wrap pad">
      <div class="g-concept">
        <p class="lead">${g.lead}</p>
        <div class="col"><p class="label">Concept</p>${g.concept.map((p) => `<p class="body" style="margin:0">${p}</p>`).join("")}</div>
      </div>
      <div class="g-facts rv-rules">${g.facts.map(([k, v]) => `<div><span class="label">${k}</span><strong>${v}</strong></div>`).join("")}</div>
      <div style="margin-top:clamp(48px,7vw,110px)"><p class="label" style="margin-bottom:1rem">Colour mood</p>
        <div class="swatches rv-swatch">${g.palette.map(([n, c, t]) => `<div class="sw" style="background:${c};color:${t}">${n}</div>`).join("")}</div></div>
    </section>
    <section data-tone="stone" class="wrap pad">
      ${sectionHead({ title: ["Site"], label: "Site analysis & site plan", meta: ["Sun path · winter wind · access"] })}
      <div class="g-site">
        <div class="a">${fig({ src: g.siteAnalysis, alt: "Site analysis diagram", cap: "<b>Site analysis</b>", capR: "Sun path", dir: "down" })}
          <p class="body" style="margin:0">The plot is read through sunrise and sunset, the north-west winter wind and its access from the main road. Open views stay to the garden side; the boundary closes with evergreen planting.</p></div>
        <div class="b">${fig({ src: g.sitePlan, alt: "Rendered site plan", cap: "<b>Site plan</b> — rendered", capR: "1:200", dir: "iris" })}</div>
      </div>
    </section>
    <section data-tone="ivory" class="wrap pad">
      ${sectionHead({ title: ["Plan &amp;", "zoning"], label: "Plan", meta: ["Scale 1:100"] })}
      <div class="g-plan">${fig({ src: g.plan, alt: "Garden plan with zoning and planting", cls: "multiply", cap: "<b>Plan</b> — open & closed views", capR: "Main road ↓", reveal: "wipe" })}
        <aside><p class="label" style="margin-bottom:1rem">Plan key</p>${indexList(g.planKey)}</aside></div>
    </section>
    <section data-tone="stone" class="wrap pad">
      ${sectionHead({ title: ["Material", "<em>language</em>"], label: "Materials", meta: ["Mood board"] })}
      <div class="g-mat">${fig({ src: g.materialsImg, alt: "Material mood board", cap: "<b>Mood board</b>", capR: "Natural, warm, textured", dir: "right" })}
        <aside><div><p class="label" style="margin-bottom:1rem">Hardscape</p>${indexList(g.materials)}</div>
          <div><p class="label" style="margin-bottom:1rem">Planting</p>${indexList(g.planting)}</div></aside></div>
    </section>
    <section data-tone="ivory" class="wrap pad">
      ${sectionHead({ title: ["Sections"], label: "Architectural sections", meta: ["A–A · B–B · C–C"] })}
      <div class="g-sections">${g.sections.map((s) => fig({ src: s.img, alt: s.label, cls: "contain multiply", cap: `<b>${s.label}</b>`, capR: `Scale ${s.scale}`, reveal: "wipe" })).join("")}</div>
    </section>
    <section data-tone="ivory" class="wrap" style="padding-bottom:var(--section-y)">
      ${sectionHead({ title: ["Perspectives"], label: "Views", meta: ["3D visualization"] })}
      <div class="g-persp">
        ${fig({ src: g.persp[0], alt: "Pergola and barbecue perspective", cls: "p1", cap: "<b>Pergola</b>", capR: "Barbecue & lounge", parallax: 0.06, dir: "up" })}
        ${fig({ src: g.persp[1], alt: "Boundary planting perspective", cls: "p2 multiply", cap: "<b>Boundary planting</b>", capR: "Olive · cypress · liquidambar", parallax: 0.1, dir: "left" })}
      </div>
    </section>`,

  exterior: ({ exterior: x }) => scene("door", "door", "deep", `
      <div class="rig">
        <div class="layer inside">${simg(x.inside, "Kitchen interior seen through the front door")}<div class="dim"></div></div>
        <div class="light" aria-hidden="true"></div>
        <div class="half l"><div class="plate">${simg(x.img, "Villa exterior elevation")}</div><div class="shadow"></div></div>
        <div class="half r"><div class="plate">${simg(x.img, "")}</div><div class="shadow"></div></div>
      </div>
      <button type="button" class="s-cap knock" data-cursor="Enter" aria-label="Open the front door">Enter</button>
      <div class="s-cap title"><p class="label" style="color:var(--ivory);margin-bottom:1rem">02 — Architectural visualization</p><h2 class="display">${lines(x.title)}</h2></div>
      <div class="s-cap meta"><span class="label">${x.caption}</span><span class="label">${x.tools}</span></div>
      <div class="s-cap through"><h3 class="display">${lines(["Through the", "<em>front door</em>"])}</h3></div>
      <div class="s-cap arrive"><h3 class="display">${lines(["Kitchen"])}</h3><span class="label">03 — Interior visualization</span></div>`, "Exterior"),

  kitchen: ({ kitchen: k }) => `<span id="kitchen" class="anchor"></span>` + scene("kscene", "kitchen", "ivory", `
      <div class="khead"><div><p class="label">03 — ${k.kind}</p><h2 class="display rv-text">${lines([k.title])}</h2></div><span class="label">Marble · oak · warm light</span></div>
      <div class="track" data-cursor="Drag">
        <div class="card"><p class="label">Scroll or drag →</p><p class="lead">${k.note}</p></div>
        ${k.items.map((it, i) => `<figure class="item ${it.size}" style="${it.dx ? `--dx:${it.dx};--dy:${it.dy}` : ""}"><div class="frame">${simg(it.src, `${it.cap}: ${it.capR}`)}</div>
          <figcaption><span><b>${pad2(i + 1)}</b> ${it.cap}</span><span>${it.capR}</span></figcaption></figure>`).join("")}
      </div>
      <div class="kfoot">${roll("label num k-count", `01 / ${pad2(k.items.length)}`)}<div class="pbar"><i></i></div><span class="label">Kitchen</span></div>`, "Kitchen"),

  bedroom: ({ bedroom: b }) => `<span id="bedroom" class="anchor"></span>` + scene("bscene", "bedroom", "deep", `
      ${b.views.map((v, i) => `<div class="layer view" style="opacity:${i ? 0 : 1}">${simg(v.src, `Master bedroom: ${v.name}`)}</div>`).join("")}
      <div class="s-cap btitle"><p class="label" style="margin-bottom:1rem">04 — ${b.kind}</p><h2 class="display">${lines(b.title)}</h2></div>
      <p class="s-cap poem">${b.poem.map((l) => `<span>${l}</span>`).join("")}</p>
      <div class="s-cap dial" aria-hidden="true">
        <svg viewBox="-60 -60 120 120">
          <circle r="48" fill="none" stroke="currentColor" stroke-opacity=".3"></circle>
          <rect x="-20" y="-14" width="40" height="28" fill="none" stroke="currentColor" stroke-opacity=".6"></rect>
          <rect x="-12" y="-6" width="24" height="16" fill="currentColor" fill-opacity=".15"></rect>
          ${b.views.map((v) => { const a = (v.bearing - 90) * Math.PI / 180; return `<circle cx="${(48 * Math.cos(a)).toFixed(1)}" cy="${(48 * Math.sin(a)).toFixed(1)}" r="1.6" fill="currentColor" fill-opacity=".6"></circle>`; }).join("")}
          <g class="cam-g"><path d="M0 -48 L-9 -26 L9 -26 Z" fill="var(--sand)" fill-opacity=".35"></path><circle cy="-48" r="4" fill="var(--sand)"></circle></g>
        </svg>
        ${roll("label num b-count", `View 01 / ${pad2(b.views.length)}`)}
        ${roll("label b-name", b.views[0].name)}
      </div>
      <div class="s-cap vignette"></div>
      <div class="s-cap lights"></div>`, "Master Bedroom"),

  about: ({ person: p, about: a }) => `
    <section id="about" data-tone="stone" data-sheet="About" class="wrap pad">
      <p class="label" style="margin-bottom:1rem">About</p>
      <div class="a-top"><h2 class="display rv-text">${lines(p.name.split(" "))}</h2>
        <div class="intro"><p class="label" style="color:var(--fg)">${p.role}</p><p class="lead" style="max-width:none;margin:0">${a.summary}</p><p class="body" style="margin:0">${a.practice}</p></div></div>
      <div class="caps">${Object.entries(a.caps).map(([h, list]) => `<div><h4 class="label">${h}</h4><ul class="index rv-rules">${list.map((s) => `<li><span>${s}</span></li>`).join("")}</ul></div>`).join("")}</div>
      <div class="cv rv-rules">${a.cv.map(([h, t, s]) => `<div><span class="label">${h}</span><strong>${t}</strong><span class="body">${s}</span></div>`).join("")}</div>
    </section>`,

  contact: ({ person: p, contact: c }) => {
    const copyBtn = (v) => `<button type="button" class="copy" data-copy="${v}" data-magnetic><span class="cp-a">Copy</span><span class="cp-b" aria-hidden="true"><svg viewBox="0 0 12 10" width="10" height="9"><path d="M1 5.2 4.3 8.4 11 1.4" fill="none" stroke="currentColor" stroke-width="1.4"></path></svg>Copied</span></button>`;
    return `
    <section id="contact" data-tone="deep" data-sheet="Contact" class="wrap">
      <div><h2 class="display c-title" aria-label="${c.title.join(" ")}">${c.title.map((l) => `<span class="cl">${l.split(" ").map((w) => `<span class="wm"><span class="wd">${w}</span></span>`).join(" ")}</span>`).join("")}</h2>
        <div class="c-grid"><div class="who"><strong>${p.name}</strong><span class="label">${c.role}</span></div>
          <div class="lines rv-rules">
            <div class="c-line"><span class="label">Email</span><a href="mailto:${p.email}">${p.email}</a>${copyBtn(p.email)}</div>
            <div class="c-line"><span class="label">Phone</span><span class="v">${p.phone}</span>${copyBtn(p.phone)}</div>
            <div class="c-line"><span class="label">Based</span><span class="v">${p.location}</span><span></span></div>
          </div></div></div>
      <footer class="foot"><span class="label">© ${p.name}</span><a class="label" href="#hero" data-magnetic>Back to top ↑</a></footer>
    </section>`;
  },
};
