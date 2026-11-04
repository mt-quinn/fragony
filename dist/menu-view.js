// Display-only save summary. Never migrates or writes campaign data from the menu.
export function menuRunSummary(raw){
 try{const run=JSON.parse(raw);if(!run||!Number.isInteger(run.round)||run.round<1||!Number.isFinite(run.credits)||!Array.isArray(run.owned)||!run.owned.length)return null;return 'ROUND '+String(run.round).padStart(2,'0')+' · '+Math.max(0,Math.floor(run.credits))+' CR';}catch{return null;}
}
