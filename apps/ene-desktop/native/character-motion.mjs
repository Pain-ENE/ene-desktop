// Shared by drawing and native alpha hit testing. Coordinates are source UVs.
export const RIGS = {
  idle: { head: [0.49, 0.16], chest: [0.55, 0.34], pivot: [0.5, 0.82] },
  seated: { head: [0.48, 0.18], chest: [0.55, 0.34], pivot: [0.60, 0.535] },
  prone: { head: [0.30, 0.40], chest: [0.47, 0.60], pivot: [0.50, 0.72] },
};
export function motionClock(origin, now = Date.now()) {
  return Math.max(0, (now - origin) / 1000);
}
export function parameters(time, enabled = true, speaking = false) {
  if (!enabled) return [0, 0, 0, 0];
  const fade = Math.min(1, time / 1.2);
  return [
    Math.sin(time * 1.65) * fade,
    (Math.sin(time * 0.85) + 0.28 * Math.sin(time * 2.1)) * fade,
    Math.sin(time * 1.25 + 0.6) * fade,
    speaking ? Math.sin(time * 9) * fade : 0,
  ];
}
function bell(x, y, cx, cy, rx, ry) {
  return Math.exp(-(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) * 2);
}
export function displacement(x, y, rig, p) {
  const head = bell(x, y, ...rig.head, 0.20, 0.19);
  const chest = bell(x, y, ...rig.chest, 0.22, 0.20);
  // Leave the seated support point still; hair moves independently of the face.
  const sides = Math.min(1, Math.abs(x - rig.head[0]) / 0.24);
  const hair = sides * bell(x, y, rig.head[0], rig.head[1] + 0.17, 0.65, 0.36);
  const pinned = Math.min(1, Math.hypot(x - rig.pivot[0], y - rig.pivot[1]) / 0.10);
  return [
    (head * p[1] * 0.007 + hair * p[2] * 0.012 + chest * p[0] * (x - rig.chest[0]) * 0.008) * pinned,
    (-chest * p[0] * 0.0035 + head * (p[0] * -0.002 + p[3] * 0.0015) + hair * p[2] * (x - rig.head[0]) * 0.008) * pinned,
  ];
}
// The fragment shader samples at p - displacement(p); use the same map for input.
export function sourcePoint(x, y, pose, p) {
  const d = displacement(x, y, RIGS[pose] || RIGS.idle, p);
  return [x - d[0], y - d[1]];
}
