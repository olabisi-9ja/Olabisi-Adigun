#!/usr/bin/env python3
"""Generate the site's social share images (Open Graph / Twitter cards).

Many social scrapers (Facebook, LinkedIn, iMessage, Slack) expect a 1200x630
JPG/PNG for og:image and do not reliably render WebP, so every shareable page
gets a raster card at exactly that size:

  assets/og-default.jpg      site-wide fallback (index, about, services, legal)
  assets/og-<slug>.jpg       one per project page
  assets/og-<slug>.jpg       one per blog post (typeset title card)

Project cards crop the existing product artwork and overlay a bottom gradient
plus a small label + title so the card reads on its own in a link preview.

Run from the repository root:

    python3 scripts/generate-og.py

Requires ImageMagick (`convert`). Re-running overwrites the output.
"""

import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"

W, H = 1200, 630
BG = "#151515"
INK = "#FDFBF7"
MUTED = "#9A9A9A"
ACCENT = "#346BF1"
BOLD = "DejaVu-Sans-Bold"
REG = "DejaVu-Sans"

# slug -> (source artwork, label, display title)
PROJECT_CARDS = {
    "og-sentry": ("sentry-og.webp", "CASE STUDY · AI FOR GOOD", "SENTRY"),
    "og-pulse": ("pulse-og.webp", "CASE STUDY · FINTECH", "PULSE"),
    "og-meshlearn": ("MeshLearn-og.webp", "PRODUCT · EDUCATION", "MESHLEARN"),
    "og-strike": ("strike-hero.webp", "CLIENT WORK · E-COMMERCE", "STRIKE"),
    "og-safe": ("safe-main.webp", "CLIENT WORK · CAMPUS SECURITY", "S.A.F.E."),
}

# slug -> (title, label)
TITLE_CARDS = {
    "og-why-i-built-meshlearn": ("Why I Built MeshLearn", "DRAFT · OFFLINE FIRST"),
    "og-building-greene-studios": ("Building Greene Studios", "DRAFT · AGENCY"),
    "og-ai-experiments": ("AI Experiments in the Browser", "DRAFT · MACHINE LEARNING"),
    "og-how-i-design-systems": ("How I Design Systems", "DRAFT · DESIGN SYSTEMS"),
    "og-launch-checklist": ("What I Check Before a Site Goes Live", "DRAFT · SHIPPING"),
}


def run(args):
    result = subprocess.run(["convert", *args], capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"convert failed:\n{result.stderr.strip()}")


def project_card(slug, source, label, title):
    src = ASSETS / source
    if not src.exists():
        sys.exit(f"missing source artwork: {src}")
    with tempfile.TemporaryDirectory() as td:
        base = f"{td}/base.png"
        overlay = f"{td}/ov.png"
        comp = f"{td}/comp.png"
        run([str(src), "-resize", f"{W}x{H}^", "-gravity", "center",
             "-extent", f"{W}x{H}", base])
        run(["-size", f"{W}x{H}", "xc:#0B0B0B",
             "(", "-size", f"{W}x{H}", "gradient:", "-rotate", "180", ")",
             "-alpha", "off", "-compose", "CopyOpacity", "-composite", overlay])
        run([base, overlay, "-compose", "over", "-composite", comp])
        run([comp,
             "-font", BOLD, "-pointsize", "24", "-fill", MUTED,
             "-annotate", "+70+510", label,
             "-font", BOLD, "-pointsize", "56", "-fill", INK,
             "-annotate", "+70+562", title,
             "-font", REG, "-pointsize", "26", "-fill", MUTED,
             "-annotate", "+70+600", "olabisiadigun.xyz",
             "-quality", "85", str(ASSETS / f"{slug}.jpg")])


def title_card(slug, title, label):
    size = 62 if len(title) < 32 else 50
    out = ASSETS / f"{slug}.jpg"
    run(["-size", f"{W}x{H}", f"xc:{BG}",
         "-fill", "rgba(52,107,241,0.10)",
         "-draw", f"circle {W - 130},110 {W - 130},430",
         "-font", BOLD, "-pointsize", "26", "-fill", ACCENT,
         "-annotate", "+106+182", label,
         "-fill", ACCENT, "-draw", "rectangle 70,150 78,232",
         "-font", BOLD, "-pointsize", str(size), "-fill", INK,
         "-annotate", "+70+330", title,
         "-stroke", "rgba(253,251,247,0.18)", "-strokewidth", "1",
         "-draw", f"line 70,{H - 120} {W - 70},{H - 120}", "+stroke",
         "-font", REG, "-pointsize", "30", "-fill", MUTED,
         "-annotate", f"+70+{H - 68}", "Olabisi Adigun  ·  olabisiadigun.xyz",
         "-quality", "86", str(out)])


def main():
    if not ASSETS.exists():
        sys.exit("run this from the repository root (python3 scripts/generate-og.py)")
    title_card("og-default", "Olabisi Adigun", "FULL-STACK ENGINEER · PRODUCT BUILDER")
    for slug, (source, label, title) in PROJECT_CARDS.items():
        project_card(slug, source, label, title)
    for slug, (title, label) in TITLE_CARDS.items():
        title_card(slug, title, label)
    written = sorted(ASSETS.glob("og-*.jpg"))
    for path in written:
        print(f"{path.stat().st_size:>8} B  {path.relative_to(ROOT)}")
    print(f"{len(written)} og images written")


if __name__ == "__main__":
    main()
