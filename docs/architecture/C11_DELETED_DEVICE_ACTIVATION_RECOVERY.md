# C11 — Nova solicitação após exclusão de dispositivo

## Autorização e preflight — C89, 2026-10-12

Pedido do usuário: investigar a recusa de nova ativação do aparelho
XF-6GV6-ZDFV após exclusão manual. Ciclo local corretivo; CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO. Workspace/top-level independente:
`C:\Xandeflix\xandeflix-prebuilt-c11-main`, origin
`https://github.com/xandeflix2/xandeflix-prebuilt.git`, branch main, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`.
AGENTS, Architecture, Execution, Source Data Boundary e Activation Lock lidos.
Dirty acumulado preservado; baseline privado e auditoria por hash obrigatórios.
Sem commit/push/PR, migração/deploy remoto, APK, instalação ou reset físico.

## Diagnóstico observado e limite da evidência

Consulta somente leitura ao projeto cujbmyhitgomlgwfkaat: dispositivo, chave
remota e solicitações ausentes. Auditoria de exclusão em
2026-10-12T04:15:04Z. Uma instalação OBSERVED foi reportada novamente em
2026-10-12T16:20:24Z; descoberta da instalação não significa autorização.
Nenhuma chave, token, credencial ou hash secreto real é registrado neste ciclo.

O status remoto retorna success=false/ACTIVATION_NOT_FOUND para solicitação
excluída. O cliente atual interrompe qualquer resposta success=false e mantém
para sempre a referência pendente antiga. Defeito reproduzível por fixture;
o estado privado e a versão exata do aparelho físico não foram inspecionados.
O Manager recebe ACTIVATION_NOT_FOUND no início por código/chave, mas não
possui mensagem específica e apresenta a recusa genérica.

## Comportamento especificado antes do código

1. Somente ACTIVATION_NOT_FOUND explícito permite refazer a solicitação
   pendente pelo fluxo canônico: reporte da instalação, solicitação A1 e
   registro cifrado da chave permanente. Reutilizar identidade, código,
   instalação, token e chave locais existentes, sem rotação.
2. Rede/timeout/erro de capability ou resultado desconhecido não significa
   exclusão. Preservar a referência antiga nesses casos e quando a nova
   solicitação falhar; substituí-la somente após resposta canônica bem-sucedida.
3. Não autorizar o aparelho nem restaurar licença/fonte pelo registro. A nova
   ativação continua exigindo validação e conclusão pelo fluxo autorizado.
   Dispositivo local AUTHORIZED mantém o comportamento existente; nenhuma
   limpeza automática de autorização. Revogação não será contornada.
4. Mensagem informativa no Manager para solicitação ausente: abrir aplicativo
   conectado para novo registro; atualizar versão antiga se persistir. Demais
   códigos de sessão/registro recebem mensagens seguras, sem detalhes internos.
5. Instalação limpa real, rede indeterminada, concorrência, retries e catálogo
   permanecem protegidos pelo lock obrigatório antes/depois/build.

## Allowlist e aceitação

- `src/control-plane/client/device-activation-sync.service.ts`
- `src/debug/manager/manager-activation-feedback.ts`
- `scripts/test-c11-new-device-activation.mjs` (novos testes sem relaxar existentes)
- `scripts/test-c11-new-device-activation-lock.mjs` (marcador exato de 22 para
  26 testes após os quatro casos adicionais; hook/negativos/regras intactos)
- `scripts/test-c11-deleted-device-activation-feedback.mjs`
- `supabase/tests/c11_deleted_device_activation_recovery.sql` (fixtures rollback)
- Este contrato e `docs/evidence/C11_DELETED_DEVICE_ACTIVATION_RECOVERY.md`
- `docs/STATUS.md`, `docs/EVOLUTION_REPORT.md`, `docs/DECISIONS.md`,
  `docs/ERRORS_AND_BLOCKERS.md`
- Artefatos privados `tmp/c89-deleted-device-activation-recovery/` e saídas
  usuais de build, incluindo tsconfig.tsbuildinfo.

Aceitação: reproduzir ausência e recuperação; provar identidade/chave/token
estáveis, pending antigo preservado em falha, nova capability no sucesso,
ausência de autorização automática, validação negativa de chave/capability,
lock/typecheck/build com prebuild aprovados e audit allowlist/HEAD inalterado.
SQL usa apenas fixtures aleatórias BEGIN/ROLLBACK; nenhuma restauração real.
Não atribuir aprovação física ao teste sintético nem à compilação web.

## Emenda prévia ao ajuste do marcador do lock

O primeiro build após a extensão falhou corretamente: o lock ainda exige o
marcador exato de 22 testes, enquanto a suíte ampliada concluiu 26. Atualizar
somente esse marcador para exigir todos os 26 casos é reforço de cobertura,
não relaxamento do lock. Não aceitar substring genérica, ignorar erro, remover
teste antigo ou alterar controles negativos. Repetir o build completo.
