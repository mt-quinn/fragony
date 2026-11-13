import * as THREE from '../vendor/three.module.js';
import {arenaKit} from './arena-kit.js';
import {industrialSurface} from '../industrial-surfaces.js';
import {MAP_ART_PROFILES} from '../map-art-profiles.js';
// Authored from site functions and encounter relationships; no imported layout/assets.
export const RAINWORKS_ART={name:'Rain enamel, fired clay & limestone',colors:['#497E92','#C87959','#DDD1AE','#C2A14C'],floor:'#71858C',ink:'#273F49',sky:['#577A95','#A9C6D2','#D9DDD0','#F3DFAD'],areas:[],lighting:{environment:.48,hemi:1.8}};
MAP_ART_PROFILES.rainworks=RAINWORKS_ART;
function createRainworks(){
 const b=arenaKit('rainworks','RAINWORKS',58,48,{wall:0xddd1ae,floor:0x71858c,deck:0xc6c6b3,steel:0x273f49,trim:0xddd1ae,accent:0xc2a14c,blue:0x497e92,warm:0xc87959,clay:0xc87959,chalk:0xddd1ae,enamel:0x497e92,brass:0xc2a14c,ink:0x273f49});
 const{shape,wall,deck,stair,pillar,health,line,spawn,mark,sign}=b;
 b.shell(10);shape('station-slab',0,0,58,48,0,1,'floor');
 // The west instrument suite is a dogleg room network, not a parallel lane.
 for(const[z,d]of[[-18,12],[-1,14],[17,14]])wall('instrument-front-'+z,-10,z,1,d,8,1,'chalk');
 wall('instrument-room-divider',-22,0,12,1,6.5,1,'enamel');
 pillar('barometer-drum',-21,-14,2.1,1,5,'enamel');
 shape('recording-bench',-25,-8,5,1.4,1,2.05,'brass');
 shape('instrument-canopy',-20,-15,19,17,9,9.5,'chalk');
 // Separate upper observatories force a descent to change control sector.
 deck('west-observatory',-22,6.75,12,17.5,5);
 deck('west-stair-landing',-23,17.5,5,6,5);
 stair('west-stair',-13,18,-1,0,1,4,3.5,.5);
 for(const[z,d]of[[1.5,7],[12.75,5.5]])wall('west-gallery-screen-'+z,-15.8,z,.65,d,2.6,5,'enamel');
 shape('west-observatory-canopy',-21,7,16,32,9.8,10.2,'chalk');
 deck('north-observatory',18,-14,20,8,5);
 stair('east-stair',24,2,0,-1,1,4,3.5,.5);
 shape('east-stair-landing',24,-8,3.5,5,4.5,5,'deck');
 for(const[x,w]of[[10,4],[19,6],[27,2]])wall('north-gallery-screen-'+x,x,-10,w,.65,2.4,5,'enamel');
 pillar('anemometer-tower',18,-14,2.05,5,10.8,'chalk');
 shape('north-observatory-canopy',19,-15,22,10,10.5,10.9,'chalk');
 // Archive has two entrances at different angles and independent exits.
 wall('archive-front-west',12,10,5,1,7.5,1,'enamel');
 wall('archive-front-east',24,10,8,1,7.5,1,'enamel');
 wall('archive-side-south',10,20,1,8,7.5,1,'chalk');
 wall('archive-side-north',10,11,1,2,7.5,1,'chalk');
 shape('archive-roof',19,17,18,14,8.5,9,'chalk');
 shape('archive-records',25,15,5,2,1,3.3,'enamel');
 // The measuring shield divides the court into changing sectors. The major
 // is at its west foot, threatened from north, west threshold and south return.
 wall('measuring-shield',3,-1,3,12,7.3,1,'clay',-.22);
 pillar('rain-gauge-mast',4,4.6,1.65,1,12.8,'clay');
 shape('mast-cap',4,4.6,3.8,3.8,12.8,13.2,'brass');
 shape('east-weather-bed',16,4,6,3,1,2.05,'enamel');
 shape('north-calibration-bench',-3,-15,7,1.8,1,2.05,'chalk');
 wall('south-wind-screen',1,14,8,1,3.2,1,'clay',.25);
 shape('archive-sampling-table',16,20,3,2,1,2,'brass');
 // Visible, substantial architecture supplies occlusion. Fine marks are flush
 // accents; none hides a doorway or adds an invisible movement obstacle.
 const detail=(id,x,z,w,d,bottom,top,kind='brass',yaw=0)=>shape(id,x,z,w,d,bottom,top,kind,yaw,false);
 for(const x of[-28.48,28.48])for(const z of[-20,-12,-4,4,12,20])detail('perimeter-pier',x,z,.11,.8,1,9.8,'chalk');
 for(const z of[-23.48,23.48]){detail('perimeter-enamel-dado',0,z,57,.04,1.05,2.25,'enamel');detail('perimeter-datum',0,z,57,.055,2.45,2.57);}
 for(const x of[-28.48,28.48]){detail('side-enamel-dado',x,0,.04,47,1.05,2.25,'enamel');detail('side-datum',x,0,.055,47,2.45,2.57);}
 // Roof ribs and clear-storey apertures make a recognizable weather station.
 for(const z of[-20,-14,-8,0,8,16])detail('west-roof-rib',-21,z,16,.18,10.15,10.48,'ink');
 for(const x of[10,16,22,28])detail('north-roof-rib',x,-15,.18,10,10.85,11.18,'ink');
 for(const x of[12,18,24])detail('archive-roof-rib',x,17,.18,14,8.95,9.28,'ink');
 // Overhead rain collectors: a sculptural silhouette, safely above play.
 detail('collector-spine',4,1,1.1,27,13.15,13.7,'ink');
 for(const z of[-8,1,10]){detail('collector-crossarm',1,z,17,.25,13.7,14.1,'ink',-.22);for(const u of[-7,7]){const c=Math.cos(-.22),s=Math.sin(-.22);detail('collector-fin',1+c*u,z-s*u,.22,3,14,15.6,'enamel',-.22);}}
 // Shield gauge ticks sit on its west face and are scaled to player height.
 for(const face of[-1,1])for(let i=0;i<14;i++){const z=-1,localX=face*1.516,localZ=i%2?-.8:-1.25,c=Math.cos(-.22),s=Math.sin(-.22);detail('shield-scale-'+i,3+c*localX+s*localZ,z-s*localX+c*localZ,.035,i%2?1.2:2.1,1.6+i*.4,1.67+i*.4,'chalk',-.22);}
 for(const [x,z,w,d,y]of[[-22,6.75,11.5,17,5.015],[18,-14,19.5,7.5,5.015]]){detail('gallery-edge-n',x,z-d/2,w,.11,y,y+.018);detail('gallery-edge-s',x,z+d/2,w,.11,y,y+.018);}
 // Flush court calibration marks lead the eye without becoming cover clutter.
 for(let i=-5;i<=5;i++){detail('court-ruler-'+i,-4.4,i*1.2,i%5===0?1.4:.55,.07,1.008,1.022,'chalk');}
 for(const[x,z,y]of[[-21,-14,5], [18,-14,10.8]]){detail('sensor-cap',x,z,1.6,1.6,y+.02,y+.3,'brass');}
 // Recovery belongs to separate ground rooms. Upper control has only small
 // fragments, so keeping height cannot supply every strategic benefit.
 health('calibration-major',-1,1,0,50);
 health('instrument-recovery',-25,1,-19,25);health('recorder-recovery',-24,1,12,25);health('archive-recovery',24,1,20,25);
 line('north-survey',-3,1,-20,1.2,0,4);line('south-survey',-6,1,21,1.2,0,4);
 line('west-readings',-24,5,3,0,1.2,3);line('north-readings',22,5,-15,1.2,0,3);
 for(const p of[[-25,1,-21],[-15,1,-16],[-25,1,-4],[-25,5,4],[-20,5,14],[-7,1,21],[25,1,21],[13,1,20],[26,1,5],[25,5,-15],[10,5,-15],[-1,1,-21]])spawn(...p);
 for(const p of[['measuring court',-1,1,0],['instrument room',-16,1,-15],['recorder room',-23,1,10],['west observatory',-22,5,8],['north observatory',12,5,-14],['archive',21,1,18],['east return',20,1,4],['south return',-3,1,20],['north return',1,1,-20]])mark(...p);
 const gaugeFace=(face,text)=>{const c=Math.cos(-.22),s=Math.sin(-.22);sign(text,3+c*face*1.53,5,-1-s*face*1.53,(face>0?Math.PI/2:-Math.PI/2)-.22,6,'brass');};gaugeFace(1,'04 / RAIN GAUGE');gaugeFace(-1,'CALIBRATION / 04');
 sign('RAINWORKS / 04',0,7.5,-23.47,0,14,'ink');
 sign('INSTRUMENTS',-10.53,4,-1,-Math.PI/2,9,'blue');
 sign('ARCHIVE / 03',24,4.4,9.47,Math.PI,7,'brass');
 sign('OBSERVATION',-28.47,7,8,Math.PI/2,9,'brass');
 const map=b.finish({position:[-8,8,18],target:[3,5,0]},'A measuring court, sheltered instrument rooms and interrupted observatories. One major. Every height has a cost.');
 // Roof-mounted collectors have their own silhouette above the solid ceilings.
 // They cannot be reached by normal movement and add no hidden body blockers.
 const append=(geometry,kind,hex)=>{const g=map.groups[kind]??={p:[],n:[],c:[]},p=geometry.attributes.position,n=geometry.attributes.normal,ix=geometry.index,c=new THREE.Color(hex);for(let i=0;i<(ix?.count||p.count);i++){const j=ix?ix.getX(i):i,ny=n.getY(j),shade=ny>.5?1:ny<-.5?.68:.91;g.p.push(p.getX(j),p.getY(j),p.getZ(j));g.n.push(n.getX(j),ny,n.getZ(j));g.c.push(c.r*shade,c.g*shade,c.b*shade);}geometry.dispose();};
 for(const z of[-20,-14,-8]){append(new THREE.BoxGeometry(19,.16,5.5).rotateX(.28).translate(-20,10.4,z),'enamel',0x497e92);append(new THREE.BoxGeometry(19,1.65,.14).translate(-20,10.3,z-2.62),'ink',0x273f49);}
 append(new THREE.RingGeometry(1.65,1.72,48).rotateX(-Math.PI/2).translate(-1,1.018,0),'brass',0xc2a14c);
 map.authored=true;map.maxHeight=5.1;map.spawnYaws=map.spawns.map(([x,y,z])=>Math.atan2(x,z));map.renderInfo={artProfile:'authored'};
 for(const kind of Object.keys(map.groups))map.materials[kind]={...industrialSurface(['enamel','blue'].includes(kind)?'coated':['brass','ink','steel'].includes(kind)?'steel':'paint'),roughness:['brass','ink'].includes(kind)?.6:.86,metalness:kind==='brass'?.35:.03};
 return map;
}
export const RAINWORKS=createRainworks();
