import {readSourceData} from '../../dist/maps/source-data.js';
import {readSourceRender} from '../../dist/maps/source-render.js';
import {baselineRender} from './baseline.mjs';
import {createSourceArena} from '../../dist/maps/source-arenas.js';
import {SOURCE_ARENAS} from '../../dist/maps/source-arenas.js';
import {restoreNavigation} from '../../dist/ai.js';
export async function loadArtMap(id,{render=true,navigation=true,baseline=false}={}){
 let map=SOURCE_ARENAS.find(m=>m.id===id);
 if(map&&baseline){const data=await readSourceData(new URL('../../dist/maps/'+id+'-physics.json.gz',import.meta.url)),baked=navigation?(await import('../../dist/maps/'+id+'-nav.js')).default:null;map=createSourceArena(map,data,baked);map.renderChunks=await readSourceRender(baselineRender(id));}
 else if(map)await map.load({navigation});
 else {const module=await import('../../dist/maps/'+id+'.js');map=module[id.toUpperCase()];if(render){if(baseline)map.renderChunks=await readSourceRender(baselineRender(id));else await map.loadRender();}}
 if(navigation)map.artNavigation=restoreNavigation(map.navigation,map.elevators||[],map.anchors,map.bounds,map.brushes,map.stepHeight,map.pads||[]);
 return map;
}
