// REMAKE 0.33 — public unauthenticated MCP revision policy.
// No authenticated user or trusted host approval channel currently exists.
// Therefore this boundary permits ONLY unapproved drafts and source descriptions.
// It does not turn user-supplied text, source sha256, or fileParams into proof of consent.
export const PUBLIC_SAFE_KINDS=Object.freeze(["material_add","shot_add","shot_field_set","decision_propose"]);
const fail=(code)=>{throw Error(code)};
const record=(x)=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const str=(x)=>typeof x==="string"&&x.length>0;
const allowed=(o,keys)=>Object.keys(o).every(k=>keys.includes(k));
export function guardPublicDelta({project,event}={}){
 if(!record(project)||!record(event)||!record(event.payload))fail("invalid_public_delta");
 if(!PUBLIC_SAFE_KINDS.includes(event.kind))fail("requires_authenticated_human_approval");
 if(!allowed(event,["event_id","expected_revision","kind","payload","actor_claim"]))fail("untrusted_event_privileged_fields");
 if(event.actor_claim!==undefined&&event.actor_claim!=="MODEL")fail("unverified_actor_claim");
 const p=event.payload;
 if(event.kind==="material_add"){
  if(!allowed(p,["id","kind","provenance","evidence","host_inspected","description","file_ref","sha256","notes","source_ids"]))fail("invalid_material_fields");
  if(p.host_inspected!==false)fail("material_inspection_unverified");
  if(!["USER_STATED","MODEL_HYPOTHESIS","UNKNOWN"].includes(p.evidence))fail("material_evidence_not_verified");
  if(!["USER_DESCRIBED","MODEL_PROPOSED","UNKNOWN"].includes(p.provenance))fail("material_provenance_not_verified");
  if(Object.hasOwn(p,"sha256")||Object.hasOwn(p,"file_ref"))fail("untrusted_file_receipt");
  if(!str(p.id))fail("material_id_required");
 }else if(event.kind==="shot_add"){
  if(!record(p.fields)||!str(p.id)||p.status!=="PROPOSED"||Object.hasOwn(p,"approval_ref")||Object.hasOwn(p,"approved"))fail("shot_approval_unverified");
  if(!Array.isArray(p.source_ids))fail("shot_sources_required");
  if(!allowed(p,["id","status","source_ids","fields","visible_action","entry","exit","cut","sound","duration","notes","sequence"]))fail("unknown_privileged_shot_field");
 }else if(event.kind==="shot_field_set"){
  if(!str(p.shot_id)||!str(p.field)||typeof p.value!=="string")fail("invalid_shot_edit");
  if(!allowed(p,["shot_id","field","value"]))fail("privileged_shot_edit_fields");
  const shot=Array.isArray(project.shots)?project.shots.find(s=>record(s)&&s.id===p.shot_id):null;
  if(!shot)fail("shot_not_found");
  if(shot.status!=="PROPOSED")fail("non_proposed_shot_immutable");
 }else if(event.kind==="decision_propose"){
  if(!str(p.id)||p.status!=="PROPOSED"||Object.hasOwn(p,"approval_ref")||Object.hasOwn(p,"approved"))fail("decision_approval_unverified");
  if(!Array.isArray(p.source_ids))fail("decision_sources_required");
  if(!allowed(p,["id","status","source_ids","topic","value","rationale","notes"]))fail("unknown_privileged_decision_field");
 }
 return {accepted:true,approval_authenticated:false,claim_scope:"draft_only",may_save: false};
}
export const publicGuardScope="Unauthenticated public MCP. Only draft events; approvals and LOCK changes require verified auth + explicit confirmation. Source observations may be recorded only after independent real host-side perception.";
