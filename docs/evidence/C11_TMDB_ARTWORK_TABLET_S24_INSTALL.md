# C11 — APK de capas/hero: instalação no tablet e S24

## Escopo e proveniência — 2026-10-06

Pedido explícito: instalar primeiro no tablet conectado e depois no S24.
Plano prévio: docs/architecture/C11_TMDB_ARTWORK_TABLET_S24_INSTALL.md.
Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main; origin
https://github.com/xandeflix2/xandeflix-prebuilt.git; main;
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Preflight/contratos/lock lidos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR.

Empacotado o patch local documentado em C11_SOURCE_FIRST_TMDB_ARTWORK:
cards usam fonte primeiro e recuperação TMDB; heroes Home/Filmes/Séries e
fundos de detalhes usam backdrops horizontais TMDB; categorias variam por
visita/lote e Lançamentos preserva ordem da fonte. Sem edição funcional neste
ciclo de instalação. Backups do APK raiz, app-debug anterior e APK efetivamente
instalado no tablet guardados em tmp/c11-tmdb-artwork-install-20261006/ ignorado.

## Build e verificações

- Suite scripts/test-c11-source-first-tmdb-artwork.mjs: PASS.
- npm run build (inclui lock obrigatório + tsc/Vite): exit0.
- Lock oficial: 49 cenários (22 identidade/boot + 27 promoção), 9 controles
  negativos, PASS antes do build e novamente após Capacitor/Gradle, antes da entrega.
- npx cap sync android: exit0; gradlew testDebugUnitTest assembleDebug:
  BUILD SUCCESSFUL. Tarefa Java up-to-date, 15 relatórios JUnit válidos,
  total 110 testes, zero falhas/erros/skips; sem mudança de entradas Java neste ciclo.
- apksigner verify: exit0; mesmo certificado Android Debug da instalação
  existente. SHA-256 público do certificado:
  b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
- aapt: com.xandeflix.prebuilt, versionCode=1, versionName=1.0,
  minSdk=23, targetSdk=35, label Xandeflix Prebuilt.
- Cinco arquivos dist conferidos byte a byte dentro de assets/public no APK;
  capacitor.config appId correto e sem server.url remoto: PASS.
- Avisos preexistentes de Vite (chunk grande/importações) e Gradle flatDir;
  avisos apksigner META-INF de metadados não cobertos pela assinatura JAR.
  Verificação criptográfica concluiu exit0; APK não foi reempacotado manualmente.

APK: Xandeflix-v1.0.0-standalone.apk, idêntico ao app-debug gerado,
9.210.591 bytes, SHA-256 público:
1BEACE82713AA02BB1FB38953B1E8CDEEB7A4049D0C62DDC2C0877F17C1628E4.

## Tablet — PASS_INSTALL_PRESERVATION

Alvo fixo validado: Samsung SM-X610, API36, currentUser=0, ADB device.
Package já existente; assinatura conferida antes da atualização.
Force-stop somente com.xandeflix.prebuilt, seguido de adb install -r:
Success/exit0. Nenhum uninstall, clear, downgrade ou reset.

Após instalação, SHA-256 do base.apk no aparelho coincide com o APK acima.
Package/versão confirmados; lastUpdateTime=2026-10-06 14:38:35.
522 arquivos privados comparados, incluindo 505 em files/prebuilt e cinco
arquivos nativos de identidade/ativação. files/shared_prefs e armazenamento
local/IndexedDB WebView incluídos na inspeção quando presentes. Igualdade exata
antes/depois e firstInstallTime preservado: PASS. Conteúdo, nomes dinâmicos,
chaves, URLs de fonte e digests privados nunca registrados; comparação só em RAM.
Somente contagens/booleans e hash público do APK gravados no resultado sanitizado.

App não aberto automaticamente. Instalação e preservação de dados não homologam
capas/ativação/playback em execução física; usuário pode abrir para conferir.

## S24 — PENDING_DEVICE_CONNECTION

S24 não apareceu nos inventários ADB deste ciclo. Solicitada conexão USB e
liberação de depuração; instalação nele ainda não executada. Samsung tablet e
Fire Stick presentes não podem substituir o alvo S24. Fire Stick permaneceu
intacto. Quando conectado, validar modelo/SDK/package/assinatura e aplicar o
mesmo APK após o tablet, preservando dados existentes.

## Intercorrência resolvida

Primeira tentativa de verificar a assinatura do backup por cmd.exe dentro de
Node falhou por quoting do comando Windows. Nenhuma instalação havia ocorrido.
Verificação equivalente com chamada direta PowerShell ao apksigner passou;
instalação só ocorreu após confirmação da compatibilidade. Sem alteração de
código, certificado ou redução dos critérios de validação.

## Limites e integridade

Baseline de 567 arquivos não ignorados congelada antes do build. Saídas
Capacitor/Gradle não alteraram código/configuração rastreados. Mudanças permitidas:
plano/evidência deste ciclo e acréscimos aos três arquivos de memória; verificação
final de hashes/prefixos registrada junto à entrega. Projetos histórico e
Xandeflix 2.0 não acessados para escrita. Nenhum backend ou Git modificado.

Verificação final de proveniência: 563 arquivos fora da allowlist mantidos
byte a byte; prefixos originais dos três arquivos de memória preservados.
Somente plano deste ciclo alterado, três memórias acrescidas e evidência criada.
APKs raiz/Gradle idênticos. Nenhuma violação de allowlist detectada.
Contagem automatizada dos 15 relatórios JUnit: 110 testes, zero falhas/erros/skips.

## Continuação S24 conectado — 2026-10-06 — PASS_INSTALL_PRESERVATION

Usuário informou aparelho conectado; preflight repetido com mesmo workspace,
origin/main/HEAD e estado dirty conhecido. AGENTS, Architecture/Execution,
lock e plano lidos. Baseline da continuação: 568 arquivos não ignorados.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem build novo/patch funcional/Git.

Alvo fixo validado Samsung SM-S926B, phone, fabricante Samsung, API36,
currentUser=0, ADB device. Package com.xandeflix.prebuilt já existente v1/1.0;
backup do base.apk anterior em tmp/c11-tmdb-artwork-install-20261006/s24-before.apk.
Assinaturas do APK anterior e do APK entregue verificadas com apksigner exit0;
mesmo certificado Android Debug público registrado acima. Lock obrigatório
executado novamente: 22+27 cenários e nove controles negativos, PASS/exit0.

Force-stop exclusivamente do package autorizado e adb install -r retornaram
Success/exit0. Nenhum uninstall/clear/downgrade/reset. SHA-256 do base.apk no S24
igual ao APK 1BEACE82713AA02BB1FB38953B1E8CDEEB7A4049D0C62DDC2C0877F17C1628E4,
9.210.591 bytes, o mesmo já instalado no tablet. Package/versão confirmados;
lastUpdateTime=2026-10-06 14:45:18.

526 arquivos privados comparados antes/depois, incluindo 508 de catálogo em
files/prebuilt e cinco nativos de identidade/ativação; igualdade exata: PASS.
firstInstallTime preservado: PASS. Comparação dos digests somente em RAM,
sem conteúdos/segredos/digests privados em arquivos, docs ou logs. Resultado
persistido em tmp contém apenas contagens, booleans e metadata pública de APK.

S24_INSTALL=PASS_INSTALL_PRESERVATION. A pendência de conexão registrada acima
foi resolvida; ambos os alvos autorizados receberam o APK na ordem solicitada.
Não houve nova instalação no tablet ou Fire Stick nesta continuação.
App não aberto automaticamente; validação visual/física das capas/playback
permanece pelo usuário e não é inferida da instalação.

Proveniência final: 563 arquivos fora da allowlist preservados byte a byte;
cinco documentos permitidos alterados somente por acréscimos, com prefixos
originais preservados. Nenhum arquivo novo fora da allowlist nem mudança do APK.
Projetos histórico e Xandeflix 2.0 permanecem sem escrita; backend/Git intactos.
