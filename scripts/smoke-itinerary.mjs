import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { calculatePlan, generateItinerary } from '../shared/planner.mjs';
import { geographicDistanceKm } from '../shared/itinerary.mjs';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const out = path.resolve('artifacts', 'qa');
await mkdir(out, { recursive: true });
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], screenshots: [] };
const catalogResponse = await fetch(`${target}/api/catalog`);
assert.equal(catalogResponse.status, 200, 'API must be running before the browser smoke test');
const catalog = await catalogResponse.json();
const tokyo = catalog.cities.find(c => c.id === 'tokyo');
assert.ok(tokyo.attractions.length >= 6, 'Run after the expanded Tokyo catalog is available');
const attractions = tokyo.attractions.slice(0, 6), ids = attractions.map(a => a.id);
const byId = new Map(attractions.map(a => [a.id, a]));
const routeDistance = order => order.slice(1).reduce((sum, id, i) => sum + geographicDistanceKm(byId.get(order[i]), byId.get(id)), 0);
let worst = [...ids], worstDistance = 0;
function permute(prefix, rest) {
  if (!rest.length) {
    const distance = routeDistance(prefix);
    if (distance > worstDistance) { worstDistance = distance; worst = [...prefix]; }
    return;
  }
  for (let i = 0; i < rest.length; i++) permute([...prefix, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
}
permute([ids[0]], ids.slice(1));
const date = new Date(); date.setUTCDate(date.getUTCDate() + 30);
const seeded = { originId: 'shanghai', stops: [{ cityId: 'tokyo', days: 3, attractionIds: ids, dayPlans: [worst, [], []], startTime: '09:00' }], departureDate: date.toISOString().slice(0, 10), travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true, reservePercent: 10, overrides: { 'stop-0-food': { amount: 1000.01, confirmed: true }, 'stop-0-transport': { amount: 61.07, confirmed: true }, 'stop-0-lodging': { amount: 2500, confirmed: true } } };
const modeled = generateItinerary(seeded, catalog.cities, catalog.rates);
assert.ok(modeled[0].warnings.some(w => w.code === 'busy-day'), 'Fixture must be visibly overloaded');
assert.ok(modeled[0].warnings.some(w => w.code === 'detour'), 'Fixture must have a geographically meaningful detour');
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN' });
await context.addInitScript(plan => { if (!localStorage.getItem('tusuan-current')) localStorage.setItem('tusuan-current', JSON.stringify(plan)); }, seeded);
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', error => report.pageErrors.push(error.message));
const current = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
const totalText = () => page.locator('.budget-total h2').innerText();
const dayCard = index => page.locator(`.planning-day[data-day-index="${index}"]`);
const placeIds = index => dayCard(index).locator('[data-attraction-id]').evaluateAll(nodes => nodes.map(node => node.dataset.attractionId));
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? ': ' + JSON.stringify(detail) : ''}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function snapshot(name) {
  const file = path.join(out, name + '.png');
  await page.locator('.itinerary-workspace').scrollIntoViewIfNeeded();
  await page.screenshot({ path: file, fullPage: true });
  report.screenshots.push(file);
}
async function waitForPlan(predicate, argument) { await page.waitForFunction(({ predicate, argument }) => Function('plan', 'argument', `return (${predicate})(plan, argument)`)(JSON.parse(localStorage.getItem('tusuan-current')), argument), { predicate: predicate.toString(), argument }); }
let baselineTotal, baselineOverrides, manualAssignments;
try {
  await check('rich timeline shows scenic photos, durations, meals, routes and source links', async () => {
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: /每日行程/ }).click();
    await page.locator('.rich-timeline').waitFor();
    assert.equal(await page.locator('.timeline-attraction').count(), 6);
    assert.equal(await page.locator('.kind-meal .timeline-routine').count(), 3);
    assert.ok(await page.locator('.kind-transport .timeline-routine').count() >= 5);
    assert.ok(await page.locator('.kind-transport .timeline-routine a[href*="google.com/maps"]').count() >= 5);
    assert.equal(await page.locator('.timeline-attraction .visit-duration').count(), 6);
    assert.equal(await page.locator('.timeline-attraction a').count(), 6);
    assert.ok(await page.locator('.timeline-attraction img').count() >= 1);
    assert.deepEqual((await current()).stops[0].dayPlans, [worst, [], []]);
    baselineTotal = await totalText();
    return { cities: catalog.cities.length, spots: tokyo.attractions.length, total: baselineTotal };
  });
  await check('overload and detour warnings display without silently changing order', async () => {
    const warnings = await page.locator('.journal-warnings').innerText();
    assert.match(warnings, /超过 8 小时/);
    assert.match(warnings, /多绕/);
    assert.deepEqual((await current()).stops[0].dayPlans[0], worst);
    await snapshot('itinerary-rich-overloaded-desktop');
  });
  await check('timeline meal amount edits the parent food line and preserves other confirmations', async () => {
    await page.locator('.meal-budget').first().click();
    await page.locator('#actual-amount').fill('1234.57');
    await page.locator('dialog .check-label input').check();
    await page.getByRole('button', { name: '保存这笔费用', exact: true }).click();
    await waitForPlan(p => p.overrides['stop-0-food'].amount === 1234.57);
    const p = await current();
    assert.equal(p.overrides['stop-0-lodging'].amount, 2500);
    assert.equal(p.overrides['stop-0-transport'].amount, 61.07);
    assert.equal(p.overrides['stop-0-food'].confirmed, true);
    const exact = calculatePlan(p, catalog.cities, catalog.rates).total;
    assert.equal(Number((await totalText()).replace(/[^\d.]/g, '')), Math.round(exact));
    baselineTotal = await totalText(); baselineOverrides = structuredClone(p.overrides);
    return { food: p.overrides['stop-0-food'], exactTotal: exact };
  });
  await check('route suggestion applies only on click and keeps checked budget unchanged', async () => {
    await page.getByRole('button', { name: '调配景点', exact: true }).click();
    await dayCard(0).getByRole('button', { name: /采用顺路建议/ }).click();
    await waitForPlan((p, before) => JSON.stringify(p.stops[0].dayPlans[0]) !== JSON.stringify(before), worst);
    const next = await current();
    assert.equal(next.stops[0].dayPlans[0][0], worst[0]);
    assert.deepEqual([...next.stops[0].dayPlans[0]].sort(), [...worst].sort());
    assert.deepEqual(next.overrides, baselineOverrides);
    assert.equal(await totalText(), baselineTotal);
    return { before: worst, after: next.stops[0].dayPlans[0] };
  });
  await check('manual reorder and date selector persist their exact sequence', async () => {
    let p = await current();
    const moved = p.stops[0].dayPlans[0].at(-1);
    await page.getByLabel(`${byId.get(moved).name}安排日期`, { exact: true }).selectOption('1');
    await waitForPlan((p, id) => p.stops[0].dayPlans[1].includes(id), moved);
    p = await current();
    const first = p.stops[0].dayPlans[0][0], second = p.stops[0].dayPlans[0][1];
    await page.getByLabel(`下移${byId.get(first).name}`, { exact: true }).click();
    await waitForPlan((p, expected) => p.stops[0].dayPlans[0][0] === expected, second);
    assert.deepEqual((await current()).stops[0].dayPlans[0].slice(0, 2), [second, first]);
    assert.deepEqual((await current()).overrides, baselineOverrides);
    assert.equal(await totalText(), baselineTotal);
  });
  await check('native drag moves a scenic card across days without duplication or cost changes', async () => {
    // Keep source and target in the same visible board row so this tests native DnD,
    // rather than Playwright's unsupported auto-scrolling across a very tall day card.
    const p = await current(), dragged = p.stops[0].dayPlans[0][0];
    const source = dayCard(0).locator(`[data-attraction-id="${dragged}"]`);
    const destination = dayCard(1).locator('.planning-day-head');
    await source.locator('.drag-handle').dragTo(destination);
    await waitForPlan((p, id) => p.stops[0].dayPlans[1].includes(id), dragged);
    const after = await current();
    assert.equal(after.stops[0].dayPlans.flat().filter(id => id === dragged).length, 1);
    assert.deepEqual([...after.stops[0].dayPlans.flat()].sort(), [...ids].sort());
    assert.deepEqual(after.overrides, baselineOverrides);
    assert.equal(await totalText(), baselineTotal);
    assert.deepEqual(await placeIds(1), after.stops[0].dayPlans[1]);
    return { dragged, dayPlans: after.stops[0].dayPlans };
  });
  await check('start-time changes preserve manual assignments and all checked amounts', async () => {
    manualAssignments = structuredClone((await current()).stops[0].dayPlans);
    await page.getByTestId('itinerary-details-toggle').click();
    await page.getByLabel('每天出发时间', { exact: true }).fill('09:30');
    await waitForPlan(p => p.stops[0].startTime === '09:30');
    assert.deepEqual((await current()).stops[0].dayPlans, manualAssignments);
    assert.deepEqual((await current()).overrides, baselineOverrides);
    assert.equal(await totalText(), baselineTotal);
    await snapshot('itinerary-edit-custom-desktop');
  });
  await check('regeneration and reload honor customized day, order, start time and amounts', async () => {
    await page.getByRole('button', { name: /按我的安排生成/ }).click();
    assert.deepEqual((await current()).stops[0].dayPlans, manualAssignments);
    const names = manualAssignments[0].map(id => byId.get(id).name);
    assert.deepEqual(await page.locator('.timeline-attraction-title h4').allTextContents(), names);
    // The arrival day begins with its earlier intercity reserve. Check the
    // user's local start time on the middle day, which has no intercity leg.
    await page.locator('.journal-day-nav > button').nth(1).click();
    assert.match(await page.locator('.day-at-a-glance').innerText(), /09:30/);
    await page.locator('.journal-day-nav > button').first().click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: /每日行程/ }).click();
    assert.deepEqual((await current()).stops[0].dayPlans, manualAssignments);
    assert.equal((await current()).stops[0].startTime, '09:30');
    assert.deepEqual((await current()).overrides, baselineOverrides);
    assert.equal(await totalText(), baselineTotal);
    assert.deepEqual(await page.locator('.timeline-attraction-title h4').allTextContents(), names);
    await snapshot('itinerary-rich-custom-desktop');
  });
  await check('mobile itinerary preview and editing controls fit a 390px viewport', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    const preview = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    assert.ok(preview.width <= preview.viewport, JSON.stringify(preview));
    await snapshot('itinerary-rich-mobile-390');
    await page.getByRole('button', { name: '调配景点', exact: true }).click();
    const editor = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    assert.ok(editor.width <= editor.viewport, JSON.stringify(editor));
    assert.ok(await page.getByLabel(`${byId.get(manualAssignments[0][0]).name}安排日期`, { exact: true }).isVisible());
    await snapshot('itinerary-edit-mobile-390');
    return { preview, editor };
  });
} finally {
  await browser.close();
  await writeFile(path.join(out, 'itinerary-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
if (report.checks.some(c => !c.passed) || report.pageErrors.length) process.exitCode = 1;
