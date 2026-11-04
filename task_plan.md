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
4. Verify prepared production package, commit and push to the user’s GitHub repository — in progress.
Preserve the existing Arsenal/practice catalog and all transaction rules. Preserve unrelated workspace changes. A surviving scoreboard has one forward action into the shop; terminal run-over behavior stays distinct.

User requested publication destination change: push the completed repository to https://github.com/mt-quinn/fragony.git; do not publish via ChatGPT Sites. GitHub repository is empty, public, main branch, and current account has push permission. No local remote exists yet. Largest tracked asset is 26.54 MB; no historical blob exceeds 90 MB. Preserve history with a normal initial push, never force-push. Include static-release build settings for their planned Vercel import; do not deploy to Vercel.
