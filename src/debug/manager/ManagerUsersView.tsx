import { useEffect, useState } from 'react';
import { sanitizeManagerErrorMessage, type ManagerAccessProfile, type ManagerConsumer, type ManagerStaff,
  type RemoteManagerControlPlaneAuthority } from '../../control-plane/client/manager-remote-control-plane-authority.ts';

interface Props { authority: RemoteManagerControlPlaneAuthority; profile: ManagerAccessProfile; staffOnly?: boolean; }
const field = { padding: 10, background: '#151d30', color: '#fff', border: '1px solid #334155', borderRadius: 6, width: '100%' };
const button = { padding: '10px 16px', background: '#6d28d9', color: '#fff', border: 0, borderRadius: 6 };
export function ManagerUsersView({ authority, profile, staffOnly = false }: Props) {
  const [users, setUsers] = useState<ManagerConsumer[]>([]), [staff, setStaff] = useState<ManagerStaff[]>([]);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState(''), [selectedAdmin, setSelectedAdmin] = useState('');
  const [selectedLicense, setSelectedLicense] = useState(''), [displayCode, setDisplayCode] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setUsers([]); setStaff([]);
    setSelectedUser(''); setSelectedAdmin(''); setSelectedLicense(''); setDisplayCode('');
    void Promise.all([staffOnly ? Promise.resolve([]) : authority.listUsers!(),
      profile.role === 'MASTER' ? authority.listStaff!() : Promise.resolve([])])
      .then(([nextUsers, nextStaff]) => { if (active) { setUsers(nextUsers); setStaff(nextStaff); } })
      .catch(error => { if (active) setMessage(sanitizeManagerErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authority, profile.userId, profile.role, staffOnly, revision]);
  const user = users.find(item => item.userId === selectedUser);
  const licenses = user?.licenses.filter(item => item.mode === 'SELF_SERVICE' && ['ACTIVE', 'TRIAL'].includes(item.status)) || [];
  const run = async (operation: () => Promise<void>, success: string) => {
    if (busy) return; setBusy(true); setMessage('');
    try { await operation(); setRevision(value => value + 1); setMessage(success); }
    catch (error) { setMessage(sanitizeManagerErrorMessage(error)); }
    finally { setBusy(false); }
  };
  return <section style={{ border: '1px solid #29324b', borderRadius: 12, padding: 24, background: '#101624' }}>
    <h2>{staffOnly ? 'Gestores MASTER e ADMIN' : 'Usuários USER'}</h2>
    <p style={{ color: '#94a3b8', margin: '12px 0' }}>{staffOnly
      ? 'Somente MASTER tem acesso a esta relação de gestores.'
      : profile.role === 'MASTER' ? 'Todos os consumidores, inclusive os ativados pelo acesso público.' : 'Somente os consumidores sob sua responsabilidade.'}</p>
    {loading ? <p role="status">Carregando usuários…</p> : <>
      <div style={{ overflowX: 'auto', marginBottom: 20 }}><table style={{ width: '100%', textAlign: 'left' }}>
        <thead><tr><th>{staffOnly ? 'Usuário (email)' : 'Nome'}</th><th>Perfil</th><th>Status</th></tr></thead>
        <tbody>{staffOnly ? staff.map(item => <tr key={item.userId}><td>{item.username}</td><td>{item.role}</td><td>{item.status}</td></tr>)
          : users.map(item => <tr key={item.userId}><td>{item.name}</td><td>USER</td><td>{item.status}</td></tr>)}</tbody>
      </table>{!(staffOnly ? staff : users).length && <p>Nenhum usuário disponível.</p>}</div>
      {!staffOnly && <div style={{ display: 'grid', gap: 16 }}>
        <label>Consumidor<select style={field} value={selectedUser} disabled={busy} onChange={event => { setSelectedUser(event.target.value); setSelectedLicense(''); }}>
          <option value="">Selecione o usuário</option>{users.map(item => <option key={item.userId} value={item.userId}>{item.name}</option>)}
        </select></label>
        {profile.role === 'MASTER' && user && <form onSubmit={event => { event.preventDefault(); if (selectedAdmin) void run(() => authority.assignUser!(user.userId, selectedAdmin), 'Responsável ADMIN atualizado.'); }} style={{ display: 'grid', gap: 12 }}>
          <label>ADMIN responsável<select value={selectedAdmin} disabled={busy} style={field} onChange={event => setSelectedAdmin(event.target.value)}>
            <option value="">Selecione o ADMIN</option>{staff.filter(item => item.role === 'ADMIN' && item.status === 'ACTIVE').map(item => <option key={item.userId} value={item.userId}>{item.username}</option>)}
          </select></label><button style={button} disabled={busy || !selectedAdmin}>Atribuir consumidor ao ADMIN</button>
        </form>}
        {user && (licenses.length ? <form onSubmit={event => { event.preventDefault(); if (selectedLicense && /^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(displayCode)) void run(() => authority.allowAdditionalSignalDevice!(selectedLicense, displayCode), 'Dispositivo adicional liberado. O usuário deve validar o código e a chave na página pública e informar sua fonte.'); }} style={{ display: 'grid', gap: 12 }}>
          <h3>Liberar dispositivo adicional</h3>
          <label>Licença da fonte<select value={selectedLicense} disabled={busy} style={field} onChange={event => setSelectedLicense(event.target.value)}><option value="">Selecione a licença</option>{licenses.map(item => <option key={item.licenseId} value={item.licenseId}>{item.licenseId} · limite {item.maxDevices}</option>)}</select></label>
          <label>Código ID do novo dispositivo<input style={field} placeholder="XF-XXXX-XXXX" value={displayCode} disabled={busy} onChange={event => setDisplayCode(event.target.value.trim().toUpperCase())} autoComplete="off" /></label>
          <p>O pagamento adicional ainda não está disponível. Esta liberação administrativa permite adicionar o aparelho à mesma licença; não altera seu limite de reproduções simultâneas.</p>
          <button style={button} disabled={busy || !selectedLicense || !/^XF-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(displayCode)}>{busy ? 'Liberando…' : 'Liberar este dispositivo'}</button>
        </form> : <p>Para fonte gerenciada, use Ativar dispositivo → Cliente já ativo. O limite da licença continua obrigatório.</p>)}
      </div>}
    </>}
    {message && <p role="status" style={{ marginTop: 16 }}>{message}</p>}
  </section>;
}
