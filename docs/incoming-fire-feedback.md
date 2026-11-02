# Incoming fire feedback

Reference pass, 2 November 2026. The reference behavior is separate transient incoming-fire direction, confirmed damage, and persistent low-health feedback. Recreating a whole franchise identically is not claimed: the source game and era matter, and timings below are explicit DEAD HEAT tuning.

## Sources inspected

- NoAnnoyingCommentary, [Modern Warfare 4 multiplayer gameplay](https://www.youtube.com/watch?v=AKc7YSLIxdU&t=123s). Inspected the firefight around 2:03–2:05 using paused frames and YouTube frame stepping. The red hit cue moves off the forward bearing during the camera turn and fades before the broad blood/health overlay has fully gone. This supports treating bearing, cue lifetime, and health severity as independent state. These samples do not isolate near misses or prove the game's exact stacking allocation.
- [CoD stock configuration](https://github.com/promod/CoD-Stock-Scripts/blob/master/configure.cfg): the archived configuration exposes a 2000 ms damage-icon duration and separate size and offset controls. This is a classic CoD timing reference, not proof of MW4 defaults.
- Fagerholt and Lorentzon, [Beyond the HUD: User Interfaces for Increased Player Immersion in FPS Games](https://publications.lib.chalmers.se/records/fulltext/111921.pdf), Appendix 5, printed p.117 / PDF p.123. In cooperation with EA DICE, the authors directly compared CoD4, Bad Company, Halo 3 and Killzone 2. Their CoD4 discussion separates the longer hit fade, critical-health red filtering, heartbeat and bullet audio. The paper does not specify MW4 near-miss/layering algorithms.
- [Visualization in games: How is health and health-changes visualized in games?](https://www.diva-portal.org/smash/get/diva2%3A1427214/FULLTEXT01.pdf), printed pp.31–32. The 50-game analysis distinguishes camera-relative rotating crescents from fixed screen blood splashes and separates injury direction from overall health.
- Behm, [Visual Attention and Reaction Times in FPS Games](https://www.diva-portal.org/smash/get/diva2%3A1726755/FULLTEXT02.pdf), section 3.3 and Appendix 3.1, printed p.40. Its Warzone examples explicitly distinguish red 2D directional cues and the red screen response at impact. The experimental portion tests target highlights, so it is not evidence for precise damage-cue timing or suppression rules.

## DEAD HEAT implementation

- Store the world bearing at each incoming event. Compute the displayed angle from current camera yaw every presentation frame. Turning right moves a formerly forward cue left; facing the source brings it to the top. Full-circle wrap, side and rear bearings work equally.
- Keep one independently timed cue per shooter/life, refreshing on subsequent fire. No merging by similar angle. Closely overlapping bearings occupy separate radial lanes, retaining their individual fades. There are eight bounded cue slots, sufficient for every opponent and environmental damage.
- Hits show a solid red tapered crescent for two seconds, with a final 0.6-second fade. Incoming rounds that actually pass close to the body show a thinner, broken chalk arc for 0.65 seconds. A hit upgrades that shooter's cue; a later near miss cannot downgrade a live hit.
- Near misses test actual pellet trajectories after spread and collision, not the ideal aim vector or a sound cooldown. A segment must pass abreast of the player's body within 1.5 world units. Cover before the player, distant fire, shots travelling away, spawn grace and dead players cannot generate these cues. This lighter near-miss treatment and per-shooter allocation implement the user's requested behavior; their exact MW4 constants were not established by the references above.
- Direction markers never imply damage on a near miss. Health tint and heartbeat still reflect actual remaining health; no accuracy, aim or movement penalty is added.

## Validation

The focused tests exercise full-circle camera rotation, angle wrapping, co-angular shooters, distinct lanes, same-shooter refresh, hit priority, independent expiration, near-miss segment distance and actual bot firing behind solid cover. Existing health warning, death/respawn cleanup, audio and combat regression tests remain in the full suite.
