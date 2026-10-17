# C135 — fonte ativa, area 18+ e cronometro parental

Concluido em 2026-10-17. [Spec e emendas anteriores ao codigo](../architecture/C11_ACTIVE_SOURCE_AND_ADULT_VISIBILITY.md).
Preflight no clone ativo C:\Xandeflix\xandeflix-prebuilt-c11-main, main/origin
esperado, HEAD bd7e10c7c069df66328309105b6b210d04c7cf2d. AGENTS/Architecture/Execution/Source Boundary/Activation
Lock lidos; C134 auditada PASS antes do patch. Baseline1115 arquivos e prefixos
de memoria capturados em tmp/c135-active-source, alem do APK anterior por hash.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Sem Git writes, backend writes,
instalacao, reset ou alteracao de credenciais/vinculo/politica do usuario.

## Comportamento

Novo acesso discreto18+ no menu lateral/cabecalho e em Settings. PIN global
precede qualquer imagem e abre pagina propria com grade paginada de filmes e
series explicitamente adultos da fonte, incluindo regra local manual adulta.
Categorias comuns de filmes/series nao exibem rails adultos. Mantidos setup,
limite18, permitir adulto, sessao15min e autorizacao de playback independente.
Detalhes da grade tem flag privada de rota; Back conserva a sessao no percurso
privado. Saida para destino publico bloqueia antes de renderizar, inclusive PIN
pendente; sem reutilizar grants de conteudo para liberar uma area.

Live permite nomes de categorias adultas bloqueadas. Canais/nomes/logos/lista
permanecem filtrados ate PIN. Cancelar/errar conserva categoria/canal anterior.
PIN usa ocultacao nativa C134, sem sobrepor video a janela e sem abrir segunda
conexao. Dependencia do efeito de midia passou de objeto projetado inteiro
para snapshotId: desbloquear uma categoria nao reinicia o mesmo canal/C9.

Settings mostra fonte do catalogo REAL efetivamente promovido e fonte vinculada
confirmada via resolver existente, por ID/versao, ultima importacao e estado de
comparacao. pointer/manifest/pointer devem concordar. DTO nao oferece nome
amigavel; nao inventar nome nem consultar config/cofre para label. Respostas e
erros sao projetados por whitelist: sem URL, senha, token ou payload livre.
Conferir fonte e Atualizar catalogo reutilizam coordenador/guarda de promocao,
single-flight, somente Settings visivel/online, sem modal/player/Cast. Nenhum
catalogo remoto e autorizado por esse card; falha conserva ativo.

PIN compartilha contagem local: falhas1–5 incorretas; sexta incorreta bloqueia
3h, revoga sessoes/grants e persiste no registro existente. Correto antes da
sexta zera falhas. Bloqueio impede KDF/tentativas adicionais e recuperacao PUK.
Ao terminar o prazo, nova janela de seis. KDF600000/versao1/alias/cifra/prefs e
regras continuam. Nenhum PIN/PUK/regra/conteudo de usuario enviado ao servidor.

Prazo usa ancora monotona opcional pinBlock, nunca Date.now como autoridade.
Android: SystemClock.elapsedRealtime e BOOT_COUNT; mesmo boot conta inclusive
app fechado/deep sleep. Reboot/regressao conserva restante/reancora; tempo
desligado sem prova nao e descontado. Web usa performance.now + nonce de
sessao e conserva restante entre recargas; Android sem BOOT_COUNT usa ID de
processo. Registro legado sem ancora migra conservadoramente para3h. Falta ou
erro de clock nao libera. Checkpoint protegido/verificado a cada30s enquanto
bloqueado e antes de verificar segredo; sem rede/NTP/gestor/identidade pessoal.
Referencias primarias consultadas: [SystemClock](https://developer.android.com/reference/android/os/SystemClock)
e [BOOT_COUNT](https://developer.android.com/reference/android/provider/Settings.Global#BOOT_COUNT).

## Verificacao

- C135 fonte8, cronometro/store12, leitor adulto3 PASS; saltos de parede
  +30/−30dias, restart, reboot, clock regredido/indisponivel, expiry exato,
  PUK bloqueado e lock durante KDF nao produzem liberacao tardia.
- UI real, store/crypto, D-pad, leitores locais e commit/Back extraidos do App:
 8/8 perfis Fire/AndroidTV/Box/Tizen/webOS/phone/tablet/foldable PASS. Portas
  de source/native/C9 sinteticas; zero requests externos. PIN antes de arte,
  cancelamento, grade completa54 titulos por cursor (28+24+2), detalhe/Back,
  bloqueio/saida publica e card de fonte verificados. Screenshots privadas.
- Negativa com Live anterior detectou categoria adulta ausente. Logs negativos
  preservados. Primeiras falhas de fixture: export de artwork ausente, retorno
  updatePreview sem previewId, seletor Carregar Mais e aba Categorias mobile;
  corrigidas as portas/seletores, sem relaxar asserts. Teste encontrou reinicio
  real de midia ao mudar projecao; patch minimo acima corrigiu e manteve assert.
- Leitor novo restaura cursor em falha/abort para retry nao omitir lote ja
  coletado. Falha sintetica na segunda fase e retry54 sem duplicatas PASS.
- Regressoes finais16 suites PASS: C12616, C12811, C1298, C1338, C134preview8,
  C134ativacao8, C114/C112/C106/C9, refresh automatico19, boot15 e quatro C135.
  C106 recebeu portas para isAdultLocation/lock e assert de ordem reforcado;
  fixture historica boot recebeu metadata do perfil atual para testar NO_OP.
  Logs iniciais FAIL preservados; coordenador/perfil produtivos nao alterados.
- Lock antes/prebuild PASS: ativacao26, promocao27, controles negativos9.
  Typecheck/Vite/sync/Gradle PASS; 205 testes Java,35 suites, zero falhas/skips.
  Avisos conhecidos de modulos Node externalizados/chunk Vite/deprecacao Java.
- Revisao React: assincronia cancelada/epochs, single-flight, cleanup, chaves
  estaveis kind:id, paginacao local, modais antes de foco e sem nova biblioteca.
  AppShell so sofreu normalizacao de newline, conteudo igual a HEAD.

## APK e auditoria

APK tmp/c135-active-source/Xandeflix-v1.0.24-C135.apk. Package com.xandeflix.prebuilt,
versionCode24/name1.0.24, min23/target35, 11385598 bytes.
SHA-256: 559cbe905898853765f9f4c3f8ac7373870c62885aa5607912a8a4a1da8514cd. Mesma assinatura anterior, HTTPS local, logging none,
sem dev server; dist8/public10 verificados por hash.1412 recursos nativos
identicos, preservando icones/banner.10 DEX identicos; classes10/11 mudaram
somente BuildConfig e LocalParentalControlPlugin. Comparacao normalizada liga
annotations a classe correta; instrucao/constantes/simbolos preservados para
as demais, inclusive player e secure source. APK1.0.23 preservado por hash.
Auditoria final esperada26 arquivos existentes allowlisted +13novos,
1089 arquivos baseline preservados; memorias append-only/Git HEAD/main/origin
inalterados/index vazio. Relatorio verificavel privado audit.json.

## Limites factuais

Consultas Supabase read-only ao projeto esperado foram negadas por permissao.
Binding real/fonte comercial/conteudo do aparelho XF-YBK1-81RA nao confirmado;
nao alegar que foi trocado ou atualizado remotamente. Validacao e local com
fixtures isoladas. Ainda requer teste fisico/manual de PIN/IME/composicao do
player no Fire Stick e lista real da fonte. Sem instalacao automatica.
Tempo desligado entre boots nao e deduzido sem evidencia confiavel; a escolha
conservadora evita que reiniciar ou mudar horario reduza o bloqueio.
