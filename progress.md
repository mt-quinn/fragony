# Progress

Inspected existing AA controls, settings persistence, frame renderer and test harness.

Implemented 0/2/4× MSAA; FXAA/SMAA; experimental world-only TAA with depth reprojection; full graphics UI and native-resolution scale; independent effects presets and live appearance controls. Browser rendered 36 AA combinations with AO/bloom on/off without shader/WebGL errors. Allocation/settings tests pass all 144 combinations. Browser desktop settings persisted and effects presets preserved resolution/AA. Native six-scene benchmark running in isolated game child.

Errors resolved: mocked settings test needed distinct DOM controls; resize emits dispose events so lifecycle listeners moved after resize. Browser launch and local preview required authorized escalation. Legacy mobile test asserted quality changes pixel count; updated for independent resolution. Concurrent workspace cleanup removed prior viewport changes and test; continued against current repository without reintroducing them.

First full benchmark completed across three active maps with nonzero gunfire/effect counts and no browser errors. Phone cancellation check found the return path opened Controls instead of Graphics; fixed return to select Graphics. Warm-up increased to three seconds per scene to reduce initial shader/asset startup influence.

Final validation complete: 144 settings combinations; 36 actual HDR/non-HDR rendered combinations including weapon inspection; settings/mobile/controls/menu/presentation/feel/explosion/integration/audio-lifecycle tests passed. Full 20-map production package builds and all prepared maps load. Phone-sized six-scene benchmark completed at 1434×660 with 30–31 rifle rounds per measured scene and 40–185 peak effects; no browser errors. Both cancellation and completion preserved every existing local-storage entry except the new benchmark report. Graphics reset restores enabled AA and device defaults.

Publishing: merged the newer published iPhone viewport/fullscreen fix (828689f) with graphics work, preserving shared viewport measurements, display report and safe insets. Source helper initially refused outdated dirty checkout; changes preserved in a Git stash before fast-forward and explicit conflict resolution.

Mobile cleanup: removed three touch controls and saved layout entries, grenade binding/gear/physics/upgrades and benchmark throwables. Added once-only retired-gear refunds and v3 shop offers. Removed permanent volley/burst/manual text near reticle, renamed player-facing shot counts, touch streak prompts. Universal auto-fire passes all 24 stock/action configurations, including auto discharge and target-loss cancellation for charged launchers. Auto-jump tests pass 30/60/120/144Hz timing, contact/progress/direction filtering, full normal jump height and a 500ms logical held input.

Water follow-up implemented: obstruction while swimming triggers a 500ms held jump; native physics test clears a 1.3m bank with no jump button. Full suite reached integration after earlier tests passed; obsolete grenade-count assertion updated to assert the removed state is absent. Browser smoke script needed a precise selector for the guide button because its visible arrow participates in its accessible name.

Final browser validation passes at 956×440/3×: removed controls, full jump height, ≥500ms held input, water-bank exit, all weapon families including charged rockets and “TAP STREAK”; no browser errors. Full regressions passed through the final water test, whose old renderer mock lacked the world-texture uniform added by the prior graphics update; updated that fixture and verified it separately. Unrelated shader lab files are excluded via an isolated release checkout.

Published mobile cleanup successfully at https://dead-heat.the-game-ban-7336.chatgpt.site using commit 4651485b7a6913d40d730c402a923776bb4ea08f; production package passed all 20 prepared-map checks. Unrelated shader work remains in the workspace and was excluded from publication.

Started approved shop implementation. Working tree clean. Read existing catalog, result navigation, shop generation and transaction tests. Plan: retain real purchase functions, add explicit offer selection and kit subview, and route surviving scoreboard solely to the separate shop.

Implemented offer selection, two-gun bays / 3–6 gun strip, all-stock supplies, selected purchase dock, owned-kit subview, clear streak copy and surviving-scoreboard single exit into shop. Shop and mobile menu transaction tests pass; new round-shop test verifies progression, stock, saved-run restoration and complete copy. Preparing browser visual and full-flow checks.

Full npm test suite passed through final water renderer/gameplay tests. All 12 actual-browser layouts and purchase/free-swap/progression paths passed. Added npm run build and Vercel static configuration; production package builds successfully. Final map-only release checks and GitHub push remain.

Production verification passed: all 20 prepared maps load using build files alone; exact runtime archives and navigation preserved. Source diff has no whitespace errors. Preparing normal initial push to mt-quinn/fragony main with the approved shop and Vercel build configuration.

GitHub publication completed: normal initial push of main to https://github.com/mt-quinn/fragony.git succeeded, preserving the existing game history. Implementation commit: 7ad42c0. Full npm test suite, 20-map production checks and browser shop flow/layout checks passed. Vercel import configuration is included; no ChatGPT Sites publication or Vercel deployment was performed.
