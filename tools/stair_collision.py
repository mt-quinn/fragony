"""Subtract explicitly reviewed stair clearance volumes from source solids.

Convex fragments preserve every original plane outside the standing corridor;
this never drops an entire terrain/building brush to open one staircase.
"""
import itertools, math

def dot(a,b): return sum(x*y for x,y in zip(a,b))
def cross(a,b): return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def fragment(brush, planes, suffix):
    points=[]
    for a,b,c in itertools.combinations(planes,3):
        bc=cross(b[:3],c[:3]); det=dot(a[:3],bc)
        if abs(det)<1e-8: continue
        ca=cross(c[:3],a[:3]); ab=cross(a[:3],b[:3])
        p=[(a[3]*bc[k]+b[3]*ca[k]+c[3]*ab[k])/det for k in range(3)]
        if all(dot(n[:3],p)<=n[3]+1e-5 for n in planes): points.append(p)
    if not points: return None
    lo=[min(p[k] for p in points) for k in range(3)]; hi=[max(p[k] for p in points) for k in range(3)]
    if min(b-a for a,b in zip(lo,hi))<1e-5: return None
    return {**brush,'id':brush['id']+suffix,'planes':planes,'x':(lo[0]+hi[0])/2,'z':(lo[2]+hi[2])/2,'w':hi[0]-lo[0],'d':hi[2]-lo[2],'bottom':lo[1],'top':hi[1]}

def clear_stairs(brushes, clearances):
    for clearance in clearances:
        x,z=clearance['x'],clearance['z']; c,s=math.cos(clearance['yaw']),math.sin(clearance['yaw'])
        corridor=[[c,0,-s, c*x-s*z+clearance['w']/2],[-c,0,s,-c*x+s*z+clearance['w']/2],[s,0,c,s*x+c*z+clearance['d']/2],[-s,0,-c,-s*x-c*z+clearance['d']/2],[0,-1,0,-clearance['bottom']],[0,1,0,clearance['top']]]
        out=[]
        for brush in brushes:
            if brush['id'] not in clearance['blockers']: out.append(brush);continue
            remaining=[list(p) for p in brush['planes']]
            for i,plane in enumerate(corridor):
                piece=fragment(brush,remaining+[[-v for v in plane]],'-stair-outside-'+str(i))
                if piece: out.append(piece)
                remaining.append(plane)
        brushes=out
    return brushes
