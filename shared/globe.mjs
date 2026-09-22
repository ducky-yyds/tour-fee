const validPoint = (city) =>
  city &&
  Number.isFinite(city.lng) &&
  Number.isFinite(city.lat) &&
  Math.abs(city.lat) <= 90 &&
  Math.abs(city.lng) <= 180;
export function normalizePlaceSearch(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[-_\s]+/g, " ")
    .trim();
}
export function cityPoint(city) {
  return validPoint(city) ? [city.lng, city.lat] : null;
}

export function shiftDate(date, days) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const value = new Date(`${date}T12:00:00Z`);
  if (
    !Number.isFinite(value.getTime()) ||
    value.toISOString().slice(0, 10) !== date
  )
    return "";
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function projectRoute(project, cities) {
  const byId = new Map(cities.map((city) => [city.id, city]));
  const plan = project?.plan;
  if (!plan) return { stops: [], legs: [], totalDays: 0 };
  const stops = [];
  const origin = byId.get(plan.originId);
  let elapsed = 0;
  if (validPoint(origin))
    stops.push({
      city: origin,
      kind: "origin",
      label: "出发",
      date: shiftDate(plan.departureDate, 0),
      index: 0,
    });
  for (const stop of Array.isArray(plan.stops) ? plan.stops : []) {
    const city = byId.get(stop.cityId);
    const days = Number.isFinite(Number(stop.days))
      ? Math.max(1, Math.floor(Number(stop.days)))
      : 1;
    if (validPoint(city))
      stops.push({
        city,
        kind: "stop",
        label: `${days} 天`,
        days,
        date: shiftDate(plan.departureDate, elapsed),
        index: stops.length,
      });
    elapsed += days;
  }
  if (plan.returnTrip !== false && validPoint(origin) && stops.length > 1)
    stops.push({
      city: origin,
      kind: "return",
      label: "返程",
      date: shiftDate(
        plan.departureDate,
        Math.max(0, plan.mode === "stay" ? elapsed : elapsed - 1),
      ),
      index: stops.length,
    });
  const legs = [];
  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1];
    const to = stops[i];
    if (from.city.id === to.city.id) continue;
    legs.push({
      id: `${i}-${from.city.id}-${to.city.id}`,
      from,
      to,
      geometry: {
        type: "LineString",
        coordinates: [cityPoint(from.city), cityPoint(to.city)],
      },
    });
  }
  return { stops, legs, totalDays: elapsed };
}

export function rotationForCity(city) {
  return cityPoint(city) ? [-city.lng, -city.lat, 0] : [-105, -25, 0];
}

export function normalizeRotation(rotation) {
  return [
    ((((rotation[0] + 180) % 360) + 360) % 360) - 180,
    Math.max(-85, Math.min(85, rotation[1])),
    0,
  ];
}
