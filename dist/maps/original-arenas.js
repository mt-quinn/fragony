import {arenaKit} from './arena-kit.js';

function tidalLock(){
 const b=arenaKit('tidal-lock','TIDAL LOCK',64,56,{wall:0xc0c8bc,floor:0x829e96,deck:0xa3b8ab,blue:0x5797a5,warm:0xc9956d});const{shape,wall,deck,stair,ramp,pillar,windowWall,health,line,spawn,mark,sign,floor}=b;b.shell(13);
 floor('basin-bed',0,0,63,55,1);for(const side of [-1,1]){const S=v=>v*side,tag=side<0?'west':'east';floor(tag+'-outer-bank',S(23),0,18,55,4);floor(tag+'-inner-north',S(10),S(-10.25),8,34.5,4);floor(tag+'-inner-south',S(10),S(19.25),8,16.5,4);ramp(tag+'-channel-exit',S(5),S(9),S(1),0,1,3,8,4);floor(tag+'-water-landing',S(13.75),S(9),1.5,4,4);}floor('north-bank',0,-25,12,6,4);floor('south-bank',0,25,12,6,4);
 b.water.push({x:0,z:0,w:12,d:38,bottom:1,top:3.3});
 stair('south-water-steps',0,15,0,1,1,3,5);stair('north-water-steps',0,-15,0,-1,1,3,5);
 // A diagonal low bridge, two high transfers, and the submerged channel are distinct crossings.
 shape('diagonal-lock-bridge',0,0,27,4.6,3.45,4,'deck',-.3);shape('major-island',0,0,7,7,1,4,'steel');
 for(const side of [-1,1]){const S=v=>v*side,tag=side<0?'azure':'ochre';
  for(const[z,d,h]of[[-23.5,8,8],[-17,5,3.5],[-5,3,8],[5,3,8],[17,5,3.5],[23.5,8,8]])wall(tag+'-front-'+z,S(14),S(z),1.2,d,h,4);
  // A window reveals the other room's circulation, but does not create another doorway.
  windowWall(tag+'-observation-window',S(14),0,1.2,6,4,8,1.1,2.7,'z');
  deck(tag+'-gallery',S(26),S(-3),6,31,8);deck(tag+'-north-return',S(17),S(-17),24,6,8);
  deck(tag+'-transfer',0,S(-17),12,4,8);deck(tag+'-arrival',S(-10),S(-17),12,6,8);
  stair(tag+'-stairs',S(12),S(-13),S(1),0,4,4,4); // lands at X=21.75, then gallery
  deck(tag+'-stair-landing',S(22.75),S(-13),1.5,4,8);
  b.elevators.push({id:tag+'-lift',x:S(26),z:S(14),w:3,d:3,low:4,high:8,entry:{x:S(26),z:S(11.7)}});
  // Lower plant masses interrupt side-to-side aim and give each threshold a reveal.
  pillar(tag+'-pump',S(22),S(1),2.3,4,10,'steel');wall(tag+'-pump-wing',S(23),S(4),6,1.4,3.4,4,'blue',.25);
  shape(tag+'-low-baffle',S(10),S(14),3.5,1.3,4,5.05,'steel');pillar(tag+'-bridge-pier',S(4),S(-17),.75,1,7.5);
  wall(tag+'-recovery-screen',S(27),S(-22),6,1,3.5,4,'steel');
  health(tag+'-recovery',S(27),4,S(-25),25);health(tag+'-gallery-health',S(26),8,S(5),25);
  line(tag+'-gallery-trail',S(23),8,S(-17),S(-1.2),0);line(tag+'-water-trail',S(4),1,S(-11),0,S(1.2));
  spawn(S(27),4,S(20));spawn(S(20),4,S(-24));spawn(S(21),4,S(-8));spawn(S(27),8,S(-11));spawn(S(10),8,S(17));spawn(S(3),1,S(11));
  mark(tag+' plant',S(23),4,S(10));mark(tag+' gallery',S(26),8,S(-10));mark(tag+' arrival',S(-10),8,S(-17));mark(tag+' water exit',S(13.25),4,S(9));
  sign(tag==='azure'?'AZURE / 01':'OCHRE / 02',S(31.45),9,S(1),side<0?Math.PI/2:-Math.PI/2,9,tag==='azure'?'blue':'warm');
  shape(tag+'-canopy',S(23),0,17,53,13,13.5,'steel');for(const z of [-21,-10,1,12,23]){shape(tag+'-canopy-rib',S(23),S(z),16,.22,12.6,13,'trim');shape(tag+'-canopy-light',S(26),S(z),4,.35,12.54,12.61,'accent');}shape(tag+'-header',S(27),S(-26.8),7,.12,10.5,11.1,tag==='azure'?'blue':'warm');
 }
 health('lock-major',0,4,0,50);health('north-water-health',0,1,-10,25);health('south-water-health',0,1,10,25);
 mark('lock crossing',0,4,0);mark('lower channel',0,1,8);mark('north steps',0,4,-24);mark('south steps',0,4,24);
 // Edge curbs leave purposeful breaks for drops into water; no invisible rail collision.
 // Open water edges permit deliberate drops; broad ramps give reliable return access.
 for(const z of [-18,18]){shape('suspended-truss',0,z,54,.35,13,13.4,'steel');for(const x of [-24,-12,12,24])shape('truss-hanger',x,z,.12,.12,11.5,13,'steel')}
 b.lights.push({x:-22,y:11,z:0,color:0xb5dce1,intensity:85,distance:32},{x:22,y:11,z:0,color:0xffd6a5,intensity:85,distance:32});
 return b.finish({position:[37,30,35],target:[0,5,0]},'Opposing pump houses. Diagonal lock crossing, upper transfers and a submerged return.');
}
function parallax(){
 const b=arenaKit('parallax','PARALLAX',60,48,{wall:0xb7c3c2,floor:0x819598,deck:0xb2beb1,steel:0x354652,blue:0x659daf,warm:0xc68b73});const{shape,wall,deck,stair,ramp,pillar,windowWall,health,line,spawn,mark,sign,floor}=b;b.shell(13);floor('foundation',0,0,59,47);
 // Paired two-storey territories open onto a three-way core; the towers are local, not omniscient.
 for(const side of [-1,1]){const S=v=>v*side,tag=side<0?'ion':'arc';
  for(const z of [-18,18])wall(tag+'-partition-'+z,S(12),z,1.3,10,10);
  windowWall(tag+'-core-window',S(12),0,1.3,6,1,10,1.2,2.3,'z');
  for(const z of [-8,8])shape(tag+'-portal-lintel',S(12),z,1.3,10,8,11,'steel');
  deck(tag+'-gallery',S(25),S(-7),8,26,5);deck(tag+'-approach',S(17),S(-8),22,5,5);deck(tag+'-arrival',S(-6),S(-8),10,6,5);
  stair(tag+'-stair',S(26),S(16),0,S(-1),1,4,4);
  deck(tag+'-tower',S(25),S(-13),8,16,9);b.elevators.push({id:tag+'-tower-lift',x:S(25),z:S(-3.5),w:3,d:3,low:5,high:9,entry:{x:S(25),z:S(-6)}});
  wall(tag+'-tower-blind',S(21.4),S(-14),.8,10,3.6,9,'steel');windowWall(tag+'-tower-slit',S(21.4),S(-7),.8,4,9,3.6,1.1,1.8,'z');
  // Each pad enters the far half of the core. Drop returns face the other territory.
  b.pads.push({id:tag+'-transfer-pad',x:S(19),y:1,z:S(8),power:16.5,landing:{x:S(-6),y:5,z:S(-8)}});
  wall(tag+'-lower-core',S(23),0,4,4,3.4,1,'steel');shape(tag+'-knee-cover',S(18),S(-14),4,1.2,1,2.05,'blue');
  pillar(tag+'-center-pier',S(5),S(3),1.4,1,11);wall(tag+'-recovery-baffle',S(22),S(18),7,1.1,3.4,1,'steel');
  health(tag+'-low-recovery',S(26),1,S(20),25);health(tag+'-tower-recovery',S(25),9,S(-15),25);health(tag+'-arrival-recovery',S(-8),5,S(-8),25);
  line(tag+'-approach-trail',S(21),5,S(-8),S(-1.2),0);line(tag+'-lower-trail',S(17),1,S(8),0,S(1.2));line(tag+'-tower-trail',S(23),9,S(-18),S(1.2),0,4);
  spawn(S(26),1,S(19));spawn(S(18),1,S(-17));spawn(S(20),1,S(2));spawn(S(26),5,S(-16));spawn(S(25),9,S(-17));spawn(S(-6),5,S(-8));
  mark(tag+' lower',S(20),1,S(10));mark(tag+' gallery',S(25),5,S(-12));mark(tag+' tower',S(25),9,S(-14));mark(tag+' arrival',S(-6),5,S(-8));mark(tag+' pad',S(19),1,S(8));
  sign(tag.toUpperCase(),S(29.44),6,0,side<0?Math.PI/2:-Math.PI/2,7,side<0?'blue':'warm');
  shape(tag+'-roof',S(22),0,16,46,13.4,14,'steel');for(const z of [-19,-8,8,19])shape(tag+'-roof-light',S(25),z,4,.4,13.25,13.35,'accent');shape(tag+'-energy-duct',S(24),S(21.8),10,.5,11.5,12.1,side<0?'blue':'warm');
 }
 deck('core-spine',0,0,5,22,5);health('core-major',0,1,0,50);mark('lower nexus',0,1,0);mark('upper nexus',0,5,0);
 // The underpass has 3.5m clear height, with four approaches and breaks from high fire.
 for(const z of [-17,17]){wall('core-reveal-'+z,0,z,7,1.4,3.5);shape('core-light-'+z,0,z-Math.sign(z)*.71,4,.025,3.5,3.6,'accent')}
 b.lights.push({x:-22,y:11,z:0,color:0xb1d9ed,intensity:85,distance:28},{x:22,y:11,z:0,color:0xf4bfa9,intensity:85,distance:28});
 return b.finish({position:[34,25,32],target:[0,4,0]},'Paired towers. Cross-core launches, elevated arrivals and independent lower returns.');
}
function foundry(){
 const b=arenaKit('foundry','FOUNDRY',62,50,{wall:0xc9c0a7,floor:0x89968b,deck:0xadbba5,steel:0x454e47,blue:0x6d9d96,warm:0xb98255});const{shape,wall,deck,stair,ramp,pillar,windowWall,health,line,spawn,mark,sign,floor}=b;b.shell(13);floor('foundation',0,0,61,49);
 // Forge, press and dispatch each have a different room-scale obstruction and reveal.
 for(const[z,d]of[[-24,1],[-18,1],[-6.3,1.4],[.3,1.4],[18,13]])wall('forge-partition-'+z,-10,z,1.4,d,9);
 for(const[z,d]of[[-23,3],[-17,3],[3,7],[20,9]])wall('press-partition-'+z,11,z,1.4,d,9);
 windowWall('forge-shot-window',-10,-3,1.5,5,1,9,1.15,2.6,'z');
 // Remove the solid middle infill beneath that window, retaining its frame elsewhere.
 deck('forge-gallery',-25,-9,7,28,5);deck('central-gantry',0,-6,50,5,5);deck('press-gallery',25,-7,7,22,5);deck('north-service',-11,-21,32,6,5);
 stair('forge-stair',-25,14,0,-1,1,4,4);stair('press-stair',25,13,0,-1,1,4,4);
 deck('control-room',21,-20,16,8,9);stair('control-stair',3,-21,1,0,5,4,4);
 // Narrow control view points into Press; its blind wall blocks the central major.
 wall('control-west-blind-n',13.3,-23.3,.6,1.4,3.6,9,'steel');wall('control-west-blind-s',13.3,-17.7,.6,3.6,3.6,9,'steel');windowWall('control-front-window',18,-16.2,9,.6,9,3.8,1.1,2,'x');
 b.elevators.push({id:'dispatch-lift',x:29,z:8,w:3,d:3,low:1,high:5,entry:{x:29,z:5.7}});deck('dispatch-lift-landing',29,4.7,3,3.6,5);
 pillar('forge-chimney',-22,-3,2.6,1,12,'steel');shape('forge-machine-wing',-18,2,5,2.5,1,5.4,'warm',-.3);shape('forge-low-workbench',-18,9,5,1.6,1,2.1,'steel');
 pillar('north-heat-exchanger',0,-13,2.2,1,12,'steel');pillar('gantry-pier',-5,-6,1.2,1,11);pillar('press-cylinder',22,-6,2.1,1,12,'steel');wall('press-reveal',19,5,1.5,7,3.2,1,'warm',.3);
 wall('dispatch-west-screen',-16,19,1.3,7,3.4,1,'steel',-.35);wall('dispatch-east-screen',14,17,1.3,7,3.4,1,'steel',.35);shape('dispatch-low-console',0,19,6,1.4,1,2.05,'blue');
 deck('press-launch-dock',18,-12,4,4,5);deck('press-launch-neck',21.25,-12,2.5,2,5);wall('press-launch-west',15.8,-12,.4,4.4,5,5,'steel');wall('press-launch-south',18,-9.8,4.4,.4,5,5,'steel');shape('press-launch-north-sill',18,-14,4,.3,5,6.1,'steel');b.pads.push({id:'press-control-launch',x:18,y:5,z:-12,power:16.5,landing:{x:28,y:9,z:-20}});
 b.pads.push({id:'dispatch-launch',x:0,y:1,z:12,power:16.5,landing:{x:4,y:5,z:-6}});
 health('gantry-major',3,5,-6,50);health('forge-health',-29,1,0,25);health('press-health',27,1,-14,25);health('dispatch-health',-24,1,21,25);health('control-health',25,9,-21,25);
 line('forge-upper-trail',-25,5,-14,0,1.2);line('press-upper-trail',25,5,-2,0,1.2);line('dispatch-trail',-4,1,21,1.2,0);line('north-service-trail',-17,5,-21,1.2,0);line('control-trail',22,9,-22,1.2,0,4);
 for(const p of [[-29,1,13],[-17,1,-13],[-25,5,-15],[-26,1,22],[-4,1,21],[24,1,20],[25,1,0],[26,1,-17],[25,5,-14],[25,9,-22],[-6,5,-21],[5,1,-13]])spawn(...p);
 for(const p of [['forge floor',-18,1,6],['forge gallery',-25,5,-12],['press floor',28,1,10],['press gallery',25,5,0],['dispatch',0,1,16],['central gantry',3,5,-6],['north service',-6,5,-21],['control',23,9,-21]])mark(...p);
 sign('FORGE / 01',-30.44,7,-3,Math.PI/2,10,'warm');sign('PRESS / 02',30.44,8,-6,-Math.PI/2,10,'blue');sign('DISPATCH',0,6,24.44,Math.PI,12);sign('CONTROL',21,11.8,-16.55,0,7);
 shape('forge-canopy',-22,-6,16,31,13.2,13.7,'steel');shape('press-canopy',22,-7,16,31,13.2,13.7,'steel');shape('control-roof',0,-21,60,7,13.8,14.3,'steel');
 for(const x of [-23,0,23]){shape('roof-truss',x,0,.5,47,13,13.5,'steel');for(const z of [-19,-6,15])shape('roof-lamp',x,z,4,.5,12.35,12.48,'accent')}
 b.lights.push({x:-21,y:10,z:0,color:0xffd1a2,intensity:100,distance:28},{x:22,y:11,z:-5,color:0xb9e0d1,intensity:85,distance:28},{x:0,y:10,z:17,color:0xf0e2ba,intensity:55,distance:24});
 return b.finish({position:[35,28,32],target:[0,4,-4]},'An asymmetric forge, press hall and dispatch loop, interlocked by gantries and a high control room.');
}
export const ORIGINAL_ARENAS=[tidalLock(),parallax(),foundry()];
