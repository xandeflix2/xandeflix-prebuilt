# CANON-01-OPAQUE-HLS-MIME-RECOVERY — evidence



## CANON-01-OPAQUE-HLS-MIME-RECOVERY — isolated conditional P1, 2026-10-23

Fire Stick normal UI reproduced opaque HLS UnrecognizedInputFormatException. Baseline135 controls/23 suites,127 Prebuilt and C11 PASS. Nine unchanged new JVM tests failed before patch (seven missing MIME-hint method; two missing native entry wiring). Two setup failures are recorded separately: missing generated Capacitor files, then the canonical guard correctly rejected the still-unregistered new test during web build. Ordinary baseline web build and sync prepared the isolated test environment; no guard was skipped. Minimal shared MIME hint now binds both preview and fullscreen for strict opaque HTTP(S) HLS paths. URI/query/headers/candidates, TS and VOD inference preserved. Validation of patched tree PENDING. No claim of startup optimization or physical recovery. Authorization transcript SHA256 92cd46c5247e1fa08746e5c36491e2d1f024ca577d52748bb53133edba47374f. Original L1/21 receipts are unchanged in active workspace; new receipt exists only in isolated copy. No install/Git/backend/Vercel.

## Authorization transcript (UTF-8/LF, provenance digest only; not a digital signature)

```text
# CHAT MESTRE — PRIORIDADE MÁXIMA: RECUPERAÇÃO FUNCIONAL DOS DISPOSITIVOS

**Projeto:** XANDEFLIX_PREBUILT  
**Workspace:** `C:\Xandeflix\xandeflix-prebuilt-c11-main`  
**Branch atual:** `fix/source-output-format-recovery`  
**HEAD esperado:** `d8a74102124fbb8a3f013f6fd8a502519c1db4b8`

## OBJETIVO PRINCIPAL

O usuário informa que o aplicativo Xandeflix deixou de funcionar corretamente em vários dispositivos após atualizações recentes.

A prioridade operacional passa a ser **identificar a primeira falha real e preparar o restabelecimento das conexões e funcionalidades dos aparelhos**.

A subetapa Vercel L1 terminou localmente, mas não corrigiu o aplicativo Android nem validou qualquer dispositivo físico.

Não continuar L2, L3, L4 ou L5 da Vercel nesta execução.

## AUTONOMIA CONCEDIDA

Autorizo o agente a executar autonomamente diagnósticos físicos não destrutivos, consultar os arquivos e contratos do projeto, executar testes, coletar evidências sanitizadas, comparar versões, reproduzir falhas e preparar uma correção funcional mínima em ambiente isolado quando a causa estiver comprovada.

Não é necessário solicitar aprovação a cada teste de leitura.

A autonomia inclui planejamento técnico, especificação pré-código, implementação local isolada de correção comprovada, testes de regressão e preparação de APK experimental separado, desde que o escopo seja formalizado antes do patch e todas as proteções canônicas sejam preservadas.

**Não autoriza instalação do APK em aparelhos, exclusão de dados, alteração remota, commit, push ou deploy.**

## FASE P0 — PRESERVAÇÃO E DIAGNÓSTICO

### 1. Preservar o estado recebido

Executar o preflight obrigatório de `AGENTS.md`.

Confirmar repositório, branch, HEAD, origin e estado Git.

Registrar e preservar as 10 alterações locais pendentes da L1, incluindo os três arquivos não rastreados.

Não executar `git reset`, `git clean`, checkout que sobrescreva alterações, stash automático, merge ou mudança de branch.

Não reverter a L1 para facilitar testes.

Caso seja necessário modificar código funcional, usar uma cópia de trabalho isolada e verificável, preservando o projeto ativo.

### 2. Inventariar todos os dispositivos acessíveis

Usar ADB somente nos aparelhos que já estejam autorizados e acessíveis.

Identificar:

- Modelo e serial ADB.
- Estado de conexão ADB: online, offline ou ausente.
- Package instalado: `com.xandeflix.prebuilt`.
- Versão e versãoCode.
- Hash do APK instalado, quando puder ser coletado sem alteração.
- Estado de execução do aplicativo.
- Disponibilidade da rede.
- Erros recentes do aplicativo, com credenciais e identificadores privados removidos.

Não confundir ausência de conexão ADB com falha de conexão do aplicativo à fonte ou ao servidor.

### 3. Identificar a primeira falha funcional

Para cada aparelho acessível, verificar separadamente:

**A — Identidade e ativação**

O aplicativo abre? A identidade previamente criada existe? A autorização do dispositivo continua válida?

Não gerar nova identidade ou chave por causa de uma falha de rede.

**B — Comunicação com o Control Plane**

Consegue estabelecer comunicação HTTPS? Existem erros DNS, TLS, timeout, autenticação, revogação ou licença?

**C — Entrega e autorização da fonte**

A fonte configurada continua associada ao dispositivo? Houve erro na resolução/autorização ou mudança de configuração?

Não revelar URL completa, usuário, senha, token ou dados do cofre.

**D — Importação e catálogo local**

Verificar se há catálogo ativo, se o ponteiro permanece válido, se a última atualização terminou e se existem erros de staging ou promoção.

Separar filmes, séries e canais ao vivo.

Nenhuma geração ativa poderá ser removida ou substituída durante o diagnóstico.

**E — Compatibilidade da fonte**

Verificar o comportamento dos formatos `hls`, `mpegts`, `ts` e M3U, preservando a URL original.

Investigar as regressões anteriormente registradas no importador e nos classificadores de conteúdo.

**F — Reprodução**

Quando houver conteúdo autorizado e acessível, identificar se o erro ocorre antes da abertura do player, durante o carregamento ou após o início da transmissão.

Distinguir falha de URL, protocolo, DNS/TLS, autenticação, codec, buffering e indisponibilidade externa.

Não introduzir proxy, desativar certificados ou contornar HTTPS/CORS.

### 4. Comparação entre aparelhos

Montar matriz com:

`DEVICE | APK_VERSION | ADB | NETWORK | AUTH | SOURCE_DELIVERY | CATALOG | LIVE | MOVIES | SERIES | PLAYBACK | FIRST_FAILURE`

Distinguir falhas comuns de falhas exclusivas de um aparelho.

Se todos falharem na mesma etapa, priorizar a causa compartilhada antes de modificar código específico de Android.

Se apenas determinada versão falhar, comparar com a última versão comprovadamente funcional.

## FASE P1 — CORREÇÃO LOCAL CONDICIONAL

Somente avançar se a fase P0 identificar uma causa reproduzível e relacionada ao código.

Antes de modificar qualquer arquivo:

1. Criar uma especificação curta com o defeito, reprodução, comportamento esperado e impacto.
2. Declarar uma allowlist fechada de arquivos realmente necessários.
3. Criar um teste que reproduza a falha antes da correção.
4. Implementar o menor patch possível em ambiente isolado.
5. Executar novamente o teste e todas as regressões obrigatórias.
6. Preservar os 21 recibos já existentes e cumprir as regras de evolução canônica para qualquer arquivo protegido.
7. Verificar que identidade, ativação, licença, parental, fonte cifrada, catálogo ativo e dados privados continuam preservados.

Não aplicar uma correção especulativa.

Não alterar Supabase, regras de licença, credenciais, certificados, backend ou URLs armazenadas para fazer um teste passar.

Se a causa for externa — rede, provedor, licença ou certificado — não simular uma correção de código. Registrar o diagnóstico verdadeiro e a ação externa necessária.

### APK experimental

Caso um patch funcional comprovado exija APK, é permitido preparar um APK experimental novo e separado, após passar as validações canônicas, testes Android e auditoria de versão/assinatura/assets.

Preservar todos os APKs existentes.

**Não instalar automaticamente.** Apresentar o hash, o aparelho candidato ao teste e a análise de preservação de dados antes de solicitar autorização de instalação in-place.

## PROIBIÇÕES ABSOLUTAS

- Não usar `adb uninstall`, `pm clear` ou exclusão de dados.
- Não apagar IndexedDB, snapshots, catálogo, cache de identidade ou cofre de fontes.
- Não gerar novas chaves ou identidades para substituir aparelhos existentes.
- Não desvincular ou reativar dispositivos automaticamente.
- Não trocar fonte, credenciais ou configurações de rede persistentes sem autorização.
- Não instalar APK antigo como rollback automático.
- Não alterar `main`, fazer commit, push, merge ou deploy.
- Não mudar o projeto protegido `timbocorrea/xandeflix-2.0`.
- Não utilizar erros de rede como justificativa para desativar controles de segurança.
- Não declarar recuperação com base apenas em testes sintéticos.

## RESULTADO EXIGIDO

Entregar relatório com:

`PREFLIGHT`  
`L1_STATE_PRESERVED`  
`DEVICES_DETECTED`  
`DEVICE_CONNECTIVITY_MATRIX`  
`FIRST_FAILURE_PER_DEVICE`  
`COMMON_ROOT_CAUSE`  
`ANDROID_APP_FAILURE`  
`NETWORK_FAILURE`  
`AUTHORIZATION_FAILURE`  
`SOURCE_DELIVERY_FAILURE`  
`CATALOG_FAILURE`  
`PLAYBACK_FAILURE`  
`LAST_KNOWN_GOOD_APK`  
`PATCH_PREPARED`  
`TESTS_PASS`  
`DATA_PRESERVED`  
`APK_TEST_READY`  
`PHYSICAL_RECOVERY_CONFIRMED`

Os campos devem usar PASS, FAIL, PENDING ou NOT_APPLICABLE conforme a evidência real. Não inventar resultados.

Concluir com uma das seguintes classificações:

- `RESULT=ROOT_CAUSE_IDENTIFIED_PATCH_READY`
- `RESULT=EXTERNAL_CONFIGURATION_OR_NETWORK_BLOCKER`
- `RESULT=DEVICE_EVIDENCE_REQUIRED`
- `RESULT=PHYSICAL_RECOVERY_CONFIRMED` — somente se o funcionamento real tiver sido comprovado sem ações proibidas
- `RESULT=BLOCKED_WITH_EXACT_CAUSE`

**Objetivo de sucesso:** dispositivos autorizados voltarem a acessar as funções esperadas, com identidade, licença, fonte e catálogo preservados.

Trabalhar autonomamente até alcançar o limite desta autorização. Interromper apenas diante de risco aos dados, ausência de evidência suficiente ou necessidade de operação expressamente proibida.

A prioridade é a recuperação funcional dos aparelhos, não a continuação administrativa do pipeline Vercel.
```

## Grants

```json
{
  "supersedes": {
    "scripts/test-canonical-regression.mjs": "CANON-01-VERCEL-PREBUILT-RECOVERY-01"
  },
  "changes": [
    {
      "path": "android/app/src/main/java/com/xandeflix/prebuilt/player/NativeStreamRequest.java",
      "before": "2e78d54d7826cf4b88bd124c2d7625b8bcd01a20",
      "after": "0ac304a18040b23647313761949bc581834a055d"
    },
    {
      "path": "android/app/src/main/java/com/xandeflix/prebuilt/player/NativeAndroidPlayerPlugin.java",
      "before": "d3cd81116a6c84c7796137f89825ca9fa5b12043",
      "after": "dcf2c27419f9d80fbe43da2c5e4e78dd44884c91"
    },
    {
      "path": "android/app/src/main/java/com/xandeflix/prebuilt/player/NativePlayerActivity.java",
      "before": "2b2c82bceb3f8e767a0d9a87eb6e0f2e88359d20",
      "after": "3c4ade24ad659b00185d2de1434dfa5741da3920"
    },
    {
      "path": "android/app/src/test/java/com/xandeflix/prebuilt/player/OpaqueHlsMimeRecoveryTest.java",
      "before": null,
      "after": "eaecea2381e8268dcff09fee38f3949136c347c7"
    },
    {
      "path": "scripts/test-canonical-regression.mjs",
      "before": "8eac191359942b8cb8e5f4838cbfca55b299bf14",
      "after": "d752c9915c36f25582a961f63a100025e6ceddf5"
    }
  ]
}
```


## CANON-01-OPAQUE-HLS-MIME-RECOVERY — conclusão local isolada, 2026-10-23

Os 13 comandos oficiais passaram com exit code 0; 140 controles/23 suítes canônicas, 127 Prebuilt, 892 arquivos protegidos e 22 recibos totais. Todos os 21 recibos recebidos e a L1 foram preservados byte a byte. Android: 215 testes/36 suítes, 0 falhas/erros/skips, incluindo os mesmos 9 testes que falharam antes do patch. assembleDebug e lock C11 final PASS. A recuperação física permanece pendente: nenhuma instalação foi executada. A lentidão da primeira importação continua PENDING, sem alteração do importador. Cópia isolada e APK experimental não publicados. Nenhum Git add/commit/push/main, Vercel, backend ou dado de aparelho alterado pelo agente.
