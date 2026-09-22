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
