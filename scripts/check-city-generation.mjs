import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { calculatePlan, generateItinerary, experienceLineId } from '../shared/planner.mjs';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const out = path.resolve('artifacts', 'qa');
await mkdir(out, { recursive: true });
const catalog = await (await fetch(`${target}/api/catalog`)).json();
const byId = new Map(catalog.cities.map(c => [c.id, c]));
assert.ok(byId.get('tokyo').experiences?.length, 'Restart the server after installing the concrete experience catalog');
const date = new Date(); date.setUTCDate(date.getUTCDate() + 30);
const makePlan = (cityId, patch = {}) => ({ plannerVersion: 2, originId: 'shanghai', stops: [{ cityId, days: 2, attractionIds: [], dayPlans: [[], []], experienceSelections: [] }], departureDate: date.toISOString().slice(0, 10), travelers: 2, rooms: 1, currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true, reservePercent: 10, overrides: {}, customAttractions: [], ...patch });
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], screenshots: [] };
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
async function inWorkspace(seed, cityId, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN' });
  await context.addInitScript(seed => {
    if (localStorage.getItem('tusuan-projects')) return;
    const now = new Date().toISOString();
    localStorage.setItem('tusuan-current', JSON.stringify(seed));
    localStorage.setItem('tusuan-projects', JSON.stringify({ version: 1, activeId: 'qa-generation-main', projects: [
      { id: 'qa-generation-main', name: 'QA 城市生成', createdAt: now, updatedAt: now, plan: seed },
      { id: 'qa-generation-other', name: 'QA 独立保留', createdAt: now, updatedAt: now, plan: structuredClone(seed) },
    ] }));
  }, seed);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => report.pageErrors.push(error.message));
  const current = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
  const workspace = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-projects')));
  const shot = async name => { const file = path.join(out, `${name}.png`); await page.screenshot({ path: file, fullPage: true }); report.screenshots.push(file); };
  try {
    await page.goto(`${target}/#/city/${cityId}`, { waitUntil: 'networkidle' });
    await page.locator('.ch-generate').waitFor();
    const originalOther = (await workspace()).projects.find(p => p.id === 'qa-generation-other').plan;
    const detail = await run({ page, current, workspace, shot });
    assert.deepEqual((await workspace()).projects.find(p => p.id === 'qa-generation-other').plan, originalOther, 'Generating one project must not alter another');
    return detail;
  } finally { await context.close(); }
}
async function check(name, run) {
  if (process.env.CITY_GENERATION_CHECK && !name.toLowerCase().includes(process.env.CITY_GENERATION_CHECK.toLowerCase())) return;
  try { const detail = await run(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}: ${JSON.stringify(detail || {})}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function generate(page) {
  await page.locator('.ch-generate').click();
  await page.waitForURL('**/#/planner');
  await page.locator('.budget-total h2').waitFor();
}
try {
  await check('Beijing one-day all-sight selection grows to feasible days or explicitly retains candidates', () => {
    const seed = makePlan('beijing', { stops: [{ cityId: 'beijing', days: 1, attractionIds: [], dayPlans: [[]] }] });
    return inWorkspace(seed, 'beijing', async ({ page, current, shot }) => {
      await page.getByRole('button', { name: '加入全部景点', exact: true }).click();
      await page.getByLabel('城市停留天数', { exact: true }).fill('1');
      await page.getByLabel('城市停留天数', { exact: true }).press('Tab');
      await generate(page);
      const p = await current(), stop = p.stops[0], city = byId.get('beijing');
      assert.ok(stop.days > 1 && stop.days <= 15, String(stop.days));
      assert.deepEqual(new Set([...stop.attractionIds, ...stop.deferredAttractionIds]), new Set(city.attractions.map(a => a.id)));
      const itinerary = generateItinerary(p, catalog.cities, catalog.rates);
      for (const day of itinerary) {
        assert.ok(day.activeMinutes <= 480, `Day ${day.day}: ${day.activeMinutes} min`);
        assert.ok(day.items.at(-1).endMinute <= 1230, `Day ${day.day}: ${day.endTime}`);
      }
      const budget = calculatePlan(p, catalog.cities, catalog.rates);
      assert.equal(budget.lines.filter(l => l.category === 'attractions').length, stop.attractionIds.length);
      if (stop.deferredAttractionIds.length) assert.match(await page.locator('body').innerText(), /候选|待安排|暂无法排入/);
      await shot('city-generation-beijing-all');
      return { requestedDays: 1, scheduledDays: stop.days, selected: stop.attractionIds.length, candidates: stop.deferredAttractionIds.length, longestDayMinutes: Math.max(...itinerary.map(d => d.activeMinutes)) };
    });
  });
  await check('Tokyo two-day city selection schedules one sight and a concrete activity', () => {
    const city = byId.get('tokyo'), activity = city.experiences.find(e => e.kind === 'experience'), sight = city.attractions[0];
    const seed = makePlan('tokyo', { stops: [{ cityId: 'tokyo', days: 2, attractionIds: [sight.id], dayPlans: [[sight.id], []], experienceSelections: [] }] });
    return inWorkspace(seed, 'tokyo', async ({ page, current, shot }) => {
      await page.getByRole('tab', { name: /值得专程体验/ }).click();
      const card = page.locator('.ch-service-card').filter({ has: page.getByRole('heading', { name: activity.name, exact: true }) });
      await card.getByRole('button', { name: '加入我的行程', exact: true }).click();
      await generate(page);
      const p = await current(), stop = p.stops[0];
      assert.equal(stop.days, 2);
      assert.ok(stop.attractionIds.includes(sight.id), JSON.stringify({ expectedSight: sight.id, stop }));
      assert.equal(stop.experienceSelections.length, 1);
      assert.equal(stop.experienceSelections[0].experienceId, activity.id);
      assert.equal(stop.experienceSelections[0].scheduleStatus, undefined);
      const scheduled = generateItinerary(p, catalog.cities, catalog.rates).flatMap(d => d.items);
      assert.equal(scheduled.filter(i => i.kind === 'experience' && i.experienceId === activity.id).length, 1);
      assert.equal(scheduled.filter(i => i.attractionId === sight.id).length, 1);
      assert.ok(await page.locator('.selected-experiences').getByText(activity.name, { exact: true }).count());
      await shot('city-generation-tokyo-activity');
      return { days: stop.days, sight: sight.name, activity: activity.name, activityDay: stop.experienceSelections[0].dayIndex + 1 };
    });
  });
  await check('changing same-city restaurant services retains checked flights hotel and unrelated insurance', () => {
    const city = byId.get('tokyo'), meal = city.experiences.find(e => e.kind === 'restaurant');
    assert.ok(meal.priceOptions.length >= 2);
    const selection = { experienceId: meal.id, optionId: meal.priceOptions[0].id, dayIndex: 0, mealType: meal.mealType };
    const retained = { 'leg-0': { amount: 1234.56, confirmed: true }, 'leg-return': { amount: 2345.67, confirmed: true }, 'stop-0-lodging': { amount: 3456.78, confirmed: true }, insurance: { amount: 111.02, confirmed: true } };
    const seed = makePlan('tokyo', { stops: [{ cityId: 'tokyo', days: 2, attractionIds: [], dayPlans: [[], []], experienceSelections: [selection] }], overrides: { ...retained, 'stop-0-food': { amount: 333.33, confirmed: true }, [experienceLineId(0, selection)]: { amount: 200, confirmed: true } } });
    return inWorkspace(seed, 'tokyo', async ({ page, current, shot }) => {
      await page.getByRole('tab', { name: /在这里吃饭/ }).click();
      await page.getByLabel(`${meal.name}套餐`, { exact: true }).selectOption(meal.priceOptions[1].id);
      const card = page.locator('.ch-service-card').filter({ has: page.getByRole('heading', { name: meal.name, exact: true }) });
      await card.getByRole('button', { name: '更新我的选择', exact: true }).click();
      await generate(page);
      const p = await current();
      assert.equal(p.stops[0].days, 2);
      assert.equal(p.stops[0].experienceSelections[0].optionId, meal.priceOptions[1].id);
      for (const [id, value] of Object.entries(retained)) assert.deepEqual(p.overrides[id], value, `Unrelated checked cost ${id} must survive changing the meal option`);
      assert.equal(p.overrides[experienceLineId(0, selection)], undefined, 'The changed restaurant quote must be rechecked');
      await shot('city-generation-preserves-checked-costs');
      return { retainedCheckedLineIds: Object.keys(retained), changedOption: meal.priceOptions[1].id };
    });
  });
  await check('ineligible party size is disabled on city cards and cannot corrupt an existing selected activity', async () => {
    const city = byId.get('bali'), activity = city.experiences.find(e => (e.minParticipants ?? 1) > 1);
    assert.ok(activity, 'The real Bali tour declares its minimum participant count');
    const min = activity.minParticipants;
    await inWorkspace(makePlan('bali', { travelers: 1 }), 'bali', async ({ page, current }) => {
      const before = await current();
      await page.getByRole('tab', { name: /值得专程体验/ }).click();
      const card = page.locator('.ch-service-card').filter({ has: page.getByRole('heading', { name: activity.name, exact: true }) });
      assert.ok(await card.getByRole('button', { name: '加入我的行程', exact: true }).isDisabled());
      assert.match(await card.innerText(), /至少需要 2 人|当前为 1 人/);
      assert.deepEqual(await current(), before, 'Browsing an ineligible option must not mutate the active plan');
    });
    const selection = { experienceId: activity.id, optionId: activity.priceOptions[0].id, dayIndex: 0 };
    const seed = makePlan('bali', { travelers: min, stops: [{ cityId: 'bali', days: 2, attractionIds: [], dayPlans: [[], []], experienceSelections: [selection] }], overrides: { insurance: { amount: 44.44, confirmed: true } } });
    return inWorkspace(seed, 'bali', async ({ page, current, shot }) => {
      await page.goto(`${target}/#/planner`, { waitUntil: 'networkidle' });
      const before = await current();
      await page.getByRole('button', { name: /同行伙伴/ }).click();
      await page.getByLabel('减少成人', { exact: true }).click();
      await page.getByText(new RegExp(`至少需要 ${min} 人`)).last().waitFor();
      assert.deepEqual(await current(), before, 'Rejected party-size change must keep the original plan and checked costs');
      await shot('city-generation-participant-rejection');
      return { minimum: min, rejectedTravelers: min - 1, originalPlanPreserved: true };
    });
  });
} finally {
  await browser.close();
  await writeFile(path.join(out, 'city-generation-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
if (report.checks.some(check => !check.passed) || report.pageErrors.length) process.exitCode = 1;
