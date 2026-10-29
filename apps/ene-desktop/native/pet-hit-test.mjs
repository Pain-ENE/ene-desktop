import { sourcePoint } from "./character-motion.mjs";
/** Match CSS object-fit: contain. Alpha affects input only, never drawing. */
export function hitsCharacter(
  { bitmap, width, height },
  bounds,
  point,
  threshold = 24,
  motion,
) {
  if (bounds.width <= 0 || bounds.height <= 0) return false;
  const scale = Math.min(bounds.width / width, bounds.height / height);
  let x = Math.floor(
    (point.x - bounds.x - (bounds.width - width * scale) / 2) / scale,
  );
  let y = Math.floor(
    (point.y - bounds.y - (bounds.height - height * scale) / 2) / scale,
  );
  if (motion) {
    const uv = sourcePoint((x + 0.5) / width, (y + 0.5) / height, motion.pose, motion.params);
    x = Math.floor(uv[0] * width); y = Math.floor(uv[1] * height);
  }
  return (
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    bitmap[(y * width + x) * 4 + 3] >= threshold
  );
}
