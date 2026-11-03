# Shipment traversal

Stock Shipment replaces the previous expanded Shipment2 import. The former four-pad / stacked-container design and coordinates do not apply to this map. No artificial launch routes are added to the stock arena.

The eight source DM starts, open cargo passages, intersecting lanes and perimeter returns are retained. Source terrain and convex brush collision drive player movement and bot navigation. Offline drop edges require real controller clearance and landing support. `tests/radiant-maps.mjs` checks source starts, supported pickups, all 64 directed start pairs and the matching navigation cache.
