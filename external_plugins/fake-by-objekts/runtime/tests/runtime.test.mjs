import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {DatabaseSync} from 'node:sqlite';
import {transformServer} from '../src/release.mjs';
import {solveExtended} from '../src/morphology.mjs';
import {translate} from '../src/locale.mjs';
const baseline=gunzipSync(await readFile(new URL('../recovered/worker-0.4.7.mjs.gz',import.meta.url))).toString();
function load(source,extra=''){return new Function('solveExtended',source.replace(/export \{\s*index_default as default\s*\};/,'')+extra+';return {solveFaceMorphology,createDefaultCharacterState,FakeService,FakeD1Store,createFakeMcpServer,faceMorphologyAuthoringSchema,handleFakeMcpRequest};')(solveExtended);}
const old=load(baseline),current=load(transformServer(baseline),'function solveFaceMorphology(s){return solveExtended(s,legacyFaceSolver,SEMANTIC_MORPH_KEYS)}');
const bridgeSource=await readFile(new URL('../src/server-handoff.mjs',import.meta.url),'utf8');
const bridge=load(transformServer(baseline),bridgeSource+'\nfunction solveFaceMorphology(s){return solveExtended(s,legacyFaceSolver,SEMANTIC_MORPH_KEYS)}');

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

test('actual MCP tool passes structured brief suggestions into project creation',async()=>{
  let passed;const service={createProject:async value=>{passed=value;return {projectKey:'not-shown',project:{title:'test',status:'CONFIGURED',currentVersion:1,state:current.createDefaultCharacterState()}};}};
  const morphologySeed={morphs:{'nose.width':0.8}};
  const response=await bridge.handleFakeMcpRequest(new Request('https://example.test/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'open_character_studio',arguments:{description:'Wide nose',morphologySeed}}})}),service,'https://example.test');
  const result=await response.json();assert.equal(result.error,undefined);assert.equal(result.result.isError,undefined);assert.deepEqual(passed.morphologySeed,morphologySeed);
});

test('MCP lists the short-lived image reader to the model and keeps preparation app-only',async()=>{
  const response=await bridge.handleFakeMcpRequest(new Request('https://example.test/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:2,method:'tools/list'})}),{},'https://example.test');
  const result=await response.json();const tools=result.result.tools;
  assert.equal(tools.length,8);assert.deepEqual(tools.find(t=>t.name==='prepare_portrait_request')._meta.ui.visibility,['app']);assert.deepEqual(tools.find(t=>t.name==='read_portrait_request')._meta.ui.visibility,['model']);
});

test('selected Master persists and is reused with exact bytes after a render edit (local SQLite/R2)',async()=>{
  const db=new DatabaseSync(':memory:');db.exec(await readFile(new URL('../recovered/schema.sql',import.meta.url),'utf8'));
  const d1={prepare(sql){let values=[];return {bind(...args){values=args;return this;},async first(){return db.prepare(sql).get(...values)??null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){const result=db.prepare(sql).run(...values);return {success:true,meta:{changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid)}};}};},async batch(statements){db.exec('BEGIN');try{const result=[];for(const statement of statements)result.push(await statement.run());db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}}};
  const saved=new Map();const assets={async put(key,value,options){saved.set(key,{bytes:typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value),httpMetadata:options?.httpMetadata});},async get(key){const item=saved.get(key);return item?{httpMetadata:item.httpMetadata,arrayBuffer:async()=>item.bytes.slice().buffer,json:async()=>JSON.parse(new TextDecoder().decode(item.bytes))}:null;}};
  const service=new bridge.FakeService(new bridge.FakeD1Store(d1),assets,'https://local.test');
  const created=await service.createProject({description:'fictional adult test'}),credentials={projectId:created.project.projectId,projectKey:created.projectKey};
  const master=process.env.FAKE_LOCAL_MASTER_FILE?await readFile(process.env.FAKE_LOCAL_MASTER_FILE):Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
  await service.approveIdentityMaster({...credentials,expectedVersion:1,selection:'EXPLICIT_STUDIO_FILE_SELECTION',fileName:'selected-local-test.png',dataUrl:'data:image/png;base64,'+master.toString('base64')});
  const first=await service.getProject(credentials);assert.ok(first.identityMasterOutputId);assert.equal(first.outputs.length,1);
  await service.applyPatch({...credentials,expectedVersion:1,patch:{capture:{view:'PROFILE'}},source:'LOCAL_INTEGRATION'});
  const second=await service.getProject(credentials);assert.equal(second.identityMasterOutputId,first.identityMasterOutputId);
  const response=await bridge.handleFakeMcpRequest(new Request('https://local.test/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:9,method:'tools/call',params:{name:'prepare_portrait_request',arguments:{...credentials,expectedVersion:2,geometryDataUrl:'data:image/png;base64,'+master.toString('base64'),prompt:'Generate one profile portrait of this fictional adult identity.'}}})}),service,'https://local.test');
  const prepared=await response.json();assert.ok(!prepared.result.isError);const request=prepared.result.structuredContent;
  const read=await bridge.handleFakeMcpRequest(new Request('https://local.test/mcp',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:10,method:'tools/call',params:{name:'read_portrait_request',arguments:{requestId:request.requestId,requestToken:request.requestToken}}})}),service,'https://local.test');
  const result=await read.json();assert.ok(!result.result.isError);const images=result.result.content.filter(item=>item.type==='image');assert.equal(images.length,2);assert.deepEqual(Buffer.from(images[0].data,'base64'),master);assert.equal(result.result.structuredContent.imageGenerationPerformed,false);db.close();
});
