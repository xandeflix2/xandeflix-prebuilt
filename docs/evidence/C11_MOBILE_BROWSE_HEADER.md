# C117 — hero logo abaixo do Header mobile — 2026-10-15

Spec anterior ao CSS: docs/architecture/C11_MOBILE_BROWSE_HEADER.md.
Preflight: clone C11-main ativo independente/main/origin canônicos,
HEAD0f68f169f7728fae17c8311832b7643629e97a02. AGENTS/Architecture/Execution/
Activation Lock lidos; baseline privado1.036 arquivos em
tmp/c117-mobile-browse-header/baseline.json. CURRENT_GATE=NONE;
NEXT_GATE_STARTED=NAO. C107–C116 preservados; sem Git/install/backend/reset.

Única mudança de produção: cinco linhas CSS em src/index.css, até600px,
ocultando .page-header direto de .movies-page/.series-page, exceto categoria
ausente. Retira heading, quantitativo e espaço antes do hero; mantém Header
marca/Home/Voltar/Configurações, transparência C116, dimensões do hero,
metadados/ações/navegação/menu inferior. Sem alteração TSX/JS/contagens reais,
fonte, catálogo, search, ativação ou player.

Inspeção isolada PASS com Header/CSS reais e marcação browse sintética:
Filmes e Séries em320/390/430/600px sem heading/count/espaço reservado;
hero mantém altura e margem normal de12–24px para o Header; geometria do
Header, cliques de Configurações/Voltar e ausência de overflow preservados.
Aviso de categoria ausente e heading da Busca continuam visíveis; desktop,
tablet/Fire/quadrado com métricas idênticas antes/depois. Screenshots das duas
páginas inspecionados, sem backend/fonte/rede ou novos testes permanentes.
Artefatos privados inspection.json e movies-after/series-after.png no tmp C117.

TypeScript/Vite, lock26+27+9 prebuild/final, cap sync/Gradle,7 assets iguais
ao dist, assinatura/package/versão PASS. Sem falhas novas; avisos prévios
Vite/flatDir permanecem. Auditoria incremental: tmp C117/audit.json.

APK local tmp/c117-mobile-browse-header/Xandeflix-v1.0.19-C117.apk,
com.xandeflix.prebuilt, code19/name1.0.19, min23/target35,11.447.969 bytes.
SHA256f13d0004e1b98bfdac7dbf9fb1804bf249bc71adb6953b2a7286750aed0256e6.
Produção HTTPS/sem dev server, mesmo certificado C116 e APK C116 intacto.
Sem instalação/publicação/Git/backend/reset/novo Gate. QA física pendente;
fixture visual não representa catálogo nem hardware real.
