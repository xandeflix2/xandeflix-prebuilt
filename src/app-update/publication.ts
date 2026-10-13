import { getSupabaseBrowserClient } from '../integrations/supabase/client.ts';

export interface UpdateMirror { label: string; url: string }
export interface AppRelease {
  versionCode: number; versionName: string; sha256: string; bytes: number;
  notes: string; mirrors: UpdateMirror[];
}
export interface UpdatePublication { revision: number; enabled: boolean; release: AppRelease | null }
export const emptyPublication: UpdatePublication = { revision: 0, enabled: false, release: null };
export function downloadUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || (url.port && url.port !== '443')) throw new Error('Use um link público HTTPS de download.');
  if (url.hostname === 'www.dropbox.com' || url.hostname === 'dropbox.com') {
    url.searchParams.delete('raw'); url.searchParams.set('dl', '1');
  }
  return url.toString();
}
export function releaseIssues(release: AppRelease): Record<string, string> {
  const issues: Record<string, string> = {};
  if (!Number.isSafeInteger(release.versionCode) || release.versionCode < 1 || release.versionCode > 999999999) issues.versionCode = 'Informe o código inteiro da versão do APK.';
  if (!release.versionName.trim() || release.versionName.length > 64) issues.versionName = 'Informe o nome da versão.';
  if (!/^[a-fA-F0-9]{64}$/.test(release.sha256)) issues.sha256 = 'Informe o SHA-256 do APK, com 64 caracteres.';
  if (!Number.isSafeInteger(release.bytes) || release.bytes < 1 || release.bytes > 268435456) issues.bytes = 'Informe o tamanho exato em bytes, até 256 MB.';
  if (release.notes.length > 1000) issues.notes = 'Use até 1.000 caracteres nas notas.';
  if (!release.mirrors.length || release.mirrors.length > 5) issues.mirrors = 'Cadastre de uma a cinco fontes.';
  const seen = new Set<string>();
  release.mirrors.forEach((mirror, index) => {
    try {
      const url = downloadUrl(mirror.url);
      if (!mirror.label.trim() || mirror.label.length > 80 || mirror.url.length > 2048 || seen.has(url)) throw new Error();
      seen.add(url);
    } catch { issues[`mirror-${index}`] = 'Informe nome e URL HTTPS pública, sem repetir a fonte.'; }
  });
  return issues;
}
export interface PublicationApi {
  read(): Promise<UpdatePublication>;
  save(publication: UpdatePublication): Promise<UpdatePublication>;
}
export const publicationApi: PublicationApi = {
  async read() {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Serviço indisponível.');
    const { data, error } = await client.rpc('rpc_manager_app_update_read');
    if (error || !data) throw new Error('Não foi possível consultar a publicação. Confirme sua sessão MASTER e tente novamente.');
    return data as UpdatePublication;
  },
  async save(publication) {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error('Serviço indisponível.');
    const { data, error } = await client.rpc('rpc_manager_app_update_save', {
      p_revision: publication.revision, p_enabled: publication.enabled, p_release: publication.release,
    });
    if (error || !data) {
      if (error?.message.includes('APP_UPDATE_REVISION_CONFLICT')) throw new Error('A publicação mudou em outra sessão. Atualize a página antes de salvar.');
      if (error?.message.includes('APP_UPDATE_VERSION_REQUIRED')) throw new Error('Para um APK diferente, publique um código de versão maior.');
      throw new Error('Não foi possível salvar. Confira os campos e sua autorização MASTER.');
    }
    return data as UpdatePublication;
  },
};
