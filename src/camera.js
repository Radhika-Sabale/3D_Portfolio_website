export function moveCameraTo(camera, controls, targetPosition, targetLookAt, duration = 1800) {
  const startPosition = camera.position.clone();
  const startLookAt = controls.target.clone();
  const startTime = performance.now();

  function animateFrame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    camera.position.lerpVectors(startPosition, targetPosition, eased);
    controls.target.lerpVectors(startLookAt, targetLookAt, eased);
    controls.update();

    if (t < 1) {
      requestAnimationFrame(animateFrame);
    }
  }

  requestAnimationFrame(animateFrame);
}