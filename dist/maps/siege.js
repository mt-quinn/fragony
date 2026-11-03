import {SOURCE_ARENAS} from './source-arenas.js';
export default await SOURCE_ARENAS.find(m=>m.id==="siege").load({raw:true});
