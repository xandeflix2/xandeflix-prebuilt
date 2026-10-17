import { useDevicePresentation } from '../hooks/useDevicePresentation.ts';
import { devicePresentationModels, getDevicePresentationModel, openDevicePresentation } from '../device-presentation.ts';
import './SettingsPage.css';
import { AppUpdateSettings } from '../../app-update/AppUpdateSettings.tsx';

const labels = { PHONE: 'Celular', TABLET: 'Tablet', TV: 'TV' };

export function SettingsPage({ onOpenActivation, onOpenParental }: { onOpenActivation: () => void; onOpenParental?: () => void }) {
  const choice = useDevicePresentation();
  const model = getDevicePresentationModel();
  return <main className="settings-page">
    <div className="page-header"><h1 className="page-title">Configurações</h1><p className="page-subtitle">Personalize sua experiência neste aparelho.</p></div>
    <div className="settings-sections">
      <AppUpdateSettings />
      <section className="settings-section" aria-labelledby="settings-parental">
        <h2 id="settings-parental">Controle parental</h2><p>Defina PIN, PUK, classificações permitidas e restrições de conteúdos neste aparelho.</p>
        <button className="focusable-item btn-secondary" type="button" onClick={onOpenParental}>Abrir controle parental</button>
      </section>
      <section className="settings-section" aria-labelledby="settings-display">
        <h2 id="settings-display">Tela e dispositivo</h2>
        <p>Escolha a interface adequada para usar com toque ou controle remoto.</p>
        <p>Tipo de dispositivo: <strong>{model ? devicePresentationModels[model].title : choice ? labels[choice] : 'Automático'}</strong></p>
        <button className="focusable-item btn-primary" type="button" onClick={openDevicePresentation}>Alterar tipo de dispositivo</button>
      </section>
      <section className="settings-section" aria-labelledby="settings-activation">
        <h2 id="settings-activation">Ativação</h2>
        <p>Consulte o Código ID, a chave e a situação da ativação deste aparelho.</p>
        <button className="focusable-item btn-secondary" type="button" onClick={onOpenActivation}>Ver dados de ativação</button>
      </section>
    </div>
    <p className="settings-credits">Dados de plataformas: JustWatch · TMDB. Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.</p>
  </main>;
}
