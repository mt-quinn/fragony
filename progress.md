# Progress

Inspected existing AA controls, settings persistence, frame renderer and test harness.

Implemented 0/2/4× MSAA; FXAA/SMAA; experimental world-only TAA with depth reprojection; full graphics UI and native-resolution scale; independent effects presets and live appearance controls. Browser rendered 36 AA combinations with AO/bloom on/off without shader/WebGL errors. Allocation/settings tests pass all 144 combinations. Browser desktop settings persisted and effects presets preserved resolution/AA. Native six-scene benchmark running in isolated game child.

Errors resolved: mocked settings test needed distinct DOM controls; resize emits dispose events so lifecycle listeners moved after resize. Browser launch and local preview required authorized escalation. Legacy mobile test asserted quality changes pixel count; updated for independent resolution. Concurrent workspace cleanup removed prior viewport changes and test; continued against current repository without reintroducing them.

First full benchmark completed across three active maps with nonzero gunfire/effect counts and no browser errors. Phone cancellation check found the return path opened Controls instead of Graphics; fixed return to select Graphics. Warm-up increased to three seconds per scene to reduce initial shader/asset startup influence.

Final validation complete: 144 settings combinations; 36 actual HDR/non-HDR rendered combinations including weapon inspection; settings/mobile/controls/menu/presentation/feel/explosion/integration/audio-lifecycle tests passed. Full 20-map production package builds and all prepared maps load. Phone-sized six-scene benchmark completed at 1434×660 with 30–31 rifle rounds per measured scene and 40–185 peak effects; no browser errors. Both cancellation and completion preserved every existing local-storage entry except the new benchmark report. Graphics reset restores enabled AA and device defaults.

Publishing: merged the newer published iPhone viewport/fullscreen fix (828689f) with graphics work, preserving shared viewport measurements, display report and safe insets. Source helper initially refused outdated dirty checkout; changes preserved in a Git stash before fast-forward and explicit conflict resolution.
