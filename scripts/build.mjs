#!/usr/bin/env node
/*
 * Build do site estático (sem dependências).
 *  1. valida o que importa para a conversão (WhatsApp, Instagram) e a integridade
 *     dos arquivos (referências locais, imagens com alt, CSS/JS sem erro de sintaxe);
 *  2. copia SOMENTE o que vai ao ar para dist/ (notas internas como BRIEF.md ficam de fora);
 *  3. imprime o peso de cada arquivo (bruto e gzip).
 * Sai com código 1 se algo estiver errado, o que faz o deploy da Vercel falhar cedo.
 */
import { readFileSync, existsSync, mkdirSync, cpSync, rmSync, statSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import vm from "node:vm";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");

const ARQUIVOS = ["index.html", "site.css", "luz.js", "etapas.js", "sites-incriveis.css", "sites-incriveis.js", "fontes.css"];
const PASTAS = ["fonts", "fotos", "video"];

// contatos oficiais (única fonte da verdade para a checagem)
const WHATSAPP = "5521993682078";
const INSTAGRAM = "https://www.instagram.com/ecmgardens";

const erros = [];
const avisos = [];
const ler = (f) => readFileSync(join(raiz, f), "utf8");

// ---------- 1. arquivos obrigatórios ----------
for (const f of ARQUIVOS) if (!existsSync(join(raiz, f))) erros.push(`arquivo ausente: ${f}`);
for (const p of PASTAS) if (!existsSync(join(raiz, p))) erros.push(`pasta ausente: ${p}/`);
if (erros.length) fim();

const html = ler("index.html");

// ---------- 2. HTML ----------
if (/\{\{|\}\}/.test(html)) erros.push("index.html tem placeholders não resolvidos. Rode: npm run gerar");
if (!/<html[^>]*\slang="pt-BR"/.test(html)) erros.push('falta lang="pt-BR" no <html>');
if (!/<title>[^<]{3,}<\/title>/.test(html)) erros.push("falta <title>");
if (!/<meta name="viewport"/.test(html)) erros.push("falta meta viewport");
if ((html.match(/<h1[\s>]/g) || []).length !== 1) erros.push("deve haver exatamente um <h1>");

// referências locais (src/href) precisam existir
const ehExterna = (u) => /^(https?:|mailto:|tel:|data:|#|\/\/)/.test(u);
for (const m of html.matchAll(/\s(?:src|href|poster|data-mp4|data-webm)="([^"]+)"/g)) {
  const u = m[1];
  if (ehExterna(u)) continue;
  const alvo = u.split("#")[0].split("?")[0];
  if (alvo && !existsSync(join(raiz, decodeURI(alvo)))) erros.push(`referência quebrada no HTML: ${u}`);
}

// url() do CSS
for (const css of ["site.css", "fontes.css", "sites-incriveis.css"]) {
  const src = ler(css);
  for (const m of src.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const u = m[1];
    if (ehExterna(u)) continue;
    if (!existsSync(join(raiz, u.split("?")[0]))) erros.push(`${css}: url() quebrada: ${u}`);
  }
  const abre = (src.match(/\{/g) || []).length;
  const fecha = (src.match(/\}/g) || []).length;
  if (abre !== fecha) erros.push(`${css}: chaves desbalanceadas ({=${abre} }=${fecha})`);
}

// imagens: alt, largura e altura (evita salto de layout)
for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  const tag = m[0];
  // alt vazio só é aceito em imagem decorativa dentro de um contêiner aria-hidden
  const decorativa = /\salt=""/.test(tag) && html.slice(Math.max(0, m.index - 140), m.index).includes('aria-hidden="true"');
  if (!decorativa && !/\salt="[^"]+"/.test(tag)) erros.push(`<img> sem alt: ${tag.slice(0, 80)}`);
  if (!/\swidth="\d+"/.test(tag) || !/\sheight="\d+"/.test(tag)) avisos.push(`<img> sem width/height: ${tag.slice(0, 80)}`);
}

// fotos não usadas
const usadas = new Set([...html.matchAll(/fotos\/([^"]+)"/g)].map((m) => m[1]));
for (const f of readdirSync(join(raiz, "fotos"))) if (!usadas.has(f) && f !== "hero-poster.webp") avisos.push(`foto não usada no HTML: fotos/${f}`);

// links externos que abrem em nova aba precisam de rel="noopener"
for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
  if (!/rel="[^"]*noopener/.test(m[0])) erros.push(`link com target=_blank sem rel=noopener: ${m[0].slice(0, 90)}`);
}

// vídeos: atributos que fazem o autoplay funcionar em celular (mudo + inline), quadro de reserva e fonte MP4 (iOS/Safari)
const videos = [...html.matchAll(/<video\b[^>]*>/g)].map((m) => m[0]);
if (!videos.length) erros.push("vídeo da abertura ausente (<video>)");
for (const v of videos) {
  const id = (v.match(/data-mp4="([^"]+)"/) || [])[1] || v.slice(0, 60);
  for (const attr of ["autoplay", "loop", "muted", "playsinline", "poster=", "data-mp4=", 'preload="none"']) {
    if (!v.includes(attr)) erros.push(`<video ${id}> sem o atributo ${attr}`);
  }
  if (!/data-mp4="[^"]+\.mp4"/.test(v)) erros.push(`<video ${id}> sem fonte MP4 (H.264), necessária para iOS/Safari`);
}
const botoes = (html.match(/<button[^>]*class="vctl[ "]/g) || []).length;
if (botoes !== videos.length) erros.push(`cada vídeo precisa do botão Reproduzir/Pausar: ${videos.length} vídeo(s), ${botoes} botão(ões)`);
if (videos.length < 4) erros.push(`esperava a abertura e 3 clipes de campo, achei ${videos.length} vídeo(s)`);
for (const f of readdirSync(join(raiz, "video"))) {
  const mb = statSync(join(raiz, "video", f)).size / 1048576;
  if (mb > 5) avisos.push(`video/${f} tem ${mb.toFixed(1)} MB (acima de 5 MB pesa)`);
}
const usadosVideo = new Set([...html.matchAll(/video\/([^"]+)"/g)].map((m) => m[1]));
for (const f of readdirSync(join(raiz, "video"))) if (!usadosVideo.has(f)) avisos.push(`vídeo não usado no HTML: video/${f}`);

// ---------- 3. conversão: WhatsApp e Instagram ----------
const wa = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map((m) => m[1]);
if (wa.length < 3) erros.push(`esperava ao menos 3 links de WhatsApp, achei ${wa.length}`);
if (!wa.some((u) => /visita/i.test(decodeURIComponent(u)))) erros.push("falta um link de WhatsApp para agendar visita técnica");
if (!wa.some((u) => /projeto/i.test(decodeURIComponent(u)))) erros.push("falta um link de WhatsApp para solicitar projeto");
for (const u of wa) {
  let url;
  try { url = new URL(u); } catch { erros.push(`link de WhatsApp inválido: ${u}`); continue; }
  if (url.pathname !== `/${WHATSAPP}`) erros.push(`WhatsApp com número diferente do oficial: ${url.pathname}`);
  const texto = url.searchParams.get("text") || "";
  if (texto.trim().length < 15) erros.push(`link de WhatsApp sem mensagem pré-preenchida: ${u}`);
}
const principal = new URL(wa[0]).searchParams.get("text") || "";
if (!/paisagismo/i.test(principal)) erros.push("a mensagem principal do WhatsApp deve falar de paisagismo");

// escopo: a página é só de paisagismo. Nada de floricultura/presentes pode voltar por engano.
const texto = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, " ").toLowerCase();
const proibidas = ["buquê", "buque", "floricultura", "presente", "chocolate", "bombon", "bombom", "urso", "pelúcia", "cesta", "arranjo"];
for (const p of proibidas) if (texto.includes(p)) erros.push(`conteúdo fora do escopo de paisagismo: "${p}" aparece no texto da página`);
const nomesFotos = [...html.matchAll(/fotos\/([^"]+)"/g)].map((m) => m[1]).join(" ").toLowerCase();
for (const p of ["buque", "rosas-", "cesta", "caixa", "panda", "girassois"]) if (nomesFotos.includes(p)) erros.push(`foto fora do escopo no HTML: "${p}"`);
if (!html.includes(`href="tel:+${WHATSAPP}"`)) avisos.push("link tel: do telefone ausente");
if (!html.includes(`href="${INSTAGRAM}"`)) erros.push(`link do Instagram ausente ou diferente de ${INSTAGRAM}`);
// nenhum número antigo pode sobrar no texto da página
if (/99447-?6001|5561994476001/.test(html)) erros.push("o número de WhatsApp antigo ainda aparece na página");
if (!html.includes("(21) 99368-2078")) erros.push("o número (21) 99368-2078 deve aparecer escrito na página");

// ---------- 4. JS ----------
for (const f of ["luz.js", "etapas.js", "sites-incriveis.js"]) {
  try { new vm.Script(ler(f), { filename: f }); } catch (e) { erros.push(`${f}: erro de sintaxe: ${e.message}`); }
}

if (erros.length) fim();

// ---------- 5. dist/ ----------
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
for (const f of ARQUIVOS) cpSync(join(raiz, f), join(dist, f));
for (const p of PASTAS) cpSync(join(raiz, p), join(dist, p), { recursive: true });

// ---------- 6. relatório ----------
function arquivos(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? arquivos(join(dir, e.name), base) : [join(dir, e.name).slice(base.length + 1)]);
}
let total = 0, totalGz = 0;
const linhas = [];
for (const f of arquivos(dist).sort()) {
  const buf = readFileSync(join(dist, f));
  const gz = /\.(html|css|js)$/.test(f) ? gzipSync(buf, { level: 9 }).length : buf.length;
  total += buf.length; totalGz += gz;
  linhas.push(`  ${f.padEnd(34)} ${(buf.length / 1024).toFixed(1).padStart(8)} KB   ${(gz / 1024).toFixed(1).padStart(8)} KB`);
}
console.log("dist/ gerado:");
console.log(`  ${"arquivo".padEnd(34)} ${"bruto".padStart(11)}   ${"transferido".padStart(11)}`);
console.log(linhas.join("\n"));
console.log(`  ${"TOTAL".padEnd(34)} ${(total / 1024).toFixed(1).padStart(8)} KB   ${(totalGz / 1024).toFixed(1).padStart(8)} KB`);
const htmlGz = gzipSync(readFileSync(join(dist, "index.html")), { level: 9 }).length;
console.log(`\nHTML com gzip: ${(htmlGz / 1024).toFixed(1)} KB`);
for (const a of avisos) console.warn(`aviso: ${a}`);
console.log(`\nBuild OK${avisos.length ? ` (${avisos.length} aviso(s))` : ""}.`);

function fim() {
  for (const e of erros) console.error(`erro: ${e}`);
  console.error(`\nBuild falhou com ${erros.length} erro(s).`);
  process.exit(1);
}
