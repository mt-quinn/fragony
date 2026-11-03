import {SOURCE_ARENAS} from './source-arenas.js';
export const KILLHOUSE=await SOURCE_ARENAS.find(m=>m.id==='killhouse').load({raw:true});
