import { createHash } from 'node:crypto';
import { EXPERIENCE_SOURCES } from './experience-sources.mjs';
import { htmlText } from './source-html.mjs';
export { htmlText } from './source-html.mjs';
import { CURRENCIES } from '../shared/currencies.mjs';
export const FX_CURRENCIES = Object.keys(CURRENCIES).filter(c => c !== 'CNY');
export const DATA_SOURCES = [
  ...EXPERIENCE_SOURCES,
  { id: 'frankfurter', name: 'Frankfurter · 央行参考汇率', url: `https://api.frankfurter.dev/v2/rates?base=CNY&quotes=${FX_CURRENCIES.join(',')}`, kind: 'exchange-rates' },
  { id: 'tokyo-subway', name: 'Tokyo Metro · Tokyo Subway Ticket', url: 'https://www.tokyometro.jp/en/ticket/travel/index.html', kind: 'official-price' },
  { id: 'tokyo-tower', name: 'Tokyo Tower · 官方网上成人票', url: 'https://ticket.tokyotower.co.jp/en/', kind: 'official-price' },
  { id: 'eiffel-tower', name: 'Eiffel Tower · 官方门票', url: 'https://www.toureiffel.paris/en/rates-opening-times', kind: 'official-price' },
  { id: 'ichiran-shibuya', name: '一兰涩谷店 · 官方菜单', url: 'https://ichiran.com/shop/tokyo/shibuya/', kind: 'official-menu', cityId: 'tokyo', branch: '渋谷' },
  { id: 'ichiran-kyoto', name: '一兰京都河原町店 · 官方菜单', url: 'https://ichiran.com/shop/kinki/kyoto-kawaramachi/', kind: 'official-menu', cityId: 'kyoto', branch: '京都河原町' },
];
export async function fetchWithRetry(url, { attempts = 2, timeoutMs = 18000, responseType = 'text' } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { 'User-Agent': 'TusuanTravelBudget/1.0 (public price reference; low-frequency)', Accept: responseType === 'json' ? 'application/json' : 'text/html,application/xhtml+xml' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (text.length > 5_000_000) throw new Error('Response exceeds size limit');
      return responseType === 'json' ? JSON.parse(text) : text;
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) await new Promise(resolve => setTimeout(resolve, 600 * (i + 1)));
    }
  }
  throw lastError;
}
function checksum(text) { return createHash('sha256').update(text).digest('hex'); }
export function parseTokyoSubway(html) {
  const text = htmlText(html);
  const prices = {};
  for (const hours of [24, 48, 72]) {
    const regex = new RegExp(`Tokyo Subway ${hours}[-‐‑– ]hour Ticket\\s*[–—:-]?\\s*Adult\\s*:\\s*([\\d,]+)\\s*yen`, 'i');
    const match = text.match(regex);
    if (!match) throw new Error(`Cannot confidently parse adult ${hours}-hour fare; curated data retained`);
    const value = Number(match[1].replaceAll(',', ''));
    if (!Number.isFinite(value) || value < 300 || value > 10000) throw new Error('Tokyo fare validation failed');
    prices[`${hours}h`] = value;
  }
  if (!(prices['24h'] < prices['48h'] && prices['48h'] < prices['72h'])) throw new Error('Tokyo fare order validation failed');
  return { currency: 'JPY', prices, evidence: 'Adult subway ticket amounts parsed from labelled 24/48/72-hour products.', contentHash: checksum(html), scope: 'Tokyo Metro + Toei Subway; visitor eligibility applies; excludes JR and airport services' };
}
export function parseEiffel(html) {
  const text = htmlText(html);
  // Responsive official table repeats individual "Adult 23,50€" labels. Limit to standard tickets before bundles.
  const section = text.split(/Bundles Prices/i)[0];
  const matches = [...section.matchAll(/\bAdult\s+(\d{1,3}[,.]\d{2})\s*€/gi)].map(m => Number(m[1].replace(',', '.')));
  const values = [...new Set(matches)].sort((a, b) => a - b);
  if (values.length !== 4 || values[0] < 8 || values[3] > 70 || values.some(n => !Number.isFinite(n))) throw new Error('Cannot confidently parse four standard adult Eiffel fares; curated data retained');
  if (!/stairs/i.test(section) || !/summit/i.test(section) || !/Adult Rate/i.test(section)) throw new Error('Eiffel ticket context validation failed');
  return { currency: 'EUR', low: values[0], high: values[3], standardAdultFares: values, evidence: 'Four adult standard ticket products validated before the bundles section.', contentHash: checksum(html), scope: 'Standard adult tickets; stairs to second floor through summit elevator; bundles excluded' };
}
export function parseTokyoTower(html) {
  const nodes = [];
  for (const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const data = JSON.parse(script[1]);
    nodes.push(...(Array.isArray(data) ? data : data['@graph'] || [data]));
  }
  const products = ['MAIN DECK', 'TOP DECK TOUR'].map(name => {
    const p = nodes.find(n => n['@type'] === 'Product' && n.name === name);
    const price = Number(p?.offers?.price);
    if (!p || p.offers.priceCurrency !== 'JPY' || !Number.isFinite(price) || price < 500 || price > 15000) throw new Error(`Tokyo Tower ${name} offer missing or invalid`);
    return { name, price };
  });
  if (products[0].price >= products[1].price) throw new Error('Tokyo Tower ticket order validation failed');
  const visible = htmlText(html);
  if (!/Adult/i.test(visible) || !visible.includes(products[0].price.toLocaleString('en-US')) || !visible.includes(products[1].price.toLocaleString('en-US'))) throw new Error('Tokyo Tower structured and visible prices disagree');
  return { currency: 'JPY', low: products[0].price, high: products[1].price, products, evidence: 'Named adult MAIN DECK and TOP DECK TOUR web products in official JSON-LD verified against visible content.', contentHash: checksum(html), scope: 'Adult online base prices; excludes counter supplement and Diamond Tour; availability not checked' };
}
export function parseIchiran(html, source) {
  const text = htmlText(html);
  if (!text.includes(source.branch) || !text.includes('取扱いメニュー')) throw new Error('Restaurant branch/menu context missing');
  const definitions = source.cityId === 'tokyo'
    ? [{ id: 'tokyo-ichiran-ramen', pattern: '天然とんこつラーメン[（(]創業以来[）)]', min: 500, max: 3500 }, { id: 'tokyo-ichiran-egg', pattern: '半熟塩ゆでたまご', min: 50, max: 800 }]
    : [{ id: 'kyoto-ichiran-ramen', pattern: '天然とんこつラーメン[（(]創業以来[）)]', min: 500, max: 3500 }, { id: 'kyoto-ichiran-tea', pattern: '脂解美茶', min: 80, max: 1000 }];
  const items = definitions.map(d => {
    const regex = new RegExp(`${d.pattern}\\s*[（(]?\\s*([\\d,]+)\\s*円`, 'g');
    const matches = [...text.matchAll(regex)];
    const amounts = [...new Set(matches.map(m => Number(m[1].replaceAll(',', ''))))];
    if (amounts.length !== 1 || !Number.isFinite(amounts[0]) || amounts[0] < d.min || amounts[0] > d.max) throw new Error(`Menu item ${d.id} missing, ambiguous or outside validation bounds`);
    return { id: d.id, amount: amounts[0], currency: 'JPY' };
  });
  return { items, evidence: 'Branch identity and exact Japanese menu labels matched to a unique listed amount; late-night surcharges excluded.', contentHash: checksum(html), cityId: source.cityId, scope: 'Named store individual menu items, not a complete meal or city average; surcharges subject to store conditions' };
}
export function parseFx(rows) {
  if (!Array.isArray(rows)) throw new Error('Exchange API returned invalid JSON shape');
  const rates = { CNY: 1 }, dates = [];
  for (const c of FX_CURRENCIES) {
    const row = rows.find(r => r.base === 'CNY' && r.quote === c);
    if (!row || !Number.isFinite(row.rate) || row.rate <= 0 || row.rate > 100000 || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) throw new Error(`Missing or invalid exchange rate ${c}`);
    rates[c] = row.rate; dates.push(row.date);
  }
  const asOf = [...dates].sort()[0];
  const ageDays = (Date.now() - Date.parse(`${asOf}T00:00:00Z`)) / 86400000;
  if (ageDays < -2 || ageDays > 14) throw new Error(`Exchange rates date outside allowed freshness window: ${asOf}`);
  return { base: 'CNY', rates, asOf, source: 'Frankfurter · central bank reference rates', sourceUrl: 'https://frankfurter.dev/', fetchedAt: new Date().toISOString(), status: ageDays > 4 ? 'stale' : 'fresh', note: '参考中间汇率；不含银行手续费、刷卡加价与买卖价差。' };
}
