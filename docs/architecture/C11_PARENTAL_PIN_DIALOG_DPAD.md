# C133 — D-pad da janela PIN parental — 2026-10-16

## Autorizacao e preflight

Usuario reportou foco preso no PIN ao acessar Live com controle parental
configurado: nao alcanca Confirmar/Cancelar. Autoriza correcao local e APK
recuperavel. Sem novo commit/push/PR, backend, instalacao/reset ou Gate.
Publicacao anterior C132 ja concluida; esta e uma nova correcao isolada.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C133_PARENTAL_PIN_DIALOG_DPAD;
NEXT_GATE_STARTED=NAO.

Clone independente ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, main,
origin xandeflix2/xandeflix-prebuilt, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Preflight completo, workspace limpo,
AGENTS/Architecture/Execution/Source Boundary/Activation Lock e C126/C129
lidos. Baseline1108 hashes/prefixos de memoria em tmp/c133-parental-pin-dpad.
APK C1311.0.21 preservado por SHA256. Apenas fixtures sinteticas em teste.

## Especificacao anterior ao codigo

- Reproduzir em navegador com janela PIN real, useDpadNavigation real e
  verificacao local real. Usar autorizacao Live sintetica sem classificacao,
  sem conexao com fonte/backend. Registrar comportamento anterior por foco.
- Janela PIN usa navegação por ordem de controles habilitados ja existente
  no editor parental: baixo/cima percorrem campo, Confirmar e Cancelar,
  esquerda/direita percorrem acoes. Nao depender de distancias/angulos.
- Conter o foco na janela; limite nao salta ao shell/pagina ao fundo.
  Confirmar desabilitado sem seis digitos/ocupado deve ser ignorado.
  Foco transitorio no proprio dialog usa primeiro controle valido local.
- Texto preserva teclado nativo/IME, edicao por esquerda/direita e ativacao
  nativa de entrada. OK nos botoes continua acionando uma unica vez. Back/Escape
  e Cancelar mantem cancelamento e retorno de foco ja implementados.
- PIN invalido limpa campo e devolve foco a ele depois da verificacao;
  nova tentativa pode percorrer botoes e validar. Nao autoenviar por digitar
  o sexto digito, nao exibir PIN nem registrar valores em diagnosticos.
- Regras de faixa/sem classificacao/adulto, grants/cooldown, PIN/PUK,
  criptografia, armazenamento, source/C9/identidade permanecem intactos.
- Preservar proporcoes e touch. Versao Android22/name1.0.22 distingue patch;
  mesma assinatura/package. Gerar APK separado, sem instalar automaticamente.

## Allowlist estrita

- src/ui/hooks/useDpadNavigation.ts: somente fast path da janela parental,
  entradas de texto dessa janela e fallback de foco local.
- src/ui/components/ParentalPinDialog.tsx: somente foco apos PIN incorreto.
- scripts/test-c133-parental-pin-dialog-dpad.mjs: regressao real por teclas em
  navegador, perfis Fire TV/Android TV/Box/Tizen/webOS e touch/foldable/tablet;
  controles negativos ou execucao anterior devem demonstrar deteccao do bug.
- android/app/build.gradle: versionCode/name apenas.
- Este documento/docs/evidence/C11_PARENTAL_PIN_DIALOG_DPAD.md e apendices em
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md.
- Saidas ignoradas usuais teste/build/sync/Gradle/APK em tmp.

## Aceitacao

Percurso input/Confirmar/Cancelar com controle, seis digitos, edicao, botoes
desabilitados/ocupados, PIN incorreto/correto, cancelamento/back e foco de
retorno. Autorizacao Live so conclui apos PIN correto; cancelar nega, sem
escrever regras/catalogo/segredos remotos. Conferir outros perfis/touch.
Executar C133, regressoes C126/C128/C129 e D-pad Fire, typecheck/build com
prebuild lock e pre-sync/Gradle. Conferir APK package/versao/certificado/assets
web e nativo/marca preservados. Auditoria estrita e memorias append-only.
Navegador simulado nao certifica teclado virtual/controle fisico Fire Stick.
