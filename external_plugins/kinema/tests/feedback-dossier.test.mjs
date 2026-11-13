// Synthetic fixtures only. No cinema service, network or real viewer data is used.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const server=fileURLToPath(new URL('../server/mcp-stdio.mjs',import.meta.url));
const call=(name,args={})=>({method:'tools/call',params:{name,arguments:args}});
const verdict=(title,kind,year=2010)=>call('save_film_verdict',{title,year,verdict:kind});
const inspect=()=>call('get_cinema_taste_dossier',{includeHistory:true});
const importRows=(source,rows)=>call('import_film_history',{platform:'imdb',source,rows});
const candidate=(title='Fixture A',year=2010)=>({title,year,director:'Synthetic fixture',sources:[],connections:[],productiveDifference:'QA only'});
const rank=(title='Fixture A',year=2010)=>call('rank_researched_films',{mode:'discovery',candidates:[candidate(title,year)]});
const unwrap=r=>{assert.equal(r.result.isError,false,r.result.content[0].text);return JSON.parse(r.result.content[0].text)};
async function run(messages,seed=null){
 const dir=await mkdtemp(path.join(tmpdir(),'kinema-feedback-'));const file=path.join(dir,'archive.json');
 try {
  if(seed)await writeFile(file,JSON.stringify(seed),{mode:0o600});
  const child=spawn(process.execPath,[server],{env:{...process.env,CINEMA42_DATA_FILE:file},stdio:['pipe','pipe','pipe']});
  let out='',err='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>err+=b);
  const end=new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve)});
  const timer=setTimeout(()=>child.kill(),10000);
  child.stdin.end(messages.map((m,i)=>JSON.stringify({jsonrpc:'2.0',id:i+1,...m})).join('\n')+'\n');
  let code;try{code=await end}finally{clearTimeout(timer)}
  assert.equal(code,0,err);return {responses:out.trim().split('\n').map(JSON.parse),stored:await readFile(file,'utf8').catch(()=>null)};
 } finally {await rm(dir,{recursive:true,force:true})}
}
test('feedback-only watchlist is present in the dossier',async()=>{
 const r=await run([verdict('Fixture A','watchlist'),inspect()]);const d=unwrap(r.responses[1]);
 assert.deepEqual(d.knownWatchlist.map(f=>f.title),['Fixture A']);assert.equal(d.knownWatchlist[0].provenance.includes('user-reported-watchlist'),true);
 assert.equal(d.counts.observations,0);assert.equal(d.counts.rated,0);assert.equal(d.counts.watched,0);
});
test('watchlist counts separate imported evidence from user feedback',async()=>{
 const r=await run([verdict('Fixture A','watchlist'),inspect()]);const d=unwrap(r.responses[1]);
 assert.equal(d.counts.watchlist,1);assert.equal(d.watchlistCoverage.imported,0);assert.equal(d.watchlistCoverage.known,1);
 assert.equal(d.watchlistCoverage.eligible,1);assert.equal(d.watchlistCoverage.returned,1);assert.equal(d.watchlistCoverage.completeExternalWatchlistVerified,false);
});
test('research brief sees the same feedback watchlist as the dossier',async()=>{
 const r=await run([verdict('Fixture A','want-to-watch'),inspect(),call('plan_deep_film_research',{count:6})]);
 assert.equal(unwrap(r.responses[1]).counts.watchlist,1);assert.equal(unwrap(r.responses[2]).knownSample.watchlist,1);
});
test('explicit seen feedback removes an imported watchlist item from pending picks',async()=>{
 const r=await run([importRows('watchlist',[{Title:'Fixture A',Year:2010}]),verdict('Fixture A','seen'),inspect(),rank()]);
 const d=unwrap(r.responses[2]);assert.deepEqual(d.knownWatchlist,[]);assert.equal(d.counts.watched,1);
 assert.equal(unwrap(r.responses[3]).rejected[0].reason,'already_watched');
});
test('seen then watchlist preserves the watched fact',async()=>{
 const r=await run([verdict('Fixture A','seen'),verdict('Fixture A','watchlist'),inspect(),rank()]);
 assert.deepEqual(unwrap(r.responses[2]).knownWatchlist,[]);assert.equal(unwrap(r.responses[3]).rejected[0].reason,'already_watched');
 assert.equal(JSON.parse(r.stored).feedback[0].seen,true);
});
test('legacy seen feedback is retained after a later preference update',async()=>{
 const seed={schema:1,profiles:[],observations:[],feedback:[{title:'Fixture A',year:2010,verdict:'seen',createdAt:'2026-01-01T00:00:00Z'}]};
 const r=await run([verdict('Fixture A','want-to-watch'),inspect(),rank()],seed);
 assert.equal(unwrap(r.responses[1]).counts.watched,1);assert.equal(unwrap(r.responses[2]).rejected[0].reason,'already_watched');
});
test('hit and miss feedback alone do not manufacture a rating or watched observation',async()=>{
 const r=await run([verdict('Fixture A','hit'),verdict('Fixture B','miss'),inspect()]);const d=unwrap(r.responses[2]);
 assert.equal(d.counts.watched,0);assert.equal(d.counts.rated,0);assert.equal(d.counts.observations,0);
});
test('imported watchlist and matching feedback have one membership',async()=>{
 const r=await run([importRows('watchlist',[{Title:'Fixture A',Year:2010}]),verdict('Fixture A','watchlist'),inspect()]);
 const d=unwrap(r.responses[2]);assert.equal(d.counts.watchlist,1);assert.equal(d.knownWatchlist.length,1);
 assert.equal(d.watchlistCoverage.imported,1);assert.equal(d.watchlistCoverage.known,1);
});
test('known remake years remain distinct',async()=>{
 const r=await run([verdict('Fixture A','seen',1960),verdict('Fixture A','watchlist',2010),inspect()]);
 const d=unwrap(r.responses[2]);assert.equal(d.counts.watched,1);assert.deepEqual(d.knownWatchlist.map(f=>f.year),[2010]);
});
test('negative feedback matches a verified imported title alias',async()=>{
 const r=await run([importRows('ratings',[{Title:'Localized fixture','Original Title':'Original fixture',Year:2010,Rating:10}]),verdict('Original fixture','miss'),inspect()]);
 assert.deepEqual(unwrap(r.responses[2]).positiveAnchors,[]);
});
test('feedback miss leaves library membership while excluding the pending recommendation',async()=>{
 const r=await run([importRows('watchlist',[{Title:'Fixture A',Year:2010}]),verdict('Fixture A','miss'),inspect()]);
 const d=unwrap(r.responses[2]);assert.equal(d.counts.watchlist,1);assert.equal(d.counts.watched,0);assert.deepEqual(d.knownWatchlist,[]);
});
test('a read-only dossier does not rewrite a legacy archive',async()=>{
 const seed={schema:1,profiles:[],observations:[],feedback:[{title:'Fixture A',year:2010,verdict:'watchlist'}]};
 const r=await run([inspect(),inspect()],seed);assert.equal(r.stored,JSON.stringify(seed));assert.deepEqual(unwrap(r.responses[0]),unwrap(r.responses[1]));
});
test('existing verdict type guard rejects malformed reason without writes',async()=>{
 const r=await run([call('save_film_verdict',{title:'Fixture A',verdict:'watchlist',reason:{bad:true}})]);
 assert.equal(r.responses[0].result.isError,true);assert.equal(r.stored,null);
});
test('pending watchlist output is capped and states returned coverage',async()=>{
 const rows=Array.from({length:401},(_,i)=>({Title:`Fixture ${i}`,Year:2010}));
 const r=await run([importRows('watchlist',rows),inspect()]);const d=unwrap(r.responses[1]);
 assert.equal(d.counts.watchlist,401);assert.equal(d.knownWatchlist.length,400);assert.equal(d.watchlistCoverage.eligible,401);assert.equal(d.watchlistCoverage.returned,400);
});
test('an original-title alias matches watched evidence whose year is missing',async()=>{
 const r=await run([importRows('ratings',[{Title:'Original fixture',Rating:9}]),
 call('rank_researched_films',{candidates:[{...candidate('Localized fixture'),originalTitle:'Original fixture'}]})]);
 assert.equal(unwrap(r.responses[1]).rejected[0].reason,'possible_prior_viewing_identity_unverified');
});
test('conflicting stable IDs override title alias similarity',async()=>{
 const r=await run([importRows('ratings',[{Title:'Original fixture',Rating:9,imdbID:'tt0000001'}]),
 call('rank_researched_films',{candidates:[{...candidate('Localized fixture'),originalTitle:'Original fixture',imdbId:'tt0000002'}]})]);
 assert.equal(unwrap(r.responses[1]).rejected[0].reason,'insufficient_credited_film_research');
});
test('negative feedback applies to an undated known title alias',async()=>{
 const r=await run([importRows('ratings',[{Title:'Localized fixture','Original Title':'Original fixture',Rating:10}]),
 verdict('Original fixture','miss'),inspect()]);assert.deepEqual(unwrap(r.responses[2]).positiveAnchors,[]);
});
test('string seen flag from a malformed legacy archive does not create viewing evidence',async()=>{
 const seed={schema:1,profiles:[],observations:[],feedback:[{title:'Fixture A',year:2010,verdict:'watchlist',seen:'true'}]};
 const r=await run([inspect()],seed);assert.equal(unwrap(r.responses[0]).counts.watched,0);
});
