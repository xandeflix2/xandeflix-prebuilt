# C110 — evidência da seleção de dispositivo em duas etapas

Data: 2026-10-15. Contrato anterior ao código:
[C11_DEVICE_PRESENTATION_SUBTYPES](../architecture/C11_DEVICE_PRESENTATION_SUBTYPES.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Clone C11 ativo/main,
HEAD 0f68f169f7728fae17c8311832b7643629e97a02; origin canônico.

## Resultado de apresentação

Três grupos iniciais: Celular, Tablet, TV / Android TV. Celular oferece
Celular e Celular dobrável; Tablet conclui diretamente; TV oferece Fire TV /
Fire Stick, Android TV / Google TV, TV Box com Android, Samsung Tizen e LG webOS.
Entrar num grupo/voltar não grava nada; a escolha final exige persistência
verificada antes de montar o filho da barreira inicial.

Configurações → Tela e dispositivo → Alterar tipo de dispositivo abre o mesmo
fluxo. Mostra o modelo salvo; cancelar mantém a escolha, trocar aplica o perfil
na hora sem remount do conteúdo. Back retorna à primeira etapa; foco retorna
ao grupo de origem ou ao botão das Configurações no cancelamento. D-pad vertical
respeita as colunas, Tab/setas/Enter/Espaço e captura de foco ficam no diálogo.
Cinco modelos TV e botão Voltar cabem em 960x540; ações mantêm alvo mínimo44px.

Tipo canônico e chave local v1 mantidos. Acrescentado modelo visual opcional,
validado conforme PHONE/TABLET/TV. Preferências antigas continuam aceitas sem
migração/escrita nem nova seleção obrigatória. Snapshot estável por seleção
notifica também mudança Fire→Android TV, embora o tipo continue TV.
Identificação Fire centralizada para Shell/Hero/carrossel; escolha explícita
prevalece, legado continua usando user agent. Dobrável não força layout quadrado
na tela externa; segue critérios consolidados de proporção/tamanho/toque.

Escolha visual não muda sistema operacional real ou cadastro remoto. Samsung/
LG reutilizam UI TV; não se declara APK compatível/homologado Tizen/webOS.
Nenhuma alteração em App, identidade, ativação, source, catálogo, player,
backend, dependências, CSS global ou configuração Android neste ciclo.

## Verificação executada

- `test-c110-device-presentation-subtypes.mjs`:11 grupos PASS. Oito modelos,
  reinício, versão antiga, modelo inválido/incompatível, persistência negada/
  perdida/parcial e notificação de subtipo. Browser com React real, Gate,
  AppShell, Settings, hooks de hero/Live reais, plataforma Android simulada.
  Cobre App bloqueado até conclusão, três grupos, subetapas, retorno, oito
  escolhas com reload, preferência nas Configurações, mudança56→80px sem
  remount, legado AFT, toque real via CDP e resize390x844↔800x880 do dobrável,
  D-pad, foco contido, cancelamento e retry de storage. Zero requisições
  externas e zero exceções de navegador. Serviços de atualização isolados.
- `test-c11-device-presentation.mjs`: três grupos PASS. Asserção antiga agora
  verifica HomeHero→useHeroLayout→usePhoneLayout+orientação+squareLive.
- `test-c106-hero-artwork-tap.mjs`:8 PASS, inclusive timer10s/foco Fire,
  toque/swipe e bloqueios de playback/visibilidade/gestos preservados.
- `test-c107-fire-hero-metadata.mjs`:11 PASS.
- `test-c11-home-hero.mjs`: suite completa PASS (12 marcadores).
- `test-c107-watch-providers.mjs`:10 PASS, logos e créditos preservados.
- `test-c11-square-live-layout.mjs`:18/18 PASS.
- `test-c11-landscape-navigation.mjs`:18 casos, overrides e hook real PASS.
- `npm run typecheck`: PASS. `npm run build`: PASS com lock obrigatório no
  prebuild; lock antes/depois com26 ativação+27 promoção+9 negativos PASS.
  Avisos Vite já existentes de externalização Node/imports mistos/chunk grande
  não foram contornados nem motivaram refactor fora do escopo.

Evidências sintéticas privadas: tmp/c110-device-presentation/tests.json,
first-step-tv.png, tv-models-960x540.png e phone-models-390x844.png.
Screenshots inspecionadas; retorno visível e controles legíveis. Baseline de
hashes e auditoria final no mesmo diretório. Sem segredos/URLs de fonte.

Limites: Android nativo simulado; nenhum aparelho físico atualizado/testado.
Build web gerado; nenhum APK novo entregue, cap sync/Gradle/install ou Git.
APK anterior C108 permanece intacto. Opções específicas só chegam ao instalado
com atualização futura autorizada; escolha genérica antiga permanece válida.
