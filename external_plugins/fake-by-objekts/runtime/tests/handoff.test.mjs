import test from 'node:test';
import assert from 'node:assert/strict';
import {handoffRoute,sendHandoff,auditionPrompt} from '../src/handoff.mjs';
const file=new File([new Uint8Array([137,80,78,71])],'geometry.png',{type:'image/png'});
const fixture=()=>({files:[{role:'GNM geometry',file}],prompt:'Generate a fictional adult portrait.',modelContent:'GNM geometry',stateVersion:2,assertCurrent(){},exportFiles(){},getNativeHost:()=>undefined});

test('late native host injection is resolved at the time of sending',async()=>{
  let host;const args={...fixture(),getNativeHost:()=>host};
  assert.equal(handoffRoute(null,host),'export');
  const calls=[];host={uploadFile:async()=>({fileId:'real-file-id'}),setWidgetState:async value=>calls.push(value),sendFollowUpMessage:async value=>calls.push(value)};
  assert.equal((await sendHandoff(args)).status,'SENT_TO_HOST');assert.deepEqual(calls[0].imageIds,['real-file-id']);assert.equal(calls.length,2);
});
test('standard MCP image messages work without window.openai',async()=>{
  let sent;const app={getHostCapabilities:()=>({message:{image:{}}}),sendMessage:async value=>{sent=value;return {};}};
  const result=await sendHandoff({...fixture(),app});assert.equal(result.route,'mcp-message-images');assert.equal(sent.role,'user');assert.equal(sent.content[2].type,'image');assert.equal(sent.content[2].data,'iVBORw==');
});
test('image context plus text followup is supported independently',async()=>{
  const calls=[];const app={getHostCapabilities:()=>({message:{text:{}},updateModelContext:{image:{}}}),updateModelContext:async value=>{calls.push(['context',value]);return{};},sendMessage:async value=>{calls.push(['message',value]);return{};}};
  assert.equal((await sendHandoff({...fixture(),app})).route,'mcp-context-images');assert.equal(calls[0][0],'context');assert.equal(calls[1][1].content.length,1);
});
test('host rejection is not reported as success or automatically resent',async()=>{
  let calls=0;const app={getHostCapabilities:()=>({message:{image:{}}}),sendMessage:async()=>{calls++;return{isError:true};}};
  await assert.rejects(sendHandoff({...fixture(),app}),/rejected/);assert.equal(calls,1);
});
test('upload without a genuine file ID never sends a request',async()=>{
  let sent=false;const host={uploadFile:async()=>({}),setWidgetState(){},sendFollowUpMessage(){sent=true;}};
  await assert.rejects(sendHandoff({...fixture(),getNativeHost:()=>host}),/file ID/);assert.equal(sent,false);
});
test('state changes cancel before sending images',async()=>{
  let count=0,sent=false;const app={getHostCapabilities:()=>({message:{image:{}}}),sendMessage:async()=>{sent=true;}};
  await assert.rejects(sendHandoff({...fixture(),app,assertCurrent(){if(++count>1)throw Error('changed');}}),/changed/);assert.equal(sent,false);
});
test('hostless use provides actual reference files and prompt for export',async()=>{
  let exported;const result=await sendHandoff({...fixture(),exportFiles:async value=>{exported=value;}});assert.equal(result.status,'EXPORTED');assert.equal(exported.files[0].file,file);assert.match(exported.prompt,/fictional adult/);
});
test('text-only MCP hosts use an authenticated server ticket without native upload methods',async()=>{
  let sent,prepared=false;const app={getHostCapabilities:()=>({message:{text:{}},serverTools:{}}),callServerTool(){},sendMessage:async value=>{sent=value;return {};}};
  const result=await sendHandoff({...fixture(),app,prepareOnServer:async({geometry})=>{assert.equal(geometry,file);prepared=true;return{requestId:'frequest-test',requestToken:'a'.repeat(64)};}});
  assert.equal(result.route,'mcp-server-ticket');assert.equal(prepared,true);assert.match(sent.content[0].text,/read_portrait_request/);assert.doesNotMatch(sent.content[0].text,/projectKey/);
});
test('audition asks for one actual photographic image and preserves shape',()=>{
  const prompt=auditionPrompt('Create one photorealistic fictional adult character image, candidate 1. Wide jaw.',7);assert.match(prompt,/ONE photorealistic portrait/);assert.match(prompt,/Return the actual generated image/);assert.match(prompt,/Wide jaw/);assert.match(prompt,/v7/);assert.doesNotMatch(prompt,/FOUR|candidate 1/);
});
