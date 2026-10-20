// SYNTHETIC stream/dispatcher security checks; no actual host attachment.
import assert from 'node:assert/strict';
import {readBoundedBody} from '../request-body-v035.mjs';
import worker from '../worker.mjs';
const enc = new TextEncoder();
const request = (body, headers = {}) => new Request('https://remake.objekts.ai/mcp', {
  method: 'POST', headers: {'content-type': 'application/json', ...headers}, body, duplex: 'half'
});
let passed = 0;
async function check(name, fn) { await fn(); passed++; }
await check('real dispatcher accepts valid JSON', async () => {
  const r = await worker.fetch(request(JSON.stringify({jsonrpc:'2.0',id:1,method:'ping'})));
  assert.equal(r.status, 200); assert.deepEqual((await r.json()).result, {});
});
for (const header of [undefined, '1']) await check('cancel oversized chunked body', async () => {
  let cancelled = false, pulled = 0;
  const stream = new ReadableStream({pull(c) { pulled++; c.enqueue(new Uint8Array(8192)); }, cancel() { cancelled = true; }});
  const r = await worker.fetch(request(stream, header ? {'content-length':header} : {}));
  assert.equal(r.status, 413); assert.equal((await r.json()).error, 'request_too_large');
  assert.ok(cancelled); assert.ok(pulled < 20, 'must stop before fully consuming stream');
});
await check('header can reject before reading', async () => {
  let cancelled = false;
  const stream = new ReadableStream({cancel() { cancelled = true; }});
  const r = await worker.fetch(request(stream, {'content-length':'131073'}));
  assert.equal(r.status, 413); assert.ok(cancelled);
});
await check('byte budget includes multibyte UTF8', async () => {
  await assert.rejects(readBoundedBody(request('кино'), 7), e => e.status === 413);
});
await check('split UTF8 is decoded once', async () => {
  const b = enc.encode('кино'); let i = 0;
  const s = new ReadableStream({pull(c) { if (i < b.length) c.enqueue(b.slice(i, ++i)); else c.close(); }});
  assert.equal(await readBoundedBody(request(s), 8), 'кино');
});
await check('stalled body times out and cancels', async () => {
  let cancelled = false;
  await assert.rejects(readBoundedBody(request(new ReadableStream({cancel() { cancelled = true; }})), 32, {timeoutMs:20}), e => e.status === 408);
  assert.ok(cancelled);
});
await check('upstream errors do not echo confidential details', async () => {
  const s = new ReadableStream({start(c) { c.error(Error('secret signed URL')); }});
  const r = await worker.fetch(request(s));
  assert.equal(r.status, 400); assert.deepEqual(await r.json(), {error:'unreadable_body'});
});
await check('invalid UTF8 rejected', async () => {
  const r = await worker.fetch(request(new Uint8Array([0xc3, 0x28])));
  assert.equal(r.status, 400); assert.equal((await r.json()).error, 'invalid_utf8');
});
await check('MIME suffix is not JSON', async () => {
  const r = await worker.fetch(request('{}', {'content-type':'application/json.evil'}));
  assert.equal(r.status, 415);
});
for (const length of ['-1','NaN','1, 2']) await check('malformed length rejected', async () => {
  await assert.rejects(readBoundedBody(request('{}', {'content-length':length}), 32), e => e.status === 400);
});
console.log(JSON.stringify({suite:'bounded request stream',passed,total:13,test_class:'SYNTHETIC',actual_host:false}));
