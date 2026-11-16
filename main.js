/* ------------------------------------------------------------------
   The projects and client names live in index.html (the #grid cards and
   the #clients list) so they work without JavaScript and are readable by
   crawlers. This file only enhances them: filters, lightbox, motion.
------------------------------------------------------------------- */

/* Covers shown in the hero wall, one array per column (Instagram shortcodes) */
const WALL = [
  ["DZqhDx_pwn-", "DcPAuYWiaV_", "DM-ivGzpY6K", "DUgnbtbCfd5"],
  ["DN6wpaIkVMU", "DPrdmBtgVTj", "C8iAuPMP0PC", "DaMSg-DjEdr"],
  ["DNZZu9HMVtt", "DUb9KJmCTru", "DY-rGuBJqco", "DZ749TVFhTV"],
];

const WHATSAPP = "18295602997"; // country code included
const WA_MESSAGE = "Hola Juan, vi tu portafolio de In Frame y me gustaría hablar sobre un proyecto.";

/* ------------------------------------------------------------------ */
const root = document.documentElement;
root.classList.add("js");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const LABEL = { video: "Video", foto: "Foto", retrato: "Retrato" };
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Logo intro: plays once, any click or key skips it, timer is a safety net */
const intro = $("#intro");
const endIntro = () => intro.remove();
intro.addEventListener("animationend", (e) => { if (e.animationName === "introVeil") endIntro(); });
intro.addEventListener("click", endIntro);
window.addEventListener("keydown", endIntro, { once: true });
setTimeout(endIntro, 3500);

/* WhatsApp links with a prefilled message */
$$("[data-wa]").forEach((a) => (a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_MESSAGE)}`));
$("#year").textContent = new Date().getFullYear();

/* Hero wall (decorative, small thumbnails, low priority) */
$("#wall").innerHTML = WALL.map((col) => {
  const imgs = col.map((id) => `<img src="assets/work/thumb/${id}.webp" alt="" decoding="async" fetchpriority="low" width="540" height="720">`).join("");
  return `<div class="wall__col"><div class="wall__track">${imgs}${imgs}</div></div>`;
}).join("");

/* Clients marquee: duplicate the list once for a seamless loop */
const clients = $("#clients");
$$("li", clients).forEach((li) => {
  const copy = li.cloneNode(true);
  copy.setAttribute("aria-hidden", "true");
  clients.append(copy);
});

/* Projects are read from the cards in the page */
const grid = $("#grid");
const cards = $$(".card", grid);
const PROJECTS = cards.map((card) => ({
  card,
  type: card.dataset.type,
  title: card.dataset.title,
  meta: card.dataset.meta,
  year: card.dataset.year,
  full: card.dataset.full,
  thumb: $("img", card).getAttribute("src"),
  ig: card.href,
}));

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
  PROJECTS.forEach((p, i) => {
    const show = f === "todos" || p.type === f;
    p.card.classList.toggle("is-hidden", !show);
    if (show) { visible.push(i); p.card.classList.add("in"); }
  });
});

/* Lightbox — photos show full size, videos play through Instagram's embed.
   Cards are real links to Instagram; a plain click opens the lightbox instead. */
const lb = $("#lightbox");
const lbMedia = $("#lbMedia");
let current = 0;
function show(i) {
  current = i;
  const p = PROJECTS[i];
  lbMedia.innerHTML = p.type === "video"
    ? `<iframe src="${p.ig}embed/" title="${p.title}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="background-image:url('${p.thumb}')"></iframe>`
    : `<img src="${p.full}" alt="${p.title} — ${p.meta}">`;
  $("#lbTitle").textContent = p.title;
  $("#lbMeta").textContent = `${LABEL[p.type]} · ${p.meta} · ${p.year}`;
  $("#lbLink").href = p.ig;
}
function step(d) {
  const pos = visible.indexOf(current);
  show(visible[(pos + d + visible.length) % visible.length]);
}
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // let modified clicks open Instagram
  e.preventDefault();
  show(cards.indexOf(card));
  lb.showModal();
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

/* Nav: sticky state */
const nav = $("#nav");
const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

/* Mobile menu: while open, everything behind it is inert so focus stays in the menu */
const toggle = $("#toggle");
const menu = $("#menu");
const behindMenu = [$("main"), $("footer"), $("#brand")];
function setMenu(open, returnFocus = false) {
  if (open === menu.classList.contains("is-open")) return;
  menu.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", open);
  toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  document.body.style.overflow = open ? "hidden" : "";
  behindMenu.forEach((el) => (el.inert = open));
  if (open) $("a", menu).focus();
  else if (returnFocus) toggle.focus();
}
toggle.addEventListener("click", () => setMenu(!menu.classList.contains("is-open"), true));
menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false, true); });
matchMedia("(min-width: 821px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });

/* Active section in the nav */
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

/* ---------- Motion: pause button, and stop looping animation that is off screen ---------- */
const hero = $(".hero");
const motionBtn = $("#motion");
const tc = $("#timecode");
const pad = (n) => String(Math.floor(n)).padStart(2, "0");
let paused = false;
let heroVisible = true;
let elapsed = 0;
let last = 0;
let raf = 0;

function tick(now) {
  elapsed += (now - last) / 1000;
  last = now;
  tc.textContent = `${pad(elapsed / 3600)}:${pad((elapsed / 60) % 60)}:${pad(elapsed % 60)}:${pad((elapsed % 1) * 24)}`;
  raf = requestAnimationFrame(tick);
}
function syncTimecode() {
  const run = !reduced && !paused && heroVisible && !document.hidden;
  if (run && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
}
function setPaused(value) {
  paused = value;
  root.classList.toggle("motion-paused", paused);
  motionBtn.setAttribute("aria-pressed", paused);
  $("#motionLabel").textContent = paused ? "Reanudar movimiento" : "Pausar movimiento";
  try { localStorage.setItem("motionPaused", paused ? "1" : ""); } catch (e) {}
  syncTimecode();
}
motionBtn.addEventListener("click", () => setPaused(!paused));
try { if (localStorage.getItem("motionPaused")) setPaused(true); } catch (e) {}

const offscreen = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    en.target.classList.toggle("is-offscreen", !en.isIntersecting);
    if (en.target === hero) { heroVisible = en.isIntersecting; syncTimecode(); }
  });
});
[hero, $(".clients")].forEach((el) => offscreen.observe(el));
document.addEventListener("visibilitychange", syncTimecode);
syncTimecode();
