# C138 - configuracoes resumidas com detalhes sob demanda - 2026-10-17

## Pedido, preflight e proveniencia

Usuario solicita que cada opcao de Configuracoes mostre apenas resumo e que
seus detalhes aparecam ao entrar. Capturas mostram cinco cards extensos com
acoes/dados ja expostos, gerando altura excessiva. Implementar divulgacao
progressiva na mesma pagina, sem novo fluxo de permissao nem novo botao Voltar.

Preflight read-only: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Estado dirty C133-C137 conhecido;
AGENTS/Architecture/Execution/Source Boundary/Activation Lock lidos. Baseline
por hashes e copias dos dois arquivos UI/memorias antes desta escrita em
tmp/c138-settings-summary. CURRENT_GATE=NONE; ciclo local autorizado pelo
pedido atual; NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset autorizados.

## Especificacao anterior ao codigo

- Cada opcao mostra titulo, descricao curta e indicador de expansao. Todas
  iniciam recolhidas: Atualizacoes do aplicativo, Fonte e catalogo, Controle
  parental, Tela e dispositivo, Ativacao.
- Acionar o resumo expande os detalhes na mesma pagina; acionar novamente
  recolhe. Usar details/summary nativos, com summary focusable-item, para
  clique/toque, Tab, Enter/Espaco e DPAD_CENTER do hook existente. Nao inventar
  eventos ou alterar o motor global de navegacao. Foco visivel e alvo amplo.
- Manter componentes/handlers internos montados e intactos, inclusive estado
  de atualizacao/importacao em andamento. Conteudo recolhido nao participa
  de layout/foco. Nenhuma consulta/atualizacao/alteracao de PIN disparada pelo
  clique no resumo; servicos/guardas atuais continuam os mesmos.
- Opcoes recolhidas compactas em grade responsiva; item aberto ocupa largura
  da grade para nao apertar campos nem esticar cards vizinhos. Adaptar telefone,
  dobravel, tablet e TV/Fire. Preservar Voltar externo e credito das plataformas.
- Mudanca restrita a apresentacao de Settings. Nao alterar fonte, busca,
  catalogo, controle parental, ativacao, AppUpdate, AppShell, rotas, D-pad,
  Android, cofre ou backend. Nenhuma geracao/instalacao APK neste pedido.

## Allowlist estrita

src/ui/pages/SettingsPage.tsx (wrapper de divulgacao e resumos);
src/ui/pages/SettingsPage.css (apresentacao dos resumos/detalhes);
este documento; docs/evidence/C11_SETTINGS_SUMMARY_DISCLOSURE.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md (append-only);
helpers/logs privados ignorados tmp/c138-settings-summary e saidas usuais dos
builds web/padrao. Nenhuma dependencia ou teste versionado novo necessario
para esta mudanca pequena e reversivel de apresentacao.

## Aceitacao e verificacao

Cinco resumos inicialmente recolhidos, detalhes/acoes intactos apos expansao,
foco acessivel e grade sem cards excessivamente altos quando recolhidos.
Revisao dos handlers/boundaries por comparacao e hashes; typecheck/build web e
padrao com lock obrigatorio antes/depois (26 ativacao/27 promocao/9 negativos).
Regressao existente de fonte ativa confirma preservacao da atualizacao manual.
Revisao React de estrutura e acessibilidade. QA real via CUA se houver browser
disponivel; indisponibilidade sera declarada, sem automacao alternativa da aba
real. Nenhuma alegacao de teste fisico em todos os controles/dispositivos.
