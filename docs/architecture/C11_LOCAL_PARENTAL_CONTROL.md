# C126 — controle parental local, PIN e PUK — 2026-10-16

Pedido explícito: acesso em Configurações para criar PIN local, permitir
classificações e exigir PIN para conteúdo adulto; adultos ocultos da Home e
Live antes da configuração. Usuário confirmou que títulos sem classificação
exigem PIN com controle ativo. Depois pediu PIN/PUK editáveis na configuração,
PUK para cadastrar novo PIN; PUK perdido não pode ser redefinido pelo gestor.
Recuperação sem PUK depende de instalação limpa/nova identidade/ativação, nunca
rotação automática pelo recurso. Atualização in-place preserva o controle.

Preflight: clone independente C11-main/main/origin esperado, HEAD
0f68f169f7728fae17c8311832b7643629e97a02, baseline1073 em tmp/c126-local-parental-control.
AGENTS/Architecture/Execution/Source Boundary/Activation Lock lidos. C125 fechado;
CURRENT_GATE=NONE; CURRENT_LOCAL_CYCLE=C126. Não autoriza Git/backend/install/reset.

## Comportamento e segurança

- Um perfil parental por instalação/aparelho, independente de identidade,
  licença, chave de ativação e source. Sem rede/Supabase/gestor/telemetria de PIN,
  PUK, preferências, classificações ou associações conteúdo-usuário. Catálogo,
  índices e fontes canônicos não são reescritos. Acesso comercial/C9 mantidos.
  Exceção posterior e estritamente limitada: o verificador de autenticação web
  C155 descrito ao final; as demais proibições continuam obrigatórias.
- PIN seis dígitos com confirmação. PUK gerado aleatoriamente128bits como
  sugestão, editável pelo responsável (16–64 caracteres), confirmação e aviso
  para guardar fora do aparelho. Armazenar somente verificadores PBKDF2-HMAC-
  SHA256/600000, salts aleatórios separados; Web Crypto CSPRNG/subtle obrigatórios,
  sem fallback fraco. Nunca mostrar o PUK já salvo. PIN atual protege ajustes;
  alterar PUK requer também PUK atual. Recuperação: PUK válido + novo PIN
  confirmado, preservando preferências, sem abrir conteúdo automaticamente.
- Android: registro próprio cifrado AES-GCM com chave Android Keystore e prefs
  separadas/excluídas de backup/transferência; não reutilizar cofre de source.
  Web/TV sem bridge: verificadores parentais em armazenamento local da origem;
  sem sincronização do registro parental. A credencial web C155 é separada,
  conforme emenda abaixo. Não prometer resistência a root/ADB, app modificado, ferramentas
  do navegador ou remoção de dados do SO. Não oferecer botão limpar/reset sem
  segredo. Registro corrompido/I/O/crypto indisponíveis falham fechado, nunca
  são tratados como primeira configuração. Escrita deve ser verificada.
- Serializar operações e persistir tentativas/cooldown: cinco falhas geram
  bloqueio progressivo até15min; reiniciar UI não zera tentativas. Comparação
  de verificadores sem saída antecipada; campos de segredo nunca entram em logs.
- Limite por classificação brasileira L/10/12/14/16/18; padrão de configuração16.
  Sem configuração, preservar conteúdos comuns e ocultar adulto explícito.
  Com configuração: conteúdo acima do limite e sem classificação exige PIN
  antes de abrir detalhes/trailer/reproduzir. Informação vem de classificação
  explícita da fonte ou metadata pública TMDB do título validado, sob demanda;
  ausência/falha de metadata não concede permissão. Não consultar milhares de
  classificações no boot. Um grant temporário em RAM vale apenas para título/
  canal selecionado e geração; auto-next da mesma série respeita autorização.
- Conteúdo adulto explícito é distinto de filme comum classificado18. Detectar
  pelos labels/flags locais da fonte. Não exibir cards/grupos/hero/imagens adultos
  até criar controle, habilitar opção e validar PIN para sessão local de
  navegação adulta (máximo15min). Sessão não é autorização comercial e não
  elimina PIN/grant do título. Voltar ao background/reiniciar encerra grants/
  administração/sessão; parar preview adulto se proteção for reativada.
  A expiração não interrompe o filme/episódio nativo já autorizado; novo
  acesso, trailer, troca de título/canal e retorno aos detalhes são novamente
  verificados. A continuidade automática da mesma série mantém a autorização
  daquela cadeia, sem contornar a sessão comercial C9.
- Filtrar antes de artwork/preload/hero e grupos/canais/painéis nativos; busca
  lazy não pode mostrar poster sem reidratar classificação local. Seleção direta,
  favoritos/histórico, search e reprodução são guardados. Adultos continuam fora
  de sugestões/histórico automático conforme política anterior. Nenhuma source
  é excluída nem catálogo alterado. Totais canônicos não são vendidos como
  contagem exata após filtros locais.
- UI touch/D-pad acessível, campos mascarados, erro sanitizado, ocupada durante
  KDF/escrita, foco preso/restaurado em prompt e Back cancela. Settings possui
  quarta opção Controle parental, com subpágina interna e retorno correto.

## Allowlist estrita

Ampliação explícita durante execução: usuário pediu busca com capas para atribuir
restrição manual por conteúdo. Subpágina protegida por PIN reutiliza busca local
em modo edição (sem iniciar conteúdo), seleciona faixa L–18 ou Sempre exigir PIN
e opcional adulto explícito. Regras locais por chave de conteúdo derivada, sem
título/capa/stream em registro e sem upload. Limite256/64KiB; classificação manual
não reduz uma classificação oficial conhecida. PUK atual é obrigatório para
alterar PUK; perda não permite reset pelo PIN/gestor. Adicionar SearchPage.tsx à
allowlist somente passagem de modo de edição/admin para SearchResults/MediaCard.

- Novos src/parental/{parental-control.store,parental-storage,parental-content,
  parental-access}.ts, src/ui/hooks/useParentalControl.ts,
  src/ui/components/ParentalPinDialog.tsx, src/ui/pages/ParentalControlPage.tsx
  e .css. Novos testes scripts/test-c126-parental-control.mjs e teste Java local.
- src/ui/pages/SettingsPage.tsx; src/App.tsx; src/ui/navigation/route-state.ts;
  novo src/ui/components/ParentalDetailGate.tsx para guardar toda rota de detalhe
  antes de montar poster/trailer, sem duplicar as páginas consolidadas.
  src/ui/components/{AppShell,Header,MediaCard,MediaRail,CatalogGrid,Hero,
  SearchResults,AsyncCategoryRail}.tsx; src/ui/hooks/useHeroArtwork.ts;
  src/artwork/{artwork-preload.service,startup-catalog-preview}.ts para impedir
  rótulos/skeletons e amostras automáticas de grupos adultos antes do shell;
  src/catalog/{catalog-view-model,catalog-selectors,catalog-read-model}.ts.
- src/catalog/live/live-catalog.service.ts; src/ui/pages/LiveTvPage.tsx;
  src/playback/playback.service.ts; src/playback/content-adult-policy.ts somente
  flags adicionais; src/artwork/series-presentation.service.ts se necessário
  para leitura de classificação já em cache, sem alterar matching/API/source.
- Novo plugin Android LocalParentalControlPlugin.java e helper de store/teste;
  MainActivity.java somente registro; backup_rules.xml/data_extraction_rules.xml
  somente exclusão do registro parental. Sem mudar player Java/C9/vault/source.
- Este plano/evidence C11_LOCAL_PARENTAL_CONTROL.md; memórias STATUS/EVOLUTION/
  ERRORS append-only; harnesses existentes somente novos bindings necessários,
  sem relaxar asserts de ativação/autoridade/search/playback. Outputs ignorados
  Novo scripts/lib/parental-fixture-bindings.mjs fornece estado parental ainda
  não configurado aos harnesses legados e storage sintético aos testes C9;
  não substitui os testes de proteção configurada/adulta/negação do C126.
  e helpers privados do ciclo; APK C126 separado, mantendo C125.

## Aceitação

Testes de PIN/PUK correto/errado, perda/reset sem segredo negados, salts/sem
plaintext/persistência/falha/corrupção/restart/concorrência/limites/cooldown/grants;
age/adult/unrated guard de detalhes e reprodução; fonte sem classificação exige
PIN; nenhum adulto exposto antes de setup/sessão inclusive busca/segmentos e
painéis nativos; cancela e não inicia stream/C9 por rejeição. UI oito perfis,
touch/D-pad/Back/foco. Auditoria sem caminhos de upload parental/backend e sem
mutação de catálogo. Regressões consolidadas, lock inicial/final/prebuild,
typecheck/build/sync/Gradle, verificação APK/assinatura/provenance. Medições de
KDF são empíricas, não SLA. QA física e SO Samsung/LG não inferidos de mocks.

Referências técnicas: [PBKDF2 OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits),
[Android Keystore](https://developer.android.com/privacy-and-security/keystore).
NEXT_GATE_STARTED=NAO.

### Revisao final: busca Live e relock

Resultados de canais previamente reidratados devem perder imediatamente a
permissao de exibir capa/titulo quando a sessao adulta termina, a protecao e
reativada, uma regra muda ou o storage entra em erro. Invalidar o escopo local
dos IDs aprovados antes do proximo efeito assincrono; testar a busca aberta
durante o relock, alem de Home e preview. Nenhuma alteracao do indice/source.

## Emenda limitada C155 — mesmo PIN para autenticação web — 2026-10-17

Autorização explícita do usuário: prosseguir com a emenda limitada para acesso
web com os dados do cliente existente. Escopo, provisionamento e critérios em
[C11_EXISTING_DEVICE_WEB_LOGIN.md](C11_EXISTING_DEVICE_WEB_LOGIN.md).

Substitui exclusivamente a proibição de uma credencial remota derivada do PIN
para autenticação web. Permite verificador protegido em schema privado do
Control Plane, separado do registro parental e dos cofres de fonte. PIN não é
persistido em texto nem aparece em respostas, listagens, logs ou telemetria.
Verificador remoto usa salt próprio, KDF forte e proteção adicional exclusiva
do servidor; não exportar nem reutilizar verificador/salt do aparelho.

O mesmo valor de seis dígitos pode ser cadastrado após validação local do PIN
atual no aparelho autenticado. PINs existentes não ficam automaticamente
disponíveis ao servidor; o cadastramento exige fluxo autenticado. Gestor ADMIN
responsável ou MASTER pode criar/alterar a credencial de entrada web no seu
escopo, com autorização no servidor e auditoria sanitizada. Nunca revelar PIN
salvo nem redefinir silenciosamente o PIN parental do aparelho. Alterar PIN
web revoga suas sessões; compartilhar o novo valor com o parental exige
confirmação no fluxo local já protegido, sem contornar PIN/PUK existentes.

PUK e seu verificador, políticas, classificações, restrições, preferências,
histórico e associações de conteúdo continuam exclusivamente locais. Não há
sincronização do registro parental nem recuperação remota do PUK. O PIN não
cria binding de fonte, identidade, licença ou direito de reprodução. C9,
autorização comercial, filtros e grants parentais existentes permanecem.

Login web exige código/chave permanentes e PIN cadastrados, validados no
servidor. Sexto PIN incorreto bloqueia por três horas com contador atômico e
relógio do servidor; sem bypass por reload, concorrência ou relógio local.
Sessão delegada não cria novo usuário/dispositivo/ativação nem substitui o
token original do aparelho. Catálogo/busca locais e playback direto mantidos.

Esta emenda é normativa e documental: não implanta banco, endpoints, login ou
atualização dos aparelhos. Demais regras C126 e emendas posteriores, inclusive
controle de tentativas local, permanecem. NEXT_GATE_STARTED=NAO.

## C156 — PIN web independente e recuperacao por PUK local — 2026-10-17

Pedido posterior substitui o reuso do PIN parental C155 por cadastro separado
em Configuracoes -> PIN web. Especificacao/allowlist anterior ao codigo em
[C11_SEPARATE_WEB_PIN_RECOVERY.md](C11_SEPARATE_WEB_PIN_RECOVERY.md).
PIN web novo deve ser diferente do parental; criacao/recuperacao local exige
PUK valido e nao concede grant parental/adulto. PUK e seus verificadores nao
saem do aparelho. Servidor recebe somente chave publica ECDSA de recuperacao
e desafios efemeros; chave privada fica cifrada localmente sob PUK/AES-GCM
e nunca e persistida/transmitida em claro. Isso nao e verificador remoto do
PUK nem permite atacar o PUK com dados do servidor. Troca legitima do PUK
reencapsula localmente a chave, sem mudar prova publica ou enviar segredo.
Gestor pode criar PIN inicial; depois de cadastrado, recuperacao/redefinicao
exige prova vinculada ao PUK no aparelho, sem reset administrativo legado.
PINs C155 sem recovery exigem PIN web atual para vincular recuperacao; nao
prometer recuperacao retroativa sem essa preparacao. Bloqueio3h preservado.
Nenhuma mudanca em fonte/vault/catalogo/busca/player/identidade/licenca/ativacao.

## C160 — opcao local e excecao Live comum — 2026-10-18

Pedido posterior autoriza a emenda limitada especificada antes do codigo em
[C11_PARENTAL_DEVICE_SWITCH_AND_LIVE_PIN.md](C11_PARENTAL_DEVICE_SWITCH_AND_LIVE_PIN.md).
Administracao autenticada pode suspender/restaurar restricoes comuns locais
sem apagar PIN/PUK/preferencias/tentativas; legado permanece ativo. Canais
comuns deixam de sofrer filtro/PIN por idade ou regra alwaysPin. Adultos
explicitos continuam opt-in/18/PIN, com modal ao selecionar canal elegivel
sem sessao e grant restrito ao canal apos sucesso. Sem backend/source/C9
ou alteracao do PIN web; corrupcao e falhas continuam fechadas.
