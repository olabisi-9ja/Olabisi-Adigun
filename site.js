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
  /* ── Loader: the mark shimmers until the window has loaded, once per session ── */
  var hero = $('.hero'), heroStarted = false;
  var startHero = function () {
    if (heroStarted) return;
    heroStarted = true;
    if (hero) hero.classList.add('in');
    document.dispatchEvent(new CustomEvent('hero:start'));
  };
  var loader = $('.loader');
  if (loader && getComputedStyle(loader).display !== 'none') {
    var finish = function () {
      // keep it up long enough to read as intentional, not as a flash
      var wait = Math.max(0, (reduce ? 400 : 1200) - performance.now());
      setTimeout(function () {
        loader.classList.add('done');
        try { sessionStorage.setItem('loaded', '1'); } catch (e) {}
        setTimeout(startHero, reduce ? 0 : 420);
        setTimeout(function () { loader.parentNode && loader.parentNode.removeChild(loader); }, 1000);
      }, wait);
    };
    if (document.readyState === 'complete') finish(); else window.addEventListener('load', finish);
  } else {
    if (loader) loader.parentNode.removeChild(loader);
    requestAnimationFrame(function () { setTimeout(startHero, 60); });
  }

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

  /* ── Hero: ID tag on a lanyard ──
     A small verlet rope hangs from above the viewport. The tag is a rigid
     two-point body (buckle + centre) on the end of it, so it drops, catches
     on the strap, swings and settles like the real thing. Drag it to throw it. */
  var stage = $('.tag-stage');
  if (stage) {
    var tagEl = $('.tag', stage), strapSvg = $('.tag-strap', stage), strapPath = $('#strap-path');
    var band = $('.strap-band', stage), edge = $('.strap-edge', stage), strapText = $('.strap-text', stage);
    var AX = 0.51, AY = 0.03, RATIO = 1448 / 595; // buckle position in the tag image, image aspect
    var SEGS = 12, DT = 1 / 120, G = 2400, AIR = 0.994;
    var pts = [], links = [], dim = null, running = false, dropped = false, still = 0, visibleTag = true, drag = null, acc = 0, last = 0;
    var P = function (x, y, w) { return { x: x, y: y, px: x, py: y, w: w }; };

    var measure = function () {
      var W = stage.clientWidth, H = Math.min(stage.clientHeight, window.innerHeight), small = W < 760;
      var th = small ? H * 0.36 : H * 0.58;
      var tw = th / RATIO, maxW = small ? W * 0.4 : W * 0.21;
      if (tw > maxW) { tw = maxW; th = tw * RATIO; }
      var top = small ? 112 : H * 0.13;
      return { W: W, H: H, tw: tw, th: th, ax: W * (small ? 0.5 : 0.75), ay: -320, top: top, len: top + 320, d: th * 0.47 };
    };
    var build = function (offY, offX) {
      dim = measure();
      tagEl.style.width = dim.tw + 'px';
      // on phones the tag gets its own room above the headline instead of covering it
      hero.style.setProperty('--tag-room', Math.round(dim.top + dim.th + 28) + 'px');
      tagEl.style.transformOrigin = (AX * 100) + '% ' + (AY * 100) + '%';
      var sw = dim.tw * 0.13;
      band.style.strokeWidth = sw; edge.style.strokeWidth = sw;
      strapText.style.fontSize = (sw * 0.42) + 'px';
      pts = []; links = [];
      var bx = dim.ax + (offX || 0), by = dim.ay + dim.len + (offY || 0);
      for (var i = 0; i <= SEGS; i++) {
        var t = i / SEGS;
        pts.push(P(dim.ax + (bx - dim.ax) * t, dim.ay + (by - dim.ay) * t, i === 0 ? 0 : 1));
      }
      pts[SEGS].w = 0.12;                        // buckle: heavy
      pts.push(P(bx, by + dim.d, 0.12));         // tag centre: heavy
      var seg = dim.len / SEGS;
      for (var k = 0; k < SEGS; k++) links.push({ a: k, b: k + 1, l: seg, slack: true });
      links.push({ a: SEGS, b: SEGS + 1, l: dim.d, slack: false });
    };
    var step = function () {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (!p.w) continue;
        var vx = (p.x - p.px) * AIR, vy = (p.y - p.py) * AIR;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + G * DT * DT;
      }
      // damp the tag's twist against the strap so it swings, not flails
      var bk = pts[SEGS], ct = pts[SEGS + 1];
      ct.px += ((ct.x - ct.px) - (bk.x - bk.px)) * 0.05;
      ct.py += ((ct.y - ct.py) - (bk.y - bk.py)) * 0.05;
      if (drag) { ct.x = drag.x; ct.y = drag.y; }
      for (var it = 0; it < 14; it++) {
        for (var j = 0; j < links.length; j++) {
          var L = links[j], a = pts[L.a], b = pts[L.b];
          var dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy) || 1e-6;
          if (L.slack && dist <= L.l) continue;   // a strap can go slack, never stretch
          var wa = a.w, wb = (drag && L.b === SEGS + 1) ? 0 : b.w, ws = wa + wb;
          if (!ws) continue;
          var diff = (dist - L.l) / dist / ws * (L.slack ? 0.9 : 1);
          a.x += dx * diff * wa; a.y += dy * diff * wa;
          b.x -= dx * diff * wb; b.y -= dy * diff * wb;
        }
      }
    };
    var render = function () {
      var b = pts[SEGS], c = pts[SEGS + 1];
      var ang = Math.atan2(c.x - b.x, c.y - b.y);
      tagEl.style.transform = 'translate(' + (b.x - AX * dim.tw).toFixed(2) + 'px,' + (b.y - AY * dim.th).toFixed(2) + 'px) rotate(' + (-ang * 180 / Math.PI).toFixed(3) + 'deg)';
      // strap: smooth curve through the rope, tucked a little over the buckle
      var ux = (c.x - b.x) / dim.d, uy = (c.y - b.y) / dim.d, tuck = dim.th * 0.035;
      var r = pts.slice(0, SEGS + 1).concat([{ x: b.x + ux * tuck, y: b.y + uy * tuck }]);
      var d = 'M' + r[0].x.toFixed(1) + ' ' + r[0].y.toFixed(1);
      for (var i = 1; i < r.length - 1; i++) {
        d += ' Q' + r[i].x.toFixed(1) + ' ' + r[i].y.toFixed(1) + ' ' + ((r[i].x + r[i + 1].x) / 2).toFixed(1) + ' ' + ((r[i].y + r[i + 1].y) / 2).toFixed(1);
      }
      d += ' L' + r[r.length - 1].x.toFixed(1) + ' ' + r[r.length - 1].y.toFixed(1);
      strapPath.setAttribute('d', d);
    };
    var loop = function (now) {
      if (!running) return;
      if (!visibleTag) { running = false; return; }  // off-screen: sleep, the observer wakes it
      acc += Math.min(0.05, (now - (last || now)) / 1000);
      while (acc >= DT) { step(); acc -= DT; }
      render();
      var c = pts[SEGS + 1], v = Math.abs(c.x - c.px) + Math.abs(c.y - c.py);
      still = (v < 0.01 && !drag) ? still + 1 : 0;
      if (still > 90) { running = false; return; }  // asleep until touched
      last = now;
      requestAnimationFrame(loop);
    };
    var wake = function () { if (!running) { running = true; still = 0; last = 0; acc = 0; requestAnimationFrame(loop); } };
    var show = function () { tagEl.classList.add('on'); strapSvg.classList.add('on'); };

    build(0, 0);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visibleTag = en[en.length - 1].isIntersecting; if (visibleTag && dropped) wake(); }).observe(stage);
    var drop = function () {
      if (dropped) return;
      dropped = true;
      if (reduce) { build(0, 0); render(); show(); return; }
      build(-(dim.len + dim.th + 160), dim.tw * 0.25);  // start above the viewport, slightly off-centre
      render(); show(); wake();
    };
    document.addEventListener('hero:start', drop);
    if (heroStarted) drop();

    var rw;
    window.addEventListener('resize', function () {
      clearTimeout(rw);
      rw = setTimeout(function () { if (Math.abs(measure().W - dim.W) < 2 && Math.abs(measure().H - dim.H) < 80) return; build(0, 0); render(); if (dropped && !reduce) wake(); }, 120);
    });

    var toStage = function (e) { var r = stage.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    tagEl.addEventListener('pointerdown', function (e) {
      if (reduce || !dropped) return;
      var p = toStage(e), c = pts[SEGS + 1];
      drag = { ox: c.x - p.x, oy: c.y - p.y, x: c.x, y: c.y };
      tagEl.classList.add('grab');
      try { tagEl.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
      wake();
    });
    tagEl.addEventListener('pointermove', function (e) {
      if (!drag) {
        // brushing past it with the cursor nudges it, like flicking a real badge
        if (reduce || !dropped || e.pointerType !== 'mouse') return;
        var c = pts[SEGS + 1], k = 0.06;
        c.px -= Math.max(-40, Math.min(40, e.movementX)) * k;
        c.py -= Math.max(-40, Math.min(40, e.movementY)) * k * 0.4;
        wake();
        return;
      }
      var p = toStage(e);
      drag.x = p.x + drag.ox; drag.y = p.y + drag.oy;
    });
    var release = function () { if (!drag) return; drag = null; tagEl.classList.remove('grab'); wake(); };
    tagEl.addEventListener('pointerup', release);
    tagEl.addEventListener('pointercancel', release);
  }

  /* ── Mockup marquee → viewer ── */
  var mq = $('[data-mq]'), lb = $('.lb');
  if (mq && lb) {
    var shots = $$('.mq-track:not([aria-hidden]) .mq-item', mq).map(function (b) {
      var im = $('img', b);
      return { src: im.getAttribute('src'), w: im.getAttribute('width'), h: im.getAttribute('height'), title: b.getAttribute('data-title'), sub: b.getAttribute('data-sub'), href: b.getAttribute('data-href') };
    });
    var lbImg = $('.lb-img', lb), lbTitle = $('.lb-title', lb), lbSub = $('.lb-sub', lb), lbCount = $('.lb-count', lb), lbLink = $('.lb-link', lb), lbClose = $('.lb-close', lb);
    var cur = 0, lbBack = null, lbTimer;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var paint = function (i, dir) {
      cur = (i + shots.length) % shots.length;
      var s = shots[cur];
      lbImg.setAttribute('width', s.w); lbImg.setAttribute('height', s.h);
      lbImg.src = s.src; lbImg.alt = s.title + ': ' + s.sub;
      lbTitle.textContent = s.title; lbSub.textContent = s.sub;
      lbCount.textContent = pad(cur + 1) + ' / ' + pad(shots.length);
      lbLink.href = s.href;
      lbLink.firstChild.nodeValue = s.href === '/works/' ? 'See all the work ' : 'See the case study ';
      if (dir && !reduce) {
        lbImg.style.setProperty('--from', (dir * 32) + 'px');
        lbImg.classList.remove('swap'); void lbImg.offsetWidth; lbImg.classList.add('swap');
      }
    };
    var openLb = function (i, from) {
      clearTimeout(lbTimer);
      lbBack = document.activeElement;
      mq.classList.add('paused');
      lb.hidden = false;
      paint(i, 0);
      if (!reduce && from && lbImg.animate) {
        var r0 = from.getBoundingClientRect(), r1 = lbImg.getBoundingClientRect();
        if (r1.width && r1.height) {
          lbImg.animate([
            { transform: 'translate(' + (r0.left - r1.left) + 'px,' + (r0.top - r1.top) + 'px) scale(' + (r0.width / r1.width) + ',' + (r0.height / r1.height) + ')' },
            { transform: 'none' }
          ], { duration: 560, easing: 'cubic-bezier(.2,.7,.1,1)' });
        }
      }
      requestAnimationFrame(function () { lb.classList.add('open'); });
      lbClose.focus({ preventScroll: true });
    };
    var closeLb = function () {
      if (lb.hidden) return;
      lb.classList.remove('open');
      lbTimer = setTimeout(function () { lb.hidden = true; mq.classList.remove('paused'); }, reduce ? 0 : 320);
      if (lbBack && lbBack.focus) lbBack.focus({ preventScroll: true });
    };
    mq.addEventListener('click', function (e) {
      var b = e.target.closest('.mq-item');
      if (b) openLb(+b.getAttribute('data-i'), $('img', b));
    });
    $('.lb-prev', lb).addEventListener('click', function () { paint(cur - 1, -1); });
    $('.lb-next', lb).addEventListener('click', function () { paint(cur + 1, 1); });
    $$('[data-lb-close]', lb).forEach(function (el) { el.addEventListener('click', closeLb); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLb(); }
      else if (e.key === 'ArrowLeft') paint(cur - 1, -1);
      else if (e.key === 'ArrowRight') paint(cur + 1, 1);
      else if (e.key === 'Tab') {
        var f = $$('button, a[href]', lb).filter(function (el) { return el.offsetParent !== null; });
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    var sx = null;
    lb.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') sx = e.clientX; });
    lb.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) paint(cur + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
  }

  /* ── Current year ── */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
