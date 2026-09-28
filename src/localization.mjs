import core, { patterns as corePatterns } from './locales/en-core.mjs';
import pages, { patterns as pagePatterns } from './locales/en-pages.mjs';
import extra, { patterns as extraPatterns } from './locales/en-extra.mjs';
import { CURRENCIES } from '../shared/currencies.mjs';

export const LANGUAGE_KEY = 'tusuan-language';
const normalize = value => value.replace(/\s+/g, ' ').trim();
const chinese = /[\u3400-\u9fff]/u;
const english = { ...pages, ...core, ...extra };
const patterns = [...extraPatterns, ...corePatterns, ...pagePatterns];
const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });
for (const [code, name] of Object.entries(CURRENCIES)) english[name] = currencyNames.of(code);
const names = new Map(), translated = new Map();
let nameExpression;
let currentLocale = 'zh';
const listeners = new Set();
function readInitialLocale() {
  try {
    const requested = new URL(globalThis.location.href).searchParams.get('lang');
    if (requested === 'en' || requested === 'zh') return requested;
    const stored = JSON.parse(globalThis.localStorage.getItem(LANGUAGE_KEY));
    return stored === 'en' ? 'en' : 'zh';
  } catch { return 'zh'; }
}
currentLocale = readInitialLocale();
export const getLocale = () => currentLocale;
export const intlLocale = () => currentLocale === 'en' ? 'en-US' : 'zh-CN';
export const subscribeLocale = callback => { listeners.add(callback); return () => listeners.delete(callback); };
export function setLocale(value, { updateUrl = true, persist = true } = {}) {
  if (!['zh', 'en'].includes(value)) return;
  currentLocale = value;
  if (persist) try { globalThis.localStorage.setItem(LANGUAGE_KEY, JSON.stringify(value)); } catch { /* Current session remains usable without storage. */ }
  if (updateUrl && globalThis.location) {
    const url = new URL(globalThis.location.href);
    url.searchParams.set('lang', value);
    globalThis.history.replaceState(globalThis.history.state, '', url);
  }
  for (const listener of listeners) listener();
}
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => setLocale(readInitialLocale(), { updateUrl: false }));
  window.addEventListener('storage', event => {
    if (event.key === LANGUAGE_KEY) {
      try { setLocale(JSON.parse(event.newValue) === 'en' ? 'en' : 'zh', { persist: false }); } catch {}
    }
  });
}

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
/** Names are display aliases only. IDs, prices, descriptions and saved plans stay unchanged. */
export function registerCatalogNames(catalog) {
  let changed = false;
  const add = (source, target) => {
    if (typeof source !== 'string' || typeof target !== 'string' || !chinese.test(source) || chinese.test(target) || !target.trim()) return;
    const key = normalize(source);
    if (names.get(key) !== target) { names.set(key, target); changed = true; }
  };
  const visit = item => {
    if (!item) return;
    add(item.name, item.nameEn);
    add(item.title, item.titleEn);
    add(item.tagline, item.taglineEn);
    add(item.description, item.descriptionEn);
    if (item.countryCode && item.country) {
      try { add(item.country, item.countryEn || regionNames.of(item.countryCode)); } catch {}
    }
    for (const key of ['attractions', 'experiences', 'localFoods', 'priceOptions']) for (const child of item[key] || []) visit(child);
  };
  for (const city of Array.isArray(catalog) ? catalog : catalog?.cities || []) visit(city);
  if (changed) { nameExpression = null; translated.clear(); }
}
function replaceNames(text) {
  if (!names.size || !chinese.test(text)) return text;
  nameExpression ||= new RegExp([...names.keys()].sort((a,b) => b.length - a.length).map(escapeRegex).join('|'), 'gu');
  return text.replace(nameExpression, value => names.get(value));
}
export function translate(value, locale = currentLocale) {
  if (locale !== 'en' || typeof value !== 'string' || !chinese.test(value)) return value;
  const key = normalize(value);
  if (!key) return value;
  let result = translated.get(key);
  if (result === undefined) {
    result = english[key] ?? names.get(key);
    if (result === undefined) {
      for (const [pattern, replacement] of patterns) {
        pattern.lastIndex = 0;
        const match = key.match(pattern);
        if (match) { result = typeof replacement === 'function' ? replacement(...match) : key.replace(pattern, replacement); break; }
      }
    }
    if (result === undefined) {
      const segments = key.split(/(\s+[·/→|]\s+|\n)/u);
      if (segments.length > 1) result = segments.map(segment => english[segment] ?? names.get(segment) ?? segment).join('');
      else result = key;
    }
    // Only localize known terms inside translated interface messages. Untranslated
    // editorial descriptions keep their original wording rather than mixed prose.
    if (result !== key) {
      const reason = key.match(/^(?:导出失败|工作区导入失败|导入失败|工作区未能保存，已恢复原有资料)：(.+)$/u)?.[1];
      if (reason) result = result.replace(reason, translate(reason, locale));
      result = result.replace(/[\u3400-\u9fff]+/gu, part => english[part] ?? part);
      result = replaceNames(result);
    }
    translated.set(key, result);
  }
  return (value.match(/^\s*/)?.[0] || '') + result + (value.match(/\s*$/)?.[0] || '');
}
export function translateTreeText(value, locale) {
  if (locale !== 'en' || !Array.isArray(value)) return translate(value, locale);
  const output = [...value], run = [];
  const flush = () => {
    if (!run.length) return;
    const combined = run.map(index => value[index]).join(''), localized = translate(combined, locale);
    output[run[0]] = localized !== combined ? localized : run.map(index => translate(value[index], locale)).join('');
    for (const index of run.slice(1)) output[index] = null;
    run.length = 0;
  };
  for (let index = 0; index < value.length; index++) {
    const child = value[index];
    if (typeof child === 'string' || typeof child === 'number') run.push(index);
    else { flush(); if (Array.isArray(child)) output[index] = translateTreeText(child, locale); }
  }
  flush();
  return output;
}
