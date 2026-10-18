// REMAKE G5 / v0.25 — generic OAuth resource-server JWT verifier.
// No IDP or account is configured by this source file. Fail closed by default.
// Tokens are verified against keys fetched from a deployment-configured HTTPS issuer.
// Caller-provided token URLs, JWKs, issuer, audience and identity headers are NEVER trusted.
export class AuthError extends Error {
  constructor(code){super(code);this.name="AuthError";this.code=code;}
}
const fail=(code)=>{throw new AuthError(code);};
const isString=(x)=>typeof x==="string"&&x.length>0;
const atobBytes=(s)=>{
  if(typeof s!=="string"||!s.length||!/^[A-Za-z0-9_-]+$/.test(s))fail("malformed_token");
  let raw;
  try{raw=atob(s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4));}catch{fail("malformed_token");}
  return Uint8Array.from(raw,c=>c.charCodeAt(0));
};
const jsonPart=(s)=>{let obj;try{obj=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(atobBytes(s)));}catch{fail("malformed_token");}if(!obj||typeof obj!=="object"||Array.isArray(obj))fail("malformed_token");return obj;};
const hex=async(str)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(str)))).map(b=>b.toString(16).padStart(2,"0")).join("");
const checkURL=(s)=>{
  if(!isString(s))fail("idp_not_configured");
  let u;try{u=new URL(s);}catch{fail("idp_not_configured");}
  if(u.protocol!=="https:"||u.username||u.password||u.hash||u.search)fail("idp_not_configured");
  return u;
};
export function isConfigured(env){
  if(!env||!isString(env.REMAKE_OIDC_ISSUER)||!isString(env.REMAKE_OIDC_AUDIENCE)||!isString(env.REMAKE_OIDC_JWKS_URI)||!env.DB)return false;
  try {
    const issuer=checkURL(env.REMAKE_OIDC_ISSUER),jwks=checkURL(env.REMAKE_OIDC_JWKS_URI),aud=checkURL(env.REMAKE_OIDC_AUDIENCE);
    return issuer.origin===jwks.origin&&aud.toString()==="https://remake.objekts.ai/account/mcp"&&jwks.pathname!=="/"&&jwks.pathname!=="";
  } catch {return false;}
}
let jwksCache=null,cacheExpiry=0;
export async function loadTrustedJWKS(env){
  if(!isConfigured(env))fail("idp_not_configured");
  if(jwksCache&&Date.now()<cacheExpiry)return jwksCache;
  const response=await fetch(env.REMAKE_OIDC_JWKS_URI,{redirect:"error",headers:{accept:"application/json"},signal:AbortSignal.timeout(4000)});
  if(!response.ok)fail("idp_key_fetch_failed");
  const text=await response.text();
  if(text.length>65536)fail("oversized_jwks");
  let jwks;try{jwks=JSON.parse(text);}catch{fail("invalid_jwks");}
  if(!jwks||!Array.isArray(jwks.keys)||jwks.keys.length>32)fail("invalid_jwks");
  jwksCache=jwks;cacheExpiry=Date.now()+180000;
  return jwks;
}
export async function verifyAccessJWT(token,config,{now=Math.floor(Date.now()/1000),requiredScope=null}={}){
  if(!config||!isString(config.issuer)||!isString(config.audience)||!config.jwks)fail("idp_not_configured");
  if(!isString(token)||token.length>12000)fail("missing_or_oversized_token");
  const parts=token.split(".");if(parts.length!==3)fail("malformed_token");
  const header=jsonPart(parts[0]),claims=jsonPart(parts[1]);
  if(header.alg!=="RS256"||!isString(header.kid)||header.crit||header.jwk||header.jku||header.x5u)fail("disallowed_header");
  if(header.typ&&header.typ!=="at+jwt"&&header.typ!=="JWT")fail("invalid_token_type");
  if(!Array.isArray(config.jwks.keys))fail("invalid_jwks");
  const keys=config.jwks.keys.filter(k=>k&&k.kid===header.kid);
  if(keys.length!==1)fail("key_not_unique_or_missing");
  const jwk=keys[0];
  if(jwk.kty!=="RSA"||jwk.use&&jwk.use!=="sig"||jwk.alg&&jwk.alg!=="RS256"||!jwk.n||!jwk.e||jwk.d)fail("invalid_signing_key");
  let key;try{key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);}catch{fail("invalid_signing_key");}
  let valid=false;try{valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,atobBytes(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));}catch{fail("invalid_signature");}
  if(!valid)fail("invalid_signature");
  if(claims.iss!==config.issuer||!isString(claims.sub)||claims.sub.length>500)fail("invalid_issuer_or_subject");
  const audiences=typeof claims.aud==="string"?[claims.aud]:Array.isArray(claims.aud)?claims.aud:[];
  if(!audiences.includes(config.audience))fail("invalid_audience");
  if(!Number.isInteger(claims.exp)||claims.exp<now-30||claims.exp>now+86400)fail("expired_or_invalid_exp");
  if(claims.nbf!==undefined&&(!Number.isInteger(claims.nbf)||claims.nbf>now+30))fail("not_yet_valid");
  if(claims.iat!==undefined&&(!Number.isInteger(claims.iat)||claims.iat>now+30||claims.exp-claims.iat>86400))fail("invalid_issued_at");
  if(claims.token_use&&claims.token_use!=="access")fail("not_an_access_token");
  const scopes=typeof claims.scope==="string"?claims.scope.split(/\s+/).filter(Boolean):Array.isArray(claims.scp)?claims.scp:[];
  if(requiredScope&&!scopes.includes(requiredScope))fail("missing_scope");
  return {subject:"oidc:"+await hex(config.issuer+"\0"+claims.sub),scope:scopes,issuer:claims.iss,expiry:claims.exp};
}
export function authorizationConfig(env){
  if(!isConfigured(env))fail("idp_not_configured");
  return {issuer:env.REMAKE_OIDC_ISSUER,audience:env.REMAKE_OIDC_AUDIENCE};
}
