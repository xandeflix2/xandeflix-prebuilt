# C11 — Entrada amigável e retorno D-pad de séries — C66 — 2026-10-10

Preflight read-only: clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
origin xandeflix2/xandeflix-prebuilt/main, HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS,
Architecture/Execution/Source Data Boundary lidos; baseline privado791 arquivos.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Spec antes do código e allowlist C66.
Sem Git writes/backend/env/source/credenciais/refatoração ou player nativo.

Entrada: “A diversão já vai começar”, texto amigável, símbolo play com órbita
animada CSS/SVG. Removidos contadores/textos técnicos e estado React de progresso;
mesmo algoritmo limitado40/deadline20s/cancelamento/Entrar agora/skip por Back.
Transform/opacity, reduced-motion, label/descrição/status acessíveis, layout
responsivo. Não significa reduzir o tempo de preparo nem precache de tudo.

Reprodução anterior em browser real: esquerda na primeira aba permaneceu em
Episódios; esquerda no primeiro controle do hero saltou para a aba Episódios.
Correção: handler local libera saída da primeira aba para o menu; hero percorre
controles visíveis em wrappers aninhados, ignorando modal oculto/disabled;
limites horizontais explícitos, menu retorna ao controle anterior ou hero se
DOM antigo removido; semelhantes sobe para aba ativa e depois hero; retry sai
para aba/menu. Mantidos Enter/Back/modal, throttle/RAF único/neon/scroll do hero.

Validação: hook real10 grupos PASS, incluindo8 anteriores sem relaxamento;
episódio/progresso2 e detail-tablet-tv7 grupos PASS. Browser React real (abas,
personal actions, startup e hook; catálogo semelhantes substituído por fixture
sem API/dados privados): uma/três temporadas, todas direções, disabled, modal,
retry/vazio, mudança de painel/DOM removido PASS. Entrada Fire960x540/tablet1280x800/
compact412x915 sem overflow/texto técnico; animação move, reduced-motion para,
Entrar agora libera D-pad; console sem erros. PNGs inspecionados.

Harness histórico startup original: FAIL após grupo algoritmo PASS, mock ausente
NewContentProvider em MediaCard. Script/MediaCard iguais ao baseline, falha
pré-existente, sem alteração fora do escopo. Cópia privada adiciona somente
mock neutro desse import, mantém todas as asserções:4 grupos PASS (quotas,
estabilidade/deadline/cancel, Fire/phone, finish/foco/cleanup, classe tardia).
Não afirmar PASS integral do harness original. Revisão react-best-practices:
sem deps novas, hooks/cleanup estáveis, SVG animado pelo wrapper, sem rerenders
por contador, dialog/status acessíveis, seletor de foco limitado ao hero.

Lock22+27+9/TypeScript/Vite/cap sync/Gradle assembleDebug PASS. Warnings históricos
chunk/externalização/flatDir, sem falha de build.162 testes Java C65 reaproveitados
(não rerodados neste patch web), fontes nativas preservadas. APK build8/code8/name1.0,
11011862 bytes; SHA256 3AC8A5A3A7FE433303ED2B14717550F063EF19441D36F5A3E96C8535541A6E2B; bundle index-r_AXGy3M.js,
CSS index-IHOg48Ot.css;7 assets dist iguais no APK, package com.xandeflix.prebuilt,
HTTPS standalone, mesmo certificado. PiP C65/buffer C63/Home C64 preservados.
Validação física de fechamento PiP continua pendente, independente deste D-pad.

Usuário corrigiu destino: SOMENTE Fire Stick1 192.168.3.126:5555/AFTSSS/serial
confirmado, tablet cancelado após tentativa de pareamento falha; sem instalação
em tablet/S24/Fire2. Instalação -r em 2026-10-10T21:15:11.292Z, APK instalado idêntico;
1115 arquivos,1066 catálogo,5 estado nativo
preservados integralmente com preferences/WebView/firstInstallTime. Sem reset.

Fire inicialmente em repouso, usuário ligou e liberou teste. App reaberto:
DOM real confirmou título/mensagem amigáveis, animation startup-loading-turn,
sem textos técnicos e foco Entrar agora. Screenshot seguinte já mostrava Home
(overlay havia terminado): não usá-la como foto da nova espera. D-pad Android
via ADB no APK instalado: Carrie, a Estranha,1 temporada/8 episódios,22 passos;
Jack Ryan de Tom Clancy,4 temporadas,26 passos. Hero/abas/temporadas/
episódios/menu/semelhantes em ambos sentidos e retorno ao mesmo episódio PASS;
hero inteiro visível ao retornar, screenshot inspecionado. Sem reproduzir vídeo,
sem avaliar/favoritar/compartilhar ou interferir em outro aplicativo.

Evidências privadas tmp/c11-friendly-startup-dpad-20261010: baseline/provenance, browser-before/after/PNGs,
APK/install/estado/startup DOM, fire-dpad JSONs/PNG. Proveniência final exige
zero fora da allowlist/HEAD igual; spec docs/architecture/C11_FRIENDLY_STARTUP_AND_SERIES_DPAD.md.
Não é teste exaustivo de todos os títulos/modelos/redes nem SLA.
