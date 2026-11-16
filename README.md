# In Frame — portfolio redesign

Redesign concept for [in-frame-eta.vercel.app](https://in-frame-eta.vercel.app/), the portfolio of Juan Soriano / In Frame (productora audiovisual, Santo Domingo).

Static site — no build step. Open `index.html` or run `npx serve .`.

## Editing content

- **Projects** — each one is an `<a class="card">` inside `#grid` in `index.html`. The `href` is the Instagram post, `data-full` is the full-size image, and the `<img>` points at the small version in `assets/work/thumb/`. Videos open in the lightbox through Instagram's embed player; photos open full size. Add `card--big` to feature one.
- **Client names** — the `<li>` items in `#clients` in `index.html`.
- **Hero wall** — the `WALL` list at the top of `main.js` (Instagram shortcodes, three columns).
- **WhatsApp** — `WHATSAPP` (number with country code) and `WA_MESSAGE` at the top of `main.js`.
- **Domain** — if the site moves, update the canonical, `og:url` and `og:image` URLs in the `<head>` of `index.html`.

To add an image: put the full version in `assets/work/` and a ~540px-wide WebP of it in `assets/work/thumb/` with the same name.

## Where the content came from

All projects, captions and credits were taken from public posts on [@inframe.rd](https://www.instagram.com/inframe.rd/) and [@juansorianoph](https://www.instagram.com/juansorianoph/). Covers are Instagram-resolution (540–1080px wide); swap in the original exports for the final site.
