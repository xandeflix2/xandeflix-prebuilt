# C98 — Limpeza seletiva de tmp concluída — 2026-10-13

Pedido explícito de sanitizar/remover temporários desnecessários. Escopo prévio:
[contrato](../architecture/C11_TEMP_ARTIFACT_CLEANUP.md). Preflight no workspace
ativo, main/origin canônicos; HEAD61ec00902be5d0037adf79c68b3a8624b3a2bd6e.
C97 concluído antes deste ciclo; nenhuma antecipação de Gate.

## Inventário, retenção e remoção

Identificados163 diretórios de perfil Chrome/headless/QA efêmeros de testes,
sem processo ativo, arquivo versionado, APK ou reparse point. Manifesto privado
em tmp/c98-temp-cleanup/cleanup-manifest.json. Antes de cada remoção, PowerShell
resolveu caminho absoluto, confirmou descendência de tmp, padrão permitido,
ausência de links/arquivos protegidos e uso por processos. Remove-Item -LiteralPath
executado somente nos163 diretórios do manifesto; zero falhas, nenhum restante.

- Removidos68906 arquivos de perfis descartáveis.
- Liberados4803565330 bytes (4.47 GiB, aproximadamente4.47 GB no painel Windows).
- Medição posterior4086061675 bytes,23392 arquivos,5903 diretórios em tmp,
  aproximadamente3.81 GiB. Inventário inicial aproximado8.27 GiB.
- Todos23384 arquivos preservados fora dos perfis/ciclo privado conferidos por
  SHA-256 e tamanho, zero alterações/ausências; inclui46 arquivos APK.
- Preservados backups da migração Git (diretório3.2 bilhões de bytes), relatórios,
  scripts, baselines/provenance, snapshots, dados do tablet e estado do control plane.

Não houve limpeza da pasta inteira, rotação de credenciais, exclusão de fontes,
instalação/build, backend ou Git. Não se afirma sanitização geral de segredos;
limpeza significa remoção de caches comprovadamente descartáveis.

## Verificação

verification.json=PASS; active-profiles.json vazio; cleanup-result.json sem falhas.
HTMLlocalhost200/130ms e módulo Manager200/30ms depois da limpeza; servidor normal
mantido na3000. C97 watcher ignora tmp para impedir nova sobrecarga; HMR de src
permanece. Renderização/login físico continua limitado à indisponibilidade de CUA.
Hashes e inventários completos privados, sem conteúdo de credenciais nos relatórios.

CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO; sem commit/push/PR.
