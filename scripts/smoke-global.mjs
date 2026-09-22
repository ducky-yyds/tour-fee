import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// Run against the built app after restarting its server. All browser data is
// isolated in a fresh context; this does not touch the user's saved projects.
const target = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const output = 'artifacts/qa';
const regressionsOnly = process.argv.includes('--regressions-only');
const catalogResponse = await fetch(`${target}/api/catalog`);
assert.equal(catalogResponse.status, 200);
const catalog = await catalogResponse.json();
const report = {
  testedAt: new Date().toISOString(), target,
  checks: [], pageErrors: [], imageFailures: [], screenshots: [],
};
const seed = {
  plannerVersion: 2, originId: 'shanghai',
  stops: [{ cityId: 'reykjavik', days: 3, attractionIds: [], dayPlans: [[], [], []] }],
  departureDate: '2026-10-20', travelers: 2, rooms: 1,
  currency: 'CNY', mode: 'travel', tier: 1, returnTrip: true,
  reservePercent: 10, overrides: {},
};
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
await context.addInitScript(plan => {
  if (!localStorage.getItem('tusuan-current')) localStorage.setItem('tusuan-current', JSON.stringify(plan));
}, seed);
const page = await context.newPage();
page.setDefaultTimeout(20000);
page.on('pageerror', error => report.pageErrors.push(error.message));
page.on('response', response => {
  if (response.url().includes('/images/') && response.status() >= 400) {
    const row = { url: response.url(), status: response.status() };
    if (!report.imageFailures.some(item => item.url === row.url)) report.imageFailures.push(row);
  }
});
async function check(name, run) {
  if (regressionsOnly && !name.startsWith('regression:')) return;
  try {
    const detail = await run();
    report.checks.push({ name, passed: true, detail });
    console.log(`PASS ${name}`);
  } catch (error) {
    report.checks.push({ name, passed: false, error: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}
async function screenshot(name, targetPage = page) {
  const path = `${output}/global-${name}.png`;
  await targetPage.screenshot({ path });
  report.screenshots.push(path);
}
async function noOverflow() {
  const size = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(size.document <= size.viewport + 1, JSON.stringify(size));
  assert.ok(size.body <= size.viewport + 1, JSON.stringify(size));
  return size;
}
async function underlineClear() {
  const rows = await page.locator('.main-nav > button.active').evaluateAll(buttons => buttons.map(button => {
    const pseudo = getComputedStyle(button, '::after');
    const box = button.getBoundingClientRect();
    const range = document.createRange();
    const nodes = [...button.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    const textBottom = Math.max(...nodes.flatMap(node => { range.selectNodeContents(node); return [...range.getClientRects()].map(rect => rect.bottom); }));
    return {
      text: button.textContent.trim(), display: pseudo.display,
      content: pseudo.content, textBottom,
      underlineTop: box.bottom - (parseFloat(pseudo.bottom) || 0) - (parseFloat(pseudo.height) || 0),
    };
  }));
  assert.ok(rows.length, 'Expected an active navigation tab');
  for (const row of rows) {
    if (row.display !== 'none' && row.content !== 'none') {
      assert.ok(Number.isFinite(row.textBottom), 'Navigation text must have a measurable box');
      assert.ok(row.underlineTop >= row.textBottom + 2, `Underline overlaps text: ${JSON.stringify(row)}`);
    }
  }
  return rows;
}
async function openHome(id) {
  await page.goto(`${target}/#/city/${id}`, { waitUntil: 'networkidle' });
  await page.getByLabel('城市行程选择篮').waitFor();
  assert.equal(await page.getByLabel('切换城市主页').inputValue(), id);
}
async function loadedImage(locator, label) {
  await locator.scrollIntoViewIfNeeded();
  const result = await locator.evaluate(async node => {
    const image = node.matches('img') ? node : node.querySelector('img');
    if (!image) return { loaded: false, reason: 'No img: fallback/placeholder displayed' };
    if (!image.complete) await Promise.race([
      new Promise(resolve => { image.addEventListener('load', resolve, { once: true }); image.addEventListener('error', resolve, { once: true }); }),
      new Promise(resolve => setTimeout(resolve, 5000)),
    ]);
    return { loaded: image.complete && image.naturalWidth > 100, source: image.currentSrc, alt: image.alt, width: image.naturalWidth, height: image.naturalHeight };
  });
  assert.ok(result.loaded, `${label}: ${JSON.stringify(result)}`);
  return result;
}
const currentPlan = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));

try {
  await check('catalog: 100 destinations, 59 countries, 821 attractions and real local currencies', async () => {
    const cities = catalog.cities;
    assert.equal(cities.length, 100);
    assert.equal(new Set(cities.map(city => city.countryCode)).size, 59);
    assert.equal(cities.reduce((sum, city) => sum + city.attractions.length, 0), 821);
    assert.equal(cities.filter(city => city.countryCode === 'IS').length, 3);
    assert.equal(cities.filter(city => city.countryCode === 'MV').length, 2);
    assert.equal(cities.filter(city => city.region === '非洲').length, 10);
    for (const city of cities) {
      assert.ok(city.guide?.intro, city.id);
      for (const attraction of city.attractions) assert.ok(attraction.durationRange?.recommended > 0, attraction.id);
    }
    assert.equal(cities.find(city => city.id === 'reykjavik').currency, 'ISK');
    const male = cities.find(city => city.id === 'male');
    assert.ok(['USD', 'MVR'].includes(male.currency));
    if (male.currency === 'USD') assert.ok(/USD|美元/.test(male.budgetBasis?.note || ''), 'USD-based Maldives budgets need a visible currency basis');
    return { destinations: 100, countries: 59, attractions: 821 };
  });

  await check('desktop exploration shows the same global coverage and all 100 cards', async () => {
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.getByRole('navigation', { name: '主导航' }).getByRole('button', { name: '探索目的地', exact: true }).click();
    await page.locator('.explore-card').first().waitFor();
    assert.equal(await page.locator('.explore-card').count(), 100);
    const values = await page.locator('.destination-coverage strong').allTextContents();
    assert.deepEqual(values, ['59', '100', '821']);
    await noOverflow();
    await screenshot('explore-desktop');
    return { values, navigation: await underlineClear() };
  });

  await check('country and region filters return Iceland 3, Maldives 2, Africa 10', async () => {
    const filter = page.getByLabel('筛选国家或地区');
    await filter.selectOption({ label: '冰岛' });
    assert.equal(await page.locator('.explore-card').count(), 3);
    assert.ok((await page.locator('.explore-grid').innerText()).includes('雷克雅未克'));
    await screenshot('iceland-filter');
    await filter.selectOption({ label: '马尔代夫' });
    assert.equal(await page.locator('.explore-card').count(), 2);
    await screenshot('maldives-filter');
    await page.locator('.filter-pills').getByRole('button', { name: '非洲', exact: true }).click();
    assert.equal(await page.locator('.explore-card').count(), 10);
    assert.equal(await filter.inputValue(), '全部');
    await page.locator('.filter-pills').getByRole('button', { name: '整个世界', exact: true }).click();
    await page.getByLabel('搜索目的地').fill('冰岛');
    assert.equal(await page.locator('.explore-card').count(), 3);
    await page.getByLabel('搜索目的地').fill('');
    assert.equal(await page.locator('.explore-card').count(), 100);
    return { Iceland: 3, Maldives: 2, Africa: 10 };
  });

  await check('45 display currencies are available, including ISK/MVR and African currencies', async () => {
    const selector = page.getByLabel('显示币种');
    const currencies = await selector.locator('option').evaluateAll(options => options.map(option => option.value));
    assert.equal(currencies.length, 45);
    for (const code of ['ISK', 'MVR', 'KES', 'TZS', 'SCR', 'MUR']) assert.ok(currencies.includes(code), code);
    await selector.selectOption('ISK');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).currency === 'ISK');
    assert.ok(!(await page.locator('.explore-grid').innerText()).includes('NaN'));
    await selector.selectOption('MVR');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).currency === 'MVR');
    assert.ok(!(await page.locator('.explore-grid').innerText()).includes('NaN'));
    await selector.selectOption('CNY');
    return { count: currencies.length, currencies };
  });

  for (const id of ['reykjavik', 'vik', 'akureyri', 'male', 'maafushi']) {
    await check(`${id}: direct city homepage, transport note and destination photograph`, async () => {
      const city = catalog.cities.find(item => item.id === id);
      await openHome(id);
      await page.getByRole('heading', { name: '先认识一座城，再决定怎样停留。' }).waitFor();
      assert.ok((await page.locator('.ch-hero-location').innerText()).includes(city.country));
      assert.ok((await page.locator('.ch-destination-note').innerText()).includes(city.transportNote));
      assert.equal(await page.getByLabel('切换城市主页').locator('option').count(), 100);
      await noOverflow();
      await screenshot(`${id}-desktop`);
      return await loadedImage(page.locator('.ch-hero'), `${id} city photograph`);
    });
  }

  for (const id of ['reykjavik', 'male']) {
    await check(`${id}: selecting two sights generates a persisted itinerary with finite budget`, async () => {
      const city = catalog.cities.find(item => item.id === id);
      await openHome(id);
      const clear = page.getByRole('button', { name: '清空选择', exact: true });
      if (await clear.count()) await clear.click();
      const chosen = city.attractions.slice(0, 2);
      for (const attraction of chosen) await page.getByLabel(`选择${attraction.name}`, { exact: true }).click();
      assert.ok((await page.getByLabel('城市行程选择篮').innerText()).includes('已选 2 项'));
      await page.locator('.ch-generate').click();
      await page.waitForFunction(({ cityId, ids }) => {
        const plan = JSON.parse(localStorage.getItem('tusuan-current'));
        const stop = plan?.stops.find(item => item.cityId === cityId);
        return stop && ids.every(id => stop.attractionIds.includes(id));
      }, { cityId: id, ids: chosen.map(item => item.id) });
      const plan = await currentPlan();
      const stop = plan.stops.find(item => item.cityId === id);
      assert.deepEqual([...stop.attractionIds].sort(), chosen.map(item => item.id).sort());
      const response = await fetch(`${target}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
      const result = await response.json();
      assert.equal(response.status, 200, JSON.stringify(result));
      assert.ok(Number.isFinite(result.total) && result.total > 0, 'Finite positive itinerary budget');
      const planned = new Set(result.itinerary.flatMap(day => day.items).map(item => item.attractionId).filter(Boolean));
      for (const item of chosen) assert.ok(planned.has(item.id), `Selected attraction absent from timeline: ${item.id}`);
      for (const day of result.itinerary) assert.ok(day.activeMinutes <= 720, `Overloaded day: ${day.activeMinutes} minutes`);
      await page.reload({ waitUntil: 'networkidle' });
      assert.deepEqual((await currentPlan()).stops.find(item => item.cityId === id).attractionIds.sort(), stop.attractionIds.sort());
      await screenshot(`${id}-generated`);
      return { days: stop.days, selected: stop.attractionIds, currency: plan.currency, total: result.total };
    });
    await check(`${id}: selected attraction pictures load as real images`, async () => {
      const city = catalog.cities.find(item => item.id === id);
      await openHome(id);
      const images = [];
      for (const attraction of city.attractions.slice(0, 2)) {
        const card = page.locator('.ch-card').filter({ has: page.getByLabel(`查看${attraction.name}详情`, { exact: true }) });
        const image = await loadedImage(card, attraction.name);
        assert.equal(image.alt, attraction.name, 'A city reference picture does not count as a photograph of this attraction');
        images.push(image);
      }
      await screenshot(`${id}-sights`);
      return images;
    });
  }

  await check('390px mobile navigation indicator stays clear and exploration has no horizontal overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(target, { waitUntil: 'networkidle' });
    await page.getByLabel('展开导航', { exact: true }).click();
    const navigation = await underlineClear();
    await noOverflow();
    await screenshot('mobile-navigation');
    await page.getByRole('navigation', { name: '主导航' }).getByRole('button', { name: '探索目的地', exact: true }).click();
    await page.getByLabel('筛选国家或地区').selectOption({ label: '冰岛' });
    assert.equal(await page.locator('.explore-card').count(), 3);
    const viewport = await noOverflow();
    await screenshot('explore-mobile');
    return { navigation, viewport };
  });

  for (const id of ['reykjavik', 'maafushi']) {
    await check(`${id}: 390px homepage and selection basket fit without a competing budget bar`, async () => {
      await openHome(id);
      await noOverflow();
      assert.equal(await page.locator('.mobile-budget-bar').count(), 0);
      await screenshot(`${id}-mobile`);
      await page.getByLabel('查看选择并生成行程').click();
      await page.getByLabel('城市行程选择篮').scrollIntoViewIfNeeded();
      const viewport = await noOverflow();
      await screenshot(`${id}-mobile-basket`);
      assert.ok(await page.locator('.ch-generate').isVisible());
      return viewport;
    });
  }

  // Separate one-adult projects make the price and local time regressions
  // independent from earlier destination selections and their party sizes.
  async function withRegressionCity(cityId, run) {
    const testContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'zh-CN' });
    const singleAdult = { ...seed, travelers: 1, stops: [{ cityId, days: 1, attractionIds: [], dayPlans: [[]] }] };
    await testContext.addInitScript(plan => {
      if (!localStorage.getItem('tusuan-current')) localStorage.setItem('tusuan-current', JSON.stringify(plan));
    }, singleAdult);
    const testPage = await testContext.newPage();
    testPage.setDefaultTimeout(20000);
    testPage.on('pageerror', error => report.pageErrors.push(error.message));
    try {
      await testPage.goto(`${target}/#/city/${cityId}`, { waitUntil: 'networkidle' });
      await testPage.getByLabel('城市行程选择篮').waitFor();
      return await run(testPage);
    } finally {
      await testContext.close();
    }
  }

  await check('regression: Angkor Wat and Bayon share one day pass in the basket subtotal', async () => withRegressionCity('siem-reap', async testPage => {
    await testPage.getByLabel('显示币种').selectOption('USD');
    await testPage.waitForFunction(() => JSON.parse(localStorage.getItem('tusuan-current')).currency === 'USD');
    assert.equal(await testPage.getByLabel('城市停留天数').inputValue(), '1');
    await testPage.getByLabel('选择吴哥窟', { exact: true }).click();
    await testPage.getByLabel('选择巴戎寺', { exact: true }).click();
    const basket = testPage.getByLabel('城市行程选择篮');
    assert.ok((await basket.innerText()).includes('已选 2 项'));
    const text = await testPage.locator('.ch-basket-total > strong').innerText();
    const numbers = (text.replaceAll(',', '').match(/\d+(?:\.\d+)?/g) || []).map(Number);
    assert.deepEqual(numbers, [35, 45], `One adult, same-day shared pass should be USD 35–45, not doubled: ${text}`);
    assert.ok((await testPage.locator('.ch-basket-total').innerText()).includes('USD'));
    await basket.scrollIntoViewIfNeeded();
    await screenshot('siem-reap-shared-pass', testPage);
    return { adults: 1, days: 1, selectedSights: 2, currency: 'USD', subtotal: text };
  }));

  await check('regression: selecting only Shilin night market schedules its visit at or after 17:00', async () => withRegressionCity('taipei', async testPage => {
    await testPage.getByLabel('选择士林夜市', { exact: true }).click();
    await testPage.locator('.ch-generate').click();
    await testPage.waitForFunction(() => {
      const stop = JSON.parse(localStorage.getItem('tusuan-current')).stops.find(item => item.cityId === 'taipei');
      return stop?.attractionIds.length === 1 && stop.attractionIds[0] === 'taipei-shilin';
    });
    const plan = await testPage.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
    const response = await fetch(`${target}/api/plan`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(plan) });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    const market = result.itinerary.flatMap(day => day.items).find(item => item.attractionId === 'taipei-shilin');
    assert.ok(market, 'The selected night market should remain in the itinerary');
    assert.ok(market.startMinute >= 17 * 60 && market.startMinute < 24 * 60, `Night market incorrectly starts at ${market.time}`);
    await testPage.getByRole('tab', { name: /每日行程/ }).click();
    await testPage.getByRole('heading', { name: '士林夜市', exact: true }).first().scrollIntoViewIfNeeded();
    await screenshot('taipei-night-market', testPage);
    return { selected: ['taipei-shilin'], startTime: market.time, endTime: market.endTime, startMinute: market.startMinute, days: plan.stops[0].days };
  }));

  await check('browser completes all flows without uncaught page errors', async () => {
    assert.deepEqual(report.pageErrors, []);
    return { count: 0 };
  });
} finally {
  await browser.close();
  report.summary = {
    passed: report.checks.filter(item => item.passed).length,
    failed: report.checks.filter(item => !item.passed).length,
    pageErrors: report.pageErrors.length,
    imageFailures: report.imageFailures.length,
  };
  await writeFile(`${output}/${regressionsOnly ? 'global-regressions-report' : 'global-report'}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary));
}
if (report.checks.some(item => !item.passed) || report.pageErrors.length) process.exitCode = 1;
