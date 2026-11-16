# In Frame — portfolio redesign

Redesign concept for [in-frame-eta.vercel.app](https://in-frame-eta.vercel.app/), the portfolio of Juan Soriano / In Frame (productora audiovisual, Santo Domingo).

Static site — no build step. Open `index.html` or run `npx serve .`.

## Editing content

Everything lives at the top of `main.js`:

- `PROJECTS` — one entry per piece of work. `id` is the Instagram shortcode of the post; the cover image is `assets/work/<id>.<ext>`. Videos open in the lightbox through Instagram's embed player; photos open full size.
- `CLIENTS` — names in the scrolling strip.
- `WALL` — which covers appear in the hero.
- `WHATSAPP` / `WA_MESSAGE` — number (with country code) and the prefilled message.

## Where the content came from

All projects, captions and credits were taken from public posts on [@inframe.rd](https://www.instagram.com/inframe.rd/) and [@juansorianoph](https://www.instagram.com/juansorianoph/). Covers are Instagram-resolution (540–1080px wide); swap in the original exports for the final site.
