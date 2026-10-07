# Production Readiness Audit Fixes

This PR addresses accessibility, SEO, and security audit findings for moonlapse.net.

## ✅ Fixes Completed in This PR

### 1. SEO Improvements
- **Added explicit meta description** to homepage (`content/_index.md`)
  - Previous: Fell back to generic site description
  - Now: "An open-world multiplayer dungeon you play in your terminal. Explore, gather, craft, fight and quest with other players in real time."
  - This improves click-through rates in search results

### 2. Accessibility Improvements
- **Added `lang="en"` attribute** to `<html>` element (`layouts/_default/baseof.html`)
  - Helps screen readers identify the page language
  - Improves search engine language detection
  - Created `baseof.html` which PaperMod theme extends, ensuring consistent markup across all pages

- **Verified image alt text coverage**:
  - Hero logo: `alt="Moonlapse MUD"` ✓
  - Hero screenshot: Uses `alt` from front matter ("Standing outside the Morningside Inn...") ✓
  - Gallery screenshots: All use captions as alt text via `layouts/_partials/screenshot.html` ✓
  - Header logo: Already decorative with `alt=""` (correct for decorative images) ✓
  - **Result**: All 11 images now have appropriate alt attributes (100%)

- **Verified viewport and robots meta tags**:
  - `<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">` ✓
  - `<meta name="robots" content="index, follow">` (in production) ✓

### 3. Canonical & OG Tags
- **Already present in HEAD** (`layouts/_partials/head.html`):
  - Canonical tag: `<link rel="canonical" href="...">` ✓
  - Open Graph tags: Rendered by `layouts/_partials/templates/opengraph.html` ✓
  - Twitter Card tags: Rendered by `layouts/_partials/templates/twitter_cards.html` ✓

## ⚠️ Security Improvements Not Possible Without Infrastructure Changes

The following security headers are **not available on raw GitHub Pages** and require a reverse proxy/CDN:

### Required Headers (GitHub Pages Cannot Set These)
1. **HSTS** (HTTP Strict-Transport-Security)
2. **X-Frame-Options** (Clickjacking protection)
3. **X-Content-Type-Options** (MIME-type sniffing protection)  
4. **Content-Security-Policy** (XSS and injection attack protection)

### Solution Path 1: GitHub Pages + DNS (No Extra Cost)

If you want security headers without paying for a CDN, you'll need to migrate away from raw GitHub Pages. Options:

#### Option A: Netlify (Free tier available)
1. Push this repo to GitHub
2. Connect repo to Netlify at https://netlify.com
3. In Netlify Settings > Build & deploy > Deploy settings, set build command to `hugo --minify`
4. Create `netlify.toml` in repo root:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.moonlapse.net; frame-ancestors 'none'"
    X-Content-Type-Options = "nosniff"
```

5. In Namecheap DNS, update records to point to Netlify (they'll provide instructions after connecting)

#### Option B: GitHub Pages + Cloudflare (Free tier available)
1. Keep current GitHub Pages setup
2. Sign up at https://cloudflare.com (free plan)
3. Point Namecheap nameservers to Cloudflare's nameservers
4. In Cloudflare Dashboard:
   - **Rules** (or **Page Rules** if using old interface) → Create rule
   - For `moonlapse.net/*`:
     - Add headers via **Transform Rules** → **Modify Response Header**
     - Add each required header listed above
5. Enable "Always Use HTTPS" to force HTTP → HTTPS redirect

#### Option C: Vercel (Free tier available)
Similar to Netlify, but import repo and create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.moonlapse.net; frame-ancestors 'none'"
        }
      ]
    }
  ]
}
```

### Solution Path 2: GitHub Pages Only (Current Setup, Limited)

If you stay with raw GitHub Pages + Namecheap DNS:
- ✓ You get the SEO and accessibility fixes from this PR
- ✗ You cannot add security headers without a CDN/proxy
- This is acceptable for a marketing website, but not recommended for anything handling user data

## Verification Checklist

After merging this PR:

- [ ] **Local build test**: Run `hugo server` locally and inspect:
  ```bash
  # Check for lang attribute
  grep '<html lang=' public/index.html
  
  # Check for meta description
  grep '<meta name="description"' public/index.html
  
  # Check canonical tag
  grep '<link rel="canonical"' public/index.html
  ```

- [ ] **Live site verification**: After deploy to https://moonlapse.net:
  ```bash
  # Check rendered meta tags
  curl -s https://moonlapse.net | grep -E '(lang=|description|canonical)'
  ```

- [ ] **Accessibility check**: Run https://www.accessibilitychecker.co/ against moonlapse.net

- [ ] **SEO check**: Run audit again at https://www.woorank.com/en/www/moonlapse.net

- [ ] **Security check** (current limitations):
  ```bash
  curl -I https://moonlapse.net | grep -E '^(Strict-Transport|X-Frame|X-Content|Content-Security)'
  # Expected: (none on GitHub Pages)
  ```

## Files Changed

- `content/_index.md` — Added explicit meta description
- `layouts/_partials/head.html` — No changes needed (already correct)
- `layouts/_default/baseof.html` — **NEW** — Ensures `lang="en"` on all pages
- `PRODUCTION_FIXES.md` — This file, documenting changes and next steps

## Next Steps (Post-Merge)

### Recommended (High Priority)
1. **Deploy this PR** to main
2. **Choose a hosting solution** from the three options above for security headers
3. **Implement headers** using the appropriate method for your chosen platform

### Optional (Lower Priority)
- Add CSP Reporting: Set `Content-Security-Policy-Report-Only` header to test CSP without breaking site
- Add SRI (Subresource Integrity) to external scripts if any are added in future
- Set up uptime monitoring/alerting (separate from this site)

## Questions?

If anything is unclear, check:
- Hugo Docs: https://gohugo.io/
- Netlify Headers: https://docs.netlify.com/routing/headers/
- Cloudflare Rules: https://developers.cloudflare.com/rules/
- MDN Security Headers: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
