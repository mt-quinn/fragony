// CROSSCUT: two crossing circulation loops around three different combat spaces.
// All collision, pickups, spawns and navigation landmarks derive from this file.
const solids=[];
const box=(id,x,y,z,w,h,d,style='chalk')=>solids.push({id,x,y,z,w,h,d,style});
// Continuous boundary. The playable interior is 46 x 46 metres.
box('north',0,4,-24,49,8,1.4);box('south',0,4,24,49,8,1.4);
box('west',-24,4,0,1.4,8,48);box('east',24,4,0,1.4,8,48);
// Raised gallery: two stair approaches, two pad shortcuts, and a broad drop edge.
box('gallery',0,1.5,-17.25,44,3,11.5);
for(const x of [-19,19])for(let i=0;i<12;i++){
 const h=(i+1)*.25;box(`stair-${x}-${i}`,x,h/2,-i,5,h,1,'stair');
}
// This spine interrupts the cross-gallery sniper line. The exposed apron and
// rear passage allow opponents to cross behind it or push around either side.
box('gallery-spine',0,4.7,-18.2,3,3.4,4.6,'ink');
box('gallery-west-cover',-11,3.6,-20,4,1.2,2);
box('gallery-east-cover',11,3.6,-14,4,1.2,2);
// West hall: two broad S-turns. Portals at z=2 and z=13.5 open into the yard.
box('hall-north-partition',-10,2.5,-6,1.5,5,12);
box('hall-middle-partition',-10,2.5,7.5,1.5,5,7);
box('hall-south-partition',-10,2.5,19,1.5,5,6);
box('hall-baffle-a',-18.5,2.25,4,7,4.5,1.6,'ink');
box('hall-baffle-b',-13.5,2.25,12,7,4.5,1.6,'ink');
// Yard: tall central landmark severs diagonal sightlines; offset low cover
// supports rocket splash and jumps without allowing one position to see all exits.
box('yard-tower',3,3.1,-.5,3.6,6.2,3.6);
box('yard-west-cover',-4,.55,-4,3.2,1.1,4);
box('yard-east-cover',12,.55,5,3.2,1.1,4);
box('armor-plinth',3,.25,6,4.5,.5,4.5,'ink');
// A lower crossing route links the hall and east stair without crossing armor.
// The offset island limits a 46m end-to-end rail line and leaves a 3.7m pass.
box('cut-partition',2.5,1.4,14,15,2.8,1.4);
box('cut-island',3,1.7,21,3,3.4,2.5,'ink');
box('cut-east-cover',16,.55,20,3,1.1,2.8);
export const MAP={
 name:'CROSSCUT',bounds:23,
 solids,
 areas:[
  {name:'GALLERY',x:0,z:-17.25,w:44,d:11.5,y:3},
  {name:'HALL',x:-16.5,z:9,w:12.5,d:25,y:0},
  {name:'YARD',x:6.5,z:1,w:31,d:24,y:0},
  {name:'CUT',x:6,z:19.5,w:33,d:6,y:0}
 ],
 pads:[
  {x:-13,z:-5,landing:{x:-13,y:3,z:-15}},
  {x:11,z:-5,landing:{x:11,y:3,z:-15}}
 ],
 pickups:[
  {kind:'armor',x:3,y:.5,z:6},
  {kind:'health',x:-20,y:0,z:9},
  {kind:'health',x:18,y:3,z:-19},
  {kind:'focus',x:19,y:0,z:16.5}
 ],
 // Recessed and offset from the strongest weapons' principal lines of sight.
 spawns:[[-20,0,18],[-13,0,0],[-20,0,7],[20,0,8],[18,0,17],[-6,0,20],[-18,3,-20],[17,3,-17]],
 anchors:[[-20,0,18],[-13,0,1],[-20,0,9],[20,0,8],[19,0,17],[-5,0,20],[-18,3,-19],[18,3,-19],[-7,3,-14],[7,3,-14],[3,.5,6],[8,0,-5],[0,0,10],[-6,0,3]]
};
export const ALL_WEAPONS=['rifle','pistol','smg','rail','rocket','shotgun'];
export function randomWeaponPair(random=Math.random){
 const first=Math.floor(random()*ALL_WEAPONS.length);let second=Math.floor(random()*(ALL_WEAPONS.length-1));if(second>=first)second++;
 return [ALL_WEAPONS[first],ALL_WEAPONS[second]];
}
