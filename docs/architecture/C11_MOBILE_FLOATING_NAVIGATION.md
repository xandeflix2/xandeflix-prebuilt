# C120 — menu mobile em cápsula flutuante — 2026-10-15

Pedido explícito do usuário, com referência visual Netflix: menu mobile fixo
na base, flutuante, moderno e arredondado. Especificação anterior ao CSS.
Preflight: clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, top-level
próprio, main/origin esperados, HEAD0f68f169f7728fae17c8311832b7643629e97a02.
AGENTS/Architecture/Execution/Activation Lock e contrato lateral lidos.
Baseline privado1044 arquivos, CSS anterior preservado em
tmp/c120-mobile-floating-navigation. Lock inicial26+27+9 PASS. Proveniência
C107–C119 preservada. CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C120;
NEXT_GATE_STARTED=NAO. Sem Git/backend/install/reset/updater ou novo Gate.

## Especificação e aceitação

- Somente menu inferior existente até600 CSS px: cápsula centralizada de até
  420px, afastamento lateral16px e inferior12px mais safe-area, altura64px,
  cantos totalmente arredondados, borda discreta/sombra e fundo escuro
  translúcido com blur limitado ao próprio menu. Sem imagens/SDK/dependências.
- Conservar quatro atalhos/ícones/callbacks/ARIA atuais: Filmes, Séries, Canais,
  Busca. Exibir nomes existentes abaixo dos ícones24px. Item ativo com cápsula
  cinza discreta e texto claro; retirar glow vermelho apenas deste menu,
  mantendo foco de teclado perceptível e alvos de toque de pelo menos44px.
  Início/Voltar/Configurações continuam nos locais atuais, sem novas rotas.
- Reutilizar regras de visibilidade existentes: tablet/TV/sidebar/quadrado
  continuam com sua navegação. Não alterar header/hero/gestos/handlers nem
  a classificação de dispositivo. A aparência é inspirada na referência,
  sem copiar ícones/marca/atalhos da Netflix.
- Reservar90px mais safe-area no fim do conteúdo mobile elegível; adaptar
  também --live-bottom-space para manter guia/listas da página Live acima
  da barra. Não impor essa reserva em tablet retrato/sidebar/Live quadrado,
  onde o menu inferior já é ocultado. Dobrável aberto acima600px mantém layout.
- Verificar visualmente Header/CSS reais em browser isolado, larguras320,
  360/390/430/600, item ativo/callbacks, rolagem profunda e último item,
  safe-area simulada, foco de teclado, ausência de overflow e exclusão dos
  demais perfis. Fixture local ignorada, sem suíte nova para patch CSS simples.
- Build/lock obrigatório, sync/Gradle e APK local C120 recuperável, assets e
  assinatura conferidos contra C119. Sem instalação física automática.

## Allowlist estrita

src/index.css exclusivamente navegação mobile/reserva inferior;
este documento e docs/evidence/C11_MOBILE_FLOATING_NAVIGATION.md;
docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md append-only;
artefatos ignorados tmp/c120-mobile-floating-navigation, dist/Capacitor/Gradle/
APK/tsconfig.tsbuildinfo. Nenhum TSX/JS de produção ou teste versionado novo;
fonte/catálogo/busca/player/ativação/persistência/configuração intactos.
