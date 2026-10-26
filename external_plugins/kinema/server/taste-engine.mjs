/*
 * KINEMA by objekts
 * Evidence-driven film research support. The engine never invents films, credits,
 * aesthetic features or references: the host LLM supplies researched candidates.
 * Copyright 2026 objekts.ai. MIT license.
 */

export const BRAND = "KINEMA by objekts";
export const PLATFORMS = ["letterboxd", "imdb", "kinopoisk", "myshows"];
export const AXES = [
  "duration-and-temporality", "camera-distance-and-movement", "blocking-and-bodies",
  "editing-and-rhythm", "sound-and-silence", "light-and-color", "material-and-texture",
  "performance-and-gesture", "space-and-architecture", "humor-and-tonal-instability",
  "narrative-structure", "political-and-historical-context", "ritual-and-repetition",
  "animation-and-practical-form", "genre-transformation"
];

const normalizeTitle = (value) => String(value ?? "").normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("und")
  .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const decimal = (value) => value == null || value === "" ? null : Number(String(value).replace(",", "."));
const bounded = (v, low, high) => Math.max(low, Math.min(high, v));
const validYear = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1880 && n <= 2100 ? n : null;
};
const normalizeUrl = (value) => {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.username || url.password || url.href.length > 1200) return null;
    const host=url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host.includes(":")
      || /^[\d.]+$/.test(host) || /(^|\.)(example\.(com|org|net)|invalid|test)$/.test(host)) return null;
    return url.href.slice(0, 1200);
  } catch { return null; }
};
const formField = (row, ...keys) => {
  const map = new Map(Object.entries(row).map(([k, v]) => [k.toLowerCase().replace(/[\s_-]/g, ""), v]));
  for (const key of keys) {
    const value = map.get(key.toLowerCase().replace(/[\s_-]/g, ""));
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
};

export function filmIdentity(row) {
  const title = String(row.title ?? row.Title ?? row.Name ?? "").trim().slice(0, 350);
  if (!title) return null;
  const year = validYear(row.year ?? row.Year);
  const imdbId = String(row.imdbId ?? row.imdbID ?? row.Const ?? "").trim().toLowerCase();
  const tmdbId = String(row.tmdbId ?? row.tmdbID ?? "").trim();
  const id = /^tt\d{5,12}$/.test(imdbId) ? `imdb:${imdbId}`
    : /^\d+$/.test(tmdbId) ? `tmdb:${tmdbId}`
    : `title:${normalizeTitle(title)}:${year ?? "?"}`;
  const alternateTitles = [...new Set([row.originalTitle, ...(Array.isArray(row.alternateTitles) ? row.alternateTitles : [])]
    .filter(x=>typeof x === "string" && x.trim()).map(x=>x.trim().slice(0,350)))].slice(0,20);
  return { id, title, year, alternateTitles, imdbId: /^tt\d{5,12}$/.test(imdbId) ? imdbId : null,
    tmdbId: /^\d+$/.test(tmdbId) ? tmdbId : null,
    titleKey: `title:${normalizeTitle(title)}:${year ?? "?"}` };
}

export function normalizeObservation(row, platform = "letterboxd", kindHint = "ratings") {
  if (!PLATFORMS.includes(platform) || !row || typeof row !== "object") return null;
  const film = filmIdentity({
    title: formField(row, "Title", "Name", "Original Title", "Movie", "Название", "Film", "Show"),
    year: formField(row, "Year", "Release Year", "Год"),
    imdbId: formField(row, "Const", "imdbID", "IMDb ID"),
    tmdbId: formField(row, "tmdbID", "TMDB ID"),
    originalTitle:formField(row,"Original Title"), alternateTitles:row.alternateTitles
  });
  if (!film) return null;
  const raw = formField(row, "Your Rating", "Rating10", "Rating", "Оценка", "Personal Rating");
  const n = decimal(raw);
  const maxRating = platform === "letterboxd" && !formField(row, "Your Rating", "Rating10") ? 5 : 10;
  const rating = n != null && Number.isFinite(n) && n > 0 && n <= maxRating
    ? Math.round(n * 10 / maxRating * 100) / 100 : null;
  const liked = kindHint === "likes" || /^(yes|true|1|liked)$/i.test(formField(row, "Liked", "Like"));
  const rewatch = /^(yes|true|1)$/i.test(formField(row, "Rewatch", "Rewatched"));
  const kind = kindHint === "watchlist" ? "watchlist" : liked ? "liked"
    : rewatch ? "rewatched" : rating != null ? "rated" : "watched";
  return { ...film, platform, kind, rating, liked, rewatch,
    sourceUrl: normalizeUrl(formField(row, "Letterboxd URI", "URL", "Link")),
    observedAt: formField(row, "Watched Date", "WatchedDate", "Date Rated", "Date") || null,
    originalRating: raw || null, ratingScale: maxRating, provenance: "user-provided-file" };
}

export function parseCsv(text, maxRows = 100000) {
  if (typeof text !== "string" || text.length > 25_000_000) throw new Error("CSV must be a string smaller than 25 MB");
  const source = text.replace(/^\uFEFF/, "");
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) { row.push(field); field = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && source[i + 1] === "\n") i++;
      row.push(field); if (row.some((x) => x !== "")) rows.push(row);
      if (rows.length > maxRows + 1) throw new Error("CSV row limit exceeded");
      row = []; field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed CSV quoted field");
  row.push(field); if (row.some((x) => x !== "")) rows.push(row);
  if (!rows.length) return [];
  const [headers, ...data] = rows;
  if (headers.length > 128) throw new Error("CSV column limit exceeded");
  return data.map((cells) => Object.fromEntries(headers.map((h, i) => [h.trim(), cells[i] ?? ""])));
}

const extractTag = (xml, name) => {
  const safeName = name.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
  const raw = xml.match(new RegExp(`<${safeName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${safeName}>`, "i"))?.[1] ?? "";
  return raw.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1")
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, n) => String.fromCodePoint(n[0].toLowerCase() === "x" ? parseInt(n.slice(1), 16) : parseInt(n, 10)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, n) => ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'"}[n]));
};

export function parseLetterboxdRss(xml) {
  if (typeof xml !== "string" || xml.length > 2_000_000 || !xml.includes("<rss"))
    throw new Error("Expected a Letterboxd RSS feed under 2 MB");
  const records = [];
  for (const item of xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? []) {
    const film = filmIdentity({
      title: extractTag(item, "letterboxd:filmTitle"),
      year: extractTag(item, "letterboxd:filmYear"),
      tmdbId: extractTag(item, "tmdb:movieId")
    });
    if (!film) continue;
    const n = decimal(extractTag(item, "letterboxd:memberRating"));
    const rating = n != null && n > 0 && n <= 5 ? n * 2 : null;
    const liked = extractTag(item, "letterboxd:memberLike").toLowerCase() === "yes";
    const rewatch = extractTag(item, "letterboxd:rewatch").toLowerCase() === "yes";
    records.push({ ...film, platform:"letterboxd", kind: liked ? "liked" : rewatch ? "rewatched" : rating != null ? "rated" : "watched",
      rating, liked, rewatch, sourceUrl: normalizeUrl(extractTag(item, "link")),
      observedAt: extractTag(item, "letterboxd:watchedDate") || null,
      originalRating: n, ratingScale: 5, provenance: "public-official-rss-recent" });
  }
  return records;
}

export function profileLink(platform, input) {
  if (!PLATFORMS.includes(platform)) throw new Error("Unknown film platform");
  let handle = String(input ?? "").trim();
  let submittedProfileUrl = null;
  if (/^https:\/\//.test(handle)) {
    const parsed = new URL(handle);
    const permitted = {
      letterboxd:["letterboxd.com"], imdb:["www.imdb.com","imdb.com"],
      kinopoisk:["www.kinopoisk.ru","kinopoisk.ru"], myshows:["myshows.me","en.myshows.me"]
    }[platform];
    if (parsed.username || parsed.password || parsed.port || !permitted.includes(parsed.hostname)) throw new Error("Profile URL does not match the platform");
    submittedProfileUrl=parsed.origin+parsed.pathname;
    const pieces=parsed.pathname.split("/").filter(Boolean);
    handle=platform==="letterboxd" ? pieces[0] ?? ""
      : platform==="kinopoisk" && pieces[0]==="user" ? pieces[1] ?? ""
      : platform==="imdb" && pieces[0]==="user" ? pieces[1] ?? ""
      : pieces.at(-1) ?? "";
  }
  if (!/^[\p{L}\p{N}_.-]{1,80}$/u.test(handle)) throw new Error("Invalid public username");
  const url = { letterboxd:`https://letterboxd.com/${encodeURIComponent(handle)}/`,
    imdb:`https://www.imdb.com/user/${encodeURIComponent(handle)}/`,
    kinopoisk:/^\d+$/.test(handle)?`https://www.kinopoisk.ru/user/${encodeURIComponent(handle)}/`:null,
    myshows:submittedProfileUrl }[platform];
  const researchPages = platform==="letterboxd" ? {
    highestRated:`https://letterboxd.com/${encodeURIComponent(handle)}/films/rated/5/by/date/`,
    highRated:`https://letterboxd.com/${encodeURIComponent(handle)}/films/rated/4.5/by/date/`,
    liked:`https://letterboxd.com/${encodeURIComponent(handle)}/likes/films/`,
    allRated:`https://letterboxd.com/${encodeURIComponent(handle)}/films/by/entry-rating/`,
    diary:`https://letterboxd.com/${encodeURIComponent(handle)}/films/diary/`,
    watchlist:`https://letterboxd.com/${encodeURIComponent(handle)}/watchlist/`
  } : null;
  const status=platform==="letterboxd"?"rss-eligible":url?"public-link-only":"public-profile-needs-resolution";
  return {platform,handle,url,status,
    rssUrl:platform === "letterboxd" ? `https://letterboxd.com/${encodeURIComponent(handle)}/rss/` : null,
    researchPages};
}

function observedAliases(record) {
  const all = new Set([record.id, record.titleKey]);
  if (record.imdbId) all.add(`imdb:${record.imdbId}`);
  if (record.tmdbId) all.add(`tmdb:${record.tmdbId}`);
  for (const title of record.alternateTitles ?? []) all.add(`title:${normalizeTitle(title)}:${record.year ?? "?"}`);
  // Only identifiers produced by the engine are accepted as additional aliases.
  for (const id of record.alternateIds ?? []) if (/^(imdb:tt\d+|tmdb:\d+|title:.+)$/.test(id)) all.add(id);
  return all;
}

export function buildDossier(rows = []) {
  if (!Array.isArray(rows)) throw new Error("Observations must be an array");
  const films = new Map();
  const byAlias = new Map();
  for (const raw of rows ?? []) {
    if (!raw || typeof raw !== "object") continue;
    const identity = filmIdentity(raw);
    if (!identity) continue;
    const record = { ...identity, ...raw, id:identity.id, titleKey:identity.titleKey,
      rating:raw.rating == null ? null : Number(raw.rating) };
    const found = [...observedAliases(record)]
      .map(alias => byAlias.get(alias))
      .find((p) => p && !(record.imdbId && p.imdbId && record.imdbId!==p.imdbId)
        && !(record.tmdbId && p.tmdbId && record.tmdbId!==p.tmdbId));
    const entry = found ?? { ...identity, rating:null, liked:false, rewatch:false, watched:false, watchlist:false,
      platforms:[], sources:[], provenance:[], alternateIds:[], ratingEvidence:[] };
    if (!found) films.set(identity.id, entry);
    for (const alias of observedAliases(record)) {
      if (!byAlias.has(alias)) byAlias.set(alias,entry);
      if (alias !== entry.id && alias !== entry.titleKey && !entry.alternateIds.includes(alias))
        entry.alternateIds.push(alias);
    }
    if (record.rating != null && Number.isFinite(record.rating) && record.rating >= 0 && record.rating <= 10)
      entry.ratingEvidence.push({rating:record.rating, observedAt:record.observedAt ?? null});
    entry.liked ||= Boolean(record.liked || record.kind === "liked");
    entry.rewatch ||= Boolean(record.rewatch || record.kind === "rewatched");
    entry.watchlist ||= record.kind === "watchlist";
    entry.watched ||= record.kind !== "watchlist";
    if (record.platform && !entry.platforms.includes(record.platform)) entry.platforms.push(record.platform);
    if (record.provenance && !entry.provenance.includes(record.provenance)) entry.provenance.push(record.provenance);
    if (normalizeUrl(record.sourceUrl) && !entry.sources.includes(record.sourceUrl)) entry.sources.push(record.sourceUrl);
  }
  const all = [...films.values()];
  for (const entry of all) {
    const evidence=entry.ratingEvidence;
    const dated=evidence.filter(x=>/^\d{4}-\d{2}-\d{2}/.test(x.observedAt ?? "") && Number.isFinite(Date.parse(x.observedAt)));
    const pool=dated.length ? dated.filter(x=>Date.parse(x.observedAt)===Math.max(...dated.map(y=>Date.parse(y.observedAt)))) : evidence;
    const values=[...new Set(pool.map(x=>x.rating))];
    entry.rating=values.length===1 ? values[0] : null;
    entry.ratingConflict=values.length>1;
  }
  const ratings = all.filter((f) => f.watched && f.rating != null).map((f) => f.rating).sort((a, b) => a - b);
  const percentile = (v) => ratings.length ? ratings[Math.floor((ratings.length - 1) * v)] : null;
  const highBar = Math.min(8, percentile(.8) ?? 7.5);
  const lowBar = Math.min(5, percentile(.2) ?? 5);
  const positives = all.filter((f) => f.watched && !f.ratingConflict
    && (f.rating == null ? f.liked : f.rating >= highBar && (f.rating > lowBar || f.liked)))
    .sort((a, b) => Number(b.rewatch) - Number(a.rewatch) || Number(b.liked) - Number(a.liked) || (b.rating ?? 0) - (a.rating ?? 0));
  const negatives = all.filter((f) => f.watched && f.rating != null && f.rating <= lowBar && f.rating < highBar)
    .sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
  const coverage = [...new Set(all.flatMap((f) => f.provenance))];
  return {
    brand:BRAND, counts:{ratingConflicts:all.filter(f=>f.ratingConflict).length,observations:rows.length, unique:all.length, watched:all.filter((f) => f.watched).length,
      rated:ratings.length, liked:all.filter((f) => f.liked).length, rewatched:all.filter((f) => f.rewatch).length,
      watchlist:all.filter((f) => f.watchlist).length},
    thresholds:{highBar,lowBar}, positiveAnchors:positives.slice(0,80), negativeAnchors:negatives.slice(0,40),
    all, coverage, fullHistoryVerified:false,
    limitations:["Public RSS shows recent activity. Full-history coverage requires authorized data.",
      "Watched, rated, liked, rewatched and watchlist are separate signals.",
      "No candidate can be called unseen unless complete history has been verified.",
      "Film style, authorship and artistic lineages require researched citations."]
  };
}

const isSameFilm = (a, b) => {
  if (a.imdbId && b.imdbId && a.imdbId !== b.imdbId) return false;
  if (a.tmdbId && b.tmdbId && a.tmdbId !== b.tmdbId) return false;
  // Public five-star lists may have verified titles without release years.
  // Conservative title-level exclusion prevents claiming those titles unseen;
  // distinct known remake years still remain separate entries.
  if (normalizeTitle(a.title) === normalizeTitle(b.title) && (a.year==null || b.year==null)) return true;
  const aa = observedAliases(a); return [...observedAliases(b)].some((alias) => aa.has(alias));
};
function validConnection(connection, anchors) {
  if (!connection || !AXES.includes(connection.axis)) return null;
  const reference = filmIdentity(connection.anchor ?? {});
  const anchor = reference && anchors.find((p) => isSameFilm(reference, p));
  if (!anchor || !String(connection.analysis ?? "").trim() || !normalizeUrl(connection.sourceUrl))
    return null;
  return {anchor:{title:anchor.title,year:anchor.year,rating:anchor.rating,liked:anchor.liked,rewatch:anchor.rewatch},
    axis:connection.axis,analysis:String(connection.analysis).trim().slice(0,1000),
    sourceUrl:normalizeUrl(connection.sourceUrl)};
}

function contextualEvidence(raw, asOfDate) {
  if (!raw || typeof raw !== "object") return null;
  const kinds = ["festival-award", "festival-program", "holiday", "anniversary", "retrospective", "release"];
  if (!kinds.includes(raw.kind) || !String(raw.event ?? "").trim()) return null;
  const sourceUrl = normalizeUrl(raw.sourceUrl);
  if (!sourceUrl) return null;
  const date = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return null;
    const parsed=new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10)===value ? value : null;
  };
  const startDate = date(raw.startDate), endDate = date(raw.endDate);
  const asOf = date(asOfDate);
  let calendarStatus = "date-unverified";
  if (asOf && startDate && endDate && startDate <= endDate) {
    if (asOf >= startDate && asOf <= endDate) calendarStatus = "ongoing-by-supplied-dates";
    else if (asOf < startDate) calendarStatus = "upcoming-by-supplied-dates";
    else calendarStatus = "historical-by-supplied-dates";
  }
  return {kind:raw.kind,event:String(raw.event).trim().slice(0,160),
    connection:String(raw.connection ?? "").trim().slice(0,450),sourceUrl,
    startDate,endDate,awardYear:validYear(raw.awardYear),
    awardName:String(raw.awardName ?? "").trim().slice(0,120),
    calendarStatus,sourceVerification:"host-must-open-and-verify"};
}

function pickDiverse(pool, amount, previous = []) {
  const picked = [], remaining = [...pool];
  while (remaining.length && picked.length < amount) {
    let best = 0, bestScore = -Infinity;
    for (let i=0;i<remaining.length;i++) {
      const candidate=remaining[i];
      const redundancy=[...previous,...picked].reduce((cost,other) => {
        const sharedAxes=candidate.axes.filter(a=>other.axes.includes(a)).length;
        const sameDirector=normalizeTitle(candidate.director)===normalizeTitle(other.director)?10:0;
        const sameFacet=candidate.tasteFacet && other.tasteFacet
          && normalizeTitle(candidate.tasteFacet)===normalizeTitle(other.tasteFacet)?6:0;
        const sameDecade=candidate.year!=null && other.year!=null
          && Math.floor(candidate.year/10)===Math.floor(other.year/10)?2:0;
        return Math.max(cost,sameDirector+sameFacet+sameDecade+sharedAxes*1.5);
      },0);
      const score=candidate.baseScore-redundancy;
      if (score>bestScore) {best=i;bestScore=score;}
    }
    const candidate=remaining.splice(best,1)[0];
    picked.push({...candidate,diversityAdjustedScore:Math.round(bestScore*100)/100});
  }
  return picked;
}

/**
 * Deterministic evidence audit + diversity ranking for LLM-researched candidates.
 * Candidate evidence is user/host supplied; URLs are syntax-checked but their
 * contents must be independently opened and cited by the model.
 */
export function rankResearchedCandidates(dossier, candidates, count = 6, options = {}) {
  const limit = bounded(Math.trunc(Number(count)) || 6, 1, 30);
  const mode = ["mixed","watchlist","discovery"].includes(options?.mode) ? options.mode : "mixed";
  const passed = []; const rejected = [];
  const known = dossier.all ?? [];
  const anchors = dossier.positiveAnchors ?? [];
  for (const raw of (candidates ?? []).slice(0, 300)) {
    const film = filmIdentity(raw ?? {});
    if (!film) { rejected.push({title:null,reason:"missing_title"});continue;}
    if (film.year === null) {rejected.push({title:film.title,reason:"missing_release_year"});continue;}
    if (passed.some(x=>isSameFilm(x,film))) {rejected.push({title:film.title,reason:"duplicate_candidate"});continue;}
    if (known.some((k) => isSameFilm(film, k) && k.watched)) {rejected.push({title:film.title,reason:"already_watched"});continue;}
    const foundWatchlist=known.some((k) => isSameFilm(film, k) && k.watchlist);
    const priorVerdict = (dossier.feedback??[]).find((f) => {
      const seenFilm=filmIdentity(f);
      return seenFilm && isSameFilm(film,seenFilm);
    });
    if(priorVerdict && ["miss","seen","hit"].includes(priorVerdict.verdict)) {
      rejected.push({title:film.title,reason:`previous_feedback_${priorVerdict.verdict}`});continue;
    }
    const watchedLater=foundWatchlist || ["watchlist","want-to-watch"].includes(priorVerdict?.verdict)
      || (raw.watchlistEvidence?.status==="present" && normalizeUrl(raw.watchlistEvidence.sourceUrl));
    const lane=watchedLater?"watchlist":"discovery";
    if (mode==="discovery" && watchedLater) {rejected.push({title:film.title,reason:"already_on_watchlist"});continue;}
    if (mode==="watchlist" && !watchedLater) {rejected.push({title:film.title,reason:"watchlist_membership_unverified"});continue;}
    const connections = [...new Map((Array.isArray(raw.connections) ? raw.connections : []).slice(0,60)
      .map(c=>validConnection(c,anchors)).filter(Boolean)
      .map(c=>[`${normalizeTitle(c.anchor.title)}:${c.anchor.year}|${c.axis}`,c])).values()];
    const riskConnections = (Array.isArray(raw.riskConnections) ? raw.riskConnections : [])
      .map((c) => validConnection(c, dossier.negativeAnchors??[])).filter(Boolean);
    const axes = [...new Set(connections.map((c) => c.axis))];
    const sources = [...new Set((Array.isArray(raw.sources) ? raw.sources : []).map(normalizeUrl).filter(Boolean))];
    const allSources = [...new Set([...sources,...connections.map((c) => c.sourceUrl)])];
    const difference = String(raw.productiveDifference ?? "").trim().slice(0,600);
    const director = String(raw.director ?? "").trim().slice(0,200);
    const independentAnchors = new Set(connections.map((c) => `${normalizeTitle(c.anchor.title)}:${c.anchor.year ?? "?"}`));
    const neededAnchors = Math.min(2, anchors.length);
    if (!director || !String(raw.tasteFacet ?? "").trim() || axes.length < 2 || sources.length < 1 || allSources.length < 2 || !difference || independentAnchors.size < neededAnchors) {
      rejected.push({title:film.title,reason:"insufficient_credited_film_research",
        missing:{director:!director,distinctFormalAxes:axes.length,sourceUrls:allSources.length,
          distinctRatedAnchors:independentAnchors.size,requiredRatedAnchors:neededAnchors,productiveDifference:!difference}});
      continue;
    }
    const anchorSupport = connections.reduce((v, c) => v + (c.anchor.rewatch ? 2.5 : c.anchor.liked ? 2 : (c.anchor.rating ?? 7.5)/5), 0);
    const context=contextualEvidence(raw.context,options?.asOfDate);
    const score = 4 * axes.length + Math.min(12,anchorSupport) + Math.min(8,allSources.length * 1.5)
      + Math.min(5,independentAnchors.size)
      - riskConnections.length * 6 + (context ? 1.5 : 0);
    passed.push({...film,director,originalTitle:String(raw.originalTitle ?? "").trim() || film.title,
      connections,riskConnections,axes,sourceUrls:allSources,productiveDifference:difference,
      tasteFacet:String(raw.tasteFacet ?? "").trim().slice(0,120) || null,
      context,category:lane,watchlistStatus:watchedLater
        ? (foundWatchlist?"confirmed-imported-record":priorVerdict?"user-reported":"host-reported-source-unverified")
        : "not-in-observed-watchlist-unknown-in-full-history",
      relationStatus:"research-claims-await-independent-source-verification",
      seenStatus:"unverified-outside-observed-history",baseScore:Math.round(score*100)/100});
  }
  const watchlistPool=passed.filter(x=>x.category==="watchlist");
  const discoveryPool=passed.filter(x=>x.category==="discovery");
  const desiredWatchlist=mode==="watchlist"?limit:mode==="mixed"?Math.max(1,Math.round(limit*.4)):0;
  const watchlist=pickDiverse(watchlistPool,desiredWatchlist);
  const desiredDiscovery=mode==="watchlist"?0:limit-watchlist.length;
  const discovery=pickDiverse(discoveryPool,desiredDiscovery,watchlist);
  // Keep a balanced list when source research supplied more watchlist titles than expected.
  const remaining=limit-watchlist.length-discovery.length;
  if (remaining>0 && mode==="mixed") {
    const picked=new Set(watchlist.map(x=>x.id));
    watchlist.push(...pickDiverse(watchlistPool.filter(x=>!picked.has(x.id)),remaining,[...watchlist,...discovery]));
  }
  const selected=[...watchlist,...discovery];
  return {brand:BRAND,mode,groups:{watchlist,discovery},selected,rejected,shortlistSize:passed.length,
    audit:{selectionMethod:"citation-gated heuristic and MMR-inspired diversity reranking",
      training:"none",formalFilmResearch:"provided by host LLM; verify cited links",
      completeWatchedCoverage:Boolean(dossier.fullHistoryVerified),
      requestedWatchlistSlots:desiredWatchlist,filledWatchlistSlots:watchlist.length,
      coveredTasteFacets:[...new Set(selected.map(x=>x.tasteFacet).filter(Boolean))],
      calendarEvidence:selected.filter(x=>x.context).length,
      uncertainty:"Every selected film requires external factual checking before final presentation."}};
}

export function researchBrief(dossier, {count=6,intent="discover",obscurity="deep",asOfDate=null}={}) {
  const n=bounded(Math.trunc(Number(count))||6,1,30);
  return {brand:BRAND,intent,obscurity,asOfDate,requested:n,longlistTarget:n*4,outputLanes:{watchlist:Math.max(1,Math.round(n*.4)),discovery:n-Math.max(1,Math.round(n*.4))},knownSample:dossier.counts,
    topAnchors:dossier.positiveAnchors?.slice(0,40) ?? [],
    negativeAnchors:dossier.negativeAnchors?.slice(0,20) ?? [],
    pastVerdicts:(dossier.feedback??[]).slice(-30),
    instructions:[
      "Start from individual relative ratings, likes and rewatches across decades. Four pinned favorites cannot stand for the entire taste profile.",
      "Trace form, sound, temporality, performance, architecture, humor, editing, materiality and cultural genealogy using films actually present in the user evidence.",
      "Research at least four candidates per requested recommendation. Use original-language festival archives, cinematheques, verified credits, filmmaker and cinematographer interviews, academic film scholarship and specialist criticism.",
      "Provide film title, original title, year, director, at least two cited formal connections on DIFFERENT artistic axes and, where evidence permits, DIFFERENT rated films, plus one meaningful divergence.",
      "Ground concrete camera, production, credit, festival and author assertions in checked primary sources. Critical readings are explicitly interpretive.",
      "Confirm watch history and watchlist from connected data; with a public RSS sample the user's unwatched status remains unknown.",
      "Create 3–8 evidence-anchored taste facets across the viewer's ENTIRE rated spectrum, including contradictions. Source a distinct recommendation for each major facet rather than repeating the same aesthetic cluster.",
      "Select both known watchlist films (viewer intent) and fresh discoveries (not recorded in the observed watchlist). Label every unknown watchlist/watched status explicitly; never infer verified absence from a partial profile.",
      "Check today's date and official festival schedules, historical awards, local cinematheque seasons and holidays. Include a context-led candidate only where its artistic fit stands on actual user ratings; verify award year, schedule and relevance.",
      "Supply each candidate to rank_researched_films with the exact anchor films, distinct axes, analyses, HTTPS sources and productiveDifference.",
      "Rerank for relevance and breadth across filmmakers, eras, geographies and forms. Explain why every selection is specific to this user.",
      "Never invent films, credits, scene details, sources, viewing status or availability. Label uncertainty and ask for targeted feedback."
    ]};
}
