# C11 — tablet em retrato, Live e menu superior — evidência 2026-10-07

Preflight read-only: workspace/top-level C:/Xandeflix/xandeflix-prebuilt-c11-main, .git independente, main, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, originhttps://github.com/xandeflix2/xandeflix-prebuilt.git. AGENTS/Architecture/Execution/Source Data Boundary/lock lidos. Baseline669 e dirty anteriores preservados. Pedidos explícitos UI/EPG/correção fullscreen e update-r nos três alvos autorizados. CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; commit/push/PR não autorizados nem executados. Sem edição do workspace histórico/projeto original, backend, credenciais, identidade, C9 ou catálogo.

## Resultado

Somente tablet em retrato usa o menu global no topo com marca e seis links:
Início, Filmes, Séries, Canais, Busca e chave Ativação. Canais tem somente
texto, igual aos demais links. Ícones SVG de navegação ficam ocultos nesse
modo; não há menu inferior. Mesma regra do Header para todas as rotas.
Retorno global, quando aplicável, fica abaixo do menu e preserva histórico.

Live apresenta player horizontal16:9 acima da faixa AO VIVO, abas de categorias/
canais e lista rolável. Cabeçalho de título/contador/Home/Voltar/Cast fica logo
abaixo do menu global; ações por ícone de44px. Com TV conectada, ação adicional
Neste aparelho mantém espaço sem sobreposição. EPG ocupa desde a base do
preview/faixa do canal até o fim da página, cobre listas e recolhe ao tocar;
listas voltam visíveis. Mesma fonte/player/sessão, sem novo carregamento no boot.

Hook useLivePresentation identifica tablet por UA Android sem Mobile/uaData
mobile, iPad ou Mac touch, excluindo TV/Fire, e combina com viewport em retrato.
Atualiza resize/orientationchange com cleanup. AppShell usa esse modo para
menu e Live; telefone mantém portal/header compacto e menu inferior. Tablet
paisagem e TV/Fire continuam amplos/laterais. CSS compartilhado é condicionado
à classe efetiva, com safe-area e sem reserva inferior de menu no tablet.

## Verificação

Browser com componentes reais/adapters sintéticos:600×960,800×1280,960×1440,
seis abas navegadas, topo/labels/ícones, ações44px, superfície16:9, abas abaixo
do preview, guia sem lacuna, zero overflow. Paisagem1280×800→retrato restabeleceu
a configuração. Estado conectado em600px: quatro ações44px, sem overlap.
Preview da fixture é sintético e não certifica rede/reprodução.

SM-X610 físico com APK final: seis abas passaram em retrato, menu no topo,
Canais somente texto, ausência de menu inferior, superfície16:9 e vídeo real
inspecionado visualmente. EPG abriu alinhado ao preview e ao fim da página,
listas ocultas durante abertura e restauradas ao fechar. A rotação foi travada
apenas durante a conferência; modo livre e valor anteriores foram restaurados
e comparados no finally. Após restauração, Live amplo/paisagem continuou com
EPG anterior, sem drawer/overflow. Nenhuma density/zoom global foi alterada.

Telefone: browser4 larguras e S24 fullscreen/EPG continuam PASS. Fire amplo
preservado. Typecheck/Vite/lock22+27+9/Gradle,124 Java/0falhas/0erros,
assinatura e seis assets iguais byte a byte: PASS.

APK SHA-256: E19DC5339D89EDDC2AB70E9B5D2FD62CEAFC9C6B300257C2C4EA19F0D107F459; 12400179 bytes. Bundle dist/assets/index-L0bb-QGf.js; CSS index-BzG9xa8_.css. Package com.xandeflix.prebuilt; certificate b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d; versionCode1/versionName1.0/min23/target35, standalone HTTPS sem server.url. Assets6 iguais byte a byte.

| Alvo | Arquivos privados | Catálogo | Dados e firstInstallTime |
|---|---:|---:|---|
| AFTSSS | 467 | 436 | Preservados; APK idêntico |
| SM-X610 | 538 | 505 | Preservados; APK idêntico |
| SM-S926B | 548 | 508 | Preservados; APK idêntico |

Update-r conservou hashes dos arquivos privados e firstInstallTime nos três
aparelhos antes da abertura de QA. Allowlist adicional: hook, AppShell/Header/
LiveTvPage/CSS, contrato/evidência/relatório/memórias; baseline669 e prefixos
anteriores conferidos. Sem Git/backend/catálogo/auth/credenciais/reset.

Limites: UA/perfil e larguras exercitados, não todos os tablets/navegadores/
foldables ou canais/receptores Cast. Disponibilidade do EPG pertence à fonte.
Não certifica instalação limpa física ou transporte Cast/PiP neste ciclo.
[Contrato](../architecture/C11_TABLET_PORTRAIT_LIVE_AND_MENU.md).
