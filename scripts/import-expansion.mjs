import { readdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const incoming = readdirSync('data/expansion').filter(f => f.endsWith('.json')).flatMap(f => read('data/expansion/' + f));
if (new Set(incoming.map(c => c.id)).size !== incoming.length) throw new Error('Duplicate expansion city ID');
const cities = read('data/cities.json'), guides = read('data/city-guides.json');
for (const city of incoming) {
  if (!city.id || !city.attractions?.length || !city.guide?.intro) throw new Error('Invalid city ' + city.id);
  const index = cities.findIndex(c => c.id === city.id);
  if (index < 0) cities.push(city);
  else if (process.argv.includes('--refresh')) cities[index] = city;
  const guideIndex = guides.findIndex(g => g.cityId === city.id);
  if (guideIndex < 0) guides.push(city.guide);
  else if (process.argv.includes('--refresh')) guides[guideIndex] = city.guide;
}
const sightIds = cities.flatMap(c => c.attractions.map(a => a.id));
if (new Set(sightIds).size !== sightIds.length) throw new Error('Duplicate attraction ID');
for (const [file,value] of [['data/cities.json',cities],['data/city-guides.json',guides]]) {
  writeFileSync(file + '.tmp', JSON.stringify(value, null, 2) + '\n'); renameSync(file + '.tmp',file);
}
console.log(JSON.stringify({cities:cities.length,countriesAndRegions:new Set(cities.map(c=>c.countryCode)).size,attractions:sightIds.length}));
