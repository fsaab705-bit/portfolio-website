/* =========================================================
   A. CONTENT — copy and images (source: CV + project boards)
   Edit text and images here. Nothing in this file animates.
   ========================================================= */
const IMG = (n) => `img/${n}.jpg`;

/* Native pixel size of every image: used for width/height attributes (no layout shift)
   and to cap camera zooms so nothing is upscaled beyond MOTION.maxUpscale. */
const DIMS = {
  "bedroom-1": [1243, 876], "bedroom-2": [1243, 876], "bedroom-3": [1243, 876], "bedroom-4": [1243, 876], "bedroom-5": [1243, 876],
  "exterior": [2000, 1409], "garden-hero": [1279, 717], "garden-materials": [1604, 858],
  "garden-persp-1": [705, 777], "garden-persp-2": [1185, 769], "garden-plan": [2000, 1410],
  "garden-section-a": [2000, 820], "garden-section-b": [1617, 454], "garden-section-c": [2000, 883],
  "garden-site-analysis": [1242, 704], "garden-siteplan": [1600, 1131],
  "kitchen-1": [2000, 1409], "kitchen-2": [2000, 1409], "kitchen-3": [2000, 1409], "kitchen-4": [2000, 1409],
};
const dimsOf = (src) => DIMS[(src.match(/img\/(.+)\.jpg$/) || [])[1]] || [1600, 1000];

const SITE = {
  person: {
    name: "Farid Saab",
    role: "Interior Design Student | Junior Interior Designer",
    tagline: ["Interior Design", "& Visualization"],
    location: "Lebanon",
    email: "fsaab705@gmail.com",
    phone: "+961 3 075 695",
  },
  nav: [["Work", "#work"], ["About", "#about"], ["Contact", "#contact"]],
  hero: { img: IMG("kitchen-2"), alt: "Kitchen visualization with marble island and pendant lights",
          thesis: "A walk from the garden, through the front door, into the rooms." },

  /* Order follows the walk-through */
  works: [
    { n: "01", title: "Private Garden", kind: "Landscape Design",            img: IMG("garden-hero"), href: "#garden" },
    { n: "02", title: "Exterior",       kind: "Architectural Visualization", img: IMG("exterior"),    href: "#door" },
    { n: "03", title: "Kitchen",        kind: "Interior Visualization",      img: IMG("kitchen-3"),   href: "#kitchen" },
    { n: "04", title: "Master Bedroom", kind: "Interior Visualization",      img: IMG("bedroom-1"),   href: "#bedroom" },
  ],

  garden: {
    title: ["Private", "Garden"],
    meta: "Landscape Design · 400 m²",
    plan: IMG("garden-plan"), sitePlan: IMG("garden-siteplan"), hero: IMG("garden-hero"),
    pergola: [0.55, 0.15],                       // pergola position on the plan (fraction of width/height)
    steps: ["The plan, drawn", "Rendered", "Into the pergola", "Standing in it"],
    lead: "A warm, Mediterranean-inspired backyard built around natural materials, soft curves and relaxed outdoor living for a family.",
    concept: [
      "The 400 m² garden is organised around a welcoming pergola, a sitting zone with fabric shading, a limestone barbecue area and a generous lawn for gatherings and everyday use.",
      "Limestone, terracotta, white gravel and rustic wood meet along curved pathways. Lavender, rosemary and shrubs bring fragrance, colour and texture. The aim is a balance of structure and softness: a timeless outdoor retreat centred on comfort and family life.",
    ],
    facts: [["Area", "400 m²"], ["Type", "Private backyard"], ["Client", "Family"], ["Character", "Mediterranean"]],
    palette: [
      ["Beige", "#D9CBB0", "#171816"], ["Olive green", "#6B705C", "#F2EFE8"], ["Terracotta", "#A65F3E", "#F2EFE8"],
      ["Soft white", "#F4F1EA", "#171816"], ["Bougainvillea", "#B9497A", "#F2EFE8"],
    ],
    siteAnalysis: IMG("garden-site-analysis"),
    planKey: [
      ["Pergola", "Open view"], ["Barbecue & countertop", "Terracotta"], ["Dining table", ""], ["Parquet deck", ""],
      ["Lawn", ""], ["Limestone paving", "Entry"], ["Olive · Tipu · Liquidambar", "Trees"], ["Cypress · Pine", "Closed view"],
      ["Pink Duranta · Shrubs", "Planting"],
    ],
    materialsImg: IMG("garden-materials"),
    materials: ["Limestone", "Terracotta", "Travertine tiles", "Rustic wood", "Parquet wood", "White gravel"],
    planting: ["Lavender", "Rosemary", "Olive", "Pink Duranta", "Shrubs"],
    sections: [
      { img: IMG("garden-section-a"), label: "Section A–A", scale: "1:150" },
      { img: IMG("garden-section-b"), label: "Section B–B", scale: "1:100" },
      { img: IMG("garden-section-c"), label: "Section C–C", scale: "1:150" },
    ],
    persp: [IMG("garden-persp-1"), IMG("garden-persp-2")],
  },

  exterior: {
    title: ["Exterior", "Visualization"], img: IMG("exterior"), ratio: 2000 / 1409,
    door: [0.476, 0.72],                          // front door position in the render (fraction)
    caption: "Villa exterior · Elevation", tools: "3ds Max · V-Ray",
    inside: IMG("kitchen-1"),
  },

  kitchen: {
    title: "Kitchen", kind: "Interior Visualization",
    note: "Modelled in 3ds Max from AutoCAD plans and reference images, with materials, lighting and camera matching rendered in V-Ray.",
    items: [
      { src: IMG("kitchen-1"), size: "w", cap: "Long view", capR: "Kitchen & dining" },
      { src: IMG("kitchen-3"), size: "t d", dx: "-34%", dy: "-38%", cap: "Detail", capR: "Marble island" },
      { src: IMG("kitchen-4"), size: "w", cap: "Island", capR: "Arched openings" },
      { src: IMG("kitchen-4"), size: "s d", dx: "-2%", dy: "-14%", cap: "Detail", capR: "Arch" },
      { src: IMG("kitchen-2"), size: "w", cap: "Axis", capR: "Pendant & island" },
    ],
  },

  bedroom: {
    title: ["Master", "Bedroom"], kind: "Interior Visualization",
    poem: ["Warm materials.", "Layered lighting.", "Quiet geometry."],
    /* camera walk order + rough bearing (deg) used only to drive the dial and pan direction */
    views: [
      { src: IMG("bedroom-2"), bearing: 0,   name: "Bed wall" },
      { src: IMG("bedroom-1"), bearing: 55,  name: "Seating corner" },
      { src: IMG("bedroom-5"), bearing: 130, name: "From above" },
      { src: IMG("bedroom-3"), bearing: 220, name: "Toward the window" },
      { src: IMG("bedroom-4"), bearing: 300, name: "Vanity" },
    ],
  },

  about: {
    summary: "Interior Design student at Lebanese International University with a strong foundation in space planning, technical drawing, 3D visualization and design development, built through academic projects in residential and landscape design.",
    practice: "Since 2020 he has also worked on site, supporting lighting installation, electrical and plumbing work, painting, gypsum board and plastic panel installation. That hands-on experience informs how his drawings get built.",
    caps: {
      "Design": ["Interior Design", "Space Planning", "Residential Design", "Landscape Design", "Materials & Furniture Selection", "Lighting & Layout Planning"],
      "Technical": ["Technical Drawing", "2D Drafting", "3D Modeling", "Visualization / Rendering", "Construction Drawings", "Design Development"],
      "Software": ["AutoCAD", "3ds Max", "V-Ray", "PowerPoint", "Word", "Google Drive"],
    },
    cv: [
      ["Education", "Lebanese International University, Beqaa", "Diploma in Interior Design · 2023 – 2027 (expected)"],
      ["Experience", "Yanta Electrical, Plumbing, Painting, Gypsum & Plastic Panels", "Electrical, plumbing & interior finishing · 2020 – present"],
      ["Languages", "Arabic · English", "Fluent in both"],
    ],
  },
  contact: { title: ["Let’s create", "something", "timeless."], role: "Interior Designer & 3D Visualizer" },
};

/* Scroll length of each scene in viewport heights — raise to slow a scene down.
   (A scene stays pinned for SCENE_LENGTH − 100 vh of scrolling.) */
const SCENE_LENGTH = { hero: 190, garden: 420, door: 480, kitchen: 380, bedroom: 520 };

/* Walk-through order: garden → façade/door → kitchen → bedroom */
const ORDER = ["nav", "hero", "works", "garden", "exterior", "kitchen", "bedroom", "about", "contact"];

/* Motion tweakables (CSS --speed in :root scales the CSS-side transitions) */
const MOTION = {
  speed: 1,          // multiplies every reveal / intro duration (1 = default, 1.3 = slower, 0.8 = snappier)
  scrub: 1,          // seconds a scene lags behind the scrollbar (inertia). 0 = locked to scroll
  lenisLerp: 0.085,  // smooth-scroll weight (lower = floatier)
  maxUpscale: 1.6,   // camera zooms never enlarge an image beyond this × its native resolution
  skewMax: 3,        // Selected Works velocity skew, degrees
};
