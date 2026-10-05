---
name: release-client
description: Check that a client release reached moonlapse.net - the release workflow ran, data/release.toml points at it and every download link works - and point the site at it by hand if the workflow didn't. Use after a new client version is published, or when the download page shows the wrong version.
---

# Check a client release reached the site

The game's release workflow builds the client and publishes it as a release of this repo: tag `<version>` (no `v`), title `v<version>`, three archives. Publishing starts this repo's `.github/workflows/release.yml`, which checks the archives, sets `version`, `date` and `available = true` in `data/release.toml` (with `.github/scripts/set-release.sh`), commits `Release <version>` to `main`, and starts the `pages` deploy.

## 1. Check the release

```sh
gh release view <version> --repo netcurse/moonlapse.net --json tagName,isDraft,isPrerelease,publishedAt,assets \
  --jq '{tag: .tagName, draft: .isDraft, pre: .isPrerelease, published: .publishedAt, files: [.assets[].name]}'
```

It needs all three, named exactly:

- `moonlapse-<version>-windows-x64.zip`
- `moonlapse-<version>-macos-arm64.tar.gz`
- `moonlapse-<version>-linux-x64.tar.gz`

If one is missing, stop: the game's release workflow failed partway. Rerunning it replaces the files, but doesn't publish a new release, so the site workflow won't start again by itself: point the site at it by hand afterwards (step 3).

## 2. Check the workflows ran

```sh
gh run list --repo netcurse/moonlapse.net --workflow release.yml --limit 3
gh run list --repo netcurse/moonlapse.net --workflow pages.yml --limit 3
git pull && sed -n '/^version/,/^available/p' data/release.toml
```

The `release` run should have succeeded and committed `Release <version>`, and a `pages` run started after it should have succeeded. If `release` failed, `gh run view <id> --log-failed` says why: usually a missing archive, or the release being older than what the site already points at (`set-release.sh` never goes backwards).

## 3. Point the site at it by hand (if the workflow didn't)

Run the workflow manually. *dry run* is on by default and only prints the new `release.toml`; turn it off to commit and deploy:

```sh
gh workflow run release.yml --repo netcurse/moonlapse.net -f version=<version>                  # dry run
gh workflow run release.yml --repo netcurse/moonlapse.net -f version=<version> -f dry_run=false  # for real
```

Or locally, if Actions is unavailable:

```sh
bash .github/scripts/set-release.sh <version> <YYYY-MM-DD>   # the release's publishedAt date
git commit -am "Release <version>" && git push                # a push from here deploys by itself
```

If the release workflow added, dropped or renamed a platform (its `matrix.platform`), update `[[platforms]]` in `data/release.toml` and the three file names checked in `.github/workflows/release.yml` to match.

## 4. Check the links

Once the deploy has finished:

```sh
curl -s https://moonlapse.net/download/ | grep -o 'https://github.com/netcurse/moonlapse.net/releases/[^" >]*' | sort -u |
  while read -r u; do printf '%s %s\n' "$(curl -sIL -o /dev/null -w '%{http_code}' "$u")" "$u"; done
```

Every line should start with `200`, and the page should show the new version. Then look at the download page and homepage (`check-site`).

## If the client changed what players do

A release may change keys, commands, requirements or what's in the archive. Check the game's merged PRs since the last release, and if any of that changed, update the pages too (`sync-from-game`).
