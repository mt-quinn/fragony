"""Loss-bounded submillimetre render packing. Native collision is unchanged."""
import base64,gzip,json,pathlib,sys
import numpy as np
for name in sys.argv[1:]:
 p=pathlib.Path(__file__).resolve().parents[1]/'dist/maps'/f'{name}-data.json.gz';before=p.stat().st_size;data=json.loads(gzip.decompress(p.read_bytes()))
 for g in data['groups'].values():
  if g.get('codec')=='source-v2':continue
  if g.get('q'):
   a=np.frombuffer(base64.b64decode(g['v']),dtype=np.dtype([('p','<i4',(3,)),('n','<i2',(3,))]));positions=a['p'];normals=a['n'].astype(np.float32)
  else:
   a=np.frombuffer(base64.b64decode(g['v']),dtype='<f4').reshape(-1,6);positions=np.rint(a[:,:3]*4096).astype('<i4');normals=a[:,3:]
  ix=np.frombuffer(base64.b64decode(g['i']),dtype='<u4');points,remap=np.unique(positions,axis=0,return_inverse=True);indices=remap[ix];used,first=np.unique(indices,return_index=True);order=used[np.argsort(first)];shuffle=np.empty(len(points),dtype='<u4');shuffle[order]=np.arange(len(order));points=points[order];indices=shuffle[indices]
  normals=normals[ix];normals/=np.maximum(np.linalg.norm(normals,axis=1),1e-12)[:,None];triples=normals.reshape(-1,3,3);flat=bool(np.all(np.max(np.abs(triples-triples[:,:1,:]),axis=(1,2))<1e-5));normals=triples[:,0,:]if flat else normals
  octa=normals/np.maximum(np.sum(np.abs(normals),axis=1),1e-12)[:,None];uv=octa[:,:2].copy();mask=octa[:,2]<0;uv[mask]=(1-np.abs(uv[mask,::-1]))*np.where(uv[mask]>=0,1,-1);packed=np.rint(uv*32767).clip(-32767,32767).astype('<i2')
  g.clear();g.update(codec='source-v2',pv=base64.b64encode(points.astype('<i4').tobytes()).decode(),ix=base64.b64encode(indices.astype('<u4').tobytes()).decode(),nv=base64.b64encode(packed.tobytes()).decode(),flat=flat)
 data['source']['renderPositionPrecisionMetres']=1/4096
 temporary=p.with_suffix(p.suffix+'.tmp');temporary.write_bytes(gzip.compress(json.dumps(data,separators=(',',':')).encode(),compresslevel=6,mtime=0));temporary.replace(p);print(name,before,'->',p.stat().st_size,flush=True)
