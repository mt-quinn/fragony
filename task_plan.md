# Antialiasing comparisons

Goal: independent saved AA controls on desktop and mobile, at fixed resolution.

1. Inspect rendering and matching Three.js addons — complete.
2. Implement MSAA, FXAA, SMAA and experimental temporal resolve; full graphics settings and benchmark — complete.
3. Verify combinations, rendering, resize, resets, benchmark save preservation and disposal; document limitations — complete.

Preserve existing workspace changes. Default stays 2× MSAA; only explicit settings disable AA.
Errors: referenced optional skill rule filename does not exist; use SKILL.md and available rule files.

Network fetch initially denied by restricted DNS; authorized download succeeded using escalation.

User added independent render resolution. Keep quality as effects quality (shadows, bloom, AO); remove pixel/ratio caps from presets. Resolution percentage controls native width/height and persists across quality changes.

Expanded by user: full graphics controls plus brief built-in benchmark over three maps and six native gameplay/effects scenes. Implement isolated benchmark child to preserve parent game state.

Completed: full graphics controls; independent resolution/effects/AA; six native benchmark scenes; saved reports/download; desktop/phone browser validation, save/cancel preservation and production packaging verified.

# Mobile movement and combat cleanup

1. Inspect reticle labels, touch controls, collision movement, gear/shop/save paths — complete.
2. Add sustained-obstruction auto-jump and held water exit; remove permanent reticle labels/throwables; universal mobile auto-fire and vocabulary — complete.
3. Test movement edge cases and saved-run/shop migration, review browser UI and full gameplay, build and publish existing Site — complete.

Preserve desktop jump/crouch and gun-fired rockets/explosive ammunition. Mobile auto-jump uses the full existing jump impulse. Remove grenade mechanics from benchmark too.

Additional user instruction: every weapon must support mobile automatic fire. Remove rocket acquisition exemption; charged launchers automatically discharge at full charge in auto-fire mode, cancel on target loss, retain explicit manual fire option.

Jump steering: automatic jumps hold the logical jump input for at least 500ms, including when blocked in water, so swimming uses sustained upward input to exit onto banks.

# Approved between-round shop implementation

Goal: implement the approved silhouette-led, single-screen shop and scoreboard → shop → next-round flow.
1. Inspect shop transactions, saved progression, layouts and result navigation — complete.
2. Implement effect-first copy, all-offer board, selected purchase dock, owned-kit view and mandatory shop progression — complete.
3. Verify real purchases/replacements/save restore, 2–6 weapons, depleted stock, desktop and landscape touch layouts; run regressions — complete.
4. Verify prepared production package, commit and push to the user’s GitHub repository — complete.
Preserve the existing Arsenal/practice catalog and all transaction rules. Preserve unrelated workspace changes. A surviving scoreboard has one forward action into the shop; terminal run-over behavior stays distinct.

User requested publication destination change: push the completed repository to https://github.com/mt-quinn/fragony.git; do not publish via ChatGPT Sites. GitHub repository is empty, public, main branch, and current account has push permission. No local remote exists yet. Largest tracked asset is 26.54 MB; no historical blob exceeds 90 MB. Preserve history with a normal initial push, never force-push. Include static-release build settings for their planned Vercel import; do not deploy to Vercel.

# Attachment execution/payoff audit

Read-only gameplay audit requested for discussion; do not rebalance or publish changes.
1. Compare approved intent with live catalog, firing, payloads and feed/handling behavior — complete.
2. Check feedback and mobile interactions; run focused stock/attachment comparisons — complete.
3. Explain evidenced causes, distinguish tuning vs implementation vs feedback, and prioritize improvements — complete.

Expanded by user: evaluate game balance holistically; all existing values are provisional. Include bot/player health, effective lethality, enemy behavior, healing, slow motion, streak chains, scoring/currency, progression and encounter structure. Still an evaluation/discussion, no unrequested tuning or publication.

# All-map no-jump staircase audit (2026-11-04)
1. Reproduce Summit and inspect collision independent of existing navigation — in progress.
2. Repair shared movement or imported collision with preserved walls/rails/headroom — pending.
3. Audit every map, add native regressions, run collision/gameplay checks and build — pending.
Preserve existing planning changes. Staircases must walk both directions without jump input.

# Research-backed definitive balance design

User rejected a vague recommendation and requested a researched, concrete path forward. Research primary FPS design sources, choose a coherent combat/health/weapon baseline, define all attachment families and bot safety, integrate sustain/economy/progression, validate numerical consistency, and deliver an implementation sequence plus acceptance criteria. No gameplay tuning/push authorized by this discussion. Concurrent collision/map edits belong to another task and must be preserved.
Stair audit progress: Summit root cause reproduced independently of nav; importer/source/prepared plane repair and shared earliest-riser stepping implemented. Rebuilt Summit navigation successfully: 11,412 nodes, all 256 spawn routes, no bake issues. Full visible-tread discovery and native regressions in progress. Existing wall/headroom/high-speed collision checks pass. Initial search ran outside the nested Git repository and one optional runtime file was absent; resolved by using dead-heat as project root and reading actual source-data/source-arenas modules.

Balance research COMPLETE — 2026-11-04. Primary Halo/Bungie/Valve/Riot design sources reviewed; explicit 200-player/90-bot internal baseline, both displayed on a base-100 scale, full action/ammunition/feed proposal and enemy coordination rules defined. Analytical proposal model checks all 96 action/ammunition combinations (max full fixed sequence 175.5 internal / 87.75 player display health) plus 12 health/damage/healing normalization cases. No runtime balance edits, commit, push or deployment. Deliver proposal for discussion; human playtesting remains required.

Stair audit completion: reproduction, shared movement repair, Summit signed native plane repair, Firing Range corridor subtraction, and both navigation rebuilds — complete. Independent 20-map discovery, 89 native route fixtures / 534 fixed-route no-jump walks, source-import checks, browser review, and production-only 20-map build verification — complete. Broad gameplay suite passed through all native full-map combat matches; final Reservoir/weapon/water checks finishing. A transient loadout assertion passed on unchanged focused rerun and resumed suite. Local preview was stopped and temporary debug files removed.
Final gameplay checks completed: Reservoir match/traversal, Nailer, tool weapons and water all pass. All three staircase-audit phases are complete. Changes remain in the local workspace; no publication requested or performed.

# Implement approved holistic balance — 2026-11-04
User approved the concrete balance proposal, with Frangible retaining normal Rattler accuracy and medium-range damage. Implement gameplay and 100-point presentation, shared weapon conversions, bot attack coordination, sustain/streak/perk/economy changes and feedback. Preserve concurrent stair/map changes and package.json edits.
1. Audit integration contracts and record baseline; implement shared balance and health presentation.
2. Implement weapon/action/ammo/feed payoff, actual payload behavior and feedback.
3. Implement bot safety/build intelligence and sustain/perks/streak/economy.
4. Verify numerical combinations, native gameplay and mobile shop flow; build and push only scoped changes to GitHub under existing authorization.

Approved balance implementation phases1–4 COMPLETE locally. All64 main regression commands pass;96native payload combinations plus native heavy-opponent timing and25round rival purchasing pass; final production build and20-map production-only loader checks pass. Real browser verifies all11offers/no scrolling or overlap at844×390, free two-perk swaps and scoreboard→shop→next round with100display HP. Final scoped GitHub commit/push pending. No map/stair source changes included in this task.

# Approved settings overhaul — 2026-11-04
User approved the interactive six-category proposal. Implement a shared fixed settings workspace for mobile/desktop with category/subpage navigation, independent graphics controls, live persistence, contextual practice preview, full bindings/conflicts and HUD editor access, scoped resets/undo, support/diagnostics and all existing actions. Preserve saved preferences and gameplay.
1. Implement schema/view and responsive shell using existing mechanisms — in progress.
2. Wire shared mobile/desktop persistence, preview returns, bindings and resets — pending.
3. Verify complete option coverage, UI flows, responsive bounds and existing regressions — pending.
4. Build and push scoped verified changes to mt-quinn/fragony under existing authorization — pending.

Settings implementation update: shared workspace, complete control inventory, scoped resets/undo and live preview — complete. Focused native tests, full gameplay regression pass (old-layout expectations updated and rerun), desktop/mobile browser verification — complete. Final clean production build and GitHub publication — in progress.

Final production build and 20-map production-only loading checks passed. All 65 test commands passed across the broad run and focused reruns after updating old UI expectations. Browser checks complete; publishing to authorized GitHub main.

# Approved main menu overhaul — 2026-11-04
1. Replace the standing pose with a frozen in-engine Reservoir firefight using actual mannequins and weapons, restrained camera motion, shared rendering — in progress.
2. Implement one persistent bottom action strip; Continue with saved round/credits or New Run priority; Practice/Arsenal/Settings/audio retained; underline the exact FRAG span, no tagline — pending.
3. Verify camera/combat isolation, saved campaign/rotation, phone/desktop framing, reduced motion, production build, then push to authorized GitHub main — pending.

Main menu completion: approved Shoot House central-corridor duel and action strip implemented. No tagline; FRAG underline uses the actual span. All 66 test commands passed, plus final focused load-failure/retry checks; all 20 maps loaded from the production package. Desktop/phone saved and fresh layouts, Settings/Arsenal return, and touch Practice→menu flow verified. Temporary QA files removed. Final publication to authorized GitHub main remains.

# Startup loading screen — 2026-11-04
Replace the unloaded disabled menu with an immediate loading screen and progress bar; reveal the menu only after its first rendered frame. Track actual archive/initialization milestones, preserve failure/retry. User also requested removal of the main-menu Shoot House label and FRAG underline altogether. Implement, verify loader/retry and browser states, build and push to authorized main.
Startup loading screen complete: actual archive-part and initialization progress, first-render menu reveal, Retry, benchmark visibility, hidden initial menu/audio. Map caption and underline removed. Focused native/browser checks and final build passed; all 20 production maps passed in the completed package. Publishing to main as requested.

# Map readability analysis for the new pipeline — 2026-11-04
User requests analysis/discussion only: adjacent surfaces blend; map color/material/area assignments need a major visual pass with final pipeline in mind; area transitions should follow architecture rather than bisect rooms. Trace source assignments, prepared baking, lighting/Pixel Forge; inspect representative current renders and validate specific failure modes; recommend a concrete geometry-aware art workflow and pilot before any runtime/map changes. No implementation or push authorized for this discussion.

Map readability analysis complete: concrete palette/assignment/role/edge causes traced; live same-view Shoot House A/B and palette coverage diagnostic captured; architecture-respecting saturated art-pass proposal prepared for discussion. No runtime or map changes made.

# Saturated map-art preview — 2026-11-04
User wants to see the proposed direction. Build an isolated in-engine Shoot House preview with current/proposed comparison and multiple fixed views; demonstrate saturated palette ramps, architecture/object-consistent assignments, deliberate surface value separation and quieter texture. Keep production runtime and prepared assets unchanged while the direction is reviewed; validate actual rendering and provide the working preview plus captures. Do not infer approval for a 20-map rollout.

# Approved Shoot House art pass — 2026-11-04
Implement approved petrol / fired clay / mulberry / limestone / blue slate / ink palette in Shoot House only. Areas each need a coherent primary and accent, distributed on real architectural pieces and supported graphic treatments; never coordinate planes slicing rooms. Preserve approved sky, source geometry, collision/nav, character health hues and other maps. Integrate production prepared render path plus same-code review preview.
1. Recover source object identity and author architectural area/surface assignments — complete.
2. Bake approved paint/accent treatments and map-specific final palette/visibility rendering — complete.
3. Review multiple gameplay views/interiors and actor health sweep; refine deliberate distribution — complete.
4. Run geometry/art/render regressions and production packaging; show completed result — complete.

Shoot House art verification complete: final source coverage regression, visible uppermost mezzanine floor fixture, map/health/material/render regressions, real browser exterior/interior/menu checks and final 20-map production-package loading pass. Final geometry: 1,961,899 triangles, 142 batches; collision/navigation unchanged. Push to authorized GitHub main pending.

Shoot House published successfully: aee5ddde752fde24be23f67d93b10012724ce2a3 on GitHub main.

# Individually art-direct all remaining maps — 2026-11-04
User approved final Shoot House and explicitly authorized sustained, demanding work across every other active map. Each map MUST have its own artistically chosen palette and distinct color hierarchy, with overlaps only when appropriate. Do not reuse Shoot House colors/assignments across roster. Preserve Shoot House. Same quality bar: geometry-faithful whole areas/assemblies, deliberate primary/accent distribution, supported graphics, calm floors at ALL elevations, actors readable at every health, native multi-view review and iteration per map. No deadline/budget requested. No subagent delegation authorized.
1. Research primary art-direction references, inventory each map geometry/rooms/materials and author unique palettes — complete.
2. Build geometry-aware reusable authoring/runtime support that preserves existing source coverage, custom per-map areas/recipes and efficient palette selection — complete.
3. Individually author, render, self-review and iterate all19 remaining active maps, saving named gameplay/interior/health views and an evidence ledger — complete.
4. Full source geometry/art/visibility/runtime/package checks, production browser verification and scoped commit/push — complete. GitHub main independently verified at7e9d1c9116562614c86d732ae01de6f71db540e2.
Research: James Gurney's original gamut-mask essays, Riot's Art of VALORANT Map Environments / Creation of Split, Valve's original illustrative rendering paper. Apply restricted, intentional per-map gamuts, relative color/value hierarchy and active gameplay clarity; do not copy layouts or art assets. Active roster20: reservoir/rust/shipment/nuketown +killhouse/vacant/showdown/firingrange/hijacked/summit/shoothouse/siege/mutiny/bravery/ef-showdown/delta-station/beta-station/forge2/forge1/blast-radius. Retired arenas remain excluded. Inspect Testworks training/inspection scene for shared render regression, not a replacement of its separate UX.

# Restore the approved world-space Pixel Forge — 2026-11-04
User explicitly rejects shader changes made during map art work. Restore the exact world-space shader, not the earlier screen-space version. World-space revision adc2170; c35d332 retains it and includes the water/sky reference. Restore presentation shader exactly, remove map-specific output branches, freeze historical shader fixture, verify native rendering/on-off/camera/clean actors/water/AA, build and push to authorized main. Preserve map geometry and authored material assignments; do not tune the shader to accommodate them.

# Map rendering performance — 2026-11-05
1. Measure prepared geometry/render costs across COD/EF maps and Kill House inward views — complete.
2. Implement shared rendering optimizations preserving approved art and gameplay — complete.
3. Verify geometry, rendering, gameplay and release; document measured gains and device limits — complete locally. All20 production WebKit maps and full regressions pass. Physical iPhone frame-rate certification remains unverified; desktop stress results still below60 FPS in COD heavy scenes. No maps deleted or release published.

# Mobile automation, melee, and approved colour correction — 2026-11-05
1. Mobile quiet reload with real reload timing; remove touch reload control — complete.
2. Exact50% max-health melee, rebindable V,2m reach,.5s mobile repeats, cover/lifecycle protection and feedback — complete.
3. Diagnose grey/rust regression and preserve approved authored colours through historical Pixel Forge core — complete; user explicitly approved palette replacement.
4. Validate full suite, native browsers,20 maps/graphics toggles, package and push — validations complete; scoped commit/push in progress.
