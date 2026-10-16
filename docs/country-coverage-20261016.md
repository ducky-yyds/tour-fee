# Large-country destination coverage, 2026-10-16

This batch adds 71 maintained cities in 70 previously uncovered countries and regions. The assembled catalog has 294 cities in 136 countries and regions. Africa gains 35 cities. Russia includes Moscow and Saint Petersburg; Mongolia includes Ulaanbaatar.

Each new city has seven places, three distinctive experiences, five food choices and five named accommodation candidates: 1,420 entries in total. The content-depth rule counts places, experiences and food (15 per city); hotels are additional and do not inflate that requirement. An entry describes a destination or experience, not proof that it is currently open, bookable or available on a particular day.

## Coverage rule and maintenance

`npm run audit:countries` checks 109 ISO countries/regions with approximately 100,000 km² or more against the bundled Natural Earth map. Antarctica is excluded. Published surface-area records supplement map geometry for Liberia, South Korea and Western Sahara. Generalized map polygons do not provide authoritative land-area or sovereignty determinations. Greenland and Western Sahara are treated as regions in this inventory, not assertions of independent statehood. The Dominican Republic is an additional destination, not a member of the size-based target set.

References:

- [Natural Earth map data](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/)
- [World Bank surface area: Liberia](https://data.worldbank.org/indicator/AG.SRF.TOTL.K2?locations=LR)
- [World Bank surface area: South Korea](https://data.worldbank.org/indicator/AG.SRF.TOTL.K2?locations=KR)
- [UN Western Sahara profile](https://www.un.org/dppa/decolonization/en/nsgt/western-sahara)

The generated `data/country-coverage-audit.json` records every target, linked city IDs, entry counts and actual photograph coverage. The Pages workflow runs this gate after assembling maintained source packages. Its checks do not overwrite the destination registry or the previous experience audit.

## Reproducible sources

Four independent Python seed generators maintain matching files in `data/expansion`, `data/experience-expansion` and `data/food-expansion`:

- `seed-country-fill-africa-west-20261016.py`: 19 cities, including Dakhla.
- `generate-country-fill-africa-east-20261016.py`: 21 cities in Africa and South America.
- `seed-country-fill-eurasia-20261016.py`: 23 cities in 22 countries.
- `seed-country-fill-extra-20261016.py`: Nuuk, Port Moresby, Granada (Nicaragua), Havana, Roatán, Antigua (Guatemala), Monrovia and Santo Domingo.

After changing a generator, run it, then `npm run import:destinations`. Each pack stores destination/heritage, food and operator reference links. Companion regional source notes document the scope of research. A source that has not been individually reviewed has `checkedAt: null` and `verificationStatus: unverified`; this is distinct from a reviewed editorial reference and from a verified price.

Extra-pack destination references include Visit Greenland, Papua New Guinea Tourism Promotion Authority, Nicaragua INTUR, Cuba Travel, Honduras Travel, Visit Guatemala, Liberia Tourism and Go Dominican Republic. Municipal and museum/operator sources support additional locations. Where a source describes regional food rather than a particular restaurant menu, the stored scope says so.

## Planning and prices

All new amounts are explicitly **USD editorial planning allowances**, with the actual local currency stored separately. They are not scraped live quotes, minimum/maximum market prices or promises of availability. Room-night, person-day and single-serving amounts remain separate. Food choices describe alternatives within daily dining budgets.

Remote trips, date-specific events and access-dependent activities are optional. For affected destinations, an expandable city-page panel links to current travel conditions and its source. UK FCDO advice is identified as advice for British nationals; it is not treated as a universal entry ban or proof that every venue is closed. Ordinary visitor sites in Moscow, Saint Petersburg and Minsk remain eligible where the maintained source supports public access.

## Photographs and local deployment

This batch uses `imagePolicy: photograph-only`. An absent verified subject photograph produces a named placeholder, not a generic AI illustration. Related-theme and nearby photographs explicitly describe their scope; they must not be represented as hotel-room, restaurant-serving or supplier-package photos.

The reviewed food mapping in `data/food-photo-expansion/country-fill-dishes-20261016.json` separates dishes from ingredient pages and ambiguous names. Examples include Honduran versus Philippine pan de coco, Nicaragua quesillo, cooked kapenta and Southern African samp and beans. A shrimp open sandwich does not establish Greenlandic catch origin or a specific Nuuk restaurant.

City covers and licensed card photos are cached under `public/images`; source URLs, attribution and licenses remain in `data/media.json`. The full local asset archive and project/database snapshot are retained under `storage/originals` and `storage/backups`. Pages is a preview; its optimized image copies do not replace local source assets or the server deployment build. Detailed hotel and dish photographs still have pending items, recorded separately from completed country coverage.
