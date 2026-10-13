# Status Operacional — Xandeflix Prebuilt

## Proteção de descanso Live corrigida; somente Fire Stick atualizado — 2026-10-05

Correção autorizada nos dois modos: PlayerView mantém tela durante playback/
buffering em primeiro plano, libera em pause/erro/stop/background. Mesmo player
e fullscreen; ativação/fonte/C9/UI intactos. Lock49+9, novo guard+8 negativos,
15 suites/128 testes Android e regressões selecionadas PASS; build/sync/Gradle,
assinatura/config/assets conferidos. APK8827394bytes/BC8CA0BD... instalado -r
SOMENTE AFTSSS/192.168.3.103, Success/hash correto. Cinco privados e436 arquivos
de catálogo preservados; instalação original e ajustes globais de descanso
inalterados. Backup APK anterior retido. Sem Git/backend/reset/outro aparelho/
novo Gate. Teste físico de6min na prévia e6min em fullscreen solicitado ao
usuário, ainda PENDENTE; leitura final confirmou hold-screen da MainActivity
no Android físico, mas não duração/modo nem ausência de screensaver nos dois.
[Evidência e limites](evidence/C11_LIVE_SCREEN_AWAKE_FIX.md).

## Tablet SM-X610 e Fire Stick com APK atual; dados preservados — 2026-10-05

Pedido explícito de atualizar os dois aparelhos conectados, sem limpeza.
APK existente8785127bytes/F58BC34D..., assinatura/config/5 assets atuais e
lock49+9 PASS. install -r Success nos dois, hash instalado correto e versão1.0.
Cinco privados preservados em cada alvo; catálogo505 arquivos no tablet e436
no Fire Stick byte-idênticos antes/depois, firstInstallTime inalterado.
Sem launch automático, reset, rebuild, patch funcional/backend/Git/novo Gate.
SM-T561 não conectado: usuário informou início de sincronização após ligar
internet, não conclusão do catálogo/playback nem causa comprovada de RPC_FAILED.
Conferência visual/reprodução pendentes do usuário.
[Evidência](evidence/C11_TABLET_FIRESTICK_CURRENT_APK_UPDATE.md).

## Novo tablet SM-T561 instalado; primeira abertura pendente — 2026-10-05

Instalação explicitamente autorizada somente novo Samsung SM-T561 USB/API27.
Package inicialmente ausente; install -r retornou Success, sem limpar/restaurar.
APK atual8785127bytes/F58BC34D..., versão1.0, assinatura v1/v2 e cinco assets
atuais conferidos; hash instalado igual ao original. Lock49+9 PASS antes da entrega.
Operacionais/APK preservados; outro tablet/Fire Stick não alterados. Sem launch,
backend, rebuild, alteração funcional, commit/push/PR, exclusão ou próximo Gate.
Geração de chave/pareamento/catálogo/playback físico ainda dependem do teste do
usuário. [Evidência](evidence/C11_NEW_TABLET_LATEST_APK_INSTALL.md).

## Publicação dos registros da migração autorizada — 2026-10-05

Pedido explícito de commit/push para alinhar C11/main ao repo canônico. Escopo
documental de oito arquivos; Git independente confirmado, remoto no parentfd2f561,
zero workflows Actions configurados. Candidatos sem segredos de alta confiança,
lock49+9 PASS,548 hashes fora da allowlist idênticos; staging literal/revisão dos
blobs precedem envio, resultado será confirmado por refs/árvore/status.
Código/APK/dist e sete operacionais preservados; backups privados ignorados.
Sem rebuild/backend/deploy/instalação/reset/exclusão/PR ou próximo Gate.
[Autorização e limites](architecture/C11_INDEPENDENT_GIT_MIGRATION.md).

## C11 com Git próprio; arquivos locais preservados — 2026-10-05

Migração administrativa expressamente autorizada, spec antes da execução.
Backups integrais das duas pastas verificados por tamanho/SHA256, incluindo
ignorados, APKs, sete operacionais e metadata Git antiga; zero divergências.
Troca somente do `.git` apontador da C11 por Git próprio, mesma main/HEAD/origin;
git-dir/common-dir locais, worktree única, sem alternates/dependência histórica.
Primeira auditoria pós-troca:8.669 arquivos de trabalho e9.594 históricos idênticos.
AGENTS atualizado; pasta antiga/backup retidos, nenhuma exclusão autorizada.
Lock antes/depois49+9, chave16, fonte31, playback11 e typecheck/build414 PASS.
Web build isolado dentro do backup; cinco outputs idênticos ao dist preservado,
APK8785127bytes intacto. Sem código/Android/dependências/backend/aparelhos/Gate.
Nenhum novo commit/push/PR; registros administrativos continuam somente locais.
[Procedimento e evidência](evidence/C11_INDEPENDENT_GIT_MIGRATION.md).

## Novo checkpoint local das entregas recentes; análise do push — 2026-10-05

Commit local expressamente autorizado: fonte exclusiva por aparelho, acesso à
Ativação na Home phone e mesma chave visível após autorização, com specs/testes.
Manifesto literal21 arquivos; sete operacionais e APK fora do commit, preservados.
Lock49+9, chave18, fonte31, gestor20, layout18+hook, playback11, typecheck/build414
PASS; falha textual legada manager-form T15 continua14/15, também no parent.
Nenhum novo patch funcional ou instalação/reset/backend/novo Gate neste ciclo.
Capturas do usuário mostram Deploy to production OFF no Supabase/repo correto;
Vercel não encontrou vínculo nos escopos acessíveis. GitHub push permitido, sem
admin via API para hooks/protection (HTTP404); capturas posteriores do usuário
mostram webhooks vazios e somente o App Supabase instalado. Pendência administrativa
esclarecida; nenhum gatilho de deploy de produção identificado pelas evidências.
Push NÃO executado, aguarda confirmação explícita/reconferência de main remoto.
APK F58BC34D... intacto; sem publicação web ou certificação universal de automações.
[Evidência e limites](evidence/C11_GIT_CONSOLIDATION.md).

## Chave permanente visível após autorização; celular atualizado — 2026-10-05

Correção aprovada: chave/cópia em cartão comum da Ativação, usando a chave
existente; feedback local de cópia separado, formulário A1 segue condicional.
Somente ActivationPage e APK alterados entre405 runtime;403 byte-idênticos.
Teste18/AST dos efeitos e handlers, lock49+9, playback11, fonte exclusiva31,
browser sintético/clipboard/viewport320/390/1024/960 PASS; build/cap/Gradle PASS.
APK final8785127bytes/SHA256F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8
instalado SOMENTE no SM-S926B com install -r/Success/hash instalado correto;
cinco privados e508 arquivos do catálogo preservados. Sem reset/rotação/launch/
outro aparelho/Git/backend/novo Gate; confirmação visual física pelo usuário
pendente. Backup APK anterior preservado. Falhas auxiliares do harness resolvidas
sem mudar produção/relaxar testes; pendências de fonte remota/publicação continuam.
[Evidência](evidence/C11_ACTIVATION_KEY_VISIBILITY.md).

## APK atualizado somente no celular; dados preservados — 2026-10-05

Pedido explícito: somente celular, sem limpar. Samsung SM-S926B identificado por
modelo/characteristics=phone; alvo ADB RXGYB03FL4W. Lock canônico49+9 PASS antes
da entrega; install -r com Success. APK instalado confere com SHA256 da entrega
8463607357B9042ACC95FF5037D2747CFEDA98C1899998D90AED17B0225FC6EB.
Cinco arquivos privados e508 arquivos do catálogo byte-idênticos por hash antes/
depois; instalação original de2026-10-03 preservada. Nenhum uninstall/clear/reset,
abertura automática, fonte real trocada ou teste de reprodução. Fire Stick e
tablet NÃO atualizados. Somente docs neste ciclo, sem build/Git/backend/novo Gate.
Conferência visual no aparelho pelo usuário ainda pendente; painel não publicado.
[Evidência](evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md).

## Fonte exclusiva por aparelho e chave na Home mobile — 2026-10-05

Patch local: Clientes/Inspecionar/dispositivo → Trocar fonte exclusiva, sem editar
fonte compartilhada; confirmação remota, retry sem duplicar criação, URL transitória.
Atalho Ativação somente no cabeçalho da Home phone à direita; footer quatro ícones.
Lock49+9,31 testes exclusivos,20 ativação gestor,18 layout/hook,11 playback,
44 verificações Header e browser manager final PASS; typecheck/build/cap/Gradle PASS.
400/405 runtime preservados; diferenças apenas quatro UI existentes e APK atual.
APK8751706bytes gerado/assinatura/assets verificados, backup anterior em tmp.
Nenhuma instalação, fonte real trocada, backend write ou publicação Git/hospedagem.
Falha textual legada T15 do manager-form já presente no HEAD continua pendente.
Timeout do harness browser resolvido com sessão nova pré-aberta; UI final PASS.
[Evidência](evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md).

## Checkpoint Git local validado; push retido — 2026-10-05

C11 já é main do repo existente; não criar backend/banco nem mesclar o original.
Manifesto108 arquivos para checkpoint local; sete operacionais preservados fora
do Git. Lock49+9 antes/depois/prebuild, typecheck, regressões de playback/UI,
importações sintéticas100k/250k(83 testes) e build PASS, sem crypto externalizado.
Nenhuma nova mudança funcional: somente EOF vazio; APK entregue intacto.
Usuário desconhece deploy automático; verificações de leitura não o descartam.
NÃO executar push até confirmar integrações administrativas. Main remoto e99f830
inalterado; sem backend write/reset/aparelhos/deleções/novo Gate. Meta Fire<=60s
e beta>100 simultâneos não certificadas. Não apagar pasta que contém Git comum.
[Plano](architecture/C11_GIT_CONSOLIDATION.md) / [evidência](evidence/C11_GIT_CONSOLIDATION.md).

## Capturas avulsas removidas manualmente e verificadas — 2026-10-05

16/16 PNGs previstos ausentes após guia no Explorador e confirmação do usuário.
Agente não repetiu exclusão bloqueada.405/405 consolidados e todos7991 arquivos
preservados idênticos por inventário/hash agregado; scripts scratch/evidências/
recursos Android/APK atual e último backup intactos. ~21,7MB nos alvos retirados,
não espaço livre medido; recuperação pela Lixeira depende de permanecerem nela.
Sem código/build/testes novos/instalação/Git/backend/dispositivo/ativação/player/
novo Gate. Somente cinco documentos previstos atualizados. Nenhuma pendência
destes16 alvos; bloqueio automático abaixo permanece registro histórico.
[Evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

## Histórico: exclusão automática das16 capturas bloqueada — 2026-10-05

Novo pedido autorizou somente três PNGs raiz+13 scratch, sem excluir diretórios/
scripts/forensics/tmp/recursos. Preflight405/405 consolidados iguais,16 nomes/
21732500bytes/caminhos/links validados. Tentativa não-recursiva rejeitada pelo
terminal antes de executar (blocked by policy).16/16 presentes depois, zero
imagens/bytes removidos, APK atual/dois scripts scratch intactos. Sem contornar
política. Limpeza de caches anterior permanece concluída; capturas pendentes.
Somente documentação alterada; sem código/build/Git/backend/dispositivo/novo Gate.
[Evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

## Limpeza segura concluída manualmente e auditada — 2026-10-05

Usuário executou etapas guiadas; agente não repetiu exclusão automatizada.
199/199 alvos previstos ausentes:97 perfis/96 caches/cinco intermediários/cópia APK.
Tamanho auditado anterior ~3,1GB (não medição exata de espaço livre).405/405
consolidados e inventário/hash dos8023 preservados idênticos,918 PNGs/92 relatórios/
18 APKs raiz intactos. Lock49+9 e typecheck PASS após limpeza; sem rebuild/sync/
instalação/Git/backend/reset/novo Gate. APK atual e backups mantidos; caches/
intermediários regeneráveis, cópia APK recuperável do backup. Sem pendência da
allowlist; bloqueio automático anterior permanece apenas registro histórico.
[Evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

## Limpeza segura autorizada, bloqueada antes da primeira remoção — 2026-10-05

Plano estrito/193 caches+cinco alvos nativos+cópia APK duplicada, preflight/lock49+9
PASS;405/405 consolidados e inventário preservado8023 arquivos conferidos.
Controle de execução rejeitou comando de exclusão antes de iniciar: blocked by
policy. Nenhum arquivo removido/espaço liberado, nenhuma etapa posterior;193/193
caches/cinco alvos nativos/APK duplicado ainda presentes. Sem contornar política.
Somente documentação da manutenção alterada; APK atual/18 APKs raiz intactos.
Limpeza NÃO concluída; precisa de liberação legítima da execução antes de retomar.
[Evidência](evidence/C11_SAFE_WORKSPACE_CLEANUP.md).

## Detalhes phone com Header64px/Back direito — três aparelhos atualizados — 2026-10-05

movie-detail/series-detail reutilizam Header64px e seta centralizada à direita,
sem Início adicional. Shell/CSS mínimo; Header/páginas reais/player/ativação/native
intocados,401/405 hashes0665 iguais. Negativo baseline e positivo30+regressões250
=280/zero erros; lock49+9/guards/build/sync/Gradle PASS. APK EE BE (SHA256
EEBEED35E466C9DC0948E6E9452FC8062B5B1B261937AFB08A5BE5EFADAB338F),9062069bytes,
mesmo package/cert/assets/config validado, backup0665 mantido. Usuário autorizou
instalação-r celular -> Fire -> tablet sem limpeza. Ordem executada, hashEEBE e
abertura Status:ok confirmados nos três; privados4/catálogos508/436/505 iguais
em RAM antes/depois, antes da abertura.405/405 hashes finais locais idênticos
após última entrega; diff --check PASS, sem pendência de instalação nos três.
Sem Git/backend/Settings/reset/novo Gate/60s; não certificar reprodução física.
[Evidência atual](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Entrega0665 concluída — celular, Fire, tablet nessa ordem — 2026-10-05

Usuário autorizou ordem celular -> Fire -> tablet. Mesmo APK06655653...CD4A964
instalado-r no SM-S926B primeiro e AFTSSS/192.168.3.103 depois, sem limpeza.
Quatro privados e catálogos508/436 iguais em RAM antes/depois; hash instalado
e abertura Status:ok confirmados nos dois. TabletSM-X610 reconectado durante
consolidação, instalado-r por último: quatro privados/505 arquivos iguais,
hash0665 e Status:ok confirmados. Mesmo artefato final nos três, sem pendência.
Lock49+9/package/cert PASS;405/405 hashes locais idênticos após entrega.
Sem mudanças de produção/testes/APK/backend/Git/Settings/reset/novo Gate/60s.
[Evidência atual](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Navegação phone quatro ícones — APK pronto, não instalado — 2026-10-05

Somente Filmes/Séries/Canais/Busca no rodapé do celular, SVG32px sem texto.
Início no topo direito junto a Voltar somente Filmes/Séries/Busca/Ativação;
Home sem ambos, tablet/Fire/TV preservados. Browser250/zero erros, lock49+9/
guards/typecheck/build/sync/Gradle PASS;400/405 hashesCE39 iguais (só Header,
Shell/CSS/harness/APK mudaram). Ativação/player/Live/Java/source intocados.
APK06655653...CD4A964/9062043bytes validado e backupCE39 recuperável mantido.
Sem instalação desta versão/ADB/limpeza/Git/backend/Settings/novo Gate/60s.
[Evidência atual](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Home phone com a mesma altura64px — três aparelhos atualizados — 2026-10-05

Home mobile agora compartilha64px+safe-area de Filmes/Séries/Busca, sem Voltar.
Tablet/Fire/Live/ativação/player intactos. Browser209/zero erros, lock49+9/build/
sync/Gradle PASS;402/405 hashes5C34 iguais. APK CE39CA71...AFBCC6C instalado-r
no celular/Fire/tablet reconectado, quatro privados e catálogos508/436/505 iguais,
hash/abertura confirmados nos três;405/405 hashes finais idênticos após instalar.
Sem limpeza/Git/backend/Settings/novo Gate/60s.
[Evidência atual](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Entrega final — Home sem Voltar em todos e Header phone64px — 2026-10-05

Home não renderiza Voltar em nenhum layout, histórico/Back hardware preservados.
Filmes/Séries/Busca phone<600: Header64px+safe-area, seta SVG centralizada no
mesmo botão44px à direita; tablet/Fire e outras rotas/layouts preservados.
Browser209/zero erros, lock49+9/guards/build/sync/Gradle PASS;400/405 hashes B3B
idênticos e405/405 finais iguais após instalar. APK5C34E11D...7052AFC instalado-r
no celular, Fire103 e tablet reconectado; quatro privados e catálogo508/436/505
iguais, hash instalado/abertura normal confirmados. BackupB3B preservado.
Sem limpeza/ativação alterada/Git/backend/Settings/novo Gate/teste limpo/60s.
[Evidência final e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Voltar mobile à direita/só ícone — três aparelhos atualizados — 2026-10-05

Filmes/Séries/Busca phone<600: mesmo botão à direita, só seta/alvo44px, marca
à esquerda; Home/Live/retorno/ativação/tablet/Fire intactos. Browser202 checks/
zero erros, lock49+9/typecheck/guards/build/sync/Gradle PASS;401/405 hashes iguais.
APK B3B0D71E...4D3623 instalado-r no tablet SM-X610, Fire AFTSSS novoIP
192.168.3.103 e celular SM-S926B reconectado. Quatro privados por aparelho e
catálogos505/436/508 arquivos idênticos; hash instalado/abertura normal confirmados.
Sem limpar dados/alterar ativação/Git/backend/Settings/novo Gate/teste limpo.
Tablet desconectado só após a atualização; celular e Fire ativos no diagnóstico.
[Evidência e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Entrega nos três dispositivos — celular atualizado, tablet/Fire pendentes — 2026-10-05

Pedido atual ampliou a entrega para os três aparelhos. APK9FF23801...F9CF80
instalado -r no celular SM-S926B/RXGYB03FL4W; assinatura/package/hash conferidos,
quatro privados e508 arquivos de catálogo idênticos; abertura Status:ok/processo
ativo/MainActivity em primeiro plano. Sem limpar aplicativo ou alterar produção.
Tablet SM-X610 não conectado; Fire192.168.3.104:5555 recusou ADB10061. Ambos
NÃO atualizados, aguardam conexão solicitada ao usuário. Lock49+9 PASS e
baseline405/405 idêntico. Sem Git/backend/gestor/reset/novo Gate/teste limpo.
[Evidência e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Canal Live preservado ao navegar e Home phone sem Voltar — 2026-10-05

Categoria/filtro/paginação não trocam canal/player/C9; seleção explícita troca
uma vez. Home phone<600 sem Back visível, histórico e outras rotas intactos;
tablet/Fire/native/ativação/boot/source preservados. Browser43+14+26+25+59,
zero erros; lock49+9/guards/build/sync/Gradle PASS.400/405 hashes iguais.
APK9FF23801...F9CF80,9061949bytes, assinatura/assets/config conferidos, backup
4B66... preservado. NÃO instalado nesta rodada, sem resposta à pergunta de
atualização; teste limpo não antecipado. Sem Git/backend/reset/novo Gate/60s.
[Evidência, autoridade e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Celular atualizado primeiro, sem limpeza — 2026-10-05

APK4B66D7BF...FF835A instalado -r no SM-S926B/RXGYB03FL4W; assinatura e hash
instalado conferidos. Quatro privados e508 arquivos do catálogo byte-idênticos;
abertura normal Status:ok, processo vivo/MainActivity em primeiro plano.
Lock49+9 PASS;405/405 baseline preservado, sem novo código/build/outro aparelho.
Nenhum uninstall/reset/Git/backend/Settings/novo Gate; versão limpa e teste físico
de rotação/fullscreen ainda não executados. Sucede pendência de instalação abaixo.
[Evidência e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Live mobile limpo e telefone em retrato — 2026-10-05

Prévia permanente de ponta a ponta acima de Categorias/Canais; um Voltar,
sem versão/badges técnicos/Player/Trocar Categoria/Player Nativo. Fullscreen
por segundo clique/tap; UI phone retrato, player paisagem/Back restaura retrato;
tablet/TV sem orientação forçada. Ativação/source/config/VOD intactos.
APK4B66D7BF...FF835A (9061936bytes) gerado/assinado/assets conferidos, NÃO instalado.
Celular conectado usa8828F120...FD4B8C; instalação/teste físico aguardam confirmação.
Browser59+26+25/zero erros, Java102, lock49+9/guards/build PASS;393/401 iguais.
Backup anterior preservado; um EOL de contexto CSS recuperável em RAM, regras
originais intactas. Sem reset/backend/Git/novo Gate/retomada60s.
[Evidência e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## Live fullscreen com fundo opaco — 2026-10-04

Fundo transparente era mantido ao expandir PlayerView; preto agora cobre áreas
externas ao vídeo, mantendo FIT e restaurando transparência/limites ao Back.
Único arquivo produção alterado; JSX/CSS/gestos/ativação intactos.
APK6F1C4F36...54994B (9062241 bytes) instalado Fire primeiro/Samsung segundo -r,
quatro privados cada e catálogo436/505 preservados; hash instalado exato.
Guard novo+cinco negativos, browser58+24, Java96, lock49+9/guards/build PASS.
Confirmação física de gestos/Back nos dois; no Samsung faixas externas de8px
com bounds nativos comprovados tiveram100% pixels pretos. Primeiro capture
inconclusivo por geometria em transição, único reteste bounded PASS sem patch.
399/401 baseline idênticos; nenhum reset/backend/Git/novo Gate/retomada60s.
Supersede somente apresentação fullscreen do APK anterior.
[Evidência visual e limites](evidence/C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md).

## Live: tela cheia por gesto, colunas independentes, sem botão redundante — 2026-10-04

APK final ED324AF7...02B5F09 (9062241 bytes) instalado -r primeiro Fire e depois
Samsung, hash instalado exato; quatro privados cada e catálogo436/505 intactos.
Canal diferente mantém inline; confirmação do selecionado expande mesmo player.
Tablet também expande por toque nativo; Back retorna à prévia. Player Nativo
retirado do modo lateral/paisagem; celular/retrato preservados. Categorias,
canais e prévia rolam internamente sem arrastar a página inteira.
Browser58+24/zero erros, Java96/zero falhas, lock49+9/guards/build/assets PASS.
394/401 baseline idênticos; só cinco produção/teste/APK divergem. Fire primeiro
probe expirou com mudança de rota, causa não confirmada; único reteste
instrumentado confirmou Enter/click/fullscreen/Back com mesmo PID. Samsung
confirmou tap/Back/swipe. Sem reset/backend/Git/próximo Gate/retomada60s.
Supersede somente entrega Live anterior; ativação protegida não foi alterada.
[Evidência final e limites](evidence/C11_LIVE_FULLSCREEN_GESTURES.md).

## Coluna de prévia Live refinada e instalada nos dois alvos — 2026-10-04

Referência visual aplicada somente à prévia no modo lateral: vídeo largura
total/16:9, logo/nome/AO VIVO à direita e programação compacta abaixo, mesma
ação Player Nativo visível. Categorias/canais/sidebar, celular/retrato e
ativação/player sem mudanças funcionais. Sem dados EPG fictícios.
APK 3B3673C8...A75E07 (8784293 bytes) instalado -r primeiro Fire e depois Samsung,
base.apk confirmado; quatro privados cada e catálogo 436/505 preservados.
Browser 53/zero erros, lock 49+9, guards/build/assets/assinatura e DOM físico
PASS; Samsung crops inspecionados, Fire DOM-only por limite prévio de captura.
397/401 baseline iguais; demais somente Live/CSS/teste/APK. Sem reset/Git/
backend, próximo Gate ou retomada 60s. Supersede refinamento pendente abaixo.
[Evidência final](evidence/C11_LIVE_PREVIEW_REFERENCE_LAYOUT.md).

## Etapa intermediária de controles Live entregue — 2026-10-04

APK 457E21EE...DBCFD (8749802 bytes) instalado -r primeiro no Fire e depois no
Samsung: quatro privados de cada e catálogo 436/505 arquivos preservados.
Browser 53/zero erros, lock 49+9 e guards PASS; DOM físico confirmou botão abaixo
e AO VIVO no card à direita. Captura Fire timeout, reteste DOM-only PASS; Samsung
recortes PASS. Sem mudanças funcionais/ativação. Usuário forneceu em seguida
referência visual para refinar somente essa coluna; novo recorte ainda em curso.
[Evidência intermediária](evidence/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md).

## Cabeçalho Canais atualizado e confirmado no Fire e tablet — 2026-10-04

- **PHYSICAL_INSTALL**: `FIRE_FIRST_THEN_AUTHORIZED_SAMSUNG_BOTH_IN_PLACE_SUCCESS`.
- **INSTALLED_APK_SHA256_BOTH**: `9B12B0C1CD18010C18959A2E175C70E7A48C1A4BEDA73F144C470CB751493F08`.
- **PRESERVATION**: `FOUR_PRIVATE_EACH_FIRE_436_TABLET_505_CATALOG_FILES_IDENTICAL_DURING_INSTALL`.
- **PHYSICAL_HEADER**: `BOTH_BADGES_ABSENT_TITLE_COUNT_BACK_SIDEBAR_ICONS_CATEGORIES_PRESENT`.
- **PROCESS_DURING_PROBE**: `FIRE_31297_TABLET_6832_PRESERVED`.
- **ACTIVATION_LOCK**: `49_PLUS_9_RERUN_PASS`.
- **PROVENANCE**: `401_HASHES_UNCHANGED_NO_PATCH_BUILD_OR_APK_REWRITE_THIS_INSTALL_CYCLE`.

Supersede somente estado físico não instalado abaixo. Sem reset/Git/backend,
comandos de reprodução ou retomada 60s; forwards próprios removidos.
[Confirmação e limites](evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md).

## Cabeçalho Canais sem badges técnicos — 2026-10-04

- **LIVE_HEADER**: `TECHNICAL_BADGES_REMOVED_TITLE_COUNT_BACK_MOBILE_TABS_PRESERVED`.
- **BROWSER**: `41_CHECKS_ZERO_ERRORS_LIVE_FOCUS_AND_MOBILE_HEADER_PASS`.
- **ACTIVATION_LOCK**: `BEFORE_AND_POST_PATCH_PREBUILD_49_PLUS_9_PASS`.
- **BUILD**: `TSC_VITE_CAP_SYNC_ASSEMBLE_SIGNATURE_PACKAGE_ASSETS_PASS`.
- **LATEST_ROOT_APK_SHA256**: `9B12B0C1CD18010C18959A2E175C70E7A48C1A4BEDA73F144C470CB751493F08`.
- **APK_BYTES**: `8780976`.
- **PROVENANCE**: `ONLY_INFORMATIONAL_DIV_REMOVED_398_OF_401_BASELINE_FILES_IDENTICAL`.
- **PHYSICAL_INSTALL_THIS_CYCLE**: `NAO_DEVICES_KEEP_PREVIOUS_APK`.

Supersede APK raiz disponível, não APK instalado/resultado físico anterior.
Ativação/player/source intactos; sem Git/backend/reset ou performance 60s.
[Evidência, backup e limites](evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md).

## Tablet atualizado e Clube da Luta pela Busca — 2026-10-04

- **TABLET_UPDATE**: `PASS_SAMSUNG_RX2X301Q3KY_IN_PLACE_EXISTING_APK_NO_REBUILD`.
- **INSTALLED_APK_SHA256**: `A806C1B2F70307DD410E437F9425170146FE07B113FB8B456EF3C1DB1447862F`.
- **PRESERVATION**: `FOUR_PRIVATE_AND_505_CATALOG_FILES_BYTE_IDENTICAL_DURING_INSTALL`.
- **PHYSICAL_LAYOUT**: `LANDSCAPE_1365X853_LEFT_80PX_ICONS_ONLY_PASS`.
- **SEARCH_DETAIL**: `CLUBE_DA_LUTA_TWO_CASES_APPROX_2S_45S_STABILITY_PASS_NO_PLAYBACK`.
- **ORIGINAL_CRASH_CAUSE**: `NOT_CONFIRMED_NOT_REPRODUCED_CURRENT_APK`.
- **REGRESSION_LOCK**: `49_PLUS_9_RERUN_PASS`.
- **PROVENANCE**: `401_RUNTIME_SCRIPT_CONFIG_PACKAGE_APK_HASHES_UNCHANGED`.
- **SCOPE**: `NO_FUNCTIONAL_PATCH_NO_SERIES_OR_OTHER_TITLE_TEST_NO_GIT_60S_DEFERRED`.

Tablet recebeu o mesmo APK já entregue ao Fire, preservando dados. Repetição
por caractere usa o filme já em cache: não prova hidratação fria. Não homologa
reprodução nem resolve universalmente a queda relatada. As restrições antigas
de nenhum outro aparelho atualizado são históricas, sucedidas neste recorte
somente para o Samsung. [Evidência e limites](evidence/C11_TABLET_APK_UPDATE_AND_SEARCH_DETAIL_DIAGNOSIS.md).

## Voltar superior direito instalado primeiro no Fire Stick — 2026-10-04

- **BACK_LAYOUT**: `TOP_RIGHT_ALIGNED_WITH_HEADING_NO_EXTRA_ROW_OUTSIDE_SIDEBAR`.
- **PHYSICAL_FIRE**: `NATIVE_UP_TO_BACK_HISTORY_AND_LIVE_CATEGORY_RIGHT_LEFT_RIGHT_PASS_PID_12030`.
- **LIVE_BACK**: `OWN_CONTROL_TOP_RIGHT_WITHOUT_DUPLICATION_OR_HANDLER_CHANGE`.
- **PHONE**: `ORIGINAL_HEADER_AND_LIVE_BACK_LAYOUT_PRESERVED`.
- **BROWSER_FINAL**: `39_CHECKS_ZERO_ERRORS_ROTATION_FOCUS_LISTENER_CLEANUP_PASS`.
- **LATEST_INSTALLED_APK_SHA256**: `A806C1B2F70307DD410E437F9425170146FE07B113FB8B456EF3C1DB1447862F`.
- **APK_BYTES**: `8748328`.
- **PRIVATE_FILES**: `FOUR_BYTE_IDENTICAL_BEFORE_AFTER_IN_PLACE_INSTALL_NO_RESET`.
- **REGRESSIONS**: `LOCK_49_PLUS_9_PROFILE_LIVE_C9_VOD_AND_90_NATIVE_TESTS_PASS`.
- **PROVENANCE**: `388_UNCHANGED_BASELINE_FILES_LIVE_ONLY_THREE_PRESENTATION_MARKERS`.
- **OTHER_DEVICES_OR_60S_WORK**: `NAO_TARGET_STILL_DEFERRED`.

Supersede APK/layout final das etapas abaixo. Sem homologação de playback não
testado fisicamente nesta rodada. [Evidência final](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## Foco em Categorias de Canais corrigido e instalado — 2026-10-04

Usuário reportou direita presa na sidebar ao abrir Canais. Reproduzido no browser
com Live real e no Fire físico; fallback main não alcançava raiz div. Corrigido
no boundary/foco lateral com um landmark de categoria, sem alterar lógica Live.

- **LIVE_FOCUS_PHYSICAL**: `RIGHT_CATEGORY_LEFT_SIDEBAR_RIGHT_RETURN_PASS_NATIVE_KEYS`.
- **BROWSER**: `FULL_34_CHECKS_PASS_INCLUDING_REAL_LIVE_PAGE`.
- **LATEST_INSTALLED_APK_SHA256**: `A30733787C289AAF48977561D4BC8AEE0AFC1388F40B1C6DE8C48705EA4D8F54`.
- **PRIVATE_FILES**: `FOUR_BYTE_IDENTICAL_BEFORE_AFTER_IN_PLACE_INSTALL_NO_RESET`.
- **REGRESSIONS**: `LOCK_49_PLUS_9_PROFILE_LIVE_C9_AND_90_NATIVE_TESTS_PASS`.
- **PROVENANCE**: `388_UNCHANGED_BASELINE_FILES_PLUS_ONE_ATTRIBUTE_ONLY_IN_LIVE_PAGE`.
- **OTHER_DEVICES_OR_60S_WORK**: `NAO_TARGET_STILL_DEFERRED`.

Supersede APK/proveniência/resultados específicos abaixo, não é homologação
universal de funções não testadas. [Evidência atual](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## Menu lateral somente ícones instalado primeiro no Fire Stick — 2026-10-04

- **LANDSCAPE_NON_PHONE_NAV**: `FIXED_LEFT_80PX_ICONS_ONLY_ACCESSIBLE_NAMES`.
- **PHONE_AND_PORTRAIT_LAYOUT**: `PREVIOUS_LAYOUT_AND_TEXTS_PRESERVED`.
- **BROWSER**: `FULL_32_CHECKS_PASS_ROTATION_FOCUS_ROUTES_LISTENER_CLEANUP`.
- **PHYSICAL_FIRE**: `LAYOUT_AND_NATIVE_DPAD_AGGREGATE_PASS_HOME_DEEP_SCROLL_SAME_CARD_RETURN`.
- **INSTALLED_ICON_APK_SHA256**: `187C6BD86034532CC64D85B927257AD2BA4A5C7448D24995E0BC869B7E19C035`.
- **ACTIVATION_IDENTITY_KEY**: `FOUR_PRIVATE_FILES_BYTE_IDENTICAL_BEFORE_AFTER_IN_PLACE_INSTALL`.
- **REGRESSIONS**: `ACTIVATION_CATALOG_PLAYER_GUARDS_AND_90_NATIVE_TESTS_PASS`.
- **OUTSIDE_ALLOWLIST**: `389_UNCHANGED_BASELINE_FILES_NO_REMOVALS`.
- **OTHER_DEVICE_INSTALL_OR_RESET**: `NAO`.
- **MAX_60_SECONDS_FIRST_LOAD**: `STILL_OPEN_DEFERRED_BY_USER_NOT_WORKED_THIS_CYCLE`.

Barra lateral acessível sem subir ao topo; esquerda no primeiro card leva ao
menu e direita retorna ao conteúdo. Ativação/Voltar preservados. Probe físico
teve timeout de screenshot após esquerda PASS; etapas restantes PASS separadamente,
sem atribuir captura falha a crash. Sem novo teste físico de playback ou celular.
[Evidência, APK/backup e limites](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## Fire Stick: ponte sem payload logs concluiu catálogo; 60s ainda falhou — 2026-10-04

- **PHYSICAL_OOM_IMPORT**: `NOT_REPRODUCED_PATCHED_APK_THIS_SAMPLE`
- **FULL_CATALOG_HOME_SEARCH**: `PASS_17124_MOVIES_8911_SERIES_223660_EPISODES`
- **ACTIVATION_IDENTITY_KEY**: `PRESERVED_BYTE_IDENTICAL_IN_PLACE_UPDATE_NO_RESET`
- **PATCH**: `CAPACITOR_LOGGING_BEHAVIOR_NONE_ONLY_RUNTIME_CHANGE`
- **INSTALLED_APK**: `85EB23B526FBDEBA4353F32D5493CC358DFD0A0921DE843AF1DE42CEDDBDCAB2_VERIFIED`
- **HEAP_SAMPLED_IMPORT_POST_SEARCH**: `16_2_TO_25_8_MIB_THEN_ABOUT_7_1_MIB`
- **SYNC_TO_PROMOTION**: `145_684_SECONDS`
- **ACTIVITY_TO_PROMOTION_HOME_OBSERVED**: `154_233S_AND_UP_TO_158_893S`
- **MAX_60_SECONDS_FIRST_LOAD**: `FAIL_STILL_OPEN`
- **CACHED_REOPEN**: `NOT_MEASURED_PROCESS_STOP_BLOCKED_BEFORE_EXECUTION`
- **LATER_PID_CHANGE**: `USER_CONFIRMED_MANUAL_CLOSE_REOPEN_NOT_AUTO_CRASH_EVIDENCE`
- **TESTS**: `LOCK_49_PLUS_9_BRIDGE_4_NEGATIVES_C11_PLAYER_90_JAVA_PASS`

Atualização in-place preservou a ativação criada no teste limpo anterior;
não é outro teste de instalação limpa. Catálogo completo promovido e busca
concluída, processo vivo em ~4m49s do time origin; sem alerta de licença inválida.
Supersede falha anterior somente para OOM neste teste, não para meta de 60s.
[Evidência/limites/proveniência](evidence/C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md).

## Fire Stick: teste limpo reprovou importação e meta de 60s — 2026-10-04

- **CLEAN_UNINSTALL_REINSTALL**: `PASS_USER_EXPLICITLY_AUTHORIZED`
- **INSTALLED_APK**: `0450304141F162E0C3C912D416407B40A3B0620F1CB72D458B43C77E6EAC3781_VERIFIED`
- **OLD_APP_DATA_RESTORED**: `NAO_NO_FILES_BEFORE_FIRST_LAUNCH`
- **NEW_ACTIVATION_UI_PAIRING**: `PASS_USER_USED_MANAGER_NO_AGENT_BACKEND_ADMIN`
- **FULL_CATALOG_HOME**: `FAIL_V8_OOM_BEFORE_PROMOTION`
- **SYNC_TO_OOM_HOST_EXIT**: `96_847S_AND_101_711S_THIS_SAMPLE`
- **MAX_60_SECONDS**: `FAIL_THIS_PHYSICAL_CLEAN_TEST`
- **LATEST_REGRESSION**: `SUPERSEDES_PHYSICAL_FIX_CONFIDENCE_FROM_LOCAL_TESTS`
- **NEW_IDENTITY_ACTIVATION_AFTER_CRASH**: `PRESERVED_NO_MORE_RESET_OR_AUTO_RESTART`

Patch local passou em suites, mas não corrigiu OOM físico. Home com conteúdo
não abriu. 6s da Activity e T5 shell não são tempo de catálogo pronto.
[Evidência física limpa](evidence/C11_FIRE_STICK_CLEAN_INSTALL_TEST.md).

## Fire Stick: retenção corrigida localmente, meta de 60s pendente — 2026-10-04

- **USER_ACCEPTANCE_TARGET**: `FIRE_STICK_LOADING_MAX_60_SECONDS_EXPLICIT_REQUEST`
- **LOCAL_PATCH**: `DETACHED_M3U_LINES_AND_BOUNDED_BATCH_2500`
- **SYNTHETIC_RETAINED_TITLES**: `48_MB_BASELINE_TO_BELOW_0_1_MB_AFTER_PATCH`
- **CATALOG_TRUNCATION_OR_ACTIVATION_CHANGE**: `NAO`
- **NEW_MEMORY_TEST_AND_EXISTING_C11_REGRESSIONS**: `PASS_LOCAL`
- **LEGACY_R2F8_TESTS**: `THREE_UNAVAILABLE_MISSING_BASELINE_FILES`
- **ANDROID_APK_VALIDATION**: `PASS_90_NATIVE_TESTS_SAME_PACKAGE_SIGNER_5_ASSET_HASHES`
- **PERFORMANCE_PATCH_APK_SHA256**: `0450304141F162E0C3C912D416407B40A3B0620F1CB72D458B43C77E6EAC3781`
- **OUTSIDE_ALLOWLIST_HASH_CHANGES**: `NONE_IN_386_FILE_AUDIT`
- **FIRE_STICK_UPDATED_OR_60_SECONDS_PROVEN**: `NAO_PENDING_USER_REPLY_AND_PHYSICAL_TEST`

Não confundir menor retenção/chamadas de I/O no PC com tempo físico garantido.
Requisito de 60s e regressão Fire continuam abertos. Pedido autoriza patch
local separado; preserva evidência histórica abaixo, sem próximo Gate/Git/backend.
[Patch, testes e limites](evidence/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md).

## Fire Stick conectado: OOM de importação reproduzido — 2026-10-04

- **FIRE_STICK_ADB_WIFI**: `CONNECTED_AFTSSS_API_28`
- **CATALOG_SYNC_EXIT**: `PHYSICALLY_REPRODUCED_USER_OPENED_APP`
- **PRIMARY_CAUSE**: `V8_JAVASCRIPT_OOM_REACHED_HEAP_LIMIT`
- **SECONDARY_EXIT**: `UNHANDLED_RENDERER_LOSS_HOST_SIGTRAP`
- **LAST_GC_USED_HEAP**: `AROUND_225_MB_OBSERVED_NOT_SLA`
- **LAST_WORK**: `STAGING_EPISODES_STREAMS_SEGMENTS_221_TO_229`
- **INSTALLED_APK**: `8828F120_PRE_PLAYBACK_NOTICE_APK_VERIFIED_SHA256`
- **FUNCTIONAL_MEMORY_PATCH_OR_INSTALL**: `NAO_PENDING_SCOPE_AUTHORIZATION`
- **ACTIVATION_RUNTIME_ROOT_APK_GIT_BACKEND_CHANGED**: `NAO`

Esta evidência supersede a falta de conexão/causa do relato inicial abaixo.
OOM precede o fechamento do host; objeto retentor exato ainda não identificado.
Regressão de inicialização no Fire Stick continua aberta, sem fix especulativo.
[Sequência física sanitizada](evidence/C11_FIRE_STICK_STARTUP_DIAGNOSIS.md).

## Relato de fechamento no Fire Stick durante abertura — 2026-10-04

- **PHONE_ACTIVATION_HOME_TIME**: `USER_REPORTED_BELOW_60_SECONDS`
- **TABLET_ACTIVATION_HOME_TIME**: `USER_REPORTED_AROUND_90_SECONDS`
- **FIRE_STICK_STARTUP**: `USER_REPORTED_CLOSE_AROUND_150_SECONDS_BEFORE_HOME`
- **PHYSICAL_FAILURE_LOG_AND_INSTALLED_APK**: `PENDING_FIRE_STICK_ADB_CONNECTION`
- **CURRENT_ADB_DEVICE**: `TABLET_SM_X610_ONLY`; Fire Stick não conectado.
- **CAUSE**: `NOT_DETERMINED`; não atribuir a memória, ANR ou ativação sem logs.
- **RUNTIME_ACTIVATION_APK_GIT_BACKEND_CHANGED_IN_DIAGNOSIS**: `NAO`

Tempos observados são relato, não SLA. PASS local do patch anterior e testes
históricos de Live TV não homologam esta inicialização limpa no Fire Stick.
Amostra local de 3/outubro não contém a falha atual nem identifica o aparelho.
Solicitados conexão ADB/IP e estágio da tela antes do fechamento. Apenas memória
documental atualizada; nenhum build, instalação, reset ou correção especulativa.

## Aviso de erro de reprodução implementado — 2026-10-04

- **C11_PLAYBACK_ERROR_NOTICE_FIX**: `PASS_LOCAL_PHYSICAL_NOTICE_PENDING`
- **NATIVE_ERROR_CAUSE_VISIBLE**: `SANITIZED_CATEGORY_AND_HTTP_STATUS`
- **ACTIVATION_RUNTIME_CHANGED**: `NAO_BASELINE_PRESERVED`
- **NEW_DEVICE_LOCK**: `49_PASS_9_NEGATIVE_CONTROLS_PASS`
- **NOTICE_C9_VOD_TESTS**: `11_PLUS_10_PLUS_12_PASS`
- **ANDROID_UNIT_TESTS**: `90_PASS_ZERO_FAILURES`
- **BUILD_CAP_SYNC_ASSEMBLE_APK**: `PASS_SAME_PACKAGE_AND_SIGNER`
- **APK_SHA256**: `D601864B2E79292980869F47B6CBB34440E2E7F63DCE6C3C353A1AD3CD753385`
- **NEW_APK_INSTALLED**: `NAO`; **VISUAL_BROWSER_CHECK**: `UNAVAILABLE`
- **HISTORICAL_404_CAUSE_AND_STREAM_CACHE**: `OPEN_UNCHANGED`
- **COMMIT_PUSH_PR_BACKEND_NEXT_GATE**: `NAO`

Aviso acessível/sticky na tela de retorno, fechável e limpo na próxima tentativa;
Back e término sem falso erro. APK anterior preservado. Registros abaixo são
históricos anteriores ao patch; somente a visibilidade silenciosa foi corrigida.
[Implementação, testes e limites](evidence/C11_PLAYBACK_ERROR_NOTICE_FIX.md).

## Reteste no celular originalmente afetado — 2026-10-04

- **PHONE_911_T1E1**: `FIRST_FRAME_READY_USER_CONFIRMED`
- **PHONE_CLUBE_DA_LUTA**: `FIRST_FRAME_READY_POSITION_ADVANCED_USER_CONFIRMED`
- **CURRENT_PHONE_DEFAULT_TRANSPORT**: `WIFI`
- **SAME_WIFI**: `USER_REPORTED`
- **PHONE_PLAYER_EXIT**: `USER_CONFIRMED_MANUAL_BACK_NOT_AUTOMATIC_FAILURE`
- **CURRENT_TWO_TITLE_FAILURE**: `NOT_REPRODUCING_PHONE_AND_TABLET`
- **HISTORICAL_FAILURE_CAUSE**: `OPEN_NOT_ISOLATED`
- **PLAYBACK_CODE_FIX_OR_NEW_APK**: `NAO`

Reprodução atual sem patch não equivale a causa raiz corrigida nem homologação
do catálogo inteiro. Ativação e APK preservados; 404 históricos e defeitos de
cache/visibilidade de erro continuam registrados.
[Reteste sanitizado](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## Contraprova de reprodução no tablet — 2026-10-04

- **CONNECTED_DEVICE**: `SM_X610_SAME_DELIVERED_APK_SHA256`
- **911_T1E1_TABLET**: `FIRST_BYTE_FIRST_FRAME_READY_USER_CONFIRMED`
- **CLUBE_DA_LUTA_TABLET**: `FIRST_BYTE_FIRST_FRAME_READY_POSITION_ADVANCED_USER_CONFIRMED`
- **PHONE_HISTORICAL_404**: `PRESERVED_NOT_GLOBAL_ROOT_CAUSE`
- **CURRENT_FAILURE_ROOT_CAUSE**: `OPEN_REQUIRES_REPRODUCTION_ON_AFFECTED_DEVICE`
- **RUNTIME_ACTIVATION_APK_BACKEND_GIT_CHANGED**: `NAO`

O usuário relata que os conteúdos antes funcionavam neste mesmo player. Dois
títulos funcionaram agora no tablet; isso não homologa os demais nem explica
a falha anterior em outro aparelho. Nenhuma correção de playback foi aplicada.
[Evidências por tentativa](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## Diagnóstico físico de Clube da Luta — 2026-10-04

- **CONNECTED_DEVICE**: `SM-S926B_ADB_AUTHORIZED`
- **INSTALLED_APK_MATCHES_DELIVERED_STANDALONE**: `SIM_SHA256`
- **CLUBE_DA_LUTA_OBSERVED_FAILURE**: `HTTP_404_BEFORE_FIRST_BYTE`
- **TITLE_TO_NATIVE_ERROR_CORRELATION**: `PRIVATE_REFERENCE_FINGERPRINT_MATCH`
- **SOURCE_SIDE_REASON_FOR_404**: `NOT_DETERMINED`
- **PLAYER_ERROR_VISIBILITY**: `CLOSES_WITHOUT_SHOWING_CAUSE`
- **RUNTIME_TESTS_ACTIVATION_APK_BACKEND_GIT_CHANGED**: `NAO`

O cache sintético anterior não explica essas tentativas: chegaram ao player e
receberam resposta HTTP da origem. Nenhum fix de playback aplicado. Ativação
consolidada preservada; validação de demais títulos/séries continua pendente.
[Evidência sanitizada e limitações](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## Canonização de novos dispositivos e diagnóstico de playback — 2026-10-03

- **NEW_DEVICE_ACTIVATION_AND_CATALOG_PHYSICAL**: `USER_REPORTED_SUCCESS`
- **LOCK_ID**: `C11_NEW_DEVICE_ACTIVATION_AND_CATALOG_LOCK_V1`
- **LOCK_ENFORCED_BY_NPM_PREBUILD**: `SIM_LOCAL_NOT_PUBLISHED`
- **LOCK_TESTS**: `49_PASS_9_NEGATIVE_CONTROLS_PASS`
- **WEB_BUILD_WITH_LOCK**: `PASS`
- **PLAYBACK_RUNTIME_PRODUCTION_AND_APK_CHANGED**: `NAO`
- **SELECTIVE_FILM_FAILURE_REFERENCE**: `CLUBE_DA_LUTA_USER_REPORTED`
- **STREAM_SEGMENT_CACHE_DEFECT**: `REPRODUCED_CONDITIONAL_SYNTHETIC`
- **PHYSICAL_PLAYBACK_ROOT_CAUSE**: `PENDING_ERROR_SCREENSHOT_OR_SANITIZED_LOG`
- **COMMIT_PUSH_PR_BACKEND_MUTATION_NEXT_GATE**: `NAO`

O relato atualiza as pendências físicas anteriores de ativação/carregamento,
não de playback. Alguns filmes abrem, outros não. A lista de segmentos em cache
pode ficar stale e impedir lookup; não é ainda causa confirmada no aparelho.
[Contrato obrigatório](architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md) ·
[Evidências e limitações](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

---

## Correção isolada de promoção do catálogo — 2026-10-03

- **C11_CATALOG_PROMOTION_DIRECTORY_FIX**: `LOCAL_AND_BRIDGE_MODEL_VERIFIED_APK_BUILT`
- **FOCUSED_DIRECTORY_TESTS**: `27/27_PASS`
- **ACTIVATION_REGRESSION**: `21/21_PASS`
- **BOUNDED_MEMORY_250K**: `PASS` (79 checkpoints, numeração até T83)
- **STAGING_BOUNDARY_REGRESSION**: `11_PASS_T12_BASELINE_MISSING_FILE`
- **WEB_BUILD_CAP_SYNC_ASSEMBLE_DEBUG_APK_INSPECTION**: `PASS`
- **SAME_PACKAGE_SAME_DEBUG_SIGNER**: `SIM`
- **PHYSICAL_TWO_DEVICE_CATALOG_REVALIDATION**: `PENDING_NOT_EXECUTED`
- **LIVE_BACKEND_MUTATION_COMMIT_PUSH_PR_NEXT_GATE**: `NAO`

Novo APK raiz substitui o artefato anterior; atualizar sem desinstalar nem limpar
dados. A correção cria diretórios para rename/copy e preserva o snapshot ativo.
[Evidências, hash e limitações](evidence/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md).
Ativação nas capturas estava autorizada; falha reportada era de promoção local.

---

## Correção isolada de ativação — 2026-10-03

- **C11_NEW_DEVICE_ACTIVATION_FIX**: `LOCAL_AND_MOCK_VERIFIED_APK_BUILT`
- **FOCUSED_TESTS**: `21/21_PASS`
- **ACTIVATION_CONTRACT_REGRESSIONS**: `57/57_PASS`
- **WEB_BUILD_CAP_SYNC_ASSEMBLE_DEBUG**: `PASS`
- **CRYPTO_EXTERNALIZED_WARNING**: `ABSENT`
- **PHYSICAL_NEW_PHONE_PAIRING**: `PENDING_NOT_EXECUTED`
- **LIVE_BACKEND_MUTATION_COMMIT_PUSH_PR**: `NAO`
- **NEXT_GATE_STARTED**: `NAO`

Artefato: `C:\Xandeflix\xandeflix-prebuilt-c11-main\Xandeflix-v1.0.0-standalone.apk`.
[Evidências e limitações](evidence/C11_NEW_DEVICE_ACTIVATION_FIX.md).
Este resultado não encerra o E2E físico pendente do ciclo de importação anterior.

---

## 1. Identidade e Localizacao

- **PROJECT**: `XANDEFLIX_PREBUILT`
- **LAST_CLOSED_GATE**: `G12`
- **CURRENT_GATE**: `NONE`
- **MVP_PROGRESS_PERCENT**: `100`
- **MVP_ARCHITECTURAL_BASELINE**: `COMPLETE`
- **MVP_STATUS**: `ARCHITECTURAL_MVP_COMPLETE`
- **IMPLEMENTATION_STARTED**: `SIM`
- **G0_STATUS**: `PASS`
- **G1_STATUS**: `PASS`
- **G2_STATUS**: `PASS`
- **G3_STATUS**: `PASS`
- **G4_STATUS**: `PASS`
- **G5_STATUS**: `PASS`
- **G6_STATUS**: `PASS`
- **G7_STATUS**: `PASS`
- **G8_STATUS**: `PASS`
- **G9_STATUS**: `PASS`
- **G10_STATUS**: `PASS`
- **G11_STATUS**: `PASS`
- **G11A_STATUS**: `PASS`
- **G11B_STATUS**: `PASS`
- **G12_STATUS**: `PASS`
- **G12_STARTED**: `SIM`
- **PHONE_VALIDATION_REMAINING**: `NAO`
- **NEXT_GATE**: `NONE`
- **NEXT_GATE_STARTED**: `NAO`
- **REPOSITORY**: `xandeflix2/xandeflix-prebuilt`
- **WORKSPACE**: `C:\Xandeflix\xandeflix-prebuilt`
- **SUPABASE_PROJECT**: `cujbmyhitgomlgwfkaat`
- **ANDROID_PACKAGE_ID**: `com.xandeflix.prebuilt`

## 3. Ciclo atual - C11 bounded-memory import

- **CURRENT_CYCLE**: `XANDEFLIX_PREBUILT_C11_CANONICAL_BOUNDED_MEMORY_IMPORT_FIX_SM_X205`
- **C11_STATUS**: `OPEN_PENDING_FINAL_CLEAN_INSTALL_E2E`
- **C11_ROOT_CAUSE_CONFIRMED**: `SIM`
- **C11_SYNTHETIC_250K_IMPORT**: `PASS`
- **C11_TYPECHECK_WEB_BUILD_ANDROID_TESTS**: `PASS`
- **C11_REGRESSION_SUITES**: `PASS`
- **C11_APK_UPDATE_IN_PLACE**: `PASS`
- **C11_DEVICE_STATE_PRESERVED**: `PASS`
- **C11_PHYSICAL_APP_BOOT**: `PASS`
- **C11_PHYSICAL_BOOT_CONSOLE_ERROR**: `OBSERVED_NON_BLOCKING_TRIGGER_EVENT`
- **C11_CURRENT_INSTALL_CRASH_AFTER_INSTALL**: `0`
- **C11_HISTORICAL_PRE_UPDATE_RENDERER_PEAK**: `~1.5GB_RSS`
- **C11_PHYSICAL_REAL_SOURCE_IMPORT**: `BLOCKED_SOURCE_NOT_BOUND`
- **C11_FINAL_CLEAN_INSTALL_E2E**: `PENDING`
- **C11_NEXT_GATE_STARTED**: `NAO`
- **C11_BACKEND_OR_DATABASE_MUTATION**: `NAO`
- **C11_COMMIT_PUSH_PR**: `NAO`

> *Nota explicativa*: O Gate G12 (`XANDEFLIX_PREBUILT_G12_MVP_ACCEPTANCE_AND_FINAL_BENCHMARK`) foi formalmente adjudicado pelo Chat Mestre como `PASS` (`RESULT=PASS_PREBUILT_G12_MVP_ACCEPTANCE_AND_FINAL_BENCHMARK_CLOSED`), consolidando e encerrando com 100% de progresso o roadmap canônico de desenvolvimento do MVP arquitetural do Xandeflix Prebuilt (`MVP_ARCHITECTURAL_BASELINE=COMPLETE`, `MVP_STATUS=ARCHITECTURAL_MVP_COMPLETE`). Todos os 12 Gates do roadmap (G0 a G11) foram integralmente reconciliados e mantidos em estado verde (`FINAL_ACCEPTANCE_MATRIX=PASS`). O benchmark sintético em escala controlada (~240.000 títulos) confirmou a viabilidade física de transporte e busca invertida local (`SEARCH_SCALE_FINAL_CLASSIFICATION=NON_BLOCKING_PHYSICALLY_USABLE`), assim como a taxa de compressão e economia de transporte em atualizações incrementais delta (`SPARSE_1_PERCENT_DELTA_TO_FULL_RATIO=0.0092`). A integridade física multi-dispositivo foi comprovada e preservada em hardware real: Smartphone Android Samsung Galaxy S24+ (`SM-S926B`, API 36), Tablet Samsung Galaxy Tab S9 FE (`SM-X610`, API 36) e Amazon Fire TV Stick Lite (`AFTSSS`, API 28) com zero crashes e zero ANRs (`CRASH_COUNT_TOTAL=0`, `ANR_COUNT_TOTAL=0`). A segurança de ponta a ponta e o isolamento de release foram comprovados sem vazamento de segredos (`SECRETS_EXPOSURE=NAO`, `PRIVATE_SIGNING_KEY_PRESENT=NAO`, `RELEASE_TEST_TRUST_KEY_PRESENT=NAO`). Não existem blockers funcionais abertos (`MVP_BLOCKING_DEFECT_COUNT=0`). Todos os 12 riscos residuais conhecidos de escala e pós-MVP permanecem formalmente catalogados e preservados como abertos e não-bloqueadores. Os pontos de extensão para o futuro ciclo de integração com fonte de mídia real (`REAL_SOURCE_ADAPTER_EXTENSION_POINT`, `REAL_SOURCE_SECURE_RUNTIME_AUTH_EXTENSION_POINT`, `REAL_SOURCE_PROVISIONING_PIPELINE_EXTENSION_POINT`, `DIRECT_PLAYBACK_EXTENSION_POINT`) estão devidamente desacoplados e prontos (`READY`).
> *Histórico preservado*: `G11_INITIAL_ATTEMPT=INCONCLUSIVE_REQUIRED_DEVICE_UNAVAILABLE; G11A_STATUS=PASS; G11B_STATUS=PASS; G11_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G11_ADJUDICATION_CLOSED_PASS=SIM; G12_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G12_ADJUDICATION_CLOSED_PASS=SIM; LAST_CLOSED_GATE=G12; G12_STATUS=PASS; MVP_PROGRESS_PERCENT=100; CURRENT_GATE=NONE; NEXT_GATE=NONE; NEXT_GATE_STARTED=NAO; MVP_ARCHITECTURAL_BASELINE=COMPLETE; MVP_STATUS=ARCHITECTURAL_MVP_COMPLETE`.

---

## 2. Status dos Gates

- **G0_STATUS**: `PASS`
- **G1_STATUS**: `PASS`
- **G2_STATUS**: `PASS`
- **G3_STATUS**: `PASS`
- **G4_STATUS**: `PASS`
- **G5_STATUS**: `PASS`
- **G6_STATUS**: `PASS`
- **G7_STATUS**: `PASS`
- **G8_STATUS**: `PASS`
- **G9_STATUS**: `PASS`
- **G10_STATUS**: `PASS`
- **G11_STATUS**: `PASS`
- **G11A_STATUS**: `PASS`
- **G11B_STATUS**: `PASS`
- **G12_STATUS**: `PASS`
- **GATE_A_FUNCTIONAL_STATUS**: `PASS`
- **LIVE_FULLSCREEN**: `PASS`
- **R17D_STATUS**: `PASS`

---

## 4. Gate A Funcional & Ciclo R17D — Live Fullscreen Surface & Z-Order (2026-09-29)

- **GATE_A_FUNCTIONAL_STATUS**: `PASS` (Concluído e Fechado)
- **R17D_STATUS**: `PASS`
- **LIVE_FULLSCREEN**: `PASS`
- **TARGET_DEVICE_AUDITED**: Amazon Fire TV Stick Lite (`AFTSS`, Serial: `G071CQ070344374G`, Android 9 / API 28)
- **AUDITED_BEHAVIORS**:
  - Reprodução contínua e fluida de Live TV com áudio e vídeo sincronizados em tela cheia (1920x1080).
  - Transição de preview inline (760x428) para fullscreen sem congelamento ou interrupção de frames.
  - Retorno suave ao modo inline ao acionar a tecla Voltar (Back) no controle remoto.
  - Zero crashes nativos, zero ANRs e zero focus traps.
- **ROOT_CAUSE_RESOLVED**:
  - `Color.BLACK` removido do container `PlayerView` (definido como `Color.TRANSPARENT`), desobstruindo a superfície de vídeo.
  - `SurfaceView.setZOrderMediaOverlay(true)` aplicado cirurgicamente no `getVideoSurfaceView()`, garantindo camada de hardware acima da WebView.
- **FINAL_NON_DIAGNOSTIC_APK_REQUIRED**: `SIM`
- **FINAL_NON_DIAGNOSTIC_APK_STATUS**: `PASS`
- **FINAL_APK_PATH**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **FINAL_APK_SIZE**: `9019470` bytes (~9.02 MB, reduo de 371.655 bytes aps higiene de quarentena e diagnstico)
- **FINAL_APK_SHA256**: `06C6C5276565B77E6E088D3689F22C4749AE88C96CF6D52EE9F18180C0EE8933`
- **UNIT_TESTS_STATUS**: `PASS` (82 tasks, 0 falhas)
- **NEXT_ACTION**: `NONE` (Ciclo R17D e Higiene Final Concludos com Sucesso)

## 2026-10-06 — C11: capas, heroes horizontais e categorias

- CURRENT_GATE=NONE; ciclo local solicitado pelo usuário; NEXT_GATE_STARTED=NAO.
- ARTWORK_LOCAL_STATUS=PASS_LOCAL_PENDING_PHYSICAL_VALIDATION.
- Cards: fonte primeiro, TMDB após ausência/erro; heroes Home/Filmes/Séries
  e fundos dos detalhes: exclusivamente backdrops horizontais TMDB.
- Categorias aleatórias por visita/lote; Lançamentos mantém ordem da fonte.
  Faixas/leitores atualizados após promoção do novo catálogo da fonte.
- PASS: suite nova, catálogo/UI, lock (22+27 cenários e 9 controles negativos),
  importação 250k (T1–T83), typecheck/build e navegador com dados sintéticos.
- Smoke real TMDB: filme e série resolvidos; quatro imagens HTTP 200.
- Duas suítes auxiliares indisponíveis por arquivos já ausentes no HEAD;
  detalhes no relatório de evidências. Sem homologação física/instalação APK.
- Preservadas alterações dirty anteriores; sem commit/push/PR ou escrita remota.
- EVIDENCE=docs/evidence/C11_SOURCE_FIRST_TMDB_ARTWORK.md.

## 2026-10-06 — C11: APK de capas instalado no tablet; S24 pendente

- CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; build/instalação local autorizados.
- APK 1BEACE82... / 9.210.591 bytes; suite de capas, build web, lock 49+9,
  Capacitor/Gradle e validação de assinatura/assets: PASS.
- TABLET_ARTWORK_APK_INSTALL=PASS: Samsung SM-X610, install -r Success,
  hash do APK instalado igual ao gerado; 522 arquivos privados (505 catálogo,
  cinco nativos) e firstInstallTime preservados, comparação somente em RAM.
- S24_INSTALL=PENDING_DEVICE_CONNECTION: ainda ausente no ADB; solicitado USB
  com depuração autorizada. Fire Stick fora do escopo, intacto.
- PHYSICAL_ARTWORK_VALIDATION=PENDING: app não aberto automaticamente.
- Sem novo patch funcional, reset/rotação, backend, commit/push/PR.
- EVIDENCE=docs/evidence/C11_TMDB_ARTWORK_TABLET_S24_INSTALL.md.

## 2026-10-06 — C11: instalação S24 concluída

- S24_INSTALL=PASS_INSTALL_PRESERVATION: Samsung SM-S926B, API36,
  install -r Success; mesmo APK 1BEACE82... entregue ao tablet primeiro.
- 526 arquivos privados (508 catálogo, cinco nativos) e firstInstallTime
  preservados, comparados exclusivamente em RAM; hash do APK instalado confere.
- Lock novamente PASS (49 cenários + nove controles); assinatura compatível.
- Pendência de conexão do S24 resolvida. Tablet já instalado no ciclo anterior.
- PHYSICAL_ARTWORK_VALIDATION=PENDING: app não aberto automaticamente.
- CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem novo código/build/backend/Git/reset.
- EVIDENCE=docs/evidence/C11_TMDB_ARTWORK_TABLET_S24_INSTALL.md.


## 2026-10-06 — C11: hero Home vertical/aleatório e entrega nos três aparelhos

- CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; patch/build/install locais autorizados.
- Hero móvel vertical alternativo, randomização 5+5/ano e prioridade a novos
  lançamentos após promoção; fallback honesto se fonte/variante insuficientes.
- PASS: suites nova/anterior de capas, catalog-ui, typecheck/build, lock49+9,
  Gradle e navegador phone/tablet/TV, foco/pausa/atualização/erro de imagem.
- APK 434B5936... / 9.215.486 bytes; assinatura/assets/standalone: PASS.
- FIRESTICK_INSTALL=PASS; TABLET_INSTALL=PASS; S24_INSTALL=PASS.
  APK instalado confere; árvores privadas e firstInstallTime preservados.
- PHYSICAL_ARTWORK_VALIDATION=PENDING: conferência visual no app físico;
  app não aberto automaticamente. Nenhuma pendência de conexão/instalação.
- Dirty anterior preservado; sem reset, backend, commit/push/PR ou escrita 2.0.
- EVIDENCE=docs/evidence/C11_HOME_HERO_CURRENT_YEAR.md.


## 2026-10-06 — C11: otimizações de UI, saída mobile, Recentes e cores — fechamento

CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Correções locais/entrega autorizadas.
PASS: hero/source-first/categorias/elegibilidade/busca-related/saída mobile/
Recentes/paleta, catalog-ui, C9 10/10, typecheck e build. Lock canônico
22+27 cenários e9 controles negativos: PASS. Java116/0falhas/0erros.
Browser: componentes reais StrictMode, I/O sintético/imagens públicas,
phone/tablet/TV; Recentes resume posições exatas e oculta ID reassociado.

APK_FINAL=78C074ECCA912D3E1FC493E66690F4AECD5736AEEC469080749DA0CB66B2277D; 12.400.038 bytes.
Bundle index-DN1LCm9x.js; assets5 byte a byte e standalone/manifest: PASS.
Package com.xandeflix.prebuilt, versionCode1/versionName1.0, min23/target35,
mesmo certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
FIRESTICK_INSTALL=PASS; TABLET_INSTALL=PASS; S24_INSTALL=PASS.
Dados privados/estado nativo/catálogo/preferences/WebView/firstInstallTime
preservados; arquivos privados466/533/540, catálogo436/505/508, cinco nativos
em cada alvo. Hash instalado igual em todos. Sem abertura automática.

PHYSICAL_PIP_PLAYBACK=PENDING; PHYSICAL_CAST_RECEIVER=PENDING;
PHYSICAL_ARTWORK_CACHE=PENDING; PHYSICAL_RECENT_RESUME=PENDING;
PHYSICAL_IMMERSIVE_CACHE_INTEGRATION=PENDING. Testes/build/instalação não
certificam reprodução privada/receiver/codec/background no aparelho.
Sem blocker de build/entrega. Memórias somente acréscimos; proveniência
final registrada em tmp/c11-home-hero-visible-20261006/provenance-final.json.
EVIDENCE=docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md.


## 2026-10-06 — continuação C11 phone/Fire/tablet/D-pad/paginação/menu — fechamento

CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Typecheck/build/Gradle/lock22+27+9,
C9 10/10 e regressões PASS. Java122/0falhas/0erros. Browser perfis/foco12cases/
preload48/D-pad/nextfold/searchReady1800ms/trailerResize40 PASS.
APK_FINAL=BA37C4F05E1E7E063D8BB7FD49F4DF7DAE94AC5014A8CEFA19BD8C7C23F15E4A; 12400179bytes; assets6 byte a byte.
Bundle index-4wr-SwHH.js/CSS index-DGbASLLI.css. Mesmo package/certificado/min23.
FIRESTICK_INSTALL=PASS; TABLET_INSTALL=PASS; S24_INSTALL=PASS. Dados privados/
catálogo/estado nativo/preferences/WebView/firstInstallTime preservados;
contagens466/539/549, catálogo436/505/508,5nativos por alvo.

PHYSICAL_MENU=PASS: Fire centro270; tablet426,667/426,5.
PHYSICAL_HERO_PROFILES=PASS: Fire856x405; tablet1269,33x480; S24vertical379,43x569,14.
PHYSICAL_FIRE_SEARCH_SELECTION=PASS_EXERCISED: protetor11→O Protetor abriu vivo,
sem AndroidRuntime próprio; não certifica causa/eliminação de crash relatado.
PHYSICAL_DPAD_FOLD=PASS: direita10→10,baixo7col→17,sidebarreturn,48→96/foco estável.
PHYSICAL_S24_PLAYBACK_CAST_CONTROLS=PASS_EXERCISED_INTERMEDIATE_SAME_CODE.
PHYSICAL_PUBLIC_TRAILER_FINAL=PENDING_UNLOCKED_PLAYBACK; tela oculta/bloqueio
impediu homologação final, fallback honesto observado.
PHYSICAL_CAST_RECEIVER/PIP/RECENT_RESUME/IMMERSIVE_CACHE_INTEGRATION=PENDING.
Sem blocker de build/entrega/menu. EVIDENCE=relatório itens24–38.


## 2026-10-06 — complemento S24 desbloqueado

Usuário confirmou aparelho desbloqueado/aberto. PHYSICAL_TRAILER_LAYOUT=PASS_EXERCISED:
open visível/ready,0bounds em3,5s,hero100px. PHONE_VIDEO_PUBLIC_PLAYBACK=PENDING:
ready não certifica playing; controles de toque não homologados. Bloqueio
de tela anterior resolvido, sem patch/build/install adicional. APK BA37C4F0
inalterado; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Relatório item39.


## 2026-10-07 — C11 cabeçalho Live mobile compacto

PASS typecheck/build/lock22+27+9/Gradle/assinatura/assets6; Java122/0falhas
0erros reutilizados, sem patch Java. Browser320/390/411 igualdade64px,
ações/adapters/connected/error/empty/loading/resize e zero overflow: PASS.
S24 físico100px igual quatro páginas,3 ícones44px, sem duplicação: PASS.
Tablet/Fire amplos preservados. APK=D4B7C8695FED0C98B068775D21CE696DE57ECBC68168E66F7A20252F6F2F2505;
12400179bytes. INSTALL_FIRE/TABLET/S24=PASS, hashigual/dados privados/
firstInstallTime preservados (469/538/549 arquivos). CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Relatório item40/evidência específica.


## 2026-10-07 — C11 EPG retrátil e retorno Live fullscreen

PASS browser4 larguras/12 cenários/timeout/abort/motion/escala/retorno; S24 EPG real ready/12 programas/1 atual. Dois ciclos fullscreen: Cast acompanha controles/toque/timeout e retorno nativo sem gesto corretivo, guia sem lacuna. Build/lock22+27+9/Java124/assinatura/assets6 PASS. APKE19DC5339D89EDDC2AB70E9B5D2FD62CEAFC9C6B300257C2C4EA19F0D107F459; INSTALL_FIRE/TABLET/S24=PASS/hashigual/dados e firstInstallTime preservados. Relatório41/42/43 e evidências específicas; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Receiver Cast/PiP/fresh install físico não certificados neste ciclo.

Tablet em retrato: menu no topo nas seis abas, Canais texto/Ativação chave, Live empilhado e EPG alinhado; browser600/800/960, estado Cast conectado e SM-X610 físico PASS. Rotação anterior restaurada e paisagem ampla revalidada; allowlist inclui useLivePresentation/AppShell/Header/CSS/Live e contrato C11_TABLET_PORTRAIT_LIVE_AND_MENU. Relatório43. Harness corrigiu acentuação/duplo decode e dev menu; override CSS de600px e ações44px foram verificados.


## 2026-10-07 — ativação simples e contato master

Preflight read-only: workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, .git próprio, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, originhttps://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS, Architecture, Execution, Source Data Boundary e lock lidos. Baseline679 e dirty anterior preservados. CURRENT_GATE=NONE; ciclo local por pedido direto; NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados nem executados. Histórico e projeto original não editados.

Tela simples/diagnóstico recolhido/clipboard e painel Sistema para WhatsApp
concluídos. Backend aditivo cujbmyhitgomlgwfkaat aplicado; OWNER ACTIVE somente.
Contato ainda não cadastrado; site gestor não publicado. Lock, UI20, serviço9,
SQL12 rollback, browser/hardware3, typecheck/build e Java124 PASS.
APK final: SHA-256 08FCDFFB9DEBEAFB445B9520E4E52903F09923BAD9A5C05B519ED6BFEAB517F0; 12400179 bytes. Bundle dist/assets/index-DTghpENe.js; CSS index-BWDAqMH6.css. com.xandeflix.prebuilt, certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d, versionCode1/versionName1.0/min23/target35, standalone HTTPS sem server.url. Assets6 verificados byte a byte; Java124/124 sem falhas.

| Alvo | Arquivos privados antes/depois | Catálogo | Estado nativo | Update-r / firstInstallTime / APK |
|---|---:|---:|---:|---|
| AFTSSS | 468/468 | 436 | 5 | Preservado / preservado / idêntico |
| SM-X610 | 538/538 | 505 | 5 | Preservado / preservado / idêntico |
| SM-S926B | 549/549 | 508 | 5 | Preservado / preservado / idêntico |

Relatório seção44 e evidência C11_ACTIVATION_SIMPLE_UI_AND_MULTI_DEVICE_CONTACT.


## 2026-10-07 — C11 barras persistentes e player na área inteira

7EBC87D91CABC00032CE57CF5AD3DA815E3889B146BE041DF4462DBAE8D6196E; 128 Java/0falhas/0erros, lock22+27+9/build/sync/assinatura/assets6 PASS.
Status/nav visíveis em S24 e SM-X610; taskbar tablet observada retrato/paisagem/Live/VOD.
Player MATCH_PARENT na área entre barras/cutout, FIT/imagem completa conforme escolha
do usuário; trailer desconta inset uma vez. Install-r Fire/tablet/S24 preservou
dados privados/firstInstallTime (469/539/548), catálogo436/505/508 e5nativos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset. Evidência
C11_MOBILE_PERSISTENT_SYSTEM_BARS.md.


## 2026-10-07 — correção final de barras no vídeo fullscreen

Usuário esclareceu: ocultar status/navbar/taskbar SOMENTE no vídeo em tela
cheia. Marca fraca por decor conserva política no foco/resume. Navegação/inline
mostram barras; saída restaura insets. FIT/MATCH_PARENT, imagem completa, sem
crop/stretch. Bounds fullscreen S24[0,0][3120,1440], tablet[0,0][2560,1600].
Lock22+27+9/Java130/0falhas/0erros/Gradle/assinatura/assets6 PASS.
APK_FINAL=9FA211109DF2AE9E4422D29FDBBF4A298DD5617D14860CFD44552B6DAC788135; 12400179bytes. Install-r Fire/tablet/S24
PASS/dados privados/firstInstallTime preservados467/537/551; catálogo436/505/508.
Retorno Live/EPG/taskbar/filme PASS; rotação tablet free restaurada.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem backend/Git/reset.
Relatório item46 e atualização final em C11_MOBILE_PERSISTENT_SYSTEM_BARS.md.


## 2026-10-07 — filmes no celular como as séries

Filmes no celular usam a mesma disposição das séries: trailer/título/metadados/sinopse/ações/semelhantes2colunas. S24 real, Joderism fallback, The Rookie compatível; tablet/Fire antigos. Lock22/27/9, build/sync/Java130 PASS. APK_FINAL=67832339D3EF71A3F57D02F1F6ACC170BFF174E6393ED4CA2C85667BFBD7CE19; install-r três/dados/firstInstallTime preservados467/540/550. Evidência C11_PHONE_MOVIE_DETAIL_LAYOUT.md; relatório item47.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem backend/Git/reset.


## 2026-10-07 — linhas de categorias e regressão visual de capas

Navegação Filmes/Séries: faixas horizontais/Ver todos/coleção vertical/paginação/back nos três PASS. APK intermediário DF381D54C634B7E4B802E236BC58069DA1D867877014E0AEDF5A1FE66761C90B. Nova regressão visual de capas reportada e reproduzida: prontidão para produção PENDENTE. Evidência C11_FILM_SERIES_CATEGORY_RAILS.md, item48.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.

## 2026-10-08 — ciclo49 recuperação de capas e preparação inicial Fire

Implementadas17 melhorias documentadas em evidência C11_ARTWORK_VISIBLE_LOAD_RECOVERY.md:
coordenador único, resolução, viewport/filas2/2/2, cache nativo/index preview local,
fallback seguro/alias oficial, placeholder estático Fire, associação pública
confirmada local, Home Ver todos43/43 e preparação inicial32+8/hero/20s/atalho.
Bitmap local Fire confirmado com rasterização1px em vez de aguardar decode
dependente de frames escassos no repouso; outros perfis/transportes conservados.
Lock22+27+9/typecheck/build/sync/Gradle/Java134/6assets/assinatura PASS.
APK_FINAL=7B90ECD94749B0546029DB93E5471E95F1CCD13BB2AFF94941623AB174715F9B,
12400179bytes. Install-r Fire103/107/tablet/S24 PASS, hashes privados/catálogo/
identidade/firstInstallTime iguais e APK instalado idêntico (470/792/539/549
privados,436/761/505/508 catálogo,5nativos cada). Baseline699/protegidos227,
App só4callbacks/reader só cancel/HEAD inalterado PASS.

Fire acordado/DisplayON: primeira viewport8/8+hero nos dois; preparo Fire107
32capas, Fire10329+3indisponíveis. Rolagem HBO8/8~3,47s/Apple8/8~1,00s/
Lionsgate7/7~1,93s/NetflixHome8/8~1,54s; Documentários7+1indisponível~5,38s.
Não certifica instalação limpa/internet fraca/catálogo inteiro/SLA. Produção
integral ainda PENDENTE por títulos sem imagem/identificação suficiente.
Luke CageT1E2 adiado pelo usuário. Relatório detalhado item49.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset/nova API.

## 2026-10-08 — ciclo49: artefato atual e cancelamento Fire

Sucede estado histórico7B90. Itens18–27 implementados/testados: Home Ver todos
também Recentes/Destaques, hero3páginas Fire, Voltar direito, Chaves24Hlive/perfil4,
Lançamentos source-desc e logo após DestaquesSéries, aviso fixed/10s e associação
efêmera exata de Recentes após renumeraçãoM3U. Evidência detalhada27itens.
APK_GERADO=AE2A960BD529477B54DDCF3B73A75D381EE11EC2EB303A2FC288AA3C67FEC4D5; JSindex-CYCLvbSn.js;
lock22/27/9/build/sync/Java134/assets6/assinatura PASS; baseline699/55paths/
protegidos223/HEAD igual. Samsung install-r/hash/dados/firstInstallTime PASS:
tablet750/715/5 eS24766/718/5. Fire última preservação confirmadaD8B47;103 recebeu
Success em instalação atual sem verificação completa,107 não confirmado.
Usuário cancelou instalações e testes Fire por uso em outro app; processos
interrompidos, nenhuma nova operação nesses alvos. Sem nova autorização, não
retomar Fire. UI finalSamsung inconclusiva/foraforeground; cobertura universal
de capas/Anos103/reprodução estável e físicos24/25/27 PENDENTES. Tablet Coyote
reproduziu emD8 após conexão de origem voltar; isso não corrige todos os vídeos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset/novaAPI.

## 2026-10-08 — ciclo50: continuidade e atualização dos quatro aparelhos

Pontos por filme/episódio, Recentes com último episódio e recuperação do journal
nativo, filtro adulto e último canal Live seguro implementados. Regressão real
Integer→getLong→0 corrigida no plugin; NativePlayerActivity/transportes/C9
preservados. Lock22/27/9, suites dirigidas, build/sync e Java138 PASS.
APK_FINAL=251E6D4BA6AA3DB6A85129B88181A0A87ABBF256A2F2E91973BEBCC385AB07BC;
12400179bytes; JSindex-r3UQJmy2.js; assets6/certificado/standalone PASS.
S24/tablet install-r preservado760/751privados,718/715catálogo,5nativos cada.
S24T1E2=15000, RecentesT1E1=30000, reabrirE2=15000; filme537925 e LiveGloboSP SD
retorno PASS. Tablet filme5477891 e restart→Recentes5479764 com FIRST_FRAME/READY
PASS. Novo pedido explícito autorizou instalar nos dois Fire:103/107 receberam
o mesmo251E, hash/dados/firstInstallTime PASS,889/1003privados,856/971catálogo,
5nativos cada; app não aberto, nenhuma QA física Fire nesta rodada.
HTTP401 anterior confirmado, sucesso posterior com transporte original não
resolve causa permanente/Um Natal em particular. Capas universais/produção e
QA física Fire continuam pendentes. Evidência C11_PLAYBACK_CONTINUITY_AND_ADULT_EXCLUSION.md,
relatório item50. Baseline720/23pathsallowlisted/703protegidos/HEAD igual.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/reset/backend administrativo.


## 2026-10-08 — ciclos51/52: detalhes e suporte tecnico de playback

Detalhes tablet/Fire: hero radius16/altura de conteudo, toolbar acima; Cast
iconOnly tablet, ausenteFire. Acoes filmes/series junto do trailer e abas de
serie Episodios/Semelhantes. Modal publico, D-pad/Back/foco/cleanup testados;
phone intacto. Aviso com Copiar diagnostico/WhatsApp, HTTP/Media3/checkpoint
reais fechados sem source/segredos; contato publico readonly e envio manual.
7 grupos detalhes/8 suporte/11 aviso anterior/phone5/heroFire4/Java143/lock22+27+9
e build/sync/assets6/certificado PASS. Fisicos layout/trailer tablet/Fire PASS.

EC412FD36F1D3FFEC472E01D9E033EF190FA59A0ECD16A44B25EC27F3C66FBFE instalado e
auditado tablet757/715/5,S24761/718/5,Fire103899/856/5 (privados/catalogo/nativos),
firstInstallTime/grupos iguais. Primeira auditoria8EBA S24 parcial, nao PASS;
repeticao e EC412 PASS. Fire103 amostras integrais estaveis apesar de PID;
Fire107 sem conexao, S23 excluido pelo usuario. S24 Um Natal produziu frame/READY
21:58:26/27UTC, sem patch de transporte; causa401 permanente nao identificada.
Capas universais/producão seguem pendentes. Regressao D-pad apos EC412 reproduzida
(Recentes bloqueia, relacionados retornam ao menu); tratada separadamente53.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/reset/backend administrativo.


## 2026-10-08 — ciclo53: regressao D-pad Fire103 corrigida

Recentes->destaques/Lancamentos e relacionados->hero de filme corrigidos por
ordem de rails no mesmo main e seletor de acao atual; hero completo/restauro
Fire, Ver todos/coluna/menu preservados. Dialogs excluidos da nova rolagem.
Hook4/hero4/detalhes7/typecheck/lock22+27+9/build/assets6/Java143 PASS.
APK_FINAL=EB66904E1F626E835AEB6393E668D8F3BB8FD5E68B948DEE211E8A860D9BA47F; JSindex-DPP6IYm9.js;
Fire103 install-r/hash/firstInstallTime e grupos privados iguais
897/856/5 em2026-10-08T22:32:44.736Z. QA fisica11 passos e
Avaliar Down/Back/foco/fundo estavel PASS. Tablet/S24EC412; S23 excluido.
Fire107 semADB em192.168.3.107:5555, solicitado IP atual/depuracao; nao recebeu
esta versao. Fonte401 externa/capas universais/producão permanecem pendentes.
Baseline728/protegidos703/HEAD igual; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO;
sem Git/reset/backend administrativo. EvidenciaC11_FIRE_DPAD_RAIL_AND_DETAIL_RETURN.md.
## 2026-10-08 — ciclo54: Lancamentos e Destaques nos overviews

Filmes: Lancamentos existentes primeiro, Filmes em Destaque da Home depois;
Series: Series em Destaque antes das plataformas. Mesmos20 registros/views,
Ver todos/colecao vertical/Back de origem, source-desc/paginacao/rail preservados.
Teste4/categorias7/HomeColecoes3/D-pad4/typecheck/React/lock/build/assets/Java PASS.
Fire D23B install-r899/856/5 em22:50:37.301UTC; reconectado em192.168.0.106 com
modelo/API/hash conferidos. QA fisica ordem20cards/Ver todos/Back FireD23B e
S24BKG PASS. S24 recebeu7ACE/763/718/5 e tablet6FAA/756/715/5 depois no55.
Fire107 pendente de conexao; S23 excluido. Playback Luke/AirScreen tratado55,
sem afirmar resolvido pelo54. EvidenciaC11_BROWSE_RELEASE_AND_FEATURED_ORDER.md.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.


## 2026-10-08 — ciclo55: diagnostico playback/Cast e limites comprovados

Luke Cage S01E03 falha perto de725243ms com INVALID_NAL_LENGTH/Media3 3001 no tablet, Fire0.106 e S24. Range206/offset147250663 MATCH; trecho anterior toca. Usuario confirmou mesma falha aos12min em outro app. Nao zerar retomada/descartar NAL/alterar SDK ou fonte para mascarar. Cast preserva UA da fonte e oito codigos fechados no aviso/diagnostico; AirScreen LOAD aceito mas CAST_MEDIA_ERROR. Filme local valido tambem falhou no receiver. WIFI=true/CELLULAR=false/VPN=false, RELAY_BOUND sem PEER_ACCEPTED/DENIED nem GET upstream; usuario informou motor de renderizacao incapaz e encerrou transmissao. Primeira fronteira do Cast no receiver; compatibilidade pendente, nao declarar resolvida.
Java148/diagnostico8/Cast4/lock/build/assets/certificado PASS. APK E87FDD1C76CC9D391DE467B3014C900B3A9C1BF568F6892BB4193646AA49946F, index-BKG-_S4y.js, entregue -r S24 e Fire0.106, grupos privados sem alteracao e firstInstallTime igual. Tablet27C0 mesma UI; entrega nativa final junto56. Fire107 sem conexao; S23 excluido. Evidencia C11_CAST_FAILURE_AND_LUKE_PLAYBACK_DIAGNOSTIC.md. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/reset.


## 2026-10-08 — ciclo56: destaque/continuar/capas neon e D-pad serie

Linha inteira de episodio selecionado destacada. Continuar assistindo/Continuar somente para posicao salva positiva incompleta, identidade canonica/fingerprint/episodeId exatos; subscription e sync nativo existentes com cleanup, sem novo store ou callback de playback. Capas focadas usam contorno e mesmo glow vermelho dos botoes sem alterar dimensoes. D-pad wide segue hero->abas->temporadas (quando existem)->episodios em ordem e volta, independente de X deslocado pelo badge/sinopse; row inteira centralizada. Right/Left locais/menu/restauro/related/modal e hero inteiro Fire preservados.
Render real/WatchHistory2, hook8, hero4, detalhes7, continuidade4, Cast4, diagnostico8, ordem4, typecheck/React, lock22+27+9/prebuild, build/sync, assets6/certificado e Java148 PASS. QA ADB15 passos em Luke Cage aberto por busca no tablet e Fire0.106; hero inteiro/menu/restauro PASS. Fire A Biblia2013 com temporada unica/zero season-buttons:6 passos isolados e identidade da fixture conferida por passo PASS. Regressao Fire Home/filme11 passos PASS. CSS real tablet/Fire: shadow igual ao botao, dimensoes iguais, linha inteira; cascata phone simulada temporariamente no DOM do tablet e removida, nao equivale a QA fisica S24.
APK 4E1DD13D275D75A96FDF4548A03C3BC59024CA1404E83112D5F877ED4C90B10C, index-SYW2hki0.js, instalado tablet/S24/Fire0.106 com dados/assinatura/hash/firstInstallTime preservados.
S24 atualizado com dados preservados, mas UI fisica final pendente por tela/aplicativo fora do foreground; nao desbloqueado pelo agente. Fire107 ausente do ADB e IP atual solicitado; nao alegar versao atualizada ou QA nesse alvo. S23 excluido. Fonte Luke S01E03 aos12min e motor AirScreen continuam limitacoes externas documentadas55; usuario encerrou Cast, nenhum novo teste Cast. Sem semear historico real/avaliar/favoritar/WhatsApp automatico/reset/rotacao/backend/Git/novoGate.
Evidencia C11_EPISODE_CONTINUE_ROW_AND_NEON_CARD_FOCUS.md. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-09 - ciclo57: relatos ao gestor, WhatsApp tablet e foco do aviso

Especificacao e evidencia: docs/architecture/C11_MANAGER_PLAYBACK_ERROR_REPORTS.md e docs/evidence/C11_MANAGER_PLAYBACK_ERROR_REPORTS.md. Enviar ao gestor/copia/fechar em todas as plataformas; emenda do usuario preserva WhatsApp em celular e tablet, exclui Fire/TVBox/Tizen/webOS sem depender da largura. D-pad local/Back prioritario; foco restaurado apos commit React. Sino no Manager OWNER/ADMIN ativo, paginacao50, leitura individual, logout/cancelamento. Backend aditivo privado/RLS sem grants diretos, prova salva validada, payload fechado12campos/13linhas sem source/catalogo, dedup e limites5min/30hora. Migration20261009021625 aplicada somente no projeto cujbmyhitgomlgwfkaat; SQL real com rollback/probePostgREST PASS, zero relatos ficticios persistidos. Manager fora do APK pelo guard existente; painel web remoto e QA visual com gestor autenticado nao executados.
Testes14+8+11+7+8, lock22+27+9/build/sync/Java148/assets6 PASS. APK1FFC3C6A3CB5481654A5F6EBDAB3C1ABB4C0A2333EA22173E3F9FD13D051D997/index-DMoX919H.js instalado e hash/dados/firstInstallTime preservados no tablet/S24/Fire1 novo192.168.3.126. Tablet16passos normais+16fallback forcado PASS; S24 quatrobotoes/WhatsApp/copia/foco/Back/enquadramento PASS. Fixtures isoladas com TSX real/CSS instalado/teclasADB, sem envios; nao equivalem a erro nativo real/fluxo compilado completo. Fire final parcial, QA completa limitada pelo pedido apenas tablet; Fire107 indisponivel/S23 excluido. Luke/AirScreen continuam limitacoes55. Baseline751/protegidos737, HEAD igual/zero fora da allowlist. Sem Git/reset/rotacao/novoGate; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-09 - ciclo58: Soulm8te e filename antigo do TMDB

Spec/evidencia C11_SOULM8TE_METADATA_RECOVERY.md. Identidade real Soulm8te2026 no S24 com posterpublico ausente das variantesTMDB; servico real devolvia null, pagina sem sinopse/trailer e cachematch4negativo. API movie1307118 fornece todos esses dados. Patch minimo somente tmdb-metadata.service: filename primeiro; fallback candidato forte unico/titulo exato/ano exato reconfirmados em detalhes do mesmoID. Homonimos/ano ausente-ou-proximo/titulo fraco/ID inconsistente recusados. match5 ignora negativos antigos preservando positivos offline/ID explicito/storagev2; sem IDfixo/capa da fonte alterada/catalogo ou snapshot escrito.
Teste antesFAIL/depois4gruposPASS; aliases3, phoneMovie3/series2, artworkAtual12/preparacao5/hero1/gestor14 PASS. Suite historica source-first passou8gruposservico mas loaderSSR antigo nao fornece artwork-file-cache do componente atual, incompatibilidade ja no baseline; nao afirmarPASS integral nem relaxarassert. Lock22+27+9/build/sync/Java148/assets6/certificado PASS. APK AEDDAAEAE9EA018BC311CD2E0C3D68048336FDCC16A8EBA919D2781BFDFD8F87/index-Bx2LEpNP.js instalado S24 com hash/dados/firstInstallTime preservados761/718/5 em21:16:40.353UTC. QA pagina real compilada porBusca PASS: sinopse/duracao/classificacao/backdrop horizontal/trailer vinculado/cachesemnegativo. Trailer disponivel, playback nao iniciado. Tablet/Fire1 conservamC57/1FFC; Fire107 indisponivel, S23 excluido. Baseline759/protegidos749/HEADigual/zero fora allowlist. Sem Git/backend/source/licenca/reset/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-09 - ciclo59: selo Novidade por sete dias

Spec/evidencia C11_NEW_CONTENT_BADGE.md. Fonte atual sem data de insercao: primeiro inventario completo e referencia sem selo; novas entradas detectadas depois recebem primeira observacao local por dispositivo/fonte, sete dias corridos, sem renovar por reboot/resync/capa/ID ordinal/reinsercao. Inventario privado IndexedDB hashes/datas, atomicidade/CAS/abort/geracao/counts/limite100000, scan cooperativo movies/series somente apos catalogo REAL autorizado. MediaCard comum faixa vermelha/branca inferior, ano separado, label acessivel, foco neon/D-pad intacto; um relogio compartilhado, sem I/O por capa. Homonimos da fonte indistinguiveis compartilham prazo; renomear pode parecer nova entrada; nao equivale a data global comprovada.
Suite12/categorias7/episodios2/Dpad8/lock22+27+9/TypeScript/build/sync/Gradle/assets6 PASS. Browser real TSX/CSS phone412/tablet1280/Fire960, imagens4/foco/selos2/expiracao PASS e IndexedDB real14assertions com fluxo scan->persist->read->publish->UI em banco QA isolado removido. Java148 evidencia anterior reutilizada, sem novo patch nativo. APK5683BE780F02AA11AE171E62EDF87C5DBFAAE7E802745DAA3068A74CADF97520/index-DvT-8_G7.js instalado-r noS24 com hash/firstInstallTime/dados763/718/5 preservados21:47:50.608UTC. QA visual fisica pendente por UI nao visivel/aparelho bloqueado; pedido de desbloqueio pendente, sem unlock automatico. Tablet/Fire mantem C57, S23 excluido. Baseline762/protegidos753/HEADigual/zeroforaallowlist. Sem backend/source/playback/reset/Git/novoGate. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-09 — ciclo60: atualização automática do catálogo

checkContent detecta adições/remoções mesmo com sourceVersion igual, com autoridade canônica intacta. SHA-256 incremental/nativo64KB ligado ao snapshot/perfil evita parse/staging/promoção quando inalterado. Scheduler foreground15min, cooldown persistido/backoff1min/single flight; detalhes/Live/modal/playback/Cast adiam atualização. Staging validado preserva ativo em falhas; shell permanece, rotas de detalhe da geração antiga são removidas. Xtream seis listas válidas/completas, sem truncamento100. Não existe OTA de APK: outros usuários precisam instalar uma vez; episódios novos entram na série, mas não promovem automaticamente série existente a Destaques/heroes/selo Novidade.

19 testes novos/250k T1–T83/pre-staging A–H/profile-live17/Novidade12/browse4/D-pad8/metadata4/lock22+27+9/TypeScript/build/sync/Java148/assets6 PASS. Artwork histórico: dois grupos serviço PASS, depois loader incompatível com NewContentProvider; não PASS integral nem assertions relaxadas. APK Xandeflix-v1.0-build2-standalone.apk (code2/name1.0 para preservar RPC diagnóstico), SHA256 9D7052EA18079140F4F9FF5AE13EC585CE3DEF3786ED5E82D66C2E20F2BBE95C/index-D9F5_H4Q.js, mesma assinatura/package. install-r/hash/firstInstallTime/grupos privados byte-idênticos PASS: S24 760/718/5, tablet758/715/5, Fire1 3.126 901/856/5.

QA real compilada nos três: catálogo final17152filmes/8914séries/221132episódios/sourceVersion1/digest e clock válidos. Tablet e Fire atualizaram fontes antigas17150/8913/221122 na mesma configuração; S24 confirmou geração atual. NO_OP posterior conserva snapshot: tablet12183ms/Fire42959ms/S249755ms incluindo download, evidência sem SLA. Capas montadas decodificadas15/15,53/53,9/9; Ver todos46 e ordem Home correta. Filmes Lançamentos→Destaque→Nacionais/Séries Destaque→plataformas/retornoHome PASS no tablet e S24. Fire posteriormente em NativePlayerActivity por ação do usuário, sem interrupção/teclas adicionais; não novo QA físico D-pad. S24 foreground pendente inicialmente, depois disponível e conferido. Fire2/S23 fora desta rodada; Luke/AirScreen mantêm limites ciclo55. Baseline767/protegidos752/zero fora da allowlist/HEAD igual.

Spec/evidência: C11_AUTOMATIC_SOURCE_REFRESH.md (architecture/evidence). CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR, backend/env/reset ou projeto protegido.


## 2026-10-09 — ciclo61: séries novas e episódios novos em Destaques/heroes

Spec/evidência C11_SERIES_EPISODE_UPDATES.md (architecture/evidence). Inventário v1
aditivo por fonte/aparelho conserva datas dos títulos; primeira referência completa
de episódios sem falso selo, inclusive mesma geração. Novidade para nova série,
Episódios Novos para combinação temporada/número ainda desconhecida, sete dias
desde detecção local, Novidade prevalece. Reordem/IDs/URL/capa/reinserção/temporada
vazia não renovam; nova adição renova somente episódios. Datas não globais;
homônimos indistinguíveis/renomeação conservam limitações de identidade anteriores.
Somente hashes/datas/faixas numéricas; um segmento/batch200, limite1m episódios,
100k hashes/500k temporadas. Parcial/órfãos/abort/geração/CAS preservam inventário.
Sem nova consulta por capa/TMDB, shell/imagens não aguardam scan.

Resolver no catálogo completo e priorizar até100 candidatas; mesma seleção20 em
Home/Séries/Ver todos de Destaques, hero Home inclui séries antigas atualizadas
mantendo cotas/imagem válida e hero Séries/categoria respeita categoria escolhida.
Selos acessíveis nas capas/hero, dimensões/foco neon/D-pad mantidos. Lista não
substitui card focado durante atualização ou expiração: selo sai no prazo, seleção
expirada se ajusta ao sair do rail/grid. Sem alterar filmes/Recentes/playback.

Nova suite15/escala250k (211001bytes referência), Novidade12, categorias7/ordem4/
coleções3/hero11/elegibilidade1/D-pad8+hero4/refresh19/TypeScript/React PASS.
Browser real TSX/CSS/IndexedDB isolado: scan/persist/restart5checks, labels/foco/
prioridade/hero/expiração nos3perfis PASS,20capas após rolagem,21alvos/sem erros.
Fixtures sintéticas não são teste de adição comercial/TMDB. Lock22+27+9/build/sync/
Gradle/assets6/certificado e Java148 PASS. APK Xandeflix-v1.0-build3-standalone.apk,
code3/name1.0, SHA256364A7E20BB2B25B0BD95EBF72BA4868519F86BC3243A979837D1AD46A3E9839E,
index-DoVPYb8F.js, mesmo package/certificado/RPC diagnóstico. Sem OTA de APK.

Final install-r/hash/firstInstallTime/grupos privados byte-idênticos: S24
974/928/5 em2026-10-10T01:59:36.518Z e tablet974/925/5 em02:01:11.161Z.
Estrutura real S24 read-only8914séries/15834temporadas/221132episódios,
220156coordenadas únicas válidas/mesma geração. Ambos fora foreground/sem UI visível,
WebView deixou de responder após conexão inicial; pedido de disponibilidade
pendente, sem unlock/QA visual integral ou migração persistida física declarada.
Fire1 3.126 permaneceu reproduzindo em NativePlayerActivity/code2: não recebeu
APK3, sessão preservada e disponibilidade solicitada. Fire2/S23 fora da rodada.
Luke/AirScreen mantêm limites55. Baseline771/protegidos749/zero fora da allowlist/
HEAD igual; sem Git/backend/env/reset/rotação/projeto protegido/novoGate.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.


## 2026-10-10 — ciclo62: capas da fonte e recuperação pública de metadados

Spec/evidência C11_PUBLIC_METADATA_GAP_RECOVERY.md. Fonte local17152 filmes:
referência de capa em todos, backdrop duplicado vertical; campos próprios de
ano/ID/sinopse ausentes. Isto não descreve o overlay da UI nem certifica todas
as URLs. Fix genérico de título composto, filename re-hospedado confirmado,
comparação estrita local de capas e mapping match6 isolado por capa. Fonte-first
preservado; sem upload de fonte/IA/novo fornecedor/hardcode de IDs. Auditoria
ampliada encontrou sufixo[L] impedindo match; normalização terminal mínima corrigida.
Tablet final19/19 posters da fonte/metadados/sinopses/backdrops,16 trailers,
três ausentes na API pública. Nove imagens finais visíveis9/9 decodificadas.
Suites6+3+4/TypeScript, lock22+27+9, build/sync/Gradle/Java148/assets7 PASS;
limites dos loaders TSX históricos documentados. APK final build4/name1.0,
SHA256 D41E0B6A8F54B22CBCE43F867005A23A867BE34B15A0DCF90A145BF7B2B66CEF,
index-Copzy1G4.js, mesmo package/certificado. Tablet/S24 install-r/hash/dados/
firstInstallTime preservados971/925/5 e976/928/5. S24 visual pendente/tela apagada.
Fire1 recebeu revisão inicial B875; usuário suspendeu testes antes do fix[L],
sem atualização final ou QA físico posterior. Fire2/S23 excluídos. Não prova
100% do catálogo/playback/Tizen/webOS/OTA. Provenance776/755/zero fora allowlist,
HEAD igual. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/env/reset.

Entrega posterior autorizada (2026-10-10): Fire1 AFTSSS/192.168.3.126 recebeu
a revisão final D41E0B6A.../build4 às10:41:36.484UTC, hash instalado conferido,
1118/1066/5 arquivos total/catálogo/nativo e firstInstallTime preservados;
diferenças0 em todos os grupos privados. Lock22+27+9 PASS. Substitui a pendência
de instalação final acima; QA Fire não retomada, sem abertura automática.


## C63 — Buffer por conteúdo e foco neon nas capas — 2026-10-10

Política compartilhada Media3: live10–20s/start2.5s/rebuffer4s; VOD30–60s/
start4s/rebuffer6s. Alvos TV16/24MiB, mobile24/48MiB, low-RAM16MiB, bytes
prioritários/back-buffer0; live adaptativo offset10s. MediaCard com contorno
neon3px/linha clara/glow sobre imagem, dimensões e D-pad preservados.
Lock22+27+9, TypeScript/build/sync/Gradle, Java154/0, D-pad8 grupos e browser
12 checagens/3 perfis PASS. APK build5/name1.0 SHA256 469D7F48E6F1290643F53E15C9A8AE729BAF6CFA2E3C2E9937A2B6C580571EA3,
index-CM-ALr2j.js, mesmo certificado/package. Fire1/S24Wi-Fi install-r/hash/
firstInstallTime e1118/1066/5 +976/928/5 arquivos privados preservados,0 diferenças.
QA Fire acordado: ring/Right/Down/Enter e frames filme/live; S24 ring/poster/
filme/READY8810ms/liveREADY3306ms e perfis novos confirmados. Não é medição de
reserva Fire nem prova de ausência de travamentos/QA longa/Tizen/webOS/OTA.
Tablet/Fire2/S23 não atualizados. Provenance781/770/zero fora allowlist/HEAD igual.
Spec/evidência C11_PLAYBACK_BUFFER_AND_CARD_FOCUS.md. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; sem Git/backend/env/fonte/reset/refactor/projeto protegido.


## C64 — Lançamentos primeiro na Home — 2026-10-10

Home: Lançamentos → Recentes → Filmes em Destaque → Séries em Destaque,
depois demais categorias na ordem relativa anterior. Hero/callbacks/keys/
quotas/preparação/fonte/player/C63 preservados. Grupo Home PASS; coleções3 e
D-pad8 grupos PASS, lock22+27+9/TypeScript/build/sync/Gradle/assets7/certificado
PASS. Suite histórica home-release-notice integral limitada pelo loader de
@capacitor/browser do Notice inalterado; sem alegação de PASS integral.
APK6/name1.0 SHA256 33E5F9DFDA7A76151C0B0960B0CF5438D70800BB9D48FF301C29356839D5BE9B, index-C-VJn-as.js.
Fire1 install-r/hash/firstInstallTime e1113/1066/5 arquivos privados preservados
às2026-10-10T13:12:58.505Z; todos os grupos sem diferenças. DOM compilado confirma
ordem/Ver todos/hero acima; aparelho Asleep, sem QA visual/D-pad físico novo.
S24 desconectado, atualização pendente; tablet/Fire2/S23 não atualizados.
Provenance785/775/zero fora allowlist/HEAD igual. Spec/evidência
C11_HOME_CATEGORY_PRIORITY_ORDER.md. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO;
sem Git/backend/env/reset/fonte/OTA/projeto protegido.


## C65 — Encerramento de áudio ao fechar PiP — 2026-10-10

Spec anterior: C11_PIP_DISMISS_PLAYBACK_RELEASE.md. Clone independente ativo,
origin esperado/main/HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e; contratos/lock
lidos; baseline787. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git.

Correção: onStop pausa local sem consultar flag PiP; NativePlayerActivity
salva progresso/terminal não-concluído, libera e finish. Preview mantém latch
de entrada PiP até onResume, liberando após dispensa em ambas as ordens de
callbacks; evento terminal existente fecha C9 sem falso erro. Cast/configuração
não são encerrados por essa regra; background normal do preview conserva pausa
e retomada. Release idempotente/remove probes periódicos/listener de layout,
restaura WebView e impede retomada do preview já liberado.

Java 162 testes/0 falhas/0 erros, incluindo8 novos casos lifecycle;
wiring Android/progresso-antes-release/cleanup PASS. Continuidade web4 grupos
PASS (filme55min/episódio exato/journal/adultos/último canal seguro). Lock22+27+9,
TypeScript/Vite/sync/Gradle/assinatura/package/assets7 PASS.
Teste histórico mobile-output: grupo lease Cast PASS; integral FAIL em assert
literal '<CastButton />' obsoleto. Script e3 páginas possuem hashes iguais ao
baseline anterior ao patch; não regressão C65, não corrigido fora da allowlist.
Não afirmar PASS integral desse harness. Warnings flatDir/chunk/externalização
históricos, build concluído. APK build7/code7/name1.0,
SHA256 23EB3CC739CE4708086F4769AE30D66556102DCADB963E3579255BD0C182C320, 11011441 bytes;
bundle index-C-VJn-as.js mantido (mudança nativa), schemeHTTPS/standalone.
Certificado preservado; buffer/foco/metadata/refresh/selos/Home mantidos.

Usuário informou que S24/tablet estão desconectados e solicitou APK para teste
remoto. Sem instalação, playback físico, desbloqueio ou operação em Fire.
PHYSICAL_PIP_DISMISS_AUDIO= PENDING_REMOTE_USER_TEST; não homologado áudio real
nem performance em aparelho fraco. Conferir após atualizar sem desinstalar:
vídeo -> Home/PiP -> fechar X -> ausência de áudio; reabrir mesmo conteúdo e
conferir posição salva. Repetir episódio/canal, retorno PiP fullscreen e fechar
app nos recentes. Evidência unitária não substitui essa conferência.

Spec/evidência: docs/{architecture,evidence}/C11_PIP_DISMISS_PLAYBACK_RELEASE.md.


## C66 — 2026-10-10 — Entrada amigável e D-pad de séries

Build8 gerado e instalado SOMENTE no Fire Stick1 (192.168.3.126), dados íntegros.
Entrada amigável/play animado, sem contadores técnicos; abas saem para menu,
hero horizontal visível, episódios/temporadas/semelhantes retornam nos dois
sentidos.10 grupos hook/2 progresso/7 detail e browser real PASS; Fire físico
Carrie22/Jack Ryan26 passos D-pad PASS. Startup original tem mock
NewContentProvider obsoleto (hashes preservados); cópia privada4 grupos PASS,
não PASS integral original. PiP físico anterior segue pendente. Lock/build/
assinatura/assets/proteção de dados PASS. Tablet/S24/Fire2 sem atualização.
CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO; sem Git/backend/env/player/source writes.
Spec/evidência docs/{architecture,evidence}/C11_FRIENDLY_STARTUP_AND_SERIES_DPAD.md.

## C67 — 2026-10-10 — Heros Fire enquadrados e sinopse legível

Regressão C66 e tentativa CSS-only9 confirmadas fisicamente. Ramo Fire do
hook usa posição explícita com inset, uma rolagem/RAF; CSS enquadra
Home/Filmes/Séries e sinopse .hero-overview aumenta3px (11→14 no aparelho).
Browser110/Fire físico38 verificações PASS, entrada de processo
novo e retorno D-pad/menu/rail. Build10 instalado somente Fire Stick1; todos
os hashes privados/firstInstallTime/APK preservados contra baseline de10.
No evento9 app reabriu antes da verificação: core preservado, hashes completos
não equivalentes após execução. Lock/build/assets/cert/provenance PASS;
162 resultados Java C65 reaproveitados, fontes nativas intactas. Tablet/S24/
Fire2 sem atualização; PiP físico anterior segue pendente. CURRENT_GATE=NONE/
NEXT_GATE_STARTED=NAO; sem Git/backend/env/source/player writes.
Spec/evidência docs/{architecture,evidence}/C11_FIRE_HERO_SAFE_FRAME.md.


## C68 — 2026-10-10 — Continuidade de séries e controles nativos

Avanço automático em ordem numérica ao fim do episódio e entre temporadas;
Próximo manual independente de±10s. Mesma Activity/MediaSource, C9 e resolver
normais a cada troca; correlação/cancelamento preservam Back/stop/revogação.
Controller com episódio/temporada, seek, velocidade, lista, áudio/legendas da
mídia e ajuste de tela; brilho/bloqueio somente handheld, foco D-pad na TV.
Novo teste8 grupos, regressões/C9, Java166 testes executados neste ciclo, build,
lock22+27+9, assets/cert/standalone/provenance PASS. Build13 instalado somente
Fire1:1112 hashes privados, firstInstallTime e APK preservados/verificados.
Fixture física isolada com C9 mock confirmou auto mesma/próxima temporada,
botão próximo, picker, auto após picker e final sem wrap; não certifica fonte
comercial/backend C9. Troca efetiva de trilha e mobile/PiP físico pendentes.
Falha picker11 corrigida com guarda resumed/PiP; evento auto isolado12 não
repetiu em13, causa exata não estabelecida, sem afirmar eliminação definitiva.
APK SHA2568A13A10BA4ED0CDCF99765475CCF9CB4B2CE4EB0F807ED77B95A8AA62F361C74.
781 arquivos fora da allowlist e HEAD preservados. Sem Git/backend/env/source
writes; CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO. Spec/evidência em
docs/{architecture,evidence}/C11_SERIES_PLAYER_CONTINUITY.md.


## C70 ? 2026-10-11 ? Manager lateral, privil?gios e sinal pr?prio

Menu lateral/login real, MASTER global (OWNER can?nico), ADMIN somente seus
consumidores, USER sem Manager. Diret?rio USER/Gestores, atribui??o MASTER,
aprova??o auditada por dispositivo/fonte/licen?a; pagamento indispon?vel.
Ativa??o p?blica valida par antes de fonte/sincroniza??o. Cores privados e
46 RPCs Manager com guards; zero acesso anon/cores/autoridade de sinal ao
cliente. Tr?s migrations aditivas aplicadas somente cujbmyhitgomlgwfkaat;
Edge p?blica v10 e customer-upsert v7 com custom auth preservada.
SQL remoto rollback PASS, cliente8/pol?tica10/browser14, regress?es105,
build/Lock22+27+9 e Deno check PASS. Frontend build local, sem publica??o/APK
ou instala??o. Nenhuma conta/libera??o/exclus?o real; dispositivos sint?ticos0.
Backfill42 configura??es verificado; uma CUSTOMER XTREAM v1 ACTIVE falha
DECRYPT (causa AAD/chave n?o comprovada). Novas ativa??es/CREATE e fontes
alheias permanecem bloqueadas at? corre??o desse envelope pelo respons?vel.
Recupera??o pr?pria com identidade/capability real implementada/testada;
nenhuma fonte/credencial existente foi modificada nem prova fict?cia criada.
Avisos de seguran?a legados documentados, n?o declarar sucesso global.
Provenance allowlist/HEAD preservados, sem Git; C69 pendente, sem playback/
Android/device writes. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO.
Spec/evid?ncia docs/{architecture,evidence}/C11_MANAGER_ROLES_AND_PUBLIC_ACTIVATION.md.

## C71 — Recuperacao da conta MASTER (2026-10-11)

Pedido do titular: recuperar senha existente via Supabase. Spec/evidencia:
`docs/architecture/C11_MANAGER_PASSWORD_RECOVERY.md` e
`docs/evidence/C11_MANAGER_PASSWORD_RECOVERY.md`. OWNER ACTIVE preservado;
sem novo MASTER, promocao, exclusao ou Git. Pagina de recuperacao independente
com verificacao Auth real, senha somente em memoria, encerramento global e
novo login. Pedido de email aceito/registrado; entrega e novo login pendentes
do titular. Login principal continua inline, pagina dedicada foi discutida.
C71 13/13, C70 8/8, lock e build PASS; browser desktop/mobile/expirado PASS.
Falha EBUSY no watch de perfil headless corrigida no helper local ignorando
arquivos temporarios; servidor3000 restaurado e mantido para concluir link.
Sem APK/dispositivo/source/deploy ou proximo Gate. HEAD61ec009 inalterado.

### C71 — Retorno real do email de recuperacao (2026-10-11)

Print confirma otp_expired do Supabase; causa especifica nao comprovada.
Corrigido diagnostico do teste (CORS fixture faltava header SDK), callback
valido tambem passa com main anterior. Mudanca de captura antecipada retirada.
Patch minimo: titulo Definir nova senha quando verificado, email mais recente
nas mensagens e cooldown UI de reenvio60s. C71 15/15, build/lock e browser SDK
com submit/ACK/logout todos PASS (Auth interceptado; senha real nunca alterada).
Tentativa nova de email foi recusada429 over_email_send_rate_limit; aguardando
janela SMTP. MASTER existente preservado, login real pendente do titular.
Detalhes: docs/evidence/C11_MANAGER_PASSWORD_RECOVERY.md. Sem Git/APK/fonte.

### C71 — Recuperacao pronta para teste do titular (2026-10-11)

Titular informou acesso restabelecido com a senha da conta existente e pediu
finalizacao do fluxo para teste posterior. Consulta read-only confirmou
last_sign_in_at 2026-10-11 19:07:44Z, OWNER ACTIVE (MASTER); ultimo envio de
recuperacao continua 18:42:08Z. Isso confirma login, nao troca de senha pelo
fluxo de recuperacao. Nenhum novo email foi solicitado apos esse retorno.
A espera de quota/email adicional registrada antes fica encerrada.
C71 isolado reexecutado: 15/15 PASS. Pagina local /manager-reset-password HTTP
200. Build/lock e browser com SDK real + Auth interceptado PASS no fechamento
anterior; codigo funcional nao mudou depois dessa verificacao.
Implementacao local concluida, teste real de troca de senha pelo titular ainda
pendente. Para testar: Esqueci minha senha, pedido unico, email mais recente,
Definir nova senha + confirmacao (12 caracteres), salvar e entrar novamente.
Nenhum token/senha real coletado; nenhuma conta, role, fonte ou dispositivo
alterado. Sem commit/push/PR, APK ou deploy. NEXT_GATE_STARTED=NAO.

### C72 — Configuracoes e escolha Celular/Tablet/TV (2026-10-11)

Pedido explicito implementado conforme C11_DEVICE_PRESENTATION_CHOICE.md.
Android sem preferencia escolhe antes de Codigo ID/chave e App/boot; detector
inicial associa PHONE/TABLET/TV ao novo registro. Configuracoes e pagina interna
com tipo de dispositivo e dados de ativacao; layout muda e persiste, preservando
ID/chave/catalogo/ativacao. Tipos remotos antigos nao reescritos.
Templates/cache/parental/perfis preparados como extensoes futuras, nao feitos.
Testes C72 +navegacao18/3 +HomeHero +notice11 +recovery15 PASS; browser real UA
Android Mobile enganosa, controle/foco/Voltar, storage denied/retry, persistencia
e identidade/chave sem remount PASS. Lock22+27+9, build/typecheck PASS.
APK debug gerado Java21, assinatura/package/SDK e7 assets dist byte-match PASS.
SHA256 01C185992FF1222B7DDCA99B2DDA6F52E60260E4B49B54AF60CA201172AAEAFD.
Artefato tmp/c72-device-presentation/xandeflix-configuracoes-dispositivo.apk.
Mi Stick fisico pendente; nenhuma instalacao/distribuicao/backend/Git.
Erros corrigidos e rejeicao de limpeza da pasta vazia externa registrados em
 docs/evidence/C11_DEVICE_PRESENTATION_CHOICE.md. NEXT_GATE_STARTED=NAO.


### C73 — Player Live, PiP e ajustes tablet (2026-10-11)

Player Live com canais/categorias/guia/favoritos e controles proprios em previa/fullscreen. Paginas mobile48 permitem todos os63/105 canais de teste; troca preserva C9 serializado. PiP Live mute/unmute e VOD play/pause, sem alterar fechamento. Tablet hero16:9 inteiro, menu superior fixo em retrato; Configuracoes usa engrenagem.
TS/build/lock22+27+9, JS7, regressao Cast/awake/series/continuidade/device/nav e browser PASS. Java21:170 testes sem failures/errors/skipped; APK debug assinatura/package/7 assets byte-match PASS. QA fisica de controles nativos/PiP pendente.
Artefato tmp/c73-live-player-controls/xandeflix-player-tv-ao-vivo.apk, 12.379.300 bytes, SHA256 E82CA3324DA7467112F37366E6F682B92D73899D552001555F92881337EC969F. Sem instalacao/distribuicao/backend/env/Git.
NEXT_GATE_STARTED=NAO.


### C74 — Ativacao assistida e Codigo ID automatico (2026-10-11)

Concluido Codigo ID automatico nos campos do gestor/portal; Share mobile/tablet na primeira ativacao; solicitacao TV com nome/plataforma/routing opcional. Icones diferentes: sino para erros e tela com + para ativacao. Clique na solicitacao abre aba Ativacao validada/preenchida; gestor informa fonte e confirma ATIVAR. Manual preservado.
Supabase cujbmyhitgomlgwfkaat migration20261011221900 aplicada e Edge managed-source-vault-admin v12 verify_jwt=true. Isolamento ADMIN/MASTER, hash somente server-side e nenhum segredo na notificacao. JS7, SQL rollback incluindo paginas50, browser D-pad/fluxo, scoped8/relatos14/chave20/device3, lock22+27+9, TS/build/Gradle/APK PASS. Teste fisico pendente.
APK tmp/c74-activation-handoff/xandeflix-ativacao-compartilhar.apk, 12379300 bytes, SHA256 D084B1D9F41D65020908D95AB944E96AEF5A5F21B3FB3525ABFE41F719AF2F84. Package/assinatura/7 assets byte-match PASS. Sem instalacao/distribuicao/env/Git.
NEXT_GATE_STARTED=NAO.


### C75 ? Previa Live sem comandos duplicados (2026-10-11)

Removida somente a faixa de oito botoes da previa em phone/tablet/TV; listas, abas, EPG e comandos fullscreen/PiP preservados. Browser 6 layouts com paginacao63/105, confirmacao touch/D-pad e eventos nativos PASS; Live7, build/lock22+27+9 e Gradle assembleDebug PASS. APK assinatura/package/7 assets verificados: 12379300 bytes, SHA256 1CA5C6882AA27AE8B072E70B7AF47578DD709767654479A316FDAF31456936AF. Sem teste fisico/instalacao/backend/env/Git. NEXT_GATE_STARTED=NAO.


### C76 ? Troca Live sem fechar fullscreen/PiP (2026-10-11)

Correcao direta: cleanup suspende/limpa somente midia antes do release C9; novo canal autorizado usa updatePreview URI na mesma instancia/id/PlayerView/controlador PiP. Categorias filtram apenas lista. Unmount/negacao/falha encerram player e autorizacao; comandos concorrentes bloqueados durante handoff. C75 sem faixa duplicada preservado.
Browser6 layouts + modal/categorias/setas/PiP simulado, midia parada antes do release, guard sem sobreposicao, negacao/falha de update/recuperacao e unmount durante acquire PASS. Java21:172 testes,0 failures/errors/skipped, inclui suspend proxy ExoPlayer e flags headless inline/full/PiP; testes nao certificam janelas reais. Live7/Cast/awake/backdrop/continuidade, lock22+27+9, TS/Vite/Gradle PASS.
APK 12379300 bytes, SHA256 6C6B7B8B46C0F496CDF985C6E9CC1EF87B8BBCB8EBC73B98FFFC9115C6606346, package com.xandeflix.prebuilt v13/1.0, assinatura debug existente e7 assets byte-match verificados. tmp/c76-live-mode-preservation/xandeflix-live-fullscreen-pip.apk. Sem instalacao/backend/env/Git; validacao fisica pendente. NEXT_GATE_STARTED=NAO.


### C77 ? Menu Configuracoes e dados de ativacao (2026-10-11)

Ativacao retirada da navegacao principal em todos os layouts. Configuracoes permanece no menu tablet/TV; no celular, engrenagem no topo em todas as telas compactas, com quatro atalhos no rodape. Tela Configuracoes preserva Ver dados de ativacao. Retorno Settings adota icones Home/Voltar existentes; espaco reservado aos alvos44px.
Browser9 layouts x7 telas com AppShell/Header/Settings/hooks reais e portas Live sinteticas PASS: uma engrenagem visivel, nenhuma entrada Ativacao no menu, Settings->ativacao->retorno, TV Search->Settings via D-pad, geometria/sem sobreposicao. Device3/nav18+3 e hook, lock22+27+9 antes/depois, TS/Vite/Gradle assembleDebug PASS. Regras do player/ativacao/source/cat/identidade intactas; Java nao alterado nem suites Java repetidas.
APK 12379300 bytes, SHA256 33C576C70970298FBBE9C8B40BDE4A720D2A7DE46B17BBDA560DE9646BA12D5F, package com.xandeflix.prebuilt v13/1.0, assinatura existente e7 assets byte-match verificados. tmp/c77-settings-navigation/xandeflix-configuracoes-menu.apk. Sem instalacao/backend/env/Git; QA fisica pendente. NEXT_GATE_STARTED=NAO.

## C78 — 2026-10-12 — Licenças consolidadas
Pedido autorizado e spec em docs/architecture/C11_LICENSE_CONSOLE.md; evidência em docs/evidence/C11_LICENSE_CONSOLE.md. Tabela sem ID visível; códigos, plataforma/tipo e último acesso; ícones acessíveis; modal de fonte/apelidos/vinculação por chave. MASTER exclui conta inteira com prévia e confirmação; ADMIN limitado ao próprio escopo. Backend publicado somente cujbmyhitgomlgwfkaat: migration 20261012030657 e Edge vault-admin v13 JWT obrigatório. Testes SQL rollback, AES/autoridade, browser 3 layouts, regressões e build PASS. Nenhum cliente real apagado; sem Git, instalação ou APK; demais abas preservadas.

## C79 — 2026-10-12 — Licenças sem corte
Painel com largura total disponível, desktop em tabela e mobile até 600 px em blocos. Nove larguras sem overflow; ações/foco/permissões e build/lock aprovados. Evidência: docs/evidence/C11_LICENSE_TABLE_RESPONSIVE.md. Sem operações remotas, APK ou Git; NEXT_GATE_STARTED=NAO.


## C80 — 2026-10-12 — Cadastro descritivo e vínculo de aparelhos
Concluído: Local/Tipo, capacidade, Principal/Secundário, tabela consolidada e modal Novo/Já cadastrado com transferência explícita. SQL rollback/escopo/identidade, 6 grupos cliente/Edge, C78 4 grupos, browser tabela9 + cadastro + modal e build/lock PASS. Supabase migrations 20261012052138/060054/060218 e vault-admin v14 JWT obrigatório publicados somente no projeto autorizado; nenhum dado real transferido. Spec/evidência C11_MANAGER_DEVICE_REGISTRATION.md. Sem Git/APK; próximo ciclo somente após nova autorização do usuário.

## C81 — 2026-10-12 — Submenu de ativação e vínculo com limites
Concluído após C80: Ativar dispositivo tem Ativação por Código + Chave e Vincular dispositivo. Principal cadastrado selecionado, modal de vínculo registrado com limites readonly/contagem e revisão origem/destino. Bloqueio de falta de vagas e simultâneos acima da capacidade; sem fixar plano de quatro telas ou cobrança. SQL rollback e cliente/Edge6, C78 4, browser submenu/notificação/capacidade + regressões tabela9/cadastro/modal PASS. Migration 20261012061407 e Edge vault-admin v15 JWT obrigatório publicados no projeto autorizado; sem clientes reais alterados/Git/APK. Evidência C11_ACTIVATION_LINK_SUBMENU.md.

## C82 — 2026-10-12 — Principal, edição exclusiva de telas e conferência manual
Concluído: quantidade e simultaneidade somente Licenças → Editar licença; removidos formulário redundante de vínculo e modal separado de limites. Ativação assistida readonly; submenu Vincular permanece. Self inicial1–4; acima4 exige comprovação manual ADMIN/MASTER com referência na auditoria. Principal nunca vira secundário; legado pode ser definido e secundário promovido dentro da mesma franquia. Migration20261012065513 e Edge vault-admin v17/JWT + public-activation v11/capability publicados no projeto autorizado. SQL rollback, C82 cliente/Edge3, C80 6, C78 4, browser real e tabela9 larguras, TypeScript/Vite/Activation Lock PASS. Nenhum cliente real ou Git/APK alterado. Evidência C11_LICENSE_PRINCIPAL_SCREEN_POLICY.md.


## C83 — 2026-10-12 — Editor completo e mudança de principal com filhos
Concluído: cliente por ID editável, Local/Tipo e plataforma/tipo administrativos, fonte/mesma fonte/slots individuais, dados automáticos readonly. PRIMARY→SECONDARY exige modal de novo principal e destino dos filhos (todos transferidos ou mantidos sob outro principal atual), confirmação e aplicação atômica ao salvar. Emenda explícita supera apenas bloqueio absoluto C82; vínculo implícito permanece negado. Limites/conferência manual somente EDIT. Migrations20261012105040/110747 publicadas no projeto autorizado, sem dados reais alterados. SQL rollback/cliente real/browser desktop+mobile/tabela9/build/lock PASS; provenance allowlist/HEAD preservados. Spec/evidência C11_LICENSE_EDITOR_FIELDS.md. Sem Git/APK; NEXT_GATE_STARTED=NAO.


## C84 — 2026-10-12 — Linhas vazias de licenças
Licenças explicitamente sem aparelhos e sem vínculos ativos ocultas por padrão após transferência; filtro opcional permite consulta sem apagar contrato. Principal/secundário consolidados, busca/status/modo/contagem combinados, legado/revogado preservados. Browser desktop/mobile e tabela9, console C78 quatro grupos, build/lock e provenance PASS. Spec/evidência C11_LICENSE_EMPTY_ROWS.md. Nenhuma alteração de banco/Git/APK. NEXT_GATE_STARTED=NAO.


## C85 — 2026-10-12 — Editor e visual administrativo
Editor com salvamento único transacional, feedback de capacidade/principal, seções e espaçamento; tabela por aparelho com secundários recolhidos e busca que expande grupos. Rótulos/legendas em destaque comum; Voltar duplicado removido no Gestor em Header/AppShell. Backend autorizado publicado (migration20261012131621, Edge v18/JWT). SQL/C82/C83, cliente/Edge/AES, browser9, retorno3apresentações, build/lock e provenance PASS. Frontend local, sem cadastro real/Git/APK alterado. Spec/evidência C11_LICENSE_SCREEN_FORM_FEEDBACK.md; NEXT_GATE_STARTED=NAO.


## C86 — 2026-10-12 — Campos pendentes do editor
Concluído local: contorno de campos/checkboxes pendentes, avisos clicáveis e acessíveis que focam/rolam ao campo correspondente. Mesma validação e salvamento único preservados. Browser desktop/mobile, teclado, limpeza de erros e chamada única, TypeScript/build/lock e regressões C85 PASS. Sem alteração de banco/cadastro real/Git/APK. Contrato/evidência C11_LICENSE_EDITOR_PENDING_FIELDS.md. NEXT_GATE_STARTED=NAO.


## C87 — 2026-10-12 — Slots automáticos na conferência
Conferência de telas adicionais calcula capacidade vigente ou 4+total cumulativo; não exige editar quantidade manualmente nem duplica vagas em reenvio. Simultaneidade independente, principal/prova obrigatórios e atalho para licença correta. Browser desktop/mobile, payload único, SQL real transacional/revertido (conta cheia → quinto/slot5/mesma fonte → sexto/slot6; duplicidade/rollback), build/lock/regressão PASS. Sem conta real/backend/Git/APK alterado. Contrato/evidência C11_EXTRA_SCREEN_AUTOMATIC_SLOTS.md; NEXT_GATE_STARTED=NAO.


## C88 — 2026-10-12 — Secundário com slot destino disponível
Editor reconhece transferência para outra licença sem principal retido: descarta rascunhos incompatíveis de capacidade/pagamento origem com aviso, revisão/payload somente aparelho e validações corretas. Caso real diagnosticado somente leitura: origem1/destino5 com4vínculos; não alterado. Browser desktop/mobile, retorno PRIMARY/validação legítima/retry, SQL RPC agregada com rollback e regressão C85 PASS. Build do Gestor/lock e auditoria conforme evidência C11_SECONDARY_TRANSFER_CAPACITY_CONTEXT.md; sem Git/backend/APK. NEXT_GATE_STARTED=NAO.

## C89 — Nova solicitação após exclusão — 2026-10-12

Corrigida localmente a interrupção permanente ao consultar solicitação apagada:
ACTIVATION_NOT_FOUND explícito permite refazer registro canônico sem rotacionar
identidade/chave/token. Manager apresenta orientação informativa. 26 testes de
ativação, SQL rollback real, browser sintético desktop/mobile, typecheck e build
Manager/prebuild aprovados. Aparelho físico/novo APK pendentes; nenhum cadastro
real restaurado. [Evidência](evidence/C11_DELETED_DEVICE_ACTIVATION_RECOVERY.md).

## C90 — Atualizações Android e busca manual — 2026-10-12

Implementado localmente: MASTER publica versão/hash/tamanho e até cinco URLs
externas por prioridade. Android consulta diariamente, baixa com fallback,
valida assinatura/package/integridade e sugere instalar até versão efetivamente
instalada. Configurações inclui Buscar atualização imediato. Migrations no
projeto autorizado; release real permanece desativada/revision0. SQL rollback,
browser desktop/mobile e RPC público real, seis testes JVM, builds Manager/client,
assemble e lock PASS. Lint global FAIL:138 erros em arquivos138/138 intactos no
baseline, nenhum erro novo do updater. APK14 de validação, mesma assinatura do
APK13 informado; instalação física pendente. Sem Git/cadastro real/instalação.
[Evidência](evidence/C11_APP_UPDATE_MIRRORS.md). NEXT_GATE_STARTED=NAO.

## C91 — Hero dinâmico de Filmes e Séries — 2026-10-12

Implementado localmente: carrossel Home reutilizado por tipo nas listas gerais,
dez segundos/pausa/controles e layout mobile/tablet/TV. Categorias específicas e
detalhes preservados. Consulta tipada/hook real/Home/artwork/D-pad/updater,
browser seis casos+Home/empty/timeout real, typecheck/build/lock e seis JVM PASS.
APK15/1.0.15 de teste, 11081999bytes, hash219fad62a0c26d9234577e6858f739d15c242d21a1a707d07789c2010c2553df,
mesma assinatura14 e sete assets verificados. Lint global continua pendente C90;
instalação física/publicação15 pendentes. Sem Git/backend/cadastro/instalação.
[Evidência](evidence/C11_BROWSE_DYNAMIC_HERO.md). NEXT_GATE_STARTED=NAO.

## C92 — Hero por deslize e marcadores — 2026-10-12

Home/Filmes/Séries: gesto lateral, marcadores circulares e rotação10s;
rolagem vertical/zoom e pausas de foco/visibilidade/movimento preservados.
Regressões, browser seis casos+toque/D-pad/lote/Home/empty/timer real,
TypeScript/build/lock/Capacitor/seis JVM PASS. APK16/1.0.16:11082709bytes,
hash4382eb78f99813ca4f2a4b55f537d4a6476a77136092543ba4257b0289ed2c02,
mesma assinatura14/15, sete assets verificados. Instalação/publicação pendentes.
Modelos Canais dobrável somente para aprovação; B50/50 prévia/EPG à esquerda,
categorias/canais à direita. Sem mudança funcional Live no APK16. Sem Git,
backend ou cadastro. [Evidência](evidence/C11_HERO_SWIPE_DOTS.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C93 — Canais em tela touch quase quadrada — 2026-10-12

Modelo aprovado implementado: prévia16:9/EPG esquerda50%, categorias/canais
à direita50%, rolagem independente e adaptação resize/orientação, sem reiniciar
preview/sessão. Janela >=600CSSpx, razão0.8–1.25, touch e não-TV; phone estreito,
tablet alongado, desktop sem touch e TV preservados. Classificador18, browser
seis tamanhos+fluxos, mobile/landscape/hero, typecheck/build/lock/Capcopy e seis
JVM updater PASS. APK17/1.0.17:11084739bytes, SHA256
933115f30da66310298f877bfb0f241c79d2e8a09bd57bb79d50ca8daf29edd7,
mesmo signer; sete assets e updater verificados. Teste físico/publicação pendentes.
[Evidência](evidence/C11_SQUARE_LIVE_LAYOUT.md). Sem Git/backend/instalação.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C94 — Hero: modelo sobreposto preservado — 2026-10-12
Emenda explícita rejeitou metadados fora da capa. Restaurado tamanho anterior
mobile2:3, capa contain e sobreposição do gradiente; Assistir/Ver detalhes e
dots compactos dentro do hero. Browser12 formatos/casos, timer10s real, swipe,
foco, ações, erro/retry, typecheck, regressões Home/Browse e lock PASS.
APK18 não gerado: análise de reprodução priorizada antes do empacotamento.
Diagnóstico somente leitura identificou tablet XF-JNQK-NZ77 com fonte local
antiga src_w9kb47u3efcvrqnj promovida11h15; banco aponta para fonte nova
src_87kbpy51ws9nnz6d desde18h21. Transferência dos outros dois aplicada no banco.
Motivo da persistência local e playback da fonte nova ainda não certificados;
sem alteração de fonte/banco/aparelho. Evidências privadas e relatório em
[evidência C94](evidence/C11_HERO_COMPACT_ACTIONS.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem Git/backend/instalação/publicação.
## C95 — Fonte reconciliada e Live recuperado no tablet — 2026-10-12
Pedido explícito de correção em tempo real no tablet XF-JNQK-NZ77. Retorno ao
Início e coordenador canônico concluíram importação/promoção da fonte atual,
snapshot snap-mv5s8v3o, sem editar manualmente pointer/cofre ou instalar APK.
Sincronização física284363ms; antigo catálogo permanecia durante processamento.
GLOBO SP FHD reproduzindo confirmado por evento nativo e screenshot físico.
BAND NEWS FHD permanece com falha403/404 da origem. Provedor informa conta
Active/auth1, limite2 simultâneas e1 ativa, enquanto licença local permite8;
não foi provado excesso na falha original e não se alterou cota/banco.
Hashes identidade/chave/ativação/instalação preservados. C94 visual mantida,
APK18 adiado; nenhuma alteração funcional de código/Git/backend/outro aparelho.
[Evidência C95](evidence/C11_TABLET_SOURCE_RECONCILIATION.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
## C96 — APK1.0.18 para teste de UI — 2026-10-12
Retomado empacotamento autorizado após usuário confirmar BAND NEWS SD; demais
problemas adiados. Hero sobreposto/Assistir/dots compactos/swipe10s e Live square
incluídos, sem patch funcional adicional. Build/lock/Capcopy/assemble/6 JVM,
regressões UI, sete assets, package18 e assinatura igual ao17 PASS.
APK11086375bytes, SHA256
5bb8c0273f58cc9bf800367658d08ec5c7de31ad3eed50b63a74e8a85c8c506e.
Arquivo tmp/c96-ui-apk18/Xandeflix-v1.0.18-ui.apk; dados-publicacao.txt disponível.
[Evidência C96](evidence/C11_UI_APK18_DELIVERY.md). Sem instalação/publicação/
backend/Git. UI física do APK18 pendente de teste do usuário.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
## C97 ? Acesso localhost ao gestor ? 2026-10-13
Vite escutava3000, mas HTTP expirava; rein?cio simples insuficiente. Perfil CPU
identificou cria??o massiva de FSWatchers; tmp tinha73518 arquivos medidos.
Patch m?nimo vite.config.ts ignora tmp no watcher e limita optimizeDeps a index.html.
Servidor normal ativo3000; quinze HTTP200,301 imports sem falhas, lock antes/depois PASS.
Navegador CUA indispon?vel: login/renderiza??o f?sica n?o certificados; recarregar aba.
[Evid?ncia](evidence/C11_LOCAL_DEV_SERVER_RECOVERY.md). Sem APK/Git/backend/dispositivos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C98 ? Limpeza seletiva de tmp ? 2026-10-13
Removidos163 perfis ef?meros de navegador sem uso,68906 arquivos,4803565330bytes
(4.47GiB). tmp posterior4086061675bytes (~3.81GiB),23392 arquivos. Zero falhas.
Hashes de23384 arquivos preservados, incluindo46 APKs, PASS. Backup da migra??o,
relat?rios, scripts, snapshots e dados privados preservados. Servidor3000 segue200.
[Evid?ncia](evidence/C11_TEMP_ARTIFACT_CLEANUP.md). Sem patch funcional/APK/Git/
backend/dispositivos; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## C99 — Sincronização GitHub autorizada e validada — 2026-10-13
Pedido explícito autoriza commit/push main em xandeflix2/xandeflix-prebuilt.
Fetch inicial confirmou local/remoto61ec009, sem divergência. Código C11/UI18,
gestor, Android e testes/documentos revisados; arquivos privados/IDE/diagnósticos
permanecem locais e ignorados. Build/prebuild lock,30 regressões e178 JVM PASS;
APK18/hash preservado. Seis harnesses legados atualizados para interfaces já
aprovadas, sem patch funcional. Falhas iniciais e correções em evidência C99.
[Evidência](evidence/C11_GITHUB_SYNCHRONIZATION_20261013.md).
Envio pendente até confirmação do push; sem backend/deploy/instalação/PR.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; GIT_COMMIT_AUTHORIZED=SIM;
GIT_PUSH_AUTHORIZED=SIM.

## C99 — Código publicado e remoto confirmado — 2026-10-13
Commit0bf9471019114b8c3ce74751ce3b6b8ec7d97494 publicou500 arquivos C11
em xandeflix2/xandeflix-prebuilt/main, push normal e ls-remote idêntico ao HEAD.
Build/lock,30 regressões e178 JVM PASS; APK18/env/privados preservados.
Auditoria final de staging/proveniência PASS, sem arquivo fora da allowlist;
harness de staging corrigido após inventário parcial worktree/index, sem reset.
Este complemento registra confirmação observada após o envio do código.
[Evidência](evidence/C11_GITHUB_SYNCHRONIZATION_20261013.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem backend/deploy/instalação/PR.
