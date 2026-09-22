import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
await mkdir('artifacts/qa', { recursive: true });
const report = { checkedAt: new Date().toISOString(), checks: [], errors: [] };
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, locale: 'zh-CN' });
const page = await context.newPage();
page.setDefaultTimeout(15000);
page.on('pageerror', error => report.errors.push(error.message));
const catalog = await (await context.request.get(`${base}/api/catalog`)).json();
const airportCity = catalog.airportCities.find(city => city.iata === 'AUH');
const screenshot = name => page.screenshot({ path: `artifacts/qa/${name}.png`, fullPage: true });
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log('PASS', name, detail || ''); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log('FAIL', name, error.message); }
}
async function noOverflow(p = page) {
  const sizes = await p.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(sizes.document <= sizes.width + 1 && sizes.body <= sizes.width + 1, JSON.stringify(sizes));
}
try {
  await check('global airport directory includes actual commercial and local airports', async () => {
    assert(catalog.airportCoverage.airportCount > 45000);
    assert(catalog.airportCities.length > 30000);
    assert(catalog.airportCoverage.countryCount > 230);
    assert(airportCity);
    const r = await (await context.request.get(`${base}/api/airports?cityId=${airportCity.id}`)).json();
    assert(r.airports.some(airport => airport.iata === 'AUH'));
    return { airports: catalog.airportCoverage.airportCount, airportCities: catalog.airportCoverage.airportCityCount, countries: catalog.airportCoverage.countryCount };
  });
  await check('real textured earth and default city labels load with a bounded result list', async () => {
    await page.goto(`${base}/#/globe`, { waitUntil: 'networkidle' });
    await page.locator('.eg-surface[data-renderer="webgl"]').waitFor();
    assert(await page.locator('canvas.eg-earth-canvas').isVisible());
    assert(await page.locator('.eg-city-label').count() >= 12);
    assert(await page.getByLabel('目的地搜索结果', { exact: true }).locator('button').count() <= 36);
    const collisions = await page.locator('.eg-city-label').evaluateAll(labels => {
      const boxes = labels.map(label => ({ name: label.textContent, rect: label.getBoundingClientRect() }));
      return boxes.flatMap((a, i) => boxes.slice(i + 1).filter(b => a.rect.left < b.rect.right && a.rect.right > b.rect.left && a.rect.top < b.rect.bottom && a.rect.bottom > b.rect.top).map(b => [a.name,b.name]));
    });
    assert.deepEqual(collisions, []);
    await screenshot('earth-desktop-final');
    return { labels: await page.locator('.eg-city-label').count() };
  });
  await check('hovered city label keeps its own photo and preview is reachable', async () => {
    await page.locator('.eg-city-label[data-city-id="shanghai"]').hover();
    const card = page.getByTestId('globe-city-preview');
    await card.waitFor();
    assert((await card.innerText()).includes('上海'));
    await page.waitForFunction(() => { const image = document.querySelector('[data-testid="globe-city-preview"] img'); return image?.complete && image.naturalWidth > 0; });
    await card.locator('button').last().hover();
    await page.waitForTimeout(350);
    assert((await card.innerText()).includes('上海'));
    await screenshot('earth-city-preview-final');
    await card.getByRole('button', { name: '查看目的地' }).click();
    assert.equal(await page.locator('.gl-city-body h2').innerText(), '上海');
  });
  await check('globe drag, zoom, keyboard and cloud controls work', async () => {
    const globe = page.getByTestId('world-globe');
    const surface = page.locator('.eg-surface');
    const before = await globe.getAttribute('data-rotation');
    await surface.focus(); await page.keyboard.press('ArrowLeft');
    assert.notEqual(await globe.getAttribute('data-rotation'), before);
    await page.getByLabel('放大地球', { exact: true }).click();
    assert(Number(await globe.getAttribute('data-zoom')) > 1);
    const rect = await surface.boundingBox();
    const afterKey = await globe.getAttribute('data-rotation');
    await page.mouse.move(rect.x + 130, rect.y + 170); await page.mouse.down();
    await page.mouse.move(rect.x + 230, rect.y + 180, { steps: 5 }); await page.mouse.up();
    assert.notEqual(await globe.getAttribute('data-rotation'), afterKey);
    const cloud = page.locator('.eg-cloud-toggle');
    if (await cloud.count()) { const pressed = await cloud.getAttribute('aria-pressed'); await cloud.click(); assert.notEqual(await cloud.getAttribute('aria-pressed'), pressed); }
  });
  await check('airport search previews missing costs honestly and opens real airport details', async () => {
    await page.getByRole('switch', { name: '显示全部城市' }).check();
    await page.locator('#gl-city-search').fill('AUH');
    const result = page.getByLabel('目的地搜索结果', { exact: true }).getByRole('button').filter({ hasText: airportCity.name }).first();
    await result.click();
    assert((await page.locator('.gl-city-body').innerText()).includes('待补充'));
    await page.getByRole('button', { name: '查看目的地资料', exact: true }).click();
    await page.locator('.airport-list article').first().waitFor();
    assert((await page.locator('.airport-city-page').innerText()).includes('AUH'));
    assert(await page.locator('.airport-links a').first().getAttribute('href'));
    await noOverflow();
    await screenshot('airport-city-final');
  });
  await check('airport city can form an independent trip with incomplete budget and editable costs', async () => {
    await page.goto(`${base}/#/planner`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '新建项目', exact: true }).click();
    await page.getByLabel('搜索新项目目的地', { exact: true }).fill('AUH');
    await page.getByLabel('新项目目的地', { exact: true }).selectOption(airportCity.id);
    assert(await page.locator('select[aria-label="新项目目的地"] option').count() <= 81);
    await page.getByRole('button', { name: '创建旅行项目', exact: true }).click();
    await page.locator('.airport-budget-notice').waitFor();
    assert((await page.locator('.budget-total').innerText()).includes('已知费用小计'));
    await page.getByRole('tab', { name: /费用明细/ }).click();
    assert((await page.locator('.cost-table').innerText()).includes('待补充'));
    await page.getByLabel(`${airportCity.name}住宿偏好`, { exact: true }).fill('80');
    await page.getByLabel(`${airportCity.name}饮食偏好`, { exact: true }).fill('25');
    await page.getByLabel(`${airportCity.name}市内交通`, { exact: true }).fill('12');
    await page.getByRole('button', { name: '应用消费偏好', exact: true }).click();
    const plan = await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
    assert.equal(plan.stops[0].cityId, airportCity.id);
    assert.deepEqual(plan.stops[0].dailyPreferences, { lodging: 80, food: 25, transport: 12 });
    const response = await (await context.request.post(`${base}/api/plan`, { data: plan })).json();
    assert(response.incomplete && response.missingCosts.every(cost => cost.category === 'misc'));
    await screenshot('airport-budget-final');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')))).stops[0].cityId, airportCity.id);
    return { missing: response.missingCosts.length, knownSubtotal: response.knownSubtotal };
  });
  await check('global city picker is bounded, searches by airport code and selects origin', async () => {
    await page.locator('.origin-field').click();
    const dialog = page.getByRole('dialog');
    assert(await dialog.locator('.picker-city').count() <= 48);
    await dialog.getByPlaceholder('搜索城市、国家或机场代码').fill('AUH');
    await dialog.locator('.picker-city').filter({ hasText: airportCity.name }).first().click();
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')))).originId, airportCity.id);
  });
  await check('mobile globe has labels, touch previews and no page overflow', async () => {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, locale: 'zh-CN', reducedMotion: 'reduce' });
    phone.on('pageerror', e => report.errors.push(e.message));
    await phone.goto(`${base}/#/globe`, { waitUntil: 'networkidle' });
    await phone.locator('.eg-surface[data-renderer="webgl"]').waitFor();
    await noOverflow(phone);
    const label = phone.locator('.eg-city-label').first();
    const cityName = await label.innerText();
    await label.tap();
    assert((await phone.getByTestId('globe-city-preview').innerText()).includes(cityName));
    const box = await phone.getByTestId('globe-city-preview').boundingBox();
    assert(box.x >= 0 && box.x + box.width <= 391);
    await phone.screenshot({ path: 'artifacts/qa/earth-mobile-final.png', fullPage: true });
    await phone.close();
  });
  await check('WebGL failure uses a usable geographic fallback', async () => {
    const fallback = await browser.newPage({ viewport: { width: 1000, height: 900 } });
    await fallback.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : original.call(this, type, ...args); }; });
    await fallback.goto(`${base}/#/globe`, { waitUntil: 'networkidle' });
    await fallback.locator('.eg-fallback-note').waitFor();
    assert.equal(await fallback.locator('.eg-surface').getAttribute('data-renderer'), 'vector');
    assert(await fallback.locator('.gl-country').count() > 150);
    assert(await fallback.locator('.eg-city-label').count() > 0);
    await noOverflow(fallback);
    await fallback.close();
  });
  await check('no uncaught application errors', async () => assert.deepEqual(report.errors, []));
} finally {
  await writeFile('artifacts/qa/airports-globe-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.checks.some(check => !check.passed)) process.exitCode = 1;
