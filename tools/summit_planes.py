"""Recover signed clip-plane distances using the native brush bounds.

The Summit clipmap dump stores unsigned distances for some negative planes.
A real brush side intersects its own source bounds; do not infer signs from
world position or discard player clips. Shared by import and archive repair.
"""
def signed_distance(side, bounds):
    normal = side['normal']
    center = list(bounds['midPoint'].values())
    half = list(bounds['halfSize'].values())
    middle = sum(n * c for n, c in zip(normal, center))
    radius = sum(abs(n) * h for n, h in zip(normal, half))
    distance = side['dist']
    inside = lambda d: middle - radius - .1 <= d <= middle + radius + .1
    return -distance if not inside(distance) and inside(-distance) else distance
