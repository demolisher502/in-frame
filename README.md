# In Frame — portfolio redesign

Redesign concept for [in-frame-eta.vercel.app](https://in-frame-eta.vercel.app/), the portfolio of Juan Soriano / In Frame (productora audiovisual, Santo Domingo).

Static site — no build step. Open `index.html` or run `npx serve .`.

## Editing content: the admin page

Projects and client names are edited at **`/admin`** — sign in, then add, edit, reorder, hide or delete projects, upload cover images, choose which appear in the hero, and manage the client strip. Changes are live immediately.

Each project can also have a **gallery**: extra photos (uploaded, resized in the browser) and extra video links (YouTube, Vimeo or Instagram). On the site, opening a project shows its cover or video first, then the gallery; the arrows walk through it and on to the next project. Video files are not uploaded — they stay on the video platform and play inside the page.

How it works:

- Gallery items live in the `project_media` table (one row per photo or video link, ordered by `position`); they are visible only while their project is published.

- Content lives in a Supabase project (`in-frame`): tables `projects` and `clients`, and a public `media` storage bucket for uploaded covers. The connection details are in `config.js` (a publishable key, safe to ship).
- The public page loads its content from there on every visit. The cards and names written in `index.html` are only a fallback (first paint, no-JavaScript, database unreachable) — they do **not** update when the admin page is used.
- Security is enforced by the database, not the page: anyone can read published projects; only users listed in the `admins` table can write or upload.

### Giving someone access

1. Supabase dashboard → Authentication → Users → **Add user** (email + password, "Auto Confirm User" on).
2. SQL editor: `insert into public.admins (user_id) select id from auth.users where email = 'their@email';`

To remove access, delete their row from `admins` (or delete the user).

## Editing everything else

- **Texts** (hero, services, bio, quote, contact) — Spanish directly in `index.html`; the English version of each is in `i18n.js` (same key as the element's `data-i18n`).
- **English for projects** — optional "Título en inglés" and "Detalle en inglés" fields in `/admin`; when empty, the Spanish text is shown. The visitor switches language with ES | EN in the top bar, and `?lang=en` in the address opens the site in English.
- **WhatsApp** — `WHATSAPP` (number with country code) and `WA_MESSAGE` at the top of `main.js`.
- **Domain** — if the site moves, update the canonical, `og:url` and `og:image` URLs in the `<head>` of `index.html`.

## Where the content came from

All projects, captions and credits were taken from public posts on [@inframe.rd](https://www.instagram.com/inframe.rd/) and [@juansorianoph](https://www.instagram.com/juansorianoph/). Covers are Instagram-resolution (540–1080px wide); swap in the original exports for the final site.
