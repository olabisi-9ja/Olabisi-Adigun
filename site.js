/* ==========================================================
   Olabisi Adigun: site behaviour
   Every block checks for its own markup first, so the same
   file runs on every page.
   ========================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ── Theme toggle ── */
  var nav = $('.nav');
  function applyTheme(t) {
    doc.setAttribute('data-theme', t);
    $$('.theme-btn').forEach(function (b) {
      b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      b.setAttribute('aria-pressed', String(t === 'dark'));
    });
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#080809' : '#0d0d0e');
    tone();
  }
  $$('.theme-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = doc.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      store.set('theme', t);
      applyTheme(t);
    });
  });
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var follow = function (e) { if (!store.get('theme')) applyTheme(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', follow);
  }

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
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }
  var hero = $('.hero');
  if (hero) requestAnimationFrame(function () { setTimeout(function () { hero.classList.add('in'); }, 60); });

  /* ── Image skeletons: fade each image in once it has loaded ── */
  $$('.sk > img').forEach(function (img) {
    var done = function () { img.parentNode.classList.add('ld'); };
    if (img.complete && img.naturalWidth) done();
    else { img.addEventListener('load', done); img.addEventListener('error', done); }
  });

  /* ── Nav tone, hide on scroll, floating buttons ── */
  var surfaces = $$('[data-surface]');
  var lastY = window.scrollY;
  function tone() {
    if (!nav) return;
    var probe = 36, t = 'ink';
    for (var i = 0; i < surfaces.length; i++) {
      var r = surfaces[i].getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { t = surfaces[i].dataset.surface; break; }
    }
    nav.dataset.tone = t;
  }
  function onScrollWork() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle('scrolled', y > 40);
      if (!body.classList.contains('menu-open')) nav.classList.toggle('hide', y > lastY && y > 400);
    }
    lastY = y;
    body.classList.toggle('past-hero', y > window.innerHeight * 0.8);
    tone(); progress();
  }

  /* ── Reading progress (articles) ── */
  var bar = $('.read-bar');
  var article = $('.article');
  function progress() {
    if (!bar || !article) return;
    var r = article.getBoundingClientRect();
    var total = r.height - window.innerHeight * 0.6;
    bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, -r.top / Math.max(1, total))) + ')';
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScrollWork(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScrollWork);
  applyTheme(doc.getAttribute('data-theme') || 'light');
  onScrollWork();

  $$('[data-top]').forEach(function (b) {
    b.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var skip = $('#main'); if (skip) { skip.setAttribute('tabindex', '-1'); skip.focus({ preventScroll: true }); }
    });
  });

  /* ── Mobile menu ── */
  var menuBtn = $('.menu-btn');
  function setMenu(open) {
    if (!menuBtn) return;
    body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    body.style.overflow = open ? 'hidden' : '';
    if (open && nav) nav.classList.remove('hide');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
    $$('.mobile-menu a, .mobile-menu button').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ── Overlays share one scrim and one Escape handler ── */
  var scrim = $('.scrim');
  var lastFocus = null;
  function closeOverlays() {
    var had = body.classList.contains('ask-open') || body.classList.contains('search-open');
    body.classList.remove('ask-open', 'search-open');
    var a = $('.ask'); if (a) a.setAttribute('aria-hidden', 'true');
    if (had && lastFocus) lastFocus.focus();
  }
  if (scrim) scrim.addEventListener('click', closeOverlays);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeOverlays(); setMenu(false); }
  });

  /* ── Ask Olabisi: pre-written answers ── */
  var ask = $('.ask');
  if (ask) {
    var log = $('.ask-log', ask);
    var answers = {
      what: 'I’m a designer and full-stack engineer. I take products from idea to launch: the brand, the interface, and the code underneath. Most of my work sits where design, engineering and AI meet.',
      now: 'Right now: expanding <a href="/works/meshlearn/">MeshLearn</a> (offline learning over BLE mesh), running Greene Studios, exploring AI design tools, and going deeper on Python and machine learning.',
      start: 'Start with <a href="/works/sentry/">Sentry</a>. I pivoted mid-hackathon, rebuilt it in one night on Gemma 4, and it took first place at Build with Gemma. Then <a href="/works/meshlearn/">MeshLearn</a> for the long game.',
      stack: 'Figma for design. React, Next.js and Node.js on the web, React Native on mobile, Python and FastAPI for ML services, PostgreSQL and Supabase for data.',
      hire: 'Yes, for selected freelance work, product collaborations, and engineering roles where design and technical depth both matter. The quickest way in is the <a href="/contact/">project questionnaire</a>.',
      where: 'Nigeria, though I travel a lot. I work remotely with teams anywhere.'
    };
    var openAsk = function (e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      body.classList.remove('search-open');
      body.classList.add('ask-open');
      ask.setAttribute('aria-hidden', 'false');
      setTimeout(function () { var b = $('.ask-qs button', ask); if (b) b.focus(); }, 250);
    };
    $$('[data-ask]').forEach(function (b) { b.addEventListener('click', openAsk); });
    $('.ask-close', ask).addEventListener('click', closeOverlays);
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
        add('me', '');
        log.lastChild.textContent = b.textContent;
        var t = add('them typing', '<i></i><i></i><i></i>');
        setTimeout(function () {
          t.className = 'msg them';
          t.innerHTML = answers[b.dataset.q];
          log.scrollTop = log.scrollHeight;
        }, reduce ? 0 : 450);
      });
    });
  }

  /* ── Site search (loads /search.json on first open) ── */
  var search = $('.search');
  if (search) {
    var input = $('input', search), results = $('.search-results', search), empty = $('.search-empty', search);
    var index = null, sel = 0, hits = [];
    var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var mark = function (s, q) {
      var out = esc(s);
      q.forEach(function (w) { if (w) out = out.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); });
      return out;
    };
    var render = function () {
      var q = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (!index) return;
      hits = !q.length ? index.slice(0, 8) : index.map(function (p) {
        var hay = (p.t + ' ' + p.d + ' ' + p.k).toLowerCase(), score = 0;
        for (var i = 0; i < q.length; i++) {
          if (hay.indexOf(q[i]) === -1) return null;
          score += p.t.toLowerCase().indexOf(q[i]) !== -1 ? 3 : 1;
        }
        return { p: p, s: score };
      }).filter(Boolean).sort(function (a, b) { return b.s - a.s; }).map(function (x) { return x.p; }).slice(0, 10);
      sel = 0;
      results.innerHTML = hits.map(function (p, i) {
        return '<li><a href="' + p.u + '" id="sr-' + i + '" role="option" aria-selected="' + (i === 0) + '"><small>' + esc(p.c) + '</small><b>' + mark(p.t, q) + '</b><span>' + mark(p.d, q) + '</span></a></li>';
      }).join('');
      empty.hidden = hits.length > 0;
      input.setAttribute('aria-activedescendant', hits.length ? 'sr-0' : '');
    };
    var move = function (n) {
      if (!hits.length) return;
      sel = (sel + n + hits.length) % hits.length;
      $$('a', results).forEach(function (a, i) { a.setAttribute('aria-selected', String(i === sel)); if (i === sel) a.scrollIntoView({ block: 'nearest' }); });
      input.setAttribute('aria-activedescendant', 'sr-' + sel);
    };
    var openSearch = function (e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      body.classList.remove('ask-open');
      body.classList.add('search-open');
      setTimeout(function () { input.focus(); }, 30);
      if (!index) {
        fetch('/search.json').then(function (r) { return r.json(); }).then(function (d) { index = d; render(); })
          .catch(function () { empty.hidden = false; empty.textContent = 'Search could not load. Try the Work or Writing pages instead.'; });
      } else render();
    };
    $$('[data-search]').forEach(function (b) { b.addEventListener('click', openSearch); });
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      if (e.key === 'Enter' && hits[sel]) { e.preventDefault(); location.href = hits[sel].u; }
    });
    document.addEventListener('keydown', function (e) {
      var typing = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) openSearch(e);
    });
  }

  /* ── Copy email ── */
  $$('[data-copy]').forEach(function (b) {
    var label = $('span', b);
    b.addEventListener('click', function () {
      var text = b.dataset.copy;
      var ok = function () {
        b.classList.add('ok'); if (label) label.textContent = 'Copied';
        setTimeout(function () { b.classList.remove('ok'); if (label) label.textContent = 'Copy'; }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, function () { location.href = 'mailto:' + text; });
      else location.href = 'mailto:' + text;
    });
  });

  /* ── Tabs ── */
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
    $$('.row-link[data-img]').forEach(function (row) {
      row.addEventListener('mouseenter', function () { peekImg.src = row.dataset.img; peek.classList.add('on'); });
      row.addEventListener('mousemove', function (e) { peek.style.left = (e.clientX + 170) + 'px'; peek.style.top = e.clientY + 'px'; });
      row.addEventListener('mouseleave', function () { peek.classList.remove('on'); });
    });
  }

  /* ── Timeline accordion + year counter ── */
  var tl = $('.tl');
  if (tl) {
    var yearEl = $('.tl-year', tl), dot = $('.tl-track i', tl), btns = $$('.tl-btn', tl);
    var min = +tl.dataset.min, max = +tl.dataset.max, shown = +yearEl.textContent;
    var countTo = function (target) {
      if (reduce) { yearEl.textContent = target; shown = target; return; }
      var from = shown, start = null;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min(1, (ts - start) / 600);
        yearEl.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
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

  /* ── Portrait mono / colour switch ── */
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

  /* ── Lightbox for galleries ── */
  var gallery = $('.gallery');
  if (gallery) {
    var figs = $$('figure', gallery);
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = '<img alt=""><p></p><button class="nav-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M14 8H2.5M7 3.5L2.5 8 7 12.5" stroke="currentColor" stroke-width="1.5"/></svg></button><button class="nav-next" type="button" aria-label="Next image"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true"><path d="M2 8h11.5M9 3.5L13.5 8 9 12.5" stroke="currentColor" stroke-width="1.5"/></svg></button><button class="lb-close" type="button" aria-label="Close"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5"/></svg></button>';
    body.appendChild(lb);
    var lbImg = $('img', lb), lbCap = $('p', lb), idx = 0, back = null;
    var show = function (i) {
      idx = (i + figs.length) % figs.length;
      var im = $('img', figs[idx]);
      lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt;
      lbCap.textContent = $('figcaption', figs[idx]).textContent.replace(/\s+/g, ' ').trim();
    };
    var close = function () { lb.classList.remove('on'); if (back) back.focus(); };
    figs.forEach(function (f, i) {
      var z = document.createElement('button');
      z.type = 'button';
      z.className = 'zoom';
      z.setAttribute('aria-label', 'Enlarge: ' + $('img', f).alt);
      f.appendChild(z);
      z.addEventListener('click', function () { back = z; show(i); lb.classList.add('on'); $('.lb-close', lb).focus(); });
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

  /* ── Project questionnaire: email via FormSubmit ── */
  var form = $('#brief');
  if (form) {
    var status = $('.form-status', form), submit = $('button[type="submit"]', form);
    var groups = $$('fieldset.q[data-required]', form);
    var pbar = $('.progress-bar i'), ptext = $('.progress p');
    var total = groups.length + 1;
    var answered = function (fs) { return !!$('input:checked', fs); };
    var emailOk = function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.value.trim()); };
    var update = function () {
      var n = groups.filter(answered).length + (emailOk() && form.name.value.trim() ? 1 : 0);
      if (pbar) pbar.style.width = (n / total * 100) + '%';
      if (ptext) ptext.textContent = n === total ? 'All set. Send it over.' : n + ' of ' + total + ' answered';
    };
    form.addEventListener('change', update);
    form.addEventListener('input', update);
    update();

    var setErr = function (el, msg) { var e = $('.err', el); if (e) e.textContent = msg || ''; };
    var validate = function () {
      var first = null;
      groups.forEach(function (fs) {
        var ok = answered(fs);
        setErr(fs, ok ? '' : 'Pick at least one option.');
        if (!ok && !first) first = $('input', fs);
      });
      var who = $('#q-you');
      var nameOk = !!form.name.value.trim();
      form.name.setAttribute('aria-invalid', String(!nameOk));
      form.email.setAttribute('aria-invalid', String(!emailOk()));
      setErr(who, !nameOk ? 'Add your name.' : !emailOk() ? 'Add an email address I can reply to.' : '');
      if (!first && !nameOk) first = form.name;
      if (!first && !emailOk()) first = form.email;
      return first;
    };

    var summary = function () {
      var lines = [];
      $$('fieldset.q', form).forEach(function (fs) {
        var q = $('legend', fs).textContent.replace(/^\s*\d+\s*/, '').trim();
        var vals = $$('input:checked', fs).map(function (i) { return i.value; });
        if (vals.length) lines.push(q + ': ' + vals.join(', '));
      });
      ['name', 'email', 'company', 'note'].forEach(function (k) { if (form[k] && form[k].value.trim()) lines.push(k + ': ' + form[k].value.trim()); });
      return lines.join('\n');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.hidden = true;
      var bad = validate();
      if (bad) { bad.focus(); return; }
      if (form._honey && form._honey.value) return;
      var data = {};
      $$('fieldset.q', form).forEach(function (fs) {
        var key = fs.dataset.key; if (!key) return;
        var vals = $$('input:checked', fs).map(function (i) { return i.value; });
        if (vals.length) data[key] = vals.join(', ');
      });
      ['name', 'email', 'company', 'note'].forEach(function (k) { if (form[k] && form[k].value.trim()) data[k] = form[k].value.trim(); });
      data._subject = 'New project brief from ' + data.name;
      data._template = 'table';
      data._captcha = 'false';
      data._replyto = data.email;
      submit.disabled = true;
      var old = submit.innerHTML;
      submit.textContent = 'Sending…';
      fetch(form.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.success === false || j.success === 'false') throw new Error(j.message || 'Request failed');
        });
      }).then(function () {
        store.set('brief-name', data.name.split(' ')[0]);
        location.href = '/thanks/';
      }).catch(function (err) {
        submit.disabled = false;
        submit.innerHTML = old;
        status.hidden = false;
        status.className = 'form-status error';
        var mail = 'mailto:' + form.dataset.email + '?subject=' + encodeURIComponent('Project brief') + '&body=' + encodeURIComponent(summary());
        // FormSubmit explains itself (e.g. the form still needs activating); show its reason as text
        var reason = err && err.message && err.message !== 'Request failed' && err.message !== 'Failed to fetch' ? err.message : '';
        status.innerHTML = 'That didn’t send, and nothing was lost. <a href="' + mail + '">Send the same answers by email instead</a>.' + (reason ? '<br><small class="reason"></small>' : '');
        if (reason) $('.reason', status).textContent = 'Reason: ' + reason;
        status.focus();
      });
    });
  }
  var thanksName = $('[data-thanks-name]');
  if (thanksName) { var n = store.get('brief-name'); if (n) thanksName.textContent = ', ' + n; }

  /* ── Hero: pixel signal bars, one bar lit ── */
  var canvas = $('.hero-canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var G = 48;
    var off = document.createElement('canvas');
    off.width = G; off.height = G;
    var octx = off.getContext('2d');
    var img = octx.createImageData(G, G);
    // four bars: x-start, width, height (grid units), bottom-aligned
    var bars = [[2, 9, 14], [14, 9, 24], [26, 9, 34], [38, 9, 44]];
    var cell = new Int8Array(G * G); // 0 empty, 1 lit bar, 2 outline bar
    bars.forEach(function (b, i) {
      for (var y = G - b[2]; y < G; y++) for (var x = b[0]; x < b[0] + b[1]; x++) {
        var edge = x === b[0] || x === b[0] + b[1] - 1 || y === G - b[2];
        if (i === 0) cell[y * G + x] = 1;
        else if (edge) cell[y * G + x] = 2;
      }
    });
    var yellow = [[255, 210, 63], [255, 222, 102], [245, 196, 0], [255, 232, 140]];
    var blue = [[33, 70, 255], [22, 52, 214], [72, 104, 255]];
    var hash = function (x, y, t) { var n = Math.sin(x * 127.1 + y * 311.7 + t * 74.7) * 43758.5453; return n - Math.floor(n); };
    var size = function () {
      var r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    };
    size();
    window.addEventListener('resize', size);
    var visible = true, frame = 0;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
    var draw = function () {
      frame++;
      var t = Math.floor(frame / 6), data = img.data;
      var searching = (Math.floor(frame / 40) % 4); // outline bars flicker as if searching for signal
      for (var i = 0; i < G * G; i++) {
        var c = cell[i], k = i * 4, px = i % G, py = (i / G) | 0;
        if (!c) { data[k + 3] = 0; continue; }
        var h = hash(px, py, t), col;
        if (c === 1) { if (h < 0.04) { data[k + 3] = 0; continue; } col = yellow[(hash(px + 5, py, t) * yellow.length) | 0]; }
        else {
          var barIdx = px < 14 ? 0 : px < 26 ? 1 : px < 38 ? 2 : 3;
          var on = barIdx === searching ? h > 0.1 : h > 0.55;
          if (!on) { data[k + 3] = 0; continue; }
          col = blue[(hash(px, py + 3, t) * blue.length) | 0];
        }
        data[k] = col[0]; data[k + 1] = col[1]; data[k + 2] = col[2]; data[k + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      var W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      var s = Math.min(W, H) / G;
      ctx.drawImage(off, (W - G * s) / 2, (H - G * s) / 2, G * s, G * s);
    };
    var tick = function () { if (visible) draw(); requestAnimationFrame(tick); };
    draw();
    if (!reduce) requestAnimationFrame(tick);
  }

  /* ── Current year ── */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
