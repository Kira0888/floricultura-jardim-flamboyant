#!/usr/bin/env node
/* Servidor estático mínimo para pré-visualizar o site. Uso: npm start  (porta 4600) */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, resolve, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = process.argv[2] ? resolve(process.argv[2]) : raiz;
const porta = Number(process.env.PORT || 4600);

const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    let caminho = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (caminho.endsWith("/")) caminho += "index.html";
    const arquivo = normalize(join(pasta, caminho));
    if (!arquivo.startsWith(pasta)) { res.writeHead(403).end("proibido"); return; }
    if (!(await stat(arquivo)).isFile()) throw new Error("não é arquivo");
    res.writeHead(200, { "Content-Type": TIPOS[extname(arquivo)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(await readFile(arquivo));
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("não encontrado");
  }
}).listen(porta, () => console.log(`Servindo ${pasta}\nAbra: http://localhost:${porta}`));
