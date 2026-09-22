import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROUTINE_MEDIA, getItineraryMedia } from '../src/itinerary-media.mjs';
import { publicAssetUrl } from '../shared/public-paths.mjs';

const cityImage = { url: '/images/city-test.jpg', credit: 'City photographer' };
const parkImage = { url: '/images/place-park.jpg', credit: 'Park photographer' };
const city = { name: '示例城市', image: cityImage, attractions: [{ id: 'park', name: '公园', image: parkImage }], experiences: [{ id: 'hotel', name: '指定酒店', image: cityImage }] };

test('routine photos are local JPEGs with attribution and reference labels', () => {
  for (const image of Object.values(ROUTINE_MEDIA)) {
    const bytes = readFileSync(new URL(`../public${image.url}`, import.meta.url));
    assert.equal(bytes[0], 0xff); assert.equal(bytes[1], 0xd8);
    assert.equal(bytes.length, image.bytes);
    assert(image.credit && image.sourceUrl && image.license && image.licenseUrl);
    assert.equal(image.isReference, true);
    assert.match(publicAssetUrl(image.url, '/tour-fee/'), /^\/tour-fee\/images\/routine-/);
  }
});

test('breakfast and local food retain generic scene labels and never imply a specific menu', () => {
  const breakfast = getItineraryMedia({ kind: 'meal', mealType: 'breakfast' }, city);
  const dinner = getItineraryMedia({ kind: 'meal', mealType: 'dinner', image: cityImage }, city);
  assert.notEqual(breakfast.image.url, dinner.image.url);
  for (const media of [breakfast, dinner]) { assert.equal(media.label, '场景参考图'); assert.equal(media.isReference, true); }
});

test('arrival completion changes from transport imagery to the actual destination', () => {
  const air = { kind: 'arrival', journey: true, transportMode: 'air' };
  assert.equal(getItineraryMedia(air, city).kind, 'air');
  assert.equal(getItineraryMedia({ ...air, journeyPhase: 'arrived' }, city).image, cityImage);
  assert.equal(getItineraryMedia({ ...air, routineType: 'arrival-ready' }, city).label, '城市参考图');
  assert.equal(getItineraryMedia({ ...air, journeyPhase: 'arrived' }, {}), null);
});

test('a selected hotel city fallback never becomes a photo of the reserved room', () => {
  const item = { kind: 'hotel', experienceId: 'hotel', image: cityImage };
  assert.equal(getItineraryMedia(item, city).image.url, ROUTINE_MEDIA.hotel.url);
  const verified = { ...city, experiences: [{ id: 'hotel', name: '指定酒店', image: { url: '/hotel.jpg', subjectId: 'hotel' } }] };
  assert.equal(getItineraryMedia(item, verified).isReference, false);
});

test('city walks prefer proposed local places and gracefully handle missing images', () => {
  const item = { kind: 'free', routineType: 'citywalk', suggestedPlaces: [{ name: '公园', image: parkImage }] };
  assert.equal(getItineraryMedia(item, city).image, parkImage);
  assert.equal(getItineraryMedia({ kind: 'transport', segment: { mode: 'walk', toId: 'park' } }, city).label, '周边景点参考图');
  assert.equal(getItineraryMedia({ kind: 'free' }, {}), null);
});

test('transport modes choose matching scenes without inferring a flight', () => {
  for (const [mode, kind] of [['rail', 'rail'], ['boat', 'boat'], ['road', 'road'], ['transit', 'transfer']])
    assert.equal(getItineraryMedia({ kind: 'transport', transportMode: mode }, city).kind, kind);
  assert.equal(getItineraryMedia({ kind: 'arrival' }, city).kind, 'transfer');
  assert.equal(getItineraryMedia({ kind: 'journey-transfer', transportMode: 'air' }, city).kind, 'transfer');
});
