/* Rendu du site à partir de js/content.js et js/i18n/*.js — pas besoin de modifier ce fichier. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var S = window.NS;
  var I18N = window.NS_I18N || {};
  var DRAFT = !!S.brouillon;
  var C = S.contact || {};
  var R = S.reseaux || {};
  var P = S.photos || {};
  var LANGS = (S.langues || Object.keys(I18N)).filter(function (l) { return I18N[l]; });
  var DEFAULT = I18N[S.langueParDefaut] ? S.langueParDefaut : LANGS[0];
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var BASE_URL = S.siteWeb || "";

  var lang = DEFAULT;
  var L = I18N[lang];
  var firstRender = true;

  // ---------- Utilitaires ----------
  function isTodo(v) {
    return v == null || v === "" || (typeof v === "string" && /^\s*TODO/.test(v));
  }
  function ok(v) { return !isTodo(v); }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel, rootEl) { return Array.prototype.slice.call((rootEl || document).querySelectorAll(sel)); }
  function setHTML(sel, html) { var el = $(sel); if (el) el.innerHTML = html; return el; }
  function get(obj, path) {
    return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }
  // Texte traduit ; à défaut, celui de la langue par défaut.
  function t(key) {
    var v = get(L, key);
    if (v == null) v = get(I18N[DEFAULT], key);
    return v == null ? "" : v;
  }
  function todo() { return DRAFT ? '<span class="todo">' + esc(t("ui.todo")) + "</span>" : ""; }
  function show(v) { return ok(v) ? esc(v) : todo(); }
  // *mot* → <em>mot</em>
  function rich(s) { return esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>"); }
  function link(href, label, cls, external) {
    return "<a" + (cls ? ' class="' + cls + '"' : "") + ' href="' + esc(href) + '"' +
      (external ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>";
  }
  function intl() { return L.intl || L.htmlLang; }
  // Numéros, adresses, e-mails : toujours de gauche à droite, même dans une page en arabe.
  function ltr(html) { return '<span dir="ltr">' + html + "</span>"; }
  // Même chose pour du texte brut (listes déroulantes, message WhatsApp) : « 911 Carrera » reste dans l'ordre.
  function isolate(text) { return "⁦" + text + "⁩"; }
  function plural(forms, n) {
    if (typeof forms === "string") return forms.replace("{n}", n);
    var rule = "other";
    try { rule = new Intl.PluralRules(intl()).select(n); } catch (e) { /* navigateur ancien */ }
    return (forms[rule] || forms.other).replace("{n}", n);
  }
  // « Libellé : valeur » selon la typographie de la langue.
  function sep() { return lang === "fr" ? " : " : /^zh/.test(L.htmlLang) ? "：" : ": "; }
  function fmtNumber(n) {
    try { return new Intl.NumberFormat(intl()).format(n); } catch (e) { return String(n); }
  }
  function storage(key, value, session) {
    try {
      var store = session ? window.sessionStorage : window.localStorage;
      if (value === undefined) return store.getItem(key);
      store.setItem(key, value);
    } catch (e) { /* stockage indisponible : on s'en passe */ }
    return null;
  }
  function emit(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail: detail })); }
  // Nom de modèle, éventuellement traduit (« S-Class » → « Classe S »).
  function modelName(m) {
    var map = get(L, "fleet.modelNames") || {}; // sans repli sur le français : les autres langues gardent le nom international
    return String(m).split(" · ").map(function (part) { return map[part] || part; }).join(" · ");
  }

  // ---------- Langue ----------
  function pickLang() {
    var cands = [];
    try { cands.push(new URLSearchParams(window.location.search).get("lang")); } catch (e) { /* ignore */ }
    cands.push(storage("ns-lang"));
    var nav = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language];
    nav.forEach(function (l) { if (l) cands.push(String(l).toLowerCase().split("-")[0]); });
    for (var i = 0; i < cands.length; i++) {
      if (cands[i] && LANGS.indexOf(cands[i]) >= 0) return cands[i];
    }
    // Visiteur étranger dont la langue n'est pas proposée : anglais.
    return nav[0] && LANGS.indexOf("en") >= 0 ? "en" : DEFAULT;
  }

  // Polices propres à une langue (chinois, arabe) : chargées seulement quand on la choisit.
  var fontsLoaded = {};
  function loadFonts(href) {
    if (!href || fontsLoaded[href]) return;
    fontsLoaded[href] = true;
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }

  function setLang(code, opts) {
    opts = opts || {};
    if (!I18N[code]) code = DEFAULT;
    lang = code;
    L = I18N[code];
    root.lang = L.htmlLang || code;
    root.dir = L.dir || "ltr";
    loadFonts(L.fonts);
    if (opts.remember) storage("ns-lang", code);
    if (opts.updateUrl) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set("lang", code);
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (e) { /* file:// sur un vieux navigateur */ }
    }
    renderAll();
  }

  // ---------- Titres animés : mots (ou caractères en chinois) qui montent un à un ----------
  var CJK_PUNCT = /[，。、：；！？）」』”’…—·,.!?:;)]/;
  function splitRich(str) {
    var cjk = /^zh/.test(L.htmlLang);
    var units = [[]];
    String(str).split(/(\*[^*]+\*)/).forEach(function (part) {
      if (!part) return;
      var em = part.length > 2 && part.charAt(0) === "*" && part.charAt(part.length - 1) === "*";
      var text = em ? part.slice(1, -1) : part;
      text.split(/(\s+)/).forEach(function (bit) {
        if (!bit) return;
        if (/^\s+$/.test(bit)) { if (units[units.length - 1].length) units.push([]); }
        else units[units.length - 1].push({ text: bit, em: em });
      });
    });
    var n = 0;
    function fmt(seg) { return seg.em ? "<em>" + esc(seg.text) + "</em>" : esc(seg.text); }
    function wrap(segs) {
      return '<span class="w"><span style="--wi:' + (n++) + '">' + segs.map(fmt).join("") + "</span></span>";
    }
    return units.filter(function (u) { return u.length; }).map(function (u) {
      if (!cjk) return wrap(u);
      // Chinois : un caractère par unité (les mots latins restent entiers, la ponctuation suit).
      var chars = [];
      u.forEach(function (seg) {
        (seg.text.match(/[A-Za-z0-9À-ÿ\-]+|[\s\S]/g) || []).forEach(function (ch) {
          if (chars.length && CJK_PUNCT.test(ch)) chars[chars.length - 1].push({ text: ch, em: seg.em });
          else chars.push([{ text: ch, em: seg.em }]);
        });
      });
      return chars.map(wrap).join("");
    }).join(" ");
  }

  // ---------- Apparition au défilement ----------
  var io = "IntersectionObserver" in window && !REDUCE
    ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" })
    : null;
  function observe(el) {
    if (el.classList.contains("is-visible") || el.closest(".hero")) return;
    // Après un changement de langue, rien ne doit se cacher à nouveau.
    if (io && firstRender) io.observe(el); else el.classList.add("is-visible");
  }

  // ---------- Photos (avec mémoire, pour ne pas les recharger à chaque changement de langue) ----------
  var photoState = {};
  function addPhoto(el, src, onFail) {
    if (!el || !src || photoState[src] === "fail") { if (onFail) onFail(); return; }
    if (el.querySelector("img")) return;
    var img = document.createElement("img");
    img.alt = el.getAttribute("data-alt") || "";
    img.decoding = "async";
    img.loading = el.hasAttribute("data-eager") ? "eager" : "lazy";
    img.onload = function () { photoState[src] = "ok"; el.classList.add("has-photo"); };
    img.onerror = function () { photoState[src] = "fail"; img.remove(); if (onFail) onFail(); };
    el.appendChild(img);
    img.src = src;
  }
  function photoSlots(scope) {
    $all("[data-src]", scope).forEach(function (el) { addPhoto(el, el.getAttribute("data-src")); });
  }

  // ---------- Données dérivées ----------
  var phone = C.telephone && ok(C.telephone.lien) ? C.telephone : null;
  var hasEmail = ok(C.email);
  var hasWhatsapp = ok(C.whatsapp);
  var adresseLigne = [C.adresse, [C.codePostal, C.ville].filter(ok).join(" ")].filter(ok).join(", ");
  var mapsQuery = encodeURIComponent(S.nomOfficiel + ", " + adresseLigne);
  var itineraire = "https://www.google.com/maps/dir/?api=1&destination=" + mapsQuery;
  var cars = S.flotte || [];
  var chauffeurs = S.chauffeurs || [];
  var CAT_ORDER = ["suv", "sedan", "coupe", "compact"];
  var STYLE_TO_CAT = { suv: "suv", sedan: "sedan", sport: "coupe", compact: "compact" };
  var fleetFilter = "all";
  var showroomStyle = "sedan";
  var paint = (S.peintures && S.peintures[0] && S.peintures[0].id) || "obsidian";
  // Nombre de modèles différents (location + chauffeur, sans doublon de photo).
  var vehicleCount = (function () {
    var seen = {};
    cars.concat(chauffeurs).forEach(function (c) { seen[c.photo] = true; });
    return Object.keys(seen).length;
  })();

  // ---------- Icônes ----------
  var ICONS = {
    hotel: '<path d="M4 18h16M5.5 18a6.5 6.5 0 0 1 13 0M12 9.5V7.5M10 7.5h4"/>',
    apartment: '<path d="M5 21V4h10v17M15 9h4v12M3 21h18M8 7.5h1.5M11 7.5h1.5M8 11h1.5M11 11h1.5M8 14.5h1.5M11 14.5h1.5M9 21v-3h3v3"/>',
    vip: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
    jet: '<path d="M21 12c0-.8-.7-1.4-1.5-1.4H15L10 3H8l2.4 7.6H6.2L4.4 8.4H3l.9 3.6-.9 3.6h1.4l1.8-2.2h4.2L8 21h2l5-7.6h4.5c.8 0 1.5-.6 1.5-1.4z"/>',
    yacht: '<path d="M12 3v14M12 4.5l6 10.5h-6M11 7l-4.5 8H11M3 17.5h18l-2.4 3.5H5.4z"/>',
    villa: '<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5"/>',
    seat: '<path d="M7 4v9a2 2 0 0 0 2 2h7M17 20l-1.5-5M7 20v-5M6 13h10"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
    arrow: '<path d="M4 12h16M14 6l6 6-6 6"/>',
    whatsapp: '<path d="M4 20l1.2-4A8 8 0 1 1 8.4 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8c-1-.4-1.9-1.3-2.3-2.3l.8-1-1-2z"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/>',
    facebook: '<path d="M14 8h3V4.5h-3A4 4 0 0 0 10 8.5V11H7v3.5h3V21h3.5v-6.5H17l.5-3.5h-4V9a1 1 0 0 1 1-1z"/>',
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || "icon") + '" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + "</svg>";
  }

  // ============================================================
  // Rendu
  // ============================================================
  function renderHead() {
    document.title = t("meta.title");
    function meta(sel, val) { var m = $(sel); if (m) m.setAttribute("content", val); }
    meta('meta[name="description"]', t("meta.description"));
    meta('meta[property="og:title"]', t("meta.title"));
    meta('meta[property="og:description"]', t("meta.description"));
    meta('meta[property="og:locale"]', L.locale || "fr_FR");
    var canon = $('link[rel="canonical"]');
    if (canon && BASE_URL) canon.href = lang === DEFAULT ? BASE_URL : BASE_URL + "?lang=" + lang;
  }

  function renderStatic() {
    $all("[data-t]").forEach(function (el) { el.textContent = t(el.getAttribute("data-t")); });
    $all("[data-t-rich]").forEach(function (el) {
      var s = t(el.getAttribute("data-t-rich"));
      el.innerHTML = el.classList.contains("split") ? splitRich(s) : rich(s);
    });
    $all("[data-t-attr]").forEach(function (el) {
      el.getAttribute("data-t-attr").split(";").forEach(function (pair) {
        var kv = pair.split(":");
        el.setAttribute(kv[0].trim(), t(kv[1].trim()));
      });
    });
    var banner = $("#draft-banner");
    if (banner) banner.hidden = !DRAFT;
    setMenuLabel();
  }

  function renderLangSwitch() {
    var items = LANGS.map(function (code) {
      var d = I18N[code];
      return '<li><button type="button" data-lang="' + code + '" lang="' + esc(d.htmlLang) + '"' +
        (code === lang ? ' aria-current="true"' : "") + ">" +
        '<span class="lang-code">' + esc(d.code) + "</span>" +
        '<span class="lang-name">' + esc(d.nom) + "</span></button></li>";
    }).join("");
    setHTML("#lang",
      '<button type="button" class="lang-toggle" aria-expanded="false" aria-controls="lang-list" aria-label="' +
      esc(t("ui.language")) + " — " + esc(L.nom) + '">' + esc(L.code) +
      '<svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg></button>' +
      '<ul class="lang-list" id="lang-list">' + items + "</ul>");
    setHTML("#footer-langs", LANGS.map(function (code) {
      var d = I18N[code];
      return '<li><a href="?lang=' + code + '" data-lang="' + code + '" lang="' + esc(d.htmlLang) + '"' +
        (code === lang ? ' aria-current="true"' : "") + ">" + esc(d.nom) + "</a></li>";
    }).join(""));
  }

  function renderHero() {
    setHTML("#hero-address", ltr(esc(adresseLigne)));
    setHTML("#hero-phone", phone ? link("tel:" + phone.lien, ltr(esc(phone.affiche))) : "");
    rotatorIndex = 0;
    showRotator(true);
  }

  // Mots qui se succèdent sous le titre (location, chauffeur, hôtels, jets…).
  var rotatorIndex = 0;
  function showRotator(instant) {
    var words = t("hero.rotator") || [];
    var el = $("#hero-rotator");
    if (!el || !words.length) return;
    var word = words[rotatorIndex % words.length];
    if (instant || REDUCE) { el.textContent = word; el.className = "is-in"; return; }
    el.className = "is-out";
    setTimeout(function () { el.textContent = word; el.className = "is-in"; }, 420);
  }

  // Bande défilante : marques et services en alternance, deux copies pour une boucle sans couture.
  function renderMarquee() {
    var brands = [];
    cars.forEach(function (c) { if (brands.indexOf(c.marque) < 0) brands.push(c.marque); });
    var words = t("marquee") || [];
    var mixed = [];
    for (var i = 0; i < Math.max(brands.length, words.length); i++) {
      if (brands[i]) mixed.push('<span class="marquee-item is-brand">' + esc(brands[i]) + "</span>");
      if (words[i]) mixed.push('<span class="marquee-item">' + esc(words[i]) + "</span>");
    }
    var group = '<div class="marquee-group">' + mixed.join("") + "</div>";
    setHTML("#marquee", group + group);
  }

  var ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  function renderPillars() {
    setHTML("#pillars", (t("manifesto.pillars") || []).map(function (p, i) {
      return '<li class="reveal" style="--i:' + i + '"><span class="pillar-num">' + ROMAN[i] + "</span>" +
        "<h3>" + esc(p.title) + "</h3><p>" + esc(p.text) + "</p></li>";
    }).join(""));
  }

  // Chiffres clés, tirés des données (aucun chiffre inventé).
  function renderStats() {
    var items = [
      { n: S.fondation, label: t("stats.since"), year: true },
      { n: (S.villes || []).length, label: plural(t("stats.cities"), (S.villes || []).length) },
      { n: vehicleCount, label: plural(t("stats.vehicles"), vehicleCount) },
      { n: (S.destinations || []).length, label: plural(t("stats.destinations"), (S.destinations || []).length) },
      { n: (S.jets || []).length, label: plural(t("stats.jets"), (S.jets || []).length) },
    ];
    setHTML("#stats", items.map(function (it, i) {
      var shown = statsDone || it.year || REDUCE ? (it.year ? String(it.n) : fmtNumber(it.n)) : "0";
      return '<li class="stat reveal" style="--i:' + i + '"><span class="stat-num" data-to="' + it.n + '"' + (it.year ? ' data-year=""' : "") + ">" +
        esc(shown) + '</span><span class="stat-label">' + esc(it.label.replace("{n}", "").trim()) + "</span></li>";
    }).join(""));
  }
  var statsDone = false;
  function countUp() {
    if (statsDone) return;
    statsDone = true;
    $all("#stats .stat-num").forEach(function (el) {
      if (el.hasAttribute("data-year")) return;
      var to = +el.getAttribute("data-to"), t0 = performance.now(), dur = 1600;
      (function step(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = fmtNumber(Math.round(to * e));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  function styleModels(styleKey) {
    var cat = STYLE_TO_CAT[styleKey];
    return cars.filter(function (c) { return c.categorie === cat; }).map(function (c) { return modelName(c.modele); });
  }
  function renderShowroomLabel() {
    var cat = STYLE_TO_CAT[showroomStyle];
    setHTML("#showroom-style", esc(t("fleet.filters." + cat)));
    setHTML("#showroom-models", styleModels(showroomStyle).map(function (m) { return ltr(esc(m)); }).join('<span class="dot">·</span>'));
  }
  function renderPaints() {
    setHTML("#paints", (S.peintures || []).map(function (p) {
      return '<button type="button" class="paint" data-paint="' + esc(p.id) + '" style="--paint:' + esc(p.hex) + '" aria-pressed="' + (p.id === paint) + '"' +
        ' aria-label="' + esc(t("showroom.paints." + p.id)) + '" title="' + esc(t("showroom.paints." + p.id)) + '"></button>';
    }).join(""));
  }

  // Bouton invisible qui couvre une carte et ouvre sa fiche ; « copy » = doublon décoratif (bandeau défilant).
  function cardCover(kind, index, name, copy) {
    return '<button type="button" class="card-cover" data-sheet="' + kind + '" data-index="' + index + '"' +
      (copy ? ' tabindex="-1"' : "") + ' aria-label="' + esc(name + " — " + t("sheet.open")) + '"></button>';
  }
  function cardMore(compact) {
    return '<span class="card-more' + (compact ? " is-compact" : "") + '" aria-hidden="true"><i></i>' + (compact ? "" : esc(t("sheet.open"))) + "</span>";
  }
  function destName(id) { return (t("destinations.names") || {})[id] || id; }

  function renderFleet() {
    var cats = CAT_ORDER.filter(function (c) { return cars.some(function (car) { return car.categorie === c; }); });
    setHTML("#fleet-filters", ["all"].concat(cats).map(function (c) {
      return '<button type="button" class="chip" data-filter="' + c + '" aria-pressed="' + (c === fleetFilter) + '">' +
        esc(t("fleet.filters." + c)) + "</button>";
    }).join(""));
    $("#fleet-filters").setAttribute("aria-label", t("fleet.eyebrow"));

    setHTML("#fleet", cars.map(function (car, i) {
      var specs = ["<li>" + icon("key", "icon icon-sm") + esc(t("fleet.cat." + car.categorie)) + "</li>"];
      if (typeof car.places === "number") specs.push("<li>" + icon("seat", "icon icon-sm") + esc(plural(t("fleet.seats"), car.places)) + "</li>");
      else if (DRAFT) specs.push("<li>" + icon("seat", "icon icon-sm") + todo() + "</li>");
      specs.push("<li>" + esc(t("fleet.chauffeur")) + "</li>");
      var name = modelName(car.modele);
      return '<article class="car reveal" data-cat="' + esc(car.categorie) + '" data-tilt style="--i:' + (i % 3) + '">' +
        cardCover("car", i, car.marque + " " + name) +
        '<div class="car-media photo-slot" data-src="' + esc(car.photo || "") + '" data-alt="' + esc(car.marque + " " + name) + '">' +
          '<span class="car-ghost" aria-hidden="true">' + esc(car.embleme || car.modele) + "</span>" + cardMore() +
        "</div>" +
        '<div class="car-body">' +
          '<p class="car-brand">' + ltr(esc(car.marque)) + "</p>" +
          '<h3 class="car-model">' + ltr(esc(name)) + "</h3>" +
          '<p class="car-desc">' + esc(t("fleet.cars." + car.id)) + "</p>" +
          '<ul class="car-specs">' + specs.join("") + "</ul>" +
          '<div class="car-foot">' +
            '<p class="car-price"><span>' + esc(t("fleet.price")) + "</span>" + (ok(car.prix) ? esc(car.prix) : esc(t("fleet.onRequest"))) + "</p>" +
            '<a class="link-arrow" href="#reservation" data-car="' + esc(car.id) + '">' + esc(t("fleet.cta")) + icon("arrow", "icon icon-sm") + "</a>" +
          "</div>" +
        "</div>" +
      "</article>";
    }).join(""));
    photoSlots($("#fleet"));
    applyFleetFilter();
    renderShowroomLabel();
    renderPaints();
  }
  function applyFleetFilter() {
    $all("#fleet .car").forEach(function (card) {
      card.hidden = fleetFilter !== "all" && card.getAttribute("data-cat") !== fleetFilter;
    });
    $all("#fleet-filters .chip").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-filter") === fleetFilter ? "true" : "false");
    });
  }

  function renderChauffeur() {
    setHTML("#chauffeur-services", (t("chauffeur.services") || []).map(function (s, i) {
      return '<li class="reveal" style="--i:' + (i % 2) + '"><span class="service-num">0' + (i + 1) + "</span>" +
        "<h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
    }).join(""));
    setHTML("#chauffeur-fleet", chauffeurs.map(function (c, i) {
      var name = modelName(c.modele);
      return '<li class="cf-car reveal" data-tilt style="--i:' + i + '">' + cardCover("cf", i, c.marque + " " + name) +
        '<div class="cf-media photo-slot" data-src="' + esc(c.photo) + '" data-alt="' + esc(c.marque + " " + name) + '">' + cardMore() + "</div>" +
        '<div class="cf-body"><span class="cf-type">' + esc(t("fleet.cat." + c.type)) + "</span>" +
        '<h4 class="cf-name">' + ltr(esc(name)) + "</h4>" +
        '<span class="cf-brand">' + ltr(esc(c.marque)) + "</span></div></li>";
    }).join(""));
    photoSlots($("#chauffeur-fleet"));
  }

  // Destinations : deux rangées qui défilent en sens contraire (deux copies chacune).
  function renderDestinations() {
    var list = S.destinations || [];
    var half = Math.ceil(list.length / 2);
    var rows = [list.slice(0, half), list.slice(half)];
    setHTML("#dest-rows", rows.map(function (row, r) {
      function tiles(copy) {
        return row.map(function (d, k) {
          var name = destName(d.id);
          return '<figure class="dest">' + cardCover("dest", r * half + k, name, copy) +
            '<div class="dest-media photo-slot" data-src="images/destinations/' + esc(d.id) + '.jpg" data-alt="' + esc(name) + '">' + cardMore(true) + "</div>" +
            "<figcaption>" + esc(name) + "</figcaption></figure>";
        }).join("");
      }
      return '<div class="dest-row' + (r ? " is-reverse" : "") + '"><div class="dest-track">' +
        '<div class="dest-group">' + tiles(false) + '</div><div class="dest-group" aria-hidden="true">' + tiles(true) + "</div></div></div>";
    }).join(""));
    photoSlots($("#dest-rows"));
    setHTML("#hotels", (S.hotels || []).map(function (h, i) {
      return '<li class="hotel reveal" data-tilt style="--i:' + i + '"><div class="hotel-media photo-slot" data-src="' + esc(h.photo) + '" data-alt="' + esc(h.nom) + '"></div>' +
        '<p class="hotel-name">' + ltr(esc(h.nom)) + "</p></li>";
    }).join(""));
    photoSlots($("#hotels"));
  }

  // Jets et yachts : cartes d'une galerie horizontale.
  function renderJets() {
    var list = S.jets || [];
    setHTML("#hscroll-track", list.map(function (j, i) {
      var media = j.photo
        ? '<div class="hs-media photo-slot" data-src="' + esc(j.photo) + '" data-alt="' + esc(j.nom) + '">' + cardMore() + "</div>"
        : '<div class="hs-media hs-ghost"><span>' + esc(j.nom) + "</span>" + cardMore() + "</div>";
      return '<article class="hs-card">' + cardCover("jet", i, j.nom) + media +
        '<div class="hs-caption"><span class="hs-index">' + ("0" + (i + 1)).slice(-2) + " / " + ("0" + list.length).slice(-2) + "</span>" +
        '<span class="hs-type">' + esc(t("jets.types." + j.type)) + "</span>" +
        '<h3 class="hs-name">' + ltr(esc(j.nom)) + "</h3></div></article>";
    }).join(""));
    photoSlots($("#hscroll-track"));
    layoutHScroll();
  }

  var CONCIERGE_ORDER = ["hotel", "apartment", "vip", "jet", "yacht", "villa"];
  function renderConcierge() {
    var items = t("concierge.items") || {};
    setHTML("#concierge", CONCIERGE_ORDER.filter(function (k) { return items[k]; }).map(function (k, i) {
      return '<li class="concierge-item reveal" data-tilt style="--i:' + (i % 3) + '">' + icon(k, "icon icon-lg") +
        "<h3>" + esc(items[k].title) + "</h3><p>" + esc(items[k].text) + "</p></li>";
    }).join(""));
  }

  // Cartes de membre : Premium, Gold, Black.
  function renderClub() {
    setHTML("#club-cards", (S.cartes || []).map(function (tier, i) {
      return '<div class="mcard mcard-' + esc(tier.toLowerCase()) + '" data-tilt style="--i:' + i + '">' +
        '<div class="mcard-inner">' +
          '<svg class="mcard-emblem" aria-hidden="true"><use href="#emblem"/></svg>' +
          '<span class="mcard-chip" aria-hidden="true"></span>' +
          '<span class="mcard-brand">Napoléon</span>' +
          '<span class="mcard-tier">' + esc(tier) + "</span>" +
          '<span class="mcard-member">' + esc(t("club.member")) + "</span>" +
          '<span class="mcard-sheen" aria-hidden="true"></span>' +
        "</div></div>";
    }).join(""));
  }

  // Témoignages, cités dans leur langue d'origine.
  function renderQuotes() {
    setHTML("#quotes", (S.temoignages || []).map(function (q, i) {
      return '<figure class="quote reveal" style="--i:' + i + '"><span class="quote-mark" aria-hidden="true">“</span>' +
        '<blockquote lang="en" dir="ltr"><p>' + esc(q.texte) + "</p></blockquote>" +
        '<figcaption><span class="quote-author">' + esc(q.auteur) + '</span><span class="quote-role" lang="en" dir="ltr">' +
        esc(q.role) + " — " + esc(q.societe) + "</span></figcaption></figure>";
    }).join(""));
  }

  function renderHouse() {
    setHTML("#house-text", (t("house.paragraphs") || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""));
    var names = t("cities") || {};
    setHTML("#cities", (S.villes || []).map(function (id) { return "<li>" + esc(names[id] || id) + "</li>"; }).join(""));
    setHTML("#founder-name", esc((S.fondateur && S.fondateur.nom) || ""));
  }

  function renderSteps() {
    setHTML("#steps", (t("process.steps") || []).map(function (s, i) {
      return '<li class="step reveal" style="--i:' + i + '"><span class="step-num">0' + (i + 1) + "</span>" +
        "<h3>" + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
    }).join(""));
  }

  // ---------- Formulaire de réservation ----------
  var SERVICES = ["rent", "chauffeur", "concierge", "other"];
  function renderBooking() {
    var service = $("#f-service");
    var vehicle = $("#f-vehicle");
    var sv = service.value || "rent";
    var vv = vehicle.value || "";
    service.innerHTML = SERVICES.map(function (k) {
      return '<option value="' + k + '">' + esc(t("booking.services." + k)) + "</option>";
    }).join("");
    vehicle.innerHTML = '<option value="">' + esc(t("booking.vehicleAny")) + "</option>" +
      '<optgroup label="' + esc(t("booking.services.rent")) + '">' + cars.map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(isolate(c.marque + " " + modelName(c.modele))) + "</option>";
      }).join("") + "</optgroup>" +
      '<optgroup label="' + esc(t("booking.services.chauffeur")) + '">' + chauffeurs.map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(isolate(c.marque + " " + modelName(c.modele))) + "</option>";
      }).join("") + "</optgroup>";
    service.value = sv;
    vehicle.value = vv;

    var actions = [];
    if (hasWhatsapp) actions.push('<button class="btn btn-gold magnetic" type="submit" data-channel="whatsapp">' + icon("whatsapp", "icon icon-sm") + esc(t("booking.sendWhatsapp")) + "</button>");
    if (hasEmail) actions.push('<button class="btn magnetic ' + (actions.length ? "btn-ghost" : "btn-gold") + '" type="submit" data-channel="email">' + esc(t("booking.sendEmail")) + "</button>");
    if (!actions.length) actions.push(DRAFT
      ? '<p class="form-pending">WhatsApp / e-mail : ' + todo() + "</p>"
      : '<p class="form-pending">' + esc(t("booking.noChannel")) + "</p>");
    setHTML("#form-actions", actions.join(""));
    setHTML("#form-call", phone ? esc(t("booking.orCall")) + " " + link("tel:" + phone.lien, ltr(esc(phone.affiche)), "link-line") : "");
    $("#form-error").hidden = true;
  }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }
  function fmtDate(iso) {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat(intl(), { day: "numeric", month: "long", year: "numeric" })
        .format(new Date(iso + "T12:00:00"));
    } catch (e) { return iso; }
  }
  function bookingMessage() {
    var f = function (id) { return ($("#" + id).value || "").trim(); };
    var car = cars.concat(chauffeurs).filter(function (c) { return c.id === f("f-vehicle"); })[0];
    var lines = [t("booking.mail.intro"), ""];
    function add(label, value) { if (value) lines.push(label + sep() + value); }
    add(t("booking.fields.name"), f("f-name"));
    add(t("booking.fields.phone"), f("f-phone"));
    add(t("booking.fields.email"), f("f-email"));
    add(t("booking.fields.service"), t("booking.services." + f("f-service")));
    add(t("booking.fields.vehicle"), car ? isolate(car.marque + " " + modelName(car.modele)) : t("booking.vehicleAny"));
    add(t("booking.fields.from"), fmtDate(f("f-from")));
    add(t("booking.fields.to"), fmtDate(f("f-to")));
    if (f("f-message")) lines.push("", f("f-message"));
    return lines.join("\n");
  }
  function initBookingForm() {
    var form = $("#booking-form");
    var from = $("#f-from");
    var to = $("#f-to");
    from.min = todayISO();
    to.min = todayISO();
    from.addEventListener("change", function () {
      to.min = from.value || todayISO();
      if (to.value && from.value && to.value < from.value) to.value = from.value;
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("#form-error");
      var name = $("#f-name").value.trim();
      var reach = $("#f-phone").value.trim() || $("#f-email").value.trim();
      if (!name || !reach) {
        err.textContent = t("booking.error");
        err.hidden = false;
        (name ? $("#f-phone") : $("#f-name")).focus();
        return;
      }
      err.hidden = true;
      var channel = (e.submitter && e.submitter.getAttribute("data-channel")) || (hasWhatsapp ? "whatsapp" : "email");
      var msg = bookingMessage();
      if (channel === "whatsapp" && hasWhatsapp) {
        window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
      } else if (hasEmail) {
        window.location.href = "mailto:" + C.email + "?subject=" + encodeURIComponent(t("booking.mail.subject") + " — " + S.nomOfficiel) +
          "&body=" + encodeURIComponent(msg);
      }
    });
  }

  // ---------- Contact, horaires, carte ----------
  var REF_MONDAY = new Date(2024, 0, 1, 12); // un lundi
  function dayName(i) {
    var d = new Date(REF_MONDAY.getTime() + i * 864e5);
    try { return new Intl.DateTimeFormat(intl(), { weekday: "long" }).format(d); }
    catch (e) { return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]; }
  }
  function parisDayIndex() {
    var names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    try {
      var wd = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "Europe/Paris" }).format(new Date());
      return names.indexOf(wd);
    } catch (e) { return (new Date().getDay() + 6) % 7; }
  }
  function hoursText(v) {
    if (!ok(v)) return todo();
    if (/^ferm/i.test(v)) return esc(t("contact.closed"));
    if (/^24/.test(v)) return esc(t("contact.open24"));
    return esc(String(v).replace(/\s*-\s*/, " – "));
  }

  function renderContact() {
    var rows = [];
    rows.push([t("contact.address"), ltr(esc(C.adresse)) + "<br>" + ltr(esc([C.codePostal, C.ville].filter(ok).join(" "))) +
      "<br>" + link(itineraire, esc(t("contact.directions")), "link-line link-small", true)]);
    rows.push([t("contact.phone"), phone ? link("tel:" + phone.lien, ltr(esc(phone.affiche))) : todo()]);
    if (hasEmail || DRAFT) rows.push([t("contact.email"), hasEmail ? link("mailto:" + C.email, ltr(esc(C.email))) : todo()]);
    if (hasWhatsapp || DRAFT) rows.push([t("contact.whatsapp"), hasWhatsapp ? link("https://wa.me/" + C.whatsapp, ltr("+" + esc(C.whatsapp)), "", true) : todo()]);
    setHTML("#contact-list", rows.map(function (r) {
      return "<div><dt>" + esc(r[0]) + "</dt><dd>" + r[1] + "</dd></div>";
    }).join(""));

    var hours = S.horaires;
    var today = parisDayIndex();
    if (Array.isArray(hours) && hours.length === 7) {
      setHTML("#hours", "<tbody>" + hours.map(function (h, i) {
        var isToday = i === today;
        return '<tr class="' + (isToday ? "is-today" : "") + (/^ferm/i.test(h || "") ? " is-closed" : "") + '">' +
          '<th scope="row">' + esc(dayName(i)) + (isToday ? '<span class="today-tag">' + esc(t("contact.today")) + "</span>" : "") + "</th>" +
          "<td>" + hoursText(h) + "</td></tr>";
      }).join("") + "</tbody>");
      $("#hours").parentNode.hidden = false;
    } else if (DRAFT) {
      setHTML("#hours", "<tbody><tr><td>" + todo() + "</td></tr></tbody>");
    } else {
      $("#hours").parentNode.hidden = true;
    }

    var map = $("#map");
    var hl = /^zh/.test(L.htmlLang) ? "zh-CN" : L.htmlLang;
    var src = "https://www.google.com/maps?q=" + mapsQuery + "&hl=" + encodeURIComponent(hl) + "&output=embed";
    var frame = map.querySelector("iframe");
    if (!frame) {
      map.innerHTML = '<iframe loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
      frame = map.querySelector("iframe");
    }
    frame.title = t("contact.mapTitle");
    if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
  }

  function renderFooter() {
    setHTML("#footer-nav", [
      ["#flotte", "nav.fleet"], ["#chauffeur", "nav.chauffeur"], ["#jets", "nav.jets"], ["#destinations", "nav.destinations"],
      ["#conciergerie", "nav.concierge"], ["#maison", "nav.house"], ["#reservation", "nav.book"], ["#contact", "nav.contact"],
    ].map(function (x) { return link(x[0], esc(t(x[1]))); }).join(""));
    $("#year").textContent = new Date().getFullYear();
    setHTML("#socials", ["instagram", "facebook"].filter(function (k) { return R[k]; }).map(function (k) {
      return '<a href="' + esc(R[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + icon(k) + "</a>";
    }).join(""));
  }

  function renderMobileBar() {
    var bar = [];
    if (phone) bar.push(link("tel:" + phone.lien, esc(t("mobile.call"))));
    if (hasWhatsapp) bar.push(link("https://wa.me/" + C.whatsapp, esc(t("mobile.whatsapp")), "", true));
    bar.push(link("#reservation", esc(t("mobile.book")), "is-primary"));
    setHTML("#mobile-bar", bar.join(""));
  }

  // Mentions légales : en français dans toutes les langues (droit français).
  function renderLegal() {
    var M = S.mentions || {};
    var mail = hasEmail ? link("mailto:" + C.email, esc(C.email)) : todo();
    var rows = [
      ["Éditeur du site", [show(M.raisonSociale), show(M.forme), show(M.rcs), "TVA intracommunautaire : " + show(M.tva)].join("<br>")],
      ["Siège social", show(M.siege)],
      ["Contact", (phone ? link("tel:" + phone.lien, esc(phone.affiche)) : todo()) + "<br>" + mail],
      ["Directeur de la publication", show(M.directeurPublication)],
      ["Hébergement", show(M.hebergeur)],
      ["Propriété intellectuelle", "L’ensemble des contenus de ce site (textes, photographies, logo, graphismes) est la propriété de " +
        esc(S.nomOfficiel) + " ou de ses partenaires. Toute reproduction sans autorisation écrite est interdite."],
      ["Données personnelles", "Le formulaire de réservation ne stocke aucune donnée sur ce site : votre message est transmis directement à " +
        esc(S.nomOfficiel) + " par WhatsApp ou par e-mail, et utilisé uniquement pour traiter votre demande. " +
        "Conformément au RGPD, vous pouvez demander l’accès, la rectification ou la suppression de vos données à l’adresse " + mail + ". " +
        "Ce site affiche une carte Google Maps, utilise des polices Google Fonts et charge la bibliothèque 3D Three.js depuis le réseau jsDelivr."],
    ];
    setHTML("#legal-body", '<dl lang="fr" dir="ltr">' + rows.map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
    }).join("") + "</dl>");
    var note = t("legal.note");
    setHTML("#legal-note", esc(note));
    $("#legal-note").hidden = !note;
  }

  // ---------- Données structurées (Google) ----------
  function renderLD() {
    var old = $("#ld-json");
    if (old) old.remove();
    var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var ld = {
      "@context": "https://schema.org",
      "@type": "AutoRental",
      name: S.nomOfficiel,
      description: t("meta.description"),
      inLanguage: L.htmlLang,
      address: { "@type": "PostalAddress", streetAddress: C.adresse, postalCode: C.codePostal, addressLocality: C.ville, addressCountry: C.pays },
      areaServed: (S.villes || []).map(function (id) { return (I18N.en && I18N.en.cities && I18N.en.cities[id]) || id; }),
      foundingDate: String(S.fondation || ""),
    };
    if (S.fondateur && S.fondateur.nom) ld.founder = { "@type": "Person", name: S.fondateur.nom };
    if (BASE_URL) { ld.url = BASE_URL; ld.image = BASE_URL + "images/flotte/classe-s.jpg"; }
    if (phone) ld.telephone = phone.lien;
    if (hasEmail) ld.email = C.email;
    if (Array.isArray(S.horaires)) {
      var spec = [];
      S.horaires.forEach(function (h, i) {
        if (!ok(h) || /^ferm/i.test(h)) return;
        if (/^24/.test(h)) { spec.push({ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS[i], opens: "00:00", closes: "23:59" }); return; }
        var m = String(h).match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (m) spec.push({ "@type": "OpeningHoursSpecification", dayOfWeek: DAYS[i], opens: ("0" + m[1]).slice(-2) + ":" + m[2], closes: ("0" + m[3]).slice(-2) + ":" + m[4] });
      });
      if (spec.length) ld.openingHoursSpecification = spec;
    }
    var same = ["instagram", "facebook"].map(function (k) { return R[k]; }).filter(Boolean);
    if (same.length) ld.sameAs = same;
    var tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.id = "ld-json";
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
  }

  function renderAll() {
    renderHead();
    renderStatic();
    renderLangSwitch();
    renderHero();
    renderMarquee();
    renderPillars();
    renderStats();
    renderFleet();
    renderChauffeur();
    renderJets();
    renderDestinations();
    renderConcierge();
    renderClub();
    renderQuotes();
    renderHouse();
    renderSteps();
    renderBooking();
    renderContact();
    renderFooter();
    renderMobileBar();
    renderLegal();
    renderLD();
    if (sheetState) renderSheet(false);
    $all(".reveal, .reveal-img, .split, .eyebrow").forEach(observe);
    if (root.classList.contains("intro-done")) $all(".hero .split, .hero .eyebrow").forEach(function (el) { el.classList.add("is-visible"); });
    firstRender = false;
  }

  // ============================================================
  // Interactions (branchées une seule fois)
  // ============================================================

  // Logo image : remplace l'emblème si le fichier existe.
  if (P.logo) {
    var probe = new Image();
    probe.onload = function () {
      $all("[data-logo]").forEach(function (el) {
        el.innerHTML = '<img src="' + esc(P.logo) + '" alt="' + esc(S.nomOfficiel) + '">';
        el.classList.add("has-logo");
      });
    };
    probe.src = P.logo;
  }

  // Grandes photos fixes (chauffeur, réservation, fondateur).
  $all("[data-photo]").forEach(function (el) { addPhoto(el, P[el.getAttribute("data-photo")]); });

  // Sélecteur de langue (en-tête et pied de page).
  var langBox = $("#lang");
  function closeLang() {
    var b = langBox.querySelector(".lang-toggle");
    if (b) b.setAttribute("aria-expanded", "false");
    langBox.classList.remove("is-open");
  }
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest(".lang-toggle");
    if (toggle) {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      langBox.classList.toggle("is-open", open);
      if (open) { var cur = langBox.querySelector('[aria-current="true"]'); if (cur) cur.focus(); }
      return;
    }
    var choice = e.target.closest("[data-lang]");
    if (choice) {
      e.preventDefault();
      closeLang();
      setMenu(false);
      if (choice.getAttribute("data-lang") !== lang) setLang(choice.getAttribute("data-lang"), { remember: true, updateUrl: true });
      var tg = langBox.querySelector(".lang-toggle");
      if (tg && langBox.contains(choice)) tg.focus();
      return;
    }
    if (!e.target.closest("#lang")) closeLang();
  });

  // Filtres de la flotte (synchronisés avec le showroom 3D), et « Réserver ce modèle ».
  $("#fleet-filters").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    fleetFilter = b.getAttribute("data-filter");
    applyFleetFilter();
    emit("ns:fleet", { cat: fleetFilter });
  });
  $("#fleet").addEventListener("click", function (e) {
    var a = e.target.closest("[data-car]");
    if (!a) return;
    $("#f-vehicle").value = a.getAttribute("data-car");
    var service = $("#f-service");
    if (service.value === "concierge" || service.value === "other") service.value = "rent";
  });
  $("#paints").addEventListener("click", function (e) {
    var b = e.target.closest("[data-paint]");
    if (!b) return;
    paint = b.getAttribute("data-paint");
    $all("#paints .paint").forEach(function (p) { p.setAttribute("aria-pressed", p === b ? "true" : "false"); });
    emit("ns:paint", { id: paint });
  });
  // Le showroom 3D annonce la silhouette affichée.
  document.addEventListener("ns:style", function (e) {
    if (!e.detail || !e.detail.style) return;
    showroomStyle = e.detail.style;
    renderShowroomLabel();
  });
  document.addEventListener("ns:3d", function () { root.classList.remove("no-3d"); });
  setTimeout(function () { if (!root.classList.contains("has-3d")) root.classList.add("no-3d"); }, 6000);

  // Bandeau « version provisoire » : un clic le masque.
  $("#draft-banner").addEventListener("click", function () { this.remove(); });

  // Mentions légales.
  var legal = $("#legal");
  $("#open-legal").addEventListener("click", function () {
    root.classList.add("modal-open");
    if (legal.showModal) legal.showModal(); else legal.setAttribute("open", "");
  });
  legal.addEventListener("click", function (e) { if (e.target === legal) legal.close(); });
  legal.addEventListener("close", function () { root.classList.remove("modal-open"); });

  // ---------- Fiches détaillées : destinations, voitures, chauffeur, jets et yachts ----------
  var sheet = $("#sheet"), sheetPanel = $("#sheet-panel"), sheetState = null;
  function sheetList(kind) {
    return kind === "dest" ? (S.destinations || []) : kind === "car" ? cars : kind === "cf" ? chauffeurs : (S.jets || []);
  }
  function upperFirst(str) {
    try { return str.charAt(0).toLocaleUpperCase(intl()) + str.slice(1); } catch (e) { return str; }
  }
  // Nom du pays traduit par le navigateur (« FR » → France, Франция, 法国…).
  function countryName(code) {
    if (!code || !window.Intl || !Intl.DisplayNames) return "";
    try { return new Intl.DisplayNames([intl()], { type: "region" }).of(code) || ""; } catch (e) { return ""; }
  }
  function monthName(m) {
    try { return new Intl.DateTimeFormat(intl(), { month: "long" }).format(new Date(2026, m - 1, 15)); } catch (e) { return String(m); }
  }
  function withUnit(n, unit) {
    try { return new Intl.NumberFormat(intl(), { style: "unit", unit: unit, maximumFractionDigits: 0 }).format(n); }
    catch (e) { return fmtNumber(n) + (unit === "kilometer" ? " km" : " m"); }
  }
  function fact(label, value) { return value ? "<div><dt>" + esc(label) + "</dt><dd>" + value + "</dd></div>" : ""; }
  function sheetButton(action, label, primary) {
    return '<button type="button" class="btn btn-small magnetic ' + (primary ? "btn-gold" : "btn-ghost") + '" data-sheet-action="' + action + '">' +
      esc(label) + (primary ? icon("arrow", "icon icon-sm") : "") + "</button>";
  }

  function renderSheet(animate) {
    var kind = sheetState.kind, list = sheetList(kind), item = list[sheetState.index];
    if (!item) return;
    var kicker, title, lead = "", text = "", facts = [], note = "", actions = [], photo = item.photo, ghost = "";
    if (kind === "dest") {
      title = esc(destName(item.id));
      kicker = esc(countryName(item.pays) || t("destinations.prefill"));
      text = t("destinations.desc." + item.id);
      photo = "images/destinations/" + item.id + ".jpg";
      facts.push(fact(t("destinations.season"), esc(item.saison
        ? upperFirst(monthName(item.saison[0])) + " – " + monthName(item.saison[1])
        : t("destinations.allYear"))));
      actions.push(sheetButton("book", t("destinations.cta"), true));
    } else if (kind === "car" || kind === "cf") {
      title = ltr(esc(modelName(item.modele)));
      kicker = ltr(esc(item.marque));
      ghost = item.embleme || item.modele;
      if (kind === "car") {
        lead = t("fleet.cars." + item.id);
        text = t("fleet.more." + item.id);
        facts.push(fact(t("fleet.labels.category"), esc(t("fleet.cat." + item.categorie))));
        if (typeof item.places === "number") facts.push(fact(t("fleet.labels.seats"), esc(fmtNumber(item.places))));
        facts.push(fact(t("fleet.labels.formula"), esc(t("fleet.chauffeur"))));
        facts.push(fact(t("fleet.price"), esc(ok(item.prix) ? item.prix : t("fleet.onRequest"))));
        actions.push(sheetButton("book", t("fleet.cta"), true));
        if (root.classList.contains("has-3d")) actions.push(sheetButton("3d", t("fleet.view3d")));
      } else {
        text = t("chauffeur.more." + item.id);
        facts.push(fact(t("fleet.labels.category"), esc(t("fleet.cat." + item.type))));
        facts.push(fact(t("fleet.labels.formula"), esc(t("booking.services.chauffeur"))));
        actions.push(sheetButton("book", t("chauffeur.cta"), true));
      }
    } else {
      title = ltr(esc(item.nom));
      kicker = esc(t("jets.types." + item.type));
      ghost = item.nom;
      text = t("jets.desc." + item.id);
      if (item.passagers) facts.push(fact(t("jets.facts.passengers"), esc(plural(t("jets.upTo"), fmtNumber(item.passagers)))));
      if (item.autonomieKm) facts.push(fact(t("jets.facts.range"), esc("≈ " + withUnit(item.autonomieKm, "kilometer"))));
      if (item.longueurM) facts.push(fact(t("jets.facts.length"), esc("≈ " + withUnit(item.longueurM, "meter"))));
      if (item.type === "yacht") facts.push(fact(t("jets.facts.crew"), esc(t("jets.crewIncluded"))));
      note = t("jets.note");
      actions.push(sheetButton("book", t("jets.cta"), true));
    }

    var media = $("#sheet-media");
    var ghostHTML = '<span class="sheet-ghost">' + esc(ghost || item.nom || "") + "</span>";
    media.innerHTML = "";
    media.classList.remove("has-photo");
    if (photo) {
      media.setAttribute("data-eager", "");
      media.setAttribute("data-alt", "");
      addPhoto(media, photo, function () { media.innerHTML = ghostHTML; });
    } else media.innerHTML = ghostHTML;

    var parts = [
      ["p", "sheet-kicker", kicker],
      ["h2", "sheet-title", title],
      lead && ["p", "sheet-lead", esc(lead)],
      text && ["p", "sheet-text", esc(text)],
      facts.length && ["dl", "sheet-facts", facts.join("")],
      note && ["p", "sheet-note", esc(note)],
      ["div", "sheet-actions", actions.join("")],
    ].filter(Boolean);
    setHTML("#sheet-body", parts.map(function (p, k) {
      return "<" + p[0] + ' class="' + p[1] + '"' + (p[1] === "sheet-title" ? ' id="sheet-title"' : "") + ' style="--i:' + k + '">' + p[2] + "</" + p[0] + ">";
    }).join(""));
    var n = list.length;
    $("#sheet-nav").hidden = n < 2;
    setHTML("#sheet-count", ltr(("0" + (sheetState.index + 1)).slice(-2) + " / " + ("0" + n).slice(-2)));
    sheet.setAttribute("data-kind", kind);
    if (animate && !REDUCE) {
      sheetPanel.classList.remove("is-in");
      void sheetPanel.offsetWidth; // relance les animations d'entrée
      sheetPanel.classList.add("is-in");
    }
    $("#sheet-body").scrollTop = 0;
  }

  function openSheet(kind, index) {
    if (!sheetList(kind)[index]) return;
    sheetState = { kind: kind, index: index, restore: true };
    renderSheet(true);
    root.classList.add("modal-open");
    sheet.classList.remove("is-closing");
    if (sheet.showModal) { if (!sheet.open) sheet.showModal(); } else sheet.setAttribute("open", "");
  }
  function closeSheet(after) {
    if (!sheet.hasAttribute("open")) return;
    function done() {
      sheet.classList.remove("is-closing");
      if (sheet.close) sheet.close(); else { sheet.removeAttribute("open"); sheet.dispatchEvent(new Event("close")); }
      root.classList.remove("modal-open"); // tout de suite : la page doit pouvoir défiler vers le formulaire
      if (after) after();
    }
    if (REDUCE) done();
    else { sheet.classList.add("is-closing"); setTimeout(done, 260); }
  }
  function stepSheet(d) {
    if (!sheetState) return;
    var n = sheetList(sheetState.kind).length;
    sheetState.index = (sheetState.index + d + n) % n;
    renderSheet(true);
  }
  // Réserver depuis une fiche : le formulaire est pré-rempli, puis affiché.
  function prefillBooking(o) {
    var service = $("#f-service"), msg = $("#f-message");
    if (o.vehicle != null) $("#f-vehicle").value = o.vehicle;
    if (o.service) service.value = o.service;
    else if (service.value === "concierge" || service.value === "other") service.value = "rent";
    if (o.line && msg.value.indexOf(o.line) < 0) {
      var cur = msg.value.replace(/\s+$/, "");
      msg.value = (cur ? cur + "\n" : "") + o.line;
    }
  }
  function sheetAction(action) {
    var st = sheetState;
    if (!st) return;
    var item = sheetList(st.kind)[st.index];
    st.restore = false;
    if (action === "3d") {
      fleetFilter = item.categorie;
      applyFleetFilter();
      emit("ns:fleet", { cat: fleetFilter });
      closeSheet(function () {
        var show = $(".showroom");
        if (show) show.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth", block: "center" });
      });
      return;
    }
    if (st.kind === "car") prefillBooking({ vehicle: item.id });
    else if (st.kind === "cf") prefillBooking({ vehicle: item.id, service: "chauffeur" });
    else if (st.kind === "dest") prefillBooking({ service: "concierge", line: t("destinations.prefill") + sep() + destName(item.id) });
    else prefillBooking({ service: "concierge", line: t("jets.types." + item.type) + sep() + item.nom });
    closeSheet(function () {
      var target = $("#reservation");
      if (target) target.scrollIntoView({ behavior: REDUCE ? "auto" : "smooth" });
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sheet]");
    if (!b) return;
    e.preventDefault();
    openSheet(b.getAttribute("data-sheet"), +b.getAttribute("data-index"));
  });
  sheet.addEventListener("click", function (e) {
    if (e.target === sheet || e.target.closest("#sheet-close")) { closeSheet(); return; } // fond ou croix
    var step = e.target.closest("[data-sheet-step]");
    if (step) { stepSheet(+step.getAttribute("data-sheet-step")); return; }
    var act = e.target.closest("[data-sheet-action]");
    if (act) sheetAction(act.getAttribute("data-sheet-action"));
  });
  sheet.addEventListener("cancel", function (e) { e.preventDefault(); closeSheet(); }); // touche Échap
  sheet.addEventListener("close", function () {
    root.classList.remove("modal-open");
    var st = sheetState;
    sheetState = null;
    if (!st || !st.restore) return;
    // Le focus revient sur la carte affichée en dernier.
    var card = document.querySelector('.card-cover[data-sheet="' + st.kind + '"][data-index="' + st.index + '"]:not([tabindex="-1"])');
    if (card) { try { card.focus({ preventScroll: true }); } catch (err) { /* ancien navigateur */ } }
  });
  // Flèches du clavier et glissé du doigt : fiche précédente ou suivante (inversé en arabe).
  sheet.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    var next = (e.key === "ArrowRight") !== (root.dir === "rtl");
    stepSheet(next ? 1 : -1);
    e.preventDefault();
  });
  var swipe = null;
  sheetPanel.addEventListener("pointerdown", function (e) { swipe = e.pointerType === "mouse" ? null : { x: e.clientX, y: e.clientY }; });
  sheetPanel.addEventListener("pointercancel", function () { swipe = null; });
  sheetPanel.addEventListener("pointerup", function (e) {
    if (!swipe) return;
    var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) stepSheet((dx < 0) !== (root.dir === "rtl") ? 1 : -1);
  });

  // ---------- Menu mobile ----------
  var header = $(".site-header");
  var toggle = $(".nav-toggle");
  var nav = $("#nav");
  function setMenuLabel() {
    var open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-label", t(open ? "ui.menuClose" : "ui.menuOpen"));
  }
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    setMenuLabel();
    document.body.classList.toggle("menu-open", open);
    if (open) header.classList.remove("is-hidden");
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setMenu(false); closeLang(); }
  });
  var desktop = window.matchMedia("(min-width: 1181px)");
  function onDesktop(e) { if (e.matches) setMenu(false); }
  if (desktop.addEventListener) desktop.addEventListener("change", onDesktop); else desktop.addListener(onDesktop);

  // ---------- Galerie horizontale des jets et yachts (épinglée pendant le défilement) ----------
  var hs = $("#hscroll"), hsTrack = $("#hscroll-track"), hsBar = $("#hscroll-bar");
  var hsPinned = false, hsDistance = 0;
  function layoutHScroll() {
    hsPinned = !REDUCE && window.matchMedia("(min-width: 900px)").matches;
    hs.classList.toggle("is-pinned", hsPinned);
    if (!hsPinned) { hs.style.height = ""; hsTrack.style.transform = ""; return; }
    hsDistance = Math.max(0, hsTrack.scrollWidth - window.innerWidth);
    hs.style.height = (hsDistance + window.innerHeight) + "px";
    updateHScroll();
  }
  function updateHScroll() {
    if (!hsPinned) return;
    var r = hs.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1, hsDistance)));
    var rtl = root.dir === "rtl";
    hsTrack.style.transform = "translate3d(" + ((rtl ? 1 : -1) * p * hsDistance).toFixed(1) + "px,0,0)";
    if (hsBar) hsBar.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }
  window.addEventListener("resize", layoutHScroll);

  // ---------- En-tête : transparent sur l'accueil, se retire en descendant, filet de progression ----------
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    if (y < 400 || document.body.classList.contains("menu-open")) {
      header.classList.remove("is-hidden");
      lastY = y;
    } else if (Math.abs(y - lastY) > 10) {
      header.classList.toggle("is-hidden", y > lastY);
      if (y > lastY) closeLang();
      lastY = y;
    }
    var max = document.documentElement.scrollHeight - window.innerHeight;
    header.style.setProperty("--progress", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
    updateHScroll();
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });

  // ---------- Compteurs : démarrent quand les chiffres apparaissent ----------
  if ("IntersectionObserver" in window && !REDUCE) {
    new IntersectionObserver(function (en, obs) {
      if (en[0].isIntersecting) { countUp(); obs.disconnect(); }
    }, { threshold: 0.4 }).observe($("#stats"));
  } else statsDone = true;

  // ---------- Effets réservés à la souris : curseur doré, cartes inclinables, boutons aimantés ----------
  if (FINE && !REDUCE) {
    root.classList.add("has-cursor");
    var cursor = $("#cursor"), label = $("#cursor-label");
    var mx = -100, my = -100, cx = -100, cy = -100;
    window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cursor.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", function (e) {
      var drag = e.target.closest("[data-cursor='drag']");
      var hot = e.target.closest("a, button, select, input, textarea, label, [data-tilt]");
      cursor.classList.toggle("is-hot", !!hot && !drag);
      cursor.classList.toggle("is-drag", !!drag);
      label.textContent = drag ? t("ui.drag") : "";
    });
    document.addEventListener("pointerleave", function () { mx = my = -100; });

    // Inclinaison en 3D des cartes, avec reflet qui suit la souris.
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest("[data-tilt]");
      if (!card) return;
      var r = card.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--rx", ((0.5 - py) * 8).toFixed(2) + "deg");
      card.style.setProperty("--ry", ((px - 0.5) * 10).toFixed(2) + "deg");
      card.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
      card.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      card.classList.add("is-tilting");
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      var card = e.target.closest("[data-tilt]");
      if (card && !card.contains(e.relatedTarget)) {
        card.classList.remove("is-tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      }
    });

    // Boutons aimantés : ils suivent légèrement la souris.
    document.addEventListener("pointermove", function (e) {
      var m = e.target.closest(".magnetic");
      $all(".magnetic.is-pulled").forEach(function (b) {
        if (b !== m) { b.classList.remove("is-pulled"); b.style.transform = ""; }
      });
      if (!m) return;
      var r = m.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      m.classList.add("is-pulled");
      m.style.transform = "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.3).toFixed(1) + "px)";
    }, { passive: true });
  }

  // ---------- Ouverture animée, une fois par session ----------
  function introDone() {
    if (root.classList.contains("intro-done")) return;
    root.classList.add("intro-done");
    $all(".hero .split, .hero .eyebrow").forEach(function (el) { el.classList.add("is-visible"); });
    emit("ns:intro");
  }
  (function runIntro() {
    var intro = $("#intro");
    if (REDUCE || storage("ns-intro", undefined, true)) {
      if (intro) intro.remove();
      introDone();
      return;
    }
    storage("ns-intro", "1", true);
    root.classList.add("intro-run");
    setTimeout(function () {
      intro.classList.add("is-leaving");
      introDone();
      setTimeout(function () { intro.remove(); root.classList.remove("intro-run"); }, 1100);
    }, 2100);
  })();

  // ---------- Démarrage ----------
  initBookingForm();
  setLang(pickLang());
  onScroll();
  window.addEventListener("load", layoutHScroll);
  window.requestAnimationFrame(function () { document.body.classList.add("is-loaded"); });
  if (!REDUCE) setInterval(function () { rotatorIndex++; showRotator(false); }, 2800);

  // Parallaxe discret des grandes images (ordinateur uniquement).
  if (!REDUCE && window.matchMedia("(hover: hover) and (min-width: 761px)").matches) {
    var layers = $all(".parallax");
    var ticking = false;
    var updateParallax = function () {
      ticking = false;
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var img = el.querySelector("img");
        var r = el.getBoundingClientRect();
        if (!img || r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        img.style.translate = "0 " + (-p * r.height * 0.06).toFixed(1) + "px";
      });
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateParallax); }
    }, { passive: true });
    window.addEventListener("resize", updateParallax);
    updateParallax();
  }
})();
