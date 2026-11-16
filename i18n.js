/* ------------------------------------------------------------------
   Spanish / English.
   Spanish is written directly in index.html; English for those same texts is in EN below,
   keyed by each element's data-i18n (its inner HTML) or data-i18n-label (its aria-label).
   UI holds the short texts that main.js builds on the fly, in both languages.
   Project titles and details come from the database (title_en / meta_en, edited in /admin).
   Language: ?lang=en or ?lang=es in the address, else the choice made in this tab, else Spanish.
------------------------------------------------------------------- */
(function () {
  const EN = {
    "doc.title": "In Frame — Video production · Juan Soriano",
    "doc.desc": "In Frame is Juan Soriano’s video production company: direction, filming, post-production and photography in the Dominican Republic.",
    skip: "Skip to content",
    "brand.label": "In Frame, home",
    "nav.label": "Main",
    "nav.work": "Work",
    "nav.services": "Services",
    "nav.about": "About",
    "nav.contact": "Contact",
    "nav.talk": "Let’s talk",
    "hero.eyebrow": "Video production — Santo Domingo, DR",
    "hero.title": "Ideas that become <em>stories</em> that leave a mark.",
    "hero.text": "Video, post-production and photography for brands like Wendy’s, Pizza Hut and Häagen-Dazs — and for people who want to look the way they feel.",
    "hero.see": "See work",
    "hero.quote": "Get a quote",
    "clients.title": "Brands and teams we’ve worked with",
    "work.label": "Work",
    "work.title": "Selected projects",
    "work.filter": "Filter by category",
    "services.label": "Services",
    "services.title": "From script to final frame",
    "s1.title": "Direction & filming",
    "s1.text": "Commercials, product launches, event coverage and social content, with a cinematic eye from start to finish.",
    "s2.title": "Post-production",
    "s2.text": "Editing, color grading and sound design so every piece has rhythm, intent and a professional finish.",
    "s3.title": "Photography",
    "s3.text": "Food, product, fashion and editorial portraits. Images made for campaigns, covers and social media.",
    "quote.text": "“A photo shoot without fun? <em>No such thing!</em>”",
    "quote.cite": "— ¡Qué Chévere es Saber!, on their shoot with In Frame · <a href=\"https://www.instagram.com/reel/DPUr9v3Cprw/\" target=\"_blank\" rel=\"noopener\">see post ↗</a>",
    "about.label": "About",
    "about.title": "Juan Soriano<br><em>behind the lens.</em>",
    "about.lead": "I’m a Dominican filmmaker, post-producer and photographer. In Frame is my video production company in Santo Domingo.",
    "about.text": "I’ve been behind the camera on launches, campaigns and coverage for consumer brands, magazine covers and editorial shoots — many of them alongside agencies like Hoenn. The same thing drives me every time: authentic storytelling and attention to detail.",
    "contact.label": "Contact",
    "contact.title": "Got a project<br>in mind? <em>Let’s talk.</em>",
    "contact.wa": "Message on WhatsApp",
    "contact.note": "Santo Domingo, Dominican Republic",
    "contact.email": "Email",
    "footer.top": "Back to top ↑",
    "lb.label": "Project viewer",
    "lb.close": "Close",
    "lb.prev": "Previous",
    "lb.next": "Next",
  };

  const UI = {
    es: {
      video: "Video", foto: "Foto", retrato: "Retrato", all: "Todos",
      count: (a, b) => `${a} de ${b}`,
      viewOn: (host) => `Ver en ${host} ↗`, viewProject: "Ver proyecto ↗",
      pause: "Pausar movimiento", resume: "Reanudar movimiento",
      openMenu: "Abrir menú", closeMenu: "Cerrar menú",
      switchLang: "Cambiar el sitio a inglés",
      wa: "Hola Juan, vi tu portafolio de In Frame y me gustaría hablar sobre un proyecto.",
    },
    en: {
      video: "Video", foto: "Photo", retrato: "Portrait", all: "All",
      count: (a, b) => `${a} of ${b}`,
      viewOn: (host) => `View on ${host} ↗`, viewProject: "View project ↗",
      pause: "Pause motion", resume: "Resume motion",
      openMenu: "Open menu", closeMenu: "Close menu",
      switchLang: "Switch the site to Spanish",
      wa: "Hi Juan, I saw your In Frame portfolio and I’d like to talk about a project.",
    },
  };

  const valid = (l) => l === "es" || l === "en";
  function initial() {
    try {
      const q = new URLSearchParams(location.search).get("lang");
      if (valid(q)) return q;
      const saved = sessionStorage.getItem("lang");
      if (valid(saved)) return saved;
    } catch (e) {}
    return "es";
  }

  /* the Spanish originals, read once from the page */
  const ES = {
    "doc.title": document.title,
    "doc.desc": document.querySelector('meta[name="description"]').content,
  };
  const textEls = [...document.querySelectorAll("[data-i18n]")];
  const labelEls = [...document.querySelectorAll("[data-i18n-label]")];
  textEls.forEach((el) => (ES[el.dataset.i18n] = el.innerHTML));
  labelEls.forEach((el) => (ES[el.dataset.i18nLabel] = el.getAttribute("aria-label")));

  let lang = "es";
  const listeners = [];

  function apply(next) {
    lang = next;
    const dict = lang === "en" ? EN : ES;
    const pick = (k) => dict[k] ?? ES[k];
    document.documentElement.lang = lang;
    document.title = pick("doc.title");
    document.querySelector('meta[name="description"]').content = pick("doc.desc");
    textEls.forEach((el) => (el.innerHTML = pick(el.dataset.i18n)));
    labelEls.forEach((el) => el.setAttribute("aria-label", pick(el.dataset.i18nLabel)));
    const btn = document.getElementById("lang");
    if (btn) {
      btn.dataset.lang = lang;
      btn.setAttribute("aria-label", UI[lang].switchLang);
    }
    listeners.forEach((fn) => fn(lang));
  }

  window.I18N = {
    get lang() { return lang; },
    t(key, ...args) {
      const v = UI[lang][key] ?? UI.es[key];
      return typeof v === "function" ? v(...args) : v;
    },
    onChange(fn) { listeners.push(fn); },
    set(next) {
      if (!valid(next) || next === lang) return;
      try { sessionStorage.setItem("lang", next); } catch (e) {}
      apply(next);
    },
  };

  apply(initial());

  const btn = document.getElementById("lang");
  if (btn) btn.addEventListener("click", () => window.I18N.set(lang === "es" ? "en" : "es"));
})();
