import * as THREE from '../../dist/vendor/three.module.js';
import {MeshBVH,CENTER} from '../../dist/vendor/three-mesh-bvh.module.js';
import {readSourceData} from '../../dist/maps/source-data.js';
// Source semantic families distinguish rock/foliage from similarly shaped
// construction. Query the exact original surfaces, including legacy cut pieces.
export async function naturalSurfaces(id){
 const source=await readSourceData(new URL('../../dist/maps/'+id+'-data.json.gz',import.meta.url)),positions=[];
 for(const [kind,g] of Object.entries(source.groups))if(/^(landscape|snow)$|prop_.*(?:rock_|foliage|tree|bush)/.test(kind))for(const v of g.p)positions.push(v);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 const tree=new MeshBVH(geometry,{strategy:CENTER,indirect:true,verbose:false}),point=new THREE.Vector3(),hit={};
 return {at(x,y,z){point.set(x,y,z);return !!tree.closestPointToPoint(point,hit,0,.001);},dispose(){geometry.dispose();}};
}
