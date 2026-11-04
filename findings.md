# Findings

Three.js r182, custom world + weapon HDR targets, GTAO, bloom and final grade. Old tiny smoothing is not FXAA. AA samples currently fixed at 2, independently enabled. Default mobile balanced caps pixels at 950k; avoid changing resolution. FXAA/SMAA addons not yet vendored. Temporal mode requires camera jitter, history reprojection/rejection and resets; label experimental for moving geometry without motion vectors.

Official r182 SMAA and FXAA modules vendored with relative imports. OutputPass preserves correct linear SMAA / sRGB FXAA ordering and tone mapping. MSAA hardware can expose 4× only; report supported actual allocation instead of assuming 2× exists. TAA camera reprojection uses depth rejection, neighborhood clamping, reactive history weight; weapon excluded.

Benchmark reports measure actual displayed frame intervals (not GPU timings). Native callbacks run seeded AI/combat at fixed valid spawns with camera sweeps and native rifle/particle/grenade/explosion effects; parent rendering suspends while child runs. No campaign state is loaded into or written by benchmark practice. Reports include original graphics snapshot, actual framebuffer size, date/device metadata and per-scene counters. Warm-up is 3s and measurement 4s for each of six scenes.
