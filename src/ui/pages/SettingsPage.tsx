import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import { devicePresentationModels, getDevicePresentationModel, openDevicePresentation } from '../device-presentation.ts';
import './SettingsPage.css';
import { AppUpdateSettings } from '../../app-update/AppUpdateSettings.tsx';
import { ActiveSourceSettings } from '../components/ActiveSourceSettings.tsx';
import { openSettingsDestination, openSettingsWindow } from '../settings/settings-window.ts';
import { WebPinSettings } from '../../web-production/WebPinSettings.tsx';
import { isPublicConsumerWeb } from '../../web-production/session-context.ts';

const labels = { PHONE: 'Celular', TABLET: 'Tablet', TV: 'TV' };

function SettingsOption({ title, description, children, mountOnOpen = false }: { title: string; description: string; children: ReactNode; mountOnOpen?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const cleanup = useRef<(() => void) | undefined>(), titleId = useId();
  const [contentOpen, setContentOpen] = useState(false);
  useEffect(() => () => cleanup.current?.(), []);
  return <div className="settings-option">
    <button ref={trigger} type="button" className="focusable-item settings-option-summary" aria-haspopup="dialog" onClick={() => {
      if (!dialog.current || !trigger.current) return;
      if (mountOnOpen) setContentOpen(true);
      cleanup.current?.(); cleanup.current = openSettingsWindow(dialog.current, trigger.current);
    }}>
      <span className="settings-option-copy"><span className="settings-option-title">{title}</span><span className="settings-option-description">{description}</span></span>
      <span className="settings-option-chevron" aria-hidden="true">›</span>
    </button>
    <dialog ref={dialog} data-settings-modal className="settings-window" aria-labelledby={titleId}
      onClose={() => { if (mountOnOpen) setContentOpen(false); }} onCancel={event => { event.preventDefault(); event.currentTarget.close(); }}>
      <div className="settings-window-header"><h2 id={titleId}>{title}</h2>
        <button type="button" className="focusable-item settings-window-close btn-secondary" data-settings-close onClick={() => dialog.current?.close()}>Fechar</button>
      </div>
      <div className="settings-window-body">{!mountOnOpen || contentOpen ? children : null}</div>
    </dialog>
  </div>;
}

export function SettingsPage({ onOpenActivation, onOpenParental, onOpenAdult }: { onOpenActivation: () => void; onOpenParental?: () => void; onOpenAdult?: () => void }) {
  const choice = useDevicePresentation();
  const model = getDevicePresentationModel();
  return <main className="settings-page">
    <div className="page-header"><h1 className="page-title">Configurações</h1><p className="page-subtitle">Personalize sua experiência neste aparelho.</p></div>
    <div className="settings-sections">
      <SettingsOption title="Atualizações do aplicativo" description="Consulte e instale novas versões.">
        <AppUpdateSettings />
      </SettingsOption>
      <SettingsOption title="Fonte e catálogo" description="Confira a fonte ativa e atualize o catálogo.">
        <ActiveSourceSettings onOpenAdult={onOpenAdult ? () => openSettingsDestination(onOpenAdult) : undefined}/>
      </SettingsOption>
      <SettingsOption title="Controle parental" description="Gerencie PIN, PUK e restrições de conteúdo.">
      <section className="settings-section" aria-labelledby="settings-parental">
        <h2 id="settings-parental">Controle parental</h2><p>Defina PIN, PUK, classificações permitidas e restrições de conteúdos neste aparelho.</p>
        <button className="focusable-item btn-secondary" type="button" onClick={() => openSettingsDestination(onOpenParental)}>Abrir controle parental</button>
      </section>
      </SettingsOption>
      {!isPublicConsumerWeb() && <SettingsOption title="PIN web" description="Crie o acesso ao navegador e recupere seu PIN com o PUK." mountOnOpen>
        <WebPinSettings />
      </SettingsOption>}
      <SettingsOption title="Tela e dispositivo" description="Escolha o tipo de dispositivo e a interface.">
      <section className="settings-section" aria-labelledby="settings-display">
        <h2 id="settings-display">Tela e dispositivo</h2>
        <p>Escolha a interface adequada para usar com toque ou controle remoto.</p>
        <p>Tipo de dispositivo: <strong>{model ? devicePresentationModels[model].title : choice ? labels[choice] : 'Automático'}</strong></p>
        <button className="focusable-item btn-primary" type="button" onClick={() => openSettingsDestination(openDevicePresentation)}>Alterar tipo de dispositivo</button>
      </section>
      </SettingsOption>
      <SettingsOption title="Ativação" description="Consulte o código e o status deste aparelho.">
      <section className="settings-section" aria-labelledby="settings-activation">
        <h2 id="settings-activation">Ativação</h2>
        <p>Consulte o Código ID, a chave e a situação da ativação deste aparelho.</p>
        <button className="focusable-item btn-secondary" type="button" onClick={() => openSettingsDestination(onOpenActivation)}>Ver dados de ativação</button>
      </section>
      </SettingsOption>
    </div>
    <p className="settings-credits">Dados de plataformas: JustWatch · TMDB. Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.</p>
  </main>;
}
