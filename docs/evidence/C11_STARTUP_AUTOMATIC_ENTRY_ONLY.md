# C150 - entrada automatica na inicializacao - 2026-10-17

Spec anterior: docs/architecture/C11_STARTUP_AUTOMATIC_ENTRY_ONLY.md.
Preflight no clone independente ativo/main/origin esperado, HEAD
bd7e10c7c069df66328309105b6b210d04c7cf2d. Baseline1180 e copias anteriores
em tmp/c150-startup-no-skip; continuidade C149 verificada por hashes.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem operacoes Git/backend/dispositivo.

## Resultado funcional e limites

Removido o unico Entrar agora e suas duas refs, sem condicao por perfil.
O botao existia somente no preparo final Fire; demais perfis ja nao ofereciam
essa acao. Teclas de navegacao/OK/Espaco/Voltar nao liberam mais a Home durante
esse preparo. Captura e isolamento terminam automaticamente, restaurando o
foco anterior do Hero. O dialogo recebe foco programatico/tabIndex=-1, sem
adicionar item ao percurso Tab da carga normal.

O motor automatico permanece identico: max40 capas/40 leituras geometricas,
8 eager por faixa, fallbacks terminais, estabilidade500ms, polling250ms,
prazo defensivo20s e cancelamento no unmount. Esse prazo impede espera
infinita por arte indisponivel; nao cancela importacao/download nem significa
esperar indexacao de todo catalogo em segundo plano. Boot/autorizacao/leitura
parental e suas guardas nao mudaram. Recuperacao em erro/offline preservada.

## Verificacoes executadas

- Lock inicial26 ativacao+27 promocao+9 controles negativos PASS.
- Suite existente test-c11-startup-artwork PASS: limites reais, estabilidade,
  timeout, cancelamento, propagacao eager, exclusividade Fire/omissao dos
  demais perfis, cleanup/foco e nao repeticao por perfil/snapshot tardios.
  Acrescentados11 eventos de teclado/controle antes da conclusao: nenhum
  cancela o preparo, libera isolamento ou foca a Home. Demais asserts intactos.
- Portas sinteticas da apresentacao real:28 renders (7 etapas x4 perfis),
  sem botao de entrada;3 estados de sincronizacao preservam as acoes de erro;
  overlay sem actions e foco dirigido ao proprio dialogo. presentation.json PASS.
- C143 preferencias:5 casos PASS, leitura concorrente deduplicada, sem shell
  intermediario nos perfis/rotas cobertos, pronto/desconfigurado/erro fechado.
- Build web/typecheck/prebuild lock PASS, Vite29.15s. HTTP200 dos2 modulos
  atualizados no localhost3000, sem texto/acao Entrar agora.
- Revisao React: hooks incondicionais/dependencias estaveis, sem novo timer,
  fetch ou estado; listener limpo em done/unmount, foco e live status preservados.
- Auditoria inversa dos2 TSX e do teste preserva exatamente todo o restante,
  inclusive todos os asserts antigos. Hashes protegem motor automatico, App,
  source/catalog/search/player/stores/Android/versao/dependencias/APK149.

CUA nao oferece navegadores/apps. Testes sinteticos e HTTP nao certificam
renderizacao fisica; nenhum APK novo foi gerado ou instalado neste ciclo.
Artefato1.0.30 anterior permanece intacto e nao contem este patch.

## Ocorrencias operacionais

Busca inicial com glob docs/architecture/C11* falhou no Windows (os error123);
repetida no diretorio real com filtro rg apropriado. Helper baseline em
node -e perdeu aspas no PowerShell e falhou antes de executar; corrigido com
here-string via stdin. Sem escrita parcial ou alteracao funcional causada
por essas falhas. Avisos Vite de modulos Node externalizados/chunks grandes
preexistentes, sem ampliar escopo ou dependencias.


Verificacao final: build padrao/typecheck/prebuild lock26+27+9 PASS, Vite23.79s.
Ambos bundles web/padrao sem Entrar agora. Auditoria final baseline1180/1174
preservados, apenas2 TSX/teste/3 memorias alterados e2 docs novos allowlisted;
reversao dos patches exata, HEAD/main/index e APK149 intactos. Sem APK/sync/
Gradle/install/reset/backend/Git ou proximo Gate.
