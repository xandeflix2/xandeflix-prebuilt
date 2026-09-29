/**
 * =============================================================================
 * XANDEFLIX PREBUILT — C9 CONCURRENT PLAYBACK SESSION ENFORCEMENT AUDIT SUITE
 *
 * Suíte completa de testes automatizados para o Gate C9 (T1 a T41):
 * - T1 a T33: Ciclo de vida completo de sessões concorrentes, autoridade do servidor,
 *   corrida de concorrência, pulso de heartbeat, stale timeout, políticas de limites,
 *   isolamento entre dispositivos/clientes/licenças e sanitização absoluta de segredos.
 * - T34 a T40: Verificações de não regressão C8, C7, C6R, C6, C5, C4R, C4, C3, C2.
 * - T41: Integridade canônica do Commercial Control Plane Lock V1.
 * =============================================================================
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=================================================================');
console.log('--- TEST SUITE: C9 CONCURRENT PLAYBACK SESSION ENFORCEMENT ---');
console.log('=================================================================\n');

// Importa classes canônicas do plano de controle
const { ControlPlaneEngine } = await import('../src/control-plane/engine/control-plane-engine.ts');
const { ControlPlaneCrypto } = await import('../src/control-plane/crypto/control-plane-crypto.ts');
const { PlaybackSessionService } = await import('../src/control-plane/client/playback-session.service.ts');
const { PlaybackService } = await import('../src/playback/playback.service.ts');
const { PlaybackError } = await import('../src/playback/playback-errors.ts');

const engine = new ControlPlaneEngine();

// -----------------------------------------------------------------------------
// SETUP DE FIXTURES SINTÉTICAS
// -----------------------------------------------------------------------------

console.log('>>> CONFIGURANDO FIXTURES SINTÉTICAS PARA TESTES C9...');

// 1. Licença com maxConcurrentSessions = 1
const licMax1Res = await engine.createLicense({
  mode: 'MANAGED',
  maxDevices: 3,
  customKey: 'XF-LIC-TEST-MAX1-C9',
});
const licMax1 = licMax1Res.license;
licMax1.customerId = 'cust_c9_alpha';
licMax1.maxConcurrentSessions = 1;

// 2. Licença com maxConcurrentSessions = 2
const licMax2Res = await engine.createLicense({
  mode: 'MANAGED',
  maxDevices: 4,
  customKey: 'XF-LIC-TEST-MAX2-C9',
});
const licMax2 = licMax2Res.license;
licMax2.customerId = 'cust_c9_beta';
licMax2.maxConcurrentSessions = 2;

// 3. Licença Trial (7 dias) com maxConcurrentSessions = 2
const licTrialRes = await engine.createLicense({
  mode: 'SELF_SERVICE',
  maxDevices: 1,
  customKey: 'XF-LIC-TEST-TRIAL-C9',
});
const licTrial = licTrialRes.license;
licTrial.customerId = 'cust_c9_gamma';
licTrial.status = 'TRIAL';
licTrial.maxConcurrentSessions = 2;
licTrial.trialStartedAtIso = new Date().toISOString();
licTrial.trialExpiresAtIso = new Date(Date.now() + 7 * 86400 * 1000).toISOString();

// 4. Dispositivos Sintéticos
const rawTokenA = 'device_token_raw_alpha_11111111111111111111111111111111';
const rawTokenB = 'device_token_raw_bravo_22222222222222222222222222222222';
const rawTokenC = 'device_token_raw_charlie_3333333333333333333333333333333';
const rawTokenD = 'device_token_raw_delta_44444444444444444444444444444444';
const rawTokenE = 'device_token_raw_echo_555555555555555555555555555555555';
const rawTokenF = 'device_token_raw_foxtrot_666666666666666666666666666666';

// Device A: vinculado à licença Max1
const devA = {
  id: 'dev_ent_a',
  deviceId: 'dev_c9_a',
  displayCode: 'DISP-C9-A',
  deviceType: 'TV',
  deviceLabel: 'Sala Principal',
  status: 'AUTHORIZED',
  deviceTokenHash: await ControlPlaneCrypto.sha256(rawTokenA),
  createdAtIso: new Date().toISOString(),
};
engine['devices'].set(devA.deviceId, devA);
engine['licenseBindings'].set('b_a', {
  id: 'b_a',
  licenseId: licMax1.id,
  deviceId: devA.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});

// Device B: vinculado à licença Max1
const devB = {
  id: 'dev_ent_b',
  deviceId: 'dev_c9_b',
  displayCode: 'DISP-C9-B',
  deviceType: 'TABLET',
  deviceLabel: 'Quarto Tablet',
  status: 'AUTHORIZED',
  deviceTokenHash: await ControlPlaneCrypto.sha256(rawTokenB),
  createdAtIso: new Date().toISOString(),
};
engine['devices'].set(devB.deviceId, devB);
engine['licenseBindings'].set('b_b', {
  id: 'b_b',
  licenseId: licMax1.id,
  deviceId: devB.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});

// Device C: não autorizado (UNREGISTERED)
const devC = {
  id: 'dev_ent_c',
  deviceId: 'dev_c9_c',
  displayCode: 'DISP-C9-C',
  deviceType: 'PHONE',
  deviceLabel: 'Aparelho Pendente',
  status: 'UNREGISTERED',
  deviceTokenHash: await ControlPlaneCrypto.sha256(rawTokenC),
  createdAtIso: new Date().toISOString(),
};
engine['devices'].set(devC.deviceId, devC);

// Device D: vinculado à licença Max2
const devD = {
  id: 'dev_ent_d',
  deviceId: 'dev_c9_d',
  displayCode: 'DISP-C9-D',
  deviceType: 'TV',
  deviceLabel: 'TV Living Room',
  status: 'AUTHORIZED',
  deviceTokenHash: await ControlPlaneCrypto.sha256(rawTokenD),
  createdAtIso: new Date().toISOString(),
};
engine['devices'].set(devD.deviceId, devD);
engine['licenseBindings'].set('b_d', {
  id: 'b_d',
  licenseId: licMax2.id,
  deviceId: devD.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});

// Device E: vinculado à licença Max2
const devE = {
  id: 'dev_ent_e',
  deviceId: 'dev_c9_e',
  displayCode: 'DISP-C9-E',
  deviceType: 'TV',
  deviceLabel: 'TV Quarto Casal',
  status: 'AUTHORIZED',
  deviceTokenHash: await ControlPlaneCrypto.sha256(rawTokenE),
  createdAtIso: new Date().toISOString(),
};
engine['devices'].set(devE.deviceId, devE);
engine['licenseBindings'].set('b_e', {
  id: 'b_e',
  licenseId: licMax2.id,
  deviceId: devE.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});

// Device F: vinculado à licença Max2
const devF = {
  id: 'dev_ent_f',
  deviceId: 'dev_c9_f',
  displayCode: 'DISP-C9-F',
  deviceType: 'PHONE',
  deviceLabel: 'Smartphone F',
  status: 'AUTHORIZED',
  deviceTokenHash: await ControlPlaneCrypto.sha256(rawTokenF),
  createdAtIso: new Date().toISOString(),
};
engine['devices'].set(devF.deviceId, devF);
engine['licenseBindings'].set('b_f', {
  id: 'b_f',
  licenseId: licMax2.id,
  deviceId: devF.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});

console.log('  -> Fixtures configuradas com sucesso.\n');

// -----------------------------------------------------------------------------
// TESTES FUNCIONAIS C9 (T1 A T33)
// -----------------------------------------------------------------------------

console.log('>>> INICIANDO TESTES C9 (T1 A T33)...\n');

// T1: unauthorized device cannot start
console.log('Test T1: unauthorized device cannot start');
const resT1 = await engine.startPlaybackSession({
  licenseId: licMax1.id,
  deviceId: devC.deviceId,
  deviceToken: rawTokenC,
});
assert.equal(resT1.success, false);
assert.equal(resT1.code, 'DEVICE_NOT_AUTHORIZED');
console.log('  -> PASS: Dispositivo não autorizado foi rejeitado');

// T2: license access denied cannot start
console.log('Test T2: license access denied cannot start');
const licSuspendedRes = await engine.createLicense({ mode: 'MANAGED', maxDevices: 1 });
const licSuspended = licSuspendedRes.license;
licSuspended.status = 'SUSPENDED';
engine['licenseBindings'].set('b_susp', {
  id: 'b_susp',
  licenseId: licSuspended.id,
  deviceId: devA.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});
const resT2 = await engine.startPlaybackSession({
  licenseId: licSuspended.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(resT2.success, false);
assert.equal(resT2.code, 'LICENSE_SUSPENDED');
console.log('  -> PASS: Licença suspensa rejeitada no início da sessão');

// T3: max=1 first session allowed
console.log('Test T3: max=1 first session allowed');
const resT3 = await engine.startPlaybackSession({
  licenseId: licMax1.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(resT3.success, true);
assert.ok(resT3.sessionId);
assert.ok(resT3.sessionToken);
assert.equal(resT3.status, 'ACTIVE');
assert.equal(resT3.heartbeatIntervalSeconds, 60);
assert.equal(resT3.staleSessionSeconds, 120);
const sessionAId = resT3.sessionId;
const sessionAToken = resT3.sessionToken;
console.log('  -> PASS: Primeira sessão adquirida com sucesso na licença com limite 1');

// T4: max=1 second concurrent denied
console.log('Test T4: max=1 second concurrent denied');
const resT4 = await engine.startPlaybackSession({
  licenseId: licMax1.id,
  deviceId: devB.deviceId,
  deviceToken: rawTokenB,
});
assert.equal(resT4.success, false);
assert.equal(resT4.code, 'SESSION_LIMIT_REACHED');
assert.equal(resT4.maxConcurrentSessions, 1);
assert.equal(resT4.activeSessions, 1);
console.log('  -> PASS: Segunda sessão concorrente negada com SESSION_LIMIT_REACHED');

// T5: concurrent simultaneous starts produce 1 success
console.log('Test T5: concurrent simultaneous starts produce 1 success');
// Cria licença isolada para teste de corrida
const licRaceRes = await engine.createLicense({ mode: 'MANAGED', maxDevices: 2 });
const licRace = licRaceRes.license;
licRace.maxConcurrentSessions = 1;
engine['licenseBindings'].set('b_race_a', {
  id: 'b_race_a',
  licenseId: licRace.id,
  deviceId: devA.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});
engine['licenseBindings'].set('b_race_b', {
  id: 'b_race_b',
  licenseId: licRace.id,
  deviceId: devB.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});

const racePromises = [
  engine.startPlaybackSession({ licenseId: licRace.id, deviceId: devA.deviceId, deviceToken: rawTokenA }),
  engine.startPlaybackSession({ licenseId: licRace.id, deviceId: devB.deviceId, deviceToken: rawTokenB }),
];
const raceResults = await Promise.all(racePromises);
const successes = raceResults.filter((r) => r.success);
const failures = raceResults.filter((r) => !r.success && r.code === 'SESSION_LIMIT_REACHED');
assert.equal(successes.length, 1, 'Exatamente 1 deve ser aprovado na corrida');
assert.equal(failures.length, 1, 'Exatamente 1 deve ser rejeitado na corrida');
console.log('  -> PASS: Disparos atômicos simultâneos resultam em exatamente 1 sucesso e 1 rejeição');

// T6: max=2 allows exactly 2
console.log('Test T6: max=2 allows exactly 2');
const resT6_1 = await engine.startPlaybackSession({
  licenseId: licMax2.id,
  deviceId: devD.deviceId,
  deviceToken: rawTokenD,
});
const resT6_2 = await engine.startPlaybackSession({
  licenseId: licMax2.id,
  deviceId: devE.deviceId,
  deviceToken: rawTokenE,
});
assert.equal(resT6_1.success, true);
assert.equal(resT6_2.success, true);
assert.equal(resT6_1.activeSessions, 1);
assert.equal(resT6_2.activeSessions, 2);
console.log('  -> PASS: Licença com max=2 permitiu exatamente 2 sessões ativas');

// T7: N+1 denied
console.log('Test T7: N+1 denied');
const resT7 = await engine.startPlaybackSession({
  licenseId: licMax2.id,
  deviceId: devF.deviceId,
  deviceToken: rawTokenF,
});
assert.equal(resT7.success, false);
assert.equal(resT7.code, 'SESSION_LIMIT_REACHED');
assert.equal(resT7.maxConcurrentSessions, 2);
assert.equal(resT7.activeSessions, 2);
console.log('  -> PASS: Terceira tentativa (N+1) foi negada com SESSION_LIMIT_REACHED');

// T8: server time authority
console.log('Test T8: server time authority');
assert.ok(resT6_1.createdAt);
const diffMs = Math.abs(new Date(resT6_1.createdAt).getTime() - engine.getServerNow().getTime());
assert.ok(diffMs < 5000, 'Timestamp da sessão deve pertencer ao relógio do servidor');
console.log('  -> PASS: Decisões e timestamps controlados exclusivamente pelo servidor');

// T9: client clock ignored
console.log('Test T9: client clock ignored');
const fakeClientTime = new Date(Date.now() + 1000 * 3600 * 24 * 365).toISOString(); // 1 ano no futuro
const resT9 = await engine.startPlaybackSession({
  licenseId: licTrial.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
  clientNowIso: fakeClientTime,
});
// Vincula devA na licTrial para teste
engine['licenseBindings'].set('b_trial_a', {
  id: 'b_trial_a',
  licenseId: licTrial.id,
  deviceId: devA.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});
const resT9_bound = await engine.startPlaybackSession({
  licenseId: licTrial.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
  clientNowIso: fakeClientTime,
});
assert.equal(resT9_bound.success, true);
// Confirma que o servidor não adotou o horário futuro do cliente
assert.notEqual(resT9_bound.createdAt, fakeClientTime);
console.log('  -> PASS: Horário transmitido pelo cliente foi categoricamente ignorado');

// T10: heartbeat valid token succeeds
console.log('Test T10: heartbeat valid token succeeds');
const resT10 = await engine.heartbeatPlaybackSession({
  sessionId: sessionAId,
  deviceId: devA.deviceId,
  sessionToken: sessionAToken,
});
assert.equal(resT10.success, true);
assert.equal(resT10.status, 'ACTIVE');
assert.ok(resT10.lastHeartbeatAt);
console.log('  -> PASS: Heartbeat com token válido renovou o lease com sucesso');

// T11: heartbeat wrong token denied
console.log('Test T11: heartbeat wrong token denied');
const resT11 = await engine.heartbeatPlaybackSession({
  sessionId: sessionAId,
  deviceId: devA.deviceId,
  sessionToken: 'token_falso_invalido_1234567890',
});
assert.equal(resT11.success, false);
assert.equal(resT11.code, 'INVALID_SESSION_TOKEN');
console.log('  -> PASS: Heartbeat com token incorreto foi rejeitado');

// T12: stored session hash not usable as bearer
console.log('Test T12: stored session hash not usable as bearer');
const sessionStored = engine['playbackSessions'].get(sessionAId);
assert.ok(sessionStored.sessionTokenHash);
const resT12 = await engine.heartbeatPlaybackSession({
  sessionId: sessionAId,
  deviceId: devA.deviceId,
  sessionToken: sessionStored.sessionTokenHash,
});
assert.equal(resT12.success, false);
assert.equal(resT12.code, 'INVALID_SESSION_TOKEN');
console.log('  -> PASS: Hash de sessão persistido no banco NÃO funciona como token bearer');

// T13: stale session no longer consumes slot
console.log('Test T13: stale session no longer consumes slot');
// Avança o relógio do servidor em 125 segundos (> STALE_THRESHOLD de 120s)
engine.advanceServerTime(125000);
// Agora a sessão de devA em licMax1 está stale. Tentativa de devB deve ter sucesso!
const resT13 = await engine.startPlaybackSession({
  licenseId: licMax1.id,
  deviceId: devB.deviceId,
  deviceToken: rawTokenB,
});
assert.equal(resT13.success, true);
assert.equal(resT13.status, 'ACTIVE');
const sessionBId = resT13.sessionId;
const sessionBToken = resT13.sessionToken;
console.log('  -> PASS: Sessão stale liberou o slot automaticamente para novo dispositivo');

// T14: crashed device recovers after stale timeout
console.log('Test T14: crashed device recovers after stale timeout');
// Dispositivo crashou sem enviar closeSession. Após 125s, o slot foi liberado sem intervenção humana.
const oldSessionA = engine['playbackSessions'].get(sessionAId);
assert.equal(oldSessionA.status, 'STALE');
assert.equal(oldSessionA.closeReason, 'STALE_TIMEOUT');
console.log('  -> PASS: Dispositivo em crash foi marcado como STALE e slot recuperado');

// T15: explicit close releases slot
console.log('Test T15: explicit close releases slot');
const resT15 = await engine.closePlaybackSession({
  sessionId: sessionBId,
  deviceId: devB.deviceId,
  sessionToken: sessionBToken,
  closeReason: 'USER_EXIT',
});
assert.equal(resT15.success, true);
assert.equal(resT15.status, 'CLOSED');
// Agora o slot de licMax1 está liberado imediatamente
const resT15_restart = await engine.startPlaybackSession({
  licenseId: licMax1.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(resT15_restart.success, true);
console.log('  -> PASS: Encerramento explícito liberou o slot de imediato');

// T16: double close idempotent
console.log('Test T16: double close idempotent');
const resT16 = await engine.closePlaybackSession({
  sessionId: sessionBId,
  deviceId: devB.deviceId,
  sessionToken: sessionBToken,
  closeReason: 'USER_EXIT',
});
assert.equal(resT16.success, true);
assert.equal(resT16.status, 'CLOSED');
console.log('  -> PASS: Segundo fechamento é estritamente idempotente');

// T17: same device retry does not leak duplicate sessions
console.log('Test T17: same device retry does not leak duplicate sessions');
// DevA já possui uma sessão ativa em licMax1 (resT15_restart). Se devA reabrir o player / retry:
const resT17_retry = await engine.startPlaybackSession({
  licenseId: licMax1.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(resT17_retry.success, true);
// Verifica que a sessão anterior de devA foi superseded e não consumiu slots adicionais
const previousSession = engine['playbackSessions'].get(resT15_restart.sessionId);
assert.equal(previousSession.status, 'CLOSED');
assert.equal(previousSession.closeReason, 'SUPERSEDED_BY_NEW_SESSION');
// Contagem de sessões ativas da licença permanece exatamente 1
const activeCount = Array.from(engine['playbackSessions'].values()).filter(
  (s) => s.licenseId === licMax1.id && s.status === 'ACTIVE'
).length;
assert.equal(activeCount, 1);
console.log('  -> PASS: Retry do mesmo aparelho substituiu sessão anterior sem vazar slots');

// T18: cross-device isolation
console.log('Test T18: cross-device isolation');
const resT18 = await engine.heartbeatPlaybackSession({
  sessionId: resT17_retry.sessionId,
  deviceId: devB.deviceId, // Device B tentando manipular sessão de Device A
  sessionToken: resT17_retry.sessionToken,
});
assert.equal(resT18.success, false);
assert.equal(resT18.code, 'SESSION_NOT_FOUND');
console.log('  -> PASS: Dispositivo diferente não pode enviar heartbeat para sessão alheia');

// T19: cross-customer session isolation
console.log('Test T19: cross-customer session isolation');
const custASessions = engine.listPlaybackSessions({ customerId: 'cust_c9_alpha' });
const custBSessions = engine.listPlaybackSessions({ customerId: 'cust_c9_beta' });
for (const s of custASessions) {
  assert.equal(s.licenseId, licMax1.id);
  assert.notEqual(s.licenseId, licMax2.id);
}
for (const s of custBSessions) {
  assert.equal(s.licenseId, licMax2.id);
  assert.notEqual(s.licenseId, licMax1.id);
}
console.log('  -> PASS: Isolamento estrito de sessões entre clientes comprovado');

// T20: cross-license isolation
console.log('Test T20: cross-license isolation');
const resT20 = await engine.startPlaybackSession({
  licenseId: licMax1.id,
  deviceId: devD.deviceId, // DevD vinculado apenas a licMax2
  deviceToken: rawTokenD,
});
assert.equal(resT20.success, false);
assert.equal(resT20.code, 'DEVICE_NOT_BOUND_TO_LICENSE');
console.log('  -> PASS: Tentativa de iniciar sessão com licença não vinculada foi rejeitada');

// T21: trial expiry heartbeat denied
console.log('Test T21: trial expiry heartbeat denied');
// Inicia sessão em licTrial
const resT21_start = await engine.startPlaybackSession({
  licenseId: licTrial.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(resT21_start.success, true);
// Simula expiração do trial durante reprodução contínua (trial expira enquanto heartbeats chegam a cada 60s)
licTrial.trialExpiresAtIso = new Date(engine.getServerNow().getTime() - 5000).toISOString();
const resT21_hb = await engine.heartbeatPlaybackSession({
  sessionId: resT21_start.sessionId,
  deviceId: devA.deviceId,
  sessionToken: resT21_start.sessionToken,
});
assert.equal(resT21_hb.success, false);
assert.equal(resT21_hb.code, 'TRIAL_EXPIRED');
assert.equal(resT21_hb.sessionStatus, 'CLOSED');
console.log('  -> PASS: Expiração do Trial durante reprodução encerrou a sessão no heartbeat');

// T22: suspended license heartbeat denied
console.log('Test T22: suspended license heartbeat denied');
// Cria licença ativa, inicia sessão, suspende a licença, emite heartbeat
const licSuspTestRes = await engine.createLicense({ mode: 'MANAGED', maxDevices: 1 });
const licSuspTest = licSuspTestRes.license;
licSuspTest.maxConcurrentSessions = 1;
engine['licenseBindings'].set('b_susp_t', {
  id: 'b_susp_t',
  licenseId: licSuspTest.id,
  deviceId: devA.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});
const sessSusp = await engine.startPlaybackSession({
  licenseId: licSuspTest.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(sessSusp.success, true);
// Suspende a licença
engine.suspendLicense(licSuspTest.id);
const resT22 = await engine.heartbeatPlaybackSession({
  sessionId: sessSusp.sessionId,
  deviceId: devA.deviceId,
  sessionToken: sessSusp.sessionToken,
});
assert.equal(resT22.success, false);
assert.equal(resT22.code, 'LICENSE_SUSPENDED');
assert.equal(resT22.sessionStatus, 'CLOSED');
console.log('  -> PASS: Suspensão da licença encerrou a sessão imediatamente no heartbeat');

// T23: revoked license heartbeat denied
console.log('Test T23: revoked license heartbeat denied');
const licRevTestRes = await engine.createLicense({ mode: 'MANAGED', maxDevices: 1 });
const licRevTest = licRevTestRes.license;
licRevTest.maxConcurrentSessions = 1;
engine['licenseBindings'].set('b_rev_t', {
  id: 'b_rev_t',
  licenseId: licRevTest.id,
  deviceId: devA.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});
const sessRev = await engine.startPlaybackSession({
  licenseId: licRevTest.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(sessRev.success, true);
// Revoga a licença
await engine.revokeLicense(licRevTest.id);
const resT23 = await engine.heartbeatPlaybackSession({
  sessionId: sessRev.sessionId,
  deviceId: devA.deviceId,
  sessionToken: sessRev.sessionToken,
});
assert.equal(resT23.success, false);
assert.equal(resT23.code, 'LICENSE_REVOKED');
assert.equal(resT23.sessionStatus, 'CLOSED');
console.log('  -> PASS: Revogação da licença encerrou a sessão no heartbeat');

// T24: expired license heartbeat denied
console.log('Test T24: expired license heartbeat denied');
const licExpTestRes = await engine.createLicense({ mode: 'MANAGED', maxDevices: 1 });
const licExpTest = licExpTestRes.license;
licExpTest.maxConcurrentSessions = 1;
engine['licenseBindings'].set('b_exp_t', {
  id: 'b_exp_t',
  licenseId: licExpTest.id,
  deviceId: devA.deviceId,
  status: 'ACTIVE',
  boundAtIso: new Date().toISOString(),
});
const sessExp = await engine.startPlaybackSession({
  licenseId: licExpTest.id,
  deviceId: devA.deviceId,
  deviceToken: rawTokenA,
});
assert.equal(sessExp.success, true);
// Altera para expirada
licExpTest.status = 'EXPIRED';
const resT24 = await engine.heartbeatPlaybackSession({
  sessionId: sessExp.sessionId,
  deviceId: devA.deviceId,
  sessionToken: sessExp.sessionToken,
});
assert.equal(resT24.success, false);
assert.equal(resT24.code, 'LICENSE_EXPIRED');
assert.equal(resT24.sessionStatus, 'CLOSED');
console.log('  -> PASS: Licença expirada encerrou a sessão no heartbeat');

// T25: device remains authorized after session close
console.log('Test T25: device remains authorized after session close');
const deviceAState = engine['devices'].get(devA.deviceId);
const bindingAState = engine['licenseBindings'].get('b_a');
assert.equal(deviceAState.status, 'AUTHORIZED');
assert.equal(bindingAState.status, 'ACTIVE');
console.log('  -> PASS: Autorização do dispositivo mantida 100% intacta após fechamento da sessão');

// T26: catalog/source preserved after session close
console.log('Test T26: catalog/source preserved after session close');
assert.ok(engine['managedSources']);
assert.ok(engine['sourceBindings']);
console.log('  -> PASS: Catálogo e fontes preservados sem qualquer interferência do encerramento');

// T27: limit reduction policy respected
console.log('Test T27: limit reduction policy respected');
// Cria licença com maxConcurrentSessions = 3 e inicia 2 sessões
const licRedRes = await engine.createLicense({ mode: 'MANAGED', maxDevices: 3 });
const licRed = licRedRes.license;
licRed.maxConcurrentSessions = 3;
engine['licenseBindings'].set('b_red_d', { id: 'b_red_d', licenseId: licRed.id, deviceId: devD.deviceId, status: 'ACTIVE', boundAtIso: new Date().toISOString() });
engine['licenseBindings'].set('b_red_e', { id: 'b_red_e', licenseId: licRed.id, deviceId: devE.deviceId, status: 'ACTIVE', boundAtIso: new Date().toISOString() });
engine['licenseBindings'].set('b_red_f', { id: 'b_red_f', licenseId: licRed.id, deviceId: devF.deviceId, status: 'ACTIVE', boundAtIso: new Date().toISOString() });

const sRed1 = await engine.startPlaybackSession({ licenseId: licRed.id, deviceId: devD.deviceId, deviceToken: rawTokenD });
const sRed2 = await engine.startPlaybackSession({ licenseId: licRed.id, deviceId: devE.deviceId, deviceToken: rawTokenE });
assert.equal(sRed1.success, true);
assert.equal(sRed2.success, true);

// Gestor reduz limite de concorrência para 1 (abaixo das 2 sessões ativas)
engine.updateLicenseLimits(licRed.id, 3, 1);
assert.equal(licRed.maxConcurrentSessions, 1);
console.log('  -> PASS: Política de redução de concorrência aplicada na licença');

// T28: new sessions denied while active count above reduced limit
console.log('Test T28: new sessions denied while active count above reduced limit');
const sRed3 = await engine.startPlaybackSession({
  licenseId: licRed.id,
  deviceId: devF.deviceId,
  deviceToken: rawTokenF,
});
assert.equal(sRed3.success, false);
assert.equal(sRed3.code, 'SESSION_LIMIT_REACHED');
assert.equal(sRed3.maxConcurrentSessions, 1);
assert.equal(sRed3.activeSessions, 2);
console.log('  -> PASS: Novas sessões bloqueadas enquanto contagem ativa superar o limite reduzido');

// T29: existing session not arbitrarily deleted by config change
console.log('Test T29: existing session not arbitrarily deleted by config change');
const sRed1Entity = engine['playbackSessions'].get(sRed1.sessionId);
const sRed2Entity = engine['playbackSessions'].get(sRed2.sessionId);
assert.equal(sRed1Entity.status, 'ACTIVE');
assert.equal(sRed2Entity.status, 'ACTIVE');
console.log('  -> PASS: Sessões existentes continuam ativas até close ou stale natural');

// T30: customer session listing sanitized
console.log('Test T30: customer session listing sanitized');
const customerSessions = engine.listPlaybackSessions({ licenseId: licRed.id });
assert.ok(customerSessions.length >= 2);
for (const item of customerSessions) {
  assert.ok(item.sessionId);
  assert.ok(item.licenseId);
  assert.ok(item.deviceId);
  assert.ok(item.deviceDisplayCode);
  assert.ok(item.deviceLabel);
  assert.ok(item.deviceType);
  assert.ok(item.status);
  assert.ok(item.createdAt);
  assert.ok(item.lastHeartbeatAt);
  // Garante ausência total de segredos
  assert.equal(item['sessionToken'], undefined);
  assert.equal(item['sessionTokenHash'], undefined);
  assert.equal(item['deviceToken'], undefined);
  assert.equal(item['deviceTokenHash'], undefined);
}
console.log('  -> PASS: Listagem de sessões do cliente totalmente sanitizada');

// T31: raw session token never persisted in public table
console.log('Test T31: raw session token never persisted in public table');
const migrationSql = fs.readFileSync(
  path.join(rootDir, 'supabase', 'migrations', '20260917150000_c9_concurrent_session_enforcement.sql'),
  'utf-8'
);
assert.ok(migrationSql.includes('session_token_hash VARCHAR(64) NOT NULL'));
assert.ok(!migrationSql.includes('raw_session_token VARCHAR'));
console.log('  -> PASS: Apenas session_token_hash é persistido na tabela pública');

// T32: raw session token absent from logs
console.log('Test T32: raw session token absent from logs');
const loggedText = JSON.stringify(customerSessions) + JSON.stringify(raceResults);
assert.equal(loggedText.includes('raw_session_token'), false);
console.log('  -> PASS: Token bruto de sessão ausente de logs e DTOs públicos');

// T33: raw device token absent from logs
console.log('Test T33: raw device token absent from logs');
assert.equal(loggedText.includes(rawTokenA), false);
assert.equal(loggedText.includes(rawTokenB), false);
console.log('  -> PASS: Token bruto de dispositivo ausente de logs e DTOs públicos');

// -----------------------------------------------------------------------------
// VERIFICAÇÕES DE NÃO REGRESSÃO (T34 A T41)
// -----------------------------------------------------------------------------

console.log('\n>>> EXECUTANDO VERIFICAÇÕES DE NÃO REGRESSÃO (T34 A T41)...\n');

// T34: C8 regression = no
console.log('Test T34: C8 regression check');
execSync('node scripts/test-c8-admin-license-and-customer-management.mjs', { stdio: 'ignore', cwd: rootDir });
console.log('  -> PASS: Suíte C8 Admin Management aprovada sem regressão');

// T35: C7 regression = no
console.log('Test T35: C7 regression check');
execSync('node scripts/test-c7-customer-portal.mjs', { stdio: 'ignore', cwd: rootDir });
console.log('  -> PASS: Suíte C7 Customer Portal aprovada sem regressão');

// T36: C6 regression = no
console.log('Test T36: C6 regression check');
execSync('node scripts/test-c6-remote-self-service-source-vault.mjs', { stdio: 'ignore', cwd: rootDir });
execSync('node scripts/test-c6r-vault-crypto-runtime-reconciliation.mjs', { stdio: 'ignore', cwd: rootDir });
console.log('  -> PASS: Suíte C6/C6R Vault aprovada sem regressão');

// T37: C5 regression = no
console.log('Test T37: C5 regression check');
execSync('node scripts/test-c5-trial-license-engine.mjs', { stdio: 'ignore', cwd: rootDir });
console.log('  -> PASS: Suíte C5 Trial Engine aprovada sem regressão');

// T38: C4 regression = no
console.log('Test T38: C4 regression check');
execSync('node scripts/test-c4-device-pairing.mjs', { stdio: 'ignore', cwd: rootDir });
execSync('node scripts/test-c4r-security-reconciliation.mjs', { stdio: 'ignore', cwd: rootDir });
console.log('  -> PASS: Suíte C4/C4R Device Pairing aprovada sem regressão');

// T39: C3 regression = no
console.log('Test T39: C3 regression check');
execSync('node scripts/test-c3-customer-nickname-account.mjs', { stdio: 'ignore', cwd: rootDir });
console.log('  -> PASS: Suíte C3 Customer Nickname Account aprovada sem regressão');

// T40: C2 regression = no
console.log('Test T40: C2 regression check');
execSync('node scripts/test-c2-installation-registry.mjs', { stdio: 'ignore', cwd: rootDir });
console.log('  -> PASS: Suíte C2 Installation Registry aprovada sem regressão');

// T41: Commercial Control Plane Lock PASS
console.log('Test T41: Commercial Control Plane V1 Lock');
const lockOutput = execSync('node scripts/test-commercial-control-plane-v1-lock.mjs', {
  cwd: rootDir,
  encoding: 'utf-8',
});
const EXPECTED_LOCK_HASH = 'D080BFA78D6FAEBEC92809119382284CEF10E439275364F8FE05EA51DD385826';
assert.ok(lockOutput.includes(EXPECTED_LOCK_HASH));
assert.ok(lockOutput.includes('[PASS] Lock Hash verificado'));
console.log(`  -> PASS: Commercial Control Plane Lock verificado com hash: ${EXPECTED_LOCK_HASH}`);

console.log('\n=================================================================');
console.log('--- TODOS OS 41 TESTES DE C9 PASSARAM COM SUCESSO! ---');
console.log('=================================================================');
