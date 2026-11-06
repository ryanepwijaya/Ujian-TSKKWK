/* Lima Buku UPKP — single-page app (vanilla JS, hash routing, no build step) */
(function () {
  "use strict";

  /* ---------- data ---------- */
  const BOOKS = (window.BOOKS || []).slice().sort((a, b) => a.no - b.no);
  const BMAP = {};
  BOOKS.forEach((b) => { BMAP[b.id] = b; b.cmap = {}; b.chapters.forEach((c, i) => { c.i = i; c.book = b; b.cmap[c.id] = c; }); });
  const QS = [];
  BOOKS.forEach((b) => (window.QBANK[b.id] || []).forEach((q, i) => QS.push({ id: b.id + "-" + i, b: b.id, c: q[0], t: q[1], q: q[2], o: q[3], e: q[4] })));
  const QMAP = {}; QS.forEach((q) => (QMAP[q.id] = q));
  const TYPES = { H: "Hafalan", P: "Pemahaman", K: "Kasus", A: "Analisis" };
  const TOTAL_CH = BOOKS.reduce((s, b) => s + b.chapters.length, 0);

  /* ---------- storage (per-device convenience) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("lb5:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("lb5:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
    del(k) { try { localStorage.removeItem("lb5:" + k); } catch (e) { /* ignore */ } }
  };
  const S = {
    read: store.get("read", {}), qs: store.get("qs", {}), flags: store.get("flags", {}),
    last: store.get("last", null), quiz: store.get("quiz", null), recent: store.get("recent", []),
    returnQuiz: false, pending: null
  };
  const save = (k) => store.set(k, S[k]);

  /* ---------- icons ---------- */
  const P = {
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    gem: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M12 21 8 9l4-6 4 6z"/>',
    landmark: '<path d="M3 21h18M4 10h16M12 3l9 5H3z"/><path d="M6 10v8M10 10v8M14 10v8M18 10v8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3.5 5.5"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    books: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="m16 5 3.5-1 2.5 15.5-3.5 1z"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    shuffle: '<path d="M3 7h3.5c2 0 3.2 1 4.3 2.7l2.4 4.6C14.3 16 15.5 17 17.5 17H21M17 13l4 4-4 4M3 17h3.5c1.4 0 2.4-.5 3.3-1.4M21 7h-3.5c-1.4 0-2.4.5-3.3 1.4M17 3l4 4-4 4"/>',
    repeat: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    link: '<path d="M9 7H7a5 5 0 0 0 0 10h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8"/>',
    case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M14 9l2 2"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    filter: '<path d="M4 5h16l-6 8v5l-4 2v-7z"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    fire: '<path d="M12 3c1 3 4 5 4 9a4 4 0 0 1-8 0c0-2 1-3 1-3s.5 2 2 2c0-3-1-5 1-8z"/>'
  };
  const ic = (n, cls) => '<svg class="' + (cls || "icon") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || "") + "</svg>";

  /* ---------- utils ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mini-markdown ---------- */
  const REG = /\b((?:UU|PP|PMK|KMK|IMK|SE|Perpres|Keppres|Perppu)[\s-]?(?:Nomor\s)?\d+(?:\/[A-Z]+(?:\.[A-Z0-9]+)?)?\/\d{4})\b/g;
  function inl(s) {
    s = esc(s);
    s = s.replace(REG, '<span class="reg">$1</span>');
    s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>");
    s = s.replace(/==(.+?)==/g, "<mark>$1</mark>");
    return s;
  }
  const plain = (s) => String(s).replace(/\*\*|==/g, "").replace(/(^|\s)\*([^*]+)\*/g, "$1$2").replace(/\|\|/g, " — ").replace(/^[>\-\s]+/, "").replace(/\[![a-z]+\]/g, "");
  const CALL = { ingat: ["Ingat", "bulb"], tips: ["Tips ujian", "target"], jembatan: ["Jembatan keledai", "link"], kasus: ["Contoh kasus", "case"] };

  function listHtml(lines, ordered) {
    const tag = ordered ? "ol" : "ul";
    return "<" + tag + ">" + lines.map((l) => "<li>" + inl(l.replace(/^(\d+\.|-)\s+/, "")) + "</li>").join("") + "</" + tag + ">";
  }
  function miniBlocks(lines) {
    let out = "", buf = [], lst = [];
    const flushP = () => { if (buf.length) { out += "<p>" + inl(buf.join(" ")) + "</p>"; buf = []; } };
    const flushL = () => { if (lst.length) { out += listHtml(lst, false); lst = []; } };
    lines.forEach((l) => { if (/^- /.test(l)) { flushP(); lst.push(l); } else if (l.trim()) { flushL(); buf.push(l); } });
    flushP(); flushL();
    return out;
  }

  const parseCache = {};
  function parseMd(src, key) {
    if (key && parseCache[key]) return parseCache[key];
    const lines = src.replace(/\r/g, "").split("\n");
    let html = "", para = [], sections = [], open = false, used = {};
    const counts = { hafal: 0, flash: 0 };
    const flush = () => { if (para.length) { html += "<p>" + inl(para.join(" ")) + "</p>"; para = []; } };
    const curText = () => sections.length ? sections[sections.length - 1] : null;
    const addText = (t) => { const c = curText(); if (c) c.text += " " + plain(t); };
    let i = 0;
    while (i < lines.length) {
      const raw = lines[i], l = raw.trimEnd();
      if (!l.trim()) { flush(); i++; continue; }
      if (l.startsWith("## ")) {
        flush();
        const t = l.slice(3).trim();
        let id = "s-" + slug(t); while (used[id]) id += "x"; used[id] = 1;
        if (open) html += "</section>";
        html += '<section class="sec" id="' + id + '"><h2>' + inl(t) + "</h2>";
        open = true; sections.push({ id, title: plain(t), text: "" }); i++; continue;
      }
      if (l.startsWith("### ")) { flush(); const t = l.slice(4).trim(); html += "<h3>" + inl(t) + "</h3>"; addText(t); i++; continue; }
      if (l.startsWith("::: ")) {
        flush();
        const head = l.slice(4).trim(); const sp = head.indexOf(" ");
        const type = sp < 0 ? head : head.slice(0, sp); const title = sp < 0 ? "" : head.slice(sp + 1);
        const body = []; i++;
        while (i < lines.length && lines[i].trim() !== ":::") { if (lines[i].trim()) body.push(lines[i].trim()); i++; }
        i++;
        if (type === "hafal") {
          counts.hafal++;
          const items = body.map((b) => b.replace(/^\d+\.\s*/, ""));
          html += '<div class="hafal" data-n="' + items.length + '"><div class="hafal-h"><div style="flex:1;min-width:0"><span class="eyebrow">Hafalan · ' + items.length + ' butir</span><b>' + inl(title) + '</b></div><button class="toggle" type="button" aria-pressed="false" data-act="hafal">' + ic("eye", "icon") + "Mode hafal</button></div><ol>" +
            items.map((t) => "<li><span>" + inl(t) + "</span></li>").join("") +
            '</ol><div class="hafal-f"><span class="hcount">Ketuk butir untuk membuka · 0/' + items.length + '</span><button class="btn sm ghost" type="button" data-act="hafal-all">Buka semua</button></div></div>';
          addText(title + " " + items.join(" "));
        } else if (type === "flash") {
          counts.flash++;
          html += '<div class="flash">' + body.map((b) => { const [f, k] = b.split("||"); return '<button class="fc" type="button" data-act="flip"><div class="fc-in"><div class="fc-f"><b>' + inl(f.trim()) + '</b><small>Ketuk untuk membalik</small></div><div class="fc-b">' + inl((k || "").trim()) + "</div></div></button>"; }).join("") + "</div>";
          addText(body.join(" "));
        } else if (type === "grid") {
          html += '<div class="gridc">' + body.map((b) => { const [f, k] = b.split("||"); return '<div class="gc"><h5>' + inl(f.trim()) + "</h5><p>" + inl((k || "").trim()) + "</p></div>"; }).join("") + "</div>";
          addText(body.join(" "));
        } else if (type === "steps") {
          html += '<ol class="steps">' + body.map((b) => "<li>" + inl(b) + "</li>").join("") + "</ol>";
          addText(body.join(" "));
        }
        continue;
      }
      if (l.startsWith(">")) {
        flush();
        const block = [];
        while (i < lines.length && lines[i].trim().startsWith(">")) { block.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
        let type = "ingat"; const m = block[0].match(/^\[!([a-z]+)\]\s*/);
        if (m) { type = m[1]; block[0] = block[0].slice(m[0].length); }
        const c = CALL[type] || CALL.ingat;
        html += '<div class="callout ' + type + '"><span class="ci">' + ic(c[1], "icon") + '</span><div><span class="cl">' + c[0] + "</span>" + miniBlocks(block) + "</div></div>";
        addText(block.join(" "));
        continue;
      }
      if (l.startsWith("|")) {
        flush();
        const rows = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((x) => x.trim())); i++; }
        html += '<div class="tbl"><table><thead><tr>' + rows[0].map((h) => "<th>" + inl(h) + "</th>").join("") + "</tr></thead><tbody>" +
          rows.slice(1).map((r) => "<tr>" + r.map((d) => "<td>" + inl(d) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
        addText(rows.map((r) => r.join(" ")).join(" "));
        continue;
      }
      if (/^\d+\.\s/.test(l) || /^- /.test(l)) {
        flush();
        const ord = /^\d+\.\s/.test(l); const items = [];
        while (i < lines.length && (ord ? /^\d+\.\s/ : /^- /).test(lines[i].trim())) { items.push(lines[i].trim()); i++; }
        html += listHtml(items, ord); addText(items.join(" "));
        continue;
      }
      para.push(l.trim()); addText(l); i++;
    }
    flush();
    if (open) html += "</section>";
    const res = { html, sections, counts };
    if (key) parseCache[key] = res;
    return res;
  }
  const chapParsed = (b, c) => parseMd(c.md, b.id + "/" + c.id);

  /* ---------- search index ---------- */
  let IDX = null, KW = null;
  function buildIndex() {
    if (IDX) return;
    IDX = []; const kw = new Map();
    const addKw = (k, b, c) => { k = plain(k).replace(/[.,;:]+$/, "").trim(); if (k.length < 3 || k.length > 60) return; const n = norm(k); if (!kw.has(n)) kw.set(n, { k, b, c }); };
    BOOKS.forEach((b) => b.chapters.forEach((c) => {
      const p = chapParsed(b, c);
      p.sections.forEach((s) => { IDX.push({ b: b.id, c: c.id, sec: s.id, title: s.title, ch: c.title, text: s.text.replace(/\s+/g, " ").trim(), n: norm(s.title + " " + s.text) }); addKw(s.title, b.id, c.id); });
      addKw(c.title, b.id, c.id);
      (c.md.match(/\*\*(.+?)\*\*/g) || []).forEach((m) => addKw(m.slice(2, -2), b.id, c.id));
      (c.md.match(/::: hafal (.+)/g) || []).forEach((m) => addKw(m.slice(10), b.id, c.id));
      (c.md.match(/^(.+?) \|\|/gm) || []).forEach((m) => addKw(m.slice(0, -3), b.id, c.id));
      (c.md.match(REG) || []).forEach((m) => addKw(m, b.id, c.id));
    }));
    KW = Array.from(kw.values());
    QS.forEach((q) => { q.n = norm(q.q + " " + q.o.join(" ") + " " + q.e); });
  }
  function hl(text, toks) {
    let s = esc(text);
    toks.forEach((t) => { if (t.length < 2) return; const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"); s = s.replace(re, "<mark>$1</mark>"); });
    return s;
  }
  function snippet(text, tok) {
    const n = norm(text); const at = Math.max(0, n.indexOf(tok));
    const st = Math.max(0, at - 60); const en = Math.min(text.length, at + 140);
    return (st > 0 ? "…" : "") + text.slice(st, en) + (en < text.length ? "…" : "");
  }
  function doSearch(q) {
    buildIndex();
    const nq = norm(q).trim(); if (!nq) return { sug: [], mat: [], soal: [] };
    const toks = nq.split(/\s+/).filter(Boolean);
    const sug = KW.filter((k) => norm(k.k).includes(nq)).sort((a, b) => (norm(b.k).startsWith(nq) - norm(a.k).startsWith(nq)) || a.k.length - b.k.length).slice(0, 8);
    const mat = IDX.map((r) => {
      if (!toks.every((t) => r.n.includes(t))) return null;
      let sc = 0; toks.forEach((t) => { sc += r.n.split(t).length - 1; if (norm(r.title).includes(t)) sc += 6; });
      if (r.n.includes(nq)) sc += 8;
      return { r, sc };
    }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 12).map((x) => x.r);
    const soal = QS.filter((x) => toks.every((t) => x.n.includes(t))).slice(0, 6);
    return { sug, mat, soal, toks };
  }

  /* ---------- progress helpers ---------- */
  const chRead = (b, c) => !!S.read[b + "/" + c];
  const bookRead = (b) => b.chapters.filter((c) => chRead(b.id, c.id)).length;
  function qStats(filter) {
    let att = 0, ok = 0, wrong = 0, total = 0;
    QS.forEach((q) => { if (filter && !filter(q)) return; total++; const s = S.qs[q.id]; if (s) { att++; if (s.l) ok++; else wrong++; } });
    return { att, ok, wrong, total };
  }
  function recordAnswer(q, correct) {
    const s = S.qs[q.id] || { a: 0, c: 0, l: 0 };
    s.a++; if (correct) s.c++; s.l = correct ? 1 : 0; S.qs[q.id] = s; save("qs");
  }

  /* ---------- theme ---------- */
  let theme = store.get("theme", "system");
  function applyTheme() {
    const r = document.documentElement;
    if (theme === "system") r.removeAttribute("data-theme"); else r.setAttribute("data-theme", theme);
    const b = $("#themeBtn"); if (b) { b.innerHTML = ic(theme === "dark" ? "moon" : theme === "light" ? "sun" : "auto"); b.title = "Tema: " + ({ system: "ikut sistem", light: "terang", dark: "gelap" })[theme]; b.setAttribute("aria-label", b.title); }
  }

  /* ---------- toast & confetti ---------- */
  let toastT;
  function toast(msg) {
    let t = $(".toast"); if (t) t.remove();
    t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg; document.body.appendChild(t);
    clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2400);
  }
  function confetti(colors) {
    if (reduce) return;
    let cv = $("#confetti"); if (!cv) { cv = document.createElement("canvas"); cv.id = "confetti"; document.body.appendChild(cv); }
    const ctx = cv.getContext("2d"); const W = (cv.width = innerWidth * devicePixelRatio), H = (cv.height = innerHeight * devicePixelRatio);
    cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px";
    const ps = Array.from({ length: 110 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .55, vx: (Math.random() - .5) * 26 * devicePixelRatio, vy: (-Math.random() * 22 - 10) * devicePixelRatio, r: (4 + Math.random() * 5) * devicePixelRatio, c: colors[Math.floor(Math.random() * colors.length)], a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
    let f = 0;
    (function step() {
      ctx.clearRect(0, 0, W, H); f++;
      ps.forEach((p) => { p.vy += .8 * devicePixelRatio; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.a += p.va; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); });
      if (f < 120) requestAnimationFrame(step); else ctx.clearRect(0, 0, W, H);
    })();
  }

  /* ---------- quiz engine ---------- */
  function startQuiz(list, title, opts) {
    if (!list.length) { toast("Tidak ada soal yang cocok dengan pilihanmu."); return; }
    S.quiz = { title, items: shuffle(list).map((q) => ({ id: q.id, perm: shuffle([0, 1, 2, 3]), ans: null })), cur: 0, streak: 0, best: 0, start: Date.now(), end: null, src: (opts && opts.src) || "latihan" };
    save("quiz"); S.returnQuiz = false;
    if (location.hash === "#kuis") render(); else location.hash = "kuis";
  }
  function sampleBalanced(n) {
    const per = Math.floor(n / BOOKS.length); let out = [];
    BOOKS.forEach((b) => { out = out.concat(shuffle(QS.filter((q) => q.b === b.id)).slice(0, per)); });
    return out;
  }
  function bestSection(q) {
    const b = BMAP[q.b], c = b && b.cmap[q.c]; if (!c) return null;
    const p = chapParsed(b, c); const stop = /^(yang|dan|atau|dengan|dalam|untuk|dari|pada|adalah|oleh|kepada|tidak|serta|secara|sebagai|setiap|antara|tersebut|bagi|lain|hal|para|maupun)$/;
    const toks = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !stop.test(w));
    const ta = toks(q.o[0]), tq = toks(q.q);
    let best = null, bs = -1;
    p.sections.forEach((s) => { const n = norm(s.title + " " + s.text); let sc = 0; ta.forEach((t) => { if (n.includes(t)) sc += 3; }); tq.forEach((t) => { if (n.includes(t)) sc += 1; }); if (sc > bs) { bs = sc; best = s; } });
    const terms = ta.filter((t) => best && norm(best.text).includes(t)).sort((a, b) => b.length - a.length).slice(0, 3);
    return best ? { sec: best.id, terms } : null;
  }
  function openMateri(qid) {
    const q = QMAP[qid]; if (!q) return;
    const bs = bestSection(q);
    S.pending = bs ? { sec: bs.sec, terms: bs.terms } : null;
    S.returnQuiz = !!(S.quiz && !S.quiz.end) || location.hash === "#hasil";
    S.returnTo = location.hash.slice(1) || "kuis";
    location.hash = "bab-" + q.b + "-" + q.c;
  }

  /* ---------- views ---------- */
  function setBook(color) { document.documentElement.style.setProperty("--book", color || "var(--accent)"); }

  function viewHome() {
    setBook(null);
    const st = qStats(); const read = Object.keys(S.read).length; const acc = pct(st.ok, st.att);
    const last = S.last && BMAP[S.last.b] && BMAP[S.last.b].cmap[S.last.c] ? BMAP[S.last.b].cmap[S.last.c] : null;
    const recs = ["BerAKHLAK", "Majelis Kode Etik", "PMK 190/PMK.01/2018", "asas universalitas", "Piagam Jakarta", "cuti besar", "hukuman disiplin sedang", "5 Must", "Mahkamah Konstitusi", "DUK"];
    const word = ["Siap", "hadapi", '<em class="accentw">TSKKWK.</em>'];
    const exam = (() => { const now = new Date(), d0 = new Date(2026, 10, 16), d1 = new Date(2026, 10, 20); if (now >= d1) return ""; if (now >= d0) return "Ujian sedang berlangsung"; const n = Math.ceil((d0 - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5); return "H-" + n; })();
    const pAll = pct(read, TOTAL_CH);
    const caseN = QS.filter((q) => q.t === "K" || q.t === "A").length;
    return '<div class="view"><div class="wrap"><section class="hero hero3"><div>' +
      '<span class="eyebrow">UPKP IV, V &amp; VI · 2026</span>' +
      '<h1 style="margin-top:10px">' + word.map((w, i) => '<span class="stack"><span style="animation-delay:' + (i * 70) + 'ms">' + w + "</span></span>").join(" ") + "</h1>" +
      '<p class="hsub">Tes Substansi Kementerian Keuangan<br>dan Wawasan Kebangsaan</p>' +
      '<div class="hexam"><span class="hx-d">' + ic("calendar") + "16–19 Nov 2026</span>" + (exam ? '<span class="hx-c">' + exam + "</span>" : "") + '<span class="hx-n">TSKKWK 60 menit · materi TPA dipelajari terpisah</span></div>' +
      '<label class="hero-search" for="heroQ">' + ic("search") + '<input id="heroQ" type="search" autocomplete="off" placeholder="Cari istilah atau peraturan…" /><button class="btn primary sm" type="button" data-act="search-hero">Cari</button></label>' +
      '<div class="chips" aria-label="Rekomendasi pencarian">' + recs.slice(0, 6).map((r) => '<button class="chip" type="button" data-act="search" data-q="' + esc(r) + '">' + esc(r) + "</button>").join("") + "</div>" +
      '<section class="drillband" aria-labelledby="drillT"><div class="db-l"><span class="eyebrow">Mode drilling</span><h2 id="drillT">Langsung latihan soal</h2><p>' + QS.length + " soal acak berpembahasan, termasuk " + caseN + ' soal kasus. Salah jawab? Ada tombol untuk cek materinya.</p>' +
      '<div class="db-stats"><div><b>' + st.att + "</b><span>soal dijawab</span></div><div><b>" + (st.att ? acc + "%" : "–") + "</b><span>akurasi</span></div><div><b>" + st.wrong + "</b><span>perlu diulang</span></div></div></div>" +
      '<div class="db-r"><button class="dbtn main" type="button" data-act="preset" data-p="kilat">' + ic("shuffle") + "<span><b>Drill kilat</b><small>20 soal acak dari semua modul</small></span>" + ic("arrowR") + "</button>" +
      '<div class="dgrid"><button class="dbtn" type="button" data-act="preset" data-p="simulasi">' + ic("target") + "<span><b>Simulasi 100 soal</b><small>20 per modul</small></span></button>" +
      '<button class="dbtn" type="button" data-act="preset" data-p="kasus">' + ic("case") + "<span><b>Soal kasus</b><small>" + caseN + " soal cerita</small></span></button>" +
      '<button class="dbtn" type="button" data-act="preset" data-p="salah">' + ic("repeat") + "<span><b>Ulang yang salah</b><small>" + st.wrong + " soal</small></span></button>" +
      '<a class="dbtn" href="#latihan">' + ic("filter") + "<span><b>Atur sendiri</b><small>pilih modul, bab, tipe</small></span></a></div>" +
      '<div class="dbooks"><span>Drill per modul</span>' + BOOKS.map((b) => '<button class="dchip" type="button" data-act="preset" data-p="b:' + b.id + '" style="--book:' + b.color + '">' + esc(b.short) + "</button>").join("") + "</div></div></section>" +
      (last ? '<a class="continue" href="#bab-' + last.book.id + "-" + last.id + '" style="--book:' + last.book.color + '"><span class="bico">' + ic(last.book.icon) + '</span><div><span>Lanjut membaca · ' + esc(last.book.short) + "</span><b>" + esc(last.title) + "</b></div>" + ic("arrowR") + "</a>" : "") +
      "</div>" +
      '<aside class="modlist" aria-label="Lima modul"><div class="ml-head"><span class="eyebrow">Lima modul materi</span><span class="hpct">Dibaca <b>' + pAll + "%</b></span></div>" +
      '<div class="ml-rows">' + BOOKS.map((b, i) => { const r = bookRead(b), n = b.chapters.length, bq = qStats((q) => q.b === b.id); return '<a class="mrow" href="#buku-' + b.id + '" style="--book:' + b.color + ";animation-delay:" + (120 + i * 60) + 'ms"><span class="bico">' + ic(b.icon) + '</span><span class="mr-t"><b>' + esc(b.title) + "</b><small>" + r + "/" + n + " bab · " + bq.total + ' soal</small><span class="bar"><i data-w="' + pct(r, n) + '"></i></span></span>' + ic("arrowR") + "</a>"; }).join("") + "</div>" +
      '<details class="savehint"><summary>' + ic("key") + '<span>Progres tersimpan otomatis. <u>Pindah perangkat?</u></span>' + ic("chevD") + "</summary>" +
      '<div class="sh-body"><ol><li><b>Salin kode</b> di perangkat lama</li><li><b>Simpan</b> kodenya (catatan / chat ke diri sendiri)</li><li><b>Tempel &amp; pulihkan</b> di perangkat baru</li></ol><p>Progres hilang jika memakai mode incognito, menghapus data browser, atau ganti perangkat tanpa kode.</p><button class="btn sm primary" type="button" data-act="sync">' + ic("key") + "Buka kode progres</button></div></details>" +
      "</aside></section>" +
      
      footer() + "</div></div>";
  }

  function footer() {
    return '<footer class="footer"><p style="margin:0 0 8px;max-width:80ch">Disusun dari lima modul E-Learning Persiapan Tes Substansi Kementerian Keuangan dan Wawasan Kebangsaan UPKP (Pusdiklat Kepemimpinan dan Manajemen, BPPK). Progres tersimpan otomatis di browser ini. Untuk pindah perangkat atau membuat cadangan, gunakan kode progres.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" type="button" data-act="sync">' + ic("key") + 'Simpan / pulihkan progres</button><button class="btn sm ghost" type="button" data-act="reset">' + ic("repeat") + "Hapus semua progres</button></div></footer>";
  }

  function viewBook(b) {
    setBook(b.color);
    const first = b.chapters.find((c) => !chRead(b.id, c.id)) || b.chapters[0];
    const bq = QS.filter((q) => q.b === b.id);
    return '<div class="view" style="--book:' + b.color + '"><header class="bookhead"><div class="wrap"><span class="bico">' + ic(b.icon) + '</span><div><nav class="crumbs"><a href="#beranda">Beranda</a>›<span>Buku ' + b.no + "</span></nav><h1>" + esc(b.title) + "</h1><p>" + esc(b.desc) + '</p></div><div class="toolbar" style="margin:0"><a class="btn primary" href="#bab-' + b.id + "-" + first.id + '">' + ic("books") + (bookRead(b) ? "Lanjut baca" : "Mulai baca") + '</a><button class="btn" type="button" data-act="quiz-book" data-b="' + b.id + '">' + ic("target") + "Latihan " + bq.length + " soal</button></div></div></header>" +
      '<div class="wrap"><div class="chapters">' + b.chapters.map((c, i) => {
        const p = chapParsed(b, c); const cq = bq.filter((q) => q.c === c.id); const st = qStats((q) => q.b === b.id && q.c === c.id);
        return '<a class="chrow' + (chRead(b.id, c.id) ? " done" : "") + '" href="#bab-' + b.id + "-" + c.id + '" style="animation-delay:' + (i * 40) + 'ms"><span class="num">' + (chRead(b.id, c.id) ? ic("check") : i + 1) + "</span><div><h3>" + esc(c.title) + '</h3><div class="sub"><span>' + p.sections.length + " bagian</span><span>" + p.counts.hafal + " daftar hafalan</span><span>" + cq.length + ' soal</span></div></div><span class="acc">' + (st.att ? "Akurasi " + pct(st.ok, st.att) + "%<br>" + st.att + "/" + st.total + " dijawab" : "Belum latihan") + "</span></a>";
      }).join("") + '</div><div class="infobox"><b>Tentang buku ini.</b> Sumber: ' + esc(b.sumber) + ". Ringkasan disusun ulang agar mudah dihafal; istilah dan angka mengikuti modul.</div>" + footer() + "</div></div>";
  }

  function viewChapter(b, c) {
    setBook(b.color);
    S.last = { b: b.id, c: c.id }; save("last");
    const p = chapParsed(b, c); const cq = QS.filter((q) => q.b === b.id && q.c === c.id);
    const prev = b.chapters[c.i - 1], next = b.chapters[c.i + 1];
    const secList = p.sections.map((s) => '<li><a href="#bab-' + b.id + "-" + c.id + '" data-sec="' + s.id + '">' + esc(s.title) + "</a></li>").join("");
    const read = chRead(b.id, c.id);
    return '<div class="view" style="--book:' + b.color + '"><div class="wrap reader"><aside class="toc" aria-label="Daftar isi"><h4>Buku ' + b.no + " · " + esc(b.short) + "</h4><ol>" +
      b.chapters.map((x) => '<li><a class="chap' + (x.id === c.id ? " active" : "") + (chRead(b.id, x.id) ? " read" : "") + '" href="#bab-' + b.id + "-" + x.id + '"><span class="d"></span>' + esc(x.title) + "</a></li>").join("") +
      "</ol><h4>Di bab ini</h4><ol id=\"secToc\">" + secList + "</ol></aside>" +
      '<article class="article"><header class="chaphead"><nav class="crumbs"><a href="#beranda">Beranda</a>›<a href="#buku-' + b.id + '">' + esc(b.short) + "</a>›<span>Bab " + (c.i + 1) + '</span></nav><a class="tag" href="#buku-' + b.id + '"><i>' + b.no + "</i>" + esc(b.title) + "</a><h1>" + esc(c.title) + '</h1><div class="toolbar"><button class="toggle" type="button" aria-pressed="false" data-act="hafal-global">' + ic("eye") + "Mode hafal semua</button>" +
      (cq.length ? '<button class="btn sm" type="button" data-act="quiz-chap" data-b="' + b.id + '" data-c="' + c.id + '">' + ic("target") + "Latihan bab ini · " + cq.length + " soal</button>" : "") +
      '<button class="btn sm' + (read ? "" : " ghost") + '" type="button" data-act="mark" data-b="' + b.id + '" data-c="' + c.id + '">' + ic("check") + (read ? "Sudah dibaca" : "Tandai dibaca") + "</button></div>" +
      '<details class="mobiletoc"><summary>' + ic("list") + "Daftar isi bab (" + p.sections.length + ' bagian)</summary><ol>' + secList + "</ol></details></header>" +
      '<div class="md">' + p.html + "</div>" +
      '<div class="chapfoot"><div class="donebox"><div><b>' + (read ? "Bab ini sudah kamu tandai selesai." : "Selesai membaca bab ini?") + '</b><div style="font-size:.88rem;color:var(--muted)">Uji ingatanmu dengan ' + cq.length + ' soal khusus bab ini.</div></div><div class="toolbar" style="margin:0">' +
      (read ? "" : '<button class="btn" type="button" data-act="mark" data-b="' + b.id + '" data-c="' + c.id + '">' + ic("check") + "Tandai dibaca</button>") +
      (cq.length ? '<button class="btn primary" type="button" data-act="quiz-chap" data-b="' + b.id + '" data-c="' + c.id + '">' + ic("target") + "Uji bab ini</button>" : "") + "</div></div>" +
      '<nav class="pager">' + (prev ? '<a href="#bab-' + b.id + "-" + prev.id + '"><span>← Bab sebelumnya</span><b>' + esc(prev.title) + "</b></a>" : "<span></span>") +
      (next ? '<a class="next" href="#bab-' + b.id + "-" + next.id + '"><span>Bab berikutnya →</span><b>' + esc(next.title) + "</b></a>" : '<a class="next" href="#buku-' + b.id + '"><span>Selesai</span><b>Kembali ke daftar bab</b></a>') + "</nav></div></article></div></div>";
  }

  /* practice setup */
  const CFG = { books: new Set(BOOKS.map((b) => b.id)), chaps: new Set(), types: new Set(Object.keys(TYPES)), mode: "acak", n: 20, open: {} };
  BOOKS.forEach((b) => b.chapters.forEach((c) => CFG.chaps.add(b.id + "|" + c.id)));
  function poolOf(cfg) {
    return QS.filter((q) => {
      if (!cfg.books.has(q.b) || !cfg.chaps.has(q.b + "|" + q.c) || !cfg.types.has(q.t)) return false;
      const s = S.qs[q.id];
      if (cfg.mode === "salah") return s && !s.l;
      if (cfg.mode === "baru") return !s;
      if (cfg.mode === "tandai") return !!S.flags[q.id];
      return true;
    });
  }
  function viewPractice() {
    setBook(null);
    const pool = poolOf(CFG); const take = CFG.n === 0 ? pool.length : Math.min(CFG.n, pool.length);
    const st = qStats(); const q = S.quiz; const active = q && !q.end;
    const seg = (name, items, cur) => '<div class="seg" role="group">' + items.map(([v, l]) => '<button type="button" data-act="cfg" data-k="' + name + '" data-v="' + v + '" aria-pressed="' + (String(cur) === String(v)) + '">' + l + "</button>").join("") + "</div>";
    return '<div class="view"><div class="wrap prac"><div><span class="eyebrow">' + QS.length + " soal · 5 buku · 4 jenis</span><h1>Latihan Soal</h1>" +
      '<p style="color:var(--muted);max-width:62ch">Soal selalu diacak, begitu juga urutan pilihan jawabannya. Setelah menjawab, pembahasan langsung muncul beserta tombol <b>Cek materi</b> untuk membuka bagian modul yang relevan.</p>' +
      (active ? '<button class="continue" type="button" data-act="resume" style="width:100%;cursor:pointer;text-align:left"><span class="bico" style="background:var(--accent)">' + ic("clock") + '</span><div><span>Sesi belum selesai</span><b>' + esc(q.title) + " · soal " + (q.cur + 1) + "/" + q.items.length + "</b></div>" + ic("arrowR") + "</button>" : "") +
      '<div class="presets"><button class="preset" type="button" data-act="preset" data-p="kilat"><span class="pi">' + ic("shuffle") + "</span><b>Drill kilat</b><span>20 soal acak, semua buku</span></button>" +
      '<button class="preset" type="button" data-act="preset" data-p="simulasi"><span class="pi">' + ic("clock") + "</span><b>Simulasi ujian</b><span>100 soal, 20 per buku</span></button>" +
      '<button class="preset" type="button" data-act="preset" data-p="salah"><span class="pi">' + ic("repeat") + "</span><b>Ulang yang salah</b><span>" + st.wrong + " soal menunggu</span></button></div>" +
      '<div class="panel"><h3>' + ic("books") + 'Pilih materi</h3><div class="booksel">' + BOOKS.map((b) => {
        const on = CFG.books.has(b.id); const n = QS.filter((x) => x.b === b.id).length;
        return '<div class="bs' + (on ? " on" : "") + (CFG.open[b.id] ? " open" : "") + '" style="--book:' + b.color + '"><div class="bs-h" data-act="cfg-book" data-b="' + b.id + '"><span class="check">' + ic("check") + "</span><b>" + esc(b.title) + "</b><small>" + n + ' soal</small><button class="exp" type="button" data-act="cfg-open" data-b="' + b.id + '" aria-label="Pilih bab ' + esc(b.short) + '">' + ic("chev") + '</button></div><div class="bs-c">' +
          b.chapters.map((c) => { const k = b.id + "|" + c.id; const cn = QS.filter((x) => x.b === b.id && x.c === c.id).length; return '<button type="button" class="chk' + (CFG.chaps.has(k) ? " on" : "") + '" data-act="cfg-chap" data-k="' + k + '"><span class="check">' + ic("check") + "</span>" + esc(c.title) + "<small>" + cn + "</small></button>"; }).join("") + "</div></div>";
      }).join("") + "</div></div>" +
      '<div class="panel"><div class="field"><span>Jenis soal</span><div class="seg">' + Object.keys(TYPES).map((t) => '<button type="button" data-act="cfg-type" data-v="' + t + '" aria-pressed="' + CFG.types.has(t) + '">' + TYPES[t] + "</button>").join("") + "</div></div>" +
      '<div class="field"><span>Sumber soal</span>' + seg("mode", [["acak", "Semua soal"], ["baru", "Belum pernah dijawab"], ["salah", "Yang terakhir salah"], ["tandai", "Yang kutandai"]], CFG.mode) + "</div>" +
      '<div class="field" style="margin:0"><span>Jumlah soal</span>' + seg("n", [[10, "10"], [20, "20"], [50, "50"], [100, "100"], [0, "Semua"]], CFG.n) + "</div></div></div>" +
      '<aside class="summary"><div class="panel"><span class="eyebrow">Siap dikerjakan</span><div class="count">' + take + '</div><div style="color:var(--muted);font-size:.88rem;margin:4px 0 14px">dari ' + pool.length + ' soal yang cocok</div><button class="btn primary" type="button" data-act="start" style="width:100%;justify-content:center"' + (take ? "" : " disabled") + ">" + ic("arrowR") + 'Mulai latihan</button><div class="typelegend">' +
      Object.keys(TYPES).map((t) => '<div><span class="tpill t-' + t + '">' + TYPES[t] + "</span> " + ({ H: "angka, nama peraturan, daftar butir", P: "makna & perbedaan konsep", K: "situasi kerja nyata", A: "alasan & hubungan antarkonsep" })[t] + "</div>").join("") + "</div></div>" +
      '<div class="panel"><h3>' + ic("target") + 'Penguasaan per buku</h3><div class="bookstats">' + BOOKS.map((b) => { const s = qStats((x) => x.b === b.id); return '<div class="bstat" style="--book:' + b.color + '"><span>' + esc(b.short) + "</span><b class=\"mono\" style=\"font-size:.8rem\">" + s.ok + "/" + s.total + '</b><div class="bar"><i data-w="' + pct(s.ok, s.total) + '"></i></div></div>'; }).join("") + "</div></div></aside></div></div>";
  }

  function qBody(q, compact) {
    const i = q.q.indexOf(" || ");
    if (i < 0) return compact ? "<b>" + inl(q.q) + "</b>" : '<p class="qtext">' + inl(q.q) + "</p>";
    const sc = q.q.slice(0, i).split(" // ").map((p) => "<p>" + inl(p) + "</p>").join(""), qq = q.q.slice(i + 4);
    return '<div class="scen' + (compact ? " sm" : "") + '"><span class="scen-l">' + ic("books") + "Kasus</span>" + sc + "</div>" + (compact ? "<b>" + inl(qq) + "</b>" : '<p class="qtext">' + inl(qq) + "</p>");
  }

  function viewQuiz() {
    const z = S.quiz; if (!z) { location.hash = "latihan"; return ""; }
    if (z.end) { location.hash = "hasil"; return ""; }
    const it = z.items[z.cur]; const q = QMAP[it.id]; if (!q) { location.hash = "latihan"; return ""; }
    const b = BMAP[q.b]; const c = b.cmap[q.c]; setBook(b.color);
    const answered = it.ans !== null; const correct = it.ans === 0;
    const done = z.items.filter((x) => x.ans !== null).length;
    const opts = it.perm.map((oi, k) => {
      let cls = "opt";
      if (answered) { if (oi === 0) cls += " correct"; else if (oi === it.ans) cls += " wrong"; else cls += " dim"; if (oi === it.ans) cls += " picked"; }
      return '<button class="' + cls + '" type="button" data-act="ans" data-o="' + oi + '"' + (answered ? " disabled" : "") + '><span class="k">' + "ABCD"[k] + "</span><span>" + inl(q.o[oi]) + "</span>" + (answered && (oi === 0 || oi === it.ans) ? ic(oi === 0 ? "check" : "x", "res") : '<span class="res"></span>') + "</button>";
    }).join("");
    const last = z.cur === z.items.length - 1;
    return '<div class="view"><div class="wrap quiz"><div class="qtop"><a class="iconbtn" href="#latihan" aria-label="Kembali ke pengaturan latihan">' + ic("arrowL") + '</a><div class="qprog"><i style="width:' + pct(done, z.items.length) + '%"></i></div><span class="qcount">' + (z.cur + 1) + "/" + z.items.length + "</span>" + (z.streak >= 2 ? '<span class="streak" id="streak">' + ic("fire", "icon") + z.streak + "</span>" : "") + "</div>" +
      '<div class="qcardx enter" style="--book:' + b.color + '"><div class="qmeta"><span class="bookpill"><i>' + b.no + "</i>" + esc(b.short) + '</span><span class="tpill t-' + q.t + '">' + TYPES[q.t] + '</span><span class="qchap">' + esc(c.title) + '</span><button class="iconbtn flagbtn" type="button" data-act="flag" aria-pressed="' + !!S.flags[q.id] + '" aria-label="Tandai soal ini">' + ic("bookmark") + "</button></div>" +
      qBody(q) + '<div class="opts" role="group" aria-label="Pilihan jawaban">' + opts + "</div>" +
      (answered ? '<div class="explain ' + (correct ? "ok" : "no") + '" role="status"><h4>' + ic(correct ? "check" : "x") + (correct ? "Benar!" : "Belum tepat. Jawabannya: " + esc(q.o[0])) + "</h4><p>" + inl(q.e) + "</p></div>" : "") +
      '<div class="qactions">' + (z.cur > 0 ? '<button class="btn ghost sm" type="button" data-act="qprev">' + ic("arrowL") + "Sebelumnya</button>" : "") + '<span class="sp"></span>' +
      '<button class="btn sm" type="button" data-act="materi" data-q="' + q.id + '">' + ic("books") + "Cek materi</button>" +
      (answered ? '<button class="btn primary" type="button" data-act="qnext">' + (last ? "Lihat hasil" : "Selanjutnya") + ic("arrowR") + "</button>" : '<button class="btn ghost sm" type="button" data-act="qnext">Lewati</button>') + "</div></div>" +
      '<p class="kbdhint">Pintasan: <kbd>A</kbd>–<kbd>D</kbd> atau <kbd>1</kbd>–<kbd>4</kbd> menjawab · <kbd>Enter</kbd> lanjut · <kbd>←</kbd> sebelumnya · <kbd>M</kbd> cek materi</p>' +
      '<div class="dots" aria-label="Navigasi soal">' + z.items.map((x, i) => '<button type="button" data-act="qgo" data-i="' + i + '" class="' + (x.ans === null ? "" : x.ans === 0 ? "ok" : "no") + (i === z.cur ? " cur" : "") + (S.flags[x.id] ? " fl" : "") + '" aria-label="Soal ' + (i + 1) + '">' + (i + 1) + "</button>").join("") + "</div>" +
      '<div style="margin-top:18px;display:flex;justify-content:flex-end"><button class="btn sm ghost" type="button" data-act="finish">Akhiri sesi &amp; lihat hasil</button></div></div></div>';
  }

  function viewResult() {
    const z = S.quiz; if (!z) { location.hash = "latihan"; return ""; }
    setBook(null);
    const tot = z.items.length; const ok = z.items.filter((x) => x.ans === 0).length; const no = z.items.filter((x) => x.ans !== null && x.ans !== 0).length; const skip = tot - ok - no;
    const sc = pct(ok, tot); const mins = Math.max(1, Math.round(((z.end || Date.now()) - z.start) / 60000));
    const head = sc >= 80 ? "Mantap, siap ujian!" : sc >= 60 ? "Sudah dekat. Sedikit lagi!" : "Terus berlatih, kamu pasti bisa.";
    const byBook = BOOKS.map((b) => { const its = z.items.filter((x) => QMAP[x.id] && QMAP[x.id].b === b.id); if (!its.length) return ""; const k = its.filter((x) => x.ans === 0).length; return '<div class="bstat" style="--book:' + b.color + '"><span>' + esc(b.short) + '</span><b class="mono" style="font-size:.8rem">' + k + "/" + its.length + '</b><div class="bar"><i data-w="' + pct(k, its.length) + '"></i></div></div>'; }).join("");
    const rev = z.items.slice().sort((a, b) => (a.ans === 0) - (b.ans === 0)).map((x) => {
      const q = QMAP[x.id]; if (!q) return ""; const okk = x.ans === 0;
      return '<div class="rev' + (okk ? " ok" : "") + '" style="--book:' + BMAP[q.b].color + '"><div class="qmeta" style="margin-bottom:6px"><span class="bookpill"><i>' + BMAP[q.b].no + "</i>" + esc(BMAP[q.b].short) + '</span><span class="tpill t-' + q.t + '">' + TYPES[q.t] + "</span></div>" + qBody(q, true) + '<div class="ans">' + (x.ans === null ? '<span class="r">Dilewati</span>' : okk ? "" : '<span class="r">Jawabanmu: ' + inl(q.o[x.ans]) + "</span>") + '<span class="g">Benar: ' + inl(q.o[0]) + "</span></div><p>" + inl(q.e) + '</p><button class="btn sm" type="button" data-act="materi" data-q="' + q.id + '">' + ic("books") + "Cek materi</button></div>";
    }).join("");
    return '<div class="view"><div class="wrap quiz"><div class="result"><div class="ring" style="--p:' + sc + ";--c:" + (sc >= 80 ? "var(--good)" : sc >= 60 ? "var(--warn)" : "var(--bad)") + '"><b>' + sc + '<small>%</small></b></div><div><span class="eyebrow">' + esc(z.title) + "</span><h1>" + head + "</h1><p>" + ok + " benar · " + no + " salah · " + skip + " dilewati · ±" + mins + ' menit</p><div class="qactions" style="margin:0">' +
      (no + skip ? '<button class="btn primary" type="button" data-act="retry-wrong">' + ic("repeat") + "Ulangi yang salah (" + (no + skip) + ")</button>" : "") +
      '<button class="btn" type="button" data-act="preset" data-p="kilat">' + ic("shuffle") + 'Sesi baru</button><a class="btn ghost" href="#latihan">Atur latihan</a></div></div></div>' +
      (byBook ? '<div class="panel" style="margin-top:14px"><h3>' + ic("target") + 'Per buku</h3><div class="bookstats">' + byBook + "</div></div>" : "") +
      '<div class="sec-title"><h2>Pembahasan</h2><span class="eyebrow">yang salah tampil di atas</span></div><div class="revlist">' + rev + "</div></div></div>";
  }

  /* ---------- router ---------- */
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h || h === "beranda") return { v: "home" };
    if (h.startsWith("buku-")) return { v: "book", b: h.slice(5) };
    if (h.startsWith("bab-")) { const r = h.slice(4); const i = r.indexOf("-"); return { v: "chap", b: r.slice(0, i), c: r.slice(i + 1) }; }
    if (h === "latihan") return { v: "prac" };
    if (h === "kuis") return { v: "quiz" };
    if (h === "hasil") return { v: "result" };
    return { v: "home" };
  }
  let spy = null, lastView = "";
  function render(keepScroll) {
    const r = route(); const main = $("#app"); let html = "", title = "Lima Buku UPKP";
    if (r.v === "book" && BMAP[r.b]) { html = viewBook(BMAP[r.b]); title = BMAP[r.b].title + " · Lima Buku UPKP"; }
    else if (r.v === "chap" && BMAP[r.b] && BMAP[r.b].cmap[r.c]) { const b = BMAP[r.b]; html = viewChapter(b, b.cmap[r.c]); title = b.cmap[r.c].title + " · " + b.short; }
    else if (r.v === "prac") { html = viewPractice(); title = "Latihan Soal · Lima Buku UPKP"; }
    else if (r.v === "quiz") { html = viewQuiz(); title = "Kuis · Lima Buku UPKP"; }
    else if (r.v === "result") { html = viewResult(); title = "Hasil Latihan · Lima Buku UPKP"; }
    else { html = viewHome(); r.v = "home"; }
    if (!html) return;
    main.innerHTML = html; document.title = title;
    const navKey = r.v === "prac" || r.v === "quiz" || r.v === "result" ? "latihan" : r.v === "home" ? "beranda" : "buku";
    $$("[data-nav]").forEach((a) => a.setAttribute("aria-current", a.dataset.nav === navKey ? "page" : "false"));
    requestAnimationFrame(() => $$(".bar i[data-w], .howbar i[data-w]").forEach((i) => (i.style.width = i.dataset.w + "%")));
    // return pill
    const rp = $("#returnPill"); if (rp) rp.remove();
    if (S.returnQuiz && (r.v === "chap" || r.v === "book") && S.quiz) {
      const z = S.quiz; const p = document.createElement("button"); p.id = "returnPill"; p.className = "returnpill"; p.type = "button";
      p.innerHTML = ic("arrowL") + (z.end ? "Kembali ke hasil latihan" : "Kembali ke soal " + (z.cur + 1) + "/" + z.items.length);
      p.addEventListener("click", () => { S.returnQuiz = false; location.hash = z.end ? "hasil" : "kuis"; });
      document.body.appendChild(p);
    } else if (r.v === "quiz" || r.v === "result" || r.v === "home" || r.v === "prac") S.returnQuiz = false;
    // scroll handling
    if (spy) { spy.disconnect(); spy = null; }
    const key = location.hash;
    if (r.v === "chap") {
      setupChapter();
      if (S.pending) { const pd = S.pending; S.pending = null; setTimeout(() => jumpTo(pd.sec, pd.terms), 60); }
      else if (!keepScroll) window.scrollTo(0, 0);
    } else if (!keepScroll && key !== lastView) window.scrollTo(0, 0);
    lastView = key;
    updateReadbar();
  }

  function jumpTo(secId, terms) {
    const sec = document.getElementById(secId); if (!sec) return;
    sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    sec.classList.add("flash"); setTimeout(() => sec.classList.remove("flash"), 1800);
    if (terms && terms.length) markTerms(sec, terms);
  }
  function markTerms(root, terms) {
    const nterms = terms.map(norm).filter((t) => t.length >= 3); if (!nterms.length) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = []; let n;
    while ((n = walker.nextNode())) nodes.push(n);
    let count = 0;
    nodes.forEach((node) => {
      if (count > 14 || !node.nodeValue.trim() || node.parentNode.closest("mark,button.toggle")) return;
      const txt = node.nodeValue; const nt = norm(txt); let best = -1, len = 0;
      nterms.forEach((t) => { const k = nt.indexOf(t); if (k >= 0 && (best < 0 || k < best)) { best = k; len = t.length; } });
      if (best < 0) return;
      const range = document.createRange(); range.setStart(node, best); range.setEnd(node, Math.min(txt.length, best + len));
      const m = document.createElement("mark"); m.className = "hit"; try { range.surroundContents(m); count++; } catch (e) { /* skip */ }
    });
  }

  function setupChapter() {
    const toc = $$("#secToc a, .mobiletoc a");
    toc.forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); const d = $(".mobiletoc"); if (d) d.open = false; jumpTo(a.dataset.sec); }));
    if ("IntersectionObserver" in window) {
      spy = new IntersectionObserver((ents) => {
        ents.forEach((en) => { if (en.isIntersecting) { $$("#secToc a").forEach((a) => a.classList.toggle("cur", a.dataset.sec === en.target.id)); } });
      }, { rootMargin: "-20% 0px -70% 0px" });
      $$(".md .sec").forEach((s) => spy.observe(s));
    }
  }

  /* reading progress + auto-mark */
  function updateReadbar() {
    const bar = $("#readbar"); const r = route();
    if (r.v !== "chap") { bar.style.width = "0"; return; }
    const h = document.documentElement; const max = h.scrollHeight - h.clientHeight; const p = max > 0 ? Math.min(1, h.scrollTop / max) : 0;
    bar.style.width = (p * 100).toFixed(1) + "%";
    if (p > 0.97 && !chRead(r.b, r.c) && max > 400) { S.read[r.b + "/" + r.c] = 1; save("read"); toast("Bab ditandai sudah dibaca"); $$('[data-act="mark"]').forEach((b) => { b.classList.remove("ghost"); b.lastChild.textContent = "Sudah dibaca"; }); }
  }

  /* ---------- kode progres (pindah perangkat / cadangan) ---------- */
  const SYNC_KEYS = ["read", "qs", "flags", "last", "recent"];
  const b64e = (u8) => { let s = ""; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
  const b64d = (str) => { const s = atob(str.replace(/-/g, "+").replace(/_/g, "/")); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  async function pipeBytes(u8, Stream) { const r = new Response(new Blob([u8]).stream().pipeThrough(new Stream("deflate-raw"))); return new Uint8Array(await r.arrayBuffer()); }
  async function makeCode() {
    const data = { v: 1, t: Date.now() }; SYNC_KEYS.forEach((k) => (data[k] = S[k]));
    const raw = new TextEncoder().encode(JSON.stringify(data));
    try { if (window.CompressionStream) return "LB5Z-" + b64e(await pipeBytes(raw, CompressionStream)); } catch (e) { /* fallback */ }
    return "LB5J-" + b64e(raw);
  }
  async function readCode(code) {
    const c = (code || "").replace(/\s+/g, "");
    const m = /^LB5([ZJ])-([A-Za-z0-9_-]+)$/.exec(c); if (!m) throw new Error("format");
    let u = b64d(m[2]);
    if (m[1] === "Z") { if (!window.DecompressionStream) throw new Error("browser"); u = await pipeBytes(u, DecompressionStream); }
    const d = JSON.parse(new TextDecoder().decode(u));
    if (!d || d.v !== 1 || typeof d.read !== "object" || typeof d.qs !== "object") throw new Error("isi");
    return d;
  }
  const fmtDate = (t) => { try { return new Date(t).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  function openSync() {
    closeSearch(); closeSync();
    const st = qStats(); const read = Object.keys(S.read).length;
    const ov = document.createElement("div"); ov.className = "sov mov"; ov.id = "mov";
    ov.innerHTML = '<div class="sbox mbox" role="dialog" aria-modal="true" aria-labelledby="movT">' +
      '<div class="mhead"><span class="mico">' + ic("key") + '</span><div><h2 id="movT">Simpan &amp; pulihkan progres</h2><p>Pindahkan progres ke HP, laptop, atau browser lain dengan satu kode.</p></div><button class="iconbtn" type="button" data-act="close-sync" aria-label="Tutup">' + ic("x") + "</button></div>" +
      '<div class="mbody">' +
      '<ol class="msteps"><li><span>1</span><b>Salin kode</b><small>di perangkat lama</small></li><li><span>2</span><b>Simpan kodenya</b><small>catatan, chat ke diri sendiri, atau email</small></li><li><span>3</span><b>Tempel &amp; pulihkan</b><small>di perangkat baru</small></li></ol>' +
      '<section class="mcard"><div class="mct"><b>' + ic("copy") + 'Kode progres perangkat ini</b><span class="mmeta">' + read + " bab dibaca · " + st.att + ' soal dijawab</span></div>' +
      '<textarea id="syncOut" readonly rows="3" spellcheck="false" aria-label="Kode progres">Menyiapkan kode…</textarea>' +
      '<div class="mrow"><button class="btn primary sm" type="button" data-act="sync-copy">' + ic("copy") + 'Salin kode</button><span class="mhint">Kode ini memuat bab yang sudah dibaca, riwayat jawaban, dan soal yang ditandai.</span></div></section>' +
      '<section class="mcard"><div class="mct"><b>' + ic("upload") + 'Pulihkan dari kode</b></div>' +
      '<textarea id="syncIn" rows="3" spellcheck="false" placeholder="Tempel kode yang diawali LB5Z- atau LB5J- di sini" aria-label="Tempel kode progres"></textarea>' +
      '<div id="syncMsg" class="mmsg" role="status"></div>' +
      '<div class="mrow"><button class="btn sm" type="button" data-act="sync-check">' + ic("upload") + "Pulihkan progres</button></div></section>" +
      '<div class="mnote">' + ic("bulb") + '<p>Tanpa kode pun, progres <b>tetap tersimpan otomatis</b> di browser ini walaupun browser ditutup. Progres baru hilang jika memakai <b>mode incognito/private</b>, menghapus data browser, atau berganti perangkat. Simpan kode secara berkala sebagai cadangan.</p></div>' +
      "</div></div>";
    document.body.appendChild(ov);
    ov.addEventListener("click", (e) => { if (e.target === ov) closeSync(); });
    document.documentElement.style.overflow = "hidden";
    makeCode().then((c) => { const o = $("#syncOut"); if (o) o.value = c; }).catch(() => { const o = $("#syncOut"); if (o) o.value = "Kode gagal dibuat di browser ini."; });
    setTimeout(() => { const b = $('[data-act="sync-copy"]'); if (b) b.focus(); }, 40);
  }
  function closeSync() { const o = $("#mov"); if (o) { o.remove(); document.documentElement.style.overflow = ""; } }
  let syncPending = null;
  function syncMsg(html, cls) { const m = $("#syncMsg"); if (m) { m.className = "mmsg " + (cls || ""); m.innerHTML = html; } }
  async function syncCopy(btn) {
    const o = $("#syncOut"); if (!o || !/^LB5/.test(o.value)) return;
    const done = () => { btn.lastChild.textContent = "Tersalin!"; toast("Kode progres disalin"); setTimeout(() => { if (btn.isConnected) btn.lastChild.textContent = "Salin kode"; }, 2200); };
    try { await navigator.clipboard.writeText(o.value); done(); }
    catch (e) { o.focus(); o.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (x) { /* ignore */ } if (ok) done(); else toast("Kode sudah dipilih. Tekan Ctrl+C (atau tahan lalu Salin di HP)"); }
  }
  async function syncCheck() {
    const v = ($("#syncIn") || {}).value || "";
    if (!v.trim()) { syncMsg("Tempel kodenya dulu di kotak di atas.", "warn"); return; }
    try {
      const d = await readCode(v); syncPending = d;
      const nr = Object.keys(d.read || {}).length, nq = Object.keys(d.qs || {}).length;
      syncMsg('<b>Kode valid.</b> Dibuat ' + esc(fmtDate(d.t)) + ": " + nr + " bab dibaca, " + nq + " soal pernah dijawab. Progres di perangkat ini akan <b>diganti</b> dengan isi kode." +
        '<div class="mrow" style="margin-top:10px"><button class="btn primary sm" type="button" data-act="sync-apply">' + ic("check") + 'Ya, pulihkan</button><button class="btn ghost sm" type="button" data-act="sync-cancel">Batal</button></div>', "ok");
    } catch (e) {
      syncPending = null;
      syncMsg(e.message === "browser" ? "Browser ini belum mendukung kode terkompresi. Coba buka di Chrome, Edge, Safari, atau Firefox versi terbaru." : "Kode tidak dikenali. Pastikan kode disalin utuh, diawali <b>LB5Z-</b> atau <b>LB5J-</b>, tanpa ada yang terpotong.", "bad");
    }
  }
  function syncApply() {
    const d = syncPending; if (!d) return;
    S.read = d.read || {}; S.qs = d.qs || {}; S.flags = d.flags || {}; S.last = d.last || null; S.recent = Array.isArray(d.recent) ? d.recent : [];
    SYNC_KEYS.forEach(save); syncPending = null; closeSync(); toast("Progres berhasil dipulihkan"); render(true);
  }

  /* ---------- search overlay ---------- */
  let selIdx = -1;
  function openSearch(q) {
    closeSearch();
    const ov = document.createElement("div"); ov.className = "sov"; ov.id = "sov";
    ov.innerHTML = '<div class="sbox" role="dialog" aria-modal="true" aria-label="Pencarian materi dan soal"><div class="sinput">' + ic("search") + '<input id="sq" type="search" autocomplete="off" placeholder="Ketik kata kunci: istilah, pasal, peraturan, tokoh…" /><button class="iconbtn" type="button" data-act="close-search" aria-label="Tutup pencarian">' + ic("x") + '</button></div><div class="sres" id="sres"></div><div class="sfoot"><span><kbd>↑</kbd><kbd>↓</kbd> pilih</span><span><kbd>Enter</kbd> buka</span><span><kbd>Esc</kbd> tutup</span></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener("click", (e) => { if (e.target === ov) closeSearch(); });
    const inp = $("#sq"); inp.value = q || ""; inp.addEventListener("input", () => drawResults(inp.value));
    inp.addEventListener("keydown", (e) => {
      const items = $$("#sres .sitem");
      if (e.key === "ArrowDown") { e.preventDefault(); selIdx = Math.min(items.length - 1, selIdx + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); selIdx = Math.max(0, selIdx - 1); }
      else if (e.key === "Enter") { e.preventDefault(); (items[selIdx] || items[0]) && (items[selIdx] || items[0]).click(); return; }
      else return;
      items.forEach((it, i) => it.classList.toggle("sel", i === selIdx)); if (items[selIdx]) items[selIdx].scrollIntoView({ block: "nearest" });
    });
    drawResults(inp.value); setTimeout(() => inp.focus(), 30);
    document.documentElement.style.overflow = "hidden";
  }
  function closeSearch() { const o = $("#sov"); if (o) o.remove(); document.documentElement.style.overflow = ""; }
  function drawResults(q) {
    selIdx = -1; const box = $("#sres"); if (!box) return;
    if (!q.trim()) {
      const recs = ["Nilai-Nilai Kemenkeu", "sanksi moral", "SKF", "asas tahunan", "Dana Alokasi Khusus", "batas usia pensiun", "Model 10:20:70", "Panitia Sembilan", "amandemen ketiga", "kompetensi sosial kultural", "hukuman disiplin berat", "DIPA"];
      box.innerHTML = (S.recent.length ? '<div class="sgroup">Pencarian terakhir</div><div class="sugs">' + S.recent.map((r) => '<button class="chip" type="button" data-act="sfill" data-q="' + esc(r) + '">' + esc(r) + "</button>").join("") + "</div>" : "") +
        '<div class="sgroup">Rekomendasi kata kunci</div><div class="sugs">' + recs.map((r) => '<button class="chip" type="button" data-act="sfill" data-q="' + esc(r) + '">' + esc(r) + "</button>").join("") + '</div><div class="sgroup">Atau jelajahi buku</div>' +
        BOOKS.map((b) => '<button class="sitem" type="button" data-act="sgo" data-h="buku-' + b.id + '" style="--book:' + b.color + '"><span class="sb">' + b.no + "</span><span><b>" + esc(b.title) + "</b><small>" + b.chapters.length + " bab · " + esc(b.chapters.map((c) => c.title).join(" · ")) + "</small></span></button>").join("");
      return;
    }
    const res = doSearch(q); let h = "";
    if (res.sug.length) h += '<div class="sgroup">Saran kata kunci</div><div class="sugs">' + res.sug.map((s) => '<button class="chip" type="button" data-act="sfill" data-q="' + esc(s.k) + '" style="--book:' + BMAP[s.b].color + '">' + hl(s.k, res.toks) + "</button>").join("") + "</div>";
    if (res.mat.length) h += '<div class="sgroup">Materi (' + res.mat.length + ")</div>" + res.mat.map((m) => { const b = BMAP[m.b]; return '<button class="sitem" type="button" data-act="sopen" data-b="' + m.b + '" data-c="' + m.c + '" data-sec="' + m.sec + '" style="--book:' + b.color + '"><span class="sb">' + b.no + "</span><span><b>" + hl(m.title, res.toks) + ' <span style="color:var(--muted);font-weight:500;font-size:.8rem">· ' + esc(m.ch) + "</span></b><small>" + hl(snippet(m.text, res.toks[0]), res.toks) + "</small></span></button>"; }).join("");
    if (res.soal.length) h += '<div class="sgroup">Soal terkait</div>' + res.soal.map((x) => { const b = BMAP[x.b]; return '<button class="sitem" type="button" data-act="ssoal" data-q="' + x.id + '" style="--book:' + b.color + '"><span class="sb">' + ic("target", "icon") + "</span><span><b>" + hl(x.q, res.toks) + "</b><small>Jawaban: " + hl(x.o[0], res.toks) + "</small></span></button>"; }).join("");
    if (!h) h = '<div class="sempty">Tidak ada hasil untuk “' + esc(q) + '”. Coba kata lain, misalnya nomor peraturan (PMK 190) atau istilah (asas universalitas).</div>';
    box.innerHTML = h;
  }
  function rememberSearch(q) { q = q.trim(); if (!q) return; S.recent = [q].concat(S.recent.filter((x) => x.toLowerCase() !== q.toLowerCase())).slice(0, 6); save("recent"); }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const a = t.dataset.act;
    switch (a) {
      case "search": openSearch(t.dataset.q || ""); break;
      case "search-hero": openSearch(($("#heroQ") || {}).value || ""); break;
      case "close-search": closeSearch(); break;
      case "sync": openSync(); break;
      case "close-sync": closeSync(); break;
      case "sync-copy": syncCopy(t); break;
      case "sync-check": syncCheck(); break;
      case "sync-apply": syncApply(); break;
      case "sync-cancel": syncPending = null; syncMsg(""); break;
      case "sfill": { const i = $("#sq"); if (i) { i.value = t.dataset.q; drawResults(i.value); i.focus(); } break; }
      case "sgo": closeSearch(); location.hash = t.dataset.h; break;
      case "sopen": { const q = ($("#sq") || {}).value || ""; rememberSearch(q); closeSearch(); S.pending = { sec: t.dataset.sec, terms: norm(q).split(/\s+/).filter((x) => x.length > 2) }; const h = "#bab-" + t.dataset.b + "-" + t.dataset.c; if (location.hash === h) { const pd = S.pending; S.pending = null; jumpTo(pd.sec, pd.terms); } else location.hash = h; break; }
      case "ssoal": { const q = QMAP[t.dataset.q]; rememberSearch(($("#sq") || {}).value || ""); closeSearch(); startQuiz([q], "Soal dari pencarian"); break; }
      case "flip": t.classList.toggle("flip"); break;
      case "hafal": { const h = t.closest(".hafal"); const on = !h.classList.contains("quiz"); h.classList.toggle("quiz", on); t.setAttribute("aria-pressed", on); $$("li", h).forEach((li) => li.classList.remove("shown")); updHafal(h); break; }
      case "hafal-all": { const h = t.closest(".hafal"); const all = $$("li", h); const allShown = all.every((li) => li.classList.contains("shown")); all.forEach((li, i) => setTimeout(() => li.classList.toggle("shown", !allShown), reduce ? 0 : i * 60)); setTimeout(() => updHafal(h), all.length * 60 + 20); break; }
      case "hafal-global": { const on = t.getAttribute("aria-pressed") !== "true"; t.setAttribute("aria-pressed", on); $$(".md .hafal").forEach((h) => { h.classList.toggle("quiz", on); $(".toggle", h).setAttribute("aria-pressed", on); $$("li", h).forEach((li) => li.classList.remove("shown")); updHafal(h); }); toast(on ? "Mode hafal aktif: ketuk tiap butir untuk menguji diri" : "Mode hafal dimatikan"); break; }
      case "mark": { const k = t.dataset.b + "/" + t.dataset.c; if (S.read[k]) delete S.read[k]; else S.read[k] = 1; save("read"); toast(S.read[k] ? "Bab ditandai sudah dibaca" : "Tanda dibaca dihapus"); render(true); break; }
      case "quiz-chap": startQuiz(QS.filter((q) => q.b === t.dataset.b && q.c === t.dataset.c), "Bab: " + BMAP[t.dataset.b].cmap[t.dataset.c].title); break;
      case "quiz-book": startQuiz(shuffle(QS.filter((q) => q.b === t.dataset.b)).slice(0, 25), "Buku " + BMAP[t.dataset.b].no + ": " + BMAP[t.dataset.b].short); break;
      case "preset": {
        const p = t.dataset.p;
        if (p === "kilat") startQuiz(shuffle(QS).slice(0, 20), "Drill kilat 20 soal");
        else if (p === "simulasi") startQuiz(sampleBalanced(100), "Simulasi ujian 100 soal");
        else if (p === "kasus") { const k = QS.filter((q) => q.t === "K" || q.t === "A"); startQuiz(shuffle(k).slice(0, 20), "Drill soal kasus"); }
        else if (p.indexOf("b:") === 0) { const bk = BMAP[p.slice(2)]; startQuiz(shuffle(QS.filter((q) => q.b === bk.id)).slice(0, 20), "Drill " + bk.short); }
        else if (p === "salah") { const w = QS.filter((q) => S.qs[q.id] && !S.qs[q.id].l); if (!w.length) toast("Belum ada soal yang salah. Kerjakan latihan dulu, ya."); else startQuiz(shuffle(w).slice(0, 50), "Ulang yang salah"); }
        break;
      }
      case "resume": location.hash = "kuis"; break;
      case "cfg": { const k = t.dataset.k; CFG[k] = k === "n" ? Number(t.dataset.v) : t.dataset.v; render(true); break; }
      case "cfg-type": { const v = t.dataset.v; if (CFG.types.has(v)) { if (CFG.types.size > 1) CFG.types.delete(v); } else CFG.types.add(v); render(true); break; }
      case "cfg-open": { e.stopPropagation(); CFG.open[t.dataset.b] = !CFG.open[t.dataset.b]; t.closest(".bs").classList.toggle("open"); break; }
      case "cfg-book": {
        if (e.target.closest(".exp")) break;
        const id = t.dataset.b; const on = !CFG.books.has(id);
        if (on) { CFG.books.add(id); BMAP[id].chapters.forEach((c) => CFG.chaps.add(id + "|" + c.id)); } else { CFG.books.delete(id); }
        render(true); break;
      }
      case "cfg-chap": {
        const k = t.dataset.k; const id = k.split("|")[0];
        if (CFG.chaps.has(k)) CFG.chaps.delete(k); else { CFG.chaps.add(k); CFG.books.add(id); }
        if (!BMAP[id].chapters.some((c) => CFG.chaps.has(id + "|" + c.id))) CFG.books.delete(id);
        render(true); break;
      }
      case "start": { const pool = poolOf(CFG); const n = CFG.n === 0 ? pool.length : CFG.n; startQuiz(shuffle(pool).slice(0, n), "Latihan pilihan (" + Math.min(n, pool.length) + " soal)"); break; }
      case "ans": answer(Number(t.dataset.o)); break;
      case "qnext": qNext(); break;
      case "qprev": if (S.quiz.cur > 0) { S.quiz.cur--; save("quiz"); render(true); } break;
      case "qgo": S.quiz.cur = Number(t.dataset.i); save("quiz"); render(true); break;
      case "finish": S.quiz.end = Date.now(); save("quiz"); location.hash = "hasil"; break;
      case "flag": { const id = S.quiz.items[S.quiz.cur].id; if (S.flags[id]) delete S.flags[id]; else S.flags[id] = 1; save("flags"); t.setAttribute("aria-pressed", !!S.flags[id]); toast(S.flags[id] ? "Soal ditandai untuk diulang" : "Tanda dihapus"); break; }
      case "materi": openMateri(t.dataset.q); break;
      case "retry-wrong": { const w = S.quiz.items.filter((x) => x.ans !== 0).map((x) => QMAP[x.id]).filter(Boolean); startQuiz(w, "Ulangi yang salah"); break; }
      case "theme": theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system"; store.set("theme", theme); applyTheme(); toast(t.title); break;
      case "reset": {
        if (t.dataset.armed !== "1") { t.dataset.armed = "1"; t.lastChild.textContent = "Klik sekali lagi untuk menghapus"; setTimeout(() => { if (t.isConnected) { t.dataset.armed = ""; t.lastChild.textContent = "Hapus semua progres"; } }, 3500); break; }
        ["read", "qs", "flags", "last", "quiz", "recent"].forEach(store.del); S.read = {}; S.qs = {}; S.flags = {}; S.last = null; S.quiz = null; S.recent = []; toast("Progres dihapus"); render(true); break;
      }
    }
  });
  document.addEventListener("click", (e) => {
    const li = e.target.closest(".hafal.quiz li"); if (!li) return;
    li.classList.toggle("shown"); updHafal(li.closest(".hafal"));
  });
  function updHafal(h) { const all = $$("li", h); const n = all.filter((l) => l.classList.contains("shown")).length; const c = $(".hcount", h); if (c) c.textContent = (n === all.length ? "Semua butir terbuka · " : "Ketuk butir untuk membuka · ") + n + "/" + all.length; }

  function answer(oi) {
    const z = S.quiz; const it = z.items[z.cur]; if (it.ans !== null) return;
    it.ans = oi; const ok = oi === 0; const q = QMAP[it.id];
    recordAnswer(q, ok);
    if (ok) { z.streak++; z.best = Math.max(z.best, z.streak); } else z.streak = 0;
    save("quiz"); render(true);
    const sk = $("#streak"); if (sk && ok) sk.classList.add("bump");
    if (ok && z.streak > 0 && z.streak % 5 === 0) { confetti(BOOKS.map((b) => b.color)); toast(z.streak + " jawaban benar beruntun!"); }
    const ex = $(".explain"); if (ex && ex.getBoundingClientRect().bottom > innerHeight) ex.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }
  function qNext() {
    const z = S.quiz;
    if (z.cur < z.items.length - 1) { z.cur++; save("quiz"); render(true); const c = $(".qcardx"); if (c && c.getBoundingClientRect().top < 60) window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
    else { z.end = Date.now(); save("quiz"); const sc = pct(z.items.filter((x) => x.ans === 0).length, z.items.length); if (sc >= 80) setTimeout(() => confetti(BOOKS.map((b) => b.color)), 300); location.hash = "hasil"; }
  }

  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) { e.preventDefault(); openSearch(""); return; }
    if (e.key === "Escape") { closeSearch(); closeSync(); return; }
    if (typing || $("#sov")) return;
    if (route().v === "quiz" && S.quiz && !S.quiz.end) {
      const it = S.quiz.items[S.quiz.cur]; const k = e.key.toLowerCase(); const idx = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
      if (idx >= 0 && it.ans === null && !e.metaKey && !e.ctrlKey) { e.preventDefault(); answer(it.perm[idx]); }
      else if ((e.key === "Enter" || e.key === "ArrowRight") && it.ans !== null) { e.preventDefault(); qNext(); }
      else if (e.key === "ArrowLeft" && S.quiz.cur > 0) { e.preventDefault(); S.quiz.cur--; save("quiz"); render(true); }
      else if (k === "m") openMateri(it.id);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.target && e.target.id === "heroQ" && e.key === "Enter") { e.preventDefault(); openSearch(e.target.value); }
  });
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "heroQ" && e.target.value.length >= 2) { const v = e.target.value; e.target.value = ""; openSearch(v); }
  });
  let ticking = false;
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { updateReadbar(); ticking = false; }); } }, { passive: true });
  window.addEventListener("hashchange", () => { closeSearch(); closeSync(); render(); });

  /* ---------- shell ---------- */
  function shell() {
    const marks = BOOKS.map((b, i) => '<i style="background:' + b.color + ";height:" + [14, 20, 24, 17, 21][i] + 'px"></i>').join("");
    document.body.insertAdjacentHTML("afterbegin",
      '<header class="topbar"><div class="topbar-in"><a class="brand" href="#beranda" aria-label="Lima Buku TSKKWK, beranda"><span class="brand-mark">' + marks + '</span><span>Lima Buku<small>TSKKWK · UPKP</small></span></a>' +
      '<nav class="topnav" aria-label="Navigasi utama"><a href="#beranda" data-nav="beranda">Beranda</a><a href="#buku-' + BOOKS[0].id + '" data-nav="buku">Buku</a><a href="#latihan" data-nav="latihan">Latihan soal</a></nav>' +
      '<button class="searchbtn" type="button" data-act="search">' + ic("search") + "Cari materi atau soal<kbd>Ctrl K</kbd></button>" +
      '<span class="top-spacer"></span><button class="iconbtn" type="button" data-act="search" aria-label="Cari" style="display:none" id="mSearch">' + ic("search") + '</button><button class="iconbtn" type="button" data-act="sync" aria-label="Simpan atau pulihkan progres" title="Simpan / pulihkan progres">' + ic("key") + '</button><button class="iconbtn" type="button" id="themeBtn" data-act="theme"></button></div><div class="readbar" id="readbar"></div></header>' +
      '<main id="app" tabindex="-1"></main>' +
      '<nav class="tabbar" aria-label="Navigasi bawah"><a href="#beranda" data-nav="beranda">' + ic("home") + 'Beranda</a><a href="#buku-' + BOOKS[0].id + '" data-nav="buku">' + ic("books") + 'Buku</a><a href="#latihan" data-nav="latihan">' + ic("target") + 'Latihan</a><button type="button" data-act="search">' + ic("search") + "Cari</button></nav>");
    // the "Buku" tab: open last book read, else shelf
    $$('[data-nav="buku"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); location.hash = S.last && BMAP[S.last.b] ? "buku-" + S.last.b : "beranda"; if (!S.last) setTimeout(() => { const s = $(".shelf"); if (s) s.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, 80); }));
  }

  shell(); applyTheme(); render();
})();
