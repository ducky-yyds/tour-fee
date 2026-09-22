import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const output = path.resolve('artifacts', 'qa');
await mkdir(output, { recursive: true });
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], requestErrors: [], screenshots: [] };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: 'zh-CN' });
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', error => report.pageErrors.push(error.message));
page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(target)) report.requestErrors.push({ url: response.url(), status: response.status() }); });
const catalog = await (await context.request.get(target + '/api/catalog')).json();
const city = id => catalog.cities.find(city => city.id === id);
const stop = (id, days) => ({ cityId: id, days, attractionIds: city(id).attractions.map(attraction => attraction.id), planningMode: 'smart' });
const base = { originId: 'shanghai', departureDate: '2030-10-23', travelers: 2, rooms: 1, mode: 'travel', currency: 'CNY', tier: 1, reservePercent: 10, returnTrip: true, overrides: {} };
const read = key => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const current = () => read('tusuan-current');
const settled = () => page.waitForTimeout(160);
const timelineItem = id => page.locator(`.rich-timeline-item[data-item-id="${id}"]`);
const transportLines = budget => budget.lines.filter(line => ['intercity', 'transfer'].includes(line.category)).map(({ id, category, amount, quantity, confirmed }) => ({ id, category, amount, quantity, confirmed }));
const minutes = text => { const [clock, offset = '0'] = text.split('+'); const [h, m] = clock.split(':').map(Number); return h * 60 + m + Number(offset) * 1440; };
async function calculated() {
  const response = await context.request.post(target + '/api/plan', { data: await current() });
  assert.equal(response.status(), 200, await response.text());
  return response.json();
}
async function check(name, action) {
  try { const detail = await action(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}${detail ? ': ' + JSON.stringify(detail) : ''}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function fixture(plan, name = 'QA 跨城交通项目') {
  if (!page.url().startsWith(target)) await page.goto(target + '/#/planner', { waitUntil: 'networkidle' });
  const project = { id: 'qa-journey-project', name, createdAt: '2026-09-22T00:00:00.000Z', updatedAt: '2026-09-22T00:00:00.000Z', plan };
  await page.evaluate(({ plan, project }) => {
    localStorage.setItem('tusuan-current', JSON.stringify(plan));
    localStorage.setItem('tusuan-projects', JSON.stringify({ version: 1, activeId: project.id, projects: [project] }));
    window.location.hash = '/planner';
  }, { plan, project });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.trip-controls').waitFor();
  await page.getByTestId('journey-details-toggle').click();
  await page.getByRole('tab', { name: /每日行程/ }).click();
  await page.locator('.itinerary-workspace').waitFor();
}
async function replan() {
  const edit = page.getByRole('button', { name: '调配景点', exact: true });
  if (await edit.isVisible()) await edit.click();
  await page.getByRole('button', { name: '智能重排行程', exact: true }).click();
  await settled();
}
async function preview() {
  const generate = page.getByRole('button', { name: /按我的安排生成/ });
  if (await generate.isVisible()) await generate.click();
  await page.locator('.journal-day-nav').waitFor();
}
async function day(index) {
  await preview();
  await page.locator('.journal-day-nav > button').nth(index).click();
  await settled();
}
async function screenshot(name) {
  const file = path.join(output, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.screenshots.push(file);
}
async function noOverflow() {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(sizes.document <= sizes.viewport + 1 && sizes.body <= sizes.viewport + 1, JSON.stringify(sizes));
  return sizes;
}
async function untimedReminders(dayData) {
  const reminders = dayData.items.filter(item => item.timing === 'unscheduled');
  assert(reminders.length > 0, 'Fixture should contain flexible budget reminders');
  for (const item of reminders) {
    assert.equal(item.time, null, item.id);
    assert.equal(item.endTime, null, item.id);
    assert.equal(item.durationMinutes, 0, item.id);
    const node = timelineItem(item.id);
    assert.equal(await node.count(), 1, item.id);
    assert.equal(await node.getAttribute('data-timing'), 'unscheduled', item.id);
    assert.doesNotMatch(await node.locator('.timeline-clock').textContent(), /\d{1,2}:\d{2}/, item.id);
  }
  return reminders.map(item => item.id);
}
async function scenePhoto(item) {
  const node = timelineItem(item.id), img = node.locator('img').first();
  assert(await img.count() > 0, `A routine scene photo is expected for ${item.id}`);
  await img.scrollIntoViewIfNeeded();
  const handle = await img.elementHandle();
  await page.waitForFunction(image => image.complete && image.naturalWidth > 0, handle);
  const details = await img.evaluate(image => ({ src: image.currentSrc, alt: image.alt, width: image.naturalWidth }));
  assert(details.alt.trim().length > 0, item.id);
  const scene = node.locator('.timeline-scene');
  if (await scene.count()) {
    assert.match(await scene.locator('figcaption a').first().getAttribute('href'), /^https?:\/\//, item.id);
  }
  return { itemId: item.id, ...details };
}
function emptyArrival(ready, offset = 0, extra = {}) {
  return {
    ...base,
    returnTrip: false,
    ...extra,
    stops: [{ cityId: 'paris', days: 3, planningMode: 'manual', attractionIds: [], dayPlans: [[], [], []], transportWindow: { arrivalReadyTime: ready, arrivalDayOffset: offset } }],
  };
}

try {
  await check('distance and origin change the one-day sightseeing capacity', async () => {
    const counts = [];
    for (const originId of ['paris', 'brussels', 'shanghai']) {
      if (!counts.length) await fixture({ ...base, originId, returnTrip: false, stops: [stop('paris', 1)] }, 'QA 不同出发城到巴黎一日');
      else {
        await page.locator('.origin-field').click();
        await page.locator('dialog .search-box input').fill(city(originId).nameEn);
        await page.locator('dialog .picker-city').filter({ hasText: city(originId).name }).click();
        await settled();
        assert.equal((await current()).originId, originId);
      }
      await replan();
      const p = await current();
      const budget = await calculated();
      counts.push({ origin: originId, attractions: p.stops[0].attractionIds.length, localMinutes: budget.itinerary[0].visitMinutes, transport: budget.itinerary[0].items.filter(item => item.journey && ['arrival', 'departure'].includes(item.kind)).map(item => item.reservedDurationMinutes) });
    }
    assert(counts[0].attractions > 0, JSON.stringify(counts));
    assert(counts[1].attractions < counts[0].attractions, JSON.stringify(counts));
    assert(counts[2].attractions < counts[0].attractions, JSON.stringify(counts));
    assert.equal(counts[2].attractions, 0);
    return counts;
  });

  await check('one-day long-haul return remains a transport day rather than an overloaded sightseeing list', async () => {
    await fixture({ ...base, stops: [stop('paris', 1)] });
    await replan();
    await preview();
    const budget = await calculated();
    assert.equal((await current()).stops[0].attractionIds.length, 0);
    assert.equal(await page.locator('.kind-attraction').count(), 0);
    assert.equal(budget.itinerary[0].visitMinutes, 0);
    assert((await page.locator('.itinerary-workspace').innerText()).includes('交通'));
    assert.equal(budget.lines.filter(line => line.id === 'leg-0').length, 1);
    assert.equal(budget.lines.filter(line => line.id === 'leg-return').length, 1);
    await screenshot('journey-transport-only-desktop');
    return { deferred: (await current()).stops[0].deferredAttractionIds.length, warnings: budget.itinerary[0].warnings.map(warning => warning.code) };
  });

  const booked = {
    'leg-0': { amount: 3456.78, confirmed: true },
    'leg-return': { amount: 4321, confirmed: true },
    'transfer-0': { amount: 180, confirmed: true },
    'stop-0-lodging': { amount: 2700, confirmed: true },
  };
  let beforeTransport;
  await check('15:00 arrival and 11:00 return boundaries constrain both API and visible sightseeing', async () => {
    await fixture({ ...base, stops: [stop('paris', 4)], overrides: booked }, 'QA 已订机票的巴黎项目');
    beforeTransport = transportLines(await calculated());
    await page.locator('#jt-arrival-0').fill('15:00');
    await page.locator('#jt-return-time').fill('11:00');
    await settled();
    await replan();
    await preview();
    const budget = await calculated();
    const first = budget.itinerary[0], last = budget.itinerary.at(-1);
    assert.equal(first.dayWindow.startMinute, 900);
    assert.equal(last.dayWindow.endMinute, 660);
    assert(first.items.some(item => item.kind === 'attraction'), '15:00 leaves a usable afternoon in this four-day fixture');
    assert(first.items.filter(item => !item.journey && item.durationMinutes > 0).every(item => item.startMinute >= 900));
    assert(last.items.filter(item => !item.journey && item.durationMinutes > 0).every(item => item.endMinute <= 660));
    const visibleTimes = await page.locator('.kind-attraction .timeline-clock strong').allTextContents();
    assert(visibleTimes.length > 0 && visibleTimes.every(value => minutes(value) >= 900), JSON.stringify(visibleTimes));
    assert.equal((await current()).stops[0].transportWindow.arrivalReadyTime, '15:00');
    assert.equal((await current()).stops[0].transportWindow.departureLeaveTime, '11:00');
    assert.deepEqual(transportLines(budget), beforeTransport);
    for (const [id, expected] of Object.entries(booked)) assert.deepEqual((await current()).overrides[id], expected);
    await screenshot('journey-late-arrival-desktop');
    return { visibleAttractionTimes: visibleTimes, firstWindow: first.dayWindow, lastWindow: last.dayWindow };
  });

  await check('overnight arrival reserves the previous day and workbook smart replan respects it', async () => {
    await page.locator('#jt-offset-0').selectOption('1');
    await replan();
    await preview();
    const budget = await calculated();
    const first = budget.itinerary[0], arrival = budget.itinerary[1];
    assert.equal(first.dayWindow.travelOnly, true);
    assert.equal(first.attractionIds.length, 0);
    assert.equal(first.visitMinutes, 0);
    assert.equal(arrival.dayWindow.startMinute, 900);
    assert(arrival.items.filter(item => !item.journey && item.durationMinutes > 0).every(item => item.startMinute >= 900));
    await day(0);
    assert.equal(await page.locator('.kind-attraction').count(), 0);
    assert((await page.getByTestId('journey-window-summary').innerText()).includes('此前 1 天保留给交通'));
    assert(budget.itinerary.every(day => !day.warnings.some(warning => warning.code === 'journey-window-conflict')));
    assert.deepEqual(transportLines(budget), beforeTransport);
    return { firstDayTravelOnly: first.dayWindow.travelOnly, arrivalDay: arrival.day, arrivalTime: arrival.localStartMinute };
  });

  await check('timeline transport money references the existing single charge for every leg and transfer', async () => {
    const budget = await calculated();
    for (const line of budget.lines.filter(line => ['intercity', 'transfer'].includes(line.category))) {
      assert.equal(budget.lines.filter(candidate => candidate.id === line.id).length, 1);
      const displayed = budget.itinerary.flatMap(day => day.items).filter(item => item.cost?.budgetLineId === line.id).reduce((sum, item) => sum + (item.cost?.amount || 0), 0);
      assert(Math.abs(displayed - line.amount) < .01, `${line.id}: timeline=${displayed}, budget=${line.amount}`);
    }
    const legIds = await page.getByTestId('journey-leg').evaluateAll(nodes => nodes.map(node => node.dataset.legId));
    assert.deepEqual(legIds, ['leg-0', 'leg-return']);
    await page.getByRole('tab', { name: /费用明细/ }).click();
    const labels = await page.locator('.cost-table .cost-label strong').allTextContents();
    assert(labels.some(label => label.includes('返程')), JSON.stringify(labels));
    assert(labels.some(label => label.includes('两端接驳')), JSON.stringify(labels));
    assert.equal((await current()).overrides['leg-0'].amount, 3456.78);
    await page.getByRole('tab', { name: /每日行程/ }).click();
    return { lines: beforeTransport, costTableRows: labels.length };
  });

  await check('transport windows survive refresh and project duplication without linking the copies', async () => {
    const before = await current();
    const originalWorkspace = await read('tusuan-projects');
    const original = originalWorkspace.projects.find(project => project.id === originalWorkspace.activeId);
    await page.reload({ waitUntil: 'networkidle' });
    assert.deepEqual((await current()).stops[0].transportWindow, before.stops[0].transportWindow);
    await page.getByTestId('journey-details-toggle').click();
    for (const [id, expected] of Object.entries(booked)) assert.deepEqual((await current()).overrides[id], expected);
    await page.getByRole('button', { name: '管理项目', exact: true }).click();
    await page.getByLabel(`复制${original.name}`, { exact: true }).click();
    await settled();
    const copiedWorkspace = await read('tusuan-projects');
    assert.equal(copiedWorkspace.projects.length, 2);
    assert.notEqual(copiedWorkspace.activeId, original.id);
    assert.deepEqual((await current()).stops[0].transportWindow, before.stops[0].transportWindow);
    await page.locator('#jt-arrival-0').fill('14:00');
    await settled();
    const updatedWorkspace = await read('tusuan-projects');
    assert.equal(updatedWorkspace.projects.find(project => project.id === original.id).plan.stops[0].transportWindow.arrivalReadyTime, '15:00');
    assert.equal((await current()).stops[0].transportWindow.arrivalReadyTime, '14:00');
    await page.getByLabel('切换旅行项目', { exact: true }).selectOption(original.id);
    await settled();
    assert.equal((await current()).stops[0].transportWindow.arrivalReadyTime, '15:00');
    assert.equal(await page.locator('#jt-arrival-0').inputValue(), '15:00');
    return { projects: updatedWorkspace.projects.map(project => ({ name: project.name, ready: project.plan.stops[0].transportWindow.arrivalReadyTime })) };
  });

  await check('a later city receives its own transfer allowance and editable local arrival window', async () => {
    await fixture({ ...base, returnTrip: false, stops: [stop('tokyo', 2), stop('kyoto', 3)] }, 'QA 东京换城京都');
    let budget = await calculated();
    const nextArrival = budget.itinerary.find(day => day.stopIndex === 1 && day.localDay === 0);
    assert(nextArrival.dayWindow.reservedMinutes > 0);
    assert(nextArrival.dayWindow.startMinute > 540);
    assert(nextArrival.items.some(item => item.journey && item.cost?.budgetLineId === 'leg-1'));
    const firstStop = structuredClone((await current()).stops[0].transportWindow);
    await page.locator('#jt-arrival-1').fill('16:00');
    await settled();
    budget = await calculated();
    const updated = budget.itinerary.find(day => day.stopIndex === 1 && day.localDay === 0);
    assert.equal(updated.dayWindow.startMinute, 960);
    assert(updated.items.filter(item => !item.journey && item.durationMinutes > 0).every(item => item.startMinute >= 960));
    assert.deepEqual((await current()).stops[0].transportWindow, firstStop);
    await day(2);
    const visibleTimes = await page.locator('.kind-attraction .timeline-clock strong').allTextContents();
    assert(visibleTimes.every(value => minutes(value) >= 960), JSON.stringify(visibleTimes));
    await screenshot('journey-multi-city-desktop');
    return { beforeStart: nextArrival.dayWindow.startMinute, afterStart: updated.dayWindow.startMinute, visibleTimes };
  });

  await check('manual overloaded plans are preserved with a conflict notice until smart replan is chosen', async () => {
    const ids = city('paris').attractions.slice(0, 6).map(attraction => attraction.id);
    await fixture({ ...base, plannerVersion: 2, returnTrip: false, stops: [{ ...stop('paris', 1), planningMode: 'manual', attractionIds: ids, dayPlans: [ids], transportWindow: { arrivalReadyTime: '19:00', arrivalDayOffset: 0 } }] }, 'QA 手动安排冲突');
    assert.deepEqual((await current()).stops[0].attractionIds, ids);
    let budget = await calculated();
    assert(budget.itinerary[0].warnings.some(warning => warning.code === 'journey-window-conflict'));
    assert((await page.locator('.journal-warnings').innerText()).includes('冲突'));
    await replan();
    budget = await calculated();
    assert((await current()).stops[0].attractionIds.length < ids.length);
    assert(!budget.itinerary[0].warnings.some(warning => warning.code === 'journey-window-conflict'));
    await preview();
    return { before: ids.length, after: (await current()).stops[0].attractionIds.length };
  });

  await check('390px transport controls and daily timeline have no horizontal overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#jt-arrival-0').fill('15:00');
    await settled();
    assert.equal((await current()).stops[0].transportWindow.arrivalReadyTime, '15:00');
    await screenshot('journey-transport-mobile-390');
    return await noOverflow();
  });

  await check('living and globe remain independent of the saved journey windows', async () => {
    await page.setViewportSize({ width: 1440, height: 1050 });
    const before = await current();
    await page.locator('.main-nav').getByRole('button', { name: '旅居生活', exact: true }).click();
    await page.getByTestId('living-monthly').waitFor();
    await page.getByLabel('居住人数', { exact: true }).fill('3');
    await page.getByLabel('显示币种', { exact: true }).selectOption('USD');
    assert.deepEqual(await current(), before);
    await page.locator('.main-nav').getByRole('button', { name: '环球探索', exact: true }).click();
    await page.getByTestId('world-globe').waitFor();
    await page.getByLabel('放大地球', { exact: true }).click();
    assert.deepEqual(await current(), before);
    await page.locator('.main-nav').getByRole('button', { name: '规划旅程', exact: true }).click();
    await page.getByTestId('journey-transport').waitFor();
    assert.deepEqual(await current(), before);
    assert.equal(await page.locator('#jt-arrival-0').inputValue(), '15:00');
  });

  await check('an empty 15:00 arrival gets check-in and a real nearby walk, while untimed meals stay inside the journey', async () => {
    await fixture(emptyArrival('15:00', 0, { overrides: { 'stop-0-food': { amount: 1200, confirmed: true } } }), 'QA 下午抵达后轻松安排');
    const budget = await calculated(), first = budget.itinerary[0];
    assert.equal(first.attractionIds.length, 0);
    assert.equal(first.dayWindow.startMinute, 900);
    const checkIn = first.items.find(item => item.routineType === 'check-in');
    const walk = first.items.find(item => item.routineType === 'citywalk');
    const inbound = first.items.find(item => item.journeyDirection === 'inbound' && item.journeyPhase !== 'arrived' && item.kind === 'arrival');
    const arrived = first.items.find(item => item.journeyPhase === 'arrived');
    const breakfast = first.items.find(item => item.mealType === 'breakfast');
    const transfer = first.items.find(item => item.kind === 'journey-transfer');
    assert(checkIn && walk && inbound && arrived && breakfast && transfer, JSON.stringify(first.items.map(item => ({ id: item.id, kind: item.kind, routineType: item.routineType, journeyPhase: item.journeyPhase }))));
    assert(checkIn.startMinute >= 900 && walk.startMinute >= checkIn.endMinute);
    assert(walk.endMinute <= first.dayWindow.endMinute);
    assert(walk.suggestedPlaces?.length > 0, 'The walk must identify real places');
    assert(walk.suggestedPlaces.every(place => city('paris').attractions.some(attraction => attraction.id === (place.id || place.attractionId))), JSON.stringify(walk.suggestedPlaces));
    assert.equal(walk.cost.amount, 0);
    assert.equal(breakfast.placement, 'during-journey');
    assert.equal(breakfast.relatedJourneyId, inbound.id);
    const ids = await page.locator('.rich-timeline-item').evaluateAll(nodes => nodes.map(node => node.dataset.itemId));
    assert(ids.indexOf(inbound.id) < ids.indexOf(breakfast.id) && ids.indexOf(breakfast.id) < ids.indexOf(arrived.id), JSON.stringify(ids));
    const untimed = await untimedReminders(first);
    const photos = [];
    for (const item of [breakfast, inbound, transfer, checkIn, walk]) photos.push(await scenePhoto(item));
    for (const item of [inbound, transfer]) {
      await timelineItem(item.id).locator('.routine-budget').click();
      assert.equal(await page.locator('#actual-amount').isVisible(), true);
      assert.equal(Number(await page.locator('#actual-amount').inputValue()), budget.lines.find(line => line.id === item.cost.budgetLineId).amount);
      await page.getByLabel('关闭弹窗', { exact: true }).click();
    }
    assert.deepEqual((await current()).stops[0].dayPlans, [[], [], []], 'Suggestions must not silently become manually selected attractions');
    await timelineItem(breakfast.id).locator('.meal-budget').click();
    await page.locator('#actual-amount').fill('1234.57');
    await page.locator('dialog .check-label input').check();
    await page.getByRole('button', { name: '保存这笔费用', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).overrides['stop-0-food']?.amount === 1234.57);
    const updated = await calculated();
    const shares = updated.itinerary.flatMap(day => day.items).filter(item => item.cost?.budgetLineId === 'stop-0-food').reduce((sum, item) => sum + (item.cost.amount || 0), 0);
    assert(Math.abs(shares - 1234.57) < .01, `Meal reminder shares must reconcile: ${shares}`);
    await screenshot('journey-flexible-arrival-desktop');
    await page.setViewportSize({ width: 390, height: 844 });
    await untimedReminders(updated.itinerary[0]);
    for (const item of [breakfast, inbound, transfer, checkIn, walk]) await scenePhoto(item);
    const mobile = await noOverflow();
    await screenshot('journey-flexible-arrival-mobile-390');
    await page.setViewportSize({ width: 1440, height: 1050 });
    return { untimed, photos, walkPlaces: walk.suggestedPlaces, mobile };
  });

  await check('late and overnight arrivals do not invent an afternoon walk or mark arrival while still in transit', async () => {
    const cases = [];
    for (const [ready, offset] of [['22:30', 0], ['15:00', 1]]) {
      await fixture(emptyArrival(ready, offset), `QA ${offset ? '跨夜在途' : '深夜抵达'}`);
      const budget = await calculated(), first = budget.itinerary[0];
      assert.equal(first.items.filter(item => item.routineType === 'citywalk').length, 0);
      assert.equal(first.items.filter(item => ['attraction', 'experience'].includes(item.kind)).length, 0);
      assert.equal(first.items.filter(item => !item.journey && item.durationMinutes > 0).length, 0, 'Late arrival and in-transit days should not gain mandatory local activities');
      if (offset) {
        assert.equal(first.dayWindow.travelOnly, true);
        assert.equal(first.items.filter(item => item.journeyPhase === 'arrived' || item.routineType === 'check-in').length, 0);
      }
      await untimedReminders(first);
      assert.equal(await page.locator('[data-routine-type="citywalk"]').count(), 0);
      cases.push({ ready, offset, routines: first.items.filter(item => item.routineType).map(item => item.routineType), reminders: first.items.filter(item => item.timing === 'unscheduled').length });
      await screenshot(offset ? 'journey-overnight-in-transit' : 'journey-late-rest-only');
    }
    return cases;
  });

  await check('an explicitly selected restaurant keeps its scheduled time and bill without an inserted city walk', async () => {
    const restaurant = city('paris').experiences.find(experience => experience.kind === 'restaurant');
    const option = restaurant.priceOptions.find(option => !option.mealTypes || option.mealTypes.includes('dinner'));
    const selected = { experienceId: restaurant.id, optionId: option.id, dayIndex: 0, mealType: 'dinner' };
    const plan = emptyArrival('15:00');
    plan.stops[0].experienceSelections = [selected];
    await fixture(plan, 'QA 保留自己选择的晚餐');
    const budget = await calculated(), first = budget.itinerary[0];
    const meal = first.items.find(item => item.experienceId === restaurant.id && item.mealType === 'dinner');
    assert(meal && meal.durationMinutes > 0);
    assert.notEqual(meal.timing, 'unscheduled');
    assert.match(meal.time, /^\d{1,2}:\d{2}/);
    assert.equal(first.items.filter(item => item.routineType === 'citywalk').length, 0);
    assert.match(await timelineItem(meal.id).locator('.timeline-clock').textContent(), /\d{1,2}:\d{2}/);
    assert.deepEqual((await current()).stops[0].experienceSelections, [selected]);
    assert.equal(budget.lines.filter(line => line.id === meal.cost.budgetLineId).length, 1);
    assert.equal(first.items.filter(item => item.cost?.budgetLineId === meal.cost.budgetLineId).reduce((sum, item) => sum + (item.cost.amount || 0), 0), budget.lines.find(line => line.id === meal.cost.budgetLineId).amount);
    await scenePhoto(meal);
    await timelineItem(meal.id).locator('.timeline-price').click();
    assert.equal(await page.locator('#actual-amount').isVisible(), true);
    await page.getByLabel('关闭弹窗', { exact: true }).click();
    await untimedReminders(first);
    await screenshot('journey-user-selected-restaurant');
    return { restaurant: restaurant.name, time: meal.time, duration: meal.durationMinutes, budgetLineId: meal.cost.budgetLineId };
  });
} finally {
  await browser.close();
  await writeFile(path.join(output, 'journey-transport-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ checks: report.checks.length, failed: report.checks.filter(check => !check.passed), pageErrors: report.pageErrors, requestErrors: report.requestErrors, screenshots: report.screenshots }, null, 2));
}
if (report.checks.some(check => !check.passed) || report.pageErrors.length || report.requestErrors.length) process.exitCode = 1;
