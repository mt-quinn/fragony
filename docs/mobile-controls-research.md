# COD Mobile Simple Mode research for Fragony on iPhone

Research date: November 2, 2026. Target: iOS browser, landscape. Agreed direction: reproduce COD Mobile's touch controls closely, make Simple Mode automatic firing the default, and express the HUD in Fragony's visual style. Optional manual hip-fire remains a requested capability.

The strongest available evidence establishes the control structure and several important exceptions. It does not establish the current game's numerical acquisition delays, target tolerances, or release rules. Those values need controlled reference captures before we can claim close timing parity. This is a research and implementation brief; game code has not been changed.

## Evidence and reference versions

| Evidence | What it establishes | Limit |
| --- | --- | --- |
| [Activision's May 2019 preview](https://blog.activision.com/call-of-duty/2019-05/Call-of-Duty-Mobile-Fresh-Intel-A-Preview-of-Whats-to-Come) | Simple fires when the crosshair focuses on an enemy; a setting limits automatic hip-fire range. Advanced manual firing and weapon-specific ADS/hip choices are distinct. | Historical official description, not a current parameter table. |
| [Activision's October 2019 controls guide](https://blog.activision.com/call-of-duty/2019-10/Getting-a-Grip-on-the-Call-of-Duty-Mobile-Controls) | Left-stick movement/right-side drag look; separate ADS; reload and empty-magazine auto-reload; grenade preparation/cancel; launcher fire button; HUD position/size/opacity; optional aim assist. | Historical behavior; obsolete hardware options and old FOV numbers should not become requirements. |
| [Official November 2020 community update](https://www.reddit.com/r/CallOfDutyMobile/comments/jxf28i/call_of_duty_mobile_november_19th_update/) | Developers explicitly classify failure to auto-fire at prone enemies as a bug. | Does not prove the bug is fixed in every later build. |
| [Official August 2023 update](https://www.reddit.com/r/CallOfDutyMobile/comments/15gp05y/call_of_duty_mobile_august_2nd_community_update/) | Announces edge mistouch prevention, additional movable-joystick options, and a Secondary Fire option for weapons such as launchers. | The phrase about immediate firing does not specify the entire Simple Mode interaction. |
| [Official February 2024 announcement](https://www.callofduty.com/ca/en/blog/2024/02/call-of-duty-mobile-season-2-2024-lunar-dragon-multiplayer-modes-battle-pass) | HUD customization expands across modes with synchronization. | Does not establish a particular layout or touch tuning. |
| [Noah Sunday's auto-fire recording, published June 2022](https://www.youtube.com/watch?v=QcbSP_gPVFU) | Actual Simple settings panel, phone handcam, automatic/shotgun/sniper exchanges, contextual fire controls. | Edited historical matches; uncontrolled weapons, latency and player input. |
| [iFerg's Simple Mode recording, 2021](https://www.youtube.com/watch?v=WZRV0GSAJpM) | A second first-person source spanning several weapons and a launcher exception. | Historical, edited gameplay. Creator judgments are not design requirements. |
| [WebPro Education's controls walkthrough, February 2025](https://www.youtube.com/watch?v=vHOsu_DWd6k) | Actual mode-selection and HUD editor screens. | A walkthrough, not an automatic-trigger experiment. |
| [Bobby Plays' settings walkthrough, published December 29, 2025](https://www.youtube.com/watch?v=d6KqxYOq9Co) | More recent settings vocabulary and interactions. | Creator preferences, mainly manual play; sponsorship does not make it an engine specification. |

The four linked creator transcripts were read; selected frames from the first three were inspected in the browser. This is not a claim to have played the installed current COD Mobile application or measured it frame by frame.

## What the recordings add

### Simple settings and automatic firing

In [Noah's recording at 0:16](https://www.youtube.com/watch?v=QcbSP_gPVFU&t=16s), Simple has a range limiter and its own layout editor. The unchecked limiter is this player's setting, not a verified factory default.

At [2:35](https://www.youtube.com/watch?v=QcbSP_gPVFU&t=155s), the ordinary HUD has ADS and reload without a normal trigger. Commentary at [4:02](https://www.youtube.com/watch?v=QcbSP_gPVFU&t=242s) describes acquisition interrupted by sliding. The [SVD at 6:15](https://www.youtube.com/watch?v=QcbSP_gPVFU&t=375s) responds more slowly than the earlier SMG; [R90 at 9:54](https://www.youtube.com/watch?v=QcbSP_gPVFU&t=594s) also has perceptible acquisition. Tripmine and Shock RC fire controls appear contextually. This supplies qualitative behavior, not calibrated timings.

### Weapon and target exceptions

In [iFerg's recording around 1:18](https://www.youtube.com/watch?v=WZRV0GSAJpM&t=78s), ordinary shooting has no manual trigger; the player still aims and compensates for recoil. Around [2:14](https://www.youtube.com/watch?v=WZRV0GSAJpM&t=134s), he comments on shotgun acquisition. At [3:11](https://www.youtube.com/watch?v=WZRV0GSAJpM&t=191s), he identifies a fire button appearing for the SMRS launcher. He reports ordinary automatic fire failing to engage a UAV, wall-covered opponent and sentry at 4:29, 5:52 and 8:52 respectively. These target restrictions belong to the recorded build; they do not prove a current visibility algorithm. The 1:25 frame shows ADS firing, a yellow cue near an opponent and the separate hit marker; the yellow cue's complete meaning is unresolved.

### Customization and newer input settings

The [2025 walkthrough at 0:25](https://www.youtube.com/watch?v=vHOsu_DWd6k&t=25s) shows Simple's range-limiter label beside Advanced's ADS, hip-fire and custom choices. The [0:45 editor](https://www.youtube.com/watch?v=vHOsu_DWd6k&t=45s) has hiding, size, opacity, directional nudging, layout selection and separate reset, exit and save actions. These are distinct settings, not one global HUD-scale slider.

The [recent Bobby Plays walkthrough](https://www.youtube.com/watch?v=d6KqxYOq9Co) covers dragging on ADS to rotate the camera (1:25), quick weapon switching (1:28), queued bolt-action input (1:38), tap/hold ADS (1:51), reload/ADS interactions (2:40), grenade-throw choices (2:54), edge mistouch prevention (3:54), and fixed-speed versus acceleration-based look response (8:12). Its numerical preferences should not be copied into a different engine or from a large tablet onto an iPhone. The important finding is that these behaviors are independently configurable; it does not establish that every option works identically in Simple Mode.

## Automatic trigger behavior to reproduce

Automatic firing, aim assist and aiming down sights are three separate systems. Acquiring a trigger target must not be silently treated as permission to steer the camera or force ADS. A close adaptation should preserve the player's responsibility for alignment, tracking and recoil control.

The following is a candidate implementation model inferred from the observed behavior. Its state names describe our proposed implementation, not recovered COD source code.

1. **Unavailable:** menus, pause, portrait interruption, respawn, weapon transition, grenade preparation or another blocking action prevents firing.
2. **Searching:** the player is active and the gun is available, but aim has no qualifying target.
3. **Acquiring:** a live target satisfies the targeting conditions; acquisition begins and the reticle can communicate readiness.
4. **Firing:** acquisition is satisfied; the ordinary weapon system receives trigger intent and applies its own cadence, recoil, ammunition and recovery.
5. **Recovering:** the weapon cycles between shots. Target qualification continues, but a second system must not impose an accidental duplicate fire-rate delay.
6. **Reloading:** the magazine is replenishing. Define whether acquisition can continue, whether ADS is retained, and whether firing waits for fresh acquisition afterward.

Loss of visibility, target death, a different target, a new life of the same bot, and loss of aim alignment are separate transitions. Each can have a different rule; giving all of them a generic timer reset is an unverified simplification. Likewise, adding a long grace period could continue shooting at empty space. Current COD recordings are needed to choose the actual tolerances.

### Parameters that remain unmeasured

| Parameter | Why it matters | Reference experiment |
| --- | --- | --- |
| Initial acquisition delay | Separates deliberate tracking from sweeping across an enemy. | Begin with a settled gun; move onto a stationary target and record eligibility cue and first shot. |
| Hip versus ADS acquisition | A single timer might make scoping feel wrong. | Repeat the same target/range from each stance with the same gun. |
| Weapon-class differences | A universal delay can distort shotguns and precision weapons. | Matched trials for automatic rifle, SMG, pistol, pump shotgun and sniper. |
| Release delay | Determines unwanted extra shots after moving away. | Move off target during a sustained burst. |
| Brief loss and reacquisition | Controls behavior under recoil and erratic targets. | Cross the target edge briefly, then return; vary the duration. |
| Target transfer | Prevents charging against one enemy and immediately discharging at another by accident. | Move between two adjacent living opponents. |
| Detection geometry | A screen rectangle can fire through empty space around an articulated character. | Compare head, torso, exposed arm/leg and the space between limbs. |
| Range limiter distance | Defines when hip-fire stops qualifying. | Walk away in measured increments; repeat in ADS and with several weapons. |
| Distance falloff in acquisition | Near and distant targets might qualify differently. | Compare stationary targets at several distances without changing other conditions. |
| Reticle animation | Communicates acquiring versus firing versus an actual hit. | Capture successful and abandoned acquisitions at high frame rate. |
| Reload and ADS transitions | Prevents accidental cancel/restart loops. | Acquire while reloading; aim in/out before and after magazine insertion. |
| Precision-weapon recovery | Separates initial delay from bolt/pump timing. | Stay aligned across several shots, then lose and reacquire between cycles. |

There is no defensible single public value such as “COD uses a 200 ms dwell” in this research. A video commentator saying a gun takes forever does not supply a timing measurement. Do not transfer timing from Roblox, Warzone Mobile or a macro-controller manual.

### Measuring parity

Use a private reference match with the game version, mode, device, weapon, attachments, frame-rate setting, aim-assist state and range limiter recorded. Keep those fixed within each comparison. Capture both the screen and fingers when an interaction depends on touch.

Record at least repeated trials for each condition and report median and spread, rather than a single convenient example. Separate crosshair eligibility, initial muzzle flash, ammunition decrement and visible damage; network hit confirmation is not the automatic-trigger delay. A 60 fps recording has roughly 16.7 ms frame granularity before compression or capture errors. Do not promise subframe precision from it.

For acquisition-loss tests, distinguish the target moving out of aim from recoil moving aim off the target. For ADS tests, distinguish the touch, the animation beginning, the camera settling and first eligible shot. For target transfers, use distinguishable actors. Record unchanged-control trials alongside alternatives so normal weapon recovery is not mistaken for automatic-trigger tuning.

## Controls and HUD treatment

The agreed fidelity target is COD's interactions with Fragony's appearance. Familiar placement should keep movement low-left, a large unobstructed right-side aiming area, and reachable ADS, jump, stance and reload controls. Final positions must be tried on the actual iPhone; a desktop screenshot cannot establish thumb comfort.

Simple should remain the normal mode, with its settings and editor fully supported. Manual controls are optional alternatives and equipment exceptions. The earlier Warzone Mobile guide explicitly permits fire buttons alongside automatic fire; that is not proof of the same option in current COD Mobile Simple. Preserve the requested optional manual hip-fire capability in Fragony while marking it as a deliberate extension until verified against current CODM.

For the manual override, define separately whether a finger can drag to aim while firing, whether it exits ADS, and what happens when that finger releases over a still-valid automatic target. A pause/death must clear held input; a stale held trigger must not survive into a new life. These are behavior decisions to resolve explicitly during implementation.

Movement needs analog magnitude, a tunable center dead zone, predictable saturation and a deliberate sprint threshold. Fixed joystick display position and how its input origin follows the finger are separate concepts. Make the chosen control stable when a second finger lands. Do not let a right-side look drag become movement merely because it crosses the middle of the screen.

ADS should be reachable by a thumb and should support continuing aim from the ADS contact. Decide tap, hold and mixed behavior through reference tests, including movement beyond the original button bounds. Finger ownership and cancellation determine the result; a click handler alone cannot reproduce it.

The reticle should distinguish neutral aim, qualifying/acquiring, firing and confirmed damage in Fragony's chalk/ink/acid palette. Actual hits must still come from combat resolution. An acquisition indicator must not imply a hit or reveal a hidden target. Decorative motion should remain small enough to judge alignment.

Health, ammunition and weapons can form a compact lower information area. Placement and time can replace the always-visible full leaderboard; tapping opens standings. A ready streak needs a clear action state. Focus/slow motion needs its own reachable control and visible remaining charge. Those are Fragony adaptations, not COD Simple findings.

The editor should support independent control positions, size, opacity, optional hiding, fine adjustments and saved layouts. Keep hit regions large enough even when visual icons are small. Warn about overlapping essential actions, preserve a way to recover an unusable layout, and make exit-without-saving distinct from save. Normalize anchors within the usable landscape area and test both landscape directions.

Do not add dummy prone, slide or mantle icons to imply features Fragony does not implement. Those are separate gameplay work if desired. The existing crouch and jump controls must also work as swim-down and swim-up in water. A minimap likewise needs real multilayer-map design and explicit enemy-information rules; it should not be added solely for visual resemblance.

## Mapping to the existing game

| Repo location | Current behavior | Consequence for mobile implementation |
| --- | --- | --- |
| `dist/controls.js` and `game.js` input handlers | Physical bindings are translated back into canonical keyboard/mouse codes. | Introduce shared action state with desktop and touch producers. Avoid synthetic keyboard events. |
| `game.js` updateStep | Every nonzero horizontal direction is normalized to full chosen speed. | Preserve joystick magnitude; clamp diagonals without turning gentle motion into full speed. |
| `game.js` lock and animation loop | Play advancement depends on a variable also used for mouse capture/fallback. | Separate active play from pointer lock. Touch gameplay must not depend on desktop capture. |
| `game.js` syncAimCamera and shoot | The shot direction includes the recoil spring and current camera pose. | Automatic eligibility should use the same aim basis; raw yaw/pitch alone can disagree with the shot. |
| `game.js` botHitMeshes | Dead actors remain hittable for corpse shattering. | Exclude dead targets from acquisition and distinguish actor life IDs across respawns. |
| `game.js` shoot and reload | Existing functions own damage, spread, ammunition, reload and cadence. | Automatic firing should feed those functions rather than create a second damage path. |
| `game.js` switchWeapon | Saves magazines, cancels reload, applies equip delay and resets weapon motion. | Clear or recompute acquisition while preserving these existing rules. |
| `game.js` present and movement | Sprint presentation and movement speed read overlapping but different input conditions. | Audit firing/ADS/sprint together; changing the pose alone must not silently change movement balance. |
| `game.js` updateHUD and `style.css` | HUD is display-only; several elements are replaced roughly ten times per second. | Persistent input elements need stable identity and ownership throughout a gesture. |
| `game.js` applyHUDScale | CSS zoom creates a logical HUD viewport. | Keep input coordinates and scaled HUD geometry explicitly reconciled. |
| `dist/audio.js` unlock | Resume logic checks suspended state. | Add correct interruption recovery for Safari's interrupted state when implementing mobile lifecycle. |
| `dist/presentation.js` | Multiple world/weapon/AO/bloom passes; HDR availability selects some effects. | Add measured quality tiers. GPU feature support is not a speed measurement. |

Fragony's six weapons require explicit policy mapping. JACKHAMMER and RATTLER are sustained-fire candidates; NAILER, LANCER and SLEDGEHAMMER need first-shot and repeated-cycle comparisons. DEMOLISHER needs manual launch access for leading, splash placement and rocket jumping even if target-trigger firing is offered. Those uses cannot depend on putting an enemy directly under the crosshair. This mapping preserves current weapon identities rather than substituting COD damage or fire rates.

Slow motion introduces a behavior COD cannot specify for us: acquisition time relative to player time versus slowed world time. Compare both in Fragony and document the chosen rule. Target readiness must not accidentally get slower because a world-time multiplier is applied twice.

## iOS browser requirements

### Screen area and landscape

[WebKit's safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) explains `viewport-fit=cover` and safe-area environment insets. Let the world fill the display while keeping essential actions clear of the sensor housing, corners and Home indicator. Preserve extra comfortable spacing beyond an inset where thumb travel needs it.

[Safari's dynamic viewport units](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/) account for changing browser-bar dimensions. Recompute usable control geometry when the viewport changes, and avoid moving a held joystick origin mid-gesture. Portrait should pause and request rotation instead of letting unseen gameplay continue behind an overlay.

Generic element fullscreen cannot be assumed on iPhone: [WebKit's fullscreen issue remains open](https://bugs.webkit.org/show_bug.cgi?id=206854), with a [recent duplicate](https://bugs.webkit.org/show_bug.cgi?id=328773). Detect actual support and keep ordinary Safari playable with its browser chrome. Home Screen launch can be an optional presentation improvement; it does not convert browser APIs into native game APIs. [Orientation lock also has limited availability](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock), so landscape support must include a rotate prompt.

### Input and interruptions

[Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) provide per-contact identity and pointer capture; [touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) controls browser gesture handling. Use stable gesture ownership on the gameplay surface, handle cancellation and lost capture, and prevent duplicate mouse compatibility events from firing an action twice. Settings and Arsenal still need normal usable scrolling.

On hidden/background, pause, death, orientation change or context loss, clear transient input and acquisition. Require a deliberate return to play. Resume must not fire because an old finger or old target timer survived. Handle [Safari's interrupted audio state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state) alongside suspended audio.

Gyro is optional: [iOS sensor permission](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static) needs a secure context and a user gesture. Denied or unavailable sensors must leave touch aiming fully usable. Calibrate relative motion in both landscape directions and test recentering; do not assume a raw axis maps directly to screen yaw.

Screen wake lock is useful when available; [Apple fixed its Home Screen web-app support in iOS 18.4](https://developer.apple.com/documentation/safari-release-notes/safari-18_4-release-notes). Release/reacquire it according to visibility and handle refusal. Standard vibration should not be a promised iPhone gameplay feature: the [WebKit request to add the API remains open](https://bugs.webkit.org/show_bug.cgi?id=288846). Visual and audio feedback must carry essential information.

### Sustained performance

Target steady 60 fps on an agreed baseline iPhone before adding higher-refresh modes. Test ordinary Safari first; the in-app desktop preview is not an iOS performance proxy. Inspect frame-time spikes during first shots, map transitions, dense effects and ragdolls. Use warm 10–15 minute play sessions, not just a cold menu benchmark.

Preserve targeting consistency across quality tiers. Lowering render resolution must not change touch sensitivity or the acceptance angle for an automatic shot. Prioritize silhouettes, sights, damage cues and UI text before optional AO, bloom, shadow quality and effect counts. Profile CPU and GPU separately; bot logic, articulated characters, repeated raycasts and DOM work can compete with touch processing even when pixel count is low.

Both music tracks are decoded into memory in the current implementation. Include audio buffers in memory review alongside render targets and geometry. Do not equate compressed download size with runtime memory use.

## Verification cases for a faithful implementation

These are proposed tests, not completed mobile checks.

| Area | Required cases |
| --- | --- |
| Automatic qualification | Live versus dead target; different lives of same actor; head/limb/torso; partial cover; target behind solid wall; open window; moving platform; elevated target. |
| Acquisition timing | Fresh target; brief edge loss; long loss; transfer to adjacent enemy; recoil leaving target; target death; range-boundary crossing; hip/ADS transitions. |
| Weapon rules | Sustained automatic burst; pistol repeats; pump/rail recovery; empty magazine; preserved magazine after switch; attachment-modified cadence; manual rocket placement. |
| Action precedence | Reload while acquiring; target appears during reload; switch while firing; sprint while ADS; grenade prepare/cancel/throw; streak activation; slow-motion start/end. |
| Touch ownership | Move and look together; movement plus ADS drag; add jump/crouch; lift either thumb first; drag outside a button; reverse finger order; third/fourth contact; pointer cancellation. |
| Recovery | Pause with held controls; death while acquiring; respawn under the same finger; app switch; screen lock; incoming interruption; denied gyro; lost WebGL context. |
| Geometry and presentation | Both landscape directions; notch/Home indicator; browser bars expanded/collapsed; saved layout after viewport change; HUD scale; tiny visual button with usable hit area. |
| Menus and persistence | Scrollable settings; control-mode persistence; cancel editor; save editor; reset one layout; recover hidden essential action; purchase/loadout/results/death recap on phone. |
| Performance | First action after load; five bots in combat on every map; effects/ragdolls; warm-session frame times; stable memory; no sensitivity changes across frame rate or resolution tiers. |

Useful instrumentation should log target eligibility, target life, acquisition start/reset reason, trigger intent, blocked reason and actual shot times. That separates control faults from weapon cooldown, reload, rendering or AI behavior. Keep it out of the normal player HUD.

## Research conclusions

The public evidence is sufficient to design a serious COD-inspired Simple Mode with independent movement, aim and ADS; automatic acquisition; weapon exceptions; contextual buttons; a real HUD editor; and iPhone lifecycle support.

Close behavioral fidelity still depends on current-build reference measurements for target acceptance, acquisition/reset/release, exact weapon policies, range limiting, and manual-button availability within Simple. These should remain named tuning questions rather than invented COD constants. The next implementation can isolate them in a small calibration scene before the finished mobile HUD is built around the controls.
