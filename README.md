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
| `luz.js` | Movimento-assinatura (a fresta de luz) e pausa das animações fora da tela |
| `sites-incriveis.js` / `.css` | Motor de rolagem (`data-fx-*`). Não editar |
| `fontes.css`, `fonts/` | Fontes hospedadas junto do site (EB Garamond, Hanken Grotesk) |
| `fotos/` | Fotos reais (WebP) |
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
