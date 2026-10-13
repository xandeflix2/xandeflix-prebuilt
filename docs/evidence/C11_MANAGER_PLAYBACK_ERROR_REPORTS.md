# C11 — Relatos de reprodução ao gestor — evidência 57

2026-10-09. [Especificação anterior ao código](../architecture/C11_MANAGER_PLAYBACK_ERROR_REPORTS.md).

Preflight do clone independente `C:\Xandeflix\xandeflix-prebuilt-c11-main`,
Git próprio, main, origin esperado, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. AGENTS, Architecture/Execution,
Source Data Boundary e Activation Lock lidos. Baseline privado de 751 arquivos;
737 arquivos protegidos preservados, HEAD igual e zero alteração fora da
allowlist. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; nenhum commit/push/PR.
Workspace histórico e projeto original não utilizados para escrita.

## Comportamento entregue

Aviso com Enviar ao gestor, copiar diagnóstico e fechar. Pela emenda explícita
do usuário, celular e tablet mantêm WhatsApp opcional; Fire Stick, TV Box,
Tizen e webOS não buscam contato nem oferecem WhatsApp. Política independente
da largura, com veto adicional pelo modo TV do status nativo existente; nenhuma
alteração nativa/Cast ou transmissão iniciada para consultar o status. Envio manual
usa prova do dispositivo já salva, confirmação somente após persistência,
mesmo request ID para repetição, timeout controlado e cancelamento/ignorância
de respostas tardias. Sem fila offline, rotação ou novo storage de identidade.

Controles do aviso têm navegação local por setas, centro/Enter uma vez e
Voltar prioritário, inclusive na Home antes da saída nativa. O foco anterior
é restaurado no fechamento. Temporizador de dez segundos pausa durante
foco/interação/ação. A restauração após copiar/enviar ocorre em efeito depois
do commit React, quando os controles já estão habilitados.

Sino no cabeçalho do Manager autenticado, contador de não lidos, lista com
paginação estável de 50, diagnóstico copiável e leitura individual por gestor.
Atualiza ao abrir/atualizar e a cada 30 segundos quando o painel está visível
com inbox fechado. Polling pausado durante leitura; logout cancela respostas
e limpa dados. Erro de consulta/leitura aparece sem simular sucesso.

O Manager conserva o escopo global OWNER/ADMIN ativo do painel canônico atual.
A base não possui vínculo de propriedade gerente/tenant para inventar outro
escopo. O guard existente mantém o Manager fora do APK de consumidor; código
integrado ao painel de desenvolvimento existente `/#manager-panel`, módulo
HTTP 200 no servidor local. Não houve publicação web remota nem teste visual
com sessão real de gestor: a superfície de browser estava indisponível.

## Backend e privacidade

Supabase confirmado: Xandeflix Prebuilt / cujbmyhitgomlgwfkaat / us-east-2,
ACTIVE_HEALTHY, PostgreSQL 17.6. Skill Supabase e documentação/changelog
primários consultados. Migration gerada pela CLI 2.120.0 antes do SQL e
aplicada com sucesso: `20261009021625_c11_manager_playback_error_reports.sql`.
Nenhuma Edge Function criada, nenhuma função ou tabela de source/C9 alterada.

Schema privado playback_support_private, reports/read_receipts com RLS e
nenhum acesso direto para anon/authenticated. Helpers definer restritos,
search_path fechado e wrappers públicos invoker com grants explícitos:
rpc_device_report_playback_error, rpc_manager_list_playback_errors e
rpc_manager_mark_playback_error_read. Identidade/token SHA-256 existente,
dispositivo AUTHORIZED e binding/licença ACTIVE conferidos no servidor.
Deduplicação por dispositivo/request ID e limites serializados de cinco
novos relatos/minuto e trinta/hora. Nada disso concede autorização de playback.

Projeção fechada V1: 12 campos/13 linhas; package/version/bundle/UTC/page/
error code/category/HTTP/Media3/checkpoint/Android/WebView. Cliente e servidor
rejeitam chaves extras, valores inválidos e texto livre. Nenhuma URL de vídeo,
credencial, header, source, catálogo, título, temporada, episódio ou stack
livre no relato. Identificação administrativa vem da base autenticada.

Testes reais de SQL com BEGIN/ROLLBACK, roles anon/authenticated e fixtures
isoladas: token errado, payload proibido, dedup/retry alterado, limites,
revogação/binding, grants/RLS, não-gestor/gestor desativado, paginação 50+5
sem sobreposição e leitura independente por dois gestores. PASS. Nenhum
relato fictício persistido ou notificado. Consulta posterior: zero reports
e zero read_receipts; fixtures de dispositivo também removidas pelo rollback.
Probe HTTP real com supabase-js/PostgREST: RPC de dispositivo alcançável e
prova fictícia inexistente recusada com REPORT_UNAVAILABLE; listagem/leitura
anônima recusadas (42501). Nenhum relato criado por esse probe.

Advisors de segurança/performance conferidos após DDL. Nas novas tabelas,
INFO de RLS sem policy é intencional: negação de acesso direto e uso exclusivo
dos helpers autorizados. Não abrir policy para silenciar o advisor.
[Explicação do lint](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
Índices ainda sem uso são observação de tabelas recém-criadas. Avisos
preexistentes de outros componentes não foram alterados neste ciclo.

## Verificação e regressão encontrada

Testes do código real com portas controladas: manager reports 14 PASS,
diagnóstico 8 PASS, aviso 11 PASS, detalhes tablet/TV 7 PASS e D-pad Fire 8
PASS. Cobrem parser/serviço/componentes reais, ack, idempotência/timeout,
payload malicioso, disabled skip, centro sem repetição, foco, Back na Home,
contador/paginação/leitura/logout e resultados tardios. Nenhum envio real
feito pelo agente. O teste antigo de handleBack recebeu somente a dependência
window/Event exigida pela nova prioridade; assertions anteriores mantidas.

No Fire 0.106, fixture isolada em memória montou o componente TSX real com CSS
do APK e teclas ADB reais. Aviso enquadrado, sem WhatsApp, foco inicial Enviar
ao gestor e navegação por setas passaram. Centro/Copiar encontrou regressão:
fallback tentava refocar botão desabilitado e foco terminava no BODY. Esta
evidência anulou a validação anterior desse caminho. RAF não constitui
garantia de commit React; substituído por efeito após commit e teste de
regressão que executa um frame antes de reabilitar o controle. PASS local.
Import da fixture também passou a usar timestamp para não reutilizar módulo
dev em cache sem cliente HMR. A fixture não é erro nativo real nem relato
enviado; não certifica o fluxo compilado completo no aparelho.

Fire 1 foi reconectado no novo IP 192.168.3.126 e recebeu o APK final. A fixture
final confirmou três botões/WhatsApp ausente, foco Enviar e enquadramento.
A rodada completa ficou pendente quando saiu do foreground; usuário escolheu
concluir a conferência apenas no tablet. Não alegar QA completa final no Fire.
O teste natural anterior de Luke Cage S01E03 retomou perto de 12:20 e ficou
preparando; fechado com Voltar sem novo aviso terminal. Mídia não corrigida.

Tablet final: duas rodadas de 16 passos PASS, com clipboard normal e com
writeText deliberadamente negado na fixture para exercitar execCommand real.
Quatro botões, WhatsApp presente, limites/setas/centro, cópia com feedback e
foco preservado após commit, Voltar fecha antes da saída. Screenshot conferido,
aviso enquadrado e barras do sistema disponíveis. Fallback/restos da fixture
removidos; nenhum envio ao gestor/WhatsApp executado.

S24 final: usuário reabriu o aplicativo e a conferência passou no bundle DMo.
Quatro botões visíveis e habilitados, aviso dentro do viewport, centro em
Copiar gera feedback e mantém foco, Voltar fecha antes da saída e app permanece
em foreground. Screenshot conferido. Sem abrir WhatsApp ou enviar relato.
Conexão reversa do teste caiu e imports dev rejeitados ficaram em cache;
restabelecida e superfície própria recarregada, sem limpar dados/unlock.
As verificações físicas de aviso usam TSX real importado fresco no WebView
com CSS instalado e teclas nativas, em fixture isolada em memória. Certificam
essa interface, não uma falha nativa real nem todo o fluxo compilado/envio.

TypeScript/revisão React, lock 22+27+9/prebuild, build Vite, sync Capacitor e
Gradle assembleDebug/testDebugUnitTest PASS; Java 148, zero failures/errors
(tarefas nativas já atualizadas, reutilizadas por Gradle). Warnings existentes
de externalização Node, imports mistos, chunk e flatDir não impediram build.
Seis assets do APK iguais a dist, pacote/SDK/config standalone/certificado
conferidos. Seis marcadores C57 presentes; sino Manager ausente do consumer
bundle conforme guard existente.

## Artefato e disponibilidade

APK final `Xandeflix-v1.0.0-standalone.apk`, 12.400.179 bytes.
SHA-256 `1FFC3C6A3CB5481654A5F6EBDAB3C1ABB4C0A2333EA22173E3F9FD13D051D997`;
bundle `index-DMoX919H.js`. Package com.xandeflix.prebuilt, version 1.0/code 1,
min23/target35, https localhost sem server remoto, certificado
`b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.

Entrega final install -r, APK instalado igual ao hash acima, firstInstallTime
igual e zero mudanças nos cinco grupos privados (catálogo/nativo/preferences/
WebView/outros), sem abrir app automaticamente:

| Aparelho | Arquivos / catálogo / nativo | Auditoria UTC |
| --- | --- | --- |
| Tablet SM-X610 | 758 / 715 / 5 | 2026-10-09T20:36:58.981Z |
| S24 SM-S926B | 762 / 718 / 5 | 2026-10-09T20:37:12.839Z |
| Fire 1 AFTSSS, 192.168.3.126 | 898 / 856 / 5 | 2026-10-09T20:37:58.023Z |

Versão intermediária 06180/index-DfPvJv_8 já instalada em tablet, S24 e Fire
0.106 com cinco grupos privados, hash instalado e firstInstallTime iguais.
Ela precede a correção final de foco. D43/Bd8 foi intermediária antes da emenda
WhatsApp tablet; substituída pela versão final acima. Fire107 sem atualização nesta rodada;
S23 excluído por pedido. Não interrompidos outros apps/NativePlayerActivity.
Sem reset/uninstall/rotação, dados de source ou segredos em documentos/logs.
Limites externos Luke Cage aos 12 minutos e motor AirScreen permanecem
documentados no ciclo55; transmissão já encerrada, nenhum novo teste Cast.
