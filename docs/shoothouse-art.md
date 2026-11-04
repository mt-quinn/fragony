# Shoot House paint direction

Approved palette: petrol `#347C79`, fired clay `#B96C60`, mulberry `#76546F`, limestone `#C5B69B`, blue slate `#526776`, ink `#24343D`. Each has a three-step output ramp in `dist/shoothouse-art.js`. The approved color-study sky has a separate lookup and remains unchanged. Bright green/yellow/orange/red are reserved for living character health.

| Architectural area | Primary | Accent |
| --- | --- | --- |
| Range Control / elevated office assembly | Petrol | Limestone |
| Recovery yard | Fired clay | Petrol |
| Cargo range / complete range-house assembly | Limestone | Fired clay |
| North entry | Mulberry | Limestone |
| South entry | Limestone | Mulberry |
| Main firing lane | Petrol | Limestone |

Area membership is assigned once per original source object, using complete assembly footprints. Generic Unity material-combined batches are first split into connected assemblies. This replaces the old district cut planes in Shoot House. Walkable ground is independent slate; frames, cover boards and container doors distribute accent colors. Original source wall surfaces carry lower bands and restrained repeated marks, so graphics cannot bridge doors/windows or change collision. Quiet matte ground, reduced bump/grain, and depth-based corner cues preserve readable architecture without requiring ambient occlusion.

The offline source sidecar records source ownership for 99.69% of triangles. Unmatched cropped/imported fragments use the lane finish; they account for 0.31% of triangle count. No ownership data or raw authoring geometry is loaded by the production game. The prepared bake preserves the source surface coverage (0.000001% area rounding difference) and uses 142 spatial/material batches. Physical collision and navigation are unchanged.

Character materials retain the existing 21 health steps. A narrow adaptive light/dark edge stays inside the visible, depth-tested actor mask, respects cover and chain-link cutouts, and excludes the first-person gun. Rendering and atmosphere are selected by map and restored on map switches. All other maps retain their previous palette and lighting.

## Rebuild

1. `python3 tools/recover-shoothouse-objects.py` (requires the local extracted Shoot House source; automatically splits material-combined batches).
2. `node --max-old-space-size=12000 tools/bake-source-render.mjs shoothouse`
3. `node tools/chunk-source-archives.mjs`
4. `npm run build`

Review: run `python3 tools/serve-art-review.py` and open the printed URL. This local server disables caching so edited modules and map archives cannot appear stale. This page imports the actual production materials, baked map and renderer; it has no recoloring or shader overrides. Camera presets include both interiors and entries; the health slider/sweep exercises production health hues. Unfiltered bypasses Pixel Forge to inspect the underlying materials.

Validation: `node tests/shoothouse-art.mjs`, `node tests/industrial-source-surfaces.mjs shoothouse`, Pixel Forge/presentation/industrial/material/surface cleanup and menu regression tests, plus `node tests/static-release.mjs`.
