export const PASSPORT_KEY = "tusuan-passport-v1";

export function localDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function isVisitDate(value, today = localDate()) {
  if (value === "") return true;
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value > today ||
    value < "1900-01-01"
  )
    return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function validatePassport(input, cities, today) {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    input.version !== 1 ||
    !Array.isArray(input.visits)
  )
    throw new Error("请选择途算导出的足迹 JSON 文件（版本 1）。");
  if (input.visits.length > cities.length)
    throw new Error("足迹数量超过当前目的地目录，请检查重复或未知记录。");
  const known = new Set(cities.map((city) => city.id));
  const seen = new Set();
  const visits = input.visits.map((entry, index) => {
    const label = `第 ${index + 1} 条足迹`;
    if (
      !entry ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      typeof entry.cityId !== "string" ||
      !known.has(entry.cityId)
    )
      throw new Error(`${label}包含未收录的目的地。`);
    if (seen.has(entry.cityId))
      throw new Error(`${label}重复记录了同一个目的地。`);
    seen.add(entry.cityId);
    const visitedOn = entry.visitedOn ?? "";
    if (!isVisitDate(visitedOn, today))
      throw new Error(
        `${label}的日期无效：请填写 1900 年以来、不晚于今天的真实日期。`,
      );
    const note = entry.note ?? "";
    if (typeof note !== "string" || note.length > 200)
      throw new Error(`${label}的备注应为 200 字以内的文字。`);
    return { cityId: entry.cityId, visitedOn, note: note.trim() };
  });
  return { version: 1, visits };
}

export function mergePassports(current, incoming, cities, today) {
  const old = validatePassport(current, cities, today);
  const added = validatePassport(incoming, cities, today);
  const merged = new Map(old.visits.map((entry) => [entry.cityId, entry]));
  for (const entry of added.visits) merged.set(entry.cityId, entry);
  return { version: 1, visits: [...merged.values()] };
}

export function passportStats(passport, cities) {
  const byId = new Map(cities.map((city) => [city.id, city]));
  const visited = passport.visits
    .map((entry) => byId.get(entry.cityId))
    .filter(Boolean);
  return {
    cities: visited.length,
    countries: new Set(visited.map((city) => city.countryCode)).size,
    countryCodes: [...new Set(visited.map((city) => city.countryCode))],
    catalogCities: cities.length,
    catalogCountries: new Set(cities.map((city) => city.countryCode)).size,
  };
}
