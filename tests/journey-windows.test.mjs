import test from "node:test";
import assert from "node:assert/strict";
import {
  buildJourneyWindows,
  estimateJourneyLeg,
  journeyTimeMinutes,
  normalizeTransportWindow,
} from "../shared/journey-windows.mjs";

const cities = [
  { id: "origin", name: "出发城", countryCode: "CN", lat: 31.2, lng: 121.5 },
  { id: "near", name: "近邻城", countryCode: "CN", lat: 30.3, lng: 120.2 },
  { id: "far", name: "远方城", countryCode: "US", lat: 40.7, lng: -74 },
  { id: "third", name: "第三城", countryCode: "US", lat: 42.3, lng: -71 },
  { id: "male", name: "马累", countryCode: "MV", lat: 4.18, lng: 73.51 },
  { id: "maafushi", name: "马富施", countryCode: "MV", lat: 3.94, lng: 73.49 },
  {
    id: "reykjavik",
    name: "雷克雅未克",
    countryCode: "IS",
    lat: 64.14,
    lng: -21.94,
  },
  { id: "vik", name: "维克", countryCode: "IS", lat: 63.42, lng: -19.01 },
];
const city = (id) => cities.find((value) => value.id === id);
const plan = (stops, patch = {}) => ({
  originId: "origin",
  mode: "travel",
  returnTrip: false,
  stops,
  ...patch,
});
const stop = (cityId, days, transportWindow) => ({
  cityId,
  days,
  ...(transportWindow ? { transportWindow } : {}),
});

test("local stays reserve no cross-city time and preserve early morning availability", () => {
  const windows = buildJourneyWindows(
    plan([stop("origin", 2)], { returnTrip: true }),
    cities,
  )[0];
  for (const day of windows)
    assert.deepEqual(day, {
      startMinute: 0,
      endMinute: 1440,
      maxLocalActiveMinutes: 480,
      reservedMinutes: 0,
      travelOnly: false,
      inbound: null,
      outbound: null,
      note: "",
    });
  assert.equal(estimateJourneyLeg(city("origin"), city("origin")), null);
});

test("transport modes distinguish Maldives boats, Iceland roads, near domestic rail and long-haul air", () => {
  assert.equal(estimateJourneyLeg(city("male"), city("maafushi")).mode, "boat");
  assert.equal(estimateJourneyLeg(city("reykjavik"), city("vik")).mode, "road");
  assert.equal(estimateJourneyLeg(city("origin"), city("near")).mode, "rail");
  assert.equal(estimateJourneyLeg(city("origin"), city("far")).mode, "air");
});

test("long-haul inbound reserve spreads across dates without placing 18 hours in one day", () => {
  const leg = estimateJourneyLeg(city("origin"), city("far"));
  assert.ok(leg.estimatedMinutes > 690);
  const windows = buildJourneyWindows(plan([stop("far", 4)]), cities)[0];
  assert.equal(windows[0].travelOnly, true);
  assert.equal(windows[0].maxLocalActiveMinutes, 0);
  assert.equal(
    windows.reduce((sum, day) => sum + (day.inbound?.reservedMinutes || 0), 0),
    leg.estimatedMinutes,
  );
  for (const day of windows) {
    assert.ok(day.reservedMinutes <= 690);
    assert.ok(
      day.startMinute >= 0 &&
        day.endMinute <= 1440 &&
        day.endMinute >= day.startMinute,
    );
    assert.ok(
      day.maxLocalActiveMinutes >= 0 && day.maxLocalActiveMinutes <= 480,
    );
  }
  assert.equal(windows.at(-1).inbound, null);
});

test("too few days and conflicting arrival/return reserves produce traffic-only days and explicit guidance", () => {
  const [day] = buildJourneyWindows(
    plan([stop("far", 1)], { returnTrip: true }),
    cities,
  )[0];
  assert.equal(day.travelOnly, true);
  assert.equal(day.maxLocalActiveMinutes, 0);
  assert.equal(day.reservedMinutes, 690);
  assert.match(day.note, /不足/);
  assert.match(day.note, /重叠/);
  assert.equal(day.inbound.legId, "leg-0");
  assert.equal(day.outbound.legId, "leg-return");
});

test("each later city pays its own incoming time reserve, return reserve uses the final station only", () => {
  const windows = buildJourneyWindows(
    plan([stop("near", 2), stop("far", 4)], { returnTrip: true }),
    cities,
  );
  assert.equal(windows[0][0].inbound.fromId, "origin");
  assert.equal(windows[0][0].inbound.toId, "near");
  assert.equal(windows[1][0].inbound.fromId, "near");
  assert.equal(windows[1][0].inbound.legId, "leg-1");
  assert.ok(windows[0].every((day) => day.outbound === null));
  assert.equal(windows[1].at(-1).outbound.toId, "origin");
  assert.equal(windows[1].at(-1).travelOnly, true);
});

test("manual arrival applies an exact local 15:00 boundary and next-day arrival preserves the travel day", () => {
  const sameDay = buildJourneyWindows(
    plan([stop("far", 3, { arrivalReadyTime: "15:00", arrivalDayOffset: 0 })]),
    cities,
  )[0];
  assert.equal(sameDay[0].startMinute, 900);
  assert.equal(sameDay[0].inbound.basis, "user-local-window");
  assert.equal(sameDay[1].inbound, null);
  const nextDay = buildJourneyWindows(
    plan([stop("far", 3, { arrivalReadyTime: "15:00", arrivalDayOffset: 1 })]),
    cities,
  )[0];
  assert.equal(nextDay[0].travelOnly, true);
  assert.equal(nextDay[1].startMinute, 900);
  assert.equal(nextDay[1].inbound.basis, "user-local-window");
});

test("manual early arrival accepts midnight and before-nine experiences", () => {
  for (const value of ["00:00", "05:00", "08:30"]) {
    const [day] = buildJourneyWindows(
      plan([stop("far", 2, { arrivalReadyTime: value })]),
      cities,
    )[0];
    assert.equal(day.startMinute, journeyTimeMinutes(value));
    assert.equal(day.reservedMinutes, 0);
    assert.equal(day.maxLocalActiveMinutes, 480);
    assert.equal(day.travelOnly, false);
  }
});

test("cross-city and local activity share an eight-hour daily load budget", () => {
  const fiveHours = buildJourneyWindows(
    plan([stop("far", 2, { arrivalReadyTime: "14:00" })]),
    cities,
  )[0][0];
  assert.equal(fiveHours.reservedMinutes, 300);
  assert.equal(fiveHours.maxLocalActiveMinutes, 180);
  const eightHours = buildJourneyWindows(
    plan([stop("far", 2, { arrivalReadyTime: "17:00" })]),
    cities,
  )[0][0];
  assert.equal(eightHours.reservedMinutes, 480);
  assert.equal(eightHours.maxLocalActiveMinutes, 0);
  assert.equal(eightHours.travelOnly, true);
  assert.match(eightHours.note, /8 小时/);
  const automatic = buildJourneyWindows(plan([stop("near", 2)]), cities)[0][0];
  assert.ok(automatic.maxLocalActiveMinutes + automatic.reservedMinutes <= 480);
});

test("manual late arrival or arrival beyond the stay never yields phantom sightseeing time", () => {
  const late = buildJourneyWindows(
    plan([stop("far", 1, { arrivalReadyTime: "23:59" })]),
    cities,
  )[0][0];
  assert.equal(late.travelOnly, true);
  assert.equal(late.maxLocalActiveMinutes, 0);
  const afterStay = buildJourneyWindows(
    plan([stop("far", 2, { arrivalReadyTime: "10:00", arrivalDayOffset: 3 })]),
    cities,
  )[0];
  assert.ok(afterStay.every((day) => day.travelOnly));
  assert.match(afterStay[0].note, /之外/);
});

test("manual return departure truncates the last destination on the return day, and only that day", () => {
  const windows = buildJourneyWindows(
    plan(
      [
        stop("near", 2, { departureLeaveTime: "10:00" }),
        stop("far", 3, {
          arrivalReadyTime: "09:00",
          departureLeaveTime: "13:30",
        }),
      ],
      { returnTrip: true },
    ),
    cities,
  );
  assert.ok(windows[0].every((day) => day.outbound === null));
  assert.equal(windows[1][1].endMinute, 1440);
  assert.equal(windows[1].at(-1).endMinute, 810);
  assert.equal(windows[1].at(-1).outbound.basis, "user-local-window");
  const conflict = buildJourneyWindows(
    plan(
      [
        stop("near", 1, {
          arrivalReadyTime: "15:00",
          departureLeaveTime: "13:00",
        }),
      ],
      { returnTrip: true },
    ),
    cities,
  )[0][0];
  assert.equal(conflict.travelOnly, true);
  assert.match(conflict.note, /重叠/);
});

test("stay-mode return happens the following day and does not consume the final stay day", () => {
  const windows = buildJourneyWindows(
    plan([stop("near", 3, { departureLeaveTime: "08:00" })], {
      returnTrip: true,
      mode: "stay",
    }),
    cities,
  )[0];
  assert.ok(windows.every((day) => day.outbound === null));
  assert.equal(windows.at(-1).maxLocalActiveMinutes, 480);
  assert.equal(windows.at(-1).endMinute, 1440);
});

test("normalization rejects malformed local windows, removes unrecognized fields and preserves out-of-stay offsets for warnings", () => {
  assert.deepEqual(normalizeTransportWindow(undefined, 2), {});
  assert.deepEqual(
    normalizeTransportWindow({ arrivalReadyTime: "", unexpected: true }, 2),
    {},
  );
  assert.deepEqual(
    normalizeTransportWindow(
      { arrivalReadyTime: "00:00", arrivalDayOffset: 14, extra: "discard" },
      1,
    ),
    { arrivalReadyTime: "00:00", arrivalDayOffset: 14 },
  );
  for (const value of [
    { arrivalReadyTime: "24:00" },
    { arrivalReadyTime: "8:00" },
    { departureLeaveTime: "15:60" },
    { arrivalDayOffset: -1 },
    { arrivalDayOffset: true },
    { arrivalDayOffset: null },
    { arrivalDayOffset: 15 },
    { arrivalDayOffset: 1.5 },
    [],
    "09:00",
  ])
    assert.throws(() => normalizeTransportWindow(value, 2));
  for (const days of [0, 366, 1.5])
    assert.throws(() => normalizeTransportWindow({}, days));
});

test("building transport windows is pure and never alters costs or confirmed amounts", () => {
  const input = plan([stop("near", 3, { arrivalReadyTime: "15:00" })], {
    overrides: { "leg-0": { amount: 999, confirmed: true } },
  });
  const snapshot = JSON.stringify(input);
  buildJourneyWindows(input, cities);
  assert.equal(JSON.stringify(input), snapshot);
  assert.deepEqual(input.overrides["leg-0"], { amount: 999, confirmed: true });
});
