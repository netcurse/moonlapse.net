# moonlapse.net

Source for [moonlapse.net](https://moonlapse.net), the website for MoonlapseMUD. Built with [Hugo](https://gohugo.io) and [PaperMod](https://github.com/adityatelange/hugo-PaperMod), deployed to GitHub Pages on push to `main`.

## Development

Requires Hugo extended (0.146+) and Go.

```sh
hugo server
```

## Releases

Client builds are published as [releases](https://github.com/netcurse/moonlapse.net/releases) of this repo. The site reads the current version from `data/release.toml`, which `.github/workflows/release.yml` updates when a release is published (tag `X.Y.Z` with all three archives), then deploys.

To point the site at a release by hand, run the **release** workflow with its version, unticking *dry run*.

## Layout

| Path | |
|---|---|
| `content/` | Pages |
| `data/release.toml` | Current client version and download links |
| `data/themes/` | Colour palette |
| `assets/css/extended/custom.css` | Styles |
| `layouts/` | Templates and shortcodes |
