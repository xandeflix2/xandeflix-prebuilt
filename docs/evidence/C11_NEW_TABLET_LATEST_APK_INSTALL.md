# C11 — APK atual instalado no novo Samsung SM-T561 — 2026-10-05

## Escopo e evidência

Pedido explícito de instalação no novo tablet. [Plano prévio](../architecture/C11_NEW_TABLET_LATEST_APK_INSTALL.md).
Preflight C11/Git próprio/main/origin canônico, HEAD61ec009; tracked inicialmente
limpo e sete operacionais conhecidos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Nenhum novo commit/push/PR, rebuild, patch funcional, backend ou exclusão.

Alvo único identificado: Samsung SM-T561 USB, characteristics=tablet,
Android8.1.0/API27, ARM32 armeabi-v7a. Serial fixo mantido em memória, passado em
todos os comandos de aparelho. SM-X610 anterior e Fire Stick estavam conectados,
mas não receberam comandos de instalação/alteração neste ciclo.

## Artefato conferido e entregue

`Xandeflix-v1.0.0-standalone.apk`, 8.785.127bytes, packagecom.xandeflix.prebuilt,
versionCode1/versionName1.0, minSDK23/target35. API27 do alvo compatível com mínimo.
SHA256F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8.
Assinatura apksigner verify PASS/v1+v2, certificado debug canônico
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Cinco assets do APK byte-idênticos ao dist atual; config standalone sem server.url
e androidScheme=https. Mesmo APK funcional anterior, Git recente somente docs.
Avisos antigos de metadata META-INF/v1 não foram ocultados nem corrigidos por
reempacotamento; verificação v2 aprovada, arquivo original não modificado.

Lock canônico repetido antes da entrega:49 casos e9 controles negativos PASS,
mocks isolados, sem backend real. Nenhum teste relaxado, nenhuma rotação de chave.

## Instalação e confirmação

Consultas inicial e imediatamente anterior não encontraram o package no alvo.
Modelo/API/serial/estado conectado e hash do APK reconferidos antes da instalação.
`adb -s <alvo fixo> install -r <APK>` retornou Performing Streamed Install/Success,
exit0. Primeira instalação real, sem uninstall/clear/root/downgrade/grants amplos.

Após entrega: pm path encontrou APK único, sha256sum no próprio aparelho confere
com o artefato entregue; dumpsys package confirma versionCode1/versionName1.0,
min23/target35. firstInstallTime e lastUpdateTime iguais a2026-10-05 21:52:04,
como reportados pelo relógio do aparelho; não são benchmark/SLA nem horário PC.
Sete arquivos operacionais locais byte-idênticos antes/depois e APK original
intacto. Somente registros documentais autorizados alterados na C11.

Aplicativo não aberto automaticamente: identidade/chave/ativação/catalogação e
playback físico neste aparelho ainda não testados. Não importar credenciais/dados
de outro aparelho nem alterar fonte/licença/backend. Próximo passo seguro: usuário
abrir o app e realizar o pareamento normal. Nenhuma promessa de desempenho feita.
Registros deste ciclo são locais, não publicados; Git anterior permanece61ec009.
