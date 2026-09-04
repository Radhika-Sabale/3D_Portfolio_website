import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadHDRI, loadRoom, addGround, addSky } from './loaders.js';
import { setupRaycasting, setNameMesh, setDoorMesh } from './raycast.js';
import { toggleDoor } from './door.js';
import { createDoorLight, flashDoorLight } from './light.js';
import { moveCameraTo } from './camera.js';
import { floatObject } from './float.js';

// SCENE
const scene = new THREE.Scene();

// CAMERA
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(30, 0, 5);
camera.lookAt(0, 0, 30);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// LIGHTING
const ambient = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ENVIRONMENT
loadHDRI(scene);
addSky(scene);
addGround(scene, -9);

// Placeholder inside-room camera target
const insideCameraPosition = new THREE.Vector3(7, 0, -2.5);
const insideCameraTarget = new THREE.Vector3(0, 0, -5);

// ROOM — single load call, everything wired up together
let doorPivot = null;
let updateNameFloat = null; // declared up here, BEFORE animate() ever runs

loadRoom(scene, (model, nameMesh, doorMesh, pivot) => {
  setNameMesh(nameMesh);
  setDoorMesh(doorMesh);
  doorPivot = pivot;

  if (nameMesh) {
    updateNameFloat = floatObject(nameMesh, { amplitude: 0.2, speed: 3 });
  }

  if (doorMesh) {
    const doorWorldPos = new THREE.Vector3();
    doorMesh.getWorldPosition(doorWorldPos);
    createDoorLight(scene, doorWorldPos);
  }
});

// RAYCASTING
setupRaycasting(
  camera,
  renderer,
  openDashboard,
  () => toggleDoor(doorPivot, {
    onOpenStart: () => flashDoorLight(),
    onOpenComplete: () => moveCameraTo(camera, controls, insideCameraPosition, insideCameraTarget)
  })
);

// RESIZE FIX
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ANIMATE
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  if (updateNameFloat) updateNameFloat(performance.now() * 0.001);

  renderer.render(scene, camera);
}
animate();

// DASHBOARD
const dashboard = document.getElementById('intro-dashboard');

function openDashboard() {
  dashboard.classList.remove('hidden');
}

function closeDashboard() {
  dashboard.classList.add('hidden');
}

document.getElementById('close-dashboard').addEventListener('click', closeDashboard);

dashboard.addEventListener('click', (e) => {
  if (e.target === dashboard) closeDashboard();
});