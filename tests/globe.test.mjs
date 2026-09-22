import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { geoOrthographic, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import {
  cityPoint,
  normalizePlaceSearch,
  normalizeRotation,
  projectRoute,
  rotationForCity,
  shiftDate,
} from "../shared/globe.mjs";
import {
  isVisitDate,
  localDate,
  mergePassports,
  passportStats,
  validatePassport,
} from "../shared/passport.mjs";
import { ISO2_TO_NUMERIC } from "../shared/country-codes.mjs";

const cities = JSON.parse(
  readFileSync(new URL("../data/cities.json", import.meta.url), "utf8"),
);
const city = (id) => cities.find((item) => item.id === id);
const empty = { version: 1, visits: [] };
const passport = (visits) => ({ version: 1, visits });
const visit = (cityId, patch = {}) => ({
  cityId,
  visitedOn: "",
  note: "",
  ...patch,
});
const plan = {
  originId: "shanghai",
  departureDate: "2026-10-20",
  stops: [
    { cityId: "reykjavik", days: 3 },
    { cityId: "male", days: 2 },
  ],
  returnTrip: true,
};

test("city search accepts accents, ASCII aliases and hyphenated identifiers", () => {
  assert.equal(
    normalizePlaceSearch("Reykjavík"),
    normalizePlaceSearch("reykjavik"),
  );
  assert.equal(
    normalizePlaceSearch("QUEBEC City"),
    normalizePlaceSearch("Québec City"),
  );
  assert.equal(
    normalizePlaceSearch("ho-chi-minh-city"),
    normalizePlaceSearch("Ho Chi Minh City"),
  );
  assert.equal(normalizePlaceSearch("  马累 "), "马累");
});

test("planned routes preserve origin, all stops, return and project dates without creating visits", () => {
  const route = projectRoute({ plan }, cities);
  assert.deepEqual(
    route.stops.map((stop) => stop.city.id),
    ["shanghai", "reykjavik", "male", "shanghai"],
  );
  assert.deepEqual(
    route.stops.map((stop) => stop.date),
    ["2026-10-20", "2026-10-20", "2026-10-23", "2026-10-24"],
  );
  assert.equal(route.totalDays, 5);
  assert.equal(route.legs.length, 3);
  assert.equal(passportStats(empty, cities).cities, 0);
  assert.equal(
    projectRoute({ plan: { ...plan, mode: "stay" } }, cities).stops.at(-1).date,
    "2026-10-25",
  );
  assert.equal(
    projectRoute({ plan: { ...plan, returnTrip: false } }, cities).stops.length,
    3,
  );
});

test("missing projects, unknown cities and repeated locations do not create invalid geometry", () => {
  assert.deepEqual(projectRoute(null, cities).legs, []);
  const result = projectRoute(
    {
      plan: {
        ...plan,
        originId: "missing",
        stops: [
          { cityId: "male", days: 1 },
          { cityId: "male", days: 1 },
        ],
      },
    },
    cities,
  );
  assert.equal(result.legs.length, 0);
  assert.equal(cityPoint({ lat: 91, lng: 0 }), null);
  assert.equal(shiftDate("2026-02-30", 1), "");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
});

test("great-circle rendering clips the rear hemisphere and handles the date line", () => {
  const projection = geoOrthographic()
    .rotate([-180, 0])
    .scale(100)
    .translate([100, 100]);
  const draw = geoPath(projection);
  const pacific = draw({
    type: "LineString",
    coordinates: [
      [170, 20],
      [-170, 20],
    ],
  });
  assert.ok(pacific && !pacific.includes("NaN"));
  const hidden = draw({
    type: "LineString",
    coordinates: [
      [0, 10],
      [15, 20],
    ],
  });
  assert.equal(hidden, null);
  for (const leg of projectRoute({ plan }, cities).legs)
    assert.ok(!String(draw(leg.geometry)).includes("NaN"));
});

test("city focus and drag rotations remain valid at the poles and date line", () => {
  assert.deepEqual(rotationForCity(city("male")), [
    -city("male").lng,
    -city("male").lat,
    0,
  ]);
  assert.deepEqual(normalizeRotation([540, 120, 0]), [-180, 85, 0]);
  assert.deepEqual(normalizeRotation([-540, -120, 0]), [-180, -85, 0]);
});

test("passport dates use the local calendar and reject impossible or future days", () => {
  const now = new Date(2026, 8, 22, 0, 1);
  assert.equal(localDate(now), "2026-09-22");
  assert.equal(isVisitDate("", "2026-09-22"), true);
  assert.equal(isVisitDate("2024-02-29", "2026-09-22"), true);
  for (const value of [
    "2025-02-29",
    "2026-02-30",
    "2026-09-23",
    "1899-12-31",
    "2026-9-2",
    20260922,
    null,
  ])
    assert.equal(isVisitDate(value, "2026-09-22"), false);
});

test("passport imports reject malformed records atomically without losing existing visits", () => {
  const original = passport([visit("male", { note: "sunset" })]);
  const invalid = [
    null,
    [],
    { visits: [] },
    { version: 2, visits: [] },
    passport([visit("unknown")]),
    passport([visit("male"), visit("male")]),
    passport([visit("male", { visitedOn: "2026-02-30" })]),
    passport([visit("male", { note: 2 })]),
    passport([visit("male", { note: "x".repeat(201) })]),
  ];
  for (const input of invalid)
    assert.throws(() => mergePassports(original, input, cities, "2026-09-22"));
  assert.equal(original.visits[0].note, "sunset");
});

test("imports merge by known city and sanitize extra fields without treating plans as visits", () => {
  const old = passport([visit("male", { note: "old" }), visit("reykjavik")]);
  const imported = passport([
    visit("male", { note: "  new  ", arbitrary: "<script>" }),
    visit("maafushi"),
  ]);
  const merged = mergePassports(old, imported, cities, "2026-09-22");
  assert.equal(merged.visits.length, 3);
  assert.deepEqual(
    merged.visits.find((item) => item.cityId === "male"),
    visit("male", { note: "new" }),
  );
  assert.equal(validatePassport(merged, cities, "2026-09-22").version, 1);
  assert.throws(() => validatePassport({ plan }, cities));
});

test("footprints count unique countries separately from city catalog coverage", () => {
  const stats = passportStats(
    passport([visit("male"), visit("maafushi"), visit("reykjavik")]),
    cities,
  );
  assert.equal(stats.cities, 3);
  assert.equal(stats.countries, 2);
  assert.deepEqual(new Set(stats.countryCodes), new Set(["MV", "IS"]));
  assert.equal(stats.catalogCities, cities.length);
  assert.equal(
    stats.catalogCountries,
    new Set(cities.map((item) => item.countryCode)).size,
  );
});

test("offline map is valid, country codes cover the catalog, and small islands keep city coordinates", () => {
  const topology = JSON.parse(
    readFileSync(
      new URL("../public/maps/countries-110m.json", import.meta.url),
      "utf8",
    ),
  );
  const boundaries = feature(topology, topology.objects.countries);
  assert.ok(boundaries.features.length > 150);
  for (const item of cities) {
    assert.match(ISO2_TO_NUMERIC[item.countryCode], /^\d{3}$/);
    assert.ok(cityPoint(item), item.id);
  }
  for (const id of ["male", "maafushi", "mauritius", "mahe", "singapore"])
    assert.ok(cityPoint(city(id)), id);
});
