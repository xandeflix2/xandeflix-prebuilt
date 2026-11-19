import type {Episode} from '../contracts/catalog.ts';
import type {CatalogReadModel} from './catalog-read-model.ts';
import type {EpisodeViewModel,SeasonViewModel} from './catalog-view-model.ts';
import {normalizeArtworkIdentity,hasPosterYearCorrection,type ArtworkIdentity,type ArtworkMetadata} from '../artwork/tmdb-metadata.service.ts';
import {validEpisodeStillPath,type TmdbSeasonMetadata} from '../artwork/tmdb-season-episodes.service.ts';
import {normalizeArtworkUri} from '../artwork/artwork-uri.ts';
export type EpisodeMatch='MATCH_CONFIRMED'|'MATCH_AMBIGUOUS'|'MATCH_UNAVAILABLE';
export interface EpisodePresentation extends EpisodeViewModel{readonly sceneUri?:string;readonly sceneSource?:'episode'|'series';readonly metadataMatch:EpisodeMatch}
export interface EpisodeSeasonPresentation extends Omit<SeasonViewModel,'episodes'>{episodes:EpisodePresentation[]}
const key=(v:string)=>v.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/** Exact full-title equivalence only; the public poster remains mandatory. */
const seriesKey=(v:string)=>key(normalizeArtworkIdentity({kind:'series',title:v}).title.replace(/ı/g,'i'));
const sameSeriesTitle=(a:string,b:string)=>{const x=seriesKey(a),y=seriesKey(b),compact=x.replaceAll(' ','');return !!x&&(x===y||(compact.length>=8&&compact===y.replaceAll(' ','')));};
const posterMatches=(identity:ArtworkIdentity,metadata:ArtworkMetadata)=>validEpisodeStillPath(identity.posterPath)&&[metadata.posterUri,...(metadata.heroPosterUris||[])].some(uri=>filename(uri)===identity.posterPath);
const positiveId=(v:unknown):number|undefined=>/^[1-9]\d*$/.test(String(v??''))&&Number.isSafeInteger(Number(v))&&Number(v)<=2147483647?Number(v):undefined;
const filename=(uri:string|undefined):string|undefined=>{try{const u=new URL(uri||'');return u.protocol==='https:'&&u.hostname==='image.tmdb.org'&&!u.username&&!u.password&&!u.search&&!u.hash?u.pathname.match(/^\/t\/p\/[^/]+(\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp))$/)?.[1]:undefined;}catch{return undefined;}};
/** Adds evidence to the existing resolver: no title-only or popularity-only episode lookup. */
export function confirmEpisodeSeries(identity:ArtworkIdentity|undefined,metadata:ArtworkMetadata|null|undefined):number|undefined{
  if(identity?.kind!=='series'||metadata?.kind!=='series'||!positiveId(metadata.tmdbId))return;
  const normalized=normalizeArtworkIdentity(identity);
  const year=/^\d{4}$/.test(String(normalized.year??''))?Number(normalized.year):undefined;
  if(year&&metadata.year!==year&&!hasPosterYearCorrection(identity,metadata))return;
  const explicit=positiveId(identity.tmdbId);if(explicit)return explicit===metadata.tmdbId?explicit:undefined;
  const sameTitle=[metadata.title,metadata.originalTitle].some(t=>t&&sameSeriesTitle(normalized.title,t));
  return sameTitle&&posterMatches(identity,metadata)?metadata.tmdbId:undefined;
}
export function episodeSceneUri(path:unknown):string|undefined{return validEpisodeStillPath(path)?'https://image.tmdb.org/t/p/w300'+path:undefined;}
function localScene(model:CatalogReadModel,ep:Episode|undefined):string|undefined{
  if(!ep)return;const series=model.seriesById?.get(ep.seriesId);
  const seriesImages=new Set([series?.posterUri,series?.posterUrl,series?.cover,...(series?.artworkIds||[]).map(id=>model.artworkById.get(id)).filter(art=>art?.kind==='poster').map(art=>art?.uri)].map(normalizeArtworkUri).filter(Boolean));
  const seriesPaths=new Set([...seriesImages].map(uri=>filename(uri)).filter(Boolean));
  const allowed=(uri:string)=>!seriesImages.has(uri)&&!(filename(uri)&&seriesPaths.has(filename(uri)));
  for(const candidate of[ep.thumbnailUri,ep.thumbnailUrl,ep.posterUri,ep.posterUrl]){const value=normalizeArtworkUri(candidate);if(value&&allowed(value))return filename(value)?episodeSceneUri(filename(value)):value;}
  for(const id of ep.artworkIds){const art=model.artworkById.get(id);if(art?.kind==='thumbnail'||art?.kind==='backdrop'){const value=normalizeArtworkUri(art.uri);if(value&&allowed(value))return filename(value)?episodeSceneUri(filename(value)):value;}}
  return;
}
const edited=(v:string)=>/\b(?:editad[oa]s?|reunid[oa]s?|compilad[oa]s?|compilacao|versao reduzida|capitulos juntos|episodio duplo|double episode)\b|\bs\d+e\d+\s*[-+e]\s*(?:e)?\d+\b/i.test(key(v));
function individualTitle(v:string):string|undefined{
  const clean=key(v).replace(/^(?:.*?\s+)?(?:s\d+e\d+|t\d+e\d+)\s*/,'').replace(/^(?:episodio|episode|capitulo|ep)\s*\d+\s*/,'').trim();
  return clean&&!/^\d+$/.test(clean)?clean:undefined;
}
export interface EpisodeSeriesProof{identity:ArtworkIdentity;metadata:ArtworkMetadata}
/** Explicit source release identity; never infer from an array index or an isolated episode number. */
function qualifiedNumberedRelease(title:string,localSeriesTitle:string|undefined,proof:EpisodeSeriesProof|undefined,confirmedId:number|undefined,season:number,episode:number):boolean{
  if(!proof||!positiveId(confirmedId)||confirmEpisodeSeries(proof.identity,proof.metadata)!==confirmedId)return false;
  const {identity,metadata}=proof;
  if(!posterMatches(identity,metadata)||!localSeriesTitle||!sameSeriesTitle(identity.title,localSeriesTitle))return false;
  const release=/^(.+?)\s+S(\d{1,4})E(\d{1,5})$/i.exec(title.trim());
  return !!release&&sameSeriesTitle(release[1],identity.title)&&Number(release[2])===season&&Number(release[3])===episode;
}
/** Pure presentation projection. Local ids/count/order/playback links and snapshots are never mutated. */
export function projectEpisodeSeason(model:CatalogReadModel,season:SeasonViewModel,data:TmdbSeasonMetadata|null|undefined,confirmedSeriesId:number|undefined,seriesBackdrop?:string,seriesProof?:EpisodeSeriesProof):EpisodeSeasonPresentation{
  const byNumber=new Map(data?.episodes.map(ep=>[ep.episodeNumber,ep])||[]),seen=new Set<number>();
  const localSeason=model.seasonsById?.get(season.id);
  const seriesScene=positiveId(confirmedSeriesId)?episodeSceneUri(filename(seriesBackdrop)):undefined;
  const foreign=!!data&&(data.seriesId!==confirmedSeriesId||data.seasonNumber!==season.seasonNumber||!localSeason||localSeason.seasonNumber!==season.seasonNumber);
  const ambiguous=edited(season.title)||season.episodes.some(ep=>{const duplicate=seen.has(ep.episodeNumber);seen.add(ep.episodeNumber);return duplicate||!Number.isSafeInteger(ep.episodeNumber)||ep.episodeNumber<1||(!!data&&!byNumber.has(ep.episodeNumber));});
  const uniformHour=!foreign&&!ambiguous&&season.episodes.length>=3&&season.episodes.every(ep=>{const local=model.episodesById.get(ep.id);return local?.durationSeconds===3600&&qualifiedNumberedRelease(local.title,model.seriesById?.get(local.seriesId)?.title,seriesProof,confirmedSeriesId,season.seasonNumber,ep.episodeNumber);});
  return{...season,episodes:season.episodes.map(original=>{
    const local=model.episodesById.get(original.id),candidate=byNumber.get(original.episodeNumber),sourceScene=localScene(model,local),sourcePath=filename(sourceScene);
    const scene=!foreign&&sourcePath&&data?.episodes.some(ep=>ep.stillPath===sourcePath&&ep.episodeNumber!==original.episodeNumber)?undefined:sourceScene;
    const fallback=(metadataMatch:EpisodeMatch):EpisodePresentation=>({...original,sceneUri:seriesScene||scene,sceneSource:seriesScene?'series':scene?'episode':undefined,metadataMatch});
    if(!data)return fallback('MATCH_UNAVAILABLE');
    if(foreign||ambiguous||!local||local.seriesId!==localSeason?.seriesId||local.seasonId!==season.id||local.episodeNumber!==original.episodeNumber||edited(local.title))return fallback('MATCH_AMBIGUOUS');
    if(!candidate)return fallback('MATCH_UNAVAILABLE');
    const explicit=positiveId(local.externalIds?.tmdbId),title=individualTitle(local.title),remoteTitle=candidate.name?individualTitle(candidate.name):undefined;
    const duration=local.durationSeconds,remoteSeconds=candidate.runtimeMinutes?candidate.runtimeMinutes*60:0;
    const qualified=qualifiedNumberedRelease(local.title,model.seriesById?.get(local.seriesId)?.title,seriesProof,confirmedSeriesId,season.seasonNumber,original.episodeNumber);
    const placeholderRuntime=uniformHour&&qualified&&remoteSeconds>0&&remoteSeconds<2700;
    if((local.externalIds?.tmdbId!==undefined&&!explicit)||(explicit&&explicit!==candidate.id)
      ||(duration&&remoteSeconds&&!placeholderRuntime&&Math.abs(duration-remoteSeconds)>=600&&(duration/remoteSeconds<0.65||duration/remoteSeconds>1.45)))return fallback('MATCH_AMBIGUOUS');
    const titleMatches=!!title&&!!remoteTitle&&title===remoteTitle,stillMatches=!!candidate.stillPath&&filename(scene)===candidate.stillPath;
    if(!explicit&&!titleMatches&&!stillMatches&&!qualified)return fallback('MATCH_AMBIGUOUS');
    const preferName=candidate.name&&(candidate.nameLanguage==='pt-BR'||!individualTitle(original.title));
    const preferSynopsis=candidate.overview&&(candidate.overviewLanguage==='pt-BR'||!original.overview?.trim());
    const episodeScene=episodeSceneUri(candidate.stillPath);
    return{...original,metadataMatch:'MATCH_CONFIRMED',title:preferName?candidate.name!:original.title,
      overview:preferSynopsis?candidate.overview:original.overview,
      durationFormatted:placeholderRuntime?candidate.runtimeMinutes+'min':duration&&duration>0?original.durationFormatted:original.durationFormatted||(candidate.runtimeMinutes?candidate.runtimeMinutes+'min':undefined),
      sceneUri:episodeScene||seriesScene||scene,
      sceneSource:episodeScene?'episode':seriesScene?'series':scene?'episode':undefined};
  })};
}
