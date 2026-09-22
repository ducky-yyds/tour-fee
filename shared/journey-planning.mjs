import { suggestStopPlan } from "./itinerary.mjs";
import { buildJourneyWindows } from "./journey-windows.mjs";

/** Keep every smart-planning entry point on the same intercity time allowance. */
export function suggestJourneyStop(plan, cities, index, options = {}) {
  const stop = plan.stops[index];
  const city = cities.find((city) => city.id === stop.cityId);
  const elapsed = plan.stops
    .slice(0, index)
    .reduce((total, item) => total + item.days, 0);
  const date = new Date(`${plan.departureDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + elapsed);
  const result = suggestStopPlan(stop, city, {
    ...options,
    departureDate: date.toISOString().slice(0, 10),
    dayWindows: buildJourneyWindows(plan, cities)[index],
  });
  return { ...result, planningMode: "smart" };
}

export function suggestJourneyStops(
  plan,
  cities,
  { automaticOnly = false } = {},
) {
  return plan.stops.map((stop, index) =>
    automaticOnly && stop.planningMode === "manual"
      ? stop
      : suggestJourneyStop(plan, cities, index),
  );
}
