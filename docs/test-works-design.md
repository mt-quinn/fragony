# Test Works

An original larger arena for DEAD HEAT's six-player free-for-all. The interior measures 76 × 68 m, about 2.4 times Crosscut's footprint, with ground routes, 4 m gantries and a compact 8 m control room.

## What the original Quake III geometry taught us

I downloaded the original [Q3A example maps distributed with GtkRadiant](https://icculus.org/gtkradiant/downloads/1.5/gamepacks/q3a-example-maps-2004-12-06.tar.gz), parsed brush planes from `q3dm7sample.map` and `q3dm17sample.map`, and inspected horizontal slices. This is direct geometry inspection, rather than relying on descriptions or screenshots alone. Patch curves were omitted, so these are brush studies rather than complete reconstructions. The original files stay outside this repository and no Quake assets are shipped.

Q3DM7's floor footprints show offset rooms connected around an interlocking middle; routes change between low, middle and upper slices. Wider spaces have much shorter door approaches, and pickups occupy separate room lobes. Q3DM17's platform footprints are distinct at successive floor elevations: broad lower platforms, separated upper positions, narrow connections, chamfered edges and exposed jump commitments. The lesson applied here is purposeful relationships between spaces and tiers, not extra surface detail or a copied room outline.

## Place and intent

Test Works is an abstract crash-testing facility. Press machines, calibration faces, a gantry, firing lanes and an observation room make areas recognizable while keeping the established chalk/ink/acid style.

| Place | Engagement | Rotation / counterplay |
| --- | --- | --- |
| Press | Close and medium turns around two tall machines | Sheltered lower health route, broad west stairs, exposed pad, L-shaped upper rim and a bent connection to Core |
| Core | Vertical hub: a cross gantry above the ground lane | Contested low armor, multiple exits, exposed pad, upper links toward Press, Range and Control |
| Range | Longer interrupted rifle/rail lanes | Offset test block permits short approaches; side balcony is accessible by stairs or pad; bridge exposes crossings |
| Control | Sheltered north circuit underneath a 4 m route, plus a small 8 m room | Two ascent choices to the high armor, limited viewing direction, drop exits; health elsewhere forces leaving |
| Assembly | Medium crossings and close pushes around diagonal screens | Southern return route and recovery bays bypass the central armor fight |

The main circuits are the ground outer loop through Press → Control → Range → Assembly; the shorter loop through Core's offset portals; and the upper connections through the press rim, core gantries and control approach. These overlap without making every room visible from one center. Diagonal screening walls and filled corner cuts remove empty perimeter pockets. Most cover is room-scale structure, not scattered crates.

Resources are spread among the circuits. Core armor is a low exposed contest; high Control armor costs an ascent. Health is distributed to the Press underpass, Assembly recovery bay, Range balcony and western Control corridor. No single reward supplies every need. Fourteen spawn positions cover the rooms and tiers.

## Implementation and verification

`dist/map.js` owns all collision, stairs, decks, pad trajectories, pickups, spawns and strategic positions. `dist/geometry.js` provides shared rotated-box collision, supported floors and underside collision for player/bots/navigation. Walkable layers coexist at the same X/Z; jumping under a deck cannot phase through it. Navigation uses the larger bounds, spatially indexed collision queries and real surface support. Pad origins can be above ground and use explicit launch speeds. Static world boxes render as shared instances with one merged edge layer while precise source meshes remain available for raycasts.

Checks cover all strategic routes, actual bot movement through every stair (including forced stair-only traversal) and pad, drops, supported spawns/pickups, independently blocked portals, sightline control and real underpass collision. Current geometry measurements: 5,454 navigation nodes; spawn-to-core route distances correspond to 2.5–7.9 seconds at normal player speed (pad time is not represented by this distance estimate); at most 5 of 14 spawn positions visible from any tested strategic anchor. Nine seeded full-match simulations at rounds 1, 6 and 12 also use all five areas, the upper control tier and the underpasses. A regression specifically verifies that bots leave a balcony edge before seeking health below it. These checks support the layout; they do not replace human playtesting.

[Ground and upper layout](test-works-layout.svg).
