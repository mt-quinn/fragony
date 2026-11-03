# Seven industrial arenas

The approved Test Works slice establishes the material and construction language for all seven maps. Each facility has distinct internal districts, with broad material changes and recognizable equipment silhouettes. Architecture, cover and movement stay readable at phone scale. Decorative lime is restrained so characters, pickups, launch pads and combat effects remain the strongest signals.

## Individually authored identities

| Map | Facility | Internal identities |
|---|---|---|
| Test Works | Public-works maintenance plant | Ochre fabrication presses; galvanized process tower; teal pump service; pale electrical cabinets; dispatch loading bays |
| Reservoir | Water treatment and pumping | Mineral basin; coated pump gallery with inspection ports; pale electrical service panels; warm filtration; valve hall; transfer bridge |
| Tidal Lock | Flood-control works | Warm pump house; teal gate hydraulics; concrete lock crossing; intake channel; discharge approach |
| Parallax | Refinery utilities | Compressor enclosures; heat-exchange housings; transfer hall; switchgear/service towers; loading return |
| Foundry | Heavy fabrication | Forge vessels and machine guarding; hydraulic press; steel gantries; upper control; dispatch |
| Rust | Supplied refinery-yard layout | Central process tower; pipe racks; container/loading apron; perimeter service plant |
| Shipment | Supplied container-yard layout | Distinct container stacks, loading and power/service sides, original open cargo passages and elevated crossings |

Shared construction details and a static lo-fi sky keep the maps part of one world. Surface variation stays quiet: world-scale mineral grain, matte enamel, restrained galvanized metal and plain coated floors. Source container variants retain recognizable muted teal, blue-gray, ochre and pale treatments. There is no decorative scenery beyond the playable imports, no new clutter in ground routes and no additional animated machinery or environmental audio masking footsteps.

## Exact supplied layouts

Rust is imported from the supplied CoD1 IBSP59 version; Shipment is imported from the supplied CoD4 Shipment2 fastfile. These use recovered world triangles and original compiled movement collision, not estimated layouts. Source positions, names, transform metadata and fingerprints remain auditable. Rust's unavailable external prop art is represented by closed skins matching its authored collision hulls. Shipment retains the exact necessary in-play model geometry and native movement hulls, including vehicles, dumpsters, pallets and barrels. Distant backdrop, foliage and litter are omitted.

See `rust-source-import.md` and `imported-maps/shipment-source.md` for extraction details. The converters use the supplied files and Python's standard library; geometry buffers are encoded as Float32Arrays to reduce browser heap use.

## Eight deliberate launch routes

Rust has two ground entries onto the lower tower, a lateral lower-to-middle transfer, and the final upper ascent. Shipment has opposing routes onto original high stacks, a lower southern flank, and a doorway route onto the original elevated container network. The doorway route lands on an adjacent roof and uses the original open end and 0.25m step; it does not punch through a roof or add a bridge.

Every landing has actual source-surface support across a 0.7m disk. All eight pads are checked from nine takeoff positions within their 0.75m trigger radius, with analytic clearance and real 120Hz standing-body arrival simulations. Pad plates stay on the existing source floors. Native AI completes both Rust entries through the summit stages and uses Shipment's original upper doorway. Return paths were checked with the real movement controller, including the ordinary jump needed over Rust's existing lower guardrail.

Source navigation is baked ahead of time: Rust has 5,363 nodes / 59,516 edges; Shipment has 4,161 nodes / 47,478 edges. All 1,225 Rust and 484 Shipment source-spawn route pairs connect. Exact landing points remain separate from graph-node positions so rounding cannot change a launch parabola. Each map keeps the established health economy: one major pack, four standard packs and twelve small health pickups.

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

`npm test` includes source-surface conservation, winding, fence-hole visibility, supported signage, exact source spawns, navigation fingerprints, off-center/native launch arrivals, controlled AI traversal, full native matches and the existing weapon, progression, audio and mobile regressions. The seeded full matches recorded 297 shots / 22 pickups / 25 pad launches on Rust and 239 shots / 12 pickups / 8 pad launches on Shipment.

Practice now provides **Pause → Change Practice Map** on touch, or **Maps** in the desktop practice pause panel. Changing maps preserves the selected weapon and its fitted conversion; the campaign save and normal seven-map shuffled rotation remain untouched. Direct `?practice=rust`, `?practice=shipment` and other valid map IDs remain available.

Browser validation covers native touch practice, map switching and landscape layouts. Physical iPhone performance and thermal behavior still require device testing.
