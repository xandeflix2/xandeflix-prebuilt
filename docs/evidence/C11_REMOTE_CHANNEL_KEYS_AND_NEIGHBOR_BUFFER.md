# C112 — teclas físicas de canal e limite da fonte

2026-10-15. Preflight main/clone independente/origin canônico/HEAD
0f68f169f7728fae17c8311832b7643629e97a02, contratos lidos; baseline1023 arquivos
em tmp/c112-live-channel-keys/baseline.json. Escopo prévio em
architecture/C11_REMOTE_CHANNEL_KEYS_AND_NEIGHBOR_BUFFER.md.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend/reset/instalação.

## Achado e alteração

O player já tinha Anterior/Próximo por UI/D-pad e resolução local da categoria
do canal, mas LivePlayerControls.dispatchKey não tratava CHANNEL_UP/DOWN.
Agora CH+ emite next e CH− previous no primeiro DOWN/repeat0. UP e repetições
são consumidos sem ações extras. Emit existente preserva busy/disposing e
contexto opaco do canal. Diálogo aberto mantém a navegação própria.

NativeAndroidPlayerPlugin permite essas duas teclas no preview inline ou
fullscreen ativo, excluindo PiP. Demais teclas continuam delegadas aos
controles somente fullscreen; D-pad/Back/VOD não viram troca de canal.
MainActivity, JS/C9 e resolvedor locais não foram modificados. Mantidas
ordem da categoria, travessia de páginas, limites primeiro/último sem wrap,
validação de previewId/canal/snapshot e serialização/autorização anteriores.

Usuário confirmou fonte com uma única conexão. Não implementar pré-buffer
do próximo/anterior: buscar vídeo vizinho enquanto o atual toca requer acesso
adicional à fonte. Buffer atual permanece10–20s/start2,5s/rebuffer4s, alvos
de bytes consolidados. Nenhum stream extra, download persistido ou segundo
player foi criado; não há promessa de troca instantânea. Preparação local de
metadata é diferente de buffer de vídeo e não foi apresentada como tal.

## Verificação

- C112 executa corpos Java reais de dispatch/emit/roteamento do plugin e
  MainActivity, com eventos/view/contexto controlados. Constantes extraídas
  do SDK35 real. Inline/fullscreen, CH+/−, UP/repeat, busy/disposing/dialog,
  PiP/inativo/ausência de controles, D-pad/Back/VOD PASS; zero rede.
- C73 navegação/favoritos/limites/stale/paginação/controles/PiP:7 grupos PASS.
- C106 saída/troca/serialização/revogação/retorno à Home:8 grupos PASS.
- Gradle JUnit26 testes/5 classes PASS: LivePlayerControls4, buffer6,
  tap6, awake8, Cast visibility2; nenhum teste existente removido.
- Lock antes/depois e pré-Gradle/entrega:26 ativação+27 promoção+9 negativos PASS.
- Gradle testDebugUnitTest/assembleDebug PASS; avisos existentes flatDir e
  APIs Android deprecated não foram tratados como falha nem motivo de refactor.
- APK com7 assets dist/C111 idênticos, package/certificado iguais, HTTPS
  produção sem devserver; C111 anterior preservado. Auditoria fora da
  allowlist incremental PASS. Nenhuma alteração TSX/CSS/catalog/source/C9.

Harness testa política/eventos com adaptadores, não entrega física do IR/Bluetooth
nem tempo de primeira imagem. Controle precisa enviar códigos CH+/− ao app;
sem essas teclas, Anterior/Próximo na UI continuam acessíveis pelo D-pad.
Novo comportamento Android, não valida player nativo Tizen/webOS.

## Artefato

tmp/c112-live-channel-keys/Xandeflix-v1.0.19-C112.apk
11.445.445 bytes; SHA256
86214de1988b6b4885058127cb989530ce07bfc8a4e0336a0d277ec4761ea19f.
Code19/name1.0.19 de teste local, min23/target35, sem publicação no updater.
Não instalado remotamente neste ciclo; APK C111 instalado anteriormente no
celular permanece anterior ao mapeamento C112. Tablet segue manual por opção
do usuário. Buffer dos vizinhos não implementado devido à capacidade informada.
