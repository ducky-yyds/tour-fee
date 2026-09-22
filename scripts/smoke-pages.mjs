import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

const base = (process.env.STATIC_SITE_URL || 'http://127.0.0.1:4173/tour-fee/').replace(/\/?$/, '/');
const airport = JSON.parse(readFileSync('data/airport-cities.json', 'utf8')).cities.find(city => city.iata === 'AUH');
const report = { base, checkedAt: new Date().toISOString(), checks: [], errors: [], badResponses: [], apiRequests: [] };
await mkdir('artifacts/qa', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true, ...(process.env.STATIC_TEST_PROXY ? { proxy: { server: process.env.STATIC_TEST_PROXY } } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN', reducedMotion: 'reduce' });
const page = await context.newPage(); page.setDefaultTimeout(20000);
page.on('pageerror', error => report.errors.push(error.message));
page.on('request', request => { if (request.url().startsWith(new URL(base).origin) && new URL(request.url()).pathname.includes('/api/')) report.apiRequests.push(request.url()); });
page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) report.badResponses.push({ url: response.url(), status: response.status() }); });
async function check(name, action) { try { const detail = await action(); report.checks.push({ name, passed: true, detail }); console.log('PASS', name); } catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log('FAIL', name, error.message); } }
const layout = () => page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
try {
  await check('subpath boot, stylesheet, favicon and city photographs load without a backend', async () => {
    await page.goto(base, { waitUntil: 'networkidle' }); await page.locator('.trip-controls').waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('.hc-photo')].some(image => image.complete && image.naturalWidth > 0));
    assert((await page.locator('link[rel=icon]').getAttribute('href')).startsWith(new URL(base).pathname));
    assert.equal((await context.request.get(new URL('favicon.svg', base).href)).status(), 200);
    const images = await page.locator('img').evaluateAll(images => images.map(image => image.getAttribute('src')).filter(src => src?.startsWith('/')));
    assert(images.every(src => src.startsWith(new URL(base).pathname)), JSON.stringify(images));
    await page.screenshot({ path: 'artifacts/qa/pages-planner-desktop.png' });
  });
  await check('static budget reacts immediately and travel projects survive reload', async () => {
    const before = await page.locator('.budget-total h2').innerText();
    await page.locator('.style-panel .tier-card').last().click();
    await page.waitForFunction(before => document.querySelector('.budget-total h2').innerText !== before, before);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.style-panel .tier-card').last().getAttribute('aria-pressed'), 'true');
  });
  await check('static country planning creates a multi-city project with a fixed total', async () => {
    await page.getByRole('button', { name: '新建项目', exact: true }).click();
    await page.getByRole('button', { name: '探索一个国家', exact: true }).click();
    await page.getByLabel('目的国家或地区').selectOption('JP');
    await page.getByLabel('国家旅程总天数').fill('10');
    await page.getByRole('button', { name: '创建国家旅行项目', exact: true }).click();
    await page.waitForFunction(() => { const plan = JSON.parse(localStorage.getItem('tusuan-current')); return plan.stops.length === 3 && plan.stops.reduce((sum, stop) => sum + stop.days, 0) === 10; });
    const plan = await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
    assert(plan.stops.every(stop => stop.attractionIds.length > 0));
    return plan.stops.map(({ cityId, days }) => ({ cityId, days }));
  });
  await check('city home and on-demand airport directory work from static snapshots', async () => {
    await page.goto(`${base}#/city/reykjavik`, { waitUntil: 'networkidle' });
    await page.locator('#ch-tab-experience').click(); await page.locator('.ch-service-card').first().waitFor();
    await page.goto(`${base}#/city/${airport.id}`, { waitUntil: 'networkidle' });
    await page.locator('.airport-list article').first().waitFor();
    assert((await page.locator('.airport-city-page').innerText()).includes('AUH'));
  });
  await check('globe imagery and geography load under the repository prefix', async () => {
    await page.goto(`${base}#/globe`, { waitUntil: 'networkidle' });
    await page.locator('.eg-surface[data-renderer="webgl"]').waitFor();
    assert(await page.locator('canvas.eg-earth-canvas').isVisible());
    await page.locator('.eg-city-label').first().waitFor();
    for (const file of ['maps/earth-day.jpg', 'maps/earth-clouds.jpg', 'maps/countries-110m.json']) assert.equal((await context.request.get(new URL(file, base).href)).status(), 200);
    await page.screenshot({ path: 'artifacts/qa/pages-globe-desktop.png' });
  });
  await check('public maintenance status and phone navigation require no local service', async () => {
    await page.goto(`${base}#/sources`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('.update-facts')?.textContent.includes('GitHub Actions'));
    assert(!(await page.locator('.update-facts').innerText()).includes('本机任务'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}#/planner`, { waitUntil: 'networkidle' });
    const size = await layout(); assert(size.scroll <= size.width + 1, JSON.stringify(size));
    await page.getByLabel('展开导航').click();
    await page.locator('.main-nav').getByRole('button', { name: '旅居生活', exact: true }).click();
    await page.locator('.living-page').waitFor();
    const livingSize = await layout(); assert(livingSize.scroll <= livingSize.width + 1, JSON.stringify(livingSize));
  });
} finally {
  await browser.close(); await writeFile('artifacts/qa/pages-report.json', JSON.stringify(report, null, 2));
}
if (report.checks.some(check => !check.passed) || report.errors.length || report.badResponses.length || report.apiRequests.length) { console.log(JSON.stringify(report, null, 2)); process.exitCode = 1; }
