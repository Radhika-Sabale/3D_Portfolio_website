import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadHDRI, loadRoom, addGround, addSky } from './loaders.js';
import { registerInteractiveObject, setupRaycasting } from './raycast.js';
import { openDoor, toggleDoor, isDoorOpen } from './door.js';
import { createDoorLight, flashDoorLight } from './light.js';
import { moveCameraTo, stopCameraMove } from './camera.js';
import { floatObject } from './float.js';

import { initIntroDashboard } from '../dashboards/intro.js';
import { initProjectDashboard } from '../dashboards/project.js';
import { initGalleryDashboard } from '../dashboards/gallery.js';
import { initContactDashboard } from '../dashboards/contact.js';

// ==========================================
// SCENE, CAMERA & RENDERER SETUP
// ==========================================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
// Starting outside facing the entrance
camera.position.set(30, 0, 5);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ==========================================
// FREE 360 ORBIT CONTROLS
// ==========================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.85;
controls.zoomSpeed = 1.0;
controls.panSpeed = 0.8;
controls.target.set(18.5, 0, -3.9); // Looking at entrance initially
controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep camera above the ground
controls.minDistance = 2.0;
controls.maxDistance = 65.0;

// Cancel any programmed camera fly-through as soon as user drags freely
renderer.domElement.addEventListener('pointerdown', () => {
  stopCameraMove();
});

// Hide the hint on first drag
let hasDragged = false;
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.buttons > 0 && !hasDragged) {
    hasDragged = true;
    const hint = document.getElementById('drag-hint');
    if (hint) hint.classList.add('hidden');
  }
});

// ==========================================
// LIGHTING & ENVIRONMENT
// ==========================================
// Balanced ambient light so folds and crevices have visible depth
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

// Exterior sun / directional light
const dirLight = new THREE.DirectionalLight(0xfff6ea, 2.0);
dirLight.position.set(15, 25, 12);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.bias = -0.0005;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight);

// Interior warm ceiling light to illuminate cloth folds, furniture & room details
const interiorLight = new THREE.PointLight(0xffebd2, 2.8, 35);
interiorLight.position.set(0, 5, -3);
interiorLight.castShadow = true;
interiorLight.shadow.bias = -0.001;
scene.add(interiorLight);

// Subtle soft fill light inside the room
const roomFillLight = new THREE.DirectionalLight(0xdbeafe, 0.7);
roomFillLight.position.set(-10, 8, 8);
scene.add(roomFillLight);

// ==========================================
// ART GALLERY WALL LIGHTING
// ==========================================
// Targeted museum track spotlights illuminating the paintings wall (Z = ~19.25, Y = ~7.3)
const gallerySpotCenter = new THREE.SpotLight(0xfff6ea, 4.2, 32, Math.PI / 3, 0.4, 1.0);
gallerySpotCenter.position.set(0, 11, 10);
gallerySpotCenter.target.position.set(0, 7.3, 19.25);
scene.add(gallerySpotCenter);
scene.add(gallerySpotCenter.target);

const gallerySpotLeft = new THREE.SpotLight(0xfff6ea, 3.4, 30, Math.PI / 3.2, 0.4, 1.0);
gallerySpotLeft.position.set(-9, 11, 10);
gallerySpotLeft.target.position.set(-10, 7.3, 19.25);
scene.add(gallerySpotLeft);
scene.add(gallerySpotLeft.target);

const gallerySpotRight = new THREE.SpotLight(0xfff6ea, 3.4, 30, Math.PI / 3.2, 0.4, 1.0);
gallerySpotRight.position.set(9, 11, 10);
gallerySpotRight.target.position.set(9, 7.3, 19.25);
scene.add(gallerySpotRight);
scene.add(gallerySpotRight.target);

// Soft wall wash to ensure even, vibrant illumination across all artworks
const galleryWallWash = new THREE.DirectionalLight(0xffffff, 1.2);
galleryWallWash.position.set(0, 8, 8);
galleryWallWash.target.position.set(0, 7.3, 19.25);
scene.add(galleryWallWash);
scene.add(galleryWallWash.target);

loadHDRI(scene);
addSky(scene);
addGround(scene, -9);

// ==========================================
// DASHBOARDS
// ==========================================
const introDashboard = initIntroDashboard();
const projectsDashboard = initProjectDashboard();
const galleryDashboard = initGalleryDashboard();
const contactDashboard = initContactDashboard();

const dashboardsMap = {
  intro: introDashboard,
  projects: projectsDashboard,
  gallery: galleryDashboard,
  contact: contactDashboard
};

// ==========================================
// SECTION TARGETS & NAVIGATION
// ==========================================
const SECTION_TARGETS = {
  intro: {
    camera: new THREE.Vector3(30, 0, 5),
    target: new THREE.Vector3(18.5, 0, -3.9),
    title: 'Welcome & Intro',
    subtitle: 'Outside entrance · Floating glowing name & door',
    action: 'About Me',
    tag: 'SECTION 01'
  },
  projects: {
    camera: new THREE.Vector3(-8.5, -0.2, -9.5),
    target: new THREE.Vector3(-17.4, -2.1, -11.9),
    title: 'Developer Workstation',
    subtitle: 'Coding desk · C++, Python & Web implementations',
    action: 'View Projects',
    tag: 'SECTION 02'
  },
  gallery: {
    camera: new THREE.Vector3(1, 1.8, 4),
    target: new THREE.Vector3(1, 4, 19.3),
    title: 'Visual Art Gallery',
    subtitle: 'Art wall · Digital portraits & creative artwork',
    action: 'View Gallery',
    tag: 'SECTION 03'
  },
  contact: {
    camera: new THREE.Vector3(7, 1.0, 5),
    target: new THREE.Vector3(17.2, 1.4, 7.6),
    title: 'Get In Touch',
    subtitle: 'Cozy corner · Connect via LinkedIn, GitHub or Email',
    action: 'Contact Details',
    tag: 'SECTION 04'
  }
};

let currentActiveSection = 'intro';
const navButtons = document.querySelectorAll('.nav-btn');
const cardTag = document.getElementById('card-tag');
const cardTitle = document.getElementById('card-title');
const cardSubtitle = document.getElementById('card-subtitle');
const cardBtnText = document.getElementById('card-btn-text');
const cardActionBtn = document.getElementById('card-action-btn');

function updateActiveUI(sectionKey) {
  currentActiveSection = sectionKey;
  const data = SECTION_TARGETS[sectionKey];

  navButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionKey);
  });

  if (data) {
    if (cardTag) cardTag.textContent = data.tag;
    if (cardTitle) cardTitle.textContent = data.title;
    if (cardSubtitle) cardSubtitle.textContent = data.subtitle;
    if (cardBtnText) cardBtnText.textContent = data.action;
  }
}

if (cardActionBtn) {
  cardActionBtn.addEventListener('click', () => {
    if (dashboardsMap[currentActiveSection]) {
      dashboardsMap[currentActiveSection].open();
    }
  });
}

let doorPivotRef = null;

function flyToSection(sectionKey) {
  const data = SECTION_TARGETS[sectionKey];
  if (!data) return;

  updateActiveUI(sectionKey);

  // If navigating inside (projects, gallery, contact), ensure the door is open
  if (sectionKey !== 'intro' && doorPivotRef && !isDoorOpen()) {
    openDoor(doorPivotRef, { onOpenStart: flashDoorLight });
  }

  moveCameraTo(camera, controls, data.camera, data.target, 1400);
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    flyToSection(btn.dataset.section);
  });
});

// ==========================================
// MODEL LOADING & RAYCASTING
// ==========================================
let updateNameFloat = null;

loadRoom(scene, (assets) => {
  const { model, nameMesh, doorMesh, doorPivot, laptopMesh, galleryMesh, phoneMesh } = assets;
  doorPivotRef = doorPivot;

  if (doorMesh) {
    const doorWorldPos = new THREE.Vector3();
    doorMesh.getWorldPosition(doorWorldPos);
    createDoorLight(scene, doorWorldPos);
  }

  if (nameMesh) {
    updateNameFloat = floatObject(nameMesh, { amplitude: 0.25, speed: 2.8 });
    registerInteractiveObject(nameMesh, () => {
      introDashboard.open();
      updateActiveUI('intro');
    }, 'About Radhika');
  }

  if (doorMesh) {
    registerInteractiveObject(doorMesh, () => {
      toggleDoor(doorPivot, {
        onOpenStart: () => flashDoorLight(),
        onOpenComplete: () => {
          // Smoothly glide camera inside the room
          moveCameraTo(
            camera,
            controls,
            new THREE.Vector3(7, 0, -2.5),
            new THREE.Vector3(0, 0, -5),
            1500
          );
        }
      });
    }, 'Door');
  }

  if (laptopMesh) {
    registerInteractiveObject(laptopMesh, () => {
      flyToSection('projects');
      projectsDashboard.open();
    }, 'Workstation Projects');
  }

  if (galleryMesh) {
    registerInteractiveObject(galleryMesh, () => {
      flyToSection('gallery');
      galleryDashboard.open();
    }, 'Art Gallery');
  }

  if (phoneMesh) {
    registerInteractiveObject(phoneMesh, () => {
      flyToSection('contact');
      contactDashboard.open();
    }, 'Contact Details');
  }
});

setupRaycasting(camera, renderer);

// ==========================================
// WINDOW RESIZE
// ==========================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==========================================
// ANIMATION LOOP
// ==========================================
function animate() {
  requestAnimationFrame(animate);

  controls.update();

  if (updateNameFloat) {
    updateNameFloat(performance.now() * 0.001);
  }

  renderer.render(scene, camera);
}

animate();