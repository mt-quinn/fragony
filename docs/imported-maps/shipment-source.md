# Stock Shipment source conversion

The existing `shipment` identity now uses the editable **Shipment (Map Source)** recovery distributed by Stendby, credited to Infinity Ward with Hugo/xoxor4d. It replaces the expanded **Shipment2** custom map by Carcass26. [Source package](https://customapscod.com/mod.php?id=ODE%3D), `mp_shipment_map_source.rar`.

The importer reads actual Radiant `iwmap 4` brush planes and mesh grids, recursively applies prefab transforms, and retains all eight source DM starts. It does not derive the layout from pictures. Source coordinates transform as `[x/32,(z−192)/32,(80−y)/32]`. Source material names determine new material roles, never original texture pixels. Nested container geometry, open passages, perimeter walls/fences, terrain and available rigid cover models retain their source shapes.

Original source art, scripts, audio, objectives, distant scenery and small loose decorations are omitted. The source archive depends on several stock SDK models absent from the archive. Available rigid models are recovered independently from the previously supplied Shipment2 fastfile; only their local model meshes are reused, never that map’s layout. Missing models such as `ch_crate32x48` are recorded explicitly in generated metadata rather than replaced with invented geometry. This is a community source recovery, not a claim that every source triangle or prop is identical to an official studio source release.

Physical source brushes retain convex halfspaces. `weaponClip` and `nonColliding` flags do not become player obstacles. Source terrain uses thin inward collision prisms. Source spawn foot projection uses the actual 0.4 m standing footprint. Navigation includes exact ground-zero surfaces and physically checked walk-off/drop landings. There are no added jump pads.

The rectangular source crop is `x[−848,848],y[−784,944],z[160,700]`; a second render cut uses the reachable source navigation footprint plus one 2 m boundary cell, retaining the perimeter while removing exterior scenery. No playable surface is simplified. Shared industrial materials, cargo district signage, quiet grain, muted container variants and the game’s lighting/AO replace the original art. Indexed Float32 storage preserves imported geometry values.

Rebuild from the project directory:

```sh
python3 tools/extract-iw3-model-library.py /path/to/mp_shipment2.ff
python3 tools/import-radiant.py shipment
node tools/bake-imported-nav.mjs shipment
node tools/export-playable-footprint.mjs shipment
# After changing the footprint, regenerate geometry and its navigation cache.
node tests/radiant-maps.mjs
```

Unpack the source archive into `../reference-maps/shipment-source`; source fingerprints, included inputs, omissions and conversion counts are recorded in `SHIPMENT_SOURCE.source`. The legacy `tools/import-shipment.py` extracts Shipment2 and is retained solely as the binary-format implementation used by the rigid-model library extractor. It must not be used to regenerate the current Shipment layout.

Radiant terrain uses the explicit vertex grid and its per-cell turned-edge flag, while `curve` patches use quadratic Bezier evaluation. These are distinct source primitive types. The distinction and terrain winding were checked against [IW3xo Radiant’s terrain collision implementation](https://github.com/xoxor4d/iw3xo-radiant/blob/master/src/components/modules/physx_impl.cpp).

## Final verification

The final asset contains 145,523 visible triangles and 996 collision solids/prisms. Cached navigation has 1,807 nodes and 25,847 edges; all64 source-start pairs connect. All eight starts pass actual standing clearance and floor-contact checks. The seeded 90-second native combat check completed with 454 shots and 20 health collections. Desktop and 844×390 touch practice entry/map switching were inspected in the actual game.
