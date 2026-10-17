# C120 — menu inferior mobile flutuante — 2026-10-15

[Especificação anterior ao CSS](../architecture/C11_MOBILE_FLOATING_NAVIGATION.md).
Clone ativo C11-main, main/origin esperados, HEAD
0f68f169f7728fae17c8311832b7643629e97a02. Baseline1044 arquivos; AGENTS,
Architecture/Execution/Activation Lock e contrato lateral lidos. C107–C119
preservados. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Nenhum Git/backend/env/
install/reset/updater; produção alterada somente em src/index.css.

## Resultado

Até600px, menu inferior existente em cápsula fixada na base: altura64px,
largura máxima420px, margens laterais16px e inferior12px mais safe-area,
raio999px, borda/sombra discretas e fundo escuro90% com blur14px. Quatro
atalhos existentes Filmes/Séries/Canais/Busca, ícones24px e nomes visíveis.
Item ativo cinza translúcido/texto claro; glow vermelho removido somente
desses botões. Foco de teclado/estado is-focused mantêm contorno perceptível.

Reserva inferior90px mais safe-area, incluindo --live-bottom-space no Live
mobile, evita ocultar o último conteúdo/guia. Não imposta à sidebar/tablet
retrato/Live quadrado com navegação própria. Dobrável aberto acima600px,
tablet/TV e desktop conservam regras de menu/header existentes. Header.tsx,
AppShell e todos os callbacks/ARIA/rotas/ícones/gestos/hero intactos.
Nenhum SDK, biblioteca, imagem de produção ou alteração de dados/player.

## Inspeção visual e build

Fixture privada com Header/CSS/Live CSS reais e página sintética, Chrome/CDP
isolado sem requisições externas. Inspeção5 grupos PASS:

- Dez cenários de largura320/360/390/430/600, safe-area0 e24px. Margens,
  centralização, raio, altura, largura máxima, labels, ícones e alvos de
  toque>=44px conferidos. Safe-area24px simulada resolvendo env no CSS da
  fixture, não medição de sistema Android real.
- Rolagem profunda conserva a barra na mesma posição; último botão pode ser
  exibido inteiro acima do menu, sem overflow horizontal.
- Toques CDP reais nos quatro atalhos acionam destinos atuais; item ativo e
  aria-current se atualizam, sem brilho vermelho. Foco de teclado perceptível.
- Live stacked reserva90/114px; menus ocultos/tablet retrato inclusive500px,
  Fire960×540, dobrável800×880, Live quadrado600×650 e desktop preservam
  visibilidade/reserva/header em comparação ao CSS anterior.
- Capturas before/after inspecionadas; exemplo sintético, não catálogo real.

Primeiro ensaio usou viewport desktop com scrollbar clássica15px e expectativa
de largura mobile; por isso mediu273 em vez288px na tela320. Emulação mobile
com scrollbar sobreposta corrigiu a fixture. Nenhum ajuste de produção foi
feito para satisfazer essa diferença de ambiente. Sem nova suíte versionada
para alteração CSS de baixo impacto.

Lock inicial e prebuild final26+27+9 PASS; TypeScript/Vite, Capacitor sync e
Gradle assembleDebug PASS. Permanecem avisos anteriores Vite de imports Node
externalizados/imports estáticos-dinâmicos/chunk grande e flatDir Gradle;
nenhuma falha nova de build. Git diff --check PASS. Testes/código anteriores
preservados; nenhuma homologação física de aparelho nesta rodada.

## APK local

tmp/c120-mobile-floating-navigation/Xandeflix-v1.0.19-C120.apk,
11.447.597 bytes. SHA256:
9de88e5047fb934f8b448f927956310cf34e36115da4ecd2ed1338ccaadcffda.
Package com.xandeflix.prebuilt, code19/name1.0.19, min23/target35; sete assets
byte-idênticos ao dist, HTTPS localhost sem dev server, logging none e mesma
assinatura do C119. C119 preservado/conferido pelo SHA anterior. Artefato de
teste local recuperável, não publicado/instalado. Conferência física pendente.
Baseline, fixture/capturas, inspection.json e apk-metadata.json privados em tmp.
