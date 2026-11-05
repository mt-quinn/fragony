# One gun, four choices

Design proposal · Revision 3 · 5 November 2026 · Not implemented or playtest-validated

## The pitch

Build one industrial weapon from a firing mechanism, barrel, ammunition and streak circuit. Each physical part changes the way it shoots. The circuit determines how it evolves during a successful life. Four mechanisms × five barrels × six ammunition types × ten circuits gives **1,200 identity loadouts**, built from 25 understandable choices. Four rarity tiers expand progression without changing the identity of those choices.

The goal is different decisions in combat: sustained tracking, brief opportunities, close-range coverage, precision, terrain shots, lining up opponents, maintaining momentum or surviving another exchange. Assembly count is not evidence that every loadout will feel equally distinct or fun.

Keep the player's existing two-thumb movement/look, automatic firing and slow time. Semi-auto repeats at a conspicuously lower rate than automatic; no tapping requirement. Remove the separate perks and streak abilities. No replacement ability button.

The rules below are specific enough to prototype. Their behavior is the proposal; the exact numerical balance is an initial testable hypothesis.

## 1. Shared language and durability

All tables below describe **Common** parts. See [rarity, tokens, shops and bot progression](rarity-and-shop.md) for higher tiers and the shared upgrade economy. All damage below is against a **100-health reference opponent**, without headshots, armor, falloff or missed projectiles unless stated. This makes breakpoints readable. It is not a proposed equal-health conversion: current bots have 90 internal HP and the player 200. Multiply listed damage by .9 to get current internal authoring units. A 100-damage reference hit removes 45 displayed player HP under the existing player durability.

- **Action:** one automatic/semi shot, one complete three-shot burst, or one charge/discharge/recovery cycle.
- **Ejection:** one instant when the mechanism fires. A burst contains three ejections.
- **Packet:** the ammunition output of one barrel at one ejection. Pellets and duplex split their packet's budget; they do not each inherit its full damage.
- **Projectile:** one bullet, pellet, penetrator, micro-rocket or accelerated trace.
- **Life:** from spawning until death or the next round's fresh spawn. Rebuilding between rounds starts a fresh life. Persistent ownership survives; combat stacks do not.

All configurations work at zero kills. No secondary weapon, melee, special ammo pickup, purchase, headshot or streak activation is required for basic damage. Special ammo reloads from unlimited reserves. No random jams, critical-hit chance or durability.

## 2. Mechanisms: rhythm and shot weight

Values are for single barrel + normal ammo, before a streak circuit activates.

| Mechanism | Damage per ejection | Timing | What makes it enjoyable |
|---|---:|---|---|
| Automatic |24|One ejection every .16 s; first shot immediate|Responsive sustained tracking; missed shots are quickly replaced.|
| Semi-automatic |68|One ejection every .50 s; first shot immediate|A short opportunity can deliver most of a kill. Moving between shots matters.|
| Burst fire |24×3|Ejections at 0/.06/.12 s; next burst starts at .50 s|A concentrated attack, followed by a readable recovery.|
| Charge fire |80|.40 s recharge +.20 s recovery; .60 s complete cycle. Holds a ready charge automatically.|Enter a fight with a powerful, forgiving opening shot; exploit brief opportunities rather than track continuously.|

Charge also adds .05 m to each projectile's collision radius after barrel scaling, multiplies pattern angles by .65, projectile speed by 1.6 and explosion radius by 1.25. These are always-on full-charge properties, not additional choices or bonuses that scale with how long the player waits. Rails remain instantaneous rather than multiplying infinity. No partial-charge damage ambiguity. A real larger projectile and advance preparation give charge a benefit beyond raw DPS, including on a rapid gatling build.

### Input and target-loss contract

- Use one 60 ms auto-fire acquisition requirement across the catalog. It does not repeat after every legal shot against an ongoing firing opportunity. Mechanical cadence, not a second hidden weapon-specific delay, distinguishes the mechanisms.
- An automatic firing opportunity is a real configured trajectory hitting a living enemy, or an unobstructed predicted explosion dealing at least 20% of its peak splash to one. Pellet and duplex queries consider their real paths; the center is never an empty hole. No homing or camera steering.
- Direct projectiles use actual world/actor collision, including their small physical radius. No separate enlarged damage-only target boxes. Moving targets can still evade traveling shots.
- A burst that starts finishes at the **current aim**, even if the target leaves the reticle or dies. No target lock, no free retargeting, and no saved burst waiting to surprise the next enemy. Death and an explicit reload cancel future ejections; pause freezes and resumes the action. The original recovery deadline remains.
- Charge is an automatically recharging capacitor. After shot recovery, it recharges without a target or held button, then holds full indefinitely. It starts full on spawn. Moving, losing a target, changing targets, releasing manual fire and reloading never drain it. Full charge auto-fires only on a real firing opportunity; manual fire requires a held button. Neither mode shoots empty space merely because the capacitor is full.
- Capacitor recovery/recharge can proceed while the feed reloads. A shot requires both a full capacitor and loaded cartridges. An empty feed cannot repeatedly reserve or spend ammo while charging. Pausing preserves charge and freezes its timers; death resets the weapon. There is no charge degradation timer.
- An optional manual button repeats all mechanisms at their legal cadence. Releasing it stops new actions, without erasing charge or canceling a committed ejection/burst. Manual fire allows prediction and terrain shots without an auto-fire opportunity.
- Gatling spools while firing or while a visible target occupies an 8° cone around aim. Decay begins after .25 s without either and takes .50 s from full to idle. Losing an exact crosshair hit does not repeatedly stall it. Motor decay never drains held capacitor charge.
- Nothing resets an existing recovery deadline. A deliberate reload cancels pending future burst ejections, but never a tandem/paired ejection already underway, and preserves capacitor energy. Reload freezes the motor while capacitor recovery/recharge continues. Pausing freezes all timers; death clears all combat stacks and resets the weapon.
- A cold manual/auto gatling fires its first ordinary shot immediately. Charge and motor spin overlap. There is no extra spin-up lockout stacked in front of a charged shot.

## 3. Barrels: output geometry and physical character

Damage factor applies to **total damage per ejection**, not independently to each projectile. Cycle factor scales ordinary shot/burst timing. Charge preparation is `clamp(.40s × barrel cycle factor, .18s, .60s)`; ammunition never lengthens preparation. Its recovery is `.20s × barrel cycle factor × ammo cycle factor`. Gatling uses its sampled motor factor. This prevents parts stacking excessive windup onto the sole gun.

| Barrel | Total damage factor | Cycle factor | Loaded cartridges / reload | Distinct behavior |
|---|---:|---:|---|---|
| Single |1.00|1.00|24 /1.00 s|One centered packet. Compact baseline, long attacks and predictable output.|
| Double |1.50|1.45|24 /1.10 s|Two closely spaced centered packets, each 75% of the original mechanism budget. Costs two cartridges per ejection. Both barrels fire through the live aim point; no sideways spread.|
| Huge bore |1.50|1.60|12 /.85 s|One oversized packet. Projectile radius ×1.5, pellet angles ×1.2, explosion radius ×1.35. Frequent but quick resets; concentrated impact.|
| Gatling |.65|.55 when spinning|48 /1.25 s|One lighter packet at much higher frequency. Cold timing factor .90 falls linearly to .55 during .35 s of spinning. Pattern angles ×1.15; explosion radius ×.8.|
| Magnetic rails |1.25|1.20|18 /1.10 s|One accelerated packet. All its projectiles become instantaneous traces. Pellet angles ×.55; explosion radius ×.85. Smaller magazine; reliable delivery at range.|

Gatling's timing factor is sampled at the beginning of an ordinary action, or at the beginning of a capacitor recharge. Charge preparation and subsequent recovery use that sampled factor. Damage stacks are separately sampled at first discharge. Completing an action does not restart the motor. Burst gatling remains three-shot bursts; charge gatling becomes rapid, lighter charged pulses. It does not acquire an automatic stream or an additional hidden volley.

All barrels preserve movement and touch sensitivity. Weapon recoil/animation sells mass; we do not stack walk-speed, turning-speed and reload penalties on a sole weapon. Huge bore pays through lower capacity and slower cycling, then receives a fast reload and a genuinely larger projectile. Double pays for both packets and must land both to realize its full output. Rails accelerate; **they do not secretly grant piercing**.

## 4. Ammunition: what leaves and what happens

| Ammunition | Damage factor / cycle factor | Packet geometry | Head factor | Capacity factor |
|---|---|---|---:|---:|
| Normal |1.00 /1.00|One centered bullet;180 m/s; radius .035 m|1.25|1.00|
| Shotgun pellets |1.35 /1.00|Eight pellets, each 1/8 of the packet;150 m/s; radius .025 m|1.10|1.00|
| Sniper |1.25 /1.25|One centered slug;300 m/s; radius .025 m|1.30|.75|
| Explosive |1.05 /1.10|One straight micro-rocket;60 m/s; radius .06 m;2.4 m blast|1.00|.85|
| Piercing |1.00 /1.10|One centered penetrator;220 m/s; radius .035 m; up to three distinct enemies at 100/80/60% damage|1.25|1.00|
| Duplex |1.50 /1.40|Two tandem bullets, each 1/2 of the packet;180 m/s; radius .035 m. Both pass through the live aim point, up to 35 ms apart.|1.10|.75|

Sniper's job is concentrated ranged damage and useful body shots, with a precision reward. Piercing's job is continuing through opponents. Sniper does not pierce and piercing does not require a headshot or armor to have value. Normal has the fastest next shot, larger feed and better precision efficiency than duplex. Duplex pays for concentrated body damage through cycle/capacity/precision reward, never arbitrary misses or a distance cliff.

### Exact projectile and payload rules

**Pellets:** use a fixed eight-point pattern in angular coordinates, not random scatter. Four core points: (0,0),(-.35°,0),(.175°,.3031°),(.175°,-.3031°). Four outer points: (±3.5°,0),(0,±3.5°). Scale all angles by barrel and charge factors. Every pellet has equal damage. The tight half preserves useful aimed damage at medium range; the outside half produces close coverage and power. The reticle shows both regions. No spread bloom or movement accuracy penalty in the initial version.

**Double:** two centered packets give a rapid double report instead of a lateral fan. Let G be the shortest interval between primary ejections in the action: modified internal gap for burst, complete cycle otherwise. The second barrel fires after `b = min(.065s, .40G)`. Both packets use the live aim direction at their actual firing instant, with no hidden steering. The player can turn between packets to finish one target and hit another. Two cartridges are reserved and consumed when the first packet fires. Both packets finish unless paused or killed. Huge bore delivers equivalent damage in one earlier, larger impact and reloads faster; double has the faster repeated cycle.

**Explosive:**65% of its modified budget is impact,35% is peak splash. A directly hit victim receives impact plus exactly one peak splash, totaling the listed budget. Other victims receive only splash, scaled linearly to zero at the radius boundary. World surfaces stop the rocket and trigger its explosion; walls block blast propagation. No bouncing, arming distance, homing or proximity fuse unless the selected circuit explicitly adds a rebound. No distance falloff on impact or splash. No self damage or friendly shooter knockback in the proposed sole-gun system; self-harm is an intentional change from the legacy launcher. A close enemy must not make your only gun unsafe. The reduced head reward, travel time and damage allocation provide its tradeoffs.

**Rails + explosive:** instantaneous impact on the first solid intersection, followed by the same explosion rules. The blast is smaller because the accelerator produces a focused impact. It does not explode at 90 m in empty air or behind cover.

**Piercing:** each projectile can damage one actor only once despite multiple body/limb intersections; nearest body region determines that projectile's impact. It continues through up to three distinct actors at 100/80/60%, stops at architecture and never produces a payload per limb. Distance falloff is evaluated at each actor. No wall penetration. Rails change delivery, not its target count.

**Duplex:** one cartridge contains two smaller tandem bullets, each 75% of that barrel's normal-ammo packet damage. Both fire through the current aim point. The second follows by `u = min(.035s, .40G)`; on double barrels use `u = min(.035s, .40 × min(b, G-b))` so each tandem pair fits between packet starts. The short interval creates a double impact and genuine follow-through, without a forced sideways miss. Both retain normal ammo velocity and full distance curve. Aim can move between bullets; the gun never freezes an old direction or steers toward an enemy. Committed pairs finish on target loss. A target killed by the first bullet does not make its corpse block the second.

Double + duplex emits four bullets, two from each cartridge, each 37.5% of the pre-ammo ejection budget (150% total). No extra cartridges are charged for the split. Sniper remains one stronger individual bullet with better head/range performance. Duplex occupies the ammo slot, so no simultaneous explosive/piercing ammo. The circuit may still add a rebound or arc through its explicit budget. All delayed packets snapshot circuit stacks at the first discharge; a kill from bullet one never upgrades its own bullet two.

**Flight:** huge bore multiplies non-rail speed by .85; charge by 1.6; all other barrel speed factors are 1. World travel has no gravity in this first catalog. Stop projectiles at 90 m total path length. Rails use swept finite-radius traces with the same collision radius and first-surface rules as the corresponding physical projectile. A muzzle-obstruction check prevents firing through nearby walls; never let visual barrel offsets create blind spots at point-blank range.

### Distance curves

Damage is full through the first distance, decreases linearly to the retained fraction at the second, then stays at that fraction through 90 m. These are damage retention curves, not auto-fire cutoffs.

| Ammo | Full damage through | Floor reached at | Retained damage |
|---|---:|---:|---:|
| Normal |22 m|45 m|75%|
| Pellets |8 m|24 m|75% per pellet that hits|
| Sniper |40 m|70 m|90%|
| Explosive |Entire path|—|100%, with local blast falloff|
| Piercing |22 m|45 m|80% before target-count attenuation|
| Duplex |22 m|45 m|75% per bullet that hits; identical to normal ammo|

Pellets pay twice at distance through geometry and the mild 25% damage reduction, not an additional harsh damage cliff. The core must be tested against actual torso geometry at 25/45 m. No build may depend on a short auto-fire range limiter.

## 5. Composition and resources

Resolve in this order:

1. Mechanism sets base ejection damage and action timeline.
2. Barrel sets total ejection damage, packet count, timing, shape and feed.
3. Ammo transforms that budget and packet into projectiles and effects.
4. Snapshot the active circuit's earned stacks at **first discharge**, including tandem packets and all three burst ejections. Preparing a charge early never freezes an obsolete stack count.
5. Trace projectiles, resolve actor hits/payloads, then award unique deaths and apply newly earned rewards to the next action.

For ordinary components: `D = mechanism damage × barrel damage factor × ammo damage factor`; `time = mechanism time × barrel cycle factor × ammo cycle factor`. Charge uses the separate preparation/recovery rule above. Divide D among all primary projectiles in an ejection. Head multipliers apply only to direct damage for head collisions. Limbs retain the existing .75 multiplier. There is no universal late damage clamp.

Capacity is the barrel capacity × ammo capacity factor, rounded **down to a complete action's cartridge cost**, with at least two complete actions. All proposed combinations actually provide at least three. An action costs `barrel packet count × mechanism ejection count`. Echoes/rebounds/arcs never consume cartridges. Show loaded actions and actual shot timing in previews rather than misleading summed projectile RPM.

Empty feeds reload automatically after the final ejection. Recovery and reload overlap; firing requires both to finish. Manual partial reloads are allowed and replace rather than stack reload timers. No overlong empty reload, fractional-cartridge deadlock or charge-consuming-ammo-before-discharge. A depleted burst can finish only its remaining complete ejections; no free packets. UI/refunds do not reset cadence.

Dispatch every due tandem/paired/burst event using its scheduled timestamp, even when several fall inside one rendered frame. A lower phone frame rate must not discard projectiles or reduce a faster attachment's real firing rate. Projectile collision uses swept travel over the elapsed simulation time.

No charge damage, projectile-count or magazine multipliers compound recursively. Slots are exclusive: huge and gatling cannot coexist; pellets and explosive cannot coexist. Burst + double + explosive gives six micro-rockets per action; it does not also emit six shotgun patterns. Cross-category effects enter through the circuit slot and retain their explicit event budgets.

## 6. Streak circuits: ten ways to shape a run

Exactly one circuit is fitted. It replaces **all legacy perks and all streak abilities**, including their purchases and buttons. The basic slow-time ability remains. Circuits are alternatives, not a second set of ten simultaneously equipped perks.

Kills within the current life are `k`. A circuit with interval `q` has `n = floor(k/q)` earned stacks. It activates at q,2 q,3 q… kills. Persistent changes add to the unmodified gun/player base; they do not multiply the previous stack. No cap on earned stacks. Assayer banks quality for this round’s next shop rather than a life-bound combat buff; death resets its kill counter, not already earned marks. Repeated restoration cannot exceed the ordinary health/focus/ammo maximum. Circuit selection and physical parts are fixed during a round; nothing can bank a streak and swap it into another reward.

| Circuit | Interval | Exact reward | Reason to choose it |
|---|---:|---|---|
| **Overpressure** |Every 1 kill|All primary gun damage ×`1+.12n`. Applies to the whole packet budget, including its splash or piercing damage; not additional copies.|Concentrated, dependable power and earlier body/head breakpoints.|
| **Service loop** |Every 1 kill|Reload speed ×`1+.25n`, so duration is base reload divided by that factor. Immediately return `floor(.20 × fitted cartridge capacity)` cartridges, capped at capacity, on each eligible kill.|Accurate kills keep the gun running; supports huge bore, small sniper feeds and sustained gatling use. Recovery never resets.|
| **Momentum drive** |Every 1 kill|Walking/strafe speed = base ×`1+.06n`.|Close gaps with pellets, strafe during slow shots, rotate between fights. No look-sensitivity change.|
| **Field repair** |Every 2 kills|Immediately heal 35 displayed HP, up to ordinary maximum. Repeat at 2/4/6…; no overheal, stored medkit or passive regeneration.|Survive successive exchanges. Strong even when the current gun already kills efficiently.|
| **Time capacitor** |Every 2 kills|Immediately restore 35 focus; base focus-regeneration rate ×`1+.15n` for that life. Regeneration happens only while slow time is inactive and after its existing 2 s delay.|More opportunities to use the existing active aiming/time tool, particularly with charge and precision builds.|
| **Rebound chamber** |Every 2 kills|At the first world impact of each primary projectile, emit exactly one reflected secondary at`.60n` of that projectile's original damage budget. It can bounce no further.|Terrain angles, reflected pellet fans, paired bank shots and explosive rebounds. Every stack increases rebound power.|
| **Impact brake** |Every 2 kills|Gun damage applies a 20% movement slow for`.35n` seconds. Hits refresh to this duration; durations do not add. Speed reductions never compound.|Keep mobile opponents in a firing lane, cover burst recovery or secure the next heavy hit. No root, aim stun or firing interruption.|
| **Echo chamber** |Every 3 kills|Add n secondary ammo packets per ejection. Each contains 40% of that ejection's **base total** damage and follows the live crosshair at a short delay.|Extra lead, repeated pellet clouds, additional explosions or following penetrators. Slightly more total output than concentrated damage, delivered over time.|
| **Arc conductor** |Every 3 kills|Once per ejection that damages an actor, jump to one other visible living enemy within 4 m of the origin actor, dealing`.60n × base ejection damage`.|Cluster clearing and a bridge from precision shots to group damage. No extra target means no arc; the core gun still works normally.|
| **Assayer** |Every 3 kills|Bank one quality mark for the upcoming shop. Each mark gives every offer a 30% chance to advance one rarity tier (Common circuit). Repeats at 6/9/etc consecutive kills.|Sacrifice immediate combat power to develop a stronger collection. Banked marks survive death.|

### Compare at equal kill counts

| Circuit | At 3 kills | At 6 kills | At 9 kills |
|---|---|---|---|
| Overpressure |+36% primary damage|+72%|+108%|
| Service loop |Reload time÷1.75; three ammo returns|÷2.5; six returns|÷3.25; nine returns|
| Momentum |+18% speed|+36%|+54%|
| Repair |One 35 HP heal|Three heals,105 HP offered|Four heals,140 HP offered|
| Time |One 35-focus refill; regen+15%|Three refills; regen+45%|Four refills; regen+60%|
| Rebound |One 60%-strength reflected projectile per primary world impact|One 180%-strength reflected projectile|One 240%-strength reflected projectile|
| Brake |20% slow for .35 s|20% slow for 1.05 s|20% slow for 1.40 s|
| Echo |One 40%-budget extra packet|Two extra packets,80% extra ideal damage|Three extra packets,120% extra ideal damage|
| Arc |One 60%-budget jump per ejection|One 120%-budget jump|One 180%-budget jump|
| Assayer |One promotion pass; Legendary rate 9.5%|Two passes;14.9%|Three passes;21.74%|

Restoration totals are amounts offered, not guaranteed effective healing or focus. Rebound/arc strength is conditional damage to another trajectory/target; it is not a reliable direct-hit bonus. Echo's ideal sum assumes the extra trajectories hit. Overpressure has the earliest and most dependable payoff. Timing is part of balance; this table does not claim equal effectiveness.

### Circuit interaction rules

**Echo:** an echo copies the ammunition packet, including all eight pellets or both tandem duplex bullets, penetration retention or impact/splash split. Its total damage is 40% of the original ejection D, regardless of primary barrel count. A double barrel gets one extra packet per stack, not one per barrel; burst gets it at each ejection. Echoes never copy previous echoes. Let `W = min(.12s, .30G)`. Assign echoes cyclically to delays W/4,W/2,3 W/4,W from the primary ejection. At each delay, its packets fire through the **current** crosshair, retaining only their ammo pattern/tandem spacing. No arbitrary fan is added. Equal-time, equal-pattern packets can be combined exactly into weighted trajectories; earned damage and stacks stay uncapped. Explosive echoes create one explosion per packet, not per pellet. Every trajectory keeps its own direct/splash resolution.

**Rebound:** specular reflection from the actual world normal. Primary damage/blast occurs normally first, so equipping the circuit never removes a useful explosive floor shot. A reflected projectile carries the ammo behavior and travels at the same speed (or is another instantaneous segment for rails), with the rest of the 90 m path budget. Its damage is 60%×n of that primary projectile's original budget, including each pellet/duplex share; piercing attenuation restarts on the reflected segment. It cannot damage an actor already hit by its parent; blast victims are included in that exclusion. Reflected payloads do not rebound, create echoes or trigger new circuits. Auto-fire may recognize a one-bounce path only toward an enemy currently visible to the player; it never scans hidden enemies through a wall. Optional manual terrain fire can reach unseen locations through legitimate geometry.

**Arc:** choose the nearest directly hit actor as the origin; for an explosive surface shot with no direct actor, use the highest-damaged blast victim (ties: distance then stable actor ID). Choose the nearest eligible secondary actor within 4 m, with unobstructed origin-to-target sightline; exclude every actor already damaged by that ejection. One arc event across all barrels, pellets and piercing hits. It is instantaneous, torso damage, with no head multiplier, splash or further chain. If all nearby enemies already took damage, do not silently convert it into extra primary damage. Charge/gatling/barrel/ammo damage all contribute through the base ejection D; neither actor count nor pellet count multiplies the arc budget.

**Brake:** apply once per victim after resolving damage. Pellets cannot multiply the 20% slow; later hits merely refresh the timer. It affects horizontal locomotion, not gravity, jump-pad impulses or attack cadence. Enemies retain at least 80% ordinary self-propelled speed. Longer streaks extend the useful control window, never progress toward permanent roots.

**Kill events:** only unique enemy deaths credited to the player's gun advance k, including its secondary payloads. Assists, scenery, corpses and self damage do not. A multi-kill can cross several thresholds, awarding each once. No secondary spawns new secondary effects or on-death explosions. New stacks affect the next action; they never change a burst or projectile already in progress. If the owner dies during resolution, award score but no healing, ammunition, focus or stacks to a new life. In-flight effects keep their original damage snapshot and life ID. No resurrection by a simultaneous repair reward.

**Refill during reload:** Service loop first returns cartridges. If at least one complete ejection is now loaded, end the reload; any new action still waits for its pre-existing recovery deadline. Threshold rewards cannot reset a shot timer, feed repeated free trigger events or replay a kill. Health/focus credits occur once after all same-step damage; death takes precedence.

### Shared rival progression and earned threat

Players and bots use the same four slots, rarity formulas, life-bound circuit rewards, banked shop-quality marks and contested token economy. All receive one free upgrade choice per round. Bots improve by collecting tokens, choosing parts and upgrading rarity, without legacy perks, wallets or hidden round damage/health boosts.

The Common/no-streak maximum complete-sequence head damage is 178.2 internal, below the old 180 budget. That guarantee does not extend to earned rarity or circuit power. Fully upgraded enemies can deliver lethal attacks; give those attacks longer readable preparation and committed aim, rather than secretly clamping damage. Exact threat thresholds and token-pursuit difficulty are specified in [the progression extension](rarity-and-shop.md).

Use swept movement and grouped equal-trajectory projectiles for high stacks; there is no hidden gameplay cap on earned streak power. The audit's 120-health target is a durability stress case, not a retained armor perk.

## 7. Readable builds to aim for

These are examples of the rules, not hidden recipes or extra bonuses.

| Build | Baseline behavior | How its circuit changes the life |
|---|---|---|
| Semi + huge + normal + Service loop |102 centered damage every .80 s,12 cartridges, .85 s reload|Two cartridges returned per kill; repeated accurate kills can sustain the heavy gun without reloads.|
| Charge + rails + piercing + Arc |100 damage, instantaneous three-actor penetration; .48 s preparation/.744 s cycle|After 3 kills, a 60-damage jump can reach an additional nearby opponent. Actors already pierced cannot be hit by the arc too.|
| Burst + double + explosive + Echo |Six micro-rockets per action;37.8 total damage per paired ejection,113.4 per burst|At 3 kills, three additional 15.12-damage micro-rockets per burst. Nine total rockets, not twelve.|
| Automatic + gatling + pellets + Momentum |21.06 total pellet damage per ejection; .088 s warm interval|Speed grows 6% per kill, helping keep the close-range stream effective while rotating and dodging.|
| Charge + huge + pellets + Rebound |162 damage across eight enlarged pellets; .60 s preparation/.92 s cycle|After 2 kills, each world-striking pellet can reflect once at 60% strength; no bonus from shooting a corpse repeatedly.|
| Semi + single + sniper + Time |85 damage every .625 s;110.5 head damage|Every 2 kills restores focus and builds regen, supporting deliberate slow-time precision.|
| Automatic + rails + duplex + Brake |45 damage across two centered, instantaneous tandem traces; .2688 s interval|After 2 kills, hits briefly slow targets, making follow-through and target retention easier.|
| Burst + single + normal + Overpressure |Three 24-damage shots per burst|At 4 kills each shot reaches 35.52; a full 106.56-damage body burst crosses a clear breakpoint.|

## 8. Acquiring and understanding parts

Start with Common automatic, single, normal ammo and Overpressure. Before each round, including round 1, take one free attachment from three offers plus one extra offer per collected token. No money. Any identity can roll Common/Rare/Epic/Legendary at 55/25/15/5 base rates; never offer an owned identity at the same or lower tier. A rarer selection replaces the old copy. Retain free refitting between rounds.

Every death independently drops a public physical token at 20% probability. Anyone can collect it; it persists through death and is marked on the minimap. Players and bots bank the same extra-choice benefit. Level 1 bots ignore deliberate token pursuit; high-level bots contest tokens quickly through better reactions and routes. An actor owning every part at Legendary keeps playing but receives no further upgrades.

See [complete rarity, eligibility, token and bot rules](rarity-and-shop.md), including Assayer promotion math and shared high-impact attack scheduling. Existing saved runs need a versioned migration; no implicit save deletion is authorized by this design document.

Use four large slot selectors, a gun preview and one sentence describing the resulting behavior. Show damage **per ejection**, projectiles, complete burst damage, charge time, full cycle and loaded actions. For explosive damage, separate direct and splash. A paired burst must not be labeled merely “burst rifle.” The practice bench needs moving isolated enemies, clustered enemies, a wall for bank shots,25/45 m targets, and buttons to preview circuit states at 0/3/6/9 kills.

Mechanical pieces should visibly work: a paired muzzle, oversize chamber, spinning assembly, accelerator rails and a small circuit module. Layer mechanism rhythm, barrel mechanical sound and ammo impact sound. Keep muzzle flashes and blast rendering below the reticle; heavier output should not blind the player. A small circuit icon shows the selected effect, kill progress and stacks. Brief threshold feedback replaces persistent instructions and a new action button.

## 9. What was audited and what remains unproven

The accompanying calculator enumerates all 120 Common physical builds and 10 circuits, plus 7,680 physical rarity combinations. It is a separate design model, not the running game. It applies damage, action times, burst gaps, cold/warm gatling timing, capacity rounding, empty reload, reference health and falloff. It also reports every circuit at equal kill counts and verifies non-recursive projectile-event bounds.

Base mechanical kill times omit acquisition, travel, target movement and human correction. A zero means the first ejection kills; it does not mean literally instantaneous perception-to-death. All-pellet contact is an optimistic close ceiling. Medium/long stress cases assume half the pellet output lands; duplex retains all its centered damage; this is an explicit damage sensitivity test, **not a geometric aim simulation**. Extra echo/arc/rebound damage is conditional; a spreadsheet ceiling does not prove it will occur.

See [audit-summary.json](audit-summary.json), [all 120 physical builds](combinations.csv), [Common circuit comparison](reward-audit.csv), [rarity and shop audit](rarity-and-shop-summary.json), [all physical rarity builds](rarity-builds.csv), [reproducible design calculator](audit.mjs) and [research and revisions](sources-and-critique.md).

Before adopting numbers, prototype all parts with existing real hitboxes and moving bots. Test every physical combination for correct composition, then human-test representative extremes and all circuits on the actual target phone. Priorities: preloaded charge/gatling/sniper follow-through; single/charge/piercing against an isolated opponent; centered tandem delivery at 45 m; pellet core reliability; double-barrel payoff; explosive close safety; rebound auto-fire; echo visual/performance load; and whether control/utility circuits compete with immediate damage.

Track actual aim-to-first-hit time, effective damage per exposed second, reload exposure, kills/deaths, streak-length distribution, effective healing/focus, damage from secondary paths, refit choices and voluntary repeat choices. Do not balance solely around perfect DPS or equalize every build's strongest moment. Every build must offer a credible approach on every active map, and a way to survive an unexpected close encounter. If a build repeatedly fails that test, revise its part or interaction rather than adding a secret compensating bonus.
