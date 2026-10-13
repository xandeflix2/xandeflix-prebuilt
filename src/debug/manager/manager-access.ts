import type { ManagerAccessProfile } from '../../control-plane/client/manager-remote-control-plane-authority.ts';

export type ManagerSection = 'ATIVACAO' | 'USUARIOS' | 'GESTORES' | 'CLIENTES' | 'LICENCAS' | 'INSTALACOES' | 'DISPOSITIVOS' | 'FONTES' | 'AUDITORIA' | 'SISTEMA' | 'ATUALIZACOES';
export const MANAGER_SECTIONS: ReadonlyArray<{ id: ManagerSection; label: string; masterOnly?: boolean }> = [
  { id: 'ATIVACAO', label: 'Ativar dispositivo' },
  { id: 'USUARIOS', label: 'Usuários USER' },
  { id: 'GESTORES', label: 'Gestores', masterOnly: true },
  { id: 'CLIENTES', label: 'Clientes' },
  { id: 'LICENCAS', label: 'Licenças' },
  { id: 'INSTALACOES', label: 'Instalações' },
  { id: 'DISPOSITIVOS', label: 'Dispositivos' },
  { id: 'FONTES', label: 'Fontes' },
  { id: 'AUDITORIA', label: 'Auditoria' },
  { id: 'ATUALIZACOES', label: 'Atualizações', masterOnly: true },
  { id: 'SISTEMA', label: 'Sistema', masterOnly: true },
];
export function managerSections(profile: ManagerAccessProfile | null) {
  if (!profile || !['MASTER', 'ADMIN'].includes(profile.role)) return [];
  return MANAGER_SECTIONS.filter(section => !section.masterOnly || profile.role === 'MASTER');
}
