import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {getAuditMethod,auditMethodTool} from '../audit-method-v037.mjs';
import data from '../audit-method-data-v037.mjs';
import worker from '../worker.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const canonical=root;
const sha=b=>createHash('sha256').update(b).digest('hex');
let passed=0;const results=[];
async function test(name,fn){await fn();passed++;results.push({name,pass:true});}
const ids=Array.from({length:22},(_,i)=>String(i+1).padStart(2,'0'));
const expectedSources=['skills/creative-companion/SKILL.md','skills/creative-companion/references/PRODUCTION_AUDIT_ENGINE.md','skills/creative-companion/references/DEPARTMENT_CONTRACTS_22.json','skills/creative-companion/references/CROSS_DEPARTMENT_HANDOFFS.md','skills/creative-companion/references/DEPARTMENT_AUDIT_PLAYBOOK.md','skills/creative-companion/references/OBJEKTS_BRAND_AND_PRODUCTION_BRIDGE_v017.md'];
const rpc=async args=>{
 const r=await worker.fetch(new Request('https://remake.objekts.ai/mcp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'remake_get_audit_method',arguments:args}})}),{});
 assert.equal(r.status,200);return (await r.json()).result;
};
await test('core delivers full canonical text, engine and 22-function index',()=>{
 const r=getAuditMethod({section:'core'});assert.equal(r.method_version,'0.38.0');assert.equal(r.core,readFileSync(join(canonical,expectedSources[0]),'utf8'));assert.equal(r.audit_engine,readFileSync(join(canonical,expectedSources[1]),'utf8'));assert.deepEqual(r.department_index.map(d=>d.id),ids);assert.equal(r.server_inference,false);assert.equal(r.host_application_required,true);assert.equal(r.execution,'METHOD_TEXT_ONLY_NOT_AN_AUDIT_RESULT');
});
await test('all departments returns all 22 exact canonical contracts',()=>{
 const r=getAuditMethod({section:'departments'});assert.deepEqual(r.returned_department_ids,ids);assert.deepEqual(r.omitted_department_ids,[]);assert.deepEqual(r.contract,JSON.parse(readFileSync(join(canonical,expectedSources[2]),'utf8')));
});
await test('selected departments expose only selected functions with stable canonical order',()=>{
 const r=getAuditMethod({section:'departments',department_ids:['20','04','13']});assert.deepEqual(r.returned_department_ids,['04','13','20']);assert.equal(r.omitted_department_ids.length,19);assert.deepEqual(r.contract.departments.map(d=>d.id),['04','13','20']);
});
await test('handoffs delivers exact public handoff/playbook/studio sources',()=>{
 const r=getAuditMethod({section:'handoffs'});for(const [key,index]of [['handoffs',3],['playbook',4],['studio_bridge',5]])assert.equal(r[key],readFileSync(join(canonical,expectedSources[index]),'utf8'));
});
await test('invalid sections, shape and missing section rejected',()=>{
 for(const a of [null,[],false,'core',{}, {section:'source'}, {section:1}])assert.throws(()=>getAuditMethod(a));
});
await test('unknown, duplicated, empty, too many and non-string department IDs rejected',()=>{
 for(const d of [[],['23'],['4'],['04','04'],[4],Array(23).fill('01'),'04'])assert.throws(()=>getAuditMethod({section:'departments',department_ids:d}));
});
await test('department selection rejected for other sections; extra/private-input arguments rejected',()=>{
 for(const a of [{section:'core',department_ids:['04']},{section:'handoffs',department_ids:['04']},{section:'core',project:'synthetic-private-canary'},{section:'core',source_url:'https://example.test/private'}])assert.throws(()=>getAuditMethod(a));
});
await test('caller mutation cannot alter canonical response snapshot',()=>{
 const r=getAuditMethod({section:'departments'});r.contract.departments[0].department='tampered';r.source_files[0].sha256='tampered';r.returned_department_ids.length=0;const next=getAuditMethod({section:'departments'});assert.notEqual(next.contract.departments[0].department,'tampered');assert.notEqual(next.source_files[0].sha256,'tampered');assert.deepEqual(next.returned_department_ids,ids);
});
await test('method aggregate hash matches canonical sorted JSON and all six source hashes',()=>{
 const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
 const {sha256,...body}=data;assert.equal(sha(JSON.stringify(stable(body))),sha256);assert.deepEqual(data.source_files.map(s=>s.path),expectedSources);for(const s of data.source_files)assert.equal(sha(readFileSync(join(canonical,s.path))),s.sha256);
});
await test('generator reproduces exact data module solely from allowlisted files',()=>{
 const folder=mkdtempSync(join(tmpdir(),'remake-method-test-'));try{const out=join(folder,'method.mjs');const receipt=JSON.parse(execFileSync('python3',[resolve(root,'scripts/build-audit-method-v037.py'),'--root',canonical,'--out',out],{encoding:'utf8'}));assert.deepEqual(readFileSync(out),readFileSync(join(root,'audit-method-data-v037.mjs')));assert.equal(receipt.method_sha256,data.sha256);assert.equal(receipt.source_files.length,6);}finally{rmSync(folder,{recursive:true,force:true});}
});
await test('read-only calls neither fetch input nor persist caller mutations/private canary',()=>{
 const before=JSON.stringify(data),original=globalThis.fetch;globalThis.fetch=()=>{throw Error('method must not fetch');};try{for(const section of ['core','departments','handoffs'])getAuditMethod({section});assert.throws(()=>getAuditMethod({section:'core',user_input:'synthetic-private-canary'}));assert.equal(JSON.stringify(data),before);assert.ok(!JSON.stringify(getAuditMethod({section:'core'})).includes('synthetic-private-canary'));}finally{globalThis.fetch=original;}
});
await test('tool contract is read-only/idempotent and its enum is canonical',()=>{
 assert.equal(auditMethodTool.annotations.readOnlyHint,true);assert.equal(auditMethodTool.annotations.destructiveHint,false);assert.equal(auditMethodTool.annotations.idempotentHint,true);assert.equal(auditMethodTool.annotations.openWorldHint,false);assert.deepEqual(auditMethodTool.inputSchema.properties.department_ids.items.enum,ids);assert.equal(auditMethodTool.inputSchema.additionalProperties,false);
});
await test('in-memory MCP transport returns method, selected departments and handoffs',async()=>{
 for(const args of [{section:'core'},{section:'departments',department_ids:['04','20']},{section:'handoffs'}]){const r=await rpc(args);assert.equal(r.isError,false);assert.deepEqual(r.structuredContent,getAuditMethod(args));assert.deepEqual(JSON.parse(r.content[0].text),r.structuredContent);}
});
await test('in-memory MCP transport returns explicit error for invalid selection/private extra',async()=>{
 for(const args of [{section:'departments',department_ids:['99']},{section:'departments',department_ids:['04','04']},{section:'core',input:'synthetic-private-canary'}])assert.equal((await rpc(args)).isError,true);
});
const receipt={suite:'REMAKE actual method delivery contract',method_version:data.version,method_sha256:data.sha256,passed,total:results.length,results,execution:'Local direct + in-memory MCP requests; public authored method and synthetic invalid fixtures only',host_routing:false,actual_creative_application:false,private_media_used:false};
console.log(JSON.stringify(receipt));
