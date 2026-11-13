// Gera o index.html a partir de fonte/template.html (resolve os links do WhatsApp).
// Uso: npm run gerar   (ou: node fonte/gerar.mjs index.html)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const [,, dest = 'index.html'] = process.argv;
const raiz = fileURLToPath(new URL('.', import.meta.url));
let html = fs.readFileSync(raiz + 'template.html', 'utf8');

// WhatsApp oficial (único ponto de edição). Formato: 55 + DDD + número.
const NUMERO = '5561994476001';
const msg = (t) => `https://wa.me/${NUMERO}?text=${encodeURIComponent(t)}`;
html = html
  .replaceAll('{{WA_PROJETO}}', msg('Olá! Gostaria de solicitar um projeto de paisagismo para o meu imóvel. Posso enviar fotos do espaço?'))
  .replaceAll('{{WA_VISITA}}', msg('Olá! Gostaria de agendar uma visita técnica para um projeto de paisagismo.'));

if (/\{\{|\}\}/.test(html)) throw new Error('placeholder não resolvido no template');
fs.writeFileSync(dest, html);
console.log('ok', (html.length / 1024).toFixed(0) + ' KB');
