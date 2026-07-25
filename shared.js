// Shared sub-page JS

/* ── THEME TOGGLE ──────────────────── */
const themeBtn = document.getElementById('themeBtn');
if (themeBtn) {
  // Check the initial state set by the inline head script
  const isLight = document.documentElement.dataset.theme === 'light';
  themeBtn.textContent = isLight ? '🌙 Dark' : '☀ Light';

  themeBtn.addEventListener('click', () => {
    const currentIsLight = document.documentElement.dataset.theme === 'light';
    const newTheme = currentIsLight ? 'dark' : 'light';
    
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
    themeBtn.textContent = newTheme === 'light' ? '🌙 Dark' : '☀ Light';
  });

  // Sync theme across multiple tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      document.documentElement.dataset.theme = e.newValue;
      themeBtn.textContent = e.newValue === 'light' ? '🌙 Dark' : '☀ Light';
    }
  });
}
