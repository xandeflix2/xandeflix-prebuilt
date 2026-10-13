# C95 — Reprodução recuperada no tablet — 2026-10-12

Contrato prévio: [C11_TABLET_SOURCE_RECONCILIATION](../architecture/C11_TABLET_SOURCE_RECONCILIATION.md).
Alvo exclusivo Samsung SM-X610 RX2X301Q3KY, XF-JNQK-NZ77,
com.xandeflix.prebuilt. HEAD/main/origin preservados. Sem patch de produção,
build, APK, instalação, reset, Git, alteração do banco ou de outros dispositivos.
C94 visual permanece preservada, empacotamento adiado.

## Observação e intervenção

Após reinicialização, tablet ainda usava snapshot snap-mv5c300k da fonte antiga
src_w9kb47u3efcvrqnj; bundle instalado index-BHFwbXYa.js. A autoridade já
apontava para src_87kbpy51ws9nnz6d versão1. Retorno ao Início e reconciliação
explícita pelo coordenador existente, com entrega normal do cofre e importação/
validação/promoção canônica. Nenhum pointer/configuração foi escrito manualmente.

Telemetria física: autoridade remota resolvida, fetch iniciado, parsing por volta
de64,8s, staging completo109,8s, promoção286,4s desde início instrumentado.
Sincronização total284363ms (~4min44s). Esses dados não são SLA; encerramento
logo após abrir não certificava conclusão da importação. Enquanto incompleta,
o catálogo anterior continuava ativo; acesso rápido ao Live impedia promoção
automática conforme política existente. A demora e o adiamento foram observados,
não se afirmou que todo HTTP401 fosse causado exclusivamente por isso.

Resultado retornado: PROMOTED/READY, fonte atual src_87kbpy51ws9nnz6d versão1.
Novo snapshot snap-mv5s8v3o, active.json persistido com promotedAt
2026-10-12T21:48:06.222Z. Checkpoint local e autoridade agora coincidem.

## Reprodução real e limites da conclusão

GLOBO SP FHD selecionado pelo handler normal da lista. Evento nativo
nativePreviewPlaying recebido; captura física do tablet às18h52 mostra vídeo
renderizado. Evidência privada tmp/c95-tablet-source/live-confirmation.png;
não é fixture/simulação. Canal deixado reproduzindo ao concluir a validação.

BAND NEWS FHD não reproduziu na mesma fonte: probe nativo registrou403 e404
entre candidatos e erro LIVE_PREVIEW_PLAYBACK_FAILED. Essa indisponibilidade
específica permanece; nenhuma fabricação de stream ou alteração de credencial.

Consulta autorizada somente de metadata da conta do provedor, feita diretamente
do tablet com configuração do cofre mantida apenas em memória: HTTP200, auth1,
statusActive, max_connections2, active_cons1 naquele instante. Painel permite8
simultâneas; configurar slots no gestor não amplia autorização do provedor.
Limite2 é observação do provedor e não prova retrospectiva de excesso no momento
do401; não foi alterada cota no painel. Não foram certificados todos os canais,
filmes/séries, nem recebimento da nova fonte nos demais aparelhos.

## Preservação

Identidade, chave, ativação e instalação comparadas antes/depois por SHA256,
sem copiar plaintext para evidência. Lock canônico executado antes e depois.
Proveniência/auditoria privada, sem segredo, source URL ou token em relatório.
Depuração privada removida e forward temporário encerrado após coleta.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
