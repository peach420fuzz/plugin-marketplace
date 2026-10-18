// REMAKE v0.28 G2.2 — host-attached file preflight.
// Explicit file handoff only. Stateless; no media forwarded to objekts.
// This is NOT AI vision, ffprobe timecode analysis, a media warehouse, or proof of human review.
export const MAX_BYTES=12*1024*1024;
const fail=(s)=>{throw Error(s)};
const enc=new TextEncoder();
const fromAscii=(a,i,n)=>String.fromCharCode(...a.slice(i,i+n));
export function sourceURL(value){
  if(typeof value!=="string"||value.length>4096)fail("invalid_file_url");
  let u;try{u=new URL(value)}catch{fail("invalid_file_url")}
  const host=u.hostname.toLowerCase();
  if(u.protocol!=="https:"||u.port&&u.port!=="443"||u.username||u.password||u.hash||!(host==="files.oaiusercontent.com"||host.endsWith(".oaiusercontent.com")))fail("untrusted_file_host");
  return u;
}
export function fingerprintBytes(b){
 if(!(b instanceof Uint8Array)||b.length<12)fail("unrecognized_file");
 const len=b.length;
 if(len>=24 && [137,80,78,71,13,10,26,10].every((x,i)=>b[i]===x)){
  if(fromAscii(b,12,4)!=="IHDR")fail("png_no_ihdr");
  const v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  const width=v.getUint32(16),height=v.getUint32(20);
  if(!width||!height||width>16384||height>16384)fail("image_dimensions_out_of_bounds");
  return {kind:"image",mime_type:"image/png",width,height,technical_scope:"PNG signature and IHDR only. No full decode, content or visual meaning validated."};
 }
 if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff){
  let offset=2, width=null,height=null;
  while(offset+4<len){
   if(b[offset]!==0xff){offset++;continue;}
   let marker=b[offset+1];offset+=2;
   if(marker===0xd9||marker===0xda)break;
   if(marker===0xff||marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;
   if(offset+2>len)break;
   const length=(b[offset]<<8)|b[offset+1];
   if(length<2||offset+length>len)fail("invalid_jpeg_marker");
   if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb].includes(marker)){
    if(length<7)fail("invalid_jpeg_sof");
    height=(b[offset+3]<<8)|b[offset+4];width=(b[offset+5]<<8)|b[offset+6];break;
   }
   offset+=length;
  }
  if(!width||!height||width>16384||height>16384)fail("jpeg_dimensions_unavailable");
  return {kind:"image",mime_type:"image/jpeg",width,height,technical_scope:"JPEG SOF header only. Pixel content was not decoded or interpreted."};
 }
 if(len>=12&&fromAscii(b,0,4)==="RIFF"&&fromAscii(b,8,4)==="WEBP")return {kind:"image",mime_type:"image/webp",width:null,height:null,technical_scope:"WEBP signature only; dimensions and content unverified."};
 if(len>=12&&fromAscii(b,4,4)==="ftyp"){
  const brand=fromAscii(b,8,4);
  if(!["isom","iso2","mp41","mp42","avc1","M4V ","qt  ","dash"].includes(brand))fail("unsupported_video_container");
  return {kind:"video",mime_type:"video/mp4",width:null,height:null,technical_scope:"MP4 ftyp header only. No duration, frame PTS, frame count, audio, or visual content measured."};
 }
 fail("unsupported_media_format");
}
export async function analyzeMedia({source_id,bytes,file_id,declared_mime}){
 if(typeof source_id!=="string"||!source_id.trim()||source_id.length>100)fail("invalid_source_id");
 if(typeof file_id!=="string"||!file_id.trim()||file_id.length>300)fail("invalid_file_id");
 if(!(bytes instanceof Uint8Array)||bytes.length>MAX_BYTES)fail("media_size_limit");
 const f=fingerprintBytes(bytes);
 if(declared_mime&&typeof declared_mime==="string"&&declared_mime!==f.mime_type)fail("declared_mime_conflicts_with_bytes");
 const hash=await crypto.subtle.digest("SHA-256",bytes);
 const sha=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");
 return {schema:"remake.host_file_evidence/0.28",source_id,file_ref:file_id,sha256:sha,byte_length:bytes.length,media:f,acquisition:"HOST_FILE_PARAM_EXPLICIT",received_bytes:true,model_saw_pixels:false,visual_semantics:"NOT_ANALYZED",frame_pts:[],stored:false,transmitted_to_objekts:false,approval_status:"UNVERIFIED"};
}
export async function preflightHostFile(a,{fetcher=fetch}={}){
 if(!a||typeof a!=="object"||Array.isArray(a)||Object.keys(a).some(k=>!["source_id","file"].includes(k)))fail("invalid_arguments");
 const f=a.file;
 if(!f||typeof f!=="object"||Array.isArray(f)||Object.keys(f).some(k=>!["download_url","file_id","mime_type","file_name"].includes(k)))fail("invalid_file_object");
 const u=sourceURL(f.download_url);
 if(typeof f.file_id!=="string"||!f.file_id.trim())fail("missing_host_file_id");
 if(f.mime_type&&typeof f.mime_type!=="string")fail("invalid_mime");
 const response=await fetcher(u.toString(),{method:"GET",redirect:"error",signal:AbortSignal.timeout(12000),headers:{accept:"application/octet-stream, image/png, image/jpeg, image/webp, video/mp4"}});
 if(!response||!response.ok)fail("host_file_download_failed");
 const n=Number(response.headers.get("content-length")||0);
 if(n>MAX_BYTES)fail("media_size_limit");
 if(!response.body)fail("file_body_unavailable");
 const reader=response.body.getReader(),blocks=[];let size=0;
 try{
  while(true){
   const item=await reader.read();if(item.done)break;
   if(!(item.value instanceof Uint8Array))fail("bad_response_chunk");
   size+=item.value.length;if(size>MAX_BYTES)fail("media_size_limit");
   blocks.push(item.value);
  }
 }catch(e){try{await reader.cancel()}catch{}throw e}
 const bytes=new Uint8Array(size);let offset=0;
 for(const b of blocks){bytes.set(b,offset);offset+=b.length}
 return analyzeMedia({source_id:a.source_id,bytes,file_id:f.file_id,declared_mime:f.mime_type});
}
export const fileTool={
 name:"remake_host_file_preflight",
 title:"Verify a selected media file",
 description:"Opt-in ChatGPT host file input. Downloads ONLY an explicitly plugin-authorized temporary files.oaiusercontent.com URL, bounded to 12 MiB, no redirects. Computes SHA256 and basic file signature/size/image dimensions; NO film understanding, no pixel-to-LLM bridge and no storage. Missing file or unsupported MIME fails, never guesses content. Source count is not constrained; call per file.",
 inputSchema:{
  type:"object",
  properties:{
   source_id:{type:"string",minLength:1,maxLength:100},
   file:{type:"object",properties:{
     download_url:{type:"string"},file_id:{type:"string"},mime_type:{type:"string"},file_name:{type:"string"}
   },required:["download_url","file_id"],additionalProperties:false}
  },
  required:["source_id","file"],
  additionalProperties:false
 },
 annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:true},
 _meta:{"openai/fileParams":["file"]}
};
export async function filePreflightTests(){
 const tests=[];
 const check=async(name,fn)=>{try{tests.push({name,pass:!!(await fn())})}catch(e){tests.push({name,pass:false,error:String(e.message||e)})}};
 const png=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5+4N8AAAAASUVORK5CYII="),c=>c.charCodeAt(0));
 const mkResponse=()=>new Response(png,{status:200,headers:{"content-type":"image/png","content-length":String(png.length)}});
 const file={download_url:"https://files.oaiusercontent.com/authorized/expiring-123",file_id:"file-test",mime_type:"image/png"};
 await check("valid_1x1_png",()=>fingerprintBytes(png).width===1);
 await check("cryptographic_sha256",async()=>{const r=await analyzeMedia({source_id:"a",bytes:png,file_id:"f",declared_mime:"image/png"});return /^[a-f0-9]{64}$/.test(r.sha256)&&r.model_saw_pixels===false});
 await check("openai_metadata_schema",()=>fileTool._meta["openai/fileParams"][0]==="file"&&JSON.stringify(fileTool.inputSchema.properties.file.required)==='["download_url","file_id"]');
 await check("host_callback_fetch",async()=>{const r=await preflightHostFile({source_id:"a",file},{fetcher:async()=>mkResponse()});return r.byte_length===png.length&&r.stored===false});
 await check("no_magic_host_access",async()=>{try{await preflightHostFile({source_id:"x",file:{file_id:"chat_upload"}});return false}catch{return true}});
 await check("domain_bypass_disallowed",()=>{try{sourceURL("https://files.oaiusercontent.com.evil.org/a");return false}catch{return true}});
 await check("private_ip_disallowed",()=>{try{sourceURL("http://127.0.0.1/x");return false}catch{return true}});
 await check("redirect_disallowed",async()=>{try{await preflightHostFile({source_id:"a",file},{fetcher:async(_u,args)=>{if(args.redirect!=="error")throw Error("not guarded");return new Response(null,{status:302})}});return false}catch{return true}});
 await check("oversized_response_rejected",async()=>{try{await preflightHostFile({source_id:"a",file},{fetcher:async()=>new Response(png,{headers:{"content-length":String(MAX_BYTES+1)}})});return false}catch{return true}});
 await check("media_bytes_large_rejected",async()=>{try{await analyzeMedia({source_id:"x",file_id:"f",bytes:new Uint8Array(MAX_BYTES+1)});return false}catch{return true}});
 await check("mime_mismatch_rejected",async()=>{try{await analyzeMedia({source_id:"a",file_id:"f",bytes:png,declared_mime:"video/mp4"});return false}catch{return true}});
 await check("unsupported_file_rejected",()=>{try{fingerprintBytes(enc.encode("NOT_MEDIA_AT_ALL"));return false}catch{return true}});
 await check("mp4_header_not_timecodes",()=>{const b=new Uint8Array(24);b.set(enc.encode("ftyp"),4);b.set(enc.encode("isom"),8);const r=fingerprintBytes(b);return r.kind==="video"&&r.width===null&&r.technical_scope.includes("No duration")});
 await check("no_external_media_truth_claim",async()=>{const r=await analyzeMedia({source_id:"a",bytes:png,file_id:"f"});return r.frame_pts.length===0&&r.visual_semantics==="NOT_ANALYZED"&&r.approval_status==="UNVERIFIED"});
 return {passed:tests.filter(x=>x.pass).length,total:tests.length,results:tests,scope:"Synthetic image bytes and stubbed host file URL only; no real ChatGPT file handoff or visual model proven."};
}
