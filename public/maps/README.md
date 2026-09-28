# Globe geography

`countries-110m.json` is copied from `world-atlas` 2.0.2, an unprojected
TopoJSON redistribution of Natural Earth 4.1.0 at 1:110 million scale.
The local file contains 177 country/area geometries and is served without
external map requests or API keys.

- Dataset: https://github.com/topojson/world-atlas
- Geography source and terms: https://www.naturalearthdata.com/about/terms-of-use/
- Redistribution license: [world-atlas-LICENSE](world-atlas-LICENSE)
- Projection: https://d3js.org/d3-geo/azimuthal#geoOrthographic

Small islands may be absent from this simplified geometry. Destination pins
come from the application's city coordinates and remain available independently
of the polygon set. Route curves are great-circle planning connections, not
airline flight paths or booked tickets.

Reproduce from the locked package version with `npm run update:map`, then build.

Country and province/state names use a separate fixed-anchor index,
[`label-places.json`](label-places.json). See [label sources and regeneration](label-places.md).
The globe shows countries at a distance, regions at medium zoom, and travel
cities close up. Label boxes keep fixed offsets from their geographic anchors;
screen-space collisions hide lower-priority labels instead of moving them around.
