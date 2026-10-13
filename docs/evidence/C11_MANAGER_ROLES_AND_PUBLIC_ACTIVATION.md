# C11 — Manager, privilégios e ativação pública (C70)

2026-10-11. Estado: implementação/testes de permissões e aprovação concluídos;
verificação global do sinal ainda pendente de uma configuração legada inválida.
Frontend atualizado/build local; não publicado nem instalado em aparelhos.

## Proveniência e escopo

Clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
Preflight read-only, AGENTS, Architecture, Execution, Source Boundary e Activation
Lock lidos antes de código. Especificação:
[contrato C70](../architecture/C11_MANAGER_ROLES_AND_PUBLIC_ACTIVATION.md).
Estado dirty acumulado preservado; hashes comparados com baseline anterior ao
patch C70. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO. C69 permanece pendente.
Sem commit/push/PR/reset, alterações Android/playback, APK, instalação ou
exclusão/ativação/liberação real. Histórico original protegido não alterado.

## Resultado implementado

- Menu Manager lateral responsivo e login email/senha; workspace só abre após
  perfil ativo validado no servidor. OWNER existente corresponde a MASTER.
  Nenhuma senha padrão ou conta real foi criada.
- MASTER vê consumidores e gestores, opera globalmente e pode atribuir
  consumidor a ADMIN; exclusão permanente requer código exato e confirmação.
- ADMIN vê apenas consumidores sob sua responsabilidade e entidades derivadas;
  não acessa outros gestores, sistema global, reveal ou exclusão permanente.
  Registros históricos sem proprietário permanecem somente MASTER.
- USER/anônimo não acessam o Manager. USER administra somente sua própria
  configuração, por identidade validada ou código/chave de dispositivo já
  autorizado; nenhum parâmetro do cliente concede perfil administrativo.
- Ativação pública: código ID/chave de seis dígitos → validação real →
  fonte → confirmação com código e orientação de sincronização no aparelho.
  Formulário não aparece antes da validação; mudança no par a invalida;
  segredos são limpos após conclusão. Não inventa progresso remoto.
- Mesma conexão em outro dispositivo exige aprovação específica de ADMIN
  responsável/MASTER para dispositivo, licença e versão da fonte.
  Capacidade da licença, cadastro novo ou alegação de pagamento não bastam.
  Pagamento adicional indisponível; concorrência de playback não é ampliada.
- HMAC privado separado por domínio, calculado no runtime do vault;
  URLs/credenciais cifradas, nunca em provas públicas/sourceId/metadados.
  Normaliza M3U/Xtream equivalentes, formato/query, token com trim e campos
  ignorados pelo importador. Não busca playlist/catalogo/mídia no backend.
  URLs aliases/redirects não equivalentes não são deduplicação semântica.
- Recuperação da configuração própria: somente alvo comprovado pela sessão
  real de aparelho já autorizado ou Auth próprio no UPDATE pode excluir a
  versão que será substituída do backfill. Transação final revalida o alvo,
  verifica todas as demais fontes e a nova conexão. Não cria slot, consumidor
  extra, pagamento ou prova fictícia. Novo aparelho não pode usar esse caminho.

A atribuição de consumidor não transfere silenciosamente fonte gerenciada
compartilhada ou explicitamente pertencente a outro ADMIN. MASTER mantém
controle dessas fontes e deve decidir a propriedade correspondente.

## Implantação de backend

Somente Supabase cujbmyhitgomlgwfkaat.

| Migration local | Versão remota aplicada |
| --- | --- |
| 20261011144244_c11_manager_scoped_access.sql | 20261011152725 |
| 20261011153252_c11_manager_users_and_signal_policy.sql | 20261011161131 |
| 20261011162626_c11_signal_policy_owned_repair.sql | 20261011163016 |

Migration inicial preservada byte a byte após aplicação; correções posteriores
aditivas. Edge device-public-activation v10 e customer-source-upsert v7 ACTIVE.
verify_jwt=false anterior preservado: primeira exige capability real de
código/chave/sessão; segunda valida bearer por Auth.getUser. Dependency compartilhada
incluída em ambos deployments. Managed-source-vault-admin não foi alterado/deployado.

Verificação efetiva final: 46 RPCs Manager, 0 sem guard, 0 acessíveis por anon;
0 RPCs de autoridade de sinal executáveis por anon/authenticated;
0 cores privados expostos a anon/authenticated/service_role;
0 dispositivos sintéticos remanescentes, 0 liberações reais.
Consumidor não escreve licenses nem trunca playback_sessions.
Cores antigos são privados, aliases administrativos recebem escopo no servidor.

## Validação

- SQL remoto transacional antes de cada migration e após implantação:
  C70_SCOPED_ACCESS_ROLLBACK_TESTS_PASS e
  C70_USERS_SIGNAL_POLICY_ROLLBACK_PASS, com rollback de todo dado sintético.
  MASTER/dois ADMIN/USER/inativo/anônimo, isolamento cruzado, aliases,
  listagens/notificações, exclusão sintética/chaves/sessões, aprovação de
  segundo aparelho, terceiro negado, C6 CREATE/UPDATE e recuperação própria
  sem ignorar fonte alheia nem aumentar capacidade.
- Cliente/componentes isolados 8/8 PASS; política/cofre/Edge isolados 10/10 PASS,
  inclusive HMAC, AAD real do ID cifrado, recusa antes de criar identidade,
  cleanup de bootstrap em corrida e alvo próprio derivado do servidor.
- Browser headless com perfil separado e servidor loopback exclusivo:
  14 checks PASS dos componentes e serviços reais com SDK sintético.
  MASTER/ADMIN/USER, login/logout, menus, gates de fonte e sincronização;
  conferência visual em 1280px e 390px sem overflow horizontal.
  Não representa login ou ativação de consumidor real em produção.
- Regressões existentes: C6 33, roles 14, two-flow 20, cutover 24 e reports 14 PASS.
- TypeScript/frontend build PASS; Activation Lock 22+27+9 PASS.
  Main bundle index-CHsqg35X.js. Aviso preexistente de bundle >500kB permanece.
- Deno check dos dois endpoints PASS, sem lock/dependência nova no projeto.
- Runtime HTTP implantado com sessão sintética temporária:
  capability inválida →403 ACTIVATION_SESSION_NOT_OPEN;
  customer-source-upsert sem Auth →401 AUTH_REQUIRED;
  CHECK_POLICY válido →SOURCE_POLICY_UNAVAILABLE, investigado abaixo.
  Sessão/dispositivo/installation/request sintéticos removidos, sem conta,
  licença, fonte ou ativação criada.

Capturas e logs locais privados em tmp/c11-manager-access-20261011;
provenance-final.json registra somente allowlist e HEAD preservado.

## Pendência real — não declarar sucesso global

Backfill runtime verificou 42 configurações cifradas existentes (39 MANAGED e
3 CUSTOMER). Uma CUSTOMER XTREAM v1 de licença SELF_SERVICE ACTIVE permanece
sem prova: falha na etapa DECRYPT. Não ficou comprovado se a causa específica
é AAD/ID antigo ou chave distinta. Não adivinhar chave/AAD, não apagar fonte e
não persistir hash fictício para contornar a falha.

Novas ativações e CREATE/alteração de outra configuração continuam falhando
fechado enquanto esse registro estiver ativo e não verificado. A recuperação
própria foi implementada e testada, mas depende de o responsável informar uma
configuração válida no acesso autorizado. Nenhuma credencial foi preenchida
pelo agente. Registros cifrados existentes não foram modificados.
Portanto a ativação pública global não está certificada como pronta.

Frontend ainda não publicado, nenhum APK/instalação deste C70; credenciais
reais e privilégios das contas existentes não foram alterados neste ciclo.

## Auditoria de segurança

Advisors antes/depois: RLS sem policy INFO20→24 (quatro tabelas privadas
intencionalmente sem grants/policies ao cliente); search_path mutável WARN3→3;
anon SECURITY DEFINER WARN15→15; authenticated SECURITY DEFINER WARN56→73
(RPCs administrativas intencionalmente expostas somente a Auth com guards);
proteção de senha vazada WARN1→1. Não declarar todos os avisos resolvidos.
Grants, guards reais e negativa cruzada foram conferidos independentemente.

[Diagnóstico RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
[SECURITY DEFINER autenticado](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable),
[senha e autenticação](https://supabase.com/docs/guides/auth/passwords).
