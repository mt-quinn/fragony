# Weapon balance and opponent safety

The approved balance baseline uses shared weapon damage, 200 internal player HP,
and 90 internal bot HP. Both present as 100 health. Armor adds 20 displayed armor
(240 internal player HP or 108 bot HP). `dist/balance.js` owns unit conversion,
perk activation limits, focus and kill income. No incoming damage clamp is used.

## Presentation and credit

Convert damage, healing and recap values using the recipient's **unarmored base**:
`display = internal * 100 / base`. Armor never changes this denominator. A 25-health
pickup restores 50 internal HP to the player and 22.5 to a bot. Actual removed
health, excluding overkill, determines damage credit; round only at presentation.
Kills remain 100 points, headshot kills 150, assists up to 100 based on normalized
contribution. HUD health caps at 100 and presents remaining armor separately.
Healing cannot raise either actor's maximum health. There is no passive health
regeneration or overhealing. Legacy purchased perks stay owned; at most two are
active, and free swaps are available in Your kit. Purchasing a third perk opens
that selection without silently displacing an active perk.

## Stock roles

Ideal body-hit times below target an ordinary bot at full damage range and omit
reaction, projectile travel, misses, reloads and bot pauses. Damage values are
internal authoring units, never directly displayed to players.

| Weapon | Internal damage | Interval | Magazine | Reload | Body hits / ideal time |
| --- | ---: | ---: | ---: | ---: | --- |
| Jackhammer | 25 | .12s | 30 | 1.30s | 4 / .36s |
| Nailer | 60 | .50s | 6 | 1.50s | 2 / .50s |
| Rattler | 14 | .055s | 42 | 1.00s | 7 / .33s |
| Lancer | 75 | .95s | 4 | 1.80s | 2 / .95s |
| Demolisher | 95 direct, 70 area peak | 1.10s | 3 | 1.80s | 1 direct |
| Sledgehammer | 12 × 10 | .85s | 8 | 1.60s | 1 centered close shell |

Stock falloff starts at 24/15/10/3m for rifle/pistol/SMG/shotgun and ends at
40/30/24/12m with 70/70/50/50% retained damage. The shotgun has four tight-core
pellets; remaining pellets still require placement. Double-strike extends its
range curve to 16m. Slugs have their own 12–30m curve, extended to 18–40m with
double-strike. All precision direct hits use a 1.5 head multiplier; shotgun
pellets use 1.25, shatter/flak and explosions use 1. Limbs remain .75.

## Conversions

Each gun retains three actions, three ammunition options, three feeds and three
handling options. Fit at most three gameplay parts plus a free sight. Exact
configs live in `dist/loadout.js`; behavior descriptions live in `dist/shop-copy.js`.

Actions earn a real firing-role benefit: single-burst kills, front-loaded paired
hits, faster close tracking, precision headshots, armored body kills after a
charge, or useful shotgun reach. Paired projectiles share the crosshair. They
consume two cartridges and pay recovery costs rather than forcing a miss.

Rattler Frangible preserves **identical stock spread and range damage**. It adds
30% damage inside 8m; the bonus tapers to zero by 18m, never below stock damage.
It competes with explosive and penetrating ammunition for the same slot. It
must never introduce an accuracy or medium-range damage penalty.

Rifle Duplex earns 20% more total damage. Nailer Shattershot and Lancer Flak earn
close body kills while losing precision head multipliers. Arc has a direct-hit
precision role and visible jumps to two other targets. Piercing, arc, refund
and holstered reload completion receive distinct feedback. Explosive cartridges
produce one blast per cartridge, not per pellet. Rocket direct victims are
excluded from a second area hit; action-specific splash budgets are independent
of direct damage. Auto-fire requires a real detonation surface, direct hit or
armed proximity opportunity, rather than an empty-air near miss.

Committed bursts finish at the current aim after trigger/target loss. Reload,
switching, recovery and death still interrupt. Feed options trade capacity
against reload exposure; remove the previous stacked movement/ADS penalties.
Sling begins holstered loading after .6s and increases reload time by 15%.

## Bot attacks

Native rivals resolve the same weapons, triggers, magazines and payloads as the
player, including fitted conversion engagement distances. Their decisions are
scheduled through per-victim reservations in `dist/attack-coordination.js`:

- At most two ordinary active attackers per target.
- A volley of at least 60 body damage, or a complete fixed burst of at least 90,
  counts as high impact and reserves exclusive pressure on that victim.
- High-impact attacks have at least .65s preparation. Aim stops following during
  the last .15s. Bots aim at the chest rather than deliberately snapping to heads.
- High-impact expected impacts are separated by at least .85s; ordinary attacks
  pause until .60s after expected impact. Rocket flight time retains reservations
  even if the shooter subsequently dies. Hits are never retrospectively reduced.
- Ordinary rifle/SMG decisions use two/four-shot bursts, with .55s pauses at the
  opening and .45s at the difficulty ceiling.
- Reaction progresses from .65s to .35s by round eight and then stays bounded.
  Difficulty varies movement, positioning and accuracy, not health or damage.

Off-target collateral damage and continuous fire remain dangerous. These rules
are attack scheduling, not invulnerability or a universal minimum survival time.

## Sustain, progression and shopping

Slow motion halves world speed while player weapon timing stays at full speed:
a 2× relative advantage. Full focus lasts 2.5s, regenerates 8/s after a 2s delay,
and gains 8 per weapon kill. Deep focus adds 25% regeneration. Recovery heals
20 displayed health per weapon kill; speed grants 10%; reload/quickdraw shorten
their relevant durations by 25%.

Keep 90s rounds and the scoreboard → shop → next-round flow. Starting pairs
contain one generalist and one specialist. Placement income is 350/325/300;
weapon kills grant10 and assists5. Actions/ammunition/feeds/handling/perks cost
300/250/150/200/350. Guns cost350, rail/rocket400. The first conversion discount
remains150; each shop guarantees an available action/ammunition offer for the
starting weapon. Rival wallets and purchases follow the same prices and rules.

Three weapon kills bank one streak. Streak damage never earns charge, focus,
Recovery or weapon-kill income. Airstrike warns for .75s, peaks at45 internal
(50 displayed bot damage), and overlapping markers hit each victim only once.
Surge restores40 displayed health and40 focus. Barrage launches three60-damage
rockets .12s apart. All effects respect cover and actual projectile collision.

## Verification

`tests/damage-breakpoints.mjs` runs `tests/balance-v2.mjs`: all96 native action /
ammunition combinations, maximum eligible head/pellet damage and full fixed
bursts. The maximum is175.5 internal, or87.75 displayed player health. This is
below the180 internal authoring budget, with no runtime damage clamp. The tests
also cover native heavy-opponent spacing, Frangible range parity, normalized
HUD/healing/assist values, armor, perk migration, charge limits, committed bursts,
airstrike warning/overlap, streak recursion and delayed barrage.

Existing native combat, shop, feed, payload, body-region, recap, model and map
regressions cover integration. Arithmetic checks and automated combat do not
substitute for human mobile playtesting of accuracy, warning readability and fun.

The design approach draws on [Griesemer's weapon-role and cadence discussion](https://rewardingplay.com/2011/06/21/gdc-2010-design-in-detail-18/),
[Halo's practical kill-reliability tuning](https://www.halowaypoint.com/news/sandbox-update-halo-infinite),
[Bungie's conversion payoff discussion](https://www.bungie.net/7/en/News/article/twid_05_01_2025),
[Riot's counterplay principles](https://www.leagueoflegends.com/en-us/news/dev/quick-gameplay-thoughts-may-14/),
and [Valve's separation of pacing and difficulty](https://cdn.fastly.steamstatic.com/apps/valve/2009/ai_systems_of_l4d_mike_booth.pdf).
The numerical baseline is Fragony's design choice, not a published industry standard.
