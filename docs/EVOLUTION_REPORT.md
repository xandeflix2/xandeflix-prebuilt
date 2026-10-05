# Relatorio de Evolucao (Evolution Report)

## 2026-10-05 — Autorização de publicação dos registros independentes

Usuário aprovou nominalmente commit e push para alinhamento de C11/main. Emenda
prévia limita publicação aos oito documentos da migração/consolidação; histórico
retido, nenhuma mudança funcional. Git próprio e remoto canônico confirmados,
parentfd2f561; GitHub permite push e não tem workflows. Candidatos sem segredos
de alta confiança, lock49+9 PASS e548 hashes fora da allowlist preservados;
manifesto/segredos staged precedem commit/push normal; sucesso depende da
conferência posterior de refs/árvore/status. Sem outra ref, PR, deploy, exclusão,
APK/reset/aparelhos ou novo Gate. Operacionais/backups permanecem locais.
[Plano](architecture/C11_INDEPENDENT_GIT_MIGRATION.md).

## 2026-10-05 — Migração administrativa para clone independente

Autorização explícita para migrar sem perder arquivos locais, formalizada em
spec prévia. Backup completo de C11 e pasta histórica, incluindo arquivos
ignorados/diretórios vazios/Git antigo; hashes de todas as cópias e fontes PASS.
Clone HTTPS do mesmo checkpoint, sem checkout/shared/reference, fsck PASS;
índice read-tree sem -u e troca recuperável apenas de metadata, não da árvore
de trabalho. Git-dir/common-dir agora C11/.git, uma worktree, main/origin/HEAD
inalterados; zero apontamento a Git externo. Pasta antiga preservada em leitura.
AGENTS e notas de sucessão atualizados, sem apagar histórico de consolidação.
Lock antes/depois49+9, chave16, fonte31, playback11, typecheck e build414 PASS;
output separado, cinco arquivos byte-idênticos ao dist local. APK e operacionais
intactos. Sem commit/push/PR, backend, Android/aparelhos ou novo Gate. Histórico
exclusivamente local antigo retido no backup, não importado automaticamente.
[Evidência e retenção](evidence/C11_INDEPENDENT_GIT_MIGRATION.md).

## 2026-10-05 — Checkpoint adicional e análise de deploy em leitura

Pedido nominal de commit local; emenda/allowlist21 antes de staging. Revisão das
duas entregas recentes, sem editar runtime/testes/dependências. Lock49+9, chave18,
fonte31, gestor20, layout18+hook, playback11 e typecheck/build414 repetidos PASS;
T15 manager-form já ausente no parent permanece14/15, não relaxado. Scanner455
textos detectou três entradas sintéticas antigas de detector/sanitizador, revisadas
sem revelar URL/credenciais; nenhum segredo de alta confiança detectado.
Supabase/Vercel skills orientaram auditoria read-only: projeto saudável, nenhum
Vercel ligado ao repo nos dois escopos acessíveis; GitHub sem admin para hooks.
Capturas do usuário confirmam repo correto e toggle Deploy to production OFF no
Supabase. Capturas posteriores do GitHub mostram lista de webhooks vazia e somente
App Supabase, esclarecendo a pendência administrativa sem inferir ausência do App.
Não alterar/salvar opções, migrar/deployar, instalar/limpar aparelhos ou publicar
painel. Novo checkpoint identificado pelo assunto na evidência; push separado,
não executado, proposto após confirmação explícita/reconferência do remoto.
APK/runtime e sete operacionais protegidos por hashes; Git comum preservado.
[Evidência](evidence/C11_GIT_CONSOLIDATION.md).

## 2026-10-05 — Apresentação da mesma chave após AUTHORIZED

Diagnóstico read-only confirmou persistência e ocultação pelo JSX condicional.
Usuário aprovou fix e update somente do celular. Spec antes do código; chave/
cópia movidas para cartão comum, um estado de feedback local, instrução A1
compatível com a nova posição. AST prova efeitos/handlers/status inalterados;
serviços/autoridade/persistência não modificados. Novo teste18, lock49+9, playback11
e fonte exclusiva31 PASS. Skills de browser orientaram testes do JSX/callback
real com dependências sintéticas, clipboard mock, transição e quatro viewports;
nenhum dado/env real ou request externo. Falhas de import.meta/quoting/UTF8 do
harness registradas e corrigidas com reexecuções válidas, sem alteração funcional.
Build/cap/Gradle/assinatura/assets PASS;655 entradas nativas preservadas.
Revisão final ajustou somente instrução "abaixo" e repetiu testes/build/entrega.
APK final8785127bytes/F58BC34DA5B30ADC1E8C0D443086ACB286BEA47E4E4CEE9D23F261B6808881F8
instalado in-place somente SM-S926B;5/5 privados e508/508 catálogo preservados,
hash instalado correto/firstInstallTime original intacto.403/405 runtime idênticos,
diferenças apenas página/APK, backup anterior mantido. Sem launch/reset/fonte real/
Git/backend/novo Gate. Confirmação visual física final pelo usuário pendente.
[Evidência](evidence/C11_ACTIVATION_KEY_VISIBILITY.md).

## 2026-10-05 — Entrega física somente no Samsung SM-S926B

Usuário confirmou Depuração USB após pedido de instalar somente no celular.
Spec de entrega antes da operação, preflight C11/main/origin correto e lock49+9
PASS. APK existente8751706bytes atualizado com install -r e Success, sem rebuild.
Hash do base.apk instalado idêntico ao APK entregue; cinco arquivos privados e
508 arquivos de catálogo preservados byte a byte, sem registrar seus conteúdos
ou hashes particulares. firstInstallTime do user0 inalterado, lastUpdateTime
2026-10-05 18:24:03. Sem launch/uninstall/clear/reset, alteração remota de fonte,
Git ou próximo Gate. Fire Stick conectado e tablet excluídos. Conferência visual
da Home no celular permanece a cargo do usuário; HTTP403 não declarado resolvido.
Validação auxiliar inicial de formato dos hashes abortou antes da instalação;
inventário explícito e lotes de64 permitiram conferência completa antes/depois.
[Evidência](evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md).

## 2026-10-05 — Fonte exclusiva no gestor e acesso à Ativação na Home phone

Usuário pediu trocar fonte de aparelho ativo sem interromper fonte compartilhada
e corrigiu o posicionamento do atalho: cabeçalho à direita somente Home mobile.
Novo form usa vault+switch existentes, preflight/confirm/busy/verificação, retry
sem recriar fonte nem reter URL; não passa pelo fluxo de nova ativação. Supabase/
Postgres/React e browser orientaram isolamento, tipagem wire-null e lifecycle.
Header/footer/layouts e núcleo de ativação preservados;400/405 baseline iguais.
Lock49+9,31 testes novos,20 gestor,18 policy/hook,11 playback,44 Header e browser
manager final PASS; build/cap/Gradle e APK assinatura/assets PASS. APK atualizado
na raiz com backup recuperável; não instalado/publicado, nenhuma fonte real mudou.
Falha textual legada14/15 já no HEAD permanece explícita; harness browser corrigido
após timeout, reexecução final válida. Nenhuma certificação HTTP403/Fire60s/beta100.
[Evidência](evidence/C11_EXCLUSIVE_DEVICE_SOURCE_HOME_ACTIVATION.md).

## 2026-10-05 — Preparação da consolidação C11 no Git existente

Pedido de seguir plano de consolidação em xandeflix2/xandeflix-prebuilt, sem
novo backend/banco. Preflight main/ahead2; manifesto108 e backup Git verificado.
Revisão de segurança e regressões locais/build PASS; APK e fonte funcional
preservados, única edição de runtime é EOF vazio. Sete arquivos operacionais
ficam locais. Usuário não conhece integrações automáticas: push retido apesar
de GitHub não apresentar Actions/deployments. Webhooks inacessíveis e histórico
de migrações remoto/local diverge; não sincronizar banco. Checkpoint local não
certifica beta>100 ou Fire<=60s, nem permite apagar a pasta Git comum da worktree.
[Evidência](evidence/C11_GIT_CONSOLIDATION.md); nenhum novo Gate/PR/reset/limpeza.

## 2026-10-05 — Capturas removidas manualmente; preservação integral auditada

Após guia em duas etapas no Explorador, usuário confirmou "feito".16/16 alvos
ausentes em auditoria independente;405/405 consolidados e inventário/hash de
7991 preservados idênticos ao pré-ciclo. Pasta scratch/dois scripts,154 PNGs
forensics/718 tmp/26 recursos Android e dois APKs raiz intactos.21732500bytes
é o tamanho anterior dos alvos, não medição de espaço livre; Lixeira não
inspecionada e recuperação depende de permanecerem nela. Agente não repetiu
exclusão automática nem contornou rejeição histórica. Somente cinco documentos
de manutenção; sem código/build/testes novos/instalação/Git/backend/dispositivos/
ativação/player/novo Gate. Limpeza da allowlist de16 capturas concluída.

## 2026-10-05 — Capturas avulsas autorizadas, exclusão bloqueada antes do início

Spec literal antes de tentar excluir três PNGs raiz+13 scratch,21732500bytes,
sem diretórios.405/405 consolidados iguais; novo inventário preservado7991
arquivos (contexto atual somente dois APKs após consulta de retenção anterior).
Tentativa normal não-recursiva rejeitada por blocked by policy antes de iniciar.
16/16 imagens confirmadas presentes, zero exclusão/espaço liberado; dois scripts
scratch e APK atual intactos. Não contornar; somente docs de manutenção. Nenhum
código/build/Git/backend/dispositivo/novo Gate. Ciclo anterior de caches concluído
não é invalidado; a nova exclusão de capturas permanece pendente.

## 2026-10-05 — Limpeza manual da allowlist concluída, preservados byte-idênticos

Usuário pediu guia manual após bloqueio da exclusão automatizada e confirmou
etapas PowerShell em sequência. Agente não repetiu exclusão via tools. Conferência
independente confirma199 alvos ausentes,405/405 consolidados e8023 preservados
idênticos por inventário/hash,918 PNGs/92 relatórios/18 APKs intactos. ~3,1GB
nos alvos segundo auditoria anterior; espaço livre do volume não medido.
Lock49+9/typecheck PASS pós-limpeza, sem recriar caches/intermediários por build.
Documentação atualizada somente na allowlist; nenhum código/Git/backend/dispositivo/
reset/novo Gate. Manutenção concluída; registro de bloqueio anterior histórico.

## 2026-10-05 — Preparação da limpeza segura; exclusão bloqueada sem executar

Usuário autorizou limpeza passo a passo. Spec/allowlist documentadas antes da
primeira tentativa: somente caches sintéticos/intermediários/cópia APK duplicada.
Preflight/lock49+9 PASS,405/405 consolidados iguais;8023 arquivos preservados
inventariados por fingerprint agregado em RAM. Terminal rejeitou primeira
exclusão antes do início por blocked by policy. Zero arquivos/bytes removidos;
193 caches/cinco alvos nativos/cópia APK confirmados presentes depois. Não
contornar bloqueio; demais etapas não iniciadas. Somente docs de manutenção.
Sem Git/backend/dispositivo/build/novo Gate; limpeza pendente de liberação legítima.

## 2026-10-05 — Detalhes phone recebem altura64px e Back somente ícone à direita

Spec antes do código; duas rotas omitidas do seletor anterior incluídas no Shell,
com CSS max599 para margem automática quando não há Início. Header/páginas de
detalhes/controle de conteúdo/player/ativação/native preservados por401/405 hashes.
Negativo baseline reproduzido;30 novos+250 anteriores=280 checks/zero erros.
Skills browser/React direcionaram navegação real/histórico, a11y e classe derivada
sem efeitos. Lock49+9/guards/build/sync/Gradle PASS, assets/config/package/cert iguais.
APK EE BE/9062069bytes validado e backup0665 recuperável. "sim" autoriza entrega
sem limpeza celular -> Fire -> tablet; primeiro instalado com privados4/catálogo508
iguais/abertura normal. Fire instalado segundo e tablet reconectado por último,
mesmo APKEEBE/abertura Status:ok nos três. Privados4/catálogos436/505 iguais nos
dois últimos, antes de abrir;405/405 hashes finais locais iguais após entrega,
diff --check PASS, sem pendência nos três. Sem Git/backend/Settings/novo Gate/60s.

## 2026-10-05 — APK de quatro ícones entregue celular, Fire e tablet nessa ordem

Nova autoridade explícita documentada antes das instalações; sem rebuild/patch.
APK06655653...CD4A964/mesmo package/cert confirmado nos três, install-r sem reset.
Privados4/catálogos508/436/505 iguais em RAM antes/depois; abertura normal nos três.
Lock49+9 PASS;405/405 arquivos locais byte-idênticos após entrega. Tablet ausente
inicialmente reconectou durante consolidação após solicitação ao usuário e foi
instalado por último, concluindo ordem autorizada. Sem Git/backend/Settings/
rotação/novo Gate/60s; nenhuma pendência de instalação deste artefato nos três.

## 2026-10-05 — Navegação phone reduzida a quatro ícones, Início no topo interno

Spec antes do código: quatro ações mobile32px sem labels visíveis/nomes acessíveis;
Início somente quatro rotas solicitadas no topo ao lado de Back, Home sem ambos.
Tablet/Fire preservados. Status durante ativação compactado sem perder texto
acessível para não sobrepor dois alvos44px em320px; negativo reproduzido antes
desse refinamento. Nenhum hook/estado/IO/histórico/ativação/player/Java alterado.
250 checks/zero erros, lock49+9/guards/typecheck/build/sync/Gradle PASS;
400/405 hashes préviosCE39 iguais. APK06655653...CD4A964/9062043bytes validado,
backupCE39 mantido. Versão gerada, não instalada; consulta de entrega sem resposta.
Skills visual/React direcionaram story real de navegação e a11y sem novos efeitos.
Sem ADB/Git/backend/gestor/Settings/reset/novo Gate.

## 2026-10-05 — Altura da Home phone igualada às três rotas

Pedido adicional executado por uma linha no seletor mobile de64px+safe-area,
sem botão Home. Novo assert rejeitou5C34 antes do patch;209 checks/zero erros,
lock49+9/build/sync/Gradle PASS. CSS/harness/APK são únicas mudanças (402/405
hashes prévios iguais); nenhum TSX/Java/ativação/Live alterado. APK CE39CA71...
AFBCC6C/9062044bytes/package/cert/assets conferidos, backup5C34 mantido.
Celular e Fire receberam install-r sem limpeza, quatro privados/catálogo
preservados e hash/abertura confirmados. Tablet reconectado pelo usuário recebeu
também CE39, quatro privados/505 arquivos idênticos/hash/abertura confirmados.
Artefato final igual nos três, sem Git/backend/Settings/novo Gate.

## 2026-10-05 — Home sem retorno universal e Header mobile refinado entregues

Pedido posterior substituiu manutenção de Back na Home tablet/Fire: guards de
render no Shell suprimem somente controles Home, sem alterar histórico/hardware.
Outro pedido acrescentou64px/safe-area e SVG centralizado nas três rotas phone
Filmes/Séries/Busca, ícone/glifo dos demais layouts preservado. Spec prévia,
negativos Home/altura rejeitaram B3B; final209 checks/zero erros, lock49+9/guards/
build/sync/Gradle PASS. Skills de verificação guiaram gut-check/retorno/centragem,
revisão React preservou callbacks/aria e evitou state/effect/listener novos.
400/405 hashes B3B iguais, Java/config/ativação/Live/catalog byte-idênticos.
APK5C34E11D...7052AFC/9062044bytes assinado/assets conferidos, backupB3B novo.
Celular e Fire atualizados, depois tablet reconectado atualizado; quatro privados/
catálogo preservados em RAM, hash instalado/abertura confirmados nos três.
Sem reset/Git/backend/Settings/novo Gate; homologação física de mídia para usuário.

## 2026-10-05 — Header phone corrigido e entrega in-place concluída nos três

Spec prévia: classe visual só Filmes/Séries/Busca e CSS mobile adicional para
reordenar botão existente à direita, ocultar rótulo visível e manter44px/aria/
callback. Marca não desloca; Home/Live/outros layouts/rotas intactos. Novo
teste35 rejeitou baseline, final202 checks/zero erros; um gutter artificial
no teste tablet corrigido para regra computada existente, sem mudar o produto.
Skills browser/verify/verification guiaram UI/retorno isolados sem API/env/mídia.
Lock49+9/guards/build/sync/Gradle PASS; Java/testes preservados,401/405 hashes
idênticos. APK B3B0D71E...4D3623/9061967bytes/assinatura/assets conferidos,
backup recuperável9FF mantido. Novo IP Fire103 informado pelo usuário; tablet e
Fire atualizados, depois celular reconectado atualizado. Install-r/mesmo package,
quatro privados/catálogos505/436/508 iguais, abertura normal em todos. Nenhum
reset/Git/backend/Settings/novo Gate; mídia/gestos físicos ainda para teste usuário.

## 2026-10-05 — Entrega parcial do APK final aos três aparelhos autorizados

Sem novo código/build: usuário autorizou atualizar celular, tablet e Fire Stick,
celular primeiro, sem limpeza. Spec prévia ampliada antes da instalação. Celular
recebeu APK9FF23801...F9CF80 por install-r; mesmo package/certificado, hash
instalado confirmado, quatro privados/508 arquivos de catálogo preservados em
comparação efêmera. Abriu normalmente e processo/Activity confirmados. Tablet
ausente; Fire ADB recusado10061, nenhum dos dois instalado. Reconexão solicitada.
Lock49+9 PASS,405/405 hashes atuais idênticos; somente documentação de entrega
alterada. Não homologar reprodução/gestos físicos nem afirmar atualização total.

## 2026-10-05 — Seleção Live independente da categoria e Home phone sem Back

Objeto do canal ativo separado da página navegada; categoria/filtro/paginação
não reiniciam player/sessão, erro mantém visibilidade e grupo do ativo correto.
Inicialização automática/seleção explícita/fullscreen/Back guardados por teste
novo43 checks. Resseleção do mesmo grupo deixa página intacta. Pedido adicional
suprime Back visual apenas Home<600, sem mudar histórico; teste novo14 checks
rejeitou baseline e preservou Back de outras rotas/tablet/Fire. React review
orientou referência estável/setState funcional/cleanup e classe visual, sem refactor.
Browser total43+14+26+25+59/zero erros; lock49+9/guards/build/sync/Gradle PASS.
400/405 byte-idênticos, só três produção/harness/APK; Java/config/ativação iguais.
APK9FF23801...F9CF80 gerado/assinado/assets conferidos, backup4B66... mantido.
NÃO instalado, aguardando resposta de atualização; sem reset/Git/backend/Gate/60s.
[Provas e incidentes](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## 2026-10-05 — Entrega in-place primeiro no celular

Autorização posterior refletida no contrato antes de instalar APK4B66D7BF...
FF835A existente. Samsung SM-S926B/RXGYB03FL4W atualizado -r, mesmo package/
assinatura. Identidade/chave/instalação/ativação e508 arquivos do catálogo iguais
imediatamente antes/depois, comparação RAM sem publicar valores privados.
Abertura normal/processo/Activity foreground confirmados;405/405 hashes locais
iguais e lock49+9 PASS. Sem novo patch/build/Git/backend/reset/outro aparelho.
Teste de versão limpa não antecipado; rotação/fullscreen físico segue pendente.
[Entrega e limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## 2026-10-05 — Live mobile permanente, gestos e orientação phone

Pedidos sucessivos especificados antes de cada patch: duas abas/vídeo visível,
limpeza Header/Back; retirar ação nativa, touch no telefone; edge-to-edge e UI
phone portrait/fullscreen landscape. Mesmo preview/C9/ativação, sem outro player.
Geometria passa a observar montagem assíncrona; React review/skills orientaram
prova de ref/session persistentes e cleanup, não refactor. Matriz59/mobile26/
interações25, Java102, lock49+9/guards/build/assets/assinatura PASS.
APK4B66D7BF...FF835A gerado, backup6F1C... mantido. NÃO instalado; confirmação
física pendente/sem autorização nova.393/401 iguais, só recorte permitido;
CSS prefixo recupera hash antigo ao restaurar1CRLF de contexto em RAM.
Sem alterações fonte/ativação/ponte/VOD/backend/Git ou próximo Gate/60s.
[Entrega/autoridade/limites](evidence/C11_LIVE_MOBILE_ALWAYS_VISIBLE_PREVIEW.md).

## 2026-10-04 — Correção nativa mínima das faixas vazadas em fullscreen

Imagem do tablet e código mostraram PlayerView transparente após MATCH_PARENT.
Spec prévia autorizou só preto no enter e transparência no exit; FIT/mesmo
player/Back/gestos/inline/source/ativação preservados. Inversão do patch com
restauração de três EOL do contexto em RAM recupera hash nativo byte-exato.
Guard estático novo e cinco negativos, browser58+24, Java96, lock49+9/guards,
build/assets/assinatura PASS.399/401 baseline iguais, somente nativo/APK.
APK6F1C4F36...54994B instalado -r Fire primeiro/Samsung depois; privados/catálogos
preservados. Skills de verificação exigiram prova visual além de estado DOM:
SurfaceView2560x1440 centralizado em2560x1600, extremos comprovadamente fora
do vídeo têm100% pixels pretos; somente PNGs desses recortes foram gravados.
Geometria inicial transitória deu inconclusivo, único reteste bounded PASS;
nenhuma alteração de produto motivada por tooling/captura. Sem Gate/60s.
[Entrega, incidentes e limites](evidence/C11_LIVE_FULLSCREEN_OPAQUE_BACKDROP.md).

## 2026-10-04 — Gestos Live consolidados e rolagem isolada

Spec antes do código: segundo clique no canal ativo e tap nativo tablet
reutilizam promoção do preview autorizado, sem novo player/session/source.
Lock de comando/stale/cleanup testados. Emenda de scroll limita só Shell Live
em paisagem e isola três áreas: controle negativo reproduziu176px externos,
matriz corrigida PASS. Último pedido remove botão visível/foco/espaço no
modo lateral via CSS, preservando celular/retrato/handlers e mesma superfície.
Skills browser verificaram história/UI; review React conteve patch sem refactor.
58 layout+24 interações, Java96, lock49+9/guards/build/assinatura/assets PASS.
APK finalED324AF7...02B5F09,9062241 bytes, dois backups novos recuperáveis.
Fire primeiro/tablet segundo -r, quatro privados e436/505 arquivos preservados.
Samsung tap/Back/swipe PASS; Fire primeiro timeout com rota alterada, causa
aberta, único reteste instrumentado Enter/click/fullscreen/Back PASS sem patch.
394/401 baseline iguais; Git/backend/reset/next Gate/performance fora do ciclo.
[Entrega e limitações](evidence/C11_LIVE_FULLSCREEN_GESTURES.md).

## 2026-10-04 — Prévia Live conforme referência, preservando três colunas

Emenda anterior ao código definiu refinamento só de apresentação: largura total
16:9, identificação/programação compactas abaixo, badge à direita e mesma ação
nativa visível. Sem inventar EPG ou alterar seleção/fonte/Media3/C9/ativação.
Auditoria recupera exatamente JSX/CSS baseline removendo apenas marcas novas;
397/401 arquivos iguais. Browser 53/zero erros, lock 49+9 e guards/build PASS.
Skills de browser orientaram fluxo isolado e inspeção visual, mais confirmação
DOM física. APK 3B3673C8...A75E07, 8784293 bytes, backup intermediário preservado.
Update -r Fire primeiro/Samsung segundo, quatro privados e 436/505 arquivos
canônicos preservados; base.apk exato. DOM confirma largura/ordem/controle nos
dois, processos 8711/12616 preservados; crops Samsung inspecionados. Fire sem
nova captura devido limite da etapa anterior, forwards limpos. Não homologa
playback real/estabilidade universal ou retoma performance/novo Gate.
[Entrega final e limites](evidence/C11_LIVE_PREVIEW_REFERENCE_LAYOUT.md).

## 2026-10-04 — Controles Live abaixo e refinamento visual posterior

Classes/badge/CSS mantiveram handlers/ref/C9/Media3 intactos, auditoria exata
recupera baseline. Browser 53/zero erros, lock 49+9, C9 10/VOD 12/Live 17 e
build/assinatura/assets PASS. APK 457E21EE...8749802 bytes instalado nos dois
alvos, quatro privados e catálogo 436/505 preservados; DOM físico PASS. Captura
Fire timeout, única repetição DOM-only PASS com mesmo PID; Samsung crops PASS.
397/401 arquivos baseline iguais, demais apenas Live/CSS/teste/APK. Usuário
depois enviou referência visual para somente a coluna de prévia, preservando
categorias/canais/sidebar; documentar nova spec antes do novo refinamento.
[Evidência da etapa](evidence/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md).

## 2026-10-04 — APK do cabeçalho Live instalado no Fire e Samsung

Usuário autorizou instalação/confirmacão e respondeu especificamente sim para
Samsung também. Spec emendada antes da execução: Fire primeiro, tablet segundo,
package/assinatura iguais e install -r sem reset. APK existente 9B12B0C1...
(8780976 bytes) confirmado por SHA-256 público instalado nos dois alvos. Quatro
privados de cada aparelho e 436 arquivos canônicos Fire/505 Samsung preservados
durante instalação; comparações privadas somente em RAM. Lock 49+9 PASS.

MainActivity abriu normalmente. Skill de browser orientou snapshot/ação/DOM e
PNG recortado: cabeçalhos físicos sem badges técnicos, título/contador/Voltar
mantidos, sidebar ícones/categorias presentes, processos estáveis nos probes.
Forwards exclusivos removidos. 401 hashes iguais, sem novo patch/build, outros
alvos, reset/backend/Git ou teste homologado de reprodução/performance 60s.
Supersede não instalado da entrega anterior.
[Evidência](evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md).

## 2026-10-04 — Remoção dos dois badges técnicos de Canais

Pedido explícito atendido removendo só o div informativo de LiveTvPage,
incluindo alternativa MOBILE FLUXO. Spec prévia, hash previsto de remoção exata
confirmado; título/contador/Voltar/tabs/foco e lógica de canais/player intactos.
Skills de browser/verificação orientaram DOM/console/imagens e fronteira local,
sem API/backend. Fixture completa 41 checks/zero erros, lock 49+9 antes e depois
pelo prebuild, tsc/Vite/sync/assemble e assinatura/package/cinco assets PASS.

APK raiz 9B12B0C1... 8780976 bytes; backup recuperável do anterior A806C1B2...
criado sem colidir com histórico. 398/401 baseline byte-idênticos, só produção
Live, teste browser e APK mudaram além dos docs/outputs previstos. Primeiro
browser abriu em branco/timeout sem causa confirmada; único reteste integral
PASS sem patch adicional. Não instalado em aparelhos, não homologado playback
físico, sem reset/backend/Git ou retomada 60s.
[Evidência](evidence/C11_LIVE_HEADER_TECHNICAL_BADGES_REMOVAL.md).

## 2026-10-04 — Tablet Samsung atualizado; detalhes de Clube da Luta estáveis

Após autorização explícita, instalado -r no SM-X610 o APK existente A806C1B2...
(8748328 bytes), sem rebuild/uninstall/reset. Quatro arquivos privados e todos
os 505 arquivos do catálogo preservados byte a byte durante a instalação.
Sidebar física somente ícones/80px à esquerda em paisagem 1365x853 confirmada.

Caso solicitado pela Busca: nome completo e digitação por caractere, um filme
exato, detalhes em ~2s, processo estável por 45s; logs filtrados sem OOM/crash
renderer/rejeição no intervalo. Segunda seleção já em cache, sem iniciar player.
Queixa original NÃO reproduzida, causa NÃO confirmada; riscos de hidratação
concorrente e erros de resolução sem catch continuam apenas diagnóstico.

Lock 49+9 rerodado PASS, 401 hashes de produção/scripts/config/package/APK
inalterados. Mudanças desta rodada documentais e artefatos sanitizados somente.
Skills orientaram snapshot/logs primeiro e fallback CDP observado, sem inferir
causa a partir da troca de versão. Sem patch funcional/backend/Git/outros
aparelhos ou performance 60s. [Evidência](evidence/C11_TABLET_APK_UPDATE_AND_SEARCH_DETAIL_DIAGNOSIS.md).

## 2026-10-04 — Voltar fora da sidebar, superior direito e sem linha acima do título

Refinamento solicitado: controle de histórico no canto superior direito, na
altura do cabeçalho, sem empurrar título. CSS lateral somente; mesmo callback
AppShell, botão Live existente com duas classes visuais. D-pad cima alcança
Voltar, entrada de sidebar preserva conteúdo/categoria. Celular inalterado.

Rodada final browser 39 checks/zero erros e policy/hook PASS; lock 49+9,
profile/live, C9/VOD, build/sync e 90 nativos/12 suites/155 tarefas PASS.
APK A806C1B2... 8748328 bytes instalado -r SOMENTE Fire Stick, mesma assinatura,
quatro privados preservados e hash físico correto. Probe PID 12030: posição/
título sem deslocamento, cima->Back->histórico e Canais direita->categoria,
esquerda->menu->direita PASS; próprio Back Live à direita sem duplicação.
388 baseline intactos; retirar três marcadores visuais Live em memória recupera
hash baseline exato, nenhuma lógica alterada. Sem reset/backend/Git/outros
aparelhos; meta 60s adiada. Etapas antigas permanecem evidência histórica.
[Evidência e limites](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## 2026-10-04 — Regressão Canais: sidebar entra em Categoria no Fire Stick

Usuário constatou foco preso no menu Canais. Negativo reproduzido com LiveTvPage
real no browser e APK anterior no Fire. Root div não era alcançado por fallback
main. Patch D-pad lateral usa app-content e entrada categoria ativa; um único
landmark visual no Live, removível para reproduzir hash baseline exato. Nenhum
hook, player/sessão/C9 ou seleção/paginação Live alterado.

Browser completo 34 checks/zero erros, policy/hook, profile/live, C9 e lock
prebuild PASS; build/sync/Gradle 155 tarefas/90 nativos/assinatura/assets PASS.
APK A3073378... 8747961 bytes instalado -r no Fire, hash físico correto e quatro
arquivos privados intactos. Teclas nativas direita->categoria, esquerda->menu,
direita->retorno PASS, PID 3981 estável. 388 baseline byte-idênticos; nenhuma
alteração fora da allowlist. Supersede APK 187C6BD8... e confiança incompleta
anterior. Sem reset/backend/Git/outros aparelhos, performance 60s segue adiada.
[Evidência corrigida](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## 2026-10-04 — Navegação lateral compacta, ícones e Fire Stick atualizado

Usuário adiou performance e solicitou sidebar em paisagem não-phone, depois
somente ícones e instalação primeiro no Fire Stick. Spec/emendas precederam
mudanças. Shell/Header/CSS/policy visual e D-pad apenas: rail de 80px, callbacks
originais, nomes acessíveis; celulares/retrato mantêm textos/layout anterior.
Esquerda no primeiro card alcança menu sem subir Home, direita retorna ao card.
Ref de foco transitória, cleanup de listeners e DOM estável na rotação.

18 políticas/hook real, browser completo 32 checks/zero erros, lock 49+9 e guards
source/C11/player PASS. Build/sync, Gradle fresh 155 tarefas/90 testes nativos,
package/signer/config/assets PASS. APK final 187C6BD8... 8747852 bytes instalado
-r somente no Fire AFTSSS; quatro arquivos privados intactos antes/depois e
hash APK físico confere. Layout real 960x540, 80px sem overlap/overflow; native
D-pad agregado PASS, mesma categoria/card e PID 29724. Timeout de screenshot
documentado, restante validado sem repetir fluxo completo ou limpar dados.

401 arquivos auditados (baseline 394): 389 inalterados, somente quatro runtime
originais/APK modificados e sete arquivos novos permitidos. Backup 85EB23B5...
preservado. Sem Git/backend/instalação no tablet/celular. Primeira carga <=60s
continua aberta e adiada; não inferir performance pelo am start nem pelo cache.
[Evidência completa](evidence/C11_LANDSCAPE_SIDE_NAVIGATION.md).

## 2026-10-04 — Retenção residual da ponte: catálogo físico completo, meta 60s aberta

Usuário autorizou prosseguir sem reset da nova ativação. Config baseline debug
habilitava logs de payloads; ponte real sintética reteve ~96 MiB com logging e
~4 MiB sem, mantendo 49 roundtrips/erro/diagnósticos de aplicação. Quatro controles
negativos de config PASS. Única alteração runtime: loggingBehavior=none no
capacitor.config.ts; HTTPS/Http/mixed content e toda ativação/player intactos.

Lock 49+9, suites disponíveis de source/C11/player, build/sync e 90 testes Java
PASS; APK 85EB23B5... 8745587 bytes, mesmo package/signer, assets conferidos.
Install -r scoped ao Fire AFTSSS preservou bytes de identidade/chave/ativação.
Baseline aberto antes da atualização caiu de novo em ~96s; relato "fechou
novamente" ocorreu enquanto APK novo ainda compilava. Não era falha do patch novo.

Novo APK concluiu 208 segmentos/223660 episódios/17124 filmes/8911 séries e Home,
busca completa; heap amostrado importação ~16..26 MiB e pós-busca ~7 MiB. Sem OOM
até ~4m49s do time origin. Sync -> promoção 145,684s; Activity -> promoção 154,233s,
Home observada até 158,893s. Meta 60s FAIL; parse/persistência ~124,5s é gargalo
restante. Reabertura com cache não medida: comando stop foi bloqueado pelo
ambiente antes de executar, sem contorno. Sem novo uninstall/limpeza/Git/backend.
Proveniência: somente config/APK mudaram entre 393 hashes, um teste novo.
[Evidência e cautelas](evidence/C11_FIRE_STICK_BRIDGE_RETENTION_FIX.md).

## 2026-10-04 — Teste físico limpo: ativação passou, importação ainda falhou

Usuário autorizou uninstall/reinstall no Fire Stick AFTSSS/API 28. Package único
removido sem -k, ausente verificado, APK 0450304141... instalado/confirmado por
hash. Antes de abrir havia somente cache/code_cache, sem files nem identidade
restaurada. Activity exibida em 6,215s; tela A1 com código/chave prontos e HTTPS.
Usuário ativou no painel gestor; fluxo normal iniciou source/importação.

T8 às 13:15:45.672 UTC-3; download ~11,378s; V8 OOM às 13:17:22.520, GC ainda
~224 MB, SIGTRAP do host às 13:17:27.384. Sync -> OOM 96,847s, -> host 101,711s;
sem promoção/Home/cards, staging parcial ~104 MiB. Relato usuário ~1min30.
Meta <=60s FALHOU neste teste, mesmo excluindo espera humana de ativação.

Latest regression wins: patch sintético não homologou correção física. Nenhum
novo patch/build/retry/reset/backend/Git; nova ativação permanece. Consulta CDP
sanitizada sem segredos, forward próprio removido. performance.memory estático
descartado; próximo retentor individual ainda precisa ser comprovado.
[Relatório completo](evidence/C11_FIRE_STICK_CLEAN_INSTALL_TEST.md).

## 2026-10-04 — Fire Stick: correção local de memória e redução de I/O

Usuário agora solicita <=60s, requisito explícito e não conversão automática de
medição antiga em SLA. Spec/allowlist precederam código. Reader/parsers reais
retinham ~48 MB por 24 títulos sintéticos no caminho dataText; patch materializa
linhas, preservando texto, e reduz retenção para <0,1 MB. Batch 2500 diminui
episodes/streams de 200 para 80 arquivos por 100 mil episódios, catálogo inteiro.

Novo teste inclui negativo real, dataText nativo simulado, sink bounded e hashes/
relações; regressões C11 de 250 mil records, profile/live, ativação e reprodução
PASS. Três comandos legados indisponíveis por arquivos baseline ausentes foram
registrados sem fake PASS. Build web/lock/sync/Gradle PASS; testes nativos
reexecutados 90/90. APK raiz 0450304141F162E0C3C912D416407B40A3B0620F1CB72D458B43C77E6EAC3781,
mesmo package/certificado, cinco assets por hash e HTTPS conferidos; backup
D601864B... recuperável. Audit de 386 arquivos sem alteração inesperada.

Nenhum patch de ativação, backend/Git, reset, Home parcial ou instalação física.
Meta de 60s não comprovada; aguardando marco/atualização in-place e teste físico.
[Evidência completa](evidence/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md).

## 2026-10-04 — Fire Stick Wi-Fi: causa da queda confirmada

Conexão explicitamente autorizada, AFTSSS/API 28. APK instalado por hash é o
anterior 8828F120..., não o aviso novo D601864B... preservado na raiz. Crash
histórico mostrava perda do renderer sem motivo primário retido no buffer.
Usuário reabriu manualmente e confirmou sincronização/fechamento. Nova tentativa
capturou V8 javascript OOM (Reached heap limit), GC ainda com cerca de 225 MB
ocupados, após gravação de episódios/streams 221..229. Renderer morre e app
recebe SIGTRAP por perda de WebView não tratada, cerca de 169s após start.

Classe de causa física confirmada; não é diagnóstico de licença nem erro do
player. Objeto retentor/pico RSS não comprovados. Nenhum patch/build/instalação,
reset, backend ou Git write; somente memória documental. Redução de memória da
importação/tratamento controlado requer escopo funcional aprovado e lock de
ativação preservado. [Relatório causal](evidence/C11_FIRE_STICK_STARTUP_DIAGNOSIS.md).

## 2026-10-04 — Diagnóstico inicial do relato de fechamento no Fire Stick

Usuário relata ativação/Home abaixo de 60s no celular, aproximadamente 90s no
tablet e fechamento após cerca de 150s no Fire Stick, antes de abrir a Home.
Não convertido em benchmark/SLA nem confundido com erro de reprodução terminal.
Preflight C11/origin/main/HEAD corretos; nenhum próximo Gate/Git write autorizado.

ADB lista somente SM-X610. Amostra local datada de 3/outubro contém marcadores
IMPORT_STREAM_PARSE/IMPORT_BATCH_PERSISTED, sem fatal/OOM/perda do renderer e sem
modelo identificado; não prova causa ou ausência de crash neste novo teste.
APK raiz continua D601864B2E79292980869F47B6CBB34440E2E7F63DCE6C3C353A1AD3CD753385;
APK instalado no Fire Stick ainda não foi verificado. Solicitados conexão ADB/IP
e estágio antes de fechar. Código, ativação e APK preservados; somente documentos
atualizados, diagnóstico físico pendente. Scripts preexistentes não executados.

## 2026-10-04 — Correção autorizada do erro silencioso de reprodução

Especificação precedeu o patch: categoria/status HTTP permitidos do Media3
atravessam resume até um aviso português acessível na tela de retorno. APIs
legadas, fallback, finish/idempotência e cleanup C9 preservados. O aviso aparece
antes do cleanup, acompanha rolagem e sai por Fechar aviso/RESOLVING. Nenhuma
mudança de identidade, ativação, boot, storage, licença, URLs ou autoridade.

Lock 49+9, aviso 11, C9 10, VOD 12 e Android 90: PASS; typecheck/build/sync/assemble
PASS. APK raiz recompilado com mesmo package/certificado, backup anterior
verificado. SHA-256 final:
`D601864B2E79292980869F47B6CBB34440E2E7F63DCE6C3C353A1AD3CD753385`.
Sem instalação/Git/backend/novo Gate. Browser visual indisponível; fixture HTTP e
SSR testados, aviso físico pendente. Causa dos 404 históricos/cache não corrigida.
[Proveniência e aceitação local](evidence/C11_PLAYBACK_ERROR_NOTICE_FIX.md).

## 2026-10-04 — Reteste confirmado no celular, sem patch de código

SM-S926B reconectado, mesmo APK e Wi-Fi atual. 9-1-1 T1E1 e Clube da Luta
receberam dados/primeiro frame e READY; filme avançou posição. Referências
privadas correlacionadas ao log, sem URLs/credenciais expostas. Usuário confirmou
ambos reproduzindo no mesmo Wi-Fi e retorno manual após o teste.

Falha não reproduzível agora nos dois aparelhos para esses títulos; causa dos
404 históricos ainda não isolada. Nenhum ajuste de runtime, identidade/ativação,
licença, fonte, APK ou backend foi aplicado pelo agente. Apenas memória documental
atualizada. Defeitos locais de cache/erro silencioso permanecem separados e não
corrigidos. [Evidências e limites](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## 2026-10-04 — Reprodução confirmada de dois títulos no tablet

Usuário esclareceu que vários conteúdos antes funcionavam neste mesmo player.
SM-X610 conectado, com mesmo APK standalone: teste atual de 9-1-1 T1E1 recebeu
dados/primeiro frame e READY; Clube da Luta também, com posição avançando. Ambos
confirmados pelo usuário. Referência do filme corresponde ao fingerprint das
requisições 404 históricas do celular: não assumir endereço permanentemente
inválido nem estender aquele erro a todos os conteúdos/dispositivos.

Causa da falha original continua aberta; necessária reprodução atual no aparelho
afetado com episódio/rede identificados. Logs orientaram contraprova, não patch
especulativo. Apenas memória documental alterada; runtime, ativação, APK e
autoridade preservados, sem Git writes/backend/novo Gate.
[Evidência completa](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## 2026-10-04 — Diagnóstico físico read-only do retorno do player

SM-S926B reconhecido no ADB; hash do APK instalado coincide com o standalone
entregue. Duas falhas do log foram correlacionadas ao stream privado de Clube
da Luta: HTTP 404, code 2004, antes de dados/primeiro frame. Isso substitui a
ausência de evidência física anterior, sem atribuir a falha ao cache pré-player
ou a codec. O motivo do 404 na origem permanece não determinado.

Código confirma finish após erro/candidato esgotado e perda da causa na UI de
retorno. Apenas evidências/documentação atualizadas; runtime, testes, ativação,
licença e APK não alterados. Sem instalação, reset, backend, commit/push/PR ou
novo Gate. [Relatório sanitizado](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## 2026-10-03 — Canonização da ativação e investigação de playback seletivo

Usuário confirmou ativação/carregamento nos novos aparelhos. Registrado como
USER_REPORTED_SUCCESS, sem converter relato em homologação de playback. Lock
canônico incluído em AGENTS/Architecture/Execution e prebuild; 22 casos de
ativação (agora com dois dispositivos isolados) e 27 de promoção passaram, com
9 controles negativos do guard. Build executou lock antes de tsc/Vite e passou.

Runtime de produção e APK preservados. Suites de playback 10/10 e 12 casos
passaram em fixtures. Diagnóstico reproduziu cache stale da lista de segmentos
do hook: lookup pode falhar após cache vazio/troca de geração, sem chamar player.
Não confirma causa física: alguns filmes abrem; Clube da Luta falha. Sem adb
conectado nem mensagem/erro físico, aguardando esse dado antes de corrigir.
Nenhuma mudança no player, sessão comercial, backend ou dados dos aparelhos.

[Contrato](architecture/C11_NEW_DEVICE_ACTIVATION_LOCK.md) ·
[Relatório](evidence/C11_ACTIVATION_LOCK_AND_PLAYBACK_DIAGNOSIS.md).

## 2026-10-03 — Correção dos diretórios de promoção do catálogo

Expansão local explicitamente aprovada pelo usuário após as capturas mostrarem
AUTHORIZED/SOURCE_READY/STORED com PROMOTION_FAILED/Missing parent directory.
Especificação/allowlist escrita antes do código. ensureDir deixou de ser no-op:
mkdir recursivo confirma diretórios existentes com stat e propaga erros reais.
Guarda impede apagar/sobrescrever a geração apontada pelo active.json.
Rename/copy e pipeline bounded-memory preservados, sem alterações de licença,
identidade, UI, backend ou regras de autorização.

27 testes focados e 21 de ativação passaram. Importação sintética 250k passou
(79 checkpoints até T83); suíte histórica passou 11 casos e parou em T12 por
dependência ausente também no HEAD, registrada sem mascarar falha.
Build/sync/assembleDebug passaram. Assets e patch conferidos no APK standalone;
mesmo package/certificado debug permitem atualização sobre o artefato anterior.
Validação física nos dois aparelhos permanece pendente; nenhum dispositivo foi
resetado, desvinculado ou reinstalado. Nenhum commit/push/PR ou novo Gate.

[Especificação](architecture/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md) ·
[Evidências e artefato](evidence/C11_CATALOG_PROMOTION_DIRECTORY_FIX.md).

## 2026-10-03 — Correção da identidade/chave em instalação nova

Patch local autorizado pelo usuário no workspace isolado C11. Identidade,
instalação, token e chave usam geração serializada e persistência verificada.
SHA-256 puro cobre Web Crypto ausente/rejeitado/pendente, sem import Node no
serviço de identidade. A tela exibe código/chave antes de consultas remotas e
permite retry. Boot não autorizado permanece IDLE sem resolver fonte/licença.
Boot e tela compartilham registro A1; status indeterminado não cancela a sessão.
Os arquivos canônicos e WebView foram excluídos de backup/transferência Android,
sem desativar o backup dos demais dados.

21 testes focados e 57 de contrato passaram. Build/sync/assembleDebug passaram;
APK raiz inspecionado e assinatura v1/v2 verificada. Não houve commit, push, PR,
escrita no backend, limpeza de dados ou instalação em aparelho. O E2E físico em
celular novo permanece pendente. Testes legados com fixtures desatualizadas não
foram normalizados fora da allowlist; comparações HEAD/current estão na evidência.

[Especificação](architecture/C11_NEW_DEVICE_ACTIVATION_FIX.md) ·
[Evidência](evidence/C11_NEW_DEVICE_ACTIVATION_FIX.md).

---

## 1. Identidade e Contexto de Evolucao

- **PROJECT**: `XANDEFLIX_PREBUILT`
- **PARENT_CONTEXT**: `MARCO_ZERO_CANONICO_XANDEFLIX_PREBUILT`
- **LAST_CLOSED_GATE**: `G12`
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
- **MVP_PROGRESS_PERCENT**: `100`
- **CURRENT_GATE**: `NONE`
- **NEXT_GATE**: `NONE`
- **NEXT_GATE_STARTED**: `NAO`
- **MVP_ARCHITECTURAL_BASELINE**: `COMPLETE`
- **MVP_STATUS**: `ARCHITECTURAL_MVP_COMPLETE`
- **HISTORICAL_RECORD**: `G5_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G5_ADJUDICATION_CLOSED_PASS=SIM; G6_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G6_ADJUDICATION_CLOSED_PASS=SIM; G7_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G7_ADJUDICATION_CLOSED_PASS=SIM; SEARCH_SCALE_PERFORMANCE_RISK=OPEN_NON_BLOCKING; G8_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G8_ADJUDICATION_CLOSED_PASS=SIM; G9_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G9_ADJUDICATION_CLOSED_PASS=SIM; UPDATE_SCALE_MEMORY_RISK=OPEN_NON_BLOCKING; G10_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G10_ADJUDICATION_CLOSED_PASS=SIM; G11_INITIAL_ATTEMPT=INCONCLUSIVE_REQUIRED_DEVICE_UNAVAILABLE; G11A_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G11A_ADJUDICATION_CLOSED_PASS=SIM; G11B_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G11_ADJUDICATION_CLOSED_PASS=SIM; LAST_CLOSED_GATE=G11; G11_STATUS=PASS; MVP_PROGRESS_PERCENT=98; PHONE_VALIDATION_REMAINING=NAO; G12_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM; G12_ADJUDICATION_CLOSED_PASS=SIM; LAST_CLOSED_GATE=G12; G12_STATUS=PASS; MVP_PROGRESS_PERCENT=100; CURRENT_GATE=NONE; NEXT_GATE=NONE; NEXT_GATE_STARTED=NAO; MVP_ARCHITECTURAL_BASELINE=COMPLETE; MVP_STATUS=ARCHITECTURAL_MVP_COMPLETE`

---

## 2. Estado Arquitetural (ARCHITECTURE_STATE)

- Tese arquitetural estabelecida: Ingestao e pre-processamento externos de catalogo com persistencia, busca e runtime locais no dispositivo cliente.
- Modelo de distribuicao: Universal APK + Provisioning Package versionado.
- Modelo de consumo: Device-Direct Playback.
- Proibicoes ativas: Sem proxies de midia centrais, sem chaves service_role embutidas, sem senhas de fonte em texto puro no cliente.

---

## 3. Decisoes Bloqueadas (DECISIONS_LOCKED)

- `PROJECT_ISOLATED_FROM_XANDEFLIX_2_0`: SIM
- `GITHUB_REPOSITORY`: `xandeflix2/xandeflix-prebuilt`
- `SUPABASE_PROJECT_REF`: `cujbmyhitgomlgwfkaat`
- `ANDROID_PACKAGE_ID`: `com.xandeflix.prebuilt`
- `UNIVERSAL_APK_PLUS_PROVISIONING_PACKAGE`: TARGET
- `EXTERNAL_PREPROCESSING`: TARGET
- `DEVICE_LOCAL_RUNTIME_CATALOG`: TARGET
- `DEVICE_DIRECT_PLAYBACK`: TARGET
- `DATA_CONTRACT_SCHEMA_VERSION`: 1
- `EXTERNAL_PIPELINE_RUNTIME`: NODE_TYPESCRIPT
- `INGESTION_ADAPTER_PATTERN`: REQUIRED
- `INGESTION_ID_STRATEGY`: DETERMINISTIC
- `PROVISIONING_PACKAGE_FORMAT`: ZIP
- `PACKAGE_FORMAT_VERSION`: 1
- `PACKAGE_CONTENTS`: manifest.json + catalog.json
- `CATALOG_HASH_ALGORITHM`: SHA256
- `PACKAGE_CONTENT_HASH_ALGORITHM`: SHA256
- `UNKNOWN_PACKAGE_FILES`: REJECT
- `PACKAGE_VALIDATION`: FAIL_CLOSED
- `LOGICAL_PACKAGE_DETERMINISM`: REQUIRED
- `ZIP_PATH_TRAVERSAL_PROTECTION`: REQUIRED
- `DEVICE_IMPORT_MODEL`: STAGING_THEN_PROMOTION
- `ACTIVE_POINTER`: REQUIRED
- `ACTIVE_GENERATION_SAFETY`: REQUIRED
- `FAILED_IMPORT_PRESERVES_ACTIVE`: REQUIRED
- `STAGING_READBACK_VALIDATION`: REQUIRED
- `SAME_PACKAGE_REIMPORT`: IDEMPOTENT
- `NO_FALSE_EMPTY`: REQUIRED
- `APP_PRIVATE_STORAGE`: REQUIRED
- `LOCAL_STORAGE_STRATEGY`: CAPACITOR_FILESYSTEM_CANONICAL_JSON
- `CATALOG_UI_DATA_SOURCE`: ACTIVE_LOCAL_CATALOG_ONLY
- `CATALOG_UI_NETWORK`: NONE
- `NO_FALSE_EMPTY_UI`: REQUIRED
- `CATALOG_READ_MODEL`: EPHEMERAL_VIEW_MODEL
- `UNBOUNDED_DOM_RENDER`: PROHIBITED
- `TV_INPUT_BASELINE`: DOM_FOCUS_DPAD
- `INPUT_MODES`: TOUCH_MOUSE_KEYBOARD_DPAD_BASELINE
- `PACKAGE_FORMAT_V1`: PRESERVED
- `PACKAGE_FORMAT_V2`: SEARCH_ENABLED
- `SEARCH_INDEX_FORMAT`: CANONICAL_JSON_INVERTED_INDEX_V1
- `SEARCH_INDEX_VERSION`: 1
- `SEARCH_NORMALIZATION_VERSION`: 1
- `SEARCH_INDEX_BUILD`: EXTERNAL_PREBUILT
- `SEARCH_STORAGE`: CAPACITOR_FILESYSTEM_CANONICAL_JSON
- `SEARCH_INDEX_TRANSPORTABILITY`: PROVEN_SYNTHETIC_LOGICAL
- `SEARCH_SEED_STRATEGY`: PREBUILT_INDEX_REQUIRED_FOR_FAST_SEARCH
- `SEARCH_INDEX_DEVICE_STARTUP_REBUILD`: PROHIBITED
- `SEARCH_QUERY_NETWORK`: NONE
- `SEARCH_RANKING`: DETERMINISTIC_WEIGHTED_TEXT_V1
- `SEARCH_DOCUMENT_KINDS`: MOVIE_SERIES
- `SEARCH_INDEX_DATA_MINIMIZATION`: REQUIRED
- `SEARCH_ENABLED_PACKAGE_FORMAT_VERSION`: 2
- `PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE`: REQUIRED
- `PLAYBACK_CONNECTION`: DEVICE_TO_SOURCE_DIRECT
- `CENTRAL_STREAM_PROXY`: PROHIBITED
- `CENTRAL_VIDEO_RELAY`: PROHIBITED
- `CENTRAL_IPTV_STREAMING_BACKEND`: PROHIBITED
- `PLAYBACK_ENGINE_ANDROID`: MEDIA3_EXOPLAYER
- `PLAYBACK_PROTOCOLS_BASELINE`: HLS_PROGRESSIVE
- `STREAM_REF_CREDENTIAL_POLICY`: CREDENTIAL_FREE
- `SOURCE_AUTH_BOUNDARY`: RUNTIME_ONLY_NO_CATALOG_SECRET
- `RESOLVED_PLAYBACK_REQUEST_PERSISTENCE`: NONE
- `PLAYBACK_QUERY_NETWORK_PATH`: DEVICE_TO_SOURCE_ONLY
- `PLAYBACK_URI_ALLOWLIST`: HTTPS_BASELINE
- `PLAYBACK_HEADERS_LOGGING`: PROHIBITED
- `NATIVE_PLAYER_ACTIVITY_EXPORTED`: NAO
- `NATIVE_PLAYER_DPAD_BASELINE`: MEDIA3_STANDARD_CONTROLS
- `STREAM_RESOLVER_MEDIA_BYTES_HANDLED`: 0

---

## 4. Decisoes Abertas (DECISIONS_OPEN)

1. `REAL_SOURCE_AUTH_STRATEGY`: Arquitetura final de autenticação com provedores de origem em produção.
2. `USER_SOURCE_BINDING`: Modelo de associação entre credenciais de usuário e provisionamento personalizado de pacotes.
3. `PACKAGE_SIGNING_STRATEGY`: Protocolo criptográfico para assinatura e verificação de integridade/autoria do pacote.
4. `PACKAGE_ENCRYPTION`: Algoritmo e chaveamento de criptografia em repouso e trânsito para pacotes de provisionamento.
5. `PLAYER_SECURE_FLAG_POLICY`: Política de bloqueio de captura de tela e recents via FLAG_SECURE (aberto para G10).
6. `PERSISTENT_PLAYBACK_PROGRESS`: Mecanismo e modelo de dados para persistência contínua de histórico de reprodução e resume.
7. `ARTWORK_CACHE_POLICY`: Política de download, resolução, compressão e expiração de posters e imagens de catálogo.
8. `FULL_TV_SPATIAL_NAVIGATION`: Navegação espacial avançada bidimensional com aceleração de cursor ou mesh de nós (G11).
9. `PERFORMANCE_SLA`: Metas contratuais de tempo de abertura e resposta homologadas em hardware físico (G11/G12).
10. `INCREMENTAL_UPDATE_STRATEGY`: Algoritmo para geração e aplicação de deltas/diffs de catálogo sem re-download completo (G9).
11. `ROLLBACK_FULL`: Política avançada de retenção de múltiplos snapshots históricos e reversão manual de versão.
12. `SNAPSHOT_RETENTION`: Política de limpeza e expiração de snapshots antigos acumulados no armazenamento privado.
13. `SIZE_LIMITS`: Limites contratuais de tamanho para pacotes e footprint de memória em hardware de entrada.

---

## 5. Bloqueios Conhecidos (KNOWN_BLOCKERS)

- Nenhum bloqueador ativo que impeca a conclusao do Gate G0.
- Observacao externa nao-bloqueadora: Visibilidade do novo projeto Supabase em conectores de terceiros (ChatGPT connector) pendente de propagacao.

---

## 6. Riscos Mapeados (RISKS)

1. Incompatibilidade na portabilidade de indices pre-construidos para motores Web/Android locais.
2. Latencia excessiva na geracao de pacotes de provisionamento para catalogos acima de 100.000 itens.
3. Consumo de armazenamento no dispositivo cliente com cache de posters/artworks.

---

## 7. Status de Seguranca (SECURITY_STATUS)

- `.gitignore` configurado estritamente.
- `.env.example` livre de segredos reais.
- Nenhuma chave `service_role`, credencial de fonte ou chave privada presente no repositorio.

---

## 8. Validacao em Dispositivos (DEVICE_VALIDATION_STATUS)

- `NOT_REQUIRED_G5` (logica de bootstrap, persistencia local transacional e compilacao nativa Android validadas; validacao fisica ampla permanece reservada ao G11).

---

## 9. Linhas de Base (BASELINES)

- **PERFORMANCE_BASELINES**: Evidencias empiricas registradas no G5 (PACKAGE_VALIDATE_MS=17ms, STAGING_WRITE_MS=0ms, STAGING_READBACK_VALIDATE_MS=1ms, PROMOTION_MS=3ms, TOTAL_BOOTSTRAP_MS=21ms; PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM).
- **STORAGE_BASELINES**: Evidencias empiricas no G5 (PACKAGE_SIZE_BYTES=2045, CATALOG_SIZE_BYTES=8368, ACTIVE_STORAGE_SIZE_BYTES=6718).

---

## 10. Proximo Gate (NEXT_GATE)

- **NEXT_GATE**: `XANDEFLIX_PREBUILT_G6_CATALOG_UI`
- **NEXT_GATE_STARTED**: `NAO`

---

## 11. Historico de Alteracoes (CHANGELOG)

- **Ciclo G0 (Execucao Tecnica)**:
  - Preflight read-only executado e documentado;
  - Isolamento confirmado contra `timbocorrea/xandeflix-2.0`;
  - Criacao da baseline documental em `/docs` e raiz (`AGENTS.md`, `README.md`, `.gitignore`, `.env.example`);
  - Registro formal de identidade Git, Supabase e Android Package ID;
  - Auditoria de segredos executada com sucesso;
  - Registro historico: G0_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM.

- **Adjudicacao G0 e Canonicalizacao (2026-09-04)**:
  - G0 formalmente adjudicado pelo Chat Mestre como PASS;
  - Fundacao e isolamento aprovados;
  - MVP_PROGRESS_PERCENT atualizado de 0 para 5;
  - CURRENT_GATE avancado para G1 (NEXT_AUTHORIZABLE_GATE=G1);
  - G1 permanece NOT_STARTED (G1_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para primeiro commit e push canonicos na branch origin/main.

- **Ciclo G1 (App Skeleton)**:
  - App universal inicializado em React + TypeScript + Vite + Capacitor;
  - Configuracao estrita de TypeScript (`typecheck` PASS);
  - Build web executado com sucesso (`build` PASS);
  - Prova de inicializacao do runtime web executada (`HTTP 200 OK`);
  - Projeto nativo Android gerado via Capacitor (`com.xandeflix.prebuilt`);
  - Isolamento de package Android confirmado contra `com.xandeflix.app`;
  - Compilacao Android concluida com sucesso (`assembleDebug` PASS);
  - APK debug gerado (`app-debug.apk`, 4.107.263 bytes);
  - Auditoria de segredos e dependencias minimas confirmada;
  - Registro historico: G1_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G1 e Canonicalizacao (2026-09-04)**:
  - G1 formalmente adjudicado pelo Chat Mestre como PASS;
  - Skeleton do aplicativo universal aprovado;
  - MVP_PROGRESS_PERCENT atualizado de 5 para 12;
  - CURRENT_GATE avancado para G2 (NEXT_AUTHORIZABLE_GATE=G2);
  - G2 permanece NOT_STARTED (G2_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G2 (Prebuilt Data Contract)**:
  - Definicao formal do contrato canonico humano em `docs/DATA_CONTRACT.md`;
  - Definicao formal do contrato machine-readable em `schemas/prebuilt-catalog.schema.json` (Draft 2020-12);
  - Tipos TypeScript estritos sem semantica concorrente em `src/contracts/catalog.ts`;
  - Criacao de fixture sintetica com dados artificiais seguros em `fixtures/prebuilt-catalog.synthetic.json`;
  - Script de validacao automatizado em `scripts/validate-data-contract.mjs` (`npm run contract:check`);
  - Implementacao e aprovacao de 7 testes negativos de contrato em memoria;
  - Higiene estrita do scaffold Android: remocao de residuos `com.getcapacitor.myapp` / `com.getcapacitor.app` nos testes para `com.xandeflix.prebuilt`;
  - Revalidacao completa de typecheck, build web e compilacao nativa Android (`assembleDebug`);
  - Auditoria de segredos e isolamento confirmada (sem credenciais reais, sem service_role, sem conexao Supabase);
  - Registro historico: G2_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G2 e Canonicalizacao (2026-09-04)**:
  - G2 formalmente adjudicado pelo Chat Mestre como PASS;
  - Contrato de dados canonico do catalogo PREBUILT aprovado (JSON Schema Draft 2020-12, TypeScript e documentacao);
  - MVP_PROGRESS_PERCENT atualizado de 12 para 22;
  - CURRENT_GATE avancado para G3 (NEXT_AUTHORIZABLE_GATE=G3);
  - G3 permanece NOT_STARTED (G3_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G3 (External Ingestion Pipeline)**:
  - Implementacao da arquitetura desacoplada de pipeline externo com interface `SourceAdapter`;
  - Implementacao do `SyntheticSourceAdapter` validando e consumindo fixtures sinteticas controladas;
  - Criacao do modelo intermediario bruto isolado (`RawSourceCatalog`, `RawMovie`, `RawSeries`, `RawSeason`, `RawEpisode`);
  - Motor de normalizacao deterministica (`INGESTION_ID_STRATEGY=DETERMINISTIC`) com IDs estaveis (`syn:movie:*`, `syn:series:*`, etc.);
  - Normalizacao segura de categorias e generos com deduplicacao por slug e mapeamento relacional;
  - Tratamento estrito de referencias de streaming e artwork (`STREAM_CREDENTIAL_EMBEDDING=PROHIBITED`);
  - Calculo automatico e exato de contagens declaradas (`SnapshotCounts`) e geracao deterministica de `snapshotId` via SHA-256;
  - Validacao pos-normalizacao automatica contra JSON Schema canonico Draft 2020-12 e integridade referencial;
  - Prova de determinismo via replay identico (`PIPELINE_DETERMINISTIC=SIM`);
  - Criacao de scripts `npm run ingestion:synthetic` e `npm run ingestion:negative` com 8 testes negativos fail-closed aprovados;
  - Elaboracao da documentacao tecnica completa em `docs/INGESTION_PIPELINE.md` e formalizacao dos fluxos funcionais no `docs/FSD.md`;
  - Registro de decisoes arquiteturais fechadas em `docs/DECISIONS.md`;
  - Revalidacoes tecnicas de regressao (contract:check, typecheck, build web, android unit tests e assembleDebug) concluidas com PASS;
  - Registro historico: G3_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G3 e Canonicalizacao (2026-09-04)**:
  - G3 formalmente adjudicado pelo Chat Mestre como PASS;
  - Pipeline externo de ingestao e normalizacao aprovado com motor deterministico e fixtures sinteticas;
  - Observacao de processo nao-bloqueadora registrada em docs/ERRORS_AND_BLOCKERS.md (emissao de mensagem intermediaria informativa antes do relatorio terminal sob QUIET_UNTIL_FINAL_REPORT, com G3_PASS_INVALIDATED=NAO);
  - MVP_PROGRESS_PERCENT atualizado de 22 para 34;
  - CURRENT_GATE avancado para G4 (NEXT_AUTHORIZABLE_GATE=G4);
  - G4 permanece NOT_STARTED (G4_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G4 (Provisioning Package)**:
  - Implementacao do formato de pacote inicial canônico em ZIP (`PROVISIONING_PACKAGE_FORMAT=ZIP`);
  - Definicao de `PACKAGE_FORMAT_VERSION=1` e `SCHEMA_VERSION=1`;
  - Estrutura interna minima estrita contendo exclusivamente `manifest.json` e `catalog.json`;
  - Implementacao do calculo de integridade SHA-256 via `node:crypto` (`catalogSha256` e `packageContentHash`);
  - Determinismo estrito comprovado via replay (`LOGICAL_PACKAGE_DETERMINISTIC=SIM`, `BYTE_IDENTICAL_ZIP=SIM`);
  - Implementacao de construtor de pacote com fail-closed (`PackageBuilder`);
  - Implementacao de validador completo (`PackageValidator`) com protecao contra path traversal (`ZIP_PATH_TRAVERSAL_PROTECTION=PASS`);
  - Politica de rejeicao de arquivos desconhecidos (`UNKNOWN_PACKAGE_FILES=REJECT`);
  - Adicao de scripts CLI `npm run provisioning:build` e `npm run provisioning:check`;
  - Aprovacao da suite completa de 11 testes negativos obrigatorios (adulteracao, hash mismatch, size mismatch, versao incompativel, divergencia de snapshot, arquivo extra, ausencia de manifest/catalog e path traversal);
  - Elaboracao da documentacao tecnica completa em `docs/PROVISIONING_PACKAGE.md`;
  - Formalizacao de 5 fluxos funcionais em `docs/FSD.md` (`F-G4-001` a `F-G4-005`);
  - Registro de decisoes arquiteturais fechadas em `docs/DECISIONS.md`;
  - Auditoria de segredos e isolamento confirmada (sem chaves privadas, sem tokens de longa duracao, sem conexao Supabase, sem importacao no dispositivo cliente);
  - Revalidacoes tecnicas completas com PASS (contract:check, ingestion:synthetic, ingestion:negative, provisioning:build, provisioning:check, typecheck, build web, android unit tests e assembleDebug);
  - Registro historico: G4_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G4 e Canonicalizacao (2026-09-05)**:
  - G4 formalmente adjudicado pelo Chat Mestre como PASS;
  - Artefato de provisionamento ZIP aprovado (versionado, determinístico, imutável e verificável);
  - Observação de processo não-bloqueadora registrada em docs/ERRORS_AND_BLOCKERS.md (emissão de mensagem intermediária informativa sobre teste Gradle durante QUIET_UNTIL_FINAL_REPORT, com G4_PASS_INVALIDATED=NAO);
  - MVP_PROGRESS_PERCENT atualizado de 34 para 44;
  - CURRENT_GATE avançado para G5 (NEXT_AUTHORIZABLE_GATE=G5);
  - G5 permanece NOT_STARTED (G5_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G5 (Fast Device Bootstrap)**:
  - Implementacao da arquitetura transacional de bootstrap local e persistencia do catalogo PREBUILT no cliente;
  - Adicao minima da dependencia oficial `@capacitor/filesystem` (^7.1.8) e sincronizacao Android (`npx cap sync android`);
  - Estruturacao dos modulos de bootstrap em `src/bootstrap/`: tipos canonicos (`types.ts`), abstracao de storage (`storage/storage.interface.ts`), adaptador Capacitor (`storage/capacitor-filesystem.storage.ts`), adaptador in-memory para testes/CLI (`storage/in-memory.storage.ts`), gerenciador de ponteiro ativo (`active-snapshot.ts`), importador transacional (`package-importer.ts`), gerenciador de estado (`bootstrap-state.ts`) e servico unificado (`bootstrap.service.ts`);
  - Implementacao de garantia de fail-closed e isolamento: `ACTIVE_GENERATION_SAFETY=REQUIRED`, `NO_FALSE_EMPTY=REQUIRED`, `FAIL_CLOSED_IMPORT=REQUIRED`, `FAILED_IMPORT_PRESERVES_ACTIVE=SIM`, `STAGING_READBACK_VALIDATION=REQUIRED`, `SAME_PACKAGE_REIMPORT=IDEMPOTENT`;
  - Criacao do script de verificacao automatizado `scripts/validate-device-bootstrap.mjs` (`npm run bootstrap:check`);
  - Validacao dos 8 cenarios funcionais e negativos (primeira importacao com sucesso, reimportacao idempotente, promocao de nova geracao, rejeicao de pacote adulterado, preservacao do ativo anterior em falha, rejeicao de staging parcial, preservacao do ativo em falha de gravacao de ponteiro, e estado `NO_ACTIVE_CATALOG` sem falso vazio);
  - Elaboracao da documentacao tecnica completa em `docs/DEVICE_BOOTSTRAP.md`;
  - Formalizacao de 6 fluxos funcionais em `docs/FSD.md` (`F-G5-001` a `F-G5-006`);
  - Registro de decisoes arquiteturais fechadas em `docs/DECISIONS.md`;
  - Auditoria de segredos e isolamento confirmada (sem credenciais reais, sem service_role, sem conexao Supabase, sem UI de catalogo, sem busca, sem player, sem atualizacao incremental);
  - Revalidacoes tecnicas completas com PASS (contract:check, ingestion:synthetic, ingestion:negative, provisioning:build, provisioning:check, bootstrap:check, typecheck, build web, android unit tests e assembleDebug);
  - Registro historico: G5_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G5 e Canonicalizacao (2026-09-05)**:
  - G5 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G5_FAST_DEVICE_BOOTSTRAP_CLOSED`);
  - Bootstrap rapido de dispositivo aprovado (importacao transacional, staging em quarentena, readback validation, promocao atomica via active.json e protecao contra falso vazio);
  - MVP_PROGRESS_PERCENT atualizado de 44 para 56;
  - CURRENT_GATE avancado para G6 (NEXT_AUTHORIZABLE_GATE=G6);
  - G6 permanece NOT_STARTED (G6_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorizacao expressa concedida para commit e push canonicos na branch origin/main.

- **Ciclo G6 (Catalog UI)**:
  - Implementação da primeira interface funcional de catálogo do Xandeflix Prebuilt consumindo EXCLUSIVAMENTE o catálogo local ativo estabelecido no G5 (`CATALOG_UI_DATA_SOURCE=ACTIVE_LOCAL_CATALOG_ONLY`, `CATALOG_NETWORK_REQUESTS=0`);
  - Auditoria de reuso read-only executada e registrada em `docs/UI_REUSE_ASSESSMENT.md` (`CODE_REUSE_PERFORMED=NAO`, `PROTECTED_REPOSITORY_WRITES=0`);
  - Camada de Read Model/View Model determinística em memória (`src/catalog/catalog-read-model.ts`, `src/catalog/catalog-view-model.ts`, `src/catalog/catalog-selectors.ts`) com índices efêmeros O(1);
  - Gating visual estrito de bootstrap: `NO_ACTIVE_CATALOG_UI=PASS`, `VALID_EMPTY_CATALOG_UI=PASS`, `NO_ACTIVE_NOT_FALSE_EMPTY=PASS`, `FAILED_IMPORT_ACTIVE_UI_CONTINUES=PASS`;
  - Páginas e componentes de catálogo implementados: Home com Hero e MediaRails temáticos, MoviesPage com filtros por categoria e CatalogGrid em lotes, SeriesPage com listagem de séries, MovieDetailPage com metadados e botão de playback desabilitado (`PLAYBACK_AVAILABLE_IN_G8`), SeriesDetailPage com seleção de temporadas e listagem de episódios;
  - Fallback visual resiliente para imagens e metadados ausentes (`Artwork.tsx`, `MISSING_ARTWORK_FALLBACK=PASS`, `MISSING_OPTIONAL_METADATA_SAFE=PASS`);
  - Limites estritos de renderização no DOM (`UNBOUNDED_DOM_RENDER_GUARD=PASS`, `HOME_RAIL_MAX_ITEMS_INITIAL=24`, `GRID_BATCH_SIZE=48`);
  - Baseline de navegação direcional por D-pad / teclado para Android TV e Fire TV Stick (`FIRST_FOCUS_ACQUIRED=PASS`, `ARROW_NAVIGATION=PASS`, `ENTER_OPENS_DETAIL=PASS`, `BACK_RETURNS_PREVIOUS_VIEW=PASS`, `FOCUS_VISIBLE=PASS`);
  - Compatibilidade com toque, mouse e teclado mantida (`INPUT_MODES=TOUCH_MOUSE_KEYBOARD_DPAD_BASELINE`);
  - Design system cinematográfico responsivo para Phone, Tablet e TV/Desktop em `src/index.css`;
  - Suíte de validação de catálogo automatizada em `scripts/validate-catalog-ui.mjs` (`npm run catalog-ui:check`, 15 testes aprovados);
  - Elaboração da documentação técnica canônica em `docs/CATALOG_UI.md`;
  - Formalização de 9 especificações funcionais em `docs/FSD.md` (`F-G6-001` a `F-G6-009`);
  - Registro de decisões arquiteturais fechadas em `docs/DECISIONS.md`;
  - Bateria completa de regressões executada com sucesso: `contract:check` PASS, `ingestion:synthetic` PASS, `ingestion:negative` PASS, `provisioning:build` PASS, `provisioning:check` PASS, `bootstrap:check` PASS, `catalog-ui:check` PASS, `typecheck` PASS, `build` PASS, `cap sync android` PASS, `gradlew test` PASS, `gradlew assembleDebug` PASS;
  - Auditoria de segredos e isolamento confirmada (sem credenciais reais, sem service_role, sem chamadas externas, sem busca, sem player, sem atualização incremental);
  - Registro histórico: G6_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G6 e Canonicalizacao (2026-09-05)**:
  - G6 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G6_CATALOG_UI_CLOSED`);
  - Auditoria complementar de escopo aprovada (`PASS_PREBUILT_G6_SCOPE_AUDIT_CLEAR_FOR_MASTER_ADJUDICATION`);
  - Adaptações de compatibilidade em `src/ingestion/validate.ts` e `src/provisioning/integrity.ts` ratificadas como `G6_REQUIRED_COMPATIBILITY_ADAPTATION`, com preservação estrita da semântica G2/G3/G4 e fail-closed;
  - Documentação de reuso em `docs/UI_REUSE_ASSESSMENT.md` atualizada para esclarecer `NEWLY_IMPLEMENTED_COMPONENTS` e `REBUILT_COMPONENTS=NENHUM`;
  - MVP_PROGRESS_PERCENT atualizado de 56 para 64;
  - CURRENT_GATE avançado para G7 (NEXT_AUTHORIZABLE_GATE=G7);
  - G7 permanece NOT_STARTED (G7_STARTED=NAO, NEXT_GATE_STARTED=NAO);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G7 (Prebuilt Search)**:
  - Comprovação da hipótese arquitetural de busca prebuilt (`SEARCH_INDEX_EXTERNAL_BUILD=REQUIRED`, `SEARCH_INDEX_DEVICE_STARTUP_REBUILD=PROHIBITED`, `SEARCH_QUERY_NETWORK=NONE`);
  - Implementação do formato de índice canônico independente em JSON (`CANONICAL_JSON_INVERTED_INDEX_V1`) com JSON Schema Draft 2020-12 (`schemas/prebuilt-search-index.schema.json`);
  - Criação dos módulos de normalização de texto determinística (`search-normalization.ts`, Unicode NFD, diacríticos removidos, lowercase, trim), builder externo (`search-index-builder.ts`), validador estrito fail-closed (`search-index-validator.ts`), motor de consulta em memória (`search-engine.ts`) com ranqueamento ponderado determinístico (`DETERMINISTIC_WEIGHTED_TEXT_V1`) e serviço de busca integrado ao storage do cliente (`search.service.ts`);
  - Extensão do formato de pacote de provisionamento para v2 (`SEARCH_ENABLED_PACKAGE_FORMAT_VERSION=2`) incorporando `search-index.json`, manifest estendido e hash lógico de pacote v2;
  - Garantia rigorosa de retrocompatibilidade com pacotes v1 (`PACKAGE_FORMAT_V1_BACKWARD_COMPATIBLE=PASS`, importação v1 preserva integridade do catálogo e reporta busca como indisponível sem falhas);
  - Bootstrap v2 com importação transacional em quarentena de staging, readback validation e promoção atômica para storage privado (`prebuilt/snapshots/<snapshotId>/search-index.json`);
  - Inicialização leve da busca no startup (`ON_DEVICE_FULL_REINDEX_AT_STARTUP=NAO`) carregando apenas postings serializadas;
  - Falha de índice não quebra o catálogo ativo (`INVALID_SEARCH_INDEX_PRESERVES_CATALOG=PASS`);
  - Interface de busca responsiva integrada à UI (`/search`, `SearchPage.tsx`, `SearchInput.tsx`, `SearchResults.tsx`, `SearchState.tsx`) com navegação por D-pad / teclado para TV/Android (`SEARCH_DPAD_BASELINE=PASS`) e abertura direta dos detalhes de filmes e séries (`MovieDetailPage`, `SeriesDetailPage`);
  - Execução de benchmark sintético em 240.000 documentos (`SCALE_DOCUMENT_COUNT=240000`, build externo em 12.2s, 50.2MB serializado / 6.5MB gzip, carregamento em runtime em 771ms, consultas em 1.2s - 2.8s, heap controlado com 271MB);
  - Elaboração da documentação técnica em `docs/PREBUILT_SEARCH.md` e formalização de 10 fluxos no FSD (`F-G7-001` a `F-G7-010`);
  - Bateria de testes de regressão executada com 100% de aprovação (G2, G3, G4, G5, G6, G7, typecheck, web build e android build);
  - Auditoria de segredos e isolamento confirmada (zero credenciais reais, sem service_role, sem conexões externas, sem playback G8, sem atualizações incrementais);
  - Registro histórico: G7_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION.

- **Adjudicacao G7 e Canonicalizacao (2026-09-05)**:
  - G7 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G7_PREBUILT_SEARCH_CLOSED`);
  - Busca pré-construída externa comprovada (`CANONICAL_JSON_INVERTED_INDEX_V1`), pacote de provisionamento v2 com retrocompatibilidade v1, carregamento leve sem reconstrução no startup e interface D-pad funcional;
  - Registro de risco de escala sintética não-bloqueador classificado: `SEARCH_SCALE_PERFORMANCE_RISK=OPEN_NON_BLOCKING` (`PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`, `REAL_CATALOG_SEARCH_PROVEN=NAO`, `FIRE_STICK_SEARCH_PERFORMANCE_PROVEN=NAO`, `G7_PASS_INVALIDATED=NAO`);
  - MVP_PROGRESS_PERCENT atualizado de 64 para 74;
  - CURRENT_GATE avançado para G8 (`NEXT_AUTHORIZABLE_GATE=G8`);
  - G8 permanece NOT_STARTED (`G8_STARTED=NAO`, `NEXT_GATE_STARTED=NAO`);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G8 (Source and Direct Playback)**:
  - Implementação da fronteira canônica de reprodução direta Device-to-Source (`PLAYBACK_CONNECTION=DEVICE_TO_SOURCE_DIRECT`, `CENTRAL_STREAM_PROXY=PROHIBITED`, `CENTRAL_VIDEO_RELAY=PROHIBITED`, `STREAM_RESOLVER_MEDIA_BYTES_HANDLED=0`);
  - Desacoplamento estrito entre metadados de catálogo e credenciais de acesso: `StreamRef` preservado rigorosamente sem senhas, tokens ou URLs completas (`STREAM_REF_CREDENTIAL_FREE=PASS`);
  - Criação do modelo em memória `RuntimeSourceContext` e validador de sessão/expiração (`SOURCE_RUNTIME_BOUNDARY=PASS`);
  - Desenvolvimento do `DirectStreamResolver` transformando logicamente referências de stream em requisições transitórias (`ResolvedPlaybackRequest`) sem persistência (`RESOLVED_PLAYBACK_REQUEST_PERSISTENCE=NONE`);
  - Integração nativa com `AndroidX Media3 ExoPlayer` (`media3-exoplayer:1.5.1`, `media3-exoplayer-hls:1.5.1`, `media3-ui:1.5.1`) via `NativePlayerActivity` (`android:exported="false"`, `PLAYER_RELEASE_ON_DESTROY=PASS`, `PLAYER_SINGLE_INSTANCE_PER_ACTIVITY=SIM`);
  - Desenvolvimento do plugin Capacitor `NativePlayerPlugin` e cliente TypeScript `NativePlayerClient` com fallback controlado para navegador web (`WEB_NATIVE_PLAYER_UNAVAILABLE=PASS`);
  - Validação estrita de segurança de URIs: `PLAYBACK_URI_ALLOWLIST=HTTPS_BASELINE`, rejeição de esquemas proibidos (`file:`, `content:`, `javascript:`, etc.) e rejeição de userinfo credentials (`URL_USERINFO_CREDENTIALS_REJECTED=PASS`);
  - Política de privacidade e logs: `PLAYBACK_HEADERS_LOGGING=PROHIBITED`, sanitização de query parameters em logs;
  - Ativação das ações de reprodução direta na interface (`MovieDetailPage` e `SeriesDetailPage`) para filmes e episódios com exibição de estados sanitizados;
  - Testes unitários Android implementados (`PlaybackIntentContractTest` e `AndroidManifestAuditTest`) com aprovação em `gradlew test` e build bem-sucedido em `gradlew assembleDebug`;
  - Elaboração da documentação arquitetural em `docs/DIRECT_PLAYBACK.md` e formalização de 10 fluxos no FSD (`F-G8-001` a `F-G8-010`);
  - Criação da suíte de validação `scripts/validate-direct-playback.mjs` (`npm run playback:check`) com 100% de aprovação;
  - Preservação integral das regressões de todos os Gates anteriores (G2, G3, G4, G5, G6, G7);
  - Auditoria de segredos e escopo: zero credenciais reais, sem service_role, sem proxy central, sem G9;
  - Registro histórico: `G8_STATUS=COMPLETE_PENDING_MASTER_ADJUDICATION`, `MVP_PROGRESS_PERCENT=74`.

- **Adjudicacao G8 e Canonicalizacao (2026-09-05)**:
  - G8 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G8_SOURCE_AND_DIRECT_PLAYBACK_CLOSED`);
  - Fronteira canônica de reprodução direta Device-to-Source aprovada (`PLAYBACK_CONNECTION=DEVICE_TO_SOURCE_DIRECT`, `CENTRAL_STREAM_PROXY=PROHIBITED`, `CENTRAL_VIDEO_RELAY=PROHIBITED`, `CENTRAL_IPTV_STREAMING_BACKEND=PROHIBITED`, `STREAM_RESOLVER_MEDIA_BYTES_HANDLED=0`);
  - `StreamRef` livre de credenciais e segredos (`STREAM_REF_CREDENTIAL_FREE=PASS`), runtime source context efêmero em memória (`SOURCE_RUNTIME_BOUNDARY=PASS`) e resolução direta sem persistência (`RESOLVED_PLAYBACK_REQUEST_PERSISTENCE=NONE`);
  - Player nativo Android implementado com AndroidX Media3 ExoPlayer (`media3-exoplayer:1.5.1`, `media3-exoplayer-hls:1.5.1`, `media3-ui:1.5.1`), `NativePlayerActivity` não exportada (`android:exported="false"`), liberação de recursos em `onDestroy`, ponte Capacitor com sanitização de cabeçalhos e fallback seguro na web (`WEB_NATIVE_PLAYER_UNAVAILABLE=PASS`);
  - Proteção de segurança comprovada: `PLAYBACK_URI_ALLOWLIST=HTTPS_BASELINE`, rejeição estrita de userinfo credentials (`URL_USERINFO_CREDENTIALS_REJECTED=PASS`) e cabeçalhos sensíveis omitidos de logs (`PLAYBACK_HEADERS_LOGGING=PROHIBITED`);
  - Ausência de fonte real e validação física registradas como não-requisitos de G8 (`REAL_SOURCE_IMPLEMENTED=NAO`, `REAL_SOURCE_AUTHENTICATED=NAO`, `REAL_SOURCE_PLAYBACK_PROVEN=NAO`, `PHYSICAL_MEDIA_PLAYING_PROVEN=NAO`, `PHYSICAL_DEVICE_VALIDATION=NOT_REQUIRED_G8`);
  - MVP_PROGRESS_PERCENT atualizado de 74 para 82;
  - **Ciclo G9 (Incremental Update)**:
  - Implementação da arquitetura de atualização incremental segura para catálogo e índice de busca (`DELTA_PACKAGE_FORMAT_VERSION=1`, `DELTA_GENERATION=EXTERNAL_PREBUILT`);
  - Vinculação estrita à base ativa: `DELTA_BASE_BINDING=STRICT` exigindo correspondência exata de `snapshotId`, `catalogVersion`, `catalogSha256` e `searchIndex.contentHash`;
  - Endereçamento determinístico por identificadores canônicos (`CATALOG_DELTA_ADDRESSING=CANONICAL_ID_BASED`) e semântica de substituição integral (`DELTA_UPSERT_SEMANTICS=FULL_ENTITY_REPLACEMENT`);
  - Proteção de armazenamento: proibição categórica de patch in-place (`IN_PLACE_ACTIVE_PATCH=PROHIBITED`) adotando isolamento em staging (`STAGING_THEN_PROMOTION`) com readback validation física e promoção atômica do ponteiro `active.json`;
  - Atomicidade lógica entre catálogo e busca no perfil `SEARCH_ENABLED`: `SEARCH_ENABLED_DELTA_ATOMICITY=CATALOG_AND_SEARCH_TOGETHER`;
  - Prevenção de reindexação pesada no dispositivo cliente: `ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE=PROHIBITED` através da aplicação direta de postings mapeadas por IDs;
  - Tolerância a falhas e preservação da geração ativa em qualquer erro: `FAILED_UPDATE_PRESERVES_ACTIVE=PASS`, `PARTIAL_TARGET_STAGING_NOT_ACTIVE=PASS`, `WRONG_BASE_NOT_PATCHED=PASS`, `FULL_PACKAGE_REQUIRED_STATE=PASS`, `OUT_OF_ORDER_DELTA_REJECTED=PASS`, `NO_FALSE_EMPTY_DELTA_GUARD=PASS`;
  - Idempotência pura em reaplicação do mesmo delta: `SAME_DELTA_REAPPLY=IDEMPOTENT`, `ACTIVE_POINTER_UNCHANGED_ON_REAPPLY=PASS`;
  - Comprovação empírica de redução de tamanho de transferência: razão de 0,0092 (41,2 KB vs 4,37 MB do pacote full) no perfil `SPARSE_1_PERCENT` com 240.000 documentos (`SPARSE_1_PERCENT_DELTA_TO_FULL_RATIO_LT_1=PASS`);
  - Execução de benchmark sintético com 240.000 documentos nos perfis SPARSE_1_PERCENT (1% = 2.400 itens alterados, apply 423ms) e MODERATE_5_PERCENT (5% = 12.000 itens alterados, apply 406ms, ratio 0.0431);
  - Evidência empírica não-SLA: `PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`, `REAL_DEVICE_INCREMENTAL_UPDATE_PROVEN=NAO`, `FIRE_STICK_UPDATE_FAST=NAO`;
  - Elaboração da documentação arquitetural em `docs/INCREMENTAL_UPDATE.md` (36 seções canônicas) e formalização de 12 fluxos no FSD (`F-G9-001` a `F-G9-012`);
  - Criação da suíte de validação `scripts/validate-incremental-update.mjs` (`npm run update:check`) e do benchmark `scripts/benchmark-incremental-update-scale.mjs` (`npm run update:benchmark`) com 100% de aprovação;
  - Preservação integral das regressões de todos os Gates anteriores (G2, G3, G4, G5, G6, G7, G8, typecheck, web build e android build);
  - Auditoria de segredos e escopo: zero credenciais reais, sem service_role, sem package signing/encryption (G10), sem canal de rede OTA, sem G10;
  - Registro histórico: `G9_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM`.

- **Adjudicacao G9 e Canonicalizacao (2026-09-05)**:
  - G9 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G9_INCREMENTAL_UPDATE_CLOSED`);
  - Arquitetura de atualização incremental para catálogo e índice de busca aprovada (`DELTA_PACKAGE_FORMAT_VERSION=1`, `DELTA_BASE_BINDING=STRICT`, `CATALOG_DELTA_ADDRESSING=CANONICAL_ID_BASED`, `DELTA_UPSERT_SEMANTICS=FULL_ENTITY_REPLACEMENT`);
  - Imutabilidade da geração ativa mantida com isolamento em staging e promoção atômica do ponteiro `active.json` (`IN_PLACE_ACTIVE_PATCH=PROHIBITED`, `STAGING_THEN_PROMOTION=PASS`, `FAILED_UPDATE_PRESERVES_ACTIVE=PASS`);
  - Atomicidade entre catálogo e busca no perfil `SEARCH_ENABLED` comprovada (`SEARCH_ENABLED_DELTA_ATOMICITY=CATALOG_AND_SEARCH_TOGETHER`, `ON_DEVICE_SEARCH_FULL_REINDEX_DURING_UPDATE=PROHIBITED`);
  - Benefício de transporte incremental demonstrado com redução de dados para 0,0092 do pacote full em alterações de 1% (`SPARSE_1_PERCENT_DELTA_TO_FULL_RATIO_LT_1=PASS`);
  - Registro de risco de escala sintética classificado como evidência não-bloqueadora:
    - `CLASSIFICATION`: `PERFORMANCE_EVIDENCE_RISK`
    - `GATE`: `G9_INCREMENTAL_UPDATE`
    - `STATUS`: `OPEN_NON_BLOCKING`
    - `EVIDENCE_SOURCE`: `SYNTHETIC_240K_INCREMENTAL_TEST`
    - `SPARSE_1_PERCENT`: docs=240000, changed=2400, delta_pkg=42233B, full_pkg=4585619B, ratio=0.0092, apply=423ms, total=1867ms, peak_mem=459MB
    - `MODERATE_5_PERCENT`: docs=240000, changed=12000, delta_pkg=199353B, full_pkg=4630164B, ratio=0.0431, apply=406ms, total=1575ms, peak_mem=640MB
    - `INTERPRETATION`: A vantagem de transporte incremental foi comprovada sinteticamente, porém o pico de memória observado no harness de escala justifica validação futura em hardware real.
    - `PERFORMANCE_EVIDENCE_IS_NOT_SLA`: `SIM`
    - `REAL_DEVICE_INCREMENTAL_UPDATE_PROVEN`: `NAO`
    - `G9_PASS_INVALIDATED`: `NAO`
  - MVP_PROGRESS_PERCENT atualizado de 82 para 89;
  - CURRENT_GATE avançado para G10 (`NEXT_AUTHORIZABLE_GATE=G10`);
  - G10 permanece NOT_STARTED (`G10_STATUS=NOT_STARTED`, `G10_STARTED=NAO`, `NEXT_GATE_STARTED=NAO`);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Ciclo G10 (Security & Recovery — 2026-09-05)**:
  - Implementação da camada formal de autenticidade criptográfica e recuperação resiliente para o Xandeflix Prebuilt;
  - Formato de envelope de segurança desacoplado V1 (`ArtifactSecurityEnvelope`, `securityFormatVersion=1`, `schemas/prebuilt-artifact-security.schema.json`) preservando os formatos de dados internos consolidados nos Gates G4, G7 e G9;
  - Algoritmo de assinatura estabelecido como ECDSA NIST P-256 com digest SHA-256 no formato DER (`ARTIFACT_SIGNATURE_ALGORITHM=ECDSA_P256_SHA256`);
  - Payload de assinatura canônico determinístico com ordenação alfabética estrita de propriedades (`SIGNING_PAYLOAD_CANONICALIZATION=DETERMINISTIC`);
  - Separação estrita de chaves assimétricas: chave privada externa ao repositório e ao cliente (`PRIVATE_SIGNING_KEY_LOCATION=EXTERNAL_ONLY`), ferramenta externa de assinatura CLI (`scripts/sign-provisioning-artifact.mjs`), chaves efêmeras em testes (`TEST_PRIVATE_KEY_PERSISTED=NAO`), e ausência de chaves de produção inventadas (`PRODUCTION_SIGNING_KEY_PROVISIONED=NAO`);
  - Âncoras de confiança modeladas como conjunto fixo de chaves públicas gerenciadas (`TRUST_ANCHOR_MODEL=PINNED_PUBLIC_KEY_SET`, `TrustedPublicKeyStore`) com status `ACTIVE` e `REVOKED`;
  - Verificação fail-closed compulsoria antes de descompressão ou parsing (`ArtifactVerifier`, `SECURE_IMPORT_FAIL_CLOSED=REQUIRED`);
  - Rejeição comprovada de artefatos não assinados no boundary de produção (`UNSIGNED_NEW_ARTIFACT_IMPORT=REJECT`, `PRODUCTION_IMPORT_BYPASS=NAO`);
  - Rejeições comprovadas de ataques e defeitos: adulteração de artefato (`TAMPERED_ARTIFACT_REJECTED=PASS`), assinatura forjada (`TAMPERED_SIGNATURE_REJECTED=PASS`), chave errada (`WRONG_KEY_REJECTED=PASS`), chave desconhecida (`UNKNOWN_KEY_ID_REJECTED=PASS`), chave revogada (`REVOKED_KEY_REJECTED=PASS`), discrepância de tamanho (`ARTIFACT_SIZE_MISMATCH_REJECTED=PASS`), divergência de hash (`ARTIFACT_HASH_MISMATCH_REJECTED=PASS`) e confusão de algoritmo (`ALGORITHM_CONFUSION_REJECTED=PASS`);
  - Suporte completo e retrocompatível comprovado para `FULL_PACKAGE_V1`, `FULL_PACKAGE_V2` e `DELTA_PACKAGE_V1`;
  - Arquitetura de recuperação resiliente com validação profunda no startup (`STARTUP_ACTIVE_VALIDATION=REQUIRED`, `RecoveryService`), diário de recuperação atômico (`prebuilt/recovery.json`, `RecoveryJournalManager`), retenção mínima de 2 gerações (`RECOVERY_MINIMUM_GENERATIONS=2`, `RECOVERY_BASELINE=ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD`) e promoção atômica transparente da última geração íntegra conhecida (`AUTOMATIC_LAST_KNOWN_GOOD_RECOVERY=SUPPORTED`, `PREVIOUS_VALID_SNAPSHOT_RECOVERED=PASS`);
  - Prevenção formal e comprovada de falso vazio (`RECOVERY_FALSE_EMPTY_PREVENTED=PASS`);
  - Idempotência pura na recuperação (`RECOVERY_IDEMPOTENT=PASS`) e segurança contra falha de escrita no ponteiro (`RECOVERY_POINTER_WRITE_FAILURE_SAFE=PASS`);
  - Recuperação estritamente local sem tráfego de rede (`RECOVERY_NETWORK=NONE`);
  - Decisão formal sobre criptografia de pacotes: não-requisito no MVP devido à estrita ausência de dados secretos ou credenciais nos artefatos de provisionamento (`PACKAGE_ENCRYPTION_MVP_REQUIREMENT=NOT_REQUIRED_FOR_CREDENTIAL_FREE_PROVISIONING_DATA`, `PACKAGE_ENCRYPTION_IMPLEMENTED=NAO`);
  - Elaboração da documentação arquitetural em `docs/SECURITY_AND_RECOVERY.md` (23 seções canônicas) e formalização de 12 fluxos funcionais no FSD (`F-G10-001` a `F-G10-012`);
  - Suíte completa de testes de segurança e recuperação implementada em `scripts/validate-security-recovery.mjs` (`npm run security:check`) com 100% de aprovação;
  - Preservação de 100% dos testes de regressão dos Gates anteriores G2 a G9, além de typecheck, build web e compilação nativa Android (`CAP_SYNC_ANDROID=PASS`, `ANDROID_UNIT_TESTS=PASS`, `ANDROID_DEBUG_BUILD=PASS`);
  - Registro de conclusão técnica: `G10_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM`.

- **Adjudicacao G10 e Canonicalizacao (2026-09-05)**:
  - Gate G10 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G10_SECURITY_AND_RECOVERY_CLOSED`);
  - `G10_STATUS=PASS`, `G10_ADJUDICATION_CLOSED_PASS=SIM`;
  - MVP_PROGRESS_PERCENT elevado de 89 para 94 (`MVP_PROGRESS_PERCENT=94`);
  - CURRENT_GATE avançado para G11 (`NEXT_AUTHORIZABLE_GATE=G11`);
  - G11 permanece NOT_STARTED (`G11_STATUS=NOT_STARTED`, `G11_STARTED=NAO`, `NEXT_GATE_STARTED=NAO`);
  - Autorização expressa concedida para commit e push canônicos na branch origin/main.

- **Subciclo G11A (Physical Provisioning & Device Discovery — 2026-09-06)**:
  - Resolução do gap de testabilidade física e correção de descoberta de dispositivos via ADB;
  - Diagnóstico e enumeração com sucesso do Tablet Samsung SM-X610 (`RX2X301Q3KY`, Android 16, API 36) e Fire TV Stick Lite (`G071EL1313720CJ0`, Android 9, API 28);
  - Implementação de âncora de confiança de teste restrita a compilações de depuração (`DEBUG_ONLY_TEST_TRUST_ANCHOR`, `keyId: g11-physical-test-key-2026`);
  - Ponto de entrada de teste físico implementado em camada WebView (`window.__XANDEFLIX_DEBUG_IMPORT__`) e Intent receiver nativo (`DebugProvisioner`), compilados exclusivamente no source set `src/debug`;
  - Isolamento estrito de produção comprovado: no source set `src/release`, `DebugProvisioner` é um stub inerte (`RELEASE_DEBUG_PROVISIONER_BEHAVIOR=INERT_NO_IMPORT_CAPABILITY`), a chave de teste é puramente inexistente (`RELEASE_TEST_TRUST_KEY_PRESENT=NAO`), o entrypoint é omitido (`RELEASE_DEBUG_IMPORT_ENTRYPOINT_PRESENT=NAO`), e auditoria do APK de release comprovou ausência absoluta de chaves privadas (`PRIVATE_SIGNING_KEY_IN_APK=NAO`);
  - Importação de pacote sintético assinado (Full Package v2 com catálogo e índice de busca) executada via `SecureArtifactImportService` com validação de assinatura ECDSA P-256 e digest SHA-256, staging, readback e promoção atômica com sucesso em ambos os dispositivos (`SIGNED_SYNTHETIC_PACKAGE_IMPORT=PASS`);
  - Rejeição física comprovada de artefatos unsigned (`PHYSICAL_UNSIGNED_ARTIFACT_REJECTED=PASS`) e adulterados (`PHYSICAL_TAMPERED_ARTIFACT_REJECTED=PASS`);
  - Validação funcional completa no Tablet SM-X610: Home, Filmes, Séries, Detalhes, Busca Local, touch, baseline D-pad, restart, persistência e prevenção de falso vazio (`TABLET_HOME=PASS`, `TABLET_SEARCH=PASS`, `TABLET_CRASH_COUNT=0`, `TABLET_ANR_COUNT=0`);
  - Validação funcional completa no Fire TV Stick Lite: navegação direcional D-pad (UP, DOWN, LEFT, RIGHT, ENTER, BACK), anel de foco de alto contraste visível, sem focus traps, teclado virtual de busca e retorno sem falsos vazios (`FIRE_STICK_HOME=PASS`, `FIRE_STICK_DPAD=PASS`, `FIRE_STICK_SEARCH=PASS`, `FIRE_STICK_CRASH_COUNT=0`, `FIRE_STICK_ANR_COUNT=0`);
  - Preservação da coexistência pacífica e isolamento do aplicativo protegido `com.xandeflix.app`;
  - Adjudicação formal do subciclo pelo Chat Mestre: `RESULT=PASS_PREBUILT_G11A_PHYSICAL_PROVISIONING_AND_DEVICE_DISCOVERY_CLOSED`, `G11A_STATUS=PASS`, `G11_STATUS=IN_PROGRESS`, `MVP_PROGRESS_PERCENT=94`;
  - **Subciclo G11B (Phone Validation & Final Physical Matrix — 2026-09-06)**:
  - Conexão e homologação física com sucesso do smartphone Android Samsung Galaxy S24+ (`SM-S926B`, `RXGYB03FL4W`, Android 16, API 36);
  - Instalação e provisionamento criptográfico assinado via `SecureArtifactImportService` com validação de envelope ECDSA P-256 e digest SHA-256, staging em quarentena, readback validation e promoção atômica com sucesso (`PHONE_SIGNED_SYNTHETIC_PACKAGE_IMPORT=PASS`);
  - Rejeição física comprovada de artefato com assinatura adulterada (`PHYSICAL_TAMPERED_ARTIFACT_REJECTED=PASS`);
  - Validação funcional completa no Smartphone: Home, Filmes, Séries, Detalhes de Filme e Série com ação "▶ Assistir", Busca Local multi-termo, touch e botão voltar, modo retrato e modo paisagem observacional (`PHONE_HOME=PASS`, `PHONE_MOVIES=PASS`, `PHONE_SERIES=PASS`, `PHONE_MOVIE_DETAIL=PASS`, `PHONE_SERIES_DETAIL=PASS`, `PHONE_SEARCH=PASS`, `PHONE_TOUCH=PASS`, `PHONE_BACK=PASS`, `PHONE_PORTRAIT=PASS`);
  - Persistência e resiliência no Smartphone: sobrevivência pós-morte de processo (`am force-stop`), reinicialização transparente sem reimportação, sem reconstrução de índice no startup e sem falso vazio (`PHONE_RESTART=PASS`, `PHONE_PROCESS_DEATH=PASS`, `PHONE_ACTIVE_SNAPSHOT_PERSISTED=PASS`, `PHONE_NO_FALSE_EMPTY=PASS`);
  - Ausência absoluta de crashes e ANRs no Smartphone (`PHONE_CRASH_COUNT=0`, `PHONE_ANR_COUNT=0`);
  - Revalidação curta executada e aprovada no Fire TV Stick Lite (`AFTSSS`, Android 9, API 28) com D-pad, Home, Busca e Back com zero falhas (`FIRE_STICK_SHORT_REVALIDATION=PASS`, `FIRE_STICK_CRASH_COUNT=0`, `FIRE_STICK_ANR_COUNT=0`);
  - Preservação canônica das evidências homologadas no Tablet Samsung SM-X610 (`RX2X301Q3KY`, Android 16, API 36);
  - Matriz física consolidada aprovada nos três perfis de hardware (`PHONE_PHYSICAL=PASS`, `TABLET_PHYSICAL=PASS`, `FIRE_STICK_PHYSICAL=PASS`);
  - Coexistência pacífica e dados inviolados do aplicativo original protegido `com.xandeflix.app`.

- **Adjudicacao Gate G11 e Canonicalizacao (2026-09-06)**:
  - Gate G11 formalmente adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G11_PHYSICAL_MULTI_DEVICE_TESTING_CLOSED`);
  - `G11_STATUS=PASS`, `G11_ADJUDICATION_CLOSED_PASS=SIM`;
  - `MVP_PROGRESS_PERCENT` elevado de 94 para 98 (`MVP_PROGRESS_PERCENT=98`);
  - `CURRENT_GATE` avançado para G12 (`NEXT_GATE=XANDEFLIX_PREBUILT_G12_MVP_ACCEPTANCE_AND_FINAL_BENCHMARK`);
  - Gate G12 permanece estritamente NOT_STARTED (`G12_STATUS=NOT_STARTED`, `G12_STARTED=NAO`, `NEXT_GATE_STARTED=NAO`);
  - Riscos não bloqueadores preservados abertos: `SEARCH_SCALE_PERFORMANCE_RISK=OPEN_NON_BLOCKING_PHYSICALLY_USABLE`, `UPDATE_SCALE_MEMORY_RISK=OPEN_NON_BLOCKING`, `PERFORMANCE_EVIDENCE_IS_NOT_SLA=SIM`;
  - Autorização expressa concedida pelo Chat Mestre para commit e push canônicos na branch origin/main.

- **Execucao e Adjudicacao Gate G12 — MVP Acceptance and Final Benchmark (2026-09-06)**:
  - Gate G12 formalmente concluído e adjudicado pelo Chat Mestre como PASS (`RESULT=PASS_PREBUILT_G12_MVP_ACCEPTANCE_AND_FINAL_BENCHMARK_CLOSED`);
  - `G12_STATUS=PASS`, `G12_ADJUDICATION_CLOSED_PASS=SIM`, `G12_EXECUTION_COMPLETE_PENDING_MASTER_ADJUDICATION=SIM`;
  - `MVP_PROGRESS_PERCENT` elevado de 98 para 100 (`MVP_PROGRESS_PERCENT=100`);
  - Linha de base arquitetural do MVP consolidada e concluída (`MVP_ARCHITECTURAL_BASELINE=COMPLETE`, `MVP_STATUS=ARCHITECTURAL_MVP_COMPLETE`);
  - `CURRENT_GATE=NONE`, `NEXT_GATE=NONE`, `NEXT_GATE_STARTED=NAO`;
  - Matriz de aceitação final do roadmap integralmente aprovada (`FINAL_ACCEPTANCE_MATRIX=PASS` de G0 a G12);
  - Benchmarks de escala controlados preservados (240.000 documentos em busca e atualização incremental);
  - Evidências físicas multi-dispositivo consolidadas nos três perfis de hardware (`PHONE_PHYSICAL=PASS`, `TABLET_PHYSICAL=PASS`, `FIRE_STICK_PHYSICAL=PASS`, `CRASH_COUNT_TOTAL=0`, `ANR_COUNT_TOTAL=0`, `FIRE_STICK_DPAD=PASS`);
  - Zero defeitos bloqueadores de arquitetura (`MVP_BLOCKING_DEFECT_COUNT=0`, `MVP_BLOCKERS=NONE`);
  - Preservação canônica dos 12 riscos residuais não bloqueadores abertos para as fases de integração pós-MVP;
  - Pontos de extensão para fontes reais registrados como prontos (`REAL_SOURCE_ADAPTER_EXTENSION_POINT=READY`, etc.) com fonte real não integrada neste escopo;
  - Segurança de release e isolamento contra colisões com repositório original `timbocorrea/xandeflix-2.0` integralmente verificados;
  - Autorização expressa concedida pelo Chat Mestre para commit e push canônicos na branch origin/main.


- **Ciclo C11 - Canonical Bounded-Memory Import Fix (2026-09-24)**:
  - Forense do pipeline confirmou que o transporte M3U ja era incremental; o defeito estava na retencao de acumuladores brutos de episodios, na recriacao posterior de entidades canonicas, na copia de arrays no Search V2 e na serializacao duplicada do catalogo durante staging;
  - Correcao minima aplicada em `real-source-importer.service.ts`, `compact-search-v2-builder.ts` e `managed-source-staging.orchestrator.ts`, com teste sintetico on-the-fly de 250.000 registros em `scripts/test-c11-bounded-memory-import.mjs`;
  - Accounting completo, relacoes de series, Search V2, direct streams, staging e promocao atomica: `PASS`;
  - Typecheck, build web, unit tests Android, APK debug e suites de self-service, licenca, boot sync, C9, direct stream, import memory, large transport e real/live: `PASS`;
  - Instalacao fisica update-in-place no SM-X205 preservou identidade e ativacao `AUTHORIZED`/`SELF_SERVICE`/`TRIAL`; APK SHA-256: `E5D927082F958553F4D6B872CB4E84106FAE1EB5C06F6C875CCD6707D5A5A1BB`;
  - O boot fisico alcancou o shell sem novo crash/ANR apos a instalacao; houve apenas uma observacao de console WebView `triggerEvent` sem interrupcao do boot; o `exit-info` preservou crashes nativos anteriores e pico historico do renderer WebView de aproximadamente 1,5 GB RSS; a autoridade respondeu `SOURCE_NOT_BOUND`, o import real nao foi forjado e C11 permanece `OPEN_PENDING_FINAL_CLEAN_INSTALL_E2E`;
  - Nenhum commit, push, PR, migration, write remoto ou uninstall foi executado; o proximo gate nao foi iniciado.
- **Ciclo R17D — Fechamento do Gate A Funcional e Live Fullscreen (2026-09-29)**:
  - Resolução definitiva da tela preta na transição do Live TV de preview inline para fullscreen;
  - Auditoria física confirmou a causa raiz: máscara preta opaca `view.setBackgroundColor(Color.BLACK)` no `PlayerView` e camada de hardware do `SurfaceView` subjacente à janela da WebView;
  - Correção cirúrgica aplicada em `NativeAndroidPlayerPlugin.java`: `view.setBackgroundColor(Color.TRANSPARENT)` e `((SurfaceView) surfaceView).setZOrderMediaOverlay(true)`;
  - Instrumentação temporária de observabilidade adicionada com callbacks de `SurfaceHolder` (`surfaceCreated`, `surfaceChanged`, `surfaceDestroyed`) e `Player.Listener` (`onRenderedFirstFrame`, `onVideoSizeChanged`, `onPlaybackStateChanged`);
  - Teste físico no dispositivo real Amazon Fire TV Stick Lite (`AFTSS`, Serial `G071CQ070344374G`, Android 9 / API 28) homologado com SUCESSO ABSOLUTO:
    - Vídeo e áudio fluidos em tela cheia (1920x1080);
    - Transição sem interrupção de frames ou recriação anômala de codecs;
    - Tecla Voltar (Back) do controle remoto retornou com precisão para o layout inline (760x428);
    - Zero crashes, zero ANRs e zero travamentos;
  - Gate A Funcional formalmente adjudicado como PASS (`GATE_A_FUNCTIONAL_STATUS=PASS`, `LIVE_FULLSCREEN=PASS`, `R17D_STATUS=PASS`);
  - Higiene e limpeza de artefatos de diagnóstico concluída com sucesso (`FINAL_NON_DIAGNOSTIC_APK_REQUIRED=SIM`, `FINAL_NON_DIAGNOSTIC_APK_STATUS=PASS`):
    - Remoção de todos os blocos de log e listeners de observabilidade temporária em `NativeAndroidPlayerPlugin.java`;
    - Preservação estrita da transparência (`Color.TRANSPARENT`), elevação de hardware (`setZOrderMediaOverlay(true)`) e failover de candidatos (`onPlayerError`);
    - Exclusão do diretório de quarentena de assets residuais (`android/app/src/main/assets/public.__c11_r7b_quarantine/`);
    - Validação de testes unitários: 82 tasks executadas com sucesso sem regressão (`BUILD SUCCESSFUL`);
    - APK final gerado: `android/app/build/outputs/apk/debug/app-debug.apk` (`9019470` bytes, SHA-256: `06C6C5276565B77E6E088D3689F22C4749AE88C96CF6D52EE9F18180C0EE8933`).
