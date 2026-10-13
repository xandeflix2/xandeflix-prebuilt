# C11 — Instalação do APK atual no novo tablet — 2026-10-05

## Autorização e preflight

Pedido explícito: "um novo dispositivo tablet foi conectado. instale a versao
mais recente nele". Instalação SOMENTE no novo Samsung SM-T561 USB, identificado
por modelo/manufacturer/characteristics e serial fixo mantido em memória.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; GIT_PR_AUTHORIZED=NAO neste ciclo.
Não usar autorização de publicação do ciclo anterior para novos registros.

Workspace/toplevel C11, Git próprio, main/HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e,
origin canônico; tracked limpo e sete operacionais locais conhecidos. AGENTS,
Architecture/Execution Contracts e lock de ativação relidos. Nenhum conflito
de repositório/proveniência. Tablet anterior SM-X610 e Fire Stick conectados,
mas fora do escopo de instalação; todos os comandos de aparelho exigem alvo fixo.

Novo tablet: Samsung SM-T561, characteristics=tablet, Android8.1.0/API27,
ARM armeabi-v7a. Consulta inicial pm list packages não encontrou o package alvo;
primeira instalação constatada, não criada por uninstall/clear.

## Artefato existente validado

- APK: `Xandeflix-v1.0.0-standalone.apk`, 8.785.127bytes.
- SHA256: F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8.
- Package: com.xandeflix.prebuilt; versionCode1/versionName1.0; minSDK23/target35.
- apksigner verify PASS, schemesv1/v2, certificado debug canônico
  b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
- Cinco assets web byte-idênticos ao dist atual, config standalone sem server.url
  e androidScheme=https. Publicação Git recente foi documental, sem novo APK.
- API27 satisfaz minSDK23. Compatibilidade instalada não certifica performance,
  geração da chave, ativação remota, catálogo ou playback físico neste aparelho.

## Allowlist e procedimento

Documentos locais permitidos: este plano,
`docs/evidence/C11_NEW_TABLET_LATEST_APK_INSTALL.md`, STATUS, EVOLUTION_REPORT e
ERRORS_AND_BLOCKERS. Cache npm e eventuais relatórios privados somente em
`tmp/c11-new-tablet-install-20261005/`, ignorados; sem capturar/exportar chaves.
Não modificar runtime/testes/dependências/Android/APK nem pastas históricas.

1. Executar lock canônico49+9 antes da entrega. Falha exige STOP, sem relaxamento.
2. Reconferir serial/modelo/API/package e APK; se o package surgir ou o alvo mudar,
   parar para diagnosticar a mudança, não assumir instalação limpa.
3. Usar `adb -s <alvo fixo> install -r <APK validado>`; sem uninstall, pm clear,
   downgrade, root, grants amplos ou semear/restaurar dados de outro aparelho.
4. Exigir Success/exit0, package instalado/version/timestamps coerentes e SHA256
   do APK instalado igual ao artefato entregue. Falha não autoriza limpar o app.
5. Não iniciar app automaticamente: abertura/pareamento/teste físico pelo usuário.
   Instalação não autoriza escrita manual no backend nem alteração de fonte/licença.
6. Registrar resultado factual e conferir APK/operacionais/proveniência preservados.
   Não instalar em outros aparelhos, commitar/publicar registros ou iniciar Gate.

ADB não está no PATH; executável validado no SDK instalado, sem mudar PATH/global.
Avisos META-INF de assinatura v1 preexistentes não alteram o resultado v2 PASS;
não remover entradas/reempacotar o APK neste ciclo.
