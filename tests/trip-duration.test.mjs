import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recommendedDays, getTripDuration, createRecommendedStop } from '../shared/trip-duration.mjs';
const cities = JSON.parse(readFileSync(new URL('../data/cities.json', import.meta.url), 'utf8'));
test('every detailed destination has a bounded first-visit recommendation, never a monthly default', () => {
  for (const city of cities) {
    const recommendation = getTripDuration(city);
    assert.equal(recommendation.type, 'editorial', city.id);
    assert(Number.isInteger(recommendation.days) && recommendation.days >= 1 && recommendation.days <= 7, city.id);
    assert(Number.isInteger(recommendation.min) && Number.isInteger(recommendation.max), city.id);
    assert(recommendation.min >= 1 && recommendation.min <= recommendation.days && recommendation.days <= recommendation.max && recommendation.max <= 365, city.id);
    assert.equal(createRecommendedStop(city).days, recommendation.days);
  }
});
test('compact cities and major destinations get distinct recommendations; resort regions have their own rhythm', () => {
  assert.equal(recommendedDays('male'), 1);
  assert.equal(recommendedDays('vik'), 2);
  assert.equal(recommendedDays('beijing'), 5);
  assert.equal(recommendedDays('tokyo'), 5);
  assert.equal(recommendedDays('reykjavik'), 3);
  assert.equal(recommendedDays('bali'), 5);
});
test('new airport-only stops are explicitly provisional and do not infer destination costs or sights', () => {
  const city = { id: 'aircity-test', coverage: 'airport-only', attractions: [] };
  assert.equal(getTripDuration(city).type, 'provisional');
  assert.deepEqual(createRecommendedStop(city), { cityId: 'aircity-test', days: 2, daysSource: 'recommendation', attractionIds: [], planningMode: 'smart' });
});
