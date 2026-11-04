# Landscape mobile implementation

The touch version activates for coarse pointers and iPhones/iPads. Desktop keeps its mouse/keyboard controls. Add `?touch=1` to a local URL to inspect the touch interface on a desktop. There is no build step.

## Playing

- Left floating joystick: analog movement. Keep a direction held into an obstruction for about 140 ms to auto-jump at full normal height. A fixed joystick is available in settings. Sprinting has been removed.
- Swipe the open area on the right to aim. Each finger owns its original control until release or cancellation, including when it crosses other buttons.
- Simple Mode is the default. A small 6 cm margin around each live, visible hitbox starts acquisition slightly before the actual crosshair reaches the opponent. Firing still requires the real crosshair to hit the opponent. Losing the target or encountering cover immediately releases fire and drains charge to zero within 180 ms. Returning to the same opponent retains the remaining charge; another opponent starts fresh. Reloading, switching weapons, dying and pausing clear acquisition immediately. Corpses do not trigger it.
- ADS is independent: tap to toggle by default, or choose hold. Dragging the ADS button continues aiming. Automatic hip fire has no extra distance limit; ADS is optional at any normal weapon engagement distance.
- Manual hip-fire fires immediately through the normal weapon cadence and temporarily leaves ADS while held. Releasing it restores the ADS toggle. Every weapon auto-fires in Simple Mode, including stock rockets and charged launchers.
- Tap reload, slow time, streak or switch. Auto-jump holds the logical jump input for at least 500 ms and activates against a blocked water edge to swim/climb out. Jump/crouch controls are absent on mobile. Tap the weapon readout to choose any owned weapon. Tap placement to see standings.
- Throwables are removed from combat, controls, equipment and shop offers. Old throwable purchases are stripped/refunded once on save migration.

The game retains its existing recoil, spread, ammunition, attachment stats, weapon animations, damage, collision, jump pads, swimming, bots, scoring, seven-map rotation and roguelike progression. Empty mobile magazines automatically reload. Simple Mode controls the trigger; it does not steer the camera or manufacture hits. Optional aim slowdown reduces touch sensitivity near a visible opponent and checks cover.

## Controls and presentation

Settings include Simple/manual mode, optional hip-fire button, ADS toggle/hold/drag, floating/fixed movement, focus toggle/hold, look/ADS/scope/vertical sensitivity, aim slowdown, invert Y, optional gyro, FOV, graphics, audio and camera motion.

Two-thumb, four-finger and left-handed presets each retain their own layout. The editor supports dragging, size, opacity, optional visibility, fine nudges, overlap warnings, reset, cancel, save and practice. Controls clamp to safe-area bounds and retain a 44 CSS-pixel hit target. The visual treatment uses Fragony's ink, chalk, acid accent, authored icons and existing weapon silhouettes.

Practice uses the current arena, moving opponents, all six weapons, no incoming player damage and unlimited time. It never overwrites the saved run. Leave practice and use Continue to restore that run. First-run instructions explain the default interaction; they remain available through pause/settings.

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


## Redesigned arsenal

Practice pause now opens the free Weapon Workbench. Fit all72 parts, inspect/rotate/cycle the physical model, then return directly with the selected weapon equipped. The campaign remains saved separately. The firing HUD shows automatic/semi/burst/charge mode and loaded shots; charging and slamfire recoil state are visible. Manual hip-fire defaults to hold-to-repeat for semi-auto weapons, with a setting to change it. Simple Mode pulses/repeats at each conversion’s legal cadence; losing the real target cancels an unspent burst while preserving the recovery. Automatic charged rockets discharge at full charge and cancel if the target is lost. Explicit manual fire still supports hold/release and drag-to-cancel. Existing acquisition margin/drain and ambient audio handling remain in place.

The landscape non-combat UI has since been redesigned around a fixed shop board, denser multi-column settings, and side-by-side results. See [current menu design](mobile-menu-redesign.md) and [momentum slide](momentum-slide.md).

Practice pause now includes **Change Practice Map** for all seven arenas. It keeps the current practice weapon and attachment build, leaves the campaign save untouched, and does not draw from the normal match-rotation bag.

Mobile automatic targeting now acquires twice as quickly: rifle60ms, pistol80ms, SMG45ms, rail120ms, rocket100ms, shotgun75ms. The extra hip-fire range limiter, its saved setting, and the AIM DOWN SIGHTS range prompt have been removed. Mechanical weapon firing, charge, reload, and manual rocket behavior remain unchanged.

### Home Screen viewport correction (2026-11-03)
The iOS status-bar meta setting uses `default`, avoiding the old `black-translucent` overlay mode. Root html/body explicitly fill the available viewport; the touch body is fixed to all four viewport edges. Canvas/menu backgrounds fill that rectangle while controls keep their existing `env(safe-area-inset-*)` notch/home-indicator protection. No guessed Safari toolbar height or `screen.height` enlargement is used. The user supplied a landscape Home Screen screenshot showing a full-width empty strip beneath the entire scene, consistent with the viewport gap reported in [WebKit313800](https://bugs.webkit.org/show_bug.cgi?id=313800). See [Apple status-bar mode semantics](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html).

Desktop-hosted mobile browser validation confirms html/body/canvas/mobile overlay fill390px at844×390 and portrait roots/rotation overlay fill844px at390×844, with no root scrolling. This cannot reproduce an installed iPhone WebKit shell: validate a fresh Home Screen launch on the affected device after the combined deployment.

### Installed iPhone viewport follow-up (2026-11-04)
The previous fixed-body/default-status-meta change did **not** solve the user's device. The supplied2868×1320 screenshot is956×440CSS pixels at DPR3; gameplay ends at378CSS pixels, leaving62. Device: iPhone16ProMax, iOS26.6.2.

The new layout removes `position:fixed` from the touch body and anchors the canvas, touch controls, HUD and panels to the same document-backed rectangle. Browser mode uses dynamic viewport height; installed/fullscreen mode uses large viewport height. Renderer resolution, camera aspect, menu framing, touch bounds and look scaling measure the actual stage/root rectangle instead of independently trusting `innerHeight`. A ResizeObserver plus settled rotation/page-resume checks updates them together; delayed checks do not clear gestures unless dimensions actually changed. Safe-area padding remains on interactive controls. No guessed62px or physical-screen enlargement is applied.

The manifest now requests fullscreen with standalone fallback. The deprecated Apple status-bar-style key is removed, following a current WebKit engineer's guidance in [317153 comment2](https://bugs.webkit.org/show_bug.cgi?id=317153#c2); merely alternating `default` and `black-translucent` is not a reliable fix. Reports [313800](https://bugs.webkit.org/show_bug.cgi?id=313800) and [301994](https://bugs.webkit.org/show_bug.cgi?id=301994) describe a system-owned62px strip outside the page. CSS cannot be assumed to paint outside the OS web view. Consequently, desktop testing is a layout regression check, **not confirmation on the affected installed iPhone**.

Settings → Visuals → Copy Display Report copies the release marker, installed mode, screen/window/visual viewport, document/stage/canvas/control rectangles and safe-area values. It contains no save data or URLs and is shared only if the user chooses to send it. Clipboard-denied contexts show selectable text. This makes a remaining device failure measurable instead of repeating unsupported CSS guesses.

Focused tests cover956×440 with stale378 window height, portrait440×956, empty-rectangle fallback, shared renderer/camera sizing and safe insets. Browser review confirms full440/956 stage/canvas/control height, zero root scrolling, rotation pause and visible report access. Actual iOS26.6.2 still requires the user's relaunch test; do not label that platform bug resolved from emulation alone.

## Sustained-obstruction auto-jump

`mobile-jump.js` compares world-space movement intent with collision normals and actual directional progress. It waits 140 ms with direction within roughly 26°, permits 35 ms of brief contact gaps, and rejects ordinary wall sliding/progress, weak input, ceilings, launch-pad flight and inactive input. A committed jump uses `FEEL.jumpSpeed` and holds Space for at least 500 ms even when horizontal input subsequently releases. Swimming may trigger without ground contact; the held input drives native `swimVertical` to clear banks. Pause, death, respawn and cleared touch input reset the detector/hold. Desktop jump/crouch remain manual. Permanent burst/volley/manual labels near the reticle are removed; charging, heat and hit feedback remain transient. Killstreak readiness uses “TAP STREAK” on touch and key labels on desktop.
