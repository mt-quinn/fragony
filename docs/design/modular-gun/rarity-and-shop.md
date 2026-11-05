# Rarity, contested tokens, shops and rival progression

Extension to [the gun specification](proposal.md). Latest user decisions supersede earlier drafts:55/25/15/5 rarity weights; any death drops a shared token at 20%; tokens persist through death; players and bots use the same upgrade system; play continues after upgrades are exhausted.

## Rarity is a better version of the same part

Common 55%, Rare 25%, Epic 15%, Legendary 5%. Every mechanism, barrel, ammunition and circuit can roll at any tier. Part identity and firing logic stay intact. A legendary duplex cartridge still fires two centered tandem bullets. Rarity never introduces random accuracy, extra projectiles, another firing mode or an incompatible combination.

The main specification's tables describe **Common** parts. Rarity has two controlled effects: a shared physical-weapon damage-quality bonus, plus improvements to the part's distinctive benefits and costs. This avoids multiplying three broad “+damage” buffs and keeps the result explainable.

| Tier | Index t | Benefit strength U | Remaining drawback P | Physical damage-quality contribution |
|---|---:|---:|---:|---:|
|Common|0|1.00|1.00|+0%|
|Rare|1|1.08|.92|+4%|
|Epic|2|1.16|.84|+8%|
|Legendary|3|1.25|.75|+12%|

Let Q be the sum of the mechanism/barrel/ammo tier indices. Final primary damage is the resolved physical gun budget ×`1+.04Q`. The three contributions add: an entirely legendary physical gun gets+36%, not 1.12³. Circuit rarity improves its reward instead of adding another physical damage contribution. Every tier increase must weakly improve all relevant final stats; a stronger version cannot secretly cost more ammo or make a gun harder to use.

### Mechanisms

| Part | Improvements with rarity |
|---|---|
|Automatic|Rate of fire ×`1+.03t`, retaining immediate first fire. The shared quality bonus supplies damage growth.|
|Semi|Cycle `.16+(.50-.16)P` seconds. Shot weight remains distinct from automatic.|
|Burst|Complete cycle `.16+(.50-.16)P`; internal spacing `.06P`. Three-shot identity never changes.|
|Charge|Base preparation `.40P` and recovery `.20P`, before barrel/ammo transforms. Preparation still clamps to .18–.60 s. Physical radius addition `.05U`m; pellet pattern multiplier `.65P`. Full charge holds forever at every tier.|

### Barrels

The base damage factors remain fixed except gatling's per-shot damage drawback. All receive their contribution to the shared damage-quality pool.

| Part | Improvements with rarity |
|---|---|
|Single|Capacity `24U`; reload `P` seconds. Its value is a large, responsive, dependable feed.|
|Double|Cycle factor `1+.45P`; reload `1+.10P`; paired delay cap `.065P` seconds. Capacity 24; two cartridges remain two cartridges.|
|Huge|Cycle factor `1+.60P`; capacity `24-12P`; reload `1-.15U`; projectile radius factor `1+.50U`; blast factor `1+.35U`; pellet spread factor `1+.20P`; velocity factor `1-.15P`.|
|Gatling|Damage factor `1-.35P`; warm cycle factor `max(.50,1-.45U)`; capacity `24+24U`; reload `1+.25P`; spin-up `.35P` seconds. Cold factor stays .90; pellet spread factor `1+.15P`; blast factor `1-.20P`.|
|Rails|Cycle factor `1+.20P`; capacity `24-6P`; reload `1+.10P`; pellet spread factor `1-.45U`; blast factor `1-.15P`. Instant delivery stays an identity property.|

Warm gatling factor has an explicit .50 floor, preserving a readable firing cadence and bounded projectile workload. Higher tiers still improve its shot damage, capacity, spin-up, reload and weapon quality. This is a tuning limit on one stat, not a cap on earned streak stacks.

Round capacity down to a complete action's cartridge cost **after** applying the barrel and ammo values. Never round an intermediate multiplier or let a higher tier reduce capacity. Duplicate barrels, ammunition costs, pellet counts and hit targets do not change with rarity.

### Ammunition

Base damage factors stay as in the main catalog. All ammo receives physical damage quality and the following transformations:

- Any cycle penalty C above 1 becomes`1+(C-1)P`.
- Any capacity factor F below 1 becomes`1-(1-F)P`.
- Direct head factor H becomes`1+(H-1)U`; explosions stay 1.
- Full/floor distances multiply by U, capped at 90 m. Retained damage fraction F becomes`1-(1-F)P`.
- Projectile speed multiplies by U. Huge-bore speed reduction and charged speed then apply; rails remain instantaneous.
- Pellets multiply their authored angular pattern by P; piercing retains 100% for the first actor, then`1-.20P`/`1-.40P` for the second/third.
- Explosive radius is`2.4U`m before barrel/charge factors. Impact/splash remains 65/35. There is still one blast per projectile, no self damage and no arming distance.
- Duplex has the same velocity and damage-distance curve as **normal ammo of the same rarity**. Both bullets remain centered, with the same bounded tandem delay. Its base 150% body budget is paid through cycle, capacity and its smaller head bonus, never forced misses.

At Legendary, duplex's cycle factor is 1.30 rather than 1.40, capacity factor .8125 rather than .75 and head factor 1.125 rather than 1.10. Normal's head factor becomes 1.3125; its cycle/capacity remain 1. This keeps precision/follow-up value on normal ammo while duplex emphasizes heavier body hits.

### Circuits, including the tenth choice

For the nine combat circuits, multiply the numerical benefit coefficients by U: damage gained per kill, reload-speed gain, cartridge-return fraction, movement gain, restoration amount, focus regeneration, rebound budget, slow duration, echo budget and arc budget. Keep each kill interval unchanged. Keep Impact brake at 20% slow; only its duration improves. A legendary circuit is stronger at its role, without turning a three-kill effect into a hidden two-kill effect.

The tenth circuit is **Assayer**, a progression-focused alternative to immediate combat power:

- Every 3 consecutive kills banks one quality mark for the upcoming shop. At 6/9/etc consecutive kills it banks another.
- Banked marks survive death, but the current life's kill count resets. Three kills in each of two lives earns two marks; two kills in each of three lives earns none.
- Each mark gives every upcoming offer one independent chance to promote its rolled rarity by **one tier**. Chance by Assayer rarity:30/35/40/45%. Legendary rolls remain legendary.
- Multiple marks apply sequential promotion passes. They can promote a Common through several tiers, but never beyond Legendary. Every extra token choice gets the same passes.
- Marks are spent on this shop when its offers are generated; they do not improve future shops or re-roll offers after selection. Picking Assayer in a shop cannot improve that already-generated shop.

With a Common Assayer and all tiers eligible:

| Marks | Common | Rare | Epic | Legendary |
|---:|---:|---:|---:|---:|
|0|55%|25%|15%|5%|
|1|38.5%|34%|18%|9.5%|
|2|26.95%|35.35%|22.8%|14.9%|
|3|18.865%|32.83%|26.565%|21.74%|

One mark is a substantial improvement, but it sacrifices a circuit that helps win the current fight. More choices from tokens and better choices from Assayer reinforce each other without granting a second free pick.

There are 25 part identities,100 identity/tier versions,1,200 identity loadouts and 307,200 loadouts including four independent rarity tiers. This describes the possibility space, not proof that every one feels unique.

## The shop: one free improvement, more informed choice

- Start with Common automatic, single barrel, normal ammo and Overpressure. The run begins with a free draft before round 1, then one before each subsequent round. Every draft grants exactly one attachment while an eligible improvement exists.
- Three distinct attachment identities are offered by default. Each collected token adds one additional distinct identity, up to the eligible catalog remaining. Tokens improve selection, never the number of picks.
- No currency, prices, rerolls, purchased perks or separate streak purchases. Owned parts can be refitted freely between rounds. Offered parts can be previewed against the current assembly before choosing.
- Ownership is run-local and saved with the current run. Starting a new run resets the collection for players and rivals. Ownership stores the highest rarity obtained for each identity. An unowned identity can roll any tier; an owned identity can roll only strictly higher tiers. Never offer equal/lower versions. Do not offer the same identity twice in one shop, even at different tiers.
- Selecting a rarer copy replaces the old copy. If the old copy was fitted, the better one becomes fitted automatically. No separate copies, sale, refund or lower-tier salvage. Selecting a new identity adds it to the collection and may replace the part in its slot; all other owned identities remain available for refitting.
- Roll offers on shop entry, with collected tokens and banked quality fixed. Save the exact offers, ownership and selection state. Reloading/reopening cannot reroll, duplicate a pick or apply quality twice.

### Exact eligible rolling order

1. Calculate this shop's rarity distribution from 55/25/15/5, then apply all Assayer passes.
2. Exclude identities already shown in this shop. For each rarity, find identities for which that rarity is strictly better than ownership.
3. If a rarity has no eligible identities, remove its probability and renormalize the other available tiers. Sample a rarity from that distribution, then uniformly choose an eligible identity at that tier.
4. Repeat for each baseline/token option, recalculating eligibility. Stop when no eligible identities remain.

The quoted percentages are base rates, not a promise to roll forbidden Common items after the collection outgrows them. If all owned items are Epic, only Legendary is eligible. If every identity is Legendary, the shop has no upgrade offers. **The game continues**: rounds, combat, streak growth and token competition remain, but that actor stops receiving attachment upgrades. No substitute money, repeated stat levels or hidden extra rarity tier. Tokens cannot create nonexistent catalog entries.

Before full completion, if only one or two eligible identities remain, show them honestly. Extra tokens beyond the remaining option pool have no upgrade benefit; display “All remaining upgrades shown.” This is the transparent boundary of a finite authored catalog.

## Contested tokens

Every unique **death**, regardless of cause or killer, has an independent 20% chance to create exactly one token. Player deaths count. Bot deaths count. Environmental deaths count. Multi-pellet damage cannot roll twice for one death. No personal ownership or kill-credit requirement.

- Tokens are physical, public pickups. Any living actor can collect any token, including one from their own previous death. Collected tokens belong to the collector's next shop and survive subsequent deaths in that round.
- Uncollected tokens do **not** despawn when anyone dies. They remain until collected or the round ends. No timed expiration during the round.
- The token appears near the death position, falls to a supported reachable surface, and floats above it. Use the victim's last valid support point if the death occurs in void/unreachable geometry. Water tokens float at a reachable surface rather than sinking out of reach.
- Automatic pickup when a living actor moves within .90 m horizontally, with no separating solid and feet/support heights within 1.20 m. No extra touch button, remote magnetic collection or wall/floor pickup.
- If several actors arrive in one step, earliest contact along their movement paths wins; exact ties use distance then stable actor ID. Neither player nor bot has pickup priority. A dead actor cannot collect in its death-resolution step.
- Mark every uncollected token on the minimap from spawn to collection, with an up/down indicator when its support differs by more than 2 m from the viewer. Use a distinct icon from health, opponents and spawns. The same public positions are available to bots; they reveal tokens, not hidden enemies.
- Banked token count is presented as “Next shop:3+N choices.” At the next shop the collected count is consumed once. Uncollected ground tokens disappear at round transition; there is no automatic end-round collection.

This creates a shared contest: a kill may create an opportunity, but movement and survival decide who gets it. A sniper can win the fight yet lose the token to a closer actor. That is an intentional collection challenge, not a hidden weapon accuracy penalty. With D total deaths, expected world drops are .20 D; any one actor's collected share depends on route choice, opponents and luck.

## Bots use the same economy and equipment

Every rival has persistent best-rarity ownership, four fitted slots, current-life circuit stacks, banked tokens and shop-quality marks. All parts and rarities use the same formulas as the player's. No legacy wallets, free perks, hidden extra upgrades or independent round damage/health inflation.

Each round, every bot receives the same free-pick entitlement:3+collected-token offers, one selected upgrade. The same eligibility, rarity, promotion and replacement rules apply. Bots evaluate the **actual resulting assembly**, favoring their tactical profile, useful breakpoints and parts that interact with current equipment. They may refit owned parts between rounds. A rarity upgrade alone is not automatically preferable to a new behavior that suits the build.

Progress therefore differs between rivals: successful token hunters get more control over their evolution; Assayer users trade immediate combat power for better future parts. Killing a strong rival resets its earned life buffs but does not remove its collection or banked shop rewards.

### Token pursuit grows with difficulty

Use the existing normalized difficulty t, from 0 at level 1 to 1 at the configured difficulty ceiling (currently level 8). Use pursuit interest=t, route budget=8t seconds, and reassessment interval=1-.80t seconds. For interested bots, reaction delay=1.15-t seconds. Do not grant token-specific movement speed or teleportation.

| Behavior | Level 1 | Middle, t≈.5 | Ceiling |
|---|---|---|---|
|Deliberate pursuit of a new useful token|0%|50%|100% when route value is positive|
|Recognition/reaction delay|Ignore deliberate pursuit|.65 s|.15 s|
|Maximum purposeful detour|0 s|4 s route time|8 s route time|
|Route/contest reassessment|Incidental pickup only|.60 s|.20 s|
|Risk appetite|No detour into combat|Contest with cover|Accept exposure for an attainable token; still avoid an announced lethal lane|

Roll middle-level pursuit interest once per new token/respawn opportunity, not every frame. Level 1 can collect incidental tokens it walks over. Higher-level bots use actual traversable route length, stairs/pads/elevators and arrival estimates, not straight-line distance alone. They can shoot while moving through a legal firing opportunity. Existing speed, health and perception rules still apply.

At high levels, choose by marginal shop value, travel time, visible danger and competition. Estimate competitor arrivals only from currently perceived/recently known actors; the shared token marker does not reveal their positions. Avoid repeatedly flipping targets: commit for at least .45 s unless the token is collected, the route fails, lethal danger appears or survival needs take priority. At under 25% health, prefer reachable healing unless the token lies within 1.5 m of the existing route. Rival profiles bias greed, caution and route preference.

Completion matters: a bot owning the full Legendary catalog gets no personal upgrade value from tokens. A skilled bot can still contest a cheap token to deny an observed rival an upgrade opportunity. Denial estimates use visible equipment and observed behavior, never private opponent inventory. Incidental pickup still works. An actor with no upgrade offers is not removed from the shared token contest.

## Preserve response opportunities against earned power

The old 180-internal maximum is a **Common/no-streak** check, not an invariant after introducing rarities and shared uncapped circuits. Do not secretly weaken bot damage, clamp hits or suppress legitimate extra projectiles. Instead schedule attacks using the actual assembled rarity/streak output.

- An attack commitment is one semi/charge ejection, one full burst, or up to .20 s of automatic fire, including tandem packets and expected secondary effects. Assess its possible current-player damage before reserving pressure.
- At 40+ displayed player HP potential, require at least .65 s of visible/audible preparation, lock aim for the final .15 s and reserve exclusive pressure. High-impact expected impacts remain separated by at least .85 s.
- At 100+ displayed player HP potential, use at least .90 s preparation, lock aim for the final .30 s and separate such expected impacts by 1.10 s. The threat cue must remain recognizable through louder rarity effects. Tracking stops during the commitment; the player can break line of sight or dodge.
- Account for flight time, current blast size, echo packets, piercing, arc victims and rebound opportunities in coordination. Preparing an attack against a bot does not exempt dangerous nearby player collateral from the threat assessment. These are planning/aim rules, not invulnerability or retrospectively reduced damage.
- Bot circuits obey the same snapshots, recharge retention, kill thresholds, death reset and banked-shop rules. An earned high-power rival is dangerous and worth hunting, with readable attack opportunities.

The prototype must verify the complete loop: public death drop → contested route → collector's bank → correctly filtered/quality-promoted shop → one genuine improvement → persistent opponent equipment → readable combat. Arithmetic checks alone cannot certify that late-game shared streak power remains fun on a phone.
