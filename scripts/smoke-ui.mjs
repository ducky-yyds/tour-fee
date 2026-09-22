import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const out = path.resolve('artifacts', 'qa');
await mkdir(out, { recursive: true });
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], failedRequests: [], httpErrors: [], screenshots: [] };
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
function monitor(page, viewport) {
  page.on('pageerror', error => report.pageErrors.push({ viewport, error: error.message }));
  page.on('requestfailed', request => report.failedRequests.push({ viewport, url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) report.httpErrors.push({ viewport, url: response.url(), status: response.status() }); });
  page.setDefaultTimeout(10000);
}
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? ': ' + JSON.stringify(detail) : ''}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function snapshot(page, name) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const file = path.join(out, name + '.png');
  await page.screenshot({ path: file, fullPage: true });
  report.screenshots.push(file);
}
async function savedPlan(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current'))); }
async function overflow(page) { return page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth })); }
async function amount(page) { return Number((await page.locator('.budget-total h2').innerText()).replace(/[^\d.]/g, '')); }

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1024 }, locale: 'zh-CN' });
  const page = await desktop.newPage(); monitor(page, 'desktop');
  await check('desktop boot and photos', async () => {
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.locator('.hero').waitFor();
    assert.equal(await page.locator('.stop-row').count(), 2);
    await snapshot(page, 'desktop-1440-planner');
    const photos = await page.locator('img').evaluateAll(images => images.map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })));
    assert(photos.every(image => image.loaded));
    const width = await overflow(page); assert(width.document <= width.viewport);
    return { photos: photos.length, width, budget: await amount(page) };
  });
  await check('desktop navigation, destination search and sources', async () => {
    const catalog = await (await desktop.request.get(target + '/api/catalog')).json();
    await page.locator('.main-nav').getByRole('button', { name: '探索目的地', exact: true }).click();
    assert.equal(await page.locator('.explore-card').count(), catalog.cities.length);
    await page.getByLabel('搜索目的地').fill('巴黎');
    assert.equal(await page.locator('.explore-card').count(), 1);
    await page.locator('.main-nav').getByRole('button', { name: '数据来源', exact: true }).click();
    await page.locator('.sources-page').waitFor();
    assert.equal(await page.locator('.city-sources').count(), catalog.cities.length);
    await page.locator('.main-nav').getByRole('button', { name: '规划旅程', exact: true }).click();
  });
  await check('add Paris and update currency', async () => {
    await page.locator('.add-stop').click();
    await page.locator('dialog .search-box input').fill('Paris');
    await page.locator('dialog .picker-city').click();
    await page.getByLabel('显示币种').selectOption('USD');
    const p = await savedPlan(page);
    assert.deepEqual(p.stops.map(stop => stop.cityId), ['tokyo', 'kyoto', 'paris']);
    assert.equal(p.currency, 'USD');
    return { stops: p.stops.map(stop => stop.cityId), currency: p.currency };
  });
  await check('return toggle recomputes budget', async () => {
    const before = await amount(page);
    await page.locator('.toggle-label input').uncheck();
    const after = await amount(page);
    assert.equal((await savedPlan(page)).returnTrip, false);
    assert(after < before);
    assert.equal(await page.locator('.route-end').count(), 0);
    return { before, after };
  });
  await check('cost override and confirmed flag', async () => {
    await page.getByRole('tab', { name: /费用明细/ }).click();
    await page.locator('.cost-table tbody tr').first().click();
    await page.locator('#actual-amount').fill('1234.56');
    await page.locator('dialog .check-label input').check();
    await page.getByRole('button', { name: '保存这笔费用', exact: true }).click();
    const values = Object.values((await savedPlan(page)).overrides);
    assert.equal(values.length, 1); assert.equal(values[0].amount, 1234.56); assert.equal(values[0].confirmed, true);
    assert.equal(await page.locator('.confirm-button.done').count(), 1);
    await snapshot(page, 'desktop-1440-costs');
    return values[0];
  });
  await check('save plan and restore after reload', async () => {
    await page.locator('.title-actions .secondary-button').click();
    await page.locator('#trip-name').fill('浏览器 QA 东京京都巴黎');
    await page.locator('dialog .primary-button').click();
    const workspace = await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-projects')));
    assert.equal(workspace.projects.length, 2);
    assert.equal(workspace.projects.find(p=>p.id===workspace.activeId).name, '浏览器 QA 东京京都巴黎');
    await page.reload({ waitUntil: 'networkidle' });
    const p = await savedPlan(page);
    assert.equal(p.stops.length, 3); assert.equal(p.currency, 'USD'); assert.equal(Object.keys(p.overrides).length, 1);
    await page.locator('.saved-button').click();
    assert.equal(await page.locator('.project-card').count(), 2);
    await page.locator('.project-card').filter({hasText:'浏览器 QA 东京京都巴黎'}).getByRole('button',{name:'打开项目'}).click();
    await page.getByRole('tab', { name: /每日行程/ }).click();
    await page.locator('.itinerary-section').waitFor();
    assert.equal(await page.locator('.error-notice').count(), 0);
  });
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1, hasTouch: true, locale: 'zh-CN' });
  const phone = await mobile.newPage(); monitor(phone, 'mobile');
  await check('mobile boot and 390px layout', async () => {
    await phone.goto(target, { waitUntil: 'networkidle' });
    await phone.locator('.hero').waitFor();
    await snapshot(phone, 'mobile-390-planner');
    const width = await overflow(phone); assert(width.document <= width.viewport, JSON.stringify(width));
    assert(await phone.getByLabel('展开导航').isVisible());
    return width;
  });
  await check('mobile navigation and explore layout', async () => {
    await phone.getByLabel('展开导航').click();
    const catalog = await (await mobile.request.get(target + '/api/catalog')).json();
    await phone.locator('.main-nav').getByRole('button', { name: '探索目的地', exact: true }).click();
    assert.equal(await phone.locator('.explore-card').count(), catalog.cities.length);
    await snapshot(phone, 'mobile-390-explore');
    const width = await overflow(phone); assert(width.document <= width.viewport, JSON.stringify(width));
    await phone.getByLabel('展开导航').click();
    await phone.locator('.main-nav').getByRole('button', { name: '规划旅程', exact: true }).click();
    return width;
  });
  await check('mobile picker and cost editor', async () => {
    await phone.locator('.add-stop').click();
    await phone.locator('dialog .search-box input').fill('Osaka');
    await snapshot(phone, 'mobile-390-picker');
    await phone.locator('dialog .picker-city').click();
    assert.equal((await savedPlan(phone)).stops.length, 3);
    await phone.getByRole('tab', { name: /费用明细/ }).click();
    await phone.locator('.cost-table tbody tr').first().click();
    await phone.locator('#actual-amount').fill('888');
    await snapshot(phone, 'mobile-390-cost-editor');
    await phone.getByRole('button', { name: '保存这笔费用', exact: true }).click();
    assert.equal(Object.values((await savedPlan(phone)).overrides)[0].amount, 888);
    const width = await overflow(phone); assert(width.document <= width.viewport, JSON.stringify(width));
    return width;
  });
  await mobile.close();
} finally {
  await browser.close();
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checks: report.checks.length, failedChecks: report.checks.filter(x => !x.passed), pageErrors: report.pageErrors, failedRequests: report.failedRequests, httpErrors: report.httpErrors, screenshots: report.screenshots }, null, 2));
}
if (report.checks.some(check => !check.passed) || report.pageErrors.length || report.httpErrors.length || report.failedRequests.length) process.exitCode = 1;
