# Research, critique and iteration

Design research for [the modular-gun proposal](proposal.md),5 November 2026. Reference games inform the design; this proposal does not reproduce their systems or imply that their designers endorse its numbers. Direct developer text was read. Linked video pages were not treated as watched talks.

## Research applied

| Source | What the source supports | Our application and boundary |
|---|---|---|
| [Rami Ismail: LUFTRAUSERS, PlayStation Blog,2013](https://blog.playstation.com/?p=106794) |A small set of weapon/body/engine choices enables combinations and different combat approaches.|Three physical slots, strong identities, quick experimentation. A deliberately fragile short-run plane is not a durability template for a sole FPS weapon.|
| [Ismail developer interview,2014](https://www.gamedeveloper.com/audio/q-a-why-vlambeer-returned-to-its-roots-with-i-luftrausers-i-) |Momentum, spectacle, readable mistakes, strict constraints; modular music layers.|Consistent mechanical rules and layered presentation. Combinatorial count alone is insufficient.|
| [Borderlands 2 developer interview: Varnell/Duc](https://www.killscreen.com/interview-gearbox-software-explains-their-love-guns-and-borderlands-2/) |Modular pieces, distinct player preferences, and visual design communicating intended weapon behavior.|Backend composition must yield recognizable guns; a large bore or rail assembly should predict behavior. Do not copy manufacturer restrictions, loot inflation or rarity grinding.|
| [MOTHERGUNSHIP director Joe Mirabello, Unreal interview,2017](https://www.unrealengine.com/developer-interviews/guns-become-building-blocks-in-mothergunship) |Construction as expression; modifiers interacting predictably with multiple barrels; energy limits, mobility and readable controlled chaos.|Visible construction, predictable combinations, secondary-event budgets and preserved movement. No requirement for a freeform spatial building editor on a phone.|
| [Mirabello, GameWatcher interview,2017](https://www.gamewatcher.com/interviews/mothergunship-interview/12833) |Large constructions trade output against energy; a second viable gun can cover a costly weapon.|Important rejection: we have one gun. No energy build may strand the player. Charge/reload/capacity must independently support a fight. This interview describes development-era intentions, not verified final-release mechanics.|
| [Jaime Griesemer: Design in Detail XVIII](https://rewardingplay.com/2011/06/21/gdc-2010-design-in-detail-18/) |Role, cadence and cause-and-effect testing can address imbalance without flattening satisfying strengths.|Tune complete action cycles and breakpoints, retain strong moments, avoid a universal damage clamp. This is a design inference, not a borrowed numerical formula.|
| [Bungie sandbox explanation, May 2025](https://www.bungie.net/7/en/News/article/twid_05_01_2025) |Optimal time-to-kill and forgiveness can differ; body damage and input method materially affect usefulness.|Separate best-case damage from incomplete patterns and misses. Desktop arithmetic cannot certify mobile fun.|
| [Bungie pellet explanation, December 2022](https://www.bungie.net/7/en/News/article/51999) |Official indexed excerpt describes the reliability problem with random pellet placement.|Use an authored pellet core. Full page repeatedly timed out; no detailed source mechanics or tuning values are inferred from it.|
| [Riot: Champion Counterplay,2021](https://www.leagueoflegends.com/en-us/news/dev/quick-gameplay-thoughts-may-14/) |Clear responses, proportionate warning for high-impact effects and disadvantages that leave agency.|Predictable charge/motor cues, no weapon-disabling range cutoff and a separate decision about opponent streak growth. Not a claim that arena FPS and MOBA balance are interchangeable.|

Other search results included Noita physics talks, fan wikis, articles and video-only developer features. They were not needed as evidence for exact composition. We do not attribute wand mechanics or unpublished Borderlands part algorithms to inaccessible material.

## Repository evidence

- `dist/game.js`, `loadout.js`, `weapon-cycle.js`, `ballistics.js`, `mobile-core.js`, `mobile-targeting.js`, `balance.js` and current balance/controls documents were inspected.
- Current weapons use real weapon-specific conversions, with historical docs containing superseded values. The universal four-slot gun is a new design, not an assertion about the current catalog.
- Player/bot durability differs; preserve that distinction in damage calculations.
- Explosive surface targeting already exists. The proposal extends a useful existing behavior instead of claiming it needs inventing.
- Existing reserved high-impact bot attacks and incoming-damage tests matter. Player-only circuits are an explicit proposed scope choice, not a silent change to an assumed symmetric multiplayer system.

## Iterations 1–2: bounded timing and useful breakpoints

Initial drafts stacked slower cycling, reload, handling and capacity penalties. Rejected: the only gun must not become a queue of delays. Mechanisms own rhythm; no physical part slows movement or look sensitivity. Huge bore gets a small feed and quick reload. Charge preparation and motor spin overlap.

Enumerating the first 120 builds exposed false upgrades: huge semi-auto paying for power without crossing a body-hit breakpoint, and charged rail shots paying for acceleration without a useful return. Semi 68 × huge 1.5 =102 reference damage. Charge 80 × rails 1.25 =100. These are deliberate initial breakpoints, rechecked across the full catalog.

## Iteration 3: rejected divergence

The first design still made duplex and double barrels send some damage to an offset from the crosshair. The user correctly challenged this: a forced miss is a poor reward for assembling a stronger gun on a phone.

The final design removes that balancing device completely:

- Duplex fires two centered tandem bullets, each 75% of a normal-ammo packet. Total damage 150%, cycle 140%, loaded capacity 75%. Same velocity and distance curve as normal ammunition. Head multiplier 1.10, versus normal 1.25 and sniper 1.30. The intended trade is heavier body hits against faster/cleaner precision follow-ups.
- Double fires two centered packets in a short sequence, instead of spreading them sideways. Huge bore delivers comparable damage in one earlier impact, with a larger projectile and quicker reload.
- Echo adds centered following packets, not a fan. Its 40% additional budget per three kills is compared with Overpressure's 12% per kill:40% delayed versus 36% concentrated at three kills. This replaces a badly skewed comparison of 50% extra output versus 24% direct damage.
- Shotgun pellets keep their explicit authored spread and tight core. That spread is the selected ammunition's behavior; it does not secretly infect normal, sniper, piercing or duplex rounds.

Tandem and paired-barrel sub-events are now in the arithmetic model. The previous model's optimistic simultaneous damage no longer hides their delay. Live aim is sampled when each bullet actually fires; no frozen target or old aim direction is imposed.

## Iteration 4: make charge ready to use

Charge originally depended on target acquisition and drained shortly after losing it. The user requested no quick degradation; the final choice is stronger and simpler: **no degradation at all**.

The capacitor automatically recharges after recovery, including during movement/reload, holds full indefinitely and starts full on spawn. It only discharges on a valid auto-fire opportunity or manual input. Partial charge also survives target loss. Pause preserves it. This eliminates charge babysitting and makes advance preparation a real advantage in short firing opportunities.

Ammunition no longer lengthens preparation. Charge time is barrel-scaled but bounded to .18–.60 s; ammunition affects recovery instead. A charged projectile gets an additional .05 m physical radius and a tighter pellet pattern. This makes charge valuable through delivery and preparation, not just a damage number.

Charge/gatling/sniper is now a defined rapid capacitor build:65 reference damage, centered fast slug, .22 s warm recharge and .1375 s warm recovery. With a stored charge and cold motor, the model kills a 100-health body target in .495 s; semi/gatling/sniper takes .5625 s. Starting empty is slower at .805 s, which is now the post-shot/rushed case rather than the mandatory start of every encounter. These numbers omit travel, acquisition and human correction.

## Iteration 5: nine circuits at different kill intervals

The user clarified that the initial reward list was illustrative, that variety mattered and that frequent small gains could coexist with rarer structural changes. This iteration proposed nine circuits at one-, two- or three-kill intervals.

- One-kill circuits: concentrated damage, service-feed/reload flow, movement.
- Two-kill circuits: repeated repair, focus recovery, reflected projectiles, movement control.
- Three-kill circuits: extra ammo packets, electrical jumps.

Compare at equal kills, not equal stacks. All permanent benefits add from base and reset on death. Restoration repeats without exceeding ordinary maxima. A multi-kill crosses thresholds once each. New stacks cannot upgrade the remainder of the attack that earned them, and dead owners cannot heal into their next life.

Service loop also returns 20% of the fitted feed per kill: reload acceleration alone was too marginal with short solo-gun reloads. Clean heavy-gun kills may eliminate reloads, deliberately. It does not accelerate the firing cycle.

Rebound and arc have explicit secondary budgets and no recursive spawning. Brake stacks duration, not slow percentage. Echo uses at most four recurring emission times, so equal-time equal-trajectory copies can be aggregated without capping earned power. Circuit choices are mutually exclusive; there is no need to define an exponential echo-of-an-arc-of-a-rebound.

## Common-baseline arithmetic audit

The reproducible calculator enumerates 120 Common physical builds and 10,800 circuit-state rows:1,200 identity loadouts at 0/1/2/3/6/9/12/18/30 kills.

- Every feed contains at least three complete actions after cartridge-cost rounding.
- Maximum warm base cycle 1.12 s; maximum reload 1.25 s. Actual charge preparation is never above .60 s.
- Ready-to-fire close body-hit mechanical kill time is at most .7975 s.
- Artificially starting with an empty capacitor increases the maximum to 1.02 s;120-health stress targets to 1.224 s.
- Missing the first complete ejection gives a worst unprepared time of 1.683 s.
- The 45 m sensitivity case, with only half the pellet output landing, reaches 1.60 s. Duplex retains its full centered output and is no longer the long-range outlier.
- Ideal warm body DPS ranges 115.91–239.32 before reload. The high end assumes all shotgun pellets connect.
- Maximum base complete-sequence head damage 178.2 internal, below the current 180 authoring budget. Earned circuit and rarity power intentionally exceed it for players and bots.
- Base ejections have at most 16 projectile paths; circuits use at most 48 trajectory bundles, plus Arc's one target event. Event-count bounds are not frame-time measurements.

These are arithmetic results, not a human aim or live gameplay simulation. The model omits acquisition, travel, silhouette geometry and real aim correction. A zero means the first projectile kills, not instantaneous perception. The 120-health case is a durability stress test; the proposal removes the old armor perk.

## Weak spots now have design answers

| Weak spot | Final design decision | What the prototype must verify |
|---|---|---|
|Duplex loses damage away from the crosshair.|Both bullets centered; no extra range penalty. Damage/cycle/capacity/head factors provide the tradeoff.|Actual tandem feel, recoil readability and normal/sniper competitiveness.|
|Charge drains or repeatedly restarts.|Automatically prepare and hold forever; preserve during movement/reload/target changes.|No stale controller target, timer reset or discharge without intent.|
|Charge + gatling feels like a weak gun with extra waiting.|Start with stored energy, rapidly recover/recharge, retain large physical projectiles. Loaded opening is explicitly part of its role.|Compare real ready openings and missed-shot recovery against semi/gatling.|
|Charge + piercing suffers on isolated targets.|Full first-target damage; no ammunition tax on preparation. Ready single-barrel body kill takes .62 s in the model.|Single-target survival without requiring collateral or headshots.|
|Double and huge overlap.|Double is a two-part live-aim sequence; huge is one earlier enlarged impact with fast feed reset.|Players identify each by sound, recoil and rhythm without reading numbers.|
|Pellets fail as a sole gun on open maps.|Fixed tight half-pattern, mild retained damage and no auto-fire range cutoff.|Actual torso hits at 25/45 m; revise core geometry if the model's assumed half-contact is too generous.|
|Utility circuits fail to compete.|Different kill intervals, explicit ammo return, repeated restoration, conditional damage and non-stacking control.|Choices at equal kill counts, effective restoration and voluntary reuse.|
|Earned projectiles explode computation or damage recursion.|One generation of secondary effects; bounded repeated emission groups with exact integer weights.|Phone frame time, pooling and collision at 30/60/120-kill preview states.|
|Enemy growth can become lethal.|All four slots and rarities are shared. Assess actual attack output and add longer visible preparation/committed aim for dangerous attacks.|Verify real response opportunities against upgraded rivals; do not clamp their damage or secretly remove their earned rewards.|

Prototype these specified answers first; then tune from observed failure. Do not fill a prototype failure with a secret combination-specific damage bonus. Research and arithmetic justify a coherent hypothesis; actual fun and all-map sole-weapon viability require playing that hypothesis on the target phone.


## Iteration 6: rarity and the shared arena economy

The final progression extension supersedes the player-only circuit recommendation and the former currency/part-collection assumptions. Bots use every slot, rarity, streak circuit and upgrade rule just like the player.

- Rarities are 55/25/15/5. Better copies replace lower copies; equal/lower rolls are forbidden. Offers draw from the eligible rarity/identity pool with no repeated identity in a shop.
- Each round gives one free choice from three plus collected-token choices. Every death has an independent 20% chance to drop a public physical token. Anyone can collect; death removes neither ground tokens nor banked choices. All ground tokens are marked on the minimap.
- Assayer is the tenth circuit. Every three consecutive kills banks a next-shop rarity-promotion pass. Common promotion chance 30%; higher chip rarities 35/40/45%. The exact distribution is in the extension.
- Rarity contributes to one shared physical damage-quality pool, with signature improvements and reduced drawbacks. It does not multiply three generic damage-quality buffs.
- Low-level bots ignore deliberate token pursuit. High-level bots react in .15 s, reassess routes in .20 s and contest through real navigation and perceived danger. No token-specific speed bonus or omniscient opponent tracking.
- Upgraded bots can eventually deliver lethal damage. The old Common-only damage bound is not misrepresented as a guarantee: actual-output threat assessment requires .65/.90 s preparation and committed aim for high-impact/lethal attacks.
- When an actor owns every identity at Legendary, upgrades stop and play continues. No endless ranks, replacement money or forced run ending.

The rarity/shop audit checks 7,680 physical rarity combinations,17,280 adjacent upgrade transitions,2,764,800 sampled circuit states and 12,000 simulated shop states. Same-identity tier upgrades never worsen the checked damage, cadence, capacity, reload or mechanical kill-time metrics. The full 25-identity/four-tier system contains 307,200 assembled loadouts. This is arithmetic coverage, not a playtest of every assembly.

All-Legendary maximum body commitment reaches 220.32 internal and maximum head commitment 252.45 before streak growth. These results explicitly motivate the shared high-threat warning rules. Coin positioning, minimap clarity, bot token decisions, real projectile geometry, phone frame time and late-game combat warnings remain prototype-validation work; they are specified behaviors, not measured results.
