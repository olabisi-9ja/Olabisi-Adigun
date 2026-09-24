# Launch Checklist — Audit & Status

This document maps the launch/QA/security/design checklist to the current state of
this repository. Status legend:

- **Done** — implemented in this repo.
- **Partial** — implemented but has an honest limitation noted.
- **Needs input** — requires a real person / external account (cannot be fabricated).
- **N/A** — not applicable to a static, backend-less portfolio.

Everything marked Done can be re-verified with `node scripts/check-site.mjs`.

---

## 1. Website Launch (Content, SEO & Structure)

| Item | Status | Notes |
|---|---|---|
| Custom 404 page | Done | `404.html` with recovery links. |
| Privacy Policy | Done | `privacy/` — honest, static-site policy. |
| Terms & Conditions | Done | `terms/`. |
| About page + story | Done | `about/`. |
| Case studies | Done | `works/*` (5). |
| 5 FAQs | Done | `#faq` on index (5 native `<details>` + FAQPage-ready). |
| 5 blog posts | Done | Added a 5th: `blog/launch-checklist/`. |
| B+A gallery / team photo / real reviews | Needs input | Needs real assets/people; not fabricated (see anti-patterns). |
| Page per service | Done | `services/` hub + 4 service pages. |
| Clear CTA above the fold + sticky mobile CTA | Done | `#contact` CTA + `.mobile-cta` bar (hides when contact visible). |
| Response-time promise | Done | "Response within 2 business days" in contact. |
| Maps + directions / opening hours | Done | Ilorin map link + availability hours in contact. |
| Visible contact email (clickable) | Done | mailto links + copy button. |
| Working social links | Done | GitHub / LinkedIn / X / IG / Discord. |
| Internal links | Done | prev/next on posts & works, services, breadcrumbs, footer. |
| Breadcrumbs | Done | On all sub-pages (`a11y.css`). |
| Unique page titles / meta descriptions | Done | Enforced by checker. |
| Social share images | Done | 1200×630 JPGs generated (`scripts/generate-og.py`). |
| Alt text on images | Done | Rewritten; checker enforces non-empty alt. |
| Local / structured data (schema) | Done | JSON-LD Person/WebSite/Article/Breadcrumb/Service/FAQ-ready. |
| Favicon | Done | SVG + 32/192 PNG + apple-touch-icon. |
| Copyright year | Done | Dynamic via `[data-year]` on every page. |
| Google Analytics / Search Console | Needs input | Needs your GA4 id + GSC verification; snippet below. |
| robots.txt / sitemap.xml / llms.txt | Done | All present; sitemap lists 19 URLs. |
| Canonical tags | Done | Every page. |
| Remove huge JS bundles | Done | Dropped ~600 KB three.js CDN for a tiny canvas (`hero-planes.js`). |
| Compressed images | Done | 1.8 MB PNG → ~60 KB WebP; batch re-encode (`-380 KB` total). |
| Custom domain | Done | `CNAME` = olabisiadigun.xyz already set. |

## 2. UI/UX & Design

| Item | Status | Notes |
|---|---|---|
| Dark mode toggle | Done | Index now has one; shared across pages via localStorage. |
| ^ top button | Done | `#backtotop`. |
| Mobile menu | Done | Hamburger + sidebar (now includes Services/About). |
| Skip to content | Done | Every page. |
| Loading / skeleton / hover states | Done | Curtain loader, hover states; skeleton N/A (static). |
| Scroll progress bar | Done | `#scroll-progress`. |
| Copy button | Done | Copy-email button. |
| Print stylesheet | Done | `@media print` in styles/shared/a11y. |
| Sticky header | Done | Fixed nav. |
| Form success/error states | N/A | No forms (mailto only) — nothing to fail. |
| Confirmation modals | N/A | Not needed. |
| Expandable FAQ | Done | Native `<details>` (works with JS off). |
| UX laws | Partial | Applied judgment (Fitts/Hick via clear CTAs, proximity in grids). Not a checkbox. |
| Avoid "vibe-coding" clichés | Done | No fake testimonials/metrics; removed nothing real. Custom cursor kept but only hides native cursor when JS runs. |

## 3. QA / Bug Fixes

| Item | Status | Notes |
|---|---|---|
| Fix horizontal scroll | Done | `overflow-x: clip` on html/body (keeps sticky working). |
| Broken links/buttons | Done | Checker + live HTTP crawl: 25 routes & 65 refs all 200. |
| Broken marquee icons | Done | 6 missing SVG symbols (`git/python/node/…`) were invisible; added. |
| Fix page titles/meta/footer links | Done | Done + footer legal links added. |
| Remove placeholder/unused | Done | Removed `scratch/` icon dumps; folded into index. |
| Clickable logo/numbers/emails | Done | mailto + tel-ready, external links `noopener`. |
| Conversion killers | Done | Single clear CTA per section; pricing N/A (services page invites a call). |

## 4. Security

| Item | Status | Notes |
|---|---|---|
| No secrets in repo/bundle | Done | Static site; nothing to leak. Verified no keys in bundle. |
| `noopener noreferrer` on external links | Done | Enforced by checker. |
| `security.txt` | Done | `.well-known/security.txt`. |
| HTTPS / HSTS / headers | Partial | Served by GitHub Pages (HTTPS on). Custom headers need a host that supports them; not possible on GH Pages. |
| Sanitize inputs / XSS / SQLi | N/A | No server, no DB, no user input beyond mailto. |
| Rate limiting / auth / RLS | N/A | No backend. |
| `.nojekyll` | Done | Prevents Jekyll processing (faster, serves dotfiles correctly). |

## 5. App Launch / Stores

This repo is a website, not a mobile app. App-store items (beta, SDK disclosure,
account deletion, etc.) apply to the separate app repos (MeshLearn/Sentry), not here.

## 6. Legal, Compliance & Accessibility

| Item | Status | Notes |
|---|---|---|
| Colour contrast (AA, both themes) | Done | Muted greys chosen ≥ 4.5:1 on both backgrounds. |
| Keyboard friendly / focus states | Done | `:focus-visible` + native interactive elements. |
| `prefers-reduced-motion` | Done | Honoured in CSS and in `hero-planes.js`. |
| Privacy/cookies policy | Done | No tracking cookies; policy says so. |
| Real business details | Done | Name, email, location in footer/about. |
| Remove unsupported claims / fake reviews | Done | Only real, verifiable claims retained. |

---

## Needs your input (cannot be automated)

1. **Google Analytics / Search Console** — add your IDs. Drop this before `</head>` once you have a GA4 measurement id:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
   <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-XXXXXXX');</script>
   ```
   and verify the domain in Search Console.
2. **Real photos / before-after / testimonials** — add genuine assets when available; the layout already has slots (logo grid, works cards).
3. **Domain DNS** — confirm `olabisiadigun.xyz` DNS still points at GitHub Pages after deploy.

## Verification commands

```bash
node scripts/check-site.mjs   # links, SEO, a11y, JSON-LD, ids
node --check script.js shared.js hero-planes.js
python3 scripts/generate-og.py   # regenerate share images
```
