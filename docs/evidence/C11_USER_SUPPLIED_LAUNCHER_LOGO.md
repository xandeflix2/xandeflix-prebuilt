# C131 — Logo metalica no icone instalado

2026-10-16. Spec anterior aos recursos: [C11_USER_SUPPLIED_LAUNCHER_LOGO](../architecture/C11_USER_SUPPLIED_LAUNCHER_LOGO.md).
CURRENT_GATE=NONE; NEXT_GATE_STARTED=NAO. Clone independente ativo, main/origin
canonicamente preservados; HEAD 0f68f169f7728fae17c8311832b7643629e97a02.
Baseline1103 arquivos. Sem commit/push/PR, backend, instalacao ou reset.

## Imagem e alteracoes

PNG original1254x1254,1527622bytes, fornecido pelo usuario, preservado byte a
byte em assets/branding/xandeflix-user-logo.png. SHA256
6541036992545ed1563e01d47fe782eca68fdcec6b02e201438ec19ee49e924c.
Obtido somente do ultimo input_image da propria conversa. Outras imagens de
Downloads nao foram utilizadas nem modificadas. Sem geracao/redesenho por IA.

Canvas deterministico redimensionou o original completo, sem recortar o X/play:
15PNGs das cinco densidades, dois bitmaps television-xhdpi e banner320x180.
Icones quadrado/round usam84% da largura; foreground108dp tem imagem56dp,
margem transparente e fundo adaptavel preto. Wrapper drawable bitmap aponta
para mipmap foreground; adaptive v26 permanece intacto. v33 remove monochrome
antigo; mascara final/tema do launcher continuam dependentes do sistema.
Banner tem imagem156px e nome XANDEFLIX. Recursos da atividade C130 preservados.

Previews quadrada, redonda, adaptive circular/squircle e banner geradas.
Quadrada, adaptive circular e banner inspecionadas visualmente: X/play inteiros.
Pixels luminosos do foreground ficaram no raio31,185dp (limite33,6dp),
canto alpha0; 18 PNGs nativos gerados. Original preto mantido.

VersionCode21/name1.0.21. Marca do menu interno continua X vermelho simples:
pergunta posterior do usuario respondida sem ampliar o patch para a UI.
C130 anti-piscada e C129 D-pad/parental preservados, sem novo build web.

## Compilacao e verificacao

Lock inicial e pos-recursos/pre-Gradle26+27+9 PASS; lock final PASS.
Primeiro assembleDebug falhou em mergeDebugResources com erro interno do
cache incremental: In DataSet main, no data file for changedFile. Refeito
com :app:clean assembleDebug, somente saidas geradas do app; BUILD SUCCESSFUL.
Nenhuma alteracao de codigo ou relaxamento de teste para resolver a falha.
Avisos flatDir preexistentes. Nao houve cap sync nem recompilacao do dist.

APK com18PNGs byte a byte iguais aos recursos, quatro adaptive XML validos,
wrapper bitmap/fundo preto e manifest canonicamente verificados. Package
com.xandeflix.prebuilt, code21/name1.0.21, min23/target35. Assinatura igual ao
C130, HTTPS localhost/logging none/sem dev server. Oito assets dist conferidos;
dez arquivos public inteiramente identicos ao C130. Doze DEX,
8 binarios identicos ao anterior; outros
3 com disassembly de codigo/annotations
identico (dexdump -d -a -n). Classes10 difere exclusivamente nos valores
VERSION_CODE20->21 e VERSION_NAME1.0.20->1.0.21 do BuildConfig. Somente duas
linhas de cabecalho com o nome do arquivo foram removidas da comparacao.
Verificador privado inicial pressupunha11DEX binarios identicos, como no
build incremental C130; falhou apos clean. Inspecao dos quatro DEX diferentes
confirmou codigo/annotations iguais nos tres de runtime e apenas duas
constantes de versao no quarto. Criterio substituido pela comparacao integral
de disassembly, sem afrouxar teste de produto nem tocar codigo de runtime.
C130 APK preservado por SHA256. Nenhuma mudanca em runtime fonte/ativacao.

## Entrega e limites

[Xandeflix-v1.0.21-C131.apk](../../tmp/c131-user-logo/Xandeflix-v1.0.21-C131.apk)

11378734bytes; SHA256 dc71af63531da4709497f069dd5de33cccb11251c86e009f46daab5a25b9b06c.
Atualizacao manual mantendo dados, package e assinatura. Confirmacao fisica
do launcher Fire/celular pendente; inspecao de assets nao prova cache do
launcher ou ausencia de toda piscada em hardware.

Auditoria final prevista/executada em audit.json:27 existentes da allowlist
alterados, tres novos,1076 anteriores intactos; memorias append-only,
HEAD/main/origin e C130 preservados. Nenhum proximo Gate iniciado.
