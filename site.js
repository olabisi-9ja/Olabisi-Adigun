/* ==========================================================
   Olabisi Adigun: site behaviour
   Every block checks for its own markup first, so the same
   file runs on every page.
   ========================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── Split display headings into rising lines ── */
  $$('.lines').forEach(function (el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map(function (part) {
      return '<span class="ln"><span>' + part.trim() + '</span></span>';
    }).join('');
  });

  /* ── Reveal on scroll ── */
  var revealables = $$('.reveal, .lines');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  var hero = $('.hero');
  if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('in'); }, 60); });

  /* ── Nav: tone follows the surface beneath it, hides on scroll down ── */
  var nav = $('.nav');
  var surfaces = $$('[data-surface]');
  var lastY = window.scrollY;
  function tone() {
    if (!nav) return;
    var y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (!document.body.classList.contains('menu-open')) {
      nav.classList.toggle('hide', y > lastY && y > 400);
    }
    lastY = y;
    var probe = 36, t = 'light';
    for (var i = 0; i < surfaces.length; i++) {
      var r = surfaces[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { t = surfaces[i].dataset.surface; break; }
    }
    nav.dataset.tone = t;
  }

  /* ── Reading progress (articles) ── */
  var bar = $('.read-bar');
  var article = $('.article');
  function progress() {
    if (!bar || !article) return;
    var r = article.getBoundingClientRect();
    var total = r.height - window.innerHeight * 0.6;
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
    bar.style.transform = 'scaleX(' + p + ')';
  }

  /* ── Cover parallax ── */
  var covers = reduce ? [] : $$('.parallax img');
  function parallax() {
    covers.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      img.style.transform = 'scale(1.12) translateY(' + (p * -6).toFixed(2) + '%)';
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { tone(); progress(); parallax(); ticking = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ── Mobile menu ── */
  var menuBtn = $('.menu-btn');
  if (menuBtn) {
    var setMenu = function (open) {
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) nav.classList.remove('hide');
    };
    menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $$('.mobile-menu a, .mobile-menu button').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ── Ask Olabisi: pre-written answers ── */
  var ask = $('.ask');
  if (ask) {
    var log = $('.ask-log', ask);
    var scrim = $('.ask-scrim');
    var lastFocus = null;
    var answers = {
      what: 'I’m a designer and full-stack engineer. I take products from idea to launch: brand, interface, and the code underneath. Most of my work sits where design, engineering and AI meet.',
      now: 'Right now: expanding <a href="/works/meshlearn/">MeshLearn</a> (offline learning over BLE mesh), building Greene Studios, exploring AI design tools, and going deeper on Python and machine learning.',
      start: 'Start with <a href="/works/sentry/">Sentry</a>. I pivoted mid-hackathon, rebuilt it in one night on Gemma 4, and it took first place at Build with Gemma. Then <a href="/works/meshlearn/">MeshLearn</a> for the long game.',
      stack: 'Figma for design. React, Next.js and Node.js on the web, React Native on mobile, Python and FastAPI for ML services, PostgreSQL and Supabase for data.',
      hire: 'Yes, for selected freelance work, product collaborations, and engineering roles where design and technical depth both matter. Email <a href="mailto:abeladigun11@gmail.com">abeladigun11@gmail.com</a> and tell me what you’re building.',
      where: 'Ilorin, Nigeria. I work remotely with teams anywhere.'
    };
    var openAsk = function () {
      lastFocus = document.activeElement;
      document.body.classList.add('ask-open');
      ask.setAttribute('aria-hidden', 'false');
      setTimeout(function () { var b = $('.ask-qs button', ask); if (b) b.focus(); }, 300);
    };
    var closeAsk = function () {
      document.body.classList.remove('ask-open');
      ask.setAttribute('aria-hidden', 'true');
      if (lastFocus) lastFocus.focus();
    };
    $$('[data-ask]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openAsk(); }); });
    $('.ask-close', ask).addEventListener('click', closeAsk);
    if (scrim) scrim.addEventListener('click', closeAsk);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('ask-open')) closeAsk(); });

    var add = function (cls, html) {
      var m = document.createElement('div');
      m.className = 'msg ' + cls;
      m.innerHTML = html;
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return m;
    };
    $$('.ask-qs button', ask).forEach(function (b) {
      b.addEventListener('click', function () {
        add('me', b.textContent);
        var t = add('them typing', '<i></i><i></i><i></i>');
        setTimeout(function () {
          t.className = 'msg them';
          t.innerHTML = answers[b.dataset.q];
          log.scrollTop = log.scrollHeight;
        }, reduce ? 0 : 650);
      });
    });
  }

  /* ── Tabs (Ask me how I decide) ── */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    var select = function (tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        p.hidden = !on;
        if (on) { p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap'); }
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!n) return;
        var next = tabs[(i + n + tabs.length) % tabs.length];
        next.focus(); select(next);
      });
    });
  });

  /* ── Row hover preview ── */
  var peek = $('.row-peek');
  if (peek && fine) {
    var peekImg = $('img', peek);
    var px = 0, py = 0, tx = 0, ty = 0, running = false;
    var loop = function () {
      px += (tx - px) * 0.16; py += (ty - py) * 0.16;
      peek.style.left = px + 'px'; peek.style.top = py + 'px';
      if (running) requestAnimationFrame(loop);
    };
    $$('.row-link[data-img]').forEach(function (row) {
      row.addEventListener('mouseenter', function (e) {
        peekImg.src = row.dataset.img;
        tx = px = e.clientX; ty = py = e.clientY;
        peek.classList.add('on');
        if (!running) { running = true; loop(); }
      });
      row.addEventListener('mousemove', function (e) { tx = e.clientX + 170; ty = e.clientY; });
      row.addEventListener('mouseleave', function () { peek.classList.remove('on'); running = false; });
    });
  }

  /* ── Timeline accordion + year counter ── */
  var tl = $('.tl');
  if (tl) {
    var yearEl = $('.tl-year', tl);
    var dot = $('.tl-track i', tl);
    var btns = $$('.tl-btn', tl);
    var min = +tl.dataset.min, max = +tl.dataset.max;
    var shown = +yearEl.textContent;
    var countTo = function (target) {
      if (reduce) { yearEl.textContent = target; shown = target; return; }
      var from = shown, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / 700);
        var e = 1 - Math.pow(1 - p, 3);
        yearEl.textContent = Math.round(from + (target - from) * e);
        if (p < 1) requestAnimationFrame(step); else shown = target;
      };
      requestAnimationFrame(step);
    };
    var openItem = function (btn) {
      btns.forEach(function (b) { b.setAttribute('aria-expanded', String(b === btn)); });
      var y = +btn.dataset.y;
      countTo(y);
      dot.style.left = 'calc(' + ((y - min) / Math.max(1, max - min) * 100) + '% - 3px)';
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-expanded') === 'true') b.setAttribute('aria-expanded', 'false');
        else openItem(b);
      });
    });
    var first = btns.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
    if (first) openItem(first);
  }

  /* ── Portrait mood switch ── */
  var portrait = $('.portrait');
  if (portrait) {
    $$('.switch button', portrait).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.switch button', portrait).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        portrait.classList.toggle('color', b.dataset.mode === 'color');
      });
    });
  }

  /* ── Work filters ── */
  var filters = $('.filters');
  if (filters) {
    var cards = $$('.wgrid .card');
    $$('button', filters).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('button', filters).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var f = b.dataset.filter;
        cards.forEach(function (c) { c.classList.toggle('hide', f !== 'all' && c.dataset.kind.indexOf(f) === -1); });
      });
    });
  }

  /* ── Lightbox for the identity gallery ── */
  var gallery = $('.gallery');
  if (gallery) {
    var figs = $$('figure', gallery);
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<img alt=""><p></p>' +
      '<button class="nav-prev" aria-label="Previous image">&larr;</button>' +
      '<button class="nav-next" aria-label="Next image">&rarr;</button>' +
      '<button class="lb-close" aria-label="Close">&times;</button>';
    document.body.appendChild(lb);
    var lbImg = $('img', lb), lbCap = $('p', lb), idx = 0, back = null;
    var show = function (i) {
      idx = (i + figs.length) % figs.length;
      var im = $('img', figs[idx]);
      lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt;
      lbCap.textContent = $('figcaption span', figs[idx]).textContent;
    };
    var close = function () { lb.classList.remove('on'); if (back) back.focus(); };
    figs.forEach(function (f, i) {
      f.tabIndex = 0;
      f.setAttribute('role', 'button');
      var open = function () { back = f; show(i); lb.classList.add('on'); $('.lb-close', lb).focus(); };
      f.addEventListener('click', open);
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.nav-prev', lb).addEventListener('click', function () { show(idx - 1); });
    $('.nav-next', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  }

  /* ── Custom cursor dot ── */
  if (fine && !reduce) {
    var cur = document.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    var cx = -100, cy = -100, kx = -100, ky = -100;
    document.addEventListener('mousemove', function (e) { kx = e.clientX; ky = e.clientY; cur.classList.add('on'); });
    document.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
    document.addEventListener('mouseover', function (e) {
      cur.classList.toggle('big', !!e.target.closest('a, button, [role="button"], [role="tab"]'));
    });
    (function follow() {
      cx += (kx - cx) * 0.22; cy += (ky - cy) * 0.22;
      cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(follow);
    })();
  }

  /* ── Hero: pixel-noise pointer ── */
  var canvas = $('.hero-canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var GW = 48, GH = 64;                       // pixel grid
    var off = document.createElement('canvas');
    off.width = GW; off.height = GH;
    var octx = off.getContext('2d');
    var img = octx.createImageData(GW, GH);
    // classic pointer silhouette, in grid units
    var poly = [[6, 2], [6, 50], [17, 40], [26, 60], [34, 56], [25, 37], [41, 36]];
    var inside = function (x, y) {
      var c = false;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
      }
      return c;
    };
    var edgeDist = function (x, y) {
      var best = 1e9;
      for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        var ax = poly[j][0], ay = poly[j][1], bx = poly[i][0], by = poly[i][1];
        var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
        var t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l));
        var ex = ax + t * dx - x, ey = ay + t * dy - y;
        best = Math.min(best, ex * ex + ey * ey);
      }
      return Math.sqrt(best);
    };
    var mask = new Float32Array(GW * GH);
    for (var y = 0; y < GH; y++) for (var x = 0; x < GW; x++) {
      var d = edgeDist(x + .5, y + .5);
      mask[y * GW + x] = inside(x + .5, y + .5) ? 1 : (d < 2.2 ? -d : 0);
    }
    var pal = [[92, 64, 232], [115, 87, 255], [140, 116, 255], [170, 150, 255], [196, 182, 250], [124, 94, 240], [82, 58, 210]];
    var hash = function (x, y, t) {
      var n = Math.sin(x * 127.1 + y * 311.7 + t * 74.7) * 43758.5453;
      return n - Math.floor(n);
    };
    var rot = 0, rotT = 0, ox = 0, oy = 0, oxT = 0, oyT = 0, frame = 0;
    var size = function () {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    };
    size();
    window.addEventListener('resize', size);
    if (fine && !reduce) {
      window.addEventListener('mousemove', function (e) {
        var nx = e.clientX / window.innerWidth - .5, ny = e.clientY / window.innerHeight - .5;
        rotT = nx * 14; oxT = nx * 26; oyT = ny * 20;
      });
    }
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
    }
    var draw = function () {
      frame++;
      var t = Math.floor(frame / 5);              // shimmer rate
      var data = img.data;
      for (var i = 0; i < GW * GH; i++) {
        var m = mask[i], px = i % GW, py = (i / GW) | 0, k = i * 4;
        var h = hash(px, py, t);
        var on = m === 1 ? h > 0.035 : (m < 0 ? h > 0.72 + (-m) * 0.12 : false);
        if (!on) { data[k + 3] = 0; continue; }
        var c = pal[(hash(px + 3, py + 7, t) * pal.length) | 0];
        data[k] = c[0]; data[k + 1] = c[1]; data[k + 2] = c[2]; data[k + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      rot += (rotT - rot) * 0.06; ox += (oxT - ox) * 0.06; oy += (oyT - oy) * 0.06;
      var W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      ctx.save();
      ctx.translate(W / 2 + ox * (W / 400), H / 2 + oy * (H / 400));
      ctx.rotate((-18 + rot) * Math.PI / 180);
      var s = Math.min(W / GW, H / GH) * 0.92;
      ctx.drawImage(off, -GW * s / 2, -GH * s / 2, GW * s, GH * s);
      ctx.restore();
    };
    var tick = function () { if (visible) draw(); requestAnimationFrame(tick); };
    draw();
    if (!reduce) requestAnimationFrame(tick);
  }

  /* ── Current year ── */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
