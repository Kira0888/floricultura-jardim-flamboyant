import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as P from './plantas.mjs';
// Gera o index.html a partir de fonte/template.html (ilustrações SVG + links do WhatsApp).
// Uso: npm run gerar   (ou: node fonte/gerar.mjs index.html)
const [,, dest = 'index.html'] = process.argv;
const raiz = fileURLToPath(new URL('.', import.meta.url));
let html = fs.readFileSync(raiz+'template.html','utf8');
const num='5561994476001';
const msg=(t)=>`https://wa.me/${num}?text=${encodeURIComponent(t)}`;
html=html.replaceAll('{{WA_ORCAMENTO}}',msg('Olá! Quero transformar meu espaço com paisagismo. Posso enviar fotos para um orçamento?'))
         .replaceAll('{{WA_PRESENTE}}',msg('Olá! Gostaria de pedir um arranjo floral para presente. Pode me ajudar a escolher?'));

const sala=`<svg class="sala" viewBox="0 0 600 760" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<defs><linearGradient id="teto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".16"/><stop offset=".35" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
<rect width="600" height="620" fill="#BEBCB3"/><rect width="600" height="620" fill="url(#teto)"/>
<rect y="620" width="600" height="140" fill="#8E8C84"/>
<g stroke="#7E7C74" stroke-width="2" opacity=".7"><path d="M0 660H600M0 705H600M150 620L110 760M300 620V760M450 620L490 760"/></g>
<rect y="604" width="600" height="16" fill="#A7A59D"/>
<rect x="344" y="74" width="222" height="324" fill="#D9D7CE"/><rect x="354" y="84" width="202" height="304" fill="#F4F7F6"/>
<path d="M455 84V388M354 236H556" stroke="#D9D7CE" stroke-width="8"/>
<rect x="340" y="392" width="230" height="12" fill="#B4B2A9"/>
<rect x="236" y="520" width="112" height="12" rx="2" fill="#6E6B62"/><path d="M248 532V620M336 532V620" stroke="#6E6B62" stroke-width="8"/>
<path d="M60 676L540 676L580 740L20 740Z" fill="#A19F97" opacity=".8"/>
</svg>`;
const croqui=`<svg class="croqui" viewBox="0 0 600 760" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
<g fill="none" stroke="#1A1812" stroke-width="2.4" stroke-dasharray="7 7" stroke-linecap="round" opacity=".7">
<ellipse cx="130" cy="690" rx="120" ry="30"/><ellipse cx="470" cy="700" rx="120" ry="30"/><ellipse cx="292" cy="522" rx="46" ry="12"/>
<circle cx="420" cy="48" r="26"/><path d="M420 74V150"/><path d="M52 6C100 110 20 200 80 330"/>
<ellipse cx="292" cy="700" rx="64" ry="20"/></g>
<g stroke="#1A1812" stroke-width="2.4" opacity=".7" stroke-linecap="round"><path d="M130 680V700M120 690H140M470 690V710M460 700H480M292 692V708M284 700H300"/></g>
</svg>`;
html=html.replace('{{sala}}',sala).replace('{{croqui}}',croqui);
html=html.replace(/\{\{(\w+)((?:\|[^}|]+)*)\}\}/g,(m,fn,resto)=>{
  const o={}; resto.split('|').filter(Boolean).forEach(kv=>{const i=kv.indexOf('=');o[kv.slice(0,i)]=kv.slice(i+1)});
  const seed=+o.seed||1, cls=o.cls||'', pal=P.PAL[o.pal]||P.PAL.sala;
  if(fn==='canto') return P.canto(seed,pal,+o.lado,cls);
  if(fn==='motas'){const r=P.rng(seed);let s='';for(let i=0;i<(+o.n||12);i++){s+=`<i style="--x:${Math.round(r()*96)}%;--y:${Math.round(30+r()*65)}%;--s:${(2+r()*3.2).toFixed(1)}px;--t:${(7+r()*7).toFixed(1)}s;--d:-${(r()*12).toFixed(1)}s;--dx:${Math.round((r()-.5)*50)}px"></i>`}return `<div class="motas ${cls}" aria-hidden="true">${s}</div>`}
  if(!P[fn]) throw new Error('sem gerador '+fn);
  return P[fn](seed,P.PAL.sala,cls);
});
fs.writeFileSync(dest,html);
console.log('ok',(html.length/1024).toFixed(0)+' KB');
