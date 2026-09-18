const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(pointer: fine)').matches;

const curtain = document.getElementById('curtain');
if (curtain) {
  requestAnimationFrame(() => {
    setTimeout(() => {
      curtain.classList.add('gone');
      document.getElementById('heroHeadline')?.classList.add('in');
      document.getElementById('heroPhoto')?.classList.add('in');
      
      const tagline = document.getElementById('heroTagline');
      if(tagline) tagline.classList.add('in');
      
      const metrics = document.querySelector('.hero-below');
      if(metrics) metrics.classList.add('in');
      
      document.getElementById('heroMeta')?.classList.add('in');
      setTimeout(() => curtain.remove(), 1100);
    }, 50);
  });
}

// reveals
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// count up animation
const countUpObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll('.count-up');
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        let count = 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        const updateCount = () => {
          count += increment;
          if (count < target) {
            counter.innerText = Math.ceil(count);
            requestAnimationFrame(updateCount);
          } else {
            counter.innerText = target;
          }
        };
        updateCount();
      });
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
const metricsSection = document.querySelector('.hero-metrics');
if (metricsSection) countUpObserver.observe(metricsSection);

// section counter
const mainSections = ['hero','products','client-work','now','journey','drafts','contact'];
const counterEl = document.getElementById('sectionCounter');
const secObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting){
      const idx = mainSections.indexOf(e.target.id);
      if (idx > -1 && counterEl) counterEl.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(mainSections.length).padStart(2, '0');
    }
  });
}, { threshold: 0.5 });
mainSections.forEach(id => { const el = document.getElementById(id); if (el) secObserver.observe(el); });

// custom cursor
// Only hide the native cursor once we know the custom cursor will actually run,
// so a JS failure never leaves pointer users with an invisible cursor.
if (fine){
  document.documentElement.classList.add('cc');
  const cursor = document.getElementById('cursor');
  const cursorText = document.getElementById('cursor-text');
  
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursorText.style.left = e.clientX + 'px';
    cursorText.style.top = e.clientY + 'px';
  });
  
  document.querySelectorAll('a, button, .premium-card .img-wrap').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hoverable');
      const text = el.getAttribute('data-cursor-text');
      if(text) {
        cursorText.textContent = text;
        cursorText.classList.add('show');
      }
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hoverable');
      cursorText.classList.remove('show');
    });
  });
}

// magnetic elements
if (fine && !reduceMotion){
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.3;
      const y = (e.clientY - r.top - r.height / 2) * 0.3;
      el.style.transition = 'none';
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .45s cubic-bezier(.16,1,.3,1)';
      el.style.transform = 'translate(0, 0)';
    });
  });
}

// Scramble text effect on hover
const scrambleElements = document.querySelectorAll('.scramble-on-hover');
const chars = '!<>-_\\\\/[]{}—=+*^?#________';
scrambleElements.forEach(el => {
  const originalText = el.innerText;
  let interval = null;
  el.addEventListener('mouseenter', () => {
    let iteration = 0;
    clearInterval(interval);
    interval = setInterval(() => {
      el.innerText = originalText.split('').map((letter, index) => {
        if(index < iteration) {
          return originalText[index];
        }
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      if(iteration >= originalText.length){ 
        clearInterval(interval);
      }
      iteration += 1 / 2;
    }, 30);
  });
  el.addEventListener('mouseleave', () => {
    clearInterval(interval);
    el.innerText = originalText;
  });
});

// Timeline Scroll Spy
const timelineBeats = document.querySelectorAll('.timeline-beat');
const dateItems = document.querySelectorAll('.date-item');
const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      dateItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-target') === entry.target.id) {
          item.classList.add('active');
          if(window.innerWidth <= 768){
            const container = item.parentElement;
            container.scrollTo({
              left: item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2,
              behavior: 'smooth'
            });
          }
        }
      });
    }
  });
}, { rootMargin: '-30% 0px -70% 0px' });

timelineBeats.forEach(beat => timelineObserver.observe(beat));

dateItems.forEach(item => {
  item.addEventListener('click', () => {
    const targetId = item.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

// Methodology timeline: fill the bar with the accent color as you scroll
const methTrack = document.querySelector('.methodology-container');
const methFill = document.querySelector('.meth-progress-fill');
if (methTrack && methFill) {
  const methSteps = Array.from(methTrack.querySelectorAll('.meth-step'));
  let methTicking = false;

  const updateMethFill = () => {
    methTicking = false;
    const rect = methTrack.getBoundingClientRect();
    // Fill follows a "read line" a bit below the viewport middle
    const anchor = window.innerHeight * 0.55;
    const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));
    methFill.style.height = (progress * 100).toFixed(2) + '%';

    // Light up each step once the fill reaches its marker (markers sit 10px below each step's top)
    methSteps.forEach(step => {
      const markerY = step.getBoundingClientRect().top + 10;
      step.classList.toggle('lit', markerY <= anchor);
    });
  };

  const requestMethUpdate = () => {
    if (!methTicking) {
      methTicking = true;
      requestAnimationFrame(updateMethFill);
    }
  };

  window.addEventListener('scroll', requestMethUpdate, { passive: true });
  window.addEventListener('resize', requestMethUpdate);
  updateMethFill();
}




// hamburger / sidebar
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
function openMenu(){ hamburger.classList.add('open'); sidebar.classList.add('open'); backdrop.classList.add('open'); }
function closeMenu(){ hamburger.classList.remove('open'); sidebar.classList.remove('open'); backdrop.classList.remove('open'); }
hamburger.addEventListener('click', () => { sidebar.classList.contains('open') ? closeMenu() : openMenu(); });
document.getElementById('closeSidebar').addEventListener('click', closeMenu);
backdrop.addEventListener('click', closeMenu);
document.querySelectorAll('.sidebar-link').forEach(a => a.addEventListener('click', closeMenu));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

// back to top
document.getElementById('backtotop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── THEME TOGGLE (index) ─────────────────────── */
const idxThemeBtn = document.getElementById('themeBtn');
if (idxThemeBtn) {
  const syncThemeBtn = () => {
    const isLight = document.documentElement.dataset.theme === 'light';
    idxThemeBtn.textContent = isLight ? 'Dark mode' : 'Light mode';
    idxThemeBtn.setAttribute('aria-pressed', String(isLight));
  };
  syncThemeBtn();
  idxThemeBtn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    syncThemeBtn();
  });
}

/* ── DYNAMIC COPYRIGHT YEAR ───────────────────── */
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

/* ── SCROLL PROGRESS BAR ──────────────────────── */
const scrollBar = document.getElementById('scroll-progress');
if (scrollBar) {
  let ticking = false;
  const updateBar = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    scrollBar.style.transform = `scaleX(${(pct / 100).toFixed(4)})`;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateBar); } }, { passive: true });
  updateBar();
}

/* ── COPY EMAIL BUTTON ────────────────────────── */
document.querySelectorAll('[data-copy-email]').forEach(btn => {
  btn.addEventListener('click', async () => {
    const email = btn.getAttribute('data-copy-email');
    try {
      await navigator.clipboard.writeText(email);
      const old = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = old; }, 1600);
    } catch (e) { /* clipboard unavailable (permissions/insecure) */ }
  });
});

/* ── MOBILE STICKY CTA (hide when contact visible) ── */
const mobileCta = document.getElementById('mobile-cta');
const contactSec = document.getElementById('contact');
if (mobileCta && contactSec && 'IntersectionObserver' in window) {
  new IntersectionObserver((entries) => {
    mobileCta.classList.toggle('hidden', entries[0].isIntersecting);
  }, { threshold: 0.15 }).observe(contactSec);
}
