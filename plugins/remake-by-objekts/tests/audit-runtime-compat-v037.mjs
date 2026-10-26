import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import before from './fixtures/worker-v072.mjs';
import after from '../worker.mjs';

let passed = 0;
const results = [];
async function test(name, action) {
  await action(); passed++; results.push({name, pass:true});
}
const req = (path, data) => new Request('https://remake.objekts.ai'+path, data === undefined ? {} : {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
const rpc = (method, params={}) => ({jsonrpc:'2.0',id:1,method,params});
const call = async (w, method, params={}) => (await w.fetch(req('/mcp',rpc(method,params)),{})).json();
const candidates = ['request-body-v035.mjs','core-v024.mjs','host-file-v028.mjs','image-batch-v031.mjs','image-integrity-v030.mjs','image-review-v029.mjs','public-delta-guard-v033.mjs'];
const baselineHashes=JSON.parse(readFileSync(new URL('./fixtures/runtime-v072-module-sha256.json',import.meta.url)));
for(const file of candidates) await test('unchanged '+file,()=>assert.equal(createHash('sha256').update(readFileSync(new URL('../'+file,import.meta.url))).digest('hex'),baselineHashes[file]));
await test('exact tool names/schemas/annotations/descriptions retained',async()=>{
  const a=await call(before,'tools/list'),b=await call(after,'tools/list');
  assert.equal(b.result.tools.length,10);b.result.tools=b.result.tools.filter(t=>t.name!=='remake_get_audit_method');assert.deepEqual(b,a);assert.equal(b.result.tools.length,9);
});
await test('initialize changes only version and optional client instructions',async()=>{
  const a=await call(before,'initialize'),b=await call(after,'initialize');
  assert.equal(b.result.serverInfo.version,'0.7.8-beta');
  assert.match(b.result.instructions,/production audit/);assert.match(b.result.instructions,/no inference/);assert.match(b.result.instructions,/retrieve remake_get_audit_method section core/);
  b.result.serverInfo.version=a.result.serverInfo.version;delete b.result.instructions;assert.deepEqual(b,a);
});
await test('origin landing audit, brand and no automatic input/active content',async()=>{
  const r=await after.fetch(req('/'),{}),html=await r.text();
  assert.equal(r.status,200);assert.match(html,/Professional production audit/);assert.match(html,/concrete examples of production deliverables/);
  assert.match(html,/overlapping square outlines on charcoal/);
  assert.match(html,/src="https:\/\/raw\.githubusercontent\.com\/peach420fuzz\/plugin-marketplace\/main\/plugins\/remake-by-objekts\/assets\/objekts-remake-charcoal\.png"/);
  assert.match(html,/referrerpolicy="no-referrer"/);assert.doesNotMatch(html,/<(?:script|form|input|iframe)\b/i);
  assert.equal(r.headers.get('referrer-policy'),'no-referrer');
  assert.equal(r.headers.get('content-security-policy'),"default-src 'none'; style-src 'unsafe-inline'; img-src https://raw.githubusercontent.com; script-src 'none'; base-uri 'none'; form-action 'none'");
});
await test('privacy discloses static external asset and existing data boundaries',async()=>{
  const html=await (await after.fetch(req('/privacy'),{})).text();
  for(const s of ['raw.githubusercontent.com','network/request metadata','no-referrer','transiently in Worker memory','no inference model']) assert.ok(html.includes(s));
});
await test('privacy distinguishes edge delivery from origin without weakening origin policy',async()=>{
  const r=await after.fetch(req('/privacy'),{}),html=await r.text();
  for(const s of ['REMAKE-generated landing HTML','Cloudflare delivery','WebMCP','/.webmcp/bridge.js','Content Credentials (C2PA)','data-packs=c2pa','locally in the browser','does not verify their cryptographic signatures','does not establish that it executed']) assert.ok(html.includes(s),s);
  assert.doesNotMatch(html,/There are no project upload fields, forms or scripts on the landing page/);
  assert.doesNotMatch(html,/<(?:script|form|input|iframe)\b/i);
  assert.equal(r.headers.get('referrer-policy'),'no-referrer');
  assert.equal(r.headers.get('content-security-policy'),"default-src 'none'; style-src 'unsafe-inline'; img-src https://raw.githubusercontent.com; script-src 'none'; base-uri 'none'; form-action 'none'");
});
await test('discovery metadata aligns without inference/storage claims',async()=>{
  const r=await (await after.fetch(req('/.well-known/remake.json'),{})).json();
  assert.equal(r.version,'0.7.8-beta');assert.equal(r.storage,false);assert.equal(r.inference,false);assert.equal(r.independent_media_processing,false);assert.equal(r.tools.length,10);assert.match(r.audit_role,/Host-led/);
});
await test('llms method explains professional work and host boundary',async()=>{
  const html=await (await after.fetch(req('/llms.txt'),{})).text();
  for(const s of ['production audit','professional department work','no LLM inference','no accounts','Source publication is not official catalog acceptance']) assert.ok(html.includes(s));
});
await test('health version only; storage/inference unchanged',async()=>{
  const a=await (await before.fetch(req('/health'),{})).json(),b=await (await after.fetch(req('/health'),{})).json();
  assert.equal(b.version,'0.7.8-beta');b.version=a.version;assert.deepEqual(b,a);
});
await test('diagnostic endpoints remain closed with absent configuration',async()=>{
  for(const path of ['/_selftest','/_core_selftest','/_file_selftest','/_image_selftest','/_batch_selftest']) assert.equal((await after.fetch(req(path),{})).status,404);
});
await test('GET/invalid-type/invalid-JSON RPC handling unchanged',async()=>{
  for(const request of [req('/mcp'),new Request('https://remake.objekts.ai/mcp',{method:'POST',headers:{'content-type':'text/plain'},body:'{}'}),new Request('https://remake.objekts.ai/mcp',{method:'POST',headers:{'content-type':'application/json'},body:'{'})]){
    const a=await before.fetch(request.clone(),{}),b=await after.fetch(request.clone(),{});assert.equal(b.status,a.status);assert.equal(await b.text(),await a.text());
  }
});
await test('descriptor and portable constraints unchanged on synthetic inputs',async()=>{
  const cases=[{name:'inventory_creative_materials',arguments:{materials:[]}},{name:'check_explicit_project_locks',arguments:{locks:[{key:'CAMERA',value:'static'}],proposed_changes:[{key:'camera',new_value:'moving'}]}},{name:'compile_portable_director_packet',arguments:{title:'Synthetic',materials:[],shots:[{id:'s',action:'Proposed hold',source_ids:[]}],locks:[]}}];
  for(const params of cases) assert.deepEqual(await call(after,'tools/call',params),await call(before,'tools/call',params));
});
await test('public draft-only approval and observation guards remain closed',async()=>{
  const p=(await call(after,'tools/call',{name:'remake_project_create',arguments:{project_id:'copy-smoke'}})).result.structuredContent.project;
  for(const [kind,payload] of [['lock_set',{field:'camera',value:'static'}],['decision_approve',{id:'d'}],['material_add',{id:'m',kind:'image',provenance:'HOST_OBSERVED',host_inspected:true,evidence:'OBSERVED'}]]){
    const out=await call(after,'tools/call',{name:'remake_project_apply_delta',arguments:{project:p,event:{event_id:'e',expected_revision:1,kind,payload,actor_claim:'USER',approval_ref:'not-real'}}});assert.equal(out.result.isError,true);
  }
});
const receipt={suite:'REMAKE 0.7.8-beta method/compatibility alignment',passed,total:results.length,results,execution:'Node in-memory Worker requests; synthetic fixtures, no network, no private media',host_routing:false,directorial_quality:false};
console.log(JSON.stringify(receipt));
