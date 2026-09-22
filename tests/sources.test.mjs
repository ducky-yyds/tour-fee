import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTokyoSubway, parseEiffel, parseFx, parseTokyoTower, parseIchiran, FX_CURRENCIES } from '../server/sources.mjs';
test('Tokyo adapter extracts adult amounts without child-price contamination', () => {
  const html = '<table><tr><td>Tokyo Subway 24-hour Ticket – Adult: 1,000 yen, Child: 500 yen</td><td>Tokyo Subway 48-hour Ticket – Adult: 1,500 yen, Child: 750 yen</td><td>Tokyo Subway 72-hour Ticket – Adult: 2,000 yen, Child: 1,000 yen</td></tr></table>';
  assert.deepEqual(parseTokyoSubway(html).prices, { '24h': 1000, '48h': 1500, '72h': 2000 });
  assert.throws(() => parseTokyoSubway(html.replace('Adult: 1,500', 'Adult: unavailable')));
});
test('Eiffel adapter excludes youth and bundles, fails closed when structure changes', () => {
  const html = 'Adult Rate stairs summit <div>Adult 23,50€ Student 11,80€ Adult 36,70€ Adult 14,80€ Adult 28,00€</div> Bundles Prices Adult 60,70€';
  const result = parseEiffel(html);
  assert.equal(result.low, 14.8); assert.equal(result.high, 36.7);
  assert.throws(() => parseEiffel('Adult Rate stairs summit Adult 14,80€'));
});
test('FX validation requires all currencies and a plausible reference date', () => {
  const date = new Date().toISOString().slice(0, 10);
  const rows = FX_CURRENCIES.map(quote => ({ date, base: 'CNY', quote, rate: 2 }));
  assert.equal(parseFx(rows).rates.CNY, 1);
  assert.throws(() => parseFx(rows.slice(1)));
  assert.throws(() => parseFx(rows.map(r => ({ ...r, rate: -3 }))));
  assert.throws(() => parseFx(rows.map(r => ({ ...r, date: '2020-01-01' }))));
});
test('Tokyo Tower structured offers must match names, currency and visible adult prices', () => {
  const data = { '@graph': [{ '@type': 'Product', name: 'MAIN DECK', offers: { price: '1500', priceCurrency: 'JPY' } }, { '@type': 'Product', name: 'TOP DECK TOUR', offers: { price: '3300', priceCurrency: 'JPY' } }] };
  const html = `<script type="application/ld+json">${JSON.stringify(data)}</script><p>Adult 1,500 and Adult 3,300</p>`;
  assert.equal(parseTokyoTower(html).high, 3300);
  assert.throws(() => parseTokyoTower(html.replace('Adult 3,300', 'Adult 4,000')));
});
test('restaurant parser requires branch and exact dish; rejects conflicting amounts', () => {
  const source = { cityId: 'tokyo', branch: '渋谷' };
  const html = '渋谷 取扱いメニュー 天然とんこつラーメン（創業以来） （ 1180円） 半熟塩ゆでたまご （ 160円）';
  assert.deepEqual(parseIchiran(html, source).items.map(i => i.amount), [1180, 160]);
  assert.throws(() => parseIchiran(html.replace('渋谷', '京都'), source));
  assert.throws(() => parseIchiran(html + ' 半熟塩ゆでたまご （ 180円）', source));
});
