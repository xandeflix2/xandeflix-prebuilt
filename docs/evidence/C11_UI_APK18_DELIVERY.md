# C96 — APK18 de UI entregue — 2026-10-12

Contrato prévio: [C11_UI_APK18_DELIVERY](../architecture/C11_UI_APK18_DELIVERY.md).
Empacotado estado atual sem patch funcional adicional. C93/C94 incluídas:
Live touch quadrado com prévia/EPG esquerda e navegação direita; hero conserva
capa/metadados sobrepostos, Assistir/Ver detalhes, indicadores compactos,
swipe e rotação10s. Modelo de metadados fora da capa não incluído.

Arquivo privado: tmp/c96-ui-apk18/Xandeflix-v1.0.18-ui.apk.
Package com.xandeflix.prebuilt, versionCode18, versionName1.0.18;
11086375bytes, SHA256
5bb8c0273f58cc9bf800367658d08ec5c7de31ad3eed50b63a74e8a85c8c506e.
Signer SHA256 b235c7117c9660e17cf0732cd6493600a812692af289e627454988ea096e848d,
igual ao APK17; assinatura verificada. Sete assets do APK iguais byte a byte ao
dist; bundle index-BPjJD7RA.js. Updater nativo incluído e seis testes JVM PASS.
APK14/16/17 preservados por SHA256; metadata e dados-publicacao.txt gerados.

Validações: build web VITE_DEBUG_BUILD=false/prebuild lock PASS; bridge de debug
do gestor ausente; Capcopy/assemble PASS; lock final PASS; Home/Browse/ação
direta/swipe/artwork/D-pad/classificação square18 casos PASS. Browser C94
12 casos e timer10s real já validados no mesmo código, sem patch posterior.
APK18 não instalado; homologação física de UI será feita pelo usuário.

Auditoria de arquivos/HEAD preservada, git diff --check padrão PASS sem saída.
Uma verificação com core.autocrlf=false marcou CRLF cumulativos como whitespace;
essa alteração de interpretação foi descartada, sem normalizar arquivos.
Warnings existentes de tamanho de bundle/externalização permanecem, não houve
nova refatoração. Sem Git/backend/upload/publicação/instalação.

Usuário reportou BAND NEWS SD funcionando; outros problemas da fonte ficam
adiados por pedido explícito. Esse relato não certifica todos os canais ou VOD.
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO.
