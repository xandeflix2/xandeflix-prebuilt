# Correção de playback — investigação da resposta HTTP

Autorização vigente: pedido expresso do usuário em 05/11/2026, "prossiga com a correção", em continuidade à auditoria dos aplicativos instalados. Antes de qualquer patch de produto, determinar a causa do episódio cujo pedido igual falha em 1.0.37 e 1.0.52. Preservar os fechamentos anteriores.

Preflight: workspace do IDE C:/Xandeflix/xandeflix-prebuilt, origin canônico, branch lab/search-compact-index-r2, HEAD e99f830a24b5de6dd74b4397f1ed6f0995bc8483 e alterações históricas preservadas. AGENTS.md, Architecture, Execution e Source Data Boundary foram lidos integralmente. Nenhum patch será feito nessa branch. Sem operações Git de escrita, backend administrativo, atualização de dependências, alteração de fonte/identidade/licença ou integração de créditos neste diagnóstico.

Allowlist desta etapa: ferramentas de observação, classes de diagnóstico compiladas localmente e evidências exclusivamente nesta nova pasta externa. A compilação de um auxiliar JDI não constitui build do aplicativo, Gradle ou APK. Não alterar o APK nem desativar controles de reprodução. A navegação e abertura do episódio continuarão pelos fluxos do próprio aplicativo.

Inspeção transitória pelo JDWP do próprio pacote debuggable: observar a exceção HTTP do player, retornar código, tamanho do corpo e classificações booleanas limitadas de mensagem/headers. Não transferir bytes de corpos, URI, credenciais, texto bruto, tokens ou mapas completos para o auditor. Classificar strings mediante invocação dentro da VM do aparelho. Suspender somente a thread do evento pelo tempo de inspeção, retomar em finally e remover a conexão/forward próprios. Registrar que a execução observada por debugger não é medição de latência ou baseline sem instrumentação.

Não declarar causa exclusiva por um texto genérico de 403. Uma eventual correção deverá ter especificação, destino isolado e allowlist formal compatíveis com os contratos, testes de regressão apropriados e validação do mesmo caso. Não substituir versões homologadas por um APK sem comprovação. RESULT permanece aberto até haver evidência.
