/* ------------------------------------------------------------------
   Content comes from the database (edited at /admin). The cards and client
   names written in index.html are the fallback: they show instantly, work
   without JavaScript, and are replaced once the live content has loaded.
------------------------------------------------------------------- */

/* Fallback hero wall, used until the database answers (Instagram shortcodes) */
const WALL = [
  "DZqhDx_pwn-", "DN6wpaIkVMU", "DNZZu9HMVtt", "DcPAuYWiaV_", "DPrdmBtgVTj", "DUb9KJmCTru",
  "DM-ivGzpY6K", "C8iAuPMP0PC", "DY-rGuBJqco", "DUgnbtbCfd5", "DaMSg-DjEdr", "DZ749TVFhTV",
].map((id) => `assets/work/thumb/${id}.webp`);

const WHATSAPP = "18295602997"; // country code included; the prefilled message is "wa" in i18n.js

/* ------------------------------------------------------------------ */
const root = document.documentElement;
root.classList.add("js");
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
/* Language (i18n.js): t() gives the short UI texts; loc() gives a project's title and details in the current language */
const t = (key, ...args) => (window.I18N ? I18N.t(key, ...args) : key);
const label = (type) => (["video", "foto", "retrato"].includes(type) ? t(type) : "");
const loc = (p) => (window.I18N?.lang === "en" ? { title: p.titleEn || p.title, meta: p.metaEn || p.meta } : { title: p.title, meta: p.meta });
const PLAY = '<svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeImg = (u) => (/^(https:\/\/|assets\/)/.test(u || "") ? u : "");
const safeLink = (u) => (/^https:\/\//.test(u || "") ? u : "");
/* Player address for a video link, or null when it is not one we can play in the page */
function embedOf(u = "") {
  let m;
  if ((m = /^https:\/\/(?:www\.)?instagram\.com\/(reels?|p)\/([\w-]+)/.exec(u))) return { src: `https://www.instagram.com/${m[1] === "p" ? "p" : "reel"}/${m[2]}/embed/`, host: "Instagram" };
  if ((m = /^https:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([\w-]{11})/.exec(u))) return { src: `https://www.youtube-nocookie.com/embed/${m[1]}`, host: "YouTube" };
  if ((m = /^https:\/\/(?:(?:www\.|m\.)?youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/)|youtu\.be\/)([\w-]{11})/.exec(u))) return { src: `https://www.youtube-nocookie.com/embed/${m[1]}`, host: "YouTube", wide: true };
  if ((m = /^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/.exec(u))) return { src: `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ""}`, host: "Vimeo", wide: true };
  return null;
}

/* Logo intro: plays once, any click or key skips it, timer is a safety net */
const intro = $("#intro");
const endIntro = () => intro.remove();
intro.addEventListener("animationend", (e) => { if (e.animationName === "introVeil") endIntro(); });
intro.addEventListener("click", endIntro);
window.addEventListener("keydown", endIntro, { once: true });
setTimeout(endIntro, 3500);

/* WhatsApp links with a prefilled message */
const setWhatsApp = () => $$("[data-wa]").forEach((a) => (a.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(t("wa"))}`));
setWhatsApp();
$("#year").textContent = new Date().getFullYear();

/* Reveal once (never hides again) */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  });
}, { rootMargin: "0px 0px -6% 0px" });
$$(".reveal").forEach((el) => io.observe(el));

/* ---------- Hero wall (decorative thumbnails in three looping columns) ---------- */
let wallKey = "";
function renderWall(thumbs) {
  const list = thumbs.map(safeImg).filter(Boolean);
  if (list.length < 3 || list.join() === wallKey) return;
  wallKey = list.join();
  const cols = [[], [], []];
  list.forEach((src, i) => cols[i % 3].push(src));
  $("#wall").innerHTML = cols.map((col) => {
    const set = col.length < 3 ? [...col, ...col] : col; // keep each column tall enough to loop
    const imgs = set.map((src) => `<img src="${esc(src)}" alt="" decoding="async" fetchpriority="low" width="540" height="720">`).join("");
    return `<div class="wall__col"><div class="wall__track">${imgs}${imgs}</div></div>`;
  }).join("");
}
renderWall(WALL);

/* ---------- Clients marquee (list duplicated once for a seamless loop) ---------- */
const clients = $("#clients");
/* list: [{ name, logo }] — a client with a logo shows the logo (name as its alt text), otherwise the name */
function renderClients(list) {
  if (list) clients.innerHTML = list.map((c) => c.logo
    ? `<li class="has-logo"><img src="${esc(c.logo)}" alt="${esc(c.name)}" decoding="async"></li>`
    : `<li>${esc(c.name)}</li>`).join("");
  $$("li", clients).forEach((li) => {
    const copy = li.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    clients.append(copy);
  });
}
const staticClients = $$("li", clients).map((li) => li.textContent);
renderClients();

/* ---------- Projects, filters ---------- */
const grid = $("#grid");
const chips = $("#chips");
let PROJECTS = [];
let visible = [];

function cardHTML(p) {
  const thumb = safeImg(p.thumb), full = safeImg(p.full), link = safeLink(p.link);
  const { title, meta } = loc(p);
  const alt = esc(`${title} — ${meta}`);
  return `<a class="card in${p.featured ? " card--big" : ""}" ${link ? `href="${esc(link)}" target="_blank" rel="noopener"` : 'href="#trabajo"'} data-type="${esc(p.type)}">
    <img src="${esc(thumb)}" srcset="${esc(thumb)} 540w, ${esc(full)} 1200w" sizes="${p.featured ? "(max-width: 640px) 100vw, 50vw" : "(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw"}" alt="${alt}" loading="lazy" decoding="async">
    <span class="card__badge">${p.type === "video" ? PLAY : ""}${label(p.type)}${p.media?.length ? ` +${p.media.length}` : ""}</span>
    <span class="card__info"><strong>${esc(title)}</strong><small>${esc([meta, p.year].filter(Boolean).join(" · "))}</small></span>
  </a>`;
}

function setProjects(list, rerender) {
  if (rerender) grid.innerHTML = list.map(cardHTML).join("");
  const cards = $$(".card", grid);
  PROJECTS = list.map((p, i) => ({ ...p, card: cards[i] }));
  visible = PROJECTS.map((_, i) => i);
  grid.classList.remove("is-filtered");
  const types = ["todos", ...["video", "foto", "retrato"].filter((t) => PROJECTS.some((p) => p.type === t))];
  chips.innerHTML = types.map((t, i) => {
    const n = t === "todos" ? PROJECTS.length : PROJECTS.filter((p) => p.type === t).length;
    return `<button class="chip" type="button" data-filter="${t}" aria-pressed="${i === 0}">${t === "todos" ? I18N.t("all") : label(t)}<sup>${n}</sup></button>`;
  }).join("");
}

/* Start from the cards already in the page */
const fromDom = $$(".card", grid).map((card) => ({
  type: card.dataset.type,
  title: card.dataset.title,
  meta: card.dataset.meta,
  year: card.dataset.year,
  full: card.dataset.full,
  thumb: $("img", card).getAttribute("src"),
  link: card.href,
  featured: card.classList.contains("card--big"),
}));
setProjects(fromDom, false);

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

/* ---------- Live content from the database ---------- */
const sig = (list) => JSON.stringify(list.map((p) => [p.title, p.meta, p.titleEn || "", p.metaEn || "", String(p.year ?? ""), p.type, p.thumb, p.full, p.link, !!p.featured, p.media?.length || 0]));
async function loadLive() {
  const cfg = window.IF_CONFIG;
  if (!cfg) return;
  const get = (path) => fetch(`${cfg.supabaseUrl}/rest/v1/${path}`, { headers: { apikey: cfg.supabaseKey } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
  try {
    const [rows, names, extra] = await Promise.all([
      get("projects?select=id,title,meta,title_en,meta_en,year,type,link,cover_url,thumb_url,featured,in_hero&published=is.true&order=position.asc"),
      get("clients?select=name,logo_url&order=position.asc"),
      get("project_media?select=project_id,kind,url&order=position.asc").catch(() => []), // galleries are optional
    ]);
    if (rows.length) {
      const gallery = {};
      extra.forEach((m) => (gallery[m.project_id] ||= []).push({ kind: m.kind, url: m.url }));
      const live = rows.map((r) => ({ media: gallery[r.id] || [], type: r.type, title: r.title, meta: r.meta, titleEn: r.title_en || "", metaEn: r.meta_en || "", year: r.year, full: r.cover_url, thumb: r.thumb_url, link: r.link || "", featured: r.featured, inHero: r.in_hero }));
      if (sig(live) !== sig(fromDom)) setProjects(live, true);
      const hero = live.filter((p) => p.inHero);
      renderWall((hero.length >= 3 ? hero : live).map((p) => p.thumb));
    }
    const liveClients = names.map((n) => ({ name: n.name, logo: n.logo_url || "" }));
    const changed = liveClients.some((c) => c.logo) || liveClients.map((c) => c.name).join("|") !== staticClients.join("|");
    if (liveClients.length && changed) renderClients(liveClients);
  } catch (e) { /* offline or database unreachable: the built-in content stays */ }
}
loadLive();

/* ---------- Lightbox ----------
   Each project is a short gallery: its cover (or its video, when the link can play in the page)
   followed by any extra photos and videos. The arrows walk through it, then on to the next project.
   Cards are real links; a plain click opens the lightbox instead. */
const lb = $("#lightbox");
const lbMedia = $("#lbMedia");
let current = 0;
let slide = 0;
function slidesOf(p) {
  const first = p.type === "video" && embedOf(p.link) ? { kind: "video", url: p.link, poster: p.thumb } : { kind: "photo", url: p.full };
  const rest = (p.media || []).filter((m) => (m.kind === "video" ? embedOf(m.url) : safeImg(m.url)));
  return [first, ...rest];
}
function show(i, s = 0) {
  current = i;
  const p = PROJECTS[i];
  const slides = slidesOf(p);
  slide = s < 0 ? slides.length - 1 : Math.min(s, slides.length - 1);
  const item = slides[slide];
  const embed = item.kind === "video" ? embedOf(item.url) : null;
  const { title, meta } = loc(p);
  const n = slides.length > 1 ? ` (${t("count", slide + 1, slides.length)})` : "";
  lbMedia.innerHTML = embed
    ? `<iframe${embed.wide ? ' class="is-wide"' : ""} src="${esc(embed.src)}" title="${esc(title + n)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen${item.poster ? ` style="background-image:url('${esc(safeImg(item.poster))}')"` : ""}></iframe>`
    : `<img src="${esc(safeImg(item.url))}" alt="${esc(`${title} — ${meta}${n}`)}">`;
  $("#lbTitle").textContent = title;
  $("#lbMeta").textContent = [label(p.type), meta, p.year].filter(Boolean).join(" · ");
  const count = $("#lbCount");
  count.hidden = slides.length < 2;
  count.textContent = `${slide + 1} / ${slides.length}`;
  const link = safeLink(embed ? item.url : p.link);
  const a = $("#lbLink");
  a.hidden = !link;
  if (link) { a.href = link; const host = (embedOf(link) || {}).host; a.textContent = host ? t("viewOn", host) : t("viewProject"); }
}
function step(d) {
  const next = slide + d;
  if (next >= 0 && next < slidesOf(PROJECTS[current]).length) return show(current, next);
  const pos = visible.indexOf(current);
  show(visible[(pos + d + visible.length) % visible.length], d < 0 ? -1 : 0);
}
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return; // let modified clicks follow the link
  e.preventDefault();
  show(PROJECTS.findIndex((p) => p.card === card));
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

/* ---------- Nav: sticky state ---------- */
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
  toggle.setAttribute("aria-label", t(open ? "closeMenu" : "openMenu"));
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
  $("#motionLabel").textContent = t(paused ? "resume" : "pause");
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

/* ---------- Language switch: redraw what this file wrote (i18n.js swaps the fixed texts) ---------- */
function relang() {
  const active = $(".chip[aria-pressed='true']", chips)?.dataset.filter || "todos";
  setProjects(PROJECTS, true);
  if (active !== "todos") $(`.chip[data-filter="${active}"]`, chips)?.click();
  setWhatsApp();
  $("#motionLabel").textContent = t(paused ? "resume" : "pause");
  toggle.setAttribute("aria-label", t(menu.classList.contains("is-open") ? "closeMenu" : "openMenu"));
  if (lb.open) show(current, slide);
}
if (window.I18N) {
  I18N.onChange(relang);
  if (I18N.lang !== "es") relang(); // the cards written in index.html are in Spanish
}
