# Response-focused weapon balance

All breakpoints below assume 100 HP, no healing, all shots land, and no reload.
TTK is measured from first impact to lethal impact; bot reaction, windup, travel,
misses and burst rests add time. Stock damage is shared by players and native rivals.
Head / torso / limb multipliers remain 1.5 / 1 / 0.75.

| Stock weapon | Previous body damage | New body damage | Body hits / ideal TTK | Head hits / ideal TTK |
| --- | ---: | ---: | --- | --- |
| Jackhammer | 24 | 24 | 5 / 0.52 s | 3 / 0.26 s |
| Nailer | 83 | 45 | 3 / 1.06 s | 2 / 0.53 s |
| Rattler | 13 | 13 | 8 / 0.385 s | 6 / 0.275 s |
| Lancer | 155 | 80 | 2 / 1.35 s | 1 / instant |
| Demolisher | 150 actual peak | 80 peak | 2 / 0.85 s | No head multiplier |
| Sledgehammer | 144 shell | 108 shell within 2 m | 1 close; 2 / 0.83 s at 8 m | Placement and range dependent |

The old Demolisher had a hardcoded 150 damage budget overriding its displayed
110 base damage. It now uses its actual base stat, as other guns do.

## Shotgun placement and distance

The stock shell has twelve 9-damage pellets. Direct damage scales linearly from
100% at 2 m to 60% at 12 m and stays at 60% beyond that. Spread still determines
how many pellets land, including the four tight-core pellets.

- All twelve torso hits kill only within approximately 3.85 m.
- At 5 m: 95.04 full-body damage; no body one-shot.
- At 8 m: 82.08 full-body damage. Six head pellets plus six torso pellets kill;
  five head pellets plus seven torso pellets do not. Ten head pellets with two
  misses also kill, rewarding a well-placed midrange head shot.
- At 12 m and beyond: even all twelve head hits deal only 97.2.
- Limbs reduce damage further. Armor (140 HP) changes these breakpoints.
- Buckshot, flechettes and fragmentation direct hits share this falloff.
  Slugs retain their lower budget and separate 12–30 m range curve.

## Attachments and other lethal packets

All 96 action/ammunition combinations are checked. Non-shotgun, non-Lancer guns
cannot remove 100 HP in one simultaneous packet, even with all head hits plus
maximum splash. Every Lancer action/ammo combination requires head damage for a
one-pull kill. Split rails now total 80 body damage; Siege is 90 body / 135 head.
Rapid pulse is 70 body / 105 head.

Paired Nailer rounds are 32 each, Hammerfall is 45 per round with 0.18 s spacing,
and Shattershot fragments use 30% per fragment. Duplex rifle bullets use 50%
each. Rifle ratchet rounds are 28 with 0.11 s spacing; the SMG cam uses 18 with
0.08 s spacing. These bursts can still kill quickly, but deal separate,
time-spaced impacts.

Rocket actions peak at 60 (rotary), 2 × 40 (twin), and 90 (charged).
Breach contact is 90% impact plus 20% splash, at most 99 on the charged action.
Direct rocket targets are excluded from a second area hit. Grenade/legacy
explosion damage against bots now peaks at 90/80, removing their former
165/150 peaks; incoming legacy damage remains its already lower 90/60 maximum.

No changes to bot difficulty, reaction or aim were needed: native bots use the
same revised loadout stats. Existing telegraphs and spawn grace remain in place.
Crossfire, injured targets and separate follow-up attacks can still produce
fast deaths; these changes address single-discharge lethality.

## Validation

Tests cover all action/ammo pairs, actual traced shotgun packets (including
misses), native incoming Nailer and Lancer hits, distance-scaled paired shots,
and existing armory scheduling, mobile targeting, explosion and damage behavior.
