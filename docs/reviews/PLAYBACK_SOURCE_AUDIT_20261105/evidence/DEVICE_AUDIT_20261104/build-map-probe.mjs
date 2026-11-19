import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const original='C:/Xandeflix/xandeflix-prebuilt-c11-main/scripts/test-c105-directory-details.mjs';
let source=fs.readFileSync(original,'utf8');
source=source.replace(/from '(\.\.\/[^']+)'/g,(_,p)=>`from '${new URL(p,pathToFileURL(original)).href}'`);
const extra=`
  await test('AUDIT_MAP_SEASONS_AND_NUMERIC_STRINGS_USE_REAL_RESOLVER', async () => {
    const h=harness(), p=payload(7);
    p.seasons=Object.fromEntries(p.seasons.map(s=>[String(s.season_number),{...s,season_number:String(s.season_number)}]));
    for(const rows of Object.values(p.episodes))for(const e of rows)e.season=String(e.season);
    h.setResponse(p);
    const result=await h.resolver.resolveSeriesDetails('series:7');
    assert.deepEqual(result.seasons.map(s=>s.seasonNumber),[1,2]);
    assert.deepEqual(result.episodes.map(e=>e.episodeNumber),[1,2,1]);
    assert.equal(result.streams.length,3);
  });
  await test('AUDIT_MAP_SEASONS_PILOT_ZERO_PRESERVED', async () => {
    const h=harness(), p=payload(7);
    p.seasons=Object.fromEntries(p.seasons.map(s=>[String(s.season_number),s]));
    p.episodes[1].push({id:704,episode_num:0,season:'1',title:'Synthetic pilot',container_extension:'mp4'});
    h.setResponse(p);
    const result=await h.resolver.resolveSeriesDetails('series:7');
    assert.deepEqual(result.episodes.filter(e=>e.seasonId==='series:7:s1').map(e=>e.episodeNumber),[0,1,2]);
  });
  await test('AUDIT_MAP_MISSING_EXPLICIT_SEASON_NUMBER_REJECTED', async () => {
    const h=harness(), p=payload(7);
    p.seasons={'1':{name:'Missing ordinal'},'2':{season_number:2}};
    h.setResponse(p);
    await assert.rejects(h.resolver.resolveSeriesDetails('series:7'),/DIRECTORY_SERIES_DETAILS_INVALID/);
  });
`;
const needle='} finally { globalThis.fetch = previousFetch; }';
if(source.split(needle).length!==2)throw Error('UNEXPECTED_HARNESS_LAYOUT');
source=source.replace(needle,extra+'\n'+needle);
fs.writeFileSync(new URL('./map-seasons-probe.mjs',import.meta.url),source,{flag:'wx'});
