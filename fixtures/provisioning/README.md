# Fixtures de Provisionamento (G4)

Este diretório documenta a política e os artefatos de teste para o módulo de provisionamento (`src/provisioning/`).

## Diretrizes de Integridade e Isolamento

1. **SOMENTE DADOS SINTÉTICOS**: Nenhuma credencial real, token de autenticação, URL privada ou payload de catálogo real é permitido neste diretório.
2. **NÃO VERSIONAMENTO DE PACOTES GERADOS**: Pacotes ZIP gerados em tempo de build/teste residem estritamente no diretório temporário `tmp/provisioning/`, ignorado pelo controle de versão (`.gitignore`).
3. **TESTES NEGATIVOS IN-MEMORY**: Os testes de corrupção, adulteração de hash, path traversal e rejeição de arquivos não autorizados são gerados programaticamente em memória a partir de fixtures controladas e inspecionados pelo validador.
4. **CATÁLOGO CANÔNICO DE ENTRADA**: Os testes utilizam o catálogo canônico sintético gerado pelo pipeline G3 (`npm run ingestion:synthetic`), assegurando total rastreabilidade com o Data Contract v1 do G2.
