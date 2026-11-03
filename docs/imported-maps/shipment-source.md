# Shipment source conversion

The supplied asset is **Shipment2**, a CoD4 multiplayer custom map by **Carcass26**, version1.0. Its supplied readme identifies that title/author and supports DM/TDM/Sabotage/Domination/OldSchool. It is imported directly from that supplied version, rather than represented as an exact copy of some other Shipment release.

Input: `mp_shipment2.ff`, SHA256 `5617d0bddaa7d72577fbc0097d33f8875d333936702da8610e1fed47760fa4e4`. Header is `IWffu100`, version5, zlib stream atbyte12; decompressed payload is49,953,530bytes. The accompanying IWD contains a custom decal, loading image, minimap, CSV and arena metadata; it has no BSP. No original textures, shaders, sounds, game scripts, weapon assets, character models, loading screens or minimap art are included in the generated game assets.

The converter is deliberately fingerprint-checked for this exact supplied file. It reads original compiled coordinates and indices, not screenshots or hand-authored substitute shapes. Geometry uses an axis rotation and exact power-of-two scale: `[(sourceX−96)/32, sourceZ/32, (48−sourceY)/32]`. Original entities and spawn transforms remain available as audit metadata. Gameplay projects the22 original DM spawn positions onto a standing-body footprint without changing their horizontal positions.

## Verified binary records

| Record | Payload offset | Source count |
|---|---:|---:|
| GfxWorld | `0xae31be` |1 |
| World indices | `0xae34a7` |85,863 uint16 |
| GfxWorldVertex | `0x10360e0` |39,990 ×44bytes |
| GfxSurface | `0x122f251` |1,610 ×48bytes |
| Gfx static-model placements | `0x1242031` |1,377 ×76bytes |
| clipMap | `0x125b901` |1 |
| Collision planes | `0xcad800` |2,710 ×20bytes |
| MapEnts | `0x13239c1` |27,106 entity-string bytes |

Every world surface keeps its original `firstVertex`, local triangle indices and original position stream. Its62 material names are recovered through the original MaterialMemory pointer aliases. Packed normals are decoded using IW3's scale-based unit-vector representation. Necessary in-play props retain their original compiled highest-detail XModel LOD meshes and exact placed transforms. Shared vertex/index buffers are resolved through their original stream-block aliases. All retained model vertices were checked against their original compiled model bounds.

## Playable area and omissions

Original player-clip boundaries establish approximately sourceX[−1024,1208], sourceY[−1200,1296]. Exact boundary brushes remain in place. Cosmetic crop is sourceX[−1152,1344], sourceY[−1328,1424], sourceZ[−64,896], preserving perimeter-defining walls/fences while discarding distant buildings and surrounding landscape. Triangles crossing the outside crop are clipped there; interior coordinates stay unchanged.

Scenery and nonstructural art are explicitly omitted: distant apartments/vehicles/trees/cranes, grass clumps, loose litter, small bottles, original text/decal planes, and repetitive container locking-bar detail. Main containers, doors, interiors, stacked roofs, cover props, boundary panels, native lanes and native collision surfaces are retained. These omissions are counted in `SHIPMENT_SOURCE.source.omitted`; retained model types/counts are recorded alongside them.

Collision preserves native convex brush bounds and planes. CONTENTS_PLAYERCLIP is movement-only and does not become an invisible projectile wall. Native collision triangle materials are recovered through CollisionPartition/CollisionAabbTree; nonmovement decal collision is filtered. Triangle surfaces use inward thin prisms with redundant axial bounds for the upright-body collision solver. The original collision triangles are retained separately for audits.

## Format references

Format research used original project source, at OpenAssetTools commit `63e6d57b9c1866ba0ac8b3e7b134d0652c2be44c`:

- [IW3 asset structures](https://github.com/Laupetin/OpenAssetTools/blob/63e6d57b9c1866ba0ac8b3e7b134d0652c2be44c/src/Common/Game/IW3/IW3_Assets.h)
- [GfxWorld serialization rules](https://github.com/Laupetin/OpenAssetTools/blob/63e6d57b9c1866ba0ac8b3e7b134d0652c2be44c/src/ZoneCode/Game/IW3/XAssets/GfxWorld.txt)
- [clipMap serialization rules](https://github.com/Laupetin/OpenAssetTools/blob/63e6d57b9c1866ba0ac8b3e7b134d0652c2be44c/src/ZoneCode/Game/IW3/XAssets/clipMap_t.txt)
- [XModel serialization rules](https://github.com/Laupetin/OpenAssetTools/blob/63e6d57b9c1866ba0ac8b3e7b134d0652c2be44c/src/ZoneCode/Game/IW3/XAssets/XModel.txt)
- [Packed-vector decoding](https://github.com/Laupetin/OpenAssetTools/blob/63e6d57b9c1866ba0ac8b3e7b134d0652c2be44c/src/Common/Utils/Pack.cpp)

No OpenAssetTools implementation code is distributed with the game; the Python converter implements the required binary reads independently from those format definitions.

## Final asset checks

The final generated asset has85,857 render triangles in60 material groups,114 retained prop placements,4,136 movement brushes/prisms, and22 DM spawns. All22 spawns pass a0.4m-radius,1.9m standing-body clearance test at their copied horizontal coordinates. All49 retained barrel instances were individually checked against their **original compiled convex movement clip hulls**; dumpster, wrecked-car and pallet examples likewise intersect their native `clip_nosight*` brushes. Therefore detailed XModel triangle meshes are not redundantly added to player movement: doing that would change the original movement representation and add thousands of unnecessary collision objects. Original XModel collision coefficients, bounds, contents and offsets are retained in `sourceModelCollision` for audit or future projectile-specific use.

The final12 collision brushes (source1859–1870) belong to local objective/entity submodels and are excluded from global world collision. GfxBrushModels1–10 have zero render surfaces, so they introduce no corresponding local render geometry. Original movement collision partitions also identify32 nonmovement decal triangles; those do not become physical obstacles.

`tools/import-shipment.py` can regenerate the asset without OpenAssetTools or scratch research files. It requires only Python's standard library and the exact fingerprinted user-supplied fastfile. Source geometry is encoded as base64 Float32 streams for lower parsing cost on mobile; JSON metadata retains original provenance.
