> Superseded rendering evidence: the original map-art captures below used shader changes the user did not authorize. The exact historical world-space shader and water composition are restored in the subsequent correction; see [restoration review](pixel-forge-restoration.md). These captures remain an archive of geometry and paint assignments, not evidence of the current final output.

# Per-map art review

Shoot House is retained exactly as approved and published in `aee5ddd`. All nineteen remaining active maps received individually authored palettes and native multi-area review at100/50/5HP. Final representative captures below use the production geometry, materials, lighting and final rendering pipeline. A successful bake alone is never treated as a visual review. Detailed iteration notes and exact source/asset fingerprints are in each map ledger.

| Map | Palette | Final evidence |
| --- | --- | --- |
| reservoir | Lagoon & aged brass | [Reviewed](reservoir-final.jpg) |
| rust | Sienna, violet smoke & lichen | [Reviewed](rust-final.jpg) |
| shipment | Dock blue, persimmon & canvas | [Reviewed](shipment-final.jpg) |
| nuketown | Flamingo, pool enamel & vanilla | [Reviewed](nuketown-final.jpg) |
| killhouse | Workshop amber & ink blue | [Reviewed](killhouse-final.jpg) |
| vacant | Celadon, wine & worn porcelain | [Reviewed](vacant-final.jpg) |
| showdown | Lapis, pomegranate & travertine | [Reviewed](showdown-final.jpg) |
| firingrange | Field sage, russet & blue steel | [Reviewed](firingrange-final.jpg) |
| hijacked | Marine navy, teak & sea glass | [Reviewed](hijacked-final.jpg) |
| summit | Glacier, spruce & weathered vermilion | [Reviewed](summit-final.jpg) |
| siege | Heather stone, verdigris & old mortar | [Reviewed](siege-final.jpg) |
| mutiny | Oxblood, storm enamel & industrial ivory | [Reviewed](mutiny-final.jpg) |
| bravery | Aubergine, brushed brass & mineral cyan | [Reviewed](bravery-final.jpg) |
| ef-showdown | Apricot plaster, periwinkle & peacock | [Reviewed](ef-showdown-final.jpg) |
| delta-station | Cobalt ceramic, dusty rose & bronze | [Reviewed](delta-station-final.jpg) |
| beta-station | Malachite, amber & lavender smoke | [Reviewed](beta-station-final.jpg) |
| forge2 | Iron orange, wine slag & furnace teal | [Reviewed](forge2-final.jpg) |
| forge1 | Indigo enamel, flame copper & olive ash | [Reviewed](forge1-final.jpg) |
| blast-radius | Duck egg, saffron shield & blackcurrant | [Reviewed](blast-radius-final.jpg) |

## Corrections made during review

- Reservoir: select the actual lightest paint for ceilings, reduce wall texture variance, and prevent small touching frames from joining perpendicular architectural planes.
- Rust: replace the initially familiar patina pairing with violet smoke and lichen; explicitly review all four tower elevations.
- Firing Range: remove graphic treatments from exact original rock, foliage and landscape surfaces. Geometry-only slope detection was insufficient for vertical rock faces.
- Mutiny and Forge maps: upward decks imported as rubber/thin steel were bypassing floor paint. Give the floor role priority at every elevation; repeat native lower/upper checks. No emission workaround remains.
- Whole roster: share graphic shader programs through color/story-height uniforms, preserve source triangle fingerprints, validate final packed paints, and retain accurate fence holes and depth-tested actor protection.
