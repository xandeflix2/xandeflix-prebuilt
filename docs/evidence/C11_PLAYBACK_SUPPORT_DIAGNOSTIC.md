# C11 — Aviso com diagnostico copiavel e WhatsApp — ciclo52

2026-10-08. [Especificacao anterior ao codigo](../architecture/C11_PLAYBACK_SUPPORT_DIAGNOSTIC.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git/backend administrativo,
reset, troca de credencial ou mudanca de transporte por hipotese.

Aviso temporario fixed conserva mensagem amigavel e Fechar; acrescenta
Copiar diagnostico e WhatsApp por acao explicita. Texto tecnico versionado
conta UTC, package/versao/bundle, pagina, enum de erro/categoria, HTTP real,
codigo Media3 numerico real e checkpoint fechado, Android/WebView em forma
limitada. Nao inclui titulo/catalogId/URI/host da fonte/sourceId/headers/token/
serial/PIN/chave/codigo de ativacao/stack/rawUA. Ausentes legados permanecem
UNAVAILABLE/UNKNOWN; nao inferir Media3 de HTTP.

Campo opcional aditivo no retorno nativo preserva APIs antigas/Back/completion,
posicao/ended/ordem de cleanup. Captura error.errorCode real e checkpoint fixo
somente em erro. Transporte, headers, URI, TLS, timeouts e C9 intactos.
WhatsApp usa contato publico readonly existente e link wa.me com mensagem
preenchida. Sem contato usa escolha de destinatario; nao envia automaticamente.
Clipboard com fallback controlado/foco/feedback, leitura com abort e resultados
tardios ignorados. Timer10s pausado durante foco/interacao/acao para permitir uso.
Documentacao primaria: https://faq.whatsapp.com/5913398998672934 e
https://supabase.com/docs/reference/javascript/rpc. Sem alteracao de schema/RLS.

Testes reais do componente/projecao:8 grupos PASS, incluindo HTTP401+Media3
real2004, legado, desconhecidos maliciosos, ausencia de vazamento, UTF8/numero/
destinatario, cancelamento, clipboard/fallback, timer/erro e Browser mock.
Suite anterior do aviso11 grupos e3 novos testes nativos PASS; totalJava143,
typecheck/continuidade4/lock22+27+9/build/sync/APK/assets6/assinatura PASS.
EntregaEC412 tablet/S24/Fire103 auditada em todos os grupos privados; detalhes
de hashes/horarios/primeira auditoria parcialS24 no registro do ciclo51.

## Investigacao de reproducao e limites

S24 conectado por Wi-Fi, APK8EBA: Coyote reproduziu e ponto537925 evoluiu para
585142ms. Um Natal Bem Jonas Brothers, que antes falharaHTTP401, produziu
BUFFERING21:42:05.726UTC, FIRST_FRAME21:42:11.567 e READY21:42:11.612; retorno
normal/ponto110641ms. No APK finalEC412, mesmo filme teve FIRST_FRAME
21:58:26.745 e READY21:58:27.071UTC. Sem erro nessa tentativa. Player encerrou
antes do nosso Back posterior; foreground proprio ausente bloqueou a tecla.
Nenhum controle de outro app, wake ou desbloqueio automatizado.

O logcat antigo limitado as ultimas linhas perdeu eventos pelo volume; zero
resultados nao prova ausencia de frame. Substituido por observacao em tempo
real filtrada ao PID proprio, eventos fechados; linhas brutas/URIs nao persistidas.
Sucessos acima usam eventos FIRST_FRAME/READY reais, nao HEAD/GET isolados.

Nao se reproduziu uma nova falha fisica para testar o aviso neste ciclo.
Copia e abertura WhatsApp verificadas com componente real e porta Browser
mock; nenhum WhatsApp foi enviado/aberto no aparelho pelo agente. Codigo
nativo real2004 e HTTP401 foram testados de forma controlada, nao atribuidos
a uma falha nova que nao ocorreu. Falhas em aparelhos externos e causa do401
historico seguem nao resolvidas; sucesso posterior com transporte original
nao certifica solucao permanente nem disponibilidade universal. S23 perdeu
conexao e foi explicitamente excluido pelo usuario. Capas universais/producão
seguem limites dos ciclos anteriores, sem novo provedor de metadados.
