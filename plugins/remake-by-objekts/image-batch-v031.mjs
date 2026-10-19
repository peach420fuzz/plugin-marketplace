// REMAKE by objekts v0.31 — ChatGPT host-native array fileParams intake.
// Project has NO fixed reference count; call this transport in bounded batches.
// Stateless, only opt-in temporary host URLs, no persistence or semantic AI.
import {imageToMCP} from "./image-review-v029.mjs";
const MAX_BATCH=8;
const MAX_PAYLOAD=8*1024*1024;
const file={
 type:"object",
 properties:{
  download_url:{type:"string"},
  file_id:{type:"string"},
  mime_type:{type:"string"},
  file_name:{type:"string"}
 },
 required:["download_url","file_id"],
 additionalProperties:false
};
export const batchTool={
 name:"remake_host_image_batch",
 title:"Inspect multiple selected image references",
 description:"Creator-selected ChatGPT file array. Accept 1–8 PNG/JPEG per MCP invocation, and repeat invocations for arbitrarily many sources in the creative project. Computes each file SHA256, binds exact source_id and image block, rejects duplicates and corrupt files, and returns images directly to the AI host for potential visual inspection. Per-image 2 MiB and aggregate 8 MiB limits. Images not stored or sent to objekts. Image bytes in the result do not prove the host model saw them.",
 inputSchema:{
  type:"object",
  properties:{
   files:{type:"array",minItems:1,maxItems:MAX_BATCH,items:file},
   source_ids:{type:"array",minItems:1,maxItems:MAX_BATCH,items:{type:"string",minLength:1,maxLength:100}}
  },
  required:["files"],
  additionalProperties:false
 },
 annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true},
 _meta:{"openai/fileParams":["files"]}
};
const fail=(x)=>{throw Error(x)};
export async function processHostImageBatch(args,{fetcher=fetch}={}){
 if(!args||typeof args!=="object"||Array.isArray(args)||Object.keys(args).some(x=>!["files","source_ids"].includes(x)))fail("invalid_batch_arguments");
 const files=args.files;
 if(!Array.isArray(files)||files.length===0||files.length>MAX_BATCH)fail("batch_limit_1_to_8");
 const sourceIds=args.source_ids===undefined?files.map(f=>f?.file_id):args.source_ids;
 if(!Array.isArray(sourceIds)||sourceIds.length!==files.length)fail("source_file_count_mismatch");
 const ids=new Set(),fids=new Set();
 for(let i=0;i<files.length;i++){
  const obj=files[i],id=sourceIds[i];
  if(!obj||typeof obj!=="object"||Array.isArray(obj)||Object.keys(obj).some(x=>!["download_url","file_id","mime_type","file_name"].includes(x)))fail("malformed_file_input");
  if(typeof id!=="string"||!id.trim()||id.length>100||ids.has(id))fail("missing_or_duplicate_source_id");
  if(typeof obj.file_id!=="string"||!obj.file_id.trim()||fids.has(obj.file_id))fail("missing_or_duplicate_host_file");
  ids.add(id);fids.add(obj.file_id);
 }
 const content=[{type:"text",text:"REMAKE host source images, one tagged text block followed by one MCP image block per verified source. Contents are not creator-approved, independently reviewed, or necessarily seen by the host model."}];
 const evidence=[];
 let encodedBytes=0;
 for(let i=0;i<files.length;i++){
  const one=await imageToMCP({source_id:sourceIds[i],file:files[i]},{fetcher});
  const img=one.content?.find(x=>x.type==="image");
  if(!img||typeof img.data!=="string"||!["image/png","image/jpeg"].includes(img.mimeType))fail("image_content_unavailable");
  encodedBytes+=img.data.length;
  if(encodedBytes>Math.ceil(MAX_PAYLOAD*4/3)+100)fail("batch_aggregate_limit");
  evidence.push(one.structuredContent);
  content.push({type:"text",text:JSON.stringify(one.structuredContent)});
  content.push(img);
 }
 return {
  content,
  structuredContent:{
   schema:"remake.batch_host_images/0.31",
   count:evidence.length,
   sources:evidence,
   source_count_limit_in_project:null,
   batch_transport_limit:MAX_BATCH,
   app_storage:false,
   source_media_sent_to_objekts:false,
   host_observation:"UNVERIFIED_UNTIL_CALLING_MODEL_ACTUALLY_INSPECTS_EACH_IMAGE",
   editorial_review:"NOT_PERFORMED"
  },
  isError:false
 };
}
export async function batchSelfTests(){
 const blob=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg=="),x=>x.charCodeAt(0));
 const file=(i)=>({download_url:"https://files.oaiusercontent.com/media/temporary-"+i,file_id:"file-"+i,mime_type:"image/png"});
 const mock=async()=>new Response(blob,{status:200,headers:{"content-length":String(blob.byteLength)}});
 const checks=[];
 const test=async(name,fn)=>{try{checks.push({name,pass:!!(await fn())})}catch(e){checks.push({name,pass:false,error:String(e.message||e).slice(0,150)})}};
 await test("documented_top_level_array_fileparams",()=>batchTool._meta["openai/fileParams"][0]==="files"&&batchTool.inputSchema.properties.files.items.required.includes("download_url"));
 await test("one_image",async()=>{const r=await processHostImageBatch({files:[file(1)]},{fetcher:mock});return r.structuredContent.count===1&&r.content.filter(x=>x.type==="image").length===1});
 await test("two_images",async()=>{const r=await processHostImageBatch({files:[file(1),file(2)],source_ids:["left","right"]},{fetcher:mock});return r.structuredContent.sources[0].source_id==="left"&&r.structuredContent.sources[1].source_id==="right"&&r.content.length===5});
 await test("seven_images",async()=>{const r=await processHostImageBatch({files:Array.from({length:7},(_,i)=>file(i)),source_ids:Array.from({length:7},(_,i)=>"source-"+i)},{fetcher:mock});return r.structuredContent.count===7&&r.content.filter(x=>x.type==="image").length===7});
 await test("eight_images",async()=>{const r=await processHostImageBatch({files:Array.from({length:8},(_,i)=>file(i))},{fetcher:mock});return r.structuredContent.count===8});
 await test("nine_images_split_required",async()=>{try{await processHostImageBatch({files:Array.from({length:9},(_,i)=>file(i))},{fetcher:mock});return false}catch{return true}});
 await test("empty_project_not_transport_error",()=>batchTool.description.includes("arbitrarily many sources"));
 await test("duplicate_file_id_rejected",async()=>{try{await processHostImageBatch({files:[file(1),file(1)]},{fetcher:mock});return false}catch{return true}});
 await test("duplicate_source_id_rejected",async()=>{try{await processHostImageBatch({files:[file(1),file(2)],source_ids:["x","x"]},{fetcher:mock});return false}catch{return true}});
 await test("mismatched_source_count_rejected",async()=>{try{await processHostImageBatch({files:[file(1),file(2)],source_ids:["x"]},{fetcher:mock});return false}catch{return true}});
 await test("missing_download_url_rejected",async()=>{try{await processHostImageBatch({files:[{file_id:"id"}]},{fetcher:mock});return false}catch{return true}});
 await test("cross_domain_rejected",async()=>{try{await processHostImageBatch({files:[{...file(1),download_url:"https://evil.invalid/private"}]},{fetcher:mock});return false}catch{return true}});
 await test("corrupted_second_file_aborts_all",async()=>{let i=0;try{await processHostImageBatch({files:[file(1),file(2)]},{fetcher:async()=>{i++;const c=i===1?blob:new Uint8Array(blob.map((v,j)=>j===50?v^1:v));return new Response(c)}});return false}catch{return i===2}});
 await test("source_provenance_sha256",async()=>{const r=await processHostImageBatch({files:[file(1),file(2)]},{fetcher:mock});return r.structuredContent.sources.every(x=>/^[a-f0-9]{64}$/.test(x.source_sha256)&&x.server_visual_understanding===false)});
 await test("no_fake_model_perception",async()=>{const r=await processHostImageBatch({files:[file(1)]},{fetcher:mock});return r.structuredContent.host_observation.startsWith("UNVERIFIED")&&r.structuredContent.editorial_review==="NOT_PERFORMED"});
 await test("no_host_account_assertion",async()=>{const r=await processHostImageBatch({files:[file(1)]},{fetcher:mock});return r.structuredContent.app_storage===false&&r.structuredContent.source_media_sent_to_objekts===false});
 return {passed:checks.filter(x=>x.pass).length,total:checks.length,checks,scope:"Synthetic 1x1 PNG stub URLs only; no real ChatGPT fileParams handoff or independent image interpretation proved."};
}
