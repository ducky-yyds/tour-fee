import { readFileSync, writeFileSync } from 'node:fs';
import { readExperienceEntries } from '../server/experience-catalog.mjs';
import { cardImage } from '../shared/media.mjs';

export function destinationDepthReport(cities, experiences, media) {
  const perCity = cities.map(city => {
    const activities = experiences.filter(item => item.cityId === city.id && item.kind === 'experience');
    const places = city.attractions || [];
    const rows = [...places, ...activities];
    const photos = rows.filter(item => {
      const image = cardImage(item, media, item.kind || 'place');
      return image?.url && image.scope !== 'illustration';
    });
    return { cityId: city.id, name: city.name, country: city.country,
      attractions: places.length, experiences: activities.length, total: rows.length,
      curatedAttractions: places.filter(item => item.sourceProvider !== 'openstreetmap').length,
      photographs: photos.length,
      experienceIllustrations: activities.filter(item => cardImage(item, media, 'experience').scope === 'illustration').map(item => item.id),
    };
  });
  return { minimum: 20, counting: 'Attraction entries plus kind=experience entries; hotels, restaurants and food entries are excluded. Map-derived places remain identified separately.',
    cities: cities.length, perCity, belowMinimum: perCity.filter(city => city.total < 20).map(city => city.cityId),
    experienceIllustrations: perCity.flatMap(city => city.experienceIllustrations),
  };
}

if (process.argv[1]?.replaceAll('\\', '/').endsWith('/destination-depth-report.mjs')) {
  const read = file => JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  const report = destinationDepthReport(read('data/cities.json'), readExperienceEntries(process.cwd()), read('data/media.json'));
  writeFileSync('data/destination-depth-audit.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ cities: report.cities, belowMinimum: report.belowMinimum, experienceIllustrations: report.experienceIllustrations.length }));
}
