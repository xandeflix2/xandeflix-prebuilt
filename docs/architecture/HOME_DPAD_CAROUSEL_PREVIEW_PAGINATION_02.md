# CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02 — especificação anterior ao código — 2026-10-25

Solicitação atual autoriza diagnóstico, correção, implementação, testes e preparação de implantação, sem Git/publicação/backend. Root/L1 e estágios encerrados congelados; novo clone local canônico origin/branch fix/source-output-format-recovery HEAD d8a7410 e main b3fc8d1 preservados.34 recibos/914 protegidos/185 controles/30 suítes/242 testes Android38 suítes recebidos. Nenhuma desinstalação/reset/instalação de novo binário neste ciclo. Aparelhos podem ser observados por ADB/CDP no próprio app para diagnóstico; não exportar identidade, segredo, URL da fonte, token ou tráfego privado.

Diagnóstico inicial de código: detalhes usam resolveMovie/SeriesPresentation.trailer, enquanto card exige previewTrailer official=true, podendo excluir a mesma mídia manual válida. Causa física ainda não comprovada: observar TMDB público/nonce/bounds/estado do PublicTrailer sem imprimir credenciais; não concluir sucesso por ready. Home/AsyncCategoryRail limitam leitura e saída a20 e CategoryPreviewIndex é cache apenas das20 primeiras, sem cursor; não alterar formato/limites desse cache. SegmentedBrowseService.loadPage já oferece cursor incremental/local com contagem opcional e gerações. Motor D-pad usa siblings estáveis e mantém seleção visível sem âncora.

Plano: reutilizar serviço e identidade dos detalhes, preferindo trailer oficial e permitindo fallback ao trailer manual validado do mesmo ID, sem alterar semântica previewTrailer ou os13 testes anteriores. Preservar guarda de geração/aborto/uma sessão/3s/8s/45s e imagem estática; diagnosticar mídia nativa se necessário dentro dos2 arquivos PublicTrailer. Nunca usar conteúdo integral.

Âncora: usar início real da track como posição, espaço final suficiente mesmo no último item, realimentar scrollLeft pela geometria real durante expansão/colapso. Coexistir com scroll vertical do motor; nenhuma largura fixa de deslocamento, loop circular ou troca de ordem/foco. Evitar disputa entre keep-visible antigo e âncora. Aplicar somente modo D-pad real em Home/Filmes/Séries, preservar touch e grades.

Paginação:20 itens iniciais preservados, próximas leituras20 via loadPage cursor/count:false e ordem source/source-desc conforme categoria, inicial opcional/cache mantido. Cache20 não é cursor/autoridade de completude. Recuperar efetivamente próximos registros; seen IDs retém prefixo já exibido, sem duplicação, cursor avança mesmo em páginas repetidas/filtradas. Prefetch quando faltam6 títulos, um job por faixa e fila2 da Home; erro transitório mantém foco/dados e oferece retry explícito sem loop. Abortar na saída/geração. Filtros parentais/tipo ativos preservados. Metadados dos lotes vistos podem ficar em RAM até sair da Home, nenhum novo armazenamento remoto/persistente nem pré-download de vídeos.

Virtualização: montar janela de até24 cards por faixa com overscan e spacers proporcionais; metadados de lotes não implicam mídia montada. Movimento horizontal local deve montar próximo alvo e focar após commit, mantendo card atual até transferência. Índice lógico único, estável entre lotes e janela, usado também em migração vertical; Enter/Back originais intactos. Atualização de lote não remonta card focado nem reinicia timer. Touch mantém dimensões e sem âncora; paginação/virtualização podem ser compartilhadas sem alterar gestos. Faixas comuns pequenas permanecem compatíveis.

Validação: baseline fresh canon/check/test/C11 antes do patch; teste novo paginação10000 itens,20 inicial/lotes20/prefetch6/dedup/ordem/inverso/retry/cancel/reposta tardia/sem cursor falso; browser componentes reais com navegação1/2/10/100/último, x constante, baixo número de nós, troca de direção, lote sem timer reiniciado, touch, trailer disponível/ausente/erro/Enter. Testes13 anteriores e185 controles30 suítes preservados, acrescentar proteção do recibo35 e nova suíte. Native242/38 se sem patch nativo. Final canon/check/test/C11/typecheck/playback/build e native pertinentes. Reprodução real só PASS se playing e quadros progredindo observados; caso contrário PARCIAL com motivo verdadeiro, sem prometer autoplay universal. Registrar limites de hardware e preparar rollback, sem deploy.

Allowlist candidata fechada24 (usar apenas caminhos necessários; ports legados exigem addendum anterior à edição):
- src/ui/rail-pagination.ts
- src/ui/components/ProgressiveCategoryRail.tsx
- src/ui/components/MediaRail.tsx
- src/ui/components/MediaCard.tsx
- src/ui/components/AsyncCategoryRail.tsx
- src/ui/pages/HomePage.tsx
- src/ui/hooks/useDpadNavigation.ts
- src/ui/expanded-card-controller.ts
- src/ui/components/CardExpansion.tsx
- src/ui/components/CardExpansion.css
- src/artwork/series-presentation.service.ts
- src/ui/card-preview-media.ts
- src/ui/card-preview-session.ts
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPolicy.java
- android/app/src/main/java/com/xandeflix/prebuilt/trailer/PublicTrailerPlugin.java
- scripts/test-home-dpad-carousel-preview-pagination.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/HOME_DPAD_CAROUSEL_PREVIEW_PAGINATION_02.md
- docs/evidence/HOME_DPAD_CAROUSEL_PREVIEW_PAGINATION_02.md
- docs/governance/authorizations/CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md

Auth SHA256 UTF8/LF 64cd3527d66926b1455727d27bac239c1b061723849c28d5aa4b3b318ad36380. Recibo35 será calculado com predecessores/before/after LF reais após patch,34 anteriores imutáveis. Documentos normativos somente append; sem verifier/workflow/package/lock/deps/storage/source/import/Supabase/live/player principal/versão/ativação. Próximo desenvolvimento não iniciado.


## CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02 — registro local — 2026-10-25

Baseline fresh canon/check/test/C11 exit0 (185 controles/30 suítes,34 recibos/914 protegidos). Especificação/allowlist antes do patch; protótipo pager17 cenários PASS, incluindo10000 itens, cursor real segmentado, ordem reversa/retry/cancel/dedup/24 DOM lógico e trailer manual como fallback. Registra somente subset efetivamente modificado. Recibo35/auth SHA256 64cd3527d66926b1455727d27bac239c1b061723849c28d5aa4b3b318ad36380. Campos previewTrailer oficial e testes13 anteriores preservados. Diagnóstico real ainda não prova reprodução: Capitã Marvel ID299537/wTqUqYRoyNQ abriu modo card com bounds válidos e fechou por deadline sem playing observado. Primeira leitura ADB encontrou Fire adormecido e houve tentativa indevida no card Recentes que retoma VOD (HTTP403, nenhum vídeo confirmado); teste foi encerrado e aviso fechado, não atribuir ao trailer. Persistência privada/fonte não lidas nem exportadas. Validação integral/browser/hardware ainda PENDING.


## Evidência física e ajuste nominal de inicialização — antes da edição

Probe isolado com PublicTrailer card e mesmo trailer TMDB299537/wTqUqYRoyNQ, sem player da fonte: API pronta em torno6.4s, buffering/time0 em9.0s e11.3s; playing em13.3s/time2.89,15.3s/time4.91,17.4s/time6.98, muted=true. A tentativa do card instalado era encerrada pelo deadline8s. Esses números vêm da saída observada do probe-timed, cuja coleta final falhou por timeout CDP do host; não declarar harness completo PASS ou fluxo automático corrigido por esse teste isolado. O modal público anterior também foi observado em ended/time31.137958 de31.137958.

Ajustar SOMENTE o chamador card para startup25s, mantendo padrão8s da classe CardPreviewSession e os13 testes anteriores. Adaptador card também25s, imagem até playing/tempo finito45s/cancel de foco intactos. Estado player-paused antes do primeiro playing não é falha comprovada, não encerrar por esse estado transitório; lifecycle paused/erro/bloqueio/ended continuam encerrando. Nenhuma ampliação de tempo do player principal/Live, fonte ou serviço TMDB8s. Sem instalação de binário novo. Produção2 arquivos já constam na allowlist candidata anterior; recalcular novo recibo35 em rascunho com backup e repetir validação.


## Ports legados adjudicados antes da edição — allowlist candidata27

Primeira regressão completa passou188 controles e18 suítes, falhou em série poster composition por dependência controlada nova rail-pagination no fixture test-c11-artwork-visible-recovery. Acrescentar somente import/port do helper real railWindow em3 fixtures que montam MediaRail; ProgressiveCategoryRail stub só em loader de cenário legado que usa progressive=false; alias useLayoutEffect ao runner useEffect existente em1 fixture. Assertions não serão editadas. Faixa não virtual preserva children array original (produto corrigido para manter forma estável). Outras duas: test-c11-category-rails e test-c11-startup-artwork. Incluir3 scripts nos grants com predecessor/before/after reais. Testes novos e navegador montam implementação real, sem usar esses stubs.

Falha anterior pretypecheck por chain: ao incluir2 arquivos do deadline25 no rascunho faltaram predecessores; hook bloqueou antes de TSC. Corrigidos os2 grants para o predecessor Expanded Cards, sem contornar verificador; typecheck posterior passou. Browser auxiliar excedeu timeout do protocolo em avaliação longa e depois tentou serializar nó DOM (Object reference chain is too long); corrigido harness em blocos50/eventos e retorno booleano, sem enfraquecer asserts nem alterar produto para esconder erro.


## Port adicional de fixture — fronteira original verificada

Execução adicional read-only do fixture de categorias na base recebida confirmou a mesma falha Uncontrolled component dependency content-adult-policy antes do código novo. Não é falha da baseline canônica3/3 nem regressão deste patch. Para tornar a verificação pertinente executável, acrescentar port do módulo real content-adult-policy (sem stub/alterar regra/asserção) no mesmo fixture já na allowlist. Nenhuma afirmação de PASS sobre a execução antiga. Repetir fixture e validação completa após novo hash do rascunho35, preservando rascunho anterior.


## Port real de metadata no fixture startup — antes da edição

O teste standalone na base recebida também falha antes do patch em dependência controlada tmdb-metadata ao montar MediaCard. Acrescentar somente port com exports reais do módulo (normalização/identidade), sem alterar assertions; arquivo já está na allowlist de ports. Baseline canônica obrigatória permanece3/3 PASS, standalone antigo é FAIL declarado.


## Correção final da propriedade da âncora — antes da edição

A primeira cadeia6 comandos e Android242/38 passou, mas nova rodada browser encontrou FIXED_ANCHOR_second: card x230 contra referência92, apesar de foco correto e largura355.55. Latest regression wins; não encerrar como PASS com base nos testes anteriores. Centralizar alinhamento no controlador de foco (um rAF cancelável por250ms e realinhamento em scroll/mutação/resize), removendo o efeito passivo de alinhamento do portal. Assim foco/âncora não dependem da montagem de artwork. Calcular padding e tail reais, manter vertical/cancel/touch e identidade. Arquivos já na allowlist. Preservar validação anterior, recalcular recibo35 em rascunho e repetir checks completos e browser com transições repetidas. Nenhuma alteração de assertion/tolerância para ocultar o erro.


## Proteção de evento de saída obsoleto — antes da edição

Teste repetido de foco ainda mostrou caso x230/âncora92, apesar do ciclo completo2 e tour2000 passarem. Navegação virtual transfere foco durante commit React; handler CARD_LEAVE incondicional pode cancelar seleção posterior se blur de outro card chegar atrasado. Proteger saída pelo elemento atual, mantendo saída real/Enter/Back/ocultar/blur da janela. Ajuste mínimo no controlador já autorizado; invariantes de foco e recursos intactas. Instrumentação auxiliar de âncora passou3 tamanhos, mas não será tratada como teste limpo; repetir sem instrumentação e preservar erros anteriores.


## Memória de seleção entre faixas virtualizadas — antes da edição

Revisão identificou que coluna lógica100 não existe entre os20 nós iniciais de outra faixa: fallback pelo último nó pode saltar ao sair/retornar. Guardar índice corrente no track virtual (já no estado MediaRail), entrar em faixa nova pelo0 e restaurar seleção montada da faixa visitada, inclusive ação Ver todos→Baixo. Somente caminhos MediaRail/useDpadNavigation já permitidos; faixas não virtuais mantêm motor anterior. Adicionar teste browser Cima/Baixo e ida/volta após índice99. Não afirmar teste físico novo do carrossel, nem tocar source/player/autorização. Recalcular rascunho35 e repetir checks.


## CANON-01-HOME-DPAD-CAROUSEL-PREVIEW-PAGINATION-02 — fechamento local — 2026-10-25

RESULT=LOCAL_READY_VALIDATION_PASS_NEW_APK_HOMOLOGATION_PENDING. Baseline3/3 e validação final R4 seis comandos/Gradle exit0.917 protegidos/35 recibos/188 controles31 suítes;185 controles30 suítes e34 recibos recebidos preservados. Nova suíte19 casos, sessão anterior13 intacta, Android242 testes38 suítes sem falhas/erros/skips (rodadas posteriores up-to-date). Browser final6 PASS, stress3 viewports com22 transições cada; fixtures não equivalem a novo APK físico. Adaptador candidato real em RAM no Fire reproduziu trailer público mudo com tempo e quadros decodificados crescentes; resolver/carrossel completo instalado não testado. Deadline card25s, espera3s, lifetime45s; demais timeouts preservados.20 iniciais/lotes20/prefetch6/DOM24, cursor local real/queue2/dedup/retry/cancel. Metadados visitados acumulam RAM até sair da Home; consumo físico/primeira instalação não medidos.25 caminhos efetivamente alterados de27 candidatos,2 Java intactos; root/base recebida e prefixos preservados; sem mudança de fonte/import/ativação/Live/VOD/Supabase. Auth SHA256 64cd3527d66926b1455727d27bac239c1b061723849c28d5aa4b3b318ad36380; recibo blobLF a91ff1c57b2c412e808fb79917fc00a1bfaa1e1e. Relatório completo C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/home-carousel-preview-02-20261025/REPORT.md. Nenhum APK novo/install/reset/Git staging/commit/push/PR/merge/remote write/deploy ou próxima implementação.
