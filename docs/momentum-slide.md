# Momentum crouch slide

Sprint has been removed from movement, bindings, joystick settings, the HUD, camera FOV, and weapon poses. Normal movement remains 7.5 m/s before equipment/perks. Existing custom crouch bindings and mobile layout saves remain valid; retired sprint bindings/settings are ignored.

Crouch while moving to start a knee slide. Hold crouch on a hold binding, or use the existing crouch toggle. Mobile's crouch button toggles the crouch/slide stance. Release crouch (or tap again), jump, enter water, hit an obstruction, or slow below the minimum to end the slide. A stationary crouch remains available. Repeated entry requires a fresh crouch press; holding crouch never chains boosts.

`dist/slide.js` supplies the same slide state and slope sampling to player and bots:

| Tuning | Value |
| --- | --- |
| Minimum entry speed | 3 m/s |
| Entry boost | At most 0.6 m/s, also capped at 8% |
| Flat drag | 0.65 m/s² |
| Uphill resistance | 2.4 × positive grade m/s², plus flat drag |
| Downhill pull | 8 × descending grade m/s², minus flat drag |
| Ground steering | 1.05 radians/s, with extra braking for reverse input |
| Flat / uphill duration | 3.4 s |
| Downhill duration | 5.5 s |
| Downhill speed cap | Entry speed +3.5 m/s or entry ×1.35, whichever is greater |
| Landing input buffer | 240 ms |
| Brief air grace | 200 ms |
| Minimum continued speed | 2.3 m/s |
| Re-entry cooldown | 650 ms, plus a fresh crouch press |

Flat slides from full normal movement carry more than 20 m over three seconds. Uphill slides remain useful on real convex slopes and stair traversal uses the existing clearance-tested step system. Downhill slides gain momentum up to a bounded cap. Actual support heights determine the grade; abrupt drops and walls cannot create a false downhill boost. Existing external rocket/pad momentum is not clamped to the slide's normal entry speed.

Aiming retains its normal weapon accuracy, recoil, ADS, trigger scheduling, and reloads. There is no slide aim kick, speed FOV kick, or extra spread. Camera/weapon bob is suppressed while sliding. Steering direction takes time to change; reverse input adds a little braking. The low stance uses the existing 1.2 m crouching collision body and 0.95 m eye height, with safe uncrouching under ceilings. Fast sliding does not earn the Anchor rig's stationary/crouched bracing bonus.

Bots use slide skill from .15 at round 1 to .9 at round 31. They evaluate clear supported routes for exposed crossings, closing an excessive range gap, and low corner entries. Sliding is rejected near spawns, while swimming/airborne/recovering, on blocked approaches, at short goals, or while preparing precision shots. Better bots look farther ahead, accept more appropriate opportunities, and carry a slide longer: roughly 1.2–1.9 seconds. Tactical cooldowns are about 6–9 seconds, and sharp turns/route hazards interrupt the slide. They do not slide on every movement decision.

Native bot movement uses the shared slide model and crouched collision, including wall normals, slopes, and head clearance. Their articulated rig lowers its hips/head and trails the feet without a running foot-plant cycle. Hits continue to resolve against the actual animated regions. Bot aiming remains active while sliding. Impact/dodge/flight interruptions preserve safe headroom before standing.

Validation: frame-rate stability at 30/60/120/144 Hz, flat/up/down carry, actual convex slope traversal, limited steering, buffered landing, swimming cancellation, fresh-press re-entry, sprint removal, native player slide/fire/respawn, difficulty-scaled bot selection, and actual native bot displacement/crouched pose/cooldown are covered in `tests/slide.mjs`. Full regression and nine seeded 90-second matches passed. Human play feedback remains the measure of final feel/balance.
