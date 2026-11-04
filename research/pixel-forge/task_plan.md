# Pixel Forge production integration — complete
- Fixed approved 0.5× environment treatment, clean-character depth-tested mask, clean viewmodels/HUD — complete.
- Persistent shared desktop/mobile toggle/default on and 0–100% intensity/default 100 — complete.
- Main-menu environment uses same effect and settings; menu character/weapon excluded — complete.
- All antialiasing precedes Pixel Forge, including optional FXAA/SMAA — complete.
- Settings migration, live binding, mask state/lifecycle, AA ordering/allocation, menu and game browser review — complete.

Validation: full npm test run passed every preceding suite and reached the final water fixture, which needed the new renderer uniforms added to its hand-built stub; that fixture was updated and water passed. Final changed areas rechecked with pixel-forge, antialias (144 combinations), menu-stage, water, graphics, presentation; all passed. Browser: refreshed stale cached renderer, verified menu/gameplay and FXAA, slider at 50% then 100%, toggle persistence across reload; no new runtime/shader errors after refreshing modules. Existing antialiasing preference restored. No hosting publication performed; updated game is available on existing local server.
