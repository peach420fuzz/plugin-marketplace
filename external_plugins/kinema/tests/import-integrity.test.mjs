// Input-integrity tests use synthetic rows and temporary storage only.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeObservation,parseCsv} from '../server/taste-engine.mjs';
const server=fileURLToPath(new URL('../server/mcp-stdio.mjs',import.meta.url));
async function run(rows){
 const dir=await mkdtemp(path.join(tmpdir(),'kinema-import-'));const file=path.join(dir,'archive.json');
 const proc=spawn(process.execPath,[server],{env:{...process.env,CINEMA42_DATA_FILE:file},stdio:['pipe','pipe','pipe']});let out='',err='';proc.stdout.on('data',x=>out+=x);proc.stderr.on('data',x=>err+=x);
 const ended=new Promise((resolve,reject)=>{proc.once('error',reject);proc.once('close',resolve)});const timer=setTimeout(()=>proc.kill('SIGKILL'),10000);
 proc.stdin.end(JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'import_film_history',arguments:{platform:'imdb',rows}}})+'\n');
 try{assert.equal(await ended,0,err);return{result:JSON.parse(out).result,stored:await readFile(file,'utf8').catch(()=>null)}}finally{clearTimeout(timer);await rm(dir,{recursive:true,force:true})}
}
for(const value of [{wrong:'title'},true,1984])test(`nonstring title ${typeof value} cannot become a watched film`,()=>assert.equal(normalizeObservation({Title:value,Rating:8},'imdb'),null));
test('numeric text remains a legitimate film title',()=>assert.equal(normalizeObservation({Title:'1984',Rating:8},'imdb').title,'1984'));
for(const value of ['garbled',-1,11])test(`explicit invalid IMDb rating ${value} is rejected instead of inferred as watched`,()=>assert.equal(normalizeObservation({Title:'Synthetic',Rating:value},'imdb'),null));
test('blank rating retains the existing allowed unrated observation behavior',()=>{const r=normalizeObservation({Title:'Synthetic',Rating:''},'imdb');assert.equal(r.rating,null);assert.equal(r.kind,'watched')});
test('all-invalid import produces no archive',async()=>{const r=await run([{Title:{broken:true},Rating:8},{Title:'Synthetic',Rating:'wrong'}]);assert.equal(r.result.isError,true);assert.equal(r.stored,null)});
test('mixed input reports rejected indexes and saves only valid records',async()=>{const r=await run([{Title:'Valid fixture',Rating:8},{Title:{broken:true},Rating:9},{Title:'Broken rating',Rating:99}]);assert.equal(r.result.isError,false);const result=JSON.parse(r.result.content[0].text);assert.equal(result.accepted,1);assert.equal(result.rejected,2);assert.deepEqual(result.rejectedRowIndexes,[1,2]);assert.equal(JSON.parse(r.stored).observations.length,1)});
test('duplicate semantic CSV headings fail before ambiguous field replacement',()=>assert.throws(()=>parseCsv('Title, title ,Rating\nFirst,Second,8\n'),/duplicate/i));
test('final CSV record without newline still obeys the row limit',()=>assert.throws(()=>parseCsv('Title\nOne\nTwo',1),/row limit/i));

test('explicit impossible release year cannot enter a film-history import',()=>{
 assert.equal(normalizeObservation({Title:'Film X',Year:'2205',Rating:'9'},'imdb','ratings'),null);
 assert.equal(normalizeObservation({Title:'Film X',Year:'nineteen eighty',Rating:'9'},'imdb','ratings'),null);
 assert.equal(normalizeObservation({Title:'Film X',Rating:'9'},'imdb','ratings')?.year,null);
});
