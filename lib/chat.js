// POST /api/chat: validates the conversation, redacts it, asks DeepSeek for the customer's
// next line. Returns { status, body } so the local server and a Vercel function can share it.
// Message content is never logged or stored.

import { PERSONAS, systemPrompt } from "./personas.js";
import { redact } from "./redact.js";

export const MAX_PHARMACIST_MESSAGES = 12;
export const MAX_MESSAGE_LENGTH = 500;
const END_MARK = "[FIN]";
const TIMEOUT_MS = 20000;

function invalid(message) {
  return { status: 400, body: { error: message } };
}

function validate(body) {
  if (!body || typeof body !== "object") return "Requête invalide.";
  if (!PERSONAS[body.module]) return "Module inconnu.";
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) return "Conversation vide.";
  if (messages.length > MAX_PHARMACIST_MESSAGES * 2 + 1) return "Conversation trop longue.";
  for (const m of messages) {
    if (!m || (m.role !== "customer" && m.role !== "pharmacist")) return "Message invalide.";
    if (typeof m.text !== "string" || !m.text.trim()) return "Message vide.";
    if (m.text.length > MAX_MESSAGE_LENGTH) return "Message trop long.";
  }
  if (messages[messages.length - 1].role !== "pharmacist") return "Le dernier message doit venir du pharmacien.";
  const sent = messages.filter((m) => m.role === "pharmacist").length;
  if (sent > MAX_PHARMACIST_MESSAGES) return "Nombre maximum de messages atteint.";
  return null;
}

export async function handleChat(body, apiKey, model) {
  const problem = validate(body);
  if (problem) return invalid(problem);
  if (!apiKey) return { status: 500, body: { error: "Service non configuré." } };

  // The customer is the "assistant" the model plays; the pharmacist is the "user".
  const messages = [
    { role: "system", content: systemPrompt(body.module) },
    ...body.messages.map((m) =>
      m.role === "pharmacist"
        ? { role: "user", content: redact(m.text) }
        : { role: "assistant", content: m.text },
    ),
  ];

  let response;
  try {
    response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, max_tokens: 200, temperature: 0.8 }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error.name === "TimeoutError";
    return { status: timedOut ? 504 : 502, body: { error: "La cliente ne répond pas." } };
  }
  if (!response.ok) return { status: 502, body: { error: "La cliente ne répond pas." } };

  const data = await response.json().catch(() => null);
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) {
    return { status: 502, body: { error: "La cliente ne répond pas." } };
  }
  const left = raw.includes(END_MARK);
  const reply = raw.replaceAll(END_MARK, "").trim();
  return { status: 200, body: { reply, left } };
}
