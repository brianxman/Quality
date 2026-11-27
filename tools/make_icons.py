#!/usr/bin/env python3
"""
make_icons.py - generate the app icons from code (so they can be re-created or
re-coloured without a design tool).

Why Python here? Image generation is a one-off build chore, and Python's Pillow
library does it in a few lines. React/JavaScript is used for the app itself;
each language is used where it fits best.

Run it from the project root:    python3 tools/make_icons.py
(needs:  pip install pillow)

Output (written to ./public and ./assets):
    public/icon-192.png          - web app icon
    public/icon-512.png          - web app icon (large)
    public/apple-touch-icon.png  - iPad "Add to Home Screen" icon (180x180)
    assets/icon-only.png         - 1024x1024 master icon for the native iOS app
                                   (used by the Capacitor assets tool - see README)
"""
from pathlib import Path

from PIL import Image, ImageDraw

TEAL = (15, 76, 92)
PAPER = (244, 241, 234)
WHITE = (255, 255, 255)


def draw_icon(size: int) -> Image.Image:
    """Draw a simple fishbone: a spine with three diagonal bones on each side."""
    img = Image.new("RGB", (size, size), TEAL)
    d = ImageDraw.Draw(img)

    s = size / 1024  # scale factor so the same drawing works at any size
    stroke = max(2, round(34 * s))

    # Spine (horizontal backbone) running into a "head" circle on the right.
    y = size / 2
    d.line([(150 * s, y), (780 * s, y)], fill=PAPER, width=stroke)
    cx, r = 890 * s, 92 * s  # head circle: centre x and radius
    d.ellipse([cx - r, y - r, cx + r, y + r], fill=WHITE)

    # Three bones above and three below, angled back towards the tail.
    reach = 250 * s  # how far each bone extends from the spine
    for x in (330, 500, 670):
        d.line([(x * s, y), ((x - 120) * s, y - reach)], fill=PAPER, width=stroke)
        d.line([(x * s, y), ((x - 120) * s, y + reach)], fill=PAPER, width=stroke)

    return img


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    public, assets = root / "public", root / "assets"
    public.mkdir(exist_ok=True)
    assets.mkdir(exist_ok=True)

    targets = {
        public / "icon-192.png": 192,
        public / "icon-512.png": 512,
        public / "apple-touch-icon.png": 180,
        assets / "icon-only.png": 1024,
    }
    for path, size in targets.items():
        draw_icon(size).save(path)
        print(f"wrote {path.relative_to(root)} ({size}x{size})")


if __name__ == "__main__":
    main()
