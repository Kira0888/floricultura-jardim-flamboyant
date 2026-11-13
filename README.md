# Floricultura do Jardim Flamboyant · ECM Gardens Flowers

Landing page estática (HTML + CSS + JS, sem dependências) com rolagem interativa. Luziânia – GO.

## Comandos

```bash
npm start          # pré-visualização em http://localhost:4600 (pasta do projeto)
npm run build      # valida e gera dist/ (o que vai ao ar)
npm run preview    # serve dist/ para conferir o resultado do build
npm run gerar      # recria index.html a partir de fonte/ (ilustrações + links)
```

## Estrutura

| Caminho | O que é |
|---|---|
| `index.html` | A página (gerada por `npm run gerar`; as ilustrações SVG ficam embutidas) |
| `site.css` | Identidade visual, layout e animações da página |
| `luz.js` | Vídeo da abertura (toca só na tela), pausa das animações fora da tela, teclado no trilho |
| `etapas.js` | Cena 3: os 4 passos avançam sozinhos por tempo, com pausa e navegação por segmentos |
| `sites-incriveis.js` / `.css` | Motor de rolagem (`data-fx-*`). Não editar |
| `fontes.css`, `fonts/` | Fontes hospedadas junto do site: Instrument Serif (títulos) e Jost (textos) |
| `fotos/` | Fotos reais (WebP) e o quadro de reserva do vídeo (`hero-poster.webp`) |
| `video/` | Vídeo da abertura, um buquê de rosas (`hero.mp4` H.264 e `hero.webm` VP9), sem áudio, loop de 8,5 s |
| `fonte/` | Gerador do HTML: `template.html` (texto e estrutura), `plantas.mjs` (ilustrações), `gerar.mjs` |
| `scripts/build.mjs` | Validação + cópia para `dist/` |
| `vercel.json` | Build, pasta de saída e cabeçalhos de cache/segurança |
| `BRIEF.md` | Notas do projeto (não vai ao ar) |

## Editar textos e contatos

Os textos ficam em `fonte/template.html`. Depois de editar, rode `npm run gerar` e `npm run build`.
O número do WhatsApp e as mensagens pré-preenchidas ficam em `fonte/gerar.mjs`.
O `npm run build` falha se o WhatsApp não for o número oficial, se faltar a mensagem de envio de fotos
ou se o link do Instagram sumir.

## Deploy

A Vercel roda `npm run build` e publica `dist/`. Cada push na branch `main` gera um novo deploy de produção.

## Fotos

Para trocar ou acrescentar fotos, coloque os arquivos `.webp` em `fotos/` e atualize `fonte/template.html`.
Prefira fotos originais (largura mínima de ~800 px). Evite nomes de clientes visíveis nas imagens.

## Acessibilidade e movimento

Com `prefers-reduced-motion: reduce` o motor desliga as cenas fixas e todas as animações: a página
fica parada, completa e legível, na ordem do conteúdo.

## Vídeo da abertura

`video/hero.mp4` e `video/hero.webm` foram gerados a partir do vídeo original com ffmpeg:
sem áudio, 1280×720, 24 fps, com dissolução de 1,5 s entre o fim e o começo para o loop não dar salto.
Para trocar o vídeo, mantenha o mesmo nome dos arquivos (ou ajuste o `<video>` em `fonte/template.html`)
e mire em menos de ~3 MB (o atual tem 1,2 MB em MP4). Com movimento reduzido o vídeo não toca: aparece só o quadro de reserva.

## Tempo dos passos (cena 3)

Cada passo dura 6 s (`--tempo` em `.seg.ativo i`, no `site.css`). Para mudar, altere essa variável.

## Desempenho (sem alterar o visual)

Medido com rolagem completa, CPU 4×/6× mais lenta e GPU real; a página pós-otimização tem a mesma geometria
(altura total e posição de cada elemento idênticas) e é idêntica pixel a pixel nas cenas fixas.

- **Motor de rolagem** (`sites-incriveis.js`, cópia otimizada; autoria mantida): mede a geometria das cenas e da
  paralaxe em lote (início, redimensionamento, mudança de altura da página) e não a cada quadro, então a rolagem
  não faz nenhuma leitura de layout. Cena que não mudou de progresso não reescreve estilo.
- **Animações** (`luz.js`): cada ilustração só anima enquanto está à vista (antes, a seção inteira). A pausa usa a
  API de Animações, sem classes em ancestrais (que reavaliavam o estilo de milhares de nós SVG).
- **Qualidade adaptativa** (`luz.js`): o balanço por folha repinta SVG na thread principal. Se o aparelho ficar
  abaixo de ~50 fps por ~1,5 s com ilustrações animadas na tela, o balanço por folha é desligado (a ilustração fica
  na pose original). Aparelhos capazes nunca perdem o balanço. A decisão fica na sessão (`sessionStorage`).
- **Passos da cena 3** (`etapas.js`): sem leitura de layout; a barra reinicia sem reflow forçado e só corre com a
  cena na tela.
- **Vídeo da abertura**: o arquivo só começa a baixar depois do carregamento da página (o quadro de reserva, com
  `preload` de prioridade alta, ocupa o lugar), e não é baixado com movimento reduzido nem em conexão econômica/2G.
- **Imagens**: dimensões declaradas (sem salto de layout), `decoding="async"` e `fetchpriority="low"` abaixo da dobra.
- `--progresso` (escrita a cada quadro pelo motor) é registrada sem herança (`@property`).

O que foi testado e descartado por não dar ganho medido ou por mudar o layout: `will-change` indiscriminado (grupos
dentro de um SVG não viram camadas), `content-visibility: auto` (alterou a altura total da página) e animar as folhagens
grandes dos cantos.
