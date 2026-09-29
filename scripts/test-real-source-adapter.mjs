/**
 * Xandeflix Prebuilt — Synthetic Test Suite for Real Source Adapter (Experiment R7A)
 *
 * Suíte de testes sintéticos sem segredos reais para validação estrita do subsistema
 * de adaptadores de fontes reais, detector de tipos, sanitização de erros e isolamento debug/release.
 *
 * Princípios:
 * - NO_SECRET_CONTEXT: Zero credenciais reais; apenas fixtures sintéticas de teste.
 * - LOCAL_DIRECT: Validação de contratos locais e detecção heurística sem chamadas a servidores reais.
 * - FAIL_CLOSED: Regressões em qualquer asserção encerram o teste com código de saída diferente de zero.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { XtreamSourceAdapter } from '../src/debug/source/xtream-source-adapter.ts';
import { M3uSourceAdapter } from '../src/debug/source/m3u-source-adapter.ts';
import { SourceTypeDetector } from '../src/debug/source/source-type-detector.ts';
import {
  sanitizeErrorMessage,
  sanitizeUrl,
  redactCredentialsInText,
  SANITIZED_ERROR_CODES,
} from '../src/debug/source/source-error-sanitizer.ts';
import { redactSecret } from '../src/debug/source/source-runtime-config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

console.log('================================================================');
console.log('Xandeflix Prebuilt — Real Source Adapter Test Suite (R7A)');
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

// -----------------------------------------------------------------------------
// 1. XTREAM_CONFIG_VALIDATION
// -----------------------------------------------------------------------------
console.log('\n--- 1. XTREAM_CONFIG_VALIDATION ---');
{
  const adapter = new XtreamSourceAdapter();
  assert(adapter.getSourceType() === 'XTREAM', 'XtreamSourceAdapter returns type XTREAM');

  const validConfig = {
    type: 'XTREAM',
    host: 'http://test-synthetic-server.local:8080',
    username: 'synthetic_user',
    password: 'synthetic_password_123',
  };
  const validRes = adapter.validateConfig(validConfig);
  assert(validRes.valid === true && validRes.errors.length === 0, 'Valid Xtream config passes validation');

  const missingHost = adapter.validateConfig({
    type: 'XTREAM',
    username: 'synthetic_user',
    password: 'synthetic_password_123',
  });
  assert(missingHost.valid === false && missingHost.errors.length > 0, 'Missing host fails validation');

  const missingUser = adapter.validateConfig({
    type: 'XTREAM',
    host: 'http://test-synthetic-server.local:8080',
    password: 'synthetic_password_123',
  });
  assert(missingUser.valid === false && missingUser.errors.length > 0, 'Missing username fails validation');

  const missingPass = adapter.validateConfig({
    type: 'XTREAM',
    host: 'http://test-synthetic-server.local:8080',
    username: 'synthetic_user',
  });
  assert(missingPass.valid === false && missingPass.errors.length > 0, 'Missing password fails validation');
}

// -----------------------------------------------------------------------------
// 2. M3U_CONFIG_VALIDATION
// -----------------------------------------------------------------------------
console.log('\n--- 2. M3U_CONFIG_VALIDATION ---');
{
  const adapter = new M3uSourceAdapter();
  assert(adapter.getSourceType() === 'M3U', 'M3uSourceAdapter returns type M3U');

  const validConfig = {
    type: 'M3U',
    playlistUrl: 'https://example.synthetic/playlist.m3u',
  };
  const validRes = adapter.validateConfig(validConfig);
  assert(validRes.valid === true && validRes.errors.length === 0, 'Valid M3U config passes validation');

  const emptyUrl = adapter.validateConfig({
    type: 'M3U',
    playlistUrl: '   ',
  });
  assert(emptyUrl.valid === false && emptyUrl.errors.length > 0, 'Empty playlistUrl fails validation');

  const invalidProto = adapter.validateConfig({
    type: 'M3U',
    playlistUrl: 'ftp://example.synthetic/playlist.m3u',
  });
  assert(invalidProto.valid === false && invalidProto.errors.length > 0, 'Non-http/https URL fails validation');
}

// -----------------------------------------------------------------------------
// 3. SOURCE_TYPE_DETECTION
// -----------------------------------------------------------------------------
console.log('\n--- 3. SOURCE_TYPE_DETECTION ---');
{
  // AUTO com host + username + password -> XTREAM
  const xtreamAuto = SourceTypeDetector.detect({
    type: 'AUTO',
    host: 'http://provider.synthetic:8080',
    username: 'demo_user',
    password: 'demo_password',
  });
  assert(xtreamAuto.detectedType === 'XTREAM', 'AUTO with host/username/password detects XTREAM');
  assert(xtreamAuto.catalogImportEligible === true, 'XTREAM is eligible for catalog import');
  assert(xtreamAuto.readyForR7b === true, 'XTREAM is ready for R7B');

  // AUTO com URL contendo player_api.php -> XTREAM
  const xtreamUrl = SourceTypeDetector.detect({
    type: 'AUTO',
    playlistUrl: 'http://provider.synthetic:8080/player_api.php?username=u&password=p',
  });
  assert(xtreamUrl.detectedType === 'XTREAM', 'AUTO with player_api.php detects XTREAM');

  // AUTO com URL contendo .m3u -> M3U
  const m3uAuto = SourceTypeDetector.detect({
    type: 'AUTO',
    playlistUrl: 'http://provider.synthetic:8080/channels.m3u',
  });
  assert(m3uAuto.detectedType === 'M3U', 'AUTO with .m3u detects M3U');
  assert(m3uAuto.catalogImportEligible === true, 'M3U is eligible for catalog import');
  assert(m3uAuto.readyForR7b === true, 'M3U is ready for R7B');

  // Explicit XTREAM
  const explicitXtream = SourceTypeDetector.detect({
    type: 'XTREAM',
    host: 'http://provider.synthetic:8080',
  });
  assert(explicitXtream.detectedType === 'XTREAM', 'Explicit XTREAM type respected');

  // Explicit M3U
  const explicitM3u = SourceTypeDetector.detect({
    type: 'M3U',
    playlistUrl: 'http://provider.synthetic:8080/get.php',
  });
  assert(explicitM3u.detectedType === 'M3U', 'Explicit M3U type respected');

  // AUTO sem evidência -> UNKNOWN
  const unknownAuto = SourceTypeDetector.detect({
    type: 'AUTO',
  });
  assert(unknownAuto.detectedType === 'UNKNOWN', 'AUTO without evidence returns UNKNOWN');
  assert(unknownAuto.catalogImportEligible === false, 'UNKNOWN is not eligible for catalog import');
  assert(unknownAuto.readyForR7b === false, 'UNKNOWN is not ready for R7B');
}

// -----------------------------------------------------------------------------
// 4. ERROR_SANITIZATION
// -----------------------------------------------------------------------------
console.log('\n--- 4. ERROR_SANITIZATION ---');
{
  assert(
    sanitizeErrorMessage(new Error('HTTP 401 Unauthorized access')) === SANITIZED_ERROR_CODES.SOURCE_AUTH_FAILED,
    '401 maps to SOURCE_AUTH_FAILED'
  );
  assert(
    sanitizeErrorMessage(new Error('Forbidden: invalid credentials')) === SANITIZED_ERROR_CODES.SOURCE_AUTH_FAILED,
    'Forbidden maps to SOURCE_AUTH_FAILED'
  );
  assert(
    sanitizeErrorMessage(new Error('Network request timed out after 12000ms')) === SANITIZED_ERROR_CODES.SOURCE_NETWORK_TIMEOUT,
    'Timeout maps to SOURCE_NETWORK_TIMEOUT'
  );
  assert(
    sanitizeErrorMessage(new Error('getaddrinfo ENOTFOUND provider.synthetic')) === SANITIZED_ERROR_CODES.SOURCE_UNREACHABLE,
    'ENOTFOUND maps to SOURCE_UNREACHABLE'
  );
  assert(
    sanitizeErrorMessage(new Error('Failed to fetch from host')) === SANITIZED_ERROR_CODES.SOURCE_UNREACHABLE,
    'Failed to fetch maps to SOURCE_UNREACHABLE'
  );
  assert(
    sanitizeErrorMessage(new Error('Unsupported media format or not a playlist')) === SANITIZED_ERROR_CODES.SOURCE_UNSUPPORTED_FORMAT,
    'Unsupported format maps to SOURCE_UNSUPPORTED_FORMAT'
  );
  assert(
    sanitizeErrorMessage(new Error('HTTP 500 Internal Server Error')) === SANITIZED_ERROR_CODES.SOURCE_INVALID_RESPONSE,
    '500 maps to SOURCE_INVALID_RESPONSE'
  );
  assert(
    sanitizeErrorMessage(new Error('HTTP 404 Not Found')) === SANITIZED_ERROR_CODES.SOURCE_INVALID_RESPONSE,
    '404 maps to SOURCE_INVALID_RESPONSE'
  );
  assert(
    sanitizeErrorMessage(new Error('Configuration missing: host missing')) === SANITIZED_ERROR_CODES.SOURCE_CONFIG_INVALID,
    'Config error maps to SOURCE_CONFIG_INVALID'
  );
  assert(
    sanitizeErrorMessage(new Error('Unanticipated internal runtime error')) === SANITIZED_ERROR_CODES.SOURCE_CONNECTION_FAILED,
    'Generic error maps to SOURCE_CONNECTION_FAILED'
  );
}

// -----------------------------------------------------------------------------
// 5. CREDENTIAL_REDACTION
// -----------------------------------------------------------------------------
console.log('\n--- 5. CREDENTIAL_REDACTION ---');
{
  const rawUrlWithSecrets = 'http://admin_user:super_secret_pwd@iptv-host.synthetic:8080/get.php?username=admin_user&password=super_secret_pwd&token=sensitivetoken999';
  const cleanUrl = sanitizeUrl(rawUrlWithSecrets);

  assert(!cleanUrl.includes('admin_user'), 'Sanitized URL does NOT contain username');
  assert(!cleanUrl.includes('super_secret_pwd'), 'Sanitized URL does NOT contain password');
  assert(!cleanUrl.includes('sensitivetoken999'), 'Sanitized URL does NOT contain token');
  assert(!cleanUrl.includes('?'), 'Sanitized URL does NOT contain query parameters');
  assert(cleanUrl === 'http://iptv-host.synthetic:8080/get.php', 'Sanitized URL preserves only protocol, host and clean path');

  const textWithSecrets = 'Request failed for username=johndoe with password=classified and token=secrettoken42';
  const redactedText = redactCredentialsInText(textWithSecrets);
  assert(!redactedText.includes('johndoe'), 'Redacted text does not contain raw username');
  assert(!redactedText.includes('classified'), 'Redacted text does not contain raw password');
  assert(!redactedText.includes('secrettoken42'), 'Redacted text does not contain raw token');
  assert(redactedText.includes('[REDACTED]'), 'Redacted text replaced credentials with [REDACTED]');

  const masked = redactSecret('secretValue123');
  assert(masked === '••••••••', 'redactSecret returns 8 dots masked string');
  assert(redactSecret('') === '', 'redactSecret returns empty string for empty input');
}

// -----------------------------------------------------------------------------
// 6. M3U_HEADER_DETECTION
// -----------------------------------------------------------------------------
console.log('\n--- 6. M3U_HEADER_DETECTION ---');
{
  const validM3uHeader = `#EXTM3U
#EXTINF:-1 tvg-id="1" tvg-name="Canal 1",Canal 1
http://stream.synthetic:8080/live/user/pass/1.ts
#EXTINF:-1 tvg-id="2" tvg-name="Canal 2",Canal 2
http://stream.synthetic:8080/live/user/pass/2.ts`;

  const detection = SourceTypeDetector.detect(
    { type: 'AUTO', playlistUrl: 'http://provider.synthetic/playlist' },
    validM3uHeader
  );
  assert(detection.detectedType === 'M3U', 'Sample header with #EXTM3U and #EXTINF detected as M3U');
  assert(detection.catalogImportEligible === true, 'M3U with multiple entries is eligible for catalog import');
  assert(detection.readyForR7b === true, 'M3U with multiple entries is ready for R7B');
}

// -----------------------------------------------------------------------------
// 7. HLS_SINGLE_STREAM_DETECTION
// -----------------------------------------------------------------------------
console.log('\n--- 7. HLS_SINGLE_STREAM_DETECTION ---');
{
  // Manifest HLS adaptativo de stream único (master playlist)
  const hlsAdaptiveMasterHeader = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
chunklist_b800000.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
chunklist_b1400000.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
chunklist_b2800000.m3u8`;

  const hlsDetection = SourceTypeDetector.detect(
    { type: 'AUTO', playlistUrl: 'http://cdn.synthetic/live/stream1/master.m3u8' },
    hlsAdaptiveMasterHeader
  );
  assert(hlsDetection.detectedType === 'HLS_SINGLE_STREAM', 'HLS master playlist detected as HLS_SINGLE_STREAM');
  assert(hlsDetection.catalogImportEligible === false, 'HLS_SINGLE_STREAM is NOT eligible for catalog import');
  assert(hlsDetection.readyForR7b === false, 'HLS_SINGLE_STREAM is NOT ready for R7B');

  // Manifest HLS de chunks (media playlist)
  const hlsMediaPlaylistHeader = `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment001.ts
#EXTINF:10.0,
segment002.ts`;

  const hlsMediaDetection = SourceTypeDetector.detect(
    { type: 'AUTO', playlistUrl: 'http://cdn.synthetic/live/stream1/chunklist.m3u8' },
    hlsMediaPlaylistHeader
  );
  assert(hlsMediaDetection.detectedType === 'HLS_SINGLE_STREAM', 'HLS media playlist detected as HLS_SINGLE_STREAM');
  assert(hlsMediaDetection.catalogImportEligible === false, 'HLS media playlist is NOT eligible for catalog import');

  // URL heurística de HLS stream direto
  const hlsUrlDetection = SourceTypeDetector.detect({
    type: 'AUTO',
    playlistUrl: 'http://live.synthetic/channel1/master.m3u8',
  });
  assert(hlsUrlDetection.detectedType === 'HLS_SINGLE_STREAM', 'URL ending in master.m3u8 detected as HLS_SINGLE_STREAM');
}

// -----------------------------------------------------------------------------
// 8. TS_DIRECT_STREAM_CLASSIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- 8. TS_DIRECT_STREAM_CLASSIFICATION ---');
{
  const tsUrlDetection = SourceTypeDetector.detect({
    type: 'AUTO',
    playlistUrl: 'http://iptv.synthetic:8080/live/user/pass/12345.ts',
  });
  assert(tsUrlDetection.detectedType === 'TS_DIRECT_STREAM', 'URL ending in .ts classified as TS_DIRECT_STREAM');
  assert(tsUrlDetection.catalogImportEligible === false, 'TS_DIRECT_STREAM is NOT eligible for catalog import');
  assert(tsUrlDetection.readyForR7b === false, 'TS_DIRECT_STREAM is NOT ready for R7B');

  const tsWithQuery = SourceTypeDetector.detect({
    type: 'AUTO',
    playlistUrl: 'http://iptv.synthetic:8080/live/user/pass/12345.ts?token=xyz',
  });
  assert(tsWithQuery.detectedType === 'TS_DIRECT_STREAM', 'URL with .ts?query classified as TS_DIRECT_STREAM');
}

// -----------------------------------------------------------------------------
// 9. DEBUG_RELEASE_ISOLATION
// -----------------------------------------------------------------------------
console.log('\n--- 9. DEBUG_RELEASE_ISOLATION ---');
{
  const releaseProvisionerPath = resolve(PROJECT_ROOT, 'android/app/src/release/java/com/xandeflix/prebuilt/debug/DebugProvisioner.java');
  assert(existsSync(releaseProvisionerPath), 'Release DebugProvisioner exists');
  const releaseContent = readFileSync(releaseProvisionerPath, 'utf8');
  assert(!releaseContent.includes('ACTION_DEBUG_OPEN_SOURCE_SETUP'), 'Release provisioner does NOT have ACTION_DEBUG_OPEN_SOURCE_SETUP');
  assert(!releaseContent.includes('ACTION_DEBUG_IMPORT'), 'Release provisioner does NOT have ACTION_DEBUG_IMPORT');
  assert(releaseContent.includes('STRICT NO-OP'), 'Release provisioner is a STRICT NO-OP stub');

  const debugProvisionerPath = resolve(PROJECT_ROOT, 'android/app/src/debug/java/com/xandeflix/prebuilt/debug/DebugProvisioner.java');
  assert(existsSync(debugProvisionerPath), 'Debug DebugProvisioner exists');
  const debugContent = readFileSync(debugProvisionerPath, 'utf8');
  assert(debugContent.includes('ACTION_DEBUG_OPEN_SOURCE_SETUP'), 'Debug provisioner HAS ACTION_DEBUG_OPEN_SOURCE_SETUP');
  assert(debugContent.includes('ACTION_DEBUG_IMPORT'), 'Debug provisioner HAS ACTION_DEBUG_IMPORT');

  const viteConfigPath = resolve(PROJECT_ROOT, 'vite.config.ts');
  const viteContent = readFileSync(viteConfigPath, 'utf8');
  assert(viteContent.includes('__XANDEFLIX_DEBUG_BUILD__'), 'Vite defines __XANDEFLIX_DEBUG_BUILD__');
  assert(viteContent.includes('process.env.VITE_DEBUG_BUILD'), 'Vite ties debug flag to VITE_DEBUG_BUILD');

  const appTsxPath = resolve(PROJECT_ROOT, 'src/App.tsx');
  const appContent = readFileSync(appTsxPath, 'utf8');
  assert(appContent.includes('case \'debug-source-setup\':'), 'App.tsx contains debug-source-setup route');
  assert(appContent.includes('typeof __XANDEFLIX_DEBUG_BUILD__ !== \'undefined\' && __XANDEFLIX_DEBUG_BUILD__'), 'App.tsx protects debug routes with __XANDEFLIX_DEBUG_BUILD__');
}

console.log('\n================================================================');
console.log(`ALL REAL SOURCE ADAPTER TESTS PASSED! (${passedTests}/${totalTests} assertions)`);
console.log('================================================================\n');
