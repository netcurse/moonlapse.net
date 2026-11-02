"""Cut Cascadia Code down to the glyphs one screenshot shows, weights 400 to 600 (an SVG in an <img>
can't share a font, so each carries its own: the whole font would be most of its size).
Needs fontTools: pip install fonttools brotli
"""
import base64
import io
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SITE = Path(__file__).resolve().parents[3]
FONT = SITE / "static/fonts/qWcsB6-zq5zxD57cT5s916v3aDvbtw.woff2"  # Cascadia Code, variable, latin


def subset_font(text, source=FONT):
    """The font (a file, by default Cascadia Code) for this text, as base64 WOFF2. No ligatures: a
    terminal doesn't draw them."""
    font = TTFont(source)
    options = subset.Options(layout_features=[], hinting=True, name_IDs=[1, 2], notdef_outline=True)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    if "fvar" in font:
        font = instancer.instantiateVariableFont(font, {"wght": (400, 600)})
    font.flavor = "woff2"
    out = io.BytesIO()
    font.save(out)
    return base64.b64encode(out.getvalue()).decode()
