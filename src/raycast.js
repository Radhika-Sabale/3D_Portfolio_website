import * as THREE from 'three';

export const raycaster = new THREE.Raycaster();
export const mouse = new THREE.Vector2();

let nameMesh = null;
let doorMesh = null;

export function setNameMesh(mesh) {
  nameMesh = mesh;
}

export function setDoorMesh(mesh) {
  doorMesh = mesh;
}

export function setupRaycasting(camera, renderer, onNameClick, onDoorClick) {
  window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    if (nameMesh) {
      const nameHit = raycaster.intersectObject(nameMesh, true);
      if (nameHit.length > 0) {
        onNameClick();
        return;
      }
    }

    if (doorMesh) {
      const doorHit = raycaster.intersectObject(doorMesh, true);
      if (doorHit.length > 0) {
        onDoorClick();
        return;
      }
    }
  });

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    let hovering = false;
    if (nameMesh && raycaster.intersectObject(nameMesh, true).length > 0) hovering = true;
    if (doorMesh && raycaster.intersectObject(doorMesh, true).length > 0) hovering = true;

    renderer.domElement.style.cursor = hovering ? 'pointer' : 'default';
  });
}