# Conferencia web local e na rede

O modo web e explicito: `npm run dev` (desenvolvimento) ou `npm run web:build`.
O build Android/padrao continua usando seus plugins nativos. O indicador
"Conferencia web" identifica este modo e oferece diagnostico sem senhas/URLs.

## Neste computador

Para continuar com a fonte real ja vinculada, use o mesmo navegador e
`http://localhost:3000`. `Ctrl+F5` atualiza codigo/estilos sem limpar os dados.
Nao limpe IndexedDB, armazenamento ou identidade para atualizar a interface.

Para servir o build estatico, sem servidor de desenvolvimento:

```powershell
npm run web:build
npm run web:start
```

O estatico local usa `http://localhost:3001`. Cada origin (protocolo, host e
porta) possui seu proprio armazenamento/identidade e precisa de ativacao
legitima. A autorizacao de localhost:3000 nao e copiada para3001 ou para LAN.

## Rede local com HTTPS

```powershell
npm run web:build
npm run web:start -- -Lan
```

O script imprime os enderecos HTTPS da rede, porta3443. Serve somente os
arquivos do build: sem API administrativa mock, proxy de midia ou source tree.
Nenhuma regra publica de firewall ou hospedagem foi criada automaticamente.

O certificado local fica em
`%LOCALAPPDATA%\XandeflixPrebuilt\web-local\web-local.cer`. A chave privada e
seu segredo protegido por DPAPI ficam na mesma pasta, fora do repositorio.
Compartilhe somente o `.cer` publico com os clientes da rede.

O certificado precisa ser confiavel no navegador/dispositivo cliente para
WebCrypto/PIN funcionarem. Confira a impressao digital exibida pelo script e
instale o certificado publico pelo procedimento de confianca do proprio
dispositivo, se decidir confiar nesse computador. O script nao instala raiz
de confianca nem ignora avisos de seguranca. Nao usar flags que desabilitam
CORS/HTTPS. Se a rede/IP mudar ou o certificado vencer, revisar seus SANs e
configuracao; o script nao substitui uma identidade/certificado existente.

## Funcionalidades e limites

| Recurso | Conferencia web |
| --- | --- |
| Ativacao/fonte | Fluxo real, mesma autoridade e vinculo desse origin |
| Catalogo/busca/atualizacao | Leitores e coordenador existentes; arquivos locais via IndexedDB |
| Favoritos/controle parental | Locais; PIN/PUK/regras nao enviados ao gestor |
| Filmes/episodios/canais | HTML5 direto na fonte; MP4, HLS, MPEG-TS conforme codecs e CORS |
| Controles de filme/serie | Voltar, bloquear, pausa, saltos10s, progresso, volume, ajustar/preencher, velocidade, episodios |
| Audio/legendas VOD | Somente trilhas expostas pelo transporte/browser; painel informa quando nao disponiveis |
| Live | Previa sem menu; controles/categorias/canais/guia/favorito em tela cheia |
| Hero desktop | Margens pequenas, imagem preenchida (cover), altura que revela parte da primeira fileira; troca10s quando visivel e pronto |
| Menus/layout | Seletor de perfis existente; sidebar centralizada, sem barras visiveis |
| Cast Android, brilho do SO, PiP nativo, APK/controle fisico | Conferir no aparelho nativo |

O player inicia em **Ajustar tela** (`contain`/FIT), preservando o enquadramento.
**Preencher tela** (`cover`) e uma escolha do usuario e pode cortar bordas.
Conteudos com proporcoes diferentes podem ter faixas escuras no modo inteiro.
Sem transcodificacao, alteracao de URL autoritativa ou conexoes antecipadas.

O cofre web usa AES-GCM com chave nao exportavel em IndexedDB, para conferencia
local. Nao substitui a protecao Keystore do Android. CORS, HTTPS e codecs da
fonte precisam permitir a reproducao no navegador; nao sao contornados.

Rotacao respeita pagina oculta, Hero fora da tela, gesto ativo, reproducao e
carregamento. No web, a troca10s explicitamente solicitada continua com
movimento reduzido, sem animacao de transicao nessa preferencia. Repousar mouse
ou foco sobre o Hero nao o pausa indefinidamente. Espaco no campo de busca e texto;
Enter e ativacao dos botoes continuam com o comportamento existente.

Previa Live desktop ocupa no maximo metade da altura da janela mais50px (teto570px)
para deixar mais EPG visivel. Video conserva enquadramento; fullscreen intocado.
