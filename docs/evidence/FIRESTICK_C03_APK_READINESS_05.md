# FIRESTICK-C03-APK-READINESS-05 — especificação anterior à compilação

Autorização nominal atual UTF8/LF SHA256 09344acbbb692f8506bf4fe680787ceca40392f33436165a74a399d2df516dac. Preparar/compilar/auditar apenas o candidato03 fechado; nenhuma instalação ou mudança de dispositivo, funcionalidade, backend ou publicação Git. A ordem atual autoriza APK, substituindo somente a vedação de build do ciclo03 encerrado; não editar nenhum recibo histórico. Não incorpora04.

Origem operacional: C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/ui-performance-recovery-03-20261025/workspace, CLOSURE=LOCAL_IMPLEMENTATION_VALIDATED_PHYSICAL_PENDING, 37 recibos/924 protegidos/196 controles33 suítes. Verificados todos os 1435 arquivos do manifesto, conjunto exato de arquivos gerenciados e SHA do relatório. Ciclo04 (C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/mobile-network-consent-04-20261025/workspace) verificado e congelado por manifesto e hashes dos artefatos externos. Root preservado com10 diferenças L1, HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8, main b3fc8d1e3844bc5601813ab1b298289af5b3f1fd, branch fix/source-output-format-recovery, origin https://github.com/xandeflix2/xandeflix-prebuilt.git. A divergência histórica de branch está documentada na base operacional fechada; não normalizar/mover main. Clone independente recebe exclusivamente overlay integral03 validado, nunca reconstrói funcionalidades da main. Pasta histórica somente leitura, nenhuma operação nela.

Allowlist fechada de documentos, quatro somente append:
- docs/architecture/FIRESTICK_C03_APK_READINESS_05.md
- docs/evidence/FIRESTICK_C03_APK_READINESS_05.md
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Nenhum delta permitido em source, testes, package/lock/dependências, build.gradle, manifesto Android, backup, Capacitor config, scripts de teste/verificadores ou37 recibos. Outputs ignorados normais: dist, ativos Capacitor, registry gerado pelo CLI oficial, Cordova módulo gerado idêntico à infraestrutura anterior, local.properties, Gradle e artefatos sob tmp. Nenhuma normalização de bytes. Cópia node_modules por junction existente, sem instalar pacote.

Procedimento: fresh canon:check, canon:test e C11; npm build com prebuild; capacitor copy android e geração oficial do registro3 plugins; C11 antes de Gradle; testDebugUnitTest/assembleDebug offline; CANON/C11 final. Referências às13 verificações anteriores/39 browser separadas das execuções novas. Versão1.0.37/code37 e package com.xandeflix.prebuilt permanecem os do03. Auditoria verifica assinatura criptográfica, package/versão/minSdk/permissões/recursos, todos os bytes dist e ativos, ausência de marcadores exclusivos04, registry e classes nativas obrigatórias; SHA final e certificado comparados ao APK de referência ec7f53f728d3728f3e0f9756fd9a4808292c5fc6e26f7dfe8957660b1cc1569e. Sem material de assinatura em documentação/log.

ADB opcional estritamente read-only no alvo AFTSS/G071CQ070344374G: modelo/OS/API/ABI, versão/package/path/hash do APK público instalado. Sem input, captura CDP/emulação, start/stop, reset de contadores, shell writes, private data/logs ou operações em outros aparelhos. Não executar install/update/uninstall/clear/reboot.

Rollback: preservar referência pública existente e cópia SHA-verificada no05; conferir mesmo certificado/package/code37, permissões/backup e caminhos persistentes sem migração funcional. Igual versionCode evita downgrade numérico, mas permite atualização somente se estado instalado e políticas do SO aceitarem. Não prometer restauração transacional nem dados após falha; rollback install-r permanece plano não executado. Revalidar alvo/cert/hash e comparar identidade/dados apenas em RAM no gate físico futuro autorizado.

Aceitação: integrity03/04/root+37 recibos intactos;924 protegidos no CANON; preflight/build/Android tests/auditoria PASS; APK exclusivamente03; certificado/package/updatecompatíveis; referência preservada; relatório APTO ou NÃO APTO PARA INSTALAÇÃO CONTROLADA e plano físico completo. APTO não autoriza instalar nem certifica60 FPS, trailer playing/piscadas/10min/primeira instalação. Falha bloqueia entrega, sem contornar testes ou patch funcional. NEXT_GATE_STARTED=NAO.

## Autorização atual

```text
# XANDEFLIX — PREPARAÇÃO DA HOMOLOGAÇÃO FÍSICA DO CANDIDATO 03

**GATE:** FIRESTICK-C03-APK-READINESS-05\
**TIPO:** Preparação, compilação e auditoria de artefato\
**CANDIDATO:** XANDEFLIX-UI-PERFORMANCE-RECOVERY-03\
**PRIORIDADE:** CRÍTICA\
**STATUS:** Autorizada preparação local; instalação ainda não autorizada.

## 1. OBJETIVO

Preparar o candidato 03 para homologação física no Amazon Fire Stick, utilizando exclusivamente a versão fechada e validada no ciclo XANDEFLIX-UI-PERFORMANCE-RECOVERY-03.

O ciclo 04, ANDROID-MOBILE-NETWORK-CONSENT-04, está concluído localmente e deverá permanecer preservado, sem incorporação neste artefato.

Não realizar novas alterações funcionais neste momento.

## 2. PRESERVAÇÃO E IDENTIDADE

Antes de iniciar:

1. Confirmar o workspace fechado do candidato 03.
2. Conferir CLOSURE, hashes e 37 recibos.
3. Verificar a integridade dos arquivos protegidos.
4. Confirmar que as alterações do ciclo 04 não integram o candidato.
5. Verificar package, assinatura e compatibilidade de atualização.
6. Preservar o APK de referência anteriormente identificado.
7. Verificar a viabilidade real do rollback sem perda de dados.

Não reconstruir o candidato a partir de uma main incompleta ou do root histórico.

## 3. PREPARAÇÃO DO APK

Executar autonomamente, dentro das autorizações existentes:

- Preflight CANON/C11.
- Compilação Android do candidato 03.
- Auditoria do APK gerado.
- Verificação de package e assinatura.
- Conferência de versionCode e versionName.
- Verificação de integridade do bundle e recursos.
- Registro do SHA256 final.
- Validação de compatibilidade com atualização in-place.

Se as regras de governança exigirem uma autorização adicional para a geração do APK, preparar a documentação e interromper somente a etapa não autorizada.

Não instalar o APK.

## 4. PLANO DE HOMOLOGAÇÃO FÍSICA

Preparar os procedimentos para executar, após autorização específica:

### Desempenho

- Navegação horizontal com 36 comandos.
- Navegação vertical entre categorias.
- Pressionamentos discretos e contínuos do D-pad.
- Navegação rápida e reversa.
- Expansão horizontal.
- Carregamento progressivo.
- Medição de latência e FPS.
- CPU, memória e recursos gráficos.

### Funcionalidades

- Home.
- Filmes.
- Séries.
- Ver Todos.
- Busca Local.
- Heros.
- Backdrops.
- Trailer automático após 1 segundo.
- Retorno de páginas e recuperação de foco.

### Estabilidade

- Testes prolongados de pelo menos 10 minutos nos cenários estabelecidos.
- Repouso sobre uma capa.
- Trailer aguardando.
- Trailer efetivamente reproduzindo.
- Monitoramento das piscadas.
- Retorno do background.
- Encerramento correto de recursos.

### Comparação

Utilizar a referência física anterior e os resultados da auditoria FIRESTICK-PERFORMANCE-AUDIT-01.

Comparar medições equivalentes, distinguindo FPS do renderer, frames HWUI e apresentação efetiva na televisão.

Não declarar 60 FPS alcançados sem evidência.

## 5. RESTRIÇÕES

Não executar:

- Instalação ou atualização em dispositivo.
- Desinstalação.
- Limpeza de dados.
- Reinicialização de dispositivo.
- Commit, push ou merge.
- Deploy.
- Alterações de backend.
- Incorporação do ciclo 04.
- Modificações funcionais fora do escopo.

## 6. RELATÓRIO FINAL

Entregar:

1. Identificação exata do candidato 03.
2. Integridade dos hashes e recibos.
3. Resultado da compilação e auditoria.
4. Package, versão e assinatura.
5. SHA256 do APK gerado.
6. Compatibilidade de atualização in-place.
7. Viabilidade e limitações do rollback.
8. Identificação do dispositivo-alvo.
9. Plano de testes físicos.
10. Pendências e riscos.
11. Recomendação: APTO ou NÃO APTO PARA INSTALAÇÃO CONTROLADA.

**ORDEM FINAL:** preparar, compilar quando autorizado, auditar e documentar o APK do candidato 03 de forma autônoma, sem instalar ou modificar dispositivos.

Aguardar autorização expressa para a etapa física.
```


## FIRESTICK-C03-APK-READINESS-05 — conclusão — 2026-10-25

RESULT=C03_APK_BUILT_AUDITED_READY_NO_INSTALLATION. APTO PARA INSTALAÇÃO CONTROLADA após autorização física específica. Autorização atual SHA256 09344acbbb692f8506bf4fe680787ceca40392f33436165a74a399d2df516dac. APK03 exclusivo SHA256 dd885bdd677c231e24684462abb8e0641fc50be05570b3c7cb26dba350ef833c,1.0.37/code37/package com.xandeflix.prebuilt, certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d. Fresh CANON196 controles33 suítes/924 protegidos37 recibos; C11/build/Android242 testes38 suítes/assemble/auditoria PASS. Seis documentos alterados; nenhum source/test/config/recibo. Candidato03/ciclo04/root e artefatos preservados. Referênciaec7f… e cópia verificadas; mesmo package/cert/code/manifest/minSdk/ABI suportam update-r e retorno planejados, não executados nem garantia transacional de dados. Fire AFTSS somente metadata/hash públicos via ADB read-only. Zero install/update/uninstall/clear/reboot, Git publicação/backend. Plano físico10min/36 comandos/playing/CPU/memória/60FPS/piscadas separado e não executado; sem captura CDP/emulação. Relatório C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/firestick-c03-apk-readiness-05-20261025/REPORT.md. NEXT_GATE_STARTED=NAO.


# Xandeflix — candidato03 preparado para homologação física

**Gate:** FIRESTICK-C03-APK-READINESS-05. **Data local:**25/10/2026. **RESULT=C03_APK_BUILT_AUDITED_READY_NO_INSTALLATION.** **Recomendação: APTO PARA INSTALAÇÃO CONTROLADA**, após autorização expressa da etapa física e reconferência do alvo/hash. APK compilado e auditado exclusivamente do03; zero instalação ou modificação de dispositivos. O ciclo04 permanece preservado e não está no artefato.

## 1. Identificação e integridade

Fonte operacional exata: `C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/ui-performance-recovery-03-20261025/workspace`. CLOSURE original: LOCAL_IMPLEMENTATION_VALIDATED_PHYSICAL_PENDING; SHA256 do relatório03 `3bd0870bdae116f45d733ab1443cf2fe1704df2059692adb536f83a1963173cf`; SHA256 de CLOSURE03 `b6f9816b9e8c53629e347cc83b70c84f58f04754df127f47c92d1820984df889`; SHA256 de hashes03 `57f1e972522806dd2cb1fa0d2325bbea862750e84510334596526d5744d7b273`. Manifesto completo de **1435 arquivos gerenciados**, todos conferidos byte a byte e conjunto exato de arquivos conferido. Cópia isolada de build: `C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/firestick-c03-apk-readiness-05-20261025/workspace`.

CANON confirma **924 arquivos protegidos e37 recibos**. Os37 arquivos de recibo foram verificados por SHA256, incluindo2 históricos explícitos e35 registros canônicos;3 arquivos ficam fora da pasta authorizations/. Recibo03: blobLF `88fa16477c0f94dad02f962d7a42e26dc19f2670`, SHA256 `8120d41c745d3c2630dc40fa1a0f5ca8e5ea8d6b39a86531312043a62e8f8f96`. Nenhum recibo foi editado, substituído ou acrescentado. PROVENANCE.json contém os37 hashes; CANON verifica também os grants e encadeamento.

Clone independente origin `https://github.com/xandeflix2/xandeflix-prebuilt.git`, branch operacional `fix/source-output-format-recovery`, HEAD `d8a74102124fbb8a3f013f6fd8a502519c1db4b8`, main/baseline `b3fc8d1e3844bc5601813ab1b298289af5b3f1fd`. O HEAD sozinho não contém os patches locais: o overlay integral e SHA-verificado do03 é a fonte desta entrega. A divergência histórica da branch main foi mantida conforme proveniência recebida; não houve restauração/reconstrução pela main nem operação na pasta histórica.

Root mantém suas10 diferenças L1 e **1346 arquivos gerenciados** congelados. Candidato03 e todos os seus artefatos externos permanecem intactos. Ciclo04: **1452 arquivos gerenciados**,38 recibos e artefatos externos igualmente congelados. Não há arquivos exclusivos04 no clone; nenhuma das6 classes nativas04 nem seus marcadores exclusivos foi encontrada em DEX/bundle. O registro continua com37 recibos/924 protegidos, e não38/938. Essa exclusão é deliberada por instrução do usuário.

Autorização atual transcrita em AUTHORIZATION.txt, UTF8/LF SHA256 `09344acbbb692f8506bf4fe680787ceca40392f33436165a74a399d2df516dac`. Ela autoriza build neste gate e substitui somente a vedação anterior de gerar03APK; não autoriza instalação. Especificação registrada antes da compilação em SPEC_BEFORE_BUILD.md e docs/architecture/FIRESTICK_C03_APK_READINESS_05.md. Delta gerenciado contra03: somente6 documentos (docs/architecture/FIRESTICK_C03_APK_READINESS_05.md, docs/evidence/FIRESTICK_C03_APK_READINESS_05.md, docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md, docs/STATUS.md, docs/EVOLUTION_REPORT.md, docs/ERRORS_AND_BLOCKERS.md),4 com prefixo de bytes preservado. **Zero alterações funcionais, testes, dependências, verificadores, package/lock, configurações Android ou recibos.** Saídas usuais ignoradas de build e helpers ficam fora desse delta.

## 2. Compilação e validação

Nova execução de CANON/check/test e C11 antes de build. Regressão fresh: **196 controles/33 suítes PASS**. npm build preservou prebuild/C11 e compilou tsc/Vite. Capacitor copy android e registro oficial Browser/Filesystem/Share pelo gerador instalado do CLI, sem full sync nem alteração dos fontes/configs. C11 antes de Gradle; **testDebugUnitTest e assembleDebug offline PASS:242 testes Android/38 suítes, zero falhas/erros/skips**. CANON/C11 após build e antes da entrega passaram. A tabela abaixo registra comandos reais deste gate.

As13 verificações oficiais e39 cenários browser do03 encerrado permanecem evidência verificada por hashes; não são uma nova homologação física nem nova rodada browser neste ciclo. O canon:test acima foi efetivamente reexecutado no clone03. Não se executou suíte04 nem se incorporaram seus262 testes/classes.

Warnings existentes de chunk web maior500kB, módulos Node externalizados e flatDir foram mantidos e não relaxados. O build produziu APK **debuggable=true**, compatível com a referência de teste: destinado a esta instalação controlada por ADB, sem publicação/release de produção. Mesma versão37 identifica mais de um binário histórico: sempre conferir SHA256.

Duas tentativas iniciais do helper de preparação falharam na contagem (34 arquivos de diretório, depois35 pointers). A composição real do verificador é2 recibos históricos explícitos+35 pointers=37. Helper corrigido para essa mesma composição, sem relaxar37 nem alterar verificador/testes. Registro em PREPARE_HELPER_CORRECTION.json e docs/ERRORS_AND_BLOCKERS.md. Nenhum build havia iniciado nessas falhas; não eram regressões do produto. O primeiro fechamento teve SyntaxError por backticks Markdown não escapados no template de relatório; corrigido e validado por node --check, sem efeitos antes do parse, sem alterar APK/produto. A tentativa seguinte supôs uma main local no clone: clone novo tem origin/main e somente a branch operacional local. Passou-se a conferir refs/heads/main no root e refs/remotes/origin/main no clone contra a mesma baseline congelada b3fc8d1, sem criar/mover branch/ref. Leitura do relatório antes de seu primeiro fechamento encontrou arquivo ainda inexistente. CLOSURE_HELPER_CORRECTION.json preserva essas ocorrências de diagnóstico.

| Etapa | Comando real | Exit | Segundos |
| --- | --- | ---: | ---: |
| prepare-clone | `git clone --no-hardlinks --no-checkout C:/Xandeflix/xandeflix-prebuilt-c11-main C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/firestick-c03-apk-readiness-05-20261025/workspace` | 0 | 0.4 |
| prepare-origin | `git remote set-url origin https://github.com/xandeflix2/xandeflix-prebuilt.git` | 0 | 0.1 |
| prepare-checkout | `git -c core.autocrlf=false checkout fix/source-output-format-recovery` | 0 | 4.0 |
| baseline-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 4.9 |
| baseline-regression | `cmd.exe /d /s /c npm run canon:test` | 0 | 273.9 |
| baseline-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 16.7 |
| web-build | `cmd.exe /d /s /c npm run build` | 0 | 76.8 |
| capacitor-copy | `C:\Program Files\nodejs\node.exe C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/firestick-c03-apk-readiness-05-20261025/workspace/node_modules/@capacitor/cli/bin/capacitor copy android` | 0 | 10.8 |
| before-gradle-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 20.8 |
| android-unit-and-assemble | `cmd.exe /d /s /c gradlew.bat --offline --no-daemon --max-workers=2 --console=plain testDebugUnitTest assembleDebug` | 0 | 324.2 |
| after-build-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 8.5 |
| delivery-c11 | `cmd.exe /d /s /c npm run c11:new-device:lock` | 0 | 22.9 |
| closure-canon | `cmd.exe /d /s /c npm run canon:check` | 0 | 3.8 |
| closure-diff | `git -c core.whitespace=cr-at-eol diff --check -- docs/architecture/FIRESTICK_C03_APK_READINESS_05.md docs/evidence/FIRESTICK_C03_APK_READINESS_05.md docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md docs/STATUS.md docs/EVOLUTION_REPORT.md docs/ERRORS_AND_BLOCKERS.md` | 0 | 0.1 |

## 3. APK e auditoria

APK: `C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-c03-homologacao-20261025.apk`.

**SHA256:** `dd885bdd677c231e24684462abb8e0641fc50be05570b3c7cb26dba350ef833c`.

Tamanho: **12433860 bytes**. Package **com.xandeflix.prebuilt**, versionName **1.0.37**, versionCode **37**. Certificado do único signatário SHA256 **b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d**. Assinatura criptográfica verificada por apksigner, mesma referência; esquemas verificados v1=true,v2=true,v3=false. minSdk=23, targetSdk=35. Manifesto compilado/permissões/identidade iguais aos do APK anterior. Relatórios públicos SIGNATURE/BADGING/MANIFEST/PERMISSIONS preservados, sem chave privada.

CRC de todas entradas ZIP verificado. Todos os **9 arquivos dist** (JS/CSS/HTML/recursos) comparados por SHA256 aos assets/public embarcados; entradas web adicionais limitadas aos shims gerados Cordova. Logo original presente byte a byte (993793bytes; SHA2569095b46daa2ceb18aa2237ab4406a4fe1219036395da3de8cded07d9bb204d10). DEX: **12 arquivos**, classes obrigatórias Browser/Filesystem/Share, NetworkStatus, VodDpadController e PublicTrailer presentes. Bytes DEX idênticos à referência: **true**. Nenhuma classe de consentimento/guard móvel04 presente.

Bundle contém host estável, janela/grade, indicadores de rede existentes e expressão compilada do prazo de tentativa1000ms; HTTPS Capacitor sem server.url remoto e3 plugins oficiais conferidos. Presença no bundle não comprova vídeo real,60FPS ou disponibilidade de TMDB/YouTube. Foram mantidos os mecanismos e limitações funcionais recebidos.

Nenhum arquivo .env, chave/keystore, mapa source, identidade/ativação ou snapshot privado detectado pelos padrões de nomes auditados. Busca limitada de padrões de segredo no bundle não encontrou ocorrências; não é prova absoluta de ausência de qualquer segredo. Nenhum valor privado de dispositivo, fonte, credencial ou chave foi exportado. Detalhes em APK_AUDIT.json, DIST_MANIFEST.json e PLUGIN_GENERATION.json.

## 4. Alvo e atualização in-place

Alvo nominal **Amazon Fire Stick AFTSS**, serial **G071CQ070344374G**, Android **9/API28**, ABI **armeabi-v7a,armeabi**. Leitura ADB em **2026-10-26T01:22:02.744Z**. Instalado versionName1.0.37/code37 e SHA256 **ec7f53f728d3728f3e0f9756fd9a4808292c5fc6e26f7dfe8957660b1cc1569e**, exatamente a referência ec7f… preservada. Um base.apk, sem splits. Nada foi aberto, fechado, navegado, resetado ou instalado por este gate. TARGET_READ_ONLY.json registra somente comandos de leitura de modelo/OS/ABI/metadata e hash do APK público.

Compatibilidade estática: mesmo package, único certificado, code/name, manifesto e permissões; minSdk compatível com API28; bibliotecas ABI do APK: **nenhuma biblioteca JNI empacotada; não há restrição ABI adicional por lib/**. A igualdade do SHA instalado com a referência cujo certificado foi auditado confirma o signatário atual sem consultar dados privados. **Atualização in-place tecnicamente compatível com o estado observado**, sem downgrade numérico. Nenhum install-r foi executado; espaço livre/estado/políticas do SO e hash devem ser revalidados no futuro gate.

## 5. Rollback: viável, sem garantia transacional

Referência original preservada: `C:/Xandeflix/xandeflix-prebuilt-c11-main/Xandeflix-v1.0.37-grade-ver-todos-20261025.apk`, SHA256 **ec7f53f728d3728f3e0f9756fd9a4808292c5fc6e26f7dfe8957660b1cc1569e**. Cópia independente verificada: `C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/firestick-c03-apk-readiness-05-20261025/reference-ec7f53f7.apk`. Fonte nativa e caminhos persistentes/identidade/segurança/catálogo selecionados: **175 arquivos** idênticos entre referência operacional e03; manifesto e regras de backup permanecem iguais. A implementação03 altera UI e helpers de foco/arte, sem migração nova de dados.

Mesmos package/certificado/code37 permitem planejar a volta pelo instalador em modo de substituição preservando dados, após autorização específica e nova conferência do alvo. Não precisa de uninstall/clear nem de downgrade de código no cenário atual. **Rollback não foi executado e preservação real de dados não foi homologada neste gate.** APK não é backup de identidade/fonte/catálogo: se houver perda/corrupção pelo SO ou mudança futura de esquema/versão/signatário, reinstalar a referência não restaura esses dados. Não foi criado backup privado e não se promete perda zero em qualquer falha. Mudança de estado do dispositivo exige reavaliação.

## 6. Plano físico e limites da recomendação

Plano completo: **PHYSICAL_TEST_PLAN.md**, SHA256 `dd38d2057ae1258f4cdf3c6012c45c56c05061a7949db99769be6a0b62de589f`. Inclui referência atual antes do update,36 comandos horizontais6direita/6esquerda, vertical, D-pad físico discreto/mantido/reverso, expansão, paginação/bordas/retorno profundo, Home/Filmes/Séries/Ver Todos/Busca/heros/backdrops/logo, tentativa de trailer1s e playing real, cleanup e background. Sessões de pelo menos10min para navegação, repouso numa capa, espera natural, reprodução real em ciclos e liberação/background, com estados/intervalos ativos explicitados.

Separar rAF do renderer, HWUI e apresentação efetiva na TV; percentis/long tasks/latência/CPU app+renderer/PSS/Graphics em fases equivalentes. Referência histórica FIRESTICK-PERFORMANCE-AUDIT-01 com e457… é contexto não pareado; medir ec7f… e03 no mesmo Fire/cache/cadência antes de atribuir ganhos. Gravação externa sincronizada e logs sanitizados para piscadas; sem screenshot/screencast CDP, Emulation ou alteração de escala/TV.

**Pendências:**60 FPS no Fire, trailer realmente em playing e tempo até primeiro quadro, estabilidade prolongada do novo binário, causa das piscadas, memória/CPU em uso real, retorno do background e preservação de dados após update/rollback. Retenção vertical da Home continua; ausência de evento amostrado não resolve tela preta. Phone/Tablet/outra AndroidTV e primeira instalação não foram homologados. O candidato04 e suas proteções de consumo móvel deliberadamente não fazem parte deste APK.

**APTO PARA INSTALAÇÃO CONTROLADA significa artefato pronto e compatibilidade estática aprovada, não autorização de instalar nem homologação de desempenho.** A etapa física permanece pendente de ordem expressa. Instalações/atualizações/desinstalações/limpezas/reboots=0; nenhum Git add/commit/push/merge/PR, deploy, backend ou próximo gate executado. NEXT_GATE_STARTED=NAO.
