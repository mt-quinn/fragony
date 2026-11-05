// Shared geometry and finishes for the armory's loose parts and gun details.
export function createHardware(T){
 const geometries=new Map(),materials=new Map(),textures=new Map();
 const geo=(key,create)=>{if(!geometries.has(key))geometries.set(key,create());return geometries.get(key);};
 const mat=(key,color,metalness=.2,roughness=.42)=>{if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness,roughness}));return materials.get(key);};
 const M={ink:mat('ink',0x172b34,.2,.58),rubber:mat('rubber',0x101d23,.02,.85),steel:mat('steel',0xb3c1c0,.72,.28),edge:mat('edge',0x596d76,.6,.4),ivory:mat('ivory',0xe8ddba,.12,.5),blue:mat('blue',0x48719e,.25,.4),copper:mat('copper',0xb7723f,.68,.31),gold:mat('gold',0xd4af68,.65,.3),orange:mat('orange',0xe76d40,.15,.48)};
 const rank=r=>mat('rank'+r,[0xc7cbb8,0x8fbad1,0xc1a1d6,0xdec07c][r],.35,.34);
 function mesh(parent,g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(parent,x,y,z,w,h,d,m=M.steel,cut=1){const k=`b${w}:${h}:${d}:${cut}`;return mesh(parent,geo(k,()=>{const s=new T.Shape(),a=w/2,b=h/2,c=Math.min(cut,a*.25,b*.25);s.moveTo(-a+c,-b);s.lineTo(a-c,-b);s.lineTo(a,-b+c);s.lineTo(a,b-c);s.lineTo(a-c,b);s.lineTo(-a+c,b);s.lineTo(-a,b-c);s.lineTo(-a,-b+c);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:.45,bevelSize:.45,bevelSegments:1,steps:1});g.translate(0,0,-d/2);return g;}),m,x,y,z);}
 function cyl(parent,x,y,z,r,h,m=M.steel,axis='y',r2=r){const o=mesh(parent,geo(`c${r}:${r2}:${h}`,()=>new T.CylinderGeometry(r2,r,h,16)),m,x,y,z);if(axis==='z')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.z=Math.PI/2;return o;}
 function ring(parent,x,y,z,r,t,m=M.steel,axis='z'){const o=mesh(parent,geo(`r${r}:${t}`,()=>new T.TorusGeometry(r,t,5,24)),m,x,y,z);if(axis==='y')o.rotation.x=Math.PI/2;if(axis==='x')o.rotation.y=Math.PI/2;return o;}
 const glyphs={pressure:'↑',service:'↻',momentum:'»',repair:'+',focus:'◷',rebound:'↗',brake:'Ⅱ',echo:'••',arc:'ϟ',assayer:'★'};
 function glyph(id){if(textures.has(id))return textures.get(id);const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.clearRect(0,0,128,128);ctx.fillStyle='#f5edce';ctx.font='bold 87px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(glyphs[id]||'+',64,67);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,toneMapped:false});textures.set(id,m);return m;}
 function chip(parent,id,r=0){const tint=rank(r);box(parent,0,0,0,25,29,5,M.ink,2);box(parent,0,0,3.1,20,23,2,tint,1.5);box(parent,0,0,4.4,15,17,.5,M.blue,1);
  const label=mesh(parent,geo('label',()=>new T.PlaneGeometry(14,14)),glyph(id),0,0,4.9);label.castShadow=false;
  for(let i=0;i<5;i++)for(const sign of [-1,1])box(parent,sign*15,-11+i*5.5,0,6,2,2,M.gold,.2);
  for(const x of [-8,8])cyl(parent,x,-10,5,1,.5,M.steel,'z');
 }
 function bullet(parent,x,y,kind='normal'){
  const length=kind==='sniper'?34:kind==='explosive'?23:27,r=kind==='explosive'?4.8:3.7;
  cyl(parent,x,y-2,0,r,length,M.gold);cyl(parent,x,y-length/2-1,0,r+1,2.2,M.copper);
  cyl(parent,x,y+length/2+3,0,r,8,kind==='piercing'?M.steel:M.copper,'y',.35);
  cyl(parent,x,y+length/2-3,0,r+.2,2,kind==='explosive'?M.orange:M.ink);
  if(kind==='explosive')cyl(parent,x,y+3,0,r+.2,6,M.orange);
 }
 function barrel(parent,id,r){
  const tint=rank(r),count=id==='double'?2:id==='gatling'?6:1;
  if(id==='rails'){
   box(parent,0,-14,0,27,8,14,M.ink,2);
   for(const x of [-9,9]){box(parent,x,2,0,7,34,9,tint);box(parent,x,3,5.2,2,26,1.2,M.blue,.2);for(let i=0;i<4;i++)box(parent,x,-9+i*8,0,11,2,12,M.edge,.3);}
   return;
  }
  for(let i=0;i<count;i++){
   const a=i*Math.PI/3,x=id==='double'?(i-.5)*13:id==='gatling'?Math.sin(a)*9:0,y=id==='gatling'?Math.cos(a)*9:0,rr=id==='huge'?11:id==='gatling'?3.2:6;
   cyl(parent,x,y,0,rr,31,M.steel,'z');cyl(parent,x,y,-7,rr+1.1,14,M.ink,'z');
   ring(parent,x,y,16.5,rr,.95,tint);cyl(parent,x,y,16,rr*.68,.4,M.rubber,'z');
   for(const z of [-9,-4])ring(parent,x,y,z,rr+1,.7,M.edge);
   if(id==='huge')for(let j=0;j<6;j++){const b=j*Math.PI/3;box(parent,x+Math.cos(b)*12,y+Math.sin(b)*12,-3,3,3,17,M.edge,.2);}
  }
  if(id==='gatling'){ring(parent,0,0,-11,14,2.2,M.ink);ring(parent,0,0,8,13,1.7,tint);}
  else box(parent,0,-10,-9,id==='double'?28:24,7,16,tint,2);
 }
 function mechanism(parent,id,r){const tint=rank(r);box(parent,0,0,0,28,22,13,M.ink,3);box(parent,0,1,7,26,17,2,tint,2);box(parent,0,1,8.5,18,8,1,M.rubber,1);
  if(id==='charge'){cyl(parent,0,10,0,7,28,M.ink,'x');for(let i=0;i<5;i++)ring(parent,-10+i*5,10,0,7,1.2,M.copper,'x');box(parent,0,1,10,12,3,1,M.blue,.2);}
  else {const n=id==='burst'?3:id==='automatic'?5:1;for(let i=0;i<n;i++)box(parent,(i-(n-1)/2)*4.5,1,9,2,5,1,M.orange,.2);}
  box(parent,7,-15,0,7,13,10,M.edge,1);box(parent,7,-22,0,12,3,12,M.ink,.5);cyl(parent,-10,7,9,1.3,1,M.steel,'z');
 }
 function part(id,r=0,size=1){const g=new T.Group();
  if(['single','double','huge','gatling','rails'].includes(id))barrel(g,id,r);
  else if(['automatic','semi','burst','charge'].includes(id))mechanism(g,id,r);
  else if(['normal','sniper','piercing','explosive','duplex'].includes(id)){
   if(id==='duplex'){bullet(g,-6,-1);bullet(g,6,1);box(g,0,-13,-4,25,7,10,M.ink,1);}
   else bullet(g,0,0,id);
  }else if(id==='pellets'){
   cyl(g,0,-1,0,9,28,M.orange);cyl(g,0,-13,0,10,7,M.gold);cyl(g,0,14,0,8.5,2,M.ivory);for(let i=0;i<8;i++){const a=i*Math.PI/4;cyl(g,Math.cos(a)*5,16,Math.sin(a)*5,1.7,2,M.steel);}
  }else chip(g,id,r);
  g.scale.setScalar(size);return g;
 }
 function environment(renderer){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');const bg=x.createLinearGradient(0,0,0,256);bg.addColorStop(0,'#b1bac2');bg.addColorStop(.45,'#536776');bg.addColorStop(1,'#1c2b35');x.fillStyle=bg;x.fillRect(0,0,512,256);
  x.fillStyle='#fff0cb';x.fillRect(35,35,165,25);x.fillStyle='#d6edf0';x.fillRect(330,45,85,58);x.fillStyle='#7e95a3';x.fillRect(235,70,18,112);
  const t=new T.CanvasTexture(c);t.mapping=T.EquirectangularReflectionMapping;t.colorSpace=T.SRGBColorSpace;const pm=new T.PMREMGenerator(renderer),target=pm.fromEquirectangular(t);pm.dispose();t.dispose();return target;
 }
 function dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(m=>{m.map.dispose();m.dispose();});}
 return{part,chip,environment,box,M,rank,dispose};
}
