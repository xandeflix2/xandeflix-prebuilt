# C94 — Hero: sobreposição preservada — 2026-10-12

Contrato: [C11_HERO_COMPACT_ACTIONS](../architecture/C11_HERO_COMPACT_ACTIONS.md).
Emenda do usuário rejeitou metadados fora da capa; removidos os overrides de
altura automática, imagem em região própria e faixa abaixo da imagem. A regra
anterior2:3 mobile, imagem contain e gradiente sobreposto permanece. Metadados,
Assistir/Ver detalhes e indicadores ficam dentro do hero em todos os formatos.

Comparação das referências fornecidas: Prime possui indicador pequeno no
rodapé; Xandeflix anterior distribuía dez círculos por faixa extensa. Agora até
cinco pontos6px (ativo7px), grupo máximo108px e áreas de toque20x44px. Mobile
centraliza abaixo das ações; square/horizontal/TV alinha à direita das ações.
Não foi inferido comportamento interno do aplicativo Prime.

Assistir usa o serviço existente: filme canônico; série retoma episódio válido
incompleto da mesma fingerprint ou primeiro episódio disponível ordenado.
Guardas de autorização/sessão/Cast não foram alteradas. Preparo impede clique
duplicado e pausa o timer; Ver detalhes preserva navegação. Swipe e rotação10s
preservados, janela móvel de pontos mantém foco do teclado/controle.

Validação: browser real com fixture sintética,12 casos de filmes/séries em
320x780,412x915,700x777,777x700,1280x800,1920x1080 PASS. Inclui limite108px,
ações e dots dentro do bloco, mobile sem crop, swipe, foco, clique concorrente,
erros/retry e timer real10s. Screenshots privados em tmp/c94-hero-actions/;
imagem sintética não representa catálogo real. Foi corrigida a duração do
gesto automatizado para permanecer dentro da janela real de swipe; produção
não relaxou o reconhecimento. Modelo anterior separado não foi entregue.

Typecheck, testes de ação direta/Home/Browse e lock canônico PASS após emenda.
APK18 não gerado: usuário priorizou diagnóstico da fonte antes do empacotamento.
Sem build/Capcopy/assemble/publicação/instalação nesta conclusão parcial da C94.
Sem Git/backend. HEAD preservado; próximo Gate não iniciado.
