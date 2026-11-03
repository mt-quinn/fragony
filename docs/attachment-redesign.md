# Attachment redesign proposal

Status: approved and implemented. User amendments: penetrating rounds retain full first-target damage; slamfire preserves full shell damage and accumulates recoil/spread while firing, settling within 80 ms on release. Numerical balance remains open to playtesting.

Give each weapon several recognizable builds, with powerful upgrades that change firing rhythm, shot behavior or reload decisions. The industrial-tool identity stays: mechanical conversions, ammunition, loading systems and handling rigs. The full proposed catalog is 54 weapon-specific attachments plus three handling families available on every weapon: 72 purchasable weapon-specific choices in total. Sights become free preferences.

Numbers below define the approved initial tuning and implementation, subject to playtesting. Costs are run-local credits. Damage examples use a standard weapon with no other attachments; composition rules below define mixed builds.

## What the current game establishes

| Weapon | Damage | Shot interval | Magazine | Full reload | Starting role |
| --- | ---: | ---: | ---: | ---: | --- |
| Nailer | 83 | .53 s | 7 | 1.60 s | Hand cannon |
| Rattler | 13 | .055 s | 42 | 1.05 s | Close-range automatic |
| Jackhammer | 24 | .13 s | 30 | 1.35 s | Accurate automatic rifle |
| Sledgehammer | 12 × 12 pellets | .83 s | 8 | 1.70 s | Pump shotgun with four tight core pellets |
| Demolisher | Up to 150 explosion damage | .85 s | 5 | 1.80 s | Slow rocket, 5.5 m blast radius |
| Lancer | 155, pierces actors | 1.35 s | 4 | 2.00 s | Precision rail rifle |

Standard opponents have 100 health. The player can buy 140 spawn health. Direct bullet/pellet headshots currently deal 1.5× damage. Reserve ammo is unlimited. Current player hitscan has no distance-based damage falloff; spread provides most range differentiation. Bots use their own damage/reaction/spread tuning. Holding the trigger repeats shots on all six weapons today; genuine semi-auto and burst rules would be new behavior.

The Demolisher's base record says 110 damage and some UI scales it to 150, while the actual explosion peaks at 150. The redesign makes the displayed damage match actual behavior, with direct contact receiving the listed peak once, rather than an extra hidden impact packet.

Source basis: dist/game.js, dist/loadout.js, dist/loadout-view.js, dist/shop.js, dist/ai.js and dist/combat.js. This proposal changes weapons and attachment progression; environment art remains the next workstream.

## Build rules

Five slots: **action, ammunition, feed, handling and sight**. Fit up to **three gameplay attachments** across the first four slots, plus one free sight. One attachment per slot; stock parts are valid. An action/ammunition/feed build gives up a handling rig, while an action/ammunition/handling build keeps the stock magazine. Bought parts remain owned and can be swapped free between rounds.

- Action determines mode, cadence and damage budget per cartridge.
- Ammunition transforms that cartridge's budget into impact damage, pellets, splash or chaining.
- Feed determines capacity and loading behavior. Explicit capacity/reload values replace stock values rather than stacking hidden additions.
- Handling changes approach and movement, not another small damage percentage.
- No nested payloads: explosive, penetrator, duplex, frangible, slug, arc and flak choices share the ammunition slot. One cannot combine explosive rounds with another ammunition conversion.
- Simultaneous shots consume one cartridge per barrel; bursts consume one per bullet. A final incomplete volley/burst fires only the cartridges remaining and keeps the normal recovery. No free second projectile.
- No random jams, random critical hits, permanent stat inflation, durability or consumable special-ammo purchases. Once fitted, special ammunition refills on normal reloads from unlimited reserves.

## Nailer

Keep the heavy hand cannon; allow a compact automatic, a two-barrel execution tool or a controlled burst weapon.

| Part | Slot / price | Proposed behavior and cost |
| --- | --- | --- |
| Riveter action | Action / 320 | Full-auto, **300 RPM**, **33 damage** per round. Per-shot recoil −40%. Rapid close-range fire; stock seven rounds disappear quickly. |
| Twinstrike block | Action / 360 | Two simultaneous **54-damage** shots, 2 rounds consumed, **.70 s** between volleys. Barrels separated by 2°; recoil +35%. Both body shots kill a standard opponent. |
| Hammerfall action | Action / 380 | Two-shot burst, **62 damage per shot**, .065 s internal spacing, **.75 s burst-start interval**. Recoil +20%; target tracking through the second shot matters. |
| Demolition caps | Ammunition / 280 | **70% impact + 30% blast**, 1.25 m radius. Stock example: 58 impact + 25 splash. Splash has no headshot multiplier and can hurt the shooter. |
| Machined penetrators | Ammunition / 240 | Full direct damage; penetrates two opponents, second takes 60% of the first's damage. Small groups become an opportunity; cover still stops it. |
| Shattershot cartridges | Ammunition / 280 | Three fragments, each **46%** of the cartridge's damage, in a 7° cone. Stock maximum ≈115 damage. Close-range one-shot potential; loses the hand cannon's precision. |
| Four-round speed clip | Feed / 150 | **4 rounds / .55 s reload**. Fast peek/reload rhythm, frequent commitment to reload. |
| Twelve-round magazine | Feed / 200 | **12 rounds / 2.20 s reload**; ADS time +20%. Supports conversions but creates a long exposed reload. |
| Empty-drop loader | Feed / 180 | **7 rounds**; reload empty in **.75 s**, tactical reload in **1.90 s**. Rewards finishing a magazine rather than compulsively topping off. |

## Rattler

Make the small/fast and huge/slow magazines more extreme. Builds should distinguish frantic close damage, short accurate bursts and double-barrel spray.

| Part | Slot / price | Proposed behavior and cost |
| --- | --- | --- |
| Overspeed bolt | Action / 360 | **Double fire rate**: .0275 s interval, ≈2,182 RPM. **9 damage** per round, recoil +50%. More damage per second, much less damage per magazine. |
| Three-round cam | Action / 340 | Three-shot bursts, **22 damage** per bullet, .035 s internal spacing, **.24 s burst-start interval**. Spread −40%; recovery prevents uninterrupted spray. |
| Duplex feed block | Action / 360 | Two simultaneous **10-damage** bullets every **.07 s**, 2 rounds consumed, 5° barrel separation. Powerful close spray; both bullets are difficult to land at range. |
| Frangible rounds | Ammunition / 250 | Damage **+35% within 8 m**, falls linearly to **55% of standard damage at 18 m**, stays there beyond. Strong room-clearing specialization. |
| Microblast rounds | Ammunition / 300 | **70% impact + 30% blast**, .8 m radius. Modest group chip damage at rapid cadence; no explosive headshot multiplication. |
| Needle rounds | Ammunition / 240 | Full direct damage; passes through two opponents, second takes 60%. Rewards lining up a group instead of pure single-target damage. |
| Twelve-round quick magazine | Feed / 140 | **12 rounds / .35 s reload**. Very short attacks, exceptionally short downtime. |
| Ninety-six-round drum | Feed / 220 | **96 rounds / 2.20 s reload**; movement −12%, ADS time +25%. Sustained fire becomes a deliberate heavier role. |
| Coupled magazines | Feed / 190 | **24 rounds**; alternates **.25 s** and **1.40 s** reloads. The quick spare is consumed until the next normal reload; switching weapons cannot reset this cycle. |

## Jackhammer

Keep a dependable all-rounder, with conversions into a high-output hose, a burst rifle or a marksman tool.

| Part | Slot / price | Proposed behavior and cost |
| --- | --- | --- |
| Overdrive carrier | Action / 380 | **Double fire rate**: .065 s interval, ≈923 RPM. **17 damage**, recoil +50%. Higher output at the cost of magazine efficiency and control. |
| Three-round ratchet | Action / 400 | Three **36-damage** shots, .055 s spacing, **.48 s burst-start interval**. One complete body burst deals 108. Missing a bullet leaves a real recovery gap. |
| Surveyor receiver | Action / 340 | True semi-auto, **58 damage**, **.25 s** minimum shot interval. Spread −50%, recoil +30%. Becomes a deliberate two-body-shot rifle against 100 health. |
| Demolition rounds | Ammunition / 300 | **65% impact + 35% blast**, 1.5 m radius. Trades headshot efficiency for group pressure and surface splash. |
| Duplex cartridges | Ammunition / 280 | One cartridge produces two bullets, each **65%** damage: 31 total on the stock rifle. 4° separation in hip fire, 1.5° ADS. A short/mid-range alternative to precision ammo. |
| Through-bolts | Ammunition / 260 | Full direct damage; penetrates three opponents at **100% / 70% / 40%** of the modified damage. No penetration through architecture. |
| Fifteen-round sprint magazine | Feed / 150 | **15 rounds / .55 s reload**. Short aggressive engagements and quick resets. |
| Sixty-round box | Feed / 210 | **60 rounds / 2.40 s reload**; movement −10%. Holds a lane, pays for a poorly timed empty magazine. |
| Service-feed reservoir | Feed / 200 | **45 rounds**; reload starts after .45 s, then inserts one round every .035 s. Can interrupt to fire rounds already inserted. Empty-to-full is ≈2.03 s. |

## Sledgehammer

Preserve the pump shotgun, with automatic pressure, paired shells or a more deliberate precision pattern.

| Part | Slot / price | Proposed behavior and cost |
| --- | --- | --- |
| Slamfire carriage | Action / 380 | Full-auto cycling at **double fire rate**, .415 s interval. Stock buckshot stays **12 × 12 damage**. Strong recoil and pellet spread increase with successive automatic shots; both settle rapidly after releasing fire (80 ms spread recovery). |
| Double-strike breech | Action / 380 | Two simultaneous shells, each **96 total buckshot damage**, every **1.10 s**. Patterns fan 3° apart; consumes 2 shells. Big close-range volley or a sweep across two opponents. |
| Precision pump | Action / 300 | Eight **18-damage** stock pellets, all in the tight core pattern. **1.05 s** interval; half spread. For other ammunition, preserves that ammunition's projectile count and halves its spread. |
| Machined slugs | Ammunition / 280 | One accurate projectile: **≈115 damage through 12 m**, falls to **≈75 at 30 m**. Headshots remain 1.5×; turns the shotgun into a short/mid-range precision weapon. |
| Fragmentation shells | Ammunition / 320 | Six fragments totaling **≈60 impact**, plus **one ≈45-damage explosion**, 2 m radius. Maximum stock direct-hit total ≈105; loses the standard shell's 144 close-range damage. |
| Breacher flechettes | Ammunition / 280 | Eight tight flechettes totaling **144 damage**; passes through two opponents, second takes 60%. Full first-target shell budget, with a tighter pattern and group reach. |
| Four-shell speed tube | Feed / 150 | **4 shells / .65 s full reload**. Compact, fast to reset, limited repeated attacks. |
| Twelve-shell carrier | Feed / 210 | **12 shells / 2.40 s full reload**; movement −8%. More consecutive clears, much more reload exposure. |
| Individual-shell gate | Feed / 180 | **6 shells**; first shell in .35 s, subsequent shells every .22 s. Interrupt the reload to shoot immediately with loaded shells. Empty-to-full ≈1.45 s. |

## Demolisher

Build around deliberate manual launch, blast placement and alternate projectile behavior. Keep rocket jumping.

| Part | Slot / price | Proposed behavior and cost |
| --- | --- | --- |
| Rotary breech | Action / 400 | **Double fire rate**, .425 s interval. Rockets have **100 peak damage**, recoil +40%. Sustained bombardment, fewer one-hit kills and much less damage per magazine. |
| Twin-launch rack | Action / 400 | Two simultaneous rockets, each **110 peak damage**, every **1.25 s**, separated by 4°. Consumes 2 rockets. Overlapping blasts or wide corridor coverage. |
| Pressure chamber | Action / 420 | Hold to charge **.40 s**, launch a **220-damage** rocket; **1.40 s total cycle**. Rocket speed +50%, radius −20%. Charge can be canceled; demanding, powerful placement. |
| Airburst fuze | Ammunition / 320 | Detonates within 1 m of a visible opponent after traveling 2 m. **80% peak damage**, 4.5 m base radius. Helps against dodging targets; no homing or sensing through cover. |
| Breach charge | Ammunition / 300 | Direct contact gets **120% impact + 20% splash** of the cartridge budget: stock example **180 + 30**, 2 m radius. Strong direct hits, sharply reduced area damage. Surface misses produce only the small splash. |
| Skip casing | Ammunition / 280 | Bounces off the first wall and detonates on the next surface or after a 1.20 s fuse. Actor contact detonates immediately. Stock damage/radius; angle shots require planning. |
| Two-rocket quick rack | Feed / 160 | **2 rockets / .65 s reload**. Frequent, short reloads; supports deliberate peek attacks. |
| Eight-rocket cassette | Feed / 220 | **8 rockets / 3.00 s reload**; movement −15%. Extended bombardment with a substantial recovery window. |
| Recovery loader | Feed / 220 | **3 rockets**; while the trigger is released, loads one rocket per .60 s. Shooting interrupts and resets the current insertion. Manual reload disabled. Rewards cadence and weapon switching. |

## Lancer

Preserve precision and actor piercing, with a fast headshot weapon, paired rails or a charged heavy shot.

| Part | Slot / price | Proposed behavior and cost |
| --- | --- | --- |
| Rapid-pulse capacitor | Action / 380 | **Double fire rate**, .675 s interval. **95 damage**. Body shots stop one-shotting standard opponents; headshots deal 142.5 and still kill 140 health. |
| Split-rail assembly | Action / 400 | Two simultaneous **90-damage** rails, **1.60 s** interval, 1.5° separation. Consumes 2 charges. Both body hits kill 140 health; one alone does not. |
| Siege capacitor | Action / 420 | **.45 s charge**, **240 damage**, **1.80 s total cycle**. Full actor piercing, recoil +50%. Charge telegraph and tracking replace instant snap shots. |
| Arc conductor | Ammunition / 340 | Initial hit **75%** damage, then jumps to two different visible opponents within 3 m for **30% / 15%**. Stock ≈116 → 47 → 23. Replaces straight-line piercing; secondary hits cannot headshot or chain again. |
| Flak lattice | Ammunition / 300 | Five flechettes at **23%** damage each, ≈178 total stock damage, in a 6° cone. Removes piercing. A close-range scatter rail rather than a sniper. |
| Shaped pulse | Ammunition / 320 | **65% impact + 40% blast**, 2.25 m radius. Stock ≈101 + 62. Removes piercing and some headshot damage; adds controlled area pressure. |
| Single-charge quick cell | Feed / 160 | **1 shot / .75 s reload**. Reload can overlap the weapon's ordinary recovery, never bypass it. Strong sustained precision if the player accepts reloading every shot. |
| Eight-charge battery | Feed / 220 | **8 shots / 3.40 s reload**; movement −10%, ADS time +20%. Sustained overwatch, slow recovery. |
| Recuperator bank | Feed / 220 | **3 shots**; direct headshot kills return **one charge per trigger event**, capped at magazine capacity. Body kills, splash and arc kills do not refund. |

## Handling and sights

These three handling families are available separately for each owned weapon. They compete for the third gameplay attachment; they are not free additions to an action/ammunition/feed build.

| Handling part | Price | Behavior and cost |
| --- | ---: | --- |
| Entry rig | 200 | ADS and weapon-swap times **halved**; ADS movement +30%. Recoil +30%. Supports rushing and quick weapon transitions. |
| Anchor rig | 180 | After crouching or standing still for .25 s, recoil and spread **halved**. Ends on movement; ADS time +20%. Supports deliberate lane control. |
| Service sling | 240 | A holstered weapon begins its normal reload after **1 s**. Switching back pauses the reload; it finishes at the ordinary rate while holstered. Full manual reload time +20%. It must use the real feed state, including coupled-mag phases and individual loading; no instant free full magazine. Incompatible with the Demolisher Recovery loader, which already loads while holstered. |

Free sights: iron/open sights, open dot, circle dot, holographic, prism 2×, duplex 2× and scout 2×. Keep the authored housings and reticles. Remove tiny ADS penalties and credit costs from optic style. Magnification gives a real tradeoff through field of view and scoped sensitivity; do not sell six nearly identical attachments as build power.

## Composition and balance rules

The **cartridge damage budget** is the stock damage for a single consumed round, replaced by an action conversion's stated damage. For stock shotgun shells this is 144 total; for converted shotgun shells use the action's total shell budget. For rockets it is 150 peak. Payload percentages use that budget. Examples in the tables are rounded for reading; damage calculations retain precision.

- Riveter + demolition caps: each round becomes 23.1 impact + 9.9 maximum splash, not 33 plus the stock hand cannon's 25 splash.
- Three-round Jackhammer burst + demolition rounds: each 36-damage cartridge becomes 23.4 impact + 12.6 splash. One full direct-hit burst totals 108, not 108 plus free explosions.
- Jackhammer overdrive + duplex cartridges: each consumed cartridge produces two 11.05-damage bullets. This is strong close damage with higher recoil and split impact points.
- Sledgehammer double-strike + fragmentation shells: each consumed shell gets 42% impact and 31% blast from its 96-point budget, ≈70 per shell. Pellets do not each create an explosion.
- Lancer rapid pulse + arc: primary impact becomes 71.25, secondary hits 28.5 and 14.25. Rapid chaining gives up the capacitor's one-headshot kill against armored health.

Payloads set their stated radius/projectile pattern; action modifiers then adjust it (Pressure chamber plus a 2 m breach charge gives a 1.6 m blast). Hip/ADS spread and handling apply afterward. Explosive bullets erupt only on an actual actor or surface hit, not at an arbitrary point when a ray misses. Each consumed explosive cartridge produces at most one explosion. Separate rockets/shells can each explode; multiple pellets from one cartridge cannot. Visual flashes/smoke can be merged at high fire rates while damage remains correctly scheduled. Arcs never revisit an opponent, cross solid cover, trigger headshot refunds or recursively spawn other payloads. Bullet penetration is through opponents only. No wall destruction, structural wall penetration or infinite ricochet chains in this redesign.

Direct bullets/pellets keep 1.5× headshots; splash, arcs and rocket contact do not. Area damage uses real line of sight and linear falloff to zero at its stated edge. Shooter self-damage remains enabled, with explosive bullet/shell self-damage at 40% of that payload's splash; rocket self-damage and jump impulse retain the current movement tuning. Upgrade effects belong to their weapon and are captured when firing; changing weapons cannot alter an airborne shot. Grenades and killstreaks keep their own stats.

Other than the specifically described frangible and slug payloads, retain existing distance damage behavior in this pass. Tight spread and small splash radii must matter. Heavy attachments multiply only their listed movement/ADS penalties; no hidden handling taxes. Apply ordinary reload/quickdraw perks after the chosen part's timings. Reload and firing recovery can overlap but neither can bypass the other's completion.

## Firing behavior and mobile

Stock Nailer, Lancer and Demolisher become genuine semi-auto in manual mode; the Sledgehammer fires once per pump cycle/trigger pull; Rattler and Jackhammer remain automatic. This is an explicit manual-input change from today's held repeat. Offer a **hold-to-repeat semi-auto** accessibility toggle, default on for touch manual hip-fire and off for desktop manual fire. Conversions still change cadence, damage and recoil even with that convenience enabled.

Simple Mode remains the default on mobile. It supplies deliberate trigger pulses for semi-auto guns at legal cadence and repeats bursts while a valid target is maintained. Keep the approved small acquisition margin and .18 s charge drain. Timer charge does not create hits, steer bullets or replace shot cooldowns.

For Simple Mode bursts, loss of the real target/clear sightline cancels unspent shots immediately; the burst recovery still completes. Manual bursts finish after trigger release, with every shot following the current aim. Weapon switch, reload, death and pause cancel pending burst/charge state; unspent rounds remain in the magazine. Charge actions add their stated charge time after acquisition; canceling charge costs no round but imposes .15 s recovery. Rockets, including airburst rockets, always require manual fire. Charge launches happen on release only after the minimum charge; an early release cancels. Hold Hip fire to charge a launcher and release to launch; drag to the existing cancel zone to cancel. Auto-charged Lancer fires when fully charged and loses/cancels charge on target loss.

No new combat buttons are required. HUD shows real mode, burst count, charge progress and remaining shots/volleys. Audio and weapon animation distinguish overspeed cycling, burst recovery, twin discharge, shell loading and charged fire. Do not make power visible only in a comparison table.

## Shop and run progression

Current shops offer four random attachments and force one optic offer. The new system needs deliberate opportunities to form builds:

- Six attachment offers per shop: two actions, two ammunition choices, two feed/handling choices. All for weapons the player owns, distributed across owned guns when possible.
- The first shop guarantees one unowned action or ammunition offer for an owned weapon at a one-time **150-credit starter price**. That makes a defining upgrade accessible even after a third-place finish with no kills. The discount is stored in the offer, applies to that item once, and cannot be reset by saving or reopening. Prefer unowned items; once a category is exhausted, redistribute to another.
- Actions: 300–420 credits. Ammunition: 240–340. Feed: 140–220. Handling: 180–240. Keep existing round rewards/kill credits initially; a core conversion should be a plausible first purchase after a good opening round.
- One pinned attachment offer carries into the next shop, replacing one offer of its category. Pinning is free; no paid reroll currency or new permanent progression.
- Buying conflicting parts never silently replaces another slot or discards an owned attachment. Replacing within a slot is explicit; adding a fourth gameplay attachment asks which fitted part to remove.
- New cards show the complete before/after firing pattern, damage per cartridge and per volley, sustained output including reload, loaded trigger pulls, reload behavior and key tradeoffs. Convert RPM alone into burst timing when relevant.
- Practice offers every proposed attachment, free, with a one-tap stock reset. The Arsenal lists the same catalog with sample build previews; purchases remain run-local.

Migration: preserve weapon/perk/equipment progression. Map clearly equivalent old feeds to new feeds and old optics to free preferences. Refund the old purchase price of every retired/non-equivalent part, including unequipped owned parts, exactly once. Rebuild incompatible saved shop offers without granting purchases. Keep migrated weapons usable with stock parts if no clean equivalent exists. No save wipe.

## Example builds

| Build | Three attachments | What it should feel like |
| --- | --- | --- |
| Pocket riveter | Nailer Riveter + demolition caps + 12-round magazine | Compact automatic popper with a visible reload window. |
| Burst executioner | Nailer Hammerfall + penetrators + Entry rig | Quick transition into a hard, two-shot line attack. |
| Nailstorm | Rattler overspeed + frangible + 96-round drum | Ferocious close spray; heavy, inaccurate and slow to reset. |
| Snap ratchet | Rattler three-round cam + coupled magazines + Entry rig | Controlled bursts with alternating fast and slow recovery. |
| Demolition rifle | Jackhammer three-round ratchet + demolition rounds + 60-round box | Explosive burst pressure with a long reload commitment. |
| Twin-stream rifle | Jackhammer overdrive + duplex cartridges + 15-round magazine | Dense close fire in short attacks; frequent quick reloads. |
| Site surveyor | Jackhammer Surveyor + through-bolts + Anchor rig | Deliberate precision and aligned-target punishment. |
| Breach engine | Sledgehammer slamfire + fragmentation shells + 12-shell carrier | Repeated room pressure; reduced individual-shell lethality. |
| Slug hunter | Sledgehammer precision pump + slugs + individual-shell gate | Careful mid-range shots and interruptible top-ups. |
| Corner worker | Demolisher twin-launch + skip casing + recovery loader | Two banked rockets, then a natural pause to load and reposition. |
| Pressure washer | Demolisher pressure chamber + breach charge + two-rocket rack | Charged direct-hit punishment; poor wide-area coverage. |
| Crowd conductor | Lancer rapid pulse + arc conductor + eight-charge battery | Repeated visible chain hits instead of body-shot deletion. |
| Scatter rail | Lancer split-rail + flak lattice + Entry rig | Close precision ambush: ten flechettes and a substantial recovery. |
| Headshot engine | Lancer rapid pulse + recuperator bank + Anchor rig | Fast precision headshots keep a small battery alive. |

## Delivery and approval

Approval covers the catalog, slot/cap structure, firing modes, special-ammo behavior, shop changes, input rules, migration and presentation. Numerical values are initial tuning targets to validate in play. No environment-art changes, new weapons, opponent gearing system, permanent unlocks or changes to round length are bundled into this proposal.

Implementation order after approval: firing scheduler and damage composition; action conversions; ammunition; feeds/handling; shop/migration/practice; weapon visuals/audio/HUD; native integration and device-sized checks. Test weak and strong combinations against 100/140 health, realistic misses, reload exposure and multiple opponents. Verify partial magazines, interrupted bursts, line-of-sight splash/arc behavior, self-damage, save migration and mobile interruptions. Opponents retain their existing fairness tuning in the initial pass; adopting these new loadouts for bots is a separate balance decision.

The proposed catalog is complete for this pass; the examples are representative, not additional hidden parts. Map presentation follows this weapon redesign as restricted industrial facilities, with readable combat space and stronger construction/public-works identity.

## Implementation and verification

The entire approved catalog and supporting flow are implemented in the buildless game. Runtime data uses stable per-weapon action/ammunition/feed/handling IDs; free optic IDs remain compatible. Old catalog data is retained only for migration prices/equivalent feed mapping. The resolver caches compiled weapon stats, and projectile specs are captured at launch.

`FireControl` separates logical trigger pulls from physical cartridge shots, preserving existing stock cadence while supporting committed/manual bursts, cancelable Simple Mode bursts, paired ammunition consumption and charged hold/release. `FeedSystem` keeps phase/loading state per weapon; Service sling progress pauses on switching back, preserving loaded rounds for use, and resumes when holstered or manually reloading.

The inspection view hides arms, centers visible gun bounds, provides front-quarter lighting and can cycle actual conversion rhythms without consuming campaign ammo. Its renderer is the existing game context. Named sight anchors survive geometry merging; extra paired muzzle materials are disposed along with model buffers.

Automated coverage includes 72 purchases/free sights, transaction/cap/conflict behavior, starter/pinning/save continuity, idempotent refunds, normalized payload composition, full first-target penetration, burst/semi/charge timing,80 ms slamfire recovery, native HE/arc/rocket impacts, coupled/individual/holstered loading, headshot refunds, native Practice safety,720 model builds and 140 paired configurations. Existing stock SMG cadence at 30/60/144 Hz, recoil/ADS, grouped pellets, health/scoring, collision, five-map progression, audio and water regressions remain in the full suite. Desktop browser inspections verify the mobile workbench, real modified ammo consumption, charged launcher release, replacement modal and physical model view. Physical iPhone thermal/touch feel is a user-device validation.

Empty magazines now start reloading on the final cartridge, including paired actions and individual shell feeds. Recovery loaders retain their release-to-load behavior. Reservoir splash now uses outward surface normals and swept projectile contact so raised floors do not swallow explosions; solid walls still block damage.
