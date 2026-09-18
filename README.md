# Olabisi Adigun — Portfolio

Static portfolio site for **Olabisi Adigun** (designer, full-stack engineer, product
builder), published at [olabisiadigun.xyz](https://olabisiadigun.xyz) via GitHub Pages.

No build step, no backend: plain HTML/CSS/JS served as static files.

## Structure

```
index.html            landing page (works, services, drafts, contact)
about/ services/      about + four service pages
works/<name>/         case studies (sentry, pulse, meshlearn, strike, safe)
blog/<slug>/          writing (5 posts)
privacy/ terms/       legal pages
assets/               images + generated og-*.jpg share cards
scripts/              maintenance + verification tooling
docs/launch-checklist.md   full launch/QA/security audit & status
```

## Develop

```bash
python3 -m http.server 8000   # serve locally, open :8000
```

## Verify before shipping

```bash
node scripts/check-site.mjs        # links, SEO, a11y, JSON-LD, DOM ids
node --check script.js shared.js hero-planes.js
```

Run these before every deploy; they catch broken links, missing SEO tags,
invalid JSON-LD and DOM ids referenced by the JS but absent from the HTML.

## Maintenance tooling

- `scripts/generate-og.py` — regenerate 1200×630 social share images (needs ImageMagick).
- `scripts/check-site.mjs` — static health check.
- `clean_urls.py` — keeps pretty `/dir/` URLs working with redirect stubs.

## Notes

- Theme (light/dark) is stored in `localStorage` and synced across pages.
- The site sets no tracking cookies; see `privacy/`.
- Report security issues via `/.well-known/security.txt`.
