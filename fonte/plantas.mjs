// Geradores de ilustração botânica em SVG (decorativos, determinísticos por seed).
export function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const f=n=>Math.round(n*10)/10;
const rad=d=>d*Math.PI/180;

export const PAL={
  escuro:{folhas:['#13291C','#173222','#1B3A28','#122418'],veia:null,vaso:'#1A2A20',vaso2:'#16231B'},
  vivo:{folhas:['#2F6B45','#3F7D4E','#58995B','#7DB36A','#2A5C3D'],veia:'#E6F0C8',vaso:'#B8623E',vaso2:'#9C4F31'},
  sala:{folhas:['#2E6A44','#3C7C4D','#4F9158','#6FA864','#285A3A'],veia:'#DDEBC0',vaso:'#B8623E',vaso2:'#9A4E30'},
};

function folha(len,w,fill,veia){
  let s=`<path d="M0 0C${f(w)} ${f(-len*.25)} ${f(w*.9)} ${f(-len*.8)} 0 ${f(-len)}C${f(-w*.9)} ${f(-len*.8)} ${f(-w)} ${f(-len*.25)} 0 0Z" fill="${fill}"/>`;
  if(veia) s+=`<path d="M0 -2L0 ${f(-len*.9)}" stroke="${veia}" stroke-width="${f(Math.max(.8,w*.05))}" fill="none" opacity=".5" stroke-linecap="round"/>`;
  return s;
}

// fronde arqueada: base em (0,0), apontando para cima e curvando para `lado`
function fronde(len,lado,pal,r,opts={}){
  const n=opts.n||14, curva=opts.curva??.55;
  const P1=[lado*len*curva,-len*.62], C=[lado*len*.12,-len*.78];
  const pt=t=>[(1-t)*(1-t)*0+2*(1-t)*t*C[0]+t*t*P1[0],(1-t)*(1-t)*0+2*(1-t)*t*C[1]+t*t*P1[1]];
  const tg=t=>{const dx=2*(1-t)*(C[0])+2*t*(P1[0]-C[0]);const dy=2*(1-t)*(C[1])+2*t*(P1[1]-C[1]);return Math.atan2(dy,dx)*180/Math.PI;};
  let s=`<path d="M0 0Q${f(C[0])} ${f(C[1])} ${f(P1[0])} ${f(P1[1])}" stroke="${pal.folhas[4%pal.folhas.length]}" stroke-width="${f(len*.012+1.2)}" fill="none" stroke-linecap="round"/>`;
  for(let i=1;i<=n;i++){
    const t=.1+.9*i/n;
    const [x,y]=pt(t), th=tg(t);
    const L=len*.22*(Math.sin(Math.PI*Math.min(1,t*.95+.03))*.75+.25)*(.9+r()*.2);
    const W=L*.26;
    for(const sg of [-1,1]){
      const a=th+sg*(58+r()*10)+90;
      s+=`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${folha(L,W,pal.folhas[Math.floor(r()*pal.folhas.length)],null)}</g>`;
    }
  }
  const [ex,ey]=P1, ea=tg(1)+90;
  s+=`<g transform="translate(${f(ex)} ${f(ey)}) rotate(${f(ea)})">${folha(len*.12,len*.03,pal.folhas[1],null)}</g>`;
  return s;
}

function rosetaFolhas(n,len,w,pal,r,abre){
  let s='';
  for(let i=0;i<n;i++){
    const t=n===1?0:i/(n-1)*2-1;
    const a=t*abre+(r()-.5)*8;
    const L=len*(.7+.3*(1-Math.abs(t)))*(.92+r()*.16);
    s+=`<g transform="rotate(${f(a)})">${bal(folha(L,w*(.85+r()*.3),pal.folhas[Math.floor(r()*pal.folhas.length)],pal.veia),r,1.4)}</g>`;
  }
  return s;
}

function vaso(w,h,pal,x=0,y=0){
  return `<g transform="translate(${x} ${y})"><path d="M${f(-w*.5)} 0H${f(w*.5)}L${f(w*.38)} ${f(h)}Q${f(w*.37)} ${f(h*1.06)} ${f(w*.3)} ${f(h*1.06)}H${f(-w*.3)}Q${f(-w*.37)} ${f(h*1.06)} ${f(-w*.38)} ${f(h)}Z" fill="${pal.vaso}"/><rect x="${f(-w*.55)}" y="${f(-h*.12)}" width="${f(w*1.1)}" height="${f(h*.22)}" rx="${f(h*.06)}" fill="${pal.vaso2}"/></g>`;
}

const bal=(inner,r,g=1.6,ox=0,oy=0)=>`<g class="bal" style="--t:${f(5+r()*4)}s;--d:-${f(r()*6)}s;--g:${f(g*(.7+r()*.6))}deg;transform-origin:${ox}px ${oy}px">${inner}</g>`;
const svg=(vb,corpo,cls='')=>`<svg class="${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${corpo}</svg>`;

export function folhagem(seed,pal=PAL.sala,cls=''){
  const r=rng(seed); let s='';
  s+=rosetaFolhas(11,300,64,pal,r,64);
  s+=vaso(170,120,pal);
  return svg('-300 -320 600 460',s,cls);
}
export function palma(seed,pal=PAL.sala,cls=''){
  const r=rng(seed); let s='';
  const ang=[-52,-30,-12,6,24,44,-40,36];
  ang.forEach((a,i)=>{ s+=`<g transform="rotate(${a})">${bal(fronde(250+r()*70,a<0?-1:1,pal,r,{n:13}),r,1.8)}</g>`; });
  s+=vaso(150,110,pal);
  return svg('-330 -320 660 440',s,cls);
}
export function suculenta(seed,pal=PAL.sala,cls=''){
  const r=rng(seed); let s='';
  s+=rosetaFolhas(15,78,22,pal,r,88);
  s+=vaso(96,66,pal);
  return svg('-110 -90 220 170',s,cls);
}
export function trio(seed,pal=PAL.sala,cls=''){
  const r=rng(seed); let s='';
  s+=`<g transform="translate(-130 0)">${rosetaFolhas(9,120,34,pal,r,60)}${vaso(100,76,pal)}</g>`;
  s+=`<g transform="translate(120 0)">${rosetaFolhas(9,100,30,pal,r,64)}${vaso(92,70,pal)}</g>`;
  s+=`<g transform="translate(0 0)">${rosetaFolhas(13,150,40,pal,r,66)}${vaso(124,92,pal)}</g>`;
  return svg('-250 -170 500 280',s,cls);
}
// trepadeira que cai (vaso suspenso)
export function pendente(seed,pal=PAL.sala,cls=''){
  const r=rng(seed); let s='';
  s+=`<path d="M-50 -2L0 -60M50 -2L0 -60" stroke="#6B4A33" stroke-width="2" fill="none"/>`;
  s+=`<path d="M-62 0H62C58 40 30 58 0 58S-58 40-62 0Z" fill="${pal.vaso}"/><rect x="-70" y="-8" width="140" height="16" rx="6" fill="${pal.vaso2}"/>`;
  const fios=[[-40,380],[-12,300],[22,430],[48,330],[0,230]];
  fios.forEach(([x0,L],k)=>{
    const sw=(r()-.5)*70;
    let fio='';
    fio+=`<path d="M${x0} 8C${x0+sw} ${L*.35} ${x0-sw} ${L*.7} ${x0+sw*.4} ${L}" stroke="#2A5C3D" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    for(let i=1;i<=9;i++){
      const t=i/9.4, y=8+(L-8)*(3*(1-t)*(1-t)*t*.35+3*(1-t)*t*t*.7+t*t*t);
      const u=1-t, x=u*u*u*x0+3*u*u*t*(x0+sw)+3*u*t*t*(x0-sw)+t*t*t*(x0+sw*.4);
      const lado=i%2?1:-1;
      fio+=`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(lado*(105+r()*20))})">${folha(34+r()*16,15,pal.folhas[Math.floor(r()*pal.folhas.length)],pal.veia)}</g>`;
    }
    s+=bal(fio,r,2.4,x0,8);
  });
  return svg('-160 -70 320 520',s,cls);
}
// trepadeira de parede (cai do alto, ondulando)
export function trepadeira(seed,pal=PAL.sala,cls=''){
  const r=rng(seed); let s='';
  const L=560;
  s+=`<path d="M40 0C90 ${L*.2} -10 ${L*.45} 60 ${L*.7}S30 ${L*.92} 50 ${L}" stroke="#2A5C3D" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  for(let i=1;i<=18;i++){
    const t=i/18.5, y=L*t;
    const x=50+Math.sin(t*6.5)*38;
    const lado=i%2?1:-1;
    s+=`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(lado*(70+r()*40))})">${folha(44+r()*22,19,pal.folhas[Math.floor(r()*pal.folhas.length)],pal.veia)}</g>`;
  }
  return svg('-30 -10 180 600',s,cls);
}

const FL=['#E9B9A6','#F4E8D0','#C9704D','#EFD3C4','#F7F0E2'];
function flor(x,y,tam,cor,r){
  let s=`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r()*72)})">`;
  const n=8;
  for(let i=0;i<n;i++) s+=`<ellipse cx="0" cy="${f(-tam*.55)}" rx="${f(tam*.3)}" ry="${f(tam*.55)}" fill="${cor}" transform="rotate(${i*360/n})" opacity=".96"/>`;
  s+=`<circle r="${f(tam*.22)}" fill="#8A5A3C"/><circle r="${f(tam*.1)}" fill="#E8B866"/></g>`;
  return s;
}
export function flores(seed,pal=PAL.sala,cls=''){
  const r=rng(seed); let s='';
  const hastes=[[-120,-250,.8],[-70,-310,1],[-20,-270,.9],[30,-320,1.05],[85,-265,.85],[130,-215,.75],[-150,-175,.7],[0,-215,.8]];
  hastes.forEach(([x,y,t],i)=>{
    let h=`<path d="M0 -10Q${f(x*.3)} ${f(y*.5)} ${f(x)} ${f(y)}" stroke="#2F6B45" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    h+=`<g transform="translate(${f(x*.55)} ${f(y*.6)}) rotate(${f(x>0?55:-55)})">${folha(46,16,pal.folhas[Math.floor(r()*pal.folhas.length)],pal.veia)}</g>`;
    h+=flor(x,y,46+i%3*8,FL[i%FL.length],r);
    s+=bal(h,r,1.5,0,-10);
  });
  // vaso cerâmico creme
  s+=`<path d="M-62 0Q-84 60 -50 118H50Q84 60 62 0Z" fill="#E9DFC9"/><rect x="-68" y="-8" width="136" height="16" rx="7" fill="#D6C8AA"/>`;
  return svg('-200 -380 400 520',s,cls);
}

// canto de selva para a abertura. lado=+1 canto esquerdo, -1 canto direito
export function canto(seed,pal,lado,cls=''){
  const r=rng(seed); let s='';
  const X=lado>0?0:700, sg=lado;
  const mir=(g)=>lado>0?g:`<g transform="translate(700 0) scale(-1 1)">${g}</g>`;
  let g='';
  // folhas ovais grandes na base
  [[8,430,100],[26,520,118],[44,470,108],[62,400,96],[-6,380,90]].forEach(([a,L,w])=>{
    g+=`<g transform="translate(20 930) rotate(${a})">${folha(L,w,pal.folhas[Math.floor(r()*pal.folhas.length)],pal.veia)}</g>`;
  });
  // frondes
  [[-14,560],[4,620],[22,540],[40,590],[58,500],[74,470]].forEach(([a,L])=>{
    g+=`<g transform="translate(10 930) rotate(${a})">${fronde(L,1,pal,r,{n:16})}</g>`;
  });
  // frondes caindo do canto superior
  let alto='';
  [[168,380],[150,460],[132,330],[186,300]].forEach(([a,L])=>{
    alto+=`<g transform="translate(30 -30) rotate(${a})">${fronde(L,-1,pal,r,{n:13})}</g>`;
  });
  g+=`<g class="pendurado">${alto}</g>`;
  s=mir(g);
  return svg('0 0 700 900',s,cls);
}
