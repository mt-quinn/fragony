# Persistent rivals and difficulty

The five named rivals now belong to the run. Each starts with two randomly rolled weapons and zero credits, retains purchased guns/parts/perks across matches and respawns, and is serialized under `rivals` in the existing run save. New Run resets the roster. Continue restores it. Older saves without rivals initialize a fresh roster without inventing historical earnings.

Every actual opponent kill earns 25 credits, whether the victim is another bot or the player. Placement pays 250 / 190 / 150 for first / second / third, exactly like the player. There are no round grants or free late-game upgrades. Settlement is guarded by `settledRound`, so replaying shop/continue cannot duplicate payout or purchases.

Between matches, rivals independently use `createShopOffers`, the same prices and first-shop 150-credit conversion discount, and `fitAttachment` with the same compatibility and three-part limit. Preferences favor each rival's signature weapon, establishing an arsenal and useful perks, then conversions/feeds/handling. They save when their preferred purchase is unaffordable, rather than draining every wallet on cheap parts. Rivals skip Focus and Bandolier because they prioritize gunfights and do not use the player's slow-motion/grenade abilities. Their purchases stay behind the scenes.

Native opponents use `weaponStats`, `FireControl`, `FeedSystem`, and `traceCartridges`: full player damage, magazines, modes, burst gaps, charge times, paired shots, penetration, HE, arc, distance falloff, and configured rocket payloads. Opponent rocket collision includes the player and preserves owner attribution through direct hits and splash. Magazines survive swaps; respawns refill ammunition without changing ownership. Armor, reload, speed, quickdraw, and recovery perks affect real play. Handling rigs affect aim response, bracing, recoil error, holstered feeds, and movement; attached hardware appears on the world weapon. AI retains tactical range preferences and deliberate pauses; physical shot range matches the player's 90 m trace.

| Skill | Round 1 | Round 17 | Round 31+ |
| --- | --- | --- | --- |
| Reaction | 400 ms | 204 ms | 105 ms |
| Aim error coefficient | .045 | .01775 | .004 |
| Base movement | 4.8 m/s | 6.0 m/s | 6.6 m/s |
| Burst-rest multiplier | 1 | .415 | .12 |

Previously skill capped at round 11 with 270 ms reaction and .032 aim error, on substantially weakened weapons. Tracking now approaches a 35 ms lag floor; perception polls more frequently as reactions improve. Exact reaction-to-hit time still includes visibility polling, turning, swap/charge timing, and cooldowns. Spawn grace, sight checks, two simultaneous player target commitments, imperfect aim and bounded speed remain. This is implementation tuning, not proof that any particular human can no longer reach a given round.

The death recap snapshots the killing weapon and its fitted action, ammunition, feed, handling, and sight (whichever are fitted). It names an unmodified weapon as stock. Projectile kills use the launched weapon name even if the killer has switched guns. Snapshot data remains frozen throughout the death camera.

Validation: `tests/rivals.mjs` exercises identity/save restoration, all 72 native attachment stat resolutions, 25 rounds of affordable shopping, settlement idempotence, armor/recovery/reload, full-damage hits, wall occlusion, kill income, hostile payload ownership, native rocket/player collision, and real trigger scheduling with reaction/LOS cancellation. `tests/recap.mjs` covers fitted parts, sight, switched-gun/projectile identification, immutable snapshots, stock/self fallback, escaping and existing camera/respawn behavior. Seeded native matches run at rounds 1, 17, and 31 through `npm run test:simulation`.

Validation result: the full `npm test` suite passed, final focused AI/rival/recap/dynamic-combat/armory/explosion checks passed, and all nine seeded 90-second matches passed. Upper-control and underpass sustained-traffic checks use the original average threshold over three seeds at each round, because stronger combat can end any single elevated engagement early. All-area participation, pads, raised lanes, pickups, scoring, and stall checks remain per match. Browser smoke testing verified a real new run; a review fixture verified the recap list at desktop and narrower widths. Human difficulty balance still needs play feedback.
