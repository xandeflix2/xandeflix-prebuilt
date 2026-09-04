# Product Requirements Document (PRD) — Xandeflix Prebuilt

---

## 1. Visao Geral e Contexto

O **Xandeflix Prebuilt** e um produto experimental e independente de engenharia de software. Ele foi concebido para testar uma hipotese arquitetural alternativa a abordagens puramente locais de ingestao de catalogos volumosos de midia em dispositivos clientes.

Em dispositivos de entrada (ex: aparelhos com 1GB a 2GB de RAM, processadores quad-core de baixa frequencia ou processamento I/O restrito), o download bruto e parsing de dezenas de milhares de registros no proprio cliente frequentemente geram travamentos, estresse de memoria, consumo excessivo de bateria e longos periodos de espera no primeiro uso (bootstrap).

---

## 2. Objetivo Central

Validar experimentalmente e mensurar com rigor tecnico se o modelo de:
- **Pre-processamento externo de dados (External Preprocessing)**, combinado com
- **Runtime e busca locais no cliente (Device Local Runtime & Search)**

consegue alcancar uma reducao expressiva no tempo de primeiro carregamento e no consumo de memoria RAM/CPU do dispositivo, mantendo a autonomia operacional e a privacidade da reproducao local direta.

---

## 3. Modelo de Distribuicao Alvo

O ecossistema divide-se em duas camadas:

1. **UNIVERSAL_APK**:
   - Um aplicativo Android generico, compilado sem credenciais de fontes ou bancos de dados embutidos.
   - Fornece a interface visual, mecanismo de importacao de pacote, runtime local do catalogo, engine de busca e player nativo.
2. **USER_OR_SOURCE_SPECIFIC_PROVISIONING_PACKAGE**:
   - Pacote de dados gerado externamente por um pipeline de ingestao e normalizacao.
   - Contem os metadados do catalogo previamente parseados, categorizados e indexados, prontos para consumo instantaneo pelo cliente.

---

## 4. Modelo de Playback Alvo

- `DEVICE_DIRECT_PLAYBACK`: O aplicativo cliente efetua a reproducao conectando-se diretamente ao endpoint de origem autorizado fornecido pela fonte. Nenhum fluxo de video passa por servidores intermediarios do projeto.

---

## 5. Comparabilidade com Projetos Anteriores

Este projeto **nao** e declarado a priori superior nem substituto do projeto de referencia `Xandeflix 2.0`. Trata-se de uma linha experimental com tradeoffs distintos (dependencia de pipeline externo vs total autonomia de ingestao no dispositivo). A determinacao de sua viabilidade e eficacia dependera exclusivamente dos benchmarks empiricos e testes comparativos a serem conduzidos no Gate final (`G12_MVP_ACCEPTANCE`).
