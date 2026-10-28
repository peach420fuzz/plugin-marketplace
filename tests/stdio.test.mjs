import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const server=fileURLToPath(new URL('../server/mcp-stdio.mjs',import.meta.url));
async function run(messages){
 const folder=await mkdtemp(path.join(tmpdir(),'kinema-test-'));const file=path.join(folder,'viewer.json');
 const child=spawn(process.execPath,[server],{env:{...process.env,CINEMA42_DATA_FILE:file},stdio:['pipe','pipe','pipe']});
 let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);
 child.stdin.end(messages.map((m,i)=>JSON.stringify({jsonrpc:'2.0',id:i+1,...m})).join('\n')+'\n');
 const timer=setTimeout(()=>child.kill(),10000);
 const code=await new Promise(resolve=>child.on('exit',resolve));clearTimeout(timer);
 try {assert.equal(code,0,err);return {responses:out.trim().split('\n').map(JSON.parse),data:await readFile(file,'utf8').catch(()=>null),mode:await stat(file).then(x=>x.mode&0o777).catch(()=>null)}} finally{await rm(folder,{recursive:true,force:true})}
}
const call=(name,args={})=>({method:'tools/call',params:{name,arguments:args}});
const data=r=>JSON.parse(r.result.content[0].text);
test('stdio initialize negotiates and publishes the current version',async()=>{const r=await run([{method:'initialize'}]);assert.equal(r.responses[0].result.serverInfo.version,'0.4.0')});
test('all seven tools declare read/world/destructive annotations',async()=>{const r=await run([{method:'tools/list'}]);assert.equal(r.responses[0].result.tools.length,7);for(const t of r.responses[0].result.tools){for(const key of ['readOnlyHint','openWorldHint','destructiveHint'])assert.equal(typeof t.annotations[key],'boolean')}});
test('import and dossier preserve owner ratings and restrictive disk mode',async()=>{const r=await run([call('import_film_history',{platform:'imdb',csv:'Title,Year,Your Rating\nAnchor A,2000,10\nAnchor B,2000,9'}),call('get_cinema_taste_dossier')]);assert.equal(data(r.responses[1]).counts.rated,2);assert.equal(r.mode,0o600);assert.equal(JSON.parse(r.data).observations.length,2)});
test('scoped delete clears archive fields',async()=>{const r=await run([call('import_film_history',{platform:'imdb',csv:'Title,Your Rating\nA,10'}),call('delete_all_my_cinema_data',{confirm:true})]);assert.equal(data(r.responses[1]).deleted,true);assert.deepEqual(JSON.parse(r.data),{schema:1,profiles:[],observations:[],feedback:[]})});
test('delete without explicit confirmation leaves prior data intact',async()=>{const r=await run([call('import_film_history',{platform:'imdb',csv:'Title,Your Rating\nA,10'}),call('delete_all_my_cinema_data')]);assert.equal(r.responses[1].result.isError,true);assert.equal(JSON.parse(r.data).observations.length,1)});
test('switching platform account cannot silently merge two viewers',async()=>{const r=await run([call('connect_cinema_profile',{platform:'kinopoisk',username:'123'}),call('connect_cinema_profile',{platform:'kinopoisk',username:'456'})]);assert.equal(r.responses[1].result.isError,true);assert.equal(JSON.parse(r.data).profiles[0].handle,'123')});
test('oversized row batch rejected before write',async()=>{const r=await run([call('import_film_history',{platform:'imdb',rows:Array.from({length:1201},()=>({Title:'A'}))})]);assert.equal(r.responses[0].result.isError,true);assert.equal(r.data,null)});
test('watched watchlist entries not offered as pending picks',async()=>{const r=await run([call('import_film_history',{platform:'imdb',source:'watchlist',rows:[{Title:'A',Year:2000}]}),call('import_film_history',{platform:'imdb',rows:[{Title:'A',Year:2000,Rating:9}]}),call('get_cinema_taste_dossier')]);assert.deepEqual(data(r.responses[2]).knownWatchlist,[])});
