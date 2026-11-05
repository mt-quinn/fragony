import * as THREE from './vendor/three.module.js';
import {MAP_ART_PROFILES} from './map-art-profiles.js';
// Perceptual ramps keep light/dark steps meaningful for every independently
// selected gamut. Base colors remain the exact authored sRGB swatches.
function lab(hex){const c=new THREE.Color(hex),l=Math.cbrt(.4122214708*c.r+.5363325363*c.g+.0514459929*c.b),m=Math.cbrt(.2119034982*c.r+.6806995451*c.g+.1073969566*c.b),s=Math.cbrt(.0883024619*c.r+.2817188376*c.g+.6299787005*c.b);return[.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];}
function rgb([L,a,b]){const l=(L+.3963377774*a+.2158037573*b)**3,m=(L-.1055613458*a-.0638541728*b)**3,s=(L-.0894841775*a-1.291485548*b)**3;return new THREE.Color().setRGB(Math.max(0,Math.min(1,4.0767416621*l-3.3077115913*m+.2309699292*s)),Math.max(0,Math.min(1,-1.2684380046*l+2.6097574011*m-.3413193965*s)),Math.max(0,Math.min(1,-.0041960863*l-.7034186147*m+1.707614701*s))).getHexString();}
export function artRamp(hex,lightLimit=.87){const [L,a,b]=lab(hex);return['#'+rgb([Math.max(.17,L-.18),a*.85,b*.85]),hex,'#'+rgb([Math.min(lightLimit,L+.17),a*.65,b*.65])];}
const cache=new Map();
export function mapArtPalette(id){if(cache.has(id))return cache.get(id);const p=MAP_ART_PROFILES[id];if(!p)return null;const result={world:[...p.colors.flatMap(c=>artRamp(c)),...artRamp(p.floor,.73),...artRamp(p.ink,.55)],sky:p.sky};cache.set(id,result);return result;}
export function displayVector(hex){const n=parseInt(hex.slice(1),16);return new THREE.Vector3((n>>16&255)/255,(n>>8&255)/255,(n&255)/255);}
