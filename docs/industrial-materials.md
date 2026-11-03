# Industrial materials across the active roster

The twenty active maps share a construction and plant material vocabulary, with 100 named physical districts. Colors follow the actual district boundaries used by the map, rather than random triangles. The original architecture, collision, starts, health pickups and traversal are retained.

The finish library combines oxide red machinery, blue and green factory enamel, ochre loading equipment, warm brick workshops, timber construction panels, pale concrete, ceramic utility tile and dark aggregate yards. Floors have their own finish assignment; concrete soffits stay neutral. Original timber, containers, steel framing, glass and chainlink retain appropriate material roles. Rails and pipework remain darker than the surrounding facility panels.

| Map | District finishes, in authored district order |
| --- | --- |
| Reservoir | Blue pumps, ochre electrical, limewashed filtration, green valves, tiled basin, oxide transfer |
| Rust | Oxide process tower, green pipe rack, aggregate loading, ochre service |
| Shipment | Blue north stacks, oxide south stacks, green power, ochre dispatch, aggregate crossing |
| Nuketown | Green operations, ochre systems, timber west garden, brick east garden, aggregate transit |
| Killhouse | Timber west drill, ochre east drill, navy observation, brick briefing, aggregate entry |
| Vacant | Aggregate yard, brick warehouse, ochre records, green maintenance, tiled operations |
| Showdown | Limewashed court, brick west arcade, blue east arcade, green north gallery, ochre south gallery |
| Firing Range | Timber range, blue containers, brick workshop, green observation, aggregate drill yard |
| Hijacked | Tiled service, timber aft deck, blue operations, ochre forward deck, navy bridge, limewashed transfer |
| Summit | Blue switchyard, ochre gantry, oxide service, green cable station, tiled control |
| Shoot House | Rust recovery, blue cargo, tiled control, green north entry, ochre south entry, aggregate lane |
| Siege | Brick west keep, ochre east keep, sage north rampart, aggregate south court, blue gate |
| Mutiny | Oxide lower works, ochre east transfer, blue west transfer, brick loading, green gantry |
| Bravery | Green engine room, ochre duct, tiled operations, brick maintenance, navy transfer |
| Showdown · Elite Force | Brick workshops, blue stores, timber west arcade, ochre east operations, aggregate street |
| Delta Station | Blue north station, oxide south station, tiled upper transfer, ochre crossing |
| Beta Station | Green north systems, ochre south systems, navy upper gantries, brick crossing |
| Forge2 | Oxide lower forge, green west transfer, ochre north core, brick south reactor, navy gantry |
| Forge1 | Blue north forge, oxide south forge, green west power, ochre east power, aggregate crossing |
| Blast Radius | Tiled upper control, ochre test hall, blue pressure well, brick test room, green central hall |

Eight reusable 256px texture sets add albedo variation, millimetre-scale bump relief and roughness: brick courses and recessed mortar, timber grain and board joints, concrete form seams/tie holes, aggregate asphalt, ceramic grout, steel panel seams/fixings, painted surfaces and coated floors. World-projected UVs hold a consistent 2.22m repeat. Mipmaps and anisotropic filtering keep distant floors stable. Shared material/texture caches avoid per-object allocations; collision and shot rays do not use decorative relief.

The sixteen imported maps have rebuilt prepared rendering and spatial raycast acceleration. Large archives retain bounded 16MiB lossless transport parts. The four original imported arenas build the same finish system directly. No external copyrighted textures are added.

Verification: `tests/industrial-materials.mjs` covers all 20 maps/100 districts and shared physical textures; `tests/industrial.mjs` checks surface conservation, outward lighting normals, material draw budget, true fence holes and supported signs. `tests/industrial-source-surfaces.mjs` independently compares source and prepared surface area for all 16 imported maps. Browser captures in `docs/qa/materials/` record player-height appearance. Full regression and mobile results are recorded in the local handoff log. Changes are local; this task does not publish a release.

Final verification: all 56 regression commands passed, executed in segments after updating asynchronous map-transition fixtures and the older one-major pickup assertion. All 16 native imported bot matches and the three original imported full matches passed. The release package independently loads all 20 maps, including every prepared import. Native mobile gameplay at 844×390 had no page overflow or browser errors. No deployment was performed.
