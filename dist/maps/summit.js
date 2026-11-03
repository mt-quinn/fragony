import {SOURCE_ARENAS} from './source-arenas.js';
export const SUMMIT=await SOURCE_ARENAS.find(m=>m.id==='summit').load({raw:true});
