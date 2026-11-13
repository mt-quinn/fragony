import * as T from './vendor/three.module.js';
// One hierarchy and one current-camera decision shared by every material batch.
// Hidden regions clear contiguous flag ranges instead of testing every material
// fragment independently. A shadow camera gets its own immediate decision.
export class ClusterVisibility{
 constructor(records,occlusion){this.records=records.slice();this.occlusion=occlusion;this.clip=new T.Matrix4();this.frustum=new T.Frustum();this.signature=new Float64Array(32).fill(NaN);this.camera=null;this.flags=new Uint8Array(records.length);this.stack=[];this.tests=0;this.version=0;this.height=0;
  const build=(start,end)=>{const box=new T.Box3();for(let i=start;i<end;i++)box.union(this.records[i].box);const node={box,start,end};if(end-start>8){const extent=box.getSize(new T.Vector3()),axis=extent.x>=extent.y&&extent.x>=extent.z?'x':extent.y>=extent.z?'y':'z',part=this.records.slice(start,end).sort((a,b)=>(a.box.min[axis]+a.box.max[axis])-(b.box.min[axis]+b.box.max[axis]));for(let i=0;i<part.length;i++)this.records[start+i]=part[i];const middle=(start+end)>>1;node.left=build(start,middle);node.right=build(middle,end);}return node;};this.root=build(0,records.length);for(let i=0;i<this.records.length;i++)this.records[i].visibilityId=i;
 }
 prepare(camera,height=0){const p=camera.projectionMatrix.elements,v=camera.matrixWorldInverse.elements;let changed=this.camera!==camera||this.height!==height;for(let i=0;i<16;i++){if(this.signature[i]!==p[i]||this.signature[16+i]!==v[i])changed=true;this.signature[i]=p[i];this.signature[16+i]=v[i];}if(!changed)return;this.camera=camera;this.height=height;this.version++;this.clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.clip,camera.coordinateSystem,camera.reversedDepth);const occlude=this.occlusion?.prepare(camera);this.flags.fill(1);this.stack.length=0;this.stack.push(this.root);this.tests=0;
  while(this.stack.length){const node=this.stack.pop();this.tests++;if(!this.frustum.intersectsBox(node.box)||occlude&&!this.occlusion.visible(node.box,camera)){this.flags.fill(0,node.start,node.end);continue;}if(node.left){this.stack.push(node.left,node.right);continue;}// A surviving leaf conservatively reveals its entire small group. Testing
   // every material fragment again costs more than the extra GPU work saved.
   }

 }
}
