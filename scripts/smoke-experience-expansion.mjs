import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const catalog = await (await fetch(`${base}/api/catalog`)).json();
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const report = { checkedAt: new Date().toISOString(), checks: [], errors: [] };
await mkdir('artifacts/qa', { recursive: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', reducedMotion: 'reduce' });
const seed = { originId: 'chiang-mai', stops: [{ cityId: 'chiang-mai', days: 3, attractionIds: [], planningMode: 'smart' }], departureDate: '2026-11-12', travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: false, reservePercent: 0, overrides: {} };
await context.addInitScript(seed => { if (!localStorage.getItem('tusuan-projects')) localStorage.setItem('tusuan-current', JSON.stringify(seed)); }, seed);
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', error => report.errors.push(error.message));
async function check(name, run) { try { const detail = await run(); report.checks.push({ name, passed: true, detail }); console.log('PASS', name); } catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log('FAIL', name, error.message); } }
try {
  await check('new cities expose all three categories with traceable prices and real provider links', async () => {
    for (const id of ['hanoi', 'reykjavik', 'male', 'maafushi', 'cappadocia', 'cancun']) {
      const city = catalog.cities.find(city => city.id === id);
      for (const kind of ['restaurant', 'hotel', 'experience']) assert(city.experiences.some(e => e.kind === kind), `${id}/${kind}`);
    }
    await page.goto(`${base}/#/city/reykjavik`, { waitUntil: 'networkidle' });
    await page.locator('#ch-tab-hotel').click();
    const card = page.locator('.ch-service-card').first();
    assert((await card.innerText()).includes('参考预算'));
    assert((await card.innerText()).includes('非实时售价'));
    assert(await card.getByRole('link', { name: '商家与查询来源' }).first().getAttribute('href'));
    await page.screenshot({ path: 'artifacts/qa/experience-expansion-reykjavik.png', fullPage: true });
  });
  await check('Thai riding package can be selected and retains meal and transfer accounting after reload', async () => {
    await page.goto(`${base}/#/city/chiang-mai`, { waitUntil: 'networkidle' });
    await page.locator('#ch-tab-experience').click();
    const card = page.locator('.ch-service-card').filter({ hasText: 'Patara 大象照护与骑乘' });
    await card.getByRole('button', { name: /加入我的行程/ }).click();
    await page.locator('.ch-generate').click();
    await page.waitForURL('**/#/planner');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).stops[0].experienceSelections?.some(row => row.experienceId === 'ex-aa-chiang-mai-patara-riding'));
    const plan = await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
    const response = await context.request.post(`${base}/api/plan`, { data: plan });
    const result = await response.json(); assert.equal(response.status(), 200, JSON.stringify(result));
    const activity = result.itinerary.flatMap(day => day.items).find(item => item.experienceId === 'ex-aa-chiang-mai-patara-riding');
    assert(activity && activity.includesTransfers && activity.includedMeals.includes('lunch'));
    assert.equal(result.lines.filter(line => line.experienceId === activity.experienceId).length, 1);
    assert(!result.itinerary.flatMap(day => day.items).some(item => item.segment?.toId === activity.experienceId));
    await page.reload({ waitUntil: 'networkidle' });
    assert((await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')))).stops[0].experienceSelections.some(row => row.experienceId === activity.experienceId));
    return { package: activity.optionId, start: activity.time, duration: activity.durationMinutes, total: result.total };
  });
  await check('expanded cards remain readable on a phone with long names and prices', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${base}/#/city/chiang-mai`, { waitUntil: 'networkidle' });
    await page.locator('#ch-tab-experience').click();
    await page.locator('.ch-service-card').first().waitFor();
    const layout = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, small: [...document.querySelectorAll('.ch-service-card small,.ch-price-source')].filter(node => node.getClientRects().length).map(node => parseFloat(getComputedStyle(node).fontSize)) }));
    assert(layout.document <= layout.width + 1, JSON.stringify(layout)); assert(layout.small.every(size => size >= 12), JSON.stringify(layout));
    await page.screenshot({ path: 'artifacts/qa/experience-expansion-mobile.png', fullPage: true });
  });
} finally {
  await browser.close(); await writeFile('artifacts/qa/experience-expansion-report.json', JSON.stringify(report, null, 2));
}
if (report.errors.length || report.checks.some(check => !check.passed)) process.exitCode = 1;
