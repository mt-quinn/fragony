"""Merge only connected coplanar faces whose union is exactly convex.

The boundary uses existing source vertices. Area equality prevents filling a
hole, notch, gap or concave edge. Nonplanar and nonconvex pieces stay unchanged.
"""
import collections,math
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def merge_faces(triangles):
 groups=collections.defaultdict(list)
 for tri in triangles:
  normal=cross(sub(tri[1],tri[0]),sub(tri[2],tri[0]));length=math.sqrt(dot(normal,normal))
  if length<1e-10:continue
  normal=tuple(v/length for v in normal)
  if next(v for v in normal if abs(v)>1e-6)<0:normal=tuple(-v for v in normal)
  groups[tuple(round(v,4)for v in normal)+(round(dot(normal,tri[0]),3),)].append(tri)
 out=[]
 for plane,tris in groups.items():
  if len(tris)<2:out.extend(tris);continue
  parents=list(range(len(tris)));edges={}
  def root(i):
   while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
   return i
  for i,t in enumerate(tris):
   keys=[tuple(round(v,3)for v in p)for p in t]
   for a,b in zip(keys,keys[1:]+keys[:1]):
    k=tuple(sorted([a,b]))
    if k in edges:parents[root(i)]=root(edges[k])
    else:edges[k]=i
  components=collections.defaultdict(list)
  for i,t in enumerate(tris):components[root(i)].append(t)
  axis=max(range(3),key=lambda i:abs(plane[i]));axes=[i for i in range(3)if i!=axis]
  def turn(a,b,c):return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
  for component in components.values():
   points={tuple(p[j]for j in axes):p for t in component for p in t};keys=sorted(points)
   if len(keys)<4:out.extend(component);continue
   lower=[];upper=[]
   for k in keys:
    while len(lower)>1 and turn(lower[-2],lower[-1],k)<=1e-8:lower.pop()
    lower.append(k)
   for k in reversed(keys):
    while len(upper)>1 and turn(upper[-2],upper[-1],k)<=1e-8:upper.pop()
    upper.append(k)
   hull=lower[:-1]+upper[:-1];area=abs(sum(a[0]*b[1]-a[1]*b[0]for a,b in zip(hull,hull[1:]+hull[:1])))/2
   original=sum(abs(turn(*[tuple(p[j]for j in axes)for p in t]))/2 for t in component)
   if abs(area-original)<=max(1e-5,original*1e-6):out.append([points[k]for k in hull])
   else:out.extend(component)
 return out
