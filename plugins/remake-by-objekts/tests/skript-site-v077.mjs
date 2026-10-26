import assert from 'node:assert/strict';
import worker from '../worker.mjs';

// Origin response contract only. The separately documented Cloudflare delivery
// component and real browser execution require checks against the deployed site.
const origin = 'https://remake.objekts.ai';
const routes = ['/skript/', '/skript/support', '/skript/privacy', '/skript/terms'];
const policy = "default-src 'none'; style-src 'unsafe-inline'; img-src https://raw.githubusercontent.com; script-src 'none'; base-uri 'none'; form-action 'none'";
const results = [];
async function test(name, run) { await run(); results.push({name, pass: true}); }
const request = (path, method = 'GET') => new Request(origin + path, {method});
const get = path => worker.fetch(request(path), {});

await test('four canonical pages support GET and bodyless HEAD with the same origin policy', async () => {
  for (const path of routes) {
    const response = await get(path), body = await response.text();
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(response.headers.get('content-security-policy'), policy);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.match(body, /<!doctype html><html lang="en">/);
    assert.ok(body.includes('<link rel="canonical" href="' + origin + path + '">'));
    const head = await worker.fetch(request(path, 'HEAD'), {});
    assert.equal(head.status, response.status);
    assert.deepEqual([...head.headers], [...response.headers]);
    assert.equal(await head.text(), '');
  }
});

await test('canonical aliases redirect to exactly the public page paths', async () => {
  for (const [alias, canonical] of [['/skript', '/skript/'], ['/skript/support/', '/skript/support'], ['/skript/privacy/', '/skript/privacy'], ['/skript/terms/', '/skript/terms']]) {
    const response = await get(alias);
    assert.equal(response.status, 301, alias);
    assert.equal(response.headers.get('location'), canonical);
    assert.equal((await get(canonical)).status, 200);
  }
});

await test('every SKRIPT navigation target resolves and uses the preserved studio image', async () => {
  const image = 'https://raw.githubusercontent.com/peach420fuzz/plugin-marketplace/main/plugins/remake-by-objekts/assets/objekts-remake-charcoal.png';
  for (const path of routes) {
    const body = await (await get(path)).text();
    const targets = [...body.matchAll(/href="(\/skript[^"#]*)"/g)].map(match => match[1]);
    for (const expected of routes) assert.ok(targets.includes(expected), path + ' → ' + expected);
    for (const target of new Set(targets)) assert.equal((await get(target)).status, 200, target);
    assert.ok(body.includes('src="' + image + '"'));
    assert.match(body, /alt="objekts studio mark: overlapping square outlines on charcoal"/);
    assert.match(body, /referrerpolicy="no-referrer"/);
    assert.doesNotMatch(body, /href="(?:index|support|privacy|terms)\.md"/);
    assert.doesNotMatch(body, /<(?:script|form|input|iframe)\b/i);
  }
});

await test('information pages do not create a SKRIPT upload, checkout or MCP endpoint', async () => {
  for (const path of routes) {
    const response = await worker.fetch(request(path, 'POST'), {});
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
  }
  for (const path of ['/skript/mcp', '/skript/checkout', '/skript/upload', '/skript/not-a-page']) assert.equal((await get(path)).status, 404, path);
});

await test('privacy distinguishes the host, passive site and existing edge delivery', async () => {
  const body = await (await get('/skript/privacy')).text();
  const visibleText = body.replaceAll('&#x27;', "'").replace(/<[^>]*>/g, '');
  for (const fact of ["host's policies", 'does not mean that the AI host never retains', 'Cloudflare', 'technical traffic and security metadata', 'raw.githubusercontent.com', '/.webmcp/bridge.js', 'Content Credentials (C2PA)', 'data-packs=c2pa', 'locally in the browser', 'does not verify their cryptographic signatures', 'does not establish that it executed', 'salute@objekts.ai']) assert.ok(visibleText.includes(fact), fact);
  assert.doesNotMatch(body, /transiently in Worker memory|12 MiB|remake_host_image_for_review/);
});

await test('root discovery and sitemap expose the four real routes', async () => {
  assert.ok((await (await get('/')).text()).includes('href="/skript/"'));
  const sitemap = await (await get('/sitemap.xml')).text();
  for (const path of routes) assert.ok(sitemap.includes('<loc>' + origin + path + '</loc>'), path);
});

console.log(JSON.stringify({suite: 'SKRIPT 0.7.7 origin information routes', passed: results.length, total: results.length, results, execution: 'Node in-memory requests to the actual Worker module; no network, browser or private source material', deployed_site_verified: false, target_host_execution: false, artistic_acceptance: false}));
