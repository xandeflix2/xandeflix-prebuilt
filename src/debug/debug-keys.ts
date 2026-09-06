/**
 * Xandeflix Prebuilt — Debug Only Physical Test Trust Anchor (Gate G11A)
 *
 * Âncora de confiança pública exclusiva para testes físicos em builds de depuração.
 *
 * Princípios:
 * - DEBUG_ONLY_TEST_TRUST_ANCHOR = SIM
 * - RELEASE_TEST_TRUST_KEY_PRESENT = NAO (eliminado no build de produção)
 * - NUNCA contém chaves privadas.
 */

import type { TrustedPublicKey } from '../security/security.types.ts';

export const DEBUG_TEST_KEY_ID = 'g11-physical-test-key-2026';

export const DEBUG_TEST_PUBLIC_KEY: TrustedPublicKey = {
  keyId: DEBUG_TEST_KEY_ID,
  algorithm: 'ECDSA_P256_SHA256',
  publicKeyPem: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEpHCd1OFPqK1FTQvCgV13oRb3HnSL
2Vtuj5lr6/qLLilsZq18qwog73A+M9G3kt9ddNeZmg9IVi/ENLKfLbEpcA==
-----END PUBLIC KEY-----`,
  status: 'ACTIVE',
};
