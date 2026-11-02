# Dead Heat

A single-player Three.js arena FPS roguelike. Chalk geometry, ink silhouettes, acid-yellow crash-test dummies.

## Play locally

Run `npm start` and open http://127.0.0.1:4173. No install or build required; Three.js is vendored.

WASD move, Shift sprint, mouse aim, left click fire, right click aim down sights, Space jump, hold Q slow motion, R reload, G grenade, F earned airstrike, 1–6 or wheel switch owned weapons, Escape pause. Browsers without pointer lock support drag aiming and arrow-key look.

90-second free-for-all against five opponents. Unlimited respawns. Finish in the top three to advance and purchase upgrades; otherwise the run ends. Ties favor fewer deaths. Three consecutive kills earn an airstrike. Run progression saves in this browser.

Six weapons: accurate rifle, hand cannon, fast SMG, piercing rail rifle, splash rocket launcher with rocket jumping, and a 12-pellet shotgun with a tight central pattern. Unlock weapons between rounds. Crash-test dummy limbs shatter only on lethal hits or post-mortem hits, then reset on respawn.

The Foundry is an original connected arena with central cover, outer routes, raised side lanes, four jump pads, and health/focus/overhealth pickups. Opponents use a navigation graph and line-of-sight combat. Later rounds increase their speed, damage, accuracy and firing frequency.

## Verify

`npm test` checks map connectivity, living/terminal/post-mortem limb damage, respawning, rifle and rail hit detection, shotgun range behavior, rocket jumping, purchases and saved loadout, full-match bot combat, and run progression/elimination.

## References

Crash-test dummy design references: [Euro NCAP dummy family](https://www.euroncap.com/want-to-meet-our-family-of-dummies/) and [NHTSA crash test dummies](https://www.nhtsa.gov/nhtsas-crash-test-dummies). Models are original procedural geometry. Three.js v0.182.0 is distributed under MIT; see `dist/vendor/THREE-LICENSE.txt`.
