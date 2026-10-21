// Regression for actual review preparation defects. Synthetic text fixtures only.
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker from '../worker.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const live=process.argv.includes('--live');
let count=0;async function call(name,args){const request=new Request('https://remake.objekts.ai/mcp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++count,method:'tools/call',params:{name,arguments:args}})});const response=live?await fetch(request,{signal:AbortSignal.timeout(20000)}):await worker.fetch(request,{});assert.equal(response.status,200);return (await response.json()).result;}
const shot={id:'S1',action:'Caretaker turns off the light',source_ids:[],camera:'static',sound:'silence'};
const base={title:'Last Light',materials:[],shots:[shot],locks:[{key:'CAMERA',value:'static'}]};
let tests=0;
const valid=await call('compile_portable_director_packet',base);assert.equal(valid.isError,false);assert.equal(valid.structuredContent.approvals,'UNVERIFIED');assert.equal(valid.structuredContent.studio_handoff,'NOT_REQUESTED');assert.equal(valid.structuredContent.sent,false);tests++;
for(const key of ['CAMERA',' camera ','Camera']){const r=await call('compile_portable_director_packet',{...base,locks:[{key,value:'static'}],shots:[{...shot,camera:'dolly'}]});assert.equal(r.isError,true);assert.match(r.content[0].text,/conflicts with LOCK/);tests++;}
const sound=await call('compile_portable_director_packet',{...base,locks:[{key:'SOUND',value:'silence'}],shots:[{...shot,sound:'orchestra'}]});assert.equal(sound.isError,true);tests++;
for(const name of ['compile_portable_director_packet','check_explicit_project_locks']){const args=name==='check_explicit_project_locks'?{locks:[{key:'CAMERA',value:'static'},{key:' camera ',value:'dolly'}],proposed_changes:[]}:{...base,locks:[{key:'CAMERA',value:'static'},{key:' camera ',value:'dolly'}]};const r=await call(name,args);assert.equal(r.isError,true);assert.match(r.content[0].text,/contradictory LOCK/);tests++;}
const dupe=await call('compile_portable_director_packet',{...base,shots:[shot,{...shot}]});assert.equal(dupe.isError,true);assert.match(dupe.content[0].text,/duplicate shot/);tests++;
const matching=await call('check_explicit_project_locks',{locks:[{key:'CAMERA',value:'static'},{key:' camera ',value:'static'}],proposed_changes:[{key:'camera',new_value:'static'}]});assert.equal(matching.isError,false);assert.equal(matching.structuredContent.allow_edit,true);tests++;
const made=await call('remake_project_create',{project_id:'review',title:'Last Light'});let p=made.structuredContent.project;
for(const [event_id,kind,payload] of [['s1','shot_add',{id:'S1',status:'PROPOSED',source_ids:[],fields:{camera:'static'},visible_action:'Turn off light',entry:'Empty theatre',exit:'Dark',cut:'On gesture',sound:'Proposed silence'}],['s2','shot_field_set',{shot_id:'S1',field:'camera',value:'static wide'}]]){const r=await call('remake_project_apply_delta',{project:p,event:{event_id,expected_revision:p.revision,kind,payload,actor_claim:'MODEL'}});assert.equal(r.isError,false);p=r.structuredContent.project;}
assert.equal(p.revision,3);assert.equal(p.shots[0].status,'PROPOSED');assert.equal(p.shots[0].fields.camera,'static wide');assert.equal((await call('remake_project_validate',{project:p})).structuredContent.ok,true);tests++;
const oldEvent=await call('remake_project_apply_delta',{project:p,event:{event_id:'rename',expected_revision:p.revision,kind:'title_set',payload:{title:'Different'}}});assert.equal(oldEvent.isError,true);tests++;
console.log(JSON.stringify({suite:'Submission contract and portable author constraints',passed:tests,total:tests,synthetic:true,transport:live?'REAL_PUBLIC_HTTP':'NODE_IN_MEMORY',host_model_routing_tested:false,independent_director_quality_tested:false}));
