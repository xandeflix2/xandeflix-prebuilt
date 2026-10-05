# C11 — Identificação e controles abaixo do preview Live

Data: 2026-10-04. Resultado: patch visual, testes e instalação nos dois alvos PASS.

## Autoridade e proveniência

Usuário pediu AO VIVO à direita no bloco logo/nome, retirar nome acima do vídeo
e Player Nativo abaixo, para Fire/tablet. Interpretação comunicada: paisagem
não-phone, botão à direita logo abaixo; celular/retrato preservados.
[Spec prévia](../architecture/C11_LIVE_PREVIEW_CONTROLS_LAYOUT.md), referenciada
no contrato lateral/lock, antes de código/testes/instalação.

Preflight: workspace/top-level C:\Xandeflix\xandeflix-prebuilt-c11-main, origin
https://github.com/xandeflix2/xandeflix-prebuilt.git, main/ahead 2, HEAD
f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. AGENTS, Architecture/Execution,
Source Data Boundary, Activation Lock e spec lateral lidos. Dirty preservado,
401 hashes anteriores coincidentes; CURRENT_GATE=NONE, nenhum próximo Gate/Git.

## Patch mínimo e verificações

LiveTvPage: classes em JSX e span de apresentação AO VIVO no card. CSS adicional
somente no modo lateral, exceto display:none padrão do novo span. Linha antiga
de nome/badge oculta nesse modo; MESMO botão/callback depois da superfície por
ordem flex. Uma ação e um indicador visível, sem hook/estado/fetch novo.
EPG/categoria/logo/nome existentes, foco/Back, seleção, ref/superfície, retry,
fullscreen/C9/Media3/bridge inalterados.

Auditoria em RAM removeu só classes/badge e recuperou SHA-256 normalizado do
Live anterior f8b839cf56e830d1db8559e6b2644f82731682bcfacd0ec2d80a4a8e90734783.
Prefixo CSS anterior recuperou SHA-256 normalizado
f3d9b9c3f0da20ed71577375e6c9bf4ec737dd92b672555512cf1a8624160b5c.
Nenhuma outra alteração textual/lógica na tela ou regra antiga. 397/401 arquivos
byte-idênticos: só Live, CSS, teste browser e APK mudaram. Todos os 401 iguais
após build/instalações/probes. Docs/outputs usuais no recorte previsto.

- Lock antes e pós-patch pelo prebuild: 49+9 PASS.
- Browser completo: 53 checks/zero erros, gut-check imediato PASS, sem backend
  ou player real. Fire 960x540/1280x720, SmartTV, tablets 1280x800/1024x600,
  nomes/IDs sintéticos longos, phone/retrato originais e giro sem remontar
  superfície/botão. Foco/sidebar/rotas/Back/listener cleanup anteriores PASS.
- Enter na ação reaproveitada confirma guard seguro existente no adapter sem
  previewId, não homologa fullscreen/playback físico.
- Guards C9 10/10, VOD direto 12/12, profile/Live T127–T143 17/17 PASS.
- tsc/Vite/cap sync/assemble PASS; Gradle 142 tarefas, 25 executadas/117 up-to-date.
  Testes unitários nativos não rerodados nesta rodada.
- Certificado esperado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d,
  pacote com.xandeflix.prebuilt, cinco arquivos dist no APK com hashes exatos.
  Config HTTPS/Http/mixedContent/logging none e dependências preservadas.

Skills agent-browser/agent-browser-verify/verification orientaram história
Canais -> render local -> posição/ação existente, gut-check/matriz/DOM/imagens;
nenhuma nova API/env/data boundary. CLI ausente, harness Chrome/CDP próprio
isolado já existente. Imagens Fire/tablet/phone sintéticas inspecionadas; erro
de preview nas fixtures é proposital por ausência de fonte/player.

[Relatório](../../tmp/c11-side-navigation/run-1791153701415/report.json),
[Fire sintético](../../tmp/c11-side-navigation/run-1791153701415/live-categories-focus.png),
[tablet sintético](../../tmp/c11-side-navigation/run-1791153701415/tablet-live-preview-layout.png),
[phone original](../../tmp/c11-side-navigation/run-1791153701415/phone-preview-original-layout.png).

## APK e atualização física

APK raiz Xandeflix-v1.0.0-standalone.apk, 8749802 bytes, SHA-256
457E21EEC1FC10677DECD5D1216CA5E835042DCBA9CADAB9C31ABC34F98DBCFD,
igual ao app-debug.apk verificado. Backup novo recuperável
Xandeflix-v1.0.0-standalone-before-live-preview-layout.apk preserva o anterior
9B12B0C1CD18010C18959A2E175C70E7A48C1A4BEDA73F144C470CB751493F08;
nenhum backup divergente/histórico sobrescrito.

| Alvo (ordem) | Install -r/hash público instalado | Privados iguais | Catálogo igual durante install |
|---|---|---|---|
| Fire AFTSSS 192.168.3.104:5555, primeiro | Success / 457E21EE...DBCFD | 4/4 | 436/436 |
| Samsung SM-X610 RX2X301Q3KY, segundo | Success / 457E21EE...DBCFD | 4/4 | 505/505 |

Comparações dos quatro arquivos identidade/chave/instalação/ativação e árvore
files/prebuilt por hashes somente em RAM, sem publicar valores/digests privados.
MainActivity normal Status ok nos dois. Sem uninstall/clear/reset/orientação
persistente/fonte/gestor/backend/Git/outros pacotes ou aparelhos.

| Medida CSS física | Fire 960x540, PID 3402 | Samsung 1365x853, PID 9971 |
|---|---|---|
| Vídeo bottom / botão top | 258 / 266 | 455.533 / 463.533 |
| Ação/superfície únicas e botão abaixo visível | PASS | PASS |
| Nome acima oculto, logo/nome abaixo presentes | PASS | PASS |
| AO VIVO dentro do card à direita | PASS | PASS |
| Header/categorias/sidebar/sem overflow | PASS | PASS |
| Processo preservado durante confirmação | PASS | PASS |

Somente Canais selecionado pela UI observada se necessário. Nenhum canal/grupo
ou Player Nativo/fullscreen acionado em aparelho; rede/preview automáticos
normais não interceptados. Sem leitura UI de fonte/URL/logo src/ID/storage/
console/rede brutos. Forwards próprios 50547/50548 removidos, lista final vazia.
Sem nova homologação de playback, busca ou performance 60s.

[Fire — DOM](../../tmp/c11-side-navigation/fire-live-preview-1791154189151/report.json),
[Samsung — DOM](../../tmp/c11-side-navigation/tablet-live-preview-1791154190944/report.json),
[Samsung — botão](../../tmp/c11-side-navigation/tablet-live-preview-1791154190944/native-button-below-video.png),
[Samsung — badge](../../tmp/c11-side-navigation/tablet-live-preview-1791154190944/live-badge-in-channel-card.png).
Recortes Samsung dos controles/header inspecionados, sem frames de mídia.

## Incidentes e limites

Duas chamadas do wrapper de orquestração tiveram SyntaxError antes de executar:
uma de patch/teste e uma documental final. Não escreveram arquivos; payloads
literais corrigidos, etapas PASS, nenhum problema de produto associado.
Avisos existentes node:fs/node:path/imports mistos/chunk, Gradle flatDir e
metadata signer fora do escopo; sem aviso de crypto externalizado.

Primeiro probe Fire confirmou asserts de layout antes de Page.captureScreenshot
atingir timeout. Nenhum relatório completo dessa tentativa; cleanup WS/forward
no finally. Única repetição DOM-only sem mudar produto/asserts ou repetir
captura PASS, mesmo PID 3402. Screenshot Fire não obtida, limite explícito;
Samsung relatório/capturas PASS. Timeout não prova queda/app/player regression.
