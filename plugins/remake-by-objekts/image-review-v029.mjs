// REMAKE by objekts 0.29: opt-in image pixels returned directly to MCP host.
// This produces MCP ImageContent, NOT server-side image interpretation.
// No video frame decoding, file storage, user identity, or authenticated creative approval.
import {fetchVerifiedHostBytes,fingerprintBytes,analyzeMedia,MAX_BYTES} from "./host-file-v028.mjs";
const LIMIT=1024*1024*2;
const fail=(code)=>{throw Error(code)};
const base64=(bytes)=>{
 let s="";
 for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(s);
};
const fileSchema={
 type:"object",
 properties:{download_url:{type:"string"},file_id:{type:"string"},mime_type:{type:"string"},file_name:{type:"string"}},
 required:["download_url","file_id"],
 additionalProperties:false
};
export const visionTool={
 name:"remake_host_image_for_review",
 title:"Inspect an explicitly selected image",
 description:"Optional ChatGPT source image bridge. Receives only a creator-selected PNG/JPEG from a temporary host file URL, verifies source SHA256 and sends an MCP image content block to the calling AI host for an actual possible visual review. No independent vision on server; the host must truly display/inspect the image before making visual claims. Max 2 MiB, 4096 pixels per dimension. Rejects video and unsupported formats. Does not store or forward media to objekts.",
 inputSchema:{type:"object",properties:{
  source_id:{type:"string",minLength:1,maxLength:100},
  file:fileSchema
 },required:["source_id","file"],additionalProperties:false},
 annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true},
 _meta:{"openai/fileParams":["file"]}
};
export async function imageToMCP(a,{fetcher=fetch}={}){
 const record=await fetchVerifiedHostBytes(a,{fetcher});
 const b=record.bytes;
 if(b.length>LIMIT)fail("image_inline_size_limit");
 const format=fingerprintBytes(b);
 if(!["image/png","image/jpeg"].includes(format.mime_type))fail("unsupported_inline_image_type");
 if(!format.width||!format.height||format.width>4096||format.height>4096)fail("inline_image_dimensions_limit");
 const meta=await analyzeMedia({...record});
 // A signed host URL and matching file bytes do not prove actual human authorization, model perception or copyright.
 const safe={
  source_id:meta.source_id,source_sha256:meta.sha256,file_ref:meta.file_ref,
  width:format.width,height:format.height,mime_type:format.mime_type,
  host_media_received:true,
  server_visual_understanding:false,
  host_model_observation:"UNVERIFIED_UNTIL_CALLING_MODEL_ACTUALLY_INSPECTS_IMAGE",
  source_timecode:null,app_storage:false,
  rights_status:"NOT_VERIFIED",approval_status:"UNVERIFIED"
 };
 return {
  structuredContent:safe,
  content:[
   {type:"text",text:JSON.stringify(safe)+"\nThe next content block contains actual image bytes. Inspect them directly before describing their visual contents. Do not claim video movement, times, unseen frames or creator approval."},
   {type:"image",data:base64(b),mimeType:format.mime_type}
  ],
  isError:false
 };
}
export async function imageSelfTests(){
 const sample=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5+4N8AAAAASUVORK5CYII="),x=>x.charCodeAt(0));
 const f={download_url:"https://files.oaiusercontent.com/allowed-expiring-link",file_id:"file_fixture",mime_type:"image/png"};
 const args={source_id:"image-s1",file:f};
 const response=()=>new Response(sample,{status:200,headers:{"content-length":String(sample.length)}});
 const check=async(name,run)=>{try{results.push({name,pass:!!(await run())});}catch(e){results.push({name,pass:false,error:String(e.message||e).slice(0,130)})}};
 const results=[];
 await check("image_tool_declares_openai_fileparams",()=>visionTool._meta["openai/fileParams"][0]==="file");
 await check("correct_nested_openai_file_schema",()=>JSON.stringify(visionTool.inputSchema.properties.file.required)===JSON.stringify(["download_url","file_id"])&&!!visionTool.inputSchema.properties.file.properties.file_name);
 await check("valid_png_image_content",async()=>{const r=await imageToMCP(args,{fetcher:async()=>response()});return r.content.length===2&&r.content[1].type==="image"&&r.content[1].mimeType==="image/png"&&r.content[1].data===base64(sample)});
 await check("no_fake_visual_claim",async()=>{const r=await imageToMCP(args,{fetcher:async()=>response()});return r.structuredContent.server_visual_understanding===false&&r.structuredContent.host_model_observation.startsWith("UNVERIFIED")});
 await check("sha256_source_binding",async()=>{const r=await imageToMCP(args,{fetcher:async()=>response()});return /^[a-f0-9]{64}$/.test(r.structuredContent.source_sha256)});
 await check("no_stored_or_silent_handoff",async()=>{const r=await imageToMCP(args,{fetcher:async()=>response()});return r.structuredContent.app_storage===false&&r.structuredContent.approval_status==="UNVERIFIED"});
 await check("video_rejected",async()=>{let b=new Uint8Array(32);b.set(new TextEncoder().encode("ftyp"),4);b.set(new TextEncoder().encode("isom"),8);try{await imageToMCP({source_id:"vid",file:{...f,mime_type:"video/mp4"}},{fetcher:async()=>new Response(b)});return false}catch{return true}});
 await check("missing_image_rejected",async()=>{try{await imageToMCP({source_id:"im",file:{file_id:"x"}},{fetcher:async()=>response()});return false}catch{return true}});
 await check("malicious_origin_rejected",async()=>{try{await imageToMCP({source_id:"im",file:{...f,download_url:"https://files.oaiusercontent.com.evil.com/x"}},{fetcher:async()=>response()});return false}catch{return true}});
 await check("missing_file_error",async()=>{try{await imageToMCP(args,{fetcher:async()=>new Response("not found",{status:404})});return false}catch{return true}});
 await check("unsupported_text_rejected",async()=>{try{await imageToMCP(args,{fetcher:async()=>new Response(new TextEncoder().encode("It is a file not an image."))});return false}catch{return true}});
 await check("huge_image_rejected",async()=>{const huge=new Uint8Array(LIMIT+1);huge.set(sample.slice(0,24));const first=new Uint8Array(huge.slice(0,24));try{await imageToMCP(args,{fetcher:async()=>new Response(huge)});return false}catch{return true}});
 await check("no_timecode_inferred",async()=>{const r=await imageToMCP(args,{fetcher:async()=>response()});return r.structuredContent.source_timecode===null});
 await check("base64_roundtrip",()=>{const src=base64(sample);return Uint8Array.from(atob(src),x=>x.charCodeAt(0)).every((v,i)=>v===sample[i])});
 return {passed:results.filter(x=>x.pass).length,total:results.length,results,scope:"All tests use local synthetic 1x1 PNG and an injected stub fetcher. No real ChatGPT plugin host result rendering has been confirmed."};
}
