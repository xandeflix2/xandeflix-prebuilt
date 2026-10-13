# C11 — Soulm8te: evidência do ciclo 58

2026-10-09. [Especificação e emenda anteriores ao patch](../architecture/C11_SOULM8TE_METADATA_RECOVERY.md).
Clone independente C11/main/origin esperado/Git próprio, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. Baseline privado 759 arquivos,
749 protegidos preservados, zero fora da allowlist, HEAD igual. Contratos,
Source Boundary e lock lidos. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Nenhum Git write, backend, fonte, licença, snapshot, search ou player alterado.

## Causa comprovada

Leitura privada e somente local de oito segmentos de filmes do S24, geração
estável, projeção restrita ao único título reportado: Soulm8te (2026), sem ID
ou ano separado, filename de pôster TMDB ausente entre as variantes atuais
retornadas pela API. Nenhum catálogo/URL de stream/segredo exportado.
Página real instalada DMo sem sinopse/trailer, cache match4 negativo confirmado.

API pública movie/1307118, pt-BR: HTTP200, título/ano2026, sinopse, três gêneros,
pôster/backdrop, 19 pôsteres/17 fundos e trailer YouTube em inglês. Consulta
por título+ano retorna somente esse ID. Serviço real antes do patch retorna
null com filename da fonte e resolve1307118 sem ele. Apresentação/trailer
direto pelo ID também funciona. Assim, a falha era o vínculo de identidade,
que bloqueava todos os complementos, e seu cache negativo; não falta no TMDB.
Contagens/dados públicos são observação desta rodada, não SLA permanente.

## Patch mínimo

Somente tmdb-metadata.service.ts: filename continua primeiro critério; na
ausência de confirmação, candidato único com título normalizado e ano exatos
permite recuperar metadados. Ano e título novamente conferidos nos detalhes,
ID igual, endpoints separados movie/tv. Homônimos, ano ausente/aproximado,
título aproximado e detalhes inconsistentes permanecem recusados. Não remove
o filename de todas as consultas nem fixa Soulm8te em código.

Chave match5 ignora negativos antigos sem apagar cache inteiro; positivos
match4/match3/unversioned continuam disponíveis offline conforme política
anterior. Chave com ID explícito/storagev2 mantidos. Capa válida da fonte e
catálogo permanecem intactos. Trailer/UI aproveitam vínculo recuperado, sem
alteração nesses componentes, native/Cast ou callback de reprodução.

## Verificação

Teste novo falhou antes do patch na recuperação do filename obsoleto e passou
depois. Quatro grupos PASS: recuperação/caching sem busca ampla; rejeição de
ano ausente/próximo, título fraco, homônimos e detalhes incompatíveis; prioridade
filename/isolamento tv/ID explícito; negativo match4 e positivo offline.
Aliases3, phone movie3/series2, recuperação atual de artworks12, preparação5,
hero1 e relatos ao gestor14 PASS. Probe real após patch recupera1307118 com
mesma identidade/filename, sinopse/imagens/trailer presentes.

Suite histórica test-c11-source-first-tmdb-artwork.mjs passou seus oito grupos
de serviço/importador/cache/limites; o trecho SSR posterior falhou porque seu
loader antigo não fornece a dependência artwork-file-cache.ts do Artwork atual.
Arquivo de teste e Artwork já tinham esses mesmos conteúdos no baseline58.
Não alegar PASS completo nem relaxar assertions para mascarar a incompatibilidade.
A cobertura atual do Artwork real e QA física do APK são verificadas separadamente.

Lock22+27+9/prebuild, TypeScript/Vite, cap sync e Gradle assembleDebug/
testDebugUnitTest PASS. Java148, zero failures/errors, tarefas nativas reutilizadas
sem mudança Java. Warnings preexistentes Node externalizado/import misto/chunk/
flatDir. Seis assets do APK iguais a dist; pacote/certificado/SDK/standalone
conferidos, marcadores match5/relatos C57 preservados.

## Entrega

APK Xandeflix-v1.0.0-standalone.apk, 12.400.179 bytes,
SHA256 AEDDAAEAE9EA018BC311CD2E0C3D68048336FDCC16A8EBA919D2781BFDFD8F87,
bundle index-Bx2LEpNP.js, certificado
b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d,
package com.xandeflix.prebuilt, version1.0/code1, min23/target35,
https localhost sem servidor remoto. Install -r S24 SM-S926B concluído,
hash instalado igual ao artefato, firstInstallTime e cinco grupos privados
preservados com zero mudanças: 761 arquivos, 718 catálogo, cinco nativos;
auditoria UTC2026-10-09T21:16:40.353Z. Primeira tentativa terminou antes de
instalar com falha genérica de comando na conferência privada; repetição com
etapa identificada passou sem relaxar proteção/comparação.

QA física na página real compilada index-Bx2LEpNP.js, aberta por busca no S24,
sem fixture/import dev/cache injetado: sinopse presente, duração1h41min,
classificação16+, backdrop horizontal decodificado, trailer YouTube correto
DF9I1wLlXbk com botões habilitados e cache match5 positivo1307118. Screenshot
conferido; imagens visíveis carregadas pelo cache nativo local. Rótulo da
assertion privada de botão foi corrigido para incluir seu ícone de play;
nenhuma mudança adicional no app. Não iniciado playback do trailer/filme,
mensagens, avaliação, favorito ou transmissão. Teste certifica recuperação
de apresentação desta obra, não catálogo universal ou transmissão AirScreen.
Tablet e Fire1 conservam C57/1FFC; Fire107 sem conexão e S23 excluído.
