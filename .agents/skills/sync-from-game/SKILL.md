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

SVGs exported from [boron.sh](https://boron.sh/), so every batch matches:

1. Set the terminal to exactly **123×38** (columns × rows), and play the client in it. Check with `tput cols; tput lines`: a terminal a row short gives a shorter image (1215×1000 instead of 1215×1023), and a row of shots with different heights.
2. Copy the screen into boron.sh with exactly these settings: **Theme** Boron · **Syntax** Custom (ANSI) · **Backdrop** Transparent · **Width** 123 cols · **Corner radius** 10px · **Padding** 30px · **Shadow** 100%.
3. Export SVG and save it as `assets/images/screenshots/<name>.svg`, with a kebab-case name for what it shows: `fishing-at-morningside`, `talking-to-perth`.
4. Check its size: `grep -o 'viewBox="[^"]*"' <file>` should say `0 0 1215 1023`.

The images bring their own macOS-style window (title bar, rounded corners, shadow) on a transparent backdrop, so the site adds no frame. They embed their font, so they're 70–320 KB each, gzipped to about a third.

Then use them by name: `hero_shot` or `gallery` (`name`, `caption`, `alt`) in `content/_index.md`, or `{{</* screenshot name="<name>" caption="…" */>}}` in a page. Captions describe what's happening, not the UI; alt text describes what's on screen. Search engines need a PNG, so for the few in structured data, render the SVG in a browser and save it as `assets/images/raster/<name>.png` (headless Edge or Chrome: `--window-size=1215,1023 --default-background-color=00000000 --screenshot=…`).

Check what a screenshot shows before it goes up: the site is public, so nothing dev-only (admin commands, dev sign-in) and no version that isn't released yet.

## The gameplay recording → `assets/casts/`

An asciinema recording (asciicast v2) at **110×38**, trimmed to gameplay: nothing before signing in or after quitting, so no sign-in screen, address or version. Only the trimmed file is committed. If the size changes, change `cols`/`rows` in `_partials/gameplay_cast.html` and the `min-height` on `.cast` in `custom.css`.

## Then

`check-site`, and commit with a short message (`Update the controls for 0.3.0`).
