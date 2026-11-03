# Seven-map source conversion — 2026-11-03

The active batch is Killhouse, Vacant, Showdown, Firing Range, Hijacked, Summit and Shoot House. Launch remains excluded because a usable source was not secured. These are geometry conversions from the recovered/ported sources below; they are not a claim that every file is an original developer `.map` release.

| Map | Source / attribution | Navigation nodes | Directed spawn routes |
| --- | --- | ---: | ---: |
| Killhouse | Supplied recovered CoD4 stock sources; Infinity Ward | 2,959 | 64 |
| Vacant | [Recovered CoD4 map](https://customapscod.com/mod.php?id=NTQ%3D), xoxor4d / Stendby | 7,939 | 256 |
| Showdown | [Recovered CoD4 map](https://customapscod.com/mod.php?id=ODY%3D), xoxor4d / Stendby | 5,535 | 256 |
| Firing Range | [Stendby's CoD4 source adaptation](https://customapscod.com/mod.php?id=MTE5), original Treyarch geometry | 5,533 | 256 |
| Hijacked | Hugo's CoD4 adaptation, [SPS source listing](https://sps-snipers.com/tutoriales/), original Treyarch geometry | 32,217 | 256 |
| Summit | BO1 `mp_mountain` world and native collision from [Shep's BO2 port](https://fastdl.cukservers.net/t6/downloads/Summit/) | 10,298 | 256 |
| Shoot House | MW2019 geometry from [usaMi's Ravenfield port](https://catalogue.smods.ru/archives/167499), Workshop 2955292632 | 5,605 | 256 |

Original geometry remains credited to Infinity Ward / Treyarch and each source's creators. Source textures, scripts, sounds and lightmaps are not imported. Local source archives, extracted intermediates, source hashes and authoring overrides live under the workspace's `reference-maps` directory. 

## Geometry and presentation

Radiant conversions preserve brush planes, curved patches, native static models and model collision. Summit uses recovered native world/clip surfaces and instanced model geometry; scripted brush transforms and breakable/nonphysical surfaces are handled explicitly. Shoot House excludes unused mesh vertices before bounds/collision construction. Its render approximation is border-locked within 8 mm; architectural collision stays as native surfaces with at most 1 mm simplification. Only small solid cover receives convex source-vertex collision hulls.

Each map has individually named and colored material districts, geometry-backed signage/service panels, source-specific lighting and the game's shared industrial material treatment. A 2 m reachable-navigation footprint, expanded by one cell, retains play space plus boundary walls/cover and clips remote render scenery. Existing source architecture inside this boundary remains intact.

Prepared render archives contain district geometry, indexed attributes and serialized shot/sight acceleration. Position and UV storage use 1/4096 precision; normals/colors use normalized compact attributes. Physics loads separately. Arenas load on demand, with a bounded retained arena cache; cancelled or failed loading never advances the map bag. The largest map, Shoot House, remains a substantial download, rather than silently discarding its source architecture.

## Traversal changes

- Killhouse: central observation-tower access pad.
- Firing Range: watchtower pad, with the port's invisible tower-sealing clip removed; original platform, roof and rails retained.
- Summit: a short launch to the intermediate gantry, connecting the upper control-room routes.
- Hijacked: two service elevators replacing climb-only steel ladders. The aft lift joins the lower tunnel to the cabin floor. The forward lift starts at the existing stair landing, avoiding the tunnel's low ceiling. Waiting points sit on supported landings; forward upper/lower waiting points differ to match its architecture.

Source starts were retained where physically supported and connected. Invalid or outside-fence port starts were moved to nearby supported space. Shoot House's upstairs offices are reached by native stairs using local half-metre navigation refinement. Hijacked also uses half-metre navigation so narrow native passages stay connected.

## Validation

`tests/source-arenas.mjs` checks all 1,600 directed spawn pairs, actual spawn/resource support and clearance, full trigger-disc pad flights with the native 120 Hz controller, physical lift round trips at 30/120 Hz, area definitions, geometry/navigation fingerprints, and prepared-BVH ray equivalence including real fence holes. `tests/hijacked-lifts.mjs` exercises actual bot boarding, calling, riding and continuation both ways on both lifts. `tests/source-combat.mjs` runs each map in the native game with live bots, shooting and resource collection.

The broader suite covers eleven-map bag persistence, save continuation, old retired saves, practice, minimaps, movement, combat and menu framing. Reservoir's permanent pit floors have separate dense visual-ray and fall tests with all platforms raised. Representative visual evidence lives in `docs/qa/`.

## Reproduction

1. Extract approved source archives into `reference-maps` using the source-specific import tools.
2. Run `tools/import-radiant.py` / `tools/import_external_sources.py` and the canonical `tools/rebuild-shoothouse-collision.py` as appropriate. Never execute source game scripts.
3. Inspect supported source starts, apply `reference-maps/<map>/gameplay.json` overrides and configure source arena specs.
4. Bake navigation with `tools/bake-imported-nav.mjs`; export reachable footprints with `tools/export-playable-footprint.mjs`.
5. Clip render surfaces with `tools/trim-source-footprint.py`, then rebake navigation fingerprints. Validated collision graphs may be reused only when the collision key matches.
6. Run `tools/bake-source-render.mjs` last; it marks successfully prepared specs. Reconfiguration/imports require preparing render archives again.
7. Run `tools/chunk-source-archives.mjs` to split archives above 16 MiB into lossless transport parts, then refresh navigation fingerprints with validated collision graph reuse. The loader streams these parts in order without reducing geometry. `tests/source-archives.mjs` checks the exact original compressed-byte hashes and reconstructed data.
8. Run the game test suite and inspect player-height views in `tools/industrial-review.html`.

Production packaging runs `tools/build-static-release.mjs` and serves `build/`. It retains all runtime render/physics parts while excluding raw authoring archives for prepared maps. The full authoring source remains in `dist/` in the repository and in local previews. This keeps the deployment archive within Sites’ 256 MiB input limit without reducing geometry.

The oversized inline Nuketown module is emitted as a compressed JSON payload with its original decoder retained verbatim. The release check compares the entire decoded geometry/collision/start data against the authoring module.
