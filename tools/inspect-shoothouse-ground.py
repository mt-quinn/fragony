import pathlib,json,functools,sys,numpy as np
base=pathlib.Path(__file__).resolve().parents[2]/'reference-maps/batch-audit/shoothouse/scene';scene=json.loads((base/'scene.json').read_text());x,z,y=map(float,sys.argv[1:4])
@functools.lru_cache(32)
def mesh(key):
 m=scene['meshes'][key];v=np.frombuffer((base/(m['file']+'.vertices')).read_bytes(),dtype='<f4').reshape(-1,6)[:,:3];i=np.frombuffer((base/(m['file']+'.indices')).read_bytes(),dtype='<u4').reshape(-1,3);used=np.unique(i);return v[used],np.searchsorted(used,i)
results=[]
for r in scene['colliders']:
 if not r.get('mesh'):continue
 p,ix=mesh(r['mesh']);m=np.asarray(r['matrix']).copy();m[:,3]+=[65,-245,300];w=p@m[:,:3].T+m[:,3];lo=w.min(axis=0);hi=w.max(axis=0)
 if not(lo[0]<=x<=hi[0]and lo[2]<=z<=hi[2]and lo[1]<y+.3):continue
 t=w[ix];mask=np.all(t[:,:, [0,2]].min(axis=1)<=[x,z],axis=1)&np.all(t[:,:,[0,2]].max(axis=1)>=[x,z],axis=1);t=t[mask]
 if not len(t):continue
 a=t[:,0,:];u=t[:,1,:]-a;v=t[:,2,:]-a;det=u[:,0]*v[:,2]-u[:,2]*v[:,0];good=np.abs(det)>1e-12;t=t[good];a=a[good];u=u[good];v=v[good];det=det[good]
 s=((x-a[:,0])*v[:,2]-(z-a[:,2])*v[:,0])/det;h=(u[:,0]*(z-a[:,2])-u[:,2]*(x-a[:,0]))/det;yy=a[:,1]+s*u[:,1]+h*v[:,1];ok=(s>=-1e-6)&(h>=-1e-6)&(s+h<=1+1e-6)&(yy<=y+.3)
 if np.any(ok):results.append((float(yy[ok].max()),r['object'],(hi-lo).tolist()))
print(sorted(results,reverse=True)[:15])
