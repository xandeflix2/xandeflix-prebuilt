# C11 — Entrada amigável e D-pad de séries — 2026-10-10

Ciclo local C66 solicitado pelo usuário. Spec anterior ao código.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Clone independente C11-main, origin
esperado/main/HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e; contratos, AGENTS,
Source Data Boundary e activation lock lidos. Sem commit/push/PR.
Baseline privado antes do patch preserva o dirty dos ciclos anteriores.

## Escopo e aceitação

1. Tela inicial Fire mantém preparo limitado/deadline/cancelamento/Entrar agora
   existentes. Mostrar “A diversão já vai começar”, mensagem amigável e símbolo
   de reprodução animado em CSS/SVG. Não mostrar capas, contadores técnicos,
   indisponibilidade de imagens nem prometer tempo exato. Animação leve por
   transform/opacity, reduced-motion, diálogo/label/foco e adaptação de tamanho.
   Não baixar arte nova nem alterar cache, boot, quotas ou tempo de espera.
2. Verificar com componentes reais/browser a navegação nas duas direções:
   Voltar/hero -> abas -> temporadas -> episódios, e retorno; hero/abas/temporadas/
   episódios/semelhantes -> menu lateral e retorno ao controle anterior.
   Hero horizontal usa controles visíveis, incluindo wrappers Avaliar/Favoritos/
   Compartilhar, sem saltar a episódios por distância geométrica. Esquerda na
   primeira aba deve sair para o menu: handler local hoje consome essa tecla.
3. Alvos do hero não podem ser controles de modal oculto ou desabilitados.
   Primeira linha de semelhantes da série retorna à aba ativa antes do hero.
   Lista vazia/loading/retry, uma temporada sem seletor, múltiplas temporadas,
   controles disabled e retorno a DOM já removido não devem prender o foco.
   Manter foco neon, scroll único, throttle, Back, isolamento de modais, Enter
   e rotas/player/source atuais. Sem refatorar motor global nem novas bibliotecas.
4. Testes relacionados e reprodução antes/depois; inspeção visual em browser,
   perfis Fire/tablet/phone, animação/reduced-motion, foco e ausência de textos
   técnicos. Lock obrigatório/build/sync/Gradle/APK verificado. Build8 preserva
   correção PiP C65, buffer/neon C63 e ordem Home C64.
5. APK desta rodada e, conforme última correção explícita do usuário, instalação
   somente no Fire Stick 1 AFTSSS/G071EL13142513WK/192.168.3.126:5555.
   Atualizar com -r após identidade/assinatura e hashes privados antes/depois;
   sem reset/uninstall, preservando dados. Instalação no tablet cancelada.
   Conferência física de controle/aparelho só pode ser afirmada se executada.

## Allowlist estrita

- Este plano e docs/evidence/C11_FRIENDLY_STARTUP_AND_SERIES_DPAD.md.
- docs/{STATUS,DECISIONS,ERRORS_AND_BLOCKERS,EVOLUTION_REPORT}.md e
  docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md: acréscimos C66.
- src/ui/components/{StartupArtworkPreparation,SeriesDetailSections}.tsx.
- src/ui/hooks/useDpadNavigation.ts; src/index.css (somente tela inicial).
- scripts/test-c11-fire-dpad-rail-return.mjs: casos adicionais relevantes, sem
  relaxar asserções anteriores. scripts/test-c11-startup-artwork.mjs: somente
  adaptação de apresentação se necessária, sem mudar critérios de preparo.
- android/app/build.gradle: somente versionCode8/name1.0.
- tsconfig.tsbuildinfo, saídas usuais ignoradas build/sync/APK e evidência/helper
  privada tmp/c11-friendly-startup-dpad-20261010.

Nenhum env/backend/source/cofre/identidade/licença/catálogo/native player,
manifesto, dependência, reset/uninstall/Git/novo Gate autorizado. Instalação
somente no Fire Stick 1 explicitamente solicitado nesta rodada.
Skill react-best-practices aplicada aos dois TSX; verificação limita-se a este
fluxo. Falhas pré-existentes de harness não viram PASS integral nem exigem
refatoração fora da allowlist. Proveniência final zero fora da allowlist.
