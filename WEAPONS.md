# Arsenal presentation

Display/bind order: Nailer (pistol), Rattler (SMG), Jackhammer (assault rifle), Sledgehammer (shotgun), Demolisher (rocket launcher), Lancer (railgun). Internal save IDs and attachment IDs remain stable; weapon-order.js is the presentation mapping.

## Nailer
Heavy industrial hand cannon. Beveled graphite/steel core, safety-yellow slide casing and grip inserts, protected working parts, exposed heavy bore, open trigger guard. Purposeful fasteners and serrations; no arbitrary detail layers. Safety yellow remains independent of the health-colored crash-dummy hands.

The slide, tilting barrel, curved trigger, magazine and slide catch are separate mechanisms. Empty magazines lock the slide; empty reloads visibly exchange the magazine and release the catch. The supporting hand and forearm follow the reload. Bots carry a lighter version of the same silhouette.

All attachment slots have dedicated geometry. Six optics use a fixed bridge with clearance around the reciprocating slide. Open dot, circle, holographic, prism, tube and scout housings preserve their own windows; sights align to the actual aim axis. The Nailer view model retains a minimum 65° rendering FOV while the world magnifies for 2× optics. Actual camera FOV/projection are restored after the weapon render. Iron sights have contrasting inserts; ADS suppresses idle vertical weapon bob.

Long/snub/heavy barrels retain the barrel axis. Crown, brake and slab compensator use real open muzzle geometry, with flash/tracer origins at the fitted muzzle. Larger magazines extend below the grip rather than becoming an unrelated drum; speed magazine and trigger options have their own shapes. Geometry/materials are cached and shared.

Base combat balance: 45 body / 67.5 head damage (three body hits against 100 HP), 7 rounds, .53 second shot interval, 1.6 second reload. The remaining five weapons now share the approved industrial material language, with distinct construction and purpose-built attachments.


## Remaining arsenal
- Rattler: compact ventilated receiver, folding wire stock, stick/drum magazines, fast cycling bolt.
- Jackhammer: reinforced full-length rifle, floating barrel and handguard, steel receiver details, skeleton stock, changing magazine and charging handle.
- Sledgehammer: broad receiver, full shoulder stock, exposed barrel/tube pair, articulated ribbed pump and shell speed-loader reload.
- Demolisher: open shoulder tube, safety housing and carry handle, offset sight line, five/seven/four-round loading cassette, opening breech and motor/warhead variants.
- Lancer: open twin accelerator rails, isolating coil bridges, precision stock, scope, detachable side battery and charging mechanism.

Each attachment family has explicit mounting geometry and an aligned sight axis. First-person magnification is separated from housing size for every gun. Matching simpler bot models retain the silhouettes; a simple arm-hit proxy keeps decorative geometry out of bullet-query costs. Static surfaces are merged within their independently moving groups; merged buffers are disposed when a model is replaced. Health colors remain limited to crash-dummy hands/arms. Existing balance, attachment effects, ownership and saved IDs are preserved.

Weapon UI silhouettes are baked from the actual base hero geometry by `node tools/bake-weapon-icons.mjs`. The shared `gunIcon` covers the HUD identity, owned weapon slots, shop offers and Arsenal catalog. Arms and transparent optics are excluded; trigger guards and stock openings remain transparent. Runtime loads only the generated SVG paths.


## Conversion hardware

The approved attachment redesign is implemented in [attachment-redesign.md](docs/attachment-redesign.md). All six weapons now have action, ammunition, feed and handling kits, with up to three gameplay parts plus a free sight. Original stock silhouettes remain. Distinct paired bores/rails/tubes, rotary/burst/charge mechanisms, proportional magazines/cassettes, cartridge markings and rigs are authored in `dist/attachment-models.js`. Inspection, live recoil/charging/feed animation and disposal share the actual weapon geometry; they are not image-only previews.

Penetrators retain the converted weapon’s full first-target damage. Slamfire keeps the full shell budget and visually/mechanically builds recoil and spread, then settles on release. The older presentation notes above describe the stock model history; the new catalog replaces the old barrel/muzzle/stat-upgrade slots.
