# Historical Pixel Forge and water restoration

The user requested map palettes designed for the existing filter. The art pass incorrectly changed that filter. This correction restores `dist/presentation.js` byte-for-byte from `c35d33218acd7a97f067634d9270b3345052dd4b`, including the world-space update introduced by `adc21707f90cea5ab664afb5d446bbe2e8aadc30` and the later water composition.

The historical GLSL helpers, 1.75-pixel grid, twelve-color lookup, world-space surface variation, edge treatment and water composite are frozen in a git-derived acceptance fixture. Both water handler modules already match that revision exactly. No map-specific output palette or adaptive actor edge branches remain. The later fence alpha-cutout mask correction remains; it does not change the shader function.

Native browser checks cover Beta Station north and Reservoir above/below water. Historical water remains translucent, depth-occluded and composed after the world filter. Original map geometry, authored material paint assignments and area graphics are retained. The fixed historical lookup changes their displayed colors; the earlier captures and gamut-preservation claims are superseded, not re-approved under this restored pipeline.

- [Prior altered filter](pixel-forge-before.jpg)
- [Restored world-space filter](pixel-forge-restored.jpg)
- [Restored water above surface](water-restored.jpg)

Validation: exact historical shader/helper/water identity; Pixel Forge settings, mask and AA ordering; all AA combinations; water movement, fog restoration, layering and render-state restoration; Shoot House art and 19-map geometry/material checks; static production release build/loading.

## Superseded output palette — 2026-11-05

The user reported the grey/rust flattening and explicitly chose to preserve unique map colours through Pixel Forge. The fixed twelve-colour output search is now replaced for authored maps with their existing world/sky ramps, using a single cached atlas lookup. The historical world-space grain, pixel size, rim treatment, actor protection and water composition remain unchanged; tests strip only the approved lookup addition before comparing with the historical fixture. See `../mobile-close-combat/README.md` for current evidence.
