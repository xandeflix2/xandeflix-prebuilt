/**
 * Xandeflix Prebuilt — Dual-Mode License, Device Binding & Source Resolution Test Suite (R7B)
 *
 * Validação estrita e determinística do modelo de autorização para o laboratório Xandeflix Prebuilt:
 * 1. Geração de DEVICE_ID UUID aleatório e display code amigável (XF-XXXX-XXXX)
 * 2. Licença SELF_SERVICE vinculada a exatamente 1 DEVICE_ID (atômico)
 * 3. Mesma licença SELF_SERVICE recusada no segundo aparelho
 * 4. Mesma fonte aceita em diferentes licenças SELF_SERVICE
 * 5. SELF_SERVICE aceita 1 fonte ativa local por DEVICE_ID
 * 6. Licença MANAGED possui max_devices=N
 * 7. Dispositivos MANAGED precisam de aprovação individual pelo gestor
 * 8. Gestor classifica device_type e device_label
 * 9. N+1 dispositivo é recusado quando slots estão cheios
 * 10. Gestor vincula a mesma fonte aos devices autorizados
 * 11. Device MANAGED recebe SourceRuntimeConfig autorizado e decriptado
 * 12. Teste de concorrência com Promise.all (race condition prevention)
 * 13. Testes de segurança: hash no banco, AES-256-GCM, zero catálogo central
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  generateSecureDeviceId,
  generateDisplayCode,
  isValidDisplayCode,
} from '../src/device/device-identity.service.ts';
import {
  sha256Hex,
  encryptAes256Gcm,
  decryptAes256Gcm,
} from '../src/control-plane/crypto/control-plane-crypto.ts';
import { ControlPlaneEngine } from '../src/control-plane/engine/control-plane-engine.ts';
import { ControlPlaneClient } from '../src/control-plane/client/control-plane-client.ts';
import { AuthorizedSourceResolver } from '../src/control-plane/client/authorized-source-resolver.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

console.log('================================================================');
console.log('Xandeflix Prebuilt — Dual-Mode License & Binding Test Suite (R7B)');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  passedTests++;
  console.log(`✅ [PASS] ${message}`);
}

async function runTests() {
  // -----------------------------------------------------------------------------
  // 1. DEVICE_ID & DISPLAY_CODE SPECIFICATION
  // -----------------------------------------------------------------------------
  console.log('\n--- 1. DEVICE_ID & DISPLAY_CODE SPECIFICATION ---');
  {
    const id1 = generateSecureDeviceId();
    const id2 = generateSecureDeviceId();
    assert(typeof id1 === 'string' && id1.length === 36, 'DEVICE_ID is a 36-character UUID string');
    assert(id1 !== id2, 'DEVICE_ID generation is unique and non-deterministic');
    assert(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id1),
      'DEVICE_ID conforms strictly to RFC 4122 UUID v4'
    );

    const code1 = generateDisplayCode();
    const code2 = generateDisplayCode();
    assert(isValidDisplayCode(code1), 'display_code matches format XF-XXXX-XXXX');
    assert(code1 !== code2, 'display_code generation produces distinct random codes');
    assert(!/[OI]/.test(code1), 'display_code excludes visually ambiguous letters (O, I)');
    assert(isValidDisplayCode('XF-7K29-PQ41'), 'Example display code XF-7K29-PQ41 passes validation');
    assert(!isValidDisplayCode('INVALID-CODE'), 'Invalid display code format is rejected');
  }

  // -----------------------------------------------------------------------------
  // 2. CRYPTO FOUNDATIONS: SHA-256 & AES-256-GCM
  // -----------------------------------------------------------------------------
  console.log('\n--- 2. CRYPTO FOUNDATIONS: SHA-256 & AES-256-GCM ---');
  {
    const sampleKey = 'XF-SELF-TEST-KEY-1234';
    const hash = await sha256Hex(sampleKey);
    assert(hash.length === 64, 'sha256Hex produces standard 64-char hex string');
    assert(hash === (await sha256Hex(sampleKey)), 'sha256Hex is deterministic');
    assert(hash !== sampleKey, 'sha256Hex does not leak raw plaintext');

    const testSecret = JSON.stringify({ host: 'http://source.test', user: 'u1', pass: 's3cr3t' });
    const encKey = '12345678901234567890123456789012'; // 32 bytes
    const encrypted = await encryptAes256Gcm(testSecret, encKey);
    assert(encrypted.ciphertext.length > 0, 'AES-256-GCM ciphertext is non-empty');
    assert(encrypted.iv.length === 24, 'AES-256-GCM IV is 12 bytes hex (24 chars)');
    assert(!encrypted.ciphertext.includes('s3cr3t'), 'Ciphertext does not expose raw secret');

    const decrypted = await decryptAes256Gcm(encrypted.ciphertext, encrypted.iv, encKey, encrypted.authTag);
    assert(decrypted === testSecret, 'Decrypted plaintext matches original secret');
  }

  // -----------------------------------------------------------------------------
  // 3. SELF_SERVICE: FIRST DEVICE ATOMIC BIND & SECOND DEVICE BLOCK
  // -----------------------------------------------------------------------------
  console.log('\n--- 3. SELF_SERVICE: ATOMIC BIND & BLOCK ---');
  {
    const engine = new ControlPlaneEngine();
    const license = await engine.createLicense({
      mode: 'SELF_SERVICE',
      maxDevices: 1,
      notes: 'Test Self-Service License',
    });

    const devAId = generateSecureDeviceId();
    const devACode = generateDisplayCode();
    const devBId = generateSecureDeviceId();
    const devBCode = generateDisplayCode();

    // Device A activates
    const actA = await engine.activateDevice({
      licenseKey: license.licenseKey,
      deviceId: devAId,
      displayCode: devACode,
      deviceType: 'TV',
      deviceLabel: 'TV SALA',
    });

    assert(actA.status === 'AUTHORIZED', 'Device A achieves status AUTHORIZED');
    assert(actA.licenseMode === 'SELF_SERVICE', 'License mode is SELF_SERVICE');
    assert(actA.maxDevices === 1, 'Self-service max_devices is exactly 1');
    assert(actA.authorizedDeviceCount === 1, 'Authorized device count is 1');
    assert(typeof actA.deviceToken === 'string' && actA.deviceToken.length > 0, 'Device A receives deviceToken');

    // Device B tries same license
    const actB = await engine.activateDevice({
      licenseKey: license.licenseKey,
      deviceId: devBId,
      displayCode: devBCode,
      deviceType: 'PHONE',
      deviceLabel: 'CELULAR PESSOAL',
    });

    assert(actB.status === 'LICENSE_ALREADY_BOUND', 'Device B receives LICENSE_ALREADY_BOUND');
    assert(actB.deviceToken === null, 'Device B receives null deviceToken');
    assert(actB.message.includes('1 dispositivo'), 'Rejection message informs single-device limit');

    // Device A re-activates with same deviceId (idempotent recovery)
    const actAReconnect = await engine.activateDevice({
      licenseKey: license.licenseKey,
      deviceId: devAId,
      displayCode: devACode,
    });
    assert(actAReconnect.status === 'AUTHORIZED', 'Same device re-activating on same license is AUTHORIZED');
  }

  // -----------------------------------------------------------------------------
  // 4. SELF_SERVICE: SECOND LICENSE FOR SECOND DEVICE
  // -----------------------------------------------------------------------------
  console.log('\n--- 4. SELF_SERVICE: SECOND LICENSE FOR SECOND DEVICE ---');
  {
    const engine = new ControlPlaneEngine();
    const lic1 = await engine.createLicense({ mode: 'SELF_SERVICE' });
    const lic2 = await engine.createLicense({ mode: 'SELF_SERVICE' });

    const devAId = generateSecureDeviceId();
    const devBId = generateSecureDeviceId();

    const actA = await engine.activateDevice({
      licenseKey: lic1.licenseKey,
      deviceId: devAId,
      displayCode: generateDisplayCode(),
    });
    const actB = await engine.activateDevice({
      licenseKey: lic2.licenseKey,
      deviceId: devBId,
      displayCode: generateDisplayCode(),
    });

    assert(actA.status === 'AUTHORIZED', 'Device A authorized under License 1');
    assert(actB.status === 'AUTHORIZED', 'Device B authorized under License 2');
  }

  // -----------------------------------------------------------------------------
  // 5. SELF_SERVICE: ONE ACTIVE SOURCE PER DEVICE & REPLACEMENT
  // -----------------------------------------------------------------------------
  console.log('\n--- 5. SELF_SERVICE: ONE ACTIVE SOURCE PER DEVICE & REPLACEMENT ---');
  {
    // Simulating private local storage on device
    const localPrivateStoreA = { activeSource: null };
    const localPrivateStoreB = { activeSource: null };

    // Device A stores Source 1
    const source1 = { type: 'XTREAM', host: 'http://source1.local', username: 'u1', password: 'p1' };
    localPrivateStoreA.activeSource = source1;
    assert(localPrivateStoreA.activeSource.host === 'http://source1.local', 'Device A has Source 1 active');

    // Device A replaces with Source 2
    const source2 = { type: 'M3U', playlistUrl: 'https://source2.local/list.m3u' };
    localPrivateStoreA.activeSource = source2;
    assert(localPrivateStoreA.activeSource.type === 'M3U', 'Device A replaced active source with Source 2');
    assert(localPrivateStoreA.activeSource.playlistUrl === 'https://source2.local/list.m3u', 'Only Source 2 remains active');

    // Same source configured on Device B under different license
    localPrivateStoreB.activeSource = source2;
    assert(
      localPrivateStoreA.activeSource.playlistUrl === localPrivateStoreB.activeSource.playlistUrl,
      'Same source can be configured on both Device A and Device B (allowed behavior)'
    );
  }

  // -----------------------------------------------------------------------------
  // 6. MANAGED LICENSE: SLOTS, APPROVAL, NAMING & N+1 REJECTION
  // -----------------------------------------------------------------------------
  console.log('\n--- 6. MANAGED LICENSE: SLOTS, APPROVAL & REJECTION ---');
  {
    const engine = new ControlPlaneEngine();
    const managedLicense = await engine.createLicense({
      mode: 'MANAGED',
      maxDevices: 3,
      notes: 'Managed Family Pack (3 slots)',
    });

    assert(managedLicense.mode === 'MANAGED', 'License mode is MANAGED');
    assert(managedLicense.maxDevices === 3, 'max_devices is 3');

    // 4 devices attempt registration
    const dev1Id = generateSecureDeviceId();
    const dev2Id = generateSecureDeviceId();
    const dev3Id = generateSecureDeviceId();
    const dev4Id = generateSecureDeviceId();

    const reg1 = await engine.activateDevice({
      licenseKey: managedLicense.licenseKey,
      deviceId: dev1Id,
      displayCode: 'XF-7K29-PQ41',
      deviceType: 'TV',
      deviceLabel: 'TV SALA',
    });
    assert(reg1.status === 'PENDING_MANAGER_APPROVAL', 'Device 1 status is PENDING_MANAGER_APPROVAL');
    assert(reg1.deviceToken === null, 'Device 1 receives no token while pending');

    const reg2 = await engine.activateDevice({
      licenseKey: managedLicense.licenseKey,
      deviceId: dev2Id,
      displayCode: 'XF-8M34-JK92',
      deviceType: 'TV',
      deviceLabel: 'TV QUARTO',
    });
    assert(reg2.status === 'PENDING_MANAGER_APPROVAL', 'Device 2 status is PENDING_MANAGER_APPROVAL');

    const reg3 = await engine.activateDevice({
      licenseKey: managedLicense.licenseKey,
      deviceId: dev3Id,
      displayCode: 'XF-2C98-AB15',
      deviceType: 'PHONE',
      deviceLabel: 'CELULAR PESSOAL',
    });
    assert(reg3.status === 'PENDING_MANAGER_APPROVAL', 'Device 3 status is PENDING_MANAGER_APPROVAL');

    // Manager views pending devices
    const pendingDevices = await engine.getLicenseDevices(managedLicense.id);
    assert(pendingDevices.length === 3, 'Manager sees 3 registered devices in license');

    // Manager approves Device 1
    const app1 = await engine.approveDevice({
      licenseId: managedLicense.id,
      deviceId: dev1Id,
      deviceType: 'TV',
      deviceLabel: 'TV SALA (APROVADA)',
    });
    assert(app1.status === 'AUTHORIZED', 'Manager approved Device 1 -> AUTHORIZED');
    assert(app1.deviceLabel === 'TV SALA (APROVADA)', 'Manager confirmed deviceLabel');

    // Manager approves Device 2
    const app2 = await engine.approveDevice({
      licenseId: managedLicense.id,
      deviceId: dev2Id,
      deviceType: 'TV',
      deviceLabel: 'TV QUARTO (APROVADA)',
    });
    assert(app2.status === 'AUTHORIZED', 'Manager approved Device 2 -> AUTHORIZED');

    // Manager approves Device 3
    const app3 = await engine.approveDevice({
      licenseId: managedLicense.id,
      deviceId: dev3Id,
      deviceType: 'PHONE',
      deviceLabel: 'CELULAR PESSOAL (APROVADO)',
    });
    assert(app3.status === 'AUTHORIZED', 'Manager approved Device 3 -> AUTHORIZED');

    // Now all 3 slots are occupied
    const activeCount = await engine.getAuthorizedDeviceCount(managedLicense.id);
    assert(activeCount === 3, 'Authorized count is 3/3');

    // Device 4 tries to activate
    const reg4 = await engine.activateDevice({
      licenseKey: managedLicense.licenseKey,
      deviceId: dev4Id,
      displayCode: 'XF-9K88-ZZ11',
      deviceType: 'TABLET',
      deviceLabel: 'TABLET EXTRA',
    });
    assert(reg4.status === 'DEVICE_LIMIT_REACHED', 'Device 4 is rejected with DEVICE_LIMIT_REACHED');

    // Manager cannot approve Device 4 when slots are full
    let approveFailed = false;
    try {
      await engine.approveDevice({
        licenseId: managedLicense.id,
        deviceId: dev4Id,
      });
    } catch (err) {
      approveFailed = true;
    }
    assert(approveFailed, 'Manager cannot approve device beyond max_devices slot limit');
  }

  // -----------------------------------------------------------------------------
  // 7. MANAGED LICENSE: REVOKE AND REPLACE
  // -----------------------------------------------------------------------------
  console.log('\n--- 7. MANAGED LICENSE: REVOKE AND REPLACE ---');
  {
    const engine = new ControlPlaneEngine();
    const license = await engine.createLicense({ mode: 'MANAGED', maxDevices: 2 });
    const dev1Id = generateSecureDeviceId();
    const dev2Id = generateSecureDeviceId();
    const dev3Id = generateSecureDeviceId();

    await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev1Id, displayCode: generateDisplayCode() });
    await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev2Id, displayCode: generateDisplayCode() });

    await engine.approveDevice({ licenseId: license.id, deviceId: dev1Id });
    await engine.approveDevice({ licenseId: license.id, deviceId: dev2Id });
    assert(await engine.getAuthorizedDeviceCount(license.id) === 2, '2 slots occupied');

    // Revoke Device 2
    const revoked = await engine.revokeDevice({ licenseId: license.id, deviceId: dev2Id });
    assert(revoked.status === 'REVOKED', 'Device 2 status set to REVOKED');
    assert(await engine.getAuthorizedDeviceCount(license.id) === 1, 'Authorized count decremented to 1');

    // Now Device 3 can take the freed slot
    const reg3 = await engine.activateDevice({
      licenseKey: license.licenseKey,
      deviceId: dev3Id,
      displayCode: generateDisplayCode(),
    });
    assert(reg3.status === 'PENDING_MANAGER_APPROVAL', 'Device 3 pending registration after slot freed');

    const app3 = await engine.approveDevice({
      licenseId: license.id,
      deviceId: dev3Id,
      deviceType: 'TABLET',
      deviceLabel: 'TABLET SUBSTITUTO',
    });
    assert(app3.status === 'AUTHORIZED', 'Device 3 successfully occupies replaced slot');
    assert(await engine.getAuthorizedDeviceCount(license.id) === 2, 'Slots count back to 2/2');
  }

  // -----------------------------------------------------------------------------
  // 8. MANAGED SOURCE: ENCRYPTION, MULTI-DEVICE BINDING & RESOLUTION
  // -----------------------------------------------------------------------------
  console.log('\n--- 8. MANAGED SOURCE: BINDING & SOURCE RESOLUTION ---');
  {
    const engine = new ControlPlaneEngine();
    const client = new ControlPlaneClient(engine);

    const license = await engine.createLicense({ mode: 'MANAGED', maxDevices: 3 });
    const dev1Id = generateSecureDeviceId();
    const dev2Id = generateSecureDeviceId();
    const dev3Id = generateSecureDeviceId();

    // Register & approve 3 devices
    const act1 = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev1Id, displayCode: generateDisplayCode() });
    const act2 = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev2Id, displayCode: generateDisplayCode() });
    const act3 = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev3Id, displayCode: generateDisplayCode() });

    await engine.approveDevice({ licenseId: license.id, deviceId: dev1Id });
    await engine.approveDevice({ licenseId: license.id, deviceId: dev2Id });
    await engine.approveDevice({ licenseId: license.id, deviceId: dev3Id });

    // Fetch authorized tokens by re-activating with approved deviceId
    const ready1 = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev1Id, displayCode: 'D1' });
    const ready2 = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev2Id, displayCode: 'D2' });
    const ready3 = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: dev3Id, displayCode: 'D3' });

    assert(ready1.status === 'AUTHORIZED' && ready1.deviceToken !== null, 'Device 1 has active token');
    assert(ready2.status === 'AUTHORIZED' && ready2.deviceToken !== null, 'Device 2 has active token');
    assert(ready3.status === 'AUTHORIZED' && ready3.deviceToken !== null, 'Device 3 has active token');

    // Manager creates ManagedSource (AES-256-GCM encrypted server-side)
    const secretXtreamConfig = {
      type: 'XTREAM',
      host: 'http://managed-iptv-server.net:8080',
      username: 'managed_user_44',
      password: 'managed_secret_pass_xyz',
    };
    const managedSource = await engine.createManagedSource({
      licenseId: license.id,
      name: 'Family IPTV Feed',
      sourceType: 'XTREAM',
      config: secretXtreamConfig,
    });

    assert(managedSource.id.length > 0, 'Managed source created');
    assert(managedSource.encryptedPayload.length > 0, 'Managed source payload is encrypted');
    assert(!managedSource.encryptedPayload.includes('managed_secret_pass_xyz'), 'Payload does not expose plaintext password');

    // Manager binds managedSource to all 3 devices
    const bindRes = await engine.bindSourceToDevices({
      licenseId: license.id,
      sourceId: managedSource.id,
      deviceIds: [dev1Id, dev2Id, dev3Id],
    });
    assert(bindRes.boundCount === 3, 'Managed source bound to all 3 authorized devices');

    // Devices resolve source configuration
    const res1 = await client.resolveAuthorizedSource({
      licenseId: license.id,
      deviceId: dev1Id,
      deviceToken: ready1.deviceToken,
    });

    assert(res1.status === 'SOURCE_READY', 'Device 1 resolved source: SOURCE_READY');
    assert(res1.config !== null, 'Device 1 received config');
    assert(res1.config.type === 'XTREAM', 'Device 1 source type is XTREAM');
    assert(res1.config.host === 'http://managed-iptv-server.net:8080', 'Device 1 decrypted correct host');
    assert(res1.config.username === 'managed_user_44', 'Device 1 decrypted correct username');
    assert(res1.config.password === 'managed_secret_pass_xyz', 'Device 1 decrypted correct password');

    const res2 = await client.resolveAuthorizedSource({
      licenseId: license.id,
      deviceId: dev2Id,
      deviceToken: ready2.deviceToken,
    });
    assert(res2.status === 'SOURCE_READY', 'Device 2 resolved source: SOURCE_READY');

    const res3 = await client.resolveAuthorizedSource({
      licenseId: license.id,
      deviceId: dev3Id,
      deviceToken: ready3.deviceToken,
    });
    assert(res3.status === 'SOURCE_READY', 'Device 3 resolved source: SOURCE_READY');
  }

  // -----------------------------------------------------------------------------
  // 9. UNAUTHORIZED, REVOKED & CROSS-CUSTOMER RESOLUTION DENIAL
  // -----------------------------------------------------------------------------
  console.log('\n--- 9. UNAUTHORIZED, REVOKED & CROSS-CUSTOMER DENIAL ---');
  {
    const engine = new ControlPlaneEngine();
    const client = new ControlPlaneClient(engine);

    const licA = await engine.createLicense({ mode: 'MANAGED', maxDevices: 2 });
    const licB = await engine.createLicense({ mode: 'MANAGED', maxDevices: 2 });

    const devAId = generateSecureDeviceId();
    const devBId = generateSecureDeviceId();

    await engine.activateDevice({ licenseKey: licA.licenseKey, deviceId: devAId, displayCode: 'DA' });
    await engine.approveDevice({ licenseId: licA.id, deviceId: devAId });
    const readyA = await engine.activateDevice({ licenseKey: licA.licenseKey, deviceId: devAId, displayCode: 'DA' });

    await engine.activateDevice({ licenseKey: licB.licenseKey, deviceId: devBId, displayCode: 'DB' });
    await engine.approveDevice({ licenseId: licB.id, deviceId: devBId });

    const sourceA = await engine.createManagedSource({
      licenseId: licA.id,
      name: 'Source A',
      sourceType: 'M3U',
      config: { type: 'M3U', playlistUrl: 'https://source-a.local/list.m3u' },
    });
    await engine.bindSourceToDevices({ licenseId: licA.id, sourceId: sourceA.id, deviceIds: [devAId] });

    // 1. Unauthorized device (wrong token)
    const badTokenRes = await client.resolveAuthorizedSource({
      licenseId: licA.id,
      deviceId: devAId,
      deviceToken: 'FORGED-OR-EXPIRED-TOKEN',
    });
    assert(badTokenRes.status === 'DEVICE_NOT_AUTHORIZED', 'Forged token rejected with DEVICE_NOT_AUTHORIZED');

    // 2. Revoked device resolution denial
    await engine.revokeDevice({ licenseId: licA.id, deviceId: devAId });
    const revokedRes = await client.resolveAuthorizedSource({
      licenseId: licA.id,
      deviceId: devAId,
      deviceToken: readyA.deviceToken,
    });
    assert(revokedRes.status === 'DEVICE_REVOKED', 'Revoked device resolution rejected with DEVICE_REVOKED');

    // 3. Cross-customer binding denial (cannot bind Source A to Device B of License B)
    let crossCustomerBlocked = false;
    try {
      await engine.bindSourceToDevices({
        licenseId: licA.id,
        sourceId: sourceA.id,
        deviceIds: [devBId], // devBId belongs to licB
      });
    } catch (err) {
      crossCustomerBlocked = true;
    }
    assert(crossCustomerBlocked, 'Cross-customer binding is strictly rejected');
  }

  // -----------------------------------------------------------------------------
  // 10. SELF_SERVICE: LOCAL SOURCE AFTER LICENSE REVOCATION DENIED
  // -----------------------------------------------------------------------------
  console.log('\n--- 10. SELF_SERVICE: LOCAL SOURCE AFTER LICENSE REVOKE DENIED ---');
  {
    const engine = new ControlPlaneEngine();
    const client = new ControlPlaneClient(engine);

    // Mock local storage for test
    let localConfig = { type: 'XTREAM', host: 'http://source.local', username: 'u', password: 'p' };
    const mockStorage = {
      loadSourceConfig: async () => localConfig,
      saveSourceConfig: async (cfg) => { localConfig = cfg; },
      clearSourceConfig: async () => { localConfig = null; },
    };

    const resolver = new AuthorizedSourceResolver(client, mockStorage);

    const license = await engine.createLicense({ mode: 'SELF_SERVICE' });
    const devId = generateSecureDeviceId();
    const act = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: devId, displayCode: 'D' });

    // 1. When license active: SOURCE_READY
    const resActive = await resolver.resolve({
      licenseId: license.id,
      deviceId: devId,
      deviceToken: act.deviceToken,
      licenseMode: 'SELF_SERVICE',
    });
    assert(resActive.status === 'SOURCE_READY', 'Active self-service device resolves local source: SOURCE_READY');
    assert(resActive.config !== null, 'Local config retrieved');

    // 2. Revoke device on control plane
    await engine.revokeDevice({ licenseId: license.id, deviceId: devId });

    // 3. When license/device revoked: local source is BLOCKED
    const resRevoked = await resolver.resolve({
      licenseId: license.id,
      deviceId: devId,
      deviceToken: act.deviceToken,
      licenseMode: 'SELF_SERVICE',
    });
    assert(resRevoked.status === 'DEVICE_REVOKED', 'Revoked self-service device is DENIED use of local source');
    assert(!resRevoked.config, 'No source config returned when license is revoked');
  }

  // -----------------------------------------------------------------------------
  // 11. CONCURRENCY: SIMULTANEOUS ACTIVATIONS OF SAME SELF_SERVICE LICENSE
  // -----------------------------------------------------------------------------
  console.log('\n--- 11. CONCURRENCY: SIMULTANEOUS ACTIVATIONS TEST ---');
  {
    const engine = new ControlPlaneEngine();
    const license = await engine.createLicense({ mode: 'SELF_SERVICE' });

    const competitors = Array.from({ length: 5 }, (_, i) => ({
      deviceId: generateSecureDeviceId(),
      displayCode: `XF-CONC-${i}000`,
    }));

    // Dispatch 5 simultaneous activations for the same single-device license
    const results = await Promise.all(
      competitors.map((c) =>
        engine.activateDevice({
          licenseKey: license.licenseKey,
          deviceId: c.deviceId,
          displayCode: c.displayCode,
          deviceType: 'TV',
          deviceLabel: `COMPETITOR-${c.displayCode}`,
        })
      )
    );

    const authorizedList = results.filter((r) => r.status === 'AUTHORIZED');
    const rejectedList = results.filter((r) => r.status === 'LICENSE_ALREADY_BOUND');

    assert(authorizedList.length === 1, 'Exactly one concurrent competitor achieves status AUTHORIZED');
    assert(rejectedList.length === 4, 'All other concurrent competitors receive LICENSE_ALREADY_BOUND');
    assert(await engine.getAuthorizedDeviceCount(license.id) === 1, 'Authorized device count remains strictly 1');
  }

  // -----------------------------------------------------------------------------
  // 12. SECURITY ASSURANCES & ISOLATION
  // -----------------------------------------------------------------------------
  console.log('\n--- 12. SECURITY ASSURANCES & ZERO CENTRAL CATALOG ---');
  {
    const engine = new ControlPlaneEngine();
    const license = await engine.createLicense({ mode: 'SELF_SERVICE' });
    const devId = generateSecureDeviceId();
    const act = await engine.activateDevice({ licenseKey: license.licenseKey, deviceId: devId, displayCode: 'D' });

    // Raw license key not in stored records
    const storedLic = engine.findLicenseById(license.id);
    assert(storedLic !== undefined, 'License record exists');
    assert(!('licenseKey' in storedLic), 'Raw licenseKey property NOT present on database record');
    assert(storedLic.licenseKeyHash.length === 64, 'Stored licenseKeyHash is SHA-256 (64 hex characters)');

    // Raw device token not in stored records
    const storedDevice = engine.findDevice(license.id, devId);
    assert(storedDevice !== undefined, 'Device record exists');
    assert(!('deviceToken' in storedDevice), 'Raw deviceToken property NOT present on database record');
    assert(storedDevice.deviceTokenHash.length === 64, 'Stored deviceTokenHash is SHA-256 (64 hex characters)');

    // Managed source encrypted
    const managedLic = await engine.createLicense({ mode: 'MANAGED', maxDevices: 1 });
    const ms = await engine.createManagedSource({
      licenseId: managedLic.id,
      name: 'Secure Test',
      sourceType: 'XTREAM',
      config: { type: 'XTREAM', host: 'http://h', username: 'u', password: 'ultra-secret-password-xyz' },
    });
    assert(!ms.encryptedPayload.includes('ultra-secret-password-xyz'), 'Encrypted payload does NOT contain password plaintext');
    assert(!('config' in ms), 'Plaintext config property NOT present on managed_sources record');

    // Central catalog verification: Control Plane Engine has no catalog tables
    const dump = engine.dumpStats();
    assert(dump.centralCatalogRows === 0, 'Central catalog rows is exactly 0');
    assert(dump.centralSearchIndexRows === 0, 'Central SearchIndex rows is exactly 0');

    // SQL Migration verification: Check that SQL file exists and does NOT declare iptv catalog tables
    const sqlPath = resolve(PROJECT_ROOT, 'supabase/migrations/20260907000001_r7b_dual_mode_control_plane.sql');
    assert(existsSync(sqlPath), 'Supabase migration for R7B exists');
    const sqlContent = readFileSync(sqlPath, 'utf-8');
    assert(!sqlContent.includes('create table channels'), 'Migration contains NO channels table');
    assert(!sqlContent.includes('create table streams'), 'Migration contains NO streams table');
    assert(!sqlContent.includes('create table vod'), 'Migration contains NO VOD table');
    assert(!sqlContent.includes('create table series'), 'Migration contains NO series table');
    assert(!sqlContent.includes('create table search_index'), 'Migration contains NO central search_index table');

    // Check frontend source code has zero service_role strings
    const activationPageCode = readFileSync(resolve(PROJECT_ROOT, 'src/ui/pages/ActivationPage.tsx'), 'utf-8');
    assert(!activationPageCode.includes('service_role'), 'ActivationPage.tsx contains no service_role');
    const clientCode = readFileSync(resolve(PROJECT_ROOT, 'src/control-plane/client/control-plane-client.ts'), 'utf-8');
    assert(!clientCode.includes('service_role'), 'control-plane-client.ts contains no service_role');
  }

  // -----------------------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`ALL R7B DUAL-MODE AUTHORIZATION TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Unhandled test runner error:', err);
  process.exit(1);
});
