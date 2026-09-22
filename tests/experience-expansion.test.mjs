import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { readExperienceEntries } from '../server/experience-catalog.mjs';
import { calculatePlan, generateItinerary, suggestStopPlan } from '../shared/planner.mjs';

const read = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const cities = read('cities.json'), rates = read('fx-reference.json');

test('new experience batches are discoverable by both planner and maintenance without a hard-coded file list', () => {
  const root = mkdtempSync(join(tmpdir(), 'tusuan-catalog-'));
  try {
    mkdirSync(join(root, 'data/experience-expansion'), { recursive: true });
    const save = (name, data) => writeFileSync(join(root, 'data', name), JSON.stringify(data));
    save('city-experiences.json', [{ id: 'existing' }]); save('city-activities.json', []);
    assert.deepEqual(readExperienceEntries(root).map(e => e.id), ['existing']);
    save('experience-expansion/new-region.json', [{ id: 'new' }]);
    assert.deepEqual(readExperienceEntries(root).map(e => e.id), ['existing', 'new']);
    save('experience-expansion/new-region.json', [{ id: 'existing' }]);
    assert.throws(() => readExperienceEntries(root), /duplicate experience/);
  } finally {
    const within = relative(resolve(tmpdir()), resolve(root));
    assert(!isAbsolute(within) && !within.startsWith('..') && within.startsWith('tusuan-catalog-'));
    rmSync(root, { recursive: true, force: true });
  }
});

test('all experience options retain valid units, supported quote currencies and honest verification status', () => {
  for (const place of readExperienceEntries()) {
    assert(cities.some(city => city.id === place.cityId), place.id);
    assert(['restaurant', 'hotel', 'experience'].includes(place.kind), place.id);
    assert(Number.isFinite(place.lat) && Math.abs(place.lat) <= 90, place.id);
    assert(Number.isFinite(place.lng) && Math.abs(place.lng) <= 180, place.id);
    assert(place.priceOptions.length > 0, place.id);
    assert(/^https:\/\//.test(place.sourceUrl) && /^https:\/\//.test(place.bookingUrl), place.id);
    const ids = new Set();
    for (const option of place.priceOptions) {
      const label = `${place.id}/${option.id}`;
      assert(!ids.has(option.id), label); ids.add(option.id);
      assert(Number.isFinite(option.low) && option.low >= 0 && Number.isFinite(option.high) && option.high >= option.low, label);
      assert(rates.rates[option.currency] > 0, label);
      assert(place.kind === 'hotel' ? option.unit === 'room-night' : ['person', 'booking'].includes(option.unit), label);
      if (option.unit === 'booking') assert(Number.isInteger(option.partyCapacity) && option.partyCapacity > 0, label);
      assert(['official', 'estimate'].includes(option.type), label);
      if (option.type === 'official') assert(option.checkedAt && /^https:\/\//.test(option.sourceUrl), label);
      else assert.equal(option.checkedAt, null, label);
      if (place.kind === 'hotel') assert.equal(option.type, 'estimate', label);
    }
  }
});

test('each published option can enter a real city itinerary and its budget uses the quoted currency', () => {
  const entries = readExperienceEntries();
  const complete = cities.map(city => ({ ...city, experiences: entries.filter(e => e.cityId === city.id) }));
  for (const city of complete) for (const place of city.experiences) for (const option of place.priceOptions) {
    const travelers = option.minParticipants || place.minParticipants || 1;
    const selection = { experienceId: place.id, optionId: option.id, dayIndex: 0 };
    const stop = suggestStopPlan({ cityId: city.id, days: 3, attractionIds: [], experienceSelections: [selection] }, city, { travelers });
    const plan = { originId: city.id, stops: [stop], mode: 'travel', departureDate: '2026-11-12', travelers, rooms: 1, tier: 1, currency: 'CNY', reservePercent: 0, returnTrip: false, overrides: {} };
    const budget = calculatePlan(plan, complete, rates), itinerary = generateItinerary(plan, complete, rates);
    const line = budget.lines.find(row => row.experienceId === place.id);
    assert(line && Number.isFinite(line.amount) && line.amount >= 0, `${place.id}/${option.id}`);
    assert.equal(line.nativeCurrency, option.currency, `${place.id}/${option.id}`);
    assert.equal(itinerary.length, 3);
    assert(itinerary.every(day => day.items.every(item => Number.isFinite(item.startMinute) && item.endMinute >= item.startMinute)), place.id);
  }
});
