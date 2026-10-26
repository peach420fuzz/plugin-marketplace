import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {transformServer} from '../src/release.mjs';
import {solveExtended} from '../src/morphology.mjs';
import {translate} from '../src/locale.mjs';
const baseline=gunzipSync(await readFile(new URL('../recovered/worker-0.4.7.mjs.gz',import.meta.url))).toString();
function load(source,extra=''){return new Function('solveExtended',source.replace(/export \{\s*index_default as default\s*\};/,'')+extra+';return {solveFaceMorphology,createDefaultCharacterState,FakeService,createFakeMcpServer,faceMorphologyAuthoringSchema};')(solveExtended);}
const old=load(baseline),current=load(transformServer(baseline),'function solveFaceMorphology(s){return solveExtended(s,legacyFaceSolver,SEMANTIC_MORPH_KEYS)}');

test('all original solver values remain unchanged for saved v1/v2 characters',()=>{
  for(const solverVersion of ['connected-face-v1','connected-face-v2'])for(let i=0;i<12;i++){
    const state=old.createDefaultCharacterState().facialMorphology;state.solverVersion=solverVersion;
    for(const [j,key]of Object.keys(state.semanticGoals).entries())state.semanticGoals[key]=Math.sin(i+j);
    state.overrides['nose.width']={mode:'fixed',manualOffset:0,fixedValue:0.7};state.overrides['jaw.width']={mode:'adjusted',manualOffset:-0.23};state.apparentAgeYears=18+i*7;
    assert.deepEqual(current.solveFaceMorphology(state),old.solveFaceMorphology(state));
  }
});
test('extended solver produces stronger geometry while fixed overrides remain fixed',()=>{
  const state=current.createDefaultCharacterState().facialMorphology;state.semanticGoals['face.width']=0.7;const legacy=current.solveFaceMorphology(state);state.solverVersion='connected-face-v3';state.overrides['nose.width']={mode:'fixed',manualOffset:0,fixedValue:0.95};const result=current.solveFaceMorphology(state);
  assert.ok(result.solvedMorphs['cheekbones.width']>legacy.solvedMorphs['cheekbones.width']*1.7);assert.equal(result.solvedMorphs['nose.width'],0.95);assert.ok(Object.values(result.solvedMorphs).every(v=>Number.isFinite(v)&&Math.abs(v)<=1));assert.equal(current.faceMorphologyAuthoringSchema.parse(state).solverVersion,'connected-face-v3');
});
test('new projects accept nonneutral semantic brief suggestions',async()=>{
  let stored;const service=new current.FakeService({createProject:async value=>{stored=value;return{project:{state:value.state}};}},null,'https://example.test');
  await service.createProject({description:'Wide jaw, long nose',morphologySeed:{semanticGoals:{'jaw.weight':0.8},morphs:{'nose.length':0.75},apparentAgeYears:46}});
  assert.equal(stored.state.facialMorphology.solverVersion,'connected-face-v3');assert.equal(stored.state.identity.semanticMorphs['nose.length'],0.75);assert.ok(stored.state.identity.semanticMorphs['jaw.width']>0.8);assert.equal(stored.state.surface.agePresentation,46);
});
test('foreign references are rejected before any state write',async()=>{
  let writes=0;const service=new current.FakeService({getProject:async()=>({projectId:'project-a',currentVersion:1,state:current.createDefaultCharacterState()}),getReferenceAsset:async()=>({projectId:'project-b'}),updateState:async()=>{writes++;}},null,'https://example.test');
  await assert.rejects(service.applyPatch({projectId:'project-a',projectKey:'private',expectedVersion:1,patch:{identity:{sourceReferenceAssetId:'reference-id'}}}),/does not belong/);assert.equal(writes,0);
});
test('Russian UI translates controls and generated statuses without changing English prompts',()=>{
  assert.equal(translate('GENERATE PORTRAIT','ru'),'СОЗДАТЬ ПОРТРЕТ');assert.equal(translate('Nose width','ru'),'Ширина носа');assert.equal(translate('Character State v8 saved.','ru'),'Состояние v8 сохранено.');assert.equal(translate('Nose width','en'),'Nose width');
});
