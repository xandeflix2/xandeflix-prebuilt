# C130 — Ícone Fire TV e investigação de piscadas na navegação

## Autorização e preflight — 2026-10-16

Usuário reportou ícone genérico azul após instalar e acrescentou pedido de
investigar tela piscando, confirmado na Home/categorias. Ciclo local único,
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Preservar C129 e demais patches.
Sem Git/backend/uninstall/reset ou instalação automática (preferência anterior
do usuário por instalar manualmente). ADB read-only e navegação de inspeção
permitidos pelo diagnóstico; não ler/exportar fonte, credenciais ou PIN/PUK.

Clone ativo independente C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
xandeflix2/xandeflix-prebuilt, main, HEAD0f68f169f7728fae17c8311832b7643629e97a02.
AGENTS/Architecture/Execution/Source Boundary/Activation Lock lidos.
Baseline1098 hashes e prefixos das três memórias, APK C129 preservado,
em tmp/c130-fire-launcher-icon. Lock inicial26+27+9 PASS.

## Evidência inicial

ADB AFTSS/SDK28/uiMode televisão. APK instalado corresponde por hash ao C126,
não ao C129. Ícones/PNG/banners internos já vermelhos desde C122, porém atividade
launcher não declara icon/banner explicitamente e aplicação usa adaptive XML.
Não tratar cache do launcher como causa confirmada sem inspeção específica.

Processo vivo, uma Activity/WebView; resumo inicial167104KiB PSS e87821KiB GL,
gfxinfo acumulado5877/9777 frames janky. Métrica histórica não prova a causa.
DOM com49 imagens,21MP decodificados, sem animação ativa enquanto hero fora da
viewport. Logs consultados não mostraram crash do processo Xandeflix; serviços
Amazon reiniciados não autorizam atribuir a falha ao app ou ao HDMI.

HomeHero contém WAAPI opacity0→1 em todo o carousel por400ms a cada item.
UseImmersiveArtwork também limpa a paleta a cada identidade. Observar no
aparelho antes de decidir alteração; não refatorar memória, player ou catálogo.

## Plano mínimo e allowlist anterior ao patch

- android/app/src/main/AndroidManifest.xml: icon/banner explícitos apenas na
  MainActivity, mesmas referências canônicas e intents/permissões/package.
- android/app/src/main/res/mipmap-television-xhdpi/ic_launcher.png e
  ic_launcher_round.png: fallback bitmap exclusivo de TV, copiando os masters
  vermelhos já existentes, sem alterar adaptive e ícones de celular/tablet.
- android/app/build.gradle: versão incremental code20/name1.0.20 para APK
  distinguível e evento normal de atualização; sem dependências/build flags.
- src/ui/components/HomeHero.tsx, src/ui/hooks/useImmersiveArtwork.ts: somente
  remover piscada comprovada nas trocas do hero Fire, mantendo rotação/foco,
  outras plataformas, limites de classificação e limpeza no unmount.
- scripts/test-c130-fire-render-stability.mjs; scripts/test-c107-artwork-halo.mjs
  somente se necessário carregar hooks reais e ampliar casos, sem relaxamento.
- Este documento, docs/evidence/C11_FIRE_LAUNCHER_AND_RENDER_STABILITY.md;
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only.
- Helpers/capturas privadas e saídas usuais build/sync/Gradle ignoradas.

## Aceitação e limites

Conferir bitmap TV e resolução compilada do manifest, adaptive phone preservado,
assinatura, dist e APK separado. Sem testes artificiais de PNG; inspeção de
assets/manifest basta. Para piscada, evidência observacional e teste de ciclo
real de efeitos, transição de identidade, quadro de loading, cleanup, timer10s
e foco. Lock/build/regressões apropriadas obrigatórios. Não declarar corrigida
toda piscada ou HDMI sem evidência física após atualização manual.

Fontes primárias: Android manifest activity icon (herança quando ausente),
Android alternative resources (television antes de densidade/API), Amazon Fire
App Builder (ícone instalado vem dos recursos mipmap). Links em evidência final.
