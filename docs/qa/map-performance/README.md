# Map performance pass — 2026-11-05

All 20 active maps remain available. This pass reduces rendering work across the roster, with additional geometric and material reductions for the ten Call of Duty maps. The approved Pixel Forge final shader, source map archives, collision geometry, navigation and hit regions remain intact.

## Changes

- Dense COD maps use spatial material batches with camera frustum checks and conservative current-camera occlusion. Small maps avoid the batching overhead. Browsers without multi-draw retain the ordinary mesh path.
- The directional sun caches immutable architecture depth. Moving actors, lifts and props still cast live shadows into the same native shadow map. Light, projection and quality changes invalidate the cache.
- The main world pass also writes actor coverage, removing the usual second geometry pass for Pixel Forge. AO reconstructs from the existing world depth. TAA and unsupported custom materials retain the compatible fallback. Single-channel masks reduce attachment bandwidth.
- Repeated opaque character components use exact per-actor instances during rendering. Original meshes remain available for combat, limb state and ragdolls. Each actor retains its own culling bounds.
- COD surface bump maps become cached normal maps, and fine roughness noise becomes its mean roughness. This quiets non-gameplay surface detail and reduces fragment texture work without replacing the lighting model.
- Nearest-hit and visibility queries reduce their search range or stop when blocked. Touch targeting checks candidates in distance order. Fences retain alpha-aware hit behavior, and explosive penetration retains its required all-hit path.
- Shader warmup uses the actual world-pass materials. Cached maps retain their lighting profile after source buffers are released. All new GPU resources are disposed with their arena or renderer.
- A narrowly scoped Three.js depth-copy fast path avoids synchronous pixel-unpack state reads for full 2D depth copies, including Safari. Other texture copies retain the vendor path.

## COD visual detail

Only render indices are reduced. Original positions, collision and ray-test indices are retained separately. Fences, glass and light surfaces are excluded from simplification. Sidecars validate source identity, paint profile and exact source position/index hashes before use.

| Map | Original triangles | Visual triangles | Reduction |
| --- | ---: | ---: | ---: |
| rust | 31,219 | 25,720 | 17.6% |
| shipment | 150,889 | 92,146 | 38.9% |
| nuketown | 311,907 | 226,474 | 27.4% |
| killhouse | 135,855 | 106,587 | 21.5% |
| vacant | 626,291 | 405,908 | 35.2% |
| showdown | 342,549 | 248,608 | 27.4% |
| firingrange | 751,361 | 484,509 | 35.5% |
| hijacked | 275,813 | 193,271 | 29.9% |
| summit | 1,022,161 | 634,631 | 37.9% |
| shoothouse | 1,961,899 | 1,279,345 | 34.8% |

The simplifier uses a 2 cm absolute target, followed by a bidirectional coverage repair that restores unsupported thin surfaces. An independent test sampled approximately 1.65 million surface locations across the ten maps; all sampled distances were below 2.5 cm. This is sampled evidence, not a mathematical maximum-error guarantee. Original source archives are unchanged.

## Measured evidence

In a frozen native Chromium scene, enabling only the character batching reduced full-frame draw calls from **447 to 203 in Kill House** and **513 to 229 in Shoot House**. Render CPU medians improved by roughly 0.2–0.4 ms in paired runs; GPU times were essentially unchanged, as expected for the same triangles. Four actor poses, health colors and a missing limb produced image differences between zero and 0.00006 on a 0–255 channel scale. Raw results are adjacent JSON files.

The touch-targeting comparison selected exactly the same targets and distances across 64 camera rays per tested map, with regular and explosive target padding. Its measured query medians fell from 0.167 to 0.076 ms in Kill House and 0.117 to 0.094 ms in Shoot House. These isolated timings are not whole-frame FPS claims.

The native six-scene game benchmark was run sequentially before/after in desktop WebKit, with the regression suite stopped, a 932×430 touch viewport, DPR 3, 1398×645 render buffer and the normal mobile graphics preset. Each scene has three seconds of warmup and approximately four seconds of measured combat. Both runs completed without browser/GL errors. These short runs are noisy and include real combat effects; they demonstrate the remaining limit as well as the improvement.

| Scene | Before FPS | After FPS | Before p95 | After p95 |
| --- | ---: | ---: | ---: | ---: |
| reservoir / Crossfire | 59.7 | 59.8 | 20 ms | 21 ms |
| reservoir / Explosions | 60.0 | 60.0 | 19 ms | 19 ms |
| killhouse / Crossfire | 47.4 | 50.4 | 30 ms | 29 ms |
| killhouse / Explosions | 45.3 | 44.3 | 29 ms | 39 ms |
| shoothouse / Crossfire | 26.6 | 30.3 | 64 ms | 55 ms |
| shoothouse / Explosions | 19.5 | 21.0 | 86 ms | 71 ms |

**Shoot House is still below a smooth 60 FPS in this desktop WebKit stress test.** Kill House also does not sustain 60 FPS here, and its explosion-heavy result is effectively unchanged. The work is a substantial reduction in render submissions, not evidence that every map now meets the target device's standard. More invasive visual simplification, quality adaptation or further GPU profiling may be needed after a real-device capture. No map should be certified or deleted from these desktop numbers alone.

## Verification and reproduction

- Full `npm test` chain passed, including native map matches, navigation/lifts, combat, exact historical Pixel Forge fixtures and all six new performance suites.
- `tests/prepared-practice.mjs` additionally passed cached-map lighting and prepared loading checks.
- `tests/static-release.mjs` passed every production map and archive/part check.
- WebKit graphics checks passed Pixel Forge on/off, live intensity toggles, no/4× MSAA, FXAA, SMAA, TAA, AO and shadow quality/filter changes, with zero GL errors.
- Final production WebKit sweep passed all 20 maps, with zero page/console/GL errors. Shader, actor and map resources remain bounded through the full roster.
- `git diff --check` passed.

The production release contains 244 files, 242,272,505 bytes (231.05 MiB), below the existing 250 MiB budget. All 20 prepared maps load using production files alone. Authoring tools and original source copies are excluded from the release.

The in-game graphics benchmark now covers Reservoir, Kill House and Shoot House, each with ordinary crossfire and explosion-heavy scenes. This is the useful next device check on an iPhone 16 Pro Max. Desktop WebKit and a touch-sized viewport exercise Safari-compatible rendering but do not reproduce that phone's GPU, thermals or sustained frame pacing. No physical-iPhone performance guarantee is made by these results.

For authoring:

```sh
node tools/bake-map-detail.mjs rust shipment nuketown killhouse vacant showdown firingrange hijacked summit shoothouse
node tests/map-detail.mjs
npm test
node tools/build-static-release.mjs
node tests/static-release.mjs
```

`readSourceRender` defaults to exact authoring geometry; runtime loaders opt into the validated detail sidecars. The simplifier is vendored only in `tools/vendor`, with its Meshoptimizer MIT license. `research/map-performance` provides isolated render, actor-image and native benchmark fixtures; these are not shipped.

All 20 maps are retained. Phone testing should use the in-game graphics benchmark and inward-facing gameplay views, especially Kill House and Shoot House.
