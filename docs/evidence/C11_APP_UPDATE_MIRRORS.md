# C90 — Atualizações MASTER e busca manual Android — 2026-10-12

Spec anterior ao código: [contrato](../architecture/C11_APP_UPDATE_MIRRORS.md).
Preflight e hashes privados em tmp/c90-app-update-mirrors; workspace independente
main/origin esperados, HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.

## Implementação

MASTER → Atualizações: publicação de versionCode/nome, hash/tamanho, notas e
1–5 espelhos ordenáveis. Desktop em tabela e mobile em linhas identificadas.
Salvamento único, confirmação de APK idêntico, campos pendentes clicáveis,
conflito de revisão e erro sanitizado. Alteração de arquivo exige novo código.

Configurações → Atualizações do aplicativo → Buscar atualização: consulta
imediata ignorando intervalo diário, retorno informativo, download nativo e
ação de instalar após conclusão. Consulta periódica persiste via JobScheduler;
abertura complementa agenda, rede/restrições do Android controlam execução.

Transferência externa HTTPS limitada a256MiB, até cinco redirects HTTPS,
timeouts, hash/tamanho e package/assinatura/versão exatos. Arquivos parciais não
viram candidatos. Instalador recebe cópia privada imutável validada novamente.
Cancelamento mantém candidato; instalação real de versão maior remove aviso.
Adiar vale só para abertura atual. Nenhuma instalação silenciosa ou relaxamento
da ativação/licença. Backup exclui somente arquivos/preferences do updater.

## Evidências

- Migration20261012173609 e reparo20261012175114 publicados exclusivamente no
  projeto cujbmyhitgomlgwfkaat. Fixture detectou check antigo de auditoria;
  reparo preserva todos os valores antigos e acrescenta apenas atualização.
- SQL transacional com rollback: MASTER publica, ADMIN/anon negados, tabela
  direta negada, metadata pública ativa, desativada sem release, revisão antiga,
  HTTP, arquivo diferente com mesmo código e tamanho excessivo rejeitados.
  Marcador C90_MASTER_ANON_ADMIN_RLS_REVISION_VALIDATION_PUBLIC_METADATA_PASS.
- Pós-teste: configuração revision0/enabledfalse/releasenull; zero auditorias
  APP_UPDATE_PUBLISHED. Nenhuma release/cliente real publicado ou alterado.
- Teste TypeScript real: validação de campos/URLs, Dropbox dl=1 preservando
  parâmetros, prioridades/duplicidades/limite5, payload RPC/revisão, erros
  sanitizados e aba somente MASTER. C90_PUBLICATION_VALIDATION_API_PAYLOAD_ERRORS_MASTER_GATE_PASS.
- Browser Chrome desktop1507/mobile390: edição/reordenação/salvamento, erro
  clicável/foco, tabela desktop/mobile sem overflow, busca manual atual/ready/
  falha, permissão de instalação, cancelamento/adiar/reabrir, remoção após versão
  instalada simulada, UI web sem instalador. RPC público real via SDK e POST com
  apenas apikey/Content-Type (mesmos headers nativos) confirmados; demais ações
  usam fixtures, sem cadastro real. Imagens privadas inspecionadas visualmente.
- Android JVM seis testes aprovados: prazo diário/relógio, identidade e signer,
  versão, HTTPS, fallback quota→hash incorreto→espelho correto, tamanho parcial/
  excessivo e arquivo inválido rejeitados, interrupção sem candidato.
- TypeScript e build Manager/client aprovados, lock26ativação/27catálogo/
  nove controles negativos aprovados. Compilação/assembleDebug aprovados.
- APK do link fornecido lido sem instalação: package com.xandeflix.prebuilt,
  versionCode13/versionName1.0. Link real não copiado para docs/código/logs.
- APK novo de validação: versionCode14/versionName1.0.14, 11.162.690bytes,
  SHA256 f2f83a9f84e50d36ca332645b7aa7166c8a8b5521ff7ceb8c191c00b979a6a28.
  apksigner verify aprovado; mesma assinatura do APK13 fornecido pelo usuário.
  Artefato privado tmp/c90-app-update-mirrors/Xandeflix-v1.0.14-updater.apk e
  apk-metadata.json. APKs anteriores da raiz preservados; nenhuma instalação.
- Lint global Android FAIL:138erros/103avisos. Auditoria compara SHA256 de cada
  arquivo com erro ao baseline anterior ao código:138/138 em arquivos intactos,
  nenhum erro nos arquivos novos do updater. Quatro avisos ApplySharedPref no
  updater são commits intencionais de persistência em worker; não suprimir.
  Incompatibilidade de metadata Kotlin da dependência Cast anterior também
  apareceu no lint. Nenhuma correção/refatoração desses arquivos fora do escopo.
  Build/assemble/JUnit do recurso continuam PASS; lint global não homologado.

## Segurança e limites

Advisors analisados: RLS sem policies é deny-all intencional do singleton
privado sem grants diretos. RPCs SECURITY DEFINER com search_path vazio,
EXECUTE explicitamente limitado e guard MASTER nos administrativos; leitura
anon intencional de software público. Avisos correspondentes documentados,
não autorização genérica de outras tabelas/recursos. Dependências sem mudança.

Consulta de versões novas depende do registro Supabase; cache permite apenas
baixar versão conhecida durante indisponibilidade. Sem garantia de agenda exata,
downloads ilimitados ou failover além dos provedores configurados. Google Drive
que retorna página HTML/login não é fonte válida. APK apenas Android, sem pacote
Tizen/webOS. Apps antigos precisam primeira atualização física/assistida.

Teste de PackageManager/JobScheduler/instalador em aparelho físico permanece
pendente; JVM/fixtures/browser/compile não substituem esse teste. Nenhum aparelho
conectado, instalado, desinstalado, resetado ou ativado como parte deste ciclo.
Sem commit/push/PR, nenhuma release real publicada; NEXT_GATE_STARTED=NAO.
