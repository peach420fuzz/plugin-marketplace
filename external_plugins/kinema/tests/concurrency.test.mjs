import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile, stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const server=fileURLToPath(new URL('../server/mcp-stdio.mjs',import.meta.url));
function tool(name,args){return {jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}};}
function run(file,msg){return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,[server],{env:{...process.env,CINEMA42_DATA_FILE:file},stdio:['pipe','pipe','pipe']});
 let output='',errors='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>errors+=d);
 const timer=setTimeout(()=>{child.kill();reject(new Error('MCP timeout'))},15000);
 child.on('error',reject);child.on('exit',code=>{
  clearTimeout(timer);
  try {assert.equal(code,0,errors);resolve(JSON.parse(output.trim().split('\n').at(-1)));}
  catch(e){reject(e);}
 });
 child.stdin.end(JSON.stringify(msg)+'\n');
});}
const value=(resp)=>{assert.equal(resp.result.isError,false,resp.result.content[0].text);return JSON.parse(resp.result.content[0].text)};

test('simultaneous independent Claude/Gemini-style writers preserve every film',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'kinema-multiprocess-'));const file=path.join(folder,'history.json');
 try{
  const writers=Array.from({length:6},(_,w)=>{
   const rows=Array.from({length:120},(_,i)=>({Title:`Writer${w}-Film${i}`,Year:2001,Rating:8}));
   return run(file,tool('import_film_history',{platform:'imdb',source:'ratings',rows}));
  });
  const results=await Promise.all(writers);
  for(const r of results) assert.equal(value(r).accepted,120);
  const archive=JSON.parse(await readFile(file,'utf8'));
  assert.equal(archive.observations.length,720);
  assert.equal(new Set(archive.observations.map(o=>o.title)).size,720);
  assert.equal((await stat(file)).mode&0o777,0o600);
  assert.equal((await run(file,tool('get_cinema_taste_dossier',{includeHistory:false}))).result.isError,false);
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('invalid writes do not poison subsequent mutations',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'kinema-rollback-'));const file=path.join(folder,'history.json');
 try{
  const bad=await run(file,tool('import_film_history',{platform:'kinopoisk',rows:{bad:1}}));
  assert.equal(bad.result.isError,true);
  const good=await run(file,tool('import_film_history',{platform:'imdb',source:'ratings',rows:[{Title:'Good',Rating:10}]}));
  assert.equal(value(good).accepted,1);
  const a=JSON.parse(await readFile(file,'utf8'));assert.equal(a.observations.length,1);
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('stale client refreshes after a second process changes the shared archive',async()=>{
 const folder=await mkdtemp(path.join(tmpdir(),'kinema-refresh-'));const file=path.join(folder,'history.json');
 const child=spawn(process.execPath,[server],{env:{...process.env,CINEMA42_DATA_FILE:file},stdio:['pipe','pipe','pipe']});
 let output='',stderr='',lineWaiting=null;const queued=[];
 child.stderr.on('data',d=>stderr+=d);
 child.stdout.on('data',d=>{output+=d;let i;while((i=output.indexOf('\n'))>=0){
  const row=output.slice(0,i);output=output.slice(i+1);
  if(lineWaiting){const resolve=lineWaiting;lineWaiting=null;resolve(JSON.parse(row));}else queued.push(JSON.parse(row));
 }});
 let id=0;
 async function ask(name,args){
  const promise=new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('MCP response timeout')),5000);
   const settled=message=>{clearTimeout(timeout);resolve(message);};
   if(queued.length)settled(queued.shift());else lineWaiting=settled;
  });
  child.stdin.write(JSON.stringify({...tool(name,args),id:++id})+'\n');
  return value(await promise);
 }
 try {
  const original=await ask('get_cinema_taste_dossier',{});
  assert.equal(original.counts.observations,0);
  await run(file,tool('import_film_history',{platform:'imdb',rows:[{Title:'Added by other LLM',Rating:9}]}));
  const result=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('MCP response timeout')),5000);
   lineWaiting=(message)=>{clearTimeout(timer);resolve(message);};
   child.stdin.write(JSON.stringify({...tool('get_cinema_taste_dossier',{expectedSnapshot:original.archiveSnapshot}),id:++id})+'\n');
  });
  assert.equal(result.result.isError,true);
  assert.match(result.result.content[0].text,/Archive snapshot changed/);
  const updated=await ask('get_cinema_taste_dossier',{});
  assert.equal(updated.counts.observations,1);
  assert.notEqual(updated.archiveSnapshot,original.archiveSnapshot);
 }finally{child.stdin.end();await new Promise(resolve=>child.on('exit',resolve));await rm(folder,{recursive:true,force:true});}
});
