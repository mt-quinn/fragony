// Geometry-only source data; loaded on demand.
import {readSourceData} from './source-data.js';
export default await readSourceData(new URL('./firingrange-data.json.gz',import.meta.url));
