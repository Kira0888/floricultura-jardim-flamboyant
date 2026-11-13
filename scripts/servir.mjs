#!/usr/bin/env node
/* Servidor estático mínimo para pré-visualizar o site. Uso: npm start  (porta 4600)
   Suporta requisições de faixa (Range), que o Safari exige para tocar vídeo. */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, extname, resolve, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = process.argv[2] ? resolve(process.argv[2]) : raiz;
const porta = Number(process.env.PORT || 4600);

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".mp4": "video/mp4", ".webm": "video/webm",
};

createServer(async (req, res) => {
  try {
    let caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (caminho.endsWith("/")) caminho += "index.html";
    const arquivo = normalize(join(pasta, caminho));
    if (!arquivo.startsWith(pasta)) { res.writeHead(403).end("proibido"); return; }
    const info = await stat(arquivo);
    if (!info.isFile()) throw new Error("não é arquivo");
    const tipo = TIPOS[extname(arquivo)] || "application/octet-stream";
    const cab = { "Content-Type": tipo, "Cache-Control": "no-cache", "Accept-Ranges": "bytes" };

    const faixa = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
    if (faixa) {
      let ini = faixa[1] === "" ? info.size - Number(faixa[2]) : Number(faixa[1]);
      let fim = faixa[1] === "" || faixa[2] === "" ? info.size - 1 : Math.min(Number(faixa[2]), info.size - 1);
      if (!(ini >= 0 && ini <= fim && ini < info.size)) {
        res.writeHead(416, { ...cab, "Content-Range": `bytes */${info.size}` }).end();
        return;
      }
      res.writeHead(206, { ...cab, "Content-Range": `bytes ${ini}-${fim}/${info.size}`, "Content-Length": fim - ini + 1 });
      if (req.method === "HEAD") { res.end(); return; }
      createReadStream(arquivo, { start: ini, end: fim }).pipe(res);
      return;
    }
    res.writeHead(200, { ...cab, "Content-Length": info.size });
    if (req.method === "HEAD") { res.end(); return; }
    createReadStream(arquivo).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("não encontrado");
  }
}).listen(porta, () => console.log(`Servindo ${pasta}\nAbra: http://localhost:${porta}`));
