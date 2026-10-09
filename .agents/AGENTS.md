# moonlapse.net — Agent Instructions

The website for MoonlapseMUD: home, download, how to play, about. Hugo + PaperMod, deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`. The client downloads are this repo's GitHub releases.

This file lives at `.agents/AGENTS.md`, so **edit this one**: the root `AGENTS.md` is a symlink to it, and `CLAUDE.md` imports it (`@.agents/AGENTS.md`). Skills live in `.agents/skills/` (`.claude/skills` is a symlink to it). On Windows, git checks symlinks out as text files holding the path unless Developer Mode is on and `core.symlinks` is true.

## This repo is public

Everything committed here (files, comments, commit messages) is public. The game's repo, `netcurse/moonlapse`, is private.

- **Don't publish game internals**: no paths into the game repo, server stack, infrastructure, hostnames other than `play.moonlapse.net`, `api.moonlapse.net` (the public status endpoint) and `auth.moonlapse.net` (the sign-in service and account page), or DNS in the site, README or comments. Agent files (this one, skills) may refer to the game repo, since they're for working on the site.
- **Tone**: plain and matter-of-fact. Short comments, only where something isn't obvious. No cute asides.
- **Commits**: short imperative subject (`Add the 0.2.0 release`), a body only when it's needed. **No `Co-Authored-By` trailer.**

## Skills

`.agents/skills/<name>/SKILL.md`:

| Skill | When |
|---|---|
| `release-client` | Check a release reached the site, or point the site at one by hand if the workflow didn't |
| `check-site` | After any change you can see: build it and look at it, desktop and phone |
| `sync-from-game` | The game changed: controls, commands, features, platforms, screenshots |

## Build

```sh
hugo server            # http://localhost:1313
hugo --minify          # into public/ (ignored)
```

- CI pins Hugo **0.163.3** extended (`HUGO_VERSION` in the workflow). Locally, 0.146+ extended and Go (for the theme module).
- PaperMod is a Hugo module (`go.mod`), not vendored: `hugo mod get -u github.com/adityatelange/hugo-PaperMod` to update it. `_vendor/` is ignored; `hugo mod vendor` is handy for reading the theme's templates, delete it afterwards.
- A clean build prints two deprecation warnings (`.Language.LanguageDirection`, `.Language.LanguageCode`), both from PaperMod's own templates. Anything else is ours to fix.

## Layout

| Path | What |
|---|---|
| `content/_index.md` | The homepage's copy: tagline, features, gallery, steps (front matter), and the intro (body) |
| `content/{download,guide,about}.md` | The other pages |
| `content/{privacy,terms}.md` | The privacy policy and terms of use, linked from the footer. Google's OAuth consent screen links the privacy policy, and Google requires it to stay accurate: when the game starts keeping, logging or sharing something new (or stops), update it and its date |
| `data/release.toml` | The current client: `version`, `date`, `available`, URL templates, per-platform `id`/`ext`/`requires` |
| `data/themes/moonlapse.toml` | The palette (kitty/alacritty format), sampled from the client, plus `[ui]` and `[window]` (the screenshots' window frame, for the recording's CSS copy of it) |
| `assets/css/extended/custom.css` | **All** the CSS. PaperMod loads it after its own |
| `assets/images/logo.png` | The logo (trimmed, transparent). The header and footer crop its left 405×405 for the moon emblem |
| `assets/images/logo-hero.png` | The same logo flattened onto black, for the homepage: drawn with `mix-blend-mode: screen`, so it needs no alpha and is a third of the size. Regenerate it from `logo.png` with `magick logo.png -background black -flatten -colorspace gray -strip logo-hero.png` |
| `assets/images/screenshots/<name>.svg` | Game screenshots: a 123×38 terminal exported from boron.sh with fixed settings (`sync-from-game` has them), kebab-case names saying what they show (`fishing-at-morningside`). Each brings its own window frame and shadow (`sync-from-game`) |
| `assets/images/raster/<name>.png` | PNG copies of a few screenshots, for structured data (search engines don't take SVG). Every file here goes in the homepage's schema |
| `assets/casts/gameplay-trimmed.cast` | The homepage's gameplay recording (asciicast v2, 110×38). Only the trimmed one is committed: the full recording shows a dev-only sign-in |
| `assets/vendor/asciinema-player/` | asciinema-player 3.17.0 (`dist/bundle/` from the npm package, and its licence), for the recording |
| `.github/workflows/` | `pages.yml` (build and deploy), `release.yml` (point the site at a new release) |
| `.github/scripts/set-release.sh` | Edits `data/release.toml` for a release; `release.yml` runs it |
| `layouts/home.html` | The homepage |
| `layouts/404.html` | The 404 page |
| `layouts/_partials/` | `head.html`, `header.html`, `footer.html` (overrides), `templates/schema_json.html` (structured data: a VideoGame on the homepage, WebPage + breadcrumbs elsewhere), `extend_head.html`, `extend_footer.html` (lightbox), `theme_vars.html`, `release_file.html`, `download_button.html`, `play_button.html` and `play_note.html` (the browser version's button, and the note phones get instead), `screenshot.html`, `screenshot_file.html`, `gameplay_cast.html` (the recording and its loader) |
| `layouts/_shortcodes/` | `downloads`, `screenshot name= caption= alt=`, `server` |
| `static/` | `bg.png` (the starfield), favicons, `og.png`, `fonts/` (including `cascadia-box.woff2`, made by `.agents/scripts/box-font.py`), `CNAME` |
| `.agents/scripts/box-font.py` | Makes `cascadia-box.woff2` for the recording: see Conventions, "The gameplay recording" |

## Conventions

- **Hugo ≥ 0.146 template layout**: `layouts/_partials/`, `layouts/_shortcodes/`, `layouts/home.html`. Use `hugo.Data`, not `site.Data` (deprecated).
- **Colours** only through CSS variables: `--ansi-<name>` and `--ansi-bright-<name>` (the palette), `--bg-color`, `--content`, `--primary`, `--secondary`, `--entry`, `--border`, `--code-bg`, `--link-color`. `theme_vars.html` makes them from `data/themes/<params.theme>.toml` and sets them on both `:root` and `:root[data-theme="dark"]`, so they beat PaperMod's. The site is dark-only (`defaultTheme = "dark"`, no toggle).
- **Fonts** are self-hosted (files in `static/fonts/`, `@font-face` rules in `assets/css/fonts.css`, latin subsets): Cinzel for headings (`--font-heading`), Montserrat for text (`--font-body`), Cascadia Code for anything terminal-ish: menu, buttons, code, keys (`--font-mono`). `Cascadia Fallback` is Courier New / Liberation Mono scaled to Cascadia's character width, so nothing reflows when the real font arrives (that reflow was the homepage's layout shift).
- **Release details** live only in `data/release.toml`. Page text uses `{{</* server */>}}` for the server's address and `{{</* downloads */>}}` for the platform cards; the homepage button and footer read the file directly. Archive names are `moonlapse-<version>-<id>.<ext>`, matching the game's release workflow.
- **Images** go through Hugo (`resources.Get`, `.Resize "… webp"`), never `static/`, except the starfield, favicons and `og.png`.
- **Screenshots** are SVGs, used as they are (Hugo can't resize SVG): one file, its `width`/`height` read from the viewBox, `loading="lazy"` except the hero's. GitHub Pages gzips them (~2.6 MB → ~0.8 MB for all 15). Each is 1215×1023: a 1155×963 window with 30px of transparent padding for its shadow. Nothing draws another frame, border, radius or shadow round them (hero, gallery, lightbox); `.shot img` pulls each one out by the padding so the *window* lines up with the column. Reference them by name: `hero_shot` and `gallery` (`name`, `caption`, `alt`) in `content/_index.md`, or `{{</* screenshot name="…" caption="…" */>}}`. Captions say what's happening; alt text describes what's on screen.
- **The gameplay recording** (`_partials/gameplay_cast.html`) is published as `.json`, not `.cast`, because GitHub Pages serves unknown types uncompressed (3.6 MB instead of 90 KB). The player's JS and CSS load after the page's `load` event and once the recording is within a screen of view; it plays while at least half visible (not with reduced motion), and pauses when scrolled away. The game sets some palette colours itself with OSC 4 (grey, tan, white), which the player ignores, so the loader rewrites them into the recording as RGB. Its box-drawing lines come from **Cascadia Box**: Cascadia Mono's box glyphs, stretched to fill a 1.5em line. The player draws block elements itself but leaves box drawing to the font, and any font's box glyphs (a Nerd Font's too) are only as tall as its own line (1.16em for Cascadia), so at line height 1.5 the vertical lines had gaps. It's first in `terminalFontFamily`, with a `unicode-range` of box drawing only, so everything else is Cascadia Code. Change the line height and re-run the script. Its theme is `.asciinema-player-theme-moonlapse` in `custom.css`, from the `--ansi-*` variables, with black as the background (the game paints its background with black). `.cast`'s `min-height` keeps room for it (110×38 in Cascadia Code, line height 1.5); change the size or font and that number changes. On phones it's shown scaled down, like the screenshots; fullscreen is in its controls.
- **Keys** in page text are `<kbd>`, commands and glyphs are backticks. Tables of keys have an empty header row (`| Key | |`), which the CSS hides.
- **Server status**: `_partials/server_status.html` (in the homepage hero, and compact in the footer) is filled in by a script in `extend_footer.html` from `params.statusURL` (`https://api.moonlapse.net/status`: `online`, `players`, `version`, `game_time`). It starts after the page's `load` event (so it never competes with the page itself), polls every 20s while the tab is visible, times out after 5s, and shows "Offline" on any failure, never a stale count. Between polls the clock advances one game minute per `real_seconds_per_minute` real seconds, but never past 23:59: days and months come from the next poll. Without the script it reads as the server's address. In the hero it sits in a fixed-height `.hero-status` slot (one line on desktop, two on phones), so filling it in never moves the page. The endpoint is cached for 5s and returns 429 above 2 requests a second per visitor, so don't poll faster.
- **The browser version** is at `params.playURL` (play.moonlapse.net). It needs a keyboard, so on phones and tablets (`max-width: 600px`, or a coarse pointer without hover) `.play-btn` is hidden and `.play-note` says so instead, and the menu's `play` item is `narrow = false`. It's not a download: keep it out of `data/release.toml` (the schema adds "Web browser" to `gamePlatform` itself). No iframe of it: it needs response headers GitHub Pages can't send, and the sign-in page refuses to be framed.
- **External links** get `target=_blank` and an icon from a script in `extend_head.html`; don't add them by hand.

## Gotchas

- `layouts/_partials/head.html` is a copy of PaperMod's with four edits: the homepage title from `params.homeTitle`; no keywords, mask-icon or tile-colour tags; and the stylesheet (with `fonts.css`) inlined in a `<style>` rather than linked, so nothing blocks the first paint. After updating PaperMod, diff it against the theme's (`hugo mod vendor`) and carry over anything new.
- PaperMod's own rules win on specificity more often than you'd think: `.header-nav a { display: block }`, and `[data-theme="dark"] .list { background }` on the body. Match or beat the selector (`.header-nav .header-mark`, `[data-theme="dark"] body.list`).
- The starfield is on `html`, not `body` (whose background stays transparent, or it paints over the `body::before` glow). It's pixel art, drawn 1:1 with screen pixels: anchored at `0 0`, `image-rendering: pixelated`, and sized by `--bg-size` from a script in `extend_head.html`. Don't centre it, scale it, or dim the whole page over it: each one blurs or dulls it.
- Screenshot thumbnails are `loading="lazy"`: in a headless screenshot, the ones below the fold come out blank. That's the screenshot, not the site. The recording can come out empty in the phone iframes for the same reason; a 500px-wide window shows it.
- The player's stylesheet loads after the site's, so its `.ap-player` defaults beat anything of equal specificity: the theme is `.cast .asciinema-player-theme-moonlapse`.
- Headless Edge won't make a window narrower than about 500px, so `--window-size=390,…` doesn't show a phone layout: use an iframe (`check-site`).
- The homepage's "Download for <OS>" button picks the visitor's platform in JavaScript, and only once `available = true`. Until then it links to `/download/`.

## The game

The game's repo is `netcurse/moonlapse` (private), usually checked out next to this one at `../moonlapse`. What the site says about the game has to match it:

| Topic | Source of truth |
|---|---|
| Keys and commands | `client/include/help.hpp` (the in-game `?` help). Not the game's README, which lags |
| Map glyphs | `PlayView::get_entity_display_char` in `client/src/views.cpp` |
| Skills | `Skill` in `shared/include/xp.hpp` |
| Platforms, archive names, requirements | The game's `.github/workflows/release.yml` and `docs/deploy.md`, "Releasing the client" |
| Client flags | `client --help` |
| Version | `VERSION` in `shared/include/version.hpp` |

The game's release workflow publishes the archives to **this** repo's releases (tag `0.2.0`, title `v0.2.0`), using a `RELEASES_TOKEN` secret in the game repo. Publishing a release starts this repo's `.github/workflows/release.yml`: it checks the release has all three archives, updates `data/release.toml` with `.github/scripts/set-release.sh` (version, date, `available = true`; never to an older version), commits `Release X.Y.Z` to `main` and starts `pages.yml` (a push made with `GITHUB_TOKEN` doesn't start other workflows by itself). Drafts, prereleases and tags that aren't plain `X.Y.Z` are skipped, and a re-run for the same version changes nothing. It can also be run by hand (Actions > release, with a version), with *dry run* on by default: it then only prints the new `release.toml`. Replacing files on an existing release (the game workflow's re-run after a failure) doesn't publish anything new, so it doesn't start it.
