# Shipment jump routes

The recommended pair brings the two original upper container stacks into play from opposing side approaches. The central ground crossing stays clear, neither pad launches directly from a spawn, and neither roof needs new supporting geometry.

Coordinates are `[x,feetY,z]`. Use a **0.75m trigger radius** and approximately 1.9m visual plate. Power is initial vertical velocity under the game's 23m/s² gravity.

| Route | Takeoff | Landing | Power | Nearest source spawn |
|---|---|---|---:|---:|
| West service launch | `[-30,0.007981,-16]` | `[-19,7.5,-2.5]` |19 |13.05m |
| Northeast service launch | `[14,0.0125,-22]` | `[6,7.5625,-12]` |19 |11.50m |
| Optional southeast lower flank | `[13,0.039808,25]` | `[13,3.75,30]` |15 |10.93m |

The main landings are original source container roofs, brushes `shipment-brush-847` and `shipment-brush-1206`. Their heights, slopes, footprints and positions are unmodified. The optional lower landing is brush 599.

Every main/optional route passes standing-cylinder clearance at 180 points along the descending-root ballistic flight, with 0.4m radius and 1.9m body height. This is repeated for the center and eight surrounding takeoff offsets within 0.75m. Landing support and standing clearance also pass with surrounding 0.4m position offsets.

The west flight travels 17.41m horizontally in approximately 1.00s. The northeast flight travels 12.81m in approximately 0.99s. Both are exposed transfers onto existing roofs; the routes do not create a protected central elevator or a single privileged summit entrance.

## Safe returns

Real `moveCharacter` simulation at 120Hz, ordinary 7.5m/s travel and gravity 23 verifies return drops without new geometry:

- West roof toward its takeoff: first lands near `[-24.369,0,-9.089]`, then safely walks back toward `[-30,0.008,-16]`; approximately 2.28s total.
- Northeast roof toward its takeoff: first lands near `[11.193,0,-18.491]`, then safely walks back toward `[14,0.0125,-22]`; approximately 1.66s total.
- Optional southeast lower roof: safely returns to `[13,0.039808,25]` in approximately 0.69s.

A lower eastern candidate near `[21,0,-7]` was rejected despite a clear flight because it lies only 2.7m from a source spawn. Alternative lower-only service access is available at west `[-29,0.06726,-21]` to `[-29,3.9375,-28]`, power 15, but the opposing high-stack pair provides more meaningful use of the map's existing vertical structure.

These checks use the imported source collision, including redundant axial bounds on thin collision prisms. Rerun the exact checker if the converter changes collision-backed external props near these paths.


## Fourth route: original upper-container access

The source DM spawn at `[4.25,4,6.5]` is on the elevated crossed-container network. It must remain at its original location. A fourth small pad provides legal access through the existing lower roof and open west doorway:

| Takeoff | Landing | Power | Trigger radius | Visual plate |
|---|---|---:|---:|---:|
| `[-4,0,8]` | `[1.5,3.75,7.9]` | 14 | 0.75m | 1.9m |

The landing is the real roof of the original neighboring container (brush 1290), with a zero-radius-queried 0.7m support disk. All nine launch offsets pass 180-sample analytic standing-cylinder checks and actual 240Hz controller first-arrival checks. Center arrival is `[1.45326,3.75,7.90085]`. The nearest original spawn is 8.385m away.

From that roof, the original west doorway permits an ordinary 0.25m step into the upper container: opening center is approximately `[3.945,4,7.613]`, and interior `[5,4,7.33]` is reached in 0.425s with normal standing movement. The exact original DM spawn is reached in 0.358s. Independent native movement verification found zero recovery along this route. No opening, collision or source spawn is changed.

Returning from the landing roof to `[-4,0,8]` succeeds through ordinary native movement and a safe drop in approximately 0.87s. Landing directly inside the upper container through its narrow door was rejected because off-center ballistic arrivals were unreliable; the adjacent original roof makes the route generous and readable.

Final southeast landing moved inward to `[13,3.75,30]` after full0.7m-disk checks. Nine offset arcs and native120Hz arrivals pass; the return to the takeoff ground takes approximately0.83s.
