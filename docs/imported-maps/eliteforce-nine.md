# Nine Elite Force maps

The selected Raven Software sources are integrated into the active roster and practice chooser. The roster now has twenty maps. Elite Force's Showdown uses the separate `ef-showdown` identity and menu label `SHOWDOWN · ELITE FORCE`; existing Call of Duty Showdown saves keep their original identity.

| Map | Original engine name | Starts | Health pickups | Pads | Lifts | Navigation nodes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| SIEGE | `hm_cam` | 9 | 75 | 1 | 0 | 10,286 |
| MUTINY | `hm_for1` | 12 | 82 | 1 | 2 | 17,524 |
| BRAVERY | `hm_kln1` | 8 | 61 | 6 | 1 | 9,261 |
| SHOWDOWN (EF) | `hm_noon` | 9 | 55 | 0 | 0 | 2,291 |
| DELTA STATION | `ctf_voy1` | 24 | 109 | 2 | 4 | 26,623 |
| BETA STATION | `ctf_voy2` | 24 | 121 | 6 | 0 | 22,191 |
| FORGE2 | `hm_for2` | 8 | 89 | 2 | 1 | 23,639 |
| FORGE1 | `ctf_for1` | 6 | 142 | 0 | 4 | 34,280 |
| BLAST RADIUS | `hm_blastradius` | 8 | 54 | 3 | 7 | 16,958 |

## Geometry

Original Radiant convex brush planes and quadratic Bezier control meshes supply the architecture. The only coordinate changes are a rigid axis conversion, translation and 1/32 scale. Patches use eight subdivisions per quadratic segment; original surfaces are not replaced with layout approximations. Brush collision keeps the source half-spaces, and patch collision uses a native triangle BVH. Prepared rendering quantizes visual positions to 1/4096 m without changing physical collision. Source art, shader effects and game scripts are not shipped.

Raven's original Game Development Kit 1.2 supplied 1,314 shader definitions used to distinguish player clip, bot-only clip, ladders, non-solid effects, sky and solid nodraw surfaces. This avoids turning invisible non-solid effects into walls. `common/camelot` is a sky material and is not rendered as a concrete enclosure. Native static architecture is preserved; source lift models use Fragony carriages and pit seals. Blast Radius's two pendulum brush entities retain their rest geometry rather than importing the original swinging scripts.

Each map uses named material districts, the shared industrial treatment, retained architectural light faces, fitted wall details and bounded point lighting. Collision and rendering load on demand through the existing map cache. There are no new runtime libraries.

## Health conversion

All 108 deathmatch starts and 788 physical pickup anchors are retained. `item_botroam` and script-only target_give supplies are not physical pickups. Ammo, small hypos and armour shards become 5 HP; weapons, ordinary hypos, combat armour and holdables become 25 HP; body armour, powerups and flag-base rewards become 50 HP. Existing overhealth and respawn rules apply.

Most original horizontal positions are unchanged. The fitter lowers floating pickups onto their supported source surface and makes bounded local adjustments for the native standing cylinder. Three documented exceptions preserve architecture and local reward patterns:

- Siege's single lower-tower armour reward moves 5.48 m to the adjacent supported courtyard approach; no opening is cut into the original tower.
- Forge2's Flight and nearby Quad rewards move about 1.52 m horizontally onto the pit-edge ledge. Their five-metre spacing remains. Health cannot provide the original flight ability needed to escape the recess; a physical return pad also reconnects the surrounding lower route.

Every resource has a `sourceClass`, original source position and entity index in the authoring records. Overrides include their reasons.

## Traversal

There are 21 pads and 19 elevators, including all nine original lift locations (two Mutiny, four Forge1 and three Blast Radius). Additional pads/lifts reconnect important ladder, transporter, upper-deck and pit routes through existing open space. Native full-trigger-disc flights, supported boarding/exit paths and vertical shaft clearance determine placement; no route is represented by a teleport or an edge through solid geometry. Redundant Beta Station links were removed after finer navigation resolved their source stair connections.

The native controller uses a 0.57 m step limit, matching Elite Force's 18-unit step proportions. Half-metre navigation preserves the narrow passages; Showdown uses local refinement at its small reward perch. The navigation compiler retains validated physical walk/jump/drop edges and fingerprints the exact geometry and traversal definitions.

Elevators with constrained source shafts wait for centred boarding, and bots continue centring during travel. Bots call actual physical stop heights, then step onto the nearby source landing; the landing node can sit slightly above a platform because of original trim. Blast Radius's entries follow actual open exits instead of pointing through the neighbouring wall. Existing maps without these optional boarding definitions keep their original departure rules.

Falling below the imported architecture triggers a normal campaign death/bot self-fall. Practice returns the player to a real supported start. This prevents walking on the engine's invisible zero-height floor beneath the map; existing maps keep their floor rules.

## Verification

- Source hashes, 108 starts, 788 converted pickup anchors, all 1,686 directed spawn pairs and every resource's access and return route.
- Full-disc pad launches using the native 120 Hz controller; physical elevator round trips at 30/120 Hz; actual bot boarding, riding and exiting both directions on all 19 lifts.
- Prepared render BVH rays compared with original triangle rays; supported and unobstructed starts/resources.
- Native short combat rounds on all nine maps, with real bot shots and health collection.
- Desktop player-height inspections and actual menu-to-Siege gameplay; mobile 844×390 chooser and gameplay checks. Screenshots are under `docs/qa/eliteforce/`.
- Full regression suite status is recorded in `reference-maps/eliteforce-next-map-round/full-test.log` (outside this repository).

## Reproduction and sources

Original maps and selection manifest: `../reference-maps/eliteforce-next-map-round/`. Archived downloads and hashes: sibling `eliteforce-original-sources/`. Original authorship: Raven Software. [Preserved release listing](https://arcade.frag-net.com/game_stef.html).

1. Extract the original editing kit without executing its installer; retain `shader-semantics.json` generated from its shader definitions.
2. Run `python3 tools/import-eliteforce.py`, then `node tools/configure-eliteforce.mjs`. The per-map `gameplay.json` records are the canonical authored overrides and traversal definitions.
3. Run `node tools/bake-imported-nav.mjs <ids>` after geometry/placement changes. `SOURCE_NAV_REUSE=1` can reuse walk/jump/drop edges only when the collision key and height envelope match. Connection/entry search tools are authoring aids; inspect their changes before retaining new links.
4. Run `node tools/bake-source-render.mjs <ids>` after visual geometry or district changes.
5. Run `npm test`. Focused checks: `tests/eliteforce-maps.mjs`, `tests/eliteforce-lifts.mjs`, `tests/eliteforce-falls.mjs`, `tests/source-arenas.mjs <ids>` and `tests/source-combat.mjs <ids>`.

This task changes the local game. Publishing is a separate action.
