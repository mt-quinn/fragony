# Fragony

Single-player Three.js arena FPS roguelike. Chalk geometry, ink silhouettes, yellow crash-test dummies.

## Play

Run `npm start` and open http://127.0.0.1:4173. No install or build is required; Three.js is vendored.

WASD move, crouch while moving to knee slide, mouse aim, left click fire, right click aim down sights, Space jump, hold Q slow motion, R reload, F selected killstreak, 1–6 or wheel switch owned weapons, Escape pause. Browsers without mouse capture use free mouse aiming within the viewport and arrow-key turning; Resume retries capture. A regular desktop browser supports full pointer-lock FPS controls. Headphones are recommended for directional audio.

On iPhone/iPad, play in landscape. The mobile interface defaults to Simple Mode with automatic firing for every weapon, including charged launchers: move with the left joystick, swipe to aim, and keep a visible opponent in the crosshair to fire automatically. ADS and optional manual hip-fire remain separate. Sustained movement into an obstruction automatically requests a full jump after 140 ms and holds jump for at least 500 ms, including to exit water. Jump, crouch and throwable touch controls are removed. Touch Settings includes sensitivity, layout presets, a full HUD editor, graphics and optional gyro. Practice lets you try all weapons without changing your saved run. [Mobile controls and implementation notes](docs/mobile-implementation.md) · [COD Mobile research](docs/mobile-controls-research.md).

Each run starts with two distinct random weapons. Buy more weapons, attachments, perks and killstreaks between rounds. Each named opponent starts with two weapons and keeps a hidden wallet, guns, attachments, and perks throughout the run. Rivals earn the same kill and placement money as you and shop between matches. Reserve ammunition is unlimited; firing the last round immediately starts a reload. Switching preserves partial or empty magazines. Reload completion clamps the timer to zero, so repeated reloads cannot lock firing.

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
| `profiles` | Weapon preference, aggression, desired range, high-ground preference, flank tendency and caution. Each bot chooses from its persistent purchased arsenal. |
| `weapons` | Tactical range preferences and burst pauses; native rival weapon stats come from the player catalog and fitted parts. Damage and health improve through purchases, rather than round multipliers. |
| `senses` | Sight range, field of view, sensor interval and hearing range. |
| `fairness` | Spawn grace, target commitment and a soft limit on bots selecting the player at once. |
| `navigation` | Repath/recovery timing, retreat health and shared pickup respawn. |

Bots perceive visible targets and remember last-seen locations briefly. Gunfire and nearby footsteps create search locations, not firing solutions. They turn and react before firing, lag their aim behind sudden movement, fire in bursts and reload. Charged conversions have visible and audible wind-ups; stock guns follow the same firing modes as the player. Injured bots seek health or cover. They make delayed, imperfect projectile dodges. Shared pickups actually heal opponents and disappear until respawning. Cover blocks both hitscan and splash. Height-aware A* supports stairs, jump pads, low jumps and drops; recovery replans without teleporting. Weapon switches retain magazines and have an equip delay.

## Audio

`dist/audio.js` contains original layered effects and `AUDIO_TUNING` for the mix. Gunfire combines a short filtered-noise attack, low-frequency body, mechanical detail and a restrained tail. Fast weapons use shorter effects to limit masking; there are no continuous sawtooth gun tones.

Mobile audio requests an ambient session where supported, allowing it to mix with other apps' music. Music and effects share one persistent AudioContext, with gesture and foreground recovery after interruptions and safe rebuilding if the context closes. Backgrounding silences game output; returning respects the audio toggle. iOS still controls interruptions and silent-mode behavior.

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

Weapon handling is tuned in `dist/feel.js`: six independent recoil/recovery profiles, smooth aim transitions, reload and equip poses, shotgun pump/pistol slide, restrained sway and stable sliding aim. Purchased attachments appear on the weapon. Simulation steps at a maximum 1/120 second; firing retains fractional cooldown so 30/60/144 Hz produce the same cadence. Shots read current mouse aim before recoil is applied. Ground acceleration/braking, retained air momentum, 120 ms jump buffering, 85 ms coyote time, and smoothed stair eye height preserve immediate controls. No global hitstop or aim-displacing camera shake.

Damage resolution in `dist/combat.js` prevents repeated death scoring. Hits give one short marker/cue per resolved shot; grouped pellets, rail penetrations and splash kills produce one combined confirmation. Headshot kills score 150 instead of 100; match placement uses points, with frags separately reported. Corpse impacts can shatter limbs but never award points or hit confirmations. Live dummies flinch; death poses and shattered pieces follow shot direction.

World impacts leave short-lived marks and chips; firearms eject tumbling cases. Explosions add expanding wire shockwaves, a brief smoke burst, breakup and local weapon trauma. Visual effects have a hard 190-object budget and 72-mark budget. The crosshair reflects handling without obscuring its center; small point text, directional damage and positional near-miss cues carry information without large kill banners.

The synthesized sound mix includes varied dry hit thwips, a wet headshot layer and a longer metallic kill ring. Confirmation briefly lowers enemy gunfire, preserving spatial footsteps and warnings. Common sounds are prewarmed. Pause offers persistent camera-motion, gun, footstep and feedback controls. Setting motion to zero removes optional sway/bob/trauma while preserving aim and weapon recoil.

`tests/feel.mjs` checks cadence at 30/60/144 FPS, fresh aim, 150-point head kills, corpse suppression, effect limits, jumping, braking, air momentum and comfort behavior. Existing reload, controls, spatial audio, map, combat/progression and nine seeded full-match simulations remain passing.


### Loadout bench and attachment system

The redesigned arsenal has 72 purchasable gameplay attachments: three action, ammunition and feed choices per weapon, plus three handling rigs available separately on each weapon. Fit three gameplay parts across four slots, plus a free sight. Semi-auto, automatic, burst, paired and charged conversions change real firing behavior. Special ammunition includes explosive impacts, full-first-target penetration, frangible damage, duplex shots, slugs, arc chains and flak. Slamfire preserves full shell damage and builds recoil/spread during continuous firing; release settles it within 80 ms.

The six-offer shop supplies two actions, two ammunition choices and two feed/handling choices. One first-shop conversion costs 150 credits. Pin one unbought offer for the next shop; purchases and pins persist. A fourth part requires an explicit replacement choice, with the removed part kept owned. Free sights never consume a gameplay slot. Existing runs migrate matching feeds and refund retired purchases exactly once.

Practice → Pause → Weapon Workbench makes every part free to try without writing campaign progression. Arsenal previews also leave the run unchanged. Inspect Gun opens a rotatable, lit 3D component view with an action-cycling demonstration. Conversion hardware includes visible paired bores/rails/tubes, actual magazine/loading silhouettes, ammunition carriers and animated charging/feed mechanisms. Model buffers are disposed when replaced; the viewer reuses the game's WebGL renderer.

[Approved catalog, composition and control rules](docs/attachment-redesign.md). `dist/loadout.js` owns the catalog/stat resolver, `dist/weapon-cycle.js` owns trigger/feed state, `dist/ballistics.js` groups direct and payload events, and `dist/attachment-models.js` builds/animates the physical conversion parts. New player rockets snapshot their configured payload and use swept contact; rival weapons use the same trigger/feed, ballistic payload, and configured-rocket systems; killstreaks retain their own path.

`npm test` covers the catalog, purchasing/save migration, burst/semi/charge timing, native ammunition and payload effects, coupled/individual/holstered loading, Practice safety, all 720 model kits/140 paired configurations, actual ADS alignment, and existing map/combat/audio regressions.

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

### Graphics and benchmark

Desktop Settings → Graphics & Performance and the mobile Graphics tab expose native render resolution, field of view, shadow detail/filtering, ambient-occlusion quality/strength, bloom, brightness, tone mapping, vignette, film grain and color grading. Effects presets change lighting/effects only. All controls apply immediately and persist in `dh-settings`; old mobile quality/FOV values migrate on first use. Reset Graphics restores device-appropriate defaults with AA enabled.

Antialiasing offers 0/2/4× MSAA, an optional FXAA or SMAA finishing filter, and independently combinable experimental temporal AA. Actual supported sample counts and buffer dimensions appear in the summary. TAA jitters/reprojects the world with depth rejection and neighborhood clamping; the weapon/HUD remain outside temporal history. There are no per-object motion vectors, so moving characters can trail. Frame history resets after resize, arena changes, respawn and camera cuts. The optional performance overlay reports displayed frame intervals, not GPU timestamps.

Run Graphics Benchmark performs six scenes across Reservoir, Rust and Shipment, with native bots, rifle fire, particles, smoke, rockets and explosions. Each scene warms up for three seconds and samples four seconds (about 45 seconds plus map loading). A full-size isolated child game preserves the current match and saves. Cancelling removes it; hiding or resizing interrupts the run. Reports show average FPS, 1% low FPS, median/95th/99th-percentile frame times, exact resolution/settings and scene shot/effect counts. The last report persists locally and can be downloaded as JSON. Use the same device, orientation and window size to compare settings; browser refresh limits and scheduling affect results.

`tests/antialias.mjs` covers 144 preset/AA combinations, allocation/disposal, resizing, sample support and temporal-history behavior. `tests/graphics.mjs` covers normalization, legacy migration, resolution independence and benchmark timing/statistics. Browser checks rendered 36 combinations and completed the six-scene suite on desktop and a phone-sized viewport.

### Settings and HUD scale
Settings replaces Controls in the main menu and pause screen. Controls, Audio and Visuals are visible sections; sliders show live percentage or sensitivity multiplier values and expose the same units to assistive technology. HUD scale defaults to 100%, supports 50–200% in 5% steps, and persists with the other settings. A scaled logical HUD viewport keeps aiming and projected markers centered while preserving edge spacing. Compact layouts reflow health/ammo, focus and the death recap at large scales. The settings menu remains at normal size.

`tests/settings.mjs` covers live outputs, units, persistence, clamped scale endpoints and HUD viewport sizing. Browser checks cover saved values after reload, 50% and 200% aiming alignment, compact-window spacing, slider interaction and the complete desktop settings board.


### Presentation benchmark: AR-9 and CORE
The first complete weapon presentation pass is the AR-9. `dist/rifle.js` uses cached beveled profile geometry, separate ceramic/graphite/rubber/steel surfaces, a floated handguard/barrel, open trigger guard and stock, aligned irons, working bolt/charging handle, integrated optics/stocks/magazines and an authored withdrawal/replacement/racking reload. The support forearm follows the hand through those stages. Rifle damage, ammunition and attachment statistics remain driven by the existing loadout system. Other weapon geometry remains at its prior level of detail under the new shared rendering treatment.

`dist/presentation.js` adds a generated studio reflection environment and shared physical materials, a separate viewmodel layer, version-matched Three.js GTAO with denoising, selective HDR bloom, restrained photographic grading/shadow print texture and smooth slow-motion grading. CORE has overhead light fixtures, flush test-floor panels and calibration/capture details. Major light housings/panels participate in collision. Render resolution is a saved percentage of native screen dimensions (25–100%), independent of effects presets and AA. AO quality selects 35%, 45%, or 60% dimensions; bloom runs at quarter dimensions. Non-HDR devices bypass GTAO/reflection environment generation.

Muzzle flashes are directional bright blades with a brief viewmodel light; tracers start at the visible muzzle while hit tests remain camera based. Spent cases, directional chips, metal sparks and restrained dust/smoke replace generic surface balls. First-person hands and forearms on all six guns now use the same health-color lookup as opponents, updating on damage, healing and spawning; weapon accents and black joints retain their materials.

`tests/presentation.mjs` checks the rifle geometry/layers, magazine/bolt/hand stages, empty reload, all six first-person skin colors and physical fixtures. The full suite passes, including all 108 attachment choices and movement/collision tests. Browser review included irons, reload stages, effects, normal gameplay and a sustained five-bot 1920×1080 combat view: the final 240-frame sample averaged 16.67 ms with 16.8 ms at the 95th percentile in this session. These are local frame intervals, not a guarantee for other hardware. Temporary review controls/files are excluded from deployment.

The six vendored GTAO support modules are from the official Three.js r182 examples and share the license in `dist/vendor/THREE-LICENSE.txt`; only core-module import paths were adjusted for the existing buildless layout.

### Elite Force map design investigation

[Spatial investigation conclusions](MAPS.md#lessons-from-the-elite-force-spatial-investigation) records the deeper route, geometry, entity-link and traversal work. The earlier [21-map slice atlas](research/elite-force/study.html) is a preliminary structural reference, not a completed flow analysis. The pickup rules are 5 HP overhealing fragments, 25 HP recovery capped at normal health, and exactly one contested 50 HP overhealing pickup per map. The study distinguishes measured source evidence from design hypotheses; geometry slices omit patches and do not prove playability. Six original research blockouts now exercise court, room-network and ship-interior relationships in the native game, with 300 completed directed controller trips and 28 isolated simulation matches including calibration and layout revisions. [Transfer lessons and limits](MAPS.md#original-layout-transfer-exercises) record what worked and what failed. Run `node research/flow/prepare-play-exercises.mjs` against the existing local isolated simulation/cache and open `/research/flow/play-exercises.html` on the local repository server to inspect or play them.


### Dynamic fights and hit reactions

Opponents share attack, brace, reposition, pursuit, retreat and recovery actions. Recent pressure and changing range can move a fight to another supported angle; longer exchanges can become moving disengagements. Movement accelerates and changes direction deliberately, while hips and upper-body aim turn independently. Bots can take small health-fragment detours along a larger route. Full-match summaries report actions, staggers and detours.

Six weapon impact profiles give resolved shots distinct local body and limb responses. Heavy impacts briefly interrupt firing and charged shots, with a cooldown preventing repeated stagger lock; reload progress continues. Grouped pellets produce one body reaction. Respawning clears impact state, and deaths retain the existing posed momentum and shattering rules. [Implementation and tuning](docs/dynamic-combat.md) · [Research background](docs/bot-behavior-research.md).


### Map roster

The twenty active maps are **Reservoir**, **Rust**, **Shipment**, **Nuketown**, **Killhouse**, **Vacant**, **Showdown** (CoD), **Firing Range**, **Hijacked**, **Summit**, **Shoot House**, **Siege**, **Mutiny**, **Bravery**, **Showdown · Elite Force**, **Delta Station**, **Beta Station**, **Forge2**, **Forge1**, and **Blast Radius**. The nine Elite Force maps preserve source architecture and convert all 788 pickup anchors to health; see [the adaptation notes](docs/imported-maps/eliteforce-nine.md). A persistent shuffled bag plays every map before repeating. Practice offers the same roster. Test Works, Tidal Lock, Parallax and Foundry have been retired from the production build and rotation; their geometry remains in test fixtures for legacy movement checks.

The seven new source conversions use authored area palettes, native source collision, trimmed playable footprints and prepared rendering files. Killhouse, Firing Range and Summit gain targeted access pads; Hijacked gains two service elevators. Reservoir's four shafts have permanent rendered and physical pit floors, verified with platforms raised. [Map details and provenance](MAPS.md).

## Enemy progression

Rivals now buy persistent builds with actual winnings and fire full-strength player weapons. Reactions, tracking, accuracy, and firing pressure scale through round 31 instead of stopping at round 11. Death recaps list the killing gun’s fitted parts and sight. [Economy, difficulty values, save behavior and validation](docs/enemy-progression.md).

## Minimap

A circular local map rotates with the player by default. Settings offers north lock, visibility, and an independent desktop size slider; mobile Edit HUD saves its position, size, opacity, and visibility. Resizing keeps the same 26 m world radius. Enemy shots briefly reveal red circles, with grouped directional edge indicators for enemies outside range. [Rendering, reveal timing, settings, and validation](docs/minimap.md).

## Sliding, body damage, and mobile menus

Sprinting has been replaced by a generous momentum crouch slide with forgiving uphill carry, better downhill carry, and tactical bot use that improves with difficulty. [Movement tuning and checks](docs/momentum-slide.md). Direct hits use head1.5×, torso/pelvis1×, and arms/legs0.75× for everyone. [Damage rules](docs/body-damage.md). The landscape mobile shop keeps the fitted build, six attachment offers, and other purchase categories on one board; settings and results also use the available width. [Mobile menu changes and validation](docs/mobile-menu-redesign.md).

### Industrial presentation and imported arenas

All twenty active maps now use industrial and construction finishes across 100 distinct physical districts: brick workshops, blue/green enamel plant rooms, ochre loading areas, timber partitions, concrete, tiled utilities and aggregate yards. Shared physical textures add grain, seams, relief and roughness. See [the current material pass](docs/industrial-materials.md). Rust retains its supplied refinery layout and four deliberate jump routes. Stock Shipment replaces the previous Shipment2 variant; Nuketown is added from Stendby’s editable Nuked adaptation. Both Radiant imports preserve source architecture, interiors and cover, use cached bot navigation, and remove exterior scenery. Practice offers a map chooser and keeps your selected weapon/conversion when switching maps. [Design, source fidelity and validation](docs/industrial-presentation.md).
