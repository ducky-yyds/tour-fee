import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { calculatePlan } from '../shared/planner.mjs';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const catalog = await (await fetch(target + '/api/catalog')).json();
const tokyo = catalog.cities.find(c => c.id === 'tokyo');
const seed = { plannerVersion: 2, originId: 'shanghai', stops: [{ cityId: 'tokyo', days: 3, attractionIds: [], dayPlans: [[], [], []] }], departureDate: '2026-10-20', travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true, reservePercent: 10, overrides: {} };
const report = { checks: [], pageErrors: [] };
await mkdir('artifacts/qa', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
await context.addInitScript(seed => {
  if (!localStorage.getItem('tusuan-current')) localStorage.setItem('tusuan-current', JSON.stringify(seed));
}, seed);
const page = await context.newPage();
page.on('pageerror', error => report.pageErrors.push(error.message));
const current = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
async function check(name, fn) { try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log('PASS ' + name); } catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log('FAIL ' + name + ': ' + error.message); } }
try {
  await check('every city has a guide and existing provider coverage remains valid', async () => {
    assert.ok(catalog.cities.length >= 100);
    for (const city of catalog.cities) {
      assert.ok(city.guide?.intro);
      if (city.experiences.length) for (const kind of ['restaurant', 'hotel', 'experience']) assert.ok(city.experiences.some(e => e.kind === kind), `${city.id}/${kind}`);
      for (const e of city.experiences) { assert.ok(e.address && e.bookingUrl && e.priceOptions.length); for (const o of e.priceOptions) assert.ok(o.low >= 0 && o.high >= o.low && (o.type !== 'official' || o.checkedAt)); }
    }
    return { places: catalog.experienceMaintenance.placeCount, options: catalog.experienceMaintenance.optionCount };
  });
  await check('deep link opens Tokyo with image, food notes and independent categories', async () => {
    await page.goto(target + '/#/city/tokyo', { waitUntil: 'networkidle' });
    await page.getByLabel('城市行程选择篮').waitFor();
    await page.getByRole('heading', { name: '先认识一座城，再决定怎样停留。' }).waitFor();
    await page.screenshot({ path: 'artifacts/qa/city-home-desktop.png' });
    assert.equal(await page.locator('.ch-tabs [role=tab]').count(), 4);
  });
  await check('choose sight, restaurant, hotel and activity with correct units and options', async () => {
    await page.getByLabel(`选择${tokyo.attractions[0].name}`, { exact: true }).click();
    for (const kind of ['restaurant', 'hotel', 'experience']) {
      await page.locator('#ch-tab-' + kind).click();
      const card = page.locator('.ch-service-card').first();
      await card.getByRole('button', { name: /加入我的行程|住在这里|安排这顿饭/ }).click();
    }
    await page.locator('#ch-tab-restaurant').click();
    await page.locator('.ch-tabs').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'artifacts/qa/city-home-restaurant.png' });
    await page.getByRole('button', { name: '用这些选择更新行程', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).stops[0].experienceSelections?.length === 3);
    const p = await current();
    assert.equal(p.stops[0].attractionIds.length, 1);
    const r = await fetch(target + '/api/plan', { method: 'POST', body: JSON.stringify(p) });
    const result = await r.json(); assert.equal(r.status, 200, JSON.stringify(result));
    const kinds = result.itinerary.flatMap(d => d.items).map(i => i.kind);
    assert.ok(kinds.includes('hotel') && kinds.includes('experience') && kinds.includes('meal'));
    assert.ok(result.lines.find(l => l.id === 'stop-0-lodging').label.includes(tokyo.experiences.find(e => e.kind === 'hotel').name));
    const local = calculatePlan(p, catalog.cities, catalog.rates);
    assert.equal(result.total, local.total);
    for (const day of result.itinerary) assert.ok(day.activeMinutes <= 720, 'No multi-day content forced into one day');
    return { days: p.stops[0].days, total: result.total };
  });
  await check('timeline presents booked choices, reload persists them, removing activity recomputes cost', async () => {
    await page.locator('.selected-experiences').waitFor();
    assert.equal(await page.locator('.selected-experience-row').count(), 3);
    await page.locator('.timeline-experience').first().waitFor();
    await page.locator('.selected-experiences').scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'artifacts/qa/city-experience-timeline.png' });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal((await current()).stops[0].experienceSelections.length, 3);
    await page.getByRole('tab', { name: /每日行程/ }).click();
    const activity = tokyo.experiences.find(e => e.kind === 'experience');
    const before = calculatePlan(await current(), catalog.cities, catalog.rates).total;
    await page.getByLabel('移除' + activity.name, { exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).stops[0].experienceSelections.length === 2);
    assert.ok(calculatePlan(await current(), catalog.cities, catalog.rates).total < before);
  });
  await check('mobile city homepage and basket fit viewport without overlapping old budget bar', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(target + '/#/city/venice', { waitUntil: 'networkidle' });
    await page.getByLabel('城市行程选择篮').waitFor();
    await page.locator('#ch-tab-experience').click();
    await page.locator('.ch-tabs').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('.mobile-budget-bar').count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.ok((await page.locator('.ch-service-card').innerText()).includes('5'));
    await page.screenshot({ path: 'artifacts/qa/city-home-mobile.png' });
    await page.getByLabel('查看选择并生成行程').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  });
  assert.equal(report.pageErrors.length, 0);
} finally {
  await browser.close();
  await writeFile('artifacts/qa/city-homes-report.json', JSON.stringify(report, null, 2));
}
if (report.checks.some(c => !c.passed) || report.pageErrors.length) process.exitCode = 1;
