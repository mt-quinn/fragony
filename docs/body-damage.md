# Body-region damage

Direct gun hits now use these multipliers for both player and opponents:

| Region | Multiplier |
| --- | --- |
| Head | 1.5× |
| Torso / pelvis | 1× |
| Arms / legs | 0.75× |

`BODY_MULTIPLIERS` and `bodyDamage` in `dist/combat.js` are the shared rule. Native cartridge tracing applies the region multiplier after distance and penetration scaling, before grouping packets. Each pellet keeps its own resolved damage, so a mixed head/torso/limb shotgun hit is the sum of those hits. The legacy incoming-shot path also sums each resolved pellet rather than applying one head multiplier to the entire packet.

Area splash and arc jumps remain torso-area payloads; they do not acquire a second limb multiplier from the projectile's direct contact. Low-level `damageBot` / `damagePlayer` consume already-resolved amounts, so the region multiplier is never applied twice. Damage histories, assists, kill attribution, and recaps use actual health removed.

`tests/body-damage.mjs` verifies all seven named regions through real cartridge traces and native incoming player hits, mixed pellet packets, separate explosive splash, fallback regions, and exact recap totals. A 24-damage rifle round deals 36 to the head, 24 to torso/pelvis, or 18 to a limb.
