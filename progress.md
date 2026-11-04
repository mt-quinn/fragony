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

Started attachment payoff audit. No gameplay changes authorized; inspect current firing/payload/loading/feedback and compare stock against conversions for discussion.

2026-11-04: Began full-map stair audit. Existing synthetic tests and prior source sampling are insufficient for reported Summit stairs. No gameplay edits yet.

Attachment/holistic balance audit complete: reviewed live catalog, actual trigger/feed/payload and feedback paths, bot targeting/progression/loadout behavior, scoring/currency, slow motion, pickups and streaks. Ran ideal health sweep across75/80/85/90/100/112/126/140HP plus native explosive auto-fire, Airstrike health thresholds/streak recursion, overheal-cap and simultaneous incoming damage checks. Results distinguish direct implementation/tuning findings from feel/playtest hypotheses. No gameplay edits or publication.
Implemented earliest-impact stepping and native Summit signed-plane recovery. Existing synthetic stairs, collision trajectories and triangle collision regressions pass. Running all-map visible-tread discovery and rebuilding Summit navigation from corrected geometry.

2026-11-04 balance proposal completed for discussion. User normalization constraint incorporated: base100 health presentation for both actors, victim-relative damage/healing/assist accounting and fixed kill rewards. Researched primary developer sources; specified all6 stocks,18 actions,18 ammunition,18 feeds, incoming attack reservations, sustain/perks/streak economy and phased validation. Analytical96-combination and12-normalization checks pass; actual combat implementation/human testing not claimed. Concurrent map/stair work preserved.

All 20-map visual stair discovery completed: 89 native routes, 40 reviewed non-stair candidates, 2,136 applicable directional walks, zero unresolved discovered stair/approach failures. The 89 fixed-route regression performs 534 no-jump walks at 30/60/144Hz, with body clearance and no overlap recovery. Shared synthetic stairs and native seam regressions pass. Source signed-plane and six-fragment rotated-clearance tests pass. Both repaired maps pass supported resources, all spawn routes, full trigger-disc pad trajectories and full native short combat matches. Browser inspection confirmed actual stair shapes and pallet false positives. Full gameplay suite initially hit a transient loadout assertion; unchanged focused rerun passed, and the suite is continuing from that point. Production release built within size guard; production-only loading checks in progress.

Release verification complete: 216 files / 252,978,662 bytes, all 20 maps load from production files alone. All source arenas, native short matches, EF lifts/falls, Hijacked lifts, and imported full combat checks pass. First broad suite interrupted at a loadout assertion; unchanged rerun and resumed suite passed that test.
Final resumed gameplay suite completed successfully through Reservoir, Nailer, tool weapons and water. Stair audit and local repair complete; no remaining required checks.

Balance implementation checkpoint: shared 200/90 internal durability with base100 presentation; all stocks/actions/ammunition/feeds updated, Frangible keeps stock spread and damage from18m; health-cap bug, committed bursts and explosive acquisition fixed; attack reservations per victim, bounded reaction ramp, sustain/streak/economy/perk cap integrated. Native96-combination regression passes, max175.5internal/87.75display incoming fixed sequence. Broader regressions running; old hard-coded numbers need deliberate updates. First local server launch required local-listen permission; isolated preview43197 avoids a cached unrelated service worker on4178. Concurrent staircase task committed2eb3228 independently; preserved.

Balance phases1–3 complete. Native payload and incoming safety checks, Frangible parity, normalized HUD/recap/healing/assists, perk migration, bot shopping and attack scheduling, delayed nonrecursive streaks, mobile auto-fire with actual detonation opportunities, committed bursts and role feedback implemented. Browser verifies five-gun full-stock mobile shop, free two-perk swaps, saved loadout→next round, 100display HP, and scoreboard sole Continue to Shop. Retired numerical assertions updated to approved rules; source collection tests explicitly injure actors because full-health overhealing is intentionally removed. Production build and final full-suite results pending.

Final balance verification:64/64 regression commands pass. Native safety/Frangible/mobile combat checks rerun after final copy/defensive cleanup; production build218files/252990037bytes before final tiny code cleanup, no temporary QA fixture. Static release checks load all20maps from production alone. Full details in docs/qa/balance-2026-11-04.md. Prepare scoped GitHub push under the user's existing publication instruction.


## Settings overhaul — 2026-11-04
Implemented approved shared settings workspace and maintained existing preference storage/runtime paths. Focused settings and binding checks passed; all unrelated gameplay suite commands passed. Updated obsolete old-layout assertions and reran both successfully. Browser verified phone/desktop flow and found/fixed focused-button keyboard capture. Temporary QA fixtures removed before final release build.

Final validation: all 65 test commands passed across broad/focused runs; clean 220-file static release built and all 20 production maps loaded. No temporary QA fixtures included. Physical touch and motion permission checks remain device testing.
