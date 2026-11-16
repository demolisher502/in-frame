# Handoff notes

For the developer taking over maintenance of the In Frame portfolio (Juan Soriano, Santo Domingo). Read this first, then `README.md` for day-to-day editing.

## What this is

A redesign of Juan's portfolio, built as a proposal on top of the original at [in-frame-eta.vercel.app](https://in-frame-eta.vercel.app/). It is a single static page plus a small admin page, with content stored in Supabase.

- Live: https://in-frame-redesign.vercel.app
- Admin: https://in-frame-redesign.vercel.app/admin
- Repo: `Makemoves809/in-frame-redesign` (private), branch `main`

## The three pieces

| Piece | Role | Notes |
|---|---|---|
| GitHub repo | All code | No build step, no dependencies, no environment variables |
| Vercel project | Hosting | Deploys automatically on every push to `main`; `vercel.json` only sets cache headers for `/assets` |
| Supabase project `in-frame` (ref `unzalqzksrfzwymaqrbr`, us-east-1, free plan) | Content, images, logins | URL and publishable key are in `config.js`; that key is meant to be public |

## Code map

| File | What it does |
|---|---|
| `index.html` | The whole public page. Contains a static copy of the projects and clients as a fallback |
| `styles.css` | All public styling. Design tokens are at the top (`--bg`, `--text`, `--accent`, `--display`, `--sans`) |
| `main.js` | Loads live content from Supabase and replaces the fallback; filters, lightbox/gallery, menu, motion pause |
| `config.js` | Supabase URL and publishable key |
| `i18n.js` | Spanish / English: English versions of the fixed texts, the short texts `main.js` builds, and the language switch |
| `admin/` | Admin page: sign-in, project editor with cover upload and gallery, client list. Uses supabase-js from a CDN |
| `assets/work/` | The 20 original covers (from Instagram) and their 540px thumbnails |

Run locally with `npx serve .` — the local copy talks to the same live database.

## Database

Created by two migrations, visible in the Supabase dashboard under Database → Migrations (`portfolio_content`, `project_media`). The same structure, plus the starting content, is in `supabase/setup.sql`; keep that file up to date when the structure changes.

- `projects` — title, meta, year, type (`video`/`foto`/`retrato`), link, cover and thumbnail URLs, flags `published`/`featured`/`in_hero`, `position`.
- `project_media` — gallery items per project: `kind` (`photo`/`video`), `url`, `thumb_url`, `position`. Deleted with their project.
- `clients` — names for the marquee, with `position`.
- `admins` — user ids allowed to edit. There is deliberately no way to write to this table from the browser; add rows in the SQL editor.
- Storage bucket `media` (public read, 8 MB limit, images only): `covers/`, `thumbs/`, `gallery/`, `gallery-thumbs/`.

Security is row-level security in the database, not the admin page: anyone can read published projects, their galleries and clients; only users listed in `admins` can write or upload.

Granting access (also in the README):

1. Authentication → Users → Add user (email + password, Auto Confirm on).
2. SQL editor: `insert into public.admins (user_id) select id from auth.users where email = 'their@email';`

## Things that are not obvious

- **The static fallback does not update.** Cards and client names in `index.html` show for an instant before live content loads, and are what a crawler without JavaScript sees. Edits made in the admin page do not change them. If SEO for project names matters, regenerate that block from the database occasionally.
- **The site URL is hard-coded** in the `<head>` of `index.html` (canonical, `og:url`, `og:image`). Update all three if the domain changes.
- **Videos are never uploaded.** They are links (Instagram, YouTube, Vimeo) played through each platform's embed. `embedOf()` in `main.js` and `videoHost()` in `admin/admin.js` decide which links are accepted; keep the two in sync.
- **Images are resized in the browser** before upload (1600px and 540px WebP), so storage use stays small.
- **Texts are not in the database.** Hero, services, bio, quote and contact details are edited in `index.html` (Spanish) and `i18n.js` (English, same `data-i18n` key); the WhatsApp number is at the top of `main.js` and its prefilled message, in both languages, in `i18n.js`.
- **Two languages.** Spanish is the default; English is chosen with ES | EN, remembered per visitor, or taken from the browser language. Project titles and details use `title_en` / `meta_en` when filled in and fall back to Spanish. Search engines see the Spanish page.
- **No password reset or change screen exists** in the admin page. Passwords are set in the Supabase dashboard.
- **Media came from Instagram**, at Instagram resolution, from @inframe.rd and @juansorianoph. Replacing covers with Juan's original exports would improve quality.

## Known gaps

- The admin page's gallery save (multi-photo upload, reorder, remove) was built last and has had little real use.
- Filter changes on the public page are not announced to screen readers.
- No sitemap or structured data.
- Real-world load speed has not been measured (run PageSpeed Insights).
- Supabase's "leaked password protection" is off (Authentication → Sign In / Providers → Email).

## Taking ownership

There are two ways. **Option A, your own copy:** create your own Supabase project and Vercel deployment from this repo. `supabase/setup.sql` rebuilds the whole database with the starting content, and `supabase/README.md` has the steps. Nothing needs transferring, but your copy is independent of the original. **Option B, take over the existing ones:** the steps below.

1. **GitHub** — the current owner adds you as collaborator, or transfers the repo (Settings → Danger Zone).
2. **Supabase** — have the project transferred to your organization (Project Settings → General → Transfer project). The URL and key stay the same, so nothing in the code changes. Do not recreate it; that would mean moving data, images and logins by hand.
3. **Vercel** — have the project transferred to your account (Project Settings → General → Transfer) to keep the current URL, or import the repo into your own Vercel and update the three URLs in `index.html`.
4. **Admin access** — create your own login and add it to `admins`; remove logins that are no longer needed.
