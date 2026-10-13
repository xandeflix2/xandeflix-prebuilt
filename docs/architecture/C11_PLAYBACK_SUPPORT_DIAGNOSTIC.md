# C11 — Diagnóstico de reprodução e suporte por WhatsApp

2026-10-08. Novos pedidos durante o ciclo visual51: investigar falha real de
vídeo no S23/S24, inclusive dispositivos externos à rede de desenvolvimento;
aviso deve abrir conversa WhatsApp com código técnico que possa ser copiado
para análise. Complemento autorizado do ciclo local CURRENT_GATE=NONE; nenhum
novo Gate/Git/backend administrativo/reset/uninstall ou troca de fonte.

Preflight do ciclo51 válido: clone independente/main/origin esperado,
HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e, contratos e Source Boundary lidos,
baseline728 privado antes das mudanças. Pedidos posteriores autorizam ampliar
somente a allowlist abaixo. Novos alvos pareados legítimos por códigos
temporários recebidos, nunca persistidos: S24 SM-S926B/RXGYB03FL4W e S23
SM-S918B/RQCX200VE9T via Wi-Fi. User autoriza QA do package próprio e update-r
com dados preservados para concretizar correções; nada em outros aplicativos.

## Especificação anterior ao código complementar

1. Diagnóstico por erro nativo com objetos sanitizados e projeção fechada:
   código conhecido, categoria conhecida, HTTP400–599 quando real, timestamp,
   tipo da página, versão/bundle do app e Android/WebView derivados de padrões
   limitados da UA. Não incluir título/catálogo/ID da obra, host/URL/sourceId,
   token/header, credencial, chave de ativação/serial ou traceback bruto.
   Eventos sem erro não geram diagnóstico; campos desconhecidos são UNKNOWN.
   HTTP401 deve permanecer401, não virar timeout. Não inventar código Media3
   numérico que o evento atual não fornece. Sem persistir conteúdo remoto.
2. App conserva handleNativePlayerReturn e cleanup C9 exatamente; callback
   do aviso captura somente relatório sanitizado correspondente ao evento.
   RESOLVING continua limpando aviso anterior. Mensagem amigável permanece.
3. Aviso mantém posicionamento fixo e duração10s por padrão. Botão WhatsApp
   abre link público wa.me com relatório no parâmetro text, envio confirmado
   pelo usuário no WhatsApp. Contato vem do getter público já existente do
   painel, consulta só quando há aviso, abort/cleanup/timeout existentes;
   ausência/falha usa escolha de destinatário no WhatsApp. Sem novo RPC/schema,
   autenticação administrativa ou escrita Supabase. Botão Copiar diagnóstico
   usa clipboard local, fallback controlado, feedback de sucesso/falha.
   Enquanto o usuário interage com ações, suspender auto-dismiss para permitir
   cópia/abertura; retomar ao sair. Não enviar mensagem automaticamente.
4. Investigar S23/S24 antes de patch de transporte: identidade do APK instalado,
   foreground/visibilidade do app próprio, evento native resume/progress e
   linhas de log próprias filtradas por categorias/números/checkpoint. Não
   salvar log bruto nem URLs/headers. Testar um conteúdo de cada vez, parar
   nossa reprodução ao terminar, respeitar C9 e evitar múltiplas conexões de
   mídia simultâneas. Diferenciar HTTP/codec/conexão/recusa de autorização.
   Sem modificar timeout/TLS/UA/URI/fonte por hipótese; patch funcional exige
   evidência e emenda específica anterior ao código.

## Allowlist complementar

- src/ui/components/PlaybackErrorNotice.tsx: ações/contato/clipboard/feedback.
- Novo src/playback/playback-support-diagnostic.ts: projeção e relatório puro.
- src/App.tsx: importar relatório, capturar evento no callback do aviso e passar
  diagnóstico ao componente; nada em bootstrap/identidade/C9/rotas/source.
- src/index.css: somente ações do aviso responsivas.
- Novo scripts/test-c11-playback-support-diagnostic.mjs; teste antigo do aviso
  preservado ou emendado exclusivamente para novo campo opcional/ações.
- Este contrato/evidência homônima; relatório item52 e documentos de estado
  já allowlisted51. Helpers tmp ignorados e saídas usuais build/sync/APK.
- Allowlist51 continua para fechar toolbar acima do hero e entrega combinada;
  demais arquivos mantêm hashes da baseline, Git não autorizado.

## Aceitação

Testes de vazamento com inputs maliciosos/URL/token/headers/ID, categorias/HTTP
inválidos, UTF-8 do WhatsApp/copy e relatório estável no evento. Componentes
reais: ausência de aviso não consulta contato; somente readPublic; abort/late
result/timer/feedback; copiar e abrir Browser mock, nenhuma mensagem real.
Lock antes/depois/build, typecheck/suites relacionadas, APK/package/cert/assets;
install-r/hash privado/firstInstallTime preservados, QA toolbar e botões nos
aparelhos disponíveis. Erro real deve produzir relatório que corresponda à
resposta observada; reprodução requer FIRST_FRAME/READY, nunca apenas abrir
Activity/trailer. Skill Supabase aplicada ao getter público existente; docs
oficiais rpc verificados, sem mudar contrato/credenciais/backend.
# Emenda anterior ao código — código Media3 real

Após inspeção da fronteira nativa: handlePlaybackError já recebe o código
numérico Media3 real, mas resume transporta somente NATIVE_ERROR/categoria/HTTP.
Para cumprir o diagnóstico técnico preciso, acrescentar media3ErrorCode
(inteiro1000–2147483647) e checkpoint fechado (NATIVE_ACTIVITY_STARTED,
DATASOURCE_OPEN, FIRST_FRAME, PLAYER_READY) ao evento terminal existente.
Somente erros transportam esses campos; Back/completion mantêm payload antigo.
Bridges/APKs anteriores continuam aceitos com UNAVAILABLE no relatório.
Nenhum throwable/mensagem/URI/header/ID/nonce/source, nem mudança em transporte,
fallback, tempos, lifecycle, C9, posição ou autoridade. Código é capturado do
erro real, nunca inferido de HTTP/categoria. Checkpoint estranho é descartado.
Allowlist complementar: NativePlayerActivity.java apenas campo de diagnóstico,
captura do código e chamada terminal; NativeAndroidPlayerPlugin.java apenas
overloads compatíveis/projeção dos dois campos; NativePlayerResumeEvent no
bridge TS apenas campos opcionais; NativeAndroidPlayerPluginTest.java apenas
novos testes positivos/negativos do payload; testes/relatório já allowlisted.
Aceitação adicional: API antiga inalterada, HTTP401+Media3 real2004 independentes,
inteiro inválido/checkpoint arbitrário omitidos, Back sem diagnóstico e nenhum
vazamento. Lock/Java/build/assets/APK/entrega preservada novamente.
