import { PROJECT_STORAGE_KEY } from './projects.mjs';
import { PASSPORT_KEY, validatePassport } from './passport.mjs';
import { LIVING_STORAGE_KEY, restoreLivingState } from './living.mjs';
import { CURRENCIES } from './currencies.mjs';
import { planCityIds } from './catalog-delivery.mjs';

export const WORKSPACE_FORMAT = 'tusuan-personal-workspace';
export const WORKSPACE_KEYS = [PROJECT_STORAGE_KEY, 'tusuan-current', 'tusuan-saved', PASSPORT_KEY, LIVING_STORAGE_KEY, 'tusuan-display-currency', 'tusuan-language'];

export function workspaceCityIds(records, plans = []) {
  const living = records[LIVING_STORAGE_KEY];
  return [...new Set([...planCityIds(plans), ...(records[PASSPORT_KEY]?.visits || []).map(visit => visit.cityId),
    living?.cityId, ...(living?.compareIds || []), ...Object.keys(living?.byCity || {})].filter(Boolean))];
}

export function exportWorkspace(storage, overrides = {}) {
  const records = {};
  for (const key of WORKSPACE_KEYS) {
    const raw = storage.getItem(key);
    if (raw !== null) records[key] = JSON.parse(raw);
  }
  return { format: WORKSPACE_FORMAT, version: 1, exportedAt: new Date().toISOString(), records: { ...records, ...overrides } };
}

export function inspectWorkspace(input) {
  if (input?.format !== WORKSPACE_FORMAT || input.version !== 1 || !input.records || Array.isArray(input.records)) throw new Error('请选择途算导出的个人工作区文件（版本 1）');
  const records = input.records, workspace = records[PROJECT_STORAGE_KEY];
  if (workspace?.version !== 1 || !Array.isArray(workspace.projects) || !workspace.projects.length || workspace.projects.length > 50) throw new Error('工作区应包含 1–50 个旅行项目');
  const seen = new Set();
  for (const project of workspace.projects) {
    if (typeof project?.id !== 'string' || !project.id || seen.has(project.id) || typeof project.name !== 'string' || !project.plan) throw new Error('工作区包含无效或重复项目');
    seen.add(project.id);
  }
  if (!seen.has(workspace.activeId)) throw new Error('当前项目编号无效');
  const legacy = records['tusuan-saved'] || [];
  if (!Array.isArray(legacy) || legacy.length > 50) throw new Error('旧版旅行备份无效');
  const current = records['tusuan-current'];
  if (!current) throw new Error('工作区缺少当前正在编辑的行程');
  const plans = [...workspace.projects.map(project => project.plan), current, ...legacy.map(record => record.plan)];
  for (const plan of plans) {
    if (!plan || typeof plan.originId !== 'string' || !Array.isArray(plan.stops) || !plan.stops.length || plan.stops.length > 8
      || plan.stops.some(stop => typeof stop?.cityId !== 'string' || !Number.isInteger(stop.days) || stop.days < 1 || stop.days > 365)
      || plan.stops.reduce((sum, stop) => sum + stop.days, 0) > 730) throw new Error('工作区包含无效的旅行安排');
  }
  const currency = records['tusuan-display-currency'];
  if (records['tusuan-language'] != null && !['zh', 'en'].includes(records['tusuan-language'])) throw new Error('界面语言无效');
  if (currency != null && !Object.hasOwn(CURRENCIES, currency)) throw new Error('显示币种无效');
  return { records, workspace, current, legacy, plans };
}

export function validateWorkspace(input, cities) {
  const parsed = inspectWorkspace(input), known = new Set(cities.map(city => city.id));
  for (const plan of parsed.plans) if (![plan.originId, ...plan.stops.map(stop => stop.cityId)].every(id => known.has(id))) throw new Error('工作区中的部分目的地尚未收录；未修改现有项目');
  const records = Object.fromEntries(WORKSPACE_KEYS.filter(key => Object.hasOwn(parsed.records, key)).map(key => [key, structuredClone(parsed.records[key])]));
  if (records[PASSPORT_KEY]) records[PASSPORT_KEY] = validatePassport(records[PASSPORT_KEY], cities);
  if (records[LIVING_STORAGE_KEY]) {
    const state = records[LIVING_STORAGE_KEY];
    if (state.version !== 1 || ![state.cityId, ...(state.compareIds || []), ...Object.keys(state.byCity || {})].every(id => known.has(id))) throw new Error('旅居偏好包含未收录的城市；未修改现有项目');
    records[LIVING_STORAGE_KEY] = restoreLivingState(state, cities);
  }
  return { ...parsed, records };
}

/** Keep all previous keys if any write fails (for example browser storage quota). */
export function restoreWorkspace(storage, records) {
  const previous = new Map(WORKSPACE_KEYS.map(key => [key, storage.getItem(key)]));
  try {
    for (const key of WORKSPACE_KEYS) {
      if (Object.hasOwn(records, key)) storage.setItem(key, JSON.stringify(records[key]));
      else storage.removeItem(key);
    }
  } catch (error) {
    for (const key of WORKSPACE_KEYS) storage.removeItem(key);
    for (const [key, value] of previous) if (value !== null) storage.setItem(key, value);
    throw new Error(`工作区未能保存，已恢复原有资料：${error.message}`);
  }
}
