# Dead Heat

Single-player Three.js arena FPS roguelike. Chalk geometry, ink silhouettes, yellow crash-test dummies.

## Play

Run `npm start` and open http://127.0.0.1:4173. No install or build is required; Three.js is vendored.

WASD move, Shift sprint, mouse aim, left click fire, right click aim down sights, Space jump, hold Q slow motion, R reload, G grenade, F earned airstrike, 1–6 or wheel switch owned weapons, Escape pause. Browsers without mouse capture use free mouse aiming within the viewport and arrow-key turning; Resume retries capture. A regular desktop browser supports full pointer-lock FPS controls. Headphones are recommended for directional audio.

Each run starts with two distinct random weapons. Buy more weapons, attachments, perks and throwables between rounds. Each opponent rolls two weapons at match start and retains that pair through respawns. Reserve ammunition is unlimited; magazines must be reloaded. Switching preserves partial or empty magazines. Reload completion clamps the timer to zero, so repeated reloads cannot lock firing.

90-second free-for-all against five opponents. Unlimited respawns. Finish in the top three to advance; otherwise the run ends. Ties favor fewer deaths. Three consecutive kills earn an airstrike. Progress saves in this browser.

The six weapons are an accurate rifle, hand cannon, fast SMG, piercing rail rifle, rocket launcher with splash and rocket jumping, and a 12-pellet shotgun with four tightly grouped core pellets. Crash-test dummy limbs shatter only on lethal hits or after death, then reset on respawn.

## Crosscut

Original 46 × 46 m playable map for six contenders. Its layout has two crossing circulation loops and four identifiable spaces:

- **Gallery:** a raised north lane with two normal stair approaches, two jump-pad shortcuts, and an open drop edge. A central spine breaks the cross-gallery sniper line; crossing its apron exposes the player to the yard.
- **Hall:** a ground-level west route with broad S-turns, two yard portals, and sheltered health. It provides a close-range counter to the gallery and a recovery route.
- **Yard:** the main mid-range fight, organized around a tall central landmark and offset low cover. Overhealth sits on an exposed plinth, away from both health pickups.
- **Cut:** the lower crossing route between the hall and east side, avoiding the overhealth fight. An offset island interrupts the end-to-end sightline.

All collision, item locations, spawns, pad flights and strategic navigation points are data in `dist/map.js`. Every spawn reaches the center in approximately 2.4–5.1 seconds at normal speed along the navigation routes. Automated checks verify routes between all strategic positions, actual stair/pad/drop movement, alternate circulation after one portal is blocked, and separation of the gallery's sightline from all spawn routes. These are geometry checks, not a substitute for human playtesting.

[Layout diagram](docs/crosscut-layout.svg).

Research applied to this blockout:

- [Josh Foreman: Level Design for PvP FPS](https://joshforeman.artstation.com/blog/PrbL/level-design-for-pvp-fps): recognizable areas, limited visual noise and risk attached to informative sightlines.
- [Pete Ellis interview](https://worldofleveldesign.com/categories/interviews/pete-ellis-level-design.php): circulation loops and figure-eight routing, plus contested advantageous positions.
- [The Level Design Book: Flow](https://book.leveldesignbook.com/process/layout/flow): movement and verticality must serve the game's pace, then be verified in the blockout.
- [World of Level Design: Choke Points](https://www.worldofleveldesign.com/categories/csgo-tutorials/csgo-principles-choke-point-level-design.php): deliberate entrances, different engagement distances and measured travel times. Team-objective choke rules are not copied directly into this free-for-all map.

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
