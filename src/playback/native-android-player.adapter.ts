/**
 * Xandeflix Prebuilt — Native Android Player Adapter (Unidade T4)
 *
 * Adaptador isolado que mapeia requisições de reprodução para a bridge nativa.
 *
 * Responsabilidade Estrita:
 * - Apenas encaminhar a requisição tipada para a bridge NativeAndroidPlayer.
 * - Converter o resultado para o contrato NativePlayerLaunchResult.
 * - NÃO faz fallback web silencioso.
 * - NÃO resolve catálogo, não busca source nem acessa persistência.
 */

import type { NativePlayerLaunchResult } from './playback.types.ts';
import {
  type NativePlaybackRequest,
  type NativeAndroidPlayerPlugin,
  openNativeAndroidPlayer,
} from './native-android-player.bridge.ts';

export interface NativePlayerAdapter {
  launch(request: NativePlaybackRequest): Promise<NativePlayerLaunchResult>;
}

export class NativeAndroidPlayerAdapter implements NativePlayerAdapter {
  private plugin?: NativeAndroidPlayerPlugin;

  constructor(plugin?: NativeAndroidPlayerPlugin) {
    this.plugin = plugin;
  }

  /**
   * Despacha a requisição de reprodução direta para a bridge do NativeAndroidPlayer.
   */
  async launch(request: NativePlaybackRequest): Promise<NativePlayerLaunchResult> {
    const bridgeResult = await openNativeAndroidPlayer(request, this.plugin);

    return {
      success: bridgeResult.success,
      state: bridgeResult.state,
      errorMessage: bridgeResult.errorMessage,
    };
  }
}
