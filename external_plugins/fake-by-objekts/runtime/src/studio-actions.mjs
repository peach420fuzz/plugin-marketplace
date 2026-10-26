// Inserted into the recovered Studio module, where the existing state/render APIs live.
async function S3(t) {
  const snapshot = structuredClone(t.snapshot);
  t.assertLocalSnapshot();
  const current = await t.readProject();
  Ou(snapshot,current);
  const master = _3(current,t.origin);
  const source = await g3({projectId:snapshot.projectId,version:snapshot.currentVersion,referenceAssetId:snapshot.state.identity.sourceReferenceAssetId,origin:t.origin},async()=>({projectId:current.projectId,version:current.currentVersion,referenceAssetId:current.state.identity.sourceReferenceAssetId,sourceReferenceUrl:current.sourceReferenceUrl||null}));
  const files=[];
  if(master)files.push({role:'APPROVED IDENTITY MASTER',file:await t.readMedia(master,`fake-${snapshot.projectId}-master`)});
  if(source)files.push({role:'SOURCE IDENTITY REFERENCE',file:await t.readMedia(source,snapshot.state.identity.sourceReferenceFileName||'source-reference')});
  files.push({role:'AUTHORED GNM GEOMETRY — shape reference, not skin or photographic finish',file:await t.makeGeometryFile()});
  t.assertLocalSnapshot();
  Ou(snapshot,await t.readProject());
  const prompt=auditionPrompt(m3(snapshot.state,{hasIdentityMaster:!!master,hasSourceReference:!!source},0),snapshot.currentVersion);
  return sendHandoff({app:Ur,getNativeHost:()=>V2?wA:window.openai,files,prompt,stateVersion:snapshot.currentVersion,modelContent:`FAKE by objekts. Saved state v${snapshot.currentVersion}. ${files.map((f,i)=>`Image ${i+1}: ${f.role}`).join('. ')}`,assertCurrent:t.assertLocalSnapshot,exportFiles:async pack=>showGenerationExport(pack)});
}

let generationPending=false;
async function qA() {
  if(generationPending)return;
  if(!ue||!bt?.isReady()){St('GNM geometry is not ready.','error');return;}
  generationPending=true;u0();
  try{
    if(Wt.size)await X2();
    if(Wt.size)throw new Error('Save did not finish. Generation was not sent.');
    const snapshot={...structuredClone(ue),state:hl(ue.state)},key=Os;
    St('Preparing portrait and geometry…','busy');
    const result=await S3({snapshot,origin:c0,readProject:async()=>{const r=await uo('get_character_project',{projectId:snapshot.projectId,projectKey:key});const project=To(lo(r,'project'),r);return {...project,state:hl(project.state)};},assertLocalSnapshot:()=>{if(Wt.size||!ue||ue.projectId!==snapshot.projectId||ue.currentVersion!==snapshot.currentVersion||ue.identityMasterOutputId!==snapshot.identityMasterOutputId)throw new Error('Character State changed while preparing generation. Save, review and try again.');},makeGeometryFile:async()=>GA(await bt.makeGeometryBoard(),`fake-${snapshot.projectId}-geometry-v${snapshot.currentVersion}.webp`),readMedia:$A});
    St(result.status==='EXPORTED'?'Generation files ready. Attach them in a conversation with image generation.':'Portrait request and references sent. Waiting for an actual image in the conversation.');
  }catch(error){St(error instanceof Error?error.message:String(error),'error');}
  finally{generationPending=false;u0();}
}

function refreshGenerationButton(){
  const button=document.querySelector('#generate');if(!button)return;
  const ready=!!ue&&!!bt?.isReady();
  const route=handoffRoute(Ur,V2?wA:window.openai);
  button.disabled=!ready||generationPending;
  button.textContent=generationPending?'PREPARING…':route==='export'?'EXPORT FOR GENERATION':'GENERATE PORTRAIT';
  button.title=route==='export'?'This host cannot attach image references. Download the real geometry and prompt to generate in an image-enabled conversation.':'Send the current saved geometry, portrait direction and identity references to this conversation.';
}

function showGenerationExport({files,prompt}){
  const old=document.querySelector('#generation-export');old?.remove();
  const box=document.createElement('dialog');box.id='generation-export';
  box.style.cssText='max-width:680px;width:90%;background:#202020;color:#eee;border:1px solid #777;padding:24px;z-index:1000';
  const title=document.createElement('h2');title.textContent='GENERATE IN CHATGPT';box.append(title);
  const description=document.createElement('p');description.textContent='This host does not accept image attachments from the app. Download the references and prompt, then attach them in a conversation with image generation.';box.append(description);
  const urls=[];
  for(const {role,file} of [...files,{role:'PORTRAIT PROMPT',file:new File([prompt],'FAKE-portrait-prompt.txt',{type:'text/plain'})}]){
    const link=document.createElement('a');link.textContent=role;link.href=URL.createObjectURL(file);link.download=file.name;link.style.cssText='display:block;padding:12px;color:#eee';urls.push(link.href);box.append(link);
  }
  const copy=document.createElement('button');copy.textContent='COPY PROMPT';copy.onclick=async()=>{try{await navigator.clipboard.writeText(prompt);copy.textContent='COPIED';}catch{const text=document.createElement('textarea');text.value=prompt;text.rows=10;text.style.width='100%';box.append(text);text.select();}};box.append(copy);
  const close=document.createElement('button');close.textContent='CLOSE';close.onclick=()=>box.close();box.append(close);
  box.addEventListener('close',()=>{urls.forEach(url=>URL.revokeObjectURL(url));box.remove();},{once:true});document.body.append(box);box.showModal();
}
