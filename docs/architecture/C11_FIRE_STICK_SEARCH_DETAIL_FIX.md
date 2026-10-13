# C11 — busca e detalhes no Fire Stick — 2026-10-06

Pedido explícito do usuário: após o layout exclusivo de celulares, diagnosticar
e corrigir fechamento ao selecionar capa na busca. Tablet informado funcional.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Ciclo local, sem Git/backend/reset.
Workspace único C:\Xandeflix\xandeflix-prebuilt-c11-main, clone independente,
main, origin xandeflix2/xandeflix-prebuilt, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Contratos e lock lidos.

## Handoff mobile

Typecheck, testes funcionais de extras/preferências/share, regressões SSR e Java
PASS. Browser phone: lista sem imagens, abas exclusivas, 20 semelhantes/2 colunas,
episódio da temporada selecionada, favoritos/avaliação após reload, share público,
trailer nativo simulado com bounds/ocultação, ausência honesta e retry do loader.
Tablet e TV preservam pôster/backdrop/rail; zero erros no fixture. Compilação e
entrega física finais ainda pendentes do diagnóstico Fire. Nenhuma alegação de
reprodução física de trailer ou certificação Cast a partir desses mocks.

## Diagnóstico autorizado antes de qualquer patch

Fire 192.168.3.103:5555, AFTSSS/API28, com.xandeflix.prebuilt. Abrir normalmente,
buscar títulos públicos e selecionar pelo d-pad ou toque ADB; sem iniciar vídeo
privado, coletar heap dump, limpar dados, desinstalar ou mudar identidade/licença.
Logs processados em RAM, somente falhas/milestones sanitizados e memória numérica
persistidos. CDP somente WebView do PID confirmado, forward loopback próprio,
removido ao finalizar. Não retornar fonte/token/credenciais ou console bruto.

Observação inicial: buffer crash sem AndroidRuntime deste pacote. Busca Matrix
retornou quatro títulos. Isso não confirma nem refuta o fechamento relatado.
O patch deve depender da reprodução ou de um mecanismo reproduzido em teste.
Allowlist funcional será explicitada por adendo antes do código, com baseline
separado após o ciclo mobile. Sem refactor especulativo ou alteração de C9.

## Aceitação

Fluxo físico busca→filme e busca→série, navegação/retorno e estabilidade, memória
e causa registrada quando observável. Teste significativo do mecanismo corrigido,
regressões afetadas, lock/typecheck/build/Java, APK com mesma identidade/assinatura.
Atualização install-r previamente autorizada, dados privados comparados em RAM,
sem reset. Relatório distingue observação, hipótese, correção e limitações.
Pedido adicional de tamanho do hero está aguardando esclarecimento de proporção;
não deve ampliar esta correção de estabilidade sem especificação própria.

## Adendo anterior ao patch funcional

Pedido posterior esclareceu: aumentar hero **interno** de filme/série e colocar
imagem de fundo. Escopo Fire, conforme contexto, preservando celular e tablet.
Protetor:11 resultados, duas entradas O Protetor e série A Protetora abriram
fisicamente pelo DPAD_CENTER; processo vivo, sem AndroidRuntime. Encerramento
observado às21:50 foi app-request após BACK durante o harness, não crash da capa.
Há registros históricos LMK/tombstone, sem associação causal confirmada ao clique.

Mecanismo reproduzível no código: SearchResults dispara resolução de todos os
resultados em paralelo; cada um varre segmentos sem coordenação/dedup, e detalhe
pode repetir a mesma varredura. Corrigir esse pico de leituras é autorizado;
não afirmar que prova a causa do fechamento físico relatado.

Allowlist funcional: src/catalog/canonical-item-resolver.ts (fila única de
resoluções, dedup por kind/id, até32 pendentes, limpeza antes de publicar resultado,
sem materializar catálogo/cache negativo/persistência); src/ui/components/
SearchResults.tsx (hidratação sequencial, interrupção entre itens ao desmontar ou
trocar consulta, erros tratados); src/ui/pages/{MovieDetailPage,SeriesDetailPage}.tsx
(falha do resolver encerra loading e mostra retry, sem mensagem privada).
scripts/test-c11-fire-search-detail.mjs e regressões relevantes, este contrato,
evidência C11_FIRE_STICK_SEARCH_DETAIL_FIX, adendo no relatório e memórias append-only.

Hero: nas mesmas páginas, classe derivada de UA AFT somente para Fire; src/index.css
regra específica que vence o compacto atual220px: altura mínima próxima65vh,
pôster maior proporcional, fundo horizontal TMDB existente e legibilidade.
Não deformar imagem vertical para fabricar horizontal. Onde TMDB não confirma
homônimo sem ano/ID/pôster público, continuar fallback honesto; O Protetor/O Protetor2
têm vários homônimos reais e falta ano/ID na fonte. Não baixar o limite de confiança
nem vincular arbitrariamente as duas versões ao mesmo filme.

Baseline mobile congelado antes dessas mudanças. Lock antes/depois/build obrigatório.
Testes do mecanismo precisam demonstrar leituras simultâneas no baseline e uma
leitura no patch, dedup, kind correto, erro sem envenenamento, quota e snapshot.
