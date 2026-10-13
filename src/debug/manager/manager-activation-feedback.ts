import { sanitizeManagerErrorMessage } from '../../control-plane/client/manager-remote-control-plane-authority.ts';

export function managerActivationFailure(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : error instanceof Error ? error.message : '';
  const messages: Record<string, string> = {
    LICENSE_EDITOR_CONFLICT: 'O cadastro foi alterado em outra sessão. Nenhuma mudança deste salvamento foi aplicada. Feche o modal, atualize o painel e confira os dados antes de tentar novamente.',
    INVALID_CUSTOMER_NAME: 'Informe o nome do cliente, com até 100 caracteres.',
    CUSTOMER_NAME_CONFLICT: 'O nome do cliente foi alterado em outra sessão. Feche o modal, atualize o painel e confira antes de salvar.',
    CUSTOMER_PROFILE_NAME_INVALID: 'Para contas self-service, use um apelido de 3 a 32 caracteres: letras sem acentos, números, espaços, hífen ou sublinhado. Comece e termine com letra ou número, sem usar nomes reservados como admin ou gestor.',
    CUSTOMER_NAME_ALREADY_USED: 'Esse apelido já pertence a outra conta self-service. Escolha outro nome.',
    INVALID_DEVICE_PLATFORM: 'Escolha uma plataforma válida para o aparelho.',
    INVALID_DEVICE_TYPE: 'Escolha TV, celular, tablet, computador ou outro.',
    INVALID_DEVICE_SLOT: 'Escolha um slot dentro da quantidade permitida na licença de destino.',
    DEVICE_SLOT_OCCUPIED: 'Este slot já pertence a outro aparelho. Escolha um slot livre ou atualize o painel.',
    DEVICE_SLOT_OUTSIDE_LIMIT: 'Há aparelhos em slots acima da nova quantidade. Reorganize os slots antes de reduzir o limite.',
    PRIMARY_SLOT_READ_ONLY: 'O slot do principal é definido pelo sistema. Só secundários podem escolher outro slot livre.',
    DEVICE_ROLE_CONFIRMATION_REQUIRED: 'Confirme a mudança de classificação e o principal de destino antes de salvar.',
    DEVICE_TREE_CONFIRMATION_REQUIRED: 'Escolha e confirme o destino dos aparelhos secundários no modal de mudança do principal.',
    DEVICE_TREE_CHANGED: 'Os aparelhos vinculados mudaram em outra sessão. Atualize o painel e confirme novamente o destino de todos.',
    PRINCIPAL_REQUIRED: "Escolha um aparelho definido como principal. Um secundário pode ser promovido em Editar licença.",
    PRIMARY_CANNOT_BECOME_SECONDARY: "Um aparelho principal não pode ser vinculado como secundário.",
    LICENSE_EDIT_REQUIRED: "Altere a quantidade de aparelhos somente em Licenças → Editar licença.",
    EXTRA_SCREENS_PAYMENT_REQUIRED: "Acima de quatro aparelhos, confira e registre o pagamento por todas as telas adicionais.",
    PAYMENT_REFERENCE_INVALID: "Confirme a conferência manual e informe uma referência válida do comprovante, com até 120 caracteres.",
    INVALID_PAID_EXTRA_SCREENS: "Informe o total de telas adicionais pagas, preservando as já conferidas.",
    SCREEN_CHANGE_REASON_REQUIRED: "Informe o motivo da alteração, com até 200 caracteres.",
    USE_ACTIVATION_SUBMENU: "Use Ativar dispositivo para ativar ou vincular um aparelho.",
    CONCURRENT_LIMIT_EXCEEDS_DEVICES: 'O limite de reproduções simultâneas não pode exceder a quantidade permitida de aparelhos.',
    VERSION_CONFLICT: 'Os limites da licença foram alterados. Atualize o painel e confira a capacidade antes de vincular.',
    PRIMARY_HAS_SECONDARIES: 'Este principal possui aparelhos secundários. Reorganize esses vínculos antes de transferi-lo.',
    REGISTERED_DEVICE_REQUIRED: 'Selecione um aparelho já cadastrado e autorizado no seu acesso ao painel.',
    LICENSE_DEVICE_LIMIT_REACHED: 'Não há vaga para este aparelho. Aumente a quantidade permitida antes de confirmar.',
    INVALID_DEVICE_ROLE: 'Selecione se o novo aparelho é principal ou secundário.',
    PRIMARY_DEVICE_REQUIRED: 'Informe o código do aparelho principal ao qual o secundário será vinculado.',
    PRIMARY_DEVICE_INVALID: 'O principal precisa ser um aparelho autorizado deste cliente e desta licença. Um secundário não pode ser escolhido como principal.',
    DEVICE_ROLE_CONFLICT: 'Este aparelho já possui outro vínculo. Confira o cadastro existente antes de continuar.',
    AUTH_REQUIRED: 'Sua sessão terminou. Entre novamente no painel para continuar.',
    NETWORK_ERROR: 'Não foi possível conectar ao serviço de ativação. Confira a conexão e tente novamente.',
    ACTIVATION_KEY_INVALID: 'O código e a chave não conferem. Verifique os dados exibidos no aparelho.',
    INVALID_ACTIVATION_KEY: 'O código e a chave não conferem. Verifique os dados exibidos no aparelho.',
    ACTIVATION_NOT_FOUND: 'Não há uma solicitação de ativação registrada para este aparelho. Abra novamente o aplicativo com internet para registrar o código e a chave antes de validar. Se o aparelho usa uma versão antiga e o problema continuar, atualize o aplicativo e tente novamente.',
    ACTIVATION_NOT_PENDING: 'Esta solicitação não está disponível para ativação. Abra novamente o aplicativo com internet e tente validar o código e a chave atuais.',
    ACTIVATION_KEY_REGISTRATION_INVALID: 'Não foi possível registrar os dados de ativação do aparelho. Abra novamente o aplicativo com internet; se estiver usando uma versão antiga, atualize e tente novamente.',
    ACTIVATION_SESSION_EXPIRED: 'Esta sessão de ativação expirou. Valide novamente o código e a chave exibidos no aparelho.',
    PERMANENT_KEY_REVOKED: 'A chave deste aparelho foi revogada. Peça ao gestor responsável para conferir a situação do dispositivo antes de reativar.',
    HANDOFF_EXPIRED: 'A solicitação expirou. Abra novamente a notificação ou informe o código e a chave do aparelho.',
    INVALID_DEVICE_LABEL: 'Informe o Local/Tipo do aparelho, com até 100 caracteres.',
    INVALID_MAX_DEVICES: 'Informe uma quantidade de aparelhos entre 1 e 100.',
    INVALID_MAX_CONCURRENT_SESSIONS: 'Informe um limite de reproduções simultâneas entre 1 e 50.',
    CANNOT_REDUCE_BELOW_ACTIVE_DEVICES: 'A quantidade permitida não pode ser menor que a quantidade de aparelhos já vinculados.',
    MANAGED_LICENSE_CAPACITY_EXHAUSTED: 'Não há vaga para este aparelho. Aumente a quantidade permitida ou libere uma vaga.',
    MANAGED_LICENSE_AMBIGUOUS: 'Este cliente tem mais de uma licença disponível. Escolha a licença para continuar.',
  };
  return messages[code] || sanitizeManagerErrorMessage(error)
    .replace('Sessao Supabase autenticada obrigatoria para mutacoes do Manager.', 'Entre novamente no painel para continuar.')
    .replace('Usuario autenticado sem autorizacao ativa de Manager.', 'Sua conta não tem permissão para ativar aparelhos.')
    .replace('Falha remota do Control Plane; nenhuma alteracao local foi confirmada.', 'Não foi possível confirmar a ativação. Confira os dados e tente novamente.');
}
