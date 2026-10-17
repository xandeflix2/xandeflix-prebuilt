# C129 — Controle parental na TV e D-pad

2026-10-16. Spec anterior: [C11_PARENTAL_TV_NAVIGATION](../architecture/C11_PARENTAL_TV_NAVIGATION.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem instalação/reset/backend/Git.

## Diagnóstico e alteração

O caminho para baixo a partir do Voltar do shell só buscava controles do hero;
o editor parental não possui hero, prendendo o foco. A busca geométrica genérica
também não garantia percorrer confirmações em duas colunas. Enter era cancelado
inclusive em entradas de texto, e o seletor nativo dependia da WebView.

Navegação parental agora usa ordem do formulário para cima/baixo, ignora controles
desabilitados por fieldset e acompanha o foco com rolagem. Entrada pelo menu ou
Voltar superior alcança o editor; classificação de TV usa botões de opção com
esquerda/direita e OK, mantendo select no tablet/celular. O foco inicial considera
a idade selecionada, os estados assíncronos e as subtelas. Enter/espaço nativos
dos campos são preservados; captura do formulário impede salvar implicitamente
enquanto se edita. Campos de texto mantêm esquerda/direita para o cursor.
Busca conserva a navegação existente da grade. Um único Voltar é fornecido pelo
shell; retorno interno por evento mantém recuperação/alteração/edição de regra.

CSS somente .app-shell--television: título 24px, subtítulo 18px, texto/labels
13px, campos 14px/34px, espaçamentos menores e foco com contorno claro.
Tablet e celular continuam com campos de 48px, sem a redução de tipografia de TV.
Em 1280×720 o formulário inicial cabe na viewport; em 960×540 os controles finais
continuam alcançáveis com rolagem. Não foram alterados critérios parentais C128,
PIN/PUK, KDF, storage, plugin nativo, C9, catálogo, ativação ou fonte.

## Verificação

- scripts/test-c129-parental-tv-navigation.mjs: oito perfis PASS. UI/store/crypto
  reais; source/native/search isolados. Celular, dobrável e tablet mantêm alvos
  touch e um Voltar. Fire960×540, AndroidTV1280×720, Box960×540, Tizen e webOS
  percorrem entrada pelo menu/Voltar, confirmações, geração/conferência de PUK,
  caixas, idade, criação, alteração PIN/PUK, regra manual, recuperação e retorno.
  Testados OK/Enter e keyCode23, fieldset desabilitado, cursor, foco visível e
  ausência de submissão implícita com dados válidos. Zero requisições externas.
- C126:16; C128:11; Fire home D-pad:5; rail/retorno/série D-pad:10;
  C114 Live foco:10; C106 hero toque:8; C9 wiring:10 — PASS.
- Typecheck, lock inicial e prebuild obrigatório (26+27+9), npm run build
  (561 módulos), cap sync android e Gradle assembleDebug — PASS.
- Revisão React: componente AgeField fora do render; efeitos têm cleanup;
  rótulos/estado selecionado acessíveis; nenhuma consulta/rede adicional.
- Auditoria final esperada: baseline1094, oito existentes alterados apenas na
  allowlist, quatro novos,1086 preservados; memórias append-only e HEAD/origin
  preservados. Relatório privado audit.json registra os números efetivos.

## APK recuperável

[Xandeflix-v1.0.19-C129.apk](../../tmp/c129-parental-tv-navigation/Xandeflix-v1.0.19-C129.apk)

Package com.xandeflix.prebuilt, versão1.0.19/code19, min23/target35,
12709074 bytes, SHA256 e560a91fb82d7c0177cf99e84cb572689844b96b1fbdaf6d48511557ce179195.
Mesma assinatura do C128; oito assets correspondem ao dist. Sem dev server,
HTTPS localhost/logging none. Doze DEX e1412 recursos nativos idênticos ao C128;
plugin parental preservado; APK C128 preservado. Não instalado/publicado.

## Limites e regressão anterior

As suítes C126/C128 exercitavam D-pad no diálogo de PIN, sem comprovar todo o
editor de configurações. O relato físico invalida essa cobertura como prova do
fluxo completo. A suíte C129 passa agora por esse percurso com teclas de navegador.
Falhas iniciais do novo harness eram identificação de labels de checkbox,
expectativa incorreta de login após configure (que já autentica o responsável),
ordem dos controles de busca, seletor do Back mobile e espera de foco pós-render.
Foram corrigidas sem relaxar proteção. Uma restauração de foco durante busy foi
ajustada para esperar controles habilitados. Os testes finais completos passam.

Capturas privadas em tmp/c129-parental-tv-navigation foram inspecionadas em Fire, TV720 e tablet.
Simulação de perfil/viewport não certifica hardware, IME/teclado virtual do Fire
ou pacotes nativos Tizen/webOS. Sem teste/instalação física neste ciclo.
Avisos preexistentes de Vite (Node externalizado/chunks/imports) e Gradle flatDir
permanecem. Nenhuma garantia de desempenho físico é inferida destes testes.
