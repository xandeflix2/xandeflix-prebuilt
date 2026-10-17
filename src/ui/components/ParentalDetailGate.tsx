import React, { useEffect, useState } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import { authorizeParentalItem, parentalErrorMessage } from '../../parental/parental-access.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { parentalControl } from '../../parental/parental-control.store.ts';
import { parentalItemAge } from '../../parental/parental-content.ts';

export function ParentalDetailGate({ kind, itemId, readModel, children, onBack }: {
  kind: 'movie' | 'series'; itemId: string; readModel: CatalogReadModel; children: React.ReactNode; onBack: () => void;
}) {
  const parental = useParentalControl();
  const movie = kind === 'movie' ? readModel.moviesById.get(itemId) : undefined;
  const series = kind === 'series' ? readModel.seriesById.get(itemId) : undefined;
  const age = movie ? parentalItemAge(movieToViewModel(readModel, movie)) : series ? parentalItemAge(seriesToViewModel(readModel, series)) : undefined;
  const selection = `${readModel.catalog.metadata.snapshotId}:${kind}:${itemId}:${parental.lockRevision}:${parental.contentRevision}:${parental.grantRevision}:${parental.adultSession}:${age}`;
  const [state, setState] = useState<{ selection: string; allowed: boolean; message: string }>(), [attempt, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState(undefined);
    if (document.hidden) return;
    void (async () => {
      const movie = kind === 'movie' ? await readModel.resolveMovieById(itemId) : undefined;
      const series = kind === 'series' ? await readModel.resolveSeriesById(itemId) : undefined;
      if (!active) return;
      const item = movie ? movieToViewModel(readModel, movie) : series ? seriesToViewModel(readModel, series) : undefined;
      if (!item) throw new Error('PARENTAL_CONTENT_UNAVAILABLE');
      const allowed = await authorizeParentalItem(item, readModel.catalog.metadata.snapshotId, controller.signal);
      if (active) setState({ selection, allowed, message: allowed ? '' : 'Conteúdo protegido pelo controle parental.' });
    })().catch(e => { if (active) setState({ selection, allowed: false, message: parentalErrorMessage(e) }); });
    return () => { active = false; controller.abort(); parentalControl.cancelPrompt(); };
  }, [readModel, kind, itemId, selection, attempt, parental.lockRevision, parental.contentRevision, parental.grantRevision, parental.adultSession]);
  useEffect(() => { const visible = () => { if (!document.hidden) retry(v => v + 1); }; document.addEventListener('visibilitychange', visible); return () => document.removeEventListener('visibilitychange', visible); }, []);
  if (state?.selection === selection && state.allowed) return <>{children}</>;
  return <main className="settings-page"><h1>Controle parental</h1><p role="status">{state?.selection === selection ? state.message : 'Verificando classificação…'}</p>
    {state?.selection === selection && <button className="focusable-item btn-primary" type="button" onClick={() => { setState(undefined); retry(v => v + 1); }}>Tentar novamente</button>}
    <button className="focusable-item btn-secondary" type="button" onClick={onBack}>Voltar</button></main>;
}
