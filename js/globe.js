/*
 * Rotating dot globe for the hero sections.
 * Usage: <canvas data-globe></canvas>, plus js/land-dots.js loaded first.
 * Land is drawn as dots, wrapped in a cage of connected points; random land
 * dots flare red for ~2s. Drag to rotate in any direction (with momentum).
 */
(function () {
  'use strict';

  var SPIN_SPEED = 0.075;    // radians per second around the globe's own axis
  var FLARE_COUNT = 9;       // red flares visible at once
  var COLORS = { land: '#6FB3CF', cage: '#4D98B5', cageNode: '#8EC1D6', flare: '#E0344A' };

  function mul(a, b) {
    var o = new Array(9);
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
      }
    }
    return o;
  }
  function rotX(t) { var c = Math.cos(t), s = Math.sin(t); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function rotY(t) { var c = Math.cos(t), s = Math.sin(t); return [c, 0, s, 0, 1, 0, -s, 0, c]; }

  // Re-orthonormalise the rotation matrix so repeated turns never drift.
  function tidy(m) {
    var a = [m[0], m[1], m[2]], b = [m[3], m[4], m[5]];
    var na = Math.hypot(a[0], a[1], a[2]);
    a = a.map(function (v) { return v / na; });
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    b = b.map(function (v, i) { return v - d * a[i]; });
    var nb = Math.hypot(b[0], b[1], b[2]);
    b = b.map(function (v) { return v / nb; });
    return a.concat(b, [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
  }

  function landPoints() {
    var a = window.TAG_LAND_DOTS || [];
    var n = a.length / 2, xyz = new Float32Array(n * 3), d = Math.PI / 1800;
    for (var i = 0; i < n; i++) {
      var la = a[i * 2] * d, lo = a[i * 2 + 1] * d, c = Math.cos(la);
      xyz[i * 3] = c * Math.sin(lo);
      xyz[i * 3 + 1] = Math.sin(la);
      xyz[i * 3 + 2] = c * Math.cos(lo);
    }
    return { xyz: xyz, count: n };
  }

  // A fixed, seeded cage of points around the globe, each joined to its 3 nearest neighbours.
  function buildCage() {
    var seed = 11;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var pts = [];
    for (var i = 0; i < 72; i++) {
      var u = rnd() * 2 - 1, t = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u), k = 1.12 + rnd() * 0.07;
      pts.push([r * Math.cos(t) * k, u * k, r * Math.sin(t) * k]);
    }
    var edges = [], seen = {};
    pts.forEach(function (p, i) {
      pts.map(function (q, j) { return [j, Math.pow(p[0] - q[0], 2) + Math.pow(p[1] - q[1], 2) + Math.pow(p[2] - q[2], 2)]; })
        .filter(function (e) { return e[0] !== i; })
        .sort(function (a, b) { return a[1] - b[1]; })
        .slice(0, 3)
        .forEach(function (e) {
          var j = e[0], key = i < j ? i + '-' + j : j + '-' + i;
          if (!seen[key]) { seen[key] = 1; edges.push([i, j]); }
        });
    });
    return { points: pts, edges: edges };
  }

  function Globe(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.land = landPoints();
    this.cage = buildCage();
    this.M = mul(rotX(0.38), rotY(-0.35));
    this.spinX = 0;
    this.spinY = 0;
    this.last = 0;
    this.flares = [];
    this.nextFlare = 0;
    this.drag = null;
    this.still = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    this.tick = this.tick.bind(this);
    this.bindDrag();
    requestAnimationFrame(this.tick);
  }

  Globe.prototype.turn = function (ax, ay) {
    this.M = tidy(mul(mul(rotX(ay), rotY(ax)), this.M));
  };

  Globe.prototype.bindDrag = function () {
    var self = this, cv = this.canvas;
    cv.addEventListener('pointerdown', function (e) {
      self.drag = { x: e.clientX, y: e.clientY, t: performance.now() };
      self.spinX = 0; self.spinY = 0;
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      cv.style.cursor = 'grabbing';
    });
    cv.addEventListener('pointermove', function (e) {
      var d = self.drag;
      if (!d) return;
      var r = cv.getBoundingClientRect(), R = Math.min(r.width, r.height) / 2 / 1.22;
      var now = performance.now(), dt = Math.max(0.008, (now - d.t) / 1000);
      var ax = (e.clientX - d.x) / R, ay = (e.clientY - d.y) / R;
      self.turn(ax, ay);
      self.spinX = ax / dt; self.spinY = ay / dt;
      self.drag = { x: e.clientX, y: e.clientY, t: now };
    });
    function release() {
      if (!self.drag) return;
      if (performance.now() - self.drag.t > 80) { self.spinX = 0; self.spinY = 0; }
      self.drag = null;
      cv.style.cursor = 'grab';
    }
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', release);
  };

  Globe.prototype.tick = function (now) {
    requestAnimationFrame(this.tick);
    var cv = this.canvas, rect = cv.getBoundingClientRect();
    // Only draw while on screen.
    if (rect.width === 0 || rect.bottom < 0 || rect.top > (window.innerHeight || 1000)) { this.last = now; return; }
    var dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0;
    this.last = now;

    if (!this.drag) {
      if (Math.abs(this.spinX) + Math.abs(this.spinY) > 0.001) {
        this.turn(this.spinX * dt, this.spinY * dt);
        var k = Math.exp(-dt * 2.5);
        this.spinX *= k; this.spinY *= k;
      }
      if (!this.still) this.M = mul(this.M, rotY(dt * SPIN_SPEED));
    }
    this.draw(rect, now / 1000);
  };

  Globe.prototype.draw = function (rect, t) {
    var cv = this.canvas, ctx = this.ctx;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    ctx.clearRect(0, 0, W, H);
    var R = Math.min(W, H) / 2 / 1.22, cx = W / 2, cy = H / 2, m = this.M;
    function proj(x, y, z) {
      return [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
    }

    // Cage lines and points, fainter toward the back.
    var sp = this.cage.points.map(function (p) { return proj(p[0], p[1], p[2]); });
    ctx.lineWidth = 0.8 * dpr;
    ctx.strokeStyle = COLORS.cage;
    this.cage.edges.forEach(function (e) {
      var a = sp[e[0]], b = sp[e[1]];
      ctx.globalAlpha = 0.06 + 0.3 * ((a[2] + b[2]) / 2.4 + 1) / 2;
      ctx.beginPath();
      ctx.moveTo(cx + a[0] * R, cy - a[1] * R);
      ctx.lineTo(cx + b[0] * R, cy - b[1] * R);
      ctx.stroke();
    });
    ctx.fillStyle = COLORS.cageNode;
    sp.forEach(function (p) {
      ctx.globalAlpha = 0.25 + 0.55 * (p[2] / 1.2 + 1) / 2;
      ctx.beginPath();
      ctx.arc(cx + p[0] * R, cy - p[1] * R, 1.6 * dpr, 0, Math.PI * 2);
      ctx.fill();
    });

    // Land dots, larger and brighter toward the viewer.
    var L = this.land.xyz, n = this.land.count, front = [];
    ctx.fillStyle = COLORS.land;
    for (var i = 0; i < n; i++) {
      var p = proj(L[i * 3], L[i * 3 + 1], L[i * 3 + 2]), z = p[2];
      var x = cx + p[0] * R, y = cy - p[1] * R;
      if (z < 0) {
        ctx.globalAlpha = 0.07;
        ctx.fillRect(x - 0.5 * dpr, y - 0.5 * dpr, dpr, dpr);
        continue;
      }
      if (z > 0.35) front.push(i);
      ctx.globalAlpha = 0.28 + 0.72 * z;
      ctx.beginPath();
      ctx.arc(x, y, R * (0.0024 + 0.0046 * z), 0, Math.PI * 2);
      ctx.fill();
    }

    // Red flares: random front-facing land dots glow for ~2s, then hand over to others.
    this.flares = this.flares.filter(function (f) { return t - f.t0 < f.life; });
    if (this.flares.length < FLARE_COUNT && t >= this.nextFlare && front.length) {
      this.flares.push({ i: front[Math.floor(Math.random() * front.length)], t0: t, life: 1.8 + Math.random() * 0.8 });
      this.nextFlare = t + 0.18 + Math.random() * 0.3;
    }
    this.flares.forEach(function (f) {
      var p = proj(L[f.i * 3], L[f.i * 3 + 1], L[f.i * 3 + 2]), z = p[2];
      if (z <= 0) return;
      var age = t - f.t0, env = Math.sin(Math.PI * Math.min(1, age / f.life)) * Math.min(1, z * 2);
      var x = cx + p[0] * R, y = cy - p[1] * R, r = R * (0.006 + 0.004 * z), ph = (age * 1.1) % 1;
      ctx.globalAlpha = env * (1 - ph) * 0.75;
      ctx.strokeStyle = COLORS.flare;
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.arc(x, y, r * (1.2 + 3.2 * ph), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = COLORS.flare;
      ctx.globalAlpha = env * 0.22;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = env;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  document.querySelectorAll('canvas[data-globe]').forEach(function (canvas) { new Globe(canvas); });
})();
