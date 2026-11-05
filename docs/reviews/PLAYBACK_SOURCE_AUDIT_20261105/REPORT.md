# Xandeflix Prebuilt — auditoria completa para análise externa

Data: **05/11/2026, America/Sao_Paulo**. Horários dos recibos JSON estão em UTC; horário local=UTC−3. Publicação exclusiva para revisão independente. Estado operacional: **recuperação parcial; HTTP 403 de determinados títulos ainda aberto**. Não há homologação integral ou release de produção desta entrega.

## 1. Conclusão executiva

A versão 1.0.53 corrigiu o isolamento local da fonte e foi instalada inplace no tablet e no Fire USB, preservando os campos de identidade/chave/instalação/licença verificados. Catálogo fresco foi observado. Um filme produziu primeiro quadro e avanço real no tablet, inclusive após exclusão física/reimportação. Duas séries no tablet e uma tentativa de filme no Fire ainda receberam HTTP 403 na abertura da mídia.

O episódio pós-limpeza foi reconferido em resposta atual get_series_info: 146 linhas, uma correspondência, extensão MP4 declarada e solicitada, nenhuma referência alternativa nos campos examinados. Origin, usuário, senha e ID da requisição real coincidem com a fonte atual, comparados somente em RAM. Conta informou Active/AUTHORIZED e 0/2 conexões. Esses fatos não comprovam direito ou disponibilidade de cada arquivo.

A cadeia de uma amostra teve 302 no host da fonte seguido de 403 HTML Cloudflare em outro host. Consulta HTTPS ao destino exato com TLS normal também recebeu 403. Isso localiza a recusa, mas não prova a regra de política, causa exclusiva, culpa universal do provedor ou ausência de incompatibilidade compartilhada entre clientes. A série também falhou no APK antigo 1.0.37 com exatamente a mesma URI/headers comparados ao 52. Não há base para afirmar que voltar de versão resolva.

A limpeza manual posterior atingiu sua finalidade de retirar catálogo/cache físico e importar uma geração nova, mas não cumpriu o epoch inalterado planejado e o matcher pessoal não cobriu watch-*. O resultado parcial continua preservado. O analista deve avaliar esses limites antes de aprovar uma rotina de reset para clientes.

## 2. Como acessar o projeto completo

Branch temporária: **audit/playback-source-review-20261105** no repositório **xandeflix2/xandeflix-prebuilt**. Os arquivos de produto, testes, migrations/funções Supabase, configuração de build e contratos estão na raiz normal do repositório. Esta pasta é o índice de revisão e não um segundo produto.

Recebido: d8a74102124fbb8a3f013f6fd8a502519c1db4b8; main remota observada: b3fc8d1e3844bc5601813ab1b298289af5b3f1fd. d8 já existe na branch remota fix/source-output-format-recovery. O commit novo da revisão acrescenta o snapshot local governado e este dossiê; não muda main. SHA final e acesso remoto estão no registro externo de publicação e no próprio HEAD da branch.

[Manifesto de código](SOURCE_MANIFEST.json): 1.560 arquivos completos copiados byte a byte da fonte. [Manifesto de evidências](EXPORT_MANIFEST.json):365 arquivos exportados. Históricos locais incluem mais builds/caches/APKs/imagens, que não são código-fonte e não são enviados. Dependências são reconstruíveis por package-lock; node_modules não é versionado. .env.example é modelo; ambiente real/credenciais/keystore/arquivos dos aparelhos não acompanham o repositório. Hash e identidade do APK 53 estão em PROVENANCE.json e APK_AUDIT.json. APK binário não publicado nesta branch.

Os arquivos exportados de evidência preservam seus bytes; .log virou .log.txt apenas no nome para não depender de force-add. Atributos -text restritos às pastas evidence/artifacts evitam transformação de line-endings. Fechamentos CLOSURE antigos abrangem o conjunto local original, incluindo arquivos não exportados: não alegar verificação de fechamento integral somente porque o subset está na branch. Os manifests desta publicação identificam exatamente a cobertura.

Não executar automaticamente os helpers de auditoria: eles registram procedimentos de sessões passadas e alguns operam dispositivos/ADB. O contexto do IDE lab e os caminhos absolutos históricos não autorizam escrever neles. Nesta publicação só o novo workspace recebeu operações Git.

## 3. Matriz de versões e aparelhos

| Observação | Aparelho | Versão/código | SHA256 e limite |
| --- | --- | --- | --- |
|04/11,início|Tablet SM-X610 / celular SM-S926B|1.0.52/52|0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29|
|04/11,início|Fire auditado|1.0.52/52|f1eb668de79aebd0384424c67a289eea9c5206fa8db901020789f52a8a079358|
|05/11,07:33 local|Celular observado nessa sessão|1.0.37/37|433a60d77669430de4cc09b45db0b3f29760b2578d920d76f60ee9580ce18252; houve troca de aparelhos/instalações entre sessões|
|05/11,migração|Tablet e Fire USB|1.0.53/53|d849a27e0106006b324ea86b320909b455b11c92c774967b1189b3f8900e1caa; inplace, catálogo ACTIVE|
|Referência histórica 29/10|Outro APK 52|1.0.52/52|d7d559600ba5265e490b1d79b7009b26598184157dfff914cea237faa02ab553; não confundir com 0146...|

Não transferir resultado de um Fire Wi-Fi para o Fire USB. Atualização do celular para 53 foi adiada expressamente pelo usuário. Não há nova instalação ou consulta física por esta publicação documental. Mesmo package/versionName/versionCode não comprova mesmo binário. A mesma assinatura debug b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d permitiu os updates observados; não é identidade de release assinada de produção.

## 4. Cronologia e controle de variáveis

1. Usuário trocou fonte de conteúdo no tablet/celular; Fire manteve fonte anterior. Depois trocou internet e outros aparelhos. Relatórios separam esses eventos e não combinam amostras como se fossem controle perfeito.
2. Auditoria 04/11 encontrou 404/erros de transporte da API na fonte de teste e 403/404 em mídia da fonte anterior. Parser sintético aceitou mapas/strings de temporadas; não houve payload real válido que sustentasse atribuir aquele erro ao parser.
3. Comparação 05/11 no hotspot 5G: mesmo filme URI/headers reproduziu em 37/52; mesmo episódio URI/headers recebeu 403 em ambos. Fire tinha outra credencial, portanto não é controle de mesma conta. Um teste só de User-Agent também continuou 403 e foi desfeito.
4. Correção 53: baseline canônico/C11/regressão 204/42 PASS; patch mínimo por allowlist, dois recibos novos, revisão de caches,204/45 PASS, TypeScript e 259 testes nativos PASS, build offline e auditoria do APK.
5. Atualização inplace tablet/Fire: migração de catálogo e reinício com mesma fonte/epoch/snapshot verificados. Isso não homologou acesso a toda mídia.
6. Usuário voltou ao 5G: filmecommesma URI/headers teve FIRST_FRAME/READY/progresso. A rede mudou e o tempo/servidor também, logo causalidade exclusiva da operadora não demonstrada. Série continuou 403; HTTPS válido do destino também 403.
7. Limpeza física solicitada no tablet: catálogo/cache removidos, nova geração ACTIVE com um snapshot REAL / staging vazio. Filme funcionou; outro episódio 403 às 17:41:52Z, igual ao diagnóstico colado pelo usuário. Origem/conta/episódio da API atual conferidos.

## 5. Registro individual dos erros, riscos e limitações

Prioridades são triagem de revisão, não adjudicação canônica. CONFIRMADO_RUNTIME significa observação da sessão indicada; HISTORICO não significa nova reprodução nesta entrega; risco estático não é incidente físico confirmado.

|ID|Prioridade|Achado|Estado|
|---|---|---|---|
| [E01](#e01) | P0 | HTTP 403 na abertura de determinados episódios | ABERTO |
| [E02](#e02) | P1 | Filme do Fire USB também recebeu 403 | ABERTO |
| [E03](#e03) | P1 | Redirecionamento 302 para outro host seguido de 403 | CAUSA_EXCLUSIVA_NAO_PROVADA |
| [E04](#e04) | P1 | Isolamento insuficiente de metadata entre ativações de fonte | CORRIGIDO_1_0_53_LIMITES_FISICOS |
| [E05](#e05) | P1 | Compilações diferentes usaram o mesmo versionCode 52 | MITIGADO_COM_CODE53 |
| [E06](#e06) | P2 | APP_VERSION do diagnóstico é literal 1.0 | ABERTO |
| [E07](#e07) | P1 | HTTPS da API configurada falhou na confiança do certificado | ABERTO_EXTERNO |
| [E08](#e08) | P1 | HTTP 404 nas consultas de séries e API da fonte de teste | DEPENDENTE_DA_FONTE_REDE |
| [E09](#e09) | P1 | Reset/conexão encerrada/timeout antes dos cabeçalhos | NAO_ATRIBUIDO_EXCLUSIVAMENTE |
| [E10](#e10) | P1 | Limpeza manual gerou epoch diferente do planejado | PARCIAL_PRESERVADO |
| [E11](#e11) | P1 | Matcher de preservação pessoal não cobriu watch-* | NAO_CERTIFICADO |
| [E12](#e12) | P1 | Mesmo sourceId/protocolo exige avanço legítimo de sourceVersion | REVISAO_NECESSARIA |
| [E13](#e13) | P1 | Heurística nativa 35/45 s não corresponde ao contrato G3 | NAO_CORRIGIDO_NESTE_CICLO |
| [E14](#e14) | P2 | Overlay de transição é ocultado antes do primeiro quadro | NAO_CORRIGIDO_NESTE_CICLO |
| [E15](#e15) | P1 | Countdown pode sobreviver à pausa/background | NAO_REPRODUZIDO_FISICAMENTE |
| [E16](#e16) | P2 | Controles Voltar/Cast ainda visíveis no celular | PENDENTE_NAO_RETESTADO_53 |
| [E17](#e17) | P1 | Recibo histórico tem restrições conflitantes com operações descritas | REVISAO_INDEPENDENTE_PENDENTE |
| [E18](#e18) | P1 | Snapshot G3 divergiu em caches/outputs posteriores | RESSALVA_PRESERVADA |
| [E19](#e19) | P1 | Preservação anterior à G1C-R2 não foi integralmente comprovada | MANTIDA |
| [E20](#e20) | P1 | Índice Git mudou bytes sem autoria comprovada em G2-R3 | RECUPERADO_COM_EXCECAO_DELIMITADA |
| [E21](#e21) | P1 | Baseline b3 sem ancestralidade A22 bloqueou G2 inicial | RECUPERADO_COM_LINHAGEM_REAL |
| [E22](#e22) | P2 | Lista estrita de autorizações causou falhas anteriores da regressão | RECUPERADO_FORMALMENTE |
| [E23](#e23) | P2 | Fixture new-content falhava por cinco ports ausentes | CORRIGIDO_HARNESS |
| [E24](#e24) | P2 | Dois harnesses artwork não conheciam getSourceCacheScope | CORRIGIDO_HARNESS |
| [E25](#e25) | P2 | Primeira auditoria pós-build terminou exit 1 com outputs não classificados | CLASSIFICADO_POSTERIORMENTE |
| [E26](#e26) | P2 | HEAD 200 não certificou GET nem reprodução | CORRIGIDO_PROCEDIMENTO |
| [E27](#e27) | P2 | Fire no screensaver e tempos curtos não provam timeout/reprodução | LIMITACAO_REGISTRADA |
| [E28](#e28) | P2 | CDP antigo sem deadline podia deixar coleta pendurada | CORRIGIDO_HELPER_LOCAL |
| [E29](#e29) | P2 | Comparação de APK JavaScript teve cobertura parcial por memória | ABERTO |
| [E30](#e30) | P2 | Homologação física de áudio, catálogo inteiro e todos os aparelhos incompleta | PENDENTE |
| [E31](#e31) | P2 | P2.50-R1 teve TIMEOUT_CHROME | BLOQUEIO_ANTIGO_PRESERVADO |
| [E32](#e32) | P2 | Seletores, escapes, paths e parsing de logs falharam em auxiliares | REGISTRADOS_NAO_PRODUTO |

### E01

**HTTP 403 na abertura de determinados episódios** — P0; CONFIRMADO_RUNTIME; ABERTO.

Duas séries falharam no tablet, inclusive depois da exclusão e reimportação do catálogo. Media3 2004/DATASOURCE_OPEN, sem primeiro quadro. A falha interrompe a entrega antes da decodificação.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_AFTER_CLEAN_SERIES_PROOF.json](evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_AFTER_CLEAN_SERIES_PROOF.json). Código/fronteira: [android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java](../../../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java).

Próxima verificação: Reproduzir a referência exata com o administrador da fonte; conferir disponibilidade e autorização da mídia e logs do destino/CDN. Não alterar codec por esse status.

### E02

**Filme do Fire USB também recebeu 403** — P1; CONFIRMADO_RUNTIME; ABERTO.

Na segunda tentativa focalizada, o Fire 1.0.53 abriu o player e recebeu 403; playback do aparelho ainda não está homologado. A conta do Fire é diferente da conta do tablet.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/FIRE_5G_MOVIE_RETRY_FOLLOWUP.json](evidence/HTTP_TRANSPORT_RECOVERY_20261105/FIRE_5G_MOVIE_RETRY_FOLLOWUP.json). Código/fronteira: [src/playback/playback.service.ts](../../../src/playback/playback.service.ts).

Próxima verificação: Validar a conta própria do Fire e a entrega do arquivo. Igualdade de título não prova igualdade da mídia/autorizações.

### E03

**Redirecionamento 302 para outro host seguido de 403** — P1; CONFIRMADO_RUNTIME; CAUSA_EXCLUSIVA_NAO_PROVADA.

A resposta403 de episódio foi observada dentro da VM, HTML com ServerCloudflare/cf-ray. A mesma URL final por HTTPS com TLS normal também respondeu403. Não foi demonstrado desafio, erro1020, bloqueio geográfico ou WAF específico.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_5G_SERIES_HTTPS_TARGET.log.txt](evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_5G_SERIES_HTTPS_TARGET.log.txt). Código/fronteira: [android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java](../../../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java).

Próxima verificação: Obter a decisão do servidor para a requisição. Preservar o redirect original; não inventar Referer, cookies, token ou host.

### E04

**Isolamento insuficiente de metadata entre ativações de fonte** — P1; REPRODUCAO_SINTETICA_E_REVISAO_DE_CODIGO; CORRIGIDO_1_0_53_LIMITES_FISICOS.

A proteção nova cria namespace/estado de substituição, bloqueia catálogo anterior, limpa metadata conhecida e exige importação integral. Testes reais de módulos cobrem A-B-A e falhas. Não ficou provado que resíduos da fonte de teste causaram os403 físicos.

Evidência: [evidence/SOURCE_SWITCH_ISOLATION_20261105/REPORT.md](evidence/SOURCE_SWITCH_ISOLATION_20261105/REPORT.md). Código/fronteira: [src/bootstrap/source-replacement.ts](../../../src/bootstrap/source-replacement.ts).

Próxima verificação: Revisar lifecycle e executar troca remota legítima A-B-A em gate físico próprio; não confundir testes sintéticos com fonte real alterada no painel.

### E05

**Compilações diferentes usaram o mesmo versionCode 52** — P1; CONFIRMADO_ARTEFATO; MITIGADO_COM_CODE53.

APKs f1eb...,0146... e d7d5... diferem apesar do número1.0.52/52. A identificação de atualização somente por número é insuficiente. O novo teste usa53 e hash próprio.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [android/app/build.gradle](../../../android/app/build.gradle).

Próxima verificação: Não reutilizar code 52 para outra compilação; correlacionar APK/hash/assinatura/bundle por aparelho.

### E06

**APP_VERSION do diagnóstico é literal 1.0** — P2; CONFIRMADO_CODIGO; ABERTO.

O formatador e o parser fixam1.0; o diagnóstico colado não mostra a versão real instalada. Android dumpsys confirmou1.0.53/53 e bundle index-CaKLtAjp.js no tablet.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md](evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md). Código/fronteira: [src/playback/playback-support-diagnostic.ts](../../../src/playback/playback-support-diagnostic.ts).

Próxima verificação: Em gate próprio revisar contrato do relatório e informar versão/build real preservando compatibilidade e sanitização; não adulterar diagnóstico existente.

### E07

**HTTPS da API configurada falhou na confiança do certificado** — P1; CONFIRMADO_RUNTIME; ABERTO_EXTERNO.

Consulta anônima no mesmo hostname/portaHTTPS anunciada falhou com SSLHandshakeException e trust anchor. Não prova expiração ou hostname incorreto. Não foram enviadas credenciais nessa tentativa.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_TLS_DETAIL.json](evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_TLS_DETAIL.json). Código/fronteira: [src/source/source-directory-details.ts](../../../src/source/source-directory-details.ts).

Próxima verificação: Administrador deve fornecer endpoint/cadeia de certificado válidos. Não desativar validação TLS nem enviar senha ao outro host apenas anunciado em server_info.

### E08

**HTTP 404 nas consultas de séries e API da fonte de teste** — P1; CONFIRMADO_HISTORICO; DEPENDENTE_DA_FONTE_REDE.

Em04/11, após troca de internet, celular recebeu404 sem payload válido de temporadas. Ausência de user_info em404 não é prova de senha inválida nem catálogo vazio.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [src/source/source-directory-details.ts](../../../src/source/source-directory-details.ts).

Próxima verificação: Conferir endpointAPI efetivamente suportado pela fonte no cenário original. Não atribuir esse caso ao parser sem corpo recebido.

### E09

**Reset/conexão encerrada/timeout antes dos cabeçalhos** — P1; CONFIRMADO_HISTORICO; NAO_ATRIBUIDO_EXCLUSIVAMENTE.

Tablet e celular tiveram erros de transporte em cenários anteriores. NETWORK_TIMEOUT/Media3 2001/DATASOURCE_OPEN não comprovam erro de codec ou certificado. Trocas de rede e fonte ocorreram em momentos distintos.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [src/playback/playback-errors.ts](../../../src/playback/playback-errors.ts).

Próxima verificação: Comparação controlada deve fixar conta/URI/headers e anotar rede/horário; capturar a primeira fronteira falha sem atribuição por palpite.

### E10

**Limpeza manual gerou epoch diferente do planejado** — P1; CONFIRMADO_MANUTENCAO; PARCIAL_PRESERVADO.

O plano esperava o mesmo epoch para a mesma fonte. Após PREPARED observado, o primeiro poll viu ACTIVE sem catálogo, seguido de CLEANED e novo ACTIVE. Origem da diferença não comprovada. Catálogo novo e exclusão física confirmados.

Evidência: [evidence/TABLET_SOURCE_CLEANUP_20261105/RESULT.json](evidence/TABLET_SOURCE_CLEANUP_20261105/RESULT.json). Código/fronteira: [src/bootstrap/source-replacement.ts](../../../src/bootstrap/source-replacement.ts).

Próxima verificação: Rever procedimento de manutenção e persistência/concorrência antes de oferecer reset ao usuário. Não reatribuir silenciosamente registros pessoais nem converter resultado emPASS.

### E11

**Matcher de preservação pessoal não cobriu watch-*** — P1; CONFIRMADO_LIMITACAO_DO_AUDITOR; NAO_CERTIFICADO.

O helper encontrou zero chaves do seu matcher, mas não incluiu recent-watched/watch-positions/watch-sessions. Seu true com contagemzero não comprova preservação integral ou associação visual do histórico. Identidade/chave/licença foram comparadas separadamente e preservadas.

Evidência: [evidence/TABLET_SOURCE_CLEANUP_20261105/OBSERVATION_NOTE.md](evidence/TABLET_SOURCE_CLEANUP_20261105/OBSERVATION_NOTE.md). Código/fronteira: [src/playback/watch-history.ts](../../../src/playback/watch-history.ts).

Próxima verificação: Corrigir a verificação futura com allowlist completa e comparação antes/depois somente em RAM; manter o registro histórico insuficiente.

### E12

**Mesmo sourceId/protocolo exige avanço legítimo de sourceVersion** — P1; RISCO_ARQUITETURAL_EXPLICITO; REVISAO_NECESSARIA.

O cliente compara a geração lógica autorizada; não conhece secretamente alteração de credencial sob o mesmo tuple. A substituição do cofre deve avançar a versão pelo provisionamento. Não se provou violação concreta desse contrato neste incidente.

Evidência: [evidence/SOURCE_SWITCH_ISOLATION_20261105/SPEC.md](evidence/SOURCE_SWITCH_ISOLATION_20261105/SPEC.md). Código/fronteira: [src/bootstrap/boot-sync-coordinator.ts](../../../src/bootstrap/boot-sync-coordinator.ts).

Próxima verificação: Auditar semanticamente os fluxos de atualização da fonte; não derivar geração remota de senha/hash da playlist nem expor a configuração.

### E13

**Heurística nativa 35/45 s não corresponde ao contrato G3** — P1; CONFIRMADO_CODIGO_PREEXISTENTE; NAO_CORRIGIDO_NESTE_CICLO.

O código recebido já usa tempo restante e countdown 5 s para oferta/avanço, sem integração do resolvedor G2 e validador G3 isolados. Não foi introduzido pela correção53 e não constitui detector de créditos validado.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java](../../../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java).

Próxima verificação: Decidir nominalmente integração/retirada/adequação por gate, com edição real e autoridade. Não declarar G4 concluído.

### E14

**Overlay de transição é ocultado antes do primeiro quadro** — P2; CONFIRMADO_ESTATICO; NAO_CORRIGIDO_NESTE_CICLO.

resetNextEpisodeState oculta overlay antes de playCandidate; onRenderedFirstFrame também oculta. A presença do callback não garante loading até o primeiro quadro. Comparação do APK sustentou o achado.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java](../../../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java).

Próxima verificação: Teste da atividade real deve demonstrar overlay até primeiro quadro, timeout/falha/cancelamento e navegação sem disputa.

### E15

**Countdown pode sobreviver à pausa/background** — P1; RISCO_ESTATICO; NAO_REPRODUZIDO_FISICAMENTE.

onPause não cancela explicitamente o timer observado na versão auditada. Risco de transição em background; não houve prova física de ocorrência.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java](../../../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java).

Próxima verificação: Testar pausa, Home, PiP, retorno e sessão antiga em gate de ciclo de vida, sem confundir risco com incidente confirmado.

### E16

**Controles Voltar/Cast ainda visíveis no celular** — P2; CONFIRMADO_RUNTIME_HISTORICO; PENDENTE_NAO_RETESTADO_53.

Auditoria 04/11 mediu controles abaixo do conteúdo no celular, apesar do pedido de exibição somente no tablet. Não houve correção visual nesta53 nem nova homologação de todas as páginas.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [src/ui/pages/SeriesPage.tsx](../../../src/ui/pages/SeriesPage.tsx).

Próxima verificação: Revalidar layout por classe de dispositivo, orientação e D-pad/toque; patch nominal restrito.

### E17

**Recibo histórico tem restrições conflitantes com operações descritas** — P1; CONFIRMADO_CONTRADICAO_DOCUMENTAL; REVISAO_INDEPENDENTE_PENDENTE.

PERF-PARENTAL-HERO-REFINEMENT contém flags/restrições que precisam ser conciliadas com mudanças deplayer/UI/build/install atribuídas a ele. PASS de hashes não autentica a autorização humana. Aparência de hash não prova fabricação.

Evidência: [evidence/DEVICE_AUDIT_20261104/REPORT.md](evidence/DEVICE_AUDIT_20261104/REPORT.md). Código/fronteira: [docs/governance/authorizations/CANON-01-PERF-PARENTAL-HERO-REFINEMENT.json](../../../docs/governance/authorizations/CANON-01-PERF-PARENTAL-HERO-REFINEMENT.json).

Próxima verificação: Analista mestre deve examinar ordem original e cadeia. Preservar bytes e ressalvas; não regularizar retroativamente por uma declaração do executor.

### E18

**Snapshot G3 divergiu em caches/outputs posteriores** — P1; CONFIRMADO_DIVERGENCIA_HISTORICA; RESSALVA_PRESERVADA.

Em04/11 foram7.931/7.958 iguais,27 alterados e12 extras classificados como caches/outputs; produto/Git cobertos conservaram bytes. Isso não sustenta igualdade integral7.958/7.958 nem prova autor/processo da alteração.

Evidência: [evidence/DEVICE_AUDIT_20261104/G3_DIVERGENCE_REVIEW.json](evidence/DEVICE_AUDIT_20261104/G3_DIVERGENCE_REVIEW.json). Código/fronteira: [docs/evidence/NEXT_EPISODE_G3.md](../../../docs/evidence/NEXT_EPISODE_G3.md).

Próxima verificação: Não usar G3 como snapshot atual desta publicação. Preservar sua evidência e separar candidato atual da linhaNextEpisode.

### E19

**Preservação anterior à G1C-R2 não foi integralmente comprovada** — P1; LIMITACAO_HISTORICA_ACEITA; MANTIDA.

G1C-R4 aceitou explicitamente a lacuna apenas para desenvolvimento isolado. Snapshots prospectivos não certificam o estado passado nem homologam produção.

Evidência: [evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md](evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md). Código/fronteira: [docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md](../../../docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md).

Próxima verificação: Manter ressalva em toda revisão de baseline e não fabricar snapshot retrospectivo.

### E20

**Índice Git mudou bytes sem autoria comprovada em G2-R3** — P1; CONFIRMADO_HISTORICO; RECUPERADO_COM_EXCECAO_DELIMITADA.

G2-R4 aceitou diferença apenas mediante equivalência semântica integral e preservação dos demais metadados. git diff --cached sozinho não era prova suficiente.

Evidência: [evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md](evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md). Código/fronteira: [docs/evidence/NEXT_EPISODE_G3.md](../../../docs/evidence/NEXT_EPISODE_G3.md).

Próxima verificação: Nova divergência exige auditoria própria; não excluir .git genericamente nem atribuir definitivamente a optional locks.

### E21

**Baseline b3 sem ancestralidade A22 bloqueou G2 inicial** — P1; CONFIRMADO_HISTORICO; RECUPERADO_COM_LINHAGEM_REAL.

A referência antiga não continha o received head a27... exigido pelo guard. O candidato d8... conservou a linhagem necessária. Não é falha atual de playback.

Evidência: [evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md](evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md). Código/fronteira: [scripts/vercel-prebuilt-contract.mjs](../../../scripts/vercel-prebuilt-contract.mjs).

Próxima verificação: Não rebasear a revisão em b3 sem preservar linhagem, simularGit ou relaxarA22.

### E22

**Lista estrita de autorizações causou falhas anteriores da regressão** — P2; CONFIRMADO_HISTORICO; RECUPERADO_FORMALMENTE.

Recibos legítimos acrescentados exigiram expectativa exata revisada no runner. Foram mantidos controles/negativos e concessão sintética ANDROID-38 por último.

Evidência: [evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md](evidence/NEXT_EPISODE_HANDOFF_20261102/REPORT.md). Código/fronteira: [scripts/test-canonical-regression.mjs](../../../scripts/test-canonical-regression.mjs).

Próxima verificação: Novos recibos requerem revisão formal mínima; não usar includes/contagem permissiva para contornar a comparação.

### E23

**Fixture new-content falhava por cinco ports ausentes** — P2; CONFIRMADO_TESTE; CORRIGIDO_HARNESS.

Falha reproduzida na origem antes do patch53. Harness recebeu ports já requeridos pelo MediaCard, preservando cenários/negativos. Não foi mascarada como regressão introduzida no inventário.

Evidência: [evidence/SOURCE_SWITCH_ISOLATION_20261105/BASELINE_NOVELTY_INCOMPATIBILITY.json](evidence/SOURCE_SWITCH_ISOLATION_20261105/BASELINE_NOVELTY_INCOMPATIBILITY.json). Código/fronteira: [scripts/test-c11-new-content-badge.mjs](../../../scripts/test-c11-new-content-badge.mjs).

Próxima verificação: Manter evidência antes/depois e verificar que novos imports sejam controlados sem enfraquecer asserts.

### E24

**Dois harnesses artwork não conheciam getSourceCacheScope** — P2; CONFIRMADO_TESTE; CORRIGIDO_HARNESS.

Imports adicionados ao módulo real exigiram ligação explícita nos testes antigos. Erros Uncontrolled dependency foram registrados e o import real foi conectado, sem alterar TTL/negativos/filas.

Evidência: [evidence/SOURCE_SWITCH_ISOLATION_20261105/REPORT.md](evidence/SOURCE_SWITCH_ISOLATION_20261105/REPORT.md). Código/fronteira: [scripts/test-c11-artwork-visible-recovery.mjs](../../../scripts/test-c11-artwork-visible-recovery.mjs).

Próxima verificação: Revisar mudanças de testes via recibo e executar novamente; não substituir runtime por stub que devolvePASS.

### E25

**Primeira auditoria pós-build terminou exit 1 com outputs não classificados** — P2; CONFIRMADO_AUDITORIA; CLASSIFICADO_POSTERIORMENTE.

PRESERVATION_POST_BUILD reteve resultado inicial. Revisão individual identificou8 assets substituídos e28 outputsAndroid anteriores regenerados, além de novos outputs cobertos pelo snapshot final. Não houve exclusão genérica de dependências/builds da auditoria.

Evidência: [evidence/SOURCE_SWITCH_ISOLATION_20261105/PRESERVATION_GENERATED_OUTPUT_REVIEW.json](evidence/SOURCE_SWITCH_ISOLATION_20261105/PRESERVATION_GENERATED_OUTPUT_REVIEW.json). Código/fronteira: [android/app/capacitor.build.gradle](../../../android/app/capacitor.build.gradle).

Próxima verificação: Ler resultado inicial e classificação posterior juntos; distinguir pacote de dependência de outputs gerados dentro de node_modules.

### E26

**HEAD 200 não certificou GET nem reprodução** — P2; CONFIRMADO_LIMITACAO_INSTRUMENTAL; CORRIGIDO_PROCEDIMENTO.

HEAD do original retornou200 semLocation; GET real de episódio teve 302/403. HTTPS do destino foi testado só para código/cabeçalhos, sem corpo e sem player.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_5G_REDIRECT_HTTPS.json](evidence/HTTP_TRANSPORT_RECOVERY_20261105/TABLET_5G_REDIRECT_HTTPS.json). Código/fronteira: [android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java](../../../android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java).

Próxima verificação: Usar o fluxo normal/C9 para comprovar mídia; não promover HEAD ou testeheaders a sucesso de playback.

### E27

**Fire no screensaver e tempos curtos não provam timeout/reprodução** — P2; CONFIRMADO_LIMITACAO_INSTRUMENTAL; LIMITACAO_REGISTRADA.

Primeira tentativa sem erro terminal ocorreu com screensaver observado. Amostras anteriores de13 s e posição salva fixa não provaram primeiro quadro ou falha terminal. A tentativa posterior capturou403 separadamente.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md](evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md). Código/fronteira: [src/playback/watch-history.ts](../../../src/playback/watch-history.ts).

Próxima verificação: Correlacionar PID/OPEN/primeiroquadro/progresso/foreground e conta. Não tratar posição inicial salva como posição realmente avançada.

### E28

**CDP antigo sem deadline podia deixar coleta pendurada** — P2; CONFIRMADO_LIMITACAO_INSTRUMENTAL; CORRIGIDO_HELPER_LOCAL.

WebView do tablet parou de responder ao endpointdebug; helper antigo pendurou fetch. Foi encerrado somente o helper próprio identificado, reiniciado somente o próprio app, e novoCDP recebeu deadlines/removal dos próprios forwards. Não prova travamento do produto.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md](evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md). Código/fronteira: [src/diagnostics](../../../src/diagnostics).

Próxima verificação: Não matarADB/Chrome/processos alheios. Garantir finally e prazos dos observadores.

### E29

**Comparação de APK JavaScript teve cobertura parcial por memória** — P2; LIMITACAO_DE_COBERTURA; ABERTO.

Comparação antiga37 e 52 teve19 pares nativos,16 corpos disponíveis,14 iguais e uma diferença de numeração de classe; grafoJS não foi integralmente certificado.

Evidência: [evidence/APK_PREVIOUS_COMPARISON_20261104/RESULT.json](evidence/APK_PREVIOUS_COMPARISON_20261104/RESULT.json). Código/fronteira: [src/playback/playback.service.ts](../../../src/playback/playback.service.ts).

Próxima verificação: Não inferir identidade integral dos APKs por subset de métodos. Usar manifests/assets/hash do artefato efetivamente entregue.

### E30

**Homologação física de áudio, catálogo inteiro e todos os aparelhos incompleta** — P2; LIMITACAO_DE_COBERTURA; PENDENTE.

Primeiro quadro/progresso comprovam as amostras identificadas, não áudio audível nem biblioteca completa. Celular foi adiado na atualização53; não está atualizado por esta operação.

Evidência: [evidence/CONNECTION_RECOVERY_20261104/CURRENT_USB_20261105/REPORT.md](evidence/CONNECTION_RECOVERY_20261104/CURRENT_USB_20261105/REPORT.md). Código/fronteira: [src/playback/native-android-player.bridge.ts](../../../src/playback/native-android-player.bridge.ts).

Próxima verificação: Executar matriz física própria depois de resolver acesso à mídia; não distribuir como solução universal somente por instalar53.

### E31

**P2.50-R1 teve TIMEOUT_CHROME** — P2; CONFIRMADO_HISTORICO; BLOQUEIO_ANTIGO_PRESERVADO.

Registro anterior passou204 controles / 34 suítes e parou no startupChrome; duas suítes finais não executadas. Não reescrever comoPASS nem atribuir aSupabase/credenciais/código sem evidência. Não é a regressão final da53.

Evidência: [evidence/P2_50_APK_V139/P2_50D_R1/REPORT.md](evidence/P2_50_APK_V139/P2_50D_R1/REPORT.md). Código/fronteira: [scripts/test-series-episode-return.mjs](../../../scripts/test-series-episode-return.mjs).

Próxima verificação: Manter o fechamentoP2.50 intacto e distinguir o ciclo cujo resultado se cita.

### E32

**Seletores, escapes, paths e parsing de logs falharam em auxiliares** — P2; INCIDENTES_DO_EXECUTOR; REGISTRADOS_NAO_PRODUTO.

Houve leituras de nomes inexistentes, comandosCDP inline com escape inválido, seletor por acento/ID incorreto e leituraUTF16 inicialmente equivocada em fases antigas. Foram corrigidos sem declarar esses incidentes como causa do app.

Evidência: [evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md](evidence/HTTP_TRANSPORT_RECOVERY_20261105/REPORT.md). Código/fronteira: [docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md](../../../docs/architecture/XANDEFLIX_PREBUILT_EXECUTION_CONTRACT.md).

Próxima verificação: Preservar resultados comparáveis=false e erros originais; usar caminhos inventariados/encoding detectado e helpers emarquivo.

## 6. O que a correção53 efetivamente muda

SourceReplacementLifecycle usa estado durável PREPARED/CLEANED/ACTIVE e epoch opaco local; fonte é comparada após autoridade remota/comercial. O primeiro uso legado exige importação limpa. Enquanto uma substituição está pendente, a UI não pode tratar snapshot anterior como a nova fonte. O fluxo fecha mídia por APIs existentes, reinicia runtime uma vez, remove cinco chaves de metadata/checkpoint e três IndexedDBs exclusivamente de apresentação, e promove só depois de revalidar fonte/snapshot. Falha mantém bloqueio de prontidão. Histórico/favoritos e artwork têm namespace de fonte para não reutilizar IDs/URLs entre ativações.

Não muda o endpoint/URL da mídia, não usa proxycentral, não altera NativePlayerActivity/PlayerControls e não integraG2/G3 ao player. Snapshots antigos são retidos transacionalmente; limpeza física solicitada depois é outra operação documentada. O novo namespace não autentica a fonte nem prova rede/acesso ao arquivo. Mesma fonte confirmada mantém refresh normal; mudança real deconfiguração sob mesmoID exige geração lógica legítima.

## 7. Critérios canônicos para o analista

Ler AGENTS.md, Architecture/Execution/SourceDataBoundary/PhasedExpansion, lockC11 e regras porgates antes de qualquer patch. Projeto/package/origin devem sercom.xandeflix.prebuilt e xandeflix2/xandeflix-prebuilt; não operar com.xandeflix.app ou o repositório protegido timbocorrea/xandeflix-2.0. O destino temporário é exceção nominal de publicação por ordem atual, não autorização permanente para qualquerbranch.

Preservar licença, chave/identidade persistente, autorização real, C9, parentalidade, staging/promoção e limites de backup. Backend éControl Plane; catálogo/busca e runtime permanecem locais; mídia device-to-source, com exceção Cast LAN já documentada. Não criar tabela remota de catálogo/episódios ou relay para resolver 403. External Preprocessing continua TARGET onde o contrato assim distingue.

Novos arquivos protegidos e alterações exigem recibos formais aditivos, hashes Git normalizados before/after e supersedes corretos. SHA256 bruto de inventário e blobGit normalizado são diferentes. Não editar histórico de recibos/negativos/verificador/timeouts para obterPASS. CampoAPPROVED_BY_CHAT_MASTER não é adjudicação independente humana. Onegateatatime/specbeforecode/latestregressionwins/stoponconflict continuam aplicáveis.

G1C-R4 preserva lacuna histórica eG2-R4 preserva exceção delimitada do índice. Esta cópia temGit próprio e mantém a linhagemA22. O guard de distribuição não autoriza deploy da branch de auditoria; não relaxá-lo. Nenhum sucesso parcial ou relatório é aprovação para release, migração, backend, instalação ou próximo gate.

## 8. Validação e reprodução da análise

Última regressão completa do produto53 antes desta publicação:204 controles / 45 suítes PASS, mantidas 42 anteriores e acrescentadas 3 de isolamento. Testes alvos:9 de isolamento,10 do coordenador,4 de wiring/política/cache Java. TypeScript --noEmit / C11 / canônico PASS. Gradle offline: 259 testes / 40 suítes,zero falhas/erros/skips; Java standalone separado. Buildweb/Capacitor/Gradle concluíram;12 assets do APK comparados byte a byte. Verificador original ao fechar:975 protegidos,versão 53,exit 0. Evidência em SOURCE_SWITCH_ISOLATION.

Resultados próprios da cópia de publicação serão registrados em[VALIDATION.md](VALIDATION.md). Não interpretar essa frase como teste executado. Dependências locais foram copiadas fisicamente do snapshot, sem install/update e sem versioná-las. Um novo checkout do analista precisa instalar pelo lock no seu próprio ambiente autorizado; isso não foi executado localmente nesta entrega. Chromium/JDK/SDK/GH podem ser necessários para suítes específicas.

Comandos para revisão estática/testes originais, depois de preflight e setup apropriado:

```powershell
$env:GIT_OPTIONAL_LOCKS='0'
git --no-optional-locks rev-parse --show-toplevel
git --no-optional-locks remote -v
git --no-optional-locks branch --show-current
git --no-optional-locks rev-parse HEAD
node scripts/verify-canonical-contract.mjs
node scripts/test-c11-new-device-activation-lock.mjs
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-canonical-regression.mjs
```

Não executar helpers de instalação/limpeza/Supabase por inferência dessa lista. Se houver falha nova, guardar exitcode/log/instante e não citarPASS antigo como resultado atual. Arquivo regression-result antigo isoladamente não prova execução nova.

## 9. Decisões solicitadas ao analista mestre

As demandas visuais anteriores — elenco somente com imagem, dimensões das capas do ator, margens de cabeçalho e botões por dispositivo — não receberam nova homologação física completa nesta correção de fonte. Os testes existentes correspondentes foram preservados; isso não equivale a certificar todas as telas/orientações. O áudio audível de trailers e conteúdos também não foi integralmente certificado. O achado de controles no celular continua individualizado em E16.

Para reproduzir a mídia real, o analista precisará de uma fonte e conta legitimamente autorizadas, entregues pelo fluxo protegido do aplicativo. Esses dados não estão no Git. O repositório contém código, contratos, fixtures sintéticas e resultados sanitizados; não contém uma ativação clonada do tablet, licença transferível ou senha de conteúdo. Instalação limpa deve seguir C11 e gerar sua própria identidade.

1. PriorizarE01–E03: obter justificativa de servidor/CDN para a mídia atual negada. Comparar, com autorização apropriada, outro player e a mesma conta/URI/headers/rede, sem mudar múltiplas variáveis ou burlar controles.
2. Revisar isolamento de fonte 53 e critério de sourceVersion; decidir matriz física legítima A-B-A. Não usar limpeza no Supabase como substituto da inspeção de entrega.
3. Revisar E10/E11 antes de homologar reset local, associação pessoal e persistência do epoch. Manter PENDING_OR_FAILED original.
4. Conciliar proveniência do recibo histórico conflitante e delimitar qual linha funcional se aprova. Não canonizar operações antigas por esta publicação.
5. Decidir futuros gates para diagnóstico de versão real, overlay/loading, countdown/lifecycle e controlesmobile. São pendências; não foram corrigidas aqui.
6. Motor externo de créditos continua só proposta: edição real/duração/proveniência/autoridade; sem integração/backendnovo. Nenhuma inferência de marcadores HLS automáticos ou timestamp universal por TMDB/S/E.
7. Somente após acesso e matriz física satisfatórios, decidir gate próprio de distribuição/assinatura/homologação. Nenhum APK foi homologado para todos os aparelhos por este relatório.

## 10. Estado terminal desta publicação

Código de produto: snapshot governado1.0.53, sem novo patch funcional. ErroHTTP403:ABERTO. Relação exata da recusa com política/arquivo/conta/rede:NAO_PROVADA. Tablet: filme amostrado PASS, séries amostradas 403. Fire: playback NAO_HOMOLOGADO. Celular 53: ADIADO. Limpeza manual:CATALOGO_REIMPORTADO_COM_RESSALVAS. Revisão independente: PENDING. Main/roots/históricos preservados. Merge/PR/release/backend/dispositivos/novo gate:NAO_INICIADOS.

Publicar esta branch significa disponibilizar os arquivos para análise; não significa concluir o restabelecimento integral.
