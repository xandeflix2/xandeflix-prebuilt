/**
 * Xandeflix Prebuilt — Debug Physical Provisioning Entrypoint (Gate G11A)
 *
 * Ponto de entrada exclusivo para testes físicos em builds de depuração.
 *
 * Princípios:
 * - Invoca obrigatoriamente SecureArtifactImportService com validação criptográfica estrita.
 * - Elimina qualquer bypass de assinatura (unsigned ou alterado é rejeitado fail-closed).
 * - Utiliza a âncora de confiança de teste DEBUG_TEST_PUBLIC_KEY.
 * - Registrado exclusivamente em modo de depuração.
 */

import { SecureArtifactImportService } from '../security/secure-artifact-import.service.ts';
import { ArtifactVerifier } from '../security/artifact-verifier.ts';
import { TrustedPublicKeyStore } from '../security/trusted-public-key-store.ts';
import { getClientBootstrapService } from '../bootstrap/client.ts';
import { DEBUG_TEST_PUBLIC_KEY } from './debug-keys.ts';
import type { ArtifactSecurityEnvelope } from '../security/security.types.ts';

// Polyfill global Buffer para compatibilidade em runtime WebView
if (typeof (globalThis as any).Buffer === 'undefined') {
  const BufferPolyfill: any = function (arg: any) {
    return new Uint8Array(arg);
  };
  BufferPolyfill.isBuffer = (val: any): boolean => {
    return val instanceof Uint8Array || (val != null && val._isBuffer === true);
  };
  BufferPolyfill.from = (data: any, encoding?: string): Uint8Array => {
    if (typeof data === 'string') {
      if (encoding === 'base64') {
        const bin = atob(data);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        return u8;
      }
      return new TextEncoder().encode(data);
    }
    if (data instanceof Uint8Array) {
      return new Uint8Array(data);
    }
    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }
    return new Uint8Array(0);
  };
  (globalThis as any).Buffer = BufferPolyfill;
}

declare global {
  interface Window {
    __XANDEFLIX_DEBUG_IMPORT__?: (
      artifactBase64: string,
      envelopeRaw: string | ArtifactSecurityEnvelope
    ) => Promise<string>;
  }
}

export function initDebugImport(): void {
  if (typeof window === 'undefined') return;

  console.log('[DEBUG_IMPORT_INIT] Registrando window.__XANDEFLIX_DEBUG_IMPORT__...');

  window.__XANDEFLIX_DEBUG_IMPORT__ = async (
    artifactBase64: string,
    envelopeRaw: string | ArtifactSecurityEnvelope
  ): Promise<string> => {
    try {
      console.log('[DEBUG_IMPORT_START] Recebendo artefato para importação segura...');

      // 1. Converter Base64 para Uint8Array
      const binaryStr = atob(artifactBase64);
      const artifactBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        artifactBytes[i] = binaryStr.charCodeAt(i);
      }
      console.log('[DEBUG_IMPORT_BYTES] Tamanho do pacote:', artifactBytes.length);

      // 2. Resolver envelope
      let envelope: ArtifactSecurityEnvelope;
      if (typeof envelopeRaw === 'string') {
        envelope = JSON.parse(envelopeRaw) as ArtifactSecurityEnvelope;
      } else {
        envelope = envelopeRaw;
      }
      console.log('[DEBUG_IMPORT_ENVELOPE] keyId:', envelope.keyId, 'algorithm:', envelope.algorithm);

      // 3. Inicializar serviços de segurança com a âncora de teste
      const keyStore = new TrustedPublicKeyStore([DEBUG_TEST_PUBLIC_KEY]);
      const verifier = new ArtifactVerifier(keyStore);
      const bootstrapService = getClientBootstrapService();
      const secureImporter = new SecureArtifactImportService(
        bootstrapService.getStorage(),
        verifier
      );

      // 4. Executar importação criptográfica fail-closed
      const result = await secureImporter.importPackage(artifactBytes, envelope);
      console.log('[DEBUG_IMPORT_RESULT]', JSON.stringify(result));

      // 5. Se aceito, sincronizar o estado ativo no bootstrap service para atualização da UI
      if (result.success) {
        console.log('[DEBUG_IMPORT_SUCCESS] Sincronizando bootstrap service...');
        await bootstrapService.initialize();
      }

      return JSON.stringify(result);
    } catch (err) {
      const msg = (err as Error).stack || (err as Error).message;
      console.error('[DEBUG_IMPORT_EXCEPTION]', msg);
      return JSON.stringify({
        success: false,
        status: 'REJECTED',
        errorCode: 'DEBUG_IMPORT_EXCEPTION',
        errorMessage: (err as Error).message,
      });
    }
  };
}
