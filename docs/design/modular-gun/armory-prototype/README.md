# Armory

A playable presentation of the modular gun shop and equipment screen. Serve the project directory and open this folder's `index.html`. It uses the project's Three.js and Pixel Forge renderer. It does not read or change a saved game. Fight opens a loadout summary; combat integration is separate.

## Use

The first offer is previewed on entry. Select another offer to inspect it on the gun and compare it with the equipped build. Show equipped switches the gun view without changing the selection. Take and equip uses the round's single pick and makes Fight available.

The pick remains reversible until Fight. Undo choice restores the prior fitted part. Selecting another offer presents Replace choice, which removes the previous provisional acquisition before adding the new one. Later free equipment changes survive replacement.

Select a fitted part to browse owned attachments for that slot. Equip fits an owned part freely. Round choices returns to the draft. Equal or lower owned rarities are excluded, and a rarer copy replaces the older copy in the collection.

Hold Test fire to try the selected build's actual firing sequence, magazine and reload. Charge starts ready and does not decay while idle. Drag the gun to inspect it; arrow keys also rotate it. The offer selector supports arrow keys, and Escape returns from owned parts or the round summary. Sound can be muted, and that preference is remembered locally.

The normal scene has three offers. `?scene=tokens` demonstrates two collected tokens and five offers. `?scene=maxed` demonstrates the complete Legendary collection, where Fight remains available without an upgrade. `?scene=review` exposes the entire catalog for visual checks.

## Presentation

One cast housing contains the gun chamber, four fitted-part keys, an open attachment drawer and a comparison instrument. The chamber has returned edges, a slim work light, a perforated bed, and supports positioned from the gun's projected contact points. Enamel key caps depress on input. Selected parts lift out of their cradles. Changed gun modules seat into their mounts. Rarity appears in both readable labels and physical indicators.

The gun, loose parts and housing share a procedural material environment. The gun has softened edges, vents, latches, contact shadows, ammunition markings and a distinct circuit face. Every loose attachment has an authored model, including separate mechanisms, actual barrel assemblies, ammunition types and circuit symbols.

The Bouncers informed the continuous construction and upright oblique projection. Its assets are not reused.

## Text

Barlow Condensed provides clear part names and compact numerical values; Barlow carries explanations and supporting labels. All font files and their SIL license are bundled locally. Names remain complete, including Semi-automatic fire and Slow-time recovery. A long name receives space rather than an abbreviation.

Effects use plain sentences. Comparisons align current values, arrows and preview values, with tabular figures and explicit screen-reader labels. Gains and costs use different colors. Rarity is written on every offer. No slogans, token accounting sentences, invented gun names or explanatory marketing copy appear in the screen.

Landscape phones keep acquisition and Fight keys in fixed positions on the right. Portrait moves fitted parts into a row and gives the explanation the screen's full width. Targets are at least 44 pixels. Reduced-motion preferences remove seating and key-travel animation.

## Rendering and lifecycle

The interface uses one WebGL context. Static chrome is merged by material and cached after the actual FrameRenderer / Pixel Forge pass. Gun components are merged separately so attachment and barrel movement remains possible. Scrolling translates the existing drawer batches rather than rebuilding the machine or reallocating its clipping materials. Gun testing reuses the cached background; an observed default firing frame used 46 draw calls in the browser. This is a development observation, not a real-device frame-rate measurement.

The scene stops submitting frames while idle and suspends rendering/audio while hidden. Resources are released on exit, the gun's environment is rebuilt after WebGL restoration, and the SVG/DOM controls remain available as a fallback if WebGL is unavailable. The round summary moves keyboard focus and makes underlying controls inert.

## Verification

Run `node docs/design/modular-gun/armory-prototype/verify.mjs` from the project directory. The 17 checks cover provisional acquisition, replacement, undo, rarity replacement, free equipment, invalid selections, charge retention, burst/duplex completion, magazine exhaustion and reload recovery. The firing checks also exercise 480 physical build/tier combinations.

Browser checks covered all 25 attachments at 956×440, 667×375, 568×320 and 390×844, checking description/offer overlap and value overflow. Additional long-name checks at 320×768 passed with reduced motion and no targets below 44 pixels. Acquisition, replacement, undo, comparison, free equipment, firing, reload and Fight were exercised in the live UI. A misplaced footer hit area found during verification was corrected and the complete acquisition flow was retested.

Screenshots and layout results are in `qa/`. Actual low-end phone performance and integration into the combat loop remain to be verified during implementation of the runtime shop.
