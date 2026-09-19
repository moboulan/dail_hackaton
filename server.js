// Local server: serves public/ and the /api routes. No dependencies.
// Run: node server.js   (reads DEEPSEEK_API_KEY, DEEPSEEK_MODEL, PORT from .env)

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleChat } from "./lib/chat.js";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PUBLIC = join(ROOT, "public");
const MAX_BODY_BYTES = 32 * 1024;

loadEnv(join(ROOT, ".env"));
const PORT = Number(process.env.PORT) || 8089;
const API_KEY = process.env.DEEPSEEK_API_KEY;
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

// Minimal .env reader: KEY=value lines, # comments. Existing environment variables win.
function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
}

// Basic abuse brake: 40 chat requests per IP per 10 minutes. In memory, so it resets on restart.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 40;
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(req, res) {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = normalize(join(PUBLIC, path.endsWith("/") ? `${path}index.html` : path));
  // Refuse anything outside public/ and any dotfile.
  if (!file.startsWith(PUBLIC + sep) || file.split(sep).some((part) => part.startsWith("."))) {
    return send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
  try {
    send(res, 200, await readFile(file), TYPES[extname(file)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
}

const server = createServer(async (req, res) => {
  if (req.url === "/api/chat") {
    if (req.method !== "POST") return send(res, 405, { error: "POST uniquement." });
    if (rateLimited(req.socket.remoteAddress)) {
      return send(res, 429, { error: "Trop de messages. Réessayez dans quelques minutes." });
    }
    let body;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { error: "Requête invalide." });
    }
    const result = await handleChat(body, API_KEY, MODEL);
    return send(res, result.status, result.body);
  }
  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method not allowed", "text/plain");
  return serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`BP Learning: http://127.0.0.1:${PORT}/`);
  if (!API_KEY) console.log("DEEPSEEK_API_KEY missing: the chat will answer with an error.");
});
