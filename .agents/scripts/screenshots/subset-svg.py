"""Cut the font embedded in screenshots down to the glyphs each one shows (ansi-svg.py does this for
new ones). Each keeps its own font: some older ones have box-drawing glyphs the site's lacks.

    python3 .agents/scripts/screenshots/subset-svg.py assets/images/screenshots/*.svg
"""
import base64
import html
import io
import re
import sys
from pathlib import Path

from subset_font import subset_font

FONT = re.compile(r'(data:font/woff2;base64,)([A-Za-z0-9+/=]+)')

for name in sys.argv[1:]:
    path = Path(name)
    svg = path.read_text()
    text = "".join(html.unescape(t) for t in re.findall(r"<text\b[^>]*>(.*?)</text>", svg, re.S))
    path.write_text(FONT.sub(lambda m: m.group(1) + subset_font(text, io.BytesIO(base64.b64decode(m.group(2)))), svg, count=1))
