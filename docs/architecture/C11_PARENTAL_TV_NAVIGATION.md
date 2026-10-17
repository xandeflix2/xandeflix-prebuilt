# C129 — Controle parental por D-pad e proporção de TV

## Escopo e proveniência — 2026-10-16

Pedido do usuário: corrigir acesso com controle remoto, reduzir elementos e
fontes no Fire Stick/Android TV e remover o Voltar duplicado abaixo do título.
Tablet mantém a proporção. Ciclo local autorizado; CURRENT_GATE=NONE,
NEXT_GATE_STARTED=NAO. Sem Git, backend, instalação, reset ou mudança de proteção.

Preflight: clone independente ativo C:\Xandeflix\xandeflix-prebuilt-c11-main,
main, origin xandeflix2/xandeflix-prebuilt, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos. Baseline privado de hashes e
prefixos das memórias em tmp/c129-parental-tv-navigation/baseline.json.
Arquivos dirty C107–C128 preservados; lock inicial 26+27+9 PASS.

## Especificação anterior ao código

- Um único Voltar fornecido pelo shell. Back do controle e Voltar do shell
  mantêm retorno de subtelas antes de sair de controle parental.
- Do Voltar superior ou menu lateral, alcançar o formulário. Cima/baixo
  percorrem todos os controles habilitados em ordem, incluindo confirmações,
  caixas, geração/conferência do PUK, classificação e ações; rolagem acompanha.
- Entradas de texto mantêm teclas nativas de edição e ativação do teclado.
  Enter no campo não deve salvar o formulário implicitamente. Enter nos
  botões/caixas continua acionando a opção; campos desabilitados são ignorados.
- Nas TVs, classificação usa opções explícitas navegáveis por esquerda/direita
  e selecionáveis com OK, sem depender do seletor nativo da WebView. Celular e
  tablet mantêm seu seletor. Mudança de subtela restaura foco válido na TV.
- CSS compacto apenas em .app-shell--television (Fire, Android TV/Box,
  Samsung Tizen e LG webOS); não reduzir alvos touch do tablet/celular.
- Regras C126/C128, PIN/PUK, criptografia, storage, source e C9 intactos.

## Allowlist estrita

- src/ui/pages/ParentalControlPage.tsx e .css.
- src/ui/hooks/useDpadNavigation.ts: somente integração escopada ao parental.
- src/ui/parental-dpad-navigation.ts: descoberta/navegação local de controles.
- scripts/test-c129-parental-tv-navigation.mjs: teste de UI real com fixtures
  locais de source/native, sem credenciais nem rede externa.
- scripts/test-c11-fire-home-hero-dpad.mjs e
  scripts/test-c11-fire-dpad-rail-return.mjs: carregar o novo helper real no
  harness VM, preservando todas as asserções de regressão existentes.
- Este documento, docs/evidence/C11_PARENTAL_TV_NAVIGATION.md e apêndices em
  docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md.
- Saídas ignoradas usuais de teste/build/sync/Gradle; APK C129 separado.

## Aceitação

Verificar por teclas reais de navegador a entrada pelo Voltar/menu, percurso
completo, edição e seleção, criação, administração, recuperação e retorno.
Verificar dimensões 960×540 e 1280×720 e ausência de regressão touch em tablet,
dobrável e celular. Rodar regressões parental e D-pad, typecheck/build, lock,
sync/Gradle e inspeção do APK (package/assinatura/assets, nativo preservado).
Auditoria por hashes e memórias append-only. Simulação de viewport não equivale
a teste no controle físico ou teclado virtual do Fire Stick; registrar limite.
