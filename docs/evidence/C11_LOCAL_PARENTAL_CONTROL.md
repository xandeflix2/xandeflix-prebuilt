# C126 — controle parental local, PIN/PUK e regras por capa — 2026-10-16

## Escopo e proveniência

Pedido do usuário: controle parental em Configurações, faixa etária e adulto,
PIN/PUK definidos pelo responsável e recuperação sem gestor. Confirmação do
usuário: conteúdo sem classificação exige PIN depois de configurar o controle.
Ampliação autorizada: buscar conteúdo local, selecionar a capa e definir uma
restrição manual. Sem PUK, não existe recuperação interna sem o segredo;
instalação limpa/nova ativação é o procedimento de recomeço, sem automatizá-lo.

Preflight no clone independente C11-main, main/origin esperado, HEAD
`0f68f169f7728fae17c8311832b7643629e97a02`. Baseline privado de 1073 arquivos,
prefixos das três memórias e Git registrado em tmp/c126-local-parental-control.
AGENTS/Architecture/Execution/Source Boundary/Activation Lock lidos antes das
alterações; spec C11_LOCAL_PARENTAL_CONTROL precedeu o código. Escopo C126,
CURRENT_GATE=NONE; preservadas as mudanças anteriores C107–C125. Nenhum Gate,
commit/push/PR, backend, instalação, limpeza de aparelho ou reset iniciado.

## Resultado implementado

- Quarta opção em Configurações abre a página do controle. Configuração exige
  PIN de seis dígitos e confirmação; PUK editável de 16–64 caracteres, sugestão
  aleatória de 128 bits e confirmação de que foi guardado fora do aparelho.
  PUK já salvo nunca é revelado. Login parental dura dois minutos; sair da
  página encerra a administração. Alterar PIN exige PIN atual; recuperação
  exige PUK; alterar PUK exige também o PUK atual, mesmo conhecendo o PIN.
- Faixas L/10/12/14/16/18, limite inicial de configuração 16. Acima do limite
  ou sem classificação, PIN antes dos detalhes/trailer/player. Dados de idade
  explícitos da fonte ou apresentação TMDB já validada, sob demanda; nota de
  avaliação/ano/categoria genérica não são tratados como classificação etária.
  Não há varredura remota de todo o catálogo no boot.
- Busca local protegida pelo login parental, com capas para seleção de filme,
  série ou canal. Regra manual pode elevar a faixa, exigir PIN sempre ou
  marcar como adulto explícito. Remover a regra não altera a classificação
  original. Classificação manual não reduz uma classificação conhecida. Até
  256 regras por aparelho, registro total limitado a 64 KiB; a tela mostra o
  contador. Persistem apenas chave derivada e opções, sem título, capa, stream,
  identidade do dispositivo ou credenciais da fonte no registro parental.
- Adulto explícito fica oculto por padrão, separado de um filme comum 18 anos.
  Habilitar a opção não revela os títulos: exige PIN para uma sessão de
  navegação adulta de até 15 minutos. Cada título/canal continua protegido.
  Filtros antecedem cards, heros, preloads, amostras iniciais, categorias,
  busca reidratada e projeções de canais. Reativar bloqueio esconde também
  canais adultos previamente exibidos na busca, antes da próxima hidratação.
- Acesso direto, favoritos, detalhes, reprodução VOD e seleção/preview Live
  passam pelo guard antes de obter sessão C9 ou resolver/iniciar stream.
  Cancelar/Back/abortar não concede acesso. Grants em RAM valem apenas para o
  conteúdo e snapshot selecionados; background/restart limpa grants/admin/
  navegação adulta. Filme/episódio nativo já autorizado e auto-next daquela
  série continuam; novos acessos são verificados. Preview adulto é retirado
  quando a sessão adulta termina. Nenhuma conexão de vídeo de prefetch criada.
- Catálogo e índice não são reescritos. Os filtros são projeções locais; os
  totais globais canônicos podem incluir conteúdos ocultos. PIN/PUK/regras não
  são enviados a Supabase, gestor ou telemetria. Consultas públicas TMDB já
  existentes continuam apenas com identidade pública da obra.

## Armazenamento e fronteiras de proteção

Verificadores separados PBKDF2-HMAC-SHA256/600000, salts aleatórios separados,
Web Crypto obrigatório, sem fallback fraco nem PIN/PUK em texto puro. Cinco
falhas produzem cooldown progressivo persistente, compartilhado por PIN/PUK,
até 15 minutos. Operações serializadas; corrida com background não abre
administração. Corrupção, erro de leitura/escrita ou crypto indisponível
bloqueiam acesso, nunca recriam a configuração. Escrita verificada por leitura.

Android: plugin próprio, AES-256-GCM, IV aleatório, AAD versionado, chave no
Android Keystore, preferences privadas separadas e excluídas de backup/cloud/
transferência. Sem método de apagar/exportar/resetar e sem fallback Android
para localStorage. MainActivity alterada somente para registrar o plugin.
Web/TV sem bridge usa armazenamento local da origem, somente verificadores e
preferências. Atualização in-place preserva o controle; mudança de identidade
ou chave de ativação não é função do recurso.

Não protege contra root/ADB, aplicativo modificado, ferramentas do navegador
ou exclusão dos dados pelo próprio sistema operacional. A marcação adulta
depende dos labels/flags fornecidos pela fonte e das regras manuais; não é um
classificador semântico universal. Aparelho sem controle configurado mantém
conteúdos comuns disponíveis e oculta adulto explícito. Não há recuperação
por gestor, conta, e-mail ou chave de ativação.

Referências: [PBKDF2 OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveBits),
[Android Keystore](https://developer.android.com/privacy-and-security/keystore).

## Verificação

- C126: 16 grupos PASS. PIN/PUK/KDF/salts, ausência de plaintext, cooldown e
  restart, regra allowlist/limite/cópia defensiva, recuperação preservando
  regras/política sem desbloquear, troca de PUK protegida pelo PUK atual,
  idade/unrated/grant por conteúdo/snapshot, adulto opt-in/sessão, corrupção/
  I/O/crypto, concorrência/background, parser etário, projeção Live imutável,
  PlaybackService real negando filme/episódio antes do C9/player, abort, e
  SearchResults real invalidando IDs reidratados antes do efeito após relock,
  mudança de regra ou erro de storage. Somente dados sintéticos nos testes.
- Browser privado: dez relatórios PASS, oito perfis. PHONE390x844,
  FOLDABLE800x880, TABLET1280x800, FIRE_TV960x540, ANDROID_TV1280x720,
  ANDROID_BOX960x540, TIZEN1280x720, WEBOS1280x720. UI/store/Web Crypto reais;
  portas source/search/native/C9 isoladas. Setup, busca por capa, regra manual,
  detalhes negados antes do PIN, PIN incorreto/correto, Back, foco D-pad no
  prompt, cancelamento Live sem conexão adicional e ausência de overflow.
  Fire também recupera PIN por PUK sem perder regras, desbloqueia sessão adulta
  e bloqueia Home/busca Live aberta novamente. Zero requests externos/erros JS.
  Capturas phone/tablet conferidas; arte neutra de fixture.
- Java ParentalCipherTest: dois testes PASS, envelope autenticado, IVs distintos,
  adulteração/chave incorreta e tamanho máximo. Não é teste físico do Keystore.
- Regressões PASS: C1219, C12311, C12410, C1259, C1056, C1068, C10711,
  C11410, C11011, home-hero, category-rails, detail-tablet-tv,
  search-details-related, startup-artwork, VOD direct stream12 e C9 wiring10.
  Harnesses legados receberam bindings de estado parental não configurado e
  campos canônicos faltantes em fixtures; nenhuma asserção relaxada. Testes
  configurados/adultos/negação do C126 usam os guards e o store reais.
- Revisão React: hooks incondicionais, foco modal/restauração e Back, abort/
  cleanup, versão de seleção para invalidar conteúdo permitido antigo,
  operações assíncronas guardadas e revisões de conteúdo separadas de busy
  para não reiniciar preview durante verificação/gravação do PIN.

As simulações não certificam hardware, tempo de KDF em Fire Stick fraco,
resposta real da fonte/TMDB, reprodução externa nem ausência universal de
regressões. Perfis Tizen/webOS simulados não são pacotes nativos Samsung/LG.
PHYSICAL_QA=NOT_EXECUTED; NEXT_GATE_STARTED=NAO.


## Artefato final e auditoria

TypeScript/Vite build PASS (559 módulos), lock antes/depois/prebuild PASS:
26 testes de ativação + 27 de promoção + 9 controles negativos. cap sync
android e Gradle testDebugUnitTest/assembleDebug PASS após o último patch.
Avisos Vite node:fs/path externalizados, imports estáticos/dinâmicos/chunk
grande e Gradle flatDir mantidos; sem nova dependência. O plugin Java novo
está no DEX. O arquivo gerado capacitor.build.gradle ficou idêntico à baseline.

APK: tmp/c126-local-parental-control/Xandeflix-v1.0.19-C126.apk,
12709074 bytes; SHA256 d9b68fdceb62d59ada399c6c42b7854f64560c77ad1c4b22d984df21c2e41158.
Package com.xandeflix.prebuilt/code19/name1.0.19/min23/target35, oito arquivos
dist conferidos por hash contra o pacote, HTTPS localhost/logging none/sem
dev server, mesmo certificado C125; 12 DEX e plugin parental empacotado.
C125 preservado por hash. Este é APK de teste debug local, não publicação.
Não instalado. Nenhum segredo de fixture no JS público empacotado.

Auditoria final contra baseline1073: 38 existentes autorizados, incluindo
três memórias com prefixos preservados byte a byte; 16 novos da allowlist.
Demais 1035 hashes preservados. HEAD/main/origin inalterados; git diff --check
PASS. Não alterados backend/Supabase, cofre da fonte, player Java/C9,
identidade/ativação ou os APKs anteriores. C126 apenas acrescenta guard local
antes dos caminhos existentes e o plugin de armazenamento parental.
Relatórios/capturas/helpers privados em tmp/c126-local-parental-control.
GIT_COMMIT_AUTHORIZED=NAO; GIT_PUSH_AUTHORIZED=NAO; NEXT_GATE_STARTED=NAO.
