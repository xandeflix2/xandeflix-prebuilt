# C11 — cabeçalho mobile de Canais ao Vivo — 2026-10-07

Contrato: [C11_MOBILE_LIVE_COMPACT_HEADER](../architecture/C11_MOBILE_LIVE_COMPACT_HEADER.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Clone C11/main/HEAD61ec0090/origin
canônico verificados. Baseline667 arquivos, dirty anterior preservado.

## Implementação e fluxo

No breakpoint mobile existente<600px, a identificação Canais ao Vivo/total e
atalhos Home/Voltar/Cast são apresentados no Header principal. A marca repetida
da barra antiga é substituída pela identificação Live só nessa tela. Não há
segunda barra no corpo. Portal React conserva os callbacks do LiveTvPage;
ao ampliar viewport ou sair ele desmonta, restaurando apresentação ampla.

Voltar e Cast só exibem SVG com aria-label/title; áreas de toque44×44. A opção
visual iconOnly de Cast é opt-in: outras telas preservam textos. Se conectado,
retorno Neste aparelho permanece por ícone de celular, chamando stop(returnLocal).
Erro Cast é legível e acessível sem aumentar altura do cabeçalho.
Carregamento e catálogo ausente conservam cabeçalho/navegação.

Sem alteração em handlers de seleção/grupos, preview/ref/bounds/Media3,
autoridade/C9/PiP, transporte Cast/SDK, catálogo/importação ou storage.

## Verificação do fluxo

| Fronteira | Evidência |
|---|---|
| Renderização | Componentes reais AppShell/Header/LiveTvPage/CastButton; browser320/390/411, altura64 igual Home/Filmes/Séries,3 ícones, zero overflow/erros |
| Eventos | Voltar abre grupos e depois volta à página; Home desmonta portal; picker e retorno local acionados em adapters |
| Dados locais | Fixture usa LiveCatalogService simulado; total1027 exibido; sem dados/URLs reais, sem stream |
| Bridge Cast | Mesmo GoogleCast.picker/stop; connected/error testados com adapters, não receiver físico |
| Resposta/layout | Conectado4 controles incluindo retorno local; erro não muda altura; resize1280→390 restaura/move barra; loading/empty navegáveis |

S24 físico final: quatro cabeçalhos100,000px renderizados iguais (incluindo
ambiente/área segura do aparelho);3 botões SVG44,000px, texto visual vazio,
uma barra no Header e nenhuma no corpo, sem overflow e document.hidden=false.
Tablet e Fire amplos conservaram sidebar e barra Live no corpo.

Revisão React: hooks anteriores a early returns, efeito por isMobile, sem
MutationObserver/listener novo, portal sem nova autoridade/cópia de catálogo;
efeitos Cast existentes removem timer ao desmontar. Nenhuma dependência nova.

Typecheck/build/lock22+27+9/Cap sync/Gradle: PASS. Java122/0falhas/0erros,
resultado reutilizado pelas tarefas nativas sem patch Java neste ciclo.
Assinatura/standalone/manifest e6 assets dist byte a byte: PASS.

APK SHA-256:D4B7C8695FED0C98B068775D21CE696DE57ECBC68168E66F7A20252F6F2F2505; 12400179bytes; mesmo package
com.xandeflix.prebuilt/min23/target35/certificado anterior. Install-r nos três
aparelhos com hash instalado igual,0diferenças nos grupos privados e
firstInstallTime preservado; app aberto para QA somente após a comparação.

Limites: layout/ações exercitados; não certifica receiver Cast/codecs nem
soluciona erros de stream externos. Fixtures/imagens e JSON seguros em
tmp/c11-live-header-20261007, ignorado. Sem Git/backend/reset/escrita2.0.
