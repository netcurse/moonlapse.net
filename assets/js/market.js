// The Marketplace page ({{< market >}}). Everything it shows comes from the API at data-api: the
// index once, and an item's prices and history when one is opened. No polling. The view is in the
// address, so every one has a link of its own.
(function () {
  var root = document.querySelector("[data-market]");
  if (!root || !window.fetch || !window.URLSearchParams) return;

  var API = root.getAttribute("data-api");
  var TIMEOUT_MS = 5000;
  var SVG = "http://www.w3.org/2000/svg";
  var SPANS = [
    { id: "day", name: "Day" },
    { id: "week", name: "Week" },
    { id: "month", name: "Month" },
    { id: "year", name: "Year" }
  ];
  // the browse table's columns that sort, and which way first
  var SORTS = { name: "asc", guide: "desc", change: "desc", sold: "desc", lowest: "asc" };

  var form = root.querySelector(".mk-search");
  var input = form.elements.q;
  var kindsNav = root.querySelector("[data-mk-kinds]");
  var updatedEl = root.querySelector("[data-mk-updated]");
  var view = root.querySelector("[data-mk-view]");
  var baseTitle = document.title;
  var number = window.Intl ? new Intl.NumberFormat("en-US") : { format: String };
  var percent = window.Intl ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : { format: String };

  var index = null;   // the index, as a promise, until it fails
  var updatedAt = 0;
  var latest = 0;     // the latest view asked for: answers for older ones are dropped
  var chart = null;   // the item view's graph, redrawn when its width changes

  // ── The API ─────────────────────────────────────────────────────

  function failure(kind) {
    var e = new Error(kind);
    e.kind = kind;
    return e;
  }

  // the answer's JSON, or a failure: "notfound", "notready" (503), "bad" (400) or "unreachable"
  // (anything else, including no answer in TIMEOUT_MS)
  function get(path) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer;
    var timeout = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        if (ctl) ctl.abort();
        reject(failure("unreachable"));
      }, TIMEOUT_MS);
    });
    var answer = fetch(API + path, ctl ? { signal: ctl.signal } : {}).then(function (r) {
      if (r.status === 404) throw failure("notfound");
      if (r.status === 503) throw failure("notready");
      if (r.status === 400) throw failure("bad");
      if (!r.ok) throw failure("unreachable");
      return r.json();
    });
    return Promise.race([answer, timeout]).then(function (d) {
      clearTimeout(timer);
      return d;
    }, function (e) {
      clearTimeout(timer);
      throw e.kind ? e : failure("unreachable");
    });
  }

  function catalogue() {
    if (!index) {
      index = get("").then(function (d) {
        if (!d || !d.items || !d.markets) throw failure("unreachable");
        return d;
      });
      index.catch(function () { index = null; });
    }
    return index;
  }

  // ── Building things ─────────────────────────────────────────────

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) {
      if (attrs[k] != null && attrs[k] !== false) node.setAttribute(k, attrs[k]);
    }
    [].concat(children == null ? [] : children).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
    });
    return node;
  }

  function svg(tag, attrs) {
    var node = document.createElementNS(SVG, tag);
    for (var k in attrs || {}) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // a link to a view of this page: { item, span, q, kind, sort, dir }
  function href(q) {
    var p = new URLSearchParams();
    ["item", "span", "q", "kind", "sort", "dir"].forEach(function (k) {
      if (q[k] != null && q[k] !== "") p.set(k, q[k]);
    });
    var s = p.toString();
    return location.pathname + (s ? "?" + s : "");
  }

  function link(q, text, attrs) {
    attrs = attrs || {};
    attrs.href = href(q);
    attrs["data-mk-link"] = "";
    return el("a", attrs, text);
  }

  function note(children) {
    return el("p", { class: "hs-note" }, children);
  }

  function heading(text) {
    return el("h2", { class: "hs-heading", tabindex: "-1" }, text);
  }

  function gold(n) {
    return number.format(n) + " gold";
  }

  // "Morningside", "Springport": a Marketplace by its town
  function town(id) {
    return id.split("_").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");
  }

  function marketName(idx, id) {
    for (var i = 0; i < idx.markets.length; i++) if (idx.markets[i].id === id) return idx.markets[i].name;
    return town(id);
  }

  function kindName(idx, id) {
    for (var i = 0; i < idx.kinds.length; i++) if (idx.kinds[i].id === id) return idx.kinds[i].name;
    return id;
  }

  // a change in percent: an arrow, and green or red (null: a dash)
  function change(pct) {
    if (pct == null) return el("span", { class: "mk-change mk-none" }, "–");
    var up = pct > 0, down = pct < 0;
    return el("span", { class: "mk-change" + (up ? " mk-up" : down ? " mk-down" : "") }, [
      el("span", { "aria-hidden": "true" }, up ? "↑ " : down ? "↓ " : ""),
      el("span", { class: "hs-hidden" }, up ? "up " : down ? "down " : ""),
      percent.format(Math.abs(pct)) + "%"
    ]);
  }

  function ago(seconds) {
    var mins = Math.floor((Date.now() / 1000 - seconds) / 60);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + (mins === 1 ? " minute ago" : " minutes ago");
    var hours = Math.floor(mins / 60);
    if (hours < 48) return hours + (hours === 1 ? " hour ago" : " hours ago");
    var days = Math.floor(hours / 24);
    return days + " days ago";
  }

  function showUpdated() {
    if (!updatedAt) {
      updatedEl.textContent = "";
      updatedEl.removeAttribute("title");
      return;
    }
    updatedEl.textContent = "Prices updated " + ago(updatedAt) + ". What's for sale is as it is now.";
    updatedEl.title = new Date(updatedAt * 1000).toLocaleString();
  }

  function drawKinds(idx, current) {
    clear(kindsNav);
    [{ id: "", name: "All" }].concat(idx.kinds).forEach(function (k) {
      kindsNav.appendChild(link({ kind: k.id, q: current.q }, k.name, {
        "aria-current": current.item ? null : k.id === current.kind ? "page" : null
      }));
    });
  }

  // the cheapest an item is for sale anywhere: { price, market } or null
  function lowest(item) {
    var best = null;
    for (var m in item.for_sale) {
      var o = item.for_sale[m];
      if (!best || o.lowest < best.price) best = { price: o.lowest, market: m };
    }
    return best;
  }

  // ── Browsing ────────────────────────────────────────────────────

  function browseView(idx, s) {
    var words = s.q.toLowerCase();
    var items = idx.items.filter(function (it) {
      return (!s.kind || it.kind === s.kind) && (!words || it.name.toLowerCase().indexOf(words) >= 0);
    });

    var sort = SORTS[s.sort] ? s.sort : "sold";
    var dir = s.dir === "asc" || s.dir === "desc" ? s.dir : SORTS[sort];
    var key = {
      name: function (it) { return it.name.toLowerCase(); },
      guide: function (it) { return it.guide; },
      change: function (it) { return it.change_7d; },
      sold: function (it) { return it.units_7d; },
      lowest: function (it) { var l = lowest(it); return l ? l.price : null; }
    }[sort];
    items.sort(function (a, b) {
      var x = key(a), y = key(b);
      // (nothing goes last, whichever way)
      if (x == null || y == null) return x == null && y == null ? a.name.localeCompare(b.name) : x == null ? 1 : -1;
      if (x === y) return a.name.localeCompare(b.name);
      return (x < y ? -1 : 1) * (dir === "asc" ? 1 : -1);
    });

    var title = s.kind ? kindName(idx, s.kind) : "All items";
    var box = el("div", null, heading(title));
    box.appendChild(el("p", { class: "hs-sub" },
      (items.length === 1 ? "1 item" : number.format(items.length) + " items") + (s.q ? " matching “" + s.q + "”" : "") +
      ". Prices are in gold, each."));

    if (!items.length) {
      box.appendChild(note(idx.items.length
        ? ["Nothing like that has been on the Marketplace. ", link({}, "See every item"), "."]
        : "Nothing has been sold at the Marketplace yet."));
      return { node: box, title: "Marketplace" };
    }

    function head(col, text, num) {
      var active = col === sort;
      var next = active ? (dir === "asc" ? "desc" : "asc") : SORTS[col];
      return el("th", {
        class: num ? "hs-num" : null,
        scope: "col",
        "aria-sort": active ? (dir === "asc" ? "ascending" : "descending") : null
      }, link({ q: s.q, kind: s.kind, sort: col, dir: next === SORTS[col] ? "" : next }, [
        text, active ? el("span", { class: "mk-arrow", "aria-hidden": "true" }, dir === "asc" ? " ↑" : " ↓") : null
      ], { class: "mk-sort" }));
    }

    var body = el("tbody");
    items.forEach(function (it) {
      var l = lowest(it);
      body.appendChild(el("tr", null, [
        el("th", { scope: "row", class: "mk-name" }, link({ item: it.id }, it.name)),
        el("td", { class: "hs-num" + (it.guide == null ? " hs-none" : "") }, it.guide == null ? "–" : number.format(it.guide)),
        el("td", { class: "hs-num" }, change(it.change_7d)),
        el("td", { class: "hs-num" + (it.units_7d ? "" : " hs-none") }, it.units_7d ? number.format(it.units_7d) : "–"),
        el("td", { class: "hs-num" + (l ? "" : " hs-none") }, l
          ? [number.format(l.price), el("span", { class: "mk-where" }, town(l.market))]
          : "–")
      ]));
    });
    box.appendChild(el("div", { class: "mk-scroll" }, el("table", { class: "hs-table mk-table mk-browse" }, [
      el("caption", { class: "hs-hidden" }, title + ", by " + sort),
      el("thead", null, el("tr", null, [
        head("name", "Item"),
        head("guide", "Guide price", true),
        head("change", "7 days", true),
        head("sold", "Sold, 7 days", true),
        head("lowest", "For sale from", true)
      ])),
      body
    ])));
    return { node: box, title: s.kind || s.q ? title : "Marketplace" };
  }

  // ── One item ────────────────────────────────────────────────────

  function tile(label, value, sub) {
    return el("div", { class: "mk-tile" }, [
      el("p", { class: "mk-label" }, label),
      el("p", { class: "mk-value" }, value),
      sub ? el("p", { class: "mk-tile-sub" }, sub) : null
    ]);
  }

  function itemView(idx, s) {
    var span = spanOf(s.span);
    return Promise.all([
      get("/items/" + encodeURIComponent(s.item)),
      get("/items/" + encodeURIComponent(s.item) + "/history?span=" + span)
    ]).then(function (both) {
      var d = both[0], h = both[1];
      var box = el("div");
      box.appendChild(el("p", { class: "mk-back" }, link({}, "← All items")));
      box.appendChild(heading(d.name));
      box.appendChild(el("p", { class: "hs-sub" }, kindName(idx, d.kind)));

      var tiles = el("div", { class: "mk-tiles" });
      tiles.appendChild(d.guide == null
        ? tile("Guide price", "None yet", "Too few sales in the last 7 days to say.")
        : tile("Guide price", gold(d.guide), "From " + number.format(d.guide_sales) + (d.guide_sales === 1 ? " sale" : " sales") + " in the last 7 days."));
      var changes = el("ul", { class: "mk-changes" });
      [["day", "Day"], ["week", "Week"], ["month", "30 days"]].forEach(function (p) {
        changes.appendChild(el("li", null, [el("span", null, p[1]), change(d.change[p[0]])]));
      });
      tiles.appendChild(el("div", { class: "mk-tile" }, [el("p", { class: "mk-label" }, "Change"), changes]));
      var week = d.volume.week;
      tiles.appendChild(tile("Sold, 7 days", number.format(week.units),
        week.sales ? "In " + number.format(week.sales) + (week.sales === 1 ? " sale" : " sales") + ", for " + gold(week.gold) + "." : "No sales."));
      tiles.appendChild(d.last_sale
        ? tile("Last sale", gold(d.last_sale.price) + " each", ago(d.last_sale.at) + ".")
        : tile("Last sale", "Never", "Nobody has bought one yet."));
      box.appendChild(tiles);

      var shops = [];
      if (d.shops.sell) shops.push(["Shops sell it for ", el("strong", null, gold(d.shops.sell.price)), " (" + d.shops.sell.shop + ")"]);
      if (d.shops.buy) shops.push([(shops.length ? "and buy it for " : "Shops buy it for "), el("strong", null, gold(d.shops.buy.price)), " (" + d.shops.buy.shop + ")"]);
      if (shops.length) box.appendChild(el("p", { class: "mk-shops" }, [].concat.apply([], shops.map(function (p, i) {
        return i ? [", "].concat(p) : p;
      })).concat(["."])));

      box.appendChild(el("h3", { class: "mk-h3" }, "Price"));
      var spans = el("nav", { class: "hs-tables mk-spans", "aria-label": "How far back" });
      SPANS.forEach(function (sp) {
        spans.appendChild(link({ item: s.item, span: sp.id === "month" ? "" : sp.id }, sp.name, { "aria-current": sp.id === span ? "page" : null }));
      });
      box.appendChild(spans);
      box.appendChild(historyView(h, d));

      box.appendChild(el("h3", { class: "mk-h3" }, "At each Marketplace"));
      box.appendChild(townsView(idx, d));
      return { node: box, title: d.name, updated: d.updated_at };
    }, function (e) {
      if (e.kind !== "notfound") throw e;
      return {
        node: note(["Nothing called ", el("strong", null, s.item), " has been on the Marketplace. ", link({}, "See every item"), "."]),
        title: "Marketplace"
      };
    });
  }

  function townsView(idx, d) {
    var box = el("div");
    var body = el("tbody");
    var sold = 0, most = null;
    d.towns.forEach(function (t) {
      sold += t.sales;
      if (!most || t.sales > most.sales) most = t;
    });
    d.for_sale.forEach(function (f) {
      var t = null;
      d.towns.forEach(function (x) { if (x.market === f.market) t = x; });
      var offers = el("td", { class: f.total ? null : "hs-none" }, f.total
        ? [el("span", { class: "mk-offers" }, f.cheapest.map(function (c) {
            return number.format(c.amount) + " at " + number.format(c.price);
          }).join(", ")), f.total > sumAmounts(f.cheapest) ? el("span", { class: "mk-where" }, number.format(f.total) + " in all") : null]
        : "Nothing");
      body.appendChild(el("tr", null, [
        el("th", { scope: "row" }, marketName(idx, f.market)),
        el("td", { class: "hs-num" + (t && t.guide != null ? "" : " hs-none") }, t && t.guide != null ? number.format(t.guide) : "–"),
        el("td", { class: "hs-num" + (t && t.sales ? "" : " hs-none") }, t && t.sales ? number.format(t.sales) : "–"),
        offers
      ]));
    });
    box.appendChild(el("div", { class: "mk-scroll" }, el("table", { class: "hs-table mk-table mk-towns" }, [
      el("caption", { class: "hs-hidden" }, d.name + " at each Marketplace"),
      el("thead", null, el("tr", null, [
        el("th", { scope: "col" }, "Marketplace"),
        el("th", { class: "hs-num", scope: "col" }, "Guide price"),
        el("th", { class: "hs-num", scope: "col" }, "Sales, 7 days"),
        el("th", { scope: "col" }, "For sale now (how many at what)")
      ])),
      body
    ])));

    var notes = [];
    if (most && sold >= 5 && most.sales / sold >= 0.75) {
      notes.push("Most of the last week's sales were at " + marketName(idx, most.market) + ", so the guide price is mostly its price.");
    }
    var shipping = shippingNote(idx);
    if (shipping) notes.push(shipping);
    if (notes.length) box.appendChild(el("p", { class: "hs-sub mk-towns-note" }, notes.join(" ")));
    return box;
  }

  function sumAmounts(list) {
    return list.reduce(function (n, c) { return n + c.amount; }, 0);
  }

  // "Buying from the other town costs 10% more, for shipping.", if every pair ships at one rate
  function shippingNote(idx) {
    var rates = {};
    idx.markets.forEach(function (m) {
      for (var from in m.shipping) rates[m.shipping[from]] = true;
    });
    var all = Object.keys(rates);
    if (all.length !== 1) return "";
    return "Buying at one Marketplace what's for sale at another costs " + all[0] + "% more, for shipping.";
  }

  // ── The graph ───────────────────────────────────────────────────

  function spanOf(id) {
    for (var i = 0; i < SPANS.length; i++) if (SPANS[i].id === id) return id;
    return "month";
  }

  function historyView(h, d) {
    var box = el("div", { class: "mk-history" });
    if (!h.points.length) {
      box.appendChild(note(d.last_sale
        ? "No sales in this time. The last was " + ago(d.last_sale.at) + "."
        : "No sales yet."));
      return box;
    }
    box.appendChild(el("ul", { class: "mk-legend", "aria-hidden": "true" }, [
      el("li", null, [el("span", { class: "mk-key mk-key-median" }), "Middle price"]),
      el("li", null, [el("span", { class: "mk-key mk-key-guide" }), "Guide price"]),
      el("li", null, [el("span", { class: "mk-key mk-key-range" }), "Lowest to highest (3 or more sales)"])
    ]));
    var holder = el("div", { class: "mk-chart" });
    box.appendChild(holder);
    box.appendChild(figures(h));
    chart = { holder: holder, h: h, name: d.name };
    // (drawn once it's in the page, when it has a width)
    return box;
  }

  function bucketCount(h) {
    return Math.round((h.updated_at - h.from) / h.bucket) + 1;
  }

  // by UTC (buckets are UTC hours and days). On the axis: "14:00" in a day, "13 Oct" otherwise;
  // in full: "13 Oct, 14:00", or "13 Oct 2026" in a year
  function when(t, h, full) {
    var d = new Date(t * 1000);
    var opts = { timeZone: "UTC" };
    if (full || h.span !== "day") { opts.day = "numeric"; opts.month = "short"; }
    if ((full || h.span === "day") && h.bucket < 86400) { opts.hour = "2-digit"; opts.minute = "2-digit"; opts.hourCycle = "h23"; }
    if (full && h.span === "year") opts.year = "numeric";
    return d.toLocaleString("en-GB", opts);
  }

  function bucketLabel(p, h) {
    if (h.bucket >= 86400) return when(p.t, h, true);
    var end = new Date((p.t + h.bucket) * 1000).toLocaleString("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    return when(p.t, h, true) + "–" + end;
  }

  // round ticks: about `count` of them over [lo, hi]
  function ticks(lo, hi, count) {
    var step = Math.pow(10, Math.floor(Math.log10((hi - lo) / count || 1)));
    [1, 2, 5, 10].some(function (m) {
      if ((hi - lo) / (step * m) <= count) { step *= m; return true; }
      return false;
    });
    step = Math.max(1, step);
    var out = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(v);
    return out;
  }

  function compact(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function drawChart() {
    if (!chart || !chart.holder.isConnected) return;
    var holder = chart.holder, h = chart.h, pts = h.points;
    var W = holder.clientWidth;
    if (!W) return;
    clear(holder);
    chart.width = W;

    var n = bucketCount(h);
    var M = { left: 44, right: 10, top: 10 };
    var priceH = 200, gap = 18, volH = 56, axisH = 22;
    var H = M.top + priceH + gap + volH + axisH;
    var plotW = W - M.left - M.right;
    var slot = plotW / n;
    var xOf = function (t) { return M.left + ((t - h.from) / h.bucket + 0.5) * slot; };

    var lo = Infinity, hi = -Infinity, most = 0;
    pts.forEach(function (p) {
      [p.median, p.low, p.high, p.guide].forEach(function (v) {
        if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      });
      most = Math.max(most, p.units);
    });
    var pad = Math.max(1, (hi - lo) * 0.12);
    lo = Math.max(0, Math.floor(lo - pad));
    hi = Math.ceil(hi + pad);
    var yTicks = ticks(lo, hi, 4);
    var yOf = function (v) { return M.top + priceH - (v - lo) / (hi - lo) * priceH; };
    var volTop = M.top + priceH + gap;
    var vOf = function (u) { return volTop + volH - (most ? u / most * volH : 0); };

    var s = svg("svg", {
      class: "mk-svg", width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", tabindex: "0",
      "aria-label": chart.name + "'s price over the last " + h.span + ". The figures are in the table below; the arrow keys move along it."
    });

    // the grid and the price axis
    yTicks.forEach(function (v) {
      s.appendChild(svg("line", { class: "mk-grid", x1: M.left, x2: W - M.right, y1: yOf(v), y2: yOf(v) }));
      var t = svg("text", { class: "mk-tick", x: M.left - 6, y: yOf(v), "text-anchor": "end", "dominant-baseline": "middle" });
      t.textContent = compact(v);
      s.appendChild(t);
    });
    s.appendChild(svg("line", { class: "mk-base", x1: M.left, x2: W - M.right, y1: volTop + volH, y2: volTop + volH }));
    var vt = svg("text", { class: "mk-tick", x: M.left - 6, y: volTop + 4, "text-anchor": "end", "dominant-baseline": "hanging" });
    vt.textContent = compact(most);
    s.appendChild(vt);
    var vl = svg("text", { class: "mk-tick", x: M.left - 6, y: volTop + volH, "text-anchor": "end" });
    vl.textContent = "sold";
    s.appendChild(vl);

    // runs of neighbouring buckets: a line never crosses a gap with no sales
    function runs(has) {
      var out = [], run = [];
      pts.forEach(function (p, i) {
        var next = i > 0 && (p.t - pts[i - 1].t) === h.bucket;
        if (!has(p) || !next) { if (run.length) out.push(run); run = []; }
        if (has(p)) run.push(p);
      });
      if (run.length) out.push(run);
      return out;
    }

    // the range, where a bucket has one
    runs(function (p) { return p.low != null; }).forEach(function (run) {
      if (run.length < 2) {
        var p = run[0];
        s.appendChild(svg("rect", { class: "mk-range", x: xOf(p.t) - Math.min(4, slot / 3), width: Math.min(8, slot / 1.5),
          y: yOf(p.high), height: Math.max(1, yOf(p.low) - yOf(p.high)), rx: 2 }));
        return;
      }
      var top = run.map(function (p) { return xOf(p.t) + "," + yOf(p.high); });
      var bottom = run.slice().reverse().map(function (p) { return xOf(p.t) + "," + yOf(p.low); });
      s.appendChild(svg("polygon", { class: "mk-range", points: top.concat(bottom).join(" ") }));
    });

    function line(cls, value) {
      runs(function (p) { return value(p) != null; }).forEach(function (run) {
        if (run.length === 1) {
          s.appendChild(svg("circle", { class: cls + "-dot", cx: xOf(run[0].t), cy: yOf(value(run[0])), r: 4 }));
          return;
        }
        s.appendChild(svg("polyline", { class: cls, points: run.map(function (p) { return xOf(p.t) + "," + yOf(value(p)); }).join(" ") }));
      });
    }
    line("mk-guide", function (p) { return p.guide; });
    line("mk-median", function (p) { return p.median; });

    // what sold: a bar a bucket
    var barW = Math.max(1, Math.min(24, slot - 2));
    pts.forEach(function (p) {
      var y = vOf(p.units), bh = volTop + volH - y;
      if (bh <= 0) return;
      var r = Math.min(4, barW / 2, bh);
      var x = xOf(p.t) - barW / 2;
      s.appendChild(svg("path", { class: "mk-bar",
        d: "M" + x + "," + (volTop + volH) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
           "H" + (x + barW - r) + "Q" + (x + barW) + "," + y + " " + (x + barW) + "," + (y + r) + "V" + (volTop + volH) + "Z" }));
    });

    // the time axis: about five labels
    var every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 64))));
    var first = h.from + h.bucket * ((n - 1) % every);
    for (var t = first; t <= h.updated_at; t += h.bucket * every) {
      var lab = svg("text", { class: "mk-tick", x: xOf(t), y: H - 6, "text-anchor": "middle" });
      lab.textContent = when(t, h, false);
      s.appendChild(lab);
    }

    // the crosshair: follows the pointer (or the arrow keys) to the nearest bucket with sales
    var cross = svg("line", { class: "mk-cross", y1: M.top, y2: volTop + volH, visibility: "hidden" });
    var ring = svg("circle", { class: "mk-ring", r: 5, visibility: "hidden" });
    s.appendChild(cross);
    s.appendChild(ring);
    var tip = el("div", { class: "mk-tip", hidden: "" });
    var at = -1;

    function show(i) {
      at = i;
      var p = pts[i], x = xOf(p.t);
      cross.setAttribute("x1", x);
      cross.setAttribute("x2", x);
      cross.setAttribute("visibility", "visible");
      ring.setAttribute("cx", x);
      ring.setAttribute("cy", yOf(p.median));
      ring.setAttribute("visibility", "visible");
      clear(tip);
      tip.appendChild(el("p", { class: "mk-tip-when" }, bucketLabel(p, h) + (h.bucket < 86400 ? " UTC" : "")));
      tip.appendChild(el("p", null, [el("span", { class: "mk-key mk-key-median" }), el("strong", null, gold(p.median)), " middle"]));
      if (p.low != null) tip.appendChild(el("p", null, [el("span", { class: "mk-key mk-key-range" }), number.format(p.low) + " to " + number.format(p.high)]));
      if (p.guide != null) tip.appendChild(el("p", null, [el("span", { class: "mk-key mk-key-guide" }), number.format(p.guide) + " guide"]));
      tip.appendChild(el("p", { class: "mk-tip-sold" }, number.format(p.units) + " sold in " + number.format(p.sales) + (p.sales === 1 ? " sale" : " sales")));
      tip.hidden = false;
      var left = x + 12;
      if (left + tip.offsetWidth > W) left = x - 12 - tip.offsetWidth;
      tip.style.left = Math.max(0, left) + "px";
      tip.style.top = M.top + "px";
    }

    function hide() {
      at = -1;
      cross.setAttribute("visibility", "hidden");
      ring.setAttribute("visibility", "hidden");
      tip.hidden = true;
    }

    function nearest(x) {
      var best = 0, dist = Infinity;
      pts.forEach(function (p, i) {
        var dx = Math.abs(xOf(p.t) - x);
        if (dx < dist) { dist = dx; best = i; }
      });
      return best;
    }

    s.addEventListener("pointermove", function (e) {
      var box = s.getBoundingClientRect();
      show(nearest(e.clientX - box.left));
    });
    s.addEventListener("pointerleave", hide);
    s.addEventListener("blur", hide);
    s.addEventListener("focus", function () { show(at < 0 ? pts.length - 1 : at); });
    s.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      show(Math.max(0, Math.min(pts.length - 1, (at < 0 ? pts.length - 1 : at) + (e.key === "ArrowLeft" ? -1 : 1))));
    });

    holder.appendChild(s);
    holder.appendChild(tip);
  }

  // the graph's figures, as a table
  function figures(h) {
    var body = el("tbody");
    h.points.slice().reverse().forEach(function (p) {
      body.appendChild(el("tr", null, [
        el("th", { scope: "row" }, bucketLabel(p, h)),
        el("td", { class: "hs-num" }, number.format(p.median)),
        el("td", { class: "hs-num" + (p.low == null ? " hs-none" : "") }, p.low == null ? "–" : number.format(p.low) + "–" + number.format(p.high)),
        el("td", { class: "hs-num" + (p.guide == null ? " hs-none" : "") }, p.guide == null ? "–" : number.format(p.guide)),
        el("td", { class: "hs-num" }, number.format(p.units)),
        el("td", { class: "hs-num" }, number.format(p.sales))
      ]));
    });
    return el("details", { class: "mk-figures" }, [
      el("summary", null, "The figures" + (h.bucket < 86400 ? " (times are UTC)" : "")),
      el("div", { class: "mk-scroll" }, el("table", { class: "hs-table mk-table" }, [
        el("thead", null, el("tr", null, [
          el("th", { scope: "col" }, h.bucket < 86400 ? "Hours" : "Day"),
          el("th", { class: "hs-num", scope: "col" }, "Middle"),
          el("th", { class: "hs-num", scope: "col" }, "Range"),
          el("th", { class: "hs-num", scope: "col" }, "Guide"),
          el("th", { class: "hs-num", scope: "col" }, "Sold"),
          el("th", { class: "hs-num", scope: "col" }, "Sales")
        ])),
        body
      ]))
    ]);
  }

  if (window.ResizeObserver) {
    var redraw = 0;
    new ResizeObserver(function () {
      if (!chart || chart.holder.clientWidth === chart.width) return;
      cancelAnimationFrame(redraw);
      redraw = requestAnimationFrame(drawChart);
    }).observe(view);
  }

  // ── Errors ──────────────────────────────────────────────────────

  function errorView(e) {
    var text = e.kind === "notready"
      ? "The prices aren't ready yet: the game has just restarted. Try again in a minute."
      : "The Marketplace's prices can't be reached right now. Try again in a minute.";
    var retry = el("button", { type: "button", class: "btn btn-ghost" }, "Try again");
    retry.addEventListener("click", function () { render(true); });
    return el("div", { class: "hs-error" }, [note(text), retry]);
  }

  // ── Showing a view ──────────────────────────────────────────────

  function state() {
    var q = new URLSearchParams(location.search);
    var s = {};
    ["item", "span", "q", "kind", "sort", "dir"].forEach(function (k) {
      s[k] = (q.get(k) || "").trim();
    });
    s.item = s.item.toLowerCase();
    s.kind = s.kind.toLowerCase();
    return s;
  }

  // focus: move focus to the new view's heading (after a link or a search, not on the first load)
  function render(focus) {
    var s = state();
    var mine = ++latest;
    input.value = s.q;
    chart = null;

    // keep the view's height while it loads, so the page doesn't jump
    view.style.minHeight = view.offsetHeight + "px";
    view.setAttribute("aria-busy", "true");
    clear(view);
    view.appendChild(note("Loading…"));

    catalogue().then(function (idx) {
      if (mine !== latest) return;
      drawKinds(idx, s);
      updatedAt = idx.updated_at || 0;
      return s.item ? itemView(idx, s) : browseView(idx, s);
    }).then(function (v) {
      if (!v || mine !== latest) return;
      if (v.updated) updatedAt = v.updated;
      clear(view);
      view.appendChild(v.node);
      drawChart();
      document.title = v.title === "Marketplace" ? baseTitle : v.title + " · " + baseTitle;
      var h = view.querySelector(".hs-heading");
      if (focus && h) h.focus();
    }, function (e) {
      if (mine !== latest) return;
      updatedAt = 0;
      chart = null;
      clear(view);
      view.appendChild(errorView(e));
      document.title = baseTitle;
    }).then(function () {
      if (mine !== latest) return;
      view.style.minHeight = "";
      view.removeAttribute("aria-busy");
      showUpdated();
    });
  }

  function go(q) {
    var url = href(q);
    if (url !== location.pathname + location.search) history.pushState(null, "", url);
    render(true);
  }

  root.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-mk-link]");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    history.pushState(null, "", a.getAttribute("href"));
    render(true);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var s = state();
    go({ q: input.value.trim(), kind: s.item ? "" : s.kind, sort: s.sort, dir: s.dir });
  });

  window.addEventListener("popstate", function () { render(false); });

  // "Updated N minutes ago" keeps counting, without asking again
  setInterval(showUpdated, 30000);

  root.hidden = false;
  render(false);
})();
