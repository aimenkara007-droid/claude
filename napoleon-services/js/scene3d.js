/* ============================================================
   Napoléon Services — scènes 3D (Three.js)

   Tout est modélisé ici, en code, sans fichier 3D externe :
   - une voiture paramétrique (berline, SUV, coupé, compacte) qui se
     transforme d'une silhouette à l'autre ;
   - l'Arc de Triomphe, tracé en lignes dorées ;
   - un jet privé.

   Ce fichier est chargé comme un script normal. La bibliothèque Three.js
   arrive ensuite par le petit module en bas d'index.html, qui appelle
   window.NS3D({ THREE, RoomEnvironment }). Sans WebGL ou sans connexion
   au CDN, rien ne se passe et le site garde ses visuels 2D.
   ============================================================ */
(function () {
  "use strict";

  window.NS3D = function (lib) {
    var THREE = lib.THREE;
    var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var MOBILE = window.matchMedia("(max-width: 760px)").matches;
    var TAU = Math.PI * 2;

    // ---------- Outils ----------
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function smooth01(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
    function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    // Interpolation cubique monotone (Fritsch–Carlson) : courbes sans « rebond ».
    function curve(points) {
      var n = points.length, xs = [], ys = [], d = [], m = [], i;
      for (i = 0; i < n; i++) { xs[i] = points[i][0]; ys[i] = points[i][1]; }
      for (i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
      m[0] = d[0]; m[n - 1] = d[n - 2];
      for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
      for (i = 0; i < n - 1; i++) {
        if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
        var a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
        if (s > 9) { var k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
      }
      return function (x) {
        if (x <= xs[0]) return ys[0];
        if (x >= xs[n - 1]) return ys[n - 1];
        var lo = 0, hi = n - 1;
        while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (xs[mid] > x) hi = mid; else lo = mid; }
        var h = xs[hi] - xs[lo], t = (x - xs[lo]) / h, t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * ys[lo] + (t3 - 2 * t2 + t) * h * m[lo] +
          (-2 * t3 + 3 * t2) * ys[hi] + (t3 - t2) * h * m[hi];
      };
    }

    // Petites textures dessinées au canevas (halo, ombre, poussière).
    function radialTexture(stops, size) {
      size = size || 128;
      var c = document.createElement("canvas");
      c.width = c.height = size;
      var g = c.getContext("2d");
      var grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(function (s) { grd.addColorStop(s[0], s[1]); });
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      var tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    }
    var TEX = {
      glow: radialTexture([[0, "rgba(255,255,255,1)"], [0.18, "rgba(255,255,255,.55)"], [0.5, "rgba(255,255,255,.12)"], [1, "rgba(255,255,255,0)"]]),
      shadow: radialTexture([[0, "rgba(0,0,0,.85)"], [0.55, "rgba(0,0,0,.45)"], [1, "rgba(0,0,0,0)"]]),
      dust: radialTexture([[0, "rgba(255,240,210,1)"], [0.4, "rgba(255,225,170,.5)"], [1, "rgba(255,220,160,0)"]], 64),
      cloud: radialTexture([[0, "rgba(255,244,228,.55)"], [0.5, "rgba(250,236,214,.22)"], [1, "rgba(250,236,214,0)"]], 256),
      floor: radialTexture([[0, "rgba(255,255,255,.12)"], [0.45, "rgba(255,255,255,.55)"], [1, "rgba(255,255,255,1)"]], 256),
    };

    // ============================================================
    // Voiture paramétrique
    // ============================================================
    // Coordonnées : x = longueur (avant vers +x), y = hauteur, z = largeur.
    // Chaque silhouette est décrite par des courbes en fonction de u ∈ [0, 1]
    // (0 = arrière, 1 = avant) : dessus de caisse, bas de caisse, demi-largeur,
    // et hauteur du pavillon pour l'habitacle vitré.
    var STYLES = {
      sedan: {
        L: 5.1, R: 0.385, tire: 0.27, axles: [0.2, 0.804], glassTop: 0.7, nCabin: 4.5,
        section: [[0, 0], [0.55, 0], [0.82, 0.02], [0.93, 0.09], [0.975, 0.22], [0.992, 0.42], [1, 0.66], [0.985, 0.8], [0.93, 0.9], [0.8, 0.96], [0.5, 0.995], [0, 1]],
        top: [[0, 0.93], [0.025, 1.0], [0.08, 1.03], [0.2, 1.02], [0.4, 1.0], [0.62, 0.98], [0.7, 0.96], [0.8, 0.92], [0.9, 0.86], [0.965, 0.8], [1, 0.72]],
        bottom: [[0, 0.36], [0.03, 0.26], [0.08, 0.2], [0.92, 0.2], [0.975, 0.25], [1, 0.3]],
        width: [[0, 0.84], [0.025, 0.92], [0.08, 0.95], [0.88, 0.95], [0.965, 0.92], [1, 0.82]],
        cabin: [[0.19, 1.02], [0.24, 1.2], [0.3, 1.37], [0.4, 1.47], [0.53, 1.47], [0.6, 1.36], [0.7, 0.96]],
        roofRange: [0.3, 0.58], grille: { y0: 0.38, y1: 0.58, w: 0.36 },
      },
      suv: {
        L: 4.85, R: 0.445, tire: 0.3, axles: [0.207, 0.799], glassTop: 0.86, nCabin: 7,
        section: [[0, 0], [0.6, 0], [0.88, 0.015], [0.96, 0.07], [0.99, 0.18], [1, 0.45], [1, 0.8], [0.99, 0.9], [0.95, 0.96], [0.8, 0.99], [0.4, 1], [0, 1]],
        top: [[0, 1.08], [0.02, 1.16], [0.08, 1.2], [0.7, 1.18], [0.8, 1.15], [0.95, 1.1], [0.985, 1.04], [1, 0.98]],
        bottom: [[0, 0.52], [0.04, 0.36], [0.1, 0.31], [0.9, 0.31], [0.97, 0.4], [1, 0.48]],
        width: [[0, 0.9], [0.03, 0.97], [0.1, 0.99], [0.9, 0.99], [0.97, 0.95], [1, 0.86]],
        cabin: [[0.03, 1.2], [0.055, 1.7], [0.1, 1.86], [0.58, 1.88], [0.64, 1.8], [0.715, 1.18]],
        roofRange: [0.08, 0.6], grille: { y0: 0.56, y1: 0.86, w: 0.46 },
      },
      sport: {
        L: 4.52, R: 0.37, tire: 0.29, axles: [0.212, 0.754], glassTop: 0.66, nCabin: 3.6,
        section: [[0, 0], [0.5, 0], [0.8, 0.03], [0.92, 0.12], [0.975, 0.28], [1, 0.5], [0.99, 0.66], [0.95, 0.8], [0.85, 0.9], [0.62, 0.97], [0.3, 1], [0, 1]],
        top: [[0, 0.76], [0.03, 0.86], [0.1, 0.91], [0.2, 0.92], [0.34, 0.88], [0.55, 0.85], [0.68, 0.85], [0.75, 0.87], [0.82, 0.83], [0.9, 0.72], [0.96, 0.62], [1, 0.5]],
        bottom: [[0, 0.32], [0.04, 0.2], [0.1, 0.15], [0.9, 0.15], [0.97, 0.22], [1, 0.3]],
        width: [[0, 0.76], [0.04, 0.89], [0.18, 0.93], [0.45, 0.88], [0.7, 0.88], [0.8, 0.9], [0.93, 0.84], [1, 0.68]],
        cabin: [[0.1, 0.9], [0.2, 1.08], [0.32, 1.22], [0.44, 1.29], [0.52, 1.28], [0.58, 1.2], [0.685, 0.85]],
        roofRange: [0.33, 0.55], grille: { y0: 0.32, y1: 0.44, w: 0.42 },
      },
      compact: {
        L: 4.42, R: 0.35, tire: 0.25, axles: [0.19, 0.808], glassTop: 0.72, nCabin: 4.5,
        section: [[0, 0], [0.55, 0], [0.82, 0.02], [0.93, 0.1], [0.975, 0.24], [0.995, 0.45], [1, 0.66], [0.98, 0.8], [0.92, 0.9], [0.78, 0.96], [0.45, 0.995], [0, 1]],
        top: [[0, 0.9], [0.03, 0.99], [0.08, 1.01], [0.6, 0.97], [0.75, 0.93], [0.85, 0.87], [0.95, 0.8], [1, 0.7]],
        bottom: [[0, 0.37], [0.04, 0.23], [0.1, 0.18], [0.9, 0.18], [0.97, 0.26], [1, 0.34]],
        width: [[0, 0.79], [0.04, 0.87], [0.12, 0.9], [0.88, 0.9], [0.96, 0.86], [1, 0.73]],
        cabin: [[0.03, 1.0], [0.08, 1.22], [0.17, 1.38], [0.5, 1.43], [0.58, 1.37], [0.715, 0.95]],
        roofRange: [0.09, 0.56], grille: { y0: 0.36, y1: 0.57, w: 0.38 },
      },
    };

    var SEG = { stations: 128, ring: 56, cabinStations: 72, cabinRing: 30 };

    // Demi-profil de section (de bas en haut, côté droit), normalisé : z/demi-largeur, (y - bas)/(haut - bas).
    function sectionProfile(st) {
      if (st._sec) return st._sec;
      var c = new THREE.CatmullRomCurve3(st.section.map(function (p) { return new THREE.Vector3(p[0], p[1], 0); }), false, "centripetal");
      var half = SEG.ring / 2, pts = c.getSpacedPoints(half), table = c.getSpacedPoints(400);
      st._sec = {
        pts: pts,
        zAt: function (yn) {
          yn = clamp(yn, 0, 1);
          var best = 0;
          for (var i = 0; i < table.length - 1; i++) {
            var a = table[i], b = table[i + 1];
            if ((a.y - yn) * (b.y - yn) <= 0 && a.y !== b.y) { best = Math.max(best, lerp(a.x, b.x, (yn - a.y) / (b.y - a.y))); }
          }
          return best;
        },
      };
      return st._sec;
    }

    // Fonctions de forme d'une silhouette (avec les passages de roue découpés dans le bas de caisse).
    function shapeOf(key) {
      var st = STYLES[key];
      if (st._f) return st._f;
      var top = curve(st.top), bottom = curve(st.bottom), width = curve(st.width), roof = curve(st.cabin);
      var rA = st.R + 0.065;
      var f = {
        st: st,
        x: function (u) { return (u - 0.5) * st.L; },
        top: top,
        width: width,
        roof: roof,
        cabinRange: [st.cabin[0][0], st.cabin[st.cabin.length - 1][0]],
        arch: rA,
        bottom: function (u) {
          var yb = bottom(u), yt = top(u);
          for (var i = 0; i < st.axles.length; i++) {
            var dx = (u - st.axles[i]) * st.L;
            if (Math.abs(dx) < rA) yb = Math.max(yb, st.R + Math.sqrt(rA * rA - dx * dx));
          }
          return Math.min(yb, yt - 0.09);
        },
      };
      // Demi-largeur de la caisse à une hauteur donnée (d'après le profil de section).
      f.halfWidthAt = function (u, y) {
        var yt = top(u), yb = f.bottom(u);
        return width(u) * sectionProfile(st).zAt((y - yb) / (yt - yb));
      };
      st._f = f;
      return f;
    }

    // Répartition des sections : plus serrée autour des passages de roue.
    function stationsFor(key, count) {
      var f = shapeOf(key), st = f.st, N = 1600, acc = [0], i;
      function dens(u) {
        var d = 1;
        st.axles.forEach(function (a) {
          var dx = Math.abs((u - a) * st.L);
          d += 1.6 * Math.exp(-Math.pow((dx - f.arch) / 0.05, 2)) + (dx < f.arch ? 0.9 : 0);
        });
        return d + 1.2 * Math.exp(-Math.pow(u / 0.02, 2)) + 1.2 * Math.exp(-Math.pow((1 - u) / 0.02, 2));
      }
      for (i = 1; i <= N; i++) acc[i] = acc[i - 1] + dens((i - 0.5) / N);
      var out = [], j = 0;
      for (var k = 0; k < count; k++) {
        var target = acc[N] * k / (count - 1);
        while (j < N && acc[j + 1] < target) j++;
        var t = acc[j + 1] === acc[j] ? 0 : (target - acc[j]) / (acc[j + 1] - acc[j]);
        out.push(clamp((j + t) / N, 0, 1));
      }
      return out;
    }

    // Maillage « loft » : anneaux successifs reliés par des quadrilatères.
    function loft(rings, closedRing, caps) {
      var S = rings.length, M = rings[0].length;
      var extra = caps ? 2 : 0;
      var pos = new Float32Array((S * M + extra) * 3), idx = [], p = 0, i, j;
      for (i = 0; i < S; i++) for (j = 0; j < M; j++) {
        pos[p++] = rings[i][j][0]; pos[p++] = rings[i][j][1]; pos[p++] = rings[i][j][2];
      }
      var segs = closedRing ? M : M - 1;
      for (i = 0; i < S - 1; i++) for (j = 0; j < segs; j++) {
        var a = i * M + j, b = i * M + (j + 1) % M, c = (i + 1) * M + j, d = (i + 1) * M + (j + 1) % M;
        idx.push(a, c, b, b, c, d);
      }
      if (caps) {
        [0, S - 1].forEach(function (si, k) {
          var cx = 0, cy = 0, cz = 0;
          for (j = 0; j < M; j++) { cx += rings[si][j][0]; cy += rings[si][j][1]; cz += rings[si][j][2]; }
          var ci = S * M + k;
          pos[ci * 3] = cx / M; pos[ci * 3 + 1] = cy / M; pos[ci * 3 + 2] = cz / M;
          for (j = 0; j < M; j++) {
            var r0 = si * M + j, r1 = si * M + (j + 1) % M;
            if (k === 0) idx.push(ci, r0, r1); else idx.push(ci, r1, r0);
          }
        });
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    }

    function bodyGeometry(key) {
      var f = shapeOf(key), st = f.st, M = SEG.ring;
      var prof = sectionProfile(st).pts, half = M / 2;
      function ringAt(u, shrink, dx) {
        var x = f.x(u) + dx, yt = f.top(u), yb = f.bottom(u), w = f.width(u) * shrink, ring = [], j;
        var yc = (yt + yb) / 2, hh = (yt - yb) / 2 * shrink;
        // Côté droit du bas vers le haut, puis côté gauche du haut vers le bas.
        for (j = 0; j <= half; j++) ring.push([x, yc - hh + prof[j].y * hh * 2, w * prof[j].x]);
        for (j = half - 1; j >= 1; j--) ring.push([x, yc - hh + prof[j].y * hh * 2, -w * prof[j].x]);
        return ring;
      }
      var rings = stationsFor(key, SEG.stations).map(function (u) { return ringAt(u, 1, 0); });
      // Arêtes adoucies aux deux extrémités (faces avant et arrière légèrement bombées).
      rings.unshift(ringAt(0, 0.7, -0.045), ringAt(0, 0.9, -0.03));
      rings.push(ringAt(1, 0.9, 0.03), ringAt(1, 0.7, 0.045));
      return loft(rings, true, true);
    }

    // Habitacle vitré (arc ouvert de droite à gauche), ou bande de pavillon peinte.
    function cabinGeometry(key, psi0, lift, range) {
      var f = shapeOf(key), st = f.st, M = SEG.cabinRing, S = SEG.cabinStations;
      var u0 = (range || f.cabinRange)[0], u1 = (range || f.cabinRange)[1], rings = [];
      for (var i = 0; i < S; i++) {
        var u = lerp(u0, u1, i / (S - 1));
        var yb = f.top(u) - 0.025, yr = Math.max(yb, f.roof(u));
        var wb = f.halfWidthAt(u, yb) * 0.985, wt = wb * st.glassTop;
        var ring = [];
        for (var j = 0; j < M; j++) {
          var psi = lerp(psi0, Math.PI - psi0, j / (M - 1));
          var c = Math.cos(psi), s = Math.sin(psi), e = 2 / st.nCabin;
          var sy = Math.pow(Math.abs(s), e), sz = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), e);
          var y = yb + (yr - yb) * sy, w = lerp(wb, wt, sy);
          ring.push([f.x(u), y + lift, w * sz * (1 + lift)]);
        }
        rings.push(ring);
      }
      return loft(rings, false, false);
    }

    // Tube de même topologie pour toutes les silhouettes (nécessaire au morphing).
    function tubeGeometry(points, radius, segments, radial) {
      var path = new THREE.CatmullRomCurve3(points.map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }));
      return new THREE.TubeGeometry(path, segments, radius, radial || 6, false);
    }

    function sideLine(key, side, u0, u1, yFn, out, count) {
      var f = shapeOf(key), pts = [];
      for (var i = 0; i < count; i++) {
        var u = lerp(u0, u1, i / (count - 1)), y = yFn(u);
        pts.push([f.x(u), y, side * (f.halfWidthAt(u, y) + out)]);
      }
      return pts;
    }

    // Filet chromé à la base des vitres, des deux côtés.
    function dloGeometry(key) {
      var f = shapeOf(key), u0 = f.cabinRange[0] + 0.035, u1 = f.cabinRange[1] - 0.035;
      var geos = [1, -1].map(function (side) {
        return tubeGeometry(sideLine(key, side, u0, u1, function (u) { return f.top(u) - 0.018; }, 0.006, 24), 0.011, 64, 5);
      });
      return mergeGeometries(geos);
    }

    // Jonc chromé de bas de caisse, entre les roues.
    function sillGeometry(key) {
      var f = shapeOf(key), st = f.st, span = f.arch / st.L;
      var u0 = st.axles[0] + span + 0.01, u1 = st.axles[1] - span - 0.01;
      var geos = [1, -1].map(function (side) {
        return tubeGeometry(sideLine(key, side, u0, u1, function (u) { return f.bottom(u) + 0.1; }, 0.004, 12), 0.009, 40, 5);
      });
      return mergeGeometries(geos);
    }

    // Phares : bandeau lumineux qui épouse les angles avant.
    function headlightGeometry(key) {
      var f = shapeOf(key), st = f.st;
      var geos = [1, -1].map(function (side) {
        var pts = [];
        for (var i = 0; i < 14; i++) {
          var u = lerp(0.915, 0.988, i / 13), y = f.top(u) - 0.085;
          pts.push([f.x(u) + 0.006, y, side * (f.halfWidthAt(u, y) + 0.008)]);
        }
        return tubeGeometry(pts, 0.024, 40, 6);
      });
      return mergeGeometries(geos);
    }

    // Feux arrière : un bandeau continu d'un côté à l'autre.
    function taillightGeometry(key) {
      var f = shapeOf(key), pts = [], i, yr = f.top(0.012) - 0.1;
      for (i = 0; i < 8; i++) { var u = lerp(0.07, 0.012, i / 7), y = lerp(f.top(u) - 0.1, yr, i / 7); pts.push([f.x(u) - 0.004, y, f.halfWidthAt(u, y) + 0.008]); }
      var wEnd = f.halfWidthAt(0.012, yr);
      for (i = 1; i < 9; i++) pts.push([f.x(0) - 0.05, yr, lerp(wEnd * 0.7, -wEnd * 0.7, i / 9)]);
      for (i = 0; i < 8; i++) { var u2 = lerp(0.012, 0.07, i / 7), y2 = lerp(yr, f.top(u2) - 0.1, i / 7); pts.push([f.x(u2) - 0.004, y2, -(f.halfWidthAt(u2, y2) + 0.008)]); }
      return tubeGeometry(pts, 0.018, 96, 6);
    }

    function mergeGeometries(geos) {
      var pos = [], nor = [], idx = [], offset = 0;
      geos.forEach(function (g) {
        var p = g.attributes.position.array, n = g.attributes.normal.array;
        for (var i = 0; i < p.length; i++) { pos.push(p[i]); nor.push(n[i]); }
        var gi = g.index ? g.index.array : null;
        if (gi) for (var k = 0; k < gi.length; k++) idx.push(gi[k] + offset);
        else for (var q = 0; q < p.length / 3; q++) idx.push(q + offset);
        offset += p.length / 3;
      });
      var out = new THREE.BufferGeometry();
      out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      out.setIndex(idx);
      return out;
    }

    // Assemble les variantes d'une pièce en une géométrie à cibles de morphing.
    function morphable(keys, build) {
      var geos = keys.map(build);
      var base = geos[0];
      if (keys.length > 1) {
        base.morphAttributes.position = geos.slice(1).map(function (g) { return g.attributes.position; });
        base.morphAttributes.normal = geos.slice(1).map(function (g) { return g.attributes.normal; });
      }
      return base;
    }

    // Roue : pneu, jante à rayons, disque, étrier doré, cache-moyeu doré.
    var WHEEL = null;
    function wheelParts(materials) {
      if (!WHEEL) {
        var prof = [[0.6, -0.5], [0.9, -0.5], [0.97, -0.44], [1.0, -0.3], [1.0, 0.3], [0.97, 0.44], [0.9, 0.5], [0.6, 0.5]]
          .map(function (p) { return new THREE.Vector2(p[0], p[1]); });
        var tire = new THREE.LatheGeometry(prof, 40);
        tire.rotateX(Math.PI / 2);
        var face = new THREE.Shape();
        face.absarc(0, 0, 0.64, 0, TAU, false);
        var spokes = 10;
        for (var k = 0; k < spokes; k++) {
          var a0 = TAU * k / spokes + 0.085, a1 = TAU * (k + 1) / spokes - 0.085;
          var hole = new THREE.Path();
          hole.absarc(0, 0, 0.6, a0, a1, false);
          hole.absarc(0, 0, 0.26, a1 - 0.12, a0 + 0.12, true);
          hole.closePath();
          face.holes.push(hole);
        }
        var rim = new THREE.ExtrudeGeometry(face, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2, curveSegments: 18 });
        rim.translate(0, 0, 0.36);
        var barrel = new THREE.CylinderGeometry(0.62, 0.62, 0.8, 32, 1, true);
        barrel.rotateX(Math.PI / 2);
        var disc = new THREE.CylinderGeometry(0.46, 0.46, 0.06, 32);
        disc.rotateX(Math.PI / 2);
        disc.translate(0, 0, 0.12);
        var caliper = new THREE.BoxGeometry(0.2, 0.36, 0.12);
        caliper.translate(-0.3, 0.26, 0.2);
        var cap = new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24);
        cap.rotateX(Math.PI / 2);
        cap.translate(0, 0, 0.45);
        WHEEL = { tire: tire, rim: rim, barrel: barrel, disc: disc, caliper: caliper, cap: cap };
      }
      return [
        [WHEEL.tire, materials.rubber], [WHEEL.rim, materials.rim], [WHEEL.barrel, materials.trim],
        [WHEEL.disc, materials.disc], [WHEEL.caliper, materials.gold], [WHEEL.cap, materials.gold],
      ];
    }

    // Placement des pièces simples (roues, rétroviseurs, calandre…) pour chaque silhouette.
    function placements(key) {
      var f = shapeOf(key), st = f.st, out = {};
      var wheelZ = function (u) { return f.width(u) * 0.97 - st.tire * 0.5; };
      out.wheels = st.axles.map(function (u) {
        return { x: f.x(u), y: st.R, z: wheelZ(u), r: st.R, w: st.tire };
      });
      // Passages de roue sombres (cylindres) et soubassement.
      out.houses = st.axles.map(function (u) {
        return { x: f.x(u), y: st.R, r: f.arch, len: 2 * (wheelZ(u) - st.tire * 0.5) };
      });
      var baseY = f.bottom(0.5);
      out.chassis = { x: 0, y: baseY + 0.13, l: st.L * 0.86, h: 0.26, w: 2 * (f.width(0.5) - st.tire - 0.06) };
      // Rétroviseurs, posés juste avant le pied de pare-brise.
      var um = f.cabinRange[1] - 0.075, ym = f.top(um) + 0.1;
      out.mirror = { x: f.x(um), y: ym, z: f.halfWidthAt(um, f.top(um) - 0.03) + 0.05 };
      // Calandre.
      var g = st.grille, yg = (g.y0 + g.y1) / 2;
      out.grille = { x: f.x(1) + 0.038, y: yg, w: g.w * 2, h: g.y1 - g.y0 };
      // Poignées de porte.
      out.handles = [0.43, 0.6].map(function (k) {
        var u = lerp(f.cabinRange[0], f.cabinRange[1], k), y = f.top(u) - 0.16;
        return { x: f.x(u), y: y, z: f.halfWidthAt(u, y) + 0.006 };
      });
      // Halos des phares et des feux.
      var uh = 0.97, yh = f.top(uh) - 0.085, yt = f.top(0.012) - 0.1;
      out.headGlow = { x: f.x(uh) + 0.08, y: yh, z: f.halfWidthAt(uh, yh) * 0.9 };
      out.tailGlow = { x: f.x(0) - 0.09, y: yt, z: f.halfWidthAt(0.012, yt) * 0.75 };
      // Ombre portée.
      out.shadow = { l: st.L * 1.35, w: f.width(0.5) * 2 * 1.65 };
      // Sorties d'échappement.
      out.exhaust = { x: f.x(0) - 0.05, y: f.bottom(0.02) + 0.07, z: f.width(0.03) * 0.55 };
      return out;
    }

    // Peintures proposées (couleur, métallisation, rugosité).
    var PAINTS = {
      obsidian: { hex: "#0e0f12", metal: 0.7, rough: 0.3 },
      silver: { hex: "#b9bdc3", metal: 0.85, rough: 0.28 },
      champagne: { hex: "#c7ae84", metal: 0.85, rough: 0.3 },
      midnight: { hex: "#16223d", metal: 0.75, rough: 0.3 },
      pearl: { hex: "#ebe8e2", metal: 0.25, rough: 0.25 },
    };

    function Car(keys, options) {
      options = options || {};
      var self = this;
      this.keys = keys;
      this.paint = new THREE.MeshPhysicalMaterial({ color: 0x0e0f12, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.25 });
      this.materials = {
        paint: this.paint,
        glass: new THREE.MeshPhysicalMaterial({ color: 0x0c1016, metalness: 0.15, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2 }),
        chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.1, envMapIntensity: 1.5 }),
        rubber: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0, roughness: 0.85 }),
        rim: new THREE.MeshStandardMaterial({ color: 0xd2d5da, metalness: 1, roughness: 0.16, envMapIntensity: 1.4 }),
        disc: new THREE.MeshStandardMaterial({ color: 0x3a3b3f, metalness: 0.9, roughness: 0.45 }),
        trim: new THREE.MeshStandardMaterial({ color: 0x050506, metalness: 0.3, roughness: 0.6 }),
        dark: new THREE.MeshBasicMaterial({ color: 0x020203 }),
        gold: new THREE.MeshStandardMaterial({ color: 0xc8a96b, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.2 }),
        head: new THREE.MeshBasicMaterial({ color: 0x2a2c30 }),
        tail: new THREE.MeshBasicMaterial({ color: 0x3a0a0a }),
      };
      this.geo = {
        body: morphable(keys, bodyGeometry),
        glass: morphable(keys, function (k) { return cabinGeometry(k, 0, 0); }),
        roof: morphable(keys, function (k) { return cabinGeometry(k, 0.5, 0.004, STYLES[k].roofRange); }),
        dlo: morphable(keys, dloGeometry),
        sill: morphable(keys, sillGeometry),
        head: morphable(keys, headlightGeometry),
        tail: morphable(keys, taillightGeometry),
      };
      this.place = keys.map(placements);
      this.instances = [];
      this.from = 0; this.to = 0; this.t = 1;
      this.lightsLevel = options.lightsOn ? 1 : 0;
      this.lightsTarget = this.lightsLevel;
      this.spin = 0;
      this.paintFrom = new THREE.Color(0x0e0f12); this.paintTo = new THREE.Color(0x0e0f12); this.paintT = 1;
      this.metal = [0.7, 0.7]; this.rough = [0.3, 0.3];
      this.glowMatHead = new THREE.SpriteMaterial({ map: TEX.glow, color: 0xfff3dc, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      this.glowMatTail = new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff2a22, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      this.applyLights();
      void self;
    }

    // Une « instance » est un groupe 3D qui partage géométries et matières (voiture et son reflet).
    Car.prototype.instance = function (mirror) {
      var m = this.materials, g = this.geo, group = new THREE.Group(), meshes = [];
      function add(geo, mat) { var mesh = new THREE.Mesh(geo, mat); group.add(mesh); meshes.push(mesh); return mesh; }
      add(g.body, m.paint);
      add(g.glass, m.glass);
      add(g.roof, m.paint);
      add(g.dlo, m.chrome);
      add(g.sill, m.chrome);
      add(g.head, m.head);
      add(g.tail, m.tail);
      var parts = { wheels: [], houses: [], mirrors: [], handles: [], glows: [], exhaust: [] };
      var wheelSet = wheelParts(m);
      for (var i = 0; i < 4; i++) {
        var wg = new THREE.Group(), spinner = new THREE.Group();
        wheelSet.forEach(function (pm) {
          var mesh = new THREE.Mesh(pm[0], pm[1]);
          if (pm[0] === WHEEL.caliper) wg.add(mesh); else spinner.add(mesh);
        });
        wg.add(spinner);
        wg.userData.spinner = spinner;
        if (i % 2 === 1) wg.rotation.y = Math.PI;
        group.add(wg);
        parts.wheels.push(wg);
      }
      var houseGeo = new THREE.CylinderGeometry(1, 1, 1, 28);
      houseGeo.rotateX(Math.PI / 2);
      for (i = 0; i < 2; i++) { var h = new THREE.Mesh(houseGeo, m.dark); group.add(h); parts.houses.push(h); }
      parts.chassis = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m.dark);
      group.add(parts.chassis);
      var mirrorGeo = new THREE.SphereGeometry(1, 16, 10);
      for (i = 0; i < 2; i++) { var mr = new THREE.Mesh(mirrorGeo, m.paint); group.add(mr); parts.mirrors.push(mr); }
      var grilleShape = new THREE.Shape();
      (function (s) { var w = 1, h = 1, r = 0.18; s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); })(grilleShape);
      var grilleGeo = new THREE.ExtrudeGeometry(grilleShape, { depth: 0.02, bevelEnabled: false, curveSegments: 6 });
      grilleGeo.rotateY(Math.PI / 2);
      parts.grille = new THREE.Mesh(grilleGeo, m.trim);
      group.add(parts.grille);
      parts.grilleFrame = new THREE.LineSegments(new THREE.EdgesGeometry(grilleGeo, 30), new THREE.LineBasicMaterial({ color: 0xd8d8d8 }));
      group.add(parts.grilleFrame);
      var slatGeo = new THREE.BoxGeometry(0.012, 0.012, 1);
      parts.slats = [];
      for (i = 0; i < 3; i++) { var sl = new THREE.Mesh(slatGeo, m.chrome); group.add(sl); parts.slats.push(sl); }
      var handleGeo = new THREE.SphereGeometry(1, 10, 6);
      for (i = 0; i < 4; i++) { var hd = new THREE.Mesh(handleGeo, m.chrome); group.add(hd); parts.handles.push(hd); }
      var exGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.08, 16, 1, true);
      exGeo.rotateZ(Math.PI / 2);
      for (i = 0; i < 2; i++) { var ex = new THREE.Mesh(exGeo, m.chrome); group.add(ex); parts.exhaust.push(ex); }
      if (!mirror) {
        for (i = 0; i < 4; i++) {
          var sp = new THREE.Sprite(i < 2 ? this.glowMatHead : this.glowMatTail);
          sp.renderOrder = 3;
          group.add(sp);
          parts.glows.push(sp);
        }
      }
      var inst = { group: group, meshes: meshes, parts: parts };
      this.instances.push(inst);
      this.layout(inst);
      return group;
    };

    // Positionne les pièces simples selon l'avancement du morphing.
    Car.prototype.layout = function (inst) {
      var A = this.place[this.from], B = this.place[this.to], t = easeInOut(this.t), P = inst.parts;
      function L(fn) { return lerp(fn(A), fn(B), t); }
      for (var i = 0; i < 4; i++) {
        var axle = i < 2 ? 0 : 1, side = i % 2 === 0 ? 1 : -1, w = P.wheels[i];
        var r = L(function (p) { return p.wheels[axle].r; });
        w.position.set(L(function (p) { return p.wheels[axle].x; }), r, side * L(function (p) { return p.wheels[axle].z; }));
        w.scale.set(r, r, L(function (p) { return p.wheels[axle].w; }));
        w.userData.spinner.rotation.z = side * -this.spin;
      }
      for (i = 0; i < 2; i++) {
        var h = P.houses[i];
        h.position.set(L(function (p) { return p.houses[i].x; }), L(function (p) { return p.houses[i].y; }), 0);
        var hr = L(function (p) { return p.houses[i].r; });
        h.scale.set(hr, hr, L(function (p) { return p.houses[i].len; }));
      }
      P.chassis.position.set(0, L(function (p) { return p.chassis.y; }), 0);
      P.chassis.scale.set(L(function (p) { return p.chassis.l; }), L(function (p) { return p.chassis.h; }), L(function (p) { return p.chassis.w; }));
      for (i = 0; i < 2; i++) {
        var s = i === 0 ? 1 : -1, mr = P.mirrors[i];
        mr.position.set(L(function (p) { return p.mirror.x; }), L(function (p) { return p.mirror.y; }), s * L(function (p) { return p.mirror.z; }));
        mr.scale.set(0.11, 0.065, 0.1);
      }
      var gx = L(function (p) { return p.grille.x; }), gy = L(function (p) { return p.grille.y; });
      var gw = L(function (p) { return p.grille.w; }), gh = L(function (p) { return p.grille.h; });
      [P.grille, P.grilleFrame].forEach(function (o) { o.position.set(gx, gy, 0); o.scale.set(1, gh, gw); });
      P.slats.forEach(function (sl, k) { sl.position.set(gx + 0.022, gy + gh * (k - 1) * 0.28, 0); sl.scale.set(1, 1, gw * 0.9); });
      for (i = 0; i < 4; i++) {
        var hi = i % 2, hs = i < 2 ? 1 : -1, hd = P.handles[i];
        hd.position.set(L(function (p) { return p.handles[hi].x; }), L(function (p) { return p.handles[hi].y; }), hs * L(function (p) { return p.handles[hi].z; }));
        hd.scale.set(0.08, 0.016, 0.018);
      }
      for (i = 0; i < 2; i++) {
        P.exhaust[i].position.set(L(function (p) { return p.exhaust.x; }), L(function (p) { return p.exhaust.y; }), (i ? -1 : 1) * L(function (p) { return p.exhaust.z; }));
      }
      if (P.glows.length) {
        var hx = L(function (p) { return p.headGlow.x; }), hy = L(function (p) { return p.headGlow.y; }), hz = L(function (p) { return p.headGlow.z; });
        var tx = L(function (p) { return p.tailGlow.x; }), ty = L(function (p) { return p.tailGlow.y; }), tz = L(function (p) { return p.tailGlow.z; });
        P.glows[0].position.set(hx, hy, hz); P.glows[1].position.set(hx, hy, -hz);
        P.glows[2].position.set(tx, ty, tz); P.glows[3].position.set(tx, ty, -tz);
        P.glows[0].scale.setScalar(0.9); P.glows[1].scale.setScalar(0.9);
        P.glows[2].scale.setScalar(0.55); P.glows[3].scale.setScalar(0.55);
      }
      // Cibles de morphing des maillages principaux.
      var n = this.keys.length - 1;
      if (n > 0) {
        var infl = [];
        for (var k = 0; k < n; k++) infl[k] = 0;
        if (this.from > 0) infl[this.from - 1] += 1 - t;
        if (this.to > 0) infl[this.to - 1] += t;
        inst.meshes.forEach(function (mesh) {
          if (!mesh.morphTargetInfluences) return;
          for (var q = 0; q < n; q++) mesh.morphTargetInfluences[q] = infl[q];
        });
      }
    };

    Car.prototype.setStyle = function (key, instant) {
      var idx = this.keys.indexOf(key);
      if (idx < 0 || (idx === this.to && this.t >= 1)) return;
      if (this.t < 1) { this.from = this.to; }
      else this.from = this.to;
      this.to = idx;
      this.t = instant || REDUCE ? 1 : 0;
      if (this.t >= 1) this.from = this.to;
    };

    Car.prototype.setPaint = function (id, instant) {
      var p = PAINTS[id];
      if (!p) return;
      this.paintFrom.copy(this.paint.color);
      this.paintTo.set(p.hex);
      this.metal = [this.paint.metalness, p.metal];
      this.rough = [this.paint.roughness, p.rough];
      this.paintT = instant || REDUCE ? 1 : 0;
      if (this.paintT >= 1) this.applyPaint(1);
    };
    Car.prototype.applyPaint = function (t) {
      var e = easeInOut(t);
      this.paint.color.copy(this.paintFrom).lerp(this.paintTo, e);
      this.paint.metalness = lerp(this.metal[0], this.metal[1], e);
      this.paint.roughness = lerp(this.rough[0], this.rough[1], e);
    };

    Car.prototype.applyLights = function () {
      var k = this.lightsLevel;
      this.materials.head.color.setRGB(lerp(0.16, 1.6, k), lerp(0.17, 1.55, k), lerp(0.19, 1.45, k));
      this.materials.tail.color.setRGB(lerp(0.23, 1.6, k), lerp(0.04, 0.08, k), lerp(0.04, 0.06, k));
      this.glowMatHead.opacity = 0.75 * k;
      this.glowMatTail.opacity = 0.6 * k;
    };

    Car.prototype.update = function (dt) {
      var changed = false;
      if (this.t < 1) { this.t = Math.min(1, this.t + dt / 1.1); changed = true; if (this.t >= 1) this.from = this.to; }
      if (this.paintT < 1) { this.paintT = Math.min(1, this.paintT + dt / 0.8); this.applyPaint(this.paintT); }
      if (this.lightsLevel !== this.lightsTarget) {
        this.lightsLevel = this.lightsTarget > this.lightsLevel ? Math.min(this.lightsTarget, this.lightsLevel + dt * 1.6) : Math.max(this.lightsTarget, this.lightsLevel - dt * 2);
        this.applyLights();
      }
      var self = this;
      this.instances.forEach(function (inst) { self.layout(inst); });
      return changed;
    };

    Car.prototype.currentKey = function () { return this.keys[this.to]; };

    // ============================================================
    // Arc de Triomphe en traits dorés (mètres réels, mis à l'échelle ensuite)
    // ============================================================
    function arcLines() {
      var seg = [];
      function line(a, b) { seg.push(a[0], a[1], a[2], b[0], b[1], b[2]); }
      function poly(pts, close) { for (var i = 0; i < pts.length - 1; i++) line(pts[i], pts[i + 1]); if (close) line(pts[pts.length - 1], pts[0]); }
      function rectXY(x0, y0, x1, y1, z) { poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], true); }
      function rectZY(z0, y0, z1, y1, x) { poly([[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], true); }
      function box(x0, y0, z0, x1, y1, z1) {
        rectXY(x0, y0, x1, y1, z0); rectXY(x0, y0, x1, y1, z1);
        line([x0, y0, z0], [x0, y0, z1]); line([x1, y0, z0], [x1, y0, z1]);
        line([x0, y1, z0], [x0, y1, z1]); line([x1, y1, z0], [x1, y1, z1]);
      }
      function archXY(cx, cy, r, z, n) { var pts = []; for (var i = 0; i <= n; i++) { var a = Math.PI * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]); } return pts; }
      function archZY(cz, cy, r, x, n) { var pts = []; for (var i = 0; i <= n; i++) { var a = Math.PI * i / n; pts.push([x, cy + r * Math.sin(a), cz + r * Math.cos(a)]); } return pts; }
      var W = 22.5, D = 11, H = 36;
      // Corps principal.
      box(-W, 0, -D, W, H, D);
      // Grande arche (façades avant et arrière) et son tunnel.
      [D, -D].forEach(function (z) {
        poly([[-7.31, 0, z], [-7.31, 21.88, z]]); poly([[7.31, 0, z], [7.31, 21.88, z]]);
        poly(archXY(0, 21.88, 7.31, z, 28));
        poly(archXY(0, 21.88, 8.7, z, 28));
        line([-W, 21.88, z], [-8.7, 21.88, z]); line([8.7, 21.88, z], [W, 21.88, z]);
        line([-W, 20.9, z], [-7.31, 20.9, z]); line([7.31, 20.9, z], [W, 20.9, z]);
        // Bas-reliefs du haut et groupes sculptés du bas.
        rectXY(-20, 24.5, -10.5, 33, z); rectXY(10.5, 24.5, 20, 33, z);
        [-15.25, 15.25].forEach(function (cx) {
          poly([[cx - 4.6, 3, z], [cx - 4.6, 13, z]]); poly([[cx + 4.6, 3, z], [cx + 4.6, 13, z]]);
          poly(archXY(cx, 13, 4.6, z, 16));
          rectXY(cx - 5.4, 0, cx + 5.4, 3, z);
        });
      });
      line([-7.31, 21.88, D], [-7.31, 21.88, -D]); line([7.31, 21.88, D], [7.31, 21.88, -D]);
      line([0, 29.19, D], [0, 29.19, -D]);
      // Arches latérales.
      [W, -W].forEach(function (x) {
        poly([[x, 0, -4.22], [x, 14.46, -4.22]]); poly([[x, 0, 4.22], [x, 14.46, 4.22]]);
        poly(archZY(0, 14.46, 4.22, x, 18));
        poly(archZY(0, 14.46, 5.2, x, 18));
        rectZY(-9.5, 20.5, -5.6, 31, x); rectZY(5.6, 20.5, 9.5, 31, x);
      });
      line([-W, 18.68, 0], [W, 18.68, 0]);
      // Corniche, frise, attique.
      box(-W - 0.8, H, -D - 0.8, W + 0.8, H + 2, D + 0.8);
      box(-W, H + 2, -D, W, H + 5.5, D);
      box(-W - 0.7, H + 5.5, -D - 0.7, W + 0.7, H + 7, D + 0.7);
      box(-W + 0.6, H + 7, -D + 0.6, W - 0.6, H + 13.5, D - 0.6);
      box(-W + 0.2, H + 13.5, -D + 0.2, W - 0.2, H + 14, D - 0.2);
      // Boucliers de l'attique.
      for (var i = 0; i < 11; i++) {
        var x = -19 + i * 3.8;
        [D - 0.6, -D + 0.6].forEach(function (z) { rectXY(x - 1.1, H + 8.6, x + 1.1, H + 11.8, z); });
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(seg, 3));
      return g;
    }

    // Poussière dorée qui flotte lentement.
    function Dust(count, box) {
      var pos = new Float32Array(count * 3), spd = new Float32Array(count);
      for (var i = 0; i < count; i++) {
        pos[i * 3] = lerp(box[0], box[3], Math.random());
        pos[i * 3 + 1] = lerp(box[1], box[4], Math.random());
        pos[i * 3 + 2] = lerp(box[2], box[5], Math.random());
        spd[i] = 0.05 + Math.random() * 0.12;
      }
      var g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.points = new THREE.Points(g, new THREE.PointsMaterial({
        map: TEX.dust, color: 0xe8cf98, size: 0.07, sizeAttenuation: true, transparent: true,
        opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      this.points.renderOrder = 3;
      this.update = function (dt, time) {
        for (var i = 0; i < count; i++) {
          pos[i * 3 + 1] += spd[i] * dt;
          pos[i * 3] += Math.sin(time * 0.3 + i) * 0.002;
          if (pos[i * 3 + 1] > box[4]) pos[i * 3 + 1] = box[1];
        }
        g.attributes.position.needsUpdate = true;
      };
    }

    // Sol sombre et brillant : un plan qui laisse deviner le reflet de la voiture.
    function makeFloor(size, color) {
      var mat = new THREE.MeshBasicMaterial({ color: color || 0x0a0a0c, transparent: true, opacity: 0.9, alphaMap: TEX.floor, depthWrite: false });
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
      floor.rotation.x = -Math.PI / 2;
      floor.renderOrder = 1;
      return floor;
    }
    function makeShadow() {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TEX.shadow, transparent: true, depthWrite: false, opacity: 0.9 }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.004;
      m.renderOrder = 2;
      return m;
    }

    // ============================================================
    // Jet privé
    // ============================================================
    function buildJet() {
      var white = new THREE.MeshPhysicalMaterial({ color: 0xf3f0ea, metalness: 0.15, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2 });
      var gold = new THREE.MeshStandardMaterial({ color: 0xc8a96b, metalness: 0.95, roughness: 0.28 });
      var glass = new THREE.MeshPhysicalMaterial({ color: 0x06070a, metalness: 0.2, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.6 });
      var metal = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 1, roughness: 0.25 });
      var dark = new THREE.MeshBasicMaterial({ color: 0x050506, side: THREE.DoubleSide });
      var jet = new THREE.Group();

      // Fuselage : profil de révolution, queue relevée.
      var rad = curve([[-12.6, 0.12], [-11.6, 0.55], [-10, 0.95], [-8, 1.22], [-6, 1.3], [7.5, 1.3], [9.6, 1.18], [10.9, 0.9], [11.9, 0.5], [12.5, 0.12], [12.62, 0.0]]);
      var prof = [];
      for (var i = 0; i <= 64; i++) { var x = lerp(-12.6, 12.62, i / 64); prof.push(new THREE.Vector2(Math.max(0.001, rad(x)), x)); }
      var fus = new THREE.LatheGeometry(prof, 48);
      fus.rotateZ(-Math.PI / 2);
      var p = fus.attributes.position;
      for (i = 0; i < p.count; i++) {
        var px = p.getX(i);
        if (px < -6) p.setY(i, p.getY(i) + Math.pow((-6 - px) / 6.6, 1.6) * 0.9);
      }
      fus.computeVertexNormals();
      jet.add(new THREE.Mesh(fus, white));

      // Points de la surface du fuselage (angle mesuré depuis le dessus).
      function surf(x, a, off) {
        var r = rad(x) + (off || 0.012), y = r * Math.cos(a), z = r * Math.sin(a);
        if (x < -6) y += Math.pow((-6 - x) / 6.6, 1.6) * 0.9;
        return new THREE.Vector3(x, y, z);
      }
      function patch(x0, x1, a0, a1, nx, na, mat, off) {
        var pos = [], idx = [];
        for (var ix = 0; ix <= nx; ix++) for (var ia = 0; ia <= na; ia++) {
          var v = surf(lerp(x0, x1, ix / nx), lerp(a0, a1, ia / na), off); pos.push(v.x, v.y, v.z);
        }
        for (ix = 0; ix < nx; ix++) for (ia = 0; ia < na; ia++) {
          var a = ix * (na + 1) + ia, b = a + 1, c = a + na + 1, d = c + 1;
          idx.push(a, c, b, b, c, d);
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx); g.computeVertexNormals();
        var m = new THREE.Mesh(g, mat);
        m.material.side = THREE.DoubleSide;
        return m;
      }
      // Pare-brise et liseré doré.
      jet.add(patch(9.7, 11.05, -1.05, 1.05, 10, 16, glass, 0.01));
      jet.add(patch(-9.5, 10.6, 1.62, 1.7, 40, 2, gold, 0.008));
      jet.add(patch(-9.5, 10.6, -1.7, -1.62, 40, 2, gold, 0.008));
      // Hublots ovales.
      var winGeo = new THREE.CircleGeometry(0.2, 18);
      winGeo.scale(1.3, 1, 1);
      [1, -1].forEach(function (side) {
        for (var k = 0; k < 8; k++) {
          var x = 6.4 - k * 1.25, a = side * 1.32, pos = surf(x, a, 0.014);
          var normal = new THREE.Vector3(0, Math.cos(a), Math.sin(a)).normalize();
          var xAxis = new THREE.Vector3(1, 0, 0), yAxis = new THREE.Vector3().crossVectors(normal, xAxis);
          var m = new THREE.Mesh(winGeo, glass);
          m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, normal));
          m.position.copy(pos);
          jet.add(m);
        }
      });

      // Ailes basses en flèche, avec winglets.
      function planform(rootLE, rootTE, span, sweep, tipChord) {
        var s = new THREE.Shape(), tipLE = rootLE - span * Math.tan(sweep);
        s.moveTo(rootLE, 0); s.lineTo(tipLE, span); s.lineTo(tipLE - tipChord, span); s.lineTo(rootTE, 0); s.closePath();
        return s;
      }
      function wingMesh(shape, thick, mat, side) {
        var g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.4, bevelSize: thick * 0.35, bevelSegments: 2, curveSegments: 4 });
        g.translate(0, 0, -thick / 2);
        g.rotateX(Math.PI / 2);
        if (side < 0) { g.scale(1, 1, -1); flipWinding(g); }
        g.computeVertexNormals();
        return new THREE.Mesh(g, mat);
      }
      function flipWinding(g) {
        var ix = g.index;
        if (ix) { var a = ix.array; for (var q = 0; q < a.length; q += 3) { var tmp = a[q + 1]; a[q + 1] = a[q + 2]; a[q + 2] = tmp; } ix.needsUpdate = true; }
        else {
          var pa = g.attributes.position;
          for (var r = 0; r < pa.count; r += 3) {
            var x1 = pa.getX(r + 1), y1 = pa.getY(r + 1), z1 = pa.getZ(r + 1);
            pa.setXYZ(r + 1, pa.getX(r + 2), pa.getY(r + 2), pa.getZ(r + 2));
            pa.setXYZ(r + 2, x1, y1, z1);
          }
        }
      }
      function verticalMesh(shape, thick, mat) {
        var g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.35, bevelSize: thick * 0.3, bevelSegments: 2, curveSegments: 4 });
        g.translate(0, 0, -thick / 2);
        return new THREE.Mesh(g, mat);
      }
      var tipLE = 2.2 - 9.6 * Math.tan(0.52);
      [1, -1].forEach(function (side) {
        var w = wingMesh(planform(2.2, -2.8, 9.6, 0.52, 1.5), 0.24, white, side);
        w.position.set(0.4, -0.72, side * 0.9);
        w.rotation.x = side * -0.07;
        jet.add(w);
        var wlShape = new THREE.Shape();
        wlShape.moveTo(0, 0); wlShape.lineTo(-0.9, 1.5); wlShape.lineTo(-1.45, 1.5); wlShape.lineTo(-1.45, 0); wlShape.closePath();
        var wl = verticalMesh(wlShape, 0.08, white);
        wl.position.set(tipLE - 0.05, 0, side * 9.55);
        wl.rotation.x = side * 0.22;
        w.add(wl);
        var h = wingMesh(planform(-11.15, -12.85, 3.6, 0.55, 0.85), 0.12, white, side);
        h.position.set(0, 5.18, side * 0.08);
        jet.add(h);
      });
      // Dérive.
      var fin = new THREE.Shape();
      fin.moveTo(-8.6, 0); fin.lineTo(-11.4, 4.2); fin.lineTo(-12.9, 4.2); fin.lineTo(-12.2, 0); fin.closePath();
      var finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 });
      finGeo.translate(0, 0, -0.1);
      var finMesh = new THREE.Mesh(finGeo, white);
      finMesh.position.y = 0.95;
      jet.add(finMesh);
      // Réacteurs arrière.
      var nac = [];
      var nacProf = curve([[0, 0.5], [0.25, 0.6], [1.6, 0.66], [3.2, 0.56], [3.7, 0.42]]);
      for (i = 0; i <= 20; i++) { var t = lerp(0, 3.7, i / 20); nac.push(new THREE.Vector2(nacProf(t), t)); }
      var nacGeo = new THREE.LatheGeometry(nac, 32);
      nacGeo.rotateZ(Math.PI / 2);
      var lip = new THREE.TorusGeometry(0.52, 0.06, 10, 32);
      lip.rotateY(Math.PI / 2);
      var intake = new THREE.CircleGeometry(0.5, 32);
      intake.rotateY(Math.PI / 2);
      [1, -1].forEach(function (side) {
        var n = new THREE.Group();
        n.add(new THREE.Mesh(nacGeo, white));
        var l = new THREE.Mesh(lip, metal); n.add(l);
        var it = new THREE.Mesh(intake, dark); it.position.x = -0.05; n.add(it);
        var ex = new THREE.Mesh(intake, dark); ex.position.x = -3.72; ex.scale.setScalar(0.8); n.add(ex);
        n.position.set(-5.2, 0.85, side * 2.05);
        jet.add(n);
        var py = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 0.9), white);
        py.position.set(-6.8, 0.8, side * 1.35);
        jet.add(py);
      });
      jet.scale.setScalar(0.26);
      return jet;
    }

    // ============================================================
    // Scènes
    // ============================================================
    var stages = [];

    function Stage(canvas, opts) {
      this.canvas = canvas;
      this.opts = opts || {};
      this.visible = false;
      this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = this.opts.exposure || 1;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x000000, 0);
      this.scene = new THREE.Scene();
      var pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(new lib.RoomEnvironment(), 0.04).texture;
      this.scene.environmentIntensity = this.opts.env || 1;
      pmrem.dispose();
      this.camera = new THREE.PerspectiveCamera(this.opts.fov || 30, 1, 0.1, 200);
      this.size = [0, 0];
      var self = this;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; }, { rootMargin: "120px 0px" }).observe(canvas);
      } else this.visible = true;
      stages.push(this);
    }
    Stage.prototype.resize = function () {
      var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
      if (!w || !h || (w === this.size[0] && h === this.size[1])) return false;
      this.size = [w, h];
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      if (this.onResize) this.onResize(w, h);
      this.camera.updateProjectionMatrix();
      return true;
    };
    // Progression d'un élément dans la fenêtre : 0 quand il entre en bas, 1 quand il sort en haut.
    function progressOf(el) {
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      return clamp((vh - r.top) / (r.height + vh), 0, 1);
    }

    function addLights(scene, key, rim) {
      var k = new THREE.DirectionalLight(0xffffff, key);
      k.position.set(4, 8, 6);
      scene.add(k);
      var r = new THREE.DirectionalLight(0xe8c27c, rim);
      r.position.set(-7, 3, -6);
      scene.add(r);
      var f = new THREE.DirectionalLight(0x8fa6ff, 0.35);
      f.position.set(-3, 2, 8);
      scene.add(f);
    }

    // ---------- Accueil : la voiture arrive devant l'Arc de Triomphe ----------
    function heroStage(canvas) {
      var st = new Stage(canvas, { fov: 30, env: 0.6, exposure: 1.05 });
      var scene = st.scene, cam = st.camera;
      scene.fog = new THREE.Fog(0x0a0a0c, 18, 52);
      addLights(scene, 1.3, 3.2);
      var car = new Car(["sedan"], { lightsOn: false });
      car.setPaint("obsidian", true);
      var rig = new THREE.Group(), body = car.instance(false), mirror = car.instance(true);
      mirror.scale.y = -1;
      rig.add(body); rig.add(mirror);
      var shadow = makeShadow();
      shadow.scale.set(car.place[0].shadow.l, car.place[0].shadow.w, 1);
      rig.add(shadow);
      scene.add(rig);
      scene.add(makeFloor(80));
      var arcGeo = arcLines(), arcCount = arcGeo.attributes.position.count;
      var arc = new THREE.LineSegments(arcGeo, new THREE.LineBasicMaterial({ color: 0xc8a96b, transparent: true, opacity: 0.55, fog: true }));
      arc.scale.setScalar(0.145);
      arc.renderOrder = 3;
      arc.position.set(-12.5, 0, -19);
      arc.rotation.y = 0.55;
      scene.add(arc);
      var dust = new Dust(MOBILE ? 140 : 320, [-14, 0, -18, 14, 7, 7]);
      scene.add(dust.points);
      var drive = REDUCE ? 1 : 0, started = REDUCE, since = 0, arcT = REDUCE ? 1 : 0;
      var mouse = { x: 0, y: 0, tx: 0, ty: 0 }, scroll = 0;
      arcGeo.setDrawRange(0, REDUCE ? arcCount : 0);
      car.lightsTarget = REDUCE ? 1 : 0;
      if (REDUCE) { car.lightsLevel = 1; car.applyLights(); }
      function start() { started = true; }
      document.addEventListener("ns:intro", start);
      setTimeout(start, 2600);
      window.addEventListener("pointermove", function (e) {
        mouse.tx = ((e.clientX / window.innerWidth) * 2 - 1) * (document.documentElement.dir === "rtl" ? -1 : 1); // la scène est reflétée en arabe
        mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
      }, { passive: true });
      // Cadrage : à droite du titre sur écran large ; en portrait, dans la bande libre au-dessus du texte.
      var inner = canvas.parentNode.querySelector(".hero-inner");
      var portraitQuery = window.matchMedia("(max-aspect-ratio: 1/1)");
      var fit = { k: 1, top: -1 };
      function frameHero() {
        var w = st.size[0], h = st.size[1];
        if (!w || !h) return;
        cam.clearViewOffset();
        if (!portraitQuery.matches) {
          fit.k = 1; fit.top = -1;
          cam.fov = 30;
          cam.setViewOffset(w, h, -w * 0.18, h * 0.02, w, h);
        } else {
          var header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 72;
          var visible = 6 + clamp((w - 420) / 350, 0, 1) * 1.6; // largeur visible en mètres : la voiture occupe ~85 % d'un téléphone
          fit.k = 1.15;
          fit.top = inner ? inner.offsetTop : h * 0.4;
          cam.fov = 2 * Math.atan(visible / 2 / (13.6 * fit.k * (w / h))) * 180 / Math.PI;
          cam.setViewOffset(w, h, 0, h / 2 - ((header + fit.top) / 2 - 8), w, h);
        }
        cam.updateProjectionMatrix();
      }
      st.onResize = frameHero;
      st.update = function (dt, time) {
        if (started && drive < 1) drive = Math.min(1, drive + dt / 2.8);
        if (started) arcT = Math.min(1, arcT + dt / 3.2);
        arcGeo.setDrawRange(0, Math.floor(easeOut(arcT) * arcCount / 2) * 2);
        var e = easeOut(drive), x = lerp(-15, 0, e);
        var prevX = rig.position.x;
        rig.position.x = x;
        car.spin += (x - prevX) / 0.36;
        if (drive >= 1) {
          if (!since) car.lightsTarget = 1;
          since += dt;
        }
        var turn = REDUCE ? -0.32 : -0.32 * smooth01(since / 2.5) - Math.max(0, since - 2.5) * 0.08;
        if (fit.top >= 0 && inner && Math.abs(inner.offsetTop - fit.top) > 2) frameHero(); // le titre a changé de hauteur (police, langue)
        var hr = canvas.getBoundingClientRect();
        scroll = lerp(scroll, clamp(-hr.top / Math.max(1, hr.height), 0, 1), 0.08);
        rig.rotation.y = turn - scroll * 1.6;
        mouse.x = lerp(mouse.x, mouse.tx, 0.04); mouse.y = lerp(mouse.y, mouse.ty, 0.04);
        var az = 0.62 + mouse.x * 0.1, el = 0.075 + mouse.y * 0.035 + scroll * 0.16, radius = (13.6 - scroll * 2.6) * fit.k;
        cam.position.set(Math.sin(az) * Math.cos(el) * radius, 0.7 + Math.sin(el) * radius, Math.cos(az) * Math.cos(el) * radius);
        cam.lookAt(0, 0.95, 0);
        car.update(dt);
        dust.update(dt, time);
      };
      return st;
    }

    // ---------- Showroom : la voiture change de silhouette et de teinte ----------
    var SHOW_KEYS = ["sedan", "suv", "sport", "compact"];
    var CAT_TO_STYLE = { suv: "suv", sedan: "sedan", coupe: "sport", compact: "compact" };
    function showroomStage(canvas) {
      var st = new Stage(canvas, { fov: 28, env: 1, exposure: 1.05 });
      var scene = st.scene, cam = st.camera;
      scene.fog = new THREE.Fog(0x0d0d10, 14, 34);
      addLights(scene, 1.5, 1.8);
      var car = new Car(SHOW_KEYS, { lightsOn: true });
      car.setPaint("obsidian", true);
      var rig = new THREE.Group(), body = car.instance(false), mirror = car.instance(true);
      mirror.scale.y = -1;
      rig.add(body); rig.add(mirror);
      var shadow = makeShadow();
      rig.add(shadow);
      scene.add(rig);
      scene.add(makeFloor(60, 0x0d0d10));
      var ring = new THREE.Mesh(new THREE.RingGeometry(3.55, 3.58, 120), new THREE.MeshBasicMaterial({ color: 0xc8a96b, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.006; ring.renderOrder = 3;
      scene.add(ring);
      var ring2 = new THREE.Mesh(new THREE.RingGeometry(3.75, 3.76, 120), new THREE.MeshBasicMaterial({ color: 0xc8a96b, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
      ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.006; ring2.renderOrder = 3;
      scene.add(ring2);
      var mode = "all", cycleT = 0, cycleIdx = 0, angle = -0.6, vel = REDUCE ? 0 : 0.22, dragging = false, lastX = 0, idle = 0;
      function announce() { document.dispatchEvent(new CustomEvent("ns:style", { detail: { style: car.currentKey() } })); }
      document.addEventListener("ns:fleet", function (e) {
        var cat = e.detail && e.detail.cat;
        if (!cat || cat === "all") { mode = "all"; cycleT = 0; return; }
        mode = "fixed";
        var key = CAT_TO_STYLE[cat];
        if (key) { car.setStyle(key); cycleIdx = SHOW_KEYS.indexOf(key); announce(); }
      });
      document.addEventListener("ns:paint", function (e) { if (e.detail) car.setPaint(e.detail.id); });
      canvas.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; idle = 0; canvas.setPointerCapture(e.pointerId); canvas.classList.add("is-grabbing"); });
      canvas.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX; lastX = e.clientX;
        angle += dx * 0.009; vel = dx * 0.5;
      });
      function stop() { dragging = false; canvas.classList.remove("is-grabbing"); }
      canvas.addEventListener("pointerup", stop);
      canvas.addEventListener("pointercancel", stop);
      st.onResize = function (w, h) { cam.fov = w / h < 1.2 ? 40 : 26; };
      st.update = function (dt) {
        if (!dragging) {
          idle += dt;
          vel = idle > 1.5 ? lerp(vel, REDUCE ? 0 : 0.22, 0.03) : vel * 0.94;
          angle += vel * dt;
        }
        rig.rotation.y = angle;
        if (mode === "all" && !REDUCE && st.visible) {
          cycleT += dt;
          if (cycleT > 5) { cycleT = 0; cycleIdx = (cycleIdx + 1) % SHOW_KEYS.length; car.setStyle(SHOW_KEYS[cycleIdx]); announce(); }
        }
        var A = car.place[car.from], B = car.place[car.to], t = easeInOut(car.t);
        shadow.scale.set(lerp(A.shadow.l, B.shadow.l, t), lerp(A.shadow.w, B.shadow.w, t), 1);
        var portrait = st.size[1] ? st.size[0] / st.size[1] < 1.2 : false, radius = portrait ? 11.5 : 10.6;
        cam.position.set(Math.sin(0.78) * radius, 2.3, Math.cos(0.78) * radius);
        cam.lookAt(0, portrait ? 0.9 : 0.72, 0);
        car.update(dt);
      };
      setTimeout(announce, 0);
      return st;
    }

    // ---------- Jet privé qui traverse le ciel au fil du défilement ----------
    function jetStage(canvas) {
      var st = new Stage(canvas, { fov: 32, env: 0.8, exposure: 1.1 });
      var scene = st.scene, cam = st.camera;
      var sun = new THREE.DirectionalLight(0xffc583, 2.6);
      sun.position.set(8, 2, 4);
      scene.add(sun);
      var sky = new THREE.DirectionalLight(0x9db1ff, 0.6);
      sky.position.set(-4, 8, 2);
      scene.add(sky);
      var jet = buildJet();
      var holder = new THREE.Group();
      holder.add(jet);
      scene.add(holder);
      var clouds = [];
      var cloudMat = new THREE.SpriteMaterial({ map: TEX.cloud, transparent: true, depthWrite: false, opacity: 0.55 });
      for (var i = 0; i < (MOBILE ? 7 : 14); i++) {
        var c = new THREE.Sprite(cloudMat);
        var s = 4 + Math.random() * 7;
        c.scale.set(s * 2.2, s, 1);
        c.position.set(lerp(-26, 26, Math.random()), lerp(-6, -1.5, Math.random()), lerp(-24, -6, Math.random()));
        c.userData.v = 0.15 + Math.random() * 0.25;
        scene.add(c);
        clouds.push(c);
      }
      var trailGeo = new THREE.BufferGeometry(), trailN = 60, trail = new Float32Array(trailN * 3);
      trailGeo.setAttribute("position", new THREE.BufferAttribute(trail, 3));
      var trailPts = new THREE.Points(trailGeo, new THREE.PointsMaterial({ map: TEX.dust, color: 0xf3e2c0, size: 0.22, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
      scene.add(trailPts);
      var prog = 0, section = canvas.closest("section") || canvas;
      cam.position.set(0, 0.6, 15);
      cam.lookAt(0, 0, 0);
      var tmp = new THREE.Vector3();
      var span = 14, portrait = false;
      st.onResize = function (w, h) {
        portrait = w / h < 1;
        cam.fov = portrait ? 52 : 32;
        // Le jet entre et sort juste hors champ, quelle que soit la largeur de l'écran.
        span = 15 * Math.tan(cam.fov * Math.PI / 360) * (w / h) + 6;
      };
      st.update = function (dt, time) {
        prog = lerp(prog, progressOf(section), 0.06);
        var p = REDUCE ? (portrait ? 0.55 : 0.66) : prog;
        var x = lerp(-span, span, p), y = Math.sin(p * Math.PI) * 1.2 + 1.3, z = Math.sin(p * Math.PI * 2) * 1.2;
        holder.position.set(x, y + Math.sin(time * 0.9) * 0.08, z);
        holder.rotation.set(-0.38 - Math.cos(p * Math.PI * 2) * 0.25, -0.32 + Math.sin(p * Math.PI) * 0.18, 0.06 + Math.cos(p * Math.PI) * 0.12);
        for (var k = trailN - 1; k > 0; k--) { trail[k * 3] = trail[(k - 1) * 3] - 0.12; trail[k * 3 + 1] = trail[(k - 1) * 3 + 1]; trail[k * 3 + 2] = trail[(k - 1) * 3 + 2]; }
        tmp.set(-3.7, 0.25, 0).applyMatrix4(holder.matrixWorld);
        trail[0] = tmp.x; trail[1] = tmp.y; trail[2] = tmp.z;
        trailGeo.attributes.position.needsUpdate = true;
        clouds.forEach(function (c) {
          c.position.x -= c.userData.v * dt * (REDUCE ? 0 : 1);
          if (c.position.x < -30) c.position.x = 30;
        });
      };
      return st;
    }

    // Accès pour la page de test (outils/labo) : sans effet sur le site.
    if (lib.lab) {
      lib.lab({ Car: Car, STYLES: STYLES, arcLines: arcLines, buildJet: buildJet, Stage: Stage, makeFloor: makeFloor, makeShadow: makeShadow, addLights: addLights, PAINTS: PAINTS });
      return;
    }

    // ============================================================
    // Démarrage
    // ============================================================
    var made = [];
    try {
      var hero = document.getElementById("hero-3d");
      var show = document.getElementById("showroom-3d");
      var jetCanvas = document.getElementById("jet-3d");
      if (hero) made.push(heroStage(hero));
      if (show) made.push(showroomStage(show));
      if (jetCanvas) made.push(jetStage(jetCanvas));
    } catch (err) {
      if (window.console) console.warn("3D indisponible :", err);
      return;
    }
    if (!made.length) return;
    window.NS3D.stages = stages; // accès pour le débogage dans la console
    document.documentElement.classList.add("has-3d");
    document.dispatchEvent(new CustomEvent("ns:3d"));

    var clock = new THREE.Clock(), time = 0;
    function frame() {
      var dt = Math.min(clock.getDelta(), 0.1);
      time += dt;
      if (!document.hidden) {
        stages.forEach(function (s) {
          if (!s.visible) return;
          s.resize();
          s.update(dt, time);
          s.renderer.render(s.scene, s.camera);
        });
      }
      requestAnimationFrame(frame);
    }
    stages.forEach(function (s) { s.resize(); });
    requestAnimationFrame(frame);
  };
})();
