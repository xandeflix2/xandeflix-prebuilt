# C11 — Ordem prioritária da Home: evidência (ciclo64)

2026-10-10. Pedido direto: Lançamentos, Recentes, Filmes em Destaque,
Séries em Destaque e demais categorias na sequência existente. Spec anterior
ao código C11_HOME_CATEGORY_PRIORITY_ORDER.md substitui somente a ordem do C49.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; nenhum commit/push/PR.

Preflight: clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
top-level igual/main/origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Data Boundary e Activation Lock lidos. Baseline785 arquivos antes de
código,775 fora da allowlist preservados; guard final sem alteração não
autorizada/HEAD alterado. Patches anteriores, inclusive buffer e foco C63, intactos.

## Patch mínimo

Somente HomePage: renderer JSX local compartilhado mantém keys/IDs, inicial20,
fila/previews, loadWhenVisible, callbacks e preparação da primeira categoria.
Categorias reconhecidas por isReleaseCategory ficam antes de Recentes; demais
filmes permanecem na ordem relativa anterior, depois dos destaques; séries
seguem a ordem original. Categoria de lançamentos não duplicada nem fabricada
quando ausente. Recentes mantém sua lógica de ausência/exclusão adulta/retomada.
Hero não alterado. Sem mudanças de CSS, navegação, catálogo, source-desc, badges,
metadata, atualização automática, player, fonte, backend, env ou identidade.
build.gradle incrementa somente code6/name1.0 para atualização in-place.

## Verificação

- Grupo Home do script home-release-notice PASS: quatro primeiras fileiras na
  ordem pedida, categorias únicas, array canônico intacto, ausência de lançamentos
  válida, quotas20 e preparação preservadas. Atualizadas só dependências Home
  atuais e expectativas existentes; nenhuma suite nova.
- Script integral home-release-notice não é declarado PASS: loader histórico
  não oferece @capacitor/browser do aviso atual, que não foi alterado. Antes
  do patch já falhava em useSeriesHighlights; fixture atualizada com kind/title
  para alimentar prioritizeSeries real. Notice fora do escopo, sem relaxar checks.
- Home/coleções atuais3 grupos PASS: Ver todos/destaques20, rotas/histórico/Back,
  Recentes60/cronologia/fingerprint/filme/episódio/posição e grid/chaves/cleanup.
- D-pad8 grupos PASS: rails/Recentes/menus/relacionados/hero/episódios/modais,
  fluxo real do hook preservado. Nenhum novo teste de implementação.
- Lock22 ativação+27 promoção+9 controles negativos PASS antes do patch e no
  prebuild; TypeScript/Vite/build, cap sync e assembleDebug PASS. Avisos históricos
  Vite externalização/chunks e Gradle flatDir mantidos, sem refactor oportunista.
  Evidência nativa154/0 do C63 reutilizada: nenhum source/test nativo alterado.
- APK6/name1.0 com7 assets dist byte-idênticos no pacote, HTTPSlocalhost standalone,
  package com.xandeflix.prebuilt/min23/target35/certificado anterior preservados.
  Features anteriores, buffer e neon continuam presentes no DEX/CSS/bundle.
  SHA256 33E5F9DFDA7A76151C0B0960B0CF5438D70800BB9D48FF301C29356839D5BE9B, 11010211 bytes,
  bundle index-C-VJn-as.js; Xandeflix-v1.0-build6-standalone.apk.

## Entrega e aplicativo compilado

Fire1 AFTSSS/API28/serialG071EL13142513WK/user0/192.168.3.126:5555 confirmado,
sem player próprio ativo. Install-r verificado em 2026-10-10T13:12:58.505Z;
hash do base.apk igual. Comparações quiescentes:1113 arquivos privados,
1066 de catálogo e5 nativos; catalog/native/preferences/webview/other byte-idênticos,
diferenças0 e firstInstallTime preservado. Sem uninstall/reset/rotação.

Após entrega, app próprio aberto para ler o WebView compilado; nenhum vídeo
iniciado. Bundle novo confirmado. DOM: Filmes | Lancamentos, Recentes, Filmes
em Destaque, Séries em Destaque, Filmes | Nacionais, Filmes | Ficcao. Uma fileira
de lançamentos, Ver todos nas quatro primeiras. Hero existe, está pronto e vem
antes das fileiras. Probe inicial usou seletor inexistente .home-hero e retornou
false; probe corrigido para classe real .home-hero-carousel comprovou preservação,
sem mudança no código ou ocultação do resultado inicial.

Fire estava Asleep/displayOFF; não houve unlock automático nem certificação
visual/teclas no aparelho nesta rodada. Prova física limitada a instalação/hash
e DOM do aplicativo compilado; D-pad validado isoladamente, não com controle real.
S24 desconectado: tentativa de conexão no endpoint Wi-Fi autorizado expirou10060;
entrega nele pendente, mantém versão anterior. Tablet/Fire2/S23 não atualizados.
Não é distribuição OTA ou atualização dos demais usuários.

Guard de provenance C63 executado depois de criar a spec C64 acusou somente
o novo contrato autorizado como desconhecido: verificador fora de seu ciclo,
não mudança funcional fora de escopo. Baseline/guard próprios C64 PASS. Logs/
helpers privados em tmp/c11-home-category-order-20261010, sem credenciais/streams.
Forward próprio CDP9673 removido. Nenhum servidor de QA adicional, Git/backend/
fonte/projeto protegido ou próximo Gate.
