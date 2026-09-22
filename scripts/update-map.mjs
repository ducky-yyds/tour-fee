import { copyFile, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const source = new URL("node_modules/world-atlas/", root);
const destination = new URL("public/maps/", root);
const map = JSON.parse(
  await readFile(new URL("countries-110m.json", source), "utf8"),
);
if (map.type !== "Topology" || !map.objects?.countries?.geometries?.length) {
  throw new Error(
    "Invalid world-atlas geography; existing local map retained.",
  );
}
await mkdir(destination, { recursive: true });
await copyFile(
  new URL("countries-110m.json", source),
  new URL("countries-110m.json", destination),
);
await copyFile(
  new URL("LICENSE", source),
  new URL("world-atlas-LICENSE", destination),
);
console.log(
  `Copied ${map.objects.countries.geometries.length} geometries to ${fileURLToPath(destination)}`,
);
