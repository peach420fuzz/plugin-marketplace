/* REMAKE by objekts v0.24 experimental pure canonical core.
  Stateless. No user account, database, media perception, approval authentication or handoff.
  Mirrors stable semantics of private remake_packet_v023.py.
*/
export const SCHEMA="remake.project/0.23";
const KINDS=new Set(["idea","image","video","audio","video_frame","script","text","storyboard","document","other"]);
const EVIDENCE=new Set(["OBSERVED","USER_STATED","MODEL_HYPOTHESIS","UNKNOWN"]);
const PROV=new Set(["USER_PROVIDED","USER_DESCRIBED","EXTERNAL_VERIFIED","MODEL_PROPOSED","UNKNOWN"]);
const STATUS=new Set(["PROPOSED","USER_APPROVED","LOCKED","REJECTED","SUPERSEDED"]);
const record=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const str=x=>typeof x==="string"&&x.trim().length>0;
const deepcopy=x=>JSON.parse(JSON.stringify(x));
const error=(code,field="")=>{throw Error(code+(field?" / "+field:""))};
const canonical=x=>JSON.stringify(x,(_k,v)=>record(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
async function digest(event){const buf=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical(event)));return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function assertJSON(x,max=120000){const j=JSON.stringify(x);if(typeof j!=="string"||j.length>max)error("oversized_or_unserializable_json");}
export function createProject({project_id,title="",author_intent=""}={}){
 if(!str(project_id)||project_id.length>200||typeof title!=="string"||typeof author_intent!=="string"||title.length>300||author_intent.length>6000)error("invalid_project_metadata");
 return {schema_version:SCHEMA,project_id,revision:1,title,author_intent,materials:[],locks:{},decisions:[],shots:[],handoff:{status:"NOT_SENT",consent:false,recipient:null,delivery_receipt:null,selected_material_ids:[]},migration:{from:null,warnings:[]},journal:[]};
}
export function validateProject(p){
 const errors=[],warnings=[]; const add=(code,path,warn=false)=> (warn?warnings:errors).push({code,path});
 if(!record(p))return {ok:false,errors:[{code:"INVALID_ROOT",path:"$"}],warnings};
 if(p.schema_version!==SCHEMA)add("SCHEMA_MISMATCH","schema_version");
 if(!str(p.project_id))add("PROJECT_ID_REQUIRED","project_id");
 if(!Number.isSafeInteger(p.revision)||p.revision<1)add("INVALID_REVISION","revision");
 if(typeof p.title!=="string"||typeof p.author_intent!=="string")add("INVALID_TEXT","title/author_intent");
 for(const k of ["materials","decisions","shots","journal"])if(!Array.isArray(p[k]))add("INVALID_ARRAY",k);
 const materials=Array.isArray(p.materials)?p.materials:[], known=new Set();
 for(const [i,m] of materials.entries()){
  const t="materials["+i+"]";
  if(!record(m)){add("INVALID_MATERIAL",t);continue;}
  if(!str(m.id))add("MATERIAL_ID_REQUIRED",t+".id");else if(known.has(m.id))add("DUPLICATE_MATERIAL",t+".id");else known.add(m.id);
  if(!KINDS.has(m.kind))add("INVALID_MATERIAL_KIND",t+".kind");
  if(!PROV.has(m.provenance))add("INVALID_PROVENANCE",t+".provenance");
  if(!EVIDENCE.has(m.evidence))add("INVALID_EVIDENCE",t+".evidence");
  if(typeof m.host_inspected!=="boolean")add("INVALID_INSPECTION_FLAG",t+".host_inspected");
  if(m.evidence==="OBSERVED"&&m.host_inspected!==true)add("UNINSPECTED_OBSERVATION",t+".evidence");
  if(m.evidence==="OBSERVED"&&!["image","video","video_frame","audio","document","text","script","storyboard"].includes(m.kind))add("UNSUPPORTED_OBSERVATION",t+".kind");
  if(m.host_inspected===true&&m.provenance==="MODEL_PROPOSED")add("PROPOSED_ASSET_INSPECTED",t+".host_inspected");
 }
 const locks=record(p.locks)?p.locks:{};
 if(!record(p.locks))add("INVALID_LOCKS","locks");
 for(const [k,v] of Object.entries(locks))if(!str(k)||!str(v))add("INVALID_LOCK","locks."+k);
 const decisions=Array.isArray(p.decisions)?p.decisions:[],seenD=new Set();
 for(const [i,d] of decisions.entries()){
  const t="decisions["+i+"]";if(!record(d)){add("INVALID_DECISION",t);continue;}
  if(!str(d.id))add("DECISION_ID_REQUIRED",t+".id");else if(seenD.has(d.id))add("DUPLICATE_DECISION",t+".id");else seenD.add(d.id);
  if(!STATUS.has(d.status))add("INVALID_DECISION_STATUS",t+".status");
  if(["USER_APPROVED","LOCKED"].includes(d.status)&&!str(d.approval_ref))add("DECISION_APPROVAL_REFERENCE_REQUIRED",t+".approval_ref");
  if(!Array.isArray(d.source_ids))add("INVALID_SOURCE_IDS",t+".source_ids");
  else for(const id of d.source_ids)if(!known.has(id))add("UNRESOLVED_SOURCE",t+".source_ids");
  if(d.status==="REJECTED"&&d.approved===true)add("REJECTED_MARKED_APPROVED",t);
 }
 const shots=Array.isArray(p.shots)?p.shots:[],seenS=new Set();
 for(const [i,s] of shots.entries()){
  const t="shots["+i+"]";if(!record(s)){add("INVALID_SHOT",t);continue;}
  if(!str(s.id))add("SHOT_ID_REQUIRED",t+".id");else if(seenS.has(s.id))add("DUPLICATE_SHOT",t+".id");else seenS.add(s.id);
  if(!STATUS.has(s.status))add("INVALID_SHOT_STATUS",t+".status");
  if(["USER_APPROVED","LOCKED"].includes(s.status)&&!str(s.approval_ref))add("SHOT_APPROVAL_REFERENCE_REQUIRED",t+".approval_ref");
  if(!Array.isArray(s.source_ids))add("INVALID_SOURCE_IDS",t+".source_ids");
  else for(const id of s.source_ids)if(!known.has(id))add("UNRESOLVED_SOURCE",t+".source_ids");
  if(!record(s.fields))add("INVALID_SHOT_FIELDS",t+".fields");
  else for(const [key,val] of Object.entries(s.fields)){
   if(typeof val!=="string")add("INVALID_SHOT_FIELD",t+".fields."+key);
   else if(Object.hasOwn(locks,key)&&val!==locks[key])add("LOCK_CONFLICT",t+".fields."+key);
  }
  if(!s.visible_action)add("NO_VISIBLE_ACTION",t+".visible_action",true);
  for(const key of ["entry","exit","cut","sound"])if(!s[key])add("SHOT_FIELD_UNSPECIFIED",t+"."+key,true);
 }
 const h=p.handoff;
 if(!record(h))add("INVALID_HANDOFF","handoff");
 else {
  if(!["NOT_SENT","SENT_VERIFIED"].includes(h.status))add("INVALID_HANDOFF_STATUS","handoff.status");
  if(typeof h.consent!=="boolean")add("INVALID_CONSENT","handoff.consent");
  if(h.status==="SENT_VERIFIED"&&!(h.consent===true&&str(h.delivery_receipt)&&str(h.recipient)))add("UNVERIFIED_DELIVERY","handoff");
  if(h.status!=="SENT_VERIFIED"&&h.delivery_receipt)add("RECEIPT_WITHOUT_SEND","handoff.delivery_receipt");
  if(h.recipient&&h.consent!==true)add("CONTACT_WITHOUT_CONSENT","handoff.recipient");
  if(!Array.isArray(h.selected_material_ids))add("INVALID_SELECTED_MATERIALS","handoff.selected_material_ids");
  else for(const id of h.selected_material_ids)if(!known.has(id))add("UNRESOLVED_HANDOFF_SOURCE","handoff.selected_material_ids");
  if(h.selected_material_ids?.length&&h.consent!==true)add("HANDOFF_SCOPE_WITHOUT_CONSENT","handoff.selected_material_ids");
 }
 if(!Array.isArray(p.journal))add("INVALID_JOURNAL","journal");
 return {ok:errors.length===0,errors,warnings,scope:"Static structural consistency only. Not user identity verification, actual film perception, legal consent, human approval, or delivery."};
}
const byId=(arr,id)=>arr.find(x=>record(x)&&x.id===id);
export async function applyProjectDelta({project,event}={}){
 const valid=validateProject(project);if(!valid.ok)error("invalid_project",valid.errors[0]?.code);
 if(!record(event)||!str(event.event_id))error("event_id_required");
 assertJSON(event,20000);assertJSON(project);
 const hash=await digest(event);
 const previous=project.journal.find(x=>x.event_id===event.event_id);
 if(previous){if(previous.event_digest===hash)return {project:deepcopy(project),idempotent_replay:true};error("event_id_reused_with_different_payload");}
 if(!Number.isSafeInteger(event.expected_revision)||event.expected_revision!==project.revision)error("revision_conflict");
 if(!record(event.payload))error("invalid_payload");
 const kind=event.kind,pl=event.payload,out=deepcopy(project);
 const author=()=>{if(event.actor_claim!=="USER"||!str(event.approval_ref))error("unverified_author_claim");};
 if(kind==="material_add"){
  if(!str(pl.id)||byId(out.materials,pl.id))error("missing_or_duplicate_material_id");
  out.materials.push(deepcopy(pl));
 }else if(kind==="shot_add"){
  if(!str(pl.id)||byId(out.shots,pl.id))error("missing_or_duplicate_shot_id");
  out.shots.push(deepcopy(pl));
 }else if(kind==="shot_field_set"){
  const shot=byId(out.shots,pl.shot_id);
  if(!shot||!str(pl.field)||typeof pl.value!=="string")error("invalid_shot_edit");
  if(["USER_APPROVED","LOCKED"].includes(shot.status))error("approved_shot_immutable");
  if(Object.hasOwn(out.locks,pl.field)&&pl.value!==out.locks[pl.field])error("lock_conflict");
  shot.fields[pl.field]=pl.value;
 }else if(kind==="lock_set"){
  author();
  if(!str(pl.field)||!str(pl.value))error("invalid_lock");
  if(Object.hasOwn(out.locks,pl.field)&&out.locks[pl.field]!==pl.value)error("lock_requires_explicit_unlock");
  for(const sh of out.shots)if(Object.hasOwn(sh.fields,pl.field)&&sh.fields[pl.field]!==pl.value)error("lock_conflicts_with_shot");
  out.locks[pl.field]=pl.value;
 }else if(kind==="lock_remove"){
  author();if(!Object.hasOwn(out.locks,pl.field))error("lock_not_found");delete out.locks[pl.field];
 }else if(kind==="decision_propose"){
  if(!str(pl.id)||byId(out.decisions,pl.id)||pl.status!=="PROPOSED")error("invalid_decision_proposal");
  if(out.decisions.some(x=>x.status==="REJECTED"&&x.topic===pl.topic&&x.value===pl.value))error("rejected_proposal_repeated");
  out.decisions.push(deepcopy(pl));
 }else if(kind==="decision_approve"||kind==="decision_reject"){
  author();const dec=byId(out.decisions,pl.id);
  if(!dec||dec.status!=="PROPOSED")error("decision_not_proposed");
  dec.status=kind==="decision_approve"?"USER_APPROVED":"REJECTED";
  dec[kind==="decision_approve"?"approval_ref":"rejection_ref"]=event.approval_ref;
 }else error("unsupported_event_kind");
 out.revision+=1;
 out.journal.push({event_id:event.event_id,kind,revision:out.revision,actor_claim:event.actor_claim||"MODEL",approval_ref:["lock_set","lock_remove","decision_approve","decision_reject"].includes(kind)?event.approval_ref:null,event_digest:hash});
 const post=validateProject(out);
 if(!post.ok)error("postcondition_failed",post.errors.map(e=>e.code).join(","));
 return {project:out,idempotent_replay:false,warning:"Stateless. Caller must save returned project. actor_claim and approval_ref are UNAUTHENTICATED text."};
}
export const canonicalTools=[
{name:"remake_project_create",description:"Create a fresh canonical REMAKE project document (stateless). Returns user-owned JSON for local saving; no account or persistent memory.",inputSchema:{type:"object",properties:{project_id:{type:"string",minLength:1,maxLength:200},title:{type:"string",maxLength:300},author_intent:{type:"string",maxLength:6000}},required:["project_id"],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false}},
{name:"remake_project_validate",description:"Check a canonical remake.project/0.23 packet, source ID references, LOCK conflicts and claimed statuses. This is not semantic media review or human approval verification.",inputSchema:{type:"object",properties:{project:{type:"object"}},required:["project"],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false}},
{name:"remake_project_apply_delta",description:"Apply one CAS revision event to a canonical project and return a new document; protects LOCK, approved shot, rejected option, idempotent event ID. Stateless: you must explicitly save new project. Claimed USER approvals are NOT verified identity.",inputSchema:{type:"object",properties:{project:{type:"object"},event:{type:"object"}},required:["project","event"],additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false}}
];
export async function callCanonical(name,args){
 if(!record(args))error("arguments_must_be_object");
 const names={remake_project_create:["project_id","title","author_intent"],remake_project_validate:["project"],remake_project_apply_delta:["project","event"]};
 if(!names[name]||Object.keys(args).some(k=>!names[name].includes(k)))error("unsupported_argument");
 if(name==="remake_project_create")return {project:createProject(args),persisted:false};
 if(name==="remake_project_validate")return validateProject(args.project);
 if(name==="remake_project_apply_delta")return applyProjectDelta(args);
 error("unknown_tool");
}
