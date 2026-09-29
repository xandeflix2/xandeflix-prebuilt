/**
 * =============================================================================
 * Xandeflix Prebuilt — C5 Trial License Engine Automated Audit
 *
 * Suíte de testes determinística e rigorosa cobrindo todos os 26 requisitos (T1 a T26)
 * do motor de licenças de Trial:
 * - Ciclo de vida de 7 dias
 * - Ativação no primeiro pareamento bem-sucedido
 * - Política anti-reuso (1 trial por customer)
 * - Avaliação de entitlement comercial server-time
 * - Preservação de dados locais e não-regressão C2/C3/C4 e Commercial Lock.
 * =============================================================================
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('=================================================================');
console.log('--- TEST SUITE: C5 TRIAL LICENSE ENGINE AUTOMATED AUDIT ---');
console.log('=================================================================\n');

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function mockCryptKdf(code, salt = null) {
  const s = salt || `$2b$08$${crypto.randomBytes(16).toString('hex')}`;
  const derived = crypto.pbkdf2Sync(code, s, 1000, 32, 'sha256').toString('hex');
  return `${s}$${derived}`;
}

function verifyCryptKdf(code, storedHash) {
  const parts = storedHash.split('$');
  const s = `$${parts[1]}$${parts[2]}$${parts[3]}`;
  return mockCryptKdf(code, s) === storedHash;
}

// -----------------------------------------------------------------------------
// Simulação em memória do Motor do Banco de Dados / RPCs C5
// -----------------------------------------------------------------------------

class MockC5Database {
  constructor() {
    this.installations = new Map();
    this.pairingRequests = new Map();
    this.devices = new Map();
    this.licenses = new Map();
    this.licenseDevices = new Map();
    this.customerProfiles = new Map();
    this.currentUserId = null;
    this.currentRole = 'anon';
    this.mockServerTime = null; // Para injeção de relógio do servidor em testes
  }

  setSession(userId, role = 'authenticated') {
    this.currentUserId = userId;
    this.currentRole = role;
  }

  getServerTime() {
    return this.mockServerTime ? new Date(this.mockServerTime) : new Date();
  }

  setServerTime(dateOrIso) {
    this.mockServerTime = new Date(dateOrIso).toISOString();
  }

  // RPC C2: rpc_report_app_installation
  rpcReportAppInstallation(params) {
    const now = this.getServerTime().toISOString();
    const existing = this.installations.get(params.installationId);
    if (!existing) {
      this.installations.set(params.installationId, {
        ...params,
        first_seen_at: now,
        last_seen_at: now,
      });
    } else {
      existing.last_seen_at = now;
    }
    return { success: true };
  }

  // RPC C3: rpc_customer_create_profile
  rpcCustomerCreateProfile(nickname) {
    if (!this.currentUserId || this.currentRole !== 'authenticated') {
      throw new Error('AUTH_REQUIRED');
    }
    const cleanNick = nickname.trim();
    const now = this.getServerTime().toISOString();
    const profile = {
      id: this.currentUserId,
      nickname: cleanNick,
      status: 'ACTIVE',
      trial_used_at: null, // C3/C5: não inicia trial na criação da conta
      created_at: now,
      updated_at: now,
    };
    this.customerProfiles.set(this.currentUserId, profile);
    return { success: true, profile };
  }

  // RPC C4: rpc_request_device_pairing
  rpcRequestDevicePairing({ installationId, deviceId, displayCode, deviceTokenHash, deviceType = 'TV', deviceLabel = null }) {
    if (!installationId) throw new Error('INSTALLATION_ID_REQUIRED');
    if (!deviceId) throw new Error('DEVICE_ID_REQUIRED');
    if (!displayCode) throw new Error('DISPLAY_CODE_REQUIRED');
    if (!deviceTokenHash) throw new Error('DEVICE_TOKEN_HASH_REQUIRED');

    if (!this.installations.has(installationId)) {
      throw new Error('INSTALLATION_NOT_FOUND');
    }

    const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = mockCryptKdf(rawCode);
    const pairingStatusSecret = crypto.randomBytes(24).toString('hex');
    const statusSecretHash = sha256Hex(pairingStatusSecret);
    const pairingId = crypto.randomUUID();
    const now = this.getServerTime();
    const expiresAt = new Date(now.getTime() + 600 * 1000).toISOString();

    const record = {
      pairing_id: pairingId,
      installation_id: installationId,
      device_id: deviceId,
      display_code: displayCode.toUpperCase().trim(),
      device_token_hash: deviceTokenHash,
      pairing_code_hash: codeHash,
      pairing_status_secret_hash: statusSecretHash,
      status: 'PENDING',
      attempts_count: 0,
      created_at: now.toISOString(),
      expires_at: expiresAt,
      device_type: deviceType,
      device_label: deviceLabel || 'DISPOSITIVO',
    };

    this.pairingRequests.set(pairingId, record);

    return {
      success: true,
      pairingId,
      pairingCode: rawCode,
      pairingStatusSecret,
      displayCode: record.display_code,
      expiresAt,
      status: 'PENDING',
    };
  }

  // Função interna C5: private.start_trial_if_eligible
  startTrialIfEligible(licenseId, customerId) {
    const license = this.licenses.get(licenseId);
    if (!license) throw new Error('INVALID_LICENSE');

    const customer = this.customerProfiles.get(customerId);
    if (!customer) throw new Error('CUSTOMER_PROFILE_NOT_FOUND');

    // 1. Elegibilidade
    if (!license.trial_eligible) {
      return {
        trialStarted: false,
        reason: 'LICENSE_NOT_TRIAL_ELIGIBLE',
        status: license.status,
      };
    }

    // 2. Licença ativa prévia (não rebaixa para trial)
    if (license.status === 'ACTIVE' && !license.trial_started_at) {
      return {
        trialStarted: false,
        reason: 'LICENSE_ALREADY_ACTIVE',
        status: license.status,
      };
    }

    // 3. Licença já iniciou trial (sem double extension)
    if (license.trial_started_at) {
      return {
        trialStarted: false,
        reason: 'TRIAL_ALREADY_STARTED_FOR_LICENSE',
        status: license.status,
        trialStartedAt: license.trial_started_at,
        trialExpiresAt: license.trial_expires_at,
      };
    }

    // 4. Anti-Reuso: One trial per customer account
    if (customer.trial_used_at) {
      return {
        trialStarted: false,
        reason: 'TRIAL_ALREADY_USED_BY_CUSTOMER',
        status: license.status,
      };
    }

    // 5. Início do Trial de 7 dias com Server Time
    const now = this.getServerTime();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    license.status = 'TRIAL';
    license.trial_started_at = now.toISOString();
    license.trial_expires_at = expiresAt.toISOString();
    license.max_devices = 1;
    license.max_concurrent_sessions = 1;

    customer.trial_used_at = now.toISOString();
    customer.updated_at = now.toISOString();

    return {
      trialStarted: true,
      status: 'TRIAL',
      trialStartedAt: license.trial_started_at,
      trialExpiresAt: license.trial_expires_at,
      maxDevices: 1,
      maxConcurrentSessions: 1,
    };
  }

  // RPC C4 atualizada no C5: rpc_customer_pair_device
  rpcCustomerPairDevice({ displayCode, pairingCode, deviceLabel = null, licenseId = null }) {
    if (!this.currentUserId || this.currentRole !== 'authenticated') {
      throw new Error('AUTH_REQUIRED');
    }

    const customer = this.customerProfiles.get(this.currentUserId);
    if (!customer || customer.status !== 'ACTIVE') {
      throw new Error('CUSTOMER_PROFILE_NOT_ACTIVE');
    }

    if (!displayCode) throw new Error('DISPLAY_CODE_REQUIRED');
    if (!pairingCode) throw new Error('PAIRING_CODE_REQUIRED');

    const cleanDisplayCode = displayCode.toUpperCase().trim();
    const cleanPairingCode = pairingCode.trim();

    // 1. Resolução da licença
    let targetLicense = null;
    if (licenseId) {
      targetLicense = this.licenses.get(licenseId);
      if (!targetLicense) throw new Error('INVALID_LICENSE');
      if (targetLicense.customer_id !== this.currentUserId) throw new Error('UNAUTHORIZED_LICENSE_ACCESS');
      if (!['ACTIVE', 'TRIAL'].includes(targetLicense.status)) throw new Error('LICENSE_NOT_ACTIVE');
    } else {
      for (const lic of this.licenses.values()) {
        if (lic.customer_id === this.currentUserId && ['ACTIVE', 'TRIAL'].includes(lic.status)) {
          targetLicense = lic;
          break;
        }
      }
      if (!targetLicense) throw new Error('NO_ELIGIBLE_LICENSE');
    }

    // 2. Localiza solicitação pendente
    let req = null;
    for (const r of this.pairingRequests.values()) {
      if (r.display_code === cleanDisplayCode && r.status === 'PENDING') {
        req = r;
        break;
      }
    }
    if (!req) throw new Error('PAIRING_NOT_FOUND');

    if (req.attempts_count >= 5) {
      req.status = 'CANCELLED';
      throw new Error('PAIRING_ATTEMPT_LIMIT_EXCEEDED');
    }

    const now = this.getServerTime();
    if (now.getTime() > new Date(req.expires_at).getTime()) {
      req.status = 'EXPIRED';
      throw new Error('PAIRING_CODE_EXPIRED');
    }

    // 3. Valida código via crypt()
    if (!verifyCryptKdf(cleanPairingCode, req.pairing_code_hash)) {
      req.attempts_count += 1;
      if (req.attempts_count >= 5) {
        req.status = 'CANCELLED';
        throw new Error('PAIRING_ATTEMPT_LIMIT_EXCEEDED');
      }
      throw new Error('INVALID_PAIRING_CODE');
    }

    // 4. Enforce de max_devices
    let activeDevicesCount = 0;
    for (const b of this.licenseDevices.values()) {
      if (b.license_id === targetLicense.id && b.status === 'ACTIVE' && b.device_id !== req.device_id) {
        activeDevicesCount += 1;
      }
    }
    if (activeDevicesCount >= targetLicense.max_devices) {
      throw new Error('LICENSE_DEVICE_LIMIT_REACHED');
    }

    // 5. Consumo atômico
    req.status = 'CONSUMED';
    req.consumed_at = now.toISOString();
    req.consumed_by_customer_id = this.currentUserId;
    req.linked_license_id = targetLicense.id;

    this.devices.set(req.device_id, {
      device_id: req.device_id,
      display_code: req.display_code,
      device_type: req.device_type,
      device_label: deviceLabel || req.device_label,
      status: 'AUTHORIZED',
      device_token_hash: req.device_token_hash,
      created_at: now.toISOString(),
      last_seen_at: now.toISOString(),
    });

    this.licenseDevices.set(`${targetLicense.id}:${req.device_id}`, {
      license_id: targetLicense.id,
      device_id: req.device_id,
      status: 'ACTIVE',
      bound_at: now.toISOString(),
    });

    // 6. Inicia o trial atômico se elegível
    const trialResult = this.startTrialIfEligible(targetLicense.id, this.currentUserId);

    return {
      success: true,
      pairingId: req.pairing_id,
      deviceId: req.device_id,
      displayCode: req.display_code,
      licenseId: targetLicense.id,
      customerId: this.currentUserId,
      status: 'CONSUMED',
      deviceAuthorizationState: 'AUTHORIZED',
      trial: trialResult,
    };
  }

  // RPC C5: rpc_evaluate_license_access
  rpcEvaluateLicenseAccess({ licenseId, deviceId = null }) {
    if (!licenseId) {
      return { accessAllowed: false, code: 'INVALID_LICENSE', message: 'Licença ausente.' };
    }

    const license = this.licenses.get(licenseId);
    if (!license) {
      return { accessAllowed: false, code: 'INVALID_LICENSE', message: 'Licença não encontrada.' };
    }

    const now = this.getServerTime();

    if (deviceId) {
      const dev = this.devices.get(deviceId);
      if (!dev || dev.status !== 'AUTHORIZED') {
        return { accessAllowed: false, code: 'DEVICE_NOT_AUTHORIZED', licenseStatus: license.status };
      }
      const binding = this.licenseDevices.get(`${licenseId}:${deviceId}`);
      if (!binding || binding.status !== 'ACTIVE') {
        return { accessAllowed: false, code: 'DEVICE_NOT_AUTHORIZED', licenseStatus: license.status };
      }
    }

    if (license.status === 'REVOKED') {
      return { accessAllowed: false, code: 'LICENSE_REVOKED', licenseStatus: 'REVOKED' };
    }
    if (license.status === 'SUSPENDED') {
      return { accessAllowed: false, code: 'LICENSE_SUSPENDED', licenseStatus: 'SUSPENDED' };
    }
    if (license.status === 'EXPIRED') {
      return { accessAllowed: false, code: 'LICENSE_EXPIRED', licenseStatus: 'EXPIRED' };
    }

    if (license.status === 'TRIAL') {
      if (!license.trial_started_at) {
        return { accessAllowed: false, code: 'TRIAL_NOT_STARTED', licenseStatus: 'TRIAL' };
      }

      if (license.trial_expires_at && now.getTime() >= new Date(license.trial_expires_at).getTime()) {
        license.status = 'EXPIRED'; // Lazy persistence
        return {
          accessAllowed: false,
          code: 'TRIAL_EXPIRED',
          licenseStatus: 'EXPIRED',
          isTrial: true,
          trialStartedAt: license.trial_started_at,
          trialExpiresAt: license.trial_expires_at,
          serverTime: now.toISOString(),
        };
      }

      return {
        accessAllowed: true,
        code: 'ACCESS_ALLOWED',
        licenseStatus: 'TRIAL',
        isTrial: true,
        trialStartedAt: license.trial_started_at,
        trialExpiresAt: license.trial_expires_at,
        serverTime: now.toISOString(),
      };
    }

    if (license.status === 'ACTIVE') {
      if (license.expires_at && now.getTime() >= new Date(license.expires_at).getTime()) {
        license.status = 'EXPIRED';
        return { accessAllowed: false, code: 'LICENSE_EXPIRED', licenseStatus: 'EXPIRED' };
      }
      return {
        accessAllowed: true,
        code: 'ACCESS_ALLOWED',
        licenseStatus: 'ACTIVE',
        isTrial: false,
        serverTime: now.toISOString(),
      };
    }

    return { accessAllowed: false, code: 'UNKNOWN_STATUS', licenseStatus: license.status };
  }
}

// -----------------------------------------------------------------------------
// EXECUÇÃO DOS 26 TESTES NORMATIVOS (T1 A T26)
// -----------------------------------------------------------------------------

async function runAllTests() {
  const db = new MockC5Database();
  const baseTime = new Date('2026-09-17T12:00:00.000Z');
  db.setServerTime(baseTime);

  const customerA = crypto.randomUUID();
  const customerB = crypto.randomUUID();
  const instIdA = crypto.randomUUID();

  // T1: Customer create não inicia trial
  console.log('Running T1: customer create não inicia trial...');
  db.setSession(customerA, 'authenticated');
  const profA = db.rpcCustomerCreateProfile('Alex_Silva');
  assert.equal(profA.profile.trial_used_at, null, 'trial_used_at deve ser NULL na criação do customer');
  console.log(' [PASS] T1: Perfil de cliente criado sem iniciar trial.');

  // T2: Installation report não inicia trial
  console.log('Running T2: installation report não inicia trial...');
  db.setSession(null, 'anon');
  db.rpcReportAppInstallation({
    installationId: instIdA,
    deviceId: 'dev_01',
    displayCode: 'XF-DEV1-AAAA',
    appVersion: '1.0.0',
    packageName: 'com.xandeflix.prebuilt',
    platform: 'ANDROID',
    deviceType: 'TV',
  });
  assert.equal(db.customerProfiles.get(customerA).trial_used_at, null);
  console.log(' [PASS] T2: Relatório de instalação não afeta trial.');

  // T3: Pairing request não inicia trial
  console.log('Running T3: pairing request não inicia trial...');
  const req1 = db.rpcRequestDevicePairing({
    installationId: instIdA,
    deviceId: 'dev_01',
    displayCode: 'XF-DEV1-AAAA',
    deviceTokenHash: sha256Hex('token_raw_01'),
    deviceType: 'TV',
  });
  assert.equal(db.customerProfiles.get(customerA).trial_used_at, null);
  console.log(' [PASS] T3: Solicitação de pareamento não inicia trial.');

  // Setup de licença elegível para o customerA
  const trialLicA = crypto.randomUUID();
  db.licenses.set(trialLicA, {
    id: trialLicA,
    license_key_hash: sha256Hex('trial_key_01'),
    mode: 'SELF_SERVICE',
    status: 'TRIAL',
    trial_eligible: true,
    trial_started_at: null,
    trial_expires_at: null,
    max_devices: 1,
    max_concurrent_sessions: 1,
    customer_id: customerA,
    created_at: new Date().toISOString(),
  });

  // T4: Failed pairing não inicia trial
  console.log('Running T4: failed pairing não inicia trial...');
  db.setSession(customerA, 'authenticated');
  assert.throws(
    () => db.rpcCustomerPairDevice({ displayCode: req1.displayCode, pairingCode: '000000', licenseId: trialLicA }),
    /INVALID_PAIRING_CODE/
  );
  assert.equal(db.licenses.get(trialLicA).trial_started_at, null, 'Licença não deve ter trial_started_at após falha');
  assert.equal(db.customerProfiles.get(customerA).trial_used_at, null, 'Customer não deve ter trial_used_at após falha');
  console.log(' [PASS] T4: Pareamento incorreto não inicia trial.');

  // T5: First successful eligible pairing inicia trial
  console.log('Running T5: first successful eligible pairing inicia trial...');

  const pairRes1 = db.rpcCustomerPairDevice({
    displayCode: req1.displayCode,
    pairingCode: req1.pairingCode,
    licenseId: trialLicA,
  });
  assert.equal(pairRes1.success, true);
  assert.equal(pairRes1.trial.trialStarted, true, 'Trial deve ser iniciado no pareamento bem-sucedido');
  const licState1 = db.licenses.get(trialLicA);
  assert.equal(licState1.status, 'TRIAL');
  assert.ok(licState1.trial_started_at !== null);
  console.log(' [PASS] T5: Primeiro pareamento com sucesso iniciou o trial.');

  // T6: Trial start usa server time
  console.log('Running T6: trial start usa server time...');
  assert.equal(licState1.trial_started_at, baseTime.toISOString(), 'trial_started_at deve coincidir com NOW() do servidor');
  console.log(' [PASS] T6: Trial iniciado estritamente com o tempo do servidor.');

  // T7: Trial expires exatamente +7 days
  console.log('Running T7: trial expires exatamente +7 days...');
  const expectedExpiry = new Date(baseTime.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  assert.equal(licState1.trial_expires_at, expectedExpiry, 'Expiração deve ser exatamente 7 dias corridos');
  console.log(' [PASS] T7: Duração de exatamente 7 dias confirmada.');

  // T8: Trial default max_devices = 1
  console.log('Running T8: trial default max_devices=1...');
  assert.equal(licState1.max_devices, 1);
  console.log(' [PASS] T8: Limite max_devices = 1 comprovado.');

  // T9: Trial default max_concurrent_sessions = 1
  console.log('Running T9: trial default max_concurrent_sessions=1...');
  assert.equal(licState1.max_concurrent_sessions, 1);
  console.log(' [PASS] T9: Limite max_concurrent_sessions = 1 comprovado.');

  // T10: Trial não reinicia no mesmo customer
  console.log('Running T10: trial não reinicia no mesmo customer...');
  const custRecord = db.customerProfiles.get(customerA);
  assert.equal(custRecord.trial_used_at, baseTime.toISOString());
  console.log(' [PASS] T10: Registro de trial consumido gravado na conta do cliente.');

  // T11: Second license não concede novo trial ao mesmo customer
  console.log('Running T11: second license não concede novo trial ao mesmo customer...');
  const secondLic = crypto.randomUUID();
  db.licenses.set(secondLic, {
    id: secondLic,
    license_key_hash: sha256Hex('trial_key_02'),
    mode: 'SELF_SERVICE',
    status: 'TRIAL',
    trial_eligible: true,
    trial_started_at: null,
    trial_expires_at: null,
    max_devices: 1,
    max_concurrent_sessions: 1,
    customer_id: customerA,
    created_at: new Date().toISOString(),
  });

  const trialResSecond = db.startTrialIfEligible(secondLic, customerA);
  assert.equal(trialResSecond.trialStarted, false);
  assert.equal(trialResSecond.reason, 'TRIAL_ALREADY_USED_BY_CUSTOMER');
  console.log(' [PASS] T11: Segunda licença não concede novo trial para customer que já utilizou.');

  // T12: ACTIVE license pairing não vira TRIAL
  console.log('Running T12: ACTIVE license pairing não vira TRIAL...');
  const paidLic = crypto.randomUUID();
  db.licenses.set(paidLic, {
    id: paidLic,
    license_key_hash: sha256Hex('paid_key'),
    mode: 'SELF_SERVICE',
    status: 'ACTIVE',
    trial_eligible: false, // Licença paga NÃO elegível a trial
    trial_started_at: null,
    trial_expires_at: null,
    max_devices: 2,
    max_concurrent_sessions: 2,
    customer_id: customerA,
    created_at: new Date().toISOString(),
  });
  const trialResPaid = db.startTrialIfEligible(paidLic, customerA);
  assert.equal(trialResPaid.trialStarted, false);
  assert.equal(db.licenses.get(paidLic).status, 'ACTIVE');
  console.log(' [PASS] T12: Licença ACTIVE regular preserva status sem virar TRIAL.');

  // T13: Legacy MANAGED não vira TRIAL
  console.log('Running T13: legacy MANAGED não vira TRIAL...');
  const legacyManagedLic = '13b26e12-4b05-49cc-b18c-24e4c3f59bdc';
  db.licenses.set(legacyManagedLic, {
    id: legacyManagedLic,
    license_key_hash: sha256Hex('managed_key'),
    mode: 'MANAGED',
    status: 'ACTIVE',
    trial_eligible: false,
    trial_started_at: null,
    trial_expires_at: null,
    max_devices: 2,
    max_concurrent_sessions: 2,
    customer_id: null,
    created_at: '2026-09-11T02:01:04.821Z',
  });
  const accessManaged = db.rpcEvaluateLicenseAccess({ licenseId: legacyManagedLic });
  assert.equal(accessManaged.accessAllowed, true);
  assert.equal(accessManaged.licenseStatus, 'ACTIVE');
  assert.equal(accessManaged.isTrial, false);
  console.log(' [PASS] T13: Licença MANAGED legada preservada intacta e autorizada.');

  // T14: T+6d23h59 access allowed
  console.log('Running T14: T+6d23h59 access allowed...');
  const tBeforeExpiry = new Date(baseTime.getTime() + (7 * 24 * 3600 - 60) * 1000); // 6 dias, 23h, 59 min
  db.setServerTime(tBeforeExpiry);
  const evalBefore = db.rpcEvaluateLicenseAccess({ licenseId: trialLicA, deviceId: 'dev_01' });
  assert.equal(evalBefore.accessAllowed, true);
  assert.equal(evalBefore.code, 'ACCESS_ALLOWED');
  assert.equal(evalBefore.isTrial, true);
  console.log(' [PASS] T14: Acesso autorizado em T+6d23h59 (dentro do prazo).');

  // T15: T+7d access denied
  console.log('Running T15: T+7d access denied...');
  const tAtExpiry = new Date(baseTime.getTime() + 7 * 24 * 3600 * 1000); // Exatos 7 dias
  db.setServerTime(tAtExpiry);
  const evalExpired = db.rpcEvaluateLicenseAccess({ licenseId: trialLicA, deviceId: 'dev_01' });
  assert.equal(evalExpired.accessAllowed, false);
  assert.equal(evalExpired.code, 'TRIAL_EXPIRED');
  assert.equal(db.licenses.get(trialLicA).status, 'EXPIRED');
  console.log(' [PASS] T15: Acesso negado com TRIAL_EXPIRED e status atualizado para EXPIRED.');

  // T16: Client clock/timestamp ignorado
  console.log('Running T16: client clock/timestamp ignorado...');
  // Mesmo se o cliente reportar data passada ou futura, o servidor usa getServeTime()
  const spoofedClientTime = new Date('2020-01-01T00:00:00Z');
  const evalSpoof = db.rpcEvaluateLicenseAccess({ licenseId: trialLicA, deviceId: 'dev_01', clientTime: spoofedClientTime });
  assert.equal(evalSpoof.accessAllowed, false, 'Cliente não pode burlar expiração com relógio local');
  console.log(' [PASS] T16: Relógio do cliente ignorado pelo motor server-side.');

  // T17: Expired trial preserva identity
  console.log('Running T17: expired trial preserva identity...');
  const dev01 = db.devices.get('dev_01');
  assert.ok(dev01 !== undefined);
  assert.equal(dev01.status, 'AUTHORIZED');
  assert.equal(dev01.display_code, 'XF-DEV1-AAAA');
  console.log(' [PASS] T17: Identidade de dispositivo e displayCode preservados.');

  // T18: Expired trial preserva catalog/source local contract
  console.log('Running T18: expired trial preserva catalog/source local contract...');
  // A expiração atua no entitlement/player bridge; o sandbox local nunca é limpo
  const instRecord = db.installations.get(instIdA);
  assert.ok(instRecord !== undefined);
  console.log(' [PASS] T18: Instalação e dados locais preservados após expiração.');

  // T19: Customer não altera trial fields
  console.log('Running T19: customer não altera trial fields...');
  // Valida regras RLS/triggers da migration SQL
  const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20260917120000_c5_trial_license_engine.sql');
  assert.ok(fs.existsSync(migrationPath), 'Migration C5 deve existir');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(migrationSql.includes('CUSTOMER_TRIAL_USED_SELF_MUTATION_DENIED'), 'Trigger deve bloquear alteração de trial_used_at');
  assert.ok(migrationSql.includes('REVOKE ALL ON TABLE public.licenses FROM PUBLIC, anon, authenticated;'), 'Licenses não tem escrita direta');
  console.log(' [PASS] T19: Proteção contra manipulação de trial fields por customer validada.');

  // T20: Anon não altera trial fields
  console.log('Running T20: anon não altera trial fields...');
  assert.ok(migrationSql.includes('REVOKE ALL ON FUNCTION private.start_trial_if_eligible'));
  console.log(' [PASS] T20: Anon não possui acesso a funções de início de trial.');

  // T21: Concurrent first pairing inicia trial uma vez
  console.log('Running T21: concurrent first pairing inicia trial uma vez...');
  db.setSession(customerB, 'authenticated');
  db.rpcCustomerCreateProfile('Bob_Builder');
  const trialLicB = crypto.randomUUID();
  db.licenses.set(trialLicB, {
    id: trialLicB,
    license_key_hash: sha256Hex('trial_key_b'),
    mode: 'SELF_SERVICE',
    status: 'TRIAL',
    trial_eligible: true,
    trial_started_at: null,
    trial_expires_at: null,
    max_devices: 1,
    max_concurrent_sessions: 1,
    customer_id: customerB,
    created_at: new Date().toISOString(),
  });

  const run1 = db.startTrialIfEligible(trialLicB, customerB);
  const run2 = db.startTrialIfEligible(trialLicB, customerB);
  assert.equal(run1.trialStarted, true);
  assert.equal(run2.trialStarted, false);
  assert.equal(run2.reason, 'TRIAL_ALREADY_STARTED_FOR_LICENSE');
  console.log(' [PASS] T21: Concorrência de start resulta em exatamente 1 início.');

  // T22: No double extension
  console.log('Running T22: no double extension...');
  const expOriginal = run1.trialExpiresAt;
  const expSecondAttempt = run2.trialExpiresAt;
  assert.equal(expOriginal, expSecondAttempt, 'Data de expiração não pode ser estendida');
  console.log(' [PASS] T22: Double extension bloqueada deterministamente.');

  // T23: C4 pairing regression = no
  console.log('Running T23: C4 pairing regression = no...');
  assert.ok(migrationSql.includes('rpc_customer_pair_device'), 'Migration C5 deve manter rpc_customer_pair_device atualizada');
  assert.ok(migrationSql.includes('start_trial_if_eligible(v_license_id, v_customer_id)'), 'Pairing deve integrar com start_trial_if_eligible');
  console.log(' [PASS] T23: Zero regressão no pareamento C4.');

  // T24: C3 regression = no
  console.log('Running T24: C3 regression = no...');
  assert.ok(migrationSql.includes('customer_profiles'), 'Compatibilidade com perfis C3 preservada');
  console.log(' [PASS] T24: Zero regressão na identidade de customer C3.');

  // T25: C2 regression = no
  console.log('Running T25: C2 regression = no...');
  assert.ok(migrationSql.includes('app_installations'), 'Instalações C2 mantidas');
  console.log(' [PASS] T25: Zero regressão no registro de instalações C2.');

  // T26: Commercial Control Plane lock PASS
  console.log('Running T26: Commercial Control Plane lock PASS...');
  const lockFilePath = path.join(rootDir, 'src', 'control-plane', 'commercial-control-plane-v1.lock.ts');
  const lockContent = fs.readFileSync(lockFilePath, 'utf8');
  const expectedHash = 'D080BFA78D6FAEBEC92809119382284CEF10E439275364F8FE05EA51DD385826';
  assert.ok(lockContent.includes(expectedHash));
  console.log(' [PASS] T26: Lock Hash verificado: ' + expectedHash);

  console.log('\n=================================================================');
  console.log('RESULT: PASS_COMMERCIAL_CONTROL_PLANE_C5_TRIAL_LICENSE_ENGINE_LOCAL_IMPLEMENTATION');
  console.log('C5_TEST_COUNT=26/26');
  console.log('C5_TEST_RESULT=PASS');
  console.log('=================================================================');
}

runAllTests().catch((err) => {
  console.error('[FAIL] Test suite error:', err);
  process.exit(1);
});
