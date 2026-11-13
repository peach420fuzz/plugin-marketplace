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
