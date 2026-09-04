let isOpen = false;
let isAnimating = false;

export function toggleDoor(doorPivot, options = {}) {
  if (!doorPivot || isAnimating) return;

  const opening = !isOpen; // true if this click is OPENING the door
  isAnimating = true;

  const targetRotation = isOpen ? 0 : -Math.PI / 2; // unchanged — your working version
  const startRotation = doorPivot.rotation.y;
  const duration = 1000; // slowed slightly to 1s so the light/camera feel less rushed
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