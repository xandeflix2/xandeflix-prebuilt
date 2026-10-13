# C92 — Hero com deslize e marcadores — 2026-10-12

## Escopo e proveniência

Pedido explícito atendido pelo carrossel compartilhado Home/Filmes/Séries:
gestos horizontais e marcadores circulares, sem setas/contador/pausa visíveis.
Botão Ver Detalhes e seleção de conteúdo/imagens mantidos. Contrato
[C11_HERO_SWIPE_DOTS](../architecture/C11_HERO_SWIPE_DOTS.md) anterior ao código.
Preflight main/origin/top-level/HEAD correto; baseline privado antes do patch.
Somente allowlist local; nenhum Git, backend, credencial ou cadastro real.

## Verificação

- Classificador real transpilado: esquerda/direita, limiar proporcional,
  predominância horizontal, duração, valores inválidos PASS.
- Regressões existentes Home, Browse tipado, artwork, D-pad Fire e updater PASS.
- Browser Chrome com TSX/CSS reais e dados locais sintéticos: PHONE412x915,
  TABLET1280x800 e TV960x540, Filmes/Séries PASS nos seis casos. Deslizes de
  toque reais em ambos os sentidos; rolagem vertical não troca título;
  cancelamento/multitoque ignorados; sem seleção acidental de detalhes.
- Marcadores selecionam posição, um ativo, sem texto/contador/setas. Conteúdo
  correto ao abrir detalhes; zero overflow/controles fora do hero. Screenshots
  PHONE/TV inspecionadas. Home mista e empty state PASS.
- Timeout real de10segundos PASS; timer continua após toque. Pausas por foco,
  documento oculto e reduced-motion PASS. Verificação adicional: toque real
  em marcador libera foco; swipe ao fim troca lote; DOM de marcador estável;
  ArrowRight+Enter selecionam por D-pad, foco visível e hover de mouse PASS.
- Typecheck/build cliente VITE_DEBUG_BUILD=false, prebuild lock, Capacitor copy,
  Gradle assembleDebug e seis testes JVM AppUpdateTest (zero falhas/erros) PASS.
- Revisão React: hooks incondicionais, refs para gesto/clique, estado somente
  início/fim; cleanup do timer/observer/motion/visibility mantido. Nenhuma nova
  consulta/dependência; toque preserva pan-y/pinch-zoom. Foco por posição não
  desmonta botões ao mudar de título/lote. Preferências de movimento respeitadas.

## Correção identificada em teste

Transferir captura implícita do filho para o root emite lostpointercapture no
filho. O primeiro teste cancelava o gesto nesse evento propagado; corrigido
para cancelar somente quando o root perde captura. Reexecução final PASS;
não relaxar asserção de swipe. Registro privado browser.log/extra-report.json.

## APK local

`tmp/c92-hero-swipe-dots/Xandeflix-v1.0.16-hero-deslize.apk`

- Package com.xandeflix.prebuilt; versionCode16; versionName1.0.16.
- 11082709bytes; SHA2564382eb78f99813ca4f2a4b55f537d4a6476a77136092543ba4257b0289ed2c02.
- Sete assets dist byte-match e AppUpdatesPlugin incluído no DEX.
- Certificado SHA256b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d,
  igual aos APKs14/15; APK14/15 anteriores preservados.
- Metadados e dados-publicacao.txt privados. Upload e publicação16 necessários
  antes da busca manual. APK debug para teste; instalação física pendente.

## Modelos de Canais para dobrável — somente prévia

Durante o ciclo usuário pediu modelos para aprovação e propôs navegação na
metade direita, prévia+EPG à esquerda. Modelo B inicialmente selecionado,
50%/50%; alternativa A compacta superior disponível. Fragmento privado
fold-channel-models.html, sem APIs/reprodução real ou alterações no aplicativo.
Dados de canais/programação ilustrativos; proporção fornecida pelo usuário.
Browser736/360: seleção de canal/categoria, rolagem independente, alternância,
recolher prévia, tela cheia simulada e guia PASS. Modelos inspecionados.

Proposta para aplicação futura: adaptar ao espaço lógico da janela e toque,
quase quadrada, excluindo TV/telas estreitas. Não inferir breakpoint pelo nome
do aparelho ou resolução física. Documentação primária consultada:
https://developer.android.com/develop/adaptive-apps/guides/adaptive-dos-and-donts.
Escolha/aprovação do modelo e implementação do layout Live permanecem pendentes;
não incluídas no APK16. Nenhum próximo Gate iniciado.

## Limites

Lint Android global conserva pendência pré-existente C90 (138 erros); nenhum
arquivo envolvido foi modificado, sem repetir auditoria ampla. Warnings de
bundle existentes. Browser não certifica toque/instalação no aparelho físico.
Sem upload/publicação/instalação ou escrita em dados reais. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. Lock final/proveniência/diff registrados privadamente.
