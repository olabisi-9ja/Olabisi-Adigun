const root = document.documentElement;
const body = document.body;
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const themeToggle = document.getElementById('themeToggle');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setThemeLabel() {
  if (!themeToggle) return;
  const stored = root.dataset.theme;
  if (stored === 'light') themeToggle.textContent = 'Dark';
  else if (stored === 'dark') themeToggle.textContent = 'Light';
  else themeToggle.textContent = 'Theme';
}

setThemeLabel();

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = root.dataset.theme;
    const next = current === 'light' ? 'dark' : current === 'dark' ? '' : 'light';
    if (next) {
      root.dataset.theme = next;
      localStorage.setItem('theme', next);
    } else {
      delete root.dataset.theme;
      localStorage.removeItem('theme');
    }
    setThemeLabel();
  });
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    });
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }
  });
}

window.addEventListener('load', () => {
  body.classList.add('is-ready');
});

if (!prefersReducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('in'));
}
