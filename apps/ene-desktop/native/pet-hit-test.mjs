/** Match CSS object-fit: contain. Alpha affects input only, never drawing. */
export function hitsCharacter(
  { bitmap, width, height },
  bounds,
  point,
  threshold = 24,
) {
  if (bounds.width <= 0 || bounds.height <= 0) return false;
  const scale = Math.min(bounds.width / width, bounds.height / height);
  const x = Math.floor(
    (point.x - bounds.x - (bounds.width - width * scale) / 2) / scale,
  );
  const y = Math.floor(
    (point.y - bounds.y - (bounds.height - height * scale) / 2) / scale,
  );
  return (
    x >= 0 &&
    y >= 0 &&
    x < width &&
    y < height &&
    bitmap[(y * width + x) * 4 + 3] >= threshold
  );
}
