/**
 * Xandeflix Prebuilt — Native Player Client (Gate G8)
 *
 * Bridge Capacitor para invocação do player nativo AndroidX Media3 ExoPlayer.
 *
 * Princípios:
 * - CONTROLLED WEB FALLBACK: Em navegadores web puros, retorna NATIVE_PLAYER_UNAVAILABLE
 *   sem acionar <video>, sem abrir nova aba e sem crashar.
 * - SANITIZED IPC: Encaminha apenas os metadados necessários para a sessão de reprodução.
 */

import { registerPlugin, Capacitor } from '@capacitor/core';
import type {
  ResolvedPlaybackRequest,
  NativePlayerLaunchResult,
} from './playback.types.ts';
import { validatePlaybackUri } from './playback-redaction.ts';

export interface NativePlayerPlugin {
  play(options: {
    uri: string;
    title?: string;
    mimeType?: string;
    startPositionMs?: number;
    headers?: Record<string, string>;
  }): Promise<{ success: boolean; message?: string }>;
}

export const NativePlayer = registerPlugin<NativePlayerPlugin>('NativePlayer');

export class NativePlayerClient {
  private plugin: NativePlayerPlugin;

  constructor(plugin?: NativePlayerPlugin) {
    this.plugin = plugin || NativePlayer;
  }

  /**
   * Encaminha a requisição de reprodução direta para o player nativo.
   */
  async launch(request: ResolvedPlaybackRequest): Promise<NativePlayerLaunchResult> {
    // 1. Validar URI antes de acionar a bridge nativa
    validatePlaybackUri(request.uri);

    // 2. Verificar se o ambiente suporta o player nativo
    const isNative = Capacitor.isNativePlatform();
    const isPluginAvailable = Capacitor.isPluginAvailable('NativePlayer');

    if (!isNative && !isPluginAvailable) {
      return {
        success: false,
        state: 'NATIVE_PLAYER_UNAVAILABLE',
        errorMessage: 'Player nativo AndroidX Media3 disponível exclusivamente em dispositivos Android nativos.',
      };
    }

    // 3. Invocar plugin nativo via Capacitor
    try {
      const result = await this.plugin.play({
        uri: request.uri,
        title: request.title,
        mimeType: request.mimeType,
        startPositionMs: request.startPositionMs,
        headers: request.headers,
      });

      return {
        success: result.success ?? true,
        state: result.success === false ? 'NATIVE_PLAYER_ERROR' : 'NATIVE_PLAYER_OPENED',
        errorMessage: result.message,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        state: 'NATIVE_PLAYER_ERROR',
        errorMessage: `Erro ao abrir player nativo: ${msg}`,
      };
    }
  }
}
