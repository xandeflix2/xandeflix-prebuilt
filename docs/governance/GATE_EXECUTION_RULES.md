# Regras de Execucao por Gates

---

## 1. Ciclo de Vida Padronizado de um Gate

Cada Gate segue uma sequencia estrita e linear de etapas operacionais:

```
PREFLIGHT
    │
    ▼
SPEC_CONFIRMATION
    │
    ▼
ARCHITECTURE_CHECK
    │
    ▼
IMPLEMENT
    │
    ▼
AUTOMATED_GATE
    │
    ▼
PHYSICAL_GATE_WHEN_REQUIRED
    │
    ▼
CROSS_CHECK
    │
    ▼
FINAL_HANDOFF
```

---

## 2. Definicao das Etapas

1. **PREFLIGHT**: Verificacao read-only do estado do Git (remote, branch, HEAD, status), workspace e integridade do ambiente.
2. **SPEC_CONFIRMATION**: Confirmacao dos requisitos especificos, allowlist de arquivos e limitacoes contratuais do Gate ativo.
3. **ARCHITECTURE_CHECK**: Validacao de que a implementacao planejada nao viola os contratos arquiteturais (`TARGET`, `PROHIBITED`).
4. **IMPLEMENT**: Execucao cirurgica das alteracoes autorizadas (arquivos, documentacao, scripts ou codigo).
5. **AUTOMATED_GATE**: Execucao de validacoes automatizadas (linters, typecheckers, testes unitarios, auditoria de segredos).
6. **PHYSICAL_GATE_WHEN_REQUIRED**: Execucao de testes em dispositivos fisicos ou emuladores (quando o Gate exigir).
7. **CROSS_CHECK**: Reauditoria de status git, ausencia de segredos e garantia de que nenhum arquivo fora do escopo foi afetado.
8. **FINAL_HANDOFF**: Geracao do relatorio terminal estruturado para submissao formal ao Chat Mestre.

---

## 3. Divisao Rigorosa de Papeis

### Chat Mestre
- Autoriza nominalmente o Gate a ser executado;
- Audita de forma independente o relatorio do executor e as evidencias fornecidas;
- Classifica o resultado final (PASS, FAIL, HARD_STOP);
- Fecha formalmente o Gate;
- Atualiza e homologa o percentual acumulado (`MVP_PROGRESS_PERCENT`);
- Emite as diretrizes e autorizacao do Gate subsequente.

### Executor Tecnico (Antigravity)
- Executa exclusivamente o Gate que foi nominalmente autorizado;
- Respeita rigorosamente a allowlist e as restricoes operacionais;
- Coleta e apresenta evidencias rastreaveis e verificaveis;
- **Nao adjudica** PASS arquitetural definitivo nem homologa percentual de progresso;
- **Nao inicia** o Gate seguinte sob nenhuma hipotese (`NEXT_GATE_STARTED=NAO`).
