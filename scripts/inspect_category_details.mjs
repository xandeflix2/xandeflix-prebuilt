import { execSync } from 'child_process';
const adb = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const catStr = execSync(adb + ' -s G071CQ070344374G shell run-as com.xandeflix.prebuilt cat files/prebuilt/snapshots/snap-muje31lb/catalog.json').toString();
const catalog = JSON.parse(catStr);
console.log('categories length:', catalog.categories.length);
console.log('sample category:', catalog.categories[0]);
console.log('unique contentKinds combos:', new Set(catalog.categories.map(c => JSON.stringify(c.contentKinds))));
console.log('extensions:', catalog.extensions);
