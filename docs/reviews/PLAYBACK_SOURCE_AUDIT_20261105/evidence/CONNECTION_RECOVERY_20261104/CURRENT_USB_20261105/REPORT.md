# Auditoria física USB e hotspot 5G — 05/11/2026

**Resultado: testes comparativos concluídos; recuperação integral ainda aberta.** O mesmo filme reproduziu no celular 1.0.37 e no tablet 1.0.52, com URL e headers efetivamente iguais. O mesmo episódio retornou HTTP 403 em ambos, também com URL e headers iguais. A diferença de versão não explica sozinha esse caso. A causa exclusiva da recusa na cadeia de entrega de mídia permanece sem comprovação; não se adjudica automaticamente culpa ao aplicativo, ao provedor ou à operadora.

Horários dos JSONs em UTC; fuso local America/Sao_Paulo = UTC−3. A sessão foi concluída com remoção dos observadores em 05/11, aproximadamente 07:33 local. Esta pasta acrescenta evidência; não substitui nem reescreve os resultados históricos.

## Aparelhos e versão efetivamente instalada

Conferência final dos arquivos `base.apk` diretamente nos três dispositivos às **10:33:32Z / 07:33:32 local**, em `INSTALLED_APKS_AFTER_TESTS.json`:

| Dispositivo | Versão / código | SHA-256 | Comparação com o APK fornecido |
|---|---|---|---|
| Tablet SM-X610 | 1.0.52 / 52 | `0146a2fc05d3e45f5670f4c5aba0fa0d0ba1cd25bd0086f7ac00de4cb6ab8c29` | Idêntico |
| Celular SM-S926B | 1.0.37 / 37 | `433a60d77669430de4cc09b45db0b3f29760b2578d920d76f60ee9580ce18252` | Versão anterior |
| Fire USB AFTSS | 1.0.52 / 52 | `f1eb668de79aebd0384424c67a289eea9c5206fa8db901020789f52a8a079358` | Outra compilação com o mesmo código |

O usuário informou que trocou o Fire. O alvo USB desta sessão não é o Fire Wi-Fi da noite anterior. Não transferir conclusões físicas entre eles. Nenhum APK foi instalado, atualizado ou gerado pelo executor neste complemento. A comparação estática e a colisão de versionCode estão documentadas em [LATEST_APK_COMPARISON.md](../LATEST_APK_COMPARISON.md).

## Internet e configuração ativa

O usuário confirmou que **celular fornece hotspot 5G ao tablet e ao Fire**. A repetição do episódio no tablet após a informação de troca de rede manteve a mesma URI e o User-Agent normal e terminou com 403 (`TABLET_NETWORK_REPEAT.json`). Isso não equivale a uma captura completa de DNS, IPv4/IPv6, rota, proxy e redirects de cada aparelho.

Comparação da configuração ativa com o registro selado de cada dispositivo, sem copiar fonte entre aparelhos:

- Tablet e celular: mesmo origin, mesma base de API e mesmas credenciais. Identidade lógica/versão local diferentes; esse fato isolado não demonstra contaminação ou erro.
- Fire USB: mesmo origin/base de API, mas credenciais diferentes das usadas por tablet/celular. Seus resultados não constituem comparação com uma conta idêntica.
- O pedido de episódio do tablet corresponde à configuração ativa: origin, usuário, senha, ID do episódio, contexto e extensão conferem. O episódio aparece uma única vez na resposta atual da API; não foi encontrado token ou referência alternativa nos campos examinados.

Essas comparações usaram HMAC com chave aleatória exclusiva, calculado nos dispositivos. Chave e digests ficaram transitórios na memória do processo; somente flags de igualdade foram persistidas. Nenhuma URL, credencial, corpo privado, título ou ID de conteúdo foi gravado nos relatórios.

Evidências: `SOURCE_BINDING_COMPARISON.json`, `TABLET_REQUEST_BINDING.json`, `TABLET_EPISODE_REFERENCE.json`. A ausência de conflito no conjunto examinado não certifica todos os caches e registros históricos.

## Celular: testes solicitados

**Filme:** abertura nativa aceita; duração 6.395.094 ms e posição avançando de 2.854 até 47.973 ms nos eventos capturados. Logs nativos do PID registraram primeiro frame, READY e avanço de posição antes da tentativa de série. A reprodução foi encerrada normalmente pelo executor para prosseguir com os testes. Evidências: `PHONE_MOVIE_5G.json`, `PHONE_MOVIE_5G_FINISH.json`, `PHONE_5G_NATIVE.json`.

**Série:** oito botões de episódio disponíveis na temporada mostrada; o primeiro episódio selecionado abriu o player nativo, mas recebeu **HTTP 403, Media3 2004, DATASOURCE_OPEN**, sem duração ou avanço. `PHONE_SERIES_5G.json` registra o resultado. A comparação posterior comprovou igualdade exata de URI e headers com o episódio que falhou no tablet (`TABLET_PHONE_CURRENT_REQUEST_COMPARISON.json`). Portanto, a recusa desse episódio também existe na versão anterior 1.0.37.

Logs de codecs são observações do dispositivo e não prova isolada de áudio audível da sessão. Não foi realizada homologação física completa de áudio, controles, retorno e todos os formatos.

## Comparação controlada de filme entre celular e tablet

Foi selecionado um título exibido com correspondência única nos dois catálogos. As reproduções passaram pelos próprios botões do aplicativo e foram sequenciais, encerrando a primeira antes da segunda. Depois da seleção, compararam-se separadamente os pedidos reais: **mesma URI, origin, caminho e headers**. Título igual sozinho não foi usado como prova da identidade da mídia.

- Celular 1.0.37: duração 5.448.683 ms; posição 4.371 → 9.383 ms.
- Tablet 1.0.52: mesma duração; posição 6.129 → 11.142 ms.

Ambos reproduziram esse filme. Evidência: `PAIRED_MOVIE_EXACT_PLAY.json`. Outro filme selecionado anteriormente no tablet retornou 403 (`TABLET_MOVIE_CURRENT.json`); não se conclui que todos os filmes funcionem.

## Episódios, User-Agent e situação da conta

No tablet, duas seleções diferentes de episódio terminaram em 403 antes do primeiro frame. O primeiro também foi repetido uma vez com apenas o User-Agent padrão do WebView do próprio dispositivo, mantendo URI e episódio exatos; o resultado continuou 403. O interceptador desse experimento foi restaurado automaticamente após o único pedido. Não se alterou o APK.

A API de conta no tablet informou `AUTHORIZED`, `Active`, zero conexões em uso e limite de duas. O Fire informou os mesmos estados para sua própria conta, também com zero de duas conexões. São respostas pontuais; não comprovam autorização ou existência de cada arquivo VOD. Os formatos `m3u8`/`ts` informados nessa API não foram tratados como proibição comprovada da extensão MP4 de episódios.

Evidências: `TABLET_EPISODE_DEFAULT.json`, `TABLET_SECOND_EPISODE_DEFAULT.json`, `TABLET_EPISODE_BROWSER_UA.json`, `TABLET_UA_EXPERIMENT.json`, `TABLET_ACCOUNT_STATE.json`, `FIRE_USB_ACCOUNT_STATE.json`.

## Fire USB na rede 5G

Uma primeira tentativa de filme permaneceu sem duração e sem avanço, mostrando posição de retomada fixa em 26.607 ms; foi encerrada pelo executor depois de aproximadamente 78 segundos. Isso não prova reprodução: a posição inicial pode ser apenas o progresso anteriormente salvo. O retorno não trouxe erro HTTP terminal. Logs nativos focalizados não produziram checkpoints suficientes para atribuição causal.

Foi selecionado depois no Fire o título do filme que reproduziu no tablet/celular. Sua conta possui outras credenciais; igualdade de título não comprova igualdade de autorização ou de mídia. A segunda tentativa partiu de zero e não mostrou duração/avanço nos aproximadamente 13 segundos efetivamente observados entre OPEN e coleta, sendo encerrada normalmente. Essa janela é insuficiente para concluir timeout terminal ou HTTP 403. **Playback físico do Fire USB continua não homologado nesta sessão.**

Evidências: `FIRE_USB_MOVIE_5G.json`, `FIRE_USB_MOVIE_5G_FINISH.json`, `FIRE_USB_5G_NATIVE.json`, `FIRE_USB_KNOWN_MOVIE_5G.json`.

## Incidentes dos auxiliares e limites

- A primeira consulta ao WebView do Fire ocorreu durante sua inicialização e não encontrou o socket; a consulta posterior encontrou o alvo já iniciado.
- Navegação do celular 1.0.37 exigiu texto do botão como alternativa ao aria-label. A primeira navegação automática não clicou em Filmes; isso foi detectado e corrigido antes do teste de filme registrado.
- A primeira tentativa de comparar filme por sufixo do ID não localizou o card correspondente; nenhuma equivalência foi declarada.
- Uma tentativa por título com seletor genérico de reprodução não produziu OPEN de filme no celular. `PAIRED_MOVIE_BY_CARD.json` registra `comparable=false` e não é prova do par. A seleção ambígua do auxiliar foi substituída pelo botão específico de reprodução; o teste válido posterior é `PAIRED_MOVIE_EXACT_PLAY.json`. Não se atribui esse incidente ao produto.
- O Fire antigo não possui o mesmo atributo de foco usado no seletor da compilação mais nova. A busca inicial do botão falhou sem iniciar mídia. A tentativa seguinte teve erro de escape do regex do auxiliar, corrigido antes do clique efetivo. O único OPEN da segunda amostra está em `FIRE_USB_KNOWN_MOVIE_5G.json`.
- Houve um OPEN adicional de episódio observado no tablet fora da sequência do helper da comparação. A origem desse acionamento não foi adjudicada; os timestamps permanecem no log. As comparações explicitamente controladas possuem seus próprios arquivos.

Não foram executados regressão completa, typecheck, build ou homologação nesta continuação de inspeção dos APKs. Resultados históricos de G3 não foram reapresentados como testes novos.

## Estado, preservação e continuidade

Os três observadores e listeners temporários foram restaurados/removidos; as referências privadas mantidas por eles foram descartadas. Recibos: `TABLET_OBSERVER_CLEANUP.json`, `PHONE_OBSERVER_CLEANUP.json`, `FIRE_OBSERVER_CLEANUP.json`. Os APKs foram novamente conferidos após os testes. Nenhuma fonte, licença, identidade, dado de ativação ou configuração do hotspot foi alterada pelo executor. Os fluxos normais de reprodução podem atualizar o histórico de progresso do próprio aplicativo.

As escritas desta sessão limitam-se a ferramentas e evidências nesta pasta externa. Repositório do IDE, candidato Next Episode, referência 1.0.52 e fases P2.50 não receberam patches. Sem Git write, backend administrativo, Supabase, instalação ou distribuição. G4/motor externo de créditos não foi iniciado.

**Orientação sobre trocar fontes:** manter as configurações atuais durante a comparação. Tablet e celular já fornecem uma comparação de mesma conta/base de API, mesma URI e mesmos headers. Trocar a fonte agora introduziria outra variável. Uma fonte alternativa poderá futuramente fornecer um controle adicional de disponibilidade, sem substituir ou apagar estes resultados e sem ser considerada correção automática.

**Pendência concreta:** determinar por que a cadeia de entrega do episódio examinado devolve 403. Os diagnósticos disponíveis identificam código/checkpoint, mas não a justificativa do servidor nem toda a cadeia de redirects. É necessário obter evidência da entrega do mesmo episódio — por exemplo, resposta sanitizada/registro do servidor ou comparação controlada em outro player autorizado. Conta ativa e catálogo 2xx não resolvem essa pergunta. Ainda são possíveis restrição de conteúdo/conta, arquivo/rota/redirect indisponível e incompatibilidade compartilhada pelos clientes; nenhuma foi provada como causa exclusiva.

Não há fundamento para declarar conexão integralmente restabelecida, corrigir por palpite o player ou distribuir uma compilação como solução comprovada. A comparação técnica está concluída; o incidente de reprodução permanece aberto.

```text
TABLET_APK=1.0.52_EXACT_USER_APK
PHONE_APK=1.0.37
FIRE_USB_APK=1.0.52_DIFFERENT_BUILD
NETWORK=USER_CONFIRMED_PHONE_5G_HOTSPOT
TABLET_PHONE_SOURCE_ACCOUNT=EQUIVALENT_CONFIG
FIRE_SOURCE_ACCOUNT=DIFFERENT_CREDENTIALS
SAME_MOVIE_URI_HEADERS=PASS_REPRODUCED_ON_TABLET_AND_PHONE
SAME_EPISODE_URI_HEADERS=HTTP_403_ON_TABLET_AND_PHONE
USER_AGENT_ONLY_EXPERIMENT=HTTP_403_UNCHANGED
FIRE_USB_PLAYBACK=NOT_HOMOLOGATED
EXCLUSIVE_ROOT_CAUSE=UNRESOLVED
TEMPORARY_OBSERVERS=REMOVED_ALL_THREE
PRODUCT_CODE_MODIFIED=NAO
APK_INSTALLED_BY_EXECUTOR=NAO
BUILD_EXECUTED=NAO
GIT_WRITE=NAO
SUPABASE_WRITE=NAO
RESULT=USB_5G_COMPARATIVE_DIAGNOSTIC_COMPLETE_RECOVERY_OPEN
```
