import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const target = process.env.UI_TEST_URL || "http://127.0.0.1:8787";
const output = path.resolve("artifacts/qa");
await mkdir(output, { recursive: true });
const report = { target, checkedAt: new Date().toISOString(), checks: [], pageErrors: [], requestErrors: [], screenshots: [] };
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const context = await browser.newContext({ viewport: { width: 1440, height: 1050 }, locale: "zh-CN" });
const page = await context.newPage();
const catalog = await (await context.request.get(`${target}/api/catalog`)).json();
const detailed = catalog.cities.filter(city => city.coverage !== "airport-only" && (city.attractions?.length || city.experiences?.length || Object.values(city.daily || {}).some(v => Array.isArray(v) && v.some(n => Number(n) > 0))));
const detailedIds = new Set(detailed.map(city => city.id));
const detailedNames = new Set(detailed.map(city => city.name));
const airport = catalog.airportCities.find(city => city.iata === "AUH" || city.airportCodes?.includes("AUH"));
assert(airport, "AUH airport location must be present in the catalog");

function monitor(p, name) {
  p.setDefaultTimeout(15000);
  p.on("pageerror", error => report.pageErrors.push({ page: name, error: error.message }));
  p.on("response", response => { if (response.status() >= 400 && response.url().startsWith(target)) report.requestErrors.push({ page: name, status: response.status(), url: response.url() }); });
  p.on("requestfailed", request => { if (request.url().startsWith(target) && request.failure()?.errorText !== "net::ERR_ABORTED") report.requestErrors.push({ page: name, url: request.url(), error: request.failure()?.errorText }); });
}
monitor(page, "main");
const storage = (p, key) => p.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
const current = () => storage(page, "tusuan-current");
async function waitPlan(predicate, expected) {
  await page.waitForFunction(({ key, expected }) => JSON.stringify(key.reduce((item, part) => item?.[part], JSON.parse(localStorage.getItem("tusuan-current")))) === JSON.stringify(expected), { key: predicate, expected });
}
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
}
async function snapshot(p, name) {
  const file = path.join(output, `${name}.png`);
  await p.screenshot({ path: file, fullPage: true });
  report.screenshots.push(file);
}
async function navigate(p, hash) {
  await p.evaluate(hash => { window.location.hash = hash; }, hash);
  await p.locator(hash === "/globe" ? ".gl-page" : ".trip-controls").waitFor();
}
async function waitPhoto(p) {
  await p.waitForFunction(() => {
    const img = document.querySelector(".hc-photo.is-active");
    return img?.complete && img.naturalWidth > 0;
  });
}
async function noOverflow(p) {
  const sizes = await p.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert(sizes.document <= sizes.viewport + 1 && sizes.body <= sizes.viewport + 1, JSON.stringify(sizes));
  return sizes;
}
async function headerFits(p) {
  const boxes = await p.locator(".site-header").evaluate(header => [".brand", ".main-nav", ".header-right"].map(selector => header.querySelector(selector)).filter(el => el && getComputedStyle(el).display !== "none").map(el => ({ name: el.className, left: el.getBoundingClientRect().left, right: el.getBoundingClientRect().right })).sort((a, b) => a.left - b.left));
  for (let i = 1; i < boxes.length; i++) assert(boxes[i - 1].right <= boxes[i].left + 1, `Header overlap: ${JSON.stringify(boxes)}`);
  return boxes;
}
async function globeLabelsFit(p) {
  const result = await p.locator(".eg-city-label").evaluateAll(labels => {
    const boxes = labels.map(el => ({ id: el.dataset.cityId, font: parseFloat(getComputedStyle(el).fontSize), x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
    const overlap = [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x + a.width > b.x + 1 && b.x + b.width > a.x + 1 && a.y + a.height > b.y + 1 && b.y + b.height > a.y + 1) overlap.push([a.id, b.id]);
    }
    return { fonts: boxes.map(box => box.font), overlap };
  });
  assert(result.fonts.length > 0, "Globe should show default city names");
  assert(result.fonts.every(font => font >= 12), JSON.stringify(result.fonts));
  assert.deepEqual(result.overlap, []);
  return { visibleLabels: result.fonts.length, minimumFont: Math.min(...result.fonts) };
}
async function heroControlsFit(p) {
  const result = await p.evaluate(() => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
    const fonts = [...document.querySelectorAll(".hc-credit")].map(el => parseFloat(getComputedStyle(el).fontSize));
    return { dots: box(".hc-dots"), credit: box(".hc-caption"), copy: box(".hero-content"), hero: box(".hero"), fonts };
  });
  assert(result.dots.top >= result.copy.bottom + 2, JSON.stringify(result));
  assert(result.credit.top >= result.copy.bottom + 2, JSON.stringify(result));
  assert(result.credit.bottom <= result.dots.top - 2, JSON.stringify(result));
  assert(result.dots.bottom <= result.hero.bottom - 25, JSON.stringify(result));
  assert(Math.abs((result.dots.left + result.dots.right) - (result.hero.left + result.hero.right)) < 2, JSON.stringify(result));
  assert(result.fonts.every(font => font >= 12), JSON.stringify(result.fonts));
  return result;
}

try {
  await check("globe defaults to cities with travel data across labels, search, and counts", async () => {
    await page.goto(`${target}/#/globe`, { waitUntil: "networkidle" });
    const toggle = page.getByRole("switch", { name: "显示全部城市", exact: true });
    assert.equal(await toggle.isChecked(), false);
    const count = Number((await page.locator(".gl-catalog-stat strong").first().textContent()).replaceAll(",", ""));
    assert.equal(count, detailed.length);
    const names = await page.locator(".eg-city-label").evaluateAll(nodes => nodes.map(node => node.dataset.cityId));
    assert(names.every(id => detailedIds.has(id)), JSON.stringify(names));
    await page.locator("#gl-city-search").fill("AUH");
    assert.equal(await page.locator(".gl-city-results > button").count(), 0);
    return { detailedCities: count, countries: await page.locator(".gl-catalog-stat strong").nth(1).textContent() };
  });
  await check("all cities switch finds AUH and switching back restores a travel city without changing a trip", async () => {
    const before = await current();
    const toggle = page.getByRole("switch", { name: "显示全部城市", exact: true });
    await toggle.check();
    await page.locator("#gl-city-search").fill("AUH");
    await page.locator(".gl-city-results > button").filter({ hasText: airport.name }).first().click();
    assert.equal((await page.locator(".gl-city-body h2").textContent()).trim(), airport.name);
    assert.match(await page.locator(".gl-budget").textContent(), /待补充/);
    await toggle.uncheck();
    assert(detailedNames.has((await page.locator(".gl-city-body h2").textContent()).trim()));
    assert.equal(Number((await page.locator(".gl-catalog-stat strong").first().textContent()).replaceAll(",", "")), detailed.length);
    assert.deepEqual(await current(), before);
  });
  await check("airport project routes and saved footprints survive the travel-data filter", async () => {
    const workspace = await storage(page, "tusuan-projects");
    const base = workspace.projects[0];
    const record = { ...base, id: "qa-airport-context", name: "QA 机场情境节点", plan: { ...base.plan, originId: airport.id, stops: [{ cityId: "beijing", days: 5, attractionIds: [] }] } };
    workspace.projects.push(record);
    await page.evaluate(({ workspace, airportId }) => {
      localStorage.setItem("tusuan-projects", JSON.stringify(workspace));
      localStorage.setItem("tusuan-passport-v1", JSON.stringify({ version: 1, visits: [{ cityId: airportId, visitedOn: "", note: "QA 机场足迹" }] }));
    }, { workspace, airportId: airport.id });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".gl-modes").getByRole("button", { name: "项目路线", exact: true }).click();
    await page.getByLabel("显示哪个旅行项目", { exact: true }).selectOption(record.id);
    assert.match(await page.locator(".gl-context-note").textContent(), /另展示 1/);
    assert(await page.locator(`[data-testid="globe-route-leg"][data-from="${airport.id}"]`).count() > 0);
    await page.locator(".gl-modes").getByRole("button", { name: "我的足迹", exact: true }).click();
    assert.match(await page.locator(".gl-context-note").textContent(), /已有足迹/);
    assert.equal((await storage(page, "tusuan-passport-v1")).visits[0].cityId, airport.id);
    assert.equal((await storage(page, "tusuan-projects")).projects.find(project => project.id === record.id).plan.originId, airport.id);
  });
  await check("new project defaults follow Beijing 5, Vik 2, and Male 1 days", async () => {
    await navigate(page, "/planner");
    await page.locator(".project-bar").getByRole("button", { name: "新建项目", exact: true }).click();
    assert.equal(await page.getByLabel("新项目目的地", { exact: true }).inputValue(), "beijing");
    assert.equal(await page.getByLabel("新项目天数", { exact: true }).inputValue(), "5");
    const values = [];
    for (const [cityId, days] of [["vik", 2], ["male", 1]]) {
      await page.getByLabel("搜索新项目目的地", { exact: true }).fill(cityId === "vik" ? "Vik" : "Male");
      await page.getByLabel("新项目目的地", { exact: true }).selectOption(cityId);
      const actual = await page.getByLabel("新项目天数", { exact: true }).inputValue();
      assert.equal(actual, String(days));
      values.push({ cityId, days: Number(actual) });
    }
    await page.getByLabel("新项目天数", { exact: true }).fill("4");
    await page.getByLabel("项目名称", { exact: true }).fill("QA 手动天数保留");
    assert.equal(await page.getByLabel("新项目天数", { exact: true }).inputValue(), "4");
    await page.getByRole("button", { name: "创建旅行项目", exact: true }).click();
    await waitPlan(["stops", 0, "days"], 4);
    await waitPlan(["stops", 0, "cityId"], "male");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await current()).stops[0].days, 4);
    await navigate(page, "/globe"); await navigate(page, "/planner");
    assert.equal((await current()).stops[0].days, 4);
    return values;
  });
  await check("unboxed centered carousel dots and keyboard update the photo and source caption", async () => {
    await page.locator(".project-bar").getByRole("button", { name: "新建项目", exact: true }).click();
    await page.getByLabel("项目名称", { exact: true }).fill("QA 北京轮播图");
    await page.getByRole("button", { name: "创建旅行项目", exact: true }).click();
    await waitPlan(["stops", 0, "cityId"], "beijing");
    const carousel = page.getByTestId("hero-carousel");
    assert(Number(await carousel.getAttribute("data-count")) >= 3);
    assert.equal(await page.locator(".hc-controls,.hc-play,.hc-count,.hc-toolbar").count(), 0);
    await page.locator(".hc-dots button").first().focus();
    assert.equal(await carousel.getAttribute("data-playing"), "false");
    await waitPhoto(page);
    const firstSource = await page.locator(".hc-photo.is-active").getAttribute("src"), firstCaption = await page.locator(".hc-title").textContent();
    await page.locator(".hc-dots button").nth(1).click();
    await waitPhoto(page);
    assert.equal(await carousel.getAttribute("data-index"), "1");
    assert.notEqual(await page.locator(".hc-photo.is-active").getAttribute("src"), firstSource);
    assert.notEqual(await page.locator(".hc-title").textContent(), firstCaption);
    assert.match(await page.locator(".hc-credit").getAttribute("href"), /^https?:\/\//);
    await page.locator(".hc-dots button").nth(0).click();
    assert.equal(await carousel.getAttribute("data-index"), "0");
    await page.locator(".hc-dots button").nth(2).click();
    assert.equal(await carousel.getAttribute("data-index"), "2");
    await page.locator(".hc-dots button").nth(2).press("ArrowLeft");
    assert.equal(await carousel.getAttribute("data-index"), "1");
    return { count: await carousel.getAttribute("data-count"), firstCaption, secondCaption: await page.locator(".hc-title").textContent() };
  });
  await check("carousel advances automatically and pauses while the hero is hovered", async () => {
    const carousel = page.getByTestId("hero-carousel");
    await page.evaluate(() => document.activeElement?.blur());
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => document.querySelector('[data-testid="hero-carousel"]').dataset.playing === "true");
    const before = await carousel.getAttribute("data-index");
    await page.waitForFunction(index => document.querySelector('[data-testid="hero-carousel"]').dataset.index !== index, before, { timeout: 8500 });
    await page.locator(".hero-content h1").hover();
    const held = await carousel.getAttribute("data-index");
    assert.equal(await carousel.getAttribute("data-playing"), "false");
    await page.waitForTimeout(6750);
    assert.equal(await carousel.getAttribute("data-index"), held);
  });
  await check("transport details start collapsed while routes and conflicts stay visible and settings persist", async () => {
    const toggle = page.getByTestId("journey-details-toggle");
    const arrival = page.locator("#jt-arrival-0");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await arrival.isVisible(), false);
    assert.equal(await page.getByTestId("journey-leg").first().isVisible(), true);
    assert.equal(await page.getByTestId("journey-window-summary").first().isVisible(), true);
    await toggle.click();
    await arrival.fill("22:30");
    await page.locator("#jt-offset-0").selectOption("8");
    await waitPlan(["stops", 0, "transportWindow", "arrivalDayOffset"], 8);
    await toggle.click();
    assert.equal(await arrival.isVisible(), false);
    await page.locator(".jt-warning").first().waitFor();
    const warning = await page.locator(".jt-warning").first().textContent();
    assert.match(warning, /不足|之外|重叠/);
    assert.equal((await current()).stops[0].transportWindow.arrivalReadyTime, "22:30");
    await toggle.click();
    assert.equal(await arrival.inputValue(), "22:30");
    await page.getByRole("button", { name: "恢复北京自动交通预留", exact: true }).click();
    await toggle.click();
    return { warning };
  });
  await check("itinerary supplemental settings preserve edited start times when collapsed", async () => {
    await page.getByRole("tab", { name: /每日行程/ }).click();
    await page.getByRole("button", { name: "调配景点", exact: true }).click();
    const toggle = page.getByTestId("itinerary-details-toggle");
    const start = page.getByLabel("每天出发时间", { exact: true });
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await start.isVisible(), false);
    assert.equal(await page.getByRole("button", { name: "智能重排行程", exact: true }).isVisible(), true);
    await toggle.click();
    await start.fill("09:30");
    await waitPlan(["stops", 0, "startTime"], "09:30");
    const assignments = (await current()).stops[0].dayPlans;
    await toggle.click();
    assert.equal(await start.isVisible(), false);
    assert.equal((await current()).stops[0].startTime, "09:30");
    assert.deepEqual((await current()).stops[0].dayPlans, assignments);
    await toggle.click();
    assert.equal(await start.inputValue(), "09:30");
    await toggle.click();
    return { startTime: (await current()).stops[0].startTime };
  });
  for (const width of [360, 390, 768, 900, 1024, 1440]) {
    await check(`${width}px hero and globe have readable labels and no overlap or overflow`, async () => {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1050 });
      await navigate(page, "/planner");
      await page.locator(".hero").scrollIntoViewIfNeeded();
      const hero = await heroControlsFit(page), heroWidth = await noOverflow(page), header = await headerFits(page);
      if (width === 390 || width === 1440) await snapshot(page, `trip-polish-hero-${width}`);
      await navigate(page, "/globe");
      await page.locator(".gl-modes").getByRole("button", { name: "探索目的地", exact: true }).click();
      await page.waitForTimeout(650);
      const globe = await globeLabelsFit(page), globeWidth = await noOverflow(page);
      if (width === 390 || width === 1440) await snapshot(page, `trip-polish-globe-${width}`);
      return { hero, heroWidth, globe, globeWidth, header };
    });
  }
  await check("reduced-motion starts paused while manual carousel navigation remains available", async () => {
    const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", locale: "zh-CN" });
    const p = await reduced.newPage(); monitor(p, "reduced-motion");
    try {
      await p.goto(`${target}/#/planner`, { waitUntil: "networkidle" });
      const carousel = p.getByTestId("hero-carousel");
      assert.equal(await carousel.getAttribute("data-playing"), "false");
      assert.equal(await carousel.getAttribute("data-paused"), "true");
      await p.mouse.move(0, 0);
      await p.waitForTimeout(6750);
      assert.equal(await carousel.getAttribute("data-index"), "0");
      await p.locator(".hc-dots button").nth(1).click();
      assert.equal(await carousel.getAttribute("data-index"), "1");
      await waitPhoto(p);
    } finally { await reduced.close(); }
  });
} finally {
  await browser.close();
  await writeFile(path.join(output, "trip-polish-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ checks: report.checks.length, failed: report.checks.filter(check => !check.passed), pageErrors: report.pageErrors, requestErrors: report.requestErrors }, null, 2));
}
if (report.checks.some(check => !check.passed) || report.pageErrors.length || report.requestErrors.length) process.exitCode = 1;
