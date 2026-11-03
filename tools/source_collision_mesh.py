"""Instanced native triangle collision with an offline-built per-model BVH."""
import base64
import numpy as np
def encode(a):return base64.b64encode(a.tobytes()).decode()
def prototype(positions,triangles):
 p=np.asarray(positions,dtype='<f4').reshape(-1,3);ix=np.asarray(triangles,dtype='<u4').reshape(-1,3);used=np.unique(ix);p=p[used];ix=np.searchsorted(used,ix).astype('<u4');tris=p[ix];lo=tris.min(axis=1);hi=tris.max(axis=1);centers=(lo+hi)/2;bounds=[];links=[];order=[]
 def node(ids):
  i=len(bounds);low=lo[ids].min(axis=0);high=hi[ids].max(axis=0);bounds.append([*low,*high]);links.append(None)
  if len(ids)<=12:links[i]=[-len(order)-1,len(ids)];order.extend(ids.tolist());return i
  axis=int(np.argmax(np.ptp(centers[ids],axis=0)));ids=ids[np.argsort(centers[ids,axis],kind='stable')];mid=len(ids)//2;left=node(ids[:mid]);right=node(ids[mid:]);links[i]=[left,right];return i
 if len(ix):node(np.arange(len(ix)))
 return {'p':encode(p),'i':encode(ix[np.asarray(order,dtype=np.int64)]),'b':encode(np.asarray(bounds,dtype='<f4')),'l':encode(np.asarray(links,dtype='<i4'))}
def instance(proto,positions,matrix,name):
 p=np.asarray(positions);m=np.asarray(matrix);lo=p.min(axis=0);hi=p.max(axis=0);worldlo=m[:,3]+np.sum(np.minimum(m[:,:3]*lo,m[:,:3]*hi),axis=1);worldhi=m[:,3]+np.sum(np.maximum(m[:,:3]*lo,m[:,:3]*hi),axis=1);inv=np.linalg.inv(m[:,:3]);inverse=np.column_stack((inv,-inv@m[:,3]))
 return {'proto':proto,'matrix':m.tolist(),'inverse':inverse.tolist(),'bounds':[*worldlo.tolist(),*worldhi.tolist()],'name':name}
