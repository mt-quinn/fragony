"""Clip only render surfaces outside the validated playable footprint."""
import pathlib,json,gzip,base64,hashlib,math,sys
import numpy as np
root=pathlib.Path(__file__).resolve().parents[1];ref=root.parent/'reference-maps'
def decode(s,dtype):return np.frombuffer(base64.b64decode(s),dtype=dtype)
def normal_decode(o):
 uv=o.astype(np.float32)/32767;v=np.column_stack((uv,1-np.abs(uv).sum(axis=1)));mask=v[:,2]<0;v[mask,:2]=(1-np.abs(v[mask,1::-1]))*np.where(v[mask,:2]>=0,1,-1);return v/np.maximum(np.linalg.norm(v,axis=1),1e-20)[:,None]
def load(g):
 if g.get('codec')=='source-v2':
  ix=decode(g['ix'],'<u4');p=decode(g['pv'],'<i4').reshape(-1,3).astype(np.float32)/4096;p=p[ix];n=normal_decode(decode(g['nv'],'<i2').reshape(-1,2));return p,np.repeat(n,3,axis=0)if g['flat']else n
 ix=decode(g['i'],'<u4')
 if g.get('q'):
  a=decode(g['v'],np.dtype([('p','<i4',(3,)),('n','<i2',(3,))]));p=a['p'].astype(np.float32)/4096;n=a['n'].astype(np.float32)/32767
 else:a=decode(g['v'],'<f4').reshape(-1,6);p=a[:,:3];n=a[:,3:]
 return p[ix],n[ix]
def clip(poly,axis,limit,sign):
 out=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  da=(a[axis]-limit)*sign;db=(b[axis]-limit)*sign
  if da>=-1e-7:out.append(a)
  if da*db< -1e-14:out.append(a+(b-a)*(da/(da-db)))
 return out
def pack(p,n):
 p=np.rint(p*4096).astype('<i4');unique,inv=np.unique(p,axis=0,return_inverse=True);used,first=np.unique(inv,return_index=True);order=used[np.argsort(first)];shuffle=np.empty(len(unique),dtype='<u4');shuffle[order]=np.arange(len(order));ix=shuffle[inv];unique=unique[order]
 n=n/np.maximum(np.linalg.norm(n,axis=1),1e-20)[:,None];tri=n.reshape(-1,3,3);flat=bool(np.all(np.max(np.abs(tri-tri[:,:1,:]),axis=(1,2))<1e-5));n=tri[:,0,:]if flat else n;v=n/np.maximum(np.abs(n).sum(axis=1),1e-20)[:,None];uv=v[:,:2].copy();mask=v[:,2]<0;uv[mask]=(1-np.abs(uv[mask,::-1]))*np.where(uv[mask]>=0,1,-1);octa=np.rint(uv*32767).clip(-32767,32767).astype('<i2');enc=lambda a:base64.b64encode(a.tobytes()).decode();return dict(codec='source-v2',pv=enc(unique),ix=enc(ix.astype('<u4')),nv=enc(octa),flat=flat)
for name in sys.argv[1:]:
 p=root/'dist/maps'/f'{name}-data.json.gz';d=json.loads(gzip.decompress(p.read_bytes()));fp_path=ref/name/'playable-footprint.json';fp=json.loads(fp_path.read_text());cells={tuple(v)for v in fp['cells']};cell=fp['cellSize'];low=np.min(list(cells),axis=0);high=np.max(list(cells),axis=0);grid=np.zeros(high-low+1,dtype=np.int32)
 for x,z in cells:grid[x-low[0],z-low[1]]=1
 sums=np.pad(grid.cumsum(axis=0).cumsum(axis=1),((1,0),(1,0)));before=after=0
 for key,g in d['groups'].items():
  points,normals=load(g);tri=points.reshape(-1,3,3);nt=normals.reshape(-1,3,3);before+=len(tri)
  if not len(tri):continue
  aa=np.floor(tri[:,:,[0,2]].min(axis=1)/cell).astype(np.int32);bb=np.floor(tri[:,:,[0,2]].max(axis=1)/cell).astype(np.int32);a=(aa-low).clip(0,grid.shape);b=(bb-low+1).clip(0,grid.shape);counts=sums[b[:,0],b[:,1]]-sums[a[:,0],b[:,1]]-sums[b[:,0],a[:,1]]+sums[a[:,0],a[:,1]];total=np.prod(bb-aa+1,axis=1);inside=counts==total;edges=np.flatnonzero((counts>0)&~inside);extra=[]
  for i in edges:
   poly0=[np.r_[tri[i,j],nt[i,j]]for j in range(3)]
   for x in range(max(aa[i,0],low[0]),min(bb[i,0],high[0])+1):
    for z in range(max(aa[i,1],low[1]),min(bb[i,1],high[1])+1):
     if(x,z)not in cells:continue
     poly=poly0
     for axis,limit,sign in [(0,x*cell,1),(0,(x+1)*cell,-1),(2,z*cell,1),(2,(z+1)*cell,-1)]:
      if not poly:break
      poly=clip(poly,axis,limit,sign)
     for j in range(1,len(poly)-1):
      vs=np.array([poly[0],poly[j],poly[j+1]])
      if np.linalg.norm(np.cross(vs[1,:3]-vs[0,:3],vs[2,:3]-vs[0,:3]))>1e-10:extra.append(vs)
  pp=tri[inside].reshape(-1,3);nn=nt[inside].reshape(-1,3)
  if extra:e=np.asarray(extra,dtype=np.float32).reshape(-1,6);pp=np.concatenate((pp,e[:,:3]));nn=np.concatenate((nn,e[:,3:]))
  after+=len(pp)//3;g.clear();g.update(pack(pp,nn))
 d['source']['renderFootprint']={'cells':len(cells),'cellSize':cell,'trianglesBefore':before,'trianglesAfter':after};d['source']['inputs'][str(fp_path.relative_to(ref))]=hashlib.sha256(fp_path.read_bytes()).hexdigest();d['source']['renderPositionPrecisionMetres']=1/4096;tmp=p.with_suffix('.gz.tmp');tmp.write_bytes(gzip.compress(json.dumps(d,separators=(',',':')).encode(),compresslevel=6,mtime=0));tmp.replace(p);print(name,before,'->',after,flush=True)
