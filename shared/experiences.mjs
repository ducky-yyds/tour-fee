import { experienceIsPending } from './experience-discovery.mjs';
/** Concrete places selected by the traveler; prices retain the catalog's provenance. */
export const MEAL_WEIGHTS = { breakfast: 0.2, lunch: 0.4, dinner: 0.4 };
export function experienceSelectionKey(selection) {
  return `${selection.experienceId}:${selection.dayIndex ?? 0}:${selection.mealType || 'activity'}`;
}
export function experienceLineId(stopIndex, selection, kind) {
  return kind === 'hotel' ? `stop-${stopIndex}-lodging` : `stop-${stopIndex}-experience-${selection.dayIndex ?? 0}-${selection.mealType || 'activity'}-${selection.experienceId}`;
}
export function resolveExperienceSelections(stop, city, { clampDays = false, travelers } = {}) {
  const entries = stop.experienceSelections ?? [];
  if (!Array.isArray(entries) || entries.length > 1000) throw new Error('所选餐厅、酒店与体验列表无效');
  const days = Number(stop.days);
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('停留天数应为 1–365 的整数');
  const seen = new Set(), meals = new Set();
  let hotelSeen = false;
  return entries.map(entry => {
    if (!entry || typeof entry !== 'object') throw new Error('具体体验选择格式无效');
    const experience = city.experiences?.find(e => e.id === entry.experienceId);
    if (!experience || !['hotel', 'restaurant', 'experience'].includes(experience.kind)) throw new Error(`${city.name}的具体体验 ${entry.experienceId || ''} 无效`);
    const option = experience.priceOptions?.find(p => p.id === entry.optionId);
    if (!option) throw new Error(`${experience.name}的价格方案无效`);
    if (![option.low, option.high].every(n => Number.isFinite(n) && n >= 0 && n <= 1e9) || option.high < option.low || !/^[A-Z]{3}$/.test(option.currency || '')) throw new Error(`${experience.name}的价格区间或币种无效`);
    if (experience.kind === 'hotel' ? option.unit !== 'room-night' : !['person', 'booking'].includes(option.unit)) throw new Error(`${experience.name}的计费单位无效`);
    if (option.unit === 'booking' && (!Number.isInteger(option.partyCapacity) || option.partyCapacity < 1 || option.partyCapacity > 100)) throw new Error(`${experience.name}的每单人数上限无效`);
    const rawDay = entry.dayIndex ?? 0;
    if (!Number.isInteger(rawDay) || rawDay < 0 || rawDay > 364) throw new Error('具体体验安排日期无效');
    const dayIndex = experience.kind === 'hotel' ? 0 : clampDays ? Math.min(days - 1, rawDay) : rawDay;
    if (dayIndex >= days) throw new Error('具体体验安排日期超出停留天数');
    const selection = { experienceId: experience.id, optionId: option.id, dayIndex };
    if (experience.kind === 'restaurant') {
      selection.mealType = entry.mealType || option.mealTypes?.[0] || experience.mealType || 'dinner';
      if (!['breakfast', 'lunch', 'dinner'].includes(selection.mealType)) throw new Error('请选择早餐、午餐或晚餐餐次');
      if (option.mealTypes && (!Array.isArray(option.mealTypes) || !option.mealTypes.includes(selection.mealType))) throw new Error(`${experience.name} / ${option.name}不适用于所选餐次，请选择供应商允许的午餐或晚餐时段。`);
      const meal = `${dayIndex}:${selection.mealType}`;
      if (meals.has(meal)) throw new Error('同一天同一餐次只能选择一家餐厅');
      meals.add(meal);
    }
    if (experience.kind === 'hotel') {
      if (hotelSeen) throw new Error('每个城市停留阶段只能选择一家酒店');
      hotelSeen = true;
    }
    if (['needs-more-days', 'needs-date-check'].includes(entry.scheduleStatus) && experience.kind === 'experience') selection.scheduleStatus = entry.scheduleStatus;
    if (entry.confirmedDate && /^\d{4}-\d{2}-\d{2}$/.test(entry.confirmedDate)) selection.confirmedDate = entry.confirmedDate;
    const key = experienceSelectionKey(selection);
    if (seen.has(key)) throw new Error('具体体验选择不能重复');
    seen.add(key);
    const duration = option.durationMinutes ?? experience.durationMinutes ?? (experience.kind === 'restaurant' ? 60 : 120);
    if (!Number.isInteger(duration) || duration < (experience.kind === 'hotel' ? 0 : 15) || duration > 720) throw new Error(`${experience.name}的活动时长无效`);
    const preferredStartTime = option.preferredStartTime || experience.preferredStartTime;
    if (preferredStartTime && (!/^\d{2}:\d{2}$/.test(preferredStartTime) || Number(preferredStartTime.slice(0, 2)) > 23 || Number(preferredStartTime.slice(3)) > 59)) throw new Error(`${experience.name}的建议时段无效`);
    const includedMeals = option.includedMeals ?? experience.includedMeals ?? [];
    if (!Array.isArray(includedMeals) || includedMeals.some(meal => !Object.hasOwn(MEAL_WEIGHTS, meal))) throw new Error(`${experience.name}的含餐说明无效`);
    const row = { selection, experience, option, key, durationMinutes: duration, preferredStartTime, includedMeals: [...new Set(includedMeals)], includesTransfers: option.includesTransfers ?? experience.includesTransfers ?? false };
    if (travelers !== undefined) validateExperienceParty(row, travelers);
    return row;
  });
}
export function validateExperienceParty({ experience, option }, travelers) {
  const min = option.minParticipants ?? experience.minParticipants;
  const max = option.maxParticipants ?? experience.maxParticipants;
  if (min !== undefined && travelers < min) throw new Error(`${experience.name} / ${option.name}至少需要 ${min} 人，当前 ${travelers} 人；请选择其他方案或向供应商询价。`);
  if (max !== undefined && travelers > max) throw new Error(`${experience.name} / ${option.name}仅适用于最多 ${max} 人，当前 ${travelers} 人；更多人数请向供应商重新询价。`);
}
export function coveredMealSlots(rows, dayIndex) {
  const slots = new Set();
  for (const row of rows) {
    if (row.selection.dayIndex !== dayIndex || experienceIsPending(row)) continue;
    if (row.experience.kind === 'restaurant') slots.add(row.selection.mealType);
    if (row.experience.kind === 'experience') row.includedMeals.forEach(meal => slots.add(meal));
  }
  return slots;
}

/** Selecting a new hotel or meal option replaces the same slot atomically. */
export function applyExperienceSelection(stop, city, entry) {
  const [next] = resolveExperienceSelections({ ...stop, experienceSelections: [entry] }, city);
  const previous = resolveExperienceSelections(stop, city);
  const retained = previous.filter(row => next.experience.kind === 'hotel'
    ? row.experience.kind !== 'hotel'
    : next.experience.kind === 'restaurant'
      ? !(row.experience.kind === 'restaurant' && row.selection.dayIndex === next.selection.dayIndex && row.selection.mealType === next.selection.mealType)
      : row.key !== next.key);
  return { ...stop, experienceSelections: [...retained.map(r => r.selection), next.selection] };
}
export function removeExperienceSelection(stop, city, key) {
  return { ...stop, experienceSelections: resolveExperienceSelections(stop, city).filter(row => row.key !== key).map(row => row.selection) };
}
export function experiencePriceValues(option) {
  return [option.low, (option.low + option.high) / 2, option.high];
}
export function experiencePriceNote(experience, option) {
  return [option.description, option.note, option.includes?.length ? `包含：${option.includes.join('、')}。` : '', option.excludes?.length ? `不含：${option.excludes.join('、')}。` : '', experience.requirements?.length ? `条件：${experience.requirements.join('、')}。` : '', experience.availabilityNote, '按所选方案做预算；未查询所选日期库存，最终金额及可用时段以预订页面为准。'].filter(Boolean).join(' ');
}
