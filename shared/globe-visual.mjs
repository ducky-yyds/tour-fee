// The orthographic sphere and the map overlay use the same east/north convention.
const RAD = Math.PI / 180;
export function earthVector(city) {
  const lat = city?.lat,
    lng = city?.lng;
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    return null;
  return [
    Math.cos(lat * RAD) * Math.sin(lng * RAD),
    Math.sin(lat * RAD),
    Math.cos(lat * RAD) * Math.cos(lng * RAD),
  ];
}
export function projectEarthVector(vector, rotation, width, height, radius) {
  if (!vector) return null;
  const a = rotation[0] * RAD,
    b = rotation[1] * RAD;
  const x = vector[0] * Math.cos(a) + vector[2] * Math.sin(a);
  const z = vector[2] * Math.cos(a) - vector[0] * Math.sin(a);
  const y = vector[1] * Math.cos(b) + z * Math.sin(b);
  const depth = z * Math.cos(b) - vector[1] * Math.sin(b);
  return { x: width / 2 + x * radius, y: height / 2 - y * radius, depth };
}
export function labelWidth(name) {
  const units = [...String(name)].reduce(
    (sum, char) => sum + (char.charCodeAt(0) > 255 ? 14 : 7.5),
    0,
  );
  return Math.max(32, Math.min(160, units + 12));
}
const overlaps = (a, b, gap = 5) =>
  a.x < b.x + b.width + gap &&
  a.x + a.width + gap > b.x &&
  a.y < b.y + b.height + gap &&
  a.y + a.height + gap > b.y;
export function layoutCityLabels(
  points,
  { width, height, limit = 36, reserved = [] },
) {
  const accepted = [];
  const sorted = [...points].sort(
    (a, b) =>
      b.priority - a.priority ||
      b.depth - a.depth ||
      a.city.id.localeCompare(b.city.id),
  );
  for (const point of sorted) {
    if (accepted.length >= limit) break;
    if (
      point.depth < 0.18 ||
      point.x < 14 ||
      point.x > width - 14 ||
      point.y < 65 ||
      point.y > height - 64
    )
      continue;
    const w = labelWidth(point.city.name),
      h = 26;
    const slots = [
      [point.x + 7, point.y - 12],
      [point.x - w - 7, point.y - 12],
      [point.x - w / 2, point.y - h - 8],
      [point.x - w / 2, point.y + 8],
    ];
    for (const [x, y] of slots) {
      const box = { x, y, width: w, height: h };
      if (
        x < 12 ||
        y < 64 ||
        x + w > width - 12 ||
        y + h > height - 62 ||
        reserved.some((item) => overlaps(box, item)) ||
        accepted.some((item) => overlaps(box, item.box))
      )
        continue;
      accepted.push({ ...point, box });
      break;
    }
  }
  return accepted;
}
export function sampleCityPoints(points, cellSize = 9) {
  const sorted = [...points].sort((a, b) => b.priority - a.priority);
  const cells = new Set();
  return sorted.filter((point) => {
    const key = `${Math.floor(point.x / cellSize)},${Math.floor(point.y / cellSize)}`;
    if (cells.has(key) && point.priority < 100) return false;
    cells.add(key);
    return true;
  });
}
export function hoverCardPosition(point, width, height) {
  const cardWidth = Math.min(232, width - 28),
    cardHeight = width < 500 ? 172 : 218;
  let left, top;
  if (point.x + 20 + cardWidth <= width - 14) {
    left = point.x + 20;
    top = point.y - 70;
  } else if (point.x - cardWidth - 20 >= 14) {
    left = point.x - cardWidth - 20;
    top = point.y - 70;
  } else {
    left = point.x - cardWidth / 2;
    top =
      point.y - cardHeight - 16 >= 59
        ? point.y - cardHeight - 16
        : point.y + 16;
  }
  return {
    left: Math.max(14, Math.min(width - cardWidth - 14, left)),
    top: Math.max(59, Math.min(height - cardHeight - 58, top)),
    width: cardWidth,
  };
}
