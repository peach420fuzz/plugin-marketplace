import {readFile} from 'node:fs/promises';
import {deploymentCode} from './deployment.mjs';
import {transformStudio} from './src/release.mjs';
import {gunzipSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const base=new URL('.',import.meta.url),modules={};
for(const [key,file]of Object.entries({actions:'studio-actions.mjs',handoff:'handoff.mjs',morphology:'morphology.mjs',locale:'locale.mjs',serverHandoff:'server-handoff.mjs'}))modules[key]=await readFile(new URL('src/'+file,base),'utf8');
try{modules.downloadRef=(await readFile(new URL('download-ref.txt',base),'utf8')).trim();}catch(error){if(error.code!=='ENOENT')throw error;}
const original=gunzipSync(await readFile(new URL('recovered/studio-0.4.7.js.gz',base))).toString();
if(createHash('sha256').update(original).digest('hex')!=='d8634147fe7b75e4c15c5641ae30dd34d0ba0966d6f9ba1316390ac2a6d7a4b8')throw Error('Studio baseline checksum mismatch');
const compiled=transformStudio(original,modules.actions);
const payload={release:await readFile(new URL('src/release.mjs',base),'utf8'),modules,baselineGzipBase64:(await readFile(new URL('recovered/worker-0.4.7.mjs.gz',base))).toString('base64'),studioGzipBase64:gzipSync(compiled).toString('base64'),studioSha256:createHash('sha256').update(compiled).digest('hex'),target:process.argv[2]??'fake-by-objekts-recovery'};
process.stdout.write(deploymentCode(payload));
