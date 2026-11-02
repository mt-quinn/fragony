# Fragony maps

## Test Works
Original three-tier arena. Recovery now has three four-item 5 HP trails, five 25 HP packs, and one central 50 HP overhealth reward. Small trails mark movement through the Press rim, Range bridge and Assembly return rather than concentrating every resource at the center.

## Reservoir
Geometry conversion of the player-supplied `ctf_reservoir.pk3`, the Elite Force II remake credited to **[SFI]Valix** in its readme. The original Elite Force I layout and other material remain credited to their respective creators. This project retains the supplied architectural geometry and source pickup/spawn coordinates, with Fragony materials and gameplay. Ten additional free-for-all spawns cover the galleries, central crossings and lower reservoir routes. Shared player/bot spawning weighs enemy proximity, sightlines, nearby traffic and recent use of each region. No original game textures, character/item models, sounds, scripts or lightmaps are included.

The disconnected specialty loadout rooms and remote skybox are excluded. The main room connections, curved architecture, stairs, galleries, reservoirs and submerged passages are retained at 32 source units per metre. Four automatic elevator platforms replace the two paired base ladder zones and two central ladder zones. Approach either landing to call a lift; boarding sends it to the opposite floor. Jump swims upward and crouch swims downward. There is no drowning timer.

Bots use spatially distinct patrol destinations, avoid recently visited/crowded routes and relocate during prolonged local fights while retaining combat perception. Height preference is relative and capped so the upper bases do not dominate patrol choices. The ambient-occlusion depth/normal pass renders both sides of BSP surfaces to match the visible walls and prevent hidden geometry appearing as phantom shadows.

All 26 small-health and eight small-armor source placements become 5 HP pickups; the two medium-armor positions become 25 HP. Six additional 25 HP packs support lower landings, galleries and reservoir routes. The single 50 HP reward sits on the exposed central lower crossing. The run keeps its selected map, including across saves.

## Health
- 5 HP: small pale-green crosses, can exceed spawn health.
- 25 HP: white packs, capped at spawn health (including Juggernaut).
- 50 HP: one large acid-colored pack per map, can exceed spawn health.
- Overhealth cap: 200 HP. No decay. Small/standard respawn in 15 seconds; major in 30 seconds. Full or ineligible pickups remain available. Player and bots use the same rules. Any actual healing clears damage/assist history as before.

## Rebuilding Reservoir
From the repository root:

```sh
python3 tools/import-reservoir.py /path/to/ctf_reservoir.pk3
npm run bake:reservoir
npm test
```

The importer reads EF2! v20 planes, convex brushes, planar faces and quadratic patches. The primary format reference is Spearmint's `code/qcommon/bsp_ef2.c` (https://github.com/zturtleman/spearmint/blob/master/code/qcommon/bsp_ef2.c); loader implementation was not copied. Visible ladder rungs are removed with their interaction volumes. Rendering keeps material batches; spatial ray-test leaves preserve hit geometry without scanning the entire map per shot. The packed navigation graph includes lift and swimming links and records a geometry/route fingerprint checked by the tests. Run `npm run test:reservoir-flow` for multi-seed match coverage and combat checks across both bases, galleries, central crossings and water routes.

Water presentation uses one clipped surface per original swim volume, sparse moving highlights and clear grazing-angle tint. Water is excluded from the AO depth pass. Underwater fog retains long sightlines; no camera distortion or blur. Swim motion integrates entry velocity, drag and buoyancy instead of overwriting velocity; Space ascends and crouch descends. All four lift shafts have matching visible/collidable catch floors 0.30 m below the lower landing.
