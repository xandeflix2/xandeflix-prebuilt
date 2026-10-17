# C156 — PIN web independente e recuperacao local com PUK — 2026-10-17

## Autorizacao e preflight anteriores ao codigo

Usuario determinou implantar criacao de PIN web, opcao exclusiva nas
Configuracoes separada do controle parental, recuperacao de PIN perdido com
PUK e APK atualizado para instalacao nos dispositivos. Continua autorizada
a publicacao/Git do mesmo repositorio/projeto; sem instalar/resetar aparelhos
neste pedido. GIT_COMMIT_AUTHORIZED=SIM; GIT_PUSH_AUTHORIZED=SIM;
GIT_PR_AUTHORIZED=NAO. CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C156;
NEXT_GATE_STARTED=NAO. Nao iniciar outro Gate.

Preflight: clone independente C:/Xandeflix/xandeflix-prebuilt-c11-main, main,
origin https://github.com/xandeflix2/xandeflix-prebuilt.git, HEAD
8d5744e1390848381e1ec1735e5c4010eab41e87, arvore limpa. AGENTS, Architecture,
Execution, Source Boundary, Activation Lock, C126/C155 lidos. Projeto
cujbmyhitgomlgwfkaat ACTIVE_HEALTHY confirmado pela conexao correta. Lock
anterior ao patch executado. Baseline/copias privadas em tmp/c156-web-pin.
Proveniencia exclusiva deste pedido; workspace historico/projeto original
protegidos. Build anterior C149 preservado como artefato recuperavel.

## Contrato e emenda limitada

- Substituir a opcao C155 de reutilizar o PIN parental por PIN web independente
  de seis digitos. Criacao/recuperacao no aparelho autorizado exige PUK local
  valido e rejeita novo PIN igual ao parental. Nao abrir admin/sessao adulta,
  alterar PIN parental/PUK/politicas, identidade/licenca/fonte ou ativacao.
- Nova janela dedicada Configuracoes -> PIN web. Criar/configurar recuperacao,
  redefinir/recuperar com PUK, mensagens sanitizadas, confirmacao, segredos
  mascarados/limpos ao sair, ocupado durante crypto/rede, navegacao D-pad.
  Sem PUK configurado, orientar configuracao local do controle/PUK existente.
- PUK, hash/verificador parental/PUK nunca saem do aparelho. Para tornar
  recuperacao verificavel no servidor sem receber PUK, gerar par ECDSA P-256;
  cifrar chave privada PKCS8 local com AES-GCM256 e chave PBKDF2-SHA256/600000
  derivada do PUK, salt128bits/IV96bits aleatorios e AAD do dispositivo/chave.
  Armazenar somente envelope cifrado local verificado; nunca chave privada
  em claro em storage/log. Servidor guarda exclusivamente chave publica de
  recuperacao e desafios efemeros privados de autenticacao, nao PUK/verificador
  do PUK nem envelope privado. Emenda limitada C155/Source Boundary para esses
  metadados publicos de prova, sem dados de conteudo ou cofre.
- Criacao no aparelho: validar PUK local, persistir envelope antes de pedir
  registro remoto, prova nativa original obrigatoria. Se PIN web ja existe
  sem chave de recuperacao, exigir tambem PIN web atual para registrar a
  recuperacao. Sem ambos, nao redefinir silenciosamente. Falhas contam no
  mesmo bloqueio web existente. Falha de rede permite reconciliar envelope
  pendente com chave publica remota, sem regeneracao silenciosa.
- Recuperar/redefinir: PUK local valido desbloqueia chave privada apenas em
  RAM; servidor emite desafio aleatorio uso unico60s vinculado ao aparelho,
  chave de recuperacao, versao da credencial e geracao da chave permanente.
  Assinatura ECDSA sobre desafio + novo PIN (digest) validada na Edge; commit
  atomico revalida prova nativa, versoes, assinatura verificada e bloqueio.
  Replay/assinatura de outra chave/challenge/novo PIN sao recusados.
  Token web delegado e PIN web sozinhos nunca cadastram/recuperam credencial.
- Bloqueio de6o erro/3h do servidor nao pode ser removido por cadastro/reset,
  gestor, concorrencia ou hora do cliente. Redefinir revoga sessoes web e C9
  correspondentes sem alterar token/playback nativo. API antiga ENROLL_PIN
  desativada; gestor pode criar PIN inicial, mas nao recuperar/redefinir PIN
  existente sem prova do PUK. Sem recovery previamente vinculado e sem PIN
  web atual, nao prometer recuperacao retroativa de um cadastro C155.
- Troca legitima do PUK parental reencapsula a mesma chave privada local
  com novo PUK, sem alterar chave publica ou enviar PUK. Falha de escrita
  impede troca e conserva envelope anterior; nunca tratar corrupcao como
  ausencia nem limpar registro automaticamente.
- Consumidor web publico nao recebe essa tela de cadastro/PUK: orienta
  recuperacao no aparelho ativado. PIN web nao libera automaticamente area18+.
  PIN local existente nao e enviado/sincronizado; cofre/catalogo/search/media
  diretos e caminhos Android de identidade/ativacao/C9 permanecem intactos.

## Allowlist estrita

- Este contrato e nova evidencia docs/evidence/C11_SEPARATE_WEB_PIN_RECOVERY.md;
  emendas relacionadas em C11_EXISTING_DEVICE_WEB_LOGIN.md,
  C11_LOCAL_PARENTAL_CONTROL.md, XANDEFLIX_PREBUILT_ARCHITECTURE_CONTRACT.md,
  XANDEFLIX_PREBUILT_SOURCE_DATA_BOUNDARY.md; tres memorias append-only.
- src/ui/pages/SettingsPage.tsx: nova opcao/janela, montar conteudo somente
  ao abrir esta opcao; ParentalControlPage.tsx: retirar reuso C155 e corrigir
  explicacao, mantendo restante do fluxo/politicas.
- Remover src/web-production/WebPinEnrollment.tsx; novos WebPinSettings.tsx,
  WebPinSettings.css, web-pin-device.service.ts, web-pin-recovery.crypto.ts,
  web-pin-recovery.storage.ts; web-access.client.ts: novas operacoes tipadas;
  login.ts: somente orientacao de recuperacao no aparelho, sem campo PUK web.
- src/parental/parental-control.store.ts: verificacao local do PUK e PIN
  independente, sem grants; hook transacional local na troca legitima do PUK.
- src/debug/manager/ManagerWebPin.tsx: criacao inicial e orientacao de PUK,
  sem reset administrativo do PIN existente nem alterar role/listagens.
- supabase/functions/web-device-access/{index,crypto}.ts: protocolo de prova
  acima preservando LOGIN/rate/capabilities. Nova migration gerada pela CLI
  c156_separate_web_pin_recovery: tabelas privadas RLS/REVOKE, RPCs service-only
  de estado/desafio/commit, guard em SET_PIN e desativacao ENROLL legado;
  nao mudar tabelas/funcoes de source, C9, identidade, licenca ou vault.
- Novo scripts/test-c156-web-pin-recovery.mjs e package.json site:build novo
  check, sem dependencia. Testes existentes integrais.
  Sucessao explicita do ultimo caso de test-c155-existing-device-web-login.mjs:
  a antiga expectativa ENROLL_PIN nativo200 deixa de valer pois a API de
  compartilhar PIN foi retirada por este pedido. Preservar negativa do token
  delegado e acrescentar negativa do ENROLL nativo legado; controle positivo
  deve usar DEVICE_STATE com prova nativa, e cadastro/PUK no novo teste real.
  Nao reduzir asserts de LOGIN, manager/JWT, isolamento, identidade ou lock.
- android/app/build.gradle: somente versionCode31/versionName1.0.31.
  Saidas habituais ignoradas dist/cap sync/Gradle/tmp; nao editar Java/native
  bridge/config de backup/Capacitor, package-lock, player, search ou catalogo.
  APK assinado com identidade canônica existente, nova copia versionada e
  hash/cert/package conferidos. Nenhuma instalacao/uninstall/reset autorizado.

## Aceitacao e implantacao

Testes crypto reais: PUK errado/tamper/novo PIN adulterado/assinatura/replay;
PUK troca com rollback e sem exportacao; PIN parental diferente, sem grant;
registro previo exige PIN atual; desafio uso unico/versao/chave; sexto erro
concorrente preserva3h; gestor/web nao contornam PUK. SQL sintetico rollback
e HTTPS Edge real com fixture sintetico sem URL/cofre/conteudo, manifesto e
limpeza antes/depois (nenhum cliente/fonte real). Fonte real nao e teste deste
ciclo. Confirmar grants/RLS/advisors, lock antes/depois, C126/C155/C156/C9
focados, typecheck, builds site e APK; Chrome isolado da janela e login.
Backend aditivo antes de publicar frontend; Git/Vercel somente equipe2 atual,
com monitoramento por GitHub/HTTPS se integracao continuar sem acesso aos logs.
Concluir com APK verificavel, sem prometer homologacao fisica de dispositivos.

## Resultado consolidado — 2026-10-17

IMPLEMENTADO=SIM; BACKEND_CANONICO_IMPLANTADO=SIM; FRONTEND_PUBLICADO=SIM;
APK_GERADO=SIM; INSTALACAO_FISICA_EXECUTADA=NAO; NEXT_GATE_STARTED=NAO.
Commit funcional33febc619a09ea08f2f9a60617b9d06a36459b6f em origin/main,
Vercel equipe2/projeto xandeflix-prebuilt-nm3x concluido; HTTP/Chrome publico
verificados. APK1.0.31/code31 assinado com certificado anterior, arquivo
tmp/c156-web-pin/Xandeflix-v1.0.31-C156.apk. Contrato, testes, hashes,
limites e operacao detalhados na evidencia C11_SEPARATE_WEB_PIN_RECOVERY.md.
Nenhum reset/instalacao, fonte real ou playback fisico executado pelo agente.
