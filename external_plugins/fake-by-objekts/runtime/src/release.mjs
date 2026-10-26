export const RELEASE = '0.4.9';
export function replaceOnce(text, before, after){
  const index=text.indexOf(before);
  if(index<0 || text.indexOf(before,index+before.length)!==-1)throw new Error(`Recovery patch anchor must occur once: ${before.slice(0,85)}`);
  return text.slice(0,index)+after+text.slice(index+before.length);
}
function replaceSection(text,start,end,replacement){
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  if(a<0||b<0)throw new Error(`Missing recovered section: ${start}`);
  return text.slice(0,a)+replacement+text.slice(b);
}

export function transformStudio(source,actions){
  let text=source;
  text=replaceOnce(text,'const MA="0.4.7"','const MA="0.4.9"');
  text=replaceOnce(text,'["connected-face-v1","connected-face-v2"]','["connected-face-v1","connected-face-v2","connected-face-v3"]');
  text=replaceOnce(text,'function cs(t){','function legacyFaceSolver(t){');
  text=replaceSection(text,'async function qA(){','async function WA(t){','');
  text=replaceSection(text,'async function S3(t){','var v3=',actions+'\n');
  const start=text.indexOf('function u0(){'),end=text.indexOf('async function $h(t)',start);
  const old=text.slice(start,end),cut=old.indexOf('const s=document.querySelector("#generate");');
  if(cut<0)throw new Error('Missing generation button section');
  text=text.slice(0,start)+old.slice(0,cut)+'refreshGenerationButton();}\n'+text.slice(end);
  const p=text.indexOf('function Is(t){'),q=text.indexOf('function ic(',p);
  text=text.slice(0,p)+text.slice(p,q).replaceAll('o.authoringLimit','fakeAuthoringLimit(o)')+text.slice(q);
  // Put range selection in the existing Quick panel; old projects keep their solver.
  const quickStart=text.indexOf('function eo(t){'),quickEnd=text.indexOf('function Is(t){',quickStart);
  let quick=text.slice(quickStart,quickEnd);
  quick=replaceOnce(quick,'<section class="control-section">',`<label class="field"><span>CONTROL RANGE</span><select id="control-range" \${ue.state.locks.identity||ue.state.locks.morphology?'disabled':''}><option value="connected-face-v2" \${e.solverVersion!=='connected-face-v3'?'selected':''}>ORIGINAL</option><option value="connected-face-v3" \${e.solverVersion==='connected-face-v3'?'selected':''}>EXTENDED</option></select></label><section class="control-section">`);
  const insert=quick.lastIndexOf('}');
  quick=quick.slice(0,insert)+`;document.querySelector('#control-range')?.addEventListener('change',event=>{Du('Change control range');e.solverVersion=event.target.value;Gn();mt('face');eo(t);});`+quick.slice(insert);
  text=text.slice(0,quickStart)+quick+text.slice(quickEnd);
  text=replaceOnce(text,'bt=new fA(n,c0)','bt=safeViewport(n,c0)');
  text=replaceOnce(text,'OA();Ur.ontoolresult=',`OA();setInterval(()=>refreshGenerationButton(),500);window.addEventListener('openai:set_globals',()=>refreshGenerationButton());Ur.ontoolresult=`);
  text=replaceOnce(text,'await Ur.connect();','await Ur.connect();installLocale({app:Ur});refreshGenerationButton();');
  text=replaceOnce(text,'t&&(t.textContent="REALTIME"),','t&&(t.textContent="REALTIME"),refreshGenerationButton(),');
  const prefix=`import {handoffRoute,sendHandoff,auditionPrompt} from './handoff.mjs';\nimport {solveExtended} from './morphology.mjs';\nimport {installLocale} from './locale.mjs';\nfunction cs(state){return solveExtended(state,legacyFaceSolver,gi);}\nfunction fakeAuthoringLimit(definition){return ue?.state.facialMorphology.solverVersion==='connected-face-v3'?1:definition.authoringLimit;}\nfunction safeViewport(element,origin){try{return new fA(element,origin);}catch(error){element.textContent='3D preview could not start. Enable WebGL or reopen Studio in a browser with GPU support.';document.querySelector('#gnm-load').textContent='WEBGL UNAVAILABLE';St(element.textContent,'error');return null;}}\n`;
  return prefix+text;
}

export function transformServer(source){
  let text=replaceOnce(source,'var PRODUCT_VERSION = "0.4.7";','var PRODUCT_VERSION = "0.4.9";');
  text=replaceOnce(text,'var FACE_SOLVER_VERSIONS = ["connected-face-v1", "connected-face-v2"];','var FACE_SOLVER_VERSIONS = ["connected-face-v1", "connected-face-v2", "connected-face-v3"];');
  text=replaceOnce(text,'function solveFaceMorphology(state) {','function legacyFaceSolver(state) {');
  text=replaceOnce(text,'const state = createDefaultCharacterState(input2.description ?? "");','const state = createDefaultCharacterState(input2.description ?? "");\n    state.facialMorphology.solverVersion = "connected-face-v3";\n    if(input2.morphologySeed){const seed=input2.morphologySeed;Object.assign(state.facialMorphology.semanticGoals,seed.semanticGoals??{});for(const [key,value] of Object.entries(seed.morphs??{}))state.facialMorphology.overrides[key]={mode:"fixed",manualOffset:0,fixedValue:value};if(seed.apparentAgeYears!=null){state.facialMorphology.apparentAgeYears=seed.apparentAgeYears;state.surface.agePresentation=seed.apparentAgeYears;}state.identity.semanticMorphs=solveFaceMorphology(state.facialMorphology).solvedMorphs;}');
  text=replaceOnce(text,'description: string2().max(6e3).optional()','description: string2().max(6e3).optional(),\n        morphologySeed: external_exports.object({semanticGoals:external_exports.object(masterShape).partial().optional(),morphs:external_exports.object(Object.fromEntries(SEMANTIC_MORPH_KEYS.map(key=>[key,normalized]))).partial().optional(),apparentAgeYears:external_exports.number().finite().min(18).max(100).optional()}).strict().optional()');
  // The model can propose semantic values from the brief; it never invents raw GNM coefficients.
  text=replaceOnce(text,'Project credentials remain private to the app component.','When a brief describes facial proportions, supply morphologySeed using the documented semantic keys and normalized -1..1 values; zero is neutral. These are editable shape suggestions, not measured likeness. Project credentials remain private to the app component.');
  text=replaceOnce(text,'const parsedPatch = editableStatePatchSchema.parse(input2.patch);','const parsedPatch = editableStatePatchSchema.parse(input2.patch);\n    const refId=parsedPatch.identity?.sourceReferenceAssetId;\n    if(refId){const reference=await this.store.getReferenceAsset(refId);if(reference.projectId!==project.projectId)throw new Error("Reference does not belong to this project.");}');
  text=replaceOnce(text,'decodeImageDataUrl(input2.dataUrl, 12 * 1024 * 1024, "Reference photo")','decodeImageDataUrl(input2.dataUrl, 4 * 1024 * 1024, "Reference photo")');
  return text;
}

export function appendRuntime(worker,{actions,handoff,morphology,locale}){
  // Keep the original static asset namespace. Override only these recovered paths.
  const routes={'/studio/handoff.mjs':handoff,'/studio/morphology.mjs':morphology,'/studio/locale.mjs':locale};
  return `function solveFaceMorphology(state){return solveExtended(state,legacyFaceSolver,SEMANTIC_MORPH_KEYS);}\n${morphology.replaceAll('export ','')}\n`+worker+`\nconst fakeRuntimeRoutes=${JSON.stringify(routes)};\nconst fakeStudioActions=${JSON.stringify(actions)};\nconst fakeTransformStudio=${transformStudio.toString()};\nconst replaceOnce=${replaceOnce.toString()};\nconst replaceSection=${replaceSection.toString()};\nconst originalFakeFetch=index_default.fetch;let cachedFakeStudio;\nindex_default.fetch=async function(request,env,ctx){const path=new URL(request.url).pathname;let body=fakeRuntimeRoutes[path];if(path==='/studio/studio.js'){if(!cachedFakeStudio){const response=await env.STATIC.fetch(request);if(!response.ok)return response;cachedFakeStudio=fakeTransformStudio(await response.text(),fakeStudioActions);}body=cachedFakeStudio;}if(body!==undefined)return withCors(new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache','X-FAKE-Version':'0.4.9'}}));return originalFakeFetch.call(this,request,env,ctx);};\n`;
}
