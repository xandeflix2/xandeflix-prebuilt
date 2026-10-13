import React, { useEffect, useRef, useState } from 'react';
import { emptyPublication, publicationApi, releaseIssues, downloadUrl, type AppRelease, type PublicationApi, type UpdatePublication } from '../../app-update/publication.ts';
import './ManagerAppUpdates.css';

const emptyRelease = (): AppRelease => ({ versionCode: 0, versionName: '', sha256: '', bytes: 0, notes: '', mirrors: [{ label: '', url: '' }] });
export function ManagerAppUpdates({ api = publicationApi }: { api?: PublicationApi }) {
  const [publication, setPublication] = useState<UpdatePublication>(emptyPublication);
  const [release, setRelease] = useState<AppRelease>(emptyRelease);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(''), [failed, setFailed] = useState(false);
  const [review, setReview] = useState(false), [confirmed, setConfirmed] = useState(false);
  const form = useRef<HTMLFormElement>(null), saving = useRef(false);
  useEffect(() => {
    let alive = true;
    api.read().then(data => { if (alive) { setPublication(data); setRelease(data.release ?? emptyRelease()); } })
      .catch(error => { if (alive) { setFeedback(error instanceof Error ? error.message : 'Consulta indisponível.'); setFailed(true); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [api]);
  const issues = releaseIssues(release);
  if (!confirmed) issues.confirmed = 'Confirme que todos os espelhos contêm o mesmo APK público.';
  const change = <K extends keyof AppRelease>(key: K, value: AppRelease[K]) => {
    setRelease(old => ({ ...old, [key]: value })); setFeedback('');
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setReview(true);
    if (Object.keys(issues).length || loading || failed || saving.current) return;
    saving.current = true; setBusy(true); setFeedback('');
    try {
      const next = await api.save({ ...publication, release: { ...release, sha256: release.sha256.toLowerCase(), mirrors: release.mirrors.map(m => ({ label: m.label.trim(), url: downloadUrl(m.url) })) } });
      setPublication(next); setRelease(next.release ?? emptyRelease()); setReview(false);
      setFeedback(next.enabled ? 'Versão publicada. Os aparelhos consultarão a atualização no próximo ciclo diário.' : 'Configuração salva. A distribuição está desativada.');
    } catch (error) { setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const focus = (key: string) => form.current?.querySelector<HTMLElement>(`[data-update-field="${key}"]`)?.focus();
  const invalid = (key: string) => review && Boolean(issues[key]);
  return <section className="manager-updates">
    <h2>Atualizações do aplicativo</h2>
    <p>Publique uma versão Android e até cinco fontes de download. A ordem define qual fonte será tentada primeiro.</p>
    <p className="update-note">Consulta diária de versão; APK baixado diretamente do provedor. Use links públicos de download, sem login. Tizen e webOS precisam de pacotes próprios.</p>
    {feedback && <p role="status" className="update-feedback">{feedback}</p>}
    {loading ? <p>Consultando publicação…</p> : <form ref={form} onSubmit={save} noValidate>
      <fieldset disabled={busy || failed}><legend>Versão publicada</legend>
        <label className="update-check"><input type="checkbox" checked={publication.enabled} onChange={e => setPublication(old => ({ ...old, enabled: e.target.checked }))} /> Distribuição de atualização ativa</label>
        <div className="update-fields">{([
          ['versionCode', 'Código da versão (versionCode)', 'number'], ['versionName', 'Nome da versão', 'text'],
          ['sha256', 'SHA-256 do APK', 'text'], ['bytes', 'Tamanho exato do APK (bytes)', 'number'],
        ] as const).map(([key, label, type]) => <label key={key}>{label}
          <input data-update-field={key} type={type} value={release[key] || ''} aria-invalid={invalid(key)} min={type === 'number' ? 1 : undefined}
            onChange={e => change(key, (type === 'number' ? Number(e.target.value) : e.target.value) as never)} />
          {invalid(key) && <small className="update-error">{issues[key]}</small>}
        </label>)}</div>
        <label>O que mudou nesta versão<textarea data-update-field="notes" value={release.notes} maxLength={1000} onChange={e => change('notes', e.target.value)} /></label>
        <p>O código deve ser maior que o instalado. Gere o hash e o tamanho a partir do APK final assinado; mantenha a assinatura do aplicativo existente.</p>
      </fieldset>
      <fieldset disabled={busy || failed}><legend>Fontes de download por prioridade</legend>
        <div className="update-mirror-table"><table><thead><tr><th>Prioridade</th><th>Nome da fonte</th><th>URL de download</th><th>Ordem / ações</th></tr></thead><tbody>
          {release.mirrors.map((mirror, index) => <tr key={index}><td data-label="Prioridade">{index + 1}</td>
            <td data-label="Nome da fonte"><input aria-label={`Nome da fonte ${index + 1}`} value={mirror.label} aria-invalid={invalid(`mirror-${index}`)} onChange={e => change('mirrors', release.mirrors.map((m, i) => i === index ? { ...m, label: e.target.value } : m))} /></td>
            <td data-label="URL de download"><input data-update-field={`mirror-${index}`} type="url" aria-label={`URL da fonte ${index + 1}`} placeholder="https://…" value={mirror.url} aria-invalid={invalid(`mirror-${index}`)} onChange={e => change('mirrors', release.mirrors.map((m, i) => i === index ? { ...m, url: e.target.value } : m))} />{invalid(`mirror-${index}`) && <small className="update-error">{issues[`mirror-${index}`]}</small>}</td>
            <td data-label="Ordem / ações"><div className="update-actions"><button type="button" disabled={index === 0} aria-label={`Subir fonte ${index + 1}`} onClick={() => { const list = [...release.mirrors]; [list[index - 1], list[index]] = [list[index], list[index - 1]]; change('mirrors', list); }}>↑</button>
              <button type="button" disabled={index === release.mirrors.length - 1} aria-label={`Descer fonte ${index + 1}`} onClick={() => { const list = [...release.mirrors]; [list[index + 1], list[index]] = [list[index], list[index + 1]]; change('mirrors', list); }}>↓</button>
              <button type="button" disabled={release.mirrors.length === 1} onClick={() => change('mirrors', release.mirrors.filter((_, i) => i !== index))}>Remover</button></div></td>
          </tr>)}
        </tbody></table></div>
        <button type="button" disabled={release.mirrors.length >= 5} onClick={() => change('mirrors', [...release.mirrors, { label: '', url: '' }])}>Adicionar fonte</button>
        <p>Dropbox: o link será convertido para download direto. Se uma fonte falhar ou devolver um arquivo diferente, o aparelho tentará a próxima.</p>
        <label className="update-check"><input data-update-field="confirmed" type="checkbox" checked={confirmed} aria-invalid={invalid('confirmed')} onChange={e => setConfirmed(e.target.checked)} /> Conferi que todas as fontes contêm o mesmo APK público desta versão.</label>
      </fieldset>
      {review && Object.keys(issues).length > 0 && <div className="update-pending" role="alert"><strong>Revise os campos para salvar:</strong><ul>{Object.entries(issues).map(([key, message]) => <li key={key}><button type="button" onClick={() => focus(key)}>{message}</button></li>)}</ul></div>}
      <div className="update-save"><button type="submit" disabled={busy || failed}>{busy ? 'Salvando…' : 'Salvar publicação'}</button><span>As mudanças só serão aplicadas após salvar.</span></div>
    </form>}
  </section>;
}
