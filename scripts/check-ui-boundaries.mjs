import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const url = process.env.UI_TEST_URL || 'http://127.0.0.1:8787';
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const errors = [], checks = [];
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('.trip-controls').waitFor();
  const read = () => page.evaluate(() => JSON.parse(localStorage.getItem('tusuan-current')));
  const initial = await read();
  await page.getByRole('button', { name: /同行伙伴/ }).click();
  await page.getByLabel('增加房间').click();
  assert(await page.getByLabel('增加房间').isDisabled());
  await page.getByLabel('减少成人').click();
  assert.equal((await read()).rooms, 1);
  assert.equal((await read()).travelers, 1);
  await page.getByRole('button', { name: '确定', exact: true }).click();
  checks.push('rooms stay within adult count without crashing');

  await page.getByRole('tab', { name: /费用明细/ }).click();
  await page.locator('.cost-table tbody tr').first().click();
  await page.locator('#actual-amount').fill('1234.56');
  await page.locator('dialog .check-label input').check();
  await page.getByRole('button', { name: '保存这笔费用', exact: true }).click();
  const catalog = await (await context.request.get(url+'/api/catalog')).json();
  await page.getByLabel('显示币种').selectOption('USD');
  const override = Object.values((await read()).overrides)[0];
  assert.equal(override.amount, Math.round(1234.56*catalog.rates.rates.USD*100)/100);
  assert.equal(override.confirmed, true);
  checks.push('confirmed actual quotes retain value across currency switch');

  const broken = { ...initial, travelers:1,rooms:9,departureDate:'2026-02-31',stops:[{cityId:'tokyo',days:365,attractionIds:[]},{cityId:'kyoto',days:365,attractionIds:[]},{cityId:'paris',days:365,attractionIds:[]},{cityId:'paris',days:3,attractionIds:[]}] };
  await page.evaluate(p => { localStorage.removeItem('tusuan-projects'); localStorage.setItem('tusuan-current', JSON.stringify(p)); }, broken);
  await page.reload({ waitUntil: 'networkidle' });
  const repaired = await read();
  assert.equal(repaired.rooms,1);
  assert.equal(repaired.stops.length,3);
  assert.equal(repaired.stops.reduce((sum,s)=>sum+s.days,0),730);
  assert.notEqual(repaired.departureDate,'2026-02-31');
  assert.equal(await page.locator('.error-notice').count(),0);
  checks.push('restored plans reject invalid dates and clamp total days/rooms/duplicates');

  const daytrip={...initial,originId:'tokyo',stops:[{cityId:'tokyo',days:1,attractionIds:[]}],departureDate:'2026-10-22'};
  await page.evaluate(p=>{localStorage.removeItem('tusuan-projects');localStorage.setItem('tusuan-current',JSON.stringify(p));},daytrip);
  await page.reload({waitUntil:'networkidle'});
  assert.equal(await page.getByRole('link',{name:'查看实际房价'}).count(),0);
  await page.getByRole('tab',{name:/每日行程/}).click();
  assert.equal(await page.locator('.day-card').count(),1);
  assert(await page.getByText('开始东京本地旅程',{exact:true}).isVisible());
  checks.push('one-day local trips have no invalid hotel dates or fictional flight');

  const stay={...initial,mode:'stay',stops:[{cityId:'tokyo',days:30,attractionIds:[]}],departureDate:'2026-10-22'};
  await page.evaluate(p=>{localStorage.removeItem('tusuan-projects');localStorage.setItem('tusuan-current',JSON.stringify(p));},stay);
  await page.reload({waitUntil:'networkidle'});
  const hotel=new URL(await page.getByRole('link',{name:'查看实际房价'}).getAttribute('href'));
  assert.equal(hotel.searchParams.get('checkout'),'2026-11-21');
  assert((await page.locator('.route-end').innerText()).includes('11月21日'));
  checks.push('30-night stay checkout and return dates agree');

  await page.locator('.main-nav').getByRole('button', { name: '数据来源', exact: true }).click();
  await page.locator('.source-health').waitFor();
  const dataStatus = await (await context.request.get(url + '/api/data-status')).json();
  assert(dataStatus.sources.length > 0);
  assert.equal(await page.locator('.source-health>div').count(), dataStatus.sources.length);
  const successfulSources = dataStatus.sources.filter(source => ['ok', 'success'].includes(source.status)).length;
  assert.equal(await page.locator('.source-health .badge.green').count(), successfulSources);
  assert.equal(await page.locator('.source-health .badge.warm').count(), dataStatus.sources.length - successfulSources);
  if (dataStatus.schedule?.windowsTask?.installed) assert((await page.locator('.update-facts').innerText()).includes(dataStatus.schedule.windowsTask.dailyAt));
  checks.push('source status shows successful fetch times and installed daily task');

  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(url,{waitUntil:'networkidle'});
  assert(await phone.locator('.mobile-budget-bar').isVisible());
  await phone.locator('.mobile-budget-bar button').click();
  assert.equal(await phone.getByRole('tab',{name:/费用明细/}).getAttribute('aria-selected'),'true');
  await phone.getByLabel('展开导航').click();
  await phone.locator('.mobile-saved-nav').click();
  assert(await phone.getByRole('heading',{name:'我的旅行项目'}).isVisible());
  assert(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  checks.push('mobile fixed budget and saved-trip menu work');
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/qa/boundaries.json',JSON.stringify({checkedAt:new Date().toISOString(),checks,errors},null,2));
  console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));
} finally { await browser.close(); }
