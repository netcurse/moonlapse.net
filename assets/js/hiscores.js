// The hiscores page ({{< hiscores >}}). Everything it shows comes from the API at data-api, asked
// once per view: no polling. The view is in the address, so every one has a link of its own.
(function () {
  var root = document.querySelector("[data-hiscores]");
  if (!root || !window.fetch || !window.URLSearchParams) return;

  var API = root.getAttribute("data-api");
  var TIMEOUT_MS = 5000;
  // what a character's name can be; anything else is nobody, without asking
  var NAME = /^[A-Za-z0-9_]{1,32}$/;
  var WHOLE = /^[1-9][0-9]{0,8}$/;

  var form = root.querySelector(".hs-search");
  var inputs = { player: form.elements.player, vs: form.elements.vs };
  var tablesNav = root.querySelector("[data-hs-tables]");
  var updatedEl = root.querySelector("[data-hs-updated]");
  var view = root.querySelector("[data-hs-view]");
  var baseTitle = document.title;
  var number = window.Intl ? new Intl.NumberFormat("en-US") : { format: String };

  var index = null;   // the tables, as a promise, until it fails
  var updatedAt = 0;
  var latest = 0;     // the latest view asked for: answers for older ones are dropped

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

  function tables() {
    if (!index) {
      index = get("").then(function (d) {
        if (!d || !d.tables || !d.tables.length) throw failure("unreachable");
        return d;
      });
      index.catch(function () { index = null; });
    }
    return index;
  }

  function lookup(name) {
    if (!NAME.test(name)) return Promise.resolve({ name: name, missing: true });
    return get("/players/" + encodeURIComponent(name)).then(function (d) {
      return { name: d.name, data: d };
    }, function (e) {
      if (e.kind === "notfound") return { name: name, missing: true };
      throw e;
    });
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

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  // a link to a view of this page: { table, page, rank, name, player, vs }
  function href(q) {
    var p = new URLSearchParams();
    ["table", "page", "rank", "name", "player", "vs"].forEach(function (k) {
      if (q[k] != null && q[k] !== "") p.set(k, q[k]);
    });
    var s = p.toString();
    return location.pathname + (s ? "?" + s : "");
  }

  function link(q, text, attrs) {
    attrs = attrs || {};
    attrs.href = href(q);
    attrs["data-hs-link"] = "";
    return el("a", attrs, text);
  }

  function tableLink(t, extra) {
    var q = extra || {};
    q.table = t.id === "overall" && !q.page && !q.rank && !q.name ? null : t.id;
    return q;
  }

  function note(children) {
    return el("p", { class: "hs-note" }, children);
  }

  function heading(text) {
    return el("h2", { class: "hs-heading", tabindex: "-1" }, text);
  }

  function nobody(name) {
    return note(["Nobody called ", el("strong", null, name), " is on the hiscores."]);
  }

  function skillName(idx, id) {
    for (var i = 0; i < idx.tables.length; i++) if (idx.tables[i].id === id) return idx.tables[i].name;
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  function num(n) {
    return el("td", { class: "hs-num" }, number.format(n));
  }

  function ago(seconds) {
    var mins = Math.floor((Date.now() / 1000 - seconds) / 60);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + (mins === 1 ? " minute ago" : " minutes ago");
    var hours = Math.floor(mins / 60);
    return hours + (hours === 1 ? " hour ago" : " hours ago");
  }

  function showUpdated() {
    if (!updatedAt) {
      updatedEl.textContent = "";
      updatedEl.removeAttribute("title");
      return;
    }
    updatedEl.textContent = "Updated " + ago(updatedAt) + ". Progress shows up after a character's next save.";
    updatedEl.title = new Date(updatedAt * 1000).toLocaleString();
  }

  function drawTables(idx, current) {
    clear(tablesNav);
    idx.tables.forEach(function (t) {
      tablesNav.appendChild(link(tableLink(t), t.name, {
        "aria-current": t.id === current ? "page" : null
      }));
    });
  }

  // ── Views ───────────────────────────────────────────────────────

  // Each gives { node, title, updated } (updated: the answer's updated_at, if any)

  function tableView(idx, s) {
    var t = null;
    idx.tables.forEach(function (x) { if (x.id === s.table) t = x; });
    if (!t) {
      return Promise.resolve({
        node: note(["There's no table called ", el("strong", null, s.table), ". ",
          link({}, "See the overall hiscores"), "."]),
        title: "Hiscores"
      });
    }
    var overall = t.id === "overall";
    var name = s.name && NAME.test(s.name) ? s.name : null;
    var q = name ? "?name=" + encodeURIComponent(name)
      : WHOLE.test(s.rank || "") ? "?rank=" + s.rank
      : WHOLE.test(s.page || "") ? "?page=" + s.page : "";

    if (s.name && !name) return Promise.resolve({ node: nobody(s.name), title: t.name });

    return get("/" + t.id + q).then(function (d) {
      var box = el("div", null, heading(t.name));
      box.appendChild(el("p", { class: "hs-sub" },
        d.ranked === 1 ? "1 character ranked" : number.format(d.ranked) + " characters ranked"));

      if (!d.rows.length) {
        box.appendChild(note(d.ranked
          ? ["Nobody's that far down. ", link(tableLink(t, { page: d.pages }), "Go to the last page"), "."]
          : "Nobody's ranked here yet."));
        return { node: box, title: t.name, updated: d.updated_at };
      }

      var hit = null;
      var body = el("tbody");
      d.rows.forEach(function (r) {
        var mine = name ? r.name.toLowerCase() === name.toLowerCase() : String(r.rank) === s.rank;
        var row = el("tr", { class: mine ? "hs-hit" : null }, [
          num(r.rank),
          el("td", { class: "hs-name" }, link({ player: r.name }, r.name)),
          num(r.level),
          num(r.xp)
        ]);
        if (mine) hit = row;
        body.appendChild(row);
      });
      box.appendChild(el("table", { class: "hs-table" }, [
        el("caption", { class: "hs-hidden" }, t.name + ", page " + d.page + " of " + d.pages),
        el("thead", null, el("tr", null, [
          el("th", { class: "hs-num", scope: "col" }, "Rank"),
          el("th", { scope: "col" }, "Name"),
          el("th", { class: "hs-num", scope: "col" }, overall ? "Total level" : "Level"),
          el("th", { class: "hs-num", scope: "col" }, overall ? "Total XP" : "XP")
        ])),
        body
      ]));
      box.appendChild(pager(t, d));
      return { node: box, title: t.name, updated: d.updated_at, hit: hit };
    }, function (e) {
      if (e.kind !== "notfound" || !name) throw e;
      return {
        node: note([el("strong", null, name), " isn't ranked in " + t.name + ". ",
          link({ player: name }, "Look them up"), "."]),
        title: t.name
      };
    });
  }

  function pager(t, d) {
    var nav = el("nav", { class: "hs-pager", "aria-label": "Pages" });
    nav.appendChild(d.page > 1
      ? link(tableLink(t, { page: d.page - 1 }), "← Previous", { rel: "prev" })
      : el("span"));
    var jump = el("form", { class: "hs-jump" }, [
      el("label", { for: "hs-rank" }, "Page " + d.page + " of " + d.pages + " · rank"),
      el("input", { id: "hs-rank", name: "rank", type: "number", min: "1", inputmode: "numeric" }),
      el("button", { type: "submit", class: "btn btn-ghost" }, "Go")
    ]);
    jump.addEventListener("submit", function (e) {
      e.preventDefault();
      var rank = jump.elements.rank.value.trim();
      if (WHOLE.test(rank)) go(tableLink(t, { rank: rank }));
    });
    nav.appendChild(jump);
    nav.appendChild(d.page < d.pages
      ? link(tableLink(t, { page: d.page + 1 }), "Next →", { rel: "next" })
      : el("span"));
    return nav;
  }

  function playerView(idx, s) {
    var names = [s.player];
    if (s.vs && s.vs.toLowerCase() !== s.player.toLowerCase()) names.push(s.vs);
    return Promise.all(names.map(lookup)).then(function (found) {
      var here = found.filter(function (f) { return !f.missing; });
      var box = el("div");
      found.forEach(function (f) { if (f.missing) box.appendChild(nobody(f.name)); });
      if (here.length === 2) {
        box.appendChild(compare(idx, here[0].data, here[1].data));
        return { node: box, title: here[0].name + " vs " + here[1].name, updated: newest(here) };
      }
      if (here.length === 1) {
        box.appendChild(player(idx, here[0].data));
        return { node: box, title: here[0].name, updated: newest(here) };
      }
      return { node: box, title: "Hiscores" };
    });
  }

  function newest(found) {
    return Math.max.apply(null, found.map(function (f) { return f.data.updated_at || 0; }));
  }

  function rankCell(id, name, rank) {
    if (rank == null) return el("td", { class: "hs-num hs-none" }, "–");
    return el("td", { class: "hs-num" }, link({ table: id, name: name }, number.format(rank)));
  }

  function player(idx, d) {
    var box = el("div", null, heading(d.name));
    box.appendChild(el("p", { class: "hs-sub" }, "Combat level " + d.combat_level));
    var body = el("tbody");
    var rows = [{ id: "overall", rank: d.overall.rank, level: d.overall.level, xp: d.overall.xp }].concat(d.skills);
    rows.forEach(function (r) {
      var unranked = r.rank == null;
      body.appendChild(el("tr", { class: (r.id === "overall" ? "hs-total" : "") + (unranked ? " hs-none" : "") || null }, [
        el("th", { scope: "row" }, unranked ? skillName(idx, r.id) : link({ table: r.id, name: d.name }, skillName(idx, r.id))),
        rankCell(r.id, d.name, r.rank),
        num(r.level),
        num(r.xp)
      ]));
    });
    box.appendChild(el("table", { class: "hs-table hs-player" }, [
      el("caption", { class: "hs-hidden" }, d.name + "'s levels"),
      el("thead", null, el("tr", null, [
        el("th", { scope: "col" }, "Skill"),
        el("th", { class: "hs-num", scope: "col" }, "Rank"),
        el("th", { class: "hs-num", scope: "col" }, "Level"),
        el("th", { class: "hs-num", scope: "col" }, "XP")
      ])),
      body
    ]));
    return box;
  }

  function compare(idx, a, b) {
    var box = el("div", null, heading(a.name + " vs " + b.name));
    var wins = [0, 0];
    var body = el("tbody");

    function cell(r, other, i) {
      var win = r.xp > other.xp;
      if (win && i >= 0) wins[i]++;
      return el("td", { class: "hs-num" + (win ? " hs-win" : "") + (r.rank == null ? " hs-none" : "") }, [
        el("span", { class: "hs-level" }, number.format(r.level)),
        el("span", { class: "hs-xp" }, number.format(r.xp) + " xp"),
        el("span", { class: "hs-rank" }, r.rank == null ? "unranked" : "rank " + number.format(r.rank))
      ]);
    }

    body.appendChild(el("tr", { class: "hs-total" }, [
      el("th", { scope: "row" }, "Overall"), cell(a.overall, b.overall, -1), cell(b.overall, a.overall, -1)
    ]));
    body.appendChild(el("tr", null, [
      el("th", { scope: "row" }, "Combat"),
      el("td", { class: "hs-num" + (a.combat_level > b.combat_level ? " hs-win" : "") },
        el("span", { class: "hs-level" }, a.combat_level)),
      el("td", { class: "hs-num" + (b.combat_level > a.combat_level ? " hs-win" : "") },
        el("span", { class: "hs-level" }, b.combat_level))
    ]));
    a.skills.forEach(function (ra) {
      var rb = null;
      b.skills.forEach(function (x) { if (x.id === ra.id) rb = x; });
      if (!rb) return;
      body.appendChild(el("tr", null, [
        el("th", { scope: "row" }, skillName(idx, ra.id)), cell(ra, rb, 0), cell(rb, ra, 1)
      ]));
    });

    box.appendChild(el("table", { class: "hs-table hs-compare" }, [
      el("caption", { class: "hs-hidden" }, a.name + " and " + b.name + " side by side"),
      el("thead", null, el("tr", null, [
        el("th", { scope: "col" }, "Skill"),
        el("th", { class: "hs-num", scope: "col" }, link({ player: a.name }, a.name)),
        el("th", { class: "hs-num", scope: "col" }, link({ player: b.name }, b.name))
      ])),
      body
    ]));

    var lead = function (name, n) { return name + " leads in " + n + (n === 1 ? " skill" : " skills"); };
    box.appendChild(el("p", { class: "hs-sub" },
      wins[0] || wins[1] ? lead(a.name, wins[0]) + ", " + lead(b.name, wins[1]) + "." : "Level with each other in every skill."));
    return box;
  }

  function errorView(e) {
    var text = e.kind === "notready"
      ? "The hiscores aren't ready yet: the game has just restarted. Try again in a minute."
      : "The hiscores can't be reached right now. Try again in a minute.";
    var retry = el("button", { type: "button", class: "btn btn-ghost" }, "Try again");
    retry.addEventListener("click", function () { render(true); });
    return el("div", { class: "hs-error" }, [note(text), retry]);
  }

  // ── Showing a view ──────────────────────────────────────────────

  function state() {
    var q = new URLSearchParams(location.search);
    var s = {};
    ["table", "page", "rank", "name", "player", "vs"].forEach(function (k) {
      s[k] = (q.get(k) || "").trim();
    });
    if (!s.player && s.vs) { s.player = s.vs; s.vs = ""; }
    s.table = (s.table || "overall").toLowerCase();
    return s;
  }

  // focus: move focus to the new view's heading (after a link or a search, not on the first load)
  function render(focus) {
    var s = state();
    var mine = ++latest;
    inputs.player.value = s.player;
    inputs.vs.value = s.vs;

    // keep the view's height while it loads, so the page doesn't jump
    view.style.minHeight = view.offsetHeight + "px";
    view.setAttribute("aria-busy", "true");
    clear(view);
    view.appendChild(note("Loading…"));

    tables().then(function (idx) {
      if (mine !== latest) return;
      drawTables(idx, s.player ? null : s.table);
      updatedAt = idx.updated_at || 0;
      return (s.player ? playerView(idx, s) : tableView(idx, s));
    }).then(function (v) {
      if (!v || mine !== latest) return;
      if (v.updated) updatedAt = v.updated;
      clear(view);
      view.appendChild(v.node);
      document.title = v.title === "Hiscores" ? baseTitle : v.title + " · " + baseTitle;
      if (v.hit && v.hit.scrollIntoView) v.hit.scrollIntoView({ block: "nearest" });
      var h = view.querySelector(".hs-heading");
      if (focus && h) h.focus({ preventScroll: !!v.hit });
    }, function (e) {
      if (mine !== latest) return;
      updatedAt = 0;
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
    var a = e.target.closest && e.target.closest("a[data-hs-link]");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    history.pushState(null, "", a.getAttribute("href"));
    render(true);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var player = inputs.player.value.trim();
    var vs = inputs.vs.value.trim();
    go(player || vs ? { player: player || vs, vs: player ? vs : "" } : {});
  });

  window.addEventListener("popstate", function () { render(false); });

  // "Updated N minutes ago" keeps counting, without asking again
  setInterval(showUpdated, 30000);

  root.hidden = false;
  render(false);
})();
