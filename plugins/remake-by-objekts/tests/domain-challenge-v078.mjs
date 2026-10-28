import assert from 'node:assert/strict';
import worker from '../worker.mjs';

// The portal deliberately makes this ownership value public. This suite checks
// the origin response; it does not stand in for OpenAI's Verify Domain action.
const path = '/.well-known/openai-apps-challenge';
const origin = 'https://remake.objekts.ai';
const value = 'HxIpIAQJNAMAnRrZ6Jtyh0sJ95udVOxuH-EDDGixNro';
const policy = "default-src 'none'; style-src 'unsafe-inline'; img-src https://raw.githubusercontent.com; script-src 'none'; base-uri 'none'; form-action 'none'";
const results = [];
async function test(name, run) { await run(); results.push({name, pass: true}); }

await test('GET returns the exact public ownership bytes without a newline or wrapper', async () => {
  const response = await worker.fetch(new Request(origin + path), {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), new TextEncoder().encode(value));
  assert.equal(response.headers.get('content-security-policy'), policy);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
});

await test('HEAD keeps GET metadata and returns no body', async () => {
  const get = await worker.fetch(new Request(origin + path), {});
  const head = await worker.fetch(new Request(origin + path, {method: 'HEAD'}), {});
  assert.equal(head.status, get.status);
  assert.deepEqual([...head.headers], [...get.headers]);
  assert.equal((await head.arrayBuffer()).byteLength, 0);
});

await test('unsupported methods do not consume or reflect caller input', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await worker.fetch(new Request(origin + path, {method, body: 'SYNTHETIC-NOT-A-CLIENT-SOURCE'}), {});
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    const body = await response.text();
    assert.doesNotMatch(body, /SYNTHETIC-NOT-A-CLIENT-SOURCE/);
    assert.ok(!body.includes(value));
    assert.equal(response.headers.get('content-security-policy'), policy);
  }
});

await test('the apex, other hosts, HTTP and other paths retain not-found responses', async () => {
  for (const url of ['https://objekts.ai' + path, 'https://fake.objekts.ai' + path, 'https://example.com' + path, 'http://remake.objekts.ai' + path, origin + path + '/', origin + '/.well-known/not-the-challenge']) {
    const response = await worker.fetch(new Request(url), {});
    assert.equal(response.status, 404, url);
    assert.deepEqual(await response.json(), {error: 'not_found'});
  }
});

console.log(JSON.stringify({suite: 'REMAKE public domain ownership response', passed: results.length, total: results.length, results, execution: 'Node in-memory requests; synthetic caller body, no private material or network', actual_domain_verified: false, deployed: false}));
