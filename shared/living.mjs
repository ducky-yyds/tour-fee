import { convertCurrency } from "./planner.mjs";

export const LIVING_STORAGE_KEY = "tusuan-living-v1";
export const LIVING_MONTHS = [1, 3, 6, 12];
export const LIVING_TIERS = ["简约生活", "舒适生活", "宽裕生活"];
const coreAmounts = [
  "rent",
  "utilities",
  "eatingOutDaily",
  "transport",
  "misc",
];
const optionalAmounts = [
  "internet",
  "insurance",
  "coworking",
  "entertainment",
  "setup",
];
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};
const numeric = (value, fallback, min = 0, max = 1e9) =>
  value !== "" &&
  value !== null &&
  value !== undefined &&
  Number.isFinite(Number(value)) &&
  Number(value) >= min &&
  Number(value) <= max
    ? Number(value)
    : fallback;
const whole = (value, fallback, max) =>
  Math.floor(numeric(value, fallback, 1, max));
const round = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

/** Amount overrides are always stored in the selected city's native currency. */
export function normalizeLivingPreferences(value = {}) {
  const input = object(value);
  const incoming = object(input.amounts);
  const people = whole(input.people, 1, 20);
  const amounts = {};
  for (const key of coreAmounts) amounts[key] = numeric(incoming[key], null);
  for (const key of optionalAmounts) amounts[key] = numeric(incoming[key], 0);
  return {
    months: LIVING_MONTHS.includes(Number(input.months))
      ? Number(input.months)
      : 3,
    people,
    rooms: Math.min(people, whole(input.rooms, 1, 20)),
    tier: Math.floor(numeric(input.tier, 1, 0, 2)),
    cookingPercent: numeric(input.cookingPercent, 50, 0, 100),
    cookingRatio: numeric(input.cookingRatio, 0.45, 0.1, 1),
    reservePercent: numeric(input.reservePercent, 10, 0, 100),
    depositMonths: numeric(input.depositMonths, 1, 0, 12),
    monthlyBudget: numeric(input.monthlyBudget, 0),
    amounts,
  };
}

/** Corrupt/obsolete storage must never prevent opening the page. */
export function restoreLivingState(value, cities) {
  const fallbackId =
    cities.find((city) => city.id === "chiang-mai")?.id || cities[0]?.id || "";
  let incoming = value;
  try {
    if (typeof incoming === "string") incoming = JSON.parse(incoming);
  } catch {
    incoming = {};
  }
  incoming = object(incoming);
  const validIds = new Set(cities.map((city) => city.id));
  const byCity = {};
  if (incoming.version === 1) {
    for (const [id, preferences] of Object.entries(object(incoming.byCity))) {
      if (validIds.has(id))
        byCity[id] = normalizeLivingPreferences(preferences);
    }
  }
  return {
    version: 1,
    cityId: validIds.has(incoming.cityId) ? incoming.cityId : fallbackId,
    byCity,
    compareIds: Array.isArray(incoming.compareIds)
      ? [
          ...new Set(incoming.compareIds.filter((id) => validIds.has(id))),
        ].slice(0, 3)
      : [],
  };
}

export function calculateLivingBudget(
  city,
  rawPreferences,
  displayCurrency,
  rates,
) {
  if (!city?.currency) throw new Error("缺少旅居城市数据");
  const preferences = normalizeLivingPreferences(rawPreferences);
  const { tier, people, rooms, months, amounts } = preferences;
  const baseline = {
    rent: city.monthly?.rent?.[tier],
    utilities: city.monthly?.utilities?.[tier],
    eatingOutDaily: city.daily?.food?.[tier],
    transport: city.daily?.transport?.[tier] * 30,
    misc: city.daily?.misc?.[tier] * 30,
  };
  const unitAmounts = {};
  for (const key of coreAmounts) {
    if (!Number.isFinite(baseline[key]) || baseline[key] < 0)
      throw new Error(`缺少 ${city.name} 的生活成本估算`);
    unitAmounts[key] = amounts[key] ?? baseline[key];
  }
  for (const key of optionalAmounts) unitAmounts[key] = amounts[key];
  const exchangeRate = convertCurrency(
    1,
    city.currency,
    displayCurrency,
    rates,
  );
  const convert = (value) => {
    if (
      !Number.isFinite(value) ||
      value < 0 ||
      !Number.isFinite(value * exchangeRate)
    )
      throw new Error("生活成本金额超出有效范围");
    return round(value * exchangeRate);
  };
  const cookingShare = preferences.cookingPercent / 100;
  const foodFactor = 1 - cookingShare + cookingShare * preferences.cookingRatio;
  const rows = [
    ["rent", "月租", unitAmounts.rent, rooms, "间 / 月", "housing"],
    [
      "utilities",
      "水电基础费用",
      unitAmounts.utilities,
      rooms,
      "间 / 月",
      "housing",
    ],
    [
      "food",
      "买菜与日常餐饮",
      unitAmounts.eatingOutDaily * 30 * foodFactor,
      people,
      "人 / 月",
      "food",
    ],
    [
      "transport",
      "日常交通",
      unitAmounts.transport,
      people,
      "人 / 月",
      "transport",
    ],
    ["misc", "日用品与杂费", unitAmounts.misc, people, "人 / 月", "daily"],
    [
      "internet",
      "额外通信与网络",
      unitAmounts.internet,
      1,
      "全体 / 月",
      "extra",
    ],
    [
      "insurance",
      "医疗保险",
      unitAmounts.insurance,
      people,
      "人 / 月",
      "extra",
    ],
    [
      "coworking",
      "办公空间",
      unitAmounts.coworking,
      people,
      "人 / 月",
      "extra",
    ],
    [
      "entertainment",
      "娱乐与兴趣",
      unitAmounts.entertainment,
      people,
      "人 / 月",
      "extra",
    ],
  ].map(([id, label, unitAmount, quantity, unit, group]) => ({
    id,
    label,
    nativeAmount: unitAmount * quantity,
    unitAmount,
    quantity,
    unit,
    group,
    amount: convert(unitAmount * quantity),
  }));
  const baseNative = rows.reduce((sum, row) => sum + row.nativeAmount, 0);
  const reserveNative = (baseNative * preferences.reservePercent) / 100;
  rows.push({
    id: "reserve",
    label: "生活机动金",
    nativeAmount: reserveNative,
    amount: convert(reserveNative),
    group: "reserve",
  });
  const monthlyNative = baseNative + reserveNative;
  const setupNative = unitAmounts.setup;
  const depositNative = unitAmounts.rent * rooms * preferences.depositMonths;
  const periodNative = monthlyNative * months + setupNative;
  return {
    preferences,
    unitAmounts,
    rows,
    currency: displayCurrency,
    nativeCurrency: city.currency,
    monthly: convert(monthlyNative),
    monthlyNative: round(monthlyNative),
    perPerson: convert(monthlyNative / people),
    recurringPeriod: convert(monthlyNative * months),
    setup: convert(setupNative),
    deposit: convert(depositNative),
    period: convert(periodNative),
    firstMonthCash: convert(monthlyNative + setupNative + depositNative),
    periodCash: convert(periodNative + depositNative),
    monthlyBudget: convert(preferences.monthlyBudget),
    budgetRatio:
      preferences.monthlyBudget > 0
        ? monthlyNative / preferences.monthlyBudget
        : null,
    cookingFactor: foodFactor,
  };
}

export function rentalSearchLink(city) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${city.nameEn || city.name} monthly apartment rental furnished long term`)}`;
}
