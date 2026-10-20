// Synthetic signed JWT + in-memory D1 substitute, NOT a real login or G5 PASS.
import assert from 'node:assert/strict';
import gateway from '../account-gateway-v025.mjs';
import {createProject} from '../core-v024.mjs';
const keys = await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const pub = {...await crypto.subtle.exportKey('jwk',keys.publicKey),kid:'synthetic',alg:'RS256',use:'sig'};
const base64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now()/1000);
const body = base64({alg:'RS256',kid:'synthetic',typ:'at+jwt'})+'.'+base64({iss:'https://login.example.test',aud:'https://remake.objekts.ai/account/mcp',sub:'synthetic-owner',exp:now+300,scope:'remake.projects:read remake.projects:write',token_use:'access'});
const token = body+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(body))).toString('base64url');
let state = createProject({project_id:'synthetic-project'}), writes = 0;
const env = {
  REMAKE_OIDC_ISSUER:'https://login.example.test',REMAKE_OIDC_AUDIENCE:'https://remake.objekts.ai/account/mcp',REMAKE_OIDC_JWKS_URI:'https://login.example.test/keys',
  DB:{prepare(sql){ return {bind(){return this;}, async first(){return {id:state.project_id,revision:state.revision,state_json:JSON.stringify(state)};}, async run(){writes++;return {meta:{changes:1}};}};}}
};
const original = globalThis.fetch;
globalThis.fetch = async url => {assert.equal(url,env.REMAKE_OIDC_JWKS_URI);return Response.json({keys:[pub]});};
const request = event => new Request('https://remake.objekts.ai/account/mcp',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'remake_account_apply_draft_delta',arguments:{project_id:state.project_id,event}}})});
let passed = 0;
const event = (kind,payload) => ({event_id:'e1',expected_revision:1,kind,payload,actor_claim:'MODEL'});
try {
  for (const payload of [
    {id:'shot',status:'PROPOSED',source_ids:[],fields:{},approved:true},
    {id:'shot',status:'PROPOSED',source_ids:[],fields:{},approval_ref:'invented'}
  ]) {
    const out = await (await gateway.fetch(request(event('shot_add',payload)),env)).json();
    assert.equal(out.result.isError,true); assert.equal(writes,0); passed++;
  }
  state.shots=[{id:'rejected',status:'REJECTED',source_ids:[],fields:{}}];
  let out=await (await gateway.fetch(request(event('shot_field_set',{shot_id:'rejected',field:'camera',value:'moving'})),env)).json();
  assert.equal(out.result.isError,true); assert.equal(writes,0); passed++;
  out=await (await gateway.fetch(request(event('material_add',{id:'m',kind:'image',provenance:'USER_DESCRIBED',evidence:'USER_STATED',host_inspected:false,file_ref:'invented'})),env)).json();
  assert.equal(out.result.isError,true); assert.equal(writes,0); passed++;
  state=createProject({project_id:'synthetic-project'});
  out=await (await gateway.fetch(request(event('shot_add',{id:'shot',status:'PROPOSED',source_ids:[],fields:{},visible_action:'a proposed hold'})),env)).json();
  assert.equal(out.result.isError,false); assert.equal(writes,1); assert.equal(out.result.structuredContent.verified_approval,false); passed++;
  const closed=await gateway.fetch(request(event('shot_add',{})),{DB:env.DB});
  assert.equal(closed.status,503); passed++;
} finally {globalThis.fetch=original;}
console.log(JSON.stringify({suite:'authenticated draft boundary',passed,total:6,test_class:'SYNTHETIC',real_login:false,actual_d1:false}));
