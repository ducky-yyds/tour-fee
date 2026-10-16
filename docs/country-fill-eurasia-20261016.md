# Eurasia country-coverage pack — 2026-10-16

This source pack adds 23 cities across 22 previously assigned countries: Russia (Moscow and Saint Petersburg), Mongolia, Kazakhstan, Saudi Arabia, Iran, Pakistan, Myanmar, Afghanistan, Ukraine, Turkmenistan, Uzbekistan, Yemen, Iraq, Oman, Romania, Belarus, Kyrgyzstan, Syria, Tajikistan, Bangladesh, North Korea and Bulgaria.

Each city contains 7 attractions, 3 independent experiences, 5 food entries and 5 named hotel properties: 460 entries altogether. All city content tiers are `standard`. Hotel entries do not count towards the 10-attraction/experience minimum.

Reproduce only these source packs with `py -X utf8 scripts/seed-country-fill-eurasia-20261016.py`. The generator does not import, merge, build, publish or commit the project. Photo collection and the lossless asset archive are maintained separately by the parent integration workflow.

## Sources and estimates

Every city has a source actually reviewed on 2026-10-16. The generator keeps an exact URL allowlist for reviewed references. Links not individually read carry `checkedAt: null` and `verificationStatus: unverified`; their existence is not presented as completed verification. A reviewed cultural reference does not confirm an attraction is currently open, a hotel is operating or rooms are available.

All numerical budgets are USD editorial estimates, expressly labelled as estimates rather than local-currency amounts, real-time quotes or observed price extrema. `localCurrency` identifies the destination currency separately. No live hotel availability, restaurant menus or entry ticket quotes are asserted. Food search areas are starting points for finding the dish, not promises that a particular vendor sells it.

## Access and planning

Travel advisory metadata cites the UK FCDO and identifies its British-national audience. It is not a universal entry ban or evidence that a venue has closed. Moscow, Saint Petersburg and Minsk retain automatic candidates for 5, 6 and 6 attractions respectively supported by public visitor information or public-space guides. Entries without a current access check remain manual candidates.

Conflict and controlled-entry destinations retain access conditions and manual-only listings where current opening, entry or authorised routing has not been established. In particular, Pyongyang entries never promise independent travel, general reopening or freely bookable hotel rooms. Month-based festival candidates do not imply daily performances; events without a verified calendar have no assumed available month.

## Currency, airport and image identity corrections

- Bishkek uses BSZ, with legacy FRU separately recorded. Evidence: [IATA code directory](https://www.iata.org/en/publications/directories/code-search/?airport.search=BSZ).
- Bulgaria's local currency is EUR. Evidence: [ECB adoption announcement](https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.pr260101~c830245e42.en.html).
- `Mandu (food)` disambiguates the Korean dumpling. Mont let saung is described as a coconut-milk rice-jelly dessert, not a rice cake.
- Shuwa, mashuai, khubz, pyshki, cooked smelt and Mont let saung request specific food photography; a broad cuisine, raw fish or a different country's dessert must not be presented as the dish.
- Cham Palaces and Hotels is a group, so its article is not used as a hotel-property photograph. Kingdom Centre is labelled as the exterior building containing Four Seasons Riyadh, not its rooms or facilities. Unknown hotel-property articles are left blank.
- Any whole-city or larger-area image is explicitly scoped as nearby context. Generated source packs intentionally leave photo URLs for the separate maintained asset pipeline.

Validation of these three source packs checked per-city counts, unique IDs, accepted experience types, seasonality bounds, source-verification metadata and USD/local-currency separation. No shared import or whole-project build was run by this task.
