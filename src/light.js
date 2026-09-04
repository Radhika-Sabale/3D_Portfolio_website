import * as THREE from 'three';

let doorLight = null;

export function createDoorLight(scene, position) {
  doorLight = new THREE.PointLight(0xffffff, 0, 30); // starts OFF (intensity 0)
  doorLight.position.copy(position);
  scene.add(doorLight);
  return doorLight;
}

export function flashDoorLight() {
  if (!doorLight) return;

  const peakIntensity = 18;   // the "blinding" flash
  const normalIntensity = 2;  // settles down to a normal room glow
  const rampUpDuration = 350;
  const fadeDownDuration = 900;
  const startTime = performance.now();

  function rampUp(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / rampUpDuration, 1);
    doorLight.intensity = peakIntensity * t;

    if (t < 1) {
      requestAnimationFrame(rampUp);
    } else {
      const fadeStart = performance.now();
      requestAnimationFrame((n) => fadeDown(n, fadeStart));
    }
  }

  function fadeDown(now, fadeStart) {
    const elapsed = now - fadeStart;
    const t = Math.min(elapsed / fadeDownDuration, 1);
    doorLight.intensity = peakIntensity + (normalIntensity - peakIntensity) * t;

    if (t < 1) {
      requestAnimationFrame((n) => fadeDown(n, fadeStart));
    }
  }

  requestAnimationFrame(rampUp);
}