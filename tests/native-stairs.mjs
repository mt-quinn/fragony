import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MAPS} from '../dist/map.js';
import {canOccupy,moveCharacter} from '../dist/collision.js';
import {blockSpan} from '../dist/geometry.js';
const routes=JSON.parse(fs.readFileSync(new URL('./fixtures/native-stairs.json',import.meta.url)));
let walks=0;
for(const map of MAPS){
 const cases=routes.filter(r=>r.map===map.id);if(!cases.length)continue;
 if(map.load)await map.load();
 if(map.id==='summit'){
  const ramp=map.brushes.find(b=>b.id==='summit-native-brush-5033');
  assert.ok(blockSpan(ramp,4.4375,-9.28125,.4).top<8,'Summit native stair slope is not flattened into its 11.25m bounding box');
 }
 for(const route of cases)for(const fps of [30,60,144])for(const [a,b]of[[route.start,route.end],[route.end,route.start]]){
  let p={x:a[0],feet:a[1],z:a[2],radius:.4,height:1.9},grounded=true,vy=0,reached=false;
  assert.ok(canOccupy(map.brushes,p),map.id+' source stair entry');
  const limit=fps*(Math.hypot(b[0]-a[0],b[2]-a[2])/3+3);
  for(let frame=0;frame<limit;frame++){
   const dx=b[0]-p.x,dz=b[2]-p.z,d=Math.hypot(dx,dz);
   if(d<.06&&Math.abs(p.feet-b[1])<.12){reached=true;break;}
   // Gravity and walking only. No jump, auto-jump, teleport or recovery input.
   vy-=23/fps;p=moveCharacter(map.brushes,p,{x:dx/Math.max(d,.001)*Math.min(d,3/fps),z:dz/Math.max(d,.001)*Math.min(d,3/fps),y:vy/fps},{grounded,bounds:map.bounds,stepHeight:map.stepHeight});
   grounded=p.grounded;if(grounded||p.ceiling)vy=0;
   assert.ok(canOccupy(map.brushes,p),map.id+' stair body stays outside solids');
   assert.ok(p.recovery<.025,map.id+' walks stairs without overlap recovery');
  }
  assert.ok(reached,map.id+' no-jump stair route at '+fps+'Hz: '+JSON.stringify(route));walks++;
 }
 map.unload?.();
}
console.log(`${routes.length} native stair routes: ${walks} complete no-jump walks up/down at 30/60/144Hz pass.`);
