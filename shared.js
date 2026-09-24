// Shared sub-page JS

/* ── THEME TOGGLE ──────────────────── */
const themeBtn = document.getElementById('themeBtn');
if (themeBtn) {
  const syncThemeBtn = (theme) => {
    const isLight = theme === 'light';
    themeBtn.textContent = isLight ? 'Dark' : 'Light';
    themeBtn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
  };
  syncThemeBtn(document.documentElement.dataset.theme);

  themeBtn.addEventListener('click', () => {
    const newTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = newTheme;
    try { localStorage.setItem('theme', newTheme); } catch (e) {}
    syncThemeBtn(newTheme);
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      document.documentElement.dataset.theme = e.newValue;
      syncThemeBtn(e.newValue);
    }
  });
}

/* ── DYNAMIC COPYRIGHT YEAR ──────────────────── */
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
