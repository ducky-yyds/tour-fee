import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { suggestStopPlan } from '../shared/planner.mjs';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const out = path.resolve('artifacts', 'qa');
await mkdir(out, { recursive: true });
const catalog = await (await fetch(`${target}/api/catalog`)).json();
const city = catalog.cities.find(c => c.id === 'beijing');
const departure = new Date(); departure.setUTCDate(departure.getUTCDate() + 30);
const departureDate = departure.toISOString().slice(0, 10);
const plan = { plannerVersion: 2, originId: 'shanghai', stops: [suggestStopPlan({ cityId: city.id, days: 2, attractionIds: city.attractions.map(a => a.id) }, city, { departureDate })], departureDate, travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true, reservePercent: 10, overrides: {}, customAttractions: [] };
const report = { target, checkedAt: new Date().toISOString(), viewport: { width: 390, height: 844 }, checks: [], pageErrors: [], screenshots: [], layouts: [] };
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const context = await browser.newContext({ viewport: report.viewport, locale: 'zh-CN', isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await context.addInitScript(p => { if (!localStorage.getItem('tusuan-current')) localStorage.setItem('tusuan-current', JSON.stringify(p)); }, plan);
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', error => report.pageErrors.push(error.message));
const current = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
async function waitPlan(keys, expected) { await page.waitForFunction(({ keys, expected }) => JSON.stringify(keys.reduce((value, key) => value?.[key], JSON.parse(localStorage.getItem('tusuan-current')))) === JSON.stringify(expected), { keys, expected }); }
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); await page.screenshot({ path: path.join(out, `projects-mobile-failure-${report.checks.length}.png`) }).catch(() => {}); }
}
async function control(locator) {
  await locator.scrollIntoViewIfNeeded();
  // A fixed mobile budget bar uses the bottom 67px; bring controls into the
  // available reading area, just as a further finger scroll would do.
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
  assert.ok(await locator.isVisible(), 'Control is visible');
  const position = await locator.evaluate(el => {
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, viewportWidth: innerWidth, viewportHeight: innerHeight, unobstructed: hit === el || el.contains(hit) };
  });
  assert.ok(position.left >= -1 && position.right <= position.viewportWidth + 1, JSON.stringify(position));
  assert.ok(position.top >= -1 && position.bottom <= position.viewportHeight + 1, JSON.stringify(position));
  assert.ok(position.unobstructed, 'Control center must not be covered: ' + JSON.stringify(position));
  return position;
}
async function layout(label, selectors = []) {
  const result = await page.evaluate(selectors => {
    const containers = selectors.flatMap(selector => [...document.querySelectorAll(selector)].filter(el => el.getClientRects().length).map(el => ({ selector, width: el.clientWidth, scrollWidth: el.scrollWidth })));
    return { viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth, containers };
  }, selectors);
  report.layouts.push({ label, ...result });
  assert.equal(result.viewport, 390);
  assert.ok(result.document <= 391 && result.body <= 391, `${label} page overflow: ${JSON.stringify(result)}`);
  assert.ok(result.containers.every(c => c.scrollWidth <= c.width + 2), `${label} control container overflow: ${JSON.stringify(result.containers)}`);
  return result;
}
async function screenshot(name, locator) {
  if (locator) await locator.scrollIntoViewIfNeeded();
  const filename = path.join(out, `${name}.png`);
  await page.screenshot({ path: filename }); report.screenshots.push(filename);
}
try {
  await check('390px project creation and manager controls remain visible and actionable', async () => {
    await page.goto(target, { waitUntil: 'networkidle' });
    await control(page.getByLabel('切换旅行项目'));
    const create = page.locator('.project-bar').getByRole('button', { name: '新建项目', exact: true });
    await control(create); await create.click();
    const name = page.getByLabel('项目名称', { exact: true });
    await control(name); await name.fill('手机 · 东京慢旅行');
    const destination = page.getByLabel('新项目目的地');
    await control(destination); await destination.selectOption('tokyo');
    const days = page.getByLabel('新项目天数');
    await control(days); await days.fill('2');
    const save = page.getByRole('button', { name: '创建旅行项目', exact: true });
    await control(save); await layout('create project', ['dialog']);
    await screenshot('projects-mobile-create', save); await save.click();
    await waitPlan(['stops', 0, 'cityId'], 'tokyo');
    await page.getByRole('button', { name: '管理项目', exact: true }).click();
    const rename = page.locator('.project-card.is-active button[title="重命名"]');
    await control(rename); await rename.click();
    const renameInput = page.getByLabel('修改项目名称');
    await control(renameInput); await renameInput.fill('手机东京项目 · 已重命名');
    const renameSave = page.getByLabel('保存项目名称');
    await control(renameSave); await renameSave.click();
    await layout('project manager', ['dialog', '.project-card']);
    await screenshot('projects-mobile-manager', page.locator('.project-card.is-active'));
    await page.getByLabel('关闭弹窗').click();
    const ws = await page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-projects')));
    assert.equal(ws.projects.length, 2);
    assert.equal(ws.projects.find(p => p.id === ws.activeId).name, '手机东京项目 · 已重命名');
  });
  await check('390px daily cost preferences accept native units without horizontal overflow', async () => {
    await page.getByRole('tab', { name: /费用明细/ }).click();
    for (const [label, value] of [['东京住宿偏好', '18000'], ['东京饮食偏好', '5500'], ['东京市内交通', '0']]) {
      const input = page.getByLabel(label, { exact: true });
      await control(input); await input.fill(value);
    }
    const apply = page.getByRole('button', { name: '应用消费偏好', exact: true });
    await control(apply); await apply.click();
    await waitPlan(['stops', 0, 'dailyPreferences', 'food'], 5500);
    assert.deepEqual((await current()).stops[0].dailyPreferences, { lodging: 18000, food: 5500, transport: 0 });
    assert.equal(await page.locator('.cost-group-card').count(), 3);
    assert.match(await page.locator('.daily-preferences').innerText(), /JPY/);
    await layout('daily preferences', ['.cost-planning', '.daily-preferences', '.preference-field']);
    await screenshot('projects-mobile-daily-preferences', page.getByLabel('东京饮食偏好', { exact: true }));
    await screenshot('projects-mobile-cost-groups', page.locator('.cost-group-cards'));
  });
  await check('390px itinerary duration and day controls work with the new editor', async () => {
    await page.getByRole('tab', { name: /每日行程/ }).click();
    await page.getByRole('button', { name: '调配景点', exact: true }).click();
    const p = await current(), stop = p.stops[0];
    const sight = catalog.cities.find(c => c.id === 'tokyo').attractions.find(a => a.id === stop.attractionIds[0]);
    const duration = page.getByLabel(`${sight.name}停留分钟`, { exact: true });
    await control(duration); await duration.fill('45'); await duration.press('Enter');
    await waitPlan(['stops', 0, 'visitDurations', sight.id], 45);
    const day = page.getByLabel(`${sight.name}安排日期`, { exact: true });
    await control(day); await day.selectOption('1');
    await page.waitForFunction(id => JSON.parse(localStorage.getItem('tusuan-current')).stops[0].dayPlans[1].includes(id), sight.id);
    assert.equal((await current()).stops[0].dayPlans[0].includes(sight.id), false);
    assert.equal((await current()).stops[0].visitDurations[sight.id], 45);
    await control(page.getByLabel(`${sight.name}停留分钟`, { exact: true }));
    await layout('itinerary editor', ['.schedule-editor', '.planning-day', '.visit-duration-editor']);
    await screenshot('projects-mobile-editor', page.getByLabel(`${sight.name}停留分钟`, { exact: true }));
    const add = page.locator('.planning-day[data-day-index="1"] .add-to-day');
    await control(add); await add.click();
    const search = page.getByLabel('搜索可添加的景点');
    await control(search); await search.fill('东京');
    const custom = page.locator('dialog').getByRole('button', { name: '自定义地点', exact: true });
    await control(custom); await custom.click();
    const customName = page.getByLabel('地点名称', { exact: true });
    await control(customName); await customName.fill('手机自定义散步点');
    await control(page.getByLabel('游览时长（分钟）', { exact: true }));
    await control(page.getByRole('button', { name: '保存并加入这一天', exact: true }));
    await layout('custom place editor', ['dialog']);
    await screenshot('projects-mobile-custom-place', page.getByLabel('地点名称', { exact: true }));
    await page.getByLabel('关闭弹窗').click();
    return { attraction: sight.name, duration: 45, day: 2 };
  });
} finally {
  await browser.close();
  await writeFile(path.join(out, 'projects-mobile-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
if (report.checks.some(c => !c.passed) || report.pageErrors.length) process.exitCode = 1;
