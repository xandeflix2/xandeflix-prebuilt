import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { DEVICE_PRESENTATION_OPEN, devicePresentationStore, requiresDevicePresentation, type DevicePresentation } from '../device-presentation.ts';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import './DevicePresentationGate.css';

const choices: { type: DevicePresentation; title: string; description: string }[] = [
  { type: 'PHONE', title: 'Celular', description: 'Tela de celular com navegação por toque.' },
  { type: 'TABLET', title: 'Tablet', description: 'Tela ampla com navegação por toque.' },
  { type: 'TV', title: 'TV', description: 'Android TV, Mi Stick, Fire Stick ou TV Box com controle remoto.' },
];

export function DevicePresentationGate({ children }: { children: React.ReactNode }) {
  const choice = useDevicePresentation();
  const required = requiresDevicePresentation(Capacitor.isNativePlatform(), Capacitor.getPlatform(), choice);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const open = required || editing;
  useLayoutEffect(() => {
    if (choice) document.documentElement.dataset.devicePresentation = choice.toLowerCase();
    else delete document.documentElement.dataset.devicePresentation;
  }, [choice]);
  useEffect(() => {
    const show = () => { setError(''); setEditing(true); };
    window.addEventListener(DEVICE_PRESENTATION_OPEN, show);
    return () => window.removeEventListener(DEVICE_PRESENTATION_OPEN, show);
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    const scope = dialog.current;
    if (!scope) return;
    const previous = document.activeElement;
    const buttons = () => Array.from(scope.querySelectorAll<HTMLButtonElement>('button'));
    (scope.querySelector<HTMLButtonElement>('[aria-pressed="true"]') || buttons()[0])?.focus();
    const keepFocus = (event: FocusEvent) => { if (!scope.contains(event.target as Node)) buttons()[0]?.focus(); };
    const nativeBack = (event: Event) => { event.preventDefault(); if (!required) setEditing(false); };
    const keyboard = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Escape', 'Backspace', 'BrowserBack', 'Enter', ' '].includes(event.key)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (['Escape', 'Backspace', 'BrowserBack'].includes(event.key)) { if (!required) setEditing(false); return; }
      const controls = buttons(), index = controls.indexOf(document.activeElement as HTMLButtonElement);
      if (event.key === 'Enter' || event.key === ' ') { if (!event.repeat) controls[index]?.click(); return; }
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
  }, [open, required]);
  const select = (type: DevicePresentation) => {
    try { devicePresentationStore.select(type); setError(''); setEditing(false); }
    catch { setError('Não foi possível salvar sua escolha neste aparelho. Tente novamente.'); }
  };
  return <>
    {!required && children}
    {open && <div className="device-presentation-overlay">
      <div ref={dialog} className="device-presentation-dialog modal-content" role="dialog" aria-modal="true" aria-labelledby="device-presentation-title" aria-describedby="device-presentation-description">
        <p className="device-presentation-brand">XANDEFLIX</p>
        <h1 id="device-presentation-title">{required ? 'Em qual aparelho você vai assistir?' : 'Configurações da tela'}</h1>
        <p id="device-presentation-description">Escolha o tipo de aparelho para preparar a tela ideal para você.</p>
        <div className="device-presentation-choices">
          {choices.map(item => <button key={item.type} type="button" className="focusable-item device-presentation-choice" aria-pressed={choice === item.type} onClick={() => select(item.type)}>
            <svg viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              {item.type === 'TV' ? <><rect x="3" y="8" width="42" height="28" rx="3" /><path d="M16 42h16M24 36v6" /></> : <><rect x={item.type === 'PHONE' ? 13 : 6} y="3" width={item.type === 'PHONE' ? 22 : 36} height="42" rx="4" /><path d="M21 39h6" /></>}
            </svg>
            <strong>{item.title}</strong><span>{item.description}</span>
          </button>)}
        </div>
        {error && <p role="alert">{error}</p>}
        {!required && <button type="button" className="focusable-item btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>}
        <p className="device-presentation-help">Você pode mudar depois em “Configurações”.</p>
      </div>
    </div>}
  </>;
}
