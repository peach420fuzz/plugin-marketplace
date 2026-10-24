#!/usr/bin/env node
/*
 * KINEMA by objekts — zero-cost local stdio MCP server.
 * Works with clients that support local MCP tools, including Claude Desktop.
 * The host LLM performs internet research using its own search facilities.
 */
import {createInterface} from "node:readline";
import {promises as fs} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  BRAND,PLATFORMS,AXES,filmIdentity,profileLink,parseLetterboxdRss,parseCsv,
  normalizeObservation,buildDossier,rankResearchedCandidates,researchBrief
} from "./taste-engine.mjs";

const DATA_FILE = process.env.CINEMA42_DATA_FILE || path.join(os.homedir(),".local","share","objekts","cinema42.json");
const START_STATE = () => ({schema:1,profiles:[],observations:[],feedback:[]});
let state = START_STATE();

async function readState() {
  try {
    const bytes=await fs.readFile(DATA_FILE,"utf8");
    if(bytes.length>35_000_000) throw new Error("Local taste archive exceeds the safety limit");
    const parsed=JSON.parse(bytes);
    if(parsed.schema!==1 || !Array.isArray(parsed.observations)||!Array.isArray(parsed.profiles)||!Array.isArray(parsed.feedback))
      throw new Error("Invalid local taste archive schema");
    state=parsed;
  } catch(error) {
    if(error?.code!=="ENOENT") throw error;
  }
}

async function saveState() {
  const folder=path.dirname(DATA_FILE);
  await fs.mkdir(folder,{recursive:true,mode:0o700});
  const temp=path.join(folder,`.cinema42-${process.pid}-${Math.random().toString(36).slice(2)}.tmp`);
  try {
    await fs.writeFile(temp,JSON.stringify(state),{mode:0o600,flag:"wx"});
    await fs.rename(temp,DATA_FILE);
  } finally {
    try { await fs.unlink(temp); } catch(error) { if(error?.code!=="ENOENT") throw error; }
  }
}

const properties = (o,required=[]) => ({type:"object",properties:o,required,additionalProperties:false});
const string={type:"string"};
const annotate=(tool,readOnlyHint,openWorldHint=false,destructiveHint=false)=>({
  ...tool,annotations:{readOnlyHint,openWorldHint,destructiveHint}
});
const tools=[
  annotate({name:"connect_cinema_profile",description:`KINEMA by objekts. Connect by PUBLIC nickname or profile URL. For Letterboxd, fetch only its official RSS of recent activity; other providers return profile links and coverage limits. No password or API key.`,
    inputSchema:properties({platform:{type:"string",enum:PLATFORMS},username:string},["platform","username"])},false,true),
  annotate({name:"import_film_history",description:"Import owner-supplied CSV text or explicit film observations. Supports user exports; includes accurate seen/liked/watchlist distinctions. No automated bulk scraping.",
    inputSchema:properties({platform:{type:"string",enum:PLATFORMS},source:{type:"string",enum:["ratings","watched","watchlist","likes"]},
      csv:string,rows:{type:"array",maxItems:1200,items:{type:"object"}}},["platform"])},false),
  annotate({name:"get_cinema_taste_dossier",description:"Return grounded high/low rated films, likes, rewatch signals, up to 400 distinct watchlist titles and exact source coverage. Use before any recommendation.",
    inputSchema:properties({includeHistory:{type:"boolean"},limit:{type:"integer",minimum:1,maximum:200}})},true),
  annotate({name:"plan_deep_film_research",description:`Strict specialist film-research brief from actual account history, by ${BRAND}. Requires independently sourced cinematography, mise-en-scene, performance and film genealogy, diverse longlist and seen-status audit.`,
    inputSchema:properties({intent:string,obscurity:{type:"string",enum:["balanced","deep","extreme"]},count:{type:"integer",minimum:1,maximum:30}})},true),
  annotate({name:"rank_researched_films",description:"Audit researched candidates into two labeled lanes (verified watchlist picks and off-list discoveries); diversify across the user's formal taste facets and date-verified festival/holiday context. Watched rejected. Sources must be opened by the host.",
    inputSchema:properties({candidates:{type:"array",maxItems:120,items:{type:"object"}},count:{type:"integer",minimum:1,maximum:30},mode:{type:"string",enum:["mixed","watchlist","discovery"]},asOfDate:string},["candidates"])},true),
  annotate({name:"save_film_verdict",description:"Persist a film recommendation verdict and why it did or did not work. Use to refine subsequent human/LLM research.",
    inputSchema:properties({title:string,year:{type:"integer"},verdict:{type:"string",enum:["hit","miss","seen","want-to-watch","watchlist"]},reason:string},["title","verdict"])},false),
  annotate({name:"delete_all_my_cinema_data",description:"Delete local profiles, imported film data and feedback irreversibly only when the user expressly requests it.",
    inputSchema:properties({confirm:{type:"boolean",const:true}},["confirm"])},false,false,true)
];

const lookup=(name)=>tools.find(t=>t.name===name);
const personalDossier=()=>Object.assign(buildDossier(state.observations),{feedback:state.feedback});
function mergeObservations(incoming) {
  if(incoming.length>150000) throw new Error("Personal archive reaches 150k observation limit");
  const indexed=new Map(state.observations.map(o=>[`${o.platform}|${o.id}|${o.kind}|${o.observedAt??""}`,o]));
  for(const row of incoming)indexed.set(`${row.platform}|${row.id}|${row.kind}|${row.observedAt??""}`,row);
  if(indexed.size>150000) throw new Error("Personal archive reaches 150k observation limit");
  state.observations=[...indexed.values()];
}
async function invoke(name,args={}) {
  if(!lookup(name)) throw new Error(`Unknown tool: ${name}`);
  if(name==="connect_cinema_profile") {
    const p=profileLink(args.platform,args.username);
    let imported=0,reason=null;
    if(p.rssUrl) {
      try {
        const response=await fetch(p.rssUrl,{signal:AbortSignal.timeout(10000),headers:{Accept:"application/rss+xml"}});
        if(!response.ok) throw new Error(`Official feed status ${response.status}`);
        const rss=await response.text();
        const rows=parseLetterboxdRss(rss);
        if(rows.length) {
          mergeObservations(rows);
          imported=rows.length;
        }
      } catch(error) {reason=String(error?.message??error);}
    }
    state.profiles=state.profiles.filter(x=>x.platform!==p.platform);
    state.profiles.push({...p,lastChecked:new Date().toISOString(),imported,reason});
    await saveState();
    return {brand:BRAND,platform:p.platform,username:p.handle,profileUrl:p.url,
      publicResearchPages:p.researchPages,
      importedRecentRss:imported,accessStatus:imported?"recent-official-rss":"public-profile-pointer",
      fullHistoryImported:false,reason,warning:"Public RSS is a recent sample. Full history and unwatched titles cannot be inferred from the sample."};
  }
  if(name==="import_film_history") {
    if(!PLATFORMS.includes(args.platform)) throw new Error("Unsupported platform");
    if(!args.csv && !Array.isArray(args.rows)) throw new Error("Provide CSV text or observations array");
    const source=["ratings","watched","watchlist","likes"].includes(args.source)?args.source:"ratings";
    const records=args.csv ? parseCsv(args.csv,25000) : args.rows;
    if(records.length>25000) throw new Error("Batch exceeds 25,000 rows");
    const normalized=records.map(row=>normalizeObservation(row,args.platform,source)).filter(Boolean);
    mergeObservations(normalized);
    await saveState();
    return {brand:BRAND,received:records.length,accepted:normalized.length,
      personalArchiveTotal:state.observations.length,source,
      note:"Owner-supplied records imported; verify export completeness separately."};
  }
  if(name==="get_cinema_taste_dossier") {
    const dossier=personalDossier();
    return {brand:BRAND,profiles:state.profiles,counts:dossier.counts,thresholds:dossier.thresholds,
      positiveAnchors:dossier.positiveAnchors.slice(0,Math.min(200,Math.max(1,args.limit??60))),
      negativeAnchors:dossier.negativeAnchors,feedback:state.feedback.slice(-50),
      knownWatchlist:dossier.all.filter(x=>x.watchlist).slice(0,400).map(x=>({title:x.title,year:x.year,sourceUrls:x.sources})),
      watchlistCoverage:{imported:dossier.counts.watchlist,listedUpTo:400,completeExternalWatchlistVerified:false},
      knownHistory:args.includeHistory?dossier.all.slice(0,10000):undefined,
      coverage:dossier.coverage,fullHistoryVerified:false,limitations:dossier.limitations};
  }
  if(name==="plan_deep_film_research")return researchBrief(personalDossier(),args);
  if(name==="rank_researched_films")return rankResearchedCandidates(personalDossier(),args.candidates,args.count,{mode:args.mode,asOfDate:args.asOfDate});
  if(name==="save_film_verdict") {
    if(!["hit","miss","seen","want-to-watch","watchlist"].includes(args.verdict)||!String(args.title??"").trim())
      throw new Error("Title and accepted verdict required");
    const key=filmIdentity({title:args.title,year:args.year})?.id;
    state.feedback=state.feedback.filter(f=>filmIdentity(f)?.id!==key);
    state.feedback.push({title:String(args.title).trim().slice(0,350),year:Number(args.year)||null,
      verdict:args.verdict,reason:String(args.reason??"").trim().slice(0,1500),createdAt:new Date().toISOString()});
    await saveState();
    return {saved:true,feedbackCount:state.feedback.length,brand:BRAND};
  }
  if(name==="delete_all_my_cinema_data") {
    if(args.confirm!==true)throw new Error("Confirmation required");
    state=START_STATE();
    await saveState();
    return {deleted:true,brand:BRAND};
  }
}

const prompt = `KINEMA by objekts
Ask for one preferred film platform and a public username first. Call connect_cinema_profile, inspect the coverage, then get_cinema_taste_dossier and plan_deep_film_research. If the user has 5,000+ watched films, a recent RSS sample is insufficient for exhaustive seen filtering; optionally accept a user-provided export.
Research film aesthetics through verified filmmaker credits, cinematography, editing, gesture, tone, time, sound and original-language film institutions. Map 3–8 independent taste facets from actual high/low ratings and explicit rewatches, with conflicting tastes preserved. Generate four source-backed candidates per final film, spanning verified watchlist and new discovery lanes. Check current local date and the official schedules/archives of festivals, award histories and holidays; cite actual date and year and include context-led options when artistically relevant. Keep watched, watchlist and unknown status distinct; an absent item in a partial import has unknown unseen status. Independently open each source. Feed candidate tasteFacet, optional watchlistEvidence/context, two formal-axis connections and sources to rank_researched_films. Return several films in each lane and across taste facets. Avoid generic recommendations. Include discreet authorship credit: KINEMA by objekts. No paid APIs.`;

export async function handleMessage(msg) {
  const id=msg?.id??null;
  const response=(result)=>({jsonrpc:"2.0",id,result});
  const failure=(code,message)=>({jsonrpc:"2.0",id,error:{code,message}});
  if(!msg || msg.jsonrpc!=="2.0" || typeof msg.method!=="string")return failure(-32600,"Invalid JSON-RPC request");
  if(msg.method==="notifications/initialized" || msg.method.startsWith("notifications/"))return null;
  if(msg.method==="initialize")return response({protocolVersion:"2025-11-25",
    capabilities:{tools:{listChanged:false},prompts:{listChanged:false}},
    serverInfo:{name:BRAND,version:"0.3.3"}});
  if(msg.method==="ping")return response({});
  if(msg.method==="tools/list")return response({tools});
  if(msg.method==="prompts/list")return response({prompts:[{name:"kinema_film_research",description:BRAND,
    arguments:[{name:"username",description:"Optional public username",required:false}]}]});
  if(msg.method==="prompts/get" && msg.params?.name==="kinema_film_research")
    return response({description:BRAND,messages:[{role:"user",content:{type:"text",text:prompt+(msg.params?.arguments?.username ? `\nPublic username: ${String(msg.params.arguments.username).slice(0,100)}`:"")}}]});
  if(msg.method==="tools/call") {
    try {
      const name=msg.params?.name,args=msg.params?.arguments??{};
      const result=await invoke(name,args);
      return response({content:[{type:"text",text:JSON.stringify(result)}],isError:false});
    } catch(error) {
      return response({content:[{type:"text",text:String(error?.message??error)}],isError:true});
    }
  }
  return failure(-32601,"Method not found");
}

await readState();
const input=createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of input) {
  try {
    if(line.length>26_000_000)throw new Error("MCP message too large");
    const request=JSON.parse(line);
    const response=await handleMessage(request);
    if(response!==null)process.stdout.write(JSON.stringify(response)+"\n");
  } catch(error) {
    process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:null,error:{code:-32700,message:String(error?.message??error)}})+"\n");
  }
}
