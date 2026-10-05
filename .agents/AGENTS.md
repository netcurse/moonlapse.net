# moonlapse.net — Agent Instructions

The website for MoonlapseMUD: home, download, how to play, about. Hugo + PaperMod, deployed to GitHub Pages by `.github/workflows/pages.yml` on every push to `main`. The client downloads are this repo's GitHub releases.

This file lives at `.agents/AGENTS.md`, so **edit this one**: the root `AGENTS.md` is a symlink to it, and `CLAUDE.md` imports it (`@.agents/AGENTS.md`). Skills live in `.agents/skills/` (`.claude/skills` is a symlink to it). On Windows, git checks symlinks out as text files holding the path unless Developer Mode is on and `core.symlinks` is true.

## This repo is public

Everything committed here (files, comments, commit messages) is public. The game's repo, `netcurse/moonlapse`, is private.

- **Don't publish game internals**: no paths into the game repo, server stack, infrastructure, hostnames other than `play.moonlapse.net`, or DNS in the site, README or comments. Agent files (this one, skills) may refer to the game repo, since they're for working on the site.
- **Tone**: plain and matter-of-fact. Short comments, only where something isn't obvious. No cute asides.
- **Commits**: short imperative subject (`Add the 0.2.0 release`), a body only when it's needed. **No `Co-Authored-By` trailer.**

## Skills

`.agents/skills/<name>/SKILL.md`:

| Skill | When |
|---|---|
| `release-client` | A new client version is out (or about to be): point the site at it |
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
| `data/release.toml` | The current client: `version`, `date`, `available`, URL templates, per-platform `id`/`ext`/`requires` |
| `data/themes/moonlapse.toml` | The palette (kitty/alacritty format), sampled from the client, plus `[ui]` |
| `assets/css/extended/custom.css` | **All** the CSS. PaperMod loads it after its own |
| `assets/images/logo.png` | The logo (trimmed). The header and footer crop its left 405×405 for the moon emblem |
| `assets/images/screenshots/<n>.png` | Game screenshots, cropped to the terminal (`sync-from-game`) |
| `layouts/home.html` | The homepage |
| `layouts/404.html` | The 404 page |
| `layouts/_partials/` | `head.html`, `header.html`, `footer.html` (overrides), `templates/schema_json.html` (structured data: a VideoGame on the homepage, WebPage + breadcrumbs elsewhere), `extend_head.html`, `extend_footer.html` (lightbox), `theme_vars.html`, `release_file.html`, `download_button.html`, `screenshot.html` |
| `layouts/_shortcodes/` | `downloads`, `screenshot n= caption=`, `server` |
| `static/` | `bg.png` (the starfield), favicons, `og.png`, `fonts/`, `CNAME` |

## Conventions

- **Hugo ≥ 0.146 template layout**: `layouts/_partials/`, `layouts/_shortcodes/`, `layouts/home.html`. Use `hugo.Data`, not `site.Data` (deprecated).
- **Colours** only through CSS variables: `--ansi-<name>` and `--ansi-bright-<name>` (the palette), `--bg-color`, `--content`, `--primary`, `--secondary`, `--entry`, `--border`, `--code-bg`, `--link-color`. `theme_vars.html` makes them from `data/themes/<params.theme>.toml` and sets them on both `:root` and `:root[data-theme="dark"]`, so they beat PaperMod's. The site is dark-only (`defaultTheme = "dark"`, no toggle).
- **Fonts** are self-hosted (`static/fonts/`, latin subsets): Cinzel for headings (`--font-heading`), Montserrat for text (`--font-body`), Cascadia Code for anything terminal-ish: menu, buttons, code, keys (`--font-mono`).
- **Release details** live only in `data/release.toml`. Page text uses `{{</* server */>}}` for the server's address and `{{</* downloads */>}}` for the platform cards; the homepage button and footer read the file directly. Archive names are `moonlapse-<version>-<id>.<ext>`, matching the game's release workflow.
- **Images** go through Hugo (`resources.Get`, `.Resize "… webp"`), never `static/`, except the starfield, favicons and `og.png`.
- **Keys** in page text are `<kbd>`, commands and glyphs are backticks. Tables of keys have an empty header row (`| Key | |`), which the CSS hides.
- **External links** get `target=_blank` and an icon from a script in `extend_head.html`; don't add them by hand.

## Gotchas

- `layouts/_partials/head.html` is a copy of PaperMod's with three edits: the homepage title from `params.homeTitle`, and no keywords, mask-icon or tile-colour tags. After updating PaperMod, diff it against the theme's (`hugo mod vendor`) and carry over anything new.
- PaperMod's own rules win on specificity more often than you'd think: `.header-nav a { display: block }`, and `[data-theme="dark"] .list { background }` on the body. Match or beat the selector (`.header-nav .header-mark`, `[data-theme="dark"] body.list`).
- The starfield is on `html`, not `body`: the body's background must stay transparent, or it paints over the `body::before` overlay that dims the stars.
- Screenshot thumbnails are `loading="lazy"`: in a headless screenshot, the ones below the fold come out blank. That's the screenshot, not the site.
- Headless Edge won't make a window narrower than about 500px, so `--window-size=390,…` doesn't show a phone layout: use an iframe (`check-site`).
- The homepage's "Download for <OS>" button picks the visitor's platform in JavaScript, and only once `available = true`. Until then it links to `/download/`.

## The game

The game's repo is `netcurse/moonlapse` (private), usually checked out next to this one at `../moonlapse`. What the site says about the game has to match it:

| Topic | Source of truth |
|---|---|
| Keys and commands | `client/include/help.hpp` (the in-game `?` help). Not the game's README, which lags |
| Map glyphs | `PlayView::get_entity_display_char` in `client/src/views.cpp` |
| Skills | `Skill` in `shared/include/xp.hpp` |
| Platforms, archive names, requirements | `.github/workflows/release.yml` and `docs/deploy.md`, "Releasing the client" |
| Client flags | `client --help` |
| Version | `VERSION` in `shared/include/version.hpp` |

The game's release workflow publishes the archives to **this** repo's releases (tag `0.2.0`, title `v0.2.0`), using a `RELEASES_TOKEN` secret in the game repo. The site doesn't follow automatically: `release-client` points it at a new version.
