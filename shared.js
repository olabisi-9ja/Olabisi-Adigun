/* shared sub-page nav + theme JS */
(function(){
  // Theme persistence
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.dataset.theme = saved;

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('themeBtn');
    if(btn){
      btn.textContent = document.documentElement.dataset.theme === 'dark' ? '☀ Light' : '☾ Dark';
      btn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        localStorage.setItem('theme', next);
        btn.textContent = next === 'dark' ? '☀ Light' : '☾ Dark';
      });
    }
  });
})();
