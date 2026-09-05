# Linha de Base de Seguranca (Security Baseline)

---

## 1. Diretrizes Obrigatorias de Seguranca

O desenvolvimento do **Xandeflix Prebuilt** deve manter protecao estrita de credenciais, isolamento de fronteiras e aderencia as seguintes regras normativas:

- `NO_SERVICE_ROLE_IN_CLIENT=REQUIRED`: A chave `service_role` ou quaisquer credenciais administrativas do Supabase jamais devem estar presentes no aplicativo cliente, em pacotes compilados ou em codigo consumido pelo navegador/dispositivo.
- `NO_PLAINTEXT_SOURCE_PASSWORD_IN_APK=REQUIRED`: Nenhuma senha, token de longa duracao ou credencial real de fonte de streaming pode estar hardcoded ou em texto puro no APK universal.
- `NO_PRIVATE_SIGNING_KEY_IN_REPO=REQUIRED`: Chaves privadas utilizadas para assinar pacotes de provisionamento, APKs ou bundles jamais devem ser versionadas no repositorio Git.
- `PRIVATE_SIGNING_KEY_LOCATION=EXTERNAL_ONLY`: Chaves privadas de assinatura mantidas estritamente em pipelines externos fora do cliente e fora de pacotes.
- `NO_DATABASE_PASSWORD_IN_CLIENT=REQUIRED`: Senhas de banco de dados (ex: conexao direta PostgreSQL) sao expressamente proibidas no ambiente cliente.
- `ARTIFACT_AUTHENTICITY=SIGNATURE_REQUIRED_FOR_EXTERNAL_IMPORT`: Todo artefato externo (pacote completo ou delta) exige envelope de seguranca assinado com ECDSA P-256 SHA-256.
- `UNSIGNED_NEW_ARTIFACT_IMPORT=REJECT`: Rejeicao sumaria no boundary de producao de artefatos nao assinados.
- `TRUST_ANCHOR_MODEL=PINNED_PUBLIC_KEY_SET`: Ancoragem de confianca em conjunto fixo de chaves publicas com status ACTIVE/REVOKED.
- `FAIL_CLOSED_PACKAGE_VALIDATION=REQUIRED`: Em caso de falha na verificacao de integridade, assinatura ou corrupcao de um pacote de provisionamento, o cliente deve rejeitar a importacao e abortar a operacao (fail-closed).
- `STARTUP_ACTIVE_VALIDATION=REQUIRED`: Validacao compulsoria de esquema, integridade referencial e hashes da geracao ativa durante a inicializacao.
- `RECOVERY_BASELINE=ACTIVE_PLUS_PREVIOUS_KNOWN_GOOD`: Manutencao de no minimo 2 geracoes validas locais para recuperacao automatica resiliente.
- `RECOVERY_FALSE_EMPTY_PREVENTED=REQUIRED`: Proibicao categorica de expor catalogo vazio em caso de corrupcao ou falha de leitura local.
- `RECOVERY_NETWORK=NONE`: Recuperacao estritamente local sem chamadas de rede ou downloads automaticos.
- `PACKAGE_ENCRYPTION_MVP_REQUIREMENT=NOT_REQUIRED_FOR_CREDENTIAL_FREE_PROVISIONING_DATA`: Pacotes permanecem sem criptografia de repouso devido a ausencia de dados confidenciais nos metadados.
- `LEAST_PRIVILEGE=REQUIRED`: Todas as permissoes de API (Supabase RLS, storage buckets, servicos de ingestao) devem operar sob o principio do menor privilegio.
- `LOG_SANITIZATION=REQUIRED`: Logs de debug e telemetria devem sanitizar ativamente URLs contendo tokens, parametros de autenticacao de streams e identificadores sensiveis.
- `CENTRAL_STREAM_PROXY=PROHIBITED`: Proibido implementar intermediarios centrais para trafego de video.
- `CENTRAL_VIDEO_RELAY=PROHIBITED`: Proibido retransmitir video atraves de infraestrutura propria.
- `REAL_SOURCE_CREDENTIAL_IN_G0=PROHIBITED`: No Gate G0 e expressamente vedado o uso, configuracao ou armazenamento de quaisquer credenciais reais de fontes de dados.

