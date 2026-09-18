/* Lightweight hero scene: the stacked translucent data planes.

   Replaces the previous three.js (r128, ~600 KB from a CDN) dependency with a
   tiny canvas-2D projection so the page ships no third-party JavaScript, works
   offline, and keeps the same look: seven rotated wireframe planes, red/blue,
   with mouse parallax and a click "shuffle". */

(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = canvas.getContext('2d');

  var LAYERS = 7;
  var PLANE_W = 1.8;   // half width  (3.6 total, matches old PlaneGeometry)
  var PLANE_H = 1.1;   // half height (2.2 total)
  var CAM_Z = 9;
  var FOV = 45 * Math.PI / 180;

  var BLUE = '52,107,241';
  var RED = '255,70,65';

  var planes = [];
  for (var i = 0; i < LAYERS; i++) {
    var off = i - LAYERS / 2;
    planes.push({
      color: (i % 2 !== 0) ? RED : BLUE,
      fillAlpha: 0.05 + i * 0.008,
      baseY: off * 0.42,
      baseZ: off * 0.25,
      y: off * 0.42,
      z: off * 0.25,
      tY: off * 0.42,
      tZ: off * 0.25
    });
  }

  var rotX = 0.45;
  var rotY = -0.5;
  var groupX = window.innerWidth < 768 ? 0 : 2.6;
  var mx = 0, my = 0;
  var clicking = false;
  var visible = true;

  var dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  // corners of a unit plane in local space
  var CORNERS = [
    [-PLANE_W, -PLANE_H, 0],
    [PLANE_W, -PLANE_H, 0],
    [PLANE_W, PLANE_H, 0],
    [-PLANE_W, PLANE_H, 0]
  ];

  function project(p, cx, cy, focal) {
    // rotate X then Y, translate group, then perspective project
    var x = p[0], y = p[1], z = p[2];
    var cxr = Math.cos(rotX), sxr = Math.sin(rotX);
    var y1 = y * cxr - z * sxr;
    var z1 = y * sxr + z * cxr;
    var cyr = Math.cos(rotY), syr = Math.sin(rotY);
    var x2 = x * cyr + z1 * syr;
    var z2 = -x * syr + z1 * cyr;

    var wx = x2 + groupX;
    var wy = y1;
    var wz = z2;

    var zc = wz + CAM_Z;
    if (zc <= 0.1) zc = 0.1;
    var s = focal / zc;
    return { x: cx + wx * s, y: cy - wy * s, z: zc };
  }

  function draw() {
    var w = canvas.width, h = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    var cx = w / 2, cy = h / 2;
    var focal = (h / 2) / Math.tan(FOV / 2);

    // depth sort: far planes first
    var order = planes.map(function (p) {
      return { p: p, z: p.z + CAM_Z };
    }).sort(function (a, b) { return b.z - a.z; });

    for (var k = 0; k < order.length; k++) {
      var plane = order[k].p;
      var pts = CORNERS.map(function (c) {
        return project([c[0], c[1] + plane.y, c[2] + plane.z], cx, cy, focal);
      });

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j < 4; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.closePath();

      ctx.fillStyle = 'rgba(' + plane.color + ',' + plane.fillAlpha.toFixed(3) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + plane.color + ',0.25)';
      ctx.lineWidth = Math.max(1, dpr * 0.75);
      ctx.stroke();
    }
  }

  function tick() {
    if (visible && !reduceMotion) {
      rotY += 0.0015;
      rotY += (-0.5 + mx * 0.5 - rotY) * 0.02;
      rotX += (0.45 - my * 0.4 - rotX) * 0.02;
      var ease = clicking ? 0.1 : 0.05;
      for (var i = 0; i < planes.length; i++) {
        planes[i].y += (planes[i].tY - planes[i].y) * ease;
        planes[i].z += (planes[i].tZ - planes[i].z) * ease;
      }
    }
    draw();
    if (!reduceMotion) requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', function (e) {
    mx = (e.clientX / window.innerWidth - 0.5);
    my = (e.clientY / window.innerHeight - 0.5);
  });

  canvas.addEventListener('mousedown', function () {
    clicking = true;
    planes.forEach(function (p) {
      p.tY = p.baseY + (Math.random() - 0.5) * 4;
      p.tZ = p.baseZ + (Math.random() - 0.5) * 4;
    });
  });
  window.addEventListener('mouseup', function () {
    clicking = false;
    planes.forEach(function (p) { p.tY = p.baseY; p.tZ = p.baseZ; });
  });

  window.addEventListener('resize', function () {
    groupX = window.innerWidth < 768 ? 0 : 2.6;
    resize();
    if (reduceMotion) draw();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }).observe(canvas);
  }

  resize();
  if (reduceMotion) {
    draw(); // single static frame for reduced-motion users
  } else {
    requestAnimationFrame(tick);
  }
})();
