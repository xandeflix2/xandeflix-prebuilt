# C108 — ordem da apresentação inicial no Fire Stick — 2026-10-14

Spec anterior ao código, por pedido direto do usuário: a animação de entrada
não pode cobrir uma Home já apresentada. Deve preceder a Home ou ser omitida
se o preparo terminar rapidamente. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.

## Preflight e proveniência

Clone independente C11-main, top-level e Git próprios, main,
HEAD 0f68f169f7728fae17c8311832b7643629e97a02, origin esperado
https://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS, Architecture,
Execution, Source Data Boundary e activation lock lidos. Baseline C107 validado:
37 alterações conhecidas, APK f769d1fca75dfbeaafe63d919e4a9d0a6dfa139ef3fc70701a13b8c53a33c60b.
Lock prévio 26/27/9 PASS. Preservar esse APK e hashes dos arquivos antes do patch
em tmp/c108-startup-order. Nenhum commit/push/PR autorizado neste ciclo.

## Emenda de apresentação e aceitação

1. A decisão da apresentação é tomada no layout inicial da primeira Home do
   documento. Ref de âncora própria evita depender da atribuição posterior do
   ref do main. Não aguardar mudanças tardias da classe de perfil para abrir
   um modal sobre conteúdo já apresentado. Perfis não-Fire continuam sem modal.
2. Se hero e capas amostradas já estiverem prontos, entrar diretamente. Caso
   ainda estejam pendentes, reservar a apresentação da Home antes do primeiro
   paint e usar a primeira amostra, em 250 ms, como oportunidade adicional de
   omitir a animação. Durante essa reserva, hero e faixas não são pintados;
   continuam montados, com dimensões e carregamento existentes. Se ainda houver
   pendência, mostrar a animação antes de liberar a Home. Sem Home -> animação.
3. A decisão vale uma vez por documento, inclusive ao voltar à Home, trocar
   snapshot ou mudar o perfil. StrictMode pode remontar efeitos da mesma
   instância sem bloquear o preparo legítimo; unmount cancela timers/listeners
   e libera a reserva. Reentrada real nunca reabre a apresentação.
4. Preservar critérios de amostragem: máximo 40 capas, no máximo 40 leituras
   geométricas, oito eager por faixa, hero terminal, fallback contado à parte.
   Preservar polling de 250 ms, estabilidade de 500 ms para modal já aberto,
   limite total de 20 s, Entrar agora, Back, foco no hero ao fechar modal,
   reduced-motion e limpeza imediata do D-pad. Omitir modal não rouba foco.
   Cancelamento dentro de update não pode reagendar um timer depois de concluído.
5. Não alterar bootstrap, identidade, ativação, source, licença, importação,
   catálogo, busca, downloads de arte, cache, hero/autoplay, playback ou backend.
   Esta emenda substitui somente a apresentação anterior sempre iniciada por
   efeito passivo/observador de classe e a repetição por snapshot (C51/C66).
6. Testar caminhos rápido, pendente, timeout, cancelamento, StrictMode, troca de
   snapshot, perfil tardio e retorno, com React real/browser e regressões
   existentes de preparo. Build com lock obrigatório, sync, Gradle e verificação
   de assinatura/assets. Atualização -r somente no Fire USB AFTSS conhecido,
   preservando identidade, fonte, catálogo, UID e firstInstallTime; sem reset.
   Celular permanece para atualização manual por decisão do usuário. Não
   certificar instalação limpa física sem executá-la.

## Allowlist incremental estrita

- src/ui/components/StartupArtworkPreparation.tsx;
- src/artwork/startup-artwork-preparation.ts;
- src/index.css, somente reserva da apresentação inicial;
- scripts/test-c11-startup-artwork.mjs: adaptar expectativas de apresentação
  explicitamente substituídas acima; manter limites/deadline/estabilidade;
- scripts/test-c108-startup-order.mjs: testes de regressão desta ordem;
- este plano, docs/evidence/C11_STARTUP_PRESENTATION_ORDER.md e
  docs/evidence/C11_INTERNATIONAL_PLAYBACK_INVESTIGATION.md;
- docs/{STATUS,EVOLUTION_REPORT,ERRORS_AND_BLOCKERS}.md: acréscimos deste ciclo;
- saídas ignoradas usuais de build/sync/APK e helpers privados tmp/c108-startup-order.

## Investigação paralela de reprodução na Itália (somente leitura)

Usuário relata falha em todos os conteúdos; modelo, versão, código XF e
diagnóstico da tentativa ainda pendentes. Revisar resolver/player/transporte
sem exportar fontes, credenciais ou conteúdo. Registrar fatos e hipóteses em
evidência própria. Não presumir geobloqueio, não alterar DNS, TLS, fonte,
autorização ou player sem evidência causal. O código de status/Media3 da Itália
é necessário para uma correção direcionada; não reutilizar o HTTP 401 histórico
de outro aparelho como se fosse esse erro. Sem acesso físico ou remoto a esse
aparelho, a reprodução na Itália permanece não validada.

## Atualização de entrega por decisão do usuário

Após reconhecer o Fire em USB mas com depuração offline, usuário informou
“vou instalar manualmente”. Instalação remota e conferência física encerradas
sem instalar/limpar dados. Entregar APK assinado para atualização por cima da
versão existente; não insistir em reconexão ou instalar em outro aparelho.
