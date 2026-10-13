# C92 — Deslize e marcadores do hero

## Autorização e preflight — 2026-10-12

Pedido do usuário: troca por deslize lateral, apenas marcadores circulares em
substituição às setas/contador/pausa, mantendo transição automática a cada dez
segundos na Home, Filmes e Séries. Ciclo local CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Patch, verificações e APK16 locais; nenhuma publicação,
instalação em aparelho ou operação Git autorizada.

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main; main;
origin https://github.com/xandeflix2/xandeflix-prebuilt.git;
HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture/Execution,
Source Data Boundary e Activation Lock lidos. Baseline SHA-256 privado antes
do patch; lock inicial PASS. Workspace histórico e projeto protegido intocados.

## Especificação anterior ao código

- Carrossel compartilhado: deslize para esquerda avança, para direita retorna.
  Apenas ponteiro primário touch/pen iniciado fora de controles interativos.
  Exigir distância mínima proporcional à largura, predominância horizontal e
  gesto de até 1,5 segundo. Cancelamento, rolagem vertical, multitoque e arraste
  de mouse não trocam o destaque. Preservar rolagem vertical e zoom nativos.
- Durante o gesto suspender o timer; ao concluir reiniciar dez segundos.
  Evitar clique involuntário em Ver Detalhes após deslize reconhecido.
- Substituir setas/contador/pausa por botões circulares, posição ativa preenchida,
  nome acessível com posição/título e foco visível. Clique/toque escolhe posição;
  foco estável por posição permite teclado/D-pad. Toque não prende pausa por
  hover sintético nem mantém foco no marcador. Ver Detalhes preservado.
- Preservar pausas por foco/hover de mouse, documento oculto, fora da tela e
  movimento reduzido; seleção de destaques, filtros, imagens/cache e próximo
  lote existentes. Um candidato/vazio não recebe controles de carrossel.
- Layout responsivo sem overflow: celular vertical, tablet/TV horizontais.
  Categorias específicas e detalhes estáticos permanecem conforme contrato C91.
- APK local versionCode16/versionName1.0.16; package/assinatura/updater mantidos.

## Allowlist estrita

- src/ui/components/HomeHero.tsx (gestos, timer, marcadores);
- src/index.css (somente estilos do carrossel);
- android/app/build.gradle (somente versão);
- scripts/test-c11-hero-swipe-dots.mjs (novo teste);
- este contrato e docs/evidence/C11_HERO_SWIPE_DOTS.md;
- acréscimos docs/{STATUS,EVOLUTION_REPORT,DECISIONS,ERRORS_AND_BLOCKERS}.md;
- tmp/c92-hero-swipe-dots/** e saídas ignoradas usuais de build/Capacitor/Gradle.

Sem alteração em backend, Supabase, ativação, catálogos, player, dependências,
credenciais ou arquivos de ambientes. Preservar hashes fora da allowlist/HEAD.

## Aceitação

Teste de limites/direções do gesto, regressões existentes, browser isolado com
componentes reais em celular/tablet/TV: deslizes, rolagem/cancelamento, marcadores,
foco, ausência de clique acidental, timer de dez segundos e pausas existentes.
Typecheck, build/lock, APK16: assets, versão, assinatura e updater verificados.
Registrar limites: browser não certifica instalação física nem publicação.

## Complemento solicitado durante a execução

Usuário pediu modelos para aprovação da tela Canais em dobrável quase quadrado.
Somente prévia interativa privada em tmp/c92-hero-swipe-dots/fold-channel-models.html:
comparar prévia compacta superior e duas colunas, proporção baseada nas imagens
fornecidas. Nenhuma mudança funcional do player/Canais antes da escolha do modelo.
Este complemento não inicia outro Gate nem amplia a allowlist funcional.
