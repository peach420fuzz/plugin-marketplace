// Local, offline configuration-isolation regression: synthetic keys and mocked JWKS fetch only.
import assert from 'node:assert/strict';
import {loadTrustedJWKS,verifyAccessJWT} from '../oidc-resource-v025.mjs';
const audience='https://remake.objekts.ai/account/mcp';
const pairs=await Promise.all(['a','b','rotated'].map(async name=>{const key=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);return {name,key,jwk:{...await crypto.subtle.exportKey('jwk',key.publicKey),kid:'same-kid',alg:'RS256',use:'sig'}};}));
const env=(issuer,path='/keys')=>({REMAKE_OIDC_ISSUER:issuer,REMAKE_OIDC_AUDIENCE:audience,REMAKE_OIDC_JWKS_URI:issuer+path,DB:{synthetic:true}});
const a=env('https://issuer-a.example.test'),b=env('https://issuer-b.example.test'),rotated=env(a.REMAKE_OIDC_ISSUER,'/rotated-keys');
let mockFetches=0;
globalThis.fetch=async(url,opts)=>{
  mockFetches++;
  assert.equal(opts.redirect,'error');
  const source=new Map([[a.REMAKE_OIDC_JWKS_URI,pairs[0]],[b.REMAKE_OIDC_JWKS_URI,pairs[1]],[rotated.REMAKE_OIDC_JWKS_URI,pairs[2]]]).get(url);
  assert.ok(source,'Only synthetic exact-key fixtures may be fetched');
  return Response.json({keys:[source.jwk]});
};
async function signed(issuer,signer){const enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');const bytes=enc({alg:'RS256',kid:'same-kid',typ:'at+jwt'})+'.'+enc({iss:issuer,aud:audience,sub:'synthetic-owner',exp:Math.floor(Date.now()/1000)+300,scope:'remake.projects:read',token_use:'access'});return bytes+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',signer.key.privateKey,new TextEncoder().encode(bytes))).toString('base64url');}
const checks=[];
async function check(name,fn){try{await fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false,error:String(e.message).split('\n')[0]});}}
let ka,kb,kr;
await check('first issuer receives its own key',async()=>{ka=await loadTrustedJWKS(a);assert.equal(ka.keys[0].n,pairs[0].jwk.n);});
await check('unchanged issuer config reuses cached key',async()=>{await loadTrustedJWKS(a);assert.equal(mockFetches,1);});
await check('second configured issuer gets its own key',async()=>{kb=await loadTrustedJWKS(b);assert.equal(kb.keys[0].n,pairs[1].jwk.n);});
const configB={issuer:b.REMAKE_OIDC_ISSUER,audience,jwks:kb};
await check('second issuer legitimate signed token verifies',async()=>{await verifyAccessJWT(await signed(b.REMAKE_OIDC_ISSUER,pairs[1]),configB,{requiredScope:'remake.projects:read'});});
await check('previous issuer key cannot sign second issuer identity',async()=>{await assert.rejects(verifyAccessJWT(await signed(b.REMAKE_OIDC_ISSUER,pairs[0]),configB,{requiredScope:'remake.projects:read'}),e=>e.code==='invalid_signature');});
await check('returning to first config returns first key',async()=>{ka=await loadTrustedJWKS(a);assert.equal(ka.keys[0].n,pairs[0].jwk.n);});
await check('changed JWKS URI in same issuer gets new key',async()=>{kr=await loadTrustedJWKS(rotated);assert.equal(kr.keys[0].n,pairs[2].jwk.n);});
await check('rotated endpoint token verifies',async()=>{await verifyAccessJWT(await signed(a.REMAKE_OIDC_ISSUER,pairs[2]),{issuer:a.REMAKE_OIDC_ISSUER,audience,jwks:kr});});
await check('old endpoint key rejected after configured URI change',async()=>{await assert.rejects(verifyAccessJWT(await signed(a.REMAKE_OIDC_ISSUER,pairs[0]),{issuer:a.REMAKE_OIDC_ISSUER,audience,jwks:kr}),e=>e.code==='invalid_signature');});
await check('missing configuration remains fail closed',async()=>{await assert.rejects(loadTrustedJWKS({DB:{}}),e=>e.code==='idp_not_configured');});
const result={observed_at_utc:new Date().toISOString(),module:'../oidc-resource-v025.mjs',passed:checks.filter(x=>x.pass).length,total:checks.length,checks,mockFetches,real_network_calls:0,scope:'Two explicit local configurations in one module instance; ephemeral RSA keys and exact mock JWKS URLs; no real deployment exploit or user account proof'};
console.log(JSON.stringify(result));
if(result.passed!==result.total)process.exitCode=1;
