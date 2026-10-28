import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../dist/worker.mjs';

test('Worker serves the already-built Studio JavaScript on the versioned URL',async()=>{
  const response=await worker.fetch(new Request('https://example.test/studio/studio.js?v=0.4.9'),{});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),/javascript/);
  assert.equal(await response.text(),await readFile(new URL('../dist/studio.js',import.meta.url),'utf8'));
});

test('Worker serves the standalone bridge module without network or project data',async()=>{
  const response=await worker.fetch(new Request('https://example.test/studio/handoff.mjs?v=0.4.9'),{});
  assert.equal(response.status,200);
  assert.match(await response.text(),/export async function sendHandoff/);
});
