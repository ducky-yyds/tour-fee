# Globe country and regional labels

`label-places.json` is a compact location index for the globe's country and
province/state zoom levels. It contains **fixed geographic anchor points**,
not centroids recomputed from the currently visible travel destinations.

Sources: Natural Earth 1:10m cultural vectors, official repository revision
[`ca96624a56bd078437bca8184e78163e5039ad19`](https://github.com/nvkelso/natural-earth-vector/tree/ca96624a56bd078437bca8184e78163e5039ad19).

- [Admin 0 countries](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/):
  country/territory `LABEL_X` and `LABEL_Y` anchors and `LABELRANK`.
- [Admin 1 states and provinces](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/):
  regional `longitude` and `latitude` anchors, `name_zh` / `name_en`, and
  `labelrank` / `min_label` for scale selection.
- [Admin 0 map subunits](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-details/):
  England, Scotland, Wales and Northern Ireland use their own fixed label
  positions. The admin-1 source otherwise contains much smaller UK councils.

Natural Earth publishes these data in the [public domain](https://www.naturalearthdata.com/about/terms-of-use/).
The JSON records the exact source URLs and SHA-256 digests.

## Format and selection

`countries` and `provinces` contain `{id, countryCode, name, nameEn, lat, lng,
rank, minZoom}`. Coordinates are WGS84 degrees rounded to four decimals.
`rank` retains Natural Earth's label priority; **lower numbers have higher
priority**. `minZoom` is a display threshold in this app's globe zoom multiples,
not a Web Mercator tile zoom. Labels still require screen-space collision
filtering.

Country display names use the Node/ICU `Intl.DisplayNames` short country names;
this avoids displaying formal long names on a small map. Regional names come
from Natural Earth, with the English name used when a Chinese translation is
absent. Source first-order administrative detail varies between countries and
can lag administrative reforms; this layer is cartographic orientation, not
an administrative boundary database.

Admin-1 records with `labelrank > 7` or `min_label > 8.7` are omitted to keep
the globe free of small districts. This includes all 31 mainland Chinese
provincial units represented in that layer, including Beijing, Shanghai and
Tianjin (whose source rank is 7), and the main US, Canadian and Australian
states/provinces. UK constituent countries are supplemented as above.

Regenerate with `node scripts/update-globe-labels.mjs`. The importer reads only
the source DBF attribute tables, caches them under the ignored
`artifacts/natural-earth-labels/` directory, and ships no additional boundary
geometry. Change the pinned source revision deliberately when updating it.
