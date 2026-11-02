// The admin console's editor: an Insert menu entry for the screenshot shortcode, and a preview that
// looks like the site.

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

// The live site's palette and stylesheet, read off the homepage. Root-relative url()s (the fonts)
// need the origin, since a preview style loads from a blob:
fetch("/")
  .then((r) => r.text())
  .then((text) => {
    const home = new DOMParser().parseFromString(text, "text/html");
    ["site-css", "theme-vars"].forEach((id) => {
      const style = home.getElementById(id);
      if (style) CMS.registerPreviewStyle(style.textContent.replace(/url\((['"]?)\//g, `url($1${location.origin}/`), { raw: true });
    });
  })
  .catch((err) => console.warn("Couldn't load the site's styles for the preview:", err));

CMS.registerPreviewStyle("html{background:#000}.preview-draft{font-size:.5em;vertical-align:middle;opacity:.6}", { raw: true });

const when = (value) => {
  const date = value ? new Date(value) : null;
  return date && !isNaN(date) ? date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
};

// The same markup as a post on the site
CMS.registerPreviewTemplate("blog", ({ entry, widgetFor, document: doc }) => {
  if (doc?.documentElement) doc.documentElement.dataset.theme = "dark";
  const data = entry.get("data");
  return h("main", { className: "main" },
    h("article", { className: "post-single" },
      h("header", { className: "post-header" },
        h("h1", { className: "post-title entry-hint-parent" },
          data.get("title") || "Untitled",
          data.get("draft") ? h("span", { className: "preview-draft" }, " [draft]") : null),
        h("div", { className: "post-meta" }, h("span", {}, when(data.get("date"))))),
      h("div", { className: "post-content md-content" }, widgetFor("body"))));
});
