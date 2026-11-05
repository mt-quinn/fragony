# Map color direction

Shoot House retains the exact approved `aee5ddd` art pass. Every other active map has a separately authored four-paint gamut, a neutral floor, a structural ink, and a sky. Colors are chosen for each map's architecture and atmosphere; shared hues are incidental, and their roles differ.

`dist/map-art-profiles.js` is the authoring source: each area has a primary paint, accent, graphic treatment, and source walk-space anchors. `research/map-art-roster/` is an engine-native review workspace with named views, actual health-colored characters, and a per-map evidence ledger. The ledgers record visual review separately from successful asset generation.

## Palettes

| Map | Direction | Hierarchy |
| --- | --- | --- |
| Reservoir | Lagoon, aged brass, canvas, marine blue | Lagoon pumps, brass electrical gallery, canvas filtration, marine valve rooms; cool quiet decks. |
| Rust | Sienna, violet smoke, wheat, lichen | Sienna tower, violet pipework, wheat loading frames and lichen services; warm-gray decks and lavender/cream sky. |
| Shipment | Dock blue, persimmon, jade, canvas | Cargo panels stay whole; persimmon hardware, jade power bay and canvas dispatch. |
| Nuketown | Flamingo, pool enamel, vanilla, plum | Opposite houses remain identifiable at both stories; vanilla cornices and cabinetry, different garden pairings. |
| Killhouse | Amber, ink blue, oxide, linen | Contrasting drill bays, light trusses and columns, oxide observation/briefing and linen entry. |
| Vacant | Celadon, wine, taupe, porcelain | Celadon warehouse, wine records, taupe maintenance and porcelain offices; subdued gray-green floors. |
| Showdown | Lapis, pomegranate, ochre, travertine | Lapis west arcade, pomegranate east, ochre north, travertine court and south; light arch reveals. |
| Firing Range | Field sage, russet, blue steel, canvas | Sage timber/yard, blue container structures, russet workshop; natural rocks and foliage remain unmarked. |
| Hijacked | Marine navy, teak, sea glass, ivory | Navy salon, teak aft, sea-glass bridge, ivory bow; warm gray decks and restrained ship-like bands. |
| Summit | Glacier, spruce, vermilion, ice | Glacier north, vermilion gantry, spruce cable room, ice service buildings; pale blue-gray snow. |
| Siege | Heather, verdigris, old mortar, dusty rose | Distinct keeps, mortar reveals, dusty-rose court and lavender-slate floors. |
| Mutiny | Oxblood, storm blue, ivory, enamel green | Oxblood lower works, blue east, ivory west, green loading; restrained bands and quiet blue-gray decks. |
| Bravery | Aubergine, brass, mineral cyan, ivory | Aubergine engine room, cyan duct, ivory operations, brass maintenance supports; lavender-gray decks. |
| EF Showdown | Apricot, periwinkle, peacock, light stone | Apricot workshop, periwinkle arcade, peacock operations; pale arches and muted warm-gray court. |
| Delta Station | Cobalt, dusty rose, ceramic, bronze | Cobalt north versus rose south, ceramic/bronze upper bridge; blue-slate floors. |
| Beta Station | Malachite, amber, lavender smoke, ivory | Malachite north versus amber south, lavender gantries, ivory crossing; sage-gray floors. |
| Forge 2 | Iron orange, furnace teal, wine, refractory cream | Wine west, teal lower/reactor, orange gantries; cream frames and quiet steel-gray decks. |
| Forge 1 | Indigo, flame copper, olive ash, porcelain | Indigo north, porcelain south, olive west power, copper east; blue-gray floors. |
| Blast Radius | Duck egg, saffron, blackcurrant, limestone | Saffron south supports, blackcurrant pressure well, duck-egg core/control, limestone west; blue-slate floors. |

## Geometry and rendering

The bake starts from immutable approved-release render geometry, reconnects physically contiguous source planes across old district/material batches, and preserves small connected objects before joining architectural planes. Walk-graph ownership follows source doorways and stairs. Every connected assembly receives one owner; art boundaries do not cut triangles along arbitrary coordinate planes. Author overrides remain available for exceptional assemblies.

Primary paint occupies broad architectural faces. Existing frames, narrow supports, cover boards and door hardware carry secondary paint. Dado, frieze, pilaster and small marks are shader treatments on the original surface triangles, so windows and doors remain open. Firing Range uses exact original semantic rock/foliage/landscape surfaces to exclude natural objects from graphics.

Every upward-facing opaque surface receives the floor role before legacy rubber/metal trim tags. This includes imported decks and stairs at every elevation. Floor textures are quiet; paint grain is restrained. Material colors and map skies feed the original fixed twelve-color Pixel Forge lookup. The final shader is restored byte-for-byte from `c35d332`, retaining the world-space update from `adc2170`, its original pixel size, surface variation and edge treatment. No map-specific output palette overrides are active.

Actors keep their actual health hues. Their visible depth-tested mask protects them from world quantization; the original shader protects their clean colors without the later adaptive silhouette treatment. It never reveals an actor through solid cover, and chainlink alpha holes remain accurate. First-person weapons remain protected separately.

## Reproduce and verify

Run `node tools/bake-map-art.mjs <map-id>`, then `node tools/chunk-source-archives.mjs`. The baseline reader uses commit `aee5ddd` and caches authoring data outside the release. Rebuild only maps whose assignments change. A new bake resets its review status intentionally.

Run `npm run test:map-art` for gamut consistency, exact source triangle fingerprints, valid packed paint colors, upward floor classification, original native anchors, efficient material sharing and lighting transition resets and historical shader identity. `tests/fixtures/map-art-source-geometry.json` was independently captured from the immutable baseline. Existing geometry, fence, rendering, gameplay and release-loading checks remain required. The production package excludes source authoring archives and this review workspace.
