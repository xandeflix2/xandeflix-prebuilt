import React, { useEffect, useRef, useState } from 'react';
import { getMultiDeviceContactService } from '../../control-plane/client/multi-device-contact.service.ts';

export const ManagerMultiDeviceContact: React.FC<{ sessionUserId?: string }> = ({ sessionUserId }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);
  const saveController = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; saveController.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!sessionUserId) return;
    const controller = new AbortController();
    setLoading(true);
    setCanEdit(false);
    setFeedback('');
    void getMultiDeviceContactService().readForMaster(controller.signal).then(contact => {
      if (controller.signal.aborted) return;
      setWhatsapp(contact.whatsapp);
      setCanEdit(true);
    }).catch(error => {
      if (controller.signal.aborted) return;
      setFeedback(error instanceof Error && error.message === 'MASTER_MANAGER_NOT_AUTHORIZED'
        ? 'Configuração disponível somente para usuários master.'
        : 'Não foi possível carregar o contato. Tente novamente.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [sessionUserId, attempt]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionUserId || !canEdit || saving) return;
    const controller = new AbortController();
    saveController.current = controller;
    setSaving(true);
    setFeedback('');
    try {
      const contact = await getMultiDeviceContactService().saveForMaster(whatsapp, controller.signal);
      if (!mounted.current || controller.signal.aborted) return;
      setWhatsapp(contact.whatsapp);
      setFeedback(contact.whatsapp ? 'WhatsApp salvo. O contato está disponível na tela de ativação dos dispositivos.' : 'Contato removido.');
    } catch (error) {
      if (!mounted.current || controller.signal.aborted) return;
      const code = error instanceof Error ? error.message : '';
      if (code === 'MASTER_MANAGER_NOT_AUTHORIZED') setCanEdit(false);
      setFeedback(code === 'INVALID_WHATSAPP'
        ? 'Informe o número internacional com DDI (8 a 15 dígitos), ou deixe vazio para remover.'
        : code === 'MASTER_MANAGER_NOT_AUTHORIZED' ? 'Sua sessão não permite alterar este contato. Entre como master.'
          : 'Não foi possível confirmar a gravação. Recarregue o contato antes de tentar novamente.');
    } finally {
      if (mounted.current && !controller.signal.aborted) setSaving(false);
      saveController.current = null;
    }
  };
  return (
    <section aria-labelledby="manager-multi-contact-title" style={{ backgroundColor: '#101624', padding: '1.5rem', borderRadius: 8, marginBottom: '1.5rem' }}>
      <h2 id="manager-multi-contact-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>WhatsApp para múltiplos dispositivos</h2>
      <p style={{ color: '#94a3b8', fontSize: '.9rem', margin: '.75rem 0' }}>Contato público do gerente de múltiplos acessos, exibido na tela de ativação. Somente usuários master podem alterá-lo.</p>
      {!sessionUserId ? <p>Entre com sua conta master para configurar o contato.</p> : loading ? <p role="status">Carregando contato...</p> : canEdit ? (
        <form onSubmit={event => { void save(event); }}>
          <label htmlFor="multi-device-whatsapp" style={{ display: 'block', marginBottom: '.4rem' }}>WhatsApp com DDI</label>
          <input id="multi-device-whatsapp" className="focusable-item" type="tel" inputMode="tel" autoComplete="tel"
            aria-describedby="multi-device-whatsapp-help" value={whatsapp} maxLength={32} disabled={saving}
            onChange={event => setWhatsapp(event.target.value)}
            style={{ width: '100%', maxWidth: 360, minHeight: 44, padding: '.6rem', color: '#fff', backgroundColor: '#151d30', border: '1px solid #475569', borderRadius: 6 }} />
          <p id="multi-device-whatsapp-help" style={{ color: '#94a3b8', fontSize: '.85rem', margin: '.5rem 0' }}>Inclua o código do país e DDD. Deixe vazio para remover o contato.</p>
          <button className="focusable-item" type="submit" disabled={saving} style={{ minHeight: 44, padding: '.65rem 1rem', backgroundColor: '#166534', color: '#fff', borderRadius: 6, border: 'none' }}>{saving ? 'Salvando...' : 'Salvar WhatsApp'}</button>
        </form>
      ) : null}
      {sessionUserId && !loading && !saving && <button className="focusable-item" type="button" onClick={() => setAttempt(value => value + 1)} style={{ minHeight: 44, marginTop: '.75rem', padding: '.6rem 1rem', backgroundColor: '#1e293b', color: '#fff', border: 'none', borderRadius: 6 }}>Recarregar contato</button>}
      {feedback && <p role="status" style={{ marginTop: '.75rem', color: '#cbd5e1' }}>{feedback}</p>}
    </section>
  );
};
