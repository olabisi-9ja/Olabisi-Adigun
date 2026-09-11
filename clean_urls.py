#!/usr/bin/env python3
"""Generate clean (extensionless) URLs for GitHub Pages.

GitHub Pages serves plain static files: no .htaccess, no _redirects, no rewrite
engine. So a pretty URL like /works/pulse/ only resolves if the page physically
lives at works/pulse/index.html -- stripping ".html" out of hrefs on its own
just produces 404s.

This script does the whole job:

  1. moves  works/<name>.html  ->  works/<name>/index.html
     rewriting every relative reference one directory level deeper
     ("../shared.css" -> "../../shared.css", "../#products" -> "../../#products")
  2. writes a redirect stub back at works/<name>.html so existing links,
     bookmarks and search results still reach the page (and end up on the
     clean URL in the address bar)
  3. rewrites the links in index.html to the directory form

Run it from the repository root:

    python3 clean_urls.py

It is safe to re-run: pages already in directory form are left alone and only
the redirect stubs are regenerated.
"""

import os
import re
import sys

DIRS = ("works", "blog")
SITE = "https://olabisiadigun.xyz"
ROOT_INDEX = "index.html"

STUB = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<link rel="canonical" href="{absolute}">
<meta http-equiv="refresh" content="0; url={path}">
<script>location.replace("{path}");</script>
</head>
<body>
<p>This page moved to <a href="{path}">{path}</a>.</p>
</body>
</html>
"""


def title_of(html, fallback):
    m = re.search(r"<title>(.*?)</title>", html, re.S)
    return m.group(1).strip() if m else fallback


def deepen(html):
    """Push every relative reference one directory level deeper."""
    return html.replace('"../', '"../../')


def slash_subpages(html):
    """Give extensionless works/ and blog/ links a trailing slash."""
    return re.sub(
        r'href="((?:\.\./)+)(works|blog)/([a-z0-9-]+)"',
        r'href="\1\2/\3/"',
        html,
    )


def move_page(directory, stem):
    src = os.path.join(directory, stem + ".html")
    with open(src, encoding="utf-8") as f:
        html = f.read()

    dest_dir = os.path.join(directory, stem)
    os.makedirs(dest_dir, exist_ok=True)
    with open(os.path.join(dest_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(slash_subpages(deepen(html)))
    os.remove(src)
    return title_of(html, stem)


def write_stub(directory, stem, title):
    # root-relative so the stub also works in local preview; canonical has to
    # stay absolute for crawlers
    path = f"/{directory}/{stem}/"
    with open(os.path.join(directory, stem + ".html"), "w", encoding="utf-8") as f:
        f.write(STUB.format(title=title, path=path, absolute=SITE + path))


def main():
    if not os.path.isfile(ROOT_INDEX):
        sys.exit("run clean_urls.py from the repository root")

    moved, stubs = [], []

    for directory in DIRS:
        if not os.path.isdir(directory):
            continue
        # a page already migrated lives in <stem>/index.html; the flat
        # <stem>.html beside it is the redirect stub, so it must never be
        # treated as a source page again
        migrated = {
            d
            for d in os.listdir(directory)
            if os.path.isfile(os.path.join(directory, d, "index.html"))
        }
        flat = {
            p[:-5]
            for p in os.listdir(directory)
            if p.endswith(".html") and p != "index.html"
        }

        for stem in sorted(flat - migrated):
            title = move_page(directory, stem)
            write_stub(directory, stem, title)
            moved.append(f"{directory}/{stem}/")
            stubs.append(f"{directory}/{stem}.html")

        for stem in sorted(migrated):
            with open(
                os.path.join(directory, stem, "index.html"), encoding="utf-8"
            ) as f:
                write_stub(directory, stem, title_of(f.read(), stem))
            if stem not in flat:
                stubs.append(f"{directory}/{stem}.html")

    with open(ROOT_INDEX, encoding="utf-8") as f:
        home = f.read()
    rewritten = home
    for directory in DIRS:
        rewritten = re.sub(
            rf'href="{directory}/([a-z0-9-]+)\.html"',
            rf'href="{directory}/\1/"',
            rewritten,
        )
    if rewritten != home:
        with open(ROOT_INDEX, "w", encoding="utf-8") as f:
            f.write(rewritten)

    print(f"moved   : {', '.join(moved) or '(nothing new)'}")
    print(f"stubs   : {', '.join(stubs)}")
    print(f"rewrote : {ROOT_INDEX} links -> directory form")


if __name__ == "__main__":
    main()
