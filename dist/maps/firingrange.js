import {SOURCE_ARENAS} from './source-arenas.js';
export const FIRINGRANGE=await SOURCE_ARENAS.find(m=>m.id==='firingrange').load({raw:true});
