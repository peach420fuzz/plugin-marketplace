import {readFile} from 'node:fs/promises';
import {deploymentCode} from './deployment.mjs';
const base=new URL('.',import.meta.url),modules={};
for(const [key,file]of Object.entries({actions:'studio-actions.mjs',handoff:'handoff.mjs',morphology:'morphology.mjs',locale:'locale.mjs',serverHandoff:'server-handoff.mjs'}))modules[key]=await readFile(new URL('src/'+file,base),'utf8');
try{modules.downloadRef=(await readFile(new URL('download-ref.txt',base),'utf8')).trim();}catch(error){if(error.code!=='ENOENT')throw error;}
const payload={release:await readFile(new URL('src/release.mjs',base),'utf8'),modules,baselineGzipBase64:(await readFile(new URL('recovered/worker-0.4.7.mjs.gz',base))).toString('base64'),studioGzipBase64:(await readFile(new URL('recovered/studio-0.4.7.js.gz',base))).toString('base64'),target:process.argv[2]??'fake-by-objekts-recovery'};
process.stdout.write(deploymentCode(payload));
