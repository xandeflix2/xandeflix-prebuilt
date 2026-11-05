# Evidência Canônica — CANON-01-PERF-PARENTAL-HERO-REFINEMENT

- **GATE**: CANON-01
- **AMENDMENT**: CANON-01-PERF-PARENTAL-HERO-REFINEMENT
- **STATUS**: APPROVED_BY_CHAT_MASTER
- **TIMESTAMP**: 2026-11-03T00:55:00-03:00

## Resumo das Implementações e Diagnósticos

1. **Carregamento de Episódios de Séries ("A Nova Super Máquina" / Episódio 0)**:
   - **Causa Raiz**: O parser de detalhes da série em [source-directory-details.ts](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/src/source/source-directory-details.ts) exigia `integer(episode.episode_num, 1)` com valor mínimo 1. Séries como "A Nova Super Máquina" (ID 9726) possuem episódio piloto/especial numerado como `"0"` (`S01E00`), o que disparava `DIRECTORY_SERIES_DETAILS_INVALID`, rejeitava a promessa em `SeriesDetailPage.tsx` e exibia "0 Temporadas" e "Não foi possível carregar os episódios."
   - **Correção**: Ajustado o validador para `integer(episode.episode_num, 0)`, permitindo episódios piloto e especiais com numeração 0 sem quebrar a integridade do catálogo.

2. **Diagnóstico de Reprodução em Canais ao Vivo (`LIVE_PREVIEW_PLAYBACK_FAILED`)**:
   - O erro exibido em `TELECINE ACTION FHD [ALT]` ocorre quando o stream específico fornecido pelo servidor IPTV está offline ou indisponível (HTTP 404/indisponibilidade na origem).
   - O ExoPlayer nativo emite `onPlayerError` -> `notifyPreviewError(ERROR_LIVE_PREVIEW_PLAYBACK_FAILED)` e o app exibe a mensagem de fallback com o botão "Tentar Preview". Canais funcionais (como HBO HD, BAND SP SD, RECORD GO HD) conectam e reproduzem diretamente no player inline em tempo real.

3. **Elementos da Interface de Canais ao Vivo e Configurações**:
   - **Quantitativo de Canais**: Exibição da badge de canais totais (`2034 CANAIS`) recuperada a partir do manifesto do catálogo ativo.
   - **Botões Transmitir e Rede**: O botão Transmitir (Google Cast) está disponível em celulares e tablets (em TV/Firestick o Cast sender é ocultado por ser o receptor). O botão de status da rede (ícone Wi-Fi) está integrado diretamente abaixo do player inline junto ao badge "● AO VIVO".
   - **Teste de Velocidade**: Disponível na opção "Internet e conexão" nas Configurações com teste de latência e velocidade de download.

4. **Controle Parental**:
   - Remoção da tela intermediária "Verificando classificação…" ao abrir detalhes de filmes e séries. Renderização direta imediata do conteúdo para itens não restritos. Bloqueio estrito para conteúdos restritos.

5. **Hero Backdrop Crossfade**:
   - Camada dupla de backdrop em [Hero.tsx](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/src/ui/components/Hero.tsx) com transição acelerada por GPU (`opacity: 0 -> 1` em 350ms), eliminando cortes abruptos e flashes pretos entre heróis.

6. **Carrossel 60 FPS & D-Pad no Fire TV Stick**:
   - Aceleração de composição com hardware layers (`will-change: scroll-position`, `contain: layout paint style` e `transform: translateZ(0)`).
   - Otimização $O(1)$ no carregamento de filmografia de atores em [actor-titles.service.ts](file:///c:/Xandeflix/xandeflix-prebuilt-c11-main/src/catalog/actor-titles.service.ts).

## Verificações Canônicas
- `npm run canon:check`: PASS
- `npm run c11:new-device:lock`: PASS (26/26, 27/27, 6/6)
- `npm run canon:test`: PASS (204 controls, 42 suites)
- `npx tsc --noEmit`: PASS (0 erros)
- `npm run build`: PASS
- `assembleDebug`: BUILD SUCCESSFUL
- `adb install`: Sucesso em Fire TV Stick Lite, Galaxy Tab S9 FE e Galaxy S24+
