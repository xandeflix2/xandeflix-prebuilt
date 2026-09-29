/**
 * Xandeflix Prebuilt — Debug Source Config Service (Experiment R7A)
 *
 * Gerenciador de persistência local da configuração de fonte real em sandbox privado.
 *
 * Princípios:
 * - APP_PRIVATE_LOCAL_ONLY: O arquivo reside estritamente em context.getFilesDir() / Directory.Data.
 * - DEBUG_SECRET_STORAGE_NOT_PRODUCTION_CREDENTIAL_VAULT=SIM:
 *   Este serviço é exclusivo para o laboratório experimental de depuração. Não declara
 *   solução definitiva de cofre de senhas de produção.
 * - SEPARATE_FIELDS: Armazena host, username e password isoladamente; jamais persiste
 *   URLs materializadas contendo credenciais.
 * - NO_BACKEND_SYNC: Zero transmissão para nuvem, Supabase ou backend de controle.
 */

import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { type SourceRuntimeConfig } from './source-runtime-config.ts';

const CONFIG_FILE_NAME = 'debug_source_config.json';
const LOCAL_STORAGE_KEY = '__xandeflix_debug_source_config__';

export class DebugSourceConfigService {
  /**
   * Salva a configuração da fonte no storage privado do aplicativo.
   */
  static async saveConfig(config: SourceRuntimeConfig): Promise<void> {
    const payload: SourceRuntimeConfig = {
      type: config.type,
      host: config.host ? config.host.trim() : undefined,
      username: config.username ? config.username.trim() : undefined,
      password: config.password ? config.password.trim() : undefined,
      playlistUrl: config.playlistUrl ? config.playlistUrl.trim() : undefined,
    };

    const jsonStr = JSON.stringify(payload, null, 2);

    // 1. Tentar salvar no sandbox de arquivos nativo do dispositivo
    try {
      await Filesystem.writeFile({
        path: CONFIG_FILE_NAME,
        directory: Directory.Data,
        data: jsonStr,
        encoding: Encoding.UTF8,
      });
    } catch {
      // 2. Fallback gracioso para localStorage na WebView / ambiente web desktop
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, jsonStr);
      }
    }
  }

  /**
   * Carrega a configuração previamente salva no sandbox privado.
   */
  static async loadConfig(): Promise<SourceRuntimeConfig | null> {
    // 1. Tentar carregar do Filesystem privado
    try {
      const file = await Filesystem.readFile({
        path: CONFIG_FILE_NAME,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });

      if (file && file.data) {
        const parsed = JSON.parse(String(file.data));
        return {
          type: parsed.type || 'AUTO',
          host: parsed.host || undefined,
          username: parsed.username || undefined,
          password: parsed.password || undefined,
          playlistUrl: parsed.playlistUrl || undefined,
        };
      }
    } catch {
      // Arquivo inexistente ou erro de leitura nativa; tenta fallback
    }

    // 2. Fallback de localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
        if (item) {
          const parsed = JSON.parse(item);
          return {
            type: parsed.type || 'AUTO',
            host: parsed.host || undefined,
            username: parsed.username || undefined,
            password: parsed.password || undefined,
            playlistUrl: parsed.playlistUrl || undefined,
          };
        }
      } catch {}
    }

    return null;
  }

  /**
   * Limpa a configuração de fonte do sandbox privado do dispositivo.
   */
  static async clearConfig(): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: CONFIG_FILE_NAME,
        directory: Directory.Data,
      });
    } catch {}

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }
}
