import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const output = path.resolve('artifacts/qa');
await mkdir(output, { recursive: true });
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], requestErrors: [], screenshots: [] };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN', reducedMotion: 'reduce' });
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', error => report.pageErrors.push(error.message));
page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(target)) report.requestErrors.push({ url: response.url(), status: response.status() }); });
page.on('requestfailed', request => { if (request.url().startsWith(target) && request.failure()?.errorText !== 'net::ERR_ABORTED') report.requestErrors.push({ url: request.url(), error: request.failure()?.errorText }); });
const catalog = await (await context.request.get(`${target}/api/catalog`)).json();
const city = id => catalog.cities.find(row => row.id === id);
const current = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
const base = { originId: 'shanghai', departureDate: '2030-10-23', travelers: 2, rooms: 1, mode: 'travel', currency: 'CNY', tier: 1, reservePercent: 10, returnTrip: true, overrides: {}, stops: [{ cityId: 'beijing', days: 5, planningMode: 'smart', attractionIds: [] }] };

async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? ': ' + JSON.stringify(detail) : ''}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function fixture(plan, name = 'QA 国家规划') {
  if (!page.url().startsWith(target)) await page.goto(`${target}/#/planner`, { waitUntil: 'networkidle' });
  const project = { id: 'qa-country-base', name, plan, createdAt: '2026-09-22T00:00:00.000Z', updatedAt: '2026-09-22T00:00:00.000Z' };
  await page.evaluate(({ plan, project }) => {
    localStorage.setItem('tusuan-current', JSON.stringify(plan));
    localStorage.setItem('tusuan-projects', JSON.stringify({ version: 1, activeId: project.id, projects: [project] }));
    window.location.hash = '/planner';
  }, { plan, project });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.trip-controls').waitFor();
}
async function newCountry(code = 'JP', days = 10) {
  await page.locator('.project-bar').getByRole('button', { name: '新建项目', exact: true }).click();
  await page.getByRole('button', { name: '探索一个国家', exact: true }).click();
  await country(code, days);
}
async function country(code, days) {
  await page.getByLabel('目的国家或地区', { exact: true }).selectOption(code);
  await page.getByLabel('国家旅程总天数', { exact: true }).fill(String(days));
  await page.locator('.country-trip-city').first().waitFor();
}
async function visibleRoute() {
  const rows = await page.locator('.country-trip-city').evaluateAll(nodes => nodes.map(node => ({
    name: node.querySelector('.country-trip-city-copy h4').textContent.replace(/^\d+/, '').trim(),
    days: parseInt(node.querySelector('.country-trip-day-stepper strong').textContent, 10),
  })));
  return rows.map(row => ({ ...row, cityId: catalog.cities.find(city => city.name === row.name)?.id }));
}
async function screenshot(name) {
  const file = path.join(output, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.screenshots.push(file);
}
async function noOverflow() {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, dialog: (() => { const el = document.querySelector('dialog'); return el ? { scroll: el.scrollWidth, client: el.clientWidth, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right } : null; })() }));
  assert(sizes.document <= sizes.viewport + 1 && sizes.body <= sizes.viewport + 1, JSON.stringify(sizes));
  if (sizes.dialog) assert(sizes.dialog.scroll <= sizes.dialog.client + 1 && sizes.dialog.left >= -1 && sizes.dialog.right <= sizes.viewport + 1, JSON.stringify(sizes));
  return sizes;
}
async function styleBeforeBudget() {
  const layout = await page.evaluate(() => {
    const style = document.querySelector('.style-panel'), budget = document.querySelector('.budget-panel');
    return { inDomOrder: !!(style.compareDocumentPosition(budget) & Node.DOCUMENT_POSITION_FOLLOWING), bottom: style.getBoundingClientRect().bottom, budgetTop: budget.getBoundingClientRect().top, count: document.querySelectorAll('.style-panel').length };
  });
  assert.equal(layout.inDomOrder, true);
  assert.equal(layout.count, 1);
  assert(layout.bottom <= layout.budgetTop + 1, JSON.stringify(layout));
  return layout;
}
async function apiBudget() {
  const response = await context.request.post(`${target}/api/plan`, { data: await current() });
  assert.equal(response.status(), 200, await response.text());
  return response.json();
}

let initialJapan;
try {
  await check('new project offers a Japan ten-day route with several cities and transport included', async () => {
    await fixture(base);
    await newCountry('JP', 10);
    initialJapan = await visibleRoute();
    assert(initialJapan.length >= 2, JSON.stringify(initialJapan));
    assert.equal(initialJapan.reduce((sum, row) => sum + row.days, 0), 10);
    assert(initialJapan.every(row => city(row.cityId).countryCode === 'JP'));
    assert(await page.locator('.country-trip-leg').count() >= initialJapan.length);
    assert.match(await page.locator('.country-trip-metrics').textContent(), /跨城与进出交通/);
    assert.equal(await page.getByRole('button', { name: '创建国家旅行项目', exact: true }).isEnabled(), true);
    await screenshot('country-japan-ten-days-desktop');
    return initialJapan;
  });
  await check('manual country city order and day allocation keep ten days through creation and generation', async () => {
    assert(initialJapan?.length >= 2, 'The Japan draft must be available');
    await page.getByRole('button', { name: `将${initialJapan[1].name}提前`, exact: true }).click();
    let revised = await visibleRoute();
    assert.equal(revised[0].cityId, initialJapan[1].cityId);
    const firstDays = revised[0].days;
    await page.getByRole('button', { name: `增加${revised[0].name}一天`, exact: true }).click();
    revised = await visibleRoute();
    assert.equal(revised[0].days, firstDays + 1);
    assert.equal(revised.reduce((sum, row) => sum + row.days, 0), 10);
    await page.getByLabel('国家旅行项目名称', { exact: true }).fill('QA 日本十天手调路线');
    await page.getByRole('button', { name: '创建国家旅行项目', exact: true }).click();
    await page.locator('.country-trip-planner').waitFor({ state: 'detached' });
    const expected = revised.map(({ cityId, days }) => ({ cityId, days }));
    assert.deepEqual((await current()).stops.map(({ cityId, days }) => ({ cityId, days })), expected);
    await page.getByRole('button', { name: '生成旅行计划', exact: true }).click();
    await page.locator('.itinerary-workspace').waitFor();
    assert.deepEqual((await current()).stops.map(({ cityId, days }) => ({ cityId, days })), expected);
    const calculated = await apiBudget();
    assert.equal(calculated.itinerary.length, 10);
    assert(calculated.lines.some(line => line.category === 'intercity' && line.amount > 0));
    assert(calculated.itinerary.some(day => day.items.some(item => item.journey)));
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual((await current()).stops.map(({ cityId, days }) => ({ cityId, days })), expected);
    return expected;
  });
  await check('travel style is above the budget and changing tier immediately updates the budget', async () => {
    const layout = await styleBeforeBudget();
    await page.locator('.style-panel .tier-card').nth(0).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).tier === 0);
    await page.waitForTimeout(400);
    const low = await page.locator('.budget-total h2').textContent();
    const lowBudget = await apiBudget();
    await page.locator('.style-panel .tier-card').nth(2).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).tier === 2);
    await page.waitForFunction(before => document.querySelector('.budget-total h2').textContent !== before, low);
    const high = await page.locator('.budget-total h2').textContent();
    const highBudget = await apiBudget();
    assert(highBudget.total > lowBudget.total, `${highBudget.total} <= ${lowBudget.total}`);
    assert.equal(await page.locator('.style-panel .tier-card').nth(2).getAttribute('aria-pressed'), 'true');
    return { layout, low, high, lowerTotal: lowBudget.total, higherTotal: highBudget.total };
  });
  await check('adding Thailand preserves the manual stop and unaffected quotes, while changed nights and return are requoted', async () => {
    const ids = city('beijing').attractions.slice(0, 2).map(row => row.id);
    const manual = { cityId: 'beijing', days: 5, planningMode: 'manual', attractionIds: ids, dayPlans: [[ids[1]], [], [ids[0]], [], []], startTime: '10:00', visitDurations: { [ids[0]]: 90, [ids[1]]: 120 }, transportWindow: { arrivalReadyTime: '13:00', arrivalDayOffset: 0 } };
    const overrides = {
      'stop-0-lodging': { amount: 2789, confirmed: true },
      'stop-0-food': { amount: 987, confirmed: true },
      'leg-0': { amount: 3456.78, confirmed: true },
      'leg-return': { amount: 4321, confirmed: true },
    };
    await fixture({ ...base, stops: [manual], overrides }, 'QA 手动北京接泰国');
    const before = await current();
    const beforeBudget = await apiBudget();
    await page.locator('.add-stop').click();
    await page.getByRole('button', { name: '探索一个国家', exact: true }).click();
    await country('TH', 7);
    const appended = await visibleRoute();
    assert.equal(appended.reduce((sum, row) => sum + row.days, 0), 7);
    assert.match(await page.locator('.country-trip-origin').textContent(), /接续 北京/);
    await screenshot('country-thailand-append-desktop');
    await page.getByRole('button', { name: '将这些城市加入旅程', exact: true }).click();
    await page.locator('.country-trip-planner').waitFor({ state: 'detached' });
    const after = await current();
    assert.deepEqual(after.stops[0], before.stops[0]);
    for (const id of ['stop-0-food', 'leg-0']) assert.deepEqual(after.overrides[id], before.overrides[id]);
    assert.equal(after.overrides['stop-0-lodging'], undefined);
    assert.equal(after.overrides['leg-return'], undefined);
    const notice = await page.locator('.toast').textContent();
    assert.match(notice, /变化|变动|重新|核对|参考/);
    const afterBudget = await apiBudget();
    const beforeLodging = beforeBudget.lines.find(line => line.id === 'stop-0-lodging');
    const afterLodging = afterBudget.lines.find(line => line.id === 'stop-0-lodging');
    assert.equal(afterLodging.quantity, beforeLodging.quantity + before.rooms);
    assert.notEqual(afterLodging.amount, overrides['stop-0-lodging'].amount);
    assert.equal(afterLodging.confirmed, false);
    assert.equal(after.stops.slice(1).reduce((sum, row) => sum + row.days, 0), 7);
    assert(after.stops.slice(1).every(row => city(row.cityId).countryCode === 'TH'));
    assert.equal(after.stops.reduce((sum, row) => sum + row.days, 0), 12);
    return { appended, preservedManualStop: after.stops[0], preservedQuotes: after.overrides, notice, beforeNights: beforeLodging.quantity, afterNights: afterLodging.quantity };
  });
  await check('New York to Japan for one day shows a transport conflict and disables confirmation', async () => {
    await fixture({ ...base, originId: 'new-york' });
    await newCountry('JP', 1);
    assert.equal(await page.getByRole('button', { name: '创建国家旅行项目', exact: true }).isDisabled(), true);
    const notes = await page.locator('.country-trip-notes').textContent();
    assert.match(notes, /不足|未能安排景点/);
    assert(await page.locator('.country-trip-notes .is-danger').count() > 0);
    await screenshot('country-japan-one-day-warning');
    return { notes };
  });
  await check('France discloses its single maintained city instead of implying complete country coverage', async () => {
    await country('FR', 7);
    const rows = await visibleRoute();
    const notes = await page.locator('.country-trip-notes').textContent();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].cityId, 'paris');
    assert.equal(rows[0].days, 7);
    assert.match(notes, /法国的 1 个已维护城市/);
    assert.match(notes, /不代表该国家的全部城市或景点/);
    return { rows, notes };
  });
  await check('390px country planning keeps controls and long route cards within the viewport', async () => {
    await page.getByLabel('关闭弹窗', { exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await fixture(base);
    await newCountry('JP', 10);
    const sizes = await noOverflow();
    const buttons = await page.locator('.country-trip-city-actions button').evaluateAll(nodes => nodes.map(node => ({ left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right })));
    assert(buttons.every(button => button.left >= 0 && button.right <= 390), JSON.stringify(buttons));
    await screenshot('country-japan-ten-days-mobile-390');
    await page.getByRole('button', { name: '创建国家旅行项目', exact: true }).click();
    await page.locator('.country-trip-planner').waitFor({ state: 'detached' });
    assert.equal((await current()).stops.reduce((sum, row) => sum + row.days, 0), 10);
    return sizes;
  });
  await check('390px travel style stays above the budget without page overflow', async () => {
    const sizes = await noOverflow();
    const layout = await styleBeforeBudget();
    await page.locator('.style-panel').scrollIntoViewIfNeeded();
    await screenshot('country-budget-style-mobile-390');
    return { sizes, layout };
  });
} finally {
  await browser.close();
  await writeFile(path.join(output, 'country-planning-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ checks: report.checks.length, failed: report.checks.filter(row => !row.passed), pageErrors: report.pageErrors, requestErrors: report.requestErrors }, null, 2));
}
if (report.checks.some(row => !row.passed) || report.pageErrors.length || report.requestErrors.length) process.exitCode = 1;
