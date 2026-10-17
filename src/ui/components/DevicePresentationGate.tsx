import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { DEVICE_PRESENTATION_OPEN, devicePresentationStore, devicePresentationModels, requiresDevicePresentation, type DevicePresentation, type DevicePresentationModel } from '../device-presentation.ts';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import './DevicePresentationGate.css';

const choices: { type: DevicePresentation; title: string; description: string }[] = [
  { type: 'PHONE', title: 'Celular', description: 'Tela de celular com navegação por toque.' },
  { type: 'TABLET', title: 'Tablet', description: 'Tela ampla com navegação por toque.' },
  { type: 'TV', title: 'TV / Android TV', description: 'Fire Stick, Android TV, TV Box, Samsung ou LG.' },
];

export function DevicePresentationGate({ children }: { children: React.ReactNode }) {
  const choice = useDevicePresentation();
  const required = requiresDevicePresentation(Capacitor.isNativePlatform(), Capacitor.getPlatform(), choice);
  const [editing, setEditing] = useState(false);
  const [group, setGroup] = useState<DevicePresentation | null>(null);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const lastGroup = useRef<DevicePresentation | null>(null);
  const model = devicePresentationStore.readModel();
  const open = required || editing;
  useLayoutEffect(() => {
    if (choice) document.documentElement.dataset.devicePresentation = choice.toLowerCase();
    else delete document.documentElement.dataset.devicePresentation;
    if (model) document.documentElement.dataset.deviceModel = model.toLowerCase();
    else delete document.documentElement.dataset.deviceModel;
  }, [choice, model]);
  useEffect(() => {
    const show = () => { setGroup(null); lastGroup.current = null; setError(''); setEditing(true); };
    window.addEventListener(DEVICE_PRESENTATION_OPEN, show);
    return () => window.removeEventListener(DEVICE_PRESENTATION_OPEN, show);
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    const scope = dialog.current;
    if (!scope) return;
    const previous = document.activeElement;
    const buttons = () => Array.from(scope.querySelectorAll<HTMLButtonElement>('button'));
    scope.scrollTop = 0;
    const returning = !group && lastGroup.current ? scope.querySelector<HTMLButtonElement>(`[data-device-group="${lastGroup.current}"]`) : null;
    (returning || scope.querySelector<HTMLButtonElement>('[aria-pressed="true"]') || buttons()[0])?.focus();
    const keepFocus = (event: FocusEvent) => { if (!scope.contains(event.target as Node)) buttons()[0]?.focus(); };
    const back = () => { setError(''); if (group) setGroup(null); else if (!required) setEditing(false); };
    const nativeBack = (event: Event) => { event.preventDefault(); event.stopImmediatePropagation(); back(); };
    const keyboard = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Escape', 'Backspace', 'BrowserBack', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (['Escape', 'Backspace', 'BrowserBack'].includes(event.key)) { back(); return; }
      const controls = buttons(), index = controls.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Enter' || event.key === ' ') { if (!event.repeat) controls[index]?.click(); return; }
      if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && controls[index]?.classList.contains('device-presentation-choice')) {
        const grid = scope.querySelector<HTMLElement>('.device-presentation-choices');
        const cards = controls.filter(button => button.classList.contains('device-presentation-choice'));
        const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length : 1;
        const next = cards.indexOf(controls[index]) + (event.key === 'ArrowUp' ? -columns : columns);
        (cards[next] || (event.key === 'ArrowDown' ? controls[cards.length] : null) || controls[index])?.focus();
        return;
      }
      const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey);
      controls[(Math.max(0, index) + (backward ? -1 : 1) + controls.length) % controls.length]?.focus();
    };
    window.addEventListener('keydown', keyboard, true);
    window.addEventListener('xandeflix:device-presentation-back', nativeBack);
    document.addEventListener('focusin', keepFocus, true);
    return () => {
      window.removeEventListener('keydown', keyboard, true);
      window.removeEventListener('xandeflix:device-presentation-back', nativeBack);
      document.removeEventListener('focusin', keepFocus, true);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, required, group]);
  const select = (model: DevicePresentationModel) => {
    try { devicePresentationStore.selectModel(model); setError(''); setGroup(null); setEditing(false); }
    catch { setError('Não foi possível salvar sua escolha neste aparelho. Tente novamente.'); }
  };
  const chooseGroup = (type: DevicePresentation) => {
    if (type === 'TABLET') { select('TABLET'); return; }
    lastGroup.current = type; setError(''); setGroup(type);
  };
  const items = group
    ? (Object.entries(devicePresentationModels) as [DevicePresentationModel, (typeof devicePresentationModels)[DevicePresentationModel]][])
      .filter(([, item]) => item.type === group).map(([model, item]) => ({ ...item, model }))
    : choices.map(item => ({ ...item, model: undefined }));
  return <>
    {!required && children}
    {open && <div className="device-presentation-overlay">
      <div ref={dialog} className={`device-presentation-dialog modal-content${group ? ' device-presentation-dialog--models' : ''}`} role="dialog" aria-modal="true" aria-labelledby="device-presentation-title" aria-describedby="device-presentation-description">
        <p className="device-presentation-brand">XANDEFLIX</p>
        <h1 id="device-presentation-title">{group === 'PHONE' ? 'Qual é o seu celular?' : group === 'TV' ? 'Qual é o seu dispositivo de TV?' : required ? 'Em qual aparelho você vai assistir?' : 'Configurações da tela'}</h1>
        <p id="device-presentation-description">{group ? 'Escolha o seu dispositivo para concluir a configuração da tela.' : 'Escolha o tipo de aparelho para preparar a tela ideal para você.'}</p>
        <div className={`device-presentation-choices${group ? ' device-presentation-choices--models' : ''}`}>
          {items.map(item => <button key={item.model || item.type} type="button" className="focusable-item device-presentation-choice" data-device-group={group ? undefined : item.type} data-device-model={item.model} aria-pressed={group ? model === item.model : choice === item.type} onClick={() => item.model ? select(item.model) : chooseGroup(item.type)}>
            <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              {item.type === 'TV' ? <><rect x="3" y="8" width="42" height="28" rx="3" /><path d="M16 42h16M24 36v6" /></> : item.model === 'FOLDABLE' ? <><rect x="5" y="5" width="38" height="38" rx="4" /><path d="M24 5v38" /></> : <><rect x={item.type === 'PHONE' ? 13 : 6} y="3" width={item.type === 'PHONE' ? 22 : 36} height="42" rx="4" /><path d="M21 39h6" /></>}
            </svg>
            <strong>{item.title}</strong><span>{item.description}</span>
          </button>)}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="device-presentation-actions">
          {group && <button type="button" className="focusable-item btn-secondary" onClick={() => { setError(''); setGroup(null); }}>Voltar</button>}
          {!required && <button type="button" className="focusable-item btn-secondary" onClick={() => { setError(''); setGroup(null); setEditing(false); }}>Cancelar</button>}
        </div>
        <p className="device-presentation-help">Você pode mudar depois em “Configurações”.</p>
      </div>
    </div>}
  </>;
}
