// Uniform palette banks keep a single small program for independently authored
// maps; changing maps never compiles nineteen different post-process shaders.
export const mapArtPaletteGLSL=`uniform float arenaRoster;uniform vec3 rosterColors[18];uniform vec3 rosterSkyColors[32];uniform float rosterSkyCount;
vec3 rosterPalette(vec3 c){vec3 best=vec3(0.);float dst=100.;for(int i=0;i<18;i++){vec3 p=rosterColors[i];vec3 cc=c-vec3(min(c.r,min(c.g,c.b))),pc=p-vec3(min(p.r,min(p.g,p.b)));float chroma=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));float hue=length(normalize(cc+vec3(.00001))-normalize(pc+vec3(.00001)));float d=dot((c-p)*vec3(.9,1.1,.8),c-p)+hue*.22*smoothstep(.035,.12,chroma);if(d<dst){dst=d;best=p;}}return best;}
vec3 rosterSky(vec3 c){vec3 best=vec3(0.);float dst=100.;for(int i=0;i<32;i++){if(float(i)>=rosterSkyCount)break;vec3 p=rosterSkyColors[i];float d=dot((c-p)*vec3(.9,1.1,.8),c-p);if(d<dst){dst=d;best=p;}}return best;}`;
