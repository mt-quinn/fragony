# Rust jump routes — final supported landings

These four routes replace the initial edge-supported candidates. A positive-radius floor query can report support beside a ledge, so final landing verification uses **zero-radius source-surface queries at the center and 16 points around a 0.7m disk**, not an expanded brush envelope. The full 0.4m standing footprint therefore sits on real original geometry with an additional positional margin.

Coordinates are `[x,feetY,z]`. Power is initial vertical speed under 23m/s² gravity. Use **0.75m trigger radius** and approximately 1.9m visual plates.

| Route | Takeoff | Landing | Power |
|---|---|---|---:|
| South service entry | `[-5,1.025556,7.5]` | `[0.5,8.25,3]` |23 |
| North counter-entry | `[11,1.30069,-17]` | `[6,8.25,-10.5]` |21 |
| Cross-deck transfer | `[3,8.25,2.5]` | `[1,14.375,-8.5]` |18 |
| Upper service transfer | `[4,14.375,-10]` | `[6,20.65625,-2.5]` |17.5 |

The two upper takeoff plates also have actual 0.9m supported disks, avoiding visible plate overhang. The opposing ground approaches preserve the original ground crossing. Lower, middle and summit structures remain meaningful; no direct ground-to-summit launch is added.

## Flight and arrival checks

Each route passes the real 0.4m-radius, 1.9m standing-cylinder collision test at 180 samples across the analytic flight. This is repeated at the center and eight surrounding takeoff offsets within 0.75m.

Every one of those 36 launches is also simulated through the actual `moveCharacter` controller at 240Hz. Its first physical landing must occur on the intended surface within 0.65m of the intended point; ceiling hits or early landings on other geometry fail. Actual center first-landings are:

| Route | Actual first landing |
|---|---|
| South | `[0.49518,8.25,3.00394]` |
| North | `[6.01602,8.25,-10.52082]` |
| Cross-deck | `[1.01293,14.375,-8.42891]` |
| Summit | `[5.98207,20.65625,-2.56723]` |

Ordinary native walking connects the south landing to the cross-deck takeoff, and the middle landing to the upper takeoff, without falling or requiring another special launch. The north landing supplies the opposite lower-roof approach.

## Return routes

Actual controller simulation at 120Hz and ordinary 7.5m/s horizontal travel verifies:

- Summit to middle: first lands near `[4.100,14.375,-9.626]`, then reaches the upper takeoff area; approximately 0.98s.
- Middle to lower: first lands on the original 10.46875m structure near `[2.037,10.46875,-2.298]`, then reaches the 8.25m lower deck near `[2.935,8.25,2.176]`; approximately 1.44s.
- Lower to south ground: the original guardrail correctly blocks a simple walk off the edge. A normal 8.5m/s jump clears it and returns safely to `[-5,1.025556,7.5]` in approximately 1.51s. No new gap or return pad is needed.

## Rejected earlier candidates

The initial cross-deck destination `[2,14.375,-5]` sat outside the actual platform despite positive-radius support. Moving it only to `[4.5,14.375,-5]` produced a real platform point but the original takeoff arc hit the enclosing frame. The final route instead crosses laterally onto the broad northern middle platform. Other initial lower/summit targets were similarly moved inward from narrow lips. The final checks above explicitly prevent that class of false-positive landing.

All source collision includes redundant axial bounds on thin triangle prisms, preserving their exact volume while keeping cylinder contacts local. Map wrappers and navigation fingerprints should use only this final table.
