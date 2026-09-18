#!/usr/bin/env node
/* Static site health checker for the portfolio.
   Run from the repo root:  node scripts/check-site.mjs
   Verifies links/assets resolve, SEO + a11y basics, JSON-LD validity and that
   known-bad references (removed assets, scratch files) are gone. Exits 1 on errors. */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SITE = 'https://olabisiadigun.xyz';

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', '.verify'].includes(e.name)) continue;
      walk(p);
    } else if (e.name.endsWith('.html')) htmlFiles.push(p);
  }
})(ROOT);

let errors = [];
let warnings = [];
const err = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);

function localExists(fromFile, href) {
  // strip query/hash
  let h = href.split('#')[0].split('?')[0];
  if (!h) return true; // same-page anchor
  const base = h.startsWith('/') ? ROOT : path.dirname(fromFile);
  if (h.startsWith('/')) h = h.slice(1);
  let target = path.resolve(base, decodeURIComponent(h));
  if (!target.startsWith(ROOT)) return null; // outside repo
  if (fs.existsSync(target) && fs.statSync(target).isFile()) return true;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    return fs.existsSync(path.join(target, 'index.html'));
  }
  // directory without trailing slash
  if (fs.existsSync(target + '/index.html')) return true;
  return false;
}

const KNOWN_BAD = ['assets/pulse-og.png', 'Screenshot 2026', 'scratch/', 'three.min.js', 'cdnjs.cloudflare'];

for (const f of htmlFiles) {
  const rel = path.relative(ROOT, f);
  const html = fs.readFileSync(f, 'utf8');
  const is404 = rel === '404.html';
  const isStub = html.includes('http-equiv="refresh"'); // redirect stub
  if (isStub) {
    // stubs must point somewhere real and stay out of the index
    const m = html.match(/url=([^">]+)["<]/);
    if (m && localExists(f, m[1]) === false) err(rel, `stub redirects to missing page: ${m[1]}`);
    if (!/name="robots"[^>]*noindex/.test(html)) warn(rel, 'redirect stub should carry noindex');
    continue;
  }

  // known-bad references
  for (const bad of KNOWN_BAD) {
    if (html.includes(bad)) err(rel, `contains removed/forbidden reference: ${bad}`);
  }

  // SEO basics
  if (!/<title>[^<]+<\/title>/.test(html)) err(rel, 'missing <title>');
  if (!/name="description"/.test(html) && !is404) err(rel, 'missing meta description');
  if (!/rel="canonical"/.test(html) && !is404) err(rel, 'missing canonical');
  if (!/property="og:image"/.test(html) && !is404) err(rel, 'missing og:image');
  if (!/lang="/.test(html)) err(rel, 'missing lang attribute');

  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1 && !is404) warn(rel, `h1 count = ${h1}`);

  // JSON-LD validity
  const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  for (const m of ldBlocks) {
    try { JSON.parse(m[1]); } catch (e) { err(rel, `invalid JSON-LD: ${e.message}`); }
  }

  // images: alt + sizing
  for (const img of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = img[0];
    if (!/alt="[^"]*"/.test(tag)) err(rel, `img without alt: ${tag.slice(0, 80)}`);
    if (!/width=/.test(tag) && !/class="(logo|avatar|tool-icon)/.test(tag)) {
      // only warn for content images that are not CSS-cropped
      if (/loading="lazy"|fetchpriority/.test(tag)) warn(rel, `content img missing width/height: ${tag.slice(0, 60)}`);
    }
  }

  // external links need noopener
  for (const a of html.matchAll(/<a\b[^>]*>/g)) {
    const tag = a[0];
    if (/target="_blank"/.test(tag) && !/rel="[^"]*noopener/.test(tag)) {
      err(rel, `target=_blank without noopener: ${tag.slice(0, 80)}`);
    }
  }

  // internal links + assets resolve
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]);
  for (const r of refs) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(r)) continue;
    const ok = localExists(f, r);
    if (ok === false) err(rel, `broken local reference: ${r}`);
  }

  // same-page anchors
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    const id = m[1];
    if (!new RegExp(`id="${id}"`).test(html)) warn(rel, `same-page anchor #${id} has no matching id`);
  }
}

// sitemap pages exist
const sm = path.join(ROOT, 'sitemap.xml');
if (fs.existsSync(sm)) {
  const smx = fs.readFileSync(sm, 'utf8');
  for (const m of smx.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const u = m[1].replace(SITE, '');
    const relDir = u === '/' ? '' : u.replace(/^\//, '');
    const target = relDir ? path.join(ROOT, relDir, 'index.html') : path.join(ROOT, 'index.html');
    if (!fs.existsSync(target)) err('sitemap.xml', `listed page missing on disk: ${u}`);
  }
} else err('root', 'missing sitemap.xml');

if (!fs.existsSync(path.join(ROOT, 'robots.txt'))) err('root', 'missing robots.txt');
if (!fs.existsSync(path.join(ROOT, 'llms.txt'))) err('root', 'missing llms.txt');
if (!fs.existsSync(path.join(ROOT, '404.html'))) err('root', 'missing 404.html');

// Cross-check that ids referenced by the page JS actually exist (avoids null crashes).
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const js of ['script.js', 'hero-planes.js']) {
  const p = path.join(ROOT, js);
  if (!fs.existsSync(p)) { err('root', `missing ${js}`); continue; }
  const code = fs.readFileSync(p, 'utf8');
  for (const m of code.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (!new RegExp(`id="${m[1]}"`).test(indexHtml)) err(js, `references missing #${m[1]} in index.html`);
  }
}

console.log(`Checked ${htmlFiles.length} HTML files.\n`);
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  warnings.slice(0, 40).forEach(w => console.log('   ' + w));
  console.log('');
}
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  errors.forEach(e => console.log('  ✗ ' + e));
  process.exit(1);
} else {
  console.log('✔ No blocking errors.');
}
