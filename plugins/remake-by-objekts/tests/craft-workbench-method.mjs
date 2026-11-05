import test from 'node:test';
import assert from 'node:assert/strict';
import {getAuditMethod,auditMethodTool} from '../audit-method-v037.mjs';
import data from '../audit-method-data-v037.mjs';
test('REMAKE advertises exact local workbench protocols without adding a remote tool',()=>{
 const craft=getAuditMethod({section:'craft'}).craft_context;
 assert.equal(craft.local_workbench.request_protocol,'objekts.craft-workbench-request/1');
 assert.equal(craft.local_workbench.result_protocol,'objekts.craft-workbench-result/1');
 assert.equal(craft.local_workbench.source_path,'tools/craft_workbench.mjs');
 assert.equal(auditMethodTool.name,'remake_get_audit_method');
});
test('REMAKE stays in its diagnostic consumer route, not the prompt compiler',()=>{
 const local=getAuditMethod({section:'craft'}).craft_context.local_workbench;
 assert.equal(local.consumer,'remake');
 assert.deepEqual(local.remake_actions,['context','explore','record']);
 assert.equal(local.remake_actions.includes('produce'),false);
 assert(local.prompt_regimes.includes('FRAME_CONTINUATION'));
});
test('public response retains source/host/spend boundaries',()=>{
 const craft=getAuditMethod({section:'craft'}).craft_context;
 assert.equal(craft.server_fetches_private_github,false);
 assert.equal(craft.receives_or_transmits_private_evidence,false);
 assert.equal(craft.local_workbench.auto_execute,false);
 assert.equal(craft.local_workbench.public_mcp_receives_artifact,false);
 assert.match(craft.local_workbench.status,/NOT_INSTALLED/);
 assert.equal(JSON.stringify(craft).includes('KN-20261104-100-'),false);
});
test('declared-use path requires actual text and excerpt binding',()=>{
 const local=getAuditMethod({section:'craft'}).craft_context.local_workbench;
 assert.match(local.record_requires,/actual artifact text/);
 assert.match(local.record_requires,/UTF16/);
 assert.match(local.output_binding,/not a semantic or artistic judgement/);
});
test('core source method and all 22 department contracts remain exact',()=>{
 const core=getAuditMethod({section:'core'}),departments=getAuditMethod({section:'departments'});
 assert.equal(core.method_sha256,data.sha256);
 assert.deepEqual(core.core,data.core);
 assert.deepEqual(departments.contract,data.departments);
 assert.equal(departments.returned_department_ids.length,22);
});
test('handoff source remains unchanged by optional craft route',()=>{
 const x=getAuditMethod({section:'handoffs'});
 assert.deepEqual(x.handoffs,data.handoffs);assert.deepEqual(x.playbook,data.playbook);
});
test('caller cannot mutate later workbench method responses',()=>{
 const x=getAuditMethod({section:'craft'});x.craft_context.local_workbench.remake_actions.push('deploy');
 assert.equal(getAuditMethod({section:'craft'}).craft_context.local_workbench.remake_actions.includes('deploy'),false);
});
test('public MCP refuses private artifact and action parameters',()=>{
 assert.throws(()=>getAuditMethod({section:'craft',artifact:{text:'private-canary'}}),/unknown method argument/);
 assert.throws(()=>getAuditMethod({section:'craft',action:'record'}),/unknown method argument/);
 assert.throws(()=>getAuditMethod({section:'craft',department_ids:['01']}),/department_ids only/);
});
