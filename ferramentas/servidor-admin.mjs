/**
 * Servidor local do admin — grava o arquivo de verdade.
 *
 *   node ferramentas/servidor-admin.mjs
 *   abre http://127.0.0.1:8788/admin.html
 *
 * O que ele faz:
 *  - serve a pasta do projeto como site estático;
 *  - aceita POST /__admin/salvar e grava estrelas-conteudo.js na raiz
 *    (é o "Salvar no arquivo" da página admin);
 *  - aceita POST /__admin/deploy e roda `npx wrangler deploy` no projeto
 *    (é o "Publicar no site" da página admin — só existe aqui, no local);
 *  - encaminha /api/* para o Worker publicado, para o botão
 *    "Gerar com IA" funcionar mesmo rodando local.
 *
 * Sem dependências. Ctrl+C encerra.
 */

import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(fileURLToPath(new URL("..", import.meta.url)));
const PORTA = Number(process.env.PORT || 8788);
const API = process.env.LUNOX_API || "https://lunox.lunoxdemo.workers.dev";
const ALVO = join(RAIZ, "estrelas-conteudo.js");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".md": "text/markdown; charset=utf-8",
  ".woff2": "font/woff2",
};

function responder(res, status, corpo, tipo) {
  res.writeHead(status, {
    "content-type": tipo || "text/plain; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(corpo);
}

async function corpoJson(req) {
  let bruto = "";
  for await (const parte of req) {
    bruto += parte;
    if (bruto.length > 2_000_000) throw new Error("corpo grande demais");
  }
  return JSON.parse(bruto || "{}");
}

async function salvar(req, res) {
  try {
    const { conteudo } = await corpoJson(req);
    if (typeof conteudo !== "string" || conteudo.indexOf("window.LUNOX_CONTEUDO =") < 0) {
      responder(res, 400, JSON.stringify({ ok: false, erro: "conteúdo inválido" }), "application/json");
      return;
    }
    await writeFile(ALVO, conteudo, "utf8");
    console.log("  ✔ estrelas-conteudo.js gravado (" + conteudo.length + " bytes)");
    responder(res, 200, JSON.stringify({ ok: true, arquivo: ALVO }), "application/json");
  } catch (e) {
    responder(res, 500, JSON.stringify({ ok: false, erro: String(e.message || e) }), "application/json");
  }
}

/* Roda `npx wrangler deploy` na pasta do projeto (botão "Publicar no site").
 * GET/HEAD devolvem só { ok: true } — é assim que a página descobre que está
 * no servidor local e mostra o botão. */
let deployRodando = false;

function rodarDeploy() {
  return new Promise((resolve) => {
    let saida = "";
    const filho = spawn("npx", ["wrangler", "deploy"], {
      cwd: RAIZ,
      shell: true,
      env: { ...process.env, CI: "1", WRANGLER_SEND_METRICS: "false" },
    });
    const juntar = (pedaco) => { saida += pedaco.toString("utf8"); };
    filho.stdout.on("data", juntar);
    filho.stderr.on("data", juntar);
    const tampa = setTimeout(() => {
      try { filho.kill(); } catch {}
      resolve({ ok: false, erro: "o deploy demorou mais de 5 minutos e foi cancelado", saida });
    }, 5 * 60 * 1000);
    filho.on("error", (e) => {
      clearTimeout(tampa);
      resolve({ ok: false, erro: "não consegui rodar o npx: " + (e.message || e), saida });
    });
    filho.on("close", (codigo) => {
      clearTimeout(tampa);
      resolve({
        ok: codigo === 0,
        erro: codigo === 0 ? null : "o wrangler terminou com código " + codigo,
        saida,
      });
    });
  });
}

async function deploy(req, res) {
  if (req.method === "GET" || req.method === "HEAD") {
    responder(res, 200, JSON.stringify({ ok: true, local: true }), "application/json");
    return;
  }
  if (req.method !== "POST") { responder(res, 405, "use POST"); return; }
  if (deployRodando) {
    responder(res, 429, JSON.stringify({ ok: false, erro: "um deploy já está em andamento" }), "application/json");
    return;
  }

  deployRodando = true;
  console.log("  ▶ deploy iniciado (npx wrangler deploy)…");
  try {
    const r = await rodarDeploy();
    const limpo = r.saida
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "")   // cores ANSI
      .replace(/\r/g, "");
    const versao = (limpo.match(/Current Version ID: ([0-9a-f-]+)/) || [])[1] || "";
    const url = (limpo.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/) || [])[0] || "";
    const cauda = limpo.split("\n").map((l) => l.trim()).filter(Boolean).slice(-25).join("\n");
    if (r.ok) console.log("  ✔ deploy publicado" + (versao ? " (" + versao + ")" : ""));
    else console.log("  ✖ deploy falhou: " + (r.erro || "?"));
    responder(res, r.ok ? 200 : 500, JSON.stringify({
      ok: r.ok,
      erro: r.erro,
      versao,
      url,
      saida: cauda,
    }), "application/json");
  } finally {
    deployRodando = false;
  }
}

async function proxyApi(req, res, url) {
  try {
    const partes = [];
    for await (const p of req) partes.push(p);
    const corpo = partes.length ? Buffer.concat(partes) : undefined;
    const cabecalhos = { "content-type": req.headers["content-type"] || "application/json" };
    // sessão da conta (Bearer) precisa passar junto no /api/estado e /api/conta/*
    for (const nome of ["authorization", "x-lunox-token", "cookie"]) {
      if (req.headers[nome]) cabecalhos[nome] = req.headers[nome];
    }
    const r = await fetch(API + url.pathname + url.search, {
      method: req.method,
      headers: cabecalhos,
      body: corpo,
    });
    const texto = await r.text();
    // o set-cookie da sessão (muro de login) volta pro navegador daqui também
    const biscoitos = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
    res.writeHead(r.status, {
      "content-type": r.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
      ...(biscoitos.length ? { "set-cookie": biscoitos } : {}),
    });
    res.end(texto);
  } catch (e) {
    responder(res, 502, JSON.stringify({ ok: false, erro: "API indisponível: " + (e.message || e) }), "application/json");
  }
}

async function arquivo(req, res, url) {
  let caminho = decodeURIComponent(url.pathname);
  if (caminho.endsWith("/")) caminho += "index.html";
  const alvo = normalize(join(RAIZ, caminho));
  if (!alvo.startsWith(RAIZ + sep) && alvo !== RAIZ) {
    responder(res, 403, "fora da pasta do projeto");
    return;
  }
  if (!existsSync(alvo)) {
    responder(res, 404, "não encontrado: " + caminho);
    return;
  }
  try {
    const dados = await readFile(alvo);
    responder(res, 200, dados, TIPOS[extname(alvo).toLowerCase()] || "application/octet-stream");
  } catch {
    responder(res, 500, "erro ao ler " + caminho);
  }
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (url.pathname === "/__admin/salvar") {
    if (req.method !== "POST") { responder(res, 405, "use POST"); return; }
    await salvar(req, res);
    return;
  }
  if (url.pathname === "/__admin/deploy") {
    await deploy(req, res);
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    await proxyApi(req, res, url);
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    responder(res, 405, "método não permitido");
    return;
  }
  await arquivo(req, res, url);
});

servidor.listen(PORTA, "127.0.0.1", () => {
  console.log("");
  console.log("  Lunox — servidor local do admin");
  console.log("  Admin:  http://127.0.0.1:" + PORTA + "/admin.html");
  console.log("  Trilha: http://127.0.0.1:" + PORTA + "/sua-trilha.html");
  console.log("  IA:     " + API + " (proxy de /api/*)");
  console.log("  Grava:  " + ALVO);
  console.log("");
  console.log("  Ctrl+C para encerrar.");
});
