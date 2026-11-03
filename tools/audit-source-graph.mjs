import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import specs from '../dist/maps/source-arena-specs.js';
for(const id of process.argv.slice(2)){
 const data=JSON.parse(gunzipSync(fs.readFileSync(new URL('../../reference-maps/'+id+'/navigation-audit.json.gz',import.meta.url)))),s=specs.find(s=>s.id===id);
 const nearest=p=>{let best=0,c=Infinity;data.forEach((n,i)=>{const q=(n[0]-p[0])**2+(n[2]-p[2])**2+9*(n[1]-p[1])**2;if(q<c){best=i;c=q}});return best};
 const reach=i=>{const seen=new Set([i]),q=[i];for(let j=0;j<q.length;j++)for(const e of data[q[j]][3])if(!seen.has(e[0])){seen.add(e[0]);q.push(e[0]);}return seen};
 const starts=s.starts.map(p=>nearest(p.position)),all=starts.map(reach);console.log(id,'nodes',data.length);for(let i=0;i<starts.length;i++){const n=data[starts[i]];console.log(i,s.starts[i].position.map(v=>+v.toFixed(2)), 'node',n.slice(0,3),'reachable',all[i].size,'links',starts.map((j,k)=>all[i].has(j)?k:null).filter(v=>v!==null));}
 const undirected=data.map(()=>[]);for(let i=0;i<data.length;i++)for(const e of data[i][3]){undirected[i].push(e[0]);undirected[e[0]].push(i);}let seen=new Set(),cs=[];for(let i=0;i<data.length;i++){if(seen.has(i))continue;const q=[i];seen.add(i);for(let j=0;j<q.length;j++)for(const v of undirected[q[j]])if(!seen.has(v)){seen.add(v);q.push(v);}cs.push(q);}cs.sort((a,b)=>b.length-a.length);console.log('components',cs.slice(0,8).map(a=>({n:a.length,lo:[0,1,2].map(k=>Math.min(...a.map(i=>data[i][k]))),hi:[0,1,2].map(k=>Math.max(...a.map(i=>data[i][k])))})));
}
