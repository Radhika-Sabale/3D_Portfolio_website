export function floatObject(object, options = {}) {
  const amplitude = options.amplitude ?? 0.15; // how far up/down it bobs (in units)
  const speed = options.speed ?? 1.2;          // how fast it bobs
  const baseY = object.position.y;             // remember its original resting height

  return function updateFloat(time) {
    object.position.y = baseY + Math.sin(time * speed) * amplitude;
  };
}