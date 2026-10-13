import { useCallback, useEffect, useRef, useState } from 'react';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { playHeroItem } from '../../playback/hero-playback.ts';

export function useHeroPlayback(model: CatalogReadModel) {
  const [playbackBusy, setBusy] = useState(false);
  const [playbackMessage, setMessage] = useState<string | null>(null);
  const pending = useRef(false), generation = useRef(0);
  useEffect(() => {
    ++generation.current; pending.current = false; setBusy(false); setMessage(null);
    return () => { ++generation.current; };
  }, [model]);
  const onPlay = useCallback(async (item: CatalogItemViewModel) => {
    if (pending.current) return;
    const current = generation.current;
    const active = () => current === generation.current;
    pending.current = true; setBusy(true); setMessage('Preparando reprodução…');
    try {
      const result = await playHeroItem(item, model, active);
      if (!active()) return;
      setMessage(!result || result.state === 'NATIVE_PLAYER_OPENED' ? null
        : result.state === 'NATIVE_PLAYER_UNAVAILABLE' ? 'Player nativo Android indisponível no navegador web.'
          : result.errorMessage || 'Não foi possível iniciar a reprodução. Tente novamente.');
    } catch {
      if (active()) setMessage('Não foi possível preparar este título. Verifique a disponibilidade e tente novamente.');
    } finally {
      if (active()) { pending.current = false; setBusy(false); }
    }
  }, [model]);
  return { onPlay, playbackBusy, playbackMessage };
}
