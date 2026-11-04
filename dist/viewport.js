// Layout and WebGL share one rectangle. iOS can leave innerHeight stale after
// Home Screen rotation; measuring the stage avoids independent canvas/HUD sizes.
export function viewportSize(node){
 const fallback={width:typeof innerWidth==='number'?innerWidth:1,height:typeof innerHeight==='number'?innerHeight:1};
 const box=node?.getBoundingClientRect?.();
 return {width:box?.width>0?box.width:fallback.width,height:box?.height>0?box.height:fallback.height};
}
export function gameViewportSize(){return viewportSize(typeof document!=='undefined'?document.getElementById('viewport'):null)}
export function installedDisplay(){return typeof navigator!=='undefined'&&navigator.standalone===true||typeof matchMedia==='function'&&['standalone','fullscreen'].some(mode=>matchMedia('(display-mode: '+mode+')').matches)}
export function syncDisplayMode(){if(typeof document!=='undefined')document.documentElement?.classList?.toggle('installed-app',!!installedDisplay());}
export function displayReport(){
 const stage=typeof document!=='undefined'?document.getElementById('viewport'):null,box=stage?.getBoundingClientRect?.(),canvas=stage?.querySelector('canvas'),touch=typeof document!=='undefined'?document.getElementById('mobile'):null;
 const rect=node=>{const r=node?.getBoundingClientRect?.();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};
 const css=touch&&getComputedStyle(touch),vv=typeof window!=='undefined'?window.visualViewport:null;
 return {build:'display-2026-11-04',installed:!!installedDisplay(),userAgent:typeof navigator!=='undefined'?navigator.userAgent:null,screen:typeof screen!=='undefined'?{width:screen.width,height:screen.height,orientation:screen.orientation?.type}:null,window:{width:typeof innerWidth==='number'?innerWidth:null,height:typeof innerHeight==='number'?innerHeight:null,ratio:typeof devicePixelRatio==='number'?devicePixelRatio:1},visualViewport:vv?{width:vv.width,height:vv.height,offsetLeft:vv.offsetLeft,offsetTop:vv.offsetTop,scale:vv.scale}:null,document:typeof document!=='undefined'?{width:document.documentElement.clientWidth,height:document.documentElement.clientHeight,scrollHeight:document.documentElement.scrollHeight}:null,stage:box?rect(stage):null,canvas:rect(canvas),controls:rect(touch),safeInsets:css?{top:css.paddingTop,right:css.paddingRight,bottom:css.paddingBottom,left:css.paddingLeft}:null};
}
syncDisplayMode();
