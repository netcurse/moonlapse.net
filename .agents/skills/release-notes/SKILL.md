---
name: release-notes
description: Write a release's notes on the blog with new screenshots - draft the post with placeholder screenshots on a branch, have the person take the shots with F12 through a guided script (the game repo's release-screenshots skill stages each scene), then read the shots back, write their alt text, build and publish. Use when a new client version is released, or a post needs new game screenshots.
---

# A release's notes, with screenshots

How the 0.9.0 notes were made. The person plays and presses F12; you plan the post and the shots, stage each scene, check what comes back and publish. The game's side (planning scenes, the guided script that starts a local server and sets each one up from the server's console) is the game repo's **`release-screenshots`** skill (`netcurse/moonlapse`, `.agents/skills/release-screenshots/SKILL.md`): read it too. This one is the site's side.

Everything here is public (`.agents/AGENTS.md`, "This repo is public"): no admin command, dev sign-in, email address or unreleased feature in a shot or in the post.

## 1. Draft on a branch

A push to `main` publishes, so work on **`release-notes-<version>`**.

1. Read what's in the release: the game's GitHub release for the tag lists every merged PR; read the plans and docs they touched in the game repo. Read the last post (`content/blog/<last version>.md`) for tone and layout.
2. Write `content/blog/<version>.md` (`hugo new blog/<version>.md`), with `draft: true` until the shots are in. Titled `Version X.Y.Z: …`, with a `description` (the blog's list shows it). For players: what's new, tables for anything with numbers, keys as `<kbd>`, commands in backticks, "Fixes", and "Updating" (whether the old client still connects, `guest.toml`, anything a player will notice).
3. Choose about 10 to 12 shots, each a kebab-case name for what it shows, placed with `{{</* screenshot name="…" caption="…" alt="PLACEHOLDER" */>}}`. Captions say what's happening.
4. Add a **placeholder** `assets/images/screenshots/<name>.svg` for each, so the site builds: 1215×1023 with that `viewBox`, a dashed frame and the words "Screenshot to take" and the file's name (the template is in the game repo's skill; the guided script spots a real shot by those words being gone).
5. Commit and push the branch. Tell the person the names, and what each should frame.

## 2. The shots

The person runs the guided script from the game repo (`release-screenshots`), with this repo's path as its argument. It offers to switch this repo to the branch, opens the screenshot terminal (`.agents/scripts/screenshots/start.sh`: foot at 123×38, F12 saves as `assets/images/screenshots/<name>.svg`), and waits for each file. They push the shots to the branch when it's done.

## 3. Read them back, write the alt text

The SVG's text elements are the screen: the game repo's skill has a short script that prints a shot as a grid of text. Read every one:

- Nothing that mustn't be public: an admin reply (they should have hidden the log's System channel), a debug line, an email.
- That it shows what its caption says. If not, change the caption to fit the shot, not the other way round.
- Write each `alt`: what's on screen in a sentence or two, quoting what's legible. Use curly quotes inside a shortcode's quotes, not `&quot;`.

## 4. Publish

1. Take out `draft: true`, and check `date` isn't in the future (Hugo leaves future posts out).
2. Build with Hugo 0.163.3 extended (CI's): only PaperMod's two deprecation warnings. Then `check-site`: look at the post, desktop and phone.
3. Commit (`Publish the X.Y.Z release notes`), push, and open the PR. Merging it publishes the post; the download page's "release notes" link and the homepage's version link go to it.
