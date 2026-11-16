/* ------------------------------------------------------------------
   CONTENT — edit these lists to update the site. No build step needed.
   Every project comes from a public post on @inframe.rd / @juansorianoph.
   `id` is the Instagram shortcode; the cover lives in assets/work/<id>.<ext>.
------------------------------------------------------------------- */
const PROJECTS = [
  { id: "DZqhDx_pwn-", ext: "jpg", type: "video", big: true, title: "Wendy’s — Lanzamiento Tenders", meta: "Cobertura de evento · con Hoenn", year: 2026 },
  { id: "DPrdmBtgVTj", ext: "webp", type: "foto", title: "Pizza Hut", meta: "Sesión de fotos · con Hoenn", year: 2025 },
  { id: "DN6wpaIkVMU", ext: "jpg", type: "video", title: "By Oriana Lucas", meta: "Fashion film · Colección nupcial", year: 2025 },
  { id: "DM-ivGzpY6K", ext: "jpg", type: "video", title: "Häagen-Dazs", meta: "Cobertura Día de los Padres · con Hoenn", year: 2025 },
  { id: "DNTwqHEvI5Z", ext: "jpg", type: "video", title: "Banco LAFISE × Viamar", meta: "Feria de Vehículos · con Hoenn", year: 2025 },
  { id: "C8iAuPMP0PC", ext: "jpg", type: "video", big: true, title: "Bodas A La Moda — Portada no. 13", meta: "Video y fotos · Oriana Lucas · Cayo Levantado", year: 2024 },
  { id: "DY-rGuBJqco", ext: "jpg", type: "video", title: "Manzanas Washington × Julio Rodríguez", meta: "Documental · Loma de Cabrera · con Hoenn", year: 2026 },
  { id: "DNZZu9HMVtt", ext: "jpg", type: "video", title: "Tradiciones Reinventadas", meta: "Intro de serie · Chef Giancarlo Bonarelli", year: 2025 },
  { id: "DPUr9v3Cprw", ext: "jpg", type: "foto", title: "¡Qué Chévere es Saber!", meta: "Sesión de fotos", year: 2025 },
  { id: "DZ749TVFhTV", ext: "webp", type: "foto", title: "Fotografía gastronómica", meta: "In Frame", year: 2026 },
  { id: "DSS7t2liWs1", ext: "jpg", type: "video", title: "Food film", meta: "In Frame", year: 2025 },
  { id: "DE5sq4mPWbB", ext: "jpg", type: "video", title: "Spot de producto", meta: "Con Miguel R. Corniel y Hoenn", year: 2025 },
  { id: "DcPAuYWiaV_", ext: "webp", type: "retrato", title: "Retrato editorial", meta: "Modelo @kakeiyang", year: 2026 },
  { id: "DaMSg-DjEdr", ext: "webp", type: "retrato", title: "Retrato editorial", meta: "Modelo @evivilla24", year: 2026 },
  { id: "DUb9KJmCTru", ext: "webp", type: "retrato", title: "Retrato en estudio", meta: "Modelo @nicolecueli", year: 2026 },
  { id: "DVMCMUpkVqD", ext: "webp", type: "retrato", title: "Retrato en estudio", meta: "Modelo @nataliasanchezlegal", year: 2026 },
  { id: "DUtVNPqCXqB", ext: "webp", type: "retrato", title: "Retrato editorial", meta: "Modelo @ricicorniel", year: 2026 },
  { id: "DUoHASsiTr6", ext: "webp", type: "retrato", title: "Retrato editorial", meta: "Modelo @jenvargas_", year: 2026 },
  { id: "DUgnbtbCfd5", ext: "webp", type: "retrato", title: "Retrato en estudio", meta: "Modelo @rdriguez_arias", year: 2026 },
  { id: "DT_W-IUkV3Z", ext: "webp", type: "retrato", title: "Retrato en estudio", meta: "Modelo @bessyrodz", year: 2026 },
];

const CLIENTS = ["Wendy’s", "Pizza Hut", "Häagen-Dazs", "Banco LAFISE", "Viamar", "Manzanas Washington", "Bodas A La Moda", "By Oriana Lucas", "Hoenn"];

/* Covers shown in the hero wall, one array per column */
const WALL = [
  ["DZqhDx_pwn-", "DcPAuYWiaV_", "DM-ivGzpY6K", "DUgnbtbCfd5"],
  ["DN6wpaIkVMU", "DPrdmBtgVTj", "C8iAuPMP0PC", "DaMSg-DjEdr"],
  ["DNZZu9HMVtt", "DUb9KJmCTru", "DY-rGuBJqco", "DZ749TVFhTV"],
];

const WHATSAPP = "18295602997"; // country code included
const WA_MESSAGE = "Hola Juan, vi tu portafolio de In Frame y me gustaría hablar sobre un proyecto.";

/* ------------------------------------------------------------------ */
document.documentElement.classList.add("js");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const LABEL = { video: "Video", foto: "Foto", retrato: "Retrato" };
const PLAY = '<svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
const cover = (p) => `assets/work/${p.id}.${p.ext}`;
const igUrl = (p) => `https://www.instagram.com/${p.type === "video" ? "reel" : "p"}/${p.id}/`;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* WhatsApp links with a prefilled message */
$$("[data-wa]").forEach((a) => (a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_MESSAGE)}`));
$("#year").textContent = new Date().getFullYear();

/* Hero wall */
$("#wall").innerHTML = WALL.map((col) => {
  const imgs = col.map((id) => `<img src="${cover(byId[id])}" alt="" decoding="async">`).join("");
  return `<div class="wall__col"><div class="wall__track">${imgs}${imgs}</div></div>`;
}).join("");

/* Clients marquee (duplicated once for a seamless loop) */
const names = CLIENTS.map((c) => `<li>${c}</li>`).join("");
$("#clients").innerHTML = names + names.replaceAll("<li>", '<li aria-hidden="true">');

/* Work grid */
const grid = $("#grid");
grid.innerHTML = PROJECTS.map((p, i) => `
  <button class="card reveal${p.big ? " card--big" : ""}" type="button" data-i="${i}" data-type="${p.type}" aria-label="Abrir ${p.title}">
    <img src="${cover(p)}" alt="${p.title} — ${p.meta}" loading="lazy" decoding="async">
    <span class="card__badge">${p.type === "video" ? PLAY : ""}${LABEL[p.type]}</span>
    <span class="card__info"><strong>${p.title}</strong><small>${p.meta} · ${p.year}</small></span>
  </button>`).join("");

/* Filters */
const chips = $("#chips");
const types = ["todos", ...new Set(PROJECTS.map((p) => p.type))];
chips.innerHTML = types.map((t, i) => {
  const n = t === "todos" ? PROJECTS.length : PROJECTS.filter((p) => p.type === t).length;
  return `<button class="chip" type="button" data-filter="${t}" aria-pressed="${i === 0}">${t === "todos" ? "Todos" : LABEL[t]}<sup>${n}</sup></button>`;
}).join("");
let visible = PROJECTS.map((_, i) => i);
chips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const f = chip.dataset.filter;
  $$(".chip", chips).forEach((c) => c.setAttribute("aria-pressed", c === chip));
  grid.classList.toggle("is-filtered", f !== "todos");
  visible = [];
  $$(".card", grid).forEach((card) => {
    const show = f === "todos" || card.dataset.type === f;
    card.classList.toggle("is-hidden", !show);
    if (show) { visible.push(+card.dataset.i); card.classList.add("in"); }
  });
});

/* Lightbox — photos show full size, videos play through Instagram's embed */
const lb = $("#lightbox");
const lbMedia = $("#lbMedia");
let current = 0;
function show(i) {
  current = i;
  const p = PROJECTS[i];
  lbMedia.innerHTML = p.type === "video"
    ? `<iframe src="${igUrl(p)}embed/" title="${p.title}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="background:#fff url('${cover(p)}') center/cover"></iframe>`
    : `<img src="${cover(p)}" alt="${p.title}">`;
  $("#lbTitle").textContent = p.title;
  $("#lbMeta").textContent = `${LABEL[p.type]} · ${p.meta} · ${p.year}`;
  $("#lbLink").href = igUrl(p);
}
function step(d) {
  const pos = visible.indexOf(current);
  show(visible[(pos + d + visible.length) % visible.length]);
}
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) { show(+card.dataset.i); lb.showModal(); }
});
$("#lbClose").addEventListener("click", () => lb.close());
$("#lbPrev").addEventListener("click", () => step(-1));
$("#lbNext").addEventListener("click", () => step(1));
lb.addEventListener("close", () => (lbMedia.innerHTML = ""));
lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
lb.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

/* Nav: sticky state, mobile menu, active section */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = $("#toggle");
const menu = $("#menu");
function setMenu(openState) {
  menu.classList.toggle("is-open", openState);
  toggle.setAttribute("aria-expanded", openState);
  toggle.setAttribute("aria-label", openState ? "Cerrar menú" : "Abrir menú");
  document.body.style.overflow = openState ? "hidden" : "";
}
toggle.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

const links = $$('#menu a[href^="#"]');
const spy = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((l) => l.classList.toggle("is-active", l.hash === `#${en.target.id}`));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach((s) => spy.observe(s));

/* Reveal once (never hides again) */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  });
}, { rootMargin: "0px 0px -6% 0px" });
$$(".reveal").forEach((el) => io.observe(el));

/* Viewfinder timecode */
const tc = $("#timecode");
const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const t0 = performance.now();
function tick(now) {
  const t = (now - t0) / 1000;
  tc.textContent = `${pad(t / 3600)}:${pad((t / 60) % 60)}:${pad(t % 60)}:${pad((t % 1) * 24)}`;
  requestAnimationFrame(tick);
}
if (!reduced) requestAnimationFrame(tick);
