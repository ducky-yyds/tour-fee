import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { calculatePlan, generateItinerary, mergeCustomAttractions } from '../shared/planner.mjs';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const out = path.resolve('artifacts', 'qa');
await mkdir(out, { recursive: true });
const catalog = await (await fetch(`${target}/api/catalog`)).json();
const beijing = catalog.cities.find(c => c.id === 'beijing');
assert.ok(beijing.attractions.length >= 40, 'Run after the expanded Beijing catalog is available');
const pku = beijing.attractions.find(a => /北京大学/.test(a.name));
assert.ok(pku, 'Expanded catalog must include Peking University');
const date = new Date(); date.setUTCDate(date.getUTCDate() + 30);
const legacy = { originId: 'shanghai', stops: [{ cityId: 'beijing', days: 3, attractionIds: beijing.attractions.map(a => a.id) }], departureDate: date.toISOString().slice(0, 10), travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true, reservePercent: 10, overrides: {} };
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], screenshots: [] };
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN', acceptDownloads: true });
await context.addInitScript(p => { if (!localStorage.getItem('tusuan-projects') && !localStorage.getItem('tusuan-current')) localStorage.setItem('tusuan-current', JSON.stringify(p)); }, legacy);
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', error => report.pageErrors.push(error.message));
const current = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
const workspace = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-projects')));
const totalText = () => page.locator('.budget-total h2').innerText();
const effective = p => mergeCustomAttractions(catalog.cities, p.customAttractions);
async function waitPlan(keys, expected) { await page.waitForFunction(({ keys, expected }) => JSON.stringify(keys.reduce((value, key) => value?.[key], JSON.parse(localStorage.getItem('tusuan-current')))) === JSON.stringify(expected), { keys, expected }); }
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? ': ' + JSON.stringify(detail) : ''}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function snapshot(name, selector = '.project-bar') {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  const file = path.join(out, name + '.png');
  await page.screenshot({ path: file, fullPage: true }); report.screenshots.push(file);
}
async function editLine(label, amount) {
  await page.getByRole('tab', { name: /费用明细/ }).click();
  await page.locator('.cost-table tbody tr').filter({ hasText: label }).first().click();
  await page.locator('#actual-amount').fill(String(amount));
  await page.locator('dialog .check-label input').check();
  await page.getByRole('button', { name: '保存这笔费用', exact: true }).click();
}
async function toEditor() {
  await page.getByRole('tab', { name: /每日行程/ }).click();
  await page.getByRole('button', { name: '调配景点', exact: true }).click();
}
async function apiPlan(p) {
  const response = await fetch(`${target}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  return payload;
}
let beijingId, tokyoId, duplicateId, originalSight, originalOrder, customId;
try {
  await check('legacy plan migrates into a project and shrinking Beijing to one day selects feasible highlights', async () => {
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.getByLabel('切换旅行项目').waitFor();
    beijingId = (await workspace()).activeId;
    assert.equal((await workspace()).projects.length, 1);
    await page.getByLabel('北京停留天数', { exact: true }).fill('1');
    await waitPlan(['stops', 0, 'days'], 1);
    const p = await current(), [day] = generateItinerary(p, effective(p), catalog.rates);
    assert.ok(day.activeMinutes <= 480, String(day.activeMinutes));
    assert.ok(day.items.at(-1).endMinute <= 1230, day.endTime);
    assert.ok(p.stops[0].attractionIds.length > 0);
    assert.ok(p.stops[0].deferredAttractionIds.length > 0);
    const calculated = await apiPlan(p);
    const admissionIds = calculated.lines.filter(l => l.category === 'attractions').map(l => l.attractionId);
    assert.deepEqual(new Set(admissionIds), new Set(p.stops[0].attractionIds));
    assert.ok(p.stops[0].deferredAttractionIds.every(id => !admissionIds.includes(id)));
    await page.getByRole('tab', { name: /每日行程/ }).click();
    await snapshot('projects-beijing-one-day', '.itinerary-workspace');
    return { selected: p.stops[0].attractionIds, deferred: p.stops[0].deferredAttractionIds.length, activeMinutes: day.activeMinutes, endTime: day.endTime };
  });
  await check('rename current project and adjust scenic duration without changing order or checked budget', async () => {
    await page.getByRole('button', { name: '管理项目', exact: true }).click();
    await page.locator('.project-card.is-active button[title="重命名"]').click();
    await page.getByLabel('修改项目名称').fill('QA 北京日游');
    await page.getByLabel('保存项目名称').click();
    await page.getByLabel('关闭弹窗').click();
    await editLine('旅行保险预留', 444.44);
    await waitPlan(['overrides', 'insurance', 'amount'], 444.44);
    const p = await current();
    originalSight = beijing.attractions.find(a => a.id === p.stops[0].attractionIds[0]);
    originalOrder = structuredClone(p.stops[0].dayPlans);
    const before = await totalText();
    await toEditor();
    await page.getByLabel(`${originalSight.name}停留分钟`, { exact: true }).fill('45');
    await page.getByLabel(`${originalSight.name}停留分钟`, { exact: true }).press('Enter');
    await waitPlan(['stops', 0, 'visitDurations', originalSight.id], 45);
    assert.deepEqual((await current()).stops[0].dayPlans, originalOrder);
    assert.equal((await current()).overrides.insurance.amount, 444.44);
    assert.equal(await totalText(), before);
    const schedule = (await apiPlan(await current())).itinerary;
    assert.equal(schedule.flatMap(d => d.items).find(i => i.attractionId === originalSight.id).durationMinutes, 45);
    assert.equal((await workspace()).projects.find(p => p.id === beijingId).name, 'QA 北京日游');
  });
  await check('new Tokyo project keeps Beijing independent and accepts native-currency daily preferences', async () => {
    await page.locator('.project-bar').getByRole('button', { name: '新建项目', exact: true }).click();
    await page.getByLabel('项目名称', { exact: true }).fill('QA 东京分账');
    await page.getByLabel('新项目目的地').selectOption('tokyo');
    await page.getByLabel('新项目天数').fill('3');
    await page.getByRole('button', { name: '创建旅行项目', exact: true }).click();
    await waitPlan(['stops', 0, 'cityId'], 'tokyo');
    tokyoId = (await workspace()).activeId;
    assert.notEqual(tokyoId, beijingId);
    await editLine('旅行保险预留', 555.55);
    await editLine('东京 · 餐饮', 333.33);
    await page.getByLabel('东京住宿偏好', { exact: true }).fill('20000');
    await page.getByLabel('东京饮食偏好', { exact: true }).fill('5000');
    await page.getByLabel('东京市内交通', { exact: true }).fill('0');
    await page.getByRole('button', { name: '应用消费偏好', exact: true }).click();
    await waitPlan(['stops', 0, 'dailyPreferences', 'food'], 5000);
    const p = await current();
    assert.equal(p.overrides.insurance.amount, 555.55);
    assert.equal(p.overrides['stop-0-food'], undefined, 'Changing its unit preference deliberately replaces only the food total override');
    const budget = calculatePlan(p, effective(p), catalog.rates);
    assert.equal(budget.lines.find(l => l.id === 'stop-0-food').amount, Math.round(5000 * 3 * p.travelers / catalog.rates.rates.JPY * 100) / 100);
    assert.equal(budget.lines.find(l => l.id === 'stop-0-lodging').amount, Math.round(20000 * 2 * p.rooms / catalog.rates.rates.JPY * 100) / 100);
    assert.equal(budget.lines.find(l => l.id === 'stop-0-transport').amount, 0);
    assert.equal(await page.locator('.cost-group-card').count(), 3);
    const old = (await workspace()).projects.find(p => p.id === beijingId).plan;
    assert.equal(old.stops[0].visitDurations[originalSight.id], 45);
    assert.equal(old.overrides.insurance.amount, 444.44);
    await snapshot('projects-daily-preferences', '.cost-planning');
  });
  await check('duplicate project is a deep independent plan and switching restores each budget', async () => {
    await page.getByRole('button', { name: '管理项目', exact: true }).click();
    await page.locator('.project-card.is-active button[title="复制项目"]').click();
    await page.waitForFunction(id => JSON.parse(localStorage.getItem('tusuan-projects')).activeId !== id, tokyoId);
    duplicateId = (await workspace()).activeId;
    await page.getByRole('tab', { name: /费用明细/ }).click();
    await page.getByLabel('东京饮食偏好', { exact: true }).fill('6000');
    await page.getByRole('button', { name: '应用消费偏好', exact: true }).click();
    await waitPlan(['stops', 0, 'dailyPreferences', 'food'], 6000);
    await page.getByLabel('切换旅行项目').selectOption(tokyoId);
    await waitPlan(['stops', 0, 'dailyPreferences', 'food'], 5000);
    assert.equal((await current()).overrides.insurance.amount, 555.55);
    await page.getByLabel('切换旅行项目').selectOption(beijingId);
    await waitPlan(['stops', 0, 'cityId'], 'beijing');
    assert.equal((await current()).stops[0].visitDurations[originalSight.id], 45);
    assert.equal((await current()).overrides.insurance.amount, 444.44);
    const ws = await workspace();
    assert.equal(ws.projects.length, 3);
    assert.equal(ws.projects.find(p => p.id === duplicateId).plan.stops[0].dailyPreferences.food, 6000);
  });
  await check('library search can add Peking University with its access conditions', async () => {
    await toEditor();
    await page.locator('.planning-day[data-day-index="0"] .add-to-day').click();
    await page.getByLabel('搜索可添加的景点').fill('北京大学');
    await page.getByLabel(`添加${pku.name}`, { exact: true }).waitFor();
    assert.match(await page.locator('.attraction-library').innerText(), /预约|入校/);
    await page.getByLabel(`添加${pku.name}`, { exact: true }).click();
    await page.waitForFunction(id => JSON.parse(localStorage.getItem('tusuan-current')).stops[0].attractionIds.includes(id), pku.id);
    assert.ok((await current()).stops[0].dayPlans[0].includes(pku.id));
  });
  await check('custom place without coordinates stays explicit, enters budget and survives API validation', async () => {
    await page.locator('.planning-day[data-day-index="0"] .add-to-day').click();
    await page.locator('dialog').getByRole('button', { name: '自定义地点', exact: true }).click();
    await page.getByLabel('地点名称', { exact: true }).fill('QA 胡同里的私人书店');
    await page.getByLabel('想在这里做什么', { exact: true }).fill('测试自定义地点持久化，坐标未知需自行确认路线。');
    await page.getByLabel('游览时长（分钟）', { exact: true }).fill('75');
    await page.getByLabel('每人门票（CNY）').fill('25');
    await page.getByRole('button', { name: '保存并加入这一天', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).customAttractions?.some(a => a.name === 'QA 胡同里的私人书店'));
    const p = await current(), custom = p.customAttractions.find(a => a.name === 'QA 胡同里的私人书店');
    customId = custom.id;
    assert.ok(p.stops[0].dayPlans[0].includes(customId));
    const payload = await apiPlan(p);
    assert.equal(payload.lines.find(l => l.attractionId === customId).amount, 25 * p.travelers);
    assert.ok(payload.itinerary[0].warnings.some(w => w.code === 'missing-coordinates'));
    assert.equal(payload.itinerary[0].items.find(i => i.attractionId === customId).durationMinutes, 75);
    assert.match(await page.locator('.planning-warnings').first().innerText(), /缺少坐标/);
    await snapshot('projects-custom-and-library', '.schedule-editor');
    return { id: customId, amount: 25 * p.travelers };
  });
  await check('project export and reload preserve custom places, durations, preferences and isolation', async () => {
    await page.getByRole('button', { name: '管理项目', exact: true }).click();
    await snapshot('projects-manager-three-plans', 'dialog');
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: '导出当前项目', exact: true }).click();
    const download = await pending, file = path.join(out, 'qa-beijing-project.json');
    await download.saveAs(file);
    const exported = JSON.parse(await readFile(file, 'utf8'));
    assert.ok(exported.plan.customAttractions.some(a => a.id === customId));
    assert.equal(exported.plan.stops[0].visitDurations[originalSight.id], 45);
    await page.getByLabel('关闭弹窗').click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('切换旅行项目').waitFor();
    assert.equal((await workspace()).activeId, beijingId);
    assert.ok((await current()).customAttractions.some(a => a.id === customId));
    assert.equal((await current()).stops[0].visitDurations[originalSight.id], 45);
    await page.getByLabel('切换旅行项目').selectOption(tokyoId);
    await waitPlan(['stops', 0, 'cityId'], 'tokyo');
    assert.equal((await current()).stops[0].dailyPreferences.food, 5000);
    assert.equal((await current()).customAttractions.length, 0);
    await page.getByLabel('切换旅行项目').selectOption(duplicateId);
    await waitPlan(['stops', 0, 'dailyPreferences', 'food'], 6000);
    assert.equal((await workspace()).projects.length, 3);
  });
  await check('same-city project switching resets itinerary undo and protects both project plans', async () => {
    await page.getByLabel('切换旅行项目').selectOption(duplicateId);
    await waitPlan(['stops', 0, 'dailyPreferences', 'food'], 6000);
    const original = (await workspace()).projects.find(p => p.id === tokyoId).plan;
    const before = await current();
    const city = catalog.cities.find(c => c.id === 'tokyo');
    const sight = city.attractions.find(a => a.id === before.stops[0].attractionIds[0]);
    const duration = before.stops[0].visitDurations?.[sight.id] ?? Math.round(sight.durationHours * 60);
    const nextDuration = duration > 660 ? duration - 15 : duration + 15;
    await toEditor();
    await page.getByLabel(`${sight.name}停留分钟`, { exact: true }).fill(String(nextDuration));
    await page.getByLabel(`${sight.name}停留分钟`, { exact: true }).press('Enter');
    await waitPlan(['stops', 0, 'visitDurations', sight.id], nextDuration);
    assert.ok(await page.getByRole('button', { name: '撤回', exact: true }).isEnabled(), 'Editing creates undo state in the duplicate');
    const changed = await current();
    await page.getByLabel('切换旅行项目').selectOption(tokyoId);
    await waitPlan(['stops', 0, 'dailyPreferences', 'food'], 5000);
    await toEditor();
    assert.ok(await page.getByRole('button', { name: '撤回', exact: true }).isDisabled(), 'Undo history belongs to the previous project');
    assert.deepEqual((await current()).stops, original.stops);
    assert.deepEqual((await current()).overrides, original.overrides);
    assert.deepEqual((await workspace()).projects.find(p => p.id === duplicateId).plan.stops, changed.stops);
    await page.getByLabel('切换旅行项目').selectOption(duplicateId);
    await waitPlan(['stops', 0, 'visitDurations', sight.id], nextDuration);
    await toEditor();
    assert.ok(await page.getByRole('button', { name: '撤回', exact: true }).isDisabled());
    return { sameCity: 'tokyo', changedDuration: nextDuration, undoLeaked: false };
  });
} finally {
  await browser.close();
  await writeFile(path.join(out, 'projects-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
if (report.checks.some(c => !c.passed) || report.pageErrors.length) process.exitCode = 1;
