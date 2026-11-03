# Rust source conversion

Input supplied by the player: `mp_Rust.rar`, containing `zzz_mp_Rust.pk3`, with `maps/mp/mp_Rust.bsp`. This is the Call of Duty 1 remake `mp_Rust 1.0`, in IBSP version 59. The PK3 SHA-256 is `129b17cc7aff390e13486dad99a547474f3f9a4df7a2b38564183d763900525d`.

## Direct geometry

`tools/import-rust.py` reads the authored indexed triangle soups and original brush constraints. It does not reconstruct the layout from a screenshot or substitute a blockout. It imports mixed axial/non-axial brushes and both collision-patch streams found in this file: 11 indexed terrain patches and 130 unindexed convex-patch records. Indexed terrain and unindexed triangle streams have verified contiguous ranges; triangle collision uses thin surface prisms, preserving the real slopes instead of replacing terrain with bounding boxes.

The format structures were verified against the primary parser source in [bsp_tool's CoD1 branch](https://github.com/snake-biscuits/bsp_tool/blob/master/bsp_tool/branches/infinity_ward/call_of_duty1.py) and its [shared CoD1 structures](https://github.com/snake-biscuits/bsp_tool/blob/master/bsp_tool/branches/infinity_ward/call_of_duty1_demo.py). The second collision stream is validated directly against this file's offsets rather than relying on the partial public structure interpretation.

World scale is 1/32. The source origin `[1336,-592,-5088]` maps to our world origin. Coordinates rotate from source Z-up to engine Y-up without altering original distances. Source spawn coordinates, angles, shader identities and model placements remain in `RUST_SOURCE` for audit. Triangle winding is normalized to the authored outward normals.

## Playable crop

Original player-clip boundary walls establish the playable interior at source X98..2575 andY−1779..622. The retained envelope includes the walls/fence structures themselves: X74..2598 andY−1812..637. Distant scenery is clipped away geometrically; intersecting triangles and brushes are clipped at those planes. Nonplayable deep subfloor below source Z−5120 is also discarded. The source world's much larger bounds remain recorded in metadata. All tower, container, pipework and accessible rooftop geometry inside the boundary stays at its authored position.

Final visible bounds are X−39.4375..39.4375, Y−1..38.21875, Z−38.40625..38.125. The tallest thin antenna is higher than the usable platform network.

## Base-game model assets

The supplied PK3 references external CoD1 xmodels but does not contain their files.121 placements inside the playable envelope retain their exact model names, origins, angles and scale.76 authored collision hulls belonging to those missing props receive closed matching hull skins, avoiding invisible cover. Noncolliding missing decorative models are metadata only. No game script executes and no original game texture pixels are used.

The `fence` render group contains original masked fence/grate surfaces. Its final industrial material must distinguish rails, grates and fences and consider shot transparency; blindly making every surface opaque would conceal views that the original alpha material reveals.

## Integration and validation

`dist/maps/rust.js` exports `RUST` and `RUST_SOURCE`. All 35 original DM spawnX/Z positions are preserved. Grounding uses the full 0.4m character footprint on the original terrain, with 1mm skin: all 35 pass the real 1.9m standing-cylinder collision test. No spawn is moved laterally.

Generated output has 35,048 visible triangles, 4,125 collision solids and eight render groups. Positions/normals/colors/UVs decode into compact Float32Array buffers. All values are finite; all exported normals are unit length within 0.001. The importer is repeatable from the original PK3.

The map wrapper intentionally leaves health/pad design to integration. The main tower ladder lies aroundX3.5,Z−5.5 and rises from 0.56m to 14.5m. Original major usable stages are approximately 7.6m, 14.1m and 20.3m; a staged route is preferable to a single launch straight to the top. Other original ladder metadata identifies side maintenance connections and container access. Source ground spawns and original routes should remain relevant when selecting launch/landing positions.
