import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => JSON.parse(readFileSync(new URL('../data/' + name, import.meta.url), 'utf8'));
const offers = read('city-experiences.json');
const cities = read('cities.json');
const guides = read('city-guides.json');

test('every catalog city has a guide; verified restaurant and hotel coverage stays explicit', () => {
  assert.ok(offers.length >= 60);
  assert.equal(new Set(offers.map(x => x.id)).size, offers.length);
  assert.equal(guides.length, cities.length);
  assert.equal(new Set(guides.map(x => x.cityId)).size, guides.length);
  for (const city of cities) {
    if (offers.some(x => x.cityId === city.id)) {
      assert.ok(offers.some(x => x.cityId === city.id && x.kind === 'restaurant'));
      assert.ok(offers.some(x => x.cityId === city.id && x.kind === 'hotel'));
    }
    const guide = guides.find(x => x.cityId === city.id);
    assert.ok(guide?.intro && guide.experienceIntro);
    for (const items of [guide.foodHighlights, guide.neighborhoods]) {
      assert.ok(items.length >= 2 && items.every(x => x.name && x.description));
    }
  }
});

test('offers retain valid coordinates, traceable sources, and native-currency prices', () => {
  for (const offer of offers) {
    const city = cities.find(x => x.id === offer.cityId);
    assert.ok(city, offer.id);
    assert.ok(Number.isFinite(offer.lat) && Math.abs(offer.lat) <= 90, offer.id);
    assert.ok(Number.isFinite(offer.lng) && Math.abs(offer.lng) <= 180, offer.id);
    assert.ok(offer.address && offer.description && offer.features.length >= 3, offer.id);
    assert.ok(/^https:\/\//.test(offer.sourceUrl), offer.id);
    assert.ok(/^https:\/\//.test(offer.bookingUrl), offer.id);
    assert.equal(new Set(offer.priceOptions.map(x => x.id)).size, offer.priceOptions.length);
    for (const option of offer.priceOptions) {
      assert.equal(option.currency, city.currency, offer.id);
      assert.ok(Number.isFinite(option.low) && option.low >= 0 && option.high >= option.low, offer.id);
      assert.ok(['person', 'room-night', 'booking'].includes(option.unit), offer.id);
      assert.ok(['estimate', 'official'].includes(option.type), offer.id);
      assert.ok(option.note && option.sourceUrl && option.includes.length && option.excludes.length, offer.id);
      if (option.type === 'estimate') assert.equal(option.checkedAt, null, offer.id);
      else assert.match(option.checkedAt, /^\d{4}-\d{2}-\d{2}$/, offer.id);
      if (option.unit === 'booking') assert.ok(Number.isInteger(option.partyCapacity) && option.partyCapacity > 0);
    }
  }
});

test('hotels never present editorial budgets as observed availability or prices', () => {
  for (const hotel of offers.filter(x => x.kind === 'hotel')) {
    assert.equal(hotel.durationMinutes, 0);
    assert.ok(hotel.availabilityNote.includes('不是指定日期'));
    for (const option of hotel.priceOptions) {
      assert.equal(option.type, 'estimate');
      assert.equal(option.checkedAt, null);
      assert.equal(option.unit, 'room-night');
    }
  }
});

test('fixed menus store the full package and publish applicable meal times', () => {
  for (const restaurant of offers.filter(x => x.kind === 'restaurant')) {
    assert.equal(restaurant.priceOptions.length, 3, restaurant.id);
    for (const option of restaurant.priceOptions) {
      assert.ok(option.mealTypes.length > 0, restaurant.id);
      assert.ok(option.mealTypes.every(x => ['breakfast', 'lunch', 'dinner'].includes(x)), restaurant.id);
    }
  }
  const ylc = offers.find(x => x.id === 'ex-shanghai-restaurant-yi-long-court');
  const family = ylc.priceOptions.find(x => x.id === 'family');
  assert.equal(family.unit, 'booking');
  assert.equal(family.partyCapacity, 4);
  assert.equal(family.low, 2434.61);
  assert.equal(family.high, 2434.61);
  assert.deepEqual(ylc.priceOptions.find(x => x.id === 'dimsum').mealTypes, ['lunch']);
  const hotpot = offers.find(x => x.cityId === 'chengdu' && x.kind === 'restaurant').priceOptions.find(x => x.id === 'hotpot');
  assert.equal(hotpot.unit, 'booking');
  assert.equal(hotpot.partyCapacity, 2);
  assert.equal(hotpot.low, 600);
  const bills = offers.find(x => x.cityId === 'sydney' && x.kind === 'restaurant');
  assert.deepEqual(bills.priceOptions.find(x => x.id === 'eggs').mealTypes, ['breakfast']);
});

test('undated archived Berlin menu remains an estimate', () => {
  const berlin = offers.find(x => x.cityId === 'berlin' && x.kind === 'restaurant');
  assert.ok(berlin.priceOptions.every(x => x.type === 'estimate' && x.checkedAt === null));
});
