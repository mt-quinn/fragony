import specs from './source-arena-specs.js';
import {readSourceData} from './source-data.js';
import {readSourceRender} from './source-render.js';
import {healthPickup} from '../pickups.js';
// Only the current arena's geometry is read. Descriptors keep the full roster
// available to practice, saved games and the map bag without decoding it all.
export const SOURCE_ARENAS=specs.map(spec=>{
 const entry={...spec,spawns:spec.starts.map(s=>s.position),pickups:spec.resources.map(p=>healthPickup(spec.id+'-'+p.id,p.x,p.y,p.z,p.amount)),ready:false};let pending=null;
 entry.load=({raw=false,navigation=true,onProgress}={})=>pending||(pending=(async()=>{
  const progress={physics:0,render:0,navigation:0},report=(key,value)=>{progress[key]=value;onProgress?.(progress.physics*.25+progress.render*.65+progress.navigation*.10);};
  const compiled=spec.precompiled&&!raw;const [data,chunks]=await Promise.all([readSourceData(new URL('./'+spec.id+(compiled?'-physics':'-data')+'.json.gz',import.meta.url),value=>report('physics',value)),compiled?readSourceRender(new URL('./'+spec.id+'-render.json.gz',import.meta.url),value=>report('render',value),{detail:true}):Promise.resolve(null)]);data.renderChunks=chunks;report('physics',1);report('render',1);
  const baked=navigation?(await import('./'+spec.id+'-nav.js')).default:null;
  Object.assign(entry,createSourceArena(spec,data,baked),{ready:navigation});report('navigation',1);return entry;
 })().finally(()=>{pending=null}));
 entry.unload=()=>{for(const key of ['brushes','groups','renderChunks','navigation','anchors','source'])delete entry[key];entry.ready=false};
 return entry;
});
export function createSourceArena(spec,data,navigation){
 const spawns=spec.starts.map(s=>s.position),pickups=spec.resources.map(p=>healthPickup(spec.id+'-'+p.id,p.x,p.y,p.z,p.amount));
 return {...spec,source:data.source,navigation,groups:data.groups,renderChunks:data.renderChunks||null,renderInfo:data.renderChunks?{artProfile:data.renderChunks.artProfile}:null,brushes:data.brushes,spawns,spawnYaws:spec.starts.map(s=>(s.angle-90)*Math.PI/180),pickups,pads:spec.pads||[],lights:spec.lights||[],signs:[],water:spec.water||[],elevators:spec.elevators||[],stairs:[],solids:[],areas:[],navigationGround:!!spec.navigationGround,stepHeight:spec.stepHeight??.45,anchors:[...spawns,...pickups.map(p=>[p.x,p.y,p.z]),...(spec.pads||[]).flatMap(p=>[[p.x,p.y,p.z],[p.landing.x,p.landing.y,p.landing.z]]),...(spec.elevators||[]).flatMap(l=>[[(l.entryLow||l.entry).x,l.low,(l.entryLow||l.entry).z],[(l.entryHigh||l.entry).x,l.high,(l.entryHigh||l.entry).z]])]};
}
