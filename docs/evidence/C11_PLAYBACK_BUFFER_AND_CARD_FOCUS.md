# C11 — Evidência de buffer e contorno neon (ciclo63)

2026-10-10. Pedido explícito de buffer para canais/filmes/séries e foco D-pad
visível. S24 incluído por steering posterior com endereço Wi-Fi; não substitui
as duas demandas. Spec anterior ao código: C11_PLAYBACK_BUFFER_AND_CARD_FOCUS.md.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; nenhuma operação Git de escrita.

## Identidade e proveniência

Preflight read-only no clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main,
top-level igual, main, origin https://github.com/xandeflix2/xandeflix-prebuilt.git,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e. AGENTS, Architecture, Execution,
Source Data Boundary, Activation Lock e contrato de foco anterior lidos. Baseline
781 arquivos antes do código; 770 fora da allowlist preservados por SHA256.
Auditoria final sem alterações não autorizadas/HEAD alterado. Patches C11 anteriores
preservados. Sem backend/env/credenciais/fonte/projeto protegido/refactor/TSX.

## Implementação

PlaybackBufferPolicy compartilhada pelo fullscreen e preview Android Media3
existente1.5.1. Configuração em milissegundos:

| Conteúdo | Mínimo | Máximo | Início | Após falta de buffer |
| --- | ---: | ---: | ---: | ---: |
| Ao vivo | 10000 | 20000 | 2500 | 4000 |
| Filmes/séries/episódios | 30000 | 60000 | 4000 | 6000 |

Alvos de alocação: TV16MiB live/24MiB VOD; handheld24/48MiB; low-RAM ou
memoryClass<=128 e falha de detecção16MiB. Bytes têm prioridade; back-buffer0.
O alvo não limita matematicamente toda a memória do player nem garante atingir
o máximo em segundos. Conteúdo com bitrate alto pode atingir os bytes antes do
tempo; respeitar esse alvo também permite iniciar sem esperar segundos inviáveis.
Live adaptativo recebe target-offset10s e respeita a janela; TS progressivo não
ganha DVR/seek. Nenhum proxy/download persistido/transcode/retry paralelo ou
alteração de Cast, headers, candidatos, C9, autoridade, retomada ou histórico.
Método legado buildLoadControl permanece para seus testes históricos.

MediaCard conserva sombra e ganha contorno rubi3px + linha clara interna e glow,
em pseudo-elemento sobre o poster, z30/pointer-events:none/inset0/radius herdado.
:focus/:focus-visible/.is-focused iguais. Não muda dimensão/zoom/teclas/callbacks.
Logs novos somente perfil numérico e duração de buffer; sem URLs/credenciais.

## Verificações isoladas e empacotamento

- Seis testes novos usam DefaultLoadControl real: início/seek/rebuffer em seis
  kinds, histerese/tempo, alvo16MiB/allocator/liberação, perfis/null, janela live
  curta e simulação de interrupção20s depois de preencher reserva. Essa última
  é simulação determinística, não teste de queda real de rede nem SLA.
- Gradle testDebugUnitTest:154 testes,0 falhas/erros; assembleDebug PASS.
- Suite D-pad rail/detail-return:8 grupos PASS, código real do hook preservado.
- Fixture browser com MediaCard/MediaRail/CatalogGrid/hook/CSS reais:12 checagens
  em phone412x915/tablet1280x800/Fire960x540, capas locais claras/escuras em
  rails/grid/relacionados; todas decodificadas, dimensões estáveis, ring3px,
  arredondamento/z30/pointer-events:none, foco por classe/nativo, Right/Down/
  Enter nos3 perfis, callbacks3, erros0. Capturas revisadas visualmente.
- Lock22 ativação+27 promoção+9 controles negativos PASS antes do código,
  durante build e novamente antes de entrega; TypeScript/Vite/build/sync PASS.
  Avisos Vite de externalização/chunks históricos não implicam regressão nova.
- APK5/name1.0, standalone HTTPSlocalhost, pacote com.xandeflix.prebuilt,
  min23/target35;7 assets dist byte-idênticos no APK, recursos nativos da política,
  ringCSS e features C62/atualizações/retomada presentes. Certificado anterior
  b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d preservado.
  SHA256 469D7F48E6F1290643F53E15C9A8AE729BAF6CFA2E3C2E9937A2B6C580571EA3, 11010152 bytes,
  bundle index-CM-ALr2j.js; arquivo Xandeflix-v1.0-build5-standalone.apk.

## Atualização preservando dados

Sem uninstall/reset/rotação ou abertura automática pelo instalador. Alvos user0,
modelo/serial/package existentes conferidos, sem player ativo. Install-r e hash
do base.apk após entrega iguais ao artefato; firstInstallTime preservado.

| Alvo | Transporte | Total/catálogo/nativo | Entrega UTC |
| --- | --- | --- | --- |
| Fire1 AFTSSS / G071EL13142513WK | 192.168.3.126:5555 | 1118/1066/5 | 2026-10-10T11:20:54.803Z |
| S24 SM-S926B / RXGYB03FL4W | 192.168.3.111:46761 | 976/928/5 | 2026-10-10T11:21:32.655Z |

Comparações quiescentes antes/depois: todos os grupos catalog/native/preferences/
webview/other byte-idênticos, diferenças0 nos dois. Pareamento temporário S24
retornou falha de protocolo; conexão com confiança existente funcionou e serial
foi conferido. Código temporário não registrado. Tablet/Fire2/S23 não atualizados
neste ciclo. Alterações naturais do histórico durante QA são posteriores às
comparações de preservação, não representam reset da instalação.

## QA física

Fire1 iniciou em modo de espera: screenshot preto e teclas sem movimento não
certificam navegação. Estado Asleep/displayOFF confirmado read-only; usuário
desbloqueou. Depois: ring real3px/rgb255,38,58/radius6px/z30 sobre capa decodificada;
Right mudou para Soulm8te e Down saiu de Recentes para Filmes em Destaque,
Tô de Graça: O Filme. Enter abriu detalhe e Assistir abriu NativePlayerActivity;
frame do vídeo confirmado por captura própria. Retorno normal Back preservou
saída do player. AMC FHD abriu no preview e frame de transmissão confirmado,
sem erro visível; retorno Home encerrou o preview iniciado no teste. Logs Fire
filtrados não trouxeram métricas de buffer: não afirmar duração real da reserva
ou redução de travamentos medida nesse hardware.

S24: bundle instalado confirmado no WebView próprio; contorno físico legível,
largura CSS computada2.85714px pela escala mobile existente, equivalente à regra
3px, radius10px/z30. Primeiro recent Anos Incríveis ainda usou placeholder;
foco foi conferido depois em Passagrana com imagem decodificada. Isso não é
certificação das capas de todo o catálogo. Player de Passagrana abriu/reproduziu,
frame confirmado; log sem segredos confirmou VOD30000/60000/4000/6000ms e
target50331648bytes, READY com8810ms, first-frame e position-advanced. Log live
confirmou10000/20000/2500/4000ms e25165824bytes, preview READY com3306ms.
Não desligar rede nem disputar sessão entre os dois aparelhos: testes de stream
sequenciais. Players iniciados pelo teste encerrados por navegação normal.

## Limites e ocorrências de ferramentas

Harness privado falhou inicialmente porque Vite tentou observar Cookies de
Chrome e encerrou com EBUSY; define de debug também explicitado no config
privado. Repetição CDP declarou const global e falhou no segundo perfil; escopo
local corrigido e execução final12/12 PASS. Validador APK procurava ::after,
mas minificador produz :after equivalente; checker corrigido, APK não alterado.
Comandos privados de leitura/quoting tiveram falhas de caminho/sintaxe; nenhuma
alteração de produção resultante. Nenhum teste falho mascarado como PASS.

Buffers mitigam oscilações curtas quando há dados antecipados; não corrigem
arquivo incompleto, autenticação/HTTP401, codec, fonte lenta sustentada, ausência
de internet prolongada ou AirScreen. Não certifica Tizen/webOS, série física
específica, catálogo completo ou reprodução longa sem travamentos. Tablet somente
perfil de browser nesta rodada. Nenhuma distribuição OTA/push aos demais usuários.
Helpers e evidências privadas em tmp/c11-buffer-focus-20261010, ignorados; server
de QA e forwards CDP criados pelo ciclo encerrados ao final. Spec/allowlist
mantidas; CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
