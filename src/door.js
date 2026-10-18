let isOpen = false;
let isAnimating = false;

export function isDoorOpen() {
  return isOpen;
}

export function openDoor(doorPivot, options = {}) {
  if (isOpen) {
    if (options.onOpenComplete) options.onOpenComplete();
    return;
  }
  toggleDoor(doorPivot, options);
}

export function toggleDoor(doorPivot, options = {}) {
  if (!doorPivot || isAnimating) return;

  const opening = !isOpen;
  isAnimating = true;

  const targetRotation = isOpen ? 0 : -Math.PI / 2;
  const startRotation = doorPivot.rotation.y;
  const duration = 900;
  const startTime = performance.now();

  if (opening && options.onOpenStart) options.onOpenStart();

  function animateFrame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);

    doorPivot.rotation.y = startRotation + (targetRotation - startRotation) * eased;

    if (t < 1) {
      requestAnimationFrame(animateFrame);
    } else {
      isOpen = !isOpen;
      isAnimating = false;
      if (opening && options.onOpenComplete) options.onOpenComplete();
    }
  }

  requestAnimationFrame(animateFrame);
}