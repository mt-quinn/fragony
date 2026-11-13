import {fromDisplay} from './balance.js';
// Health economy shared by player, bot decisions, rendering and pickup tests.
export const OVERHEALTH_CAP=150;
export function healthAfterPickup(hp,max,p,base=100){
 if(p.kind!=='health')return hp;
 const cap=max*([5,50].includes(p.amount)?1.5:1);
 return hp>=cap?hp:Math.min(cap,hp+fromDisplay(p.amount,base));
}
export function healthPickup(id,x,y,z,amount=25){return{id,kind:'health',x,y,z,amount,overhealth:amount===5||amount===50,respawn:amount===50?30:15}}
