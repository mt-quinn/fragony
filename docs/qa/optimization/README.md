# Performance, stairs and flicker repair

All20 active maps receive the shared runtime fixes and prepared surface cleanup.

- Exact world ray queries use prepared BVHs on every arena, including the original four maps. Collision queries reject vertically separated objects before testing their planes. Original geometry remains; no LOD or mesh simplification is used.
- Health packs retain their exact component shapes, colors, placement, collection, animation and respawn behavior. Their visible parts use four instance batches rather than individual submissions for each pack and ring. Instance buffers are explicitly released when arenas leave the cache.
- All20 source stair limits now accommodate the original risers up to0.581m with a0.6m step allowance. Ground snapping accepts the same numerical skin range that it searches, preventing an airborne state while resting on adjacent sloping treads. Full-height obstacles and insufficient headroom remain solid.
- Flat overlapping finishes are partitioned by physical plane before triangulation. Opposing coincident finishes retain their original sides. Curves and transparent surfaces remain intact. Unique faces bypass reconstruction. Plane hashing distinguishes near-parallel surfaces; the native1005-triangle touching-contour regression avoids pathological polygon splitting.
- All20 independent original-versus-prepared geometry checks pass:208566 bidirectional surface probes and spawn-view rays. Surface proximity stays within1mm, including existing render packing. Original movement collision solids and imported source archives remain unchanged.
-135 synthetic stair flights are traversed up and down at30/60/144Hz, with oblique approaches and off-center travel. Both formerly stuck native Firing Range seams resume walking without a jump. Native source spawn/resource routes, pad landings, all38 EF lift directions, Hijacked lifts, full combat matches and Reservoir water travel pass. Remaining sampled route obstructions are actual walls, rails, headroom or different endpoint support, with no unexplained stuck cases.
- The56-command gameplay regression was run in segments. The first segment reached the archive guard while new files awaited chunking; archive reconstruction and the remaining gameplay commands passed separately. Focused surface, stair, pickup and render-codec regressions also pass.
- Cold practice, cache eviction and saved-run continuation wait for prepared visuals even when raw render groups are absent. The production-only loader verifies all20 maps independently. Exact original non-render JSON tokens are preserved while stripping duplicate render copies from three production payloads, including signed zero. Shoot House triangle indices are delta coded losslessly;149 chunk index hashes were verified before/after packing. Native browser streaming reconstruction passes. Every download part is at most16MiB.

The release contains252679959 bytes (about241MiB), below the250MiB guard. Prepared geometry and compressed data are loaded only when needed. The original four arenas use the same prepared visual loader as later imports.

`all-maps-before.jsonl` and `all-maps-after.jsonl` contain the seeded360-frame native combat CPU measurements. These measure simulation work, not GPU frame time. Browser Shipment Crossing was separately observed at60Hz (16.7ms frame interval,1.8ms renderer submission median) with shadows/actors enabled. Hardware, view and match activity affect frame rate.

The `*-visible-coverage.json` reports and before/after screenshots retain the geometry and visual evidence. Final source, runtime package and deployment share the same publication commit.

Controlled sequential Shipment comparison: median combat CPU12.25ms →0.66ms (94.6% lower); p9534.17ms →1.41ms. Both produce33 shots. World triangles149903→150889; logical collision is unchanged. CPU measurements exclude GPU rendering; frame rate also depends on hardware and view.
