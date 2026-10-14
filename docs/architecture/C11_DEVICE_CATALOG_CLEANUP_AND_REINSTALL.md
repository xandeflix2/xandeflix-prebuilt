# C103 — Limpeza e reinstalação preservando cadastro — 2026-10-13

Pedido explícito: limpar o que pode ser removido e reinstalar o aplicativo no
Fire Stick, tablet e celular. Interpretação operacional: remover catálogos
obsoletos, staging abandonado e cache reconstruível; reinstalar in-place APK19
verificado, preservando cadastro/ativação/configuração/ativo e recuperação.
Não executar uninstall/pm clear/reset, nem restaurar dados de outro aparelho.
Não implica correção funcional da retenção automática ainda pendente C102.

Preflight: workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main,
HEAD d039f8837dfcfd44374560a9e6642cb93e59c2cf. AGENTS e Architecture/Execution,
Source Data Boundary/lock lidos nos ciclos precedentes, intactos. Dirty inicial
C100/C101/C102 preservado. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Nenhum commit/push/PR/backend/build/novo código funcional autorizado.

Alvos já identificados: Fire Stick Amazon AFTSSS/API28 em192.168.3.101:5555;
tablet Samsung SM-X610 em192.168.3.119:33541. Celular só pode ser operado após
conexão/pareamento explícito e identificação de modelo/serial/package.

Allowlist: este plano, docs/evidence/C11_DEVICE_CATALOG_CLEANUP_AND_REINSTALL.md,
quatro memórias STATUS/EVOLUTION_REPORT/ERRORS_AND_BLOCKERS/DECISIONS em docs,
tmp/c103-device-cleanup/** ignorado para helpers/logs/resultados sanitizados.
Artefato reutilizado: APK19 em tmp/c101-firestick-apk19, SHA256
401c8dc29e561370a0ffdd7759ba82c1121f62ec5b2ae5032a23c2c078dfba6c,
certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Verificar APK/lock antes de entrega e assinatura de cada package instalado;
sem downgrade, root, grants, operações em outros packages/projeto histórico.

Por aparelho: force-stop somente com.xandeflix.prebuilt, garantindo que sync
não esteja escrevendo durante manutenção. Inventariar novamente ponteiros e
dirs; preservar união de active.json e active/previous/lastKnownGood do recovery
journal. Validar todos os segmentos declarados dos snapshots protegidos por
hash/tamanho quando declarados, bem como manifest/header, antes de remoção.
Falha/ausência ambígua impede limpeza; não confundir erro de leitura com ausência.

Fingerprints em RAM dos cinco privados de identidade/chave/ativação/instalação/
token e de todos os arquivos files/prebuilt. Remover apenas snapshots não
referenciados após conferir nome e caminho absoluto canonicalizado em
/data/data/com.xandeflix.prebuilt/files/prebuilt/snapshots/<id>; todos staging
Alias canônico Android /data/user/0/com.xandeflix.prebuilt também permitido
quando confirmado por run-as pwd; nenhum outro usuário/diretório permitido.
sob diretório validado, com processo parado; cache/artwork-v1 e cache/WebView
somente se existirem e caminho canônico confirmado. Não remover files root,
active/recovery, prefs, app_webview, bancos ou secure storage.

Não persistir nem imprimir plaintext de arquivos privados/catalog/source.
Antes/depois: comprovar mesma árvore/hash de todos os arquivos que não estavam
no manifesto de remoção, privados iguais, redução física de armazenamento,
install -r Success, UID/firstInstallTime iguais e APK19 instalado byte a byte
igual. Abertura/reprodução/teste de gesto ficam com usuário. Registrar cada alvo
separadamente e ausência/bloqueio do celular sem alegar execução.
