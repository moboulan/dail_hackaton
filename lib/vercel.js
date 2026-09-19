// Adapts a shared route handler ({ status, body } from a parsed body) to a Vercel function.

import { rateLimited } from "./rate-limit.js";

export function vercelRoute(handle) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") return res.status(405).json({ error: "POST uniquement." });
    const client = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    if (rateLimited(client)) {
      return res.status(429).json({ error: "Trop de messages. Réessayez dans quelques minutes." });
    }
    const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
    const result = await handle(body, process.env.DEEPSEEK_API_KEY, process.env.DEEPSEEK_MODEL || "deepseek-chat");
    return res.status(result.status).json(result.body);
  };
}

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
