import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {transformServer,transformStudio,appendRuntime} from './src/release.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
async function recovered(name){try{return await readFile(root+'recovered/'+name,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;return gunzipSync(await readFile(root+'recovered/'+name+'.gz')).toString();}}
const server=await recovered('worker-0.4.7.mjs'),studio=await recovered('studio-0.4.7.js');
if(createHash('sha256').update(server).digest('hex')!=='f86f9a171f4b76005fb94035c89bd4bcdcecd70918aad34d96eb407e9c4adbe5')throw new Error('Recovered server checksum mismatch');
if(createHash('sha256').update(studio).digest('hex')!=='d8634147fe7b75e4c15c5641ae30dd34d0ba0966d6f9ba1316390ac2a6d7a4b8')throw new Error('Recovered Studio checksum mismatch');
const modules={};for(const [key,name] of Object.entries({actions:'studio-actions.mjs',handoff:'handoff.mjs',morphology:'morphology.mjs',locale:'locale.mjs',serverHandoff:'server-handoff.mjs'}))modules[key]=await readFile(root+'src/'+name,'utf8');
modules.studio=studio;
try{modules.downloadRef=(await readFile(root+'download-ref.txt','utf8')).trim();}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(root+'dist',{recursive:true});
await writeFile(root+'dist/worker.mjs',appendRuntime(transformServer(server),modules));
await writeFile(root+'dist/studio.js',transformStudio(studio,modules.actions));
for(const name of ['handoff','morphology','locale'])await writeFile(root+'dist/'+name+'.mjs',modules[name]);
console.log('Recovered FAKE runtime 0.4.9 built; original static namespace is retained.');
