/**
 * Xandeflix Prebuilt — Source Runtime Config Contract (Experiment R7A)
 *
 * Contrato local e experimental para configuração de fonte real em modo de depuração.
 *
 * Princípios:
 * - NO_SECRET_CONTEXT: Credenciais jamais são incluídas em logs, repositório ou catálogo.
 * - LOCAL_PRIVATE_ONLY: Reside exclusivamente no sandbox privado do dispositivo.
 * - BACKEND_CONTROL_PLANE_ONLY: Zero sincronização de fontes com backend.
 */

export type SourceType = 'AUTO' | 'XTREAM' | 'M3U';

export type DetectedSourceType =
  | 'XTREAM'
  | 'M3U'
  | 'HLS_SINGLE_STREAM'
  | 'TS_DIRECT_STREAM'
  | 'UNKNOWN';

export type ConnectionStatus = 'IDLE' | 'PASS' | 'FAIL';

export type AuthStatus = 'PASS' | 'AUTH_FAILED' | 'NA';

export interface SourceRuntimeConfig {
  type: SourceType;
  host?: string;
  username?: string;
  password?: string;
  playlistUrl?: string;
}

export interface SourceConnectionTestResult {
  connection: ConnectionStatus;
  auth: AuthStatus;
  detectedType: DetectedSourceType;
  catalogImportEligible: boolean;
  readyForR7b: boolean;
  sanitizedMessage: string;
  testedAtIso: string;
}

/**
 * Função utilitária para mascarar strings de credenciais em exibições.
 * Garante que senhas ou tokens nunca sejam renderizados em texto puro.
 */
export function redactSecret(value?: string): string {
  if (!value) return '';
  return '••••••••';
}
