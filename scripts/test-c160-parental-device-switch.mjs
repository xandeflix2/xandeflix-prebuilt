import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { ParentalControlStore, parentalControl } from '../src/parental/parental-control.store.ts';
import { parentalStorage } from '../src/parental/parental-storage.ts';
import { parentalContentKey, parentalLiveKey, canShowParentalItem, canShowParentalLive, parentalLiveCatalog } from '../src/parental/parental-content.ts';
import { authorizeParentalItem, authorizeParentalLive, parentalLiveNeedsPin } from '../src/parental/parental-access.ts';

let tests = 0;
const test = async (name, run) => { await run(); tests++; console.log('PASS ' + name); };
const until = async predicate => { const end = Date.now() + 5000; while (!predicate()) { assert.ok(Date.now() < end, 'ASYNC_CONDITION_TIMEOUT'); await new Promise(r => setTimeout(r, 5)); } };
const pin = '135790', puk = 'Synthetic-C160-PUK-Only';
const fixture = initial => { let raw = initial ?? null; const store = new ParentalControlStore({ crypto: () => webcrypto, storage: { read: async () => raw, write: async value => { raw = value; } } }); return { store, get raw() { return raw; } }; };
const local = fixture();
await local.store.configure(pin, puk, { maxAge: 12, allowAdult: true });
const original = JSON.parse(local.raw);

await test('LEGACY_RECORD_STAYS_ENABLED_INVALID_FLAG_FAILS_CLOSED', async () => {
  assert.equal(original.enabled, undefined);
  const legacy = fixture(local.raw); await legacy.store.load(); assert.equal(legacy.store.getSnapshot().enabled, true);
  for (const enabled of [null, 'false', 0, {}]) { const f = fixture(JSON.stringify({ ...original, enabled })); await f.store.load(); assert.equal(f.store.getSnapshot().status, 'error'); await assert.rejects(f.store.setEnabled(false), /STORAGE_UNAVAILABLE/); }
});
await test('SWITCH_REQUIRES_CURRENT_ADMIN_AND_PRESERVES_PIN_PUK_POLICY_RULES', async () => {
  local.store.closeAdministration(); await assert.rejects(local.store.setEnabled(false), /PIN_REQUIRED/);
  assert.equal(await local.store.authenticate(pin), true);
  const before = JSON.parse(local.raw), revision = local.store.getSnapshot().contentRevision;
  await local.store.setEnabled(false); const after = JSON.parse(local.raw);
  assert.deepEqual(after, { ...before, enabled: false }); assert.equal(local.store.getSnapshot().admin, false);
  assert.ok(local.store.getSnapshot().contentRevision > revision); assert.ok(!local.raw.includes(pin) && !local.raw.includes(puk));
});
await test('DISABLED_SURVIVES_RESTART_COMMON_VOD_BYPASSES_AGE_AND_ALWAYS_PIN', async () => {
  const f = fixture(local.raw); await f.store.load(); assert.equal(f.store.getSnapshot().enabled, false);
  assert.equal(await f.store.authorize('fixture:unrated', undefined, false, true), true);
  assert.equal(await f.store.authorize('fixture:age18', 18, false, true), true); assert.equal(f.store.getSnapshot().prompt, null);
});
await test('REENABLE_RESTORES_SAME_POLICY_AND_INVALIDATES_GRANTS', async () => {
  assert.equal(await local.store.authenticate(pin), true); await local.store.setEnabled(true);
  assert.deepEqual(local.store.getSnapshot().policy, original.policy); assert.equal(await local.store.authorize('age18', 18, false), false);
  const stop = local.store.subscribe(() => {}), pending = local.store.authorize('unknown', undefined, false);
  await until(() => local.store.getSnapshot().prompt); local.store.cancelPrompt(); assert.equal(await pending, false); stop();
});
await test('FAILED_SWITCH_WRITE_FAILS_CLOSED_WITHOUT_ERASING_RECORD', async () => {
  let raw = null, fail = false;
  const store = new ParentalControlStore({ crypto: () => webcrypto, storage: { read: async () => raw, write: async value => { if (fail) throw Error('synthetic'); raw = value; } } });
  await store.configure(pin, puk, { maxAge: 12, allowAdult: true }); const before = raw; fail = true;
  await assert.rejects(store.setEnabled(false), /STORAGE_UNAVAILABLE/); assert.equal(raw, before); assert.equal(store.getSnapshot().status, 'error');
  await assert.rejects(store.authorize('common', undefined, false), /STORAGE_UNAVAILABLE/); store.lock();
});
await test('DISABLING_DOES_NOT_RESET_FAILURES_OR_BYPASS_COOLDOWN', async () => {
  const f = fixture(); await f.store.configure(pin, puk, { maxAge: 12, allowAdult: true });
  await f.store.setEnabled(false); for (let i = 0; i < 5; i++) assert.equal(await f.store.authenticate('000001'), false);
  await assert.rejects(f.store.authenticate('000001'), /COOLDOWN/); const record = JSON.parse(f.raw);
  assert.equal(record.enabled, false); assert.equal(record.failures, 6); assert.ok(record.pinBlock);
  await assert.rejects(f.store.setEnabled(true), /PIN_REQUIRED/); await assert.rejects(f.store.authenticate(pin), /COOLDOWN/);
  assert.deepEqual(JSON.parse(f.raw).pin, record.pin); assert.deepEqual(JSON.parse(f.raw).puk, record.puk); f.store.lock();
});

let raw = null;
parentalStorage.read = async () => raw;
parentalStorage.write = async value => { raw = value; };
await parentalControl.configure(pin, puk, { maxAge: 12, allowAdult: true });
const stop = parentalControl.subscribe(() => {});
const common = [undefined, 0, 12, 18].map((age, n) => ({ id: 'public:' + n, name: 'Public ' + n, groupId: 'g', groupName: 'Abertos', metadata: age === undefined ? {} : { age_rating: age }, streamRef: {} }));
const adult = { id: 'adult:1', name: 'Private channel', groupId: 'a', groupName: 'Adultos', metadata: {}, streamRef: {} };
const otherAdult = { ...adult, id: 'adult:2', name: 'Other private channel' };
const channels = [...common, adult, otherAdult];
const catalog = { snapshotId: 'synthetic-c160', groups: [{ id: 'g', name: 'Abertos' }, { id: 'a', name: 'Adultos' }], channels, channelsByGroup: { g: common, a: [adult, otherAdult] } };
const scoped = channel => catalog.snapshotId + ':' + parentalLiveKey(channel);
await test('COMMON_LIVE_VISIBLE_AND_NO_PIN_WITH_AGE_UNKNOWN_18_OR_MANUAL_ALWAYS_PIN', async () => {
  const before = JSON.stringify(catalog);
  await parentalControl.setRule({ key: parentalLiveKey(common[0]), minAge: 18, alwaysPin: true, adult: false });
  for (const channel of common) { assert.equal(canShowParentalLive(channel, catalog), true); assert.equal(parentalLiveNeedsPin(channel, catalog), false); assert.equal(await authorizeParentalLive(channel, catalog), true); }
  assert.equal(parentalControl.getSnapshot().prompt, null); assert.equal(JSON.stringify(catalog), before);
  assert.deepEqual(parentalLiveCatalog(catalog).channels.map(c => c.id), common.map(c => c.id));
});
await test('INELIGIBLE_ADULT_REMAINS_CLOSED_WITHOUT_FAKE_PIN_OR_SESSION', async () => {
  await assert.rejects(authorizeParentalLive(adult, catalog), /ADULT_AGE_LIMIT/);
  assert.equal(canShowParentalLive(adult, catalog), false); assert.equal(parentalControl.getSnapshot().prompt, null);
  await parentalControl.updatePolicy({ maxAge: 18, allowAdult: false });
  await assert.rejects(authorizeParentalLive(adult, catalog), /ADULT_DISABLED/);
  await parentalControl.updatePolicy({ maxAge: 18, allowAdult: true }); parentalControl.lock();
});
await test('ELIGIBLE_ADULT_DIRECT_SELECTION_PROMPTS_AND_WRONG_PIN_NEVER_GRANTS', async () => {
  assert.equal(parentalLiveNeedsPin(adult, catalog), true);
  const pending = authorizeParentalLive(adult, catalog); await until(() => parentalControl.getSnapshot().prompt);
  const id = parentalControl.getSnapshot().prompt.id;
  assert.equal(parentalControl.adultVisible(), false); assert.equal(parentalControl.isGranted(scoped(adult)), false);
  assert.equal(await parentalControl.submitPrompt(id, '000001'), false); assert.ok(parentalControl.getSnapshot().prompt);
  assert.equal(await parentalControl.submitPrompt(id, pin), true); assert.equal(await pending, true);
  assert.equal(parentalControl.adultVisible(), true); assert.equal(parentalControl.isGranted(scoped(adult)), true);
  assert.equal(parentalControl.isGranted(scoped(otherAdult)), false); assert.equal(parentalLiveNeedsPin(adult, catalog), false);
});
await test('OTHER_ADULT_CANCEL_AND_CATEGORY_UNLOCK_NEVER_GRANT_ALL_CHANNELS', async () => {
  const pending = authorizeParentalLive(otherAdult, catalog); await until(() => parentalControl.getSnapshot().prompt);
  parentalControl.cancelPrompt(); assert.equal(await pending, false); assert.equal(parentalControl.isGranted(scoped(otherAdult)), false);
  parentalControl.lock(); const group = parentalControl.requestAdultSession(); await until(() => parentalControl.getSnapshot().prompt);
  await parentalControl.submitPrompt(parentalControl.getSnapshot().prompt.id, pin); assert.equal(await group, true);
  assert.equal(parentalControl.isGranted(scoped(adult)), false); assert.equal(parentalControl.isGranted(scoped(otherAdult)), false);
});
await test('LOCK_DURING_PIN_KDF_CANCELS_PENDING_ADULT_SELECTION', async () => {
  parentalControl.lock(); const pending = authorizeParentalLive(adult, catalog); await until(() => parentalControl.getSnapshot().prompt);
  const verifying = parentalControl.submitPrompt(parentalControl.getSnapshot().prompt.id, pin);
  await until(() => parentalControl.getSnapshot().busy); parentalControl.lock();
  assert.equal(await verifying, false); assert.equal(await pending, false); assert.equal(parentalControl.adultVisible(), false); assert.equal(parentalControl.isGranted(scoped(adult)), false);
});
await test('DISABLED_VOD_VISIBLE_WITH_RULES_PRESERVED_ADULT_STILL_NEEDS_PIN', async () => {
  assert.equal(await parentalControl.authenticate(pin), true); await parentalControl.updatePolicy({ maxAge: 12, allowAdult: true });
  const key = parentalContentKey('movie', 'Synthetic public title');
  await parentalControl.setRule({ key, minAge: 18, alwaysPin: true, adult: false });
  const card = { kind: 'movie', title: 'Synthetic public title', categoryLabels: [], genreLabels: [], externalIds: {}, parental: { key, age: 18, adult: false } };
  assert.equal(canShowParentalItem(card), false); const before = JSON.parse(raw);
  await parentalControl.setEnabled(false); assert.equal(canShowParentalItem(card), true);
  assert.equal(await authorizeParentalItem(card, 'vod'), true); assert.deepEqual(JSON.parse(raw), { ...before, enabled: false });
  assert.equal(canShowParentalItem({ ...card, parental: { ...card.parental, adult: true } }), false);
  await assert.rejects(authorizeParentalLive(adult, catalog), /ADULT_AGE_LIMIT/);
  assert.equal(await parentalControl.authenticate(pin), true); await parentalControl.updatePolicy({ maxAge: 18, allowAdult: true });
  const pending = authorizeParentalLive(adult, catalog); await until(() => parentalControl.getSnapshot().prompt);
  parentalControl.cancelPrompt(); assert.equal(await pending, false); assert.equal(parentalControl.adultVisible(), false);
  assert.equal(await authorizeParentalLive(common[0], catalog), true);
});
stop(); parentalControl.lock(); local.store.lock();
console.log(`C160_PARENTAL_DEVICE_SWITCH=${tests}/${tests}_PASS`);
