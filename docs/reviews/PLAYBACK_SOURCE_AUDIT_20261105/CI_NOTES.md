# Complemento — falhas do CI remoto

Commit examinado: **6df7ef248c8c96307ee1b07fccf66047ffaf5380**. Observação em05/11/2026. **CI remoto=FAIL**; os testes locais PASS permanecem como evidência local e não constituem aprovação global. LATEST_REGRESSION_WINS: publicação disponível para análise, aprovação técnica/release bloqueadas. Este complemento não corrige código nem testes.

| Workflow/job | Falha observada |
|---|---|
|[Canonical regression](https://github.com/xandeflix2/xandeflix-prebuilt/actions/runs/42083181697), Windows|test-app-intro-branding-07; AssertionError, exit1|
|Canonical regression, Ubuntu|test-episode-general-identity; ENOENT, exit1|
|[Site build validation](https://github.com/xandeflix2/xandeflix-prebuilt/actions/runs/42083181589), Windows|test-app-intro-branding-07; AssertionError, exit1|
|Site build validation, Ubuntu|test-series-episode-return; exit1, causa interna não exposta|

O canon:check isolado passou nos dois jobs Site build. As etapas posteriores à falha da regressão foram puladas pelo workflow; não foram aprovadas. Builds de aplicação/site não chegaram a executar nesses jobs. Não atribuir os erros a configuração pública de build sem execução dessa etapa.

## E33 — Windows

O último marcador foi HUNG_BRIDGE_TIMEOUT_AND_LATE_CALLBACK_ARE_BOUNDED. A próxima verificação, REAL_ENTRY_IMPORTS_UNCHANGED_APPLICATION_ONCE_AFTER_GATE, inclui hash bruto fixo de src/main.tsx. LF local:aefd904186e289cd4dc56b21ee40ccc876909991099e50dcf2f904e38e9269c7; CRLF calculado:e14d521cf6c88d5b3dfeb44fa6f29c7abc92dd6a01f2361bf1eed443a8bff603. Isso demonstra sensibilidade aos bytes/EOL, mas não prova qual foi a asserção que falhou no CI nem a configuração efetiva do checkout Windows. Não foi modificado o teste nem o arquivo de produto.

## E34 — Ubuntu

O teste de identidade contém spawn literal do Chrome no caminho Windows. Essa incompatibilidade estática dá uma hipótese fortemente localizada para ENOENT. Os logs seguros do runner não incluem o stack do filho, portanto a localização exata deve ser confirmada no próximo gate. Não foi criado stub de browser ou fallback que devolva PASS.

## E35 — Ubuntu

A suíte de retorno a episódios falhou somente no job Site build desta amostra. Os campos CI_DIAG não expõem a causa e a suíte não publica seu log filho como artifact nesse workflow. O mesmo teste avançou no outro job Ubuntu. Não concluir timeout, codec, erro de fonte ou regressão de UI sem evidência adicional.

Metadata dos jobs em[CI_REMOTE_JOBS.json](publication-validation/CI_REMOTE_JOBS.json). Linhas diagnósticas filtradas e hashes em[CI_FILTERED_DIAGNOSTICS.json](publication-validation/CI_FILTERED_DIAGNOSTICS.json). O filtro remove URLs e não publica corpos/credenciais. Não é transcrição integral do console. A consulta API inicial da árvore teve erro auxiliar de quoting no jq, corrigido com parsingJSON em memória; o relatório remoto foi verificado por hash e a árvore confirmou1942 arquivos no primeiro commit.

Não houve retry, mudança de workflow, dependência, teste, timeout, negativo, runtime, backend ou aparelho. O próximo commit acrescenta exclusivamente esta documentação. Novos runs automáticos podem iniciar pelo push e não representam correção dessas falhas.
