import test from "node:test";
import assert from "node:assert/strict";
import { geoOrthographic } from "d3-geo";
import {
  earthVector,
  projectEarthVector,
  layoutCityLabels,
  sampleCityPoints,
  hoverCardPosition,
} from "../shared/globe-visual.mjs";

test("3D surface and city labels stay aligned with geographic projection during rotation", () => {
  const cities = [
    { lat: 31.2, lng: 121.5 },
    { lat: 64.15, lng: -21.94 },
    { lat: -33.86, lng: 151.2 },
    { lat: 0, lng: 179.9 },
  ];
  for (const rotation of [
    [-121.5, -31.2, 0],
    [60, 45, 0],
    [-179.9, 0, 0],
    [0, 0, 0],
  ]) {
    const projection = geoOrthographic()
      .translate([400, 300])
      .scale(250)
      .rotate(rotation);
    for (const city of cities) {
      const actual = projectEarthVector(
        earthVector(city),
        rotation,
        800,
        600,
        250,
      );
      const expected = projection([city.lng, city.lat]);
      assert.ok(Math.abs(actual.x - expected[0]) < 1e-8);
      assert.ok(Math.abs(actual.y - expected[1]) < 1e-8);
    }
  }
});
test("labels prioritize selected city and do not overlap, including dense airport clusters", () => {
  const points = Array.from({ length: 10000 }, (_, i) => ({
    city: { id: `city-${i}`, name: `城市 ${i}` },
    x: 100 + (i % 50) * 4,
    y: 120 + (Math.floor(i / 50) % 40) * 5,
    depth: 0.9,
    priority: i === 0 ? 1000 : 0,
  }));
  const labels = layoutCityLabels(points, {
    width: 390,
    height: 500,
    limit: 20,
  });
  assert.equal(labels[0].city.id, "city-0");
  assert.ok(labels.length <= 20);
  for (let i = 0; i < labels.length; i++) {
    const a = labels[i].box;
    assert.ok(a.x >= 12 && a.x + a.width <= 378);
    for (let j = i + 1; j < labels.length; j++) {
      const b = labels[j].box;
      assert.ok(
        a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y,
      );
    }
  }
  assert.ok(sampleCityPoints(points).length < 1000);
});
test("backside labels are hidden and hover cards fit narrow screens", () => {
  assert.equal(earthVector({ lat: null, lng: null }), null);
  assert.equal(earthVector({ lat: 91, lng: 0 }), null);
  assert.deepEqual(
    layoutCityLabels(
      [
        {
          city: { id: "a", name: "A" },
          x: 190,
          y: 250,
          depth: -1,
          priority: 100,
        },
      ],
      { width: 390, height: 500 },
    ),
    [],
  );
  for (const point of [
    { x: 180, y: 220 },
    { x: 15, y: 80 },
    { x: 380, y: 450 },
  ]) {
    const card = hoverCardPosition(point, 390, 500);
    assert.ok(
      card.left >= 14 &&
        card.left + card.width <= 376 &&
        card.top >= 59 &&
        card.top + 172 <= 442,
    );
  }
});
