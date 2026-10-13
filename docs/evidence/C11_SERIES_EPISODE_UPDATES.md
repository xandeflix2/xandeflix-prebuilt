# C11 — Séries novas e episódios novos em Destaques e heroes (ciclo61)

Pedido direto de 2026-10-09, especificado antes do código em
[C11_SERIES_EPISODE_UPDATES.md](../architecture/C11_SERIES_EPISODE_UPDATES.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR ou próximo Gate.

## Proveniência e limites

Preflight read-only completo no clone independente
`C:\Xandeflix\xandeflix-prebuilt-c11-main`, branch main/origin canônico
`https://github.com/xandeflix2/xandeflix-prebuilt.git`, HEAD
`61ec00902be5d0037adf79c68b3a8624b3a2bd6e`. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos; lock passou antes e no prebuild.
Baseline privado771 arquivos anterior ao patch em
`tmp/c11-series-episode-updates-20261009/baseline.json`. Alterações prévias
preservadas. Allowlist explícita na especificação; relatório final por SHA-256.
Nenhum backend/migration/env/fonte/identidade/licença/projeto protegido alterado.

## Comportamento entregue

Inventário v1 aditivo conserva datas dos títulos; referência numérica de episódios
completa por série/fonte em IndexedDB. Primeira leitura de episódios, inclusive
mesma geração já conhecida, cria baseline sem inventar adições históricas.
Nova série recebe **Novidade**; série conhecida com nova combinação de temporada
e número de episódio recebe **Episódios Novos**. Janela sete dias corridos desde
detecção local, com Novidade prevalecendo. Nova adição de episódios renova apenas
o prazo de episódios. Reboot, IDs ordinais, reordem, URL, capa/metadados, remoção
e reinserção de coordenada já vista não renovam. Temporada vazia não é adição.
Datas são locais ao aparelho, não a data global comprovada de inserção da fonte.
Homônimos indistinguíveis compartilham referência; renomear pode parecer título novo.

Scan local de segmentos completo/cooperativo, batches200; limites100000 hashes,
1000000 registros/coordenadas de episódios,500000 temporadas. Inventário contém
somente hashes/datas/faixas numéricas; objetos de episódios/stream não persistidos.
Contagens incompletas, órfãos, coordenadas inválidas, abort, mudança de geração
e conflito CAS preservam referência anterior sem publicação parcial. Nenhuma
consulta adicional ao TMDB/fonte por capa; bootstrap/imagens não aguardam scan.

Séries recentes/atualizadas resolvidas fora do first-fold, no máximo100 view models,
prioridade por detecção mais recente em Home, overview Séries e Ver todos de
Séries em Destaque, mesma seleção20 complementada pela anterior. Hero Home aceita
séries antigas com novos episódios, conservando cotas de filmes/séries e imagem
válida; hero Séries/categoria prioriza apenas séries da categoria escolhida.
Selos em MediaCard/hero; label acessível, sem alvo novo de foco ou mudança das
dimensões das capas. Publicação da lista adiada enquanto foco está em rail/grid,
preservando D-pad, inclusive na expiração: selo sai no prazo e seleção fica
estável até o foco sair da região. Callback de disponibilidade do provider
mantém o store sem dependência de DOM. Relógio compartilhado/assinaturas
estáveis/cleanup e abort.
Filmes, ordem canônica de categorias, Recentes assistidos e playback preservados.

## Verificação

- Suite nova15 grupos PASS, incluindo migração, hole/new-season/same-count
  replacement, não adições, falhas/abort/CAS/fonte, expiração e escopo por categoria.
  TSX real Home/Browse/Collection e hook real HomeHero concordam com seleção20.
- Escala250000 episódios/1000 séries PASS; referência compactada211001 bytes
  na fixture, first-fold com1 episódio; dado empírico, não SLA.
- Regressões: Novidade12, categorias7, ordem overview4, coleções Home3,
  hero Home11 grupos, elegibilidade de imagem hero1, D-pad rail/detalhes/séries8,
  hero D-pad4, refresh automático19 PASS. Ports históricos atualizados somente
  para imports/hooks novos e dependências SSR já existentes, assertions preservadas.
- TypeScript PASS; revisão React: hooks incondicionais, getters estáveis,
  um scan/provider, nenhum I/O por card, foco/aria, timers/listeners cancelados.
- Browser isolado com React/CSS reais e IndexedDB real: scan completo → persistir
  → reiniciar → dois selos → prioridade/hero → expirar PASS;5 validações de banco,
  foco preservado durante atualização e expiração, prioridade publicada e
  seleção expirada retirada ao sair do rail.
  Phone412x915/tablet1280x800/Fire960x540: dois labels cabem,21 alvos na faixa
  (20 cards+Ver todos),20 imagens decodificadas após rolar horizontalmente,
  hero com série atualizada/selo e zero erros. Imagens controladas sintéticas,
  não prova de TMDB/rede/aparelho comercial. Fonte/histórico reais não semeados.
- `npm run build`: lock22+27+9 e TypeScript/Vite PASS; `npx cap sync android` PASS;
  Gradle assembleDebug/testDebugUnitTest PASS,148 testes Java/zero falhas/erros.
  Avisos Vite de chunks/imports e Gradle flatDir preexistentes não impedem build.

APK final `Xandeflix-v1.0-build3-standalone.apk`, versionCode3/versionName1.0
(preserva contrato RPC de diagnóstico),11076539 bytes, SHA-256
`364A7E20BB2B25B0BD95EBF72BA4868519F86BC3243A979837D1AD46A3E9839E`.
JS `index-DoVPYb8F.js`, CSS `index-B5U9QEDx.css`, seis assets byte-idênticos ao
dist, standalone `https://localhost` sem server URL, package `com.xandeflix.prebuilt`,
certificado SHA-256 `b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d`.
Features anteriores/PiP/Cast/share/continuidade/diagnóstico/refresh e novo selo
verificados no APK. Build2 preservado; nenhuma atualização OTA de APK implementada.

## Entrega física e fechamento

APK final364A instalado via `install -r` e hash do base.apk igual ao artefato:

| Alvo | code/name | Arquivos privados/catálogo/estado nativo | UTC verificado |
| --- | --- | --- | --- |
| S24 RXGYB03FL4W / SM-S926B / API36 | 3/1.0 | 974/928/5 | 2026-10-10T01:59:36.518Z |
| Tablet RX2X301Q3KY / SM-X610 / API36 | 3/1.0 | 974/925/5 | 2026-10-10T02:01:11.161Z |

Em ambos: duas leituras SHA-256 em quiescência antes e depois; todos os grupos
catálogo/nativo/preferences/WebView/outros byte-idênticos, zero mudanças, mesmo
firstInstallTime. Sem desinstalação/reset/rotação. Helper de hashes em lote
validado no tablet (find-exec+ suportado), preservando mesmas validações e duas
leituras estáveis. Reabertura própria após build intermediário para conferência
não foi confundida com preservação da substituição final.

Leitura nativa read-only do catálogo ativo S24 completo:8914 séries,15834 temporadas,
221132 registros de episódios,220156 coordenadas únicas; contagens, números e
vínculos série/temporada válidos para referência, geração preservada. Nenhum
título/stream/URL/credencial copiado para relatório. Isso verifica estrutura real,
não equivale a provar uma inserção comercial/visual nos aparelhos.

Tablet e S24 fora do foreground/sem UI visível nesta conferência. Connect do próprio
MainActivity encontrou WebView inicialmente, depois o alvo deixou de responder;
tentativas limitadas, sem desbloquear OS ou capturar outras telas. Nenhum QA visual
físico integral, migração persistida de episódios ou adição real nesses aparelhos
foi declarado PASS. Pedido para mantê-los abertos/desbloqueados continua pendente;
referência aditiva/selos/prioridade/expiração provados em fluxo browser isolado.

Fire1 192.168.3.126 encontrado em NativePlayerActivity tanto antes quanto no
fechamento: sessão preservada, sem force-stop/instalação/teclas. Continua code2/name1.0
do ciclo60; **não recebeu este APK3**. Disponibilidade solicitada sem resposta nesta
rodada. Fire2/S23 excluídos. Nenhum playback/Cast iniciado; limites Luke/AirScreen
do ciclo55 não resolvidos por este patch de apresentação.

Proveniência final:749 arquivos de baseline fora da allowlist preservados, zero
alterações não autorizadas e HEAD igual. Docs de status/decisão/erros/evolução e
relatório de otimização atualizados; logs/helpers/fixtures/screenshots ignorados
em tmp privado. Encerrar servidor QA próprio e forwards próprios, sem matar
outros apps/processos ou excluir perfis de browser. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO; nenhuma operação Git/backend/env/projeto protegido.

Fixtures/falhas corrigidas: TypeScript usava categoryIds inexistente no view model,
corrigido para categoryLabels; ports de testes históricos faltavam imports novos
e dependências SSR preexistentes. Browser mock inicialmente sem export de metadata,
depois servidor Vite ignorando alterações de tmp; restart da instância privada
aplicou correção. Assert inicial exigia20 imagens fora da tela: exercício horizontal
incluído para testar lazy loading real antes de verificar todas; assertions finais
mantêm20 capas, foco/labels/hero. Helpers privados criados via PowerShell corrigiram
um caractere não ASCII no verificador antes de sua execução bem-sucedida.
Nenhuma dessas falhas foi aceita como sucesso ou corrigida alterando a fonte real.
Na revisão final, expiração poderia retirar a capa focada. Proteção aditiva
implementada/testada no store e browser real; selo expira e card permanece
até sair do rail. Node strip-only recusou parameter property no constructor:
declaração/atribuição explícitas corrigidas, suites15+12 novamente PASS, sem
alterar flags do Node ou assertions. Rebuild/lock/sync/Gradle/assets/assinatura PASS.
APK intermediário1B48/index-CoNA8lqP instalado inicialmente em tablet/S24 com
dados preservados; substituição final364A/index-DoVPYb8F registrada abaixo.
