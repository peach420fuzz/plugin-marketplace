#!/usr/bin/env node
// REMAKE directory package preflight — fail closed on icons/assets and branding.
// This cannot verify real publisher consent, host media delivery or artistic quality.
// Call with --strict in release workflow; default records blockers but exits 0 for beta.
import {readFileSync,statSync,existsSync} from "node:fs";
import {resolve,join,relative} from "node:path";
import {createHash} from "node:crypto";
const root=resolve(process.cwd(),"plugins/remake-by-objekts");
const findings=[],passed=[],advisory=[];
const add=(f)=>findings.push(f);
const j=(p)=>JSON.parse(readFileSync(p,"utf8"));
let plugin={};
try{plugin=j(join(root,"plugin.json"));}catch{add("manifest_missing_or_invalid");}
const x=plugin.extensions?.["com.openai"]?.interface||{};
for(const key of ["websiteURL","supportURL","privacyPolicyURL","termsOfServiceURL"]){
 const value=x[key];let valid=false;
 try{const u=new URL(value);valid=u.protocol==="https:"&&!!u.hostname&&!u.username&&!u.password&&!u.hash}catch{}
 if(!valid)add("missing_or_invalid_"+key);else passed.push("valid_url_"+key);
}
for(const field of ["logo","composerIcon"]){
 const rel=x[field]||"";
 if(typeof rel!=="string"||!rel.startsWith("./assets/")){add("missing_"+field);continue;}
 const target=resolve(root,rel);
 if(!relative(root,target)||relative(root,target).startsWith("..")||!existsSync(target)){add("unresolvable_"+field);continue;}
 const data=readFileSync(target),ext=rel.toLowerCase().split(".").at(-1);
 if(data.length>5*1024*1024||data.length<30){add("invalid_size_"+field);continue;}
 let width=0,height=0;
 if(ext==="png"&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){
  width=data.readUInt32BE(16);height=data.readUInt32BE(20);
 }else if(ext==="webp"&&data.toString("ascii",0,4)==="RIFF"&&data.toString("ascii",8,12)==="WEBP"){
  advisory.push("decode_webp_required_"+field);
 }else if(ext==="svg"&&data.toString("utf8").includes("<svg")){
  advisory.push("validate_svg_dimensions_"+field);
 }else if(["jpg","jpeg"].includes(ext)&&data[0]===255&&data[1]===216){
  advisory.push("decode_jpeg_required_"+field);
 }else{add("unsupported_or_mismatched_image_"+field);continue;}
 if(width&&height&&(width!==height||width<48||width>4096))add("wrong_icon_dimensions_"+field);
 if(!findings.some(y=>y.endsWith("_"+field)))passed.push("icon_bytes_present_"+field);
}
const provenance=join(root,"assets/brand_authority.json");
if(!existsSync(provenance)){add("brand_authority_receipt_missing");}
else{
 try{const v=j(provenance);if(!v.original_sha256||!v.owner_approval_ref)add("brand_authority_receipt_incomplete");else advisory.push("verify_owner_approval_ref_outside_self_asserted_package");}catch{add("brand_authority_receipt_invalid");}
}
const mcp=join(root,"mcp.json");
if(!existsSync(mcp))add("mcp_configuration_missing");else passed.push("mcp_config_present");
const result={release_ready:findings.length===0,blockers:[...new Set(findings)].sort(),passed,advisory,manifestVersion:plugin.version||null,scope:"Static packaging only. Host real image handoff, original brand ownership/consent, identity and real director evaluations require external receipts."};
process.stdout.write(JSON.stringify(result,null,2)+"\n");
if(process.argv.includes("--strict")&&!result.release_ready)process.exit(2);
