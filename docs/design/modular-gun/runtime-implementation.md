# Modular gun — live implementation

The modular system is integrated into the game on main, replacing the live six-gun, money, perk and active-killstreak flows. The older catalog modules remain for legacy save/geometry fixtures; the running game uses the modules below.

## Shared rules

`dist/modular-gun.js` owns collection normalization, the 25 identities, four rarities, best-copy ownership, conditional rarity-first offers, promotion passes, life rewards, bot upgrade evaluation and migration. `dist/armory/model.js` supplies the authored catalog and pure comparison calculator. Combat and the armory use the same gun stats; the armory's firing test uses `ModularFire` directly.

`dist/modular-fire.js` schedules actions, individual ejections, paired barrels, tandem duplex bullets and weighted extra-shot events. Each action snapshots its bonuses. Each discharge uses the actor's current origin and aim. Manual reload cancels future burst ejections while preserving already-fired pairs. The capacitor automatically recharges, overlaps reload, holds indefinitely, and freezes with simulation pause. A new life resets it full.

`dist/modular-projectiles.js` handles finite projectiles and instantaneous rails, the fixed pellet pattern, falloff, piercing, covered splash, one ricochet and one chain event. The sphere sweep tests actual triangle faces, edges and vertices, with mesh bounds and BVH rejection. Cutout materials retain their alpha test. The visual instance budget does not cap damage or simulated projectiles. Large extra-shot stacks coalesce equal-delay packets without discarding damage.

Damage budgets use displayed health units; conversion to existing player/bot durability occurs once at the victim boundary. Projectile life identity prevents an earlier life's shot awarding bonuses to a later life. Corpses and the owner are excluded appropriately.

## Bots

Every rival owns a persistent collection. Settlement grants one upgrade, once per round, from three choices plus its collected tokens. The same rarity probabilities, promotion marks and eligibility rules apply. Preferences favor distinct combinations while allowing rarity and sustained output to influence choices. Respawn retains equipment and banked choices, and clears life bonuses.

Bots use the shared action clock and projectile simulation. The full action budget—including duplex and extra shots—determines heavy-shot warnings. Heavy attacks reserve a visible warning; potentially lethal actions use the longer warning. Aim commits for the final 150 milliseconds before the opening shot. There is no separate damage multiplier for a bot's modular gun.

Token decisions use public positions, actual route lengths, travel time, health and contest risk. Level 1 does not deliberately chase. Pursuit reaction and replanning improve toward level 8; incidental collection has identical range for every actor. Navigation now includes the initial support waypoint when an actor has fallen below its nearest route node, preventing an impossible skipped-step jump.

Bot circuits restore the same ammunition, health and focus, and alter the same damage, movement, reload and secondary effects. Bots spend focus in short tactical windows. Only one bot may activate slow time at once, player activation has priority, and the owner retains its action clock while the other actors slow. This regulates the AI's ability usage without changing circuit reward amounts or stacks.

## Tokens, UI and persistence

Every death independently rolls 20%. Gold coins fall to local support, remain through deaths, are publicly collectible and appear on the minimap, including height arrows and distant edge markers. Collection resolves the closest eligible actor, with a stable tie break. Ground tokens clear at round transition.

`dist/armory-host.js` mounts the physical armory during the paused between-round state. Messages require the exact frame and same origin. The game validates the chosen offer and every fitted part before committing. Preview, Take, Replace and Undo are reversible; Fight commits acquisition and starts the next round. Drafts and generated stock persist across returning to the menu or reopening a saved shop. A committed shop cannot purchase twice. Complete collections can keep playing. Practice and Arsenal use isolated inventory.

The shipped UI is in `dist/armory/`: real housing, recessed gun chamber, attached slot controls, miniature attachment models, projected hardware, local Barlow typography, aligned comparisons, visible rarity names, keyboard focus, reduced motion, WebGL recovery and a fallback. The arena stops submitting frames underneath the armory; closing it releases the frame. No old swap/streak buttons or bindings remain in the active control surfaces.

Old saves are converted once and their original raw payload is retained as `dh-run-v2-backup`. Invalid saves are not silently deleted. The run retains its round, map and rival roster. Old weapon/attachment/perk identities map to authored Common parts.

## Verification

- `tests/modular.mjs`: 7,680 physical/rank combinations, budgets, charge retention, subevent/reload scheduling, large uncapped extra-shot stacks, every circuit, conditional rarity offers, migration, bot progression, swept geometry, splash/piercing/chain damage and heavy-shot warnings.
- `tests/modular-integration.mjs`: actual victim-boundary parity, death/reward/reset behavior, exact drop threshold, public physical collection, draft/save/commit validation, saturation, isolated Arsenal and level-dependent bot routes.
- `tests/mobile-combat.mjs`: all 120 physical combinations through the real mobile sensor and trigger; long target loss retains charge without firing.
- `tests/rivals.mjs`: thirty exact-once upgrade rounds, token choices, save restoration and upgraded combat.
- `tests/modular-model.mjs`: all 100 identity/rank models, finite geometry, draw budget, disposal and actual sight alignment.
- `tests/integration.mjs`: full live round, scoring, respawns, bot settlement, shop acquisition and next-round map transition.
- Existing movement, map, rendering, input, audio and release checks remain part of the regression suite. Assertions for the retired live six-gun economy were replaced by modular contracts; pure legacy migration/model fixtures remain.

Numeric and automated checks establish consistency, not final fun or physical-phone performance certification. Device playtesting and balance iteration remain ongoing product work.
