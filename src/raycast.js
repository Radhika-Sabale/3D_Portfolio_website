import * as THREE from 'three';

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

const interactiveObjects = [];

export function registerInteractiveObject(mesh, callback, hoverTitle = '') {
  if (!mesh) return;
  interactiveObjects.push({ mesh, callback, hoverTitle });
}

export function setupRaycasting(camera, renderer) {
  let downX = 0;
  let downY = 0;

  renderer.domElement.addEventListener('pointerdown', (e) => {
    downX = e.clientX;
    downY = e.clientY;
  });

  renderer.domElement.addEventListener('pointerup', (e) => {
    // Only count as click if pointer barely moved (not a drag)
    const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (dist > 6) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    for (const item of interactiveObjects) {
      const hits = raycaster.intersectObject(item.mesh, true);
      if (hits.length > 0) {
        item.callback();
        return;
      }
    }
  });

  renderer.domElement.addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let hovering = false;
    for (const item of interactiveObjects) {
      if (raycaster.intersectObject(item.mesh, true).length > 0) {
        hovering = true;
        break;
      }
    }

    renderer.domElement.style.cursor = hovering ? 'pointer' : 'default';
  });
}