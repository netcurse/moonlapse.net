"""Trim the self-hosted fonts in static/fonts/ to what the site uses: the weights in fonts.css, and no
code ligatures (Cascadia's calt, which a terminal doesn't draw). Run once on Google's latin subsets;
they're already trimmed in the repo, so only if a font is replaced.

    pip install fonttools brotli
    python .agents/scripts/trim-fonts.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

FONTS = Path(__file__).resolve().parents[2] / "static/fonts"
# file: weights to keep (a pair is a range), and the layout features to keep
KEEP = {
    "qWcsB6-zq5zxD57cT5s916v3aDvbtw.woff2": ((400, 600), ["ccmp", "locl", "mark", "mkmk"]),  # Cascadia Code
    "JTUSjIg1_i6t8kCHKm459Wlhyw.woff2": ((400, 600), ["kern", "liga", "ccmp", "locl", "mark", "mkmk"]),  # Montserrat
    "8vIJ7ww63mVu7gt79mT7.woff2": ((500, 700), ["kern", "liga", "ccmp", "locl", "mark", "mkmk"]),  # Cinzel
}

for name, (weights, features) in KEEP.items():
    path = FONTS / name
    font = TTFont(path)
    options = subset.Options(layout_features=features, name_IDs=[1, 2, 4, 6, 13, 14], notdef_outline=True)
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=font.getBestCmap().keys())
    subsetter.subset(font)
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": weights})
    font.flavor = "woff2"
    font.save(path)
    print(name, path.stat().st_size)
