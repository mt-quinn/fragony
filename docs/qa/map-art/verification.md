# Verification

- All19 new map profiles received native multi-area review, including different elevations and100/50/5HP characters. Each was repeated after the final upward-floor classification correction. Final captures and detailed map ledgers are linked in `review-log.md`.
- The approved Shoot House source render, palette, object ownership and physics/navigation assets are unchanged. Its actual main-menu scene was checked in the browser.
- Both new art acceptance commands pass: physical assembly recovery;19-map palette/paint/source-geometry/native-anchor/floor/shared-shader/transition checks. They are also included in the default regression chain.
- Every triangle's original packed position fingerprint matches the immutable `aee5ddd` baseline. Original collision and navigation files were not edited.
- Real visibility-ray comparisons against source geometry pass on Rust (1832rays, maximum error0.981mm) and Mutiny (798rays, maximum error0.115mm), within the existing1mm render-packing tolerance.
- All67 pre-existing regression commands pass across the initial run and focused continuations. The archive checks were updated because smaller Vacant assets no longer need multiple parts; single-file and multipart browser progress/reconstruction both pass. The isolated water-renderer stub now includes the final-pass map-selection uniforms. No water behavior changed.
- Gameplay checks include native short matches across the active roster, lifts/falls/cover, weapon/attachment behavior, settings/menu flows, water, fence alpha holes, actor-mask protection and render-state restoration.
- Final static release:226files,234,007,641bytes, below250MiB. All20 active maps load using production files alone; original non-render archives remain exact and source authoring copies are excluded.
- Actual browser flow checked: loading screen → approved Shoot House main menu → Practice → Mutiny → cached Reservoir → main menu. First-person hands, weapons, HUD, floor paint and palette transitions render correctly. Practice map and selected settings category restored after verification.
