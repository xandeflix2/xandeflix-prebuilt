# Proveniencia, Evidencias e Estados de Artefatos

---

## 1. Referencia de Proveniencia de Governanca

- **SOURCE_PROJECT_FOR_GOVERNANCE_REFERENCE**: `Xandeflix 2.0`
- **GOVERNANCE_CONCEPTS_ADAPTED**: `SIM`
- **ORIGINAL_ARCHITECTURE_IMPORTED_AS_NORMATIVE**: `NAO`
- **COPY_VERBATIM**: `NAO`

### Racional
O projeto `Xandeflix 2.0` possui um modelo maduro e comprovado de governanca por gates e disciplina de execucao para agentes de IA. Tais conceitos foram adaptados para o `Xandeflix Prebuilt`. Todavia, a arquitetura tecnica do Xandeflix 2.0 (que impoe ingestao e parsing exclusivamente locais no dispositivo) e diametralmente oposta a tese central deste projeto experimental (`EXTERNAL_PREPROCESSING` + `DEVICE_LOCAL_RUNTIME`). Dessa forma, nenhum contrato arquitetural do projeto original foi importado de forma normativa.

---

## 2. Estados Canonicos de Artefatos e Codigo

Para garantir total clareza quanto ao nivel de maturidade e publicacao de qualquer alteracao no repositorio, adotam-se as seguintes classificacoes:

1. **REMOTE_BASELINE**: O estado formal sincronizado no branch remoto canonico (`origin/main`).
2. **LOCAL_VALIDATED_UNPUBLISHED**: Arquivos modificados ou criados localmente, que passaram nas validacoes do executor, mas ainda nao foram submetidos a commit ou push.
3. **COMMITTED_LOCAL**: Alteracoes gravadas em commits no Git local, ainda nao enviadas para o remote.
4. **PUSHED_REMOTE**: Commits enviados com sucesso para a branch remota.
5. **DRAFT_PR**: Proposta de alteracao aberta para revisao e auditoria antes da fusao.
6. **MERGED_CANON**: Codigo auditado e fundido formalmente na linha principal do repositorio.
7. **PHYSICAL_EVIDENCE**: Dados, logs e gravacoes obtidos diretamente da execucao em dispositivos fisicos ou emuladores autorizados.
8. **DOCUMENTED_HYPOTHESIS**: Suposicoes tecnicas, modelos propostos ou expectativas teoricas ainda nao validadas experimentalmente.
9. **PROVEN_FACT**: Fatos tecnicos cabalmente demonstrados por testes automatizados reproduziveis ou evidencias fisicas incontestaveis.

---

## 3. Regra de Ouro: Evidencia vs Requisito

- `EVIDENCE_IS_NOT_REQUIREMENT=SIM`: O registro de uma metrica de desempenho ou resultado observado em determinado ambiente nao torna essa metrica um requisito funcional obrigatorio nem um SLA do sistema.
- **Hipotese nao e Fato**: E expressamente vedado declarar uma `DOCUMENTED_HYPOTHESIS` como `PROVEN_FACT` antes da sua comprovacao formal no respectivo Gate.
