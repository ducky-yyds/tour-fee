/** Focused batch inventory. Photo gaps remain visible; a numeric content floor is not photo completion. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { readExperienceEntries } from '../server/experience-catalog.mjs';
import { cardImage } from '../shared/media.mjs';
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const ids = ['north','east','west'].flatMap(region => read(`data/expansion/china-${region}-20261007.json`).map(city => city.id));
const cities = read('data/cities.json'), experiences = readExperienceEntries(), foods = read('data/local-foods.json'), media = read('data/media.json');
const photoScopes = new Set(['exact-place','nearby','related-theme','existing-photo']);
function photographed(entity, kind) {
  const image = kind === 'city' ? media.cities?.[entity.id] : cardImage(entity, media, kind);
  return Boolean(image?.url?.startsWith('/images/') && photoScopes.has(image.scope || 'existing-photo') && existsSync(resolve(process.env.MEDIA_ROOT || 'public/images', image.url.slice('/images/'.length))));
}
const problems = [], rows = [];
for (const id of ids) {
  const city = cities.find(c => c.id === id);
  if (!city) { problems.push(`Missing destination: ${id}`); continue; }
  const activity = experiences.filter(e => e.cityId === id && e.kind === 'experience');
  const stays = experiences.filter(e => e.cityId === id && e.kind === 'hotel');
  const dishes = foods.filter(f => f.cityIds.includes(id));
  const themes = [...new Set(activity.map(e => e.experienceType))];
  if (city.attractions.length + activity.length < 25 || activity.length < 5 || themes.length < 3 || stays.length < 5 || dishes.length < 5) problems.push(`Insufficient batch depth: ${id}`);
  const groups = { attractions: city.attractions, experiences: activity, foods: dishes, hotels: stays };
  const row = { cityId:id, name:city.name, themes, cityCover:photographed(city,'city'), counts:{}, photographs:{}, photoGaps:{} };
  for (const [kind, entities] of Object.entries(groups)) {
    row.counts[kind] = entities.length;
    row.photoGaps[kind] = entities.filter(e => !photographed(e, {foods:'food',hotels:'hotel',experiences:'experience'}[kind])).map(e => e.id);
    row.photographs[kind] = entities.length - row.photoGaps[kind].length;
  }
  rows.push(row);
}
const report = { checkedAt:new Date().toISOString(), maintainedDestinations:cities.length, mainlandChineseDestinations:cities.filter(c=>c.countryCode==='CN').length, newDestinations:rows.length,
  contentCounts:Object.fromEntries(['attractions','experiences','foods','hotels'].map(kind=>[kind,rows.reduce((n,r)=>n+r.counts[kind],0)])),
  photographCounts:Object.fromEntries(['attractions','experiences','foods','hotels'].map(kind=>[kind,rows.reduce((n,r)=>n+r.photographs[kind],0)])),
  cityCovers:rows.filter(r=>r.cityCover).length,
  photoNote:'Photographs count entity cards, not distinct files. Nearby/theme photographs retain their context and are not exact property photos. A missing verified photo is reported, never counted as completed.',
  existingCityAdditions:read('data/experience-expansion/china-existing-enrichment-20261007.json').length,
  perCity:rows, problems };
writeFileSync('data/china-expansion-audit.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,perCity:undefined}));
if (problems.length) process.exitCode=1;
