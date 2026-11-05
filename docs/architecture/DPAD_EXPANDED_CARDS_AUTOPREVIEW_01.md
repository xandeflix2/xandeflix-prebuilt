# CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01 — especificação anterior ao código — 2026-10-25

Pedido anexado autoriza auditoria/implementação/validação/preparação de implantação local. Nova emenda isolada após entrega D-pad10s, que permanece congelada com root/L1. Repo/origin canônicos xandeflix2/xandeflix-prebuilt; branch fix/source-output-format-recovery, HEAD d8a7410, main b3fc8d1 preservada.33 recibos/908 protegidos/182 controles/29 suítes/239 testes Android38 suítes recebidos. Sem Git add/commit/push/PR/merge/deploy, backend/Supabase, fonte/credenciais/importação/identidade/ativação/C9/player principal/live/buffer, versão ou dependências.

Diagnóstico: MediaCard compartilhado e MediaRail/CatalogGrid estáveis, D-pad estrutural existente; não há modalidade global real. Catálogo VM contém IDs/tipo/poster/backdrop/ano/gêneros/sinopse. Hero/Artwork/TMDB já têm identidade estrita/caches/fila limitadas. PresentationService confirma TMDB e fornece trailers YouTube, mas perde indicação official. PublicTrailer nativo tem única WebView isolada sem bridge/arquivos e inline somente phone/modal em TV; não suporta card/mute/ended. Player principal da fonte é distinto e não será alterado.

Plano: host React único no AppShell escuta modalidade via teclas direcionais/centro e pointer/touch reais, nunca apenas resolução. Ativo somente Home/Filmes/Séries, inclusive categorias. MediaCard só emite eventos locais de foco/saída/ativação com o modelo já disponível em RAM; nenhuma nova inscrição/efeito por card. Host prepara apenas containers próximos/visíveis (IntersectionObserver) e o focado; largura normal medida do layout recebido antes da classe D-pad, aumentada20%. Modalidade touch restaura CSS/tamanhos/gestos originais, sem prévia. Identidade element+kind+id+identity evita evento tardio e reutilização entre títulos.

Rails: expansão de width/flex em180ms, mesma altura, foco/borda e scroll para manter card inteiro. Grid: tracks de largura normal e reserva horizontal por linha para uma expansão; colunas calculadas uma vez por resize. Apenas vizinhos posteriores na mesma linha transladam pela diferença, sem mudar DOM/ordem/colunas no foco. Assim motor D-pad existente continua indexado e coluna preservada; sem reordenar/remontar cards, saltos de linha ou sobrepor vizinhos. Reduced motion desliga animação. CSS só entra com modo D-pad e container preparado; touch markup permanece idêntico.

Portal React não interativo dentro da área de imagem do botão focado: backdrop via DetailBackdrop/Artwork/identidade estrita existentes e fallback proporcional; metadados opcionais estáticos, título/gênero originais permanecem no rodapé. Não sobrepor texto/controles ao vídeo oficial. Temporizador3s antes de buscar trailer; somente previewTrailer oficial selecionado dos dados públicos TMDB (YouTube Trailer, official=true e ID11), tmdbId confirmado igual ao match. Nenhuma URL de filme/episódio/playlist é usada; catálogo atual não possui preview de episódio validado, portanto nesses casos imagem estática.

Sessão global única, cancelamento síncrono ao blur/Enter/Back/pointer/ocultar página/saída, geração/token após cada await e operações nativas serializadas. Sem rede de vídeo nos3s ou em navegação rápida; sem download/cache de vídeo, loop ou retry automático. Startup máximo8s, duração45s, erro/bloqueio/sem mídia/viewport insuficiente volta à imagem sem texto de erro. Futuro toggle de habilitação exposto na política da sessão, sem nova UI de configurações agora. SDK oficial YouTube web carregado somente após3s; mute/autoplay/disablekb/controls0, eventos playing/ended/error/autoplayblocked reais, não tratar onLoad como reprodução.

Emenda explícita relacionada PublicTrailer: novo modo card, mínimo200×200, ID/sessão/bounds/HTTPS isolados intactos; HTML card muted, evento ended/autoplayblocked, WebView sem foco e transparente até playing, depois vídeo sem UI externa. Inline phone e modal anteriores preservados por overload html(id) e testes históricos. Sem strings/URLs arbitrárias ou mudanças no player da fonte. Referências primárias consultadas: https://developers.google.com/youtube/iframe_api_reference e https://developers.google.com/youtube/player_parameters (viewport mínimo200×200, muted autoplay pode ser bloqueado).

Baseline fresh antes do patch canon:check,canon:test,C11. Testes novos de sessão com relógio/ports controlados: <3s/3s, troca rápida, cancel durante async/open, exclusividade, Enter prioritário, erro/timeout/limites/toggle, trailer oficial/identidade. Browser Chromium com componentes reais e mídia/metadata simuladas: Fire960×540,AndroidTV1920×1080,Home/Filmes/Séries/rail/grid,primeiro/último card/navegação/foco/Enter/Back/sem mídia,phone411 e tablet1280 touch/híbrido,cleanup e snapshots. Java política novos casos card/mute/size/ended sem remover asserts anteriores. Canon182+3 e todas29 suítes preservadas, nova suíte30. Final canon/check/test/C11/typecheck/playback/build + Android unit tests offline; preparar implantação/rollback e distinguir fixtures de hardware. APK/instalação não são esta demanda; nenhuma implantação ou teste físico fabricado.

Allowlist fechada21:
- src/ui/expanded-card-controller.ts
- src/ui/card-preview-session.ts
- src/ui/card-preview-media.ts
- src/ui/components/CardExpansion.tsx
- src/ui/components/CardExpansion.css
- src/ui/components/MediaCard.tsx
- src/ui/components/AppShell.tsx
- src/artwork/series-presentation.service.ts
- src/playback/public-trailer.bridge.ts
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicy.java
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPlugin.java
- scripts/test-dpad-expanded-cards.mjs
- android/app/src/test/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicyTest.java
- scripts/test-canonical-regression.mjs
- docs/architecture/DPAD_EXPANDED_CARDS_AUTOPREVIEW_01.md
- docs/evidence/DPAD_EXPANDED_CARDS_AUTOPREVIEW_01.md
- docs/governance/authorizations/CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Mocks antigos que não aceitem novos imports podem receber somente ports de apresentação, com emenda anterior à edição e todas assertions preservadas; não relaxar comportamento para satisfazer fixture. Registrar erros reais. Recibo34 com grants/predessores reais e SHA autorização UTF-8/LF 9bfa2adae476b3e0eaed259fbabc440df2645789a1d39e64e8ab3bdd01c53c7a (transcrição, não assinatura humana). Normativos append-only e33 recibos anteriores byte-idênticos. Próxima implementação não iniciada.


## CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01 — registro — 2026-10-25

Solicitação/especificação/allowlist21 precederam patch, baseline fresh canon/check/test/C11 exit0 (182 controles/29 suítes). Novo preview oficial opcional não muda trailer manual. Host único por shell, eventos locais de MediaCard, modalidade real e grid estável com reserva lateral. Três negativos e nova suíte30,33 recibos anteriores preservados. Primeiro teste novo revelou fila Promise vazia por cancelamentos sem mídia; cancel agora só encadeia fechamento assíncrono real, mesmos asserts. Suíte focada13 passou. Pretypecheck inicial foi bloqueado pelo canon antes do registro desta emenda; tsc não executou, nenhum hook/verificador contornado. Falhas registradas, não são PASS nem RED histórico. Validação integral/browser/Android ainda PENDING. Auth SHA256 9bfa2adae476b3e0eaed259fbabc440df2645789a1d39e64e8ab3bdd01c53c7a.


## Refinamento de identidade antes da validação final

Browser inicial8 cenários PASS: Fire110→132px,desktop/tablet180→216px, expansão/3s/sessão única/Enter/sem trailer/bloqueio/touch/híbrido. Primeiro harness falhou EXPANDED porque usou Baixo para sair do menu lateral; o motor existente usa Direita. Corrigido somente o gesto do harness, sem mudar produto/asserts. Após inspeção, evento de identidade pública do card e verificação após awaits/mutação cancelam preview se catálogo atualizar o mesmo nó; Tab/wheel também restauram modalidade não-Dpad. Badge/ano antigos ocultos na superfície expandida para não cobrir vídeo, cards nunca remontados. Rascunho34 de recibo/registro preservado; hashes atualizados só desta emenda ainda em andamento,33 recibos históricos intocados. Final completa e nova QA ainda pendentes.


## Adjudicação nominal de port legado antes da edição — allowlist22

Primeira validação completa passou canon:check, mas canon:test falhou ao renderizar AppShell no fixture test-c107-fire-hero-metadata.mjs: novo CardExpansionHost estava undefined no mock. Oito asserts funcionais anteriores desse cenário passaram antes da falha de tipo React; suítes restantes ficaram NOT_RUN, não são PASS. Acrescentar somente port CardExpansionHost:()=>null no mock, sem alterar assertions, execução ou produto para satisfazer fixture. Demanda nova continua testada no componente real/browser. Incluir esse único script na allowlist22 e no grant34 com predecessor real;33 recibos históricos permanecem imutáveis. Preservar primeira validação/log/rascunhos e repetir seis comandos e Android completos.


## CANON-01-DPAD-EXPANDED-CARDS-AUTOPREVIEW-01 — fechamento local — 2026-10-25

IMPLEMENTADO_LOCALMENTE_VALIDACAO_AUTOMATIZADA_PASS_HARDWARE_PENDENTE. Baseline fresh3/3 exit0; segunda validação completa6/6 exit0, sessão13 casos PASS e Android242 testes/38 suítes sem falhas/erros/skips.914 protegidos/34 recibos/185 controles/30 suítes; todos182 controles/29 suítes e33 recibos recebidos preservados. Primeira validação final falhou em port de mock legado, corrigido em allowlist22 antes da repetição integral, sem alterar assertions. Browser8+3 cenários de componentes reais com mídia/metadata simuladas e Java HTML QA PASS; não são testes físicos ou rede real. Caps20% somente D-pad, expansão/backdrop, trailer público oficial mudo após3s, sessão única/8s startup/45s lifetime, Enter e cleanup. Root/L1 e entrega recebida congelados, prefixos normativos preservados. Relatório completo C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/expanded-cards-20261025/REPORT.md; auth SHA256 9bfa2adae476b3e0eaed259fbabc440df2645789a1d39e64e8ab3bdd01c53c7a; recibo blobLF 8d031488e5175dc1a0fbca3246345be638074fe7. Nenhum APK/install/ADB/reset, Git add/commit/push/PR/merge, remoto/deploy/Supabase ou próxima implementação. Homologação Fire/Android TV e touch híbrido pendente.
