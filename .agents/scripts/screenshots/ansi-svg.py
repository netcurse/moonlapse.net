#!/usr/bin/env python3
"""Draws a captured game screen (text with ANSI colour codes, e.g. from tmux's capture-pane -e)
as an SVG screenshot in the site's window frame, in the game's own colours. F12 in start.sh's
terminal runs it (README.md, beside it); by hand:

    python3 .agents/scripts/screenshots/ansi-svg.py capture.ansi assets/images/screenshots/<name>.svg

The frame and layout are boron.sh's, as every screenshot so far has them (sync-from-game):
123x38 cells of 9x23px, font size 15, in a 1155x963 window with 30px of padding for its shadow,
1215x1023 in all. The colours are data/themes/moonlapse.toml's, with colour 0 as the window's
background (the game paints its background with colour 0, as the gameplay recording assumes),
and the client's own colours for 8-17, which it redefines for itself (init_color), so a terminal's
bright colours never show. Bold text in colours 0-7 (or the default, as 7) is shown in the bright
colour, as terminals show it: so bold is the client's purple. The terminal's line-drawing set
(SO/SI, ESC ( 0) is read as box-drawing characters. Box-drawing lines are drawn as lines, so they always join up. The text
is Cascadia Code, the site's terminal font, embedded (the latin subset; anything else falls back
to the viewer's monospace font).
"""

import argparse
import base64
import html
import re
import sys
import tomllib
import unicodedata
from pathlib import Path

SITE = Path(__file__).resolve().parents[3]
FONT = SITE / "static/fonts/qWcsB6-zq5zxD57cT5s916v3aDvbtw.woff2"  # Cascadia Code, variable, latin

COLS, ROWS = 123, 38
CELL_W, CELL_H, FONT_SIZE = 9, 23, 15
PAD = 30                      # transparent, for the shadow
WIN_W, WIN_H = 1155, 963
LEFT, TOP = 54, 95            # the first cell's top left
BASELINE = 16.5               # from a cell's top
TITLE_BAR = 40


def hexrgb(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))


def palette():
    theme = tomllib.loads((SITE / "data/themes/moonlapse.toml").read_text())
    names = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"]
    window = theme["window"]
    pal = {i: hexrgb(theme["colors"]["normal"][n]) for i, n in enumerate(names)}
    pal[0] = hexrgb(window["background"])
    for i, n in enumerate(names):
        pal[8 + i] = hexrgb(theme["colors"]["bright"][n])
    # the client's own colours (init_color, in thousandths): grey, charcoal, oak, six purples
    # from deep violet to lilac, and a bright white
    own = [(500, 500, 500), (250, 250, 250), (772, 631, 491)]
    own += [(330 + 110 * i, 120 + 90 * i, 560 + 85 * i) for i in range(6)]
    own += [(1000, 1000, 1000)]
    for i, rgb in enumerate(own):
        pal[8 + i] = tuple(round(v * 255 / 1000) for v in rgb)
    return pal, hexrgb(theme["colors"]["primary"]["foreground"]), window


def xterm256(n):
    if n < 16:
        return None
    if n < 232:
        n -= 16
        steps = [0, 95, 135, 175, 215, 255]
        return steps[n // 36], steps[n // 6 % 6], steps[n % 6]
    v = 8 + 10 * (n - 232)
    return v, v, v


class Style:
    __slots__ = ("fg", "bg", "bold", "dim", "reverse")

    def __init__(self):
        self.fg = self.bg = None  # a palette index, an (r, g, b), or None for the default
        self.bold = self.dim = self.reverse = False

    def copy(self):
        s = Style()
        s.fg, s.bg, s.bold, s.dim, s.reverse = self.fg, self.bg, self.bold, self.dim, self.reverse
        return s


def apply_sgr(style, params):
    nums = [int(p) if p else 0 for p in params.split(";")] if params else [0]
    i = 0
    while i < len(nums):
        n = nums[i]
        if n == 0:
            style = Style()
        elif n == 1:
            style.bold = True
        elif n == 2:
            style.dim = True
        elif n == 22:
            style.bold = style.dim = False
        elif n == 7:
            style.reverse = True
        elif n == 27:
            style.reverse = False
        elif 30 <= n <= 37:
            style.fg = n - 30
        elif 90 <= n <= 97:
            style.fg = n - 90 + 8
        elif n == 39:
            style.fg = None
        elif 40 <= n <= 47:
            style.bg = n - 40
        elif 100 <= n <= 107:
            style.bg = n - 100 + 8
        elif n == 49:
            style.bg = None
        elif n in (38, 48) and i + 1 < len(nums):
            if nums[i + 1] == 5 and i + 2 < len(nums):
                value, i = nums[i + 2], i + 2
            elif nums[i + 1] == 2 and i + 4 < len(nums):
                value, i = tuple(nums[i + 2:i + 5]), i + 4
            else:
                value = None
            if n == 38:
                style.fg = value
            else:
                style.bg = value
        i += 1
    return style


def width(ch):
    return 2 if unicodedata.east_asian_width(ch) in ("W", "F") else 1


def parse(text):
    """The screen as rows of cells: (char, style), a wide character followed by None."""
    esc = re.compile(r"\x1b\[([0-9;]*)m|\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\([0B]|\x1b.")
    rows, line_drawing = [], False
    for line in text.split("\n")[:ROWS]:
        style, cells, i = Style(), [], 0
        while i < len(line):
            if line[i] == "\x1b":
                m = esc.match(line, i)
                if m:
                    if m.group(1) is not None:
                        style = apply_sgr(style, m.group(1))
                    elif m.group(0) in ("\x1b(0", "\x1b(B"):
                        line_drawing = m.group(0) == "\x1b(0"
                    i = m.end()
                    continue
            ch = line[i]
            i += 1
            if ch in "\x0e\x0f":
                line_drawing = ch == "\x0e"
                continue
            if ch == "\r" or ord(ch) < 32:
                continue
            if line_drawing:
                ch = ACS.get(ch, ch)
            cells.append((ch, style.copy()))
            if width(ch) == 2:
                cells.append(None)
        rows.append(cells[:COLS])
    while len(rows) < ROWS:
        rows.append([])
    return rows


# the terminal's line-drawing set (VT100), as box-drawing characters
ACS = dict(zip("lkmjqxtuvwnaf~`,+.-0hgiopyz{|}rs",
               "┌┐└┘─│├┤┴┬┼▒°·◆←→↓↑█▒±▤⎺⎻≤≥π≠£⎼⎽"))

# box drawing: which way each character's lines go from the cell's centre
BOX = {
    "─": "lr", "│": "ud", "┌": "rd", "┐": "ld", "└": "ru", "┘": "lu",
    "├": "udr", "┤": "udl", "┬": "lrd", "┴": "lru", "┼": "lrud",
    "╴": "l", "╶": "r", "╵": "u", "╷": "d",
}


def render(rows, title):
    pal, default_fg, window = palette()
    win_bg = hexrgb(window["background"])

    def colour(value, default):
        if value is None:
            return default
        if isinstance(value, tuple):
            return value
        return pal.get(value) or xterm256(value) or default

    def css(rgb):
        return "#%02x%02x%02x" % rgb

    def blend(a, b, t):
        return tuple(round(x + (y - x) * t) for x, y in zip(a, b))

    rects, texts, lines = [], [], []
    for r, cells in enumerate(rows):
        y = TOP + r * CELL_H
        run = None  # (start col, [chars], fg, bg, bold)

        def flush():
            if run and "".join(run[1]).strip():
                start, chars, fg, _, bold = run
                n = sum(width(c) for c in chars)
                weight = ' font-weight="600"' if bold else ""
                texts.append(
                    f'<text x="{LEFT + start * CELL_W}" y="{y + BASELINE}" fill="{css(fg)}"{weight} xml:space="preserve" '
                    f'textLength="{n * CELL_W}" lengthAdjust="spacing">{html.escape("".join(chars))}</text>')

        for c, cell in enumerate(cells):
            if cell is None:
                continue
            ch, st = cell
            fg_value = st.fg
            if st.bold and (fg_value is None or (isinstance(fg_value, int) and fg_value < 8)):
                # bold is shown in the bright colour (white, or the default, becomes 15), and the
                # client's bright colours are its own: so bold text is its purple accent
                fg_value = (7 if fg_value is None else fg_value) + 8
            fg = colour(fg_value, default_fg)
            bg = colour(st.bg, None) if st.bg is not None else None
            if st.reverse:
                fg, bg = (bg or win_bg), fg
            if st.dim:
                fg = blend(fg, bg or win_bg, 0.45)
            span = width(ch)
            if bg is not None and bg != win_bg:
                rects.append((c, r, span, css(bg)))
            if ch in BOX:
                cx, cy = LEFT + c * CELL_W + CELL_W / 2, y + CELL_H / 2
                ends = {"l": (LEFT + c * CELL_W, cy), "r": (LEFT + (c + 1) * CELL_W, cy),
                        "u": (cx, y), "d": (cx, y + CELL_H)}
                for d in BOX[ch]:
                    lines.append((cx, cy, *ends[d], css(fg)))
                flush()
                run = None
                continue
            key = (fg, bg, st.bold)
            if run and (run[2], run[3], run[4]) == key and run[0] + sum(width(x) for x in run[1]) == c:
                run[1].append(ch)
            else:
                flush()
                run = (c, [ch], fg, bg, st.bold)
        flush()

    # merge each row's neighbouring background cells of one colour
    merged = []
    for c, r, span, fill in rects:
        if merged and merged[-1][1] == r and merged[-1][3] == fill and merged[-1][0] + merged[-1][2] == c:
            merged[-1][2] += span
        else:
            merged.append([c, r, span, fill])

    font = base64.b64encode(FONT.read_bytes()).decode()
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIN_W + 2 * PAD}" height="{WIN_H + 2 * PAD}" '
        f'viewBox="0 0 {WIN_W + 2 * PAD} {WIN_H + 2 * PAD}">',
        "<defs><style>@font-face{font-family:\"Moonlapse Mono\";font-weight:200 700;"
        f'src:url("data:font/woff2;base64,{font}") format("woff2")}}'
        "text{font-family:\"Moonlapse Mono\",ui-monospace,monospace;font-size:%dpx;white-space:pre}</style>" % FONT_SIZE,
        '<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="18" '
        'stdDeviation="20" flood-color="#000000" flood-opacity="0.45"/></filter>',
        f'<clipPath id="window"><rect x="{PAD}" y="{PAD}" width="{WIN_W}" height="{WIN_H}" rx="10"/></clipPath></defs>',
        f'<rect x="{PAD}" y="{PAD}" width="{WIN_W}" height="{WIN_H}" rx="10" fill="{window["background"]}" filter="url(#shadow)"/>',
        '<g clip-path="url(#window)">',
        f'<rect x="{PAD}" y="{PAD + TITLE_BAR}" width="{WIN_W}" height="1" fill="{window["divider"]}"/>',
        f'<circle cx="{PAD + 30}" cy="{PAD + 20.5}" r="6" fill="{window["close"]}"/>',
        f'<circle cx="{PAD + 50.4}" cy="{PAD + 20.5}" r="6" fill="{window["minimise"]}"/>',
        f'<circle cx="{PAD + 70.8}" cy="{PAD + 20.5}" r="6" fill="{window["zoom"]}"/>',
        f'<text x="{PAD + WIN_W / 2}" y="{PAD + 20.5}" fill="{window["title"]}" text-anchor="middle" '
        f'dominant-baseline="central" style="font-size:12.75px">{html.escape(title)}</text>',
    ]
    for c, r, span, fill in merged:
        out.append(f'<rect x="{LEFT + c * CELL_W}" y="{TOP + r * CELL_H}" width="{span * CELL_W}" height="{CELL_H}" fill="{fill}"/>')
    out.append('<g stroke-width="1" stroke-linecap="square" shape-rendering="crispEdges">')
    for x1, y1, x2, y2, stroke in lines:
        out.append(f'<line x1="{x1:g}" y1="{y1:g}" x2="{x2:g}" y2="{y2:g}" stroke="{stroke}"/>')
    out.append("</g>")
    out.extend(texts)
    out.append("</g></svg>")
    return "\n".join(out) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("capture", help="the screen, as text with ANSI colour codes")
    parser.add_argument("svg", help="where to write the screenshot")
    parser.add_argument("--title", default="MoonlapseMUD", help="the window's title (MoonlapseMUD)")
    args = parser.parse_args()
    rows = parse(Path(args.capture).read_text(encoding="utf-8"))
    widths = {sum(1 for x in row if x is not None) + sum(1 for x in row if x is None) for row in rows if row}
    if widths and max(widths) != COLS:
        print(f"warning: the capture is {max(widths)} columns wide, not {COLS}", file=sys.stderr)
    Path(args.svg).write_text(render(rows, args.title), encoding="utf-8")


if __name__ == "__main__":
    main()
