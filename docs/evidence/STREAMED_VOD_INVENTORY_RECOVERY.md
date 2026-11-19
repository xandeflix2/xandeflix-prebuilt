# CANON-01-STREAMED-VOD-INVENTORY-RECOVERY — evidência local



## CANON-01-STREAMED-VOD-INVENTORY-RECOVERY — 2026-10-23

Usuário aprovou exceção nominal para leitura global VOD em fluxo:64 MiB brutos,256 KiB/objeto,profundidade32,200000 raízes,16 MiB projetados retidos. JSON convencional16 MiB e classificação XUI intactos. Categorias/playlist não provaram cobertura; varredura M3U225314ms no Fire não recuperava o tempo. Teste vermelho real reproduziu DIRECTORY_JSON_TOO_LARGE em19453789bytes/18000 títulos sem staging. O leitor novo valida documento inteiro,UTF-8,IDs/tipos/limites; só erro de tamanho VOD autoriza uma tentativa em fluxo. Todas as listas completas precedem staging/promoção. IDs,URLs C105,autoridade,legado,HLS e episódios sob demanda preservados. Steering posterior restaura fundo público TMDB na tela de ativação reutilizando a apresentação existente; nenhuma alteração de handlers/identidade/licença/source/polling. Allowlist13 caminhos. Validação integral e teste físico PENDING; reinstalação limpa apenas Fire depois de APK auditado e ativação legítima pelo usuário. Sem Git/backend/Vercel/main/versão. Autorização SHA256 083f0fc139d66586010a9d73abc7859ca0e610850377f3aa8982daafbc4cc304.

## Transcrição UTF-8/LF — digest de proveniência, não assinatura humana

```text
AUTORIZAÇÃO DO USUÁRIO — texto literal normalizado UTF-8/LF

prossiga com a correção e reinstale uma versao limpa no firestisck para teste de carregamento na primeira instalação. assim que estiver instalado faço a ativação para calcular o tempo de carregamento apos a primeira instalação

CONTINUAÇÃO DO USUÁRIO

continue

PERGUNTA DE ESCOPO ENVIADA AO USUÁRIO

O contrato XUI_OPAQUE_M3U_RECOVERY.md determina “do not raise that cap” para 16 MiB por resposta. A correção mais direta exige um caminho novo de leitura em fluxo para a lista global maior: manter o JSON convencional limitado a 16 MiB, limitar a resposta em fluxo a 64 MiB e cada registro a 256 KiB, validar o documento inteiro e preservar as demais proteções. Você autoriza essa ampliação nominal de escopo? Sem ela, manterei o limite atual e não instalarei uma correção que dependa dessa mudança.

RESPOSTA EXPRESSA DO USUÁRIO

Autorizar leitura em fluxo com esses limites

MENSAGEM POSTERIOR DO USUÁRIO — imagens durante ativação

antes, ao ser ativado o aplicativo, as imgens de carregamento da api j eram visiveis para o usuario na tela de ativação. apos esse ajuste, so inicia o carregamento apos o sistma começar  importar o conteudo da fonte.
```

## Grants reais

```json
{
  "changes": [
    {
      "path": "src/source/source-streamed-vod-inventory.ts",
      "before": null,
      "after": "b8364cdefd4d6d798746bfcd7522c1b01424585a"
    },
    {
      "path": "src/source/real-source-importer.service.ts",
      "before": "1ca46d9658b11d3a290206da12fd0b6892744b88",
      "after": "0fdd7e52f18fa2dc0523dd1c87c361f6c4b623ac"
    },
    {
      "path": "scripts/test-streamed-vod-inventory.mjs",
      "before": null,
      "after": "ab56f7eb544cdc462eeb41bd675cf8e61749d0ed"
    },
    {
      "path": "src/ui/pages/ActivationPage.tsx",
      "before": "611c2be793792abf3cc378235ba41b626f67f287",
      "after": "e2d3f1b854dbfbf60c20fb47842fdc8c350f7c4a"
    },
    {
      "path": "src/ui/pages/ActivationPage.css",
      "before": "77622641076122d7afe12e8cac9c8145f1f1d442",
      "after": "d6503d335067dce24f1624c4505491604f844aeb"
    },
    {
      "path": "scripts/test-canonical-regression.mjs",
      "before": "d752c9915c36f25582a961f63a100025e6ceddf5",
      "after": "4aa9f24b83f2080008396cefc8d3d0a8867a3cd7"
    }
  ],
  "supersedes": {
    "src/source/real-source-importer.service.ts": "CANON-01-CATALOG-PHYSICAL-FIXES",
    "scripts/test-canonical-regression.mjs": "CANON-01-OPAQUE-HLS-MIME-RECOVERY"
  }
}
```


## Refinamento validado após falha real — 2026-10-23

Primeiro candidato:13 comandos locais,147 controles/24 suítes,38 testes dedicados e build Android PASS; não instalado. Três leituras reais rejeitaram registros repetidos. Inspeção instrumental separada demonstrou oito IDs com conteúdo idêntico e categorias diferentes; ela não é um PASS do candidato. Novo leitor preserva todas as memberships e falha para diferenças de nome/formato/capa/ano. Limite200000 considera registros brutos,incluindo duplicatas; limite16MiB projetados também inclui memberships e teto512 categorias por filme. Campo interno não vem do provedor. Uma falha de teste transitória detectou mudança do código público de erro HTTP; corrigido mapeamento para DIRECTORY_JSON_FETCH_FAILED, sem relaxar a assertion.

Transferência única: até16MiB, documento original/digest preservados; acima, parser incremental do prefixo limitado e resto, sem refetch. As duas listas pesadas se sobrepõem com no máximo dois pedidos de alto nível, ambos aguardados em falha antes de fallback. Testes novos exigem overlap e drenagem. Aprovação de bounds mantida; no source/identity/license/C9/native/version/backend change.

Leitura real final do helper SEM relaxar duplicatas:43996 registros brutos/43988 filmes únicos,8 memberships preservadas,17078782bytes brutos e8589017projetados,65296ms. Cinco listas companheiras válidas,9470 raízes de séries,2034 canais; ponteiro ativo preservado. Prova sanitizada streamed-real-provider-proof-1792775463134.json. Helper SHA256 7809663205e757302129dd5bebf20e84c856f553cef81c26f6df471f90ef191b. Não é teste de instalação nova nem promessa90s. Segunda validação integral dos bytes refinados PENDING; recibos22 anteriores e L1 intactos.

Grants atualizados somente no recibo NOVO ainda não publicado:

```json
[
  {
    "path": "src/source/source-streamed-vod-inventory.ts",
    "before": null,
    "after": "e6b2939976e44a150464827b28bc0c19c819c909"
  },
  {
    "path": "src/source/real-source-importer.service.ts",
    "before": "1ca46d9658b11d3a290206da12fd0b6892744b88",
    "after": "662562db833c93c192703cd3f15b394ae1cc57f5"
  },
  {
    "path": "scripts/test-streamed-vod-inventory.mjs",
    "before": null,
    "after": "aa45b21d1c22659801d960612fff323eb4fde77e"
  },
  {
    "path": "src/ui/pages/ActivationPage.tsx",
    "before": "611c2be793792abf3cc378235ba41b626f67f287",
    "after": "e2d3f1b854dbfbf60c20fb47842fdc8c350f7c4a"
  },
  {
    "path": "src/ui/pages/ActivationPage.css",
    "before": "77622641076122d7afe12e8cac9c8145f1f1d442",
    "after": "d6503d335067dce24f1624c4505491604f844aeb"
  },
  {
    "path": "scripts/test-canonical-regression.mjs",
    "before": "d752c9915c36f25582a961f63a100025e6ceddf5",
    "after": "4aa9f24b83f2080008396cefc8d3d0a8867a3cd7"
  }
]
```


## CANON-01-STREAMED-VOD-INVENTORY-RECOVERY — validação final local, 2026-10-23

RESULT=LOCAL_VALIDATED_FIRE_CLEAN_INSTALL_PENDING. Candidato final:13 comandos oficiais em sequência, todos exit0;147 controles canônicos/24 suítes,894 arquivos protegidos,23 recibos,127 controles Prebuilt. Testes dedicados46 PASS, inclusive memberships completas, conflitos, um único request global,overlap de duas raízes e drenagem em falha. Digest HLS legado,TS/mpegts e12 testes C105 preservados. C115 tendências públicas e C165 transição após ativação PASS. Build Android/lock final concluídos; auditoria de assinatura/assets e instalação física ainda PENDING nesta anotação.

Falhas preservadas: três tentativas reais do primeiro candidato rejeitaram IDs duplicados; a inspeção que permitia duplicatas foi exclusivamente diagnóstico, nunca PASS do release. Leitura posterior sem relaxação validou43988 filmes únicos/43996 registros e oito memberships,9470 séries e2034 canais. Uma assertion transitória detectou mudança de código de erro HTTP, corrigido mantendo o código compatível. Tentativa2 da validação integral perdeu o código de saída quando o watchdog EXTERNO de300s terminou; seu processo filho concluiu147/24 PASS e foi aguardado antes de repetir. Tentativa3 usou900s somente no orquestrador externo e concluiu com exit0 real; timeouts/assertions do projeto não foram modificados.

Todos22 recibos recebidos, arquivos nativos HLS,package/lock,versão e workspace L1 preservados. Novo recibo atualizado somente antes do fechamento; nenhum recibo histórico reescrito. Não houve Git add/commit/push/main,Vercel,Supabase administrativo ou outro Gate. Homologação de primeira instalação90s e imagens no Fire não é substituída por mocks ou leitura quente. Usuário ainda realizará ativação normal após a instalação limpa autorizada, com espera humana separada.
