# Eight industrial arenas

The approved Test Works slice establishes the material and construction language for all eight maps. Each facility has distinct internal districts, with broad material changes and recognizable equipment silhouettes. Architecture, cover and movement stay readable at phone scale. Decorative lime is restrained so characters, pickups, launch pads and combat effects remain the strongest signals.

## Individually authored identities

| Map | Facility | Internal identities |
|---|---|---|
| Test Works | Public-works maintenance plant | Ochre fabrication presses; galvanized process tower; teal pump service; pale electrical cabinets; dispatch loading bays |
| Reservoir | Water treatment and pumping | Mineral basin; coated pump gallery with inspection ports; pale electrical service panels; warm filtration; valve hall; transfer bridge |
| Tidal Lock | Flood-control works | Warm pump house; teal gate hydraulics; concrete lock crossing; intake channel; discharge approach |
| Parallax | Refinery utilities | Compressor enclosures; heat-exchange housings; transfer hall; switchgear/service towers; loading return |
| Foundry | Heavy fabrication | Forge vessels and machine guarding; hydraulic press; steel gantries; upper control; dispatch |
| Rust | Supplied refinery-yard layout | Central process tower; pipe racks; container/loading apron; perimeter service plant |
| Shipment | Stock compact cargo yard | North/south cargo, dispatch, power bay, central crossing |
| Nuketown | Utility campus on the Nuked layout | Teal field operations house, warm systems lab, west/east service gardens, transit crossing |

Shared construction details and a static lo-fi sky keep the maps part of one world. Surface variation stays quiet: world-scale mineral grain, matte enamel, restrained galvanized metal and plain coated floors. Source container variants retain recognizable muted teal, blue-gray, ochre and pale treatments. There is no decorative scenery beyond the playable imports, no new clutter in ground routes and no additional animated machinery or environmental audio masking footsteps.

## Exact supplied layouts

Rust retains the supplied CoD1 IBSP59 conversion and its four verified tower launch routes. Shipment now uses Stendby’s editable stock Shipment source recovery rather than Carcass26’s expanded Shipment2. Nuketown uses Stendby’s Nuked adaptation for CoD4; it is not represented as an official Treyarch editor-source release. Both Radiant imports retain source brush planes, terrain, nested prefab transforms, source DM starts and available original static model geometry. Original textures, lightmaps, sounds and scripts are excluded.

The new importer respects non-colliding and weapon-only source flags. Source convex solids keep their exact halfspaces; terrain uses inward thin collision prisms. Foot placement includes the full standing cylinder radius on sloped ground. Offline drop edges must physically walk off and land with the same controller as the game, preventing graph-only paths to a floor beneath a balcony. Exact zero-height source floors participate in navigation.

Source scenery is first cut to each playable envelope, then visually clipped to the reachable navigation footprint with a two-metre boundary shell. This retains perimeter-defining walls and fences without distant buildings, landscape or prop clutter. Source geometry is indexed losslessly for storage and expanded into the existing batched renderer. See [source conversion](imported-maps/shipment-source.md) and [Nuketown conversion](imported-maps/nuketown-source.md).

Neither new import adds launch pads: Shipment retains its stock compact lanes and open containers; Nuketown reaches both upper rooms through its original stairs. Each keeps one 50 HP major and four 25 HP recoveries; Shipment has twelve 5 HP fragments and Nuketown sixteen. Both are in the automatic eight-map bag, practice chooser and saved-map flow.

## Critique and iteration

The implementation was reviewed from standing, elevated and sheltered views, including low-effects settings. Corrections included:

- Replacing the initial colored-block appearance with closed machine guarding, supported roof/service construction and district-specific material roles.
- Aligning imported triangle winding with authored normals, correcting the dark inside-out surface lighting inherited from the source formats.
- Replacing edge-balanced landing candidates with fully supported interiors and checking real arrivals rather than only mathematical arcs.
- Keeping signs and equipment plates fully backed by real source walls across an interior sample grid; no painted-over firing openings.
- Preserving rotated deck footprints, avoiding false decorative cover over water.
- Sharing UVs in spatial raycast leaves so visible fence holes genuinely transmit shot and sight rays.
- Keeping necessary original prop collision rather than replacing complex cover with large boxes or thousands of redundant collision prisms.

The existing authored arenas receive the same small light-catching chamfers as Test Works. Static material batching, shared textures, spatial raycasts and cached navigation keep added cost bounded. Source mesh complexity is retained where it defines real cover; original imported pixels and high-frequency wear are replaced by the game's simpler material vocabulary.

## Validation and access

`npm test` includes source-surface conservation, winding, fence-hole visibility, supported signage, source spawn clearance/support, navigation fingerprints, native Rust launch arrivals, controlled Nuketown stair/return traversal, complete native matches and the existing weapon, progression, audio and mobile regressions. `tests/radiant-maps.mjs` verifies all 64 Shipment and900 Nuketown directed source-start pairs and the exterior crop. Match counts and final checks are recorded in the source conversion documents.

Practice provides **Pause → Change Practice Map** on touch, or **Maps** in the desktop practice pause panel. Changing maps preserves the selected weapon and fitted conversion; the campaign save stays intact.
