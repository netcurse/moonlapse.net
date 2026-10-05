---
name: release-client
description: Point moonlapse.net at a new client release - check the release and its archives exist on netcurse/moonlapse.net, update data/release.toml (version, date, available), verify the download links, and commit. Use when a new client version has been (or is about to be) published.
---

# Point the site at a new client release

The game's release workflow builds the client and publishes it as a release of this repo: tag `<version>` (no `v`), title `v<version>`, with three archives. The site only links to it once `data/release.toml` says so.

## 1. Check the release is really there

```sh
gh release view <version> --repo netcurse/moonlapse.net --json tagName,publishedAt,assets --jq '{tag: .tagName, published: .publishedAt, files: [.assets[].name]}'
```

It must have all three, named exactly:

- `moonlapse-<version>-windows-x64.zip`
- `moonlapse-<version>-macos-arm64.tar.gz`
- `moonlapse-<version>-linux-x64.tar.gz`

If one is missing, stop: the release workflow failed partway (it can be rerun from the game repo, and replaces the files). Don't point the site at an incomplete release.

## 2. Update `data/release.toml`

- `version`: the new version, without `v`.
- `date`: the release's `publishedAt` date (TOML date, `2026-10-05`).
- `available = true` (only `false` before the very first release).
- Platforms: if the release workflow added, dropped or renamed one (its `matrix.platform`), update `[[platforms]]` to match. `requires` comes from the release notes (the Linux glibc version is in them) and the game's `docs/deploy.md`.

Nothing else in the site holds the version: pages use the `downloads` and `server` shortcodes, and the homepage and footer read the file.

## 3. Check the links

```sh
hugo --minify -d "$TMPDIR/site"
grep -o 'https://github.com/netcurse/moonlapse.net/releases/[^" >]*' "$TMPDIR/site/download/index.html" | sort -u | while read -r u; do
  printf '%s %s\n' "$(curl -sIL -o /dev/null -w '%{http_code}' "$u")" "$u"
done
```

Every line should start with `200`. Then look at the download page and homepage (`check-site`).

## 4. Commit

```sh
git add data/release.toml
git commit -m "Release <version>"
```

Pushing deploys the site.

## If the client changed what players do

A release may change keys, commands, requirements or what's in the archive. Check the game's merged PRs since the last release, and if any of that changed, update the pages too (`sync-from-game`).
