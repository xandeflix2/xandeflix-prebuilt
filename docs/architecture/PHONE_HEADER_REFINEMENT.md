# Refinamento do cabeçalho do celular

26/10/2026 America/Sao_Paulo. Gate único CANON-01-PHONE-HEADER-REFINEMENT, continuação do ajuste visual autorizado e avaliado ao vivo. Fonte integral fechada C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/mobile-header-spacing-20261026/workspace; root HEADd8a74102124fbb8a3f013f6fd8a502519c1db4b8/branchfix/source-output-format-recovery/mainb3fc8d1e3844bc5601813ab1b298289af5b3f1fd/originhttps://github.com/xandeflix2/xandeflix-prebuilt.git, mesmas10 diferenças L1/index vazio preservados. AGENTS, Architecture/Execution, phased expansion, Source Boundary e C11 lidos. Exceção histórica de branch preservada; não reconstruir main nem alterar pasta histórica. Nenhum Git/publicação/backend/instalação autorizado. A geração de APK de teste torna concreto o ajuste solicitado; entregar sem instalar.

## Especificação anterior ao código

Na apresentação de celular até599px, excluindo sidebar/tablet/tablet-portrait/television/square: Home/Filmes/Séries e Live terão padding superior12px, inferior6px e altura automática suficiente aos controles44px. O pedido e confirmação física da Home substituem somente o padding dependente de safe-area no topo desses cabeçalhos; não alterar insets nativos, statusbar ou variáveis globais. Antes real: Home padding36px/header92px; Live46px/header100px. Prévia aprovada Home12px/header62,857; Live medida12px/header62,857, quatro controles44px preservados. As medidas vêm do aparelho, não garantem equivalência futura de todo APK. Demais rotas mantêm alturas/padding recebidos.

Home/Filmes/Séries: marca alinhada ao início, padding esquerdo8px em vez de36px observados, sem mudar padding direito ou posição/tamanho dos controles. Prévia confirmou x8 e botões imóveis. O pedido substitui somente inset esquerdo do header dessas rotas em phone estreito; não alterar inset global/nativo nem hero.

Marca: PNG com alpha real b1e075dd55678ac5b08a697b8fdebee077ac0f9a9b0a39769313e43128a9708b,2172x724,487929bytes, gerado com ferramenta built-in imagegen em modo extração de fundo. Prompt e input rastreados no diretório de preview. Não é prova de identidade de pixels com o raster original. Copiar PNG sem recodificar; exibir região x45/y260/2065x220 por background CSS, mantendo letras prateadas/vermelhas e sombras. Ocultar símbolo/PREBUILT/texto de sistema somente em Header phone <=599px, em todas as rotas que mostram marca; manter política existente que oculta brand-container no Live e mantém seus controles. Header JSX/handlers/aria-label/tabindex intactos; imagem decorativa usa o nome acessível já existente. Não trocar logo do sidebar/intro/tablet/TV. Largura máxima240px/60vw, encolhimento ao espaço disponível, sem overlap/overflow em320–599px. Fronteira600 e paisagem larga mantidas.

## Verificação e preservação

CANON/check/test e C11 fresh antes do patch. Baseline204 controles/34 suítes,40 recibos/937 protegidos. Recibo41 com grants reais para CSS, PNG novo, duas expectativas do teste visual e runner que reconhece emenda;40 recibos anteriores imutáveis. Quatro normativos append-only. Nenhum novo controle espelho da implementação. O harness amplo herdado já é inconclusivo por fixture Live/menu desatualizados; não alegar PASS nem reescrever navegação para satisfazê-lo. Atualizar só as duas expectativas catalog56 substituídas pela altura natural63 em DPR1.

Comparar Header/AppShell/CSS reais em navegador local sem rede:320/390/411/430/599/600px, safe-area36px e font-scale1.15 sintéticos, Home/Filmes/Séries/Busca/Configurações/Detalhes/Live e layouts excluídos. Live usa ações sintéticas do portal com os mesmos seletores/44px; não é teste de player. Conferir12px/8px, PNG alpha carregado, alvos contidos/mesmos tamanhos/ordem/rótulos, ausência de overlap/overflow; demais geometrias preservadas. Não navegar no aparelho durante preparação. Prévia intencional permanece até revisão ou fechamento natural.

Após código congelado:13 checks oficiais CANON/check/test/C11/typecheck/update/security/playback/build/site/contratos; C11 antes de copy/Gradle; registry oficial3plugins, Gradleoffline testDebugUnitTest/assembleDebug257testes39suítes. Auditoria package/code37/name1.0.37/certificado, ZIP CRC, dist e PNG exatos; todas as entradas nativas/intro byte idênticas ao APK01b14a17,04 ausente. Novo nome/hash sem sobrescrever APKs. Root e candidatos fechados preservados por hashes. Não instalar/clear/reset/reboot/uninstall, fonte/dados/player/backend/Git/deploy. FAILs06 permanecem abertos. NEXT_GATE_STARTED=NAO.

## Allowlist estrita

- src/index.css
- src/assets/xandeflix-wordmark-transparent.png
- scripts/test-c11-landscape-navigation-browser.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/PHONE_HEADER_REFINEMENT.md
- docs/evidence/PHONE_HEADER_REFINEMENT.md
- docs/governance/authorizations/CANON-01-PHONE-HEADER-REFINEMENT.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Emenda antes do codigo: alinhamento em todas as paginas

Pedido explicito posterior: coloque o titulo da logo alinhado a esqueda em todas as paginas que ela aparece. na pagina interna de uma serie percebi que ela nao esta alinhada. Ampliar padding esquerdo8px e alinhamento inicial para Header compartilhado phone<=599px em todas as rotas, incluindo detalhes. Preview mediu series-detail x36 para8, header64px e quatro controles/padding superior8px preservados. A largura da marca cresce somente ao espaco liberado pelo padding; controles ficam nas mesmas coordenadas. Live sem marca segue com controles existentes. Nao ampliar top12 para outras rotas, nao alterar componentes/handlers/insets globais/TV/tablet. Allowlist permanece identica.


## Emenda antes do codigo: rodape centralizado

Usuario relatou desalinhamento do rodape nos detalhes de serie com imagem. Preview mediu left36/right16, largura359,429 em viewport411,429; corrigido para26px simetricos com largura/altura/quatro alvos/bottom preservados. Incorporar a mesma regra de largura recebida e translateX(-50%) no footer compartilhado phone<=599px. Manter max-width420px, margin/bottom/inset inferior, rotas/handlers/ordem/labels e layouts excluidos. Apenas CSS da allowlist ja autorizada; nao alterar JSX ou player.


## Ampliacao nominal:18+ somente com PIN e PUK locais

Pedido literal e esclarecimento em AUTHORIZATION.txt SHA256 79fed5f3952b083000c135d8a003d47aa7382570f3336d93cec0cfcf5cebbdcb. Mesmo gate ativo, nenhum gate paralelo. Consolidacao permanente no candidato completo e APK final explicitamente solicitados; nao autoriza instalacao/Git/publicacao.

Especificacao ANTES do codigo: usar status ready do store parental, que so existe apos leitura/parse ou escrita verificada de registro contendo os DOIS verificadores validos PIN e PUK. Nao criar flag de localStorage/servidor, nao ler/registrar segredos, nao gerar/configurar PIN/PUK no aparelho. Loading/unconfigured/error/corrompido/ausencia de qualquer verificador: atalhos18+ ausentes, inclusive sidebar/tablet/TV/mobile e botao Abrir area18+ nas Configuracoes. Prop booleano derivado da assinatura ja existente em AppShell para Header, default false; nao adicionar hooks condicionais. Configurado (mesmo controle comum desativado): atalho visivel; politica allowAdult/maxAge/sessao/PIN continuam exigidos no acesso. Rotas diretas continuam protegidas pelo store existente.

Canais ao vivo: usuario esclareceu SOMENTE adultos/18+, nao toda a secao. Canais comuns permanecem visiveis segundo regras recebidas. Projecao parentalLiveCatalog nao deve incluir grupos adultos bloqueados pelo parametro includeLockedGroups antes de ready. A filtragem existente de canais adultos, aliases em grupos comuns, favoritos/busca e autorizacao por PIN permanece integral; configuracao nao libera reproducao. Manter classificacao explicita recebida, sem classificar automaticamente todo filme/canal com faixa etaria18 como pornografia. Catalogo bruto imutavel, dados privados/storage/KDF/backup/licenca/C9/players/native intactos.

Testes significativos na suite128 existente: sem configuracao (groups includeLocked=true incluidos no teste), registro com PIN ou PUK ausente/corrompido e falha de leitura, configurado mas bloqueado, configurado+PIN/sessao autorizada e revogacao; canais comuns permanecem; objeto original imutavel. Renderizar Header/AppShell/ActiveSourceSettings reais com snapshots de estados, verificar ausencia/presenca de controles (incluindo default false) e propagacao viaAppShell; sem setters no aparelho. Preservar assertions anteriores/204 controles34suites. Revisao React skill lida; estado derivado simples, assinatura unica em AppShell, sem efeitos/requests novos.

Antes da ampliacao: CANON/check/test204/34 e C11 frescos sobre patch visual; execucoes13 iniciais sao fase anterior, nao resultado final apos este codigo. Repetir13 checks oficiais com prefixo parental-final e testes locais focados apos fonte congelada, depois Gradle/auditoria/consolidacao. Interrupcao temporaria dos botoes no Live foi relatada e voltou segundo usuario; DOM habilitado/sem modal/focoMainActivity, sem causa confirmada ou correcao atribuida. Nao implementar fix de player especulativo.

Allowlist FINAL substitui somente lista inicial deste gate;40 recibos recebidos continuam imutaveis e recibo41 ainda aberto e atualizado antes do fechamento:
- src/index.css
- src/assets/xandeflix-wordmark-transparent.png
- src/ui/components/Header.tsx
- src/ui/components/AppShell.tsx
- src/ui/components/ActiveSourceSettings.tsx
- src/parental/parental-content.ts
- scripts/test-c11-landscape-navigation-browser.mjs
- scripts/test-c128-parental-visibility.mjs
- scripts/test-canonical-regression.mjs
- docs/architecture/PHONE_HEADER_REFINEMENT.md
- docs/evidence/PHONE_HEADER_REFINEMENT.md
- docs/governance/authorizations/CANON-01-PHONE-HEADER-REFINEMENT.json
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md
- docs/STATUS.md
- docs/EVOLUTION_REPORT.md
- docs/ERRORS_AND_BLOCKERS.md


## Controle parental: apresentacao mobile do header antes da consolidacao

Pedido posterior exige marca a esquerda e Voltar somente icone a direita junto aos controles. Acrescentar parental-control a condicao app-shell--phone-header-back existente no AppShell; CSSphone<=599 reutilizado, sem novo handler/rotas/storage/insets. Preview atual no SM-S926B confirmou x8, Back44x44, texto oculto e nome acessivel, header64 e nenhum controle fora do retangulo. Antes Back89,65x56,96 e Settings ultrapassava largura do header; nao preservar essa geometria defeituosa. Incluir parental-control nos casos locais de layout e em render verificando classe. Allowlist16 ja inclui AppShell/teste128; restante intacto.


## Configuracoes: modernizacao visual antes da consolidacao

Usuario: su possivel otimize/modernize o layout da pagina de configura??o em todos as op?oes colocando um visual mais profissional e com espa?amento correto de paragrafos, titulos e alinhamento de botoes. Escopo somente CSS: pagina/7opcoes/janelas de Atualizacoes,Internet,Fonte,Parental,PIN web,Tela,Ativacao e subpagina parental; manter textos/campos/validacoes/dialogos/handlers/foco/lifetime intactos. Tema escuro existente com cartoes/superficies discretas, espacamento16/24px, titulos20?34px, line-height1.65, botoes alinhados e no minimo44px nos layouts touch; reduzirpaddingphone16?20px, empilhar acoes sem overflow, manter focoTV e dimensoes recebidas de campo remoto. Bottompaddingphone protege ultimas acoes do rodape. Sem dependencia/biblioteca/CSSglobal fora settings/parental.

Allowlist final ampliada para17 caminhos, incluindo src/ui/pages/SettingsPage.css; todos os demais componentes/contratos protegidos. CSS novo em SETTINGS_REFINEMENT.css antes da aplicacao; previewDOMstyle proprio xf-live-settings-refinement-preview-20261026, helperCDPproprio, metadados sanitizados neste diretorio de preview. Sem ler valores de formularios/segredos. Conferir fixtures de todas as opcoes e geometrias320/411/800/960/1280, botoes/wrapping/scroll/foco; nenhuma funcao de update/network/configuracao sera acionada no aparelho.


## Fechamento da consolidacao visual/parental

RESULT=FINAL_UI_PARENTAL_APK_CONSOLIDATED_PHYSICAL_REVIEW_PENDING. APK C:/Users/Alexandre/Downloads/XANDEFLIX_AJUSTES_FINAIS_a70a2146.apk SHA256 a70a21463615b72f2750e7fbf588a60ce41cd95164832095da7299adeb1cad55.204controles34suites/938protegidos41recibos/14casos128/13checks e257testesAndroid39suites PASS; layout 79 headers e35 janelas locais. Codigo integral consolidado com manifesto/ZIP.40recibos,root e bases fechadas preservados. Nenhuma instalacao/Git/backend; revisao fisica do novoAPK pendente. Interrupcao transitoria de botoes voltou segundo usuario, causa nao confirmada. Relatorio C:/Xandeflix/xandeflix-prebuilt-c11-main/tmp/phone-header-refinement-20261026/REPORT.md. NEXT_GATE_STARTED=NAO.
