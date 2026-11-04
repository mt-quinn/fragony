# Stair functionality audit — 2026-11-04

Requirement: every staircase must support ordinary walking up and down, without jump input.

## Changes

- Fixed shared movement to resolve the first colliding riser before testing later risers in the same movement slice. Closely spaced native clip steps no longer combine into a single tall obstruction. The per-riser limit remains 0.6m; walls and headroom checks remain solid.
- Corrected 16,771 signed native clip-plane distances in both Summit collision archives. Negative distances that were emitted unsigned made sloping stair planes redundant, leaving full bounding-height blocks. Signs are recovered only when the opposite sign intersects the original brush bounds. The importer uses the same correction.
- Cleared Firing Range's two visible warehouse stair flights through brush 517. A reviewed rotated standing corridor is subtracted from that brush; six outside convex fragments retain surrounding solid collision. Original stair ramps, terrain outside the corridor, and visuals remain intact. The importer retains this adaptation.
- Rebuilt Summit and Firing Range navigation, including all 256 spawn-to-spawn routes on each. Summit's gantry pad now lands on the actual 8.5m platform at z37 instead of targeting the stair slope at z35.

## Coverage and results

`npm run audit:stairs` discovers horizontal tread sequences directly from prepared visible triangles, independently of the navigation graph and movement collision. It tests clear walking lanes, lower approaches, both directions, and 30/60/144Hz. Narrow lanes that intersect retained rails/walls are explicitly recorded as excluded. Closed-door endpoints are inset by at most 0.3m so the body stops before the door.

The final report, [visible-stairs.json](visible-stairs.json), covers all 20 active maps: 129 geometric candidates, 40 explicitly reviewed pallet/crate/roof false positives, and 89 native stair routes. All 2,136 applicable directional walks passed, including 534 lower-approach walks. No unresolved stair or approach failures remain among the discovered candidates. Discovery requires repeated rectangular horizontal treads; sloped ramps and irregular surfaces are additionally covered by the existing movement/collision and navigation checks. Rust has ramps, while Shipment's candidates were pallet slats and Mutiny's exploratory candidates were trim/underside geometry.

Review exclusions live in `tools/stair-audit-review.json`, with source model evidence and bounded regions. They do not change collision. Standing clearance uses the player's full 0.4m radius and 1.9m height. The short Summit staircase to the closed exterior door is traversable to its legal stopping point; the door stays closed.

`npm run test:stairs` includes source-plane and convex-subtraction checks, 135 synthetic flights with oblique/off-center travel, two native Firing Range grounding seams, closely spaced risers, and the 89 recorded native routes. Native routes perform 534 complete up/down walks at three frame rates, without jumping or overlap recovery. Existing wall/corner, headroom, high-speed thin-surface, triangle-collision, spawn/resource, pad and combat tests also pass for the repaired maps.

Browser inspection confirmed the long Summit stair, the blocked Firing Range warehouse flight, the Hijacked tapered stair passage, the short Summit closed-door stair, and Forge2's shallow steps. Visuals were not changed.

The checked-in discovery report and fixed route fixtures make future blocked imports visible even when baked navigation has no edge through the staircase. Run discovery after geometry changes and regenerate reviewed fixtures only after inspecting new failures.
