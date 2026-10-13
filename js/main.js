/* Rendu du site à partir de js/content.js — pas besoin de modifier ce fichier. */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var S = window.SALON;
  var DRAFT = !!S.brouillon;
  var C = S.contact || {};
  var R = S.reseaux || {};
  var P = S.photos || {};

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
  // Valeur affichable : texte échappé, repère « à compléter » en brouillon, ou "".
  function show(v) {
    if (ok(v)) return esc(v);
    return DRAFT ? '<span class="todo">à compléter</span>' : "";
  }
  // Lien ; `label` doit déjà être du HTML sûr.
  function link(href, label, cls, external) {
    return "<a" + (cls ? ' class="' + cls + '"' : "") + ' href="' + esc(href) + '"' +
      (external ? ' target="_blank" rel="noopener"' : "") + ">" + label + "</a>";
  }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function setHTML(sel, html) { var el = $(sel); if (el) el.innerHTML = html; return el; }
  function hide(sel) { var el = $(sel); if (el) el.hidden = true; }
  // Espaces insécables (utiles à l'affichage) remis en espaces simples pour Google.
  function plain(v) { return String(v).replace(/\u00a0/g, " "); }

  // ---------- Données dérivées ----------
  var phones = (C.telephones || []).filter(function (t) { return ok(t.lien); });
  var villeCP = [C.codePostal, C.ville].filter(ok).join(" ");
  var hasAddress = ok(C.adresse) && ok(C.ville);
  var adresseLigne = [C.adresse, C.quartier, villeCP].filter(ok).join(", ");
  var itineraire = C.googleMaps || (hasAddress
    ? "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(plain(S.nomOfficiel + ", " + adresseLigne))
    : null);
  var instaHandle = R.instagram ? (R.instagram.match(/instagram\.com\/([^\/?#]+)/) || [])[1] : null;

  // ---------- Champs simples ----------
  $all("[data-fill]").forEach(function (el) {
    el.innerHTML = show(S[el.getAttribute("data-fill")]);
  });
  if (DRAFT) $("#draft-banner").hidden = false;
  $("#year").textContent = new Date().getFullYear();

  // ---------- Logo image (remplace le logo texte si le fichier existe) ----------
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

  // ---------- Bandeau d'infos sous le titre ----------
  var infos = [];
  if (ok(C.quartier) || ok(C.ville)) infos.push(esc([C.quartier, C.ville].filter(ok).join(", ")));
  if (ok(S.horairesResume)) infos.push(esc(S.horairesResume));
  if (phones[0]) infos.push(link("tel:" + phones[0].lien, esc(phones[0].affiche)));
  setHTML("#hero-info", infos.map(function (x) { return "<p>" + x + "</p>"; }).join(""));

  // ---------- Le salon ----------
  setHTML("#presentation", (S.presentation || [])
    .filter(function (p) { return DRAFT || ok(p); })
    .map(function (p) { return "<p>" + show(p) + "</p>"; }).join(""));

  var ROMAN = ["I", "II", "III", "IV", "V", "VI"];
  setHTML("#points-forts", (S.pointsForts || [])
    .filter(function (p) { return DRAFT || ok(p.titre); })
    .map(function (p, i) {
      return '<li class="reveal" style="--i:' + i + '"><span class="hl-num">' + ROMAN[i] + "</span>" +
        "<h3>" + show(p.titre) + "</h3><p>" + show(p.texte) + "</p></li>";
    }).join(""));

  var M = S.manifeste || {};
  setHTML("#manifeste-titre", show(M.titre));
  setHTML("#manifeste-texte", show(M.texte));

  // ---------- Prestations ----------
  // Hors brouillon, les prestations sans nom et les catégories vides disparaissent.
  var cats = (S.prestations || []).map(function (cat) {
    var groups = (cat.groupes || [{ titre: null, items: cat.items || [] }]).map(function (g) {
      return { titre: g.titre, items: (g.items || []).filter(function (it) { return DRAFT || ok(it.nom); }) };
    }).filter(function (g) { return g.items.length; });
    return { nom: cat.categorie, groups: groups };
  }).filter(function (c) { return c.groups.length; });

  function renderItem(it) {
    var prix = ok(it.prix) ? esc(it.prix) : (DRAFT ? show(it.prix) : "Sur demande");
    return '<li class="menu-item"><span class="menu-name">' + show(it.nom) +
      (ok(it.duree) ? '<span class="menu-duree">' + esc(it.duree) + "</span>" : "") +
      (it.detail && (DRAFT || ok(it.detail)) ? '<span class="menu-meta">' + show(it.detail) + "</span>" : "") +
      '</span><span class="menu-price">' + prix + "</span></li>";
  }

  var tabs = $("#tabs");
  var panels = $("#panels");
  cats.forEach(function (cat, i) {
    var id = "cat-" + i;
    var tab = document.createElement("button");
    tab.className = "tab";
    tab.type = "button";
    tab.id = "tab-" + id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", id);
    tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.textContent = cat.nom;
    tabs.appendChild(tab);

    var panel = document.createElement("div");
    panel.className = "panel";
    panel.id = id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;
    panel.hidden = i !== 0;
    panel.innerHTML = '<h3 class="panel-title">' + esc(cat.nom) + "</h3>" + cat.groups.map(function (g) {
      return '<div class="menu-group">' +
        (g.titre ? '<h4 class="menu-group-title">' + esc(g.titre) + "</h4>" : "") +
        '<ul class="menu">' + g.items.map(renderItem).join("") + "</ul></div>";
    }).join("");
    panels.appendChild(panel);
  });

  function selectTab(tab, focus) {
    if (!tab) return;
    $all(".tab").forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
    // Sur mobile, les onglets défilent horizontalement : on centre l'onglet actif.
    if (tabs.scrollWidth > tabs.clientWidth) {
      tabs.scrollTo({ left: tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
    }
  }
  tabs.addEventListener("click", function (e) {
    var t = e.target.closest(".tab");
    if (t) selectTab(t);
  });
  tabs.addEventListener("keydown", function (e) {
    var list = $all(".tab");
    var i = list.indexOf(document.activeElement);
    if (i < 0) return;
    var next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = list[(i + 1) % list.length];
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = list[(i - 1 + list.length) % list.length];
    if (e.key === "Home") next = list[0];
    if (e.key === "End") next = list[list.length - 1];
    if (next) { e.preventDefault(); selectTab(next, true); }
  });

  // Liens « univers » du manifeste : ouvrent l'onglet correspondant.
  setHTML("#univers", cats.map(function (c, i) {
    return '<li><a href="#prestations" data-tab="' + i + '">' + esc(c.nom) + "</a></li>";
  }).join(""));
  $("#univers").addEventListener("click", function (e) {
    var a = e.target.closest("a[data-tab]");
    if (a) selectTab(document.getElementById("tab-cat-" + a.getAttribute("data-tab")));
  });

  setHTML("#note-tarifs", show(S.noteTarifs));

  // ---------- Photos (repli décoratif tant que le fichier manque) ----------
  function addPhoto(el, src, alt, opts) {
    opts = opts || {};
    if (!src) { if (opts.onFail) opts.onFail(); return; }
    var img = document.createElement("img");
    img.alt = alt || "";
    img.decoding = "async";
    if (opts.lazy) img.loading = "lazy";
    img.onload = function () { el.classList.add("has-photo"); };
    img.onerror = function () { img.remove(); if (opts.onFail) opts.onFail(); };
    el.appendChild(img);
    img.src = src;
  }
  $all("[data-photo]").forEach(function (el) {
    var key = el.getAttribute("data-photo");
    addPhoto(el, P[key], "", { lazy: key !== "accueil" });
  });

  var gallery = $("#gallery");
  function layoutGallery() {
    var n = gallery.children.length;
    gallery.classList.toggle("is-mosaic", n === 6); // mosaïque prévue pour 6 photos
    if (!n && !DRAFT) { hide("#galerie"); hide("#nav-galerie"); }
  }
  (P.galerie || []).forEach(function (src, i) {
    var fig = document.createElement("figure");
    fig.className = "gallery-item photo-slot reveal";
    fig.style.setProperty("--i", i % 3);
    gallery.appendChild(fig);
    addPhoto(fig, src, "Réalisation du " + S.nomOfficiel + " (" + (i + 1) + ")", {
      lazy: true,
      onFail: function () { if (!DRAFT) { fig.remove(); layoutGallery(); } },
    });
  });
  layoutGallery();

  setHTML("#insta-cta", R.instagram
    ? link(R.instagram, "Suivre @" + esc(instaHandle || "instagram") + " sur Instagram", "link-line", true)
    : (DRAFT ? 'Lien Instagram : <span class="todo">à compléter</span>' : ""));

  // ---------- Avis ----------
  var avis = (S.avis || []).filter(ok);
  if (avis.length) {
    setHTML("#reviews", avis.map(function (t, i) {
      return '<figure class="review reveal" style="--i:' + i + '"><blockquote><p>' + esc(t) + "</p></blockquote></figure>";
    }).join(""));
  } else {
    hide("#avis");
    hide("#nav-avis");
  }

  // ---------- Rendez-vous ----------
  setHTML("#booking-lead", show(S.texteRendezVous));
  setHTML("#booking-phones", phones.map(function (t) {
    return '<a class="phone" href="tel:' + esc(t.lien) + '">' +
      (t.libelle ? '<span class="phone-label">' + esc(t.libelle) + "</span>" : "") +
      '<span class="phone-number">' + esc(t.affiche) + "</span></a>";
  }).join("") || show(null));

  var actions = [];
  function addAction(href, label) {
    actions.push(link(href, label, actions.length ? "btn btn-outline-light" : "btn btn-light", true));
  }
  if (C.reservationEnLigne) addAction(C.reservationEnLigne, "Réserver en ligne");
  if (R.messageInstagram) addAction(R.messageInstagram, "Écrire sur Instagram");
  if (C.whatsapp) addAction("https://wa.me/" + C.whatsapp, "WhatsApp");
  setHTML("#booking-actions", actions.join(""));

  // ---------- Contact ----------
  var rows = [];
  var addr = [ok(C.adresse) ? esc(C.adresse) : show(C.adresse), esc([C.quartier, villeCP].filter(ok).join(" — "))]
    .filter(Boolean).join("<br>");
  if (itineraire) addr += "<br>" + link(itineraire, "Itinéraire", "link-line link-small", true);
  rows.push(["Adresse", addr]);
  rows.push(["Téléphone", phones.length ? phones.map(function (t) {
    return link("tel:" + t.lien, esc(t.affiche)) + (t.libelle ? '<span class="muted">' + esc(t.libelle) + "</span>" : "");
  }).join("<br>") : show(null)]);
  if (C.email || DRAFT) rows.push(["E-mail", C.email ? link("mailto:" + C.email, esc(C.email)) : show(null)]);
  if (R.instagram) rows.push(["Instagram", link(R.instagram, "@" + esc(instaHandle || "instagram"), "", true)]);
  setHTML("#contact-list", rows.filter(function (r) { return r[1]; }).map(function (r) {
    return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
  }).join(""));

  // ---------- Horaires (jour en cours mis en avant, à l'heure d'Oran) ----------
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var today = JOURS[new Date().getDay()];
  try {
    if (S.fuseau) {
      today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: S.fuseau }).format(new Date()).toLowerCase();
    }
  } catch (e) { /* fuseau non reconnu : jour local */ }
  setHTML("#hours", "<tbody>" + (S.horaires || []).map(function (h) {
    var isToday = String(h.jour).trim().toLowerCase() === today;
    var closed = /ferm/i.test(h.heures || "");
    return '<tr class="' + (isToday ? "is-today " : "") + (closed ? "is-closed" : "") + '">' +
      '<th scope="row">' + esc(h.jour) + (isToday ? '<span class="today-tag">Aujourd’hui</span>' : "") + "</th>" +
      "<td>" + show(h.heures) + "</td></tr>";
  }).join("") + "</tbody>");

  // ---------- Carte ----------
  if (hasAddress) {
    setHTML("#map", '<iframe title="Plan d’accès au ' + esc(S.nomOfficiel) + '" loading="lazy" ' +
      'referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' +
      encodeURIComponent(plain(S.nomOfficiel + ", " + [C.adresse, C.ville].join(", "))) + '&output=embed"></iframe>');
  } else if (DRAFT) {
    setHTML("#map", '<div class="map-empty">Le plan s’affichera ici dès que l’adresse sera renseignée.</div>');
  } else {
    $("#map").remove();
  }

  // ---------- Pied de page ----------
  setHTML("#footer-line", [esc([C.quartier, C.ville].filter(ok).join(", ")), ok(S.horairesResume) ? esc(S.horairesResume) : ""]
    .filter(Boolean).join("<br>"));

  var icons = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="fill"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3c.4 2.6 2 4.2 5 4.5v3.5c-1.9 0-3.6-.6-5-1.6V15a6 6 0 1 1-6-6v3.6A2.5 2.5 0 1 0 11.5 15V3H15z"/></svg>',
  };
  var NOMS = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
  setHTML("#socials", Object.keys(icons).filter(function (k) { return R[k]; }).map(function (k) {
    return '<a href="' + esc(R[k]) + '" target="_blank" rel="noopener" aria-label="' + NOMS[k] + '">' + icons[k] + "</a>";
  }).join(""));

  // ---------- Barre mobile ----------
  var bar = [];
  if (phones[0]) bar.push(link("tel:" + phones[0].lien, "Appeler", "is-primary"));
  if (C.reservationEnLigne) bar.push(link(C.reservationEnLigne, "Réserver", "", true));
  else if (C.whatsapp) bar.push(link("https://wa.me/" + C.whatsapp, "WhatsApp", "", true));
  else if (R.messageInstagram) bar.push(link(R.messageInstagram, "Message", "", true));
  else bar.push(link("#prestations", "Tarifs"));
  setHTML("#mobile-bar", bar.join(""));

  // ---------- Données structurées (référencement Google) ----------
  var DAYS = { lundi: "Monday", mardi: "Tuesday", mercredi: "Wednesday", jeudi: "Thursday",
    vendredi: "Friday", samedi: "Saturday", dimanche: "Sunday" };
  function hhmm(h, m) { return ("0" + h).slice(-2) + ":" + (m || "00"); }
  var specs = {};
  (S.horaires || []).forEach(function (h) {
    var m = String(h.heures || "").match(/(\d{1,2})\s*h\s*(\d{2})?\D+?(\d{1,2})\s*h\s*(\d{2})?/i);
    var day = DAYS[String(h.jour).trim().toLowerCase()];
    if (!m || !day) return;
    var key = hhmm(m[1], m[2]) + "-" + hhmm(m[3], m[4]);
    (specs[key] = specs[key] || []).push(day);
  });

  var ld = { "@context": "https://schema.org", "@type": ["BeautySalon", "HairSalon"], name: S.nomOfficiel };
  if (ok(S.siteWeb)) ld.url = S.siteWeb;
  if (ok(C.adresse)) {
    ld.address = { "@type": "PostalAddress", streetAddress: plain(C.adresse),
      postalCode: ok(C.codePostal) ? C.codePostal : undefined,
      addressLocality: ok(C.ville) ? C.ville : undefined, addressCountry: C.pays || undefined };
  }
  if (phones[0]) ld.telephone = phones[0].lien;
  if (C.email) ld.email = C.email;
  var hoursSpec = Object.keys(specs).map(function (k) {
    return { "@type": "OpeningHoursSpecification", dayOfWeek: specs[k], opens: k.split("-")[0], closes: k.split("-")[1] };
  });
  if (hoursSpec.length) ld.openingHoursSpecification = hoursSpec;
  var same = ["instagram", "facebook", "tiktok"].map(function (k) { return R[k]; }).filter(Boolean);
  if (same.length) ld.sameAs = same;
  var ldTag = document.createElement("script");
  ldTag.type = "application/ld+json";
  ldTag.textContent = JSON.stringify(ld);
  document.head.appendChild(ldTag);

  // ---------- Menu mobile ----------
  var toggle = $(".nav-toggle");
  var nav = $("#nav");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.classList.toggle("menu-open", open);
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  var desktop = window.matchMedia("(min-width: 961px)");
  function onDesktop(e) { if (e.matches) setMenu(false); }
  if (desktop.addEventListener) desktop.addEventListener("change", onDesktop); else desktop.addListener(onDesktop);

  // ---------- En-tête au défilement ----------
  var header = $(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Apparition douce ----------
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = $all(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
