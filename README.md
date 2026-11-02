# Fragony

Single-player Three.js arena FPS roguelike. Chalk geometry, ink silhouettes, yellow crash-test dummies.

## Play

Run `npm start` and open http://127.0.0.1:4173. No install or build is required; Three.js is vendored.

WASD move, Shift sprint, mouse aim, left click fire, right click aim down sights, Space jump, hold Q slow motion, R reload, G grenade, F selected killstreak, 1–6 or wheel switch owned weapons, Escape pause. Browsers without mouse capture use free mouse aiming within the viewport and arrow-key turning; Resume retries capture. A regular desktop browser supports full pointer-lock FPS controls. Headphones are recommended for directional audio.

Each run starts with two distinct random weapons. Buy more weapons, attachments, perks and throwables between rounds. Each opponent rolls two weapons at match start and retains that pair through respawns. Reserve ammunition is unlimited; magazines must be reloaded. Switching preserves partial or empty magazines. Reload completion clamps the timer to zero, so repeated reloads cannot lock firing.

90-second free-for-all against five opponents. Unlimited respawns. Finish in the top three to advance; otherwise the run ends. Ties favor fewer deaths. Three consecutive kills earn the selected killstreak. Progress saves in this browser.

The six weapons are an accurate rifle, hand cannon, fast SMG, piercing rail rifle, rocket launcher with splash and rocket jumping, and a 12-pellet shotgun with four tightly grouped core pellets. Crash-test dummy limbs shatter only on lethal hits or after death, then reset on respawn.

## Test Works

The current arena is an original 76 × 68 m crash-testing facility with ground, 4 m and 8 m routes. Press, Core, Range, Control and Assembly serve different engagement distances and connect through overlapping ground/upper circuits. Four stairs, four pads, real underpasses, bent portals, diagonal screens, fourteen spawns and eight distributed resources make rotation useful without adding visual clutter.

[Layout plan](docs/test-works-layout.svg) · [Geometry study, design intent and validation](docs/test-works-design.md).

All geometry and navigation landmarks derive from `dist/map.js`. Shared rotated collision, floor support and ceilings live in `dist/geometry.js`. Static blocks render in shared instance batches. Tests verify strategic connectivity, every stair/pad traversal, alternate routes when individual portals close, resource support, protected health sightlines and layered floor/ceiling behavior.

## Opponents

Opponent logic is isolated in `dist/ai.js`. `AI_TUNING` is the central campaign configuration:

| Setting | Controls |
| --- | --- |
| `early` / `late` | Reaction, speed, aim error, memory, decision interval, burst recovery, dodge chance and dodge delay. |
| `progressionRounds` | Smooth progression length. Values stay capped afterward. |
| `profiles` | Weapon preference, aggression, desired range, high-ground preference, flank tendency and caution. Each bot chooses only from its rolled pair. |
| `weapons` | Damage, range, burst, spread, magazine, reload and wind-up. Damage and health do not inflate by round. |
| `senses` | Sight range, field of view, sensor interval and hearing range. |
| `fairness` | Spawn grace, target commitment and a soft limit on bots selecting the player at once. |
| `navigation` | Repath/recovery timing, retreat health and shared pickup respawn. |

Bots perceive visible targets and remember last-seen locations briefly. Gunfire and nearby footsteps create search locations, not firing solutions. They turn and react before firing, lag their aim behind sudden movement, fire in bursts and reload. Rail shots and rockets have visible and audible wind-ups. Injured bots seek health or cover. They make delayed, imperfect projectile dodges. Shared pickups actually heal opponents and disappear until respawning. Cover blocks both hitscan and splash. Height-aware A* supports stairs, jump pads, low jumps and drops; recovery replans without teleporting. Weapon switches retain magazines and have an equip delay.

## Audio

`dist/audio.js` contains original layered effects and `AUDIO_TUNING` for the mix. Gunfire combines a short filtered-noise attack, low-frequency body, mechanical detail and a restrained tail. Fast weapons use shorter effects to limit masking; there are no continuous sawtooth gun tones.

Positional sources are mono and use Web Audio HRTF spatialization. Listener position and orientation follow the camera. Sources are omnidirectional: a sound behind the listener is not turned down by a source cone. Distance attenuation is applied once, with panner rolloff disabled. Footsteps fade to zero at 23 m, gunfire at 52 m and explosions at 55 m; these are editable game curves, not acoustic measurements. Higher frequencies also attenuate with distance. Three visibility samples estimate partial occlusion; walls lower volume and low-pass the sound rather than switching it off.

Footstep cadence follows actual grounded travel, with small sample variations, distinct metal/solid character, quieter player steps and separate landing events. Nearby enemy steps have higher voice priority than distant gunfire and subtly duck the player's gun bus. Per-category voice limits and a master limiter prevent dense fights from becoming a continuous wall of sound. Slow motion smoothly lowers world pitch; UI cues stay unaffected. Pause and mute stop existing voices.

Sources used for the audio pass:

- [Valve Steam Audio source guide](https://valvesoftware.github.io/steam-audio/doc/unity/source.html): binaural rendering, attenuation, air absorption and occlusion as distinct controls.
- [Epic sound concurrency](https://dev.epicgames.com/documentation/en-us/unreal-engine/sound-concurrency-reference-guide): voice limits, priority and ducking.
- [Blizzard's Play by Sound session overview](https://www.gdcvault.com/play/1023010/Overwatch-The-Elusive-Goal-Play): audio reinforcing combat decisions. This references the published overview, not a claim to have watched the full session.
- [MDN PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode): browser spatialization behavior and distance properties.

[Weapon sound preview](docs/weapon-audio.wav), in order: hand cannon, rifle, SMG burst, shotgun, rail, rocket. This mono dry preview demonstrates the effects; binaural placement and the live mix require playing the game.

## Verification

`npm test` checks map connectivity and sightlines, actual traversal, sensing/memory/weapon selection, fair combat timing, random loadouts, magazine persistence, repeated reloads, input fallbacks, audio buffers/routing/falloff/occlusion/voice limits, corpse damage, rocket jumps, purchases, saved progression, and a full bot match.

`npm run test:simulation` runs nine seeded 90-second matches at early, middle and capped late-run settings. It verifies real high-ground and pad use, pickups, scoring and prolonged navigation stalls and reports weapon switching and shot counts. `node scripts/map-preview.mjs` and `node scripts/audio-preview.mjs` regenerate the review artifacts.

Crash-test dummy references: [Euro NCAP](https://www.euroncap.com/want-to-meet-our-family-of-dummies/) and [NHTSA](https://www.nhtsa.gov/nhtsas-crash-test-dummies). All models are original procedural geometry. Three.js v0.182.0 uses MIT; see `dist/vendor/THREE-LICENSE.txt`.


### Combat feel pass

Weapon handling is tuned in `dist/feel.js`: six independent recoil/recovery profiles, smooth aim transitions, reload and equip poses, shotgun pump/pistol slide, restrained sway and sprint poses. Purchased attachments appear on the weapon. Simulation steps at a maximum 1/120 second; firing retains fractional cooldown so 30/60/144 Hz produce the same cadence. Shots read current mouse aim before recoil is applied. Ground acceleration/braking, retained air momentum, 120 ms jump buffering, 85 ms coyote time, and smoothed stair eye height preserve immediate controls. No global hitstop or aim-displacing camera shake.

Damage resolution in `dist/combat.js` prevents repeated death scoring. Hits give one short marker/cue per resolved shot; grouped pellets, rail penetrations and splash kills produce one combined confirmation. Headshot kills score 150 instead of 100; match placement uses points, with frags separately reported. Corpse impacts can shatter limbs but never award points or hit confirmations. Live dummies flinch; death poses and shattered pieces follow shot direction.

World impacts leave short-lived marks and chips; firearms eject tumbling cases. Explosions add expanding wire shockwaves, a brief smoke burst, breakup and local weapon trauma. Visual effects have a hard 190-object budget and 72-mark budget. The crosshair reflects handling without obscuring its center; small point text, directional damage and positional near-miss cues carry information without large kill banners.

The synthesized sound mix includes varied dry hit thwips, a wet headshot layer and a longer metallic kill ring. Confirmation briefly lowers enemy gunfire, preserving spatial footsteps and warnings. Common sounds are prewarmed. Pause offers persistent camera-motion, gun, footstep and feedback controls. Setting motion to zero removes optional sway/bob/trauma while preserving aim and weapon recoil.

`tests/feel.mjs` checks cadence at 30/60/144 FPS, fresh aim, 150-point head kills, corpse suppression, effect limits, jumping, braking, air momentum and comfort behavior. Existing reload, controls, spatial audio, map, combat/progression and nine seeded full-match simulations remain passing.


### Loadout bench and attachment system

Between rounds, LOADOUT presents a compact board with Weapons, Attachments, Perks and Equipment visible together. Each visit has persistent randomized stock: up to two guns, four compatible parts, two perks and two equipment offers. Purchases fit directly; owned parts and gear can be changed freely. The full catalog can also be browsed read-only through ARSENAL in the main menu.

Each weapon has five slots. There are three weapon-specific alternatives in each mechanical slot, plus six optics per weapon (three 1× and three 2×). That is 18 choices per weapon, 72 distinct mechanical parts and six shared optic designs. Stock parts are free. Purchased parts belong to that weapon for the run; swapping or removing them is free. Prices, benefits, penalties, fitted state and insufficient-credit states are explicit. RESET BUILD returns to standard without deleting owned parts. Buying additional weapons preserves the initial random pair; all owned guns remain available during a match. The starting weapon selection applies at round start.

| Weapon | Slots |
| --- | --- |
| AR-9 | Optic, Muzzle, Barrel, Magazine, Stock |
| IRON .50 | Optic, Muzzle, Barrel, Magazine, Trigger |
| WASP | Optic, Muzzle, Barrel, Magazine, Stock |
| LONGSHOT | Optic, Barrel, Capacitor, Magazine, Stock |
| THUMPER | Optic, Warhead, Motor, Loader, Grip |
| DOORBREAKER | Optic, Choke, Barrel, Tube, Pump |

`dist/loadout.js` owns catalog data, stat composition, compatibility, purchase/equip rules, preview builds and normalization. Damage, spread/core spread, recoil, cadence, magazine size, reload, aim time, movement, weapon switching and rocket characteristics connect to the actual game. 2× magnification uses the FOV tangent relationship; optics have distinct open/round/box/tube models and reticles, with scaled aiming sensitivity. Rocket modifiers are snapshotted at launch so switching weapons cannot alter a projectile already in flight. Bots retain their existing tuned weapon stats and random pairs.

Perks include the original movement/armor/reload/focus upgrades and new Quickdraw and Recovery choices. Equipment offers frag, impact and quick-fuse grenades, plus Airstrike, Surge and Rocket Barrage killstreaks. One throwable and one killstreak are selected; purchased alternatives can be swapped free. Bandolier increases grenade allocation. All purchases save immediately. Existing saves migrate the former global gun attachments into compatible owned parts rather than stacking both systems.

The loadout skips hidden arena rendering and needs no extra WebGL context. UI and part previews use the same stat resolver as combat. `tests/loadout.mjs` checks all 108 per-weapon choices, transactions, slot validation, migration/restoration, real reload/aim/projectile effects, and procedural model construction for every part.

Design references: [COD BO6 attachment intel](https://www.callofduty.com/blog/2024/10/call-of-duty-black-ops-6-launch-comms-weapons-attachments-intel) and [Modern Warfare loadout guide](https://blog.activision.com/call-of-duty/2019-10/The-Basics-of-Call-of-Duty-Modern-Warfare-Loadouts). Adapted principles: a weapon-centered bench, relevant slot categories, understandable effects, and clear separation of weapons, perks and equipment. No third-party game assets are used.

Assists award proportional normal kill points for actual health removed since the target last healed. Killers always receive full kill/headshot points. Respawns and healing clear damage credit. Enemies shift green to red with health and grey on death; the aiming reticle is a fixed dot.

### Incoming damage feedback
Incoming hits show solid tapered red crescents for two seconds. Each shooter keeps an independent cue; overlapping bearings occupy separate radial layers rather than merging. Near misses use a thinner broken chalk arc for 0.65 seconds, based on actual bullet segments after spread and collision. Camera turns preserve the world bearing of each incoming event. Explosions use their blast origin, including self damage; unknown sources do not invent a direction. Hits briefly tint the perimeter. Below 55% of spawn health, an edge warning grows with missing health; at 25% it gains heavier corner marks, a slow pulse scaled by the camera motion setting, and a quiet double heartbeat controlled by Feedback Volume. These cues leave the central view clear, use real time during slow motion, and reset on death/respawn. Healing fades the warning. `tests/hurt.mjs` covers camera rotation, shooter identity/layers, hit priority, real near-miss and blocked-shot traces, expiry, relative health, recovery and pulse cadence. Research and implementation details: [incoming-fire feedback](docs/incoming-fire-feedback.md).

### Death recap and killer follow
The existing 2.2-second respawn countdown now contains a frozen damage recap: every contributing attacker, weapons, effective damage and hit counts, a victim hit-location paperdoll, and your return damage/hits against the killer alongside their remaining health and hit-location paperdoll. Health removed is capped against overkill; individual shotgun pellets retain their hit regions. Healing clears the current damage interval, independently of the frozen recap. The death camera stays at the death location and smoothly follows the killer. A depth-independent body outline and projected nametag identify them through cover until respawn. If their life changes, tracking/highlighting stops rather than revealing their new spawn. All temporary UI and highlight materials are cleared on respawn, results and menu exit.

### Configurable controls and crouch
Controls is available from the main menu and while paused. Every action supports primary and secondary keyboard, mouse-button or wheel bindings, saved separately from the run. Capture supports explicit conflict replacement, clearing, cancelling, binding Escape and restoring defaults. Mouse sensitivity, Y inversion and hold/toggle crouch are configurable. The desktop board presents all groups together, including at 635×698. Audio/camera settings remain available in the same menu. Crouch defaults to C / left Ctrl: lowered eye height and collision height, slower movement, quieter footsteps and a smaller AI hearing radius. Standing requires headroom, including after crouched jumps.

`tests/recap.mjs` checks frozen multi-attacker/limb data, killer tracking, through-wall material settings, cleanup and unchanged respawn time. `tests/bindings.mjs` checks persistence, conflicts, secondary controls, hold/toggle crouch and ceiling behavior.

### Player collision controller
`dist/collision.js` uses one upright cylinder footprint for lateral movement, floors, ceilings, step-up clearance and stance changes, including rotated boxes. Movement subdivides high-speed travel, advances to contact and projects remaining movement along walls. Steps up to 0.3 m require clearance both over the approach and at the destination; support checks no longer snap the player upward through nearby horizontal surfaces. Existing shallow intersections resolve to a nearby surface exit rather than a spawn reset. Uncrouching tests the complete standing body and keeps crouch active with `HEAD BLOCKED` while obstructed.

`tests/collision.mjs` covers floor/wall seams, reverse escape from corners, blocked steps below ceilings, high-speed thin walls/floors/ceilings, rotated surfaces, body-radius uncrouch corners, all real staircases, all four player jump-pad landings and 16,800 randomized full-map movement steps. The legacy geometry helpers remain available for map navigation and resource placement.


### Fragony interface
The main menu contains the title and run, Arsenal and Controls actions. The HUD uses large edge-aligned health/ammo numerals, weapon silhouettes, binding-aware equipment prompts and thin resource bars over soft peripheral shading. Persistent instruction strips and opaque HUD cards are removed. Results use aligned score columns; loadout and controls use flat rows and the same ink/chalk/acid palette. Existing save keys are retained so the rename preserves runs and bindings.

Presentation verified in the browser at 1920×1080 and 635×698, including purchases/fitted parts, controls without scrolling, results and the multi-attacker recap. Local presentation fixtures are excluded from deployment.


### Articulated crash dummies and ragdolls
`dist/characters.js` owns shared twelve-sided molded shell geometry, black joint couplings, ribbed waist, seven semantic damage regions, and articulated shoulders/elbows/wrists/hips/knees/ankles. The procedural pose solver blends travel-relative planted feet, terrain sampling/pelvis compensation, walk/run cadence, airborne tuck/landing compression, braced crouch, grip-driven aiming/recoil/reloads and regional flinches. Footstep events come from foot plants. Rail opponents plant during the final visible wind-up. The menu uses a relaxed carry pose; first-person palms, wrists and forearms use rounded geometry.

Deaths release the current pose into a constrained particle ragdoll, carrying actor travel/fall velocity and measured joint motion. There is no invented launch or upward kick; impact adds only a small horizontal nudge. Gravity causes a stationary standing body to drop to the ground in roughly half a second. Joint limits, torso braces, self contacts, rotated-box contacts and segment probes keep bodies attached and supported; friction and sleep settle them. World-time integration also respects slow motion. The existing corpse/respawn timers, grey death color, health colors and lethal/post-mortem region shattering remain in use.

`tests/characters.mjs` checks 960 pose samples, fixed limb lengths, foot clearance, crouch/recoil, prompt stationary collapse, inherited running/falling velocity, slow-motion consistency, settling, elevated surfaces and rotated thin walls. The full combat suite checks live hit regions, corpse guards, destruction and restoration on respawn. Browser review covers idle/run/crouch/reload/ragdoll poses and a live match without errors. Temporary rig-review files are removed before packaging.

### Settings and HUD scale
Settings replaces Controls in the main menu and pause screen. Controls, Audio and Visuals are visible sections; sliders show live percentage or sensitivity multiplier values and expose the same units to assistive technology. HUD scale defaults to 100%, supports 50–200% in 5% steps, and persists with the other settings. A scaled logical HUD viewport keeps aiming and projected markers centered while preserving edge spacing. Compact layouts reflow health/ammo, focus and the death recap at large scales. The settings menu remains at normal size.

`tests/settings.mjs` covers live outputs, units, persistence, clamped scale endpoints and HUD viewport sizing. Browser checks cover saved values after reload, 50% and 200% aiming alignment, compact-window spacing, slider interaction and the complete desktop settings board.


### Presentation benchmark: AR-9 and CORE
The first complete weapon presentation pass is the AR-9. `dist/rifle.js` uses cached beveled profile geometry, separate ceramic/graphite/rubber/steel surfaces, a floated handguard/barrel, open trigger guard and stock, aligned irons, working bolt/charging handle, integrated optics/stocks/magazines and an authored withdrawal/replacement/racking reload. The support forearm follows the hand through those stages. Rifle damage, ammunition and attachment statistics remain driven by the existing loadout system. Other weapon geometry remains at its prior level of detail under the new shared rendering treatment.

`dist/presentation.js` adds a generated studio reflection environment and shared physical materials, a separate viewmodel layer, version-matched Three.js GTAO with denoising, selective HDR bloom, restrained photographic grading/shadow print texture and smooth slow-motion grading. CORE has overhead light fixtures, flush test-floor panels and calibration/capture details. Major light housings/panels participate in collision. Runtime rendering is capped at about 2.1 million pixels; AO runs at 45% dimensions and bloom at quarter dimensions. Non-HDR devices bypass GTAO/reflection environment generation.

Muzzle flashes are directional bright blades with a brief viewmodel light; tracers start at the visible muzzle while hit tests remain camera based. Spent cases, directional chips, metal sparks and restrained dust/smoke replace generic surface balls. First-person hands and forearms on all six guns now use the same health-color lookup as opponents, updating on damage, healing and spawning; weapon accents and black joints retain their materials.

`tests/presentation.mjs` checks the rifle geometry/layers, magazine/bolt/hand stages, empty reload, all six first-person skin colors and physical fixtures. The full suite passes, including all 108 attachment choices and movement/collision tests. Browser review included irons, reload stages, effects, normal gameplay and a sustained five-bot 1920×1080 combat view: the final 240-frame sample averaged 16.67 ms with 16.8 ms at the 95th percentile in this session. These are local frame intervals, not a guarantee for other hardware. Temporary review controls/files are excluded from deployment.

The six vendored GTAO support modules are from the official Three.js r182 examples and share the license in `dist/vendor/THREE-LICENSE.txt`; only core-module import paths were adjusted for the existing buildless layout.
