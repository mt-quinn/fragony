# Mobile reload, melee and map colours — 2026-11-05

## Behaviour

Mobile guns reload after a continuous period without targeting an enemy equal to twice the current reload duration. Attachments, coupled-magazine phase, individual-round loading and reload perks use the same timing function as the reload itself. New target acquisition, weapon switching and resumed gameplay start a fresh quiet window. Full magazines and passive-recovery feeds do not trigger needless reloads. Empty guns keep their immediate reload. The reload touch control is removed from both gameplay and layout editing, including older saved layouts; desktop manual reload remains available.

Melee uses V on desktop (rebindable under Controls → Combat), a 2-metre reticle-to-surface reach and a 0.5-second cooldown. Mobile automatically repeats while aiming directly at a live enemy in reach, in either firing mode. Close melee takes priority over gunfire, interrupts an active reload/charge, and uses a short weapon strike animation and sound. Each hit deals exactly 50% of the enemy’s maximum health, including armored maxima, with no headshot multiplier. Solid cover, aim loss, death and pause prevent hits. Kill scoring, assists and health feedback use the normal combat pipeline.

## Colour correction

The optimization commit did not remove authored paints or zone assignments. Commit `2b09b23`, before the optimization pass, restored the historical fixed twelve-colour output palette and flattened their visible hues. The user explicitly approved preserving the unique map colours instead.

`map-palette-lookup.js` builds the existing per-map world and sky ramps into one 2 MiB, nearest-filtered atlas per renderer. This replaces the fixed colour search only for authored maps; the world-space grain, 1.75-pixel scale, rim darkening, clean actors and water composition remain historical. The atlas is generated at map preparation, reused every frame and bounded across all map transitions. An unskinned scene retains the legacy palette. No source map geometry or authored paint assignments are rebaked.

- [Kill House: amber and ink-blue bays](killhouse-colours.jpg)
- [Nuketown: flamingo and pool enamel](nuketown-colours.jpg)

## Verification

- `tests/close-combat.mjs`: exact percent damage, armored targets, range/cover, cooldown, repeat aim/loss, rebindings/save conflicts, firing/reload interruption, both mobile firing modes and every stock/action reload timing with perks/feed phases.
- Native mobile WebKit and desktop Chromium checks: two melee hits, unchanged ammunition, desktop V, mobile quiet reload, no reload control and no browser/GL errors. Raw results: `native-controls.json`.
- Palette regression: all20 world gamuts contain only authored swatches, exact swatches survive, nearest filtering, no per-frame rebuild, one bounded texture, fallback and disposal.
- Historical filter-core and water fixtures still match after stripping only the approved colour lookup replacement.
- Production WebKit map sweep: all20 maps render with zero browser/GL errors. Raw results: `map-colours-webkit.json`.
- Safari graphics toggles passed Pixel Forge on/off, no/4× MSAA, FXAA, SMAA, TAA, high AO and shadow quality/filter changes, with zero browser/GL errors.
- Full `npm test` passed, including the new close-combat and palette suites, native matches across the roster, movement, damage, reloads, navigation/lifts and rendering regressions.
- Production package checks passed for all20 maps; final build245 files /242,279,054 bytes, below250MiB. `git diff --check` passed.
