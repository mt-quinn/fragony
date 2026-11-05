# Pixel Forge foreground cutoff — 2026-11-05

The phone recording showed grain disappearing across a sharp boundary on Vacant's floor. The earlier change softened the distant footprint attenuation, but did not address this foreground defect.

The triplanar axis weights used the unnormalized cross product of screen derivatives, raised it to the fourth power, and divided by a clamped sum. Nearby surfaces have small derivatives; their fourth powers fell below the epsilon. The weights therefore collapsed toward zero, and the later subtraction of0.5 produced a constant dark offset instead of grain. This created the flat foreground patch and made its boundary depend on camera height and render resolution.

The fix removes derivative magnitude before sharpening the axis weights. Grain weights now depend on surface direction rather than apparent pixel area. Noise is centered before weighting, so a degenerate surface cannot acquire the old negative bias. The soft distant antialiasing taper, world anchoring, grain scale, map palette, edges, clean actors and water remain unchanged. No rendering pass or texture fetch is added.

## Evidence

- [Before: sharp flat foreground](vacant-before.png)
- [After: texture continues toward the camera](vacant-after.png)

These are engine captures from Vacant at a1398×645 render buffer with a downward view matching the reported condition, not copies of the user's recording.

`research/pixel-forge-grain/` isolates the actual production grain helper on a flat floor. WebKit samples at three camera heights and two render widths confirmed the defect and fix. At a1.7m camera height and1398px width, the nearest row's grain standard deviation was0 before and0.276 after, with mean restored from0 to0.459 in the diagnostic's0–1 output. Other camera heights/resolutions retained approximately0.27–0.31 foreground standard deviation after the fix. Raw results are in `measurements.json`.

Pixel Forge/presentation/water/Shoot House regressions and all144 AA combinations passed. Native WebKit diagnostic and map rendering completed with zero browser/GL errors. The production release build passed. Historical fixtures remain immutable; the comparison contract admits only the previously approved palette/fade changes and this normalization/centering correction.
