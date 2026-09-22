import { calculatePlan } from './planner.mjs';

/** Retain a recorded total only when the entire reference line is unchanged.
 * Appending a destination changes the former final city's overnight count and
 * the return ticket even though all existing city/day selections look identical.
 */
export function preserveUnchangedQuotes(previous, next, cities, rates) {
  const before = new Map(calculatePlan({ ...previous, overrides: {} }, cities, rates).lines.map(line => [line.id, JSON.stringify(line)]));
  const after = new Map(calculatePlan({ ...next, overrides: {} }, cities, rates).lines.map(line => [line.id, JSON.stringify(line)]));
  const kept = {}, resetIds = [];
  for (const [id, value] of Object.entries(previous.overrides || {})) {
    if (before.has(id) && before.get(id) === after.get(id)) kept[id] = { ...value };
    else resetIds.push(id);
  }
  return { overrides: kept, resetIds };
}
