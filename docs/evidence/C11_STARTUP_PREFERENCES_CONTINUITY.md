# C143 - startup sem tela textual intermediaria - 2026-10-17

Spec anterior ao codigo: [C11_STARTUP_PREFERENCES_CONTINUITY](../architecture/C11_STARTUP_PREFERENCES_CONTINUITY.md).
Preflight clone ativo/main/origin canonicos, HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d.
Auditoria C142 PASS; baseline1160 arquivos e copias anteriores ao patch.

## Diagnostico, patch e testes

Antes: AppShell iniciava a leitura local somente ao montar, apos as telas de
startup, e mostrava menu com texto Lendo preferencias enquanto aguardava.
Reproduzido antes do patch em SSR/portas sinteticas com storage pendente:
header presente, startup ausente e texto intermediario presente.

App agora dispara a leitura no effect inicial, sem aguardar catalogo/ativacao.
AppShell aguarda a mesma promise deduplicada do store e mostra exclusivamente
o StartupLoadingScreen existente durante loading, antes de renderizar menu
ou filhos. Nenhum texto intermediario; erro mantem o bloqueio e a recuperacao
por configuracoes. Store, PIN/PUK, regras, autoridade, fontes, catalogo, busca,
player, imagens/caches e servicos permanecem inalterados.

- Novo scripts/test-c143-startup-preferences.mjs5/5 PASS: leitura antecipada
  durante boot ainda pendente, outros effects continuam; App/hook compartilham
  leitura unica; loading sem shell/filhos em phone/tablet/TV e7 rotas; politica
  configurada preservada; erro fechado e acao configuracoes; reentrada sem
  nova leitura/escrita. Store/hook/App/AppShell reais com storage/lifecycle
  sinteticos e StartupLoadingScreen substituido por marcador no teste SSR.
  Nao e teste de renderizacao de imagens nem de aparelho.
- Regressao existente parental16/16 PASS, nenhum teste antigo alterado.
- Lock antes/depois nos builds PASS:26 ativacao +27 promocao +9 negativos.
  Typecheck/Vite web e padrao PASS; cap sync/Gradle assembleDebug/testDebugUnitTest
  PASS.205 testes nativos/35 suites sem falhas/erros/skips.
- Revisao React: todos os hooks antes do return condicional; sem I/O em render;
  effect nao bloqueante; deduplicacao persistente do store evita duplicar leitura
  em StrictMode/remount; sem novo listener, dependencia ou estado artificial.
- Auditoria inversa confirma App identico exceto effect antecipado e AppShell
  identico exceto import/return visual e retirada da branch textual. Gradle
  somente versionCode27->28 e versionName1.0.28.1154/1160 baseline preservados,
  somente esses3 arquivos e3 memorias append-only alterados;3 novos allowlisted.
  Source/catalog/search/parental/native/CSS C142 e HEAD/main/index preservados.

## APK recuperavel e limites

APK com.xandeflix.prebuilt1.0.28/code28, 11388741 bytes, SHA256
57ffcbf8b94a4a6c0f58b18a55517e5bff53d2df6cc005d415a7bd7577d7d6c6.
Assinatura igual ao C142;8 assets dist byte a byte e1412 recursos nativos
identicos; HTTPS standalone, sem server.url ou chunks web de player/cofre.
Texto intermediario ausente e cards/janelas C140/C142 presentes no pacote.
Arquivo privado: tmp/c143-startup-preferences/Xandeflix-v1.0.28-C143.apk.
APK C142 imutavel por hash; nenhum install/reset ou acesso a dados privados.

CUA retornou apps=[]/browsers=[]; continuidade visual no aparelho ainda depende
de conferencia fisica com o novo APK. Nao usada automacao alternativa do
navegador real. Avisos Vite preexistentes sobre Node externalizado, imports
dinamicos/estaticos e tamanho de chunks; nenhum erro de teste/build. Logs,
reproducao e auditorias em tmp/c143-startup-preferences. Sem backend/Git/proximo Gate.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
