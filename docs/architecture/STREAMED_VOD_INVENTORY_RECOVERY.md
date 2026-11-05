# CANON-01-STREAMED-VOD-INVENTORY-RECOVERY — especificação antes do código, 2026-10-23

Autorização expressa recebida pelo usuário para a exceção de leitura em fluxo descrita abaixo. Transcrição UTF-8/LF com SHA-256 real 742b1164a21517180c93b9ed526affa71e2b0892d70b8cc8add936b64956fb63, preservada na evidência; digest de proveniência, não assinatura humana. O limite de fetchDirectoryJson continua 16 MiB. A proibição anterior XUI é superseded somente para o novo leitor global de VOD com guard de 64 MiB, registro 256 KiB, profundidade32, máximo200000 raízes e projeção retida16 MiB. Classificação M3U XUI e os outros endpoints JSON continuam intactos.

Base isolada recebida: HEAD d8a74102124fbb8a3f013f6fd8a502519c1db4b8, branch fix/source-output-format-recovery, 22 recibos,140 controles/23 suítes,892 protegidos,127 Prebuilt,215 JVM. Baseline canônico/regressão/C11/Prebuilt exit0. Cópia ativa com10 arquivos L1 e base HLS imutáveis.

# Proposta de escopo — leitura limitada do inventário global

Estado anterior da proposta preservado abaixo para rastreabilidade; aprovação de escopo foi recebida antes deste código.

O contrato XUI_OPAQUE_M3U_RECOVERY.md:22 determina preservar o teto de 16 MiB por resposta. A nova solução precisa de uma exceção nominal para um leitor em fluxo diferente do JSON convencional. A autorização geral para corrigir não será usada para alterar silenciosamente esse teto.

O probe no Fire Stick leu as 33 categorias e a playlist completa sem mudar active.json. Foram observados oito IDs de filme repetidos entre resultados, um ID da API ausente da playlist, 126.650 entradas sem correspondência inequívoca pelo nome exato da série e duas linhas estruturais não associadas. A leitura da playlist consumiu 225.314 ms. Essas observações reprovam o particionamento simples como prova de inventário completo e como recuperação confiável do tempo inicial. Não indicam automaticamente perda de conteúdo no catálogo atual.

## Mudança proposta

Manter fetchDirectoryJson e DIRECTORY_JSON_MAX_BYTES em 16 MiB, sem alterar leitores de detalhes, categorias, classificação XUI, transporte, identidade, ativação, licenças ou promoção. Somente quando get_vod_streams global ultrapassar esse teto, usar outro leitor da MESMA ação/origem/credenciais, validando o documento global completo em fluxo. Não usar partições como prova de completude, não buscar M3U redundante e não descartar itens.

Novos limites fixos: 64 MiB de corpo HTTP no transporte nativo; 256 KiB por objeto JSON; profundidade máxima 32; 200.000 raízes; até 16 MiB de JSON projetado retido. A projeção preserva todos os campos consumidos atualmente pelo builder de filmes. A origem não recebe parâmetros novos ou comandos não documentados. Nenhuma fila remota/backend/proxy.

O leitor valida UTF-8 fatal, colchete inicial/final, objetos completos, strings/escapes, fim de documento, IDs únicos e tipos. Truncamento, lixo após o array, conteúdo inválido ou excesso de qualquer limite falham. Nenhum segmento é escrito até terminar todas as listas e validar o inventário. REQUIRE continua sem mudar para IDs M3U; PREFER mantém fallback funcional em falha, sem declarar melhoria de tempo nesse fallback. URLs do modo diretório continuam a política C105 já existente; player HLS preservado.

Proposta de concorrência: manter inicialmente a ordem atual para reduzir escopo. Somente se a medição justificar, especificar separadamente overlap de requests limitado e cancelamento. O objetivo desta mudança é restaurar DIRECTORY_ROOTS em vez de materializar 270 mil episódios antes da Home; não certificar 90 s sem nova ativação real.

## Allowlist mínima candidata

- src/source/source-streamed-vod-inventory.ts (novo)
- src/source/real-source-importer.service.ts
- scripts/test-streamed-vod-inventory.mjs (novo)
- scripts/test-canonical-regression.mjs
- docs/architecture/STREAMED_VOD_INVENTORY_RECOVERY.md (novo)
- docs/evidence/STREAMED_VOD_INVENTORY_RECOVERY.md (novo)
- docs/governance/authorizations/CANON-01-STREAMED-VOD-INVENTORY-RECOVERY.json (novo)
- docs/architecture/XANDEFLIX_PREBUILT_PHASED_EXPANSION.md (somente append)
- docs/STATUS.md (somente append)
- docs/EVOLUTION_REPORT.md (somente append)
- docs/ERRORS_AND_BLOCKERS.md (somente append)

Preservar a cópia isolada HLS, seus 22 recibos e os 10 arquivos L1 do workspace ativo. Registrar pedido e hash real UTF-8/LF, grants before/after reais e predecessores antes da validação canônica. Sem modificar verificador, workflows, package/lock, versão, Android funcional, Supabase, main ou Vercel. Build/APK somente após aprovação desse escopo, testes e auditoria.

## Validação e entrega física

Regressões positivas e negativas do parser e do importador real, incluindo >16 MiB sem categoria, Unicode entre chunks, último título, documento truncado, ID repetido/adulterado, autorização negada, limite bruto/projetado/por objeto, falha de I/O e manutenção do ativo anterior. Conservar as 140 verificações canônicas/23 suítes, 127 Prebuilt e 215 JVM; executar 13 comandos oficiais, sync, build Android, auditoria de assinatura/package/assets/credenciais e lock C11 final.

A reinstalação limpa somente do Fire Stick já foi autorizada pelo usuário. Só será executada depois do candidato validado. Sem restaurar dados/identidade/fonte nem operar outro aparelho. Abrir o app normalmente e deixar o usuário realizar a ativação legítima. Medir espera humana separadamente de source sync, staging, promoção, Home/imagens e busca. Não declarar a meta atingida com fixture ou warm start.

IMPLEMENTATION=NOT_STARTED
FIRE_CLEAN_INSTALL=NOT_STARTED
SCOPE_AUTHORIZATION=PENDING


## Escopo aprovado fechado e critérios de implementação

Somente os11 caminhos candidatos acima. Abandonada a candidata antiga source-partitioned-inventory.ts; nenhum arquivo desse nome será implementado. Primeiro tentar o leitor convencional. Só DIRECTORY_JSON_TOO_LARGE do get_vod_streams autoriza uma única leitura global em fluxo da mesma origem/ação; outros erros não são recategorizados como tamanho. Arrays completos, únicos, tipos e todos os limites antes de staging. Decoder UTF-8 fatal e validação estrutural integral; sem skip, catálogo parcial, categorias como prova ou falsa lista vazia. Cleanup exclusivo de cada transporte em finally, inclusive erro/leitura incompleta. Metadados não usados no builder são validados como JSON e descartados registro a registro; todos os campos consumidos e todos os IDs/títulos preservados. Digest discriminado somente no inventário recuperado em fluxo; modo DIRECTORY_ROOTS_V1 e IDs existentes preservados. PREFER/REQUIRE e política M3U legada ficam iguais. Concurrency e cronômetros do importador não serão refatorados.

Teste vermelho real do importador >16MiB antes do patch; depois testes do parser/transporte/importador/promoção/NO_OP/falha/autoridade. Preservar todos os140 controles/23 suítes e adicionar suíte dedicada. Manter todos22 recibos; grants apenas helper novo/teste novo/importador/runner. Nenhum grant para transporte/verificador/workflow/player/package/Android/versão. Status/evolução/erros/PHASED somente append.

A autorização de reinstalação limpa é específica do Fire AFTSS e package com.xandeflix.prebuilt. Build validado e APK auditado precedem uninstall. Não exportar/restaurar identidade, fonte ou catálogo. Não tocar tablet/celular nem cadastrar dispositivo no painel. Usuário realiza ativação; APK instalado/ativação pendente não significa performance homologada. Sem Git add/commit/push/main/Vercel/Supabase administrativo/próximo Gate.

## Steering posterior — imagens públicas durante ativação, antes do patch visual

Usuário relata que as imagens da API deixaram de aparecer enquanto aguardava ativação e só começam quando a fonte é importada. Código confirma: o serviço público TMDB é observado pelo StartupLoadingScreen, mas a NativeActivationPage não o mantém montado; as telas transitórias podem cancelar a consulta ao desmontar. Correção mínima adicional: reutilizar StartupLoadingScreen, sem props de fonte/identidade, como fundo decorativo aria-hidden da ativação nativa. CSS scoped esconde informações/progresso desse fundo, mantém controles e conteúdo de ativação acima dele e não intercepta input. O serviço já limita seis imagens, cache, timeout, cancelamento por visibilidade/conexão e exclui conteúdo adulto. Nenhuma consulta à fonte ou liberação antecipada por imagens.

Allowlist fechada agora13 caminhos: os11 de streaming mais src/ui/pages/ActivationPage.tsx e src/ui/pages/ActivationPage.css. Somente import/composição decorativa/CSS nestes dois; lógica de identidade/ativação/polling/license/backend imutável. Transcrição completa posterior em AUTHORIZATION_STREAMED_WITH_ARTWORK.txt, hash real será incluído no recibo. Não sobrescrever a transcrição/hashes anteriores.

Validar testes C115 de tendências públicas e C165 de transição após ativação, além de C11 e bateria integral. Antes de o usuário ativar o Fire limpo, conferir presença do fundo e solicitação/decodificação de imagem de forma sanitizada. Falha de DNS/TMDB não vira autorização ou catálogo falso nem bloqueia importação.
## Refinamento após a leitura real — antes do patch de memberships

Os testes locais38 e os13 comandos passaram, mas a validação real rejeitou STREAMED_VOD_ROW_INVALID depois de30898 registros únicos. Instrumentação somente de leitura mostrou oito repetições do mesmo stream_id com nome,formato,capa e ano idênticos, e category_id diferente em todos os oito. Não tratar isso como oito títulos omitíveis nem selecionar arbitrariamente uma categoria. A inspeção instrumental que permitiu duplicatas não é validação do candidato.

Refinamento mínimo: no leitor novo, um ID com todos os campos consumidos iguais pode reunir suas memberships de categoria. Conservar todos os IDs/títulos/formatos/capas/anos, representar o filme uma vez com categoryIds contendo todas as categorias. Duplicatas exatas são idempotentes; qualquer divergência de nome/formato/capa/ano continua falhando. Validar IDs de categoria numéricos na união, máximo512 memberships por filme e os limites de bytes projetados também em cada união. Limite200000 conta TODOS os registros brutos, inclusive repetições, para não criar bypass de recursos. Campo interno de memberships é calculado; ignorar qualquer campo homônimo recebido no JSON. Classificação/adulto do preview considera todas as categorias resultantes.

Alterar somente helper/importador/teste já na allowlist. Preservar os140 controles originais,147 controles do ciclo e todos os testes publicados anteriores; ampliar os novos casos com duplicatas exatas/múltiplas categorias e conflitos verdadeiros. Atualizar exclusivamente hashes after do novo recibo ainda não publicado e seu registro novo no apêndice, mantendo todos22 recibos históricos byte a byte. Registrar as três falhas reais e os resultados instrumentais de forma honesta. Revalidar candidato corrigido antes de instalação; os13 PASS anteriores não certificam os bytes posteriores.
## Refinamento de transporte único — antes da alteração

A leitura global integral de diagnóstico levou142839ms/17078782bytes, apenas301566bytes acima do antigo teto. Cancelar em16MiB e repetir quase toda a resposta desperdiça tempo e banda. Usar uma única transferência da mesma ação global VOD com guard64MiB. Buffer convencional limitado16MiB; se EOF ocorrer até esse teto, JSON original com todos os campos e digest HLS legado preservados. Ao cruzar16MiB, entregar o prefixo limitado e o restante ao parser incremental já especificado, liberar prefixo ao consumi-lo e usar projeção limitada. Nunca concatenar documento grande. Demais ações continuam fetchDirectoryJson intacto16MiB. Assim a exceção em fluxo só se aplica a corpo acima de16MiB, sem segundo download. Não há concorrência extra, cache persistente, categoria inferida ou mudança de fonte.

O discriminador de digest só é usado quando houve projeção do documento grande. Campo interno de memberships é usado somente nesse modo, não aceito do provedor em JSON pequeno. Todos os limites permanecem. Preservar testes de digest HLS antigo e TS/mpegts; adicionar prova de um único request global grande e registros/categories tardios. Os13 PASS do primeiro candidato continuam históricos; nova validação integral obrigatória.
## Overlap limitado justificado pela medição — antes do código

No helper final sem relaxação instrumental:43996 registros brutos/43988 IDs únicos, oito memberships reunidas,17078782bytes brutos/8589017projetados em65296ms; outras listas válidas e get_series em47729ms. Ponteiro ativo preservado. Repetir JSON não é mais necessário, mas somar sequencialmente65s+48s prejudica a referência90s do Fire. Conforme previsão da proposta original, antecipar SOMENTE as duas listas pesadas de raízes em paralelo, após handshake autenticado, mantendo limite de dois pedidos de metadados de alto nível. Depois, reutilizar as mesmas listas e buscar categorias/Live como antes. Sem segunda cópia de dados, fonte nova, worker, endpoint novo ou estágio antecipado.

Aguardar os DOIS resultados com allSettled antes de qualquer fallback/retorno de erro; nenhum request candidato pode continuar junto com fallback M3U. Falha preserva ativo. Tempos individuais de transporte/categorias continuam medidos separadamente do tempo total sobreposto. Adicionar teste de dependência cruzada dos streams que exige sobreposição sem permitir staging antes de completar todas as seis listas. Legado sem DIRECTORY_ROOTS mantém ordem e fluxo anteriores. IDs/digests/categorias/parental/autoridade continuam intactos; C105 e13 comandos serão reexecutados.