# Screenshots

How the game screenshots in `assets/images/screenshots/` are made: the client running in a terminal of exactly 123×38, and **F12** to save what's on screen as an SVG in the site's window frame, in the game's own colours. The game repo's README shows the same files (its `res/screenshots/`).

Linux with Wayland, `foot`, `tmux` and Python 3.11 or later.

## Taking them

1. **Get the client** you want to show: normally the latest release (`gh release download <version> --repo netcurse/moonlapse.net -p '*linux-x64*'`, then unpack it), which plays on the live server. A screenshot should never show something players don't have yet.
2. **Open the terminal**: `.agents/scripts/screenshots/start.sh <the client's folder>`. It's foot at 123×38, in the game's colours, running a tmux of its own with no status line. Run it again to get back to the same session.
3. **Play** (`./moonlapse`) until the screen shows what you want.
4. **Press F12.** It captures the screen as it is now, then asks for a name at the bottom of the window: type a kebab-case one for what it shows (`fishing-at-morningside`) and press ENTER. It's saved as `assets/images/screenshots/<name>.svg`, replacing one of that name ("Replaced"). ESC saves nothing. Errors are in `$XDG_RUNTIME_DIR/moonlapse-screenshot.log`.

Don't resize the window: `tput cols; tput lines` in it should say 123 and 38.

Look at a screenshot before it goes up. The site is public: nothing dev-only (admin commands, dev sign-in), and nothing personal (the title screen shows the email address you signed in with).

## What's here

| File | |
|---|---|
| `start.sh` | Opens the terminal: foot (`foot.ini`) at 123×38, running tmux (`tmux.conf`) |
| `foot.ini` | The game's palette (`data/themes/moonlapse.toml`, with colour 0 as the window's background), so the terminal looks like the screenshot will |
| `tmux.conf` | No status line, F12, and a terminal the client can set its own colours in (`xterm-256color`) |
| `shot.sh` | F12: `capture` (`tmux capture-pane -e`, then a prompt for the name) and `save <name>` |
| `ansi-svg.py` | Draws a capture as the SVG. By hand: `python3 .agents/scripts/screenshots/ansi-svg.py <capture> <svg>` (the last capture is `$XDG_RUNTIME_DIR/moonlapse-screenshot.ansi`) |

## How the SVG is drawn

`ansi-svg.py` draws the capture itself, the way the terminal shows it:

- **The frame** is the one every screenshot has (they were exported from boron.sh until 0.7.0): a 1155×963 window with a title bar and its three dots, rounded corners and a shadow, on 30px of transparent padding: 1215×1023 in all. The cells are 9×23px, the font 15px.
- **The colours** are the game's: `data/themes/moonlapse.toml`, with colour 0 as the window's background (the game paints its background with colour 0) and its `[window]` for the frame. Colours 8–17 are the client's own, which it sets itself (`init_color`): grey, charcoal, oak, six purples and a bright white. **Bold text in colours 0–7, or the default, is shown in the bright colour** (7 becomes 15), as terminals show it, and the client's bright colours are purples: so bold is the game's purple accent.
- **Box-drawing lines** are drawn as lines, so they always join up. The terminal's line-drawing set (SO/SI, `ESC ( 0`) is read as box-drawing characters.
- **The text** is Cascadia Code, the site's terminal font, embedded (the latin subset, a variable font, so bold is weight 600). Anything else (the moon phase's emoji) falls back to the viewer's fonts.

Why not boron.sh: a capture holds colour *numbers*, and boron.sh paints them with its own theme. The client's colours, which it redefines for itself, came out in the theme's, bold wasn't the purple the game shows, and the black the game paints behind every cell came out as grey-blue slabs.
