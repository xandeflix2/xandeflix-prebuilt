# C11 — Lacunas de metadados/imagens/trailers (ciclo62)

Pedido direto de 2026-10-10. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
Preflight read-only no clone C11 independente/main, origin canônico, HEAD
61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos. Baseline776 arquivos antes do patch
em tmp/c11-public-metadata-gaps-20261010. Git/backend/env/fonte protegidos.

## Escopo anterior ao código

1. Diagnosticar os seis nomes públicos apresentados: Ataque Terrorista,
   Círculo de Fogo, Círculo de Fogo - Pacific Rim, Alvo Duplo, O Matador,
   Rastro Mortal. Ler somente catálogo autorizado local já existente no tablet;
   reportar presença de campos/identidade pública, nunca URL/credencial de stream.
   Sem novo import/promoção/reset/identidade/source delivery/playback.
2. Comparar com respostas públicas TMDB usando credencial já configurada somente
   em memória, sem imprimir/gravar segredo. Traçar catálogo → identidade → API
   pública → cache/serviço → UI. Diferenciar campos ausentes na fonte, falha de
   correspondência/filtragem/cache/rede e material realmente indisponível.
3. Pesquisar documentação oficial de API complementar de imagens/metadados.
   Não criar conta/assinatura/chave ou usar segredo de terceiros. Nova integração
   autenticada depende de chave do projeto configurada privadamente pelo usuário.
   Não preencher lacunas com dados de homônimo ou imagens/trailers arbitrários.
4. Registrar achados e emendar critérios funcionais antes de implementar fix
   mínimo no enriquecimento público. Preservar filename/ID/ano e rejeição de
   ambiguidade, rede limitada/cache/concurrency, fonte/playback/ativação/selos.
5. Se houver patch, testar negativos e regressões relevantes, TypeScript/build,
   lock/assinatura/assets e QA do fluxo completo. APK4/name1.0 somente se entregue,
   mesmo package/certificado/RPC; substituir com dados preservados em alvos já
   autorizados somente disponíveis/sem playback ativo. Sem interromper outros
   apps/desbloquear OS ou alegar QA físico inexistente. Fire2/S23 excluídos.

## Allowlist estrita

Este documento; docs/evidence/C11_PUBLIC_METADATA_GAP_RECOVERY.md;
docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md;
docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md;
src/artwork/tmdb-metadata.service.ts; src/artwork/series-presentation.service.ts;
src/artwork/poster-identity.ts (novo); src/artwork/hero-artwork.service.ts;
src/ui/{pages/MovieDetailPage.tsx,pages/SeriesDetailPage.tsx,
components/Artwork.tsx,components/Hero.tsx,components/PhoneMovieDetail.tsx,
components/PhoneSeriesDetail.tsx,components/DetailTrailer.tsx};
src/ui/hooks/useArtworkMetadata.ts (se retry/cache preciso);
novo serviço src/artwork/fanart-artwork.service.ts somente após critério/chave;
src/artwork/{artwork-uri,image-load-queue,artwork-file-cache}.ts somente se
integração complementar for concretizada e documentada previamente;
scripts/test-c11-public-metadata-gaps.mjs (novo);
scripts/test-c11-{metadata-match-recovery,tmdb-alias-recovery,source-first-tmdb-artwork}.mjs
apenas extensão de critérios negativos ou ports necessários, não relaxar assertions;
android/app/build.gradle somente incremento code4/name1.0;
saídas ignoradas build/Capacitor/APK/tsconfig.tsbuildinfo e helpers privados
tmp/c11-public-metadata-gaps-20261010. Não autoriza editar arquivo .env nem
implementar API de imagens sem identidade comprovada ou requisitos registrados.

## Achados e critérios funcionais anteriores ao patch (2026-10-10)

Catálogo real do tablet: 17152 filmes, sete registros dos seis nomes, geração
preservada. Nenhum ano/ID/sinopse/duração/trailer nesses registros; poster e
backdrop são a mesma imagem vertical. Sete referências de capa HTTP200/imagem.
API TMDB HTTP200: homônimos reais impedem correspondência só por título;
composição traduzido + original não reconhecida. Quatro referências hospedadas
fora do TMDB mantêm filename presente nas imagens oficiais da obra. Todos os
sete candidatos corretos inspecionados têm overview/backdrop/trailer no TMDB.
Usuário esclareceu que ano/ID frequentemente continuarão ausentes: não exigir
cadastro manual nem escolher homônimo por popularidade. Chave Fanart ausente;
Fanart/OMDb também dependem da identidade e não corrigem essa ambiguidade sozinhos.

- Reconhecer composição exata dos dois nomes oficiais, nos dois sentidos,
  separada por hífen/traço espaçado. Não remover metade do nome para fazer match.
  Preservar ano, tipo, filename, ID e rejeição de duas obras compatíveis.
- Extrair de URI pública sem credenciais/query um hint de filename opaco TMDB
  (27 caracteres alfanuméricos, não digest hexadecimal) mesmo em outro host.
  Hint só aceita obra com título forte e filename confirmado pela própria API;
  não enviar URI/host de fonte à API pública nem converter URI original.
- Para homônimos fortes sem ID/filename, comparar localmente a capa existente
  com até oito miniaturas oficiais w92 por candidato, até seis candidatos fortes.
  Mesma proporção, comparação RGB normalizada estrita, textura/contraste mínimos,
  rejeição de imagem vazia/erro/CORS, incompatibilidade e múltiplas obras.
  Nenhum OCR/IA externo, upload de capa/source URI ou inferência por elenco.
  Comparação só no enriquecimento demandado, máximo dois jobs já existente,
  transporte/cache de imagens existentes, prazo limitado e RAM/cache limitados;
  nenhum scan/import/download de catálogo inteiro ou espera de shell.
  Prazo da comparação16s, cache96 amostras RGB24x36 somente RAM. Oito variantes
  são necessárias para capas antigas; w92 reduz bytes em relação à capa w342.
  Browser comum sem CORS pode rejeitar comparação; cache nativo Android permite
  leitura local. QA isolada modela esse transporte local sem mudar produção.
  Comparação RGB: MAE<=10, MSE<=225, no máximo12% canais com diferença>24,
  variância>=484 e proporção com diferença<=0.025. O mesmo poster antigo de
  O Matador2005/recompressão w92 mediu MAE7.93/MSE173.88/9.07%; outros posters
  dessa obra MAE>=94.7. Não relaxar rejeição de duplicidade/homônimos/blank/CORS.
- sourcePosterUri somente RAM/IPC/cache nativo já existente. Cache de mapping
  match6 distingue capas de homônimos por hash opaco; URL não é persistida no
  cache de metadados. Não reutilizar mapping antigo só por nome para duas capas
  diferentes. Manter positivos antigos comprovados por ID/filename e negativos
  antigos não prendem novo matching. Timeout/transporte não vira ausência24h.
- Propagar a identidade completa entre metadata, hero, capa e trailer, nos três
  perfis, sem mudar layout, foco, playback, ações, origem ou inventário de selos.
  Trailer continua oficial YouTube via ID confirmado, pt/en/null; não inventar
  mídia inexistente. Novo fornecedor não será ativado sem chave privada do
  projeto; avaliação oficial deve esclarecer limite e não prometer cobertura100%.
- Verificar positivos/negativos de composição/filename/comparação/cache,
  homônimos com duas capas independentes, fonte/API reais e UI na disponibilidade
  real do tablet. Resultados de modelo/browser não substituem QA físico.

## Ampliação da conferência autorizada pelo usuário (2026-10-10)

Usuário solicitou avaliar outros filmes além dos exemplos e suspendeu testes no
Fire Stick. No mesmo ciclo62, ampliar somente a auditoria local read-only e QA
com até12 filmes adicionais que não tragam sinopse/ano/ID/imagens na fonte,
incluindo referências de capa ausentes quando existirem. Contar a presença de
campos no catálogo local não equivale a varrer APIs ou validar todos os títulos.
Seleção determinística, não adulta, distribuída entre posições do catálogo;
URLs/streams permanecem somente RAM. Não consultar todos os17152 títulos na API,
não promover/resetar catálogo e não alterar algoritmos sem novo achado/critério.
Verificar fluxo compilado no tablet/S24 disponíveis, mantendo fonte-first,
rejeição de homônimos, limites anteriores e precisão do relatório. Filme ainda
sem match/arte/trailer deve ser registrado como lacuna real, não sucesso100%.
Fire Stick1 já recebeu APK4 antes da suspensão; não realizar QA físico posterior.

## Critério anterior ao fix encontrado na amostra ampliada

Em12 títulos adicionais reais,11 recuperaram metadados; Para Sempre Cinderela [L]
permaneceu sem match, embora busca pública retorne obra9454/1998. Normalização
atual remove colchetes mas conserva L como parte do título, impedindo ranking
forte/filename. Tratar somente sufixo literal [L], precedido de espaço e no fim
ou imediatamente antes de ano19xx/20xx já extraído do título; rótulo de Legendados da
fonte permanece na UI, nome do catálogo não é alterado. Não remover L isolado,
colchetes de título legítimo, tag no meio ou letra sem colchetes. Preservar ID,
ano/tipo, hints/imagens oficiais e rejeição de ambiguidade. Normalização diferente
gera chave match6 diferente, não expurgar cache/storage/snapshot/inventário.
Teste negativo/positivo do sufixo e request normalizado antes/depois, suites
relevantes/build/assinatura e QA repetida do caso no tablet, S24 se disponível.
Sem novo fornecedor ou alteração de série/presentation/playback. Ausência de
trailer nos IDs1006381/991565/1326790 confirmada na API pública pt/en/null e língua
original; não inventar vídeos nem preencher com filme homônimo.

## Entrega final no Fire Stick autorizada — 2026-10-10

Pedido posterior explícito do usuário: instalar no Fire Stick. Retomar somente
a entrega da revisão final já validada no tablet/S24 ao Fire Stick1 AFTSSS,
serial G071EL13142513WK, conexão192.168.3.126:5555. Essa autorização substitui
a suspensão anterior apenas quanto à instalação; não retoma QA de interface ou
playback. Fire2/S23 permanecem excluídos. CURRENT_GATE=NONE; nenhum novo Gate.

Entregar o APK4/name1.0 existente, SHA256
D41E0B6A8F54B22CBCE43F867005A23A867BE34B15A0DCF90A145BF7B2B66CEF,
sem rebuild ou mudança funcional. Lock obrigatório antes da entrega. Confirmar
identidade do alvo e ausência de reprodução nativa ativa antes de install -r,
mesmo package/certificado. Comparar hashes dos arquivos privados/catálogo e
firstInstallTime antes/depois, conferir hash do APK instalado. Sem uninstall,
reset, rotação, abertura automática do app, operação em outro app, backend/env
ou Git. Preservar a evidência da instalação inicial e registrar separadamente
esta entrega final na allowlist documental já existente.
