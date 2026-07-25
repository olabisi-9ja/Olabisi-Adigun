const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

const themeBtn = document.getElementById('themeBtn');

function updateThemeButton() {
 if (!themeBtn) return;
 const current = document.documentElement.dataset.theme;
 if (current === 'light') themeBtn.textContent = 'Dark';
 else if (current === 'dark') themeBtn.textContent = 'Light';
 else themeBtn.textContent = 'Theme';
}

updateThemeButton();

if (themeBtn) {
 themeBtn.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'light' ? 'dark' : current === 'dark' ? '' : 'light';
  if (next) {
   document.documentElement.dataset.theme = next;
   localStorage.setItem('theme', next);
  } else {
   delete document.documentElement.dataset.theme;
   localStorage.removeItem('theme');
  }
  updateThemeButton();
 });

 window.addEventListener('storage', (event) => {
  if (event.key === 'theme') {
   if (event.newValue) document.documentElement.dataset.theme = event.newValue;
   else delete document.documentElement.dataset.theme;
   updateThemeButton();
  }
 });
}
