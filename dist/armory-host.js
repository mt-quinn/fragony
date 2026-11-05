// The shop owns a renderer only while open. The paused arena does not submit
// frames underneath it; closing the frame releases the shop's WebGL resources.
export function openArmoryView(config,{change,fight,exit}={}){
 const frame=document.createElement('iframe');frame.className='game-armory';frame.title='Gun attachments';frame.src=new URL('armory/index.html?embedded=1',document.baseURI).href;frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0;z-index:200000;background:#172b30';
 let closed=false;
 const receive=event=>{if(closed||event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.scope!=='fragony-armory')return;const m=event.data;
  if(m.kind==='ready')frame.contentWindow.postMessage({scope:'fragony-armory',kind:'init',config},location.origin);
  else if(m.kind==='change')change?.(m.state);
  else if(m.kind==='fight')fight?.(m.result);
  else if(m.kind==='exit')exit?.(m.state);
 };
 window.addEventListener('message',receive);document.body.appendChild(frame);frame.focus();
 return{frame,close(){if(closed)return;closed=true;window.removeEventListener('message',receive);frame.remove();}};
}
