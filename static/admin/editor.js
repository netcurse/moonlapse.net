// The admin console's editor: an Insert menu entry for the screenshot shortcode, and previews with
// the site's styles and markup.

const SHOTS = "/images/screenshots/";

// {{< screenshot >}} takes a name; the picker works in paths. Quotes would end the shortcode's
// attribute, so straight ones become curly
const attr = (s = "") => s.replace(/"/g, "”");

CMS.registerEditorComponent({
  id: "screenshot",
  label: "Screenshot",
  icon: "image",
  fields: [
    { name: "src", label: "Screenshot", widget: "image", accept: ".svg,.png", hint: "A kebab-case name saying what it shows. 1215×1023 SVGs come from the screenshot terminal." },
    { name: "caption", label: "Caption", widget: "string", required: false, hint: "What's happening." },
    { name: "alt", label: "Alt text", widget: "text", required: false, hint: "What's on screen." },
  ],
  pattern: /^\{\{< screenshot name="([^"]*)"(?: caption="([^"]*)")?(?: alt="([^"]*)")? >\}\}$/ms,
  fromBlock: (m) => ({ src: `${SHOTS}${m[1]}.svg`, caption: m[2] ?? "", alt: m[3] ?? "" }),
  toBlock: ({ src = "", caption, alt }) => {
    const name = src.split("/").pop().replace(/\.\w+$/, "");
    return `{{< screenshot name="${name}"${caption ? ` caption="${attr(caption)}"` : ""}${alt ? ` alt="${attr(alt)}"` : ""} >}}`;
  },
  toPreview: ({ src = "", caption = "", alt = "" }, getAsset) => {
    const figure = document.createElement("figure");
    figure.className = "figure-shot";
    const img = Object.assign(document.createElement("img"), { src: getAsset?.(src)?.toString() || src, alt });
    img.style.width = "100%";
    figure.append(img);
    if (caption) figure.append(Object.assign(document.createElement("figcaption"), { textContent: caption }));
    return figure;
  },
});

// ── Previews ─────────────────────────────────────────────────────────
// The markup is layouts/home.html's and PaperMod's single.html's. What only the build knows (the logo's
// address, the download button, the server's address) comes off the published homepage.

let home = new DOMParser().parseFromString("", "text/html");

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// DOMPurify's usual addresses, plus the blob: ones the CMS gives its images
const clean = (html) => DOMPurify.sanitize(html, {
  ADD_TAGS: ["details", "summary"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
});
const inline = (md = "") => marked.parseInline(String(md));
const outer = (selector) => home.querySelector(selector)?.outerHTML ?? "";
const toList = (v) => (v?.toJS ? v.toJS() : Array.isArray(v) ? v : []);
const toMap = (v) => (v?.toJS ? v.toJS() : v ?? {});

const shotURL = (name, getAsset) => {
  const path = `${SHOTS}${name}.svg`;
  return getAsset?.(path)?.toString() || path;
};

const shot = (name, alt, getAsset) =>
  `<a class="shot"><img src="${esc(shotURL(name, getAsset))}" width="1215" height="1023" alt="${esc(alt)}"></a>`;

const PLATFORMS = { "windows-x64": "Windows", "macos-arm64": "macOS", "linux-x64": "Linux" };
const attrOf = (attrs, name) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const placeholder = (text) => `<p class="hs-note"><em>${text}</em></p>`;

// Hugo's shortcodes, as near as the browser can get without the build
const shortcodes = (md, getAsset) => md
  .replace(/\{\{<\s*screenshot\s+((?:\w+="[^"]*"\s*)*)>\}\}/g, (_, a) => {
    const caption = attrOf(a, "caption");
    return `<figure class="figure-shot">${shot(attrOf(a, "name"), attrOf(a, "alt") ?? caption ?? "", getAsset)}${caption ? `<figcaption>${inline(caption)}</figcaption>` : ""}</figure>`;
  })
  .replace(/\{\{<\s*server\s*>\}\}/g, () => `<code>${esc(home.querySelector("[data-status-text]")?.textContent ?? "play.moonlapse.net")}</code>`)
  .replace(/\{\{<\s*discord\s*>\}\}/g, () => [...home.querySelectorAll(".footer a")].find((a) => a.textContent.trim() === "Discord")?.href ?? "#")
  .replace(/\{\{<\s*hiscores\s*>\}\}/g, placeholder("The hiscores appear here."))
  .replace(/\{\{<\s*market\s*>\}\}/g, placeholder("The Marketplace's prices appear here."))
  .replace(/\{\{<\s*\/?platforms\s*>\}\}/g, "")
  .replace(/\{\{<\s*platform\s+([^>]*?)\s*>\}\}/g, (_, a) =>
    `<section class="platform"><h2 class="platform-name">${esc(attrOf(a, "name") ?? PLATFORMS[attrOf(a, "id")] ?? attrOf(a, "id"))}</h2>\n\n`)
  .replace(/\{\{<\s*\/platform\s*>\}\}/g, "\n\n</section>")
  .replace(/\{\{<\s*commands(?:\s+lang="([^"]*)")?\s*>\}\}\n?([\s\S]*?)\n?\{\{<\s*\/commands\s*>\}\}/g, (_, lang, code) => `\`\`\`${lang ?? "sh"}\n${code}\n\`\`\``)
  .replace(/\{\{<\s*details\s+summary="([^"]*)"\s*>\}\}/g, (_, summary) => `<details><summary>${esc(summary)}</summary>\n\n`)
  .replace(/\{\{<\s*\/details\s*>\}\}/g, "\n\n</details>");

const markdown = (md, getAsset) => clean(marked.parse(shortcodes(String(md ?? ""), getAsset)));

const when = (value) => {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date) ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
};

const setBody = (doc, list) => {
  if (!doc?.documentElement) return;
  doc.documentElement.dataset.theme = "dark";
  doc.body.className = list ? "list" : "";
};

const html = (className, content) => h("main", { className, dangerouslySetInnerHTML: { __html: content } });

const article = ({ data, getAsset, crumb = "", meta = "" }) => html("main", `
  <article class="post-single">
    <header class="post-header">
      ${crumb}
      <h1 class="post-title entry-hint-parent">${esc(data.get("title") || "Untitled")}${data.get("draft") ? ' <span class="preview-draft">[draft]</span>' : ""}</h1>
      ${data.get("description") ? `<div class="post-description">${esc(data.get("description"))}</div>` : ""}
      <div class="post-meta">${meta}</div>
    </header>
    <div class="post-content md-content">${markdown(data.get("body"), getAsset)}</div>
  </article>`);

const homePage = ({ data, getAsset }) => {
  const hero = toMap(data.get("hero_shot"));
  const play = toMap(data.get("play"));
  return html("main", `
    <section class="hero">
      ${outer(".hero-logo")}
      <p class="hero-tagline">${clean(inline(data.get("tagline")))}</p>
      ${outer(".download-cta")}
      ${outer(".download-meta")}
      ${outer(".hero-status")}
    </section>
    <section class="showcase">${hero.name ? shot(hero.name, hero.alt, getAsset) : ""}</section>
    <section class="intro md-content">${markdown(data.get("body"), getAsset)}</section>
    <section class="features">${toList(data.get("features")).map((f) => `
      <article class="feature">
        <span class="glyph" style="color: var(--ansi-${esc(f.colour)})">${esc(f.glyph)}</span>
        <h2>${esc(f.title)}</h2>
        <p>${clean(inline(f.text))}</p>
      </article>`).join("")}
    </section>
    <section class="cast-section">
      <h2>${esc(play.title)}</h2>
      <p class="cast-lede">${clean(inline(play.text))}</p>
      ${placeholder("The gameplay recording appears here.")}
    </section>
    <section class="gallery-section">
      <h2>Screenshots</h2>
      <div class="gallery">${toList(data.get("gallery")).map((g) => `
        <figure>${shot(g.name, g.alt || g.caption, getAsset)}<figcaption>${esc(g.caption)}</figcaption></figure>`).join("")}
      </div>
    </section>
    <section class="steps-section">
      <h2>Start playing</h2>
      <ol class="steps">${toList(data.get("steps")).map((s) => `
        <li><h3>${esc(s.title)}</h3><p>${clean(inline(s.text))}</p></li>`).join("")}
      </ol>
      ${data.get("steps_alt") ? `<p class="steps-alt">${clean(inline(data.get("steps_alt")))}</p>` : ""}
    </section>`);
};

CMS.registerPreviewTemplate("blog", ({ entry, getAsset, document: doc }) => {
  const data = entry.get("data");
  // the blog's own page is a list on the site, with no body of its own
  if (entry.get("slug") === "_index") setBody(doc, true);
  else setBody(doc, false);
  return article({
    data,
    getAsset,
    crumb: entry.get("slug") === "_index" ? "" : '<nav class="breadcrumbs"><a><span class="br">‹</span> blog</a></nav>',
    meta: `<span>${esc(when(data.get("date")))}</span>`,
  });
});

CMS.registerPreviewTemplate("home", ({ entry, getAsset, document: doc }) => {
  setBody(doc, true);
  return homePage({ data: entry.get("data"), getAsset });
});

["download", "guide", "about", "hiscores", "market", "privacy", "terms"].forEach((name) => {
  CMS.registerPreviewTemplate(name, ({ entry, getAsset, document: doc }) => {
    setBody(doc, false);
    return article({ data: entry.get("data"), getAsset });
  });
});

// The live site's palette and stylesheet, read off the homepage before the CMS starts, so the first
// preview has them. Root-relative url()s (the fonts) need the origin, since a preview style loads
// from a blob:
fetch("/")
  .then((r) => r.text())
  .then((text) => {
    home = new DOMParser().parseFromString(text, "text/html");
    ["site-css", "theme-vars"].forEach((id) => {
      const style = home.getElementById(id);
      if (style) CMS.registerPreviewStyle(style.textContent.replace(/url\((['"]?)\//g, `url($1${location.origin}/`), { raw: true });
    });
    CMS.registerPreviewStyle("html{background:#000}.preview-draft{font-size:.5em;vertical-align:middle;opacity:.6}", { raw: true });
  })
  .catch((err) => console.warn("Couldn't load the site's styles for the preview:", err))
  .finally(() => CMS.init());
