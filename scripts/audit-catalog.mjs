import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { CURRENCIES } from '../shared/currencies.mjs';
import { readExperienceEntries } from '../server/experience-catalog.mjs';

const read = file => JSON.parse(readFileSync(file,'utf8'));
const cities=read('data/cities.json'), guides=read('data/city-guides.json');
const fx=read('data/fx-reference.json'), media=read('data/media.json');
const problems=[], seen=new Set();
const missing={cities:[],attractions:[]};
const hasImage=(group,entity)=>{
  const image=media[group]?.[entity.id];
  if(!image?.url || !image.credit || !image.license || !image.sourceUrl || !existsSync('public'+image.url)) missing[group].push(entity.id);
};
for(const city of cities){
  if(seen.has(city.id)) problems.push(`Duplicate ID: ${city.id}`);
  seen.add(city.id);
  if(!CURRENCIES[city.currency] || !(fx.rates[city.currency]>0)) problems.push(`Missing currency: ${city.id}/${city.currency}`);
  if(!guides.some(g=>g.cityId===city.id)) problems.push(`Missing guide: ${city.id}`);
  hasImage('cities',city);
  for(const a of city.attractions){
    if(seen.has(a.id)) problems.push(`Duplicate ID: ${a.id}`);
    seen.add(a.id);
    if(!Number.isFinite(a.lat)||!Number.isFinite(a.lng)||Math.abs(a.lat)>90||Math.abs(a.lng)>180) problems.push(`Invalid coordinates: ${a.id}`);
    if(!(a.price.low>=0 && a.price.high>=a.price.low)) problems.push(`Invalid price: ${a.id}`);
    if(a.price.type==='official' && (!a.price.checkedAt||!a.price.sourceUrl)) problems.push(`Untraceable official price: ${a.id}`);
    hasImage('attractions',a);
  }
}
const count=cities.reduce((n,c)=>n+c.attractions.length,0);
const experiences = readExperienceEntries();
for (const place of experiences) {
  if (!cities.some(city => city.id === place.cityId)) problems.push(`Unknown experience city: ${place.id}`);
  for (const option of place.priceOptions) {
    if (!(fx.rates[option.currency] > 0)) problems.push(`Missing experience quote currency: ${place.id}/${option.id}`);
    if (!(option.low >= 0 && Number.isFinite(option.high) && option.high >= option.low)) problems.push(`Invalid experience price: ${place.id}/${option.id}`);
    if (option.type === 'official' && (!option.checkedAt || !option.sourceUrl)) problems.push(`Untraceable experience quote: ${place.id}/${option.id}`);
  }
}
const experienceCoverage = { places: experiences.length, cities: new Set(experiences.map(e => e.cityId)).size,
  options: experiences.reduce((sum, e) => sum + e.priceOptions.length, 0),
  categories: Object.fromEntries(['restaurant', 'hotel', 'experience'].map(kind => [kind, experiences.filter(e => e.kind === kind).length])),
  missingCities: cities.filter(city => !experiences.some(e => e.cityId === city.id)).map(city => city.id),
};
const report={checkedAt:new Date().toISOString(),cities:cities.length,countriesAndRegions:new Set(cities.map(c=>c.countryCode)).size,attractions:count,currencies:Object.keys(CURRENCIES).length,fxAsOf:fx.asOf,photos:{cities:cities.length-missing.cities.length,attractions:count-missing.attractions.length},missingPhotos:missing,experienceCoverage,problems};
writeFileSync('data/catalog-coverage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(problems.length) process.exitCode=1;
