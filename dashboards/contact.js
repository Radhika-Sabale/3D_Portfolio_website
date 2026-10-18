export function initContactDashboard() {
  const dashboard = document.getElementById('contact-dashboard');
  const closeBtn = document.getElementById('close-contact');

  function open() {
    if (dashboard) dashboard.classList.remove('hidden');
  }

  function close() {
    if (dashboard) dashboard.classList.add('hidden');
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (dashboard) {
    dashboard.addEventListener('click', (e) => {
      if (e.target === dashboard) close();
    });
  }

  return { open, close };
}
