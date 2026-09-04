# Xandeflix Prebuilt — Contrato de Execucao Tecnica

---

## 1. Escopo e Aplicacao

Este Contrato de Execucao Tecnica rege a atuacao de agentes de engenharia de software e modelos de linguagem no desenvolvimento do projeto **Xandeflix Prebuilt** (`XANDEFLIX_PREBUILT`).
Ele formaliza os principios operacionais, regras de engenharia rigorosa e restricoes de seguranca que garantem previsibilidade, rastreabilidade e integridade arquitetural.

---

## 2. Principios Fundamentais de Engenharia

### 2.1. SPEC_BEFORE_CODE
Nenhuma linha de codigo de producao, teste automatizado ou infraestrutura deve ser escrita sem que a especificacao formal do Gate correspondente esteja aprovada e documentada. Especificacao precede a implementacao.

### 2.2. ONE_SOURCE_OF_TRUTH
A documentacao versionada no repositorio Git (`/docs` e arquivos raiz) e a unica fonte formal de verdade arquitetural e tecnica. Em caso de divergencia entre afirmacoes textuais de agentes e arquivos versionados, o conteudo versionado prevalece.

### 2.3. PATCH_MINIMO
Todas as intervencoes devem conter a menor alteracao cirurgica necessaria para satisfazer o criterio do Gate ativo. E expressamente vedado introduzir mudancas decorativas, cosmeticas ou sem correlacao direta com o escopo aprovado.

### 2.4. NO_UNPLANNED_REFACTOR
Refatoracoes oportunistas, reestruturacoes de pastas ou reescritas de modulos nao explicitamente previstas no plano do Gate sao proibidas.

### 2.5. AUTOMATED_FIRST
Sempre que aplicavel, validacoes tecnicas, testes de regressao e auditorias devem ser realizados por comandos executaveis automatizados antes de submissao para avaliacao.

### 2.6. NO_CHAT_AS_TRUTH
Conversas em chats, sessoes intermediarias de LLMs e mensagens em memoria volatil nao constituem historico oficial nem autorizacao contratual se nao refletidas nos artefatos canonicos.

### 2.7. ERROR_MEMORY
Todos os erros, falhas tecnicas de compilacao, quebras de testes ou problemas de integridade encontrados devem ser registrados formalmente em `docs/ERRORS_AND_BLOCKERS.md` para formar a memoria tecnica do ciclo.

### 2.8. STATUS_MEMORY
O status de progresso dos Gates deve ser fielmente mantido e atualizado em `docs/STATUS.md` e `docs/EVOLUTION_REPORT.md`.

### 2.9. NO_SECRET_CONTEXT
E estritamente proibido inserir segredos, senhas reais, tokens privados, chaves de assinatura ou URLs confidenciais no workspace, no Git ou na documentacao.

### 2.10. NO_AUTOMATIC_COMMIT
O executor nao tem autoridade para efetuar `git commit`, `git push` ou criar pull requests sem autorizacao expressa e nominal do Chat Mestre.

### 2.11. STOP_ON_CONFLICT
Ao encontrar qualquer inconsistencia com os contratos arquiteturais, colisoes de repositorios protegidos ou quebras de integridade, o agente deve parar imediatamente e reportar o bloqueio.

### 2.12. DEFINITION_OF_DONE (DoD)
Um Gate so pode ser considerado concluido pelo executor quando:
1. Todos os arquivos e requisitos normativos do Gate forem atendidos;
2. Todas as auditorias automatizadas passarem;
3. Nenhum segredo for exposto;
4. Nao houver alteracao nao autorizada no workspace ou em projetos externos;
5. O relatorio terminal padronizado for gerado com fidelidade factual.

### 2.13. EVIDENCE_IS_NOT_REQUIREMENT
Registros de auditoria, tempos medidos de execucao e logs de preflight sao evidencias empiricas daquele ambiente e momento, nao devendo ser tratados como requisitos funcionais normativos ou SLAs rigidos de produto.

### 2.14. LOCAL_PATCH_PROVENANCE
Toda modificacao de codigo ou documento deve ter sua autoria, escopo e justificativa devidamente rastreados.

### 2.15. LATEST_REGRESSION_WINS
Se um teste ou verificacao subsequente falhar, essa falha anula qualquer status anterior de sucesso e impede o avanco do ciclo.

### 2.16. PERFORMANCE_EVIDENCE_IS_NOT_SLA
Métricas observadas durante validacoes tecnicas locais nao constituem SLA de producao definitivo sem a devida homologacao nos gates especificos de benchmark.

### 2.17. NO_FALSE_EMPTY
Respostas e declaracoes de status nunca devem omitir informacoes ou reportar falsos vazios quando dados ou erros existirem.

### 2.18. ACTIVE_GENERATION_SAFETY
Antes de gerar ou sobrescrever arquivos criticos, o agente deve validar se ha colisoes ou perda de informacao legitima.

### 2.19. ONE_GATE_AT_A_TIME
O agente foca exclusivamente no Gate ativo. E terminantemente proibido iniciar a implementacao do Gate subsequente antes da homologacao e emissao formal do novo Gate pelo Chat Mestre (`NEXT_GATE_STARTED=NAO`).
