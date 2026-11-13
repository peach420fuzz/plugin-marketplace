#!/usr/bin/env node
/*
 * KINEMA by objekts — zero-cost local stdio MCP server.
 * Works with clients that support local MCP tools, including Claude Desktop.
 * The host LLM performs internet research using its own search facilities.
 */
import {createInterface} from "node:readline";
import {createHash} from "node:crypto";
import {setTimeout as sleep} from "node:timers/promises";
import {promises as fs} from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  BRAND,PLATFORMS,AXES,filmIdentity,profileLink,parseLetterboxdRss,parseCsv,
  normalizeObservation,buildPersonalDossier,rankResearchedCandidates,researchBrief
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
    state=START_STATE(); // Another client may have removed the archive.
  }
}

// Every mutating call refreshes the archive under a filesystem-wide lock.
// Two installed local LLM clients can otherwise overwrite each other's data.
// A stale lock fails closed; inspection must precede any manual lock removal.
async function withArchiveLock(callback) {
  const folder=path.dirname(DATA_FILE);
  await fs.mkdir(folder,{recursive:true,mode:0o700});
  const lockFile=DATA_FILE+".lock";
  let handle=null;
  for(let attempt=0;attempt<60;attempt++) {
    try {handle=await fs.open(lockFile,"wx",0o600);break;}
    catch(error) {
      if(error?.code!=="EEXIST") throw error;
      if(attempt===59) throw new Error("Cinema archive is busy or a stale lock exists. Check that no other KINEMA process is writing, then inspect the .lock file before recovery.");
      await sleep(35+Math.min(70,attempt*3));
    }
  }
  try {
    await handle.writeFile(JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()}));
    await readState();
    const snapshot=structuredClone(state);
    try{return await callback();}
    catch(error){state=snapshot;throw error;}
  } finally {
    await handle.close();
    await fs.unlink(lockFile);
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
    inputSchema:properties({platform:{type:"string",enum:PLATFORMS},username:string,
      mergeWithExistingViewer:{type:"boolean"}},["platform","username"])},false,true),
  annotate({name:"import_film_history",description:"Import owner-supplied CSV text or explicit film observations. Supports user exports; includes accurate seen/liked/watchlist distinctions. No automated bulk scraping.",
    inputSchema:properties({platform:{type:"string",enum:PLATFORMS},source:{type:"string",enum:["ratings","watched","watchlist","likes"]},
      csv:string,rows:{type:"array",maxItems:1200,items:{type:"object"}},
      mergeWithExistingViewer:{type:"boolean"}},["platform"])},false),
  annotate({name:"get_cinema_taste_dossier",description:"Read rating evidence and paginated known history/watchlist. Defaults preserve 400 watchlist and up to 10000 history rows when requested. Use smaller page limits and nextOffset; pass archiveSnapshot as expectedSnapshot on continuation. Exhausting known pages does not verify external completeness.",
    inputSchema:properties({includeHistory:{type:"boolean"},limit:{type:"integer",minimum:1,maximum:200},
      watchlistOffset:{type:"integer",minimum:0,maximum:150000},watchlistLimit:{type:"integer",minimum:1,maximum:400},
      historyOffset:{type:"integer",minimum:0,maximum:150000},historyLimit:{type:"integer",minimum:1,maximum:10000},
      historyMinRating:{type:"number",minimum:0,maximum:10},historyMaxRating:{type:"number",minimum:0,maximum:10},
      expectedSnapshot:{type:"string",pattern:"^[0-9a-f]{64}$"}})},true),
  annotate({name:"plan_deep_film_research",description:`Strict specialist film-research brief from actual account history, by ${BRAND}. Requires independently sourced cinematography, mise-en-scene, performance and film genealogy, diverse longlist and seen-status audit.`,
    inputSchema:properties({intent:string,obscurity:{type:"string",enum:["balanced","deep","extreme"]},count:{type:"integer",minimum:1,maximum:30},asOfDate:string})},true),
  annotate({name:"rank_researched_films",description:"Audit researched candidates into two labeled lanes (verified watchlist picks and off-list discoveries); diversify across the user's formal taste facets and date-verified festival/holiday context. Watched rejected. Sources must be opened by the host.",
    inputSchema:properties({candidates:{type:"array",maxItems:120,items:{type:"object"}},count:{type:"integer",minimum:1,maximum:30},mode:{type:"string",enum:["mixed","watchlist","discovery"]},asOfDate:string,diversifyFacets:{type:"boolean"}},["candidates"])},true),
  annotate({name:"save_film_verdict",description:"Persist a film recommendation verdict and why it did or did not work. Use to refine subsequent human/LLM research.",
    inputSchema:properties({title:string,year:{type:"integer"},verdict:{type:"string",enum:["hit","miss","seen","want-to-watch","watchlist"]},reason:string},["title","verdict"])},false),
  annotate({name:"delete_all_my_cinema_data",description:"Delete local profiles, imported film data and feedback irreversibly only when the user expressly requests it.",
    inputSchema:properties({confirm:{type:"boolean",const:true}},["confirm"])},false,false,true)
];

// The token identifies this process's in-memory archive snapshot, not a login
// credential or a cross-process file lock. Reads never persist derived pages.
function dossierReadOptions(args) {
  if (!args || typeof args!=="object" || Array.isArray(args)) throw new Error("Dossier arguments must be an object");
  const bounds={limit:[1,200],watchlistOffset:[0,150000],watchlistLimit:[1,400],historyOffset:[0,150000],historyLimit:[1,10000]};
  const allowed=new Set([...Object.keys(bounds),"includeHistory","expectedSnapshot","historyMinRating","historyMaxRating"]);
  for (const key of Object.keys(args)) if (!allowed.has(key)) throw new Error(`Unknown dossier argument: ${key}`);
  for (const [key,[min,max]] of Object.entries(bounds)) {
    if (Object.hasOwn(args,key) && (!Number.isSafeInteger(args[key]) || args[key]<min || args[key]>max))
      throw new Error(`${key} must be an integer between ${min} and ${max}`);
  }
  if (Object.hasOwn(args,"includeHistory") && typeof args.includeHistory!=="boolean") throw new Error("includeHistory must be boolean");
  if (Object.hasOwn(args,"expectedSnapshot") && (typeof args.expectedSnapshot!=="string" || !/^[0-9a-f]{64}$/.test(args.expectedSnapshot)))
    throw new Error("expectedSnapshot must be an archive snapshot returned by this tool");
  for (const key of ["historyMinRating","historyMaxRating"]) {
    if (Object.hasOwn(args,key) && (typeof args[key]!=="number" || !Number.isFinite(args[key]) || args[key]<0 || args[key]>10))
      throw new Error(`${key} must be a finite normalized rating between 0 and 10`);
  }
  if ((args.historyMinRating??0)>(args.historyMaxRating??10)) throw new Error("Rating minimum cannot exceed maximum");
  return {limit:args.limit??60,includeHistory:args.includeHistory??false,
    historyMinRating:args.historyMinRating,historyMaxRating:args.historyMaxRating,
    watchlistOffset:args.watchlistOffset??0,watchlistLimit:args.watchlistLimit??400,
    historyOffset:args.historyOffset??0,historyLimit:args.historyLimit??10000,expectedSnapshot:args.expectedSnapshot};
}
function pageWindow(items,offset,limit) {
  const entries=items.slice(offset,offset+limit);
  const hasMore=offset+entries.length<items.length;
  return {entries,offset,limit,returned:entries.length,totalKnown:items.length,hasMore,
    nextOffset:hasMore?offset+entries.length:null};
}

const lookup=(name)=>tools.find(t=>t.name===name);
const personalDossier=()=>buildPersonalDossier(state.observations,state.feedback);
function requireViewerScope(platform,args) {
  if (Object.hasOwn(args,"mergeWithExistingViewer") && typeof args.mergeWithExistingViewer!=="boolean")
    throw new Error("mergeWithExistingViewer must be a boolean confirmed by the user");
  const differentConnected=state.profiles.some(p=>p.platform!==platform);
  const differentImported=state.observations.some(o=>o.platform!==platform);
  if ((differentConnected || differentImported) && args.mergeWithExistingViewer!==true)
    throw new Error("This archive already contains another cinema platform. Confirm both profiles are the same viewer before merging, or use a separate CINEMA42_DATA_FILE for a distinct viewer.");
}
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
    if(!p.url) return {brand:BRAND,platform:p.platform,username:p.handle,profileUrl:null,
      importedRecentRss:0,accessStatus:"public-profile-needs-resolution",profileResolutionRequired:true,
      fullHistoryImported:false,warning:"Resolve the supplied public display name using permitted host research before attributing any history. No profile or observations were saved."};
    const prior=state.profiles.find(x=>x.platform===p.platform);
    if (prior && prior.handle!==p.handle) throw new Error("Another profile is active for this platform. Use a separate CINEMA42_DATA_FILE for another viewer or explicitly delete the current viewer's archive first.");
    requireViewerScope(p.platform,args);
    let imported=0,reason=null;
    if(p.rssUrl) {
      try {
        const response=await fetch(p.rssUrl,{signal:AbortSignal.timeout(10000),redirect:"error",headers:{Accept:"application/rss+xml"}});
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
    requireViewerScope(args.platform,args);
    if(args.csv!=null && typeof args.csv!=="string") throw new Error("CSV must be text");
    if(Array.isArray(args.rows) && args.rows.length>1200) throw new Error("Observation array exceeds 1200 rows; split it or use CSV");
    if(!args.csv && !Array.isArray(args.rows)) throw new Error("Provide CSV text or observations array");
    const source=["ratings","watched","watchlist","likes"].includes(args.source)?args.source:"ratings";
    const records=args.csv ? parseCsv(args.csv,25000) : args.rows;
    if(records.length>25000) throw new Error("Batch exceeds 25,000 rows");
    const projected=records.map(row=>normalizeObservation(row,args.platform,source));
    const normalized=projected.filter(Boolean);
    const rejectedIndexes=projected.map((row,index)=>row?null:index).filter(index=>index!==null);
    if (!normalized.length) throw new Error("No valid film observations in batch; check title and rating fields");
    mergeObservations(normalized);
    await saveState();
    return {brand:BRAND,received:records.length,accepted:normalized.length,rejected:rejectedIndexes.length,
      rejectedRowIndexes:rejectedIndexes.slice(0,10),rejectedRowIndexesAreZeroBased:true,
      rejectedRowIndexesTruncated:rejectedIndexes.length>10,
      personalArchiveTotal:state.observations.length,source,
      note:"Owner-supplied records imported; verify export completeness separately."};
  }
  if(name==="get_cinema_taste_dossier") {
    const options=dossierReadOptions(args);
    const archiveSnapshot=createHash("sha256").update(JSON.stringify(state)).digest("hex");
    if(options.expectedSnapshot && options.expectedSnapshot!==archiveSnapshot)
      throw new Error("Archive snapshot changed; restart pagination from offset zero");
    const dossier=personalDossier();
    const watchlist=pageWindow(dossier.eligibleWatchlist,options.watchlistOffset,options.watchlistLimit);
    const ratingFilter=options.historyMinRating!==undefined || options.historyMaxRating!==undefined
      ? {min:options.historyMinRating??0,max:options.historyMaxRating??10}:null;
    const historyItems=ratingFilter ? dossier.all.filter(x=>x.rating!=null && x.rating>=ratingFilter.min && x.rating<=ratingFilter.max):dossier.all;
    const history=pageWindow(historyItems,options.historyOffset,options.historyLimit);
    const distribution=new Map();
    for (const x of dossier.all) if(x.watched && x.rating!=null) distribution.set(x.rating,(distribution.get(x.rating)??0)+1);
    const ratingEvidenceSummary={scope:"observed-archive-only",ratedFilms:dossier.counts.rated,
      ratingConflicts:dossier.counts.ratingConflicts,distribution:[...distribution].sort((a,b)=>a[0]-b[0]).map(([rating,count])=>({rating,count}))};
    return {brand:BRAND,profiles:state.profiles,counts:dossier.counts,thresholds:dossier.thresholds,
      positiveAnchors:dossier.positiveAnchors.slice(0,options.limit),
      negativeAnchors:dossier.negativeAnchors,feedback:state.feedback.slice(-50),
      knownWatchlist:watchlist.entries.map(x=>({title:x.title,year:x.year,
        sourceUrls:x.sources,provenance:x.provenance,seenStatus:"unverified-outside-observed-history"})),
      watchlistCoverage:{...dossier.watchlistCoverage,offset:watchlist.offset,limit:watchlist.limit,
        returned:watchlist.returned,nextOffset:watchlist.nextOffset,hasMore:watchlist.hasMore},
      knownHistory:options.includeHistory?history.entries:undefined,
      historyCoverage:{requested:options.includeHistory,totalKnown:history.totalKnown,archiveTotalKnown:dossier.all.length,ratingFilter,
        offset:history.offset,limit:history.limit,returned:options.includeHistory?history.returned:0,
        hasMore:options.includeHistory?history.hasMore:false,nextOffset:options.includeHistory?history.nextOffset:null,
        completeExternalHistoryVerified:false},
      ratingEvidenceSummary,archiveSnapshot,snapshotScope:"current-process-archive; not a cross-process lock",
      coverage:dossier.coverage,fullHistoryVerified:false,limitations:dossier.limitations};
  }
  if(name==="plan_deep_film_research")return researchBrief(personalDossier(),args);
  if(name==="rank_researched_films")return rankResearchedCandidates(personalDossier(),args.candidates,args.count,{mode:args.mode,asOfDate:args.asOfDate,diversifyFacets:args.diversifyFacets});
  if(name==="save_film_verdict") {
    if(typeof args.title!=="string" || !args.title.trim() || !["hit","miss","seen","want-to-watch","watchlist"].includes(args.verdict))
      throw new Error("String title and accepted verdict required");
    if(Object.hasOwn(args,"year") && (!Number.isInteger(args.year) || args.year<1880 || args.year>2100))
      throw new Error("Release year must be an integer from 1880 through 2100 when supplied");
    if(Object.hasOwn(args,"reason") && typeof args.reason!=="string") throw new Error("Reason must be a string when supplied");
    const key=filmIdentity({title:args.title,year:args.year})?.id;
    const seen=args.verdict==="seen" || state.feedback.some(f=>filmIdentity(f)?.id===key
      && (f.verdict==="seen" || f.seen===true));
    state.feedback=state.feedback.filter(f=>filmIdentity(f)?.id!==key);
    state.feedback.push({title:String(args.title).trim().slice(0,350),year:Number(args.year)||null,
      verdict:args.verdict,seen,reason:String(args.reason??"").trim().slice(0,1500),createdAt:new Date().toISOString()});
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
    serverInfo:{name:BRAND,version:"0.4.2-rc.2"}});
  if(msg.method==="ping")return response({});
  if(msg.method==="tools/list")return response({tools});
  if(msg.method==="prompts/list")return response({prompts:[{name:"kinema_film_research",description:BRAND,
    arguments:[{name:"username",description:"Optional public username",required:false}]}]});
  if(msg.method==="prompts/get" && msg.params?.name==="kinema_film_research")
    return response({description:BRAND,messages:[{role:"user",content:{type:"text",text:prompt+(msg.params?.arguments?.username ? `\nPublic username: ${String(msg.params.arguments.username).slice(0,100)}`:"")}}]});
  if(msg.method==="tools/call") {
    try {
      const name=msg.params?.name,args=msg.params?.arguments??{};
      const mutating=["connect_cinema_profile","import_film_history","save_film_verdict","delete_all_my_cinema_data"].includes(name);
      const result=mutating ? await withArchiveLock(()=>invoke(name,args))
        : (await readState(),await invoke(name,args));
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
