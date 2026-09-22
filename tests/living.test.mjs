import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  calculateLivingBudget,
  normalizeLivingPreferences,
  restoreLivingState,
} from "../shared/living.mjs";

const city = {
  id: "test",
  name: "测试城市",
  currency: "CNY",
  monthly: { rent: [1000, 2000, 4000], utilities: [100, 200, 400] },
  daily: { food: [10, 20, 40], transport: [5, 10, 20], misc: [2, 4, 8] },
};
const rates = { rates: { CNY: 1, USD: 0.14, VND: 3700, IDR: 2300 } };
const preferences = {
  tier: 1,
  people: 1,
  rooms: 1,
  months: 3,
  cookingPercent: 0,
  reservePercent: 0,
};
const row = (budget, id) => budget.rows.find((item) => item.id === id);

test("living rent and utilities count rooms while daily costs count people and thirty-day months", () => {
  const single = calculateLivingBudget(city, preferences, "CNY", rates);
  const together = calculateLivingBudget(
    city,
    { ...preferences, people: 4 },
    "CNY",
    rates,
  );
  const twoRooms = calculateLivingBudget(
    city,
    { ...preferences, people: 4, rooms: 2 },
    "CNY",
    rates,
  );
  assert.equal(row(single, "rent").amount, 2000);
  assert.equal(row(together, "rent").amount, 2000);
  assert.equal(row(twoRooms, "rent").amount, 4000);
  assert.equal(row(twoRooms, "utilities").amount, 400);
  assert.equal(row(together, "food").amount, 20 * 30 * 4);
  assert.equal(row(together, "transport").amount, 10 * 30 * 4);
  assert.equal(row(together, "misc").amount, 4 * 30 * 4);
  assert.equal(single.period, single.monthly * 3);
});

test("refundable deposit is cash occupancy, never spending; setup charged once for whole party", () => {
  const first = calculateLivingBudget(
    city,
    {
      ...preferences,
      people: 2,
      rooms: 2,
      depositMonths: 2,
      amounts: { setup: 500 },
    },
    "CNY",
    rates,
  );
  const second = calculateLivingBudget(
    city,
    {
      ...preferences,
      people: 2,
      rooms: 2,
      depositMonths: 0,
      amounts: { setup: 500 },
    },
    "CNY",
    rates,
  );
  assert.equal(first.deposit, 2000 * 2 * 2);
  assert.equal(first.period, first.monthly * 3 + 500);
  assert.equal(first.period, second.period);
  assert.equal(first.firstMonthCash, first.monthly + 500 + first.deposit);
  assert.equal(first.periodCash, first.period + first.deposit);
  assert.equal(first.periodCash - second.periodCash, first.deposit);
});

test("self-cooking uses explicit adjustable assumption and optional monthly extras scale correctly", () => {
  const budget = calculateLivingBudget(
    city,
    {
      ...preferences,
      people: 2,
      cookingPercent: 50,
      cookingRatio: 0.4,
      reservePercent: 10,
      amounts: {
        insurance: 70,
        internet: 80,
        coworking: 100,
        entertainment: 120,
      },
    },
    "CNY",
    rates,
  );
  assert.equal(row(budget, "food").amount, 20 * 30 * 2 * 0.7);
  assert.equal(row(budget, "insurance").amount, 140);
  assert.equal(row(budget, "internet").amount, 80);
  assert.equal(row(budget, "coworking").amount, 200);
  assert.equal(row(budget, "entertainment").amount, 240);
  const base = budget.rows
    .filter((item) => item.id !== "reserve")
    .reduce((sum, item) => sum + item.amount, 0);
  assert.equal(row(budget, "reserve").amount, base / 10);
});

test("display currency converts totals and leaves stored native preferences untouched", () => {
  const custom = {
    ...preferences,
    monthlyBudget: 7000,
    amounts: { rent: 3333, setup: 150 },
  };
  const copy = JSON.stringify(custom);
  const cny = calculateLivingBudget(city, custom, "CNY", rates);
  const usd = calculateLivingBudget(city, custom, "USD", rates);
  assert.equal(usd.monthly, Math.round(cny.monthly * 0.14 * 100) / 100);
  assert.equal(usd.deposit, Math.round(cny.deposit * 0.14 * 100) / 100);
  assert.equal(usd.monthlyBudget, 980);
  assert.equal(JSON.stringify(custom), copy);
  assert.equal(usd.unitAmounts.rent, 3333);
  assert.throws(
    () => calculateLivingBudget(city, custom, "EUR", rates),
    /缺少/,
  );
});

test("large VND and IDR twelve-month budgets retain finite totals above one billion native units", () => {
  for (const nativeCurrency of ["VND", "IDR"]) {
    const expensive = {
      ...city,
      currency: nativeCurrency,
      monthly: {
        rent: [10000000, 30000000, 100000000],
        utilities: [100000, 300000, 1000000],
      },
    };
    const budget = calculateLivingBudget(
      expensive,
      {
        ...preferences,
        months: 12,
        people: 20,
        rooms: 20,
        tier: 2,
        reservePercent: 10,
      },
      "CNY",
      rates,
    );
    assert.ok(budget.monthlyNative > 1e9);
    assert.ok(Number.isFinite(budget.periodCash));
    assert.ok(budget.period > budget.monthly * 11.99);
  }
});

test("corrupt storage, old versions, unsupported city IDs and unsafe numbers recover cleanly", () => {
  const cities = [city, { ...city, id: "chiang-mai" }];
  assert.equal(restoreLivingState("{broken", cities).cityId, "chiang-mai");
  assert.deepEqual(
    restoreLivingState({ version: 0, byCity: { test: preferences } }, cities)
      .byCity,
    {},
  );
  const restored = restoreLivingState(
    {
      version: 1,
      cityId: "missing",
      byCity: {
        missing: preferences,
        test: {
          people: Infinity,
          rooms: 99,
          amounts: { rent: -100, internet: "bad", setup: 500 },
          cookingPercent: 200,
        },
      },
      compareIds: ["test", "missing", "test", "chiang-mai"],
    },
    cities,
  );
  assert.equal(restored.cityId, "chiang-mai");
  assert.equal(restored.byCity.test.people, 1);
  assert.equal(restored.byCity.test.rooms, 1);
  assert.equal(restored.byCity.test.amounts.rent, null);
  assert.equal(restored.byCity.test.amounts.internet, 0);
  assert.equal(restored.byCity.test.amounts.setup, 500);
  assert.equal(restored.byCity.test.cookingPercent, 50);
  assert.deepEqual(restored.compareIds, ["test", "chiang-mai"]);
  assert.equal(
    normalizeLivingPreferences({ amounts: { rent: 0 } }).amounts.rent,
    0,
  );
});

test("all catalog cities calculate twelve-month living budgets using every supported native currency", () => {
  const cities = JSON.parse(
    readFileSync(new URL("../data/cities.json", import.meta.url), "utf8"),
  );
  const fx = JSON.parse(
    readFileSync(new URL("../data/fx-reference.json", import.meta.url), "utf8"),
  );
  for (const item of cities) {
    for (const tier of [0, 1, 2]) {
      const budget = calculateLivingBudget(
        item,
        { ...preferences, months: 12, people: 2, tier },
        "CNY",
        fx,
      );
      assert.ok(Number.isFinite(budget.periodCash), item.id);
      assert.ok(
        budget.periodCash >= budget.period && budget.period >= budget.monthly,
        item.id,
      );
    }
  }
});
