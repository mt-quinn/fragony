# Shader exploration — complete
1. Inspect renderer/assets and research primary sources — complete.
2. Build isolated interactive lab with eight real-time treatments and actual arena, dummy and rifle assets — complete.
3. Visually verify treatments, comparison and alternate scenes; save boards — complete.
4. Deliver local lab, research sources and artistic recommendations — complete.

Outputs: dist/art-lab.html, art-lab.css, art-lab.js, art-lab-shaders.js; comparison-board.png; portrait-board.png; screenshots and individual Shipment previews.

Verification: both JavaScript modules pass node --check; all shader branches render in browser; no browser warnings/errors; Rust, Shipment, Reservoir and portrait checked; clean split verified; in-page export produced and inspected. Scene and signal animation and intensity/scale controls provided. This is an isolated viewer using actual game assets, not a production gameplay or performance validation.

Issues resolved: local server first required host permission and initial port was occupied, moved to 4196; Shipment camera replaced with valid spawn; browser download-event wait stalled, replaced automatic download with in-page board and explicit save link; Pillow unavailable, exported boards directly from browser instead. Shared scene resources retained in cache until page teardown.

Existing uncommitted game work preserved. No production deployment requested or performed.
