# C93 — Canais em tela touch quase quadrada — 2026-10-12

## Autorização e preflight

Usuário aprovou com PROSSIGA o modelo mostrado: metade esquerda prévia16:9 e
EPG, metade direita categorias/canais com rolagem independente. Applies-se
à janela touch quase quadrada, incluindo dobrável aberto, não somente por marca.
CURRENT_GATE=NONE; ciclo local autorizado, NEXT_GATE_STARTED=NAO.

Workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos; dirty cumulativo conhecido
preservado por baseline SHA256 privado antes do patch. Histórico intocado.
Sem Git commit/push/PR, Supabase, alteração de dados, instalação ou publicação.

## Especificação anterior ao código

- Modo Live square somente em janela com menor dimensão lógica >=600px,
  proporção largura/altura entre0.8 e1.25 inclusive, toque disponível e
  apresentação não-TV. Detectar viewport/pointer, não nome/modelo do aparelho.
  Resize/orientação/reabertura e escolha de apresentação recalculam o modo.
  Celular estreito, tablet alongado, desktop sem toque e TV conservam regras.
- Apenas Canais nesse modo ganha duas metades iguais. Cabeçalho global no topo;
  esquerda superfície nativa16:9, faixa do canal e EPG existente inline;
  direita seletor de categoria, filtro/paginação/lista existentes.
  Não criar terceira coluna nem esconder canais ao consultar o guia.
- Frame desconta cabeçalhos/safe-area. Prévia limitada por largura da metade
  e altura útil (até30dvh), mantendo16:9. EPG e canais possuem min-height:0,
  scroll próprio e overscroll contido. Sem scroll do frame ou overflow lateral.
  Conteúdo de loading/erro deve caber ou rolar dentro da superfície.
- Seletor chama handleGroupSelect existente: navegar categorias não troca
  canal ativo; paginação48 e filtro existentes preservados. Controles44px,
  labels/foco, nomes longos, loading/vazio/erro acessíveis. Foco continua nos
  controles próprios. Nenhuma mudança em agrupamento/stream/catálogo.
- EPG reutiliza LiveEpgPanel/EpgSchedule/service existentes, incluindo autorização,
  abort/cache/refresh/erro/indisponível; inline aberto por padrão nesse modo.
  Mobile conserva drawer/retração/Back; TV/amplo conserva guia nativo anterior.
  Não fabricar programação. Nenhum fetch/cofre/autoridade novo.
- Superfície DOM/ref estável ao resize/dobra; alinhamento nativo via bounds/
  ResizeObserver/resize existentes. Incluir mudança do modo na medição.
  Não reiniciar preview/sessão por layout; fullscreen/retorno e Cast mantidos.
- APK local17/1.0.17, mesmo package/assinatura e updater14+; preservar APK16.
  Entrega local para atualização; nenhum upload/publicação/instalação autorizados.

## Allowlist estrita

- src/ui/navigation/square-live-layout.ts (classificador puro novo);
- src/ui/hooks/useLivePresentation.ts (detecção e flag square);
- src/ui/components/AppShell.tsx (classe/shell somente rota Live square);
- src/ui/components/LiveEpgPanel.tsx (prop inline, drawer default intacto);
- src/ui/pages/LiveTvPage.tsx (flag, seletor, EPG e medição de apresentação);
- src/ui/pages/LiveTvPage.css (somente modo square);
- android/app/build.gradle (somente versão17);
- scripts/test-c11-square-live-layout.mjs (teste novo);
- este contrato, docs/evidence/C11_SQUARE_LIVE_LAYOUT.md;
- acréscimos docs/{STATUS,EVOLUTION_REPORT,DECISIONS,ERRORS_AND_BLOCKERS}.md;
- tmp/c93-square-live/** e saídas ignoradas build/Capacitor/Gradle usuais.

Sem novas dependências ou mudanças em index.css, Header, native player,
Supabase, fonte, identidade, ativação, sessões, playlist, ambiente ou Git.

## Aceitação

Classificador/testes existentes e browser com Shell/Header/Live/EPG reais,
dados sintéticos e bridges autorizados mockados: square portrait/landscape e
600px, longo nome, filtros, grupos, paginação, EPG pronto/erro/indisponível,
scroll independente touch, bounds16:9, fullscreen-retorno; resize square↔phone/
tablet e TV/desktop exclusões. Confirmar DOM/ref/preview/sessão estáveis durante
resize sem requisição de playback extra; canais continuam visíveis com EPG.
Typecheck/build cliente/lock antes/depois, seis testes JVM updater/assembleAPK,
hash/tamanho/certificado/versão/assets. Proveniência fora da allowlist e HEAD
preservados. Browser não homologa player físico nem instalação no Z Fold.
