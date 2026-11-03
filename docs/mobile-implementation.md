# Landscape mobile implementation

The touch version activates for coarse pointers and iPhones/iPads. Desktop keeps its mouse/keyboard controls. Add `?touch=1` to a local URL to inspect the touch interface on a desktop. There is no build step.

## Playing

- Left floating joystick: analog movement. Push forward beyond 88% to sprint. A fixed joystick is available in settings. ADS, firing, crouching and grenade preparation interrupt sprint.
- Swipe the open area on the right to aim. Each finger owns its original control until release or cancellation, including when it crosses other buttons.
- Simple Mode is the default. A small 6 cm margin around each live, visible hitbox starts acquisition slightly before the actual crosshair reaches the opponent. Firing still requires the real crosshair to hit the opponent. Losing the target, encountering cover or leaving hip range immediately releases fire and drains charge to zero within 180 ms. Returning to the same opponent retains the remaining charge; another opponent starts fresh. Reloading, switching weapons, dying and pausing clear acquisition immediately. Corpses do not trigger it.
- ADS is independent: tap to toggle by default, or choose hold. Dragging the ADS button continues aiming. ADS permits automatic shots beyond the optional hip-fire range limit.
- Manual hip-fire fires immediately through the normal weapon cadence and temporarily leaves ADS while held. Releasing it restores the ADS toggle. Rockets always require manual fire, even when the optional hip-fire button is hidden.
- Tap jump, crouch, reload, slow time, streak or switch. Hold jump to swim up; crouch swims down. Tap the weapon readout to choose any owned weapon. Tap placement to see standings.
- Hold a grenade and drag to aim; release to throw. Drag into the top 22% of the screen before release to cancel. A canceled/interrupted contact never throws.

The game retains its existing recoil, spread, ammunition, attachment stats, weapon animations, damage, collision, jump pads, swimming, bots, scoring, five-map rotation and roguelike progression. Empty mobile magazines automatically reload. Simple Mode controls the trigger; it does not steer the camera or manufacture hits. Optional aim slowdown reduces touch sensitivity near a visible opponent and checks cover.

## Controls and presentation

Settings include Simple/manual mode, optional hip-fire button, hip range limit, ADS toggle/hold/drag, floating/fixed movement, sprint threshold, focus toggle/hold, look/ADS/scope/vertical sensitivity, aim slowdown, invert Y, optional gyro, FOV, graphics, audio and camera motion.

Two-thumb, four-finger and left-handed presets each retain their own layout. The editor supports dragging, size, opacity, optional visibility, fine nudges, overlap warnings, reset, cancel, save and practice. Controls clamp to safe-area bounds and retain a 44 CSS-pixel hit target. The visual treatment uses Fragony's ink, chalk, acid accent, authored icons and existing weapon silhouettes.

Practice uses the current arena, moving opponents, all six weapons, replenished grenades, no incoming player damage and unlimited time. It never overwrites the saved run. Leave practice and use Continue to restore that run. First-run instructions explain the default interaction; they remain available through pause/settings.

## iOS browser behavior

The viewport includes safe-area insets. Rotation to portrait clears gestures and pauses; returning to landscape requires Resume. Backgrounding, page hiding and blur clear held inputs, pause an active game and stop world sounds. Audio declares `navigator.audioSession.type = 'ambient'` before acquisition and recovery where supported, so it mixes with other apps instead of requesting exclusive playback. One shared Web Audio context handles both music and effects. Persistent capture-phase pointer, touch-end and keyboard handlers acquire/resume inside user activation, with a one-sample silent Web Audio prime when needed. Visibility/pageshow/focus recovery reuses the same context; pending or rejected resumes remain retryable from a fresh gesture. Closed contexts dispose old voices/music and rebuild the graph without losing settings or music intent. Backgrounding mutes the game's output and discards effect tails; the app does not close/recreate a healthy context or queue missed shots. Resume restores foreground gain while respecting mute. Audio Session is feature detected, and iOS retains control over interruptions and silent mode; this cannot promise uninterrupted audio ownership. See the [Audio Session specification](https://w3c.github.io/audio-session/) and [iOS interruption guidance](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state#resuming_interrupted_play_states_in_ios_safari). Optional screen wake lock is requested where supported. WebGL context loss pauses play and rebuilds the render pipeline on restoration.

Safari works without fullscreen or an orientation lock. A web manifest and original Home Screen icon support opening as a standalone web app. The game is not an offline service-worker installation. Gyro is opt-in, permission gated and requires a browser context that supports motion access; declining it leaves touch aiming available.

## Evidence-based tuning

The research and source ledger are in [mobile-controls-research.md](mobile-controls-research.md). This is a close interaction facsimile with Fragony mechanics and original assets. Numerical acquisition delays and ranges are tunable approximations, not measurements of COD Mobile's private implementation.

`dist/mobile-core.js` owns the trigger and input rules. The current acquisition / hip-range profiles (seconds / game meters) are rifle .12 / 23; pistol .16 / 18; SMG .09 / 19; rail .24 / 12; shotgun .15 / 13. Rocket is manual. Acquisition time is separate from each weapon's existing firing interval. A stalled frame contributes at most .05 seconds to acquisition. `AUTO_FIRE_DRAIN` is .18 seconds from full to empty, with no excess charge banked while tracking. `AUTO_AIM_PADDING` in `dist/mobile-targeting.js` is .06 world meters and follows each hitbox’s rotation/scale. A separate surface sightline check rejects padding through cover. This is acquisition grace only; losing the real crosshair immediately releases automatic fire.

`dist/mobile.js` owns pointer gestures, lifecycle, HUD, settings, guide, practice entry and layout editing. `dist/game.js` senses actual world/actor meshes at up to 60 Hz and maps touch state into the native movement and weapon simulation. `dist/mobile.css` owns mobile presentation, including the existing arsenal, loadout and results screens.

Graphics profiles cap pixel count and device ratio independently of touch coordinates:

| Profile | Pixel cap | Ratio cap | Shadows | Bloom | AO / multisampling |
| --- | ---: | ---: | --- | --- | --- |
| Battery saver | 550,000 | 1 | Off | Off | Off |
| Balanced (default) | 950,000 | 1.5 | 1024 | On | Off |
| High detail | 1,500,000 | 1.75 | 2048 | On | On where supported |

## Verification

`npm test` includes `tests/mobile.mjs` and the existing game regressions. Mobile tests exercise acquisition, loss, cover, corpses, range, ADS, rocket exception, stall limits, actual concurrent pointer handlers, gesture cancellation, manual hip-fire, layout safe bounds, sensitivity, native world sensing/input integration and practice save protection. `tests/audio-lifecycle.mjs` covers ambient configuration ordering, shared context/gesture priming, interruption and rejected/pending resume retries, foreground/mute behavior, closed-context recovery and safe disposal during asynchronous music loading.

Browser verification covers phone-sized menu, first-run guide, live practice, ADS/manual shots with real ammo consumption, weapon picker, settings, HUD drag/save, portrait pause/return, and complete round/results. Responsive inspections include 844×390, 667×375 and 568×320. These are desktop browser checks, not physical iPhone frame-time, motion-permission or Safari edge-gesture measurements. The in-app test browser does not expose raw simultaneous touch dispatch; concurrent pointer behavior is verified through the real controller handlers instead.
