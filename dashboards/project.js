export function initProjectDashboard() {
  const dashboard = document.getElementById('projects-dashboard');
  const closeBtn = document.getElementById('close-projects');

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
