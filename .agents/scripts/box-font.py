"""Make static/fonts/cascadia-box.woff2: Cascadia Mono's box-drawing glyphs, stretched to fill a
line of the gameplay recording (line height 1.5), so its lines join up.

Fonts draw box glyphs as tall as the font's own line (1.16em for Cascadia). The player draws
block elements itself but leaves box drawing to the font, so at line height 1.5 the vertical
lines have gaps. This moves each glyph's top and bottom edges out to the line's edges (plus a
little overlap); the strokes in the middle stay where they are.

    pip install fonttools brotli
    python .agents/scripts/box-font.py CascadiaMono-Regular.ttf static/fonts/cascadia-box.woff2

CascadiaMono-Regular.ttf is in the release zip at github.com/microsoft/cascadia-code
(ttf/static/). If the recording's line height changes (terminalLineHeight in
layouts/_partials/gameplay_cast.html), change LINE_HEIGHT and run this again.
"""
import sys

from fontTools import subset
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

LINE_HEIGHT = 1.5
OVERLAP = 20  # font units past each edge, so rows don't show a hairline seam

# Box drawing (U+2500–257F) without the dashed lines and diagonals, which don't reach the edges
CODEPOINTS = (
    list(range(0x2500, 0x2504))
    + list(range(0x250C, 0x254C))
    + list(range(0x2550, 0x2571))
    + list(range(0x2574, 0x2580))
)

src, out = sys.argv[1], sys.argv[2]
font = TTFont(src)

opts = subset.Options()
opts.flavor = "woff2"
opts.layout_features = []
opts.name_IDs = ["*"]
opts.notdef_outline = False
opts.hinting = False
sub = subset.Subsetter(opts)
sub.populate(unicodes=CODEPOINTS)
sub.subset(font)

upm = font["head"].unitsPerEm
os2 = font["OS/2"]
ascent, descent = os2.sTypoAscender, -os2.sTypoDescender
leading = (LINE_HEIGHT * upm - (ascent + descent)) / 2
top = round(ascent + leading) + OVERLAP
bottom = -round(descent + leading) - OVERLAP

glyphs = font.getGlyphSet()
glyf = font["glyf"]
outlines = {}
for name in font.getGlyphOrder():
    rec = DecomposingRecordingPen(glyphs)
    glyphs[name].draw(rec)
    if rec.value:
        outlines[name] = rec.value
ys = [pt[1] for ops in outlines.values() for _, args in ops for pt in args]
old_top, old_bottom = max(ys), min(ys)


def move(pt):
    x, y = pt
    if y == old_top:
        y = top
    elif y == old_bottom:
        y = bottom
    return (x, y)


for name, ops in outlines.items():
    pen = TTGlyphPen(None)
    for op, args in ops:
        getattr(pen, op)(*[move(a) for a in args])
    glyf[name] = pen.glyph()
    glyf[name].recalcBounds(glyf)

# Its own family name, as the OFL asks of modified versions
for rec in font["name"].names:
    if rec.nameID in (1, 4, 16):
        rec.string = "Cascadia Box"
    elif rec.nameID == 6:
        rec.string = "CascadiaBox"

font.flavor = "woff2"
font.save(out)
print(f"{len(CODEPOINTS)} glyphs, edges {old_bottom}..{old_top} -> {bottom}..{top}")
