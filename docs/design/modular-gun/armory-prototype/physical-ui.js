import {FrameRenderer} from '/dist/presentation.js';

export function createPhysicalUI(T,renderer,root,hardware,environment){
 const scene=new T.Scene(),camera=new T.OrthographicCamera(0,10,10,0,.1,60);
 camera.position.z=20;scene.background=new T.Color(0x243840);scene.environment=environment;
 scene.add(new T.HemisphereLight(0xdbe5e2,0x16242e,.85));
 const key=new T.DirectionalLight(0xffe3bc,2.5);key.position.set(-3,8,12);scene.add(key);scene.add(key.target);
 key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.00025;key.shadow.normalBias=.015;key.shadow.radius=3;
 const fill=new T.DirectionalLight(0x91b9ce,.8);fill.position.set(8,-2,5);scene.add(fill);
 const pipeline=new FrameRenderer(renderer,scene,camera,{antialias:true,aaFilter:'fxaa',taa:false,msaa:0,ao:true,aoQuality:'low',aoStrength:.45,bloom:false,pixelForge:true,pixelForgeIntensity:.12,grain:false,colorGrade:false,vignette:.25});
 const cache=new T.WebGLRenderTarget(1,1,{depthBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter});
 const pass=pipeline.pass.bind(pipeline);pipeline.pass=(m,target)=>pass(m,target===null?cache:target);
 const output=new T.ShaderMaterial({uniforms:{image:{value:cache.texture}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'uniform sampler2D image;varying vec2 vUv;void main(){gl_FragColor=texture2D(image,vUv);}',depthTest:false,depthWrite:false,toneMapped:false});
 const outputScene=new T.Scene(),outputCamera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2),output);quad.frustumCulled=false;outputScene.add(quad);
 // Upright labels remain in the front plane. Depth is exposed by an oblique cabinet projection.
 const chrome=new T.Group(),baked=new T.Group(),drawerRoot=new T.Group(),bakedDrawer=new T.Group();chrome.matrixAutoUpdate=false;chrome.matrix.set(.01,0,.0036,0,0,.01,-.0032,0,0,0,.01,0,0,0,0,1);scene.add(chrome,baked,bakedDrawer);
 const unit=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,12),materials={},geometries=new Map();
 const mat=(id,color,metalness=.2,roughness=.45)=>materials[id]??=new T.MeshStandardMaterial({color,metalness,roughness});
 const M={body:mat('body',0x48636c,.3,.5),fold:mat('fold',0x263d47,.35,.46),raised:mat('raised',0x66828b,.25,.42),edge:mat('edge',0x96adb0,.55,.32),steel:mat('steel',0xc2ccbf,.62,.3),dark:mat('dark',0x172b34,.15,.65),back:mat('back',0x112b39,.05,.8),rubber:mat('rubber',0x0e1f27,.02,.9),ivory:mat('ivory',0xeadfbd,.1,.45),orange:mat('orange',0xe97a49,.18,.4),disabled:mat('disabled',0x355058,.1,.6),blue:mat('blue',0x365c7c,.25,.5)};
 const rankMaterials=[0xd0d3bf,0x9ac7e2,0xc6a6df,0xebce86].map((c,i)=>new T.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.25,metalness:.1,roughness:.4}));
 const smallLights=[new T.MeshBasicMaterial({color:0xf5ad78}),new T.MeshBasicMaterial({color:0xcbe8b3})];
 const choicePlanes=[new T.Plane(new T.Vector3(1,0,0),0),new T.Plane(new T.Vector3(-1,0,0),0)];
 let drawerScroll=0,mounts=null;
 let width=1,height=1,rect,dirty=true,pressed=null,hovered=null,animationUntil=0,clampUntil=0;
 const moving=[],floating=[],clamps=[],clippingMaterials=new Map(),bakedGeometries=[],usedGeometry=new Set();
 renderer.localClippingEnabled=true;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pos=el=>{const r=el.getBoundingClientRect();return{x:r.left-rect.left+r.width/2,y:height-(r.top-rect.top+r.height/2),w:r.width,h:r.height};};
 function box(parent,x,y,z,w,h,d,material=M.body){const m=new T.Mesh(unit,material);m.position.set(x,y,z-d/2);m.scale.set(w,h,d);m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;}
 function bevel(parent,x,y,z,w,h,d,material=M.body,cut=4){
  cut=Math.min(cut,w*.15,h*.15);const id=`${w.toFixed(1)}:${h.toFixed(1)}:${d}:${cut}`;usedGeometry.add(id);
  if(!geometries.has(id)){const s=new T.Shape(),a=w/2,b=h/2;s.moveTo(-a+cut,-b);s.lineTo(a-cut,-b);s.lineTo(a,-b+cut);s.lineTo(a,b-cut);s.lineTo(a-cut,b);s.lineTo(-a+cut,b);s.lineTo(-a,b-cut);s.lineTo(-a,-b+cut);s.closePath();geometries.set(id,new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelSize:.65,bevelThickness:.65,bevelSegments:1,steps:1}).translate(0,0,-d));}
  const m=new T.Mesh(geometries.get(id),material);m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;
 }
 function bolt(parent,x,y,z=3,size=2.2){const m=new T.Mesh(cylinder,M.steel);m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.scale.set(size,1.4,size);m.castShadow=true;parent.add(m);const slot=box(parent,x,y,z+1,size*1.1,.6,.4,M.fold);slot.rotation.z=-.55;}
 function inset(parent,p,depth=24,back=M.back){
  bevel(parent,p.x,p.y,-depth,p.w,p.h,5,back,7);
  box(parent,p.x-p.w/2-4,p.y,0,8,p.h+14,depth+4,M.fold);
  box(parent,p.x+p.w/2+4,p.y,0,8,p.h+14,depth+4,M.fold);
  box(parent,p.x,p.y+p.h/2+4,0,p.w+8,8,depth+4,M.raised);
  box(parent,p.x,p.y-p.h/2-4,0,p.w+8,8,depth+4,M.dark);
  box(parent,p.x-p.w/2,p.y,1,1.5,p.h,2,M.edge);
  box(parent,p.x,p.y+p.h/2-1,1,p.w,1.5,2,M.steel);
 }
 function dynamic(object){object.userData.dynamic=true;return object;}
 function contactShadow(parent,x,y,w,h,z){const mesh=new T.Mesh(unit,M.rubber);mesh.position.set(x,y,z);mesh.scale.set(w,h,.5);parent.add(mesh);}
 function bakeStatic(){
  baked.clear();bakedDrawer.clear();bakedGeometries.splice(0).forEach(g=>g.dispose());chrome.updateMatrixWorld(true);
  const groups=new Map(),remove=[];
  const visit=(o,isDynamic=false,isDrawer=false)=>{isDynamic||=o.userData.dynamic===true;isDrawer||=o===drawerRoot;
   if(o.isMesh&&!isDynamic){const id=o.material.uuid+':'+!!o.userData.pixelForgeClean+':'+o.castShadow+':'+isDrawer;let a=groups.get(id);if(!a){a={material:o.material,meshes:[],clean:o.userData.pixelForgeClean,casts:o.castShadow,drawer:isDrawer};groups.set(id,a);}a.meshes.push(o);remove.push(o);}for(const child of o.children)visit(child,isDynamic,isDrawer);
  };visit(chrome);
  for(const {material,meshes,clean,casts,drawer} of groups.values()){
   const chunks=[],lengths={position:0,normal:0,uv:0};
   for(const mesh of meshes){const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);chunks.push(g);for(const k of Object.keys(lengths))lengths[k]+=g.getAttribute(k)?.array.length||0;}
   const g=new T.BufferGeometry();for(const k of Object.keys(lengths)){if(!lengths[k])continue;const values=new Float32Array(lengths[k]);let offset=0;for(const chunk of chunks){const a=chunk.getAttribute(k);if(a){values.set(a.array,offset);offset+=a.array.length;}}g.setAttribute(k,new T.BufferAttribute(values,k==='uv'?2:3));}
   g.computeBoundingSphere();chunks.forEach(g=>g.dispose());bakedGeometries.push(g);const m=new T.Mesh(g,material);m.castShadow=casts;m.receiveShadow=true;m.userData.pixelForgeClean=clean;(drawer?bakedDrawer:baked).add(m);
  }
  remove.forEach(m=>m.removeFromParent());
 }
 function sync(){
  rect=root.getBoundingClientRect();width=rect.width;height=rect.height;dirty=true;
  chrome.clear();drawerRoot.clear();drawerRoot.position.x=0;bakedDrawer.position.x=0;moving.length=floating.length=clamps.length=0;usedGeometry.clear();
  // Solid cast shell, with a continuous gasket and a narrow folded outside return.
  box(chrome,width/2,height/2,-85,width+80,height+80,15,M.body);
  for(const x of [6,width-6]){
   bevel(chrome,x,height/2,5,11,height+25,30,M.dark,2);
   box(chrome,x+(x<width/2?7:-7),height/2,6,2,height,5,M.edge);
   for(const y of [18,height-18])bolt(chrome,x,y,8,1.8);
  }
  box(chrome,width/2,height-4,4,width-22,8,28,M.raised);box(chrome,width/2,3,4,width-22,7,28,M.dark);
  // A compact enamel round plate gives the heading a real substrate.
  const hp=pos(root.querySelector('h1'));bevel(chrome,hp.x,hp.y,2,hp.w,hp.h+12,5,M.ivory,3);
  for(const sign of [-1,1])bolt(chrome,hp.x+sign*(hp.w/2-4),hp.y,4,1.15);
  const sound=root.querySelector('#sound-toggle'),sp=pos(sound);bevel(chrome,sp.x,sp.y,-1,30,27,4,M.fold,3);
  // The working bay: dark backing, side returns, a slim light and a perforated bed.
  const gp=pos(root.querySelector('.gun-stage')),gw=gp.w+8,gh=gp.h-4;
  inset(chrome,{x:gp.x,y:gp.y,w:gw,h:gh},44);
  for(const side of [-1,1]){
   bevel(chrome,gp.x+side*(gw/2+3),gp.y,3,9,gh+10,27,M.raised,3);
   for(const y of [-gh*.43,gh*.43])bolt(chrome,gp.x+side*(gw/2+3),gp.y+y,5,1.6);
  }
  for(const y of [-gh*.28,gh*.1])box(chrome,gp.x,gp.y+y,-41,gw-22,2,2,M.fold);
  box(chrome,gp.x,gp.y+gh/2-5,-8,gw*.46,5,5,M.dark);
  box(chrome,gp.x,gp.y+gh/2-6,-6,gw*.43,1.6,1.2,M.ivory);
  bevel(chrome,gp.x,gp.y-gh*.39,-12,gw-8,16,27,M.raised,3);
  for(let i=0;i<Math.floor(gw/22)-1;i++)bevel(chrome,gp.x-gw/2+19+i*22,gp.y-gh*.39,-10,10,2.2,1.2,M.dark,1);
  const anchors=mounts||[-1,1].map(side=>({x:gp.x+side*gw*.25,y:gp.y-gh*.12}));
  for(const [index,anchor] of anchors.entries()){
   const bottom=gp.y-gh*.39,top=anchor.y-4,x=anchor.x+2,h=Math.max(12,top-bottom);
   bevel(chrome,x,bottom+h/2,-14,12,h,20,M.fold,2);
   bevel(chrome,x,bottom+2,-10,28,6,24,M.dark,2);
   bevel(chrome,x,top-3,-8,30,7,22,M.edge,2);
   const jaw=dynamic(bevel(chrome,x,top,-5,22,4,23,M.orange,1));clamps.push({mesh:jaw,y:jaw.position.y,side:index?1:-1});
  }
  // Four fitted attachments occupy one recessed bank of mechanical rocker keys.
  const nav=pos(root.querySelector('.fitted-parts'));inset(chrome,{x:nav.x,y:nav.y,w:nav.w+5,h:nav.h+8},13,M.dark);
  for(const el of root.querySelectorAll('.fitted-part')){
   const p=pos(el),active=el.classList.contains('is-active'),preview=el.classList.contains('is-preview'),r=Number(el.dataset.rank)||0;
   bevel(chrome,p.x,p.y,-2,p.w-1,p.h-3,10,M.rubber,3);
   const face=new T.Group();face.position.set(p.x-1,p.y+1,0);dynamic(face);chrome.add(face);
   bevel(face,0,0,2,p.w-5,p.h-7,8,active?M.ivory:preview?M.raised:M.body,2);
   box(face,0,p.h/2-4,3,p.w-11,1.1,2,active?M.steel:M.edge);
   box(face,p.w/2-8,height>width?p.h/2-12:0,4,2.5,height>width?8:13,2,rankMaterials[r]);
   if(preview)box(face,-p.w/2+4,0,4,2.4,p.h*.45,2,M.orange);
   moving.push({element:el,mesh:face,z:0});
  }
  // The attachment drawer has one common rail and a cradle for each offered object.
  const zp=pos(root.querySelector('.choice-zone')),op=pos(root.querySelector('.options'));
  inset(chrome,{x:zp.x,y:zp.y+1,w:zp.w+5,h:zp.h+4},25,M.dark);
  const planes=choicePlanes;planes[0].constant=-(op.x-op.w/2)*.01;planes[1].constant=(op.x+op.w/2)*.01;drawerScroll=root.querySelector('.options').scrollLeft;chrome.add(drawerRoot);
  for(const el of root.querySelectorAll('.choice')){
   const p=pos(el),r=Number(el.dataset.rank)||0,selected=el.getAttribute('aria-pressed')==='true',start=drawerRoot.children.length;
   bevel(drawerRoot,p.x,p.y,-7,p.w-4,p.h-5,12,selected?M.raised:M.fold,4);
   const label=pos(el.querySelector('.choice-name')),rarity=pos(el.querySelector('.choice-rarity')),ip=pos(el.querySelector('.choice-icon'));
   bevel(drawerRoot,p.x,(label.y+rarity.y)/2-1,-2,p.w-9,(label.y-rarity.y)+label.h/2+rarity.h/2+10,7,M.dark,2);
   contactShadow(drawerRoot,ip.x+3,ip.y-4,ip.w*.85,ip.h*.65,-3);
   const object=new T.Group();object.position.set(ip.x-3,ip.y+1,8);object.rotation.set(-.24,.35,-.22);drawerRoot.add(object);
   const part=hardware.part(el.dataset.id,r,ip.w/42);object.add(part);
   if(['single','double','huge','gatling'].includes(el.dataset.id))object.rotation.set(-.32,-.65,.08);
   if(selected){dynamic(object);floating.push({mesh:object,z:8,target:13});}
   box(drawerRoot,p.x,p.y-p.h/2+1,1,p.w-15,2,2,rankMaterials[r]);
   if(selected)for(const side of [-1,1])bevel(drawerRoot,p.x+side*(p.w/2-4),p.y+2,3,3,p.h*.69,5,M.orange,1);
   for(const child of drawerRoot.children.slice(start))child.traverse(m=>{if(!m.isMesh)return;const original=m.material;if(!clippingMaterials.has(original)){
     const c=original.clone();c.clippingPlanes=planes;clippingMaterials.set(original,c);
    }m.material=clippingMaterials.get(original);});
  }
  for(const id of ['previous-option','next-options']){const el=root.querySelector('#'+id);if(el.hidden)continue;const p=pos(el);bevel(chrome,p.x-7,p.y+6,18,p.w-3,p.h-4,16,M.dark,4);bevel(chrome,p.x-7,p.y+6,20,p.w-9,p.h-9,5,M.body,3);}
  const detail=root.querySelector('.part-detail');if(!detail.hidden){const p=pos(detail);
   inset(chrome,{x:p.x,y:p.y,w:p.w+18,h:p.h+16},12,M.dark);
   bevel(chrome,p.x,p.y,-1,p.w+12,p.h+10,5,M.dark,3);
   for(const sign of [-1,1])bolt(chrome,p.x+sign*(p.w/2+5),p.y+p.h/2+7,3,1.35);
   // The comparison uses engraved rules; only values and plain labels sit on the face.
  }
  for(const id of ['claim','play','test-fire','compare-view','rail-mode']){
   const el=root.querySelector('#'+id);if(!el||el.hidden)continue;const p=pos(el),primary=id==='claim'&&!el.classList.contains('is-undo')&&!el.disabled||id==='play'&&!el.disabled;
   const face=new T.Group();face.position.set(p.x-1,p.y+1,0);dynamic(face);chrome.add(face);
   bevel(chrome,p.x,p.y,-2,p.w+4,p.h+3,13,M.rubber,4);
   const color=el.disabled?M.disabled:primary?M.orange:id==='claim'?M.dark:M.body;
   bevel(face,0,0,4,p.w-2,p.h-3,8,color,3);box(face,0,p.h/2-3,5,p.w-14,1,2,primary?M.ivory:M.edge);
   if(id==='play'&&!el.disabled){const lamp=box(face,-p.w/2+6,0,6,2.5,p.h*.38,2,smallLights[1]);lamp.userData.pixelForgeClean=true;}
   moving.push({element:el,mesh:face,z:0});
  }
  bakeStatic();for(const [id,g] of geometries)if(!usedGeometry.has(id)){g.dispose();geometries.delete(id);}
  animationUntil=performance.now()+(reduced.matches?0:220);
 }
 function pointer(e){const el=e.target.closest('button');if(el&&!el.disabled){pressed=el;dirty=true;animationUntil=performance.now()+200;}}
 function release(){pressed=null;dirty=true;animationUntil=performance.now()+180;}
 function hover(e){const el=e.target.closest('button');if(el!==hovered){hovered=el;dirty=true;animationUntil=performance.now()+120;}}
 const keyDown=e=>{if(e.key===' '||e.key==='Enter')pointer(e);},keyUp=e=>{if(e.key===' '||e.key==='Enter')release();};
 window.addEventListener('blur',release);root.addEventListener('keydown',keyDown);root.addEventListener('keyup',keyUp);root.addEventListener('pointerdown',pointer);root.addEventListener('pointerover',hover);window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 function resize(w,h){width=w;height=h;camera.right=w*.01;camera.top=h*.01;camera.updateProjectionMatrix();
  key.position.set(-w*.003,h*.012,8);key.target.position.set(w*.005,h*.005,-.2);key.shadow.camera.left=-w*.008;key.shadow.camera.right=w*.008;key.shadow.camera.top=h*.012;key.shadow.camera.bottom=-h*.012;key.shadow.camera.near=.1;key.shadow.camera.far=40;key.shadow.camera.updateProjectionMatrix();
  pipeline.resize();const size=renderer.getDrawingBufferSize(new T.Vector2());cache.setSize(size.x,size.y);sync();
 }
 function render(dt){
  for(const item of moving){const target=item.z-(pressed===item.element?4:0);
   if(Math.abs(item.mesh.position.z-target)>.03){item.mesh.position.z=reduced.matches?target:T.MathUtils.damp(item.mesh.position.z,target,35,dt);dirty=true;animationUntil=performance.now()+70;}}
  for(const item of floating){if(Math.abs(item.mesh.position.z-item.target)>.03){item.mesh.position.z=reduced.matches?item.target:T.MathUtils.damp(item.mesh.position.z,item.target,22,dt);dirty=true;animationUntil=performance.now()+70;}}
  if(clampUntil){const t=Math.max(0,(clampUntil-performance.now())/230),offset=Math.sin(t*Math.PI)*4;for(const c of clamps)c.mesh.position.y=c.y-offset;if(t>0){dirty=true;animationUntil=performance.now()+70;}else clampUntil=0;}
  if(dirty){renderer.shadowMap.autoUpdate=true;pipeline.render(scene,camera,dt,false);dirty=false;}
  renderer.setRenderTarget(null);renderer.setViewport(0,0,width,height);renderer.render(outputScene,outputCamera);root.classList.add('has-physical-ui');root.dataset.renderer='Three.js + Pixel Forge';
 }
 function scroll(){const delta=root.querySelector('.options').scrollLeft-drawerScroll;drawerRoot.position.x=-delta;bakedDrawer.position.x=-delta*.01;dirty=true;}
 function feedback(){if(!reduced.matches){clampUntil=performance.now()+230;animationUntil=clampUntil;}dirty=true;}
 function dispose(){window.removeEventListener('blur',release);root.removeEventListener('keydown',keyDown);root.removeEventListener('keyup',keyUp);root.removeEventListener('pointerdown',pointer);root.removeEventListener('pointerover',hover);window.removeEventListener('pointerup',release);window.removeEventListener('pointercancel',release);pipeline.dispose();cache.dispose();quad.geometry.dispose();output.dispose();unit.dispose();cylinder.dispose();geometries.forEach(g=>g.dispose());bakedGeometries.forEach(g=>g.dispose());clippingMaterials.forEach(m=>m.dispose());Object.values(materials).forEach(m=>m.dispose());rankMaterials.forEach(m=>m.dispose());smallLights.forEach(m=>m.dispose());key.shadow.map?.dispose();}
 return{setEnvironment(texture){scene.environment=texture;dirty=true;},setMounts(points){mounts=points;},scroll,sync,resize,render,feedback,dispose,isAnimating:()=>performance.now()<animationUntil};
}
