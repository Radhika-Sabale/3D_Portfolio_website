export function initGalleryDashboard() {
  const dashboard = document.getElementById('gallery-dashboard');
  const closeBtn = document.getElementById('close-gallery');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeLightbox = document.getElementById('close-lightbox');

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

  // Lightbox handlers
  document.querySelectorAll('.gallery-card img').forEach((img) => {
    img.addEventListener('click', () => {
      if (lightbox && lightboxImg && lightboxCaption) {
        lightboxImg.src = img.src;
        lightboxCaption.textContent = img.alt || 'Artwork';
        lightbox.classList.remove('hidden');
      }
    });
  });

  if (closeLightbox) {
    closeLightbox.addEventListener('click', () => {
      lightbox.classList.add('hidden');
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.classList.add('hidden');
    });
  }

  return { open, close };
}
