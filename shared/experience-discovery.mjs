export const EXPERIENCE_THEMES = {
  festival: '节日与庆典', marine: '潜水与海洋', wildlife: '野生动物', nature: '山川与自然',
  craft: '手艺与传统', performance: '音乐与演出', 'food-life': '饮食与日常',
  'local-life': '当地生活', literary: '文学与文化符号',
};

export function experienceTheme(item) {
  return Object.hasOwn(EXPERIENCE_THEMES, item?.experienceType) ? item.experienceType : 'other';
}
export function seasonLabel(item) {
  const season = item?.seasonality;
  if (!season) return '';
  const months = [...new Set(season.months || [])].filter(n => Number.isInteger(n) && n >= 1 && n <= 12).sort((a,b) => a-b);
  const label = !months.length ? '时段待公布' : months.length === 12 ? '全年可关注' : `${months.join('、')} 月`;
  return `${label}${season.dateSpecific ? ' · 日期需核对' : ''}`;
}
export function experienceDateInfo(item, date, selection = {}) {
  const season = item?.seasonality;
  if (!season || item.kind !== 'experience') return { schedulable: true, status: 'available', note: '' };
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date || '') && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) === date;
  if (!valid) return { schedulable: false, status: 'needs-date', note: '先选择出发日期，再核对该体验的季节与场次。' };
  if (selection.confirmedDate === date) return { schedulable: true, status: 'traveler-confirmed', note: `已由你核对 ${date} 的活动日期；尚不代表完成预订。` };
  const months = season.months || [];
  if (months.length && !months.includes(Number(date.slice(5,7)))) return { schedulable: false, status: 'out-of-season', note: `所选日期不在常见体验月份（${seasonLabel(item)}）；请先向运营方核对。` };
  if (season.dateSpecific) {
    const window = (season.dateWindows || []).some(row => row.start <= date && date <= row.end);
    if (!window) return { schedulable: false, status: 'confirm-date', note: '月份仅供探索，不能确定当天有活动；核对官方场次后再安排，当前先保留在愿望与预算中。' };
  }
  return { schedulable: true, status: 'available', note: season.note || '季节只作参考，实际开行、天气及名额以运营方为准。' };
}
export function dateForExperience(start, offset = 0) {
  const stamp = Date.parse(`${start}T12:00:00Z`);
  return Number.isFinite(stamp) ? new Date(stamp + offset * 86400000).toISOString().slice(0,10) : null;
}
export function applyExperienceDates(rows, startDate) {
  return rows.map(row => {
    if (row.experience.kind !== 'experience') return row;
    const selection = { ...row.selection };
    const availability = experienceDateInfo(row.experience, dateForExperience(startDate, selection.dayIndex), selection);
    if (!availability.schedulable) selection.scheduleStatus = 'needs-date-check';
    else if (selection.scheduleStatus === 'needs-date-check') delete selection.scheduleStatus;
    return { ...row, selection, availability };
  });
}
export const experienceIsPending = row => ['needs-more-days', 'needs-date-check'].includes(row?.selection?.scheduleStatus);
