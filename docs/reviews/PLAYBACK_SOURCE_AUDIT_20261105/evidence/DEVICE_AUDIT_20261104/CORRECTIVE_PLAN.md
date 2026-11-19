# Correções mínimas propostas a partir da auditoria

Documento de preparação e critérios de aceitação. Nenhum patch de produto aplicado. Não equivale a gate aprovado nem altera recibos anteriores.

## 1. Fonte nova: falha real de transporte/API

Evidência: tablet e celular não receberam dados de episódios válidos nas consultas auditadas. Após a troca da internet, o celular recebeu HTTP 404 tanto na consulta de série quanto na consulta básica da API; o tablet ainda falhou antes de resposta HTTP. Filme no celular falhou ao abrir a mídia (Media3 2001/DATASOURCE_OPEN). Não há prova de que o parser seja a causa desses resultados.

Próximo passo mínimo: confirmar com a fonte se a configuração fornecida suporta a API de diretório requerida e qual é o endpoint autorizado. Uma playlist M3U válida não comprova disponibilidade da API Xtream derivada. Conferir o mesmo conteúdo em outro player pode ajudar a separar indisponibilidade da fonte e incompatibilidade do aplicativo; o usuário informou que ainda não fez essa comparação.

Se for necessário corrigir o app, especificar primeiro um diagnóstico sanitizado que distinga API indisponível, resposta HTTP, erro de transporte e payload inválido. Não mostrar URLs/credenciais, inventar episódios, reutilizar catálogo de outra fonte ou fazer fallback para hosts não autorizados. Revalidar fonte/geração/snapshot. Acrescentar testes de erro sem enfraquecer os existentes.

## 2. Loading entre episódios

Arquivo: `android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java`.

Caminho observado: `requestEpisode` exibe o overlay; `replaceEpisode`/`setupFromIntent` chama `resetNextEpisodeState`; esse reset oculta o overlay antes de `playCandidate`. O callback `onRenderedFirstFrame` também o oculta, mas isso não impede a remoção precoce. O código correspondente foi corroborado no APK de SHA-256 0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29.

Patch mínimo futuro: separar o reset da oferta de créditos da limpeza da transição; preservar o overlay durante a substituição até primeiro quadro, falha ou cancelamento definitivo. Definir o que acontece no timeout e na saída. Não retirar o guard de 30 segundos sem especificação.

Testes exigidos: ordem de eventos real do controlador, primeiro quadro atrasado, resolução assíncrona falha, player falha, Voltar, pausa/saída, resposta antiga e transições duplicadas. Uma simulação de lista que repete a fórmula do código não testa o ciclo de vida real.

## 3. Avanço antecipado não vinculado ao G3

Arquivo nativo acima, `checkCreditsMarker`/`startCountdownTimer`.

O código usa fim menos 45 segundos para duração acima de 25 minutos, ou menos 35 segundos para os demais casos, e solicita o próximo após cinco segundos. Não chama o validador G3. `onPause` não cancela explicitamente essa contagem; a possibilidade de avançar em background é risco estático, não uma reprodução física comprovada nesta auditoria.

Decisão mínima necessária: aprovar a regularização desse fluxo no baseline correto. Recomenda-se retirar a oferta antecipada sem marcador confiável, preservando o próximo manual e `STATE_ENDED`, até uma integração futura G2/G3. Não alterar automaticamente um comportamento de produção por consequência da auditoria.

Testes exigidos: nenhum avanço antecipado sem G3 válido; pausa/saída/sessão alterada cancela oferta e timer; natural-end e botão manual continuam funcionando; histórico grava o episódio correto uma única vez.

## 4. Controles no celular e margens

Runtime atual: tablet apresentou Voltar/Cast dentro do hero; Fire não apresentou esses controles no hero. No celular, o hero começa 12 CSS px após o cabeçalho, mas Voltar e Cast continuam visíveis abaixo do conteúdo da página. Se a regra anterior de ocultá-los no celular permanece vigente, há uma pendência real; não declarar conformidade integral.

Próximo patch deve fixar allowlist das páginas/layouts e testar telefone/tablet/TV por detecção de dispositivo já existente, sem esconder ações essenciais de navegação. Comparar Home/Filmes/Séries/Canais e páginas internas na mesma viewport e scroll. A coleta atual de detalhes não certifica todas as páginas nem orientações.

## 5. Baseline e autorização antes de editar

O candidato Next Episode em `NEXT_EPISODE_G2_A22_CANDIDATE/workspace` está em main e preserva G2/G3. O root `xandeflix-prebuilt-c11-main` está em `fix/source-output-format-recovery` com mudanças adicionais. Não transferir patches entre eles nem trocar branches para contornar o preflight.

É necessário reconciliar a proveniência e as restrições contraditórias de `CANON-01-PERF-PARENTAL-HERO-REFINEMENT.json`, incluindo `androidBuildAuthorized:false` e restrição a mudanças de player/UI/build/install apesar dos arquivos e evidências associados. O verificador de hashes não adjudica essas permissões. A ordem atual autoriza auditoria/correções, mas não torna verdadeiras alegações históricas não comprovadas.

Após escolha expressa do baseline/gate: especificação, allowlist exata, recibos aditivos legítimos, supersedes correto, revisão nominal da expectativa estrita do runner se houver novo recibo, testes originais + novos negativos, versão/manifesto de artefato e autorização de build/entrega. Não editar recibos históricos nem reaproveitar o número 52 para um novo artefato sem decisão de versionamento.
