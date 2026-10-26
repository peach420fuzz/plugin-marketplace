// Uses the existing private project storage. No new generation provider or schema.
function imageBytesValid(bytes,mime){
  return mime==='image/png'?bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v):mime==='image/jpeg'?bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
}
function bytesBase64(bytes){let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(binary);}

async function preparePortraitRequest(service,input){
  const project=await service.store.getProject(input.projectId,input.projectKey);
  if(project.currentVersion!==input.expectedVersion)throw new Error('Character State changed. Save and prepare the portrait again.');
  const image=decodeImageDataUrl(input.geometryDataUrl,4*1024*1024,'Geometry board');
  if(!imageBytesValid(image.bytes,image.mimeType))throw new Error('Geometry image bytes do not match the declared format.');
  const requestId='frequest_'+crypto.randomUUID();
  const requestToken=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
  const expiresAt=Date.now()+15*60*1000;
  const geometryKey=`projects/${project.projectId}/requests/${requestId}/geometry`;
  const manifest={format:'FAKE_NATIVE_PORTRAIT_REQUEST',projectId:project.projectId,stateVersion:project.currentVersion,identityMasterOutputId:project.identityMasterOutputId??null,sourceReferenceAssetId:project.state.identity.sourceReferenceAssetId??null,requestTokenHash:await hashProjectKey(requestToken),expiresAt,prompt:input.prompt,geometryMimeType:image.mimeType};
  await service.assets.put(geometryKey,image.bytes,{httpMetadata:{contentType:image.mimeType}});
  await service.assets.put(geometryKey+'.json',JSON.stringify(manifest),{httpMetadata:{contentType:'application/json'}});
  const current=await service.store.getProject(input.projectId,input.projectKey);
  if(current.currentVersion!==manifest.stateVersion||(current.identityMasterOutputId??null)!==manifest.identityMasterOutputId)throw new Error('Character State or Master changed during preparation. Request cancelled.');
  const now=new Date().toISOString();
  await service.store.db.prepare(`INSERT INTO generation_jobs (job_id,project_id,state_version,status,requested_count,completed_count,geometry_key,provider,model,error,created_at,updated_at) VALUES (?,?,?,'PREPARED',1,0,?,'NATIVE_CONVERSATION_HOST','NOT_ASSERTED',NULL,?,?)`).bind(requestId,project.projectId,project.currentVersion,geometryKey,now,now).run();
  return {requestId,requestToken,expiresAt,stateVersion:project.currentVersion,status:'PREPARED'};
}

async function readPortraitRequest(service,input){
  const job=await service.store.db.prepare('SELECT * FROM generation_jobs WHERE job_id = ?').bind(input.requestId).first();
  if(!job||job.provider!=='NATIVE_CONVERSATION_HOST')throw new Error('Portrait request is unavailable or expired.');
  const saved=await service.assets.get(job.geometry_key+'.json');
  if(!saved)throw new Error('Portrait request is unavailable or expired.');
  const manifest=await saved.json();
  if(manifest.expiresAt<Date.now()||manifest.requestTokenHash!==await hashProjectKey(input.requestToken))throw new Error('Portrait request is unavailable or expired.');
  const row=await service.store.db.prepare('SELECT current_version,identity_master_output_id,state_json FROM projects WHERE project_id = ?').bind(job.project_id).first();
  if(!row||row.current_version!==manifest.stateVersion||(row.identity_master_output_id??null)!==manifest.identityMasterOutputId)throw new Error('Saved character or Master changed. Reopen Studio and prepare the portrait again.');
  const images=[];
  if(manifest.identityMasterOutputId){const master=await service.store.getOutput(manifest.identityMasterOutputId);if(master.projectId!==job.project_id||master.status!=='READY')throw new Error('Identity Master is unavailable.');images.push({role:'APPROVED IDENTITY MASTER',key:master.imageKey});}
  if(manifest.sourceReferenceAssetId){const source=await service.store.getReferenceAsset(manifest.sourceReferenceAssetId);if(source.projectId!==job.project_id)throw new Error('Identity reference does not belong to this character.');images.push({role:'SOURCE IDENTITY REFERENCE',key:source.r2Key,mimeType:source.mimeType});}
  images.push({role:'AUTHORED GNM GEOMETRY — shape reference, not clay skin',key:job.geometry_key,mimeType:manifest.geometryMimeType});
  const content=[{type:'text',text:manifest.prompt+'\n\nThe following image blocks are the actual saved reference bytes for this request. Use the built-in image-generation tool now, preserving their labeled roles. Return the actual image, or report that the current conversation has no image-generation capability. Never claim generation merely from receiving these references.'}];
  for(const image of images){const object=await service.assets.get(image.key);if(!object)throw new Error('A required reference image is unavailable.');const bytes=new Uint8Array(await object.arrayBuffer());const mimeType=image.mimeType??object.httpMetadata?.contentType;if(!imageBytesValid(bytes,mimeType))throw new Error('Saved reference format is invalid.');content.push({type:'text',text:image.role},{type:'image',mimeType,data:bytesBase64(bytes)});}
  return {content,structuredContent:{status:'REFERENCES_READY',stateVersion:manifest.stateVersion,referenceCount:images.length,imageGenerationPerformed:false}};
}

function registerGenerationBridge(server,service){
  j(server,'prepare_portrait_request',{
    title:'Prepare authored portrait references',description:'App-only: save the real geometry board and current reference selection for a short-lived native conversation generation request. Does not generate images.',
    inputSchema:object({projectId:string2().min(8),projectKey:string2().min(16),expectedVersion:number2().int().positive(),geometryDataUrl:string2().min(100).max(57e5),prompt:string2().min(20).max(30000)}),
    _meta:toolMeta(['app']),annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:false},
  },async input=>({content:[{type:'text',text:'Portrait references prepared; image generation has not run.'}],structuredContent:await preparePortraitRequest(service,input)}));
  j(server,'read_portrait_request',{
    title:'Read authored portrait images for generation',description:'Read actual GNM geometry and selected identity reference images for a user-requested portrait using the short-lived requestId and requestToken sent by Studio. After this returns image blocks, invoke the conversation built-in image-generation tool and return the actual photograph. This tool does not generate images or approve a Master. Never request project credentials.',
    inputSchema:object({requestId:string2().min(20).max(80),requestToken:string2().regex(/^[a-f0-9]{64}$/)}),
    _meta:toolMeta(['model']),annotations:{readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false},
  },input=>readPortraitRequest(service,input));
}
