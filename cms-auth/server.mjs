// Runs worker.mjs, which is written for Cloudflare Workers, as a plain Node server.
import { createServer } from "node:http";
import worker from "./worker.mjs";

const { PUBLIC_ORIGIN, PORT = "8647" } = process.env;

for (const name of ["PUBLIC_ORIGIN", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "ALLOWED_DOMAINS"]) {
  // Without ALLOWED_DOMAINS the worker would hand tokens to any site
  if (!process.env[name]) {
    console.error(`${name} isn't set`);
    process.exit(1);
  }
}

createServer(async (req, res) => {
  try {
    // The address comes from the settings, not the Host header
    const request = new Request(new URL(req.url, PUBLIC_ORIGIN), {
      method: req.method === "GET" ? "GET" : "POST",
      headers: { cookie: req.headers.cookie ?? "" },
    });
    const response = await worker.fetch(request, process.env);
    const headers = Object.fromEntries(response.headers);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) headers["set-cookie"] = cookies;
    res.writeHead(response.status, headers);
    res.end(await response.text());
  } catch (err) {
    console.error(err.message);
    res.writeHead(500);
    res.end();
  }
}).listen(Number(PORT), process.env.HOST ?? "0.0.0.0");
