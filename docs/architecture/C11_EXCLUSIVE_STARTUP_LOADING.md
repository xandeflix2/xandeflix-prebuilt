# C111 — carregamento exclusivo com amostra de capas

## Autorização e proveniência — 2026-10-15

Usuário solicita substituir primeira sincronização com menu visível por tela
exclusiva: capas de lançamentos/cinema à esquerda e progresso à direita.
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C111_EXCLUSIVE_STARTUP_LOADING;
NEXT_GATE_STARTED=NAO. Clone independente C11-main, main,
HEAD 0f68f169f7728fae17c8311832b7643629e97a02, origin canônico confirmados.
61 caminhos dirty conhecidos dos ciclos anteriores, preservados. AGENTS,
Architecture, Execution, Source Data Boundary e Activation Lock lidos.
Lock prévio26 ativação+27 promoção+9 negativos PASS. Sem Git/backend/APK/install,
reset, mudança de autoridade, player ou fluxo de importação autorizados.

## Especificação anterior ao código

1. Manter escolha do dispositivo C110 e ativação como etapas próprias.
   Leitura inicial/verificação e primeiro catálogo autorizado usam visual
   exclusivo, sem montar menu/cabeçalho nas rotas de catálogo enquanto não
   existir catálogo REAL pronto para a UI. Settings/ativação/portal/debug
   continuam acessíveis por ações existentes; nenhum bypass de autorização.
2. Paisagem/quadrado: mosaico limitado de seis capas à esquerda e estado/barra
   à direita. Retrato estreito: mosaico compacto acima do progresso, sem
   rolagem horizontal. Marca Xandeflix, texto curto, contraste e alvo44px.
3. Barra acompanha estados reais do boot; se percentual medido disponível,
   usá-lo. Sem percentual disponível, mostrar etapa e atividade, não inventar
   percentuais/tempo restante. Parar animações em erro/offline e respeitar
   prefers-reduced-motion/visibilidade. Nenhuma espera artificial ou novo SLA.
4. Amostras são somente títulos/posters reais observados pelo importador
   autorizado, em RAM local, no máximo seis. Priorizar categorias de lançamento
   e cinema, sem inventar disponibilidade/lançamento quando não informados.
   Antes de existir metadata utilizável, mostrar placeholders identificados.
   Não fazer nova busca de catálogo, leitura ampla de staging nem discovery
   TMDB. Downloads de capas passam pela fila/cache existentes, sem identidade
   adicional para enriquecimento; prioridade normal e DOM limitado.
5. Observação de importação é opcional e só coleta se há assinante. Não alterar
   catálogo normalizado, IDs, streams, endpoints, staging/promoção, pesquisas,
   source delivery ou persistência. Falha de observador não quebra importação.
   Reinício de importação limpa a amostra; nunca logar URLs/credenciais.
6. Liberação da Home depende do catálogo local utilizável, sem esperar
   catálogo/indexação completa em segundo plano. Catálogo REAL prévio preserva
   abertura local e navegação durante atualização. Erro/offline mantêm ações
   de ativação/portal/retry; não perpetuar tela sem saída.
7. Reusar visual na espera de capas Fire C108, mantendo limite40, estabilidade
   500ms, decisão antes do paint, omissão rápida250ms, prazo20s e Entrar agora.
   Enquanto espera, ocultar/desativar menu por visibility/inert, mantendo
   geometria/eager loading. Overlay fora do shell via portal; ao liberar ou
   desmontar, restaurar o estado anterior. Não cobrir Home já apresentada nem
   reabrir em snapshot/perfil tardio. Outros perfis mantêm liberação anterior.

## Allowlist estrita

- src/ui/components/StartupLoadingScreen.tsx e .css (novos).
- src/artwork/startup-catalog-preview.ts (novo, metadata limitada em RAM).
- src/source/real-source-importer.service.ts: oferecer metadata das duas rotas
  de filme já normalizadas; sem alterar dados/controle/IO/importação.
- src/App.tsx: usar apresentação exclusiva e guard antes de AppShell.
- src/ui/components/FirstRealSyncState.tsx: substituir apresentação legada,
  preservar callbacks e nomes de estados; receber progresso existente.
- src/ui/components/StartupArtworkPreparation.tsx e src/ui/pages/HomePage.tsx:
  visual compartilhado, posters locais e isolamento/restauração do shell.
- scripts/test-c111-exclusive-startup-loading.mjs (novo).
- scripts/test-c108-startup-order.mjs e test-c11-startup-artwork.mjs:
  somente fixtures/imports do visual compartilhado quando necessários,
  preservando todos os critérios consolidados de ordem/limites/timeout.
- Este contrato; docs/evidence/C11_EXCLUSIVE_STARTUP_LOADING.md;
  docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md;
  tmp/c111-startup-loading e saídas usuais ignoradas do build web.

## Aceitação

Primeira sincronização sem shell/nav; amostra limitada real, descartável e
resiliente; ambos protocolos de importação preservados; porcentagem sem
invenção, layouts celular/quadrado/TV inspecionados. Erro/offline/retry e
catálogo prévio funcionais. C108 continua antes da Home, pode pular/cancelar,
não reabre, restaura shell/foco. Testes C105 de importação e C108, novo teste
React/browser/integração App, TypeScript/build e lock antes/depois PASS.
QA física e instalação não declaradas sem execução autorizada.

## Emenda solicitada durante a execução — celular

Usuário determinou que telas mobile mostrem apenas capa de fundo em transição
fade ou zoom. Substituir o mosaico nos celulares (incluindo paisagem) por uma
capa de fundo com crossfade suave, mantendo barra/textos/ações legíveis sobre
gradiente. Usar identificação PHONE existente, exceto formato quase quadrado,
que mantém a composição ampla consolidada. Sem galeria de miniaturas mobile.
Fila/cache existentes; no máximo duas imagens decodificadas na transição,
próxima capa só substitui a atual após carregar. Alternância a cada6s de
exibição pronta; falha não atrasa o boot nem gera imagem vazia de transição.
Pausar em erro/offline/oculto; reduced-motion mantém imagem estática.
Acrescentar à allowlist src/ui/components/StartupMobileBackdrop.tsx e ampliar
teste C111 para fundo único, fade, limites, rotação e pausa. Nenhum novo
requisito em hero/ativação ou novo Gate; pedidos anteriores permanecem.

## Emenda — fundos amplos e instalação Wi-Fi

Tablet, TV e dobrável quase quadrado devem usar fundo horizontal validado
pelo mesmo resolver de imagens do hero, preservando mosaico/progresso.
Celular usa somente poster vertical; não alterar política de orientação.
Resolver apenas um candidato por vez, prioridade normal, no máximo seis
títulos da amostra; nenhum discovery nem bloqueio da Home por esse fundo.
Falha mantém gradiente e não impede o carregamento. Reusar fila/cache.
Acrescentar à allowlist StartupBackdrop.tsx no lugar de StartupMobileBackdrop.tsx.

Usuário autorizou ao final gerar/assinar APK e instalar no celular e tablet
por Wi-Fi, em atualização preservando dados/ativação. Incluir saídas Android
geradas pelo cap sync/Gradle e artefato privado tmp/c111-startup-loading.
Não alterar código nativo/versionamento, não desinstalar/limpar dados,
não instalar no Fire, não publicar nem executar Git. Lock obrigatório
antes do build/sync/empacotamento e após verificação final.

## Emenda — ações da carga normal

Por pedido do usuário, não mostrar Ver ativação nem Portal do cliente na
carga inicial normal. Exibir essas ações somente em erro/offline como
recuperação, preservando Tentar novamente. Entrar agora do preparo Fire C108
permanece inalterado, com Back/foco/deadline consolidados.

## Emenda — entrega e análise posterior

Usuário optou por instalar manualmente o APK no tablet após falhas de alcance
Wi-Fi. Encerrar tentativas nesse alvo; manter atualização do celular.
Após entrega, solicitou verificar viabilidade de pré-buffer dos canais da
categoria ou de todos os canais. Autoriza leitura do player/política/session
guard e documentação técnica oficial; registrar avaliação no mesmo relatório.
Não autoriza implementar preload, abrir streams adicionais, alterar limiares,
licença/C9, atualizar Media3 ou interferir em reprodução consolidada.
