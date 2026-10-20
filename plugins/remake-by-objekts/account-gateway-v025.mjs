import {readBoundedBody} from "./request-body-v035.mjs";
// REMAKE by objekts — experimental authenticated MCP project store v0.25
// DEPLOYED DISABLED BY DEFAULT. Requires independent OIDC issuer, resource audience,
// issuer-matched JWKS, and existing D1. Until all are configured, /mcp -> HTTP 503.
// This is an OAuth RESOURCE SERVER, NOT an identity provider or auth-server implementation.
import {isConfigured,authorizationConfig,loadTrustedJWKS,verifyAccessJWT} from "./oidc-resource-v025.mjs";
import {guardPublicDelta} from "./public-delta-guard-v033.mjs";
import {createProject,validateProject,applyProjectDelta} from "./core-v024.mjs";
const VERSION="0.25.0-g5-staging", LIMIT=70000;
const RESOURCE="https://remake.objekts.ai/account/mcp";
const METADATA="https://remake.objekts.ai/.well-known/oauth-protected-resource/account/mcp";
const json=(v,status=200,extra={})=>new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","x-robots-tag":"noindex, nofollow",...extra}});
const err=(id,msg,isError=true)=>({jsonrpc:"2.0",id,result:{content:[{type:"text",text:msg}],isError}});
const rpc=(id,result)=>({jsonrpc:"2.0",id,result});
const check=(x,max=200)=>typeof x==="string"&&x.length>0&&x.length<=max;
const record=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const info=(name,description,required,properties={},readOnly=true,destructive=false)=>({name,description,inputSchema:{type:"object",properties,required,additionalProperties:false},annotations:{readOnlyHint:readOnly,destructiveHint:destructive}});
const string={type:"string"},id={type:"string",minLength:1,maxLength:200},revision={type:"integer",minimum:1};
const tools=[
 info("remake_account_create","Create a private canonical REMAKE project for the verified OAuth identity. No media bytes uploaded.",[],{title:{type:"string",maxLength:300},author_intent:{type:"string",maxLength:6000}},false),
 info("remake_account_list","List this verified user's own project IDs, dates and revisions.",[],{limit:{type:"integer",minimum:1,maximum:30}},true),
 info("remake_account_open","Read this verified user's project state.",["project_id"],{project_id:id},true),
 info("remake_account_export","Export a complete self-owned project packet; no hidden transmission to the studio.",["project_id"],{project_id:id},true),
 info("remake_account_apply_draft_delta","Apply exactly one draft revision with optimistic CAS and model-safe event types. LOCK, approvals and handoff mutations are forbidden until independently trusted UI confirmation exists.",["project_id","event"],{project_id:id,event:{type:"object"}},false),
 info("remake_account_delete","Delete an owned project at its current revision. Requires host to ask the owner to confirm; server cannot prove human click.",["project_id","expected_revision","confirm_project_id"],{project_id:id,expected_revision:revision,confirm_project_id:id},false,true)
];
const safe=(v)=>JSON.stringify(v).length<=LIMIT;
function assertFields(obj,allowed,required=[]){
 if(!record(obj)||Object.keys(obj).some(k=>!allowed.includes(k))||required.some(k=>!Object.hasOwn(obj,k)))throw Error("invalid_arguments");
}
async function useProject(db,owner,projectID){
 if(!check(projectID,200))throw Error("invalid_project_id");
 const row=await db.prepare("SELECT id,revision,state_json,updated_at FROM creative_projects WHERE id=? AND owner_subject=?").bind(projectID,owner).first();
 if(!row)throw Error("not_found_or_not_owned");
 let state;try{state=JSON.parse(row.state_json);}catch{throw Error("corrupt_project_state");}
 if(!validateProject(state).ok||state.revision!==row.revision||state.project_id!==row.id)throw Error("corrupt_project_state");
 return {row,state};
}
function restrictEvent(event){
 assertFields(event,["event_id","expected_revision","kind","payload","actor_claim"],["event_id","expected_revision","kind","payload"]);
 if(!["material_add","shot_add","shot_field_set","decision_propose"].includes(event.kind))throw Error("requires_human_ui_confirmation");
 if(event.actor_claim&&event.actor_claim!=="MODEL")throw Error("unverified_author_claim");
 if(event.kind==="material_add"&&(event.payload?.host_inspected===true||event.payload?.evidence==="OBSERVED"))throw Error("media_observation_unverified");
 if(event.kind==="shot_add"&&event.payload?.status!=="PROPOSED")throw Error("shot_approval_unverified");
 if(event.kind==="decision_propose"&&event.payload?.status!=="PROPOSED")throw Error("decision_approval_unverified");
}
async function act(name,a,env,identity){
 const db=env.DB,owner=identity.subject;
 const write=["remake_account_create","remake_account_apply_draft_delta","remake_account_delete"].includes(name);
 if(!identity.scope.includes(write?"remake.projects:write":"remake.projects:read"))throw Error("insufficient_scope");
 if(name==="remake_account_create"){
  assertFields(a,["title","author_intent"]);
  const counter=await db.prepare("SELECT COUNT(*) AS n FROM creative_projects WHERE owner_subject=?").bind(owner).first();
  if(counter.n>=30)throw Error("project_quota_exceeded");
  const project=createProject({project_id:"rm-"+crypto.randomUUID(),title:a.title||"",author_intent:a.author_intent||""});
  const now=new Date().toISOString();
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(owner+"\0"+project.project_id)))).map(x=>x.toString(16).padStart(2,"0")).join("");
  await db.prepare("INSERT INTO creative_projects(id,token_hash,revision,state_json,created_at,updated_at,owner_subject) VALUES (?,?,1,?,?,?,?)").bind(project.project_id,digest,JSON.stringify(project),now,now,owner).run();
  return {project,created_at:now,account_bound:true};
 }
 if(name==="remake_account_list"){
  assertFields(a,["limit"]);const limit=Number.isInteger(a.limit)?Math.min(Math.max(a.limit,1),30):20;
  const rows=await db.prepare("SELECT id,revision,created_at,updated_at FROM creative_projects WHERE owner_subject=? ORDER BY updated_at DESC LIMIT ?").bind(owner,limit).all();
  return {projects:rows.results||[],account_bound:true};
 }
 if(name==="remake_account_open"||name==="remake_account_export"){
  assertFields(a,["project_id"],["project_id"]);const {row,state}=await useProject(db,owner,a.project_id);
  return {project:state,updated_at:row.updated_at,export:name==="remake_account_export",account_bound:true};
 }
 if(name==="remake_account_apply_draft_delta"){
  assertFields(a,["project_id","event"],["project_id","event"]);restrictEvent(a.event);
  if(!safe(a.event))throw Error("event_too_large");
  const {row,state}=await useProject(db,owner,a.project_id);
  guardPublicDelta({project:state,event:a.event});
  const out=await applyProjectDelta({project:state,event:a.event});
  if(out.idempotent_replay)return {project:state,idempotent:true,account_bound:true};
  const stateJSON=JSON.stringify(out.project);
  if(stateJSON.length>LIMIT)throw Error("project_too_large");
  const updated=await db.prepare("UPDATE creative_projects SET state_json=?,revision=?,updated_at=? WHERE id=? AND owner_subject=? AND revision=?").bind(stateJSON,out.project.revision,new Date().toISOString(),a.project_id,owner,row.revision).run();
  if(updated.meta?.changes!==1)throw Error("revision_conflict");
  return {project:out.project,account_bound:true,verified_approval:false};
 }
 if(name==="remake_account_delete"){
  assertFields(a,["project_id","expected_revision","confirm_project_id"],["project_id","expected_revision","confirm_project_id"]);
  if(a.project_id!==a.confirm_project_id||!Number.isInteger(a.expected_revision))throw Error("confirmation_or_revision_required");
  const deleted=await db.prepare("DELETE FROM creative_projects WHERE id=? AND owner_subject=? AND revision=?").bind(a.project_id,owner,a.expected_revision).run();
  if(deleted.meta?.changes!==1)throw Error("revision_conflict_or_not_owned");
  return {deleted:true,project_id:a.project_id,scope:"Host-level human confirmation is NOT independently verified by the server."};
 }
 throw Error("unsupported_tool");
}
async function executeRPC(request,env,identity){
 if(request.headers.get("origin"))return json({error:"browser_origin_disallowed"},403);
 if((request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase()!=="application/json")return json({error:"json_required"},415);
 let text;try{text=await readBoundedBody(request,LIMIT);}catch(e){return json({error:e.message},e.status||400)}
 let req;try{req=JSON.parse(text);}catch{return json({jsonrpc:"2.0",id:null,error:{code:-32700,message:"invalid JSON"}},400);}
 if(!record(req)||typeof req.method!=="string")return json({jsonrpc:"2.0",id:null,error:{code:-32600,message:"invalid request"}},400);
 const {id,method,params}=req;
 if(method==="notifications/initialized")return new Response(null,{status:202});
 if(id===undefined||id===null)return json({jsonrpc:"2.0",id:null,error:{code:-32600,message:"id required"}},400);
 if(method==="initialize")return json(rpc(id,{protocolVersion:"2025-06-18",capabilities:{tools:{listChanged:false}},serverInfo:{name:"REMAKE accounts staging",version:VERSION}}));
 if(method==="ping")return json(rpc(id,{}));
 if(method==="tools/list")return json(rpc(id,{tools}));
 if(method==="tools/call"){
  const tool=tools.find(x=>x.name===params?.name);
  if(!tool)return json({jsonrpc:"2.0",id,error:{code:-32601,message:"unknown tool"}});
  try{const result=await act(tool.name,params.arguments||{},env,identity);return json(rpc(id,{content:[{type:"text",text:JSON.stringify(result)}],structuredContent:result,isError:false}));}
  catch(e){const code=String(e.message||"invalid_input").slice(0,80);return json(err(id,code));}
 }
 return json({jsonrpc:"2.0",id,error:{code:-32601,message:"unsupported method"}});
}
async function selfTest(){
 const tests=[],test=async(name,f)=>{try{tests.push({name,pass:!!(await f())});}catch(e){tests.push({name,pass:false,error:String(e).slice(0,100)})}};
 const keypair=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
 const pub=await crypto.subtle.exportKey("jwk",keypair.publicKey),issuer="https://login.example.test",aud=RESOURCE,now=Math.floor(Date.now()/1000);
 const config={issuer,audience:aud,jwks:{keys:[{...pub,kid:"test-key",alg:"RS256",use:"sig"}]}};
 const enc=(x)=>btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(x)))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
 const make=async(payload,header={alg:"RS256",kid:"test-key",typ:"at+jwt"})=>{
  const body=enc(header)+"."+enc(payload);
  const signed=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",keypair.privateKey,new TextEncoder().encode(body));
  return body+"."+btoa(String.fromCharCode(...new Uint8Array(signed))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
 };
 const payload={iss:issuer,aud,sub:"sample-user-1",exp:now+3600,iat:now-5,scope:"remake.projects:read remake.projects:write",token_use:"access"};
 const token=await make(payload);
 const denied=async(tok,c=config)=>{try{await verifyAccessJWT(tok,c,{now,requiredScope:"remake.projects:read"});return false;}catch{return true;}};
 await test("signature_valid",async()=>!!(await verifyAccessJWT(token,config,{now,requiredScope:"remake.projects:read"})).subject);
 await test("scope_read",async()=>!!(await verifyAccessJWT(token,config,{now,requiredScope:"remake.projects:read"})).scope);
 await test("scope_missing_rejected",async()=>{try{await verifyAccessJWT(token,config,{now,requiredScope:"missing.scope"});return false;}catch{return true;}});
 await test("wrong_issuer_rejected",async()=>denied(await make({...payload,iss:"https://evil.example.test"})));
 await test("wrong_audience_rejected",async()=>denied(await make({...payload,aud:"https://other.example.test"})));
 await test("expired_rejected",async()=>denied(await make({...payload,exp:now-100})));
 await test("future_nbf_rejected",async()=>denied(await make({...payload,nbf:now+500})));
 await test("id_token_rejected",async()=>denied(await make({...payload,token_use:"id"})));
 await test("unknown_kid_rejected",async()=>denied(await make(payload,{alg:"RS256",kid:"unknown",typ:"at+jwt"})));
 await test("alg_none_rejected",async()=>denied(await make(payload,{alg:"none",kid:"test-key"})));
 await test("tampered_payload_rejected",async()=>denied(token.split(".")[0]+"."+enc({...payload,sub:"attacker"})+"."+token.split(".")[2]));
 await test("duplicate_kid_rejected",async()=>denied(token,{...config,jwks:{keys:[config.jwks.keys[0],config.jwks.keys[0]]}}));
 await test("subject_is_scoped",async()=>{const r=await verifyAccessJWT(token,config,{now});return r.subject.startsWith("oidc:")&&!r.subject.includes("sample-user")});
 await test("staging_unconfigured_without_idp",()=>!isConfigured({DB:{}}));
 await test("model_cannot_change_locks",()=>{try{restrictEvent({kind:"lock_set",payload:{field:"camera",value:"moving"}});return false;}catch{return true}});
 await test("model_cannot_approve",()=>{try{restrictEvent({kind:"decision_approve",payload:{id:"d"}});return false;}catch{return true}});
 await test("fake_observation_rejected",()=>{try{restrictEvent({kind:"material_add",payload:{id:"m",host_inspected:true,evidence:"OBSERVED"}});return false;}catch{return true}});
 await test("draft_event_allowed",()=>{restrictEvent({event_id:"test-e",expected_revision:1,kind:"material_add",actor_claim:"MODEL",payload:{id:"x",kind:"image",host_inspected:false,evidence:"USER_STATED"}});return true});
 const count=tests.filter(t=>t.pass).length;return {version:VERSION,passed:count,total:tests.length,tests,scope:"Ephemeral JWTs signed locally only in selftest; no real OIDC provider configured or user account created."};
}
export default {async fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path==="/health"&&request.method==="GET")return json({service:"REMAKE OIDC G5 staging",version:VERSION,configured:isConfigured(env),account_write_enabled:isConfigured(env),public_release:false});
 if(path==="/_selftest"&&request.method==="GET")return json(await selfTest());
 if(path==="/.well-known/oauth-protected-resource/account/mcp"&&request.method==="GET"){
  if(!isConfigured(env))return json({error:"identity_provider_not_configured"},503);
  return json({resource:RESOURCE,authorization_servers:[env.REMAKE_OIDC_ISSUER],scopes_supported:["remake.projects:read","remake.projects:write"],bearer_methods_supported:["header"]});
 }
 if(path!=="/account/mcp"||request.method!=="POST")return json({error:"not_found"},404);
 if(!isConfigured(env))return json({error:"identity_provider_not_configured",public_access:false},503);
 const header=request.headers.get("authorization")||"";
 const m=/^Bearer ([A-Za-z0-9_.-]+)$/.exec(header);
 if(!m)return json({error:"authorization_required"},401,{"www-authenticate":'Bearer resource_metadata="'+METADATA+'", scope="remake.projects:read"'});
 try{
  const jwks=await loadTrustedJWKS(env);
  const identity=await verifyAccessJWT(m[1],{...authorizationConfig(env),jwks});
  return await executeRPC(request,env,identity);
 }catch(e){
  if(e?.name==="AuthError")return json({error:"invalid_access_token"},401,{"www-authenticate":'Bearer resource_metadata="'+METADATA+'"'});
  return json({error:"internal_error"},500);
 }
}};
