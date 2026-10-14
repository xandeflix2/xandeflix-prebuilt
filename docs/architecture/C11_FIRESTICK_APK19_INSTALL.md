# C101 — APK19 e instalação no Fire Stick — 2026-10-13

Pedido explícito: instalar o novo aplicativo no Fire Stick 192.168.3.101.
Este ciclo autoriza gerar APK19 com o patch local C100 e atualizar somente
com.xandeflix.prebuilt via ADB 192.168.3.101:5555, install -r. Substitui apenas
as restrições de build/instalação dos ciclos anteriores para esta entrega.

Preflight: workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main,
HEAD d039f8837dfcfd44374560a9e6642cb93e59c2cf. AGENTS, contratos Architecture,
Execution, Source Data Boundary e lock de ativação lidos. Dirty inicial: C100
(player, testes e documentos); preservar integralmente seu conteúdo.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Nenhum commit/push/PR autorizado.
Alvo identificado: Amazon AFTSSS, API28, package atual code13; minSDK23 compatível.

Allowlist: android/app/build.gradle (somente versionCode19/versionName1.0.19),
este contrato, docs/evidence/C11_FIRESTICK_APK19_INSTALL.md, quatro memórias
docs/STATUS.md, EVOLUTION_REPORT.md, ERRORS_AND_BLOCKERS.md, DECISIONS.md;
tmp/c101-firestick-apk19/** ignorado e saídas usuais build/Capacitor/Gradle.

Executar lock oficial antes/depois da versão, antes de cap copy/Gradle/entrega;
build web de produção, copiar assets, testar/gerar APK debug de assinatura
canônica. Verificar package, SDK, versão, certificado, assets web idênticos a
dist, config HTTPS standalone e presença do updater e novos gestos no DEX.
Preservar APK18 anterior e baseline C100; não refatorar código ou dependências.

Antes de install -r: force-stop somente o package alvo, comparar em memória
hashes de identidade/chave/ativação/instalação e árvore files/prebuilt, verificar
certificado instalado. Após Success: confirmar APK instalado byte a byte,
versão19, UID e firstInstallTime originais e fingerprints locais preservados.
Abertura do app fica com o usuário; instalação não homologa reprodução ou gesto
físico com mouse/toque. Controle remoto anterior continua inalterado.

Proibidos uninstall, pm clear, downgrade, root, grants, restauração de dados,
alteração de fontes/licenças/backend, operação no tablet e projeto histórico.
Não imprimir ou persistir plaintext de chaves, tokens ou fontes. Evidência
somente sanitizada; interrupção se assinatura incompatível ou lock falhar.

Adaptação operacional após falha real de espaço: PackageInstaller rejeitou
install -r com IOException Requested internal only, but not enough space.
Permite remover somente cache/artwork-v1 e cache/WebView do próprio package,
reconstruíveis, após force-stop, snapshot e conferência dos caminhos absolutos
/data/data/com.xandeflix.prebuilt/cache/{artwork-v1,WebView}. Não tocar files,
shared_prefs, app_webview, bancos, cache de outros aplicativos ou configurações
de armazenamento do Android. Conferência privada/catálogo antes/depois continua
obrigatória. Esta manutenção é necessária à instalação pedida, não um reset.
