/* Rendu du site à partir de js/content.js — pas besoin de modifier ce fichier. */
(function () {
  "use strict";

  var S = window.SALON;
  var DRAFT = !!S.brouillon;

  // ---------- Utilitaires ----------
  function isTodo(v) {
    return v == null || v === "" || (typeof v === "string" && /^\s*TODO/.test(v));
  }
  function esc(v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // Valeur affichable : texte échappé, ou repère « à compléter » en mode brouillon, ou "" sinon.
  function show(v) {
    if (!isTodo(v)) return esc(v);
    return DRAFT ? '<span class="todo">à compléter</span>' : "";
  }
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  var C = S.contact;
  var R = S.reseaux;
  var adresseComplete = [C.adresse, [C.codePostal, C.ville].filter(function (x) { return !isTodo(x); }).join(" ")]
    .filter(function (x) { return !isTodo(x); }).join(", ");

  // ---------- Champs simples ----------
  $all("[data-fill]").forEach(function (el) {
    el.innerHTML = show(S[el.getAttribute("data-fill")]);
  });
  if (DRAFT) $("#draft-banner").hidden = false;
  $("#year").textContent = new Date().getFullYear();

  // ---------- Présentation ----------
  $("#presentation").innerHTML = S.presentation
    .filter(function (p) { return DRAFT || !isTodo(p); })
    .map(function (p) { return "<p>" + show(p) + "</p>"; }).join("");

  $("#points-forts").innerHTML = S.pointsForts
    .filter(function (p) { return DRAFT || !isTodo(p.titre); })
    .map(function (p, i) {
      return '<li class="reveal"><span class="hl-num">0' + (i + 1) + "</span>" +
        "<h3>" + show(p.titre) + "</h3><p>" + show(p.texte) + "</p></li>";
    }).join("");

  // ---------- Prestations (onglets) ----------
  var tabs = $("#tabs");
  var panels = $("#panels");
  S.prestations.forEach(function (cat, i) {
    var id = "cat-" + i;
    var tab = document.createElement("button");
    tab.className = "tab";
    tab.type = "button";
    tab.id = "tab-" + id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", id);
    tab.setAttribute("aria-selected", i === 0 ? "true" : "false");
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.textContent = cat.categorie;
    tabs.appendChild(tab);

    var panel = document.createElement("div");
    panel.className = "panel";
    panel.id = id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.hidden = i !== 0;
    panel.innerHTML = '<ul class="menu">' + cat.items.map(function (it) {
      var meta = [];
      if (!isTodo(it.duree)) meta.push(esc(it.duree));
      if (it.detail) meta.push(show(it.detail));
      return '<li class="menu-item">' +
        '<div class="menu-line"><span class="menu-name">' + show(it.nom) + '</span>' +
        '<span class="menu-dots" aria-hidden="true"></span>' +
        '<span class="menu-price">' + (isTodo(it.prix) ? (DRAFT ? show(it.prix) : "sur demande") : esc(it.prix)) + "</span></div>" +
        (meta.length ? '<p class="menu-meta">' + meta.join(" · ") + "</p>" : "") +
        "</li>";
    }).join("") + "</ul>";
    panels.appendChild(panel);
  });

  function selectTab(tab) {
    $all(".tab").forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
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
    if (e.key === "ArrowRight") next = list[(i + 1) % list.length];
    if (e.key === "ArrowLeft") next = list[(i - 1 + list.length) % list.length];
    if (e.key === "Home") next = list[0];
    if (e.key === "End") next = list[list.length - 1];
    if (next) { e.preventDefault(); next.focus(); selectTab(next); }
  });

  $("#note-tarifs").innerHTML = show(S.noteTarifs);

  // ---------- Photos (avec repli décoratif si le fichier manque) ----------
  function loadPhoto(el, src, alt) {
    if (!src) return;
    var img = new Image();
    img.onload = function () {
      img.alt = alt || "";
      img.loading = "lazy";
      el.appendChild(img);
      el.classList.add("has-photo");
    };
    img.src = src;
  }
  $all("[data-photo]").forEach(function (el) {
    loadPhoto(el, S.photos[el.getAttribute("data-photo")], "");
  });

  var gallery = $("#gallery");
  S.photos.galerie.forEach(function (src, i) {
    var fig = document.createElement("figure");
    fig.className = "gallery-item photo-slot reveal";
    fig.style.setProperty("--i", i);
    gallery.appendChild(fig);
    loadPhoto(fig, src, "Réalisation du salon " + S.nom + " n°" + (i + 1));
  });

  $("#insta-cta").innerHTML = R.instagram
    ? '<a class="btn btn-ghost" href="' + esc(R.instagram) + '" target="_blank" rel="noopener">Plus de réalisations sur Instagram</a>'
    : (DRAFT ? 'Lien Instagram : <span class="todo">à compléter</span>' : "");

  // ---------- Rendez-vous ----------
  var actions = [];
  if (C.reservationEnLigne) {
    actions.push('<a class="btn" href="' + esc(C.reservationEnLigne) + '" target="_blank" rel="noopener">Réserver en ligne</a>');
  }
  if (C.telephoneLien) {
    actions.push('<a class="btn ' + (actions.length ? "btn-ghost" : "") + '" href="tel:' + esc(C.telephoneLien) + '">Appeler le ' + esc(C.telephone) + "</a>");
  }
  if (C.whatsapp) {
    actions.push('<a class="btn btn-ghost" href="https://wa.me/' + esc(C.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a>');
  }
  $("#booking-actions").innerHTML = actions.length ? actions.join("")
    : (DRAFT ? '<p>Téléphone / lien de réservation : <span class="todo">à compléter</span></p>' : "");

  // ---------- Contact ----------
  var rows = [];
  rows.push(["Adresse", DRAFT && isTodo(C.adresse) ? show(C.adresse) : esc(adresseComplete)]);
  rows.push(["Téléphone", C.telephoneLien
    ? '<a href="tel:' + esc(C.telephoneLien) + '">' + esc(C.telephone) + "</a>" : show(C.telephone)]);
  if (C.email || DRAFT) {
    rows.push(["E-mail", C.email ? '<a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a>" : show(C.email)]);
  }
  $("#contact-list").innerHTML = rows
    .filter(function (r) { return r[1]; })
    .map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("");

  // ---------- Horaires (jour courant mis en avant) ----------
  var today = (new Date().getDay() + 6) % 7; // 0 = lundi
  $("#hours").innerHTML = "<tbody>" + S.horaires.map(function (h, i) {
    var closed = /ferm/i.test(h.heures);
    return '<tr class="' + (i === today ? "is-today " : "") + (closed ? "is-closed" : "") + '">' +
      "<th scope=\"row\">" + esc(h.jour) + (i === today ? ' <span class="today-tag">aujourd\'hui</span>' : "") + "</th>" +
      "<td>" + show(h.heures) + "</td></tr>";
  }).join("") + "</tbody>";

  // ---------- Carte ----------
  if (!isTodo(C.adresse) && !isTodo(C.ville)) {
    $("#map").innerHTML = '<iframe title="Plan d\'accès" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=' +
      encodeURIComponent(S.nom + " " + adresseComplete) + '&output=embed"></iframe>';
  } else {
    $("#map").innerHTML = '<div class="map-empty">Le plan s\'affichera ici dès que l\'adresse sera renseignée.</div>';
  }

  // ---------- Réseaux ----------
  var icons = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" class="fill"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3c.4 2.6 2 4.2 5 4.5v3.5c-1.9 0-3.6-.6-5-1.6V15a6 6 0 1 1-6-6v3.6A2.5 2.5 0 1 0 11.5 15V3H15z"/></svg>',
  };
  $("#socials").innerHTML = Object.keys(icons).filter(function (k) { return R[k]; }).map(function (k) {
    return '<a href="' + esc(R[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + icons[k] + "</a>";
  }).join("");

  // ---------- Barre mobile ----------
  var bar = [];
  if (C.telephoneLien) bar.push('<a href="tel:' + esc(C.telephoneLien) + '">Appeler</a>');
  bar.push(C.reservationEnLigne
    ? '<a class="is-primary" href="' + esc(C.reservationEnLigne) + '" target="_blank" rel="noopener">Réserver</a>'
    : '<a class="is-primary" href="#rendez-vous">Réserver</a>');
  $("#mobile-bar").innerHTML = bar.join("");

  // ---------- Données structurées (référencement Google) ----------
  var ld = { "@context": "https://schema.org", "@type": "HairSalon", name: S.nom };
  if (!isTodo(C.adresse)) {
    ld.address = { "@type": "PostalAddress", streetAddress: C.adresse, postalCode: isTodo(C.codePostal) ? undefined : C.codePostal,
      addressLocality: isTodo(C.ville) ? undefined : C.ville, addressCountry: C.pays || "FR" };
  }
  if (C.telephoneLien) ld.telephone = C.telephoneLien;
  if (C.email) ld.email = C.email;
  var same = Object.keys(R).map(function (k) { return R[k]; }).filter(Boolean);
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

  // ---------- En-tête au défilement ----------
  var header = $(".site-header");
  function onScroll() { header.classList.toggle("is-scrolled", window.scrollY > 10); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- Apparition douce ----------
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    $all(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $all(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
