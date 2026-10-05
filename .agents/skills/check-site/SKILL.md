---
name: check-site
description: Build moonlapse.net and look at it - hugo build with no new warnings, then headless-browser screenshots of each page at desktop and phone widths, read back as images. Use after any visible change (CSS, templates, content, images) before calling it done.
---

# Build and look at the site

## 1. Build

```sh
rm -rf public resources
hugo --minify 2>&1 | grep -E 'WARN|ERROR|Pages'
```

Only PaperMod's two deprecation warnings (`LanguageDirection`, `LanguageCode`) are expected. Delete `public/`, `resources/` and `.hugo_build.lock` when done (they're ignored, but keep the tree tidy).

## 2. Serve it

Run in the background:

```sh
hugo server --port 1313 --disableFastRender
```

Stop it when finished.

## 3. Screenshot it

Any Chromium works headless. On Windows, Edge is at `/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`; elsewhere use `chromium` or `google-chrome`. Use a fresh `--user-data-dir` (in the scratchpad), or a second run can silently reuse the first's output.

Desktop, one page at a time:

```sh
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$TMP/prof" \
  --window-size=1440,2400 --virtual-time-budget=6000 \
  --screenshot="$TMP/home.png" http://localhost:1313/
```

Phone: headless windows won't go below ~500px wide, so put the pages in 390px iframes side by side:

```sh
cat > "$TMP/phone.html" <<'EOF'
<!doctype html><body style="margin:0;background:#333;display:flex;gap:20px">
<iframe src="http://localhost:1313/" style="width:390px;height:2400px;border:0"></iframe>
<iframe src="http://localhost:1313/download/" style="width:390px;height:2400px;border:0"></iframe>
<iframe src="http://localhost:1313/guide/" style="width:390px;height:2400px;border:0"></iframe>
</body>
EOF
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --user-data-dir="$TMP/prof" \
  --window-size=1220,2400 --virtual-time-budget=8000 --screenshot="$TMP/phone.png" "file:///$TMP/phone.html"
```

Then read the PNGs.

## 4. What to look for

- Every page: `/`, `/download/`, `/guide/`, `/about/`, and the 404 (`/nope/`).
- The starfield shows behind everything and is dimmed; text over it stays readable.
- No horizontal scroll at phone width; the header stays on one row.
- Download buttons: "Coming soon" while `available = false`, real links once true.
- Lazy screenshots below the fold may be blank in a headless shot: that's expected, not a bug.
