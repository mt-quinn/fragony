# Dynamic combat implementation

Bots share a combat repertoire and change actions as the fight changes. Existing profile preferences remain small biases; they do not lock opponents into separate roles.

## Fight decisions

`dist/ai.js` records the current action, its start time and transition reason. Shared actions cover travel, searching, pursuing a last-seen target, attacking, precision bracing, repositioning, withdrawing, reloading, dodging and recovering.

Recent damage builds decaying pressure. Pressure, an unsafe range, sustained exposure, and burst recovery can trigger a new supported firing position. Longer angle changes require an angle or elevation benefit and a visible destination firing line. Plans have short commitments and can yield to danger. Sustained local exchanges can become moving disengagements; critically low health can override those routes. Exploration distinguishes height tiers instead of marking an upstairs position visited from below.

Strafe legs evaluate supported ground and available sightlines, with a preference for continuing a useful direction. Movement accelerates and brakes rather than instantly reversing. Projectile dodges compare supported escape directions and recheck the next movement segment. They retain perception, delay and failure chances.

Aim retains target-following lag and uses an offset held briefly across shots instead of selecting independent random error for every bullet. Weapon changes continue to use only the rolled pair, preserve ammunition and require the equip delay. Nearby useful health fragments can become bounded route detours without replacing the strategic destination.

## Body and impacts

`dist/characters.js` lets the pelvis lead lateral travel while the upper body and gun counterturn toward the threat. Acceleration shifts weight; existing planted feet and ground adaptation remain active. Visible meshes continue to provide the hit regions.

`dist/impact.js` defines six weapon response profiles. Resolved shots produce a single directional event, including grouped shotgun pellets. Impacts drive body-local translation, pitch, roll, contact-offset twist and regional limb response. Up to four overlapping events are retained and their combined pose is bounded. Heavy reactions remain visible while smaller fresh contacts register.

Heavy or sufficiently accumulated impacts can cancel a charged shot and cause a 230 ms recovery, with an 850 ms cooldown between staggers. Recovery slows movement and prevents firing; an existing reload continues. Ordinary light hits register without repeatedly renewing stagger. Values use world time, including slow motion. Impact state clears on respawn. Lethal hits immediately enter the existing momentum-preserving ragdoll and lethal/post-death shattering path.

## Tuning and verification

Combat choices and movement use `AI_TUNING.combat`. Weapon response shapes, accumulation decay, recovery duration and the shared stagger cooldown use `IMPACT`.

`tests/dynamic-combat.mjs` exercises pressure-driven actions, commitment, range switches, last-seen pursuit, finite recovery, reload continuity, physical fragment detours, unsafe ledge dodges, hit-direction rotation symmetry, grouped pellets, respawn cleanup and weapon alignment during lateral movement. The existing suites cover damage/scoring, collision, articulated bodies, map traversal, and full matches on both maps. Match summaries include action, stagger and detour counts.

The research brief remains the design background; ideas beyond the mechanisms above are proposals rather than shipped behavior. Human play remains the final judge of pacing, contact and satisfaction.

Final verification on November 2, 2026: full `npm test` passed; all nine Test Works seeds across early/middle/capped difficulty and all three Reservoir coverage seeds passed. All ten action types appeared in the Test Works matrix. Its worst measured distant-goal stall was four seconds against the existing ten-second limit. Reservoir runs recorded 691 shots, 19 bot kills, 15 heavy recoveries and four fragment detours. Browser checks covered live combat, heavy/light reactions, independent pelvis/weapon orientation and physical collapse with no reported warnings or errors. Temporary review pages were removed. Full-match test loops retain their coverage and stall assertions and allow 180 seconds of wall time per case.
