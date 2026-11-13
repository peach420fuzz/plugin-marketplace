import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDossier,filmIdentity,rankResearchedCandidates,buildPersonalDossier} from '../server/taste-engine.mjs';
const observation=(title,year,imdbId,other={})=>({title,year,imdbId,kind:'rated',rating:8,...other});
test('same original title+year with different verified IMDb IDs remain distinct after unidentified record',()=>{
 const x=buildDossier([
  observation('A',2000,null),
  observation('A',2000,'tt0000001'),
  observation('A',2000,'tt0000002')]);
 assert.equal(x.counts.unique,3, 'two strong IDs and one unresolved title-only observation must remain separate');
});
test('same localized title+year with distinct confirmed TMDB identifiers remain separate',()=>{
 const x=buildDossier([
  {title:'Shared',year:2000,kind:'rated',rating:8},
  {title:'Shared',year:2000,tmdbId:'301',kind:'rated',rating:8},
  {title:'Shared',year:2000,tmdbId:'302',kind:'rated',rating:8}]);
 assert.equal(x.counts.unique,3);
 assert.equal(x.counts.identityAmbiguities,1);
});
test('identifier-free observation remains unresolved regardless of import ordering',()=>{
 const strong1=observation('Shared',2000,'tt0000001');
 const strong2=observation('Shared',2000,'tt0000002');
 const unkeyed=observation('Shared',2000,null);
 for (const order of [[strong1,strong2,unkeyed],[unkeyed,strong2,strong1],[strong2,unkeyed,strong1]]){
  const d=buildDossier(order);
  assert.equal(d.counts.unique,3);
  assert.equal(d.counts.identityAmbiguities,1);
  assert.equal(d.all.filter(x=>x.imdbId).length,2);
 }
});
test('non-text title is not a candidate identity',()=>{
 assert.equal(filmIdentity({title:{name:'A'}}),null);
 assert.equal(filmIdentity({title:['A']}),null);
 assert.equal(filmIdentity({title:1234}),null);
});
test('same title with no source year does not certify candidate as watched',()=>{
 const d=buildDossier([observation('Clown',null,null)]);
 d.positiveAnchors=[];
 const result=rankResearchedCandidates(d,[{title:'Clown',year:2014,director:'Director',tasteFacet:'a',sources:[],connections:[],productiveDifference:'different'}]);
 assert(!result.rejected.some(x=>x.reason==='already_watched'), 'wildcard title is an ambiguous identity, not a verified watch');
});

test('a translated title shared by separate strong IDs never absorbs unidentified ratings',()=>{
 const d=buildDossier([
  {title:'Film A',originalTitle:'Shared translated name',year:2000,imdbId:'tt0000001',kind:'rated',rating:9},
  {title:'Shared translated name',year:2000,imdbId:'tt0000002',kind:'rated',rating:4},
  {title:'Shared translated name',year:2000,kind:'rated',rating:8}
 ]);
 assert.equal(d.counts.unique,3);
 assert.equal(d.counts.identityAmbiguities,1);
 assert.equal(d.all.find(x=>x.imdbId==='tt0000001').rating,9);
 assert.equal(d.all.find(x=>x.imdbId==='tt0000002').rating,4);
});

test('unknown-year watchlist feedback does not certify a particular named remake',()=>{
 const d=buildPersonalDossier([], [{title:'A Common Title',verdict:'watchlist'}]);
 assert.equal(d.all.length,1);
 const source={title:'A Common Title',year:2015,director:'Director',tasteFacet:'a',sources:[],connections:[],productiveDifference:'different'};
 const ranked=rankResearchedCandidates(d,[source],1,{mode:'watchlist'});
 assert.equal(ranked.rejected[0].reason,'possible_watchlist_identity_unverified');
});

test('ambiguous feedback does not attach a watchlist to one identified remake',()=>{
 const d=buildPersonalDossier([
  {title:'A Common Title',year:1999,imdbId:'tt0012345',kind:'rated',rating:9},
  {title:'A Common Title',year:2015,imdbId:'tt0098765',kind:'watched'}
 ],[{title:'A Common Title',verdict:'watchlist'}]);
 assert.equal(d.counts.unique,3);
 assert.equal(d.all.filter(x=>x.watchlist && x.year!==null).length,0);
});

test('feedback without year cannot be called verified rejection of a remake',()=>{
 const d=buildPersonalDossier([], [{title:'A Common Title',verdict:'miss'}]);
 const c={title:'A Common Title',year:2015,director:'Director',tasteFacet:'a',sources:[],connections:[],productiveDifference:'different'};
 const result=rankResearchedCandidates(d,[c]);
 assert.equal(result.rejected[0].reason,'possible_prior_feedback_identity_unverified');
});

test('undated ambiguous dislike never erases two identified high-rating anchors',()=>{
 const d=buildPersonalDossier([
  {title:'Film 1',originalTitle:'Alias',year:null,imdbId:'tt0000001',rating:10,kind:'rated'},
  {title:'Film 2',originalTitle:'Alias',year:null,imdbId:'tt0000002',rating:10,kind:'rated'}
 ],[{title:'Alias',verdict:'miss'}]);
 assert.equal(d.positiveAnchors.length,2);
});

test('canonical identity remains stable when IMDb and TMDB observations arrive in reverse order',()=>{
 const tmdb={title:'Film A',year:2000,tmdbId:'501',kind:'rated',rating:8};
 const both={title:'Film A',year:2000,imdbId:'tt0000501',tmdbId:'501',kind:'liked',liked:true};
 for(const rows of [[tmdb,both],[both,tmdb]]){
  const dossier=buildDossier(rows);
  assert.equal(dossier.counts.unique,1);
  assert.equal(dossier.all[0].id,'imdb:tt0000501');
 }
});
