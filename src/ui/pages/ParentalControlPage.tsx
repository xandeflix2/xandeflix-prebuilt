import { useEffect, useRef, useState } from 'react';
import { PARENTAL_AGES, parentalControl, validateParentalPin, validateParentalPuk } from '../../parental/parental-control.store.ts';
import { parentalErrorMessage } from '../../parental/parental-access.ts';
import { parentalLiveKey, parentalViewKey } from '../../parental/parental-content.ts';
import { movieToViewModel, seriesToViewModel } from '../../catalog/catalog-selectors.ts';
import type { CatalogReadModel } from '../../catalog/catalog-read-model.ts';
import type { CatalogItemViewModel } from '../../catalog/catalog-view-model.ts';
import { LiveCatalogService } from '../../catalog/live/live-catalog.service.ts';
import { useParentalControl } from '../hooks/useParentalControl.ts';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import { isTelevisionPresentation } from '../device-presentation.ts';
import { parentalEntry } from '../parental-dpad-navigation.ts';
import { SearchPage } from './SearchPage.tsx';
import './SettingsPage.css';
import './ParentalControlPage.css';

const ages = PARENTAL_AGES.map(age => <option key={age} value={age}>{age === 0 ? 'Livre' : `${age} anos`}</option>);
function AgeField({ label, value, onChange, television }: { label: string; value: number; onChange: (age: number) => void; television: boolean }) {
  return television ? <div className="parental-age-field"><span>{label}</span><div className="parental-age-options" role="radiogroup" aria-label={label}>
    {PARENTAL_AGES.map(age => <button key={age} className="focusable-item" type="button" role="radio" aria-checked={value === age} tabIndex={value === age ? 0 : -1} onClick={() => onChange(age)}>{age === 0 ? 'Livre' : `${age} anos`}</button>)}
  </div></div> : <label>{label}<select className="focusable-item" value={value} onChange={e => onChange(Number(e.target.value))}>{ages}</select></label>;
}
type Selection = { key: string; title: string; poster?: string };
export function ParentalControlPage({ readModel }: { readModel: CatalogReadModel | null; onBack: () => void }) {
  const state = useParentalControl();
  const choice = useDevicePresentation();
  const television = isTelevisionPresentation(navigator.userAgent, choice);
  const pageRef = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<'main' | 'recover' | 'pin' | 'puk' | 'search' | 'rule'>('main');
  const [pin, setPin] = useState(''), [confirmPin, setConfirmPin] = useState(''), [puk, setPuk] = useState(''), [confirmPuk, setConfirmPuk] = useState(''), [currentPuk, setCurrentPuk] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [savedPuk, setSavedPuk] = useState(false), [maxAge, setMaxAge] = useState(16), [allowAdult, setAllowAdult] = useState(false);
  const [message, setMessage] = useState(''), [selection, setSelection] = useState<Selection>(), [ruleAge, setRuleAge] = useState(18), [alwaysPin, setAlwaysPin] = useState(false), [ruleAdult, setRuleAdult] = useState(false);
  const clearSecrets = () => { setPin(''); setCurrentPin(''); setConfirmPin(''); setPuk(''); setConfirmPuk(''); setCurrentPuk(''); setSavedPuk(false); };
  useEffect(() => {
    if (!television || state.busy) return;
    const frame = requestAnimationFrame(() => {
      const first = pageRef.current && parentalEntry(pageRef.current);
      first?.focus({ preventScroll: true });
      first?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    });
    return () => cancelAnimationFrame(frame);
  }, [television, mode, state.status, state.admin, state.busy]);
  useEffect(() => { setMaxAge(state.policy.maxAge === 18 && state.status === 'unconfigured' ? 16 : state.policy.maxAge); setAllowAdult(state.policy.allowAdult); }, [state.policy.maxAge, state.policy.allowAdult, state.status]);
  useEffect(() => () => { parentalControl.closeAdministration(); }, []);
  const run = async (operation: () => Promise<void>) => { setMessage(''); try { await operation(); } catch (e) { setMessage(parentalErrorMessage(e)); } };
  const samePin = validateParentalPin(pin) && pin === confirmPin;
  const samePuk = validateParentalPuk(puk) && puk === confirmPuk;
  const pinFields = <div className="parental-fields"><label>Novo PIN (6 dígitos)<input type="password" inputMode="numeric" autoComplete="new-password" className="focusable-item" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}/></label>
    <label>Confirmar novo PIN<input type="password" inputMode="numeric" autoComplete="new-password" className="focusable-item" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}/></label></div>;
  const pukFields = <><p>Use de 16 a 64 caracteres. O PUK diferencia maiúsculas de minúsculas. Guarde uma cópia fora deste aparelho.</p>
    <div className="parental-fields"><label>Novo PUK<input type="password" autoComplete="new-password" className="focusable-item" maxLength={64} value={puk} onChange={e => { setPuk(e.target.value); setSavedPuk(false); }}/></label>
      <label>Confirmar novo PUK<input type="password" autoComplete="new-password" className="focusable-item" maxLength={64} value={confirmPuk} onChange={e => setConfirmPuk(e.target.value)}/></label></div>
    <button type="button" className="focusable-item btn-secondary" onClick={() => { try { const generated = parentalControl.generatePuk(); setPuk(generated); setConfirmPuk(generated); setSavedPuk(false); setMessage('PUK gerado. Confira e guarde uma cópia antes de salvar.'); } catch (e) { setMessage(parentalErrorMessage(e)); } }}>Gerar sugestão de PUK</button>
    {puk && <details><summary className="focusable-item">Conferir o novo PUK antes de salvar</summary><p style={{ overflowWrap: 'anywhere', userSelect: 'text' }}>{puk}</p></details>}
    <label className="parental-check"><input className="focusable-item" type="checkbox" checked={savedPuk} onChange={e => setSavedPuk(e.target.checked)}/>Guardei o novo PUK em um local seguro.</label></>;
  const policyFields = <><AgeField label="Classificação máxima exibida" value={maxAge} onChange={setMaxAge} television={television}/>
    <p>Conteúdos acima deste limite ficam ocultos, inclusive na busca e nos favoritos. As faixas menores também são permitidas. Conteúdos sem classificação continuam visíveis e exigem PIN para abrir ou assistir.</p>
    <label className="parental-check"><input className="focusable-item" type="checkbox" checked={allowAdult} onChange={e => setAllowAdult(e.target.checked)}/>Permitir desbloqueio de conteúdo adulto explícito com PIN.</label>
    <p>Conteúdo adulto explícito exige limite de 18 anos, esta opção habilitada e uma sessão desbloqueada por PIN. Sem essas condições, permanece oculto.</p></>;
  const choose = (value: Selection) => { const rule = parentalControl.rule(value.key); setSelection(value); setRuleAge(rule?.minAge ?? 18); setAlwaysPin(rule?.alwaysPin ?? false); setRuleAdult(rule?.adult ?? false); setMode('rule'); setMessage(''); };
  const chooseItem = (item: CatalogItemViewModel) => void run(async () => {
    if (!readModel) throw new Error('UNAVAILABLE');
    const movie = item.kind === 'movie' ? await readModel.resolveMovieById(item.id) : undefined;
    const series = item.kind === 'series' ? await readModel.resolveSeriesById(item.id) : undefined;
    const current = movie ? movieToViewModel(readModel, movie) : series ? seriesToViewModel(readModel, series) : undefined;
    if (!current || !parentalControl.getSnapshot().admin) throw new Error('PARENTAL_PIN_REQUIRED');
    choose({ key: parentalViewKey(current), title: current.title, poster: current.posterUri });
  });
  useEffect(() => {
    const event = (e: Event) => { if (mode !== 'main') { e.preventDefault(); clearSecrets(); setMode('main'); setMessage(''); } };
    window.addEventListener('xandeflix:parental-back', event);
    return () => window.removeEventListener('xandeflix:parental-back', event);
  }, [mode]);
  return <main ref={pageRef} className="settings-page parental-page" onSubmitCapture={e => {
    if (television && document.activeElement instanceof HTMLInputElement) { e.preventDefault(); e.stopPropagation(); }
  }}><h1>Controle parental</h1>
    <p>PIN, PUK e preferências ficam somente neste aparelho e não são enviados ao gestor ou ao servidor.</p>
    {television && <p className="parental-remote-help">↑ ↓ Campos · ← → Classificação · OK Selecionar / editar · Voltar Tela anterior</p>}
    {message && <p role="alert">{message}</p>}
    {state.status === 'loading' ? <p role="status">Lendo proteção local…</p> : state.status === 'error' ? <p role="alert">Não foi possível ler a proteção local. O acesso restrito está bloqueado. Nenhuma chave será recriada automaticamente.</p>
      : <fieldset className="parental-panel" disabled={state.busy}>
        {state.status === 'unconfigured' ? <form onSubmit={e => { e.preventDefault(); void run(async () => { await parentalControl.configure(pin, puk, { maxAge, allowAdult }); clearSecrets(); setMessage('Controle parental configurado.'); }); }}>
          <h2>Criar PIN e PUK</h2><p>Este PIN é diferente da chave de ativação do aplicativo. O PUK permite cadastrar um novo PIN se você o esquecer.</p>
          {pinFields}{pukFields}{policyFields}
          <button type="submit" className="focusable-item btn-primary" disabled={!samePin || !samePuk || !savedPuk}>{state.busy ? 'Salvando…' : 'Criar controle parental'}</button>
        </form> : mode === 'recover' ? <form onSubmit={e => { e.preventDefault(); void run(async () => { const ok = await parentalControl.recoverPin(currentPuk, pin); clearSecrets(); if (ok) { setMode('main'); setMessage('Novo PIN salvo. Entre com ele para ajustar o controle.'); } else setMessage('PUK incorreto.'); }); }}>
          <h2>Recuperar PIN com PUK</h2><label>PUK atual<input type="password" autoComplete="off" className="focusable-item" maxLength={64} value={currentPuk} onChange={e => setCurrentPuk(e.target.value)}/></label>{pinFields}
          <p>Sem o PUK não há recuperação pelo gestor ou pela chave de ativação. Será necessária uma instalação limpa com nova ativação; atualizar o APK não remove o controle.</p>
          <button type="submit" className="focusable-item btn-primary" disabled={!samePin || !validateParentalPuk(currentPuk)}>Salvar novo PIN</button>
        </form> : !state.admin ? <form onSubmit={e => { e.preventDefault(); void run(async () => { const ok = await parentalControl.authenticate(pin); setPin(''); if (!ok) setMessage('PIN incorreto.'); }); }}>
          <h2>Acesso do responsável</h2><label>PIN<input type="password" inputMode="numeric" autoComplete="off" className="focusable-item" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}/></label>
          <button type="submit" className="focusable-item btn-primary" disabled={!validateParentalPin(pin)}>{state.busy ? 'Verificando…' : 'Entrar'}</button>
          <button type="button" className="focusable-item btn-secondary" onClick={() => { clearSecrets(); setMode('recover'); }}>Esqueci o PIN</button>
        </form> : mode === 'search' && readModel ? <><h2>Escolher conteúdo para restringir</h2><p>Selecione a capa para editar a regra. Nenhum vídeo será iniciado.</p>
          <SearchPage readModel={readModel} parentalEditor onSelectItem={chooseItem} onSelectLive={id => void run(async () => {
            const found = await LiveCatalogService.loadChannelById(id, { parentalEditor: true }); if (!found) throw new Error('UNAVAILABLE');
            choose({ key: parentalLiveKey(found.channel), title: found.channel.name, poster: found.channel.logoUrl || found.channel.posterUri });
          })}/></> : mode === 'rule' && selection ? <form onSubmit={e => { e.preventDefault(); void run(async () => { await parentalControl.setRule({ key: selection.key, minAge: ruleAge, alwaysPin, adult: ruleAdult }); setMessage('Restrição salva somente neste aparelho.'); setMode('main'); }); }}>
          <h2>Restrição deste conteúdo</h2><div className="parental-rule-preview">{selection.poster && <img src={selection.poster} alt="Capa selecionada"/>}<h3>{selection.title}</h3></div>
          <AgeField label="Classificação mínima" value={ruleAge} onChange={setRuleAge} television={television}/>
          <label className="parental-check"><input className="focusable-item" type="checkbox" checked={alwaysPin} onChange={e => setAlwaysPin(e.target.checked)}/>Sempre exigir PIN para este conteúdo.</label>
          <label className="parental-check"><input className="focusable-item" type="checkbox" checked={ruleAdult} onChange={e => setRuleAdult(e.target.checked)}/>Marcar como adulto explícito e ocultar sem desbloqueio.</label>
          <p>A regra manual aumenta a proteção e não reduz uma classificação conhecida da fonte ou do TMDB.</p>
          <div className="parental-actions"><button className="focusable-item btn-primary" type="submit">Salvar restrição</button><button className="focusable-item btn-secondary" type="button" onClick={() => void run(async () => { await parentalControl.removeRule(selection.key); setMode('main'); setMessage('Regra manual removida. A classificação original continua valendo.'); })}>Remover regra manual</button></div>
        </form> : mode === 'pin' ? <form onSubmit={e => { e.preventDefault(); void run(async () => { const ok = await parentalControl.changePin(currentPin, pin); clearSecrets(); if (ok) { setMode('main'); setMessage('PIN alterado. Entre novamente.'); } else setMessage('PIN atual incorreto.'); }); }}><h2>Alterar PIN</h2><label>PIN atual<input className="focusable-item" type="password" inputMode="numeric" autoComplete="off" value={currentPin} maxLength={6} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}/></label>{pinFields}<button className="focusable-item btn-primary" type="submit" disabled={!samePin || !validateParentalPin(currentPin)}>Salvar PIN</button></form>
          : mode === 'puk' ? <form onSubmit={e => { e.preventDefault(); void run(async () => { const ok = await parentalControl.changePuk(currentPuk, puk); clearSecrets(); if (ok) { setMode('main'); setMessage('PUK alterado. O PUK anterior não funciona mais.'); } else setMessage('PUK atual incorreto.'); }); }}>
            <h2>Alterar PUK</h2><label>PUK atual<input className="focusable-item" type="password" autoComplete="off" value={currentPuk} maxLength={64} onChange={e => setCurrentPuk(e.target.value)}/></label>{pukFields}
            <button className="focusable-item btn-primary" type="submit" disabled={!samePuk || !savedPuk || !validateParentalPuk(currentPuk)}>Salvar PUK</button>
          </form> : <><form onSubmit={e => { e.preventDefault(); void run(async () => { await parentalControl.updatePolicy({ maxAge, allowAdult }); setMessage('Preferências salvas neste aparelho.'); }); }}><h2>Classificações permitidas</h2>{policyFields}<button className="focusable-item btn-primary" type="submit">Salvar preferências</button></form>
            <div className="parental-actions"><button className="focusable-item btn-secondary" type="button" disabled={!readModel} onClick={() => setMode('search')}>Buscar e restringir conteúdo ({parentalControl.rules().length}/256)</button>
              <button className="focusable-item btn-secondary" type="button" onClick={() => { clearSecrets(); setMode('pin'); }}>Alterar PIN</button><button className="focusable-item btn-secondary" type="button" onClick={() => { clearSecrets(); setMode('puk'); }}>Alterar PUK</button></div>
            {state.policy.allowAdult && state.policy.maxAge === 18 && <form onSubmit={e => { e.preventDefault(); void run(async () => { const ok = await parentalControl.unlockAdult(pin); setPin(''); setMessage(ok ? 'Navegação adulta liberada por até 15 minutos. Cada título continua protegido pelo PIN.' : 'PIN incorreto.'); }); }}><h2>Navegação de conteúdo adulto</h2><label>PIN para liberar sessão<input className="focusable-item" type="password" inputMode="numeric" maxLength={6} autoComplete="off" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))}/></label><button type="submit" className="focusable-item btn-secondary" disabled={!validateParentalPin(pin)}>Liberar por 15 minutos</button></form>}
            <div className="parental-actions"><button className="focusable-item btn-secondary" type="button" onClick={() => { parentalControl.lock(); clearSecrets(); setMessage('Conteúdo restrito bloqueado.'); }}>Bloquear conteúdo restrito agora</button></div>
          </>}
      </fieldset>}
  </main>;
}
