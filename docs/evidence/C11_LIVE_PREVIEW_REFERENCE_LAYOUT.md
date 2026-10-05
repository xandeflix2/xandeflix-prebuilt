# C11 — Coluna de prévia Live conforme referência visual

## Autoridade, escopo e proveniência — 2026-10-04

Usuário forneceu foto de aplicativo semelhante após a etapa intermediária e
solicitou aplicar a estrutura visual somente à coluna de prévia, mantendo
categorias, canais e menu lateral. Preservada solicitação anterior de logo/nome
com AO VIVO à direita e mesma ação Player Nativo abaixo. Fire primeiro e Samsung
depois, atualização in-place do package com.xandeflix.prebuilt, sem reset.

[Spec e emenda anteriores ao código](../architecture/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md).
[Etapa intermediária preservada](C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md).
CURRENT_GATE=NONE; nenhum próximo Gate, Git/backend, fonte/EPG, busca, native
ou trabalho de performance 60s autorizado/iniciado.

Preflight deste ciclo: workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead 2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture, Execution, Source
Data Boundary, Activation Lock e spec lateral lidos; dirty anterior preservado.
Todas as operações de terminal começaram por Set-Location do workspace C11.
Nenhuma escrita no workspace histórico ou no projeto protegido.

## Patch mínimo de apresentação

LiveTvPage.tsx recebeu somente classes e badge desta rodada. Em modo lateral:
seções de preview/EPG display:contents; superfícies e controles existentes em
ordem vídeo -> logo/nome/AO VIVO -> fallback compacto -> Player Nativo.
Vídeo ocupa 100% da coluna, proporção 16:9, sem largura fixa/moldura/gutters
grandes; identificação sem card volumoso. Metadados técnicos ID/formato e
título/chip EPG ocultos somente nesse modo. Logo/nome permanecem visíveis;
nome longo truncado visualmente, sem empurrar badge.

Não há programação real no componente atual. Nenhum horário/programa/barra de
progresso inventado, integração XMLTV ou nova busca/favoritos implementados.
Aviso existente de guia indisponível permanece compacto. Celular em ambas
orientações e tablet retrato mantêm apresentação anterior.

Remover somente classes/badge adicionados recupera exatamente o Live original
normalizado: f8b839cf56e830d1db8559e6b2644f82731682bcfacd0ec2d80a4a8e90734783.
Prefixo CSS anterior à rodada preservado exatamente, normalizado:
f3d9b9c3f0da20ed71577375e6c9bf4ec737dd92b672555512cf1a8624160b5c.
Todos os handlers, refs, efeitos, seleção, filtros, paginação, bridge, C9,
serviços/ativação e duas colunas anteriores permanecem intactos.

Auditoria final de 401 arquivos baseline: 397 byte-idênticos; quatro diferenças
permitidas são Live/CSS/teste de browser/APK. Hashes públicos finais:

| Artefato | SHA-256 |
|---|---|
| LiveTvPage.tsx | C207860EB761530BB0D847D8C48054127659EEB09463E88025610421B2A08362 |
| index.css | AEFEDD1D7A95EE1117DE842D468A8EC920190B9F0F9D3AF0EA8143999BC77785 |
| teste de browser | 715ECA00E1AC88BA9F4115FAECA4F2A5CFD2BB2C3DB987B0EE1E6B84F99F7FA6 |
| APK raiz/instalado | 3B3673C8ED5D0F54DB802E1F86E0B3D3B6D6D23A92C30A040188406590A75E07 |

## Testes, inspeção visual e build

- Lock oficial antes do refinamento e post-patch/prebuild: 22 identidade/boot
  + 27 promoção de diretórios, nove controles negativos, PASS.
- Browser: 53 checks/zero erros PASS, matriz Fire 960x540/1280x720,
  TV 1920x1080, tablet 1280x800/1024x600, retrato/celular preservados.
  Asserts de largura total/16:9, ordem compacta, badge à direita, metadados
  ocultos, fallback honesto, ação única/visível, foco e callbacks existentes.
  Rotação preserva os mesmos nós do player/botão e cleanup de listeners.
- C9 runtime wiring 10/10, VOD direct stream 12/12 e Live T127–T143 17/17 PASS.
- tsc/Vite, cap sync android e assembleDebug PASS; 142 tasks, 25 executadas,
  117 up-to-date. Cinco arquivos dist/public idênticos por hash ao APK.
- Assinatura válida com certificado debug anterior b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d;
  package/versionCode/versionName com.xandeflix.prebuilt/1/1.0, HTTPS,
  CapacitorHttp, mixedContent e loggingBehavior=none confirmados.

Skills agent-browser, agent-browser-verify e verification orientaram gut-check
imediato/render/console/fluxo. CLI ausente; fallback ao harness Chrome/CDP
existente, perfil isolado, adapters e rede externa bloqueada. Nada de API/env/
dados reais novo. Erro de preview sintético é esperado no adapter sem player,
não falha de reprodução física. Ação nativa no fixture valida somente guard.

Primeira passagem do refinamento PASS; inspeção visual motivou colocar ação
próxima dos detalhes, garantindo acesso visível em telas menores. Nova passagem
com assert explícito de visibilidade PASS. Screenshots sintéticas Fire/tablet/
phone inspecionadas. Relatório final:
[browser](../../tmp/c11-side-navigation/run-1791155116545/report.json).

APK raiz Xandeflix-v1.0.0-standalone.apk: 8784293 bytes, hash acima.
Backup novo recuperável Xandeflix-v1.0.0-standalone-before-live-preview-reference.apk:
457E21EEC1FC10677DECD5D1216CA5E835042DCBA9CADAB9C31ABC34F98DBCFD.
Backups anteriores não sobrescritos; nenhum arquivo material eliminado.

## Instalação e confirmação física

Install -r Success primeiro AFTSSS 192.168.3.104:5555 e depois Samsung SM-X610
RX2X301Q3KY. base.apk público instalado coincide com APK raiz nos dois.
Quatro arquivos privados de identidade/chave/instalação/ativação por aparelho
e árvore files/prebuilt idênticos antes/depois de instalar: Fire 436 arquivos,
Samsung 505. Comparações somente em RAM, nenhum valor/digest privado divulgado.
MainActivity abriu Status ok nos dois, sem uninstall/clear/reset/outro alvo.

| Medida CSS física | Fire 960x540, PID 8711 | Samsung 1365x853, PID 12616 |
|---|---|---|
| Vídeo largura x altura | 480 x 270 | 725.333 x 408 |
| Vídeo bottom / botão top | 308 / 399.984 | 462.533 / 554.533 |
| Preenche coluna / 16:9 / resumo logo abaixo | PASS | PASS |
| Badge no card à direita / ação única visível | PASS | PASS |
| Detalhes técnicos ocultos / EPG compacto honesto | PASS | PASS |
| Categorias/sidebar/header/sem overflow | PASS | PASS |
| Processo preservado durante probe | PASS | PASS |

[Fire — DOM](../../tmp/c11-side-navigation/fire-live-preview-reference-1791155493651/report.json).
[Samsung — DOM](../../tmp/c11-side-navigation/tablet-live-preview-reference-1791155516626/report.json).
Recortes Samsung de header/botão/badge inspecionados, sem mídia/IDs/URLs.
Fire confirmado DOM-only: captura não repetida após timeout conhecido da
etapa intermediária. Nenhuma nova falha de captura nessa etapa.

UI acionou somente Canais pelo menu observado quando necessário. Nenhum canal/
grupo/Player Nativo/fullscreen acionado fisicamente; preview automático normal
não interceptado. Nenhum console/rede/private storage extra coletado pelo probe.
Forwards próprios removidos, lista final vazia. Testes não homologam playback
real, busca histórica, estabilidade universal ou SLA de abertura.

## Incidentes e limites

Um comando de auditoria excedeu limite Windows de criação do processo e não
iniciou auditoria/build; um wrapper posterior teve SyntaxError antes de executar.
Recuperação com lotes limitados, auditoria 401 e build PASS; sem escrita parcial
de produto. Avisos existentes node:fs/node:path, imports mistos/chunks e Gradle
flatDir permanecem fora do escopo. Nenhum aviso crypto externalizado.
git diff --check do escopo PASS; apenas avisos LF/CRLF preexistentes.
Nenhuma regressão nos testes executados; próxima demanda/Gate não iniciada.
