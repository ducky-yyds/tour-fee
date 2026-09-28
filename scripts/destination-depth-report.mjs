import { readFileSync, writeFileSync } from 'node:fs';
import { readExperienceEntries } from '../server/experience-catalog.mjs';
import { cardImage } from '../shared/media.mjs';

export function destinationDepthReport(cities, experiences, media, foods = []) {
  const perCity = cities.map(city => {
    const activities = experiences.filter(item => item.cityId === city.id && item.kind === 'experience');
    const places = city.attractions || [];
    const rows = [...places, ...activities];
    const photos = rows.filter(item => {
      const image = cardImage(item, media, item.kind || 'place');
      return image?.url && image.scope !== 'illustration';
    });
    const tier = city.contentTier || 'existing';
    const minimumActivities = tier === 'priority' ? 25 : tier === 'standard' ? 10 : 20;
    const minimumExperiences = tier === 'priority' ? 5 : 3;
    const localFoods = foods.filter(food => food.cityIds?.includes(city.id));
    const missing = [];
    if (rows.length < minimumActivities) missing.push('attractions-and-experiences');
    if (activities.length < minimumExperiences) missing.push('unique-experiences');
    if (foods.length && localFoods.length < 5) missing.push('local-foods');
    return { cityId: city.id, name: city.name, country: city.country, tier,
      minimumActivities, minimumExperiences, minimumFoods: 5, missing,
      attractions: places.length, experiences: activities.length, total: rows.length,
      foods: localFoods.length, contentTotal: rows.length + localFoods.length,
      curatedAttractions: places.filter(item => item.sourceProvider !== 'openstreetmap').length,
      photographs: photos.length,
      experienceIllustrations: activities.filter(item => cardImage(item, media, 'experience').scope === 'illustration').map(item => item.id),
    };
  });
  return { minimum: 15, tiers: { standard: { activities: 10, experiences: 3, foods: 5 }, priority: { activities: 25, experiences: 5, foods: 5 }, existing: { activities: 20, experiences: 3, foods: 5 } },
    counting: 'Distinct attractions plus kind=experience activities and local foods. Hotels/restaurants do not count toward content depth. Existing cities retain the previous activity floor; source-derived places are identified separately.',
    cities: cities.length, perCity, belowMinimum: perCity.filter(city => city.missing.length).map(city => city.cityId),
    experienceIllustrations: perCity.flatMap(city => city.experienceIllustrations),
  };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/destination-depth-report.mjs')) {
  const read = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const report = destinationDepthReport(read('data/cities.json'), readExperienceEntries(process.cwd()), read('data/media.json'), read('data/local-foods.json'));
  writeFileSync('data/destination-depth-audit.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ cities: report.cities, belowMinimum: report.belowMinimum, experienceIllustrations: report.experienceIllustrations.length }));
}
