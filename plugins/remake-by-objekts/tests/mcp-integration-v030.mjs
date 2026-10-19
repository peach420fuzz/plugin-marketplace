// REMAKE CI: exercise the ACTUAL MCP JSON-RPC dispatcher (not only helper functions).
// Synthetic 1x1 PNG, injected host file URL fetcher, no customer media or secrets.
import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import worker from "../worker.mjs";
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const png=Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==","base64"));
const broken=png.slice();broken[50]^=1;
const originalFetch=globalThis.fetch;
let incoming=png,requested=false;
globalThis.fetch=async(url,opts)=>{
 requested=true;
 assert.match(url,/^https:\/\/files\.oaiusercontent\.com\/auth\/temporary$/);
 assert.equal(opts.redirect,"error");
 return new Response(incoming,{status:200,headers:{"content-length":String(incoming.length)}});
};
let counter=0;let passed=0;
async function rpc(method,params){
 const id=++counter;
 const response=await worker.fetch(new Request("https://remake.objekts.ai/mcp",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id,method,params})}),{});
 assert.equal(response.status,200);
 const output=await response.json();
 assert.equal(output.jsonrpc,"2.0");assert.equal(output.id,id);
 return output;
}
try{
 const init=await rpc("initialize",{protocolVersion:"2025-06-18",clientInfo:{name:"ci-test",version:"0"},capabilities:{}});
 assert.equal(init.result.serverInfo.name,"REMAKE by objekts");passed++;
 const list=await rpc("tools/list",{});
 const names=list.result.tools.map(t=>t.name);
 assert.equal(names.length,9);
 for(const name of ["remake_host_image_for_review","remake_host_image_batch","remake_host_file_preflight","remake_project_validate"])assert.ok(names.includes(name));
 const schema=list.result.tools.find(t=>t.name==="remake_host_image_for_review");
 assert.deepEqual(schema._meta["openai/fileParams"],["file"]);
 assert.deepEqual(schema.inputSchema.properties.file.required,["download_url","file_id"]);
 passed++;
 const args={source_id:"fixture-01",file:{download_url:"https://files.oaiusercontent.com/auth/temporary",file_id:"file-fixture",mime_type:"image/png"}};
 const image=await rpc("tools/call",{name:"remake_host_image_for_review",arguments:args});
 assert.ok(requested);
 assert.equal(image.result.isError,false);
 assert.equal(image.result.content[1].type,"image");
 assert.equal(image.result.content[1].mimeType,"image/png");
 assert.equal(image.result.content[1].data,Buffer.from(png).toString("base64"));
 assert.equal(image.result.structuredContent.host_model_observation,"UNVERIFIED_UNTIL_CALLING_MODEL_ACTUALLY_INSPECTS_IMAGE");
 assert.equal(image.result.structuredContent.source_sha256,(await import("node:crypto")).createHash("sha256").update(png).digest("hex"));
 passed++;
 const one=(n)=>({download_url:"https://files.oaiusercontent.com/auth/temporary",file_id:"batch-file-"+n,mime_type:"image/png"});
 const batch2=await rpc("tools/call",{name:"remake_host_image_batch",arguments:{files:[one(1),one(2)],source_ids:["LEFT","RIGHT"]}});
 assert.equal(batch2.result.isError,false);
 assert.equal(batch2.result.structuredContent.count,2);
 assert.deepEqual(batch2.result.structuredContent.sources.map(x=>x.source_id),["LEFT","RIGHT"]);
 assert.equal(batch2.result.content.filter(x=>x.type==="image").length,2);passed++;
 const seven=await rpc("tools/call",{name:"remake_host_image_batch",arguments:{files:Array.from({length:7},(_,i)=>one(i+1)),source_ids:Array.from({length:7},(_,i)=>"src-"+i)}});
 assert.equal(seven.result.isError,false);
 assert.equal(seven.result.content.filter(x=>x.type==="image").length,7);
 assert.equal(seven.result.structuredContent.count,7);passed++;
 const duplicate=await rpc("tools/call",{name:"remake_host_image_batch",arguments:{files:[one(1),one(1)]}});
 assert.equal(duplicate.result.isError,true);
 assert.match(duplicate.result.content[0].text,/duplicate/);passed++;
 incoming=broken;
 const corrupt=await rpc("tools/call",{name:"remake_host_image_for_review",arguments:args});
 assert.equal(corrupt.result.isError,true);
 assert.match(corrupt.result.content[0].text,/png_crc_mismatch/);passed++;
 incoming=png;
 const badHost=await rpc("tools/call",{name:"remake_host_image_for_review",arguments:{...args,file:{...args.file,download_url:"https://evil.com/a"}}});
 assert.equal(badHost.result.isError,true);passed++;
 const made=await rpc("tools/call",{name:"remake_project_create",arguments:{project_id:"ci-project",title:"test"}});
 assert.equal(made.result.structuredContent.project.revision,1);passed++;
 const conflicts=await rpc("tools/call",{name:"check_explicit_project_locks",arguments:{locks:[{key:"CAMERA",value:"static"}],proposed_changes:[{key:"CAMERA",new_value:"dolly"}]}});
 assert.equal(conflicts.result.structuredContent.allow_edit,false);passed++;
 const protectedPath="https://remake.objekts.ai/_image_selftest";
 const blocked=await worker.fetch(new Request(protectedPath),{});
 assert.equal(blocked.status,404);passed++;
 const namesOfSuites=["_image_selftest","_file_selftest","_core_selftest","_selftest","_batch_selftest"];
 const counts=[19,14,17,9,16];
 for(let i=0;i<namesOfSuites.length;i++){
  const res=await worker.fetch(new Request("https://remake.objekts.ai/"+namesOfSuites[i],{headers:{"x-remake-diag-token":"synthetic-ci-only"}}),{REMAKE_DIAGNOSTIC_TOKEN:"synthetic-ci-only"});
  assert.equal(res.status,200);
  const v=await res.json();assert.equal(v.passed,v.total);assert.equal(v.passed,counts[i]);passed++;
 }
 const health=await worker.fetch(new Request("https://remake.objekts.ai/health"),{});
 assert.equal((await health.json()).storage,false);passed++;
 process.stdout.write(JSON.stringify({suite:"MCP dispatcher E2E",passed,total:17,synthetic:true,host:"node-inmemory",actual_chatgpt_attachment:false})+"\n");
}finally{globalThis.fetch=originalFetch;}
