# C11 — Enquadramento dos heros no Fire — C67 — 2026-10-10

Pedido explícito: topo do hero cortado na entrada e no hero de Filmes/Séries.
Spec anterior ao código. Preflight: clone C11-main independente, origin esperado,
main/HEAD 61ec00902be5d0037adf79c68b3a8624b3a2bd6e; AGENTS/Architecture/Execution/
Source Boundary/activation lock lidos. CURRENT_GATE=NONE/NEXT_GATE_STARTED=NAO.
Sem Git writes; baseline privado preserva dirty consolidado C66 e anteriores.

## Escopo e aceitação

1. Medir antes/depois os limites reais dos heros Home/Filmes/Séries na viewport.
   Hoje focusin/D-pad usa scrollIntoView(block:start) sem scroll-margin: margem
   de página é consumida e o banner fica colado no topo. Testes antigos provam
   chamada de scroll, não enquadramento visual. Foto do usuário invalida sucesso
   anterior quanto ao topo na TV; não presumir que seja falha da imagem/API.
2. Patch mínimo CSS exclusivo Fire: margem superior responsiva compartilhada
   (16–24px lógicos, com inset seguro quando disponível), padding inicial Home/
   Filmes/Séries e scroll-margin do banner/preparação. Mesmo inset ao retornar
   do catálogo ou trocar controles/carrossel. Aplicar scroll-margin ao hero de
   detalhes Fire para coerência, sem remodelar sua UI. Manter altura75vh/
   mínimo350/máximo620 nas viewports normais; limitar somente se viewport muito
   baixa não comportar banner e duas margens. Sem recortar texto/botões nem
   mudar object-fit/backdrop, foco/D-pad, fonte, cache ou carga de imagens.
3. Browser real com CSS/hook: entrada, todos os controles do hero, retorno do
   rail/menu, troca de item e placeholder; Home/Filmes/Séries, TV em resoluções
   distintas e não-Fire sem alteração. Assert top>=margem e bottom<=viewport
   (tolerância1px), imagem/borda/botões inteiros, scroll único por frame.
4. Testes anteriores D-pad/episódios preservados; activation lock/build/sync/
   Gradle/package/assinatura/assets/proveniência. Build9 cumulativo C66/PiP/
   buffer/Home. Autorização persistente mais recente: SOMENTE Fire Stick1
   192.168.3.126/AFTSSS/G071EL13142513WK, update-r com hashes/dados preservados.
   Verificação real Home/Filmes/Séries e reinício somente se app disponível, sem
   playback/interromper outro app/desbloqueio forçado. Sem tablet/S24/Fire2.
5. Evidência não garante overscan de toda TV nem SLA de performance; afirmar
   enquadramento observado na viewport/aparelho e registrar qualquer limite.

## Allowlist

- Este plano e docs/evidence/C11_FIRE_HERO_SAFE_FRAME.md.
- Registros STATUS/DECISIONS/ERRORS_AND_BLOCKERS/EVOLUTION_REPORT e
  docs/evidence/C11_OPTIMIZATION_REPORT_20261006.md: append C67.
- src/index.css: somente margem/enquadramento Fire descritos acima.
- scripts/test-c11-fire-home-hero-dpad.mjs: asserções complementares de CSS,
  mantendo casos anteriores. Sem alterar hook/componentes se CSS resolver.
- android/app/build.gradle: versionCode9/name1.0; tsconfig.tsbuildinfo e saídas
  usuais ignoradas de build/sync/APK.
- Evidência/helpers privados tmp/c11-fire-hero-frame-20261010.

Sem backend/env/source/identidade/catálogo/API/native player/deps/reset/limpeza
ou Git. Não iniciar novo Gate. Defeitos adicionais exigem spec antes do patch.

## Adendo antes do segundo patch — regressão física e sinopse

Build9 instalado: computed scroll-margin16.2px, mas scrollIntoView no WebView
real Chrome128 continuou deixando topo negativo (-0.61/-0.80px). Browser
Chrome atual110 medidas PASS não basta. LATEST_REGRESSION_WINS; build9 não é
correção final. Ampliar allowlist apenas useDpadNavigation.ts no ramo Fire:
calcular posição absoluta do hero pela geometria atual + scrollY menos inset
CSS e aplicar uma única window.scrollTo no RAF existente. Sem scroll duplo,
sem mudar os fast paths, foco, menus, non-Fire ou player. Testes existentes
que afirmavam scrollIntoView devem agora afirmar posição/margem explícita,
mantendo direções/coalescing/stale cleanup e comportamento non-Fire intactos.
Permitir ajustes mínimos dessas expectativas no test-c11-fire-dpad-rail-return.mjs.

Novo pedido explícito do usuário: sinopse do hero Fire maior em3px, somente
esse campo. .hero-overview em Home/Filmes/Séries Fire usa calc(var(--tv-font-sm)
+3px), sem mudar títulos, gêneros, metadados ou sinopse da página de detalhes.
Fallback18px se variável ausente; browser e Fire devem provar tamanho anterior
+3px no perfil real e ausência de mudança em tablet/phone. Manter botões
inteiros e clamp de linhas. Build10 cumulativo; versionCode10/name1.0.
APK9 permanece evidência da tentativa inicial, não entrega final bem-sucedida.
Instalação9 reabriu app durante hashes: identidade/ativação/catálogo e
firstInstallTime iguais, prefs/WebView/other diferentes após execução;
nunca afirmar preservação integral de todos os hashes nesse evento.
