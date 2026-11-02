# cms-auth

What makes "Sign In with GitHub" work at `/admin/`. GitHub only finishes a login for a server that holds the OAuth app's secret, so this is that server. It stores nothing.

`worker.mjs` is [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth), the CMS's own authenticator, at commit `33500e1`, unchanged (MIT, `LICENSE.txt`). To update it, replace the file with upstream's `src/index.js`. `server.mjs` only runs it on Node instead of Cloudflare Workers.

## Setting it up

1. **The OAuth app**: GitHub > Settings > Developer settings > OAuth Apps > New. Homepage `https://moonlapse.net`, callback `https://cms-auth.moonlapse.net/callback`. Generate a client secret.
2. **DNS**: `cms-auth.moonlapse.net` to the machine that runs this.
3. **The service**: put this folder on that machine, then

   ```sh
   cp .env.example .env && chmod 600 .env   # and fill it in
   docker compose up -d
   ```

   It listens on `127.0.0.1:8647`, plain HTTP.
4. **HTTPS**: a reverse proxy with a certificate for `cms-auth.moonlapse.net`, passing everything to that port. The sign-in cookie is `Secure`.

Check: `https://cms-auth.moonlapse.net/auth?provider=github&site_id=moonlapse.net` goes to GitHub's sign-in page, and with `site_id=example.com` it says the site isn't allowed.

## Who can sign in

Anyone with a GitHub account can get as far as a token, but it's only their own, and saving needs write access to the repo on GitHub. `auth_scope: public_repo` in `static/admin/config.yml` keeps these tokens away from private repos (the CMS also asks for `user`, so they can change their owner's GitHub profile). `ALLOWED_DOMAINS` means only pages on moonlapse.net are given one.

If the secret leaks, generate a new one on GitHub, update `.env` and run `docker compose up -d` again.
