import http from 'node:http';
import {Readable} from 'node:stream';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const upstream=process.env.FAKE_TEST_ORIGIN??'https://fake-by-objekts-recovery.peach420fuzz.workers.dev';
const out=new URL('../qa-artifacts/',import.meta.url);await fs.mkdir(out,{recursive:true});
const local=process.env.FAKE_LOCAL_BUILD==='1';
const server=http.createServer(async(req,res)=>{try{
  const headers={...req.headers};for(const name of ['host','connection','content-length','accept-encoding'])delete headers[name];
  const response=await fetch(upstream+req.url,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:req,duplex:'half',redirect:'manual'});
  const responseHeaders={};for(const [key,value]of response.headers)if(!['content-length','content-encoding','transfer-encoding','connection'].includes(key))responseHeaders[key]=value;
  if(req.url.startsWith('/studio/studio.js')){
    if(!local&&!response.ok)throw new Error(`Studio JavaScript HTTP ${response.status}`);
    if(!local&&!response.headers.get('content-type')?.includes('javascript'))throw new Error('Studio resource is not JavaScript');
    let source=local?await fs.readFile(new URL('../dist/studio.js',import.meta.url),'utf8'):await response.text();
    // Test-only evidence tap: no credentials; never included in the deployed module.
    source=source.replace('return sendHandoff({app:Ur',`window.__FAKE_TEST_REFERENCES=await Promise.all(files.map(async item=>({role:item.role,name:item.file.name,type:item.file.type,base64:await new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(item.file);})})));return sendHandoff({app:Ur`);
    source=source.replace('OA();setInterval', 'window.__FAKE_TEST_APP=Ur;OA();setInterval');
    source=source.replace('bt=safeViewport(n,c0)','bt=safeViewport(n,c0),window.__FAKE_TEST_VIEWPORT=bt');
    res.writeHead(200,{'content-type':'text/javascript'});res.end(source);return;
  }
  if(responseHeaders['content-type']?.includes('text/html')){
    const html=(await response.text()).replace(/<script[^>]+src="[^\"]*(?:\.webmcp\/bridge\.js|cloudflareinsights)[^\"]*"[^>]*><\/script>/g,'');res.writeHead(response.status,responseHeaders);res.end(html);return;
  }
  res.writeHead(response.status,responseHeaders);if(response.body)Readable.fromWeb(response.body).pipe(res);else res.end();
}catch(error){res.writeHead(502);res.end(String(error));}});
await new Promise(resolve=>server.listen(8794,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:960},locale:'ru-RU'});
const report={scope:'REAL_GNM_AND_STAGED_MCP__SIMULATED_CONVERSATION_HOST',upstream,errors:[],steps:[]};
page.on('pageerror',error=>report.errors.push(error.message));
try{
  await page.goto('http://127.0.0.1:8794/studio/?qa=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__FAKE_TEST_VIEWPORT?.isReady(),{timeout:60000});
  await page.locator('#fake-language').selectOption('ru');
  await page.waitForFunction(()=>document.querySelector('#generate')?.textContent==='СОЗДАТЬ ПОРТРЕТ');
  await page.screenshot({path:new URL('quick-ru.png',out).pathname,fullPage:true});
  assert.equal(await page.locator('#generate').isEnabled(),true);
  for(const tab of ['quick','pro','raw','look','render','character']){
    await page.locator(`[data-tab="${tab}"]`).click();await page.locator('#panel').waitFor();
    assert.ok((await page.locator('#panel').innerText()).trim().length>20);report.steps.push({tab,pass:true});
  }
  await page.locator('[data-tab="quick"]').click();
  await page.locator('#control-range').selectOption('connected-face-v2');
  await page.locator('[data-master="face.width"]').evaluate(input=>{input.value='0.7';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
  const original=await page.evaluate(()=>Array.from(window.__FAKE_TEST_VIEWPORT.geometry.getAttribute('position').array));
  await page.locator('#control-range').selectOption('connected-face-v3');
  const expanded=await page.evaluate(()=>Array.from(window.__FAKE_TEST_VIEWPORT.geometry.getAttribute('position').array));
  assert.ok(expanded.every(Number.isFinite));assert.ok(expanded.some((value,i)=>Math.abs(value-original[i])>1e-5));report.steps.push({extendedGeometryChanged:true,vertexCount:expanded.length/3});
  await page.locator('[data-tab="pro"]').click();
  assert.equal(await page.locator('[data-child="nose.width"]').getAttribute('max'),'1');
  await page.screenshot({path:new URL('pro-ru.png',out).pathname,fullPage:true});
  await page.locator('[data-child="nose.width"]').evaluate(input=>{input.value='0.7';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
  await page.locator('[data-tab="render"]').click();await page.locator('[data-render-preset="CASTING"]').click();
  await page.locator('#generate').click();
  await page.waitForFunction(()=>window.__FAKE_QA_FOLLOWUP?.prompt,{timeout:45000});
  const evidence=await page.evaluate(()=>({files:window.__FAKE_TEST_REFERENCES,followup:window.__FAKE_QA_FOLLOWUP,widget:window.__FAKE_QA_WIDGET_STATE,uploads:window.__FAKE_QA_NATIVE_FILES}));
  assert.equal(evidence.files.length,1);assert.match(evidence.followup.prompt,/ONE photorealistic portrait/);assert.equal(evidence.widget.imageIds.length,1);assert.ok(evidence.files[0].base64.length>10000);
  await fs.writeFile(new URL('geometry.webp',out),Buffer.from(evidence.files[0].base64,'base64'));
  await fs.writeFile(new URL('portrait-prompt.txt',out),evidence.followup.prompt);
  // QA IDs only demonstrate transport; no image generation claim is made.
  report.steps.push({handoff:'SENT_TO_SIMULATED_HOST',referenceCount:evidence.files.length,promptBytes:evidence.followup.prompt.length});
  await page.evaluate(()=>{const app=window.__FAKE_TEST_APP;app.getHostCapabilities=()=>({message:{text:{}},serverTools:{}});app.sendMessage=async message=>{window.__FAKE_TEST_TICKET_MESSAGE=message;return {};};});
  await page.locator('#generate').click();
  await page.waitForFunction(()=>window.__FAKE_TEST_TICKET_MESSAGE,{timeout:45000});
  const ticketMessage=await page.evaluate(()=>window.__FAKE_TEST_TICKET_MESSAGE.content[0].text);
  const ticketMatch=ticketMessage.match(/requestId (\S+) and requestToken ([a-f0-9]{64})/);assert.ok(ticketMatch);
  const ticketResponse=await fetch('http://127.0.0.1:8794/mcp',{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:88,method:'tools/call',params:{name:'read_portrait_request',arguments:{requestId:ticketMatch[1],requestToken:ticketMatch[2]}}})});
  const ticketResult=(await ticketResponse.json()).result;assert.ok(!ticketResult.isError);assert.equal(ticketResult.content.filter(item=>item.type==='image').length,1);assert.equal(ticketResult.structuredContent.imageGenerationPerformed,false);
  report.steps.push({serverTicketReferenceRead:'PASS',conversationHost:'SIMULATED',imageGenerationPerformed:false});
  await page.screenshot({path:new URL('handoff-ru.png',out).pathname,fullPage:true});
  await page.locator('#fake-language').selectOption('en');await page.waitForFunction(()=>document.querySelector('#generate').textContent==='GENERATE PORTRAIT');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-tab="quick"]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  await page.screenshot({path:new URL('mobile-en.png',out).pathname,fullPage:true});
  assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.passed=false;report.failure=String(error);await page.screenshot({path:new URL('failure.png',out).pathname,fullPage:true}).catch(()=>{});process.exitCode=1;}
finally{await fs.writeFile(new URL('report.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();server.close();}
