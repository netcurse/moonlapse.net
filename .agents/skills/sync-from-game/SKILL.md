---
name: sync-from-game
description: Bring what moonlapse.net says about the game in line with the game repo (netcurse/moonlapse, usually at ../moonlapse) - controls and commands in the guide, features on the homepage, platforms and requirements on the download page, and the screenshots. Use when the game has changed or before a release.
---

# Sync the site with the game

The game repo is private, so take facts from it but never paths, internals or infrastructure (`.agents/AGENTS.md`, "This repo is public"). Pull it first (`git -C ../moonlapse pull`), and read from `main` unless told otherwise.

## Controls and commands → `content/guide.md`

The source of truth is `client/include/help.hpp`: `help_topics()`, the in-game `?` help. The game's README lags behind it.

- Each `HelpTopic` maps to a `###` section under **Controls** (Moving and looking, Fighting, Magic, Items and skills, Chat and commands, Windows and the log). Party keys live under **Playing together**.
- Rows with keys become table rows: `[k]` → `<kbd>k</kbd>`, `[arrows]` → `<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>`, `[SHIFT+TAB]` → `<kbd>Shift</kbd>+<kbd>Tab</kbd>`, `/cmd <arg>` → `` `/cmd <arg>` ``. Indented continuation rows join onto the row above.
- Keep the help's wording where it reads well; tidy it into sentences where it's terse.
- Admin commands (`docs/admin-commands.md`, the ones not marked "(Everyone.)") never go on the site.

## Map glyphs → the legend in `content/guide.md`

`PlayView::get_entity_display_char` in `client/src/views.cpp`: you are `@`; players and NPCs are their name's first letter, upper case; monsters lower case; then a fixed character per type. Content can override a glyph, so the legend says what's usual.

## Features → `content/_index.md`

The `features` front matter. Check each claim against the game: skills (`Skill` in `shared/include/xp.hpp`, and `SKILL_COUNT`), party size (`docs/combat.md`, "Parties"), shops, bank, trading (`docs/economy.md`), mail (`docs/mail.md`), PvP rules (`docs/combat.md`, "PvP"). Don't claim what isn't in the code.

## Platforms → `data/release.toml` and `content/download.md`

`.github/workflows/release.yml` (`matrix.platform`, the package step) and `docs/deploy.md`, "Releasing the client": which platforms, archive names, what's in each archive, and requirements (macOS version, glibc, SmartScreen and quarantine notes). The download page's per-OS steps should match what's in the archive.

## Screenshots → `assets/images/screenshots/`

The game's `res/<n>.png` are 2020×1726 macOS window captures. The site uses them cropped to the terminal inside the window, with the transparent shadow flattened onto the terminal's background:

```sh
magick ../moonlapse/res/<n>.png -strip -background '#15191e' -flatten -crop 1792x1434+114+142 +repage assets/images/screenshots/<n>.png
```

That crop assumes the same window size and position. For a new capture, check its edges first (the terminal's background is `#15191e`; the window border is `#2c3035`):

```sh
magick <file> -crop 40x1+1880+300 +repage txt:- | awk 'NR>1{print $1,$3}'    # right edge
magick <file> -crop 1x40+1000+1550 +repage txt:- | awk 'NR>1{print $1,$3}'   # bottom edge
```

Then reference it by number: the homepage's `hero_shot` and `gallery` front matter, or `{{</* screenshot n="<n>" caption="…" */>}}` in a page. Captions describe what's happening, not the UI.

## Then

`check-site`, and commit with a short message (`Update the controls for 0.3.0`).
