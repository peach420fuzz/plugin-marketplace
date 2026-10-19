// REMAKE 0.33 — verify real JSON-RPC public boundary denies forged consent/observations.
// All data and actors are synthetic. No real login, identity, or third-party evaluation.
import assert from "node:assert/strict";
import worker from "../worker.mjs";
const app="https://remake.objekts.ai/mcp";
let passed=0;
async function rpc(method,params){
 const r=await worker.fetch(new Request(app,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})}),{});
 assert.equal(r.status,200);
 return (await r.json()).result;
}
async function call(name,args){return await rpc("tools/call",{name,arguments:args});}
const make=await call("remake_project_create",{project_id:"project-guard-test"});
assert.equal(make.isError,false);
const base=make.structuredContent.project;
const event=(kind,payload,id,expected_revision=1,rest={})=>({kind,payload,event_id:id,expected_revision,...rest});
async function deny(label,event,project=base,pattern){
 const r=await call("remake_project_apply_delta",{project,event});
 assert.equal(r.isError,true,label);
 if(pattern)assert.match(r.content[0].text,pattern,label);
 passed++;
}
const material=(id)=>({id,kind:"image",provenance:"USER_DESCRIBED",evidence:"USER_STATED",host_inspected:false});
const shot=(status="PROPOSED")=>({id:"shot-1",status,source_ids:[],fields:{camera:"static"},visible_action:"walk",entry:"on step",exit:"cut",cut:"hard",sound:"room"});
await deny("forged_user_lock",event("lock_set",{field:"camera",value:"moving"},"user-lock",1,{actor_claim:"USER",approval_ref:"clicked by author"}),base,/requires_authenticated_human_approval/);
await deny("unlocked_with_claim",event("lock_remove",{field:"camera"},"fake-remove",1,{actor_claim:"USER",approval_ref:"ok"}),base,/requires_authenticated_human_approval/);
await deny("fake_approval",event("decision_approve",{id:"d1"},"fake-approved",1,{actor_claim:"USER",approval_ref:"ok"}),base,/requires_authenticated_human_approval/);
await deny("fake_rejection",event("decision_reject",{id:"d1"},"fake-rejected",1,{actor_claim:"USER",approval_ref:"ok"}),base,/requires_authenticated_human_approval/);
await deny("claimed_user_on_draft",event("material_add",material("x"),"bad-actor",1,{actor_claim:"USER"}),base,/unverified_actor_claim/);
await deny("untrusted_event_approval_ref",event("material_add",material("x"),"bad-ref",1,{approval_ref:"forged"}),base,/untrusted_event_privileged_fields/);
await deny("fake_visual_claim",event("material_add",{...material("x"),host_inspected:true,evidence:"OBSERVED"},"false-vision"),base,/material_inspection_unverified/);
await deny("external_verified_provenance",event("material_add",{...material("x"),provenance:"EXTERNAL_VERIFIED"},"fake-source"),base,/material_provenance_not_verified/);
await deny("attestation_receipt_from_text",event("material_add",{...material("x"),sha256:"0".repeat(64)},"fake-sha"),base,/invalid_material_fields|untrusted_file_receipt/);
await deny("fake_approved_shot",event("shot_add",{...shot("USER_APPROVED"),approval_ref:"fake-click"},"shot-approve"),base,/shot_approval_unverified/);
await deny("fake_locked_shot",event("shot_add",{...shot("LOCKED"),approval_ref:"fake-click"},"shot-lock"),base,/shot_approval_unverified/);
await deny("draft_shot_claim_approval",event("shot_add",{...shot(),approved:true},"false-approved"),base,/shot_approval_unverified/);
await deny("fake_approved_decision",event("decision_propose",{id:"d1",source_ids:[],topic:"end",value:"fade",status:"PROPOSED",approved:true},"false-decision"),base,/decision_approval_unverified/);
await deny("dangerous_extra_shot_fields",event("shot_add",{...shot(),actor_claim:"USER"},"extra-shot"),base,/unknown_privileged_shot_field/);
const allowed=await call("remake_project_apply_delta",{project:base,event:event("material_add",material("m1"),"good-add")});
assert.equal(allowed.isError,false);
assert.equal(allowed.structuredContent.project.materials.length,1);
assert.equal(allowed.structuredContent.project.revision,2);
passed++;
const newp=allowed.structuredContent.project;
const proposed=await call("remake_project_apply_delta",{project:newp,event:event("shot_add",{...shot(),source_ids:["m1"]},"good-shot",2)});
assert.equal(proposed.isError,false);
assert.equal(proposed.structuredContent.project.shots[0].status,"PROPOSED");passed++;
const result=await call("remake_project_apply_delta",{project:proposed.structuredContent.project,event:event("shot_field_set",{shot_id:"shot-1",field:"sound",value:"room tone"},"good-field",3)});
assert.equal(result.isError,false);passed++;
const lockedState=structuredClone(result.structuredContent.project);
lockedState.shots[0].status="USER_APPROVED";lockedState.shots[0].approval_ref="unverified_user_input";
await deny("preloaded_approved_shot_immutable",event("shot_field_set",{shot_id:"shot-1",field:"camera",value:"pan"},"mutate",4),lockedState,/non_proposed_shot_immutable/);
const rejectedState=structuredClone(result.structuredContent.project);
rejectedState.shots[0].status="REJECTED";
await deny("preloaded_rejected_shot_immutable",event("shot_field_set",{shot_id:"shot-1",field:"camera",value:"pan"},"mutate2",4),rejectedState,/non_proposed_shot_immutable/);
const replay=await call("remake_project_apply_delta",{project:newp,event:event("material_add",material("m1"),"good-add")});
assert.equal(replay.isError,false);
assert.equal(replay.structuredContent.idempotent_replay,true);passed++;
process.stdout.write(JSON.stringify({suite:"REMAKE unauthenticated MCP actor/approval media guard",passed,total:20,result:"PASS",note:"No real identity/auth nor actual user media; prevents unauthenticated privilege assignment through public delta transport"})+"\n");
