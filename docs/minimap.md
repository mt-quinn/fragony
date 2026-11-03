# Local minimap

The circular minimap follows the player and shows a fixed **26 m radius**. The player is always centered, with facing up by default. **Settings → Minimap → Lock minimap north** keeps north up and rotates the player arrow instead. The N mark stays aligned with world -Z in both modes.

The overview is drawn from horizontal cross-sections of actual collision geometry. Rotated walls, convex BSP bevels, pillars, ramps, stairs, platforms, water, health pickups, jump pads, and lifts are represented. The visible map level follows the supporting floor, so jumping doesn't erase the map or expose an unrelated upper floor. Overhead roofs do not cover passages below. Blips above/below the player have a small elevation chevron.

An actual enemy gun discharge records its position; charging, hearing, damage, and mere visibility do not reveal a bot. A red circle holds at that firing position for one second, then fades over 0.55 seconds. Repeated shots refresh that enemy's single blip. This reveals last firing positions without continuously tracking unseen enemies through walls. Reveals age in gameplay time independently of slow motion, freeze while paused, and clear on match/arena transitions.

Out-of-range discharges show red directional rim chevrons with a dark contrast outline. Nearby directions merge into a counted indicator. Clustering handles the circular bearing seam and preserves every active enemy, and final groups have at least 0.29 radians of angular separation. Each firing position contributes once, even during automatic fire. Group opacity follows its most recent remaining member.

Desktop settings provide **Show minimap**, **Lock minimap north**, and **Minimap scale (50–200%)**. Scaling changes the entire module and marker sizes; it never changes the world radius. The standings move beside the minimap and reclaim that space when it is hidden. Overall HUD scale continues to work.

On mobile, the passive minimap module belongs to each existing HUD preset. Edit HUD supports drag/nudge, size, opacity, hide, reset, save, and cancel. It cannot steal fire or movement contacts; swipes pass through it during normal play. Maximum size is constrained to the safe area. North lock and visibility are also available in the Visuals settings. Desktop map scale does not override the mobile editor.

`dist/minimap.js` owns transforms, collision slicing, a bounded 16-level raster cache, shot history, circular grouping, and Canvas rendering. The canvas backing resolution follows the displayed size up to a 640 px cap; resizing reuses the terrain cache. No additional WebGL render pass or asset request is needed.

Validation: `tests/minimap.mjs` covers heading/north transforms, translated coordinates, precise reveal lifetime/refresh/reset, frozen positions, 150 dense signals and wrap-around clustering, rotated and sloped geometry, 129 spawn elevations across all seven maps, scale-independent range, supported-floor selection, mobile bounds, saved settings, and actual native enemy discharge. Full npm test passed. Browser QA verified desktop settings and real gameplay, plus landscape mobile gameplay and a saved resize/reposition through the actual HUD editor, with no browser errors observed.
