# C11 — Controles e identificação abaixo do preview Live

## Autoridade e preflight — 2026-10-04

Usuário solicita reorganizar identificação/controles do preview para Fire Stick
e tablet: AO VIVO no bloco da logo/nome à direita, não mostrar nome acima do
vídeo, Player Nativo abaixo do vídeo. Interpretação comunicada: botão alinhado
à direita logo abaixo, layout paisagem não-phone; celular/retrato preservados.
Entrega nos mesmos Fire AFTSSS 192.168.3.104:5555 e Samsung SM-X610 RX2X301Q3KY,
Fire primeiro; somente update in-place com.xandeflix.prebuilt, sem reset.

CURRENT_GATE=NONE, ciclo local visual explicitamente solicitado, nenhum próximo
Gate/60s. Workspace único C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead 2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture/Execution/Source
Data Boundary/Activation Lock e spec lateral lidos. 401 hashes da última entrega
coincidentes; dirty preexistente preservado. Git/backend/outros alvos não autorizados.

## Especificação anterior ao código

1. Reusar `.app-shell--side-nav`, sem hook/identificação/estado novo. Somente
   em paisagem não-phone: seção preview em flex-column, superfície primeiro e
   a mesma linha/botão Player Nativo depois. Ocultar o agrupamento antigo de
   nome/badge acima do vídeo; não duplicar botão nem mudar callback/disabled.
2. Acrescentar badge não-interativo AO VIVO ao card existente da logo/nome,
   alinhado à direita, com shrink/overflow defensivos. Sua cópia de apresentação
   fica display:none fora do modo lateral; no modo lateral o badge antigo está
   oculto. Exatamente um indicador acessível/visível em cada layout, nomes não
   duplicados VISUALMENTE acima do vídeo no layout solicitado.
3. Preservar EPG/título/categoria/logo/nome abaixo do player, todos os handlers,
   seleção/filtro/paginação/listeners, retry/fullscreen/Back, ref da superfície,
   geometria da ponte/Media3 e C9. Não alterar lógica React, código anterior ao
   return, fonte/storage/ativação/App/hooks/native/config ou dependências.
4. CSS adicional escopado; regras anteriores não reescritas. Classes em JSX e
   um span novo somente. Rótulo/default display do novo span é única regra fora
   da sidebar e não afeta elementos anteriores. Smartphones em ambas orientações
   e tablet retrato mantêm disposição anterior; giro não remonta Live/preview.

## Allowlist estrita

- src/ui/pages/LiveTvPage.tsx: classes de apresentação e badge, sem handlers.
- src/index.css: bloco adicional descrito, sem editar regras existentes.
- scripts/test-c11-landscape-navigation-browser.mjs: checks do posicionamento,
  indicador/uma ação acessível/foco/handler seguro e celular/rotação; adapters
  existentes isolados, nenhuma rede/source/player real. Fixture TSX não alterada.
- Este contrato, referência no contrato lateral/lock, nova evidência
  docs/evidence/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md, STATUS/EVOLUTION/ERRORS.
- Outputs normais build/sync/assemble/APK; backup novo recuperável
  Xandeflix-v1.0.0-standalone-before-live-preview-layout.apk, baseline
  9B12B0C1CD18010C18959A2E175C70E7A48C1A4BEDA73F144C470CB751493F08.
- Artefatos sintéticos/relatórios sanitizados próprios no tmp/c11-side-navigation;
  probes efêmeros de instalação/UI/CDP com forwards exclusivos e cleanup.

## Verificação e aceitação

História: Canais -> render local existente -> superfície/botão/card reorganizados;
nenhuma nova API/env/data boundary. Skills agent-browser/verify/verification:
CLI ausente, harness Chrome/CDP existente com perfil isolado, backend bloqueado,
render/console/screenshot imediato antes do restante da matriz. Conferir Fire
960x540/1280x720 e tablet 1280x800/1024x600; preservar phone/retrato e rotação,
foco categoria/sidebar e acesso ao botão, sem duplicate listeners/controle.
No adapter sem stream URL, acionar botão somente confirma guard seguro existente;
não homologa fullscreen/playback real.

Provar JSX recupera baseline normalizado removendo somente classes/badge; CSS
anterior é prefixo inalterado. Fora da allowlist hashes byte-idênticos. Lock
oficial antes/depois/prebuild e guards C9/VOD/Live existentes PASS, tsc/Vite,
cap sync/assemble, assinatura/package/config/assets. Backup sem sobrescrever
destino divergente. Instalar -r primeiro Fire e depois Samsung, comparar quatro
privados e árvore files/prebuilt em RAM antes/depois, nunca expor digests/valores.
Conferir base.apk instalado igual ao raiz; abertura normal e snapshot DOM dos
controles na página Canais. Capturas físicas apenas botão/badge/cabeçalho, sem
mídia, URLs/logo src, IDs internos ou tela de chave. Não clicar canais/grupos,
full-screen/player/gestor, não reset/rotação persistente/backend/Git.
Preview automático é fluxo normal, não novo teste homologado de reprodução.
Falha bloqueia entrega; registrar evidência/limites sem promessa universal.

## Emenda — referência visual fornecida durante a entrega

Usuário enviou foto de app semelhante: prévia ocupa largura superior da coluna,
nome/programação compactos abaixo. Solicitou manter categorias, canais e menu
lateral. Substitui apresentação de cards/EPG volumosos SOMENTE no modo lateral,
não comportamento/colunas ou layout de celulares/retrato.

Spec adicional antes do código: classes no painel/EPG/header/fallback; em CSS,
seções internas display:contents no modo lateral para ordenar superfície,
card logo/nome/AO VIVO, programação/fallback discreto e ação Player Nativo
existente. Vídeo preenche largura da coluna em 16:9, sem moldura/gutter grande;
linha de identificação sem caixa volumosa, sem exibir ID/formato técnicos.
Ocultar título/chip da seção EPG e ícone/explicação de laboratório nessa coluna;
mostrar mensagem compacta quando programação real ausente. Não criar horários,
programas, progresso, busca/favoritos ou integração XMLTV inexistentes.
Player Nativo permanece abaixo e acessível (sem copiar Live TV Search da foto).
Navegação/sidebar/categorias/canais e todos os handlers/ref/serviços inalterados.

Mesma allowlist de Live/classes/CSS/teste/docs, permitindo substituir só o bloco
CSS de preview criado nesta rodada e adicionar asserts de largura/16:9/ordem/
metadados ocultos/fallback e original phone/retrato. Regras CSS anteriores à
rodada e lógica Live devem recuperar hashes baseline originais. Evidência nova
docs/evidence/C11_LIVE_PREVIEW_REFERENCE_LAYOUT.md, mantendo intermediária.
Backup novo before-live-preview-reference.apk do APK 457E21EE...DBCFD, sem
sobrescrever outros backups; build/teste e update -r Fire primeiro/Samsung
segundo com mesma preservação, sem reset/backend/Git/native/fonte/60s.
Confirmação DOM física e recortes seguros (sem mídia/IDs/URLs); se captura Fire
falhar novamente, registrar limite e confirmar DOM sem retry indefinido.

## Sucessão — gestos de tela cheia Live

Usuário solicitou confirmação do canal já selecionado para fullscreen e toque
na prévia em tablets. Novo recorte funcional mínimo, especificado ANTES do patch
em C11_LIVE_FULLSCREEN_GESTURES.md; sucede somente proibição anterior de tocar
handlers/native desse recorte visual. Preserva layout/C9/player/ativação, sem
reset/backend/Git; entrega Fire primeiro/Samsung depois.
