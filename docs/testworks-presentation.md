# Test Works: public-works maintenance plant

A completed presentation slice for one map. The original cover footprints, cover heights, doors, stairs, pickups, pads and spawn locations are retained. The approved slice now supplies the shared material vocabulary for the six other arenas; see `industrial-presentation.md`.

## Place and material identity

| Section | Materials | Recognizable forms |
|---|---|---|
| Fabrication / 01 | Warm precast, ochre enamel, graphite guards, rough shop floor | Two tall enclosed press housings, workshop bays and skylight roof rhythm |
| Process hall / 02 | Pale concrete, galvanized panels, mineral floor | Tall enclosed transfer tower with instrument ports and crossed maintenance gantries |
| Pump service / 03 | Faded teal enamel, coated floor, galvanized connections | Long acoustic pump enclosure, circular service hatches and suspended twin headers |
| Electrical / 04 | Pale equipment panels, coated service decks, restrained cabinet joints | Switchgear banks, closed electrical cabinets and stacked service platforms |
| Dispatch / 05 | Warm concrete, ochre rolling doors, concrete loading barriers | Three broad loading-door bays and the low transfer enclosure |

Shared construction details, restrained paint, steel edges and neutral lighting keep the areas part of one facility. Materials and equipment proportions carry identification; large signs reinforce it. Character colors, pickups and weapon effects retain the strongest gameplay signals. There is no new ground-level prop clutter, decorative railing or dense rust/grunge overlay.

## Construction and rendering

`dist/testworks.js` builds the map presentation from the original `map.solids`. Hidden exact meshes retain original projectile collision; movement uses the original dimensions and orientation. Visible structural cover has a 35mm chamfer. Shallow panel relief stays on the existing solid faces. Equipment remains visibly enclosed, so no new apparent firing gaps are introduced.

New canopies, structural ties and suspended pump services occupy overhead space, with real projectile collision. Roof and service supports visibly connect to the existing building. Full standing-body trajectories on all four original jump pads clear the additions. The air between the two pipes is genuinely open to projectiles.

Static geometry is merged into 28 material/shadow batches, approximately 20,200 triangles, plus 11 sign planes. Surface relief does not cast distracting shadows; selected thin relief also stays outside the ambient-occlusion depth pass. Two broad point lights retain the previous map light budget. There are no decorative animation updates or additional post-processing passes.

Concrete uses a small tileable mineral-grain texture with consistent world-scale UVs. Coated pump/electrical flooring uses a smoother response. The static 1024×512 lo-fi sky uses a soft blue-gray horizon and broad stepped cloud banks. Sky, fog, ambient strength and shadow bias are map-specific and restored correctly when changing maps, including cached maps. Materials remain identifiable without ambient occlusion, bloom or shadows.

## Critique and iteration

The first pass read too much as colored blocks against a void. The roof/skylight envelope, closed press mechanisms, loading-door faces and connected overhead services resolved that. Later reviews corrected coplanar relief/shadow artifacts, overly dark dispatch cover, insufficiently distinct electrical surfaces, pump parts extending above actual cover, and thin construction joints that aliased at mobile resolution. A review-camera drift issue was fixed by locking its presets by default before final comparisons.

## Verification

`tests/testworks.mjs` checks all original solid bounds, full standing-body pad trajectories, cover/opening raycasts, bounded static geometry, finite buffers, five material districts, sky/lighting restoration and native practice/save/rotation isolation. Existing map, movement, combat, audio, attachment and progression regressions remain part of `npm test`.

`tools/testworks-review.html` is a local review tool sharing the production geometry, materials, lighting and frame renderer. It offers fixed views for all five districts, gantries, lower service and sky, actual standing/crouched character rigs, a low-effects check and opt-in free camera. It is outside the published static directory.

Browser review covered fixed player-height/upper/underpass views and native touch gameplay at 844×390, including no-damage practice entry. Physical iPhone performance and thermal behavior still require device testing.

Open the game with `?practice=testworks`, then choose **Practice Test Works**, to inspect the finished map. This chooses the practice map without changing the saved campaign or the normal match rotation.
