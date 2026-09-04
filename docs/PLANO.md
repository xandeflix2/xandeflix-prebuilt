# Plano de Desenvolvimento — Xandeflix Prebuilt

---

## 1. Status do Ciclo Atual

- **LAST_CLOSED_GATE**: `G0_FOUNDATION_AND_ISOLATION` (PASS)
- **CURRENT_GATE**: `G1_APP_SKELETON`
- **G1_STARTED**: `NAO`
- **NEXT_GATE_STARTED**: `NAO`

---

## 2. Roadmap Sequencial de Gates (G0 - G12)

### G0 — Foundation and Isolation (Fechado — PASS)

- Estabelecer identidade canonica do repositorio Git (`xandeflix2/xandeflix-prebuilt`);
- Garantir isolamento absoluto contra o repositorio protegido `timbocorrea/xandeflix-2.0`;
- Registrar identidade do projeto Supabase (`cujbmyhitgomlgwfkaat`);
- Registrar identificador do package Android (`com.xandeflix.prebuilt`);
- Criar baseline documental e estrutural (contratos, governanca, PRD, FSD, seguranca, plano, decisoes, status, auditorias);
- Estabelecer regras de protecao de segredos e `.gitignore` restritivo.

### G1 — App Skeleton
- Criacao da estrutura inicial de codigo do aplicativo universal;
- Setup do ambiente cliente;
- Configuracao basica de build e dependencias core sem acoplamento a dados reais.

### G2 — Prebuilt Data Contract
- Definicao formal dos schemas de dados de catalogo pre-processado;
- Especificacao do contrato de entidades: filmes, series, episodios, generos, streams e artwork.

### G3 — External Ingestion Pipeline
- Pipeline de ingestao externa de dados;
- Mecanismo de download, parsing, normalizacao e validacao estrutural dos metadados.

### G4 — Provisioning Package
- Empacotamento versionado dos dados normalizados em artefato imutavel para distribuicao;
- Geracao de checksums e integridade.

### G5 — Fast Device Bootstrap
- Mecanismo de aquisicao e importacao veloz do pacote no cliente;
- Persistencia no armazenamento local do dispositivo sem sobrecarga de CPU/RAM.

### G6 — Catalog UI
- Interface de usuario para navegacao no catalogo local;
- Listas, grids, carrosseis e telas de detalhe operando com dados cacheados localmente.

### G7 — Prebuilt Search
- Mecanismo de busca e indexacao 100% local;
- Filtragem rapida por titulo, genero e ano sem requisicoes externas de busca.

### G8 — Source and Direct Playback
- Integracao do player nativo do dispositivo diretamente com as streams da fonte autorizada;
- Player com controles essenciais e sem intermediacao de proxies de video.

### G9 — Incremental Update
- Validacao e implementacao da estrategia de atualizacao delta do catalogo (sincronizacao de novos conteudos e remocoes).

### G10 — Security and Recovery
- Endurecimento de seguranca do pacote, validacao rigorosa de integridade e rotinas de recuperacao contra dados corrompidos.

### G11 — Physical Multi-Device Testing
- Validacao e testes empiricos de desempenho em dispositivos fisicos reais com perfis variados de hardware.

### G12 — MVP Acceptance and Final Benchmark
- Benchmark comparativo final, afericao formal de hipoteses arquiteturais e fechamento do MVP.
