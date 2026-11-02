# Arsenal presentation

Display/bind order: Nailer (pistol), Rattler (SMG), Jackhammer (assault rifle), Sledgehammer (shotgun), Demolisher (rocket launcher), Lancer (railgun). Internal save IDs and attachment IDs remain stable; weapon-order.js is the presentation mapping.

## Nailer
Heavy industrial hand cannon. Beveled graphite/steel core, safety-yellow slide casing and grip inserts, protected working parts, exposed heavy bore, open trigger guard. Purposeful fasteners and serrations; no arbitrary detail layers. Safety yellow remains independent of the health-colored crash-dummy hands.

The slide, tilting barrel, curved trigger, magazine and slide catch are separate mechanisms. Empty magazines lock the slide; empty reloads visibly exchange the magazine and release the catch. The supporting hand and forearm follow the reload. Bots carry a lighter version of the same silhouette.

All attachment slots have dedicated geometry. Six optics use a fixed bridge with clearance around the reciprocating slide. Open dot, circle, holographic, prism, tube and scout housings preserve their own windows; sights align to the actual aim axis. The Nailer view model retains a minimum 65° rendering FOV while the world magnifies for 2× optics. Actual camera FOV/projection are restored after the weapon render. Iron sights have contrasting inserts; ADS suppresses idle vertical weapon bob.

Long/snub/heavy barrels retain the barrel axis. Crown, brake and slab compensator use real open muzzle geometry, with flash/tracer origins at the fitted muzzle. Larger magazines extend below the grip rather than becoming an unrelated drum; speed magazine and trigger options have their own shapes. Geometry/materials are cached and shared.

Base combat balance is unchanged: 83 damage, 7 rounds, .53 second shot interval, 1.6 second reload. Models for the other five weapons remain for subsequent work; their approved names and slot order are applied.
