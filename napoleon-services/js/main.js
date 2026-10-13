/* Rendu du site à partir de js/content.js et js/i18n/*.js — pas besoin de modifier ce fichier. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var S = window.NS;
  var I18N = window.NS_I18N || {};
  var DRAFT = !!S.brouillon;
  var C = S.contact || {};
  var R = S.reseaux || {};
  var P = S.photos || {};
  var LANGS = (S.langues || Object.keys(I18N)).filter(function (l) { return I18N[l]; });
  var DEFAULT = I18N[S.langueParDefaut] ? S.langueParDefaut : LANGS[0];
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
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
  function isolate(text) { return "\u2066" + text + "\u2069"; }
  function plural(forms, n) {
    var rule = "other";
    try { rule = new Intl.PluralRules(intl()).select(n); } catch (e) { /* navigateur ancien */ }
    return (forms[rule] || forms.other).replace("{n}", n);
  }
  function storage(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* stockage indisponible : on s'en passe */ }
    return null;
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
    document.documentElement.lang = L.htmlLang || code;
    document.documentElement.dir = L.dir || "ltr";
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
    if (el.classList.contains("is-visible")) return;
    // Après un changement de langue, rien ne doit se cacher à nouveau.
    if (io && firstRender) io.observe(el); else el.classList.add("is-visible");
  }

  // ---------- Photos (avec mémoire, pour ne pas les recharger à chaque changement de langue) ----------
  var photoState = {};
  function addPhoto(el, src, onFail) {
    if (!el || !src || photoState[src] === "fail") { if (onFail) onFail(); return; }
    if (el.querySelector("img")) return;
    var img = document.createElement("img");
    img.alt = "";
    img.decoding = "async";
    img.loading = el.hasAttribute("data-eager") ? "eager" : "lazy";
    img.onload = function () { photoState[src] = "ok"; el.classList.add("has-photo"); };
    img.onerror = function () { photoState[src] = "fail"; img.remove(); if (onFail) onFail(); };
    el.appendChild(img);
    img.src = src;
  }

  // ---------- Données dérivées ----------
  var phone = C.telephone && ok(C.telephone.lien) ? C.telephone : null;
  var hasEmail = ok(C.email);
  var hasWhatsapp = ok(C.whatsapp);
  var adresseLigne = [C.adresse, [C.codePostal, C.ville].filter(ok).join(" ")].filter(ok).join(", ");
  var mapsQuery = encodeURIComponent(S.nomOfficiel + ", " + adresseLigne);
  var itineraire = "https://www.google.com/maps/dir/?api=1&destination=" + mapsQuery;
  var cars = S.flotte || [];
  var CAT_ORDER = ["suv", "sedan", "sport"];
  var fleetFilter = "all";

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
      return '<article class="car reveal" data-cat="' + esc(car.categorie) + '" style="--i:' + (i % 3) + '">' +
        '<div class="car-media photo-slot" data-src="' + esc(car.photo || "") + '">' +
          '<span class="car-ghost" aria-hidden="true">' + esc(car.embleme || car.modele) + "</span>" +
        "</div>" +
        '<div class="car-body">' +
          '<p class="car-brand">' + ltr(esc(car.marque)) + "</p>" +
          '<h3 class="car-model">' + ltr(esc(car.modele)) + "</h3>" +
          '<p class="car-desc">' + esc(t("fleet.cars." + car.id)) + "</p>" +
          '<ul class="car-specs">' + specs.join("") + "</ul>" +
          '<div class="car-foot">' +
            '<p class="car-price"><span>' + esc(t("fleet.price")) + "</span>" + (ok(car.prix) ? esc(car.prix) : esc(t("fleet.onRequest"))) + "</p>" +
            '<a class="link-arrow" href="#reservation" data-car="' + esc(car.id) + '">' + esc(t("fleet.cta")) + icon("arrow", "icon icon-sm") + "</a>" +
          "</div>" +
        "</div>" +
      "</article>";
    }).join(""));
    $all("#fleet .car-media").forEach(function (el) { addPhoto(el, el.getAttribute("data-src")); });
    applyFleetFilter();
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
    setHTML("#chauffeur-types", (t("chauffeur.types") || []).map(function (x) {
      return "<li>" + esc(x) + "</li>";
    }).join(""));
  }

  var CONCIERGE_ORDER = ["hotel", "apartment", "vip", "jet", "yacht", "villa"];
  function renderConcierge() {
    var items = t("concierge.items") || {};
    setHTML("#concierge", CONCIERGE_ORDER.filter(function (k) { return items[k]; }).map(function (k, i) {
      return '<li class="concierge-item reveal" style="--i:' + (i % 3) + '">' + icon(k, "icon icon-lg") +
        "<h3>" + esc(items[k].title) + "</h3><p>" + esc(items[k].text) + "</p></li>";
    }).join(""));
  }

  function renderHouse() {
    setHTML("#house-text", (t("house.paragraphs") || []).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join(""));
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
    vehicle.innerHTML = '<option value="">' + esc(t("booking.vehicleAny")) + "</option>" + cars.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(isolate(c.marque + " " + c.modele)) + "</option>";
    }).join("");
    service.value = sv;
    vehicle.value = vv;

    var actions = [];
    if (hasWhatsapp) actions.push('<button class="btn btn-gold" type="submit" data-channel="whatsapp">' + icon("whatsapp", "icon icon-sm") + esc(t("booking.sendWhatsapp")) + "</button>");
    if (hasEmail) actions.push('<button class="btn ' + (actions.length ? "btn-ghost" : "btn-gold") + '" type="submit" data-channel="email">' + esc(t("booking.sendEmail")) + "</button>");
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
    var car = cars.filter(function (c) { return c.id === f("f-vehicle"); })[0];
    var lines = [t("booking.mail.intro"), ""];
    var sep = lang === "fr" ? " : " : /^zh/.test(L.htmlLang) ? "：" : ": ";
    function add(label, value) { if (value) lines.push(label + sep + value); }
    add(t("booking.fields.name"), f("f-name"));
    add(t("booking.fields.phone"), f("f-phone"));
    add(t("booking.fields.email"), f("f-email"));
    add(t("booking.fields.service"), t("booking.services." + f("f-service")));
    add(t("booking.fields.vehicle"), car ? isolate(car.marque + " " + car.modele) : t("booking.vehicleAny"));
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
      ["#flotte", "nav.fleet"], ["#chauffeur", "nav.chauffeur"], ["#conciergerie", "nav.concierge"],
      ["#maison", "nav.house"], ["#reservation", "nav.book"], ["#contact", "nav.contact"],
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
        "Ce site affiche une carte Google Maps et utilise des polices Google Fonts, chargées depuis les serveurs de Google."],
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
      areaServed: "Paris",
      foundingDate: "2014",
    };
    if (BASE_URL) ld.url = BASE_URL;
    if (phone) ld.telephone = phone.lien;
    if (hasEmail) ld.email = C.email;
    if (P.accueil && photoState[P.accueil] === "ok" && BASE_URL) ld.image = BASE_URL + P.accueil;
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
    renderFleet();
    renderChauffeur();
    renderConcierge();
    renderHouse();
    renderSteps();
    renderBooking();
    renderContact();
    renderFooter();
    renderMobileBar();
    renderLegal();
    renderLD();
    $all(".reveal, .reveal-img, .split, .eyebrow").forEach(observe);
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

  // Grandes photos : l'Arc de Triomphe s'efface quand la photo d'accueil existe.
  $all("[data-photo]").forEach(function (el) {
    var key = el.getAttribute("data-photo");
    if (key === "accueil") el.setAttribute("data-eager", "");
    addPhoto(el, P[key]);
  });

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

  // Filtres de la flotte, et bouton « Réserver ce modèle » qui présélectionne le véhicule.
  $("#fleet-filters").addEventListener("click", function (e) {
    var b = e.target.closest(".chip");
    if (!b) return;
    fleetFilter = b.getAttribute("data-filter");
    applyFleetFilter();
  });
  $("#fleet").addEventListener("click", function (e) {
    var a = e.target.closest("[data-car]");
    if (!a) return;
    $("#f-vehicle").value = a.getAttribute("data-car");
    var service = $("#f-service");
    if (service.value === "concierge" || service.value === "other") service.value = "rent";
  });

  // Bandeau « version provisoire » : un clic le masque.
  $("#draft-banner").addEventListener("click", function () { this.remove(); });

  // Mentions légales.
  var legal = $("#legal");
  $("#open-legal").addEventListener("click", function () {
    if (legal.showModal) legal.showModal(); else legal.setAttribute("open", "");
  });
  legal.addEventListener("click", function (e) { if (e.target === legal) legal.close(); });

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
  var desktop = window.matchMedia("(min-width: 1081px)");
  function onDesktop(e) { if (e.matches) setMenu(false); }
  if (desktop.addEventListener) desktop.addEventListener("change", onDesktop); else desktop.addListener(onDesktop);

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
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });

  // ---------- Démarrage ----------
  initBookingForm();
  setLang(pickLang());
  onScroll();
  window.requestAnimationFrame(function () { document.body.classList.add("is-loaded"); });

  // Parallaxe discret des grandes images (ordinateur uniquement).
  if (!REDUCE && window.matchMedia("(hover: hover) and (min-width: 761px)").matches) {
    var layers = $all(".parallax, .hero-media");
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
