import * as THREE from 'three';

// Waypoints along the room tour
// 0.00: Outside entrance (Intro)
// 0.22: Approaching doorway
// 0.38: Entering hallway
// 0.55: Coding workstation & laptop (Projects)
// 0.78: Art wall & paintings (Gallery)
// 1.00: Cozy corner with telephone & bookshelf (Contact)

export const SECTIONS = {
  intro: { progress: 0.0, title: 'Welcome & Intro', subtitle: 'Step into my 3D creative space', action: 'About Me' },
  projects: { progress: 0.55, title: 'Developer Workstation', subtitle: 'Coding projects in C++, Python & Web', action: 'View Projects' },
  gallery: { progress: 0.78, title: 'Visual Art Gallery', subtitle: 'Digital illustrations & artworks', action: 'View Gallery' },
  contact: { progress: 1.0, title: 'Get In Touch', subtitle: 'Connect via LinkedIn, GitHub or Email', action: 'Contact Details' }
};

export class DragTour {
  constructor(camera, renderer, options = {}) {
    this.camera = camera;
    this.renderer = renderer;
    this.doorPivot = options.doorPivot || null;
    this.doorLight = options.doorLight || null;
    this.onProgressChange = options.onProgressChange || null;
    this.onSectionChange = options.onSectionChange || null;

    // Spline curve for camera position
    this.cameraCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(30, 0, 5),       // 0.00: Intro exterior
      new THREE.Vector3(20, -0.2, -3.5), // 0.22: Door entrance
      new THREE.Vector3(8, -0.6, -3),    // 0.38: Inside hallway
      new THREE.Vector3(-7, -0.8, -9),   // 0.55: Workstation / Desk
      new THREE.Vector3(0, 1.2, 4),      // 0.78: Art gallery wall
      new THREE.Vector3(7, 0.2, 5.5)     // 1.00: Cozy corner & telephone
    ]);

    // Spline curve for camera lookAt target
    this.targetCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(18.5, 1.5, -3.9),// 0.00: Looking at entrance & name
      new THREE.Vector3(10, 0, -3.5),    // 0.22: Looking through door
      new THREE.Vector3(-6, -1, -8),     // 0.38: Looking toward desk
      new THREE.Vector3(-17.4, -2.1, -12),// 0.55: Looking at laptop screen
      new THREE.Vector3(1, 4, 19.3),     // 0.78: Looking up at art wall
      new THREE.Vector3(17.2, 1.4, 7.6)  // 1.00: Looking at telephone
    ]);

    // Progress state [0, 1]
    this.progress = 0.0;
    this.targetProgress = 0.0;
    this.currentLookAt = new THREE.Vector3(18.5, 1.5, -3.9);

    // Drag interaction state
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.velocity = 0;
    this.sensitivity = 0.0016; // smooth responsive scrub speed
    this.hasDraggedOnce = false;

    // Parallax mouse tilt
    this.mouseX = 0;
    this.mouseY = 0;
    this.parallaxX = 0;
    this.parallaxY = 0;

    this.activeSection = 'intro';

    this.initEvents();
  }

  setDoorPivot(pivot) {
    this.doorPivot = pivot;
  }

  setDoorLight(light) {
    this.doorLight = light;
  }

  initEvents() {
    const el = window;

    el.addEventListener('pointerdown', (e) => {
      // Don't intercept clicks inside modals or dashboard buttons
      if (e.target.closest('.dashboard-overlay') || e.target.closest('.nav-btn') || e.target.closest('.action-btn')) {
        return;
      }
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.velocity = 0;
    });

    el.addEventListener('pointermove', (e) => {
      // Mouse parallax normalization (-1 to 1)
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

      if (!this.isDragging) return;

      const deltaX = e.clientX - this.lastX;
      const deltaY = e.clientY - this.lastY;

      // Primary scrub is horizontal drag (right moves forward, left moves back)
      // Vertical drag also adds a natural touch
      const move = deltaX * 1.0 - deltaY * 0.4;
      const progressDelta = move * this.sensitivity;

      this.targetProgress = THREE.MathUtils.clamp(this.targetProgress + progressDelta, 0, 1);
      this.velocity = progressDelta * 0.5;

      this.lastX = e.clientX;
      this.lastY = e.clientY;

      if (!this.hasDraggedOnce && Math.abs(e.clientX - this.startX) > 8) {
        this.hasDraggedOnce = true;
        const hint = document.getElementById('drag-hint');
        if (hint) hint.classList.add('hidden');
      }
    });

    const endDrag = () => {
      this.isDragging = false;
    };

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    // Mouse wheel as optional secondary control
    window.addEventListener('wheel', (e) => {
      if (document.querySelector('.dashboard-overlay:not(.hidden)')) return;
      this.targetProgress = THREE.MathUtils.clamp(this.targetProgress + e.deltaY * 0.0004, 0, 1);
    }, { passive: true });
  }

  goToSection(sectionName) {
    if (SECTIONS[sectionName]) {
      this.targetProgress = SECTIONS[sectionName].progress;
      this.velocity = 0;
    }
  }

  goToProgress(target) {
    this.targetProgress = THREE.MathUtils.clamp(target, 0, 1);
    this.velocity = 0;
  }

  getActiveSection(p) {
    if (p < 0.28) return 'intro';
    if (p < 0.68) return 'projects';
    if (p < 0.88) return 'gallery';
    return 'contact';
  }

  update() {
    // Apply inertia when not dragging
    if (!this.isDragging && Math.abs(this.velocity) > 0.00005) {
      this.targetProgress = THREE.MathUtils.clamp(this.targetProgress + this.velocity, 0, 1);
      this.velocity *= 0.88; // inertia friction
    }

    // Smooth lerp toward target progress
    this.progress += (this.targetProgress - this.progress) * 0.085;

    // Camera spline interpolation
    const pathPoint = this.cameraCurve.getPoint(this.progress);
    const targetPoint = this.targetCurve.getPoint(this.progress);

    // Subtle parallax tilt
    this.parallaxX += (this.mouseX * 0.45 - this.parallaxX) * 0.05;
    this.parallaxY += (this.mouseY * 0.35 - this.parallaxY) * 0.05;

    this.camera.position.set(
      pathPoint.x + this.parallaxX,
      pathPoint.y + this.parallaxY,
      pathPoint.z
    );

    // Smooth lookAt interpolation
    this.currentLookAt.lerp(targetPoint, 0.1);
    this.camera.lookAt(this.currentLookAt);

    // Sync door swing & lighting with progress
    // Between 0.12 and 0.32, the door swings open
    if (this.doorPivot) {
      if (this.progress < 0.12) {
        this.doorPivot.rotation.y = 0;
      } else if (this.progress <= 0.32) {
        const doorFactor = (this.progress - 0.12) / 0.20;
        const eased = 1 - Math.pow(1 - doorFactor, 3);
        this.doorPivot.rotation.y = - (Math.PI / 2) * eased;
      } else {
        this.doorPivot.rotation.y = -Math.PI / 2;
      }
    }

    // Door light glow sync
    if (this.doorLight) {
      if (this.progress < 0.10) {
        this.doorLight.intensity = 0;
      } else if (this.progress <= 0.35) {
        const lightFactor = (this.progress - 0.10) / 0.25;
        this.doorLight.intensity = Math.sin(lightFactor * Math.PI) * 4.5 + 1.0;
      } else {
        this.doorLight.intensity = 1.5;
      }
    }

    // Determine current active section
    const currentSection = this.getActiveSection(this.progress);
    if (currentSection !== this.activeSection) {
      this.activeSection = currentSection;
      if (this.onSectionChange) this.onSectionChange(currentSection, SECTIONS[currentSection]);
    }

    if (this.onProgressChange) {
      this.onProgressChange(this.progress, this.activeSection);
    }
  }
}
