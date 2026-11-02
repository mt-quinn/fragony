// Shared player, bot and navigation geometry. Feet are measured from world Y=0.
export function inBlock(b,x,z,margin=0){const dx=x-b.x,dz=z-b.z,a=b.yaw||0,c=Math.cos(a),s=Math.sin(a);return Math.abs(c*dx-s*dz)<b.w/2+margin&&Math.abs(s*dx+c*dz)<b.d/2+margin}
export function blockedAt(blocks,x,z,feet,r=.4,height=1.7){return blocks.some(b=>b.top>feet+.32&&b.bottom<feet+height&&inBlock(b,x,z,r))}
export function surfaceAt(blocks,x,z,feet){let h=0;for(const b of blocks)if(b.top<=feet+.3&&b.top>h&&inBlock(b,x,z,.24))h=b.top;return h}
export function ceilingAt(blocks,x,z,oldFeet,newFeet,height=1.7){if(newFeet<=oldFeet)return null;let result=Infinity;for(const b of blocks)if(b.bottom>=oldFeet+height-.01&&b.bottom<newFeet+height&&inBlock(b,x,z,.32))result=Math.min(result,b.bottom-height);return Number.isFinite(result)?result:null}
export function launchTime(speed,rise){return(speed+Math.sqrt(Math.max(0,speed*speed-46*rise)))/23}
