import {SOURCE_ARENAS} from './source-arenas.js';
export default await SOURCE_ARENAS.find(m=>m.id==="mutiny").load({raw:true});
