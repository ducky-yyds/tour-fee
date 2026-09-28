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
export function labelWidth(name, kind = 'city') {
  const eastAsian = kind === 'country' ? 14.2 : kind === 'province' ? 12.6 : 14;
  const latin = kind === 'country' ? 8.2 : kind === 'province' ? 7.2 : 7.5;
  const units = [...String(name)].reduce(
    (sum, char) => sum + (char.charCodeAt(0) > 255 ? eastAsian : latin),
    0,
  );
  return Math.ceil(Math.max(32, Math.min(kind === 'city' ? 160 : 190, units + (kind === 'city' ? 12 : 20))));
}
const overlaps = (a, b, gap = 5) =>
  a.x < b.x + b.width + gap &&
  a.x + a.width + gap > b.x &&
  a.y < b.y + b.height + gap &&
  a.y + a.height + gap > b.y;

// Zoom changes geography, rather than continually adding more overlapping names.
// Separate entry/exit thresholds keep wheel and pinch gestures near a boundary
// from alternating between two sets of labels on every frame.
export function labelDetailLevel(zoom, previousLevel) {
  const scale = Number.isFinite(zoom) ? zoom : 1;
  if (previousLevel === "country")
    return scale >= 3.15 ? "city" : scale >= 1.8 ? "province" : "country";
  if (previousLevel === "province")
    return scale >= 3.15 ? "city" : scale < 1.6 ? "country" : "province";
  if (previousLevel === "city")
    return scale < 1.6 ? "country" : scale < 2.85 ? "province" : "city";
  return scale >= 3 ? "city" : scale >= 1.7 ? "province" : "country";
}

const pointId = (point) => String(point.id ?? point.city?.id ?? "");
const pointPriority = (point) =>
  Number.isFinite(point.priority) ? point.priority : 0;
const stableIdOrder = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Every label has exactly one geographic anchor. Crowding hides a label; it
// never moves it to another side of the marker. Retain the previous visible
// names where priority permits, and let the caller defer new names until the
// globe settles after a drag, zoom or animated flight.
export function layoutMapLabels(
  points,
  {
    width,
    height,
    limit = 36,
    reserved = [],
    previousIds = new Set(),
    allowNew = true,
    labelForPoint = (point) => point.label ?? point.city?.name,
  } = {},
) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || limit <= 0)
    return [];
  const history =
    previousIds instanceof Set ? previousIds : new Set(previousIds || []);
  const accepted = [];
  const acceptedIds = new Set();
  const sorted = [...points].sort(
    (a, b) =>
      pointPriority(b) - pointPriority(a) ||
      Number(history.has(pointId(b))) - Number(history.has(pointId(a))) ||
      stableIdOrder(pointId(a), pointId(b)),
  );
  for (const point of sorted) {
    if (accepted.length >= limit) break;
    const id = pointId(point);
    const retained = history.has(id);
    if (!id || acceptedIds.has(id)) continue;
    if (!allowNew && !retained && pointPriority(point) < 500) continue;
    if (
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      !Number.isFinite(point.depth) ||
      point.depth < (retained ? 0.12 : 0.2)
    )
      continue;
    const label = String(labelForPoint(point) || "").trim();
    if (!label) continue;
    const kind = point.kind || "city";
    const w = labelWidth(label, kind),
      h = 26;
    const box = {
      x: kind === "city" ? point.x + 7 : point.x - w / 2,
      y: kind === "city" ? point.y - 12 : point.y - h / 2,
      width: w,
      height: h,
    };
    // An established label can approach an edge or another label slightly more
    // closely than an entering label, while always remaining fully visible
    // and keeping a real gap between all accepted boxes.
    const inset = retained ? 0 : 8;
    const collisionGap = retained ? 5 : 9;
    if (
      box.x < 12 + inset ||
      box.y < 64 + inset ||
      box.x + w > width - 12 - inset ||
      box.y + h > height - 62 - inset ||
      reserved.some((item) => overlaps(box, item, collisionGap)) ||
      accepted.some((item) => overlaps(box, item.box, collisionGap))
    )
      continue;
    accepted.push({ ...point, id, kind, label, box });
    acceptedIds.add(id);
  }
  return accepted;
}

// Keep the original helper for callers that only draw cities.
export function layoutCityLabels(
  points,
  { labelForCity = (city) => city.name, ...options } = {},
) {
  return layoutMapLabels(points, {
    ...options,
    labelForPoint: (point) => labelForCity(point.city),
  });
}
export function sampleCityPoints(points, cellSize = 9) {
  const sorted = [...points].sort(
    (a, b) =>
      pointPriority(b) - pointPriority(a) ||
      stableIdOrder(pointId(a), pointId(b)),
  );
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
