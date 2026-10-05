# C11 — Fire Stick: memória e tempo de abertura

## Autoridade, preflight e proveniência — 2026-10-04

Usuário solicita carregamento do Fire Stick em no máximo 60 segundos, após
fechamento reproduzido durante importação. Autoriza este ciclo local de correção
de memória/desempenho, não um próximo Gate. CURRENT_GATE=NONE. Workspace único
C:\Xandeflix\xandeflix-prebuilt-c11-main, origin xandeflix2/xandeflix-prebuilt,
main/ahead 2, HEAD f0fdb6840c21e7a660f1662f2bbac9f2cd241cba. Preflight e contratos
AGENTS/Architecture/Execution/Source Data Boundary/lock de ativação lidos.
Dirty preexistente preservado; sem commit/push/PR/backend autorizados.

Lock antes do patch: 22 testes de ativação + 27 de promoção + 9 controles
negativos PASS. Diagnóstico físico anterior documentado em
docs/evidence/C11_FIRE_STICK_STARTUP_DIAGNOSIS.md: V8 OOM durante importação,
seguido de perda de renderer não tratada. Retentor específico ainda não provado.

## Requisitos anteriores ao código

1. Corrigir retenção/pico de memória identificado por reprodução sintética,
   sem atribuir a um objeto específico somente com base nos logs físicos.
2. Preservar todas as linhas/records válidos, Unicode, vírgulas quoted,
   classificação, títulos, URLs/headers, IDs e relações série/temporada/episódio.
   Não limitar catálogo, omitir episódios, reduzir fixture existente ou
   publicar staging incompleto para disfarçar tempo de carregamento.
3. Preservar manifest/integridade, ordem e hashes de segmentos, promoção
   atômica, snapshot anterior e tratamento verdadeiro de falha de persistência.
   Se uma otimização mudar fronteiras de batches, provar equivalência lógica
   e revalidar hashes; não alterar esquema nem remover verificação.
4. Identidade, chave permanente, A1, autorização, políticas de licença,
   backup, package/assinatura e HTTPS permanecem intactos. Nenhuma leitura
   de chave/token/fonte real será exposta em logs ou fixtures.
5. Fonte e catálogo permanecem exclusivamente no dispositivo. Diagnósticos
   de retenção usam somente dados sintéticos e sinks de memória limitada;
   InMemoryCatalogStorage não serve como prova isolada de heap do importador.
6. Medir tempo sem prometer resultado: marco conservador pendente de
   confirmação do usuário = início da Activity até Home com snapshot completo
   promovido e conteúdo disponível. Catálogo/busca completos versus Home inicial
   com busca/importação em background foi perguntado ao usuário; não implementar
   caminho parcial sem escolha expressa. Rede/fonte/hardware devem acompanhar
   a medida. Instalação limpa e abertura com cache são resultados distintos.
7. Meta explícita do usuário: <=60 segundos no Fire Stick conectado. Só declarar
   satisfeita após teste físico do marco acordado; teste Node não certifica tempo
   Android, ausência de OOM no Fire ou estabilidade em todos os dispositivos.
8. Atualização APK no aparelho depende da resposta à autorização solicitada.
   Se autorizada: somente in-place, mesmo package/assinatura, preservando dados,
   ativação e APK anterior recuperável. Sem uninstall, clear-data, reset,
   rotação de chave ou remoção de staging do aparelho nesta autorização.

## Allowlist estrita deste ciclo

- Este contrato; C11_NEW_DEVICE_ACTIVATION_LOCK.md somente referência de sucessão.
- src/source/m3u-line-stream.ts, m3u-extinf-parser.ts e novo helper local de
  strings somente se retenção de backing buffers for demonstrada; novo teste
  scripts/test-c11-fire-stick-import-retention.mjs com dados sintéticos.
- src/source/real-source-importer.service.ts e m3u-bounded-staging-writer.ts
  somente otimizações de importação bounded demonstradas por testes; nenhuma
  alteração de identidade/ativação/classificação/esquema/autoridade.
- Evidência docs/evidence/C11_FIRE_STICK_STARTUP_MEMORY_PERFORMANCE_FIX.md,
  STATUS, EVOLUTION_REPORT, ERRORS_AND_BLOCKERS; diagnóstico anterior apenas
  referência para sucessão, sem reescrever evidência histórica.
- Outputs usuais de build web/Capacitor/Gradle e APK raiz, com backup recuperável
  Xandeflix-v1.0.0-standalone-before-fire-stick-performance-fix.apk.

Não modificar dependências, UI/Home/boot, storage/promoção, player, MainActivity,
backend ou regras canônicas de segurança. Se evidência exigir outro componente,
ampliar especificação/allowlist antes do código; se exigir mudança material de
arquitetura/autoridade ou do significado de carregamento, solicitar direção.

## Aceitação e regressões

- Reproduzir retenção sintética no baseline, confirmar liberação após patch
  em processo isolado com GC e heap limitado; controles negativos devem falhar.
- Equivalência de linhas/EXTINF/episódios com chunks UTF-8 fracionados, CRLF,
  Unicode, aspas/vírgulas e entradas inválidas; limites de linha continuam reais.
- Importação grande completa em sink bounded, contagens/relações/integridade
  preservadas. Suite existente 250 mil records e demais testes de source/profile
  e promoção intactos. Nenhum dado de fonte real nos testes.
- Lock oficial antes/depois e antes do APK; notice/player/C9/VOD permanecem
  verdes. Typecheck, build, cap sync, testes Java/assemble, package/assinatura e
  assets conferidos. Diff scoped e hashes fora da allowlist comparados.
- Teste físico após autorização: tempo do marco acordado, memória/catálogo/
  estabilidade e ativação preservados. Falha ou tempo >60 mantém requisito
  aberto; não equiparar cache a instalação limpa nem fallback a conclusão.

## Ajuste bounded de I/O especificado antes do patch

O reader baseline retém ~48 MB por 24 títulos no caminho nativo dataText
simulado; materializar cada linha reduziu essa amostra para <0,1 MB. O importador
completo sintético conserva contagens/relações/hashes em heap pós-GC ~22 MB.
TextDecoder de bytes no Node não reproduziu essa retenção no baseline; o
controle negativo obrigatório é dataText, que corresponde ao plugin Android.

Próximo ajuste dentro da allowlist: batch padrão de records 1000 -> 2500,
mesmo limite já usado na normalização e dentro do intervalo bounded aceito pela
suite existente (1000..3000). Não mudar algoritmos/hashes nem records. Para
100 mil episódios, reduzir arquivos episodes/streams de 200 para 80 (60% menos
chamadas principais de gravação); payload total continua completo. Medir
heap e verificar cada segmento/stream/relacionamento; a redução determinística
de chamadas não é redução de 60% no tempo nem prova do requisito físico de 60s.
Caso o pico sintético extrapole o bound, não entregar o ajuste.

## Autorização posterior: teste físico de instalação limpa — 2026-10-04

Usuário solicita explicitamente desinstalar/reinstalar uma versão limpa no
Fire Stick, como primeira instalação, e testar abertura com conteúdo carregado.
Esta autorização supersede SOMENTE a restrição anterior a uninstall/reset e
in-place para esse aparelho e pacote. Não muda código, autoridade ou invariantes.

Preflight revalidado: workspace C11, origin esperado, main/ahead 2, mesmo HEAD,
dirty conhecido preservado; contratos e lock lidos integralmente. CURRENT_GATE
continua NONE; nenhum próximo Gate, commit/push/PR ou administração backend.

Allowlist deste teste: este contrato, referência de sucessão no lock, nova
evidência docs/evidence/C11_FIRE_STICK_CLEAN_INSTALL_TEST.md e memória STATUS/
EVOLUTION_REPORT/ERRORS_AND_BLOCKERS. Sem edição de produção, rebuild, troca do
APK, seed de fonte/debug ou modificação de políticas comerciais.

Dispositivo único: adb -s 192.168.3.104:5555, validar model AFTSSS/API 28 antes
de qualquer remoção. Package único: com.xandeflix.prebuilt; não tocar tablet
RX2X301Q3KY nem package protegido com.xandeflix.app. APK raiz imutável esperado
SHA-256 0450304141F162E0C3C912D416407B40A3B0620F1CB72D458B43C77E6EAC3781,
mesmo certificado b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d.
Executar lock obrigatório antes da entrega/instalação e validar assinatura.

Operações autorizadas: uninstall SEM -k (remove todos os dados privados deste
app: identidade/ativação/fonte/cache/catálogo), confirmar package ausente,
install APK verificado, verificar APK instalado por hash/package e estado
sem dados anteriores. Se dados forem restaurados automaticamente, pm clear
somente deste package para cumprir instalação limpa. Não exportar/restaurar
identidade, chaves, tokens ou fonte. Perda dos dados anteriores não é recuperável
por este teste; APKs anteriores no workspace continuam recuperáveis.

Abrir MainActivity normal para teste, sem flags/intents de provisionamento;
medir início real da Activity e logs sanitizados por PID. Instalação limpa deve
exibir ativação pendente e gerar código/chave locais; até autorização legítima
não acessar fonte nem importar catálogo. Se exigir pareamento no Manager/portal,
solicitar ao usuário realizá-lo; não autoaprovar nem recriar fonte/slot/licença.
Depois, observar importação normal e Home com conteúdo: tempo do início da
importação até promoção/Home e tempo total incluindo espera humana, separados.
Meta <=60s deve declarar marco/fonte/rede e excluir claramente espera humana
quando se mede processamento; não chamar tela de ativação de Home carregada.

Logs em memória somente selecionados/sanitizados, sem payloads, credenciais,
PIN/hash de ativação, URLs de fonte ou catálogo exportados. Capturas visuais de
ativação não serão salvas porque podem conter chave permanente. Sem logcat -c,
uninstall de outros apps, reboot, alteração do Wi-Fi/ADB global ou backups.
Monitoramento em intervalos curtos, comunicando progresso; nenhum resultado
positivo é presumido pelo PASS sintético, e regressão física supersede-o.

Se UIAutomator não expuser conteúdo do WebView, permitir conexão read-only ao
socket de debug do PID confirmado, por um único adb forward loopback temporário
deste alvo, removido ao terminar. CLI agent-browser ausente: fallback via CDP
local sem dependências novas. Avaliações retornam somente booleans, contagens,
milestones numéricos e nomes fixos de botões; nunca body/DOM bruto, PIN/hash,
tokens, fonte ou snapshot. Sem navegação/reload/injeção de estado ou dados.
