import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const output = path.resolve('artifacts', 'qa');
await mkdir(output, { recursive: true });
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], requestErrors: [], screenshots: [] };
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const delay = page => page.waitForTimeout(120);
const storage = (page, key) => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const travel = async page => ({ current: await storage(page, 'tusuan-current'), projects: (await storage(page, 'tusuan-projects')).projects.map(({ id, name, plan }) => ({ id, name, plan })) });
const amount = async (page, key) => Number(await page.getByTestId(`living-${key}`).getAttribute('data-amount'));
function monitor(page, viewport) {
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => report.pageErrors.push({ viewport, error: error.message }));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(target)) report.requestErrors.push({ viewport, status: response.status(), url: response.url() }); });
  page.on('requestfailed', request => { if (request.url().startsWith(target) && request.failure()?.errorText !== 'net::ERR_ABORTED') report.requestErrors.push({ viewport, url: request.url(), error: request.failure()?.errorText }); });
}
async function check(name, action) {
  try { const detail = await action(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? ': ' + JSON.stringify(detail) : ''}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function screenshot(page, name) {
  const file = path.join(output, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.screenshots.push(file);
}
async function navigate(page, name) {
  const button = page.locator('.main-nav').getByRole('button', { name, exact: true });
  if (!await button.isVisible()) await page.getByLabel('展开导航').click();
  await button.click();
  await delay(page);
}
async function noOverflow(page) {
  const result = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(result.document <= result.viewport + 1 && result.body <= result.viewport + 1, JSON.stringify(result));
  return result;
}
async function activeNav(page, text) {
  const active = page.locator('.main-nav > button.active');
  assert.equal(await active.count(), 1);
  assert.equal((await active.innerText()).trim(), text);
  if (!await active.isVisible()) return;
  const geometry = await active.evaluate(button => {
    const style = getComputedStyle(button, '::after');
    const box = button.getBoundingClientRect();
    const range = document.createRange();
    const textNode = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!textNode) return { indicator: false };
    range.selectNodeContents(textNode);
    const label = range.getBoundingClientRect();
    return { indicator: style.display !== 'none' && style.content !== 'none', textBottom: label.bottom, indicatorTop: box.bottom - parseFloat(style.bottom || 0) - parseFloat(style.height || 0) };
  });
  if (geometry.indicator) assert(geometry.indicatorTop >= geometry.textBottom + 2, JSON.stringify(geometry));
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN' });
  const page = await desktop.newPage();
  monitor(page, 'desktop');
  const catalog = await (await desktop.request.get(target + '/api/catalog')).json();
  let initialTravel, editedLiving;

  await check('independent travel projects prepared for route checks', async () => {
    await page.goto(target + '/#/planner', { waitUntil: 'networkidle' });
    await page.locator('.trip-controls').waitFor();
    const workspace = await storage(page, 'tusuan-projects');
    const first = workspace.projects[0];
    const globePlan = { ...first.plan, originId: 'beijing', stops: [{ cityId: 'reykjavik', days: 4, attractionIds: [] }, { cityId: 'paris', days: 3, attractionIds: [] }, { cityId: 'maafushi', days: 3, attractionIds: [] }], returnTrip: true };
    workspace.projects.push({ ...first, id: 'qa-global-project', name: 'QA 冰岛巴黎马尔代夫', plan: globePlan });
    await page.evaluate(value => localStorage.setItem('tusuan-projects', JSON.stringify(value)), workspace);
    await page.reload({ waitUntil: 'networkidle' });
    initialTravel = await travel(page);
    assert.equal(initialTravel.projects.length, 2);
    return { projects: initialTravel.projects.map(project => project.name) };
  });

  await check('living page has its own route and preserves travel plans', async () => {
    await navigate(page, '旅居生活');
    assert.equal(new URL(page.url()).hash, '#/stay');
    await page.getByTestId('living-monthly').waitFor();
    await activeNav(page, '旅居生活');
    assert.equal(await page.locator('.trip-controls').count(), 0);
    assert.equal(await page.locator('.route-builder').count(), 0);
    assert.deepEqual(await travel(page), initialTravel);
    return await noOverflow(page);
  });

  await check('living edits and refundable deposits have separate totals', async () => {
    await page.getByLabel('居住人数', { exact: true }).fill('2');
    await page.getByLabel('月租（每间 / 月）', { exact: true }).fill('18000');
    await page.getByRole('button', { name: '6个月', exact: true }).click();
    await page.getByLabel('押金月数', { exact: true }).fill('1');
    await delay(page);
    const first = { monthly: await amount(page, 'monthly'), period: await amount(page, 'period'), deposit: await amount(page, 'deposit') };
    await page.getByLabel('押金月数', { exact: true }).fill('2');
    await delay(page);
    assert.equal(await amount(page, 'monthly'), first.monthly);
    assert.equal(await amount(page, 'period'), first.period);
    assert(Math.abs(await amount(page, 'deposit') - first.deposit * 2) <= .02);
    assert(Math.abs(await amount(page, 'period-cash') - first.period - await amount(page, 'deposit')) <= .02);
    assert(Math.abs(await amount(page, 'first-cash') - first.monthly - await amount(page, 'deposit')) <= .02);
    assert(Math.abs(first.period - first.monthly * 6) <= .06);
    editedLiving = await storage(page, 'tusuan-living-v1');
    assert.equal(editedLiving.byCity[editedLiving.cityId].months, 6);
    assert.equal(editedLiving.byCity[editedLiving.cityId].people, 2);
    assert.equal(editedLiving.byCity[editedLiving.cityId].amounts.rent, 18000);
    assert.deepEqual(await travel(page), initialTravel);
    return { ...first, refundableDeposit: await amount(page, 'deposit'), periodCash: await amount(page, 'period-cash') };
  });

  await check('living currency conversion preserves native inputs and travel currency', async () => {
    const beforeCurrency = await page.getByLabel('显示币种', { exact: true }).inputValue();
    const beforeMonthly = await amount(page, 'monthly');
    const nextCurrency = beforeCurrency === 'USD' ? 'CNY' : 'USD';
    await page.getByLabel('显示币种', { exact: true }).selectOption(nextCurrency);
    await delay(page);
    const expected = beforeMonthly / catalog.rates.rates[beforeCurrency] * catalog.rates.rates[nextCurrency];
    assert(Math.abs(await amount(page, 'monthly') - expected) <= .05);
    assert.deepEqual(await storage(page, 'tusuan-living-v1'), editedLiving);
    assert.deepEqual(await travel(page), initialTravel);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByTestId('living-monthly').waitFor();
    assert.equal(new URL(page.url()).hash, '#/stay');
    assert.equal(await page.getByLabel('显示币种', { exact: true }).inputValue(), nextCurrency);
    assert.deepEqual(await storage(page, 'tusuan-living-v1'), editedLiving);
    assert.deepEqual(await travel(page), initialTravel);
    await screenshot(page, 'living-desktop-1440');
    return { beforeCurrency, nextCurrency, monthly: await amount(page, 'monthly') };
  });

  await check('living preferences remain specific to each city', async () => {
    const original = await storage(page, 'tusuan-living-v1');
    const originalCity = catalog.cities.find(city => city.id === original.cityId);
    await page.getByRole('button', { name: '更换城市', exact: true }).click();
    await page.locator('dialog .search-box input').fill('Tokyo');
    await page.locator('dialog .picker-city').click();
    await page.getByLabel('居住人数', { exact: true }).fill('4');
    await page.getByRole('button', { name: '更换城市', exact: true }).click();
    await page.locator('dialog .search-box input').fill(originalCity.nameEn);
    await page.locator('dialog .picker-city').click();
    await delay(page);
    const after = await storage(page, 'tusuan-living-v1');
    assert.equal(after.cityId, original.cityId);
    assert.deepEqual(after.byCity[original.cityId], original.byCity[original.cityId]);
    assert.equal(after.byCity.tokyo.people, 4);
    assert.equal(await page.getByLabel('月租（每间 / 月）', { exact: true }).inputValue(), '18000');
    assert.deepEqual(await travel(page), initialTravel);
  });

  await check('globe direct route survives refresh and keeps travel projects', async () => {
    await navigate(page, '环球探索');
    assert.equal(new URL(page.url()).hash, '#/globe');
    await page.locator('.gl-page').waitFor();
    await activeNav(page, '环球探索');
    assert.deepEqual(await travel(page), initialTravel);
    await page.goBack({ waitUntil: 'networkidle' });
    await page.getByTestId('living-monthly').waitFor();
    assert.equal(new URL(page.url()).hash, '#/stay');
    await activeNav(page, '旅居生活');
    await page.goForward({ waitUntil: 'networkidle' });
    await page.locator('.gl-page').waitFor();
    await activeNav(page, '环球探索');
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.gl-page').waitFor();
    await activeNav(page, '环球探索');
    assert.deepEqual(await travel(page), initialTravel);
    return await noOverflow(page);
  });

  await check('local globe map loads and responds to drag, zoom and keyboard', async () => {
    await page.locator('.gl-country').first().waitFor();
    assert(await page.locator('.gl-country').count() > 150);
    assert.equal(await page.locator('.gl-map-error').count(), 0);
    const badPaths = await page.locator('.gl-sphere path').evaluateAll(paths => paths.filter(path => /NaN|Infinity/.test(path.getAttribute('d') || '')).length);
    assert.equal(badPaths, 0);
    const globe = page.getByTestId('world-globe');
    const originalRotation = await globe.getAttribute('data-rotation');
    const svg = page.locator('.gl-sphere');
    const box = await svg.boundingBox();
    await page.mouse.move(box.x + box.width * .67, box.y + box.height * .7);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .67 + 75, box.y + box.height * .7 + 25, { steps: 6 });
    await page.mouse.up();
    assert.notEqual(await globe.getAttribute('data-rotation'), originalRotation);
    await page.getByLabel('放大地球', { exact: true }).click();
    assert(Number(await globe.getAttribute('data-zoom')) > 1);
    await page.getByLabel('缩小地球', { exact: true }).click();
    assert.equal(Number(await globe.getAttribute('data-zoom')), 1);
    await svg.focus();
    const beforeKey = await globe.getAttribute('data-rotation');
    await page.keyboard.press('ArrowLeft');
    assert.notEqual(await globe.getAttribute('data-rotation'), beforeKey);
    await page.getByLabel('重置地球视角', { exact: true }).click();
    assert.equal(await globe.getAttribute('data-rotation'), originalRotation);
    return { countryPaths: await page.locator('.gl-country').count(), mapUrl: '/maps/countries-110m.json' };
  });

  await check('destination search focuses the selected city on the sphere', async () => {
    const city = catalog.cities.find(city => city.id === 'reykjavik');
    await page.locator('#gl-city-search').fill('Reykjavik');
    const results = page.getByLabel('目的地搜索结果', { exact: true });
    assert.equal(await results.locator('button').count(), 1);
    await results.locator('button').click();
    assert.equal(await page.locator('.gl-city-body h2').innerText(), city.name);
    const rotation = (await page.getByTestId('world-globe').getAttribute('data-rotation')).split(',').map(Number);
    assert(Math.abs(rotation[0] + city.lng) < .0001 && Math.abs(rotation[1] + city.lat) < .0001);
    await page.locator('#gl-city-search').fill('destination-does-not-exist');
    assert.equal(await results.locator('button').count(), 0);
    assert(await results.getByText('没有匹配的目的地，试试国家名或英文城市名。').isVisible());
    await page.getByLabel('清除目的地搜索', { exact: true }).click();
    assert.equal(await results.locator('button').count(), Math.min(36, catalog.cities.length + (catalog.airportCities?.length || 0)));
    assert.deepEqual(await travel(page), initialTravel);
  });

  await check('project selector renders all destination legs and return without recording visits', async () => {
    await page.locator('.gl-modes').getByRole('button', { name: '项目路线', exact: true }).click();
    await page.getByLabel('显示哪个旅行项目', { exact: true }).selectOption('qa-global-project');
    const legs = await page.getByTestId('globe-route-leg').evaluateAll(paths => paths.map(path => [path.dataset.from, path.dataset.to]));
    assert.deepEqual(legs, [['beijing', 'reykjavik'], ['reykjavik', 'paris'], ['paris', 'maafushi'], ['maafushi', 'beijing']]);
    assert.equal(await page.locator('.gl-route-stops li').count(), 5);
    assert((await page.locator('.gl-route-stops li').last().innerText()).includes('返程'));
    await page.getByLabel('显示哪个旅行项目', { exact: true }).selectOption(initialTravel.projects[0].id);
    assert.equal(await page.getByTestId('globe-route-leg').count(), 3);
    assert.equal((await storage(page, 'tusuan-passport-v1'))?.visits?.length || 0, 0);
    assert.deepEqual(await travel(page), initialTravel);
    return { selectedProjectLegs: legs };
  });

  await check('visited places persist with date and notes independently of plans', async () => {
    await page.locator('.gl-modes').getByRole('button', { name: '我的足迹', exact: true }).click();
    assert.equal(await page.getByTestId('passport-stats').locator('strong').first().innerText(), '0');
    await page.locator('#gl-city-search').fill('Reykjavik');
    await page.getByLabel('目的地搜索结果', { exact: true }).locator('button').click();
    await page.locator('#gl-visit-date').fill('2024-09-11');
    await page.locator('#gl-visit-note').fill('QA 极光与海边散步');
    await page.getByRole('button', { name: '标记为已去过', exact: true }).click();
    const expected = { version: 1, visits: [{ cityId: 'reykjavik', visitedOn: '2024-09-11', note: 'QA 极光与海边散步' }] };
    assert.deepEqual(await storage(page, 'tusuan-passport-v1'), expected);
    assert.equal(await page.getByTestId('passport-stats').locator('strong').first().innerText(), '1');
    assert.equal(await page.locator('.gl-country.is-visited').count(), 1);
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.gl-modes').getByRole('button', { name: '我的足迹', exact: true }).click();
    assert.deepEqual(await storage(page, 'tusuan-passport-v1'), expected);
    assert.equal(await page.locator('#gl-visit-date').inputValue(), '2024-09-11');
    assert.equal(await page.locator('#gl-visit-note').inputValue(), 'QA 极光与海边散步');
    assert.deepEqual(await travel(page), initialTravel);
  });

  await check('invalid passport imports preserve visits and valid imports merge', async () => {
    const before = await storage(page, 'tusuan-passport-v1');
    const fileInput = page.getByLabel('导入足迹 JSON 文件', { exact: true });
    await fileInput.setInputFiles({ name: 'bad-passport.json', mimeType: 'application/json', buffer: Buffer.from('{not-valid-json') });
    await page.getByRole('alert').filter({ hasText: '原足迹已保留' }).waitFor();
    assert.deepEqual(await storage(page, 'tusuan-passport-v1'), before);
    await fileInput.setInputFiles({ name: 'unknown-passport.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, visits: [{ cityId: 'unknown-place' }] })) });
    await page.getByRole('alert').filter({ hasText: '未收录的目的地' }).waitFor();
    assert.deepEqual(await storage(page, 'tusuan-passport-v1'), before);
    const extra = { cityId: 'paris', visitedOn: '2023-05-18', note: 'QA 旧足迹导入' };
    await fileInput.setInputFiles({ name: 'extra-passport.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, visits: [extra] })) });
    await page.getByRole('status').filter({ hasText: '已合并 1 条足迹' }).waitFor();
    assert.deepEqual(await storage(page, 'tusuan-passport-v1'), { version: 1, visits: [...before.visits, extra] });
    assert.equal(await page.getByTestId('passport-stats').locator('strong').first().innerText(), '2');
    const savedPassport = await storage(page, 'tusuan-passport-v1');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出足迹', exact: true }).click();
    const exported = await readFile(await (await downloaded).path());
    assert.deepEqual(JSON.parse(exported.toString('utf8')), savedPassport);
    await screenshot(page, 'globe-desktop-passport');
    await page.getByRole('button', { name: '取消打卡', exact: true }).click();
    assert.deepEqual((await storage(page, 'tusuan-passport-v1')).visits, [extra]);
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual((await storage(page, 'tusuan-passport-v1')).visits, [extra]);
    await page.locator('.gl-modes').getByRole('button', { name: '我的足迹', exact: true }).click();
    await page.getByLabel('导入足迹 JSON 文件', { exact: true }).setInputFiles({ name: 'restore-passport.json', mimeType: 'application/json', buffer: exported });
    await page.getByRole('status').filter({ hasText: '已合并 2 条足迹' }).waitFor();
    const restored = await storage(page, 'tusuan-passport-v1');
    assert.deepEqual([...restored.visits].sort((a, b) => a.cityId.localeCompare(b.cityId)), [...savedPassport.visits].sort((a, b) => a.cityId.localeCompare(b.cityId)));
    assert.deepEqual(await travel(page), initialTravel);
  });

  await check('invalid trip imports leave all saved work intact', async () => {
    const beforeTravel = await travel(page);
    const beforeLiving = await storage(page, 'tusuan-living-v1');
    await page.locator('.app-shell > input[type="file"]').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
    await page.getByRole('status').filter({ hasText: '导入失败' }).waitFor();
    assert.deepEqual(await travel(page), beforeTravel);
    assert.deepEqual(await storage(page, 'tusuan-living-v1'), beforeLiving);
    await page.locator('.app-shell > input[type="file"]').setInputFiles({ name: 'unsupported.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ stops: [{ cityId: 'not-a-real-city', days: 3 }] })) });
    await page.getByRole('status').filter({ hasText: '不支持的城市' }).waitFor();
    assert.deepEqual(await travel(page), beforeTravel);
    assert.deepEqual(await storage(page, 'tusuan-living-v1'), beforeLiving);
  });

  await check('five navigation labels and active indicators fit intermediate widths', async () => {
    const widths = [1440, 1150, 1024, 901, 900, 768];
    const results = [];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      await activeNav(page, '环球探索');
      results.push(await noOverflow(page));
      const collisions = await page.locator('.site-header').evaluate(header => {
        const selectors = ['.brand', '.main-nav', '.header-right'];
        const boxes = selectors.map(selector => header.querySelector(selector)).filter(el => getComputedStyle(el).display !== 'none').map(el => ({ name: el.className, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right }));
        return boxes.slice(1).filter((box, index) => boxes[index].right > box.left + 1);
      });
      assert.deepEqual(collisions, [], `Header overlap at ${width}px: ${JSON.stringify(collisions)}`);
    }
    await page.setViewportSize({ width: 1440, height: 1050 });
    await screenshot(page, 'globe-desktop-1440');
    return results;
  });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, locale: 'zh-CN' });
  const phone = await mobile.newPage();
  monitor(phone, 'mobile');
  await check('mobile living route and independent form remain usable', async () => {
    await phone.goto(target + '/#/stay', { waitUntil: 'networkidle' });
    await phone.getByTestId('living-monthly').waitFor();
    await activeNav(phone, '旅居生活');
    const savedTravel = await travel(phone);
    await phone.getByLabel('居住人数', { exact: true }).fill('3');
    await delay(phone);
    assert.deepEqual(await travel(phone), savedTravel);
    await screenshot(phone, 'living-mobile-390');
    return await noOverflow(phone);
  });
  await check('mobile globe navigation and direct refresh fit 390px', async () => {
    await navigate(phone, '环球探索');
    await phone.locator('.gl-page').waitFor();
    await phone.reload({ waitUntil: 'networkidle' });
    await phone.locator('.gl-page').waitFor();
    await activeNav(phone, '环球探索');
    await screenshot(phone, 'globe-mobile-390');
    return await noOverflow(phone);
  });
  await check('existing planner survives new module navigation', async () => {
    await navigate(page, '规划旅程');
    await page.locator('.trip-controls').waitFor();
    await activeNav(page, '规划旅程');
    assert.deepEqual(await travel(page), initialTravel);
    assert.equal(await page.locator('.stop-row').count(), initialTravel.current.stops.length);
    await page.getByRole('tab', { name: /每日行程/ }).click();
    await page.locator('.itinerary-section').waitFor();
    assert.equal(await page.locator('.error-notice').count(), 0);
    return await noOverflow(page);
  });

  await check('adding a globe destination changes only the active travel project', async () => {
    const isolated = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    const editor = await isolated.newPage();
    monitor(editor, 'active-project');
    try {
      await editor.goto(target + '/#/planner', { waitUntil: 'networkidle' });
      await editor.locator('.trip-controls').waitFor();
      const workspace = await storage(editor, 'tusuan-projects');
      const first = workspace.projects[0];
      const other = { ...first, id: 'qa-other-project', name: '只预览、不修改的项目', plan: { ...first.plan, stops: [{ cityId: 'london', days: 3, attractionIds: [] }] } };
      workspace.projects.push(other);
      await editor.evaluate(value => localStorage.setItem('tusuan-projects', JSON.stringify(value)), workspace);
      await editor.reload({ waitUntil: 'networkidle' });
      const before = await travel(editor);
      await navigate(editor, '环球探索');
      await editor.locator('.gl-modes').getByRole('button', { name: '项目路线', exact: true }).click();
      await editor.getByLabel('显示哪个旅行项目', { exact: true }).selectOption(other.id);
      await editor.locator('#gl-city-search').fill('Paris');
      await editor.getByLabel('目的地搜索结果', { exact: true }).getByRole('button', { name: '巴黎 法国', exact: true }).click();
      await editor.getByRole('button', { name: '加入当前旅行', exact: true }).click();
      await editor.getByRole('status').filter({ hasText: '已加入当前旅程' }).waitFor();
      const after = await travel(editor);
      assert.deepEqual(after.projects.find(project => project.id === other.id).plan, before.projects.find(project => project.id === other.id).plan);
      const current = after.projects.find(project => project.id === first.id).plan;
      assert.deepEqual(current.stops.map(stop => stop.cityId), [...before.current.stops.map(stop => stop.cityId), 'paris']);
      assert.deepEqual(after.current, current);
      assert.equal((await storage(editor, 'tusuan-passport-v1'))?.visits?.length || 0, 0);
    } finally { await isolated.close(); }
  });

  await check('blocked living storage keeps the calculator usable and reports unsaved changes', async () => {
    const blocked = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    await blocked.addInitScript(() => {
      const write = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'tusuan-living-v1') throw new DOMException('QA storage blocked', 'QuotaExceededError');
        return write.call(this, key, value);
      };
    });
    const blockedPage = await blocked.newPage();
    monitor(blockedPage, 'storage-blocked');
    try {
      await blockedPage.goto(target + '/#/stay', { waitUntil: 'networkidle' });
      await blockedPage.getByTestId('living-monthly').waitFor();
      assert(await blockedPage.getByText('偏好尚未保存 · 仅本次使用', { exact: true }).isVisible());
      const initial = await travel(blockedPage);
      await blockedPage.getByLabel('居住人数', { exact: true }).fill('2');
      assert(await amount(blockedPage, 'monthly') > 0);
      assert.equal(await storage(blockedPage, 'tusuan-living-v1'), null);
      assert.deepEqual(await travel(blockedPage), initial);
    } finally { await blocked.close(); }
  });

  await check('damaged passport storage remains recoverable and visibly reported', async () => {
    const damaged = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    await damaged.addInitScript(() => localStorage.setItem('tusuan-passport-v1', '{damaged original record'));
    const damagedPage = await damaged.newPage();
    monitor(damagedPage, 'damaged-passport');
    try {
      await damagedPage.goto(target + '/#/globe', { waitUntil: 'networkidle' });
      await damagedPage.locator('.gl-page').waitFor();
      await damagedPage.getByRole('alert').filter({ hasText: '原记录未改动' }).waitFor();
      assert.equal(await damagedPage.evaluate(() => localStorage.getItem('tusuan-passport-v1')), '{damaged original record');
    } finally { await damaged.close(); }
  });
  await mobile.close();
  await desktop.close();
} finally {
  await browser.close();
  await writeFile(path.join(output, 'living-globe-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checks: report.checks.length, failed: report.checks.filter(check => !check.passed), pageErrors: report.pageErrors, requestErrors: report.requestErrors, screenshots: report.screenshots }, null, 2));
}
if (report.checks.some(check => !check.passed) || report.pageErrors.length || report.requestErrors.length) process.exitCode = 1;
