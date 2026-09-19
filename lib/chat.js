// POST /api/chat: validates the conversation, redacts it, asks DeepSeek for the customer's
// next line. Returns { status, body } so the local server and a Vercel function can share it.
// Message content is never logged or stored.

import { complete } from "./deepseek.js";
import { resolveCase } from "./cases.js";
import { systemPrompt } from "./personas.js";
import { redact } from "./redact.js";

export const MAX_PHARMACIST_MESSAGES = 12;
export const MAX_MESSAGE_LENGTH = 500;
const END_MARK = "[FIN]";
const OPENING_CUE = "(Tu entres dans la pharmacie. Parle en premier : salue et explique pourquoi tu viens, sans révéler les informations cachées.)";

// Shared by /api/chat and /api/debrief. Returns an error message, or null when valid.
export function validateConversation(body, { allowEmpty }) {
  if (!body || typeof body !== "object") return "Requête invalide.";
  if (!resolveCase(body)) return "Module inconnu.";
  const { messages } = body;
  if (!Array.isArray(messages)) return "Conversation invalide.";
  if (messages.length === 0) return allowEmpty ? null : "Conversation vide.";
  if (messages.length > MAX_PHARMACIST_MESSAGES * 2 + 1) return "Conversation trop longue.";
  for (const m of messages) {
    if (!m || (m.role !== "customer" && m.role !== "pharmacist")) return "Message invalide.";
    if (typeof m.text !== "string" || !m.text.trim()) return "Message vide.";
    if (m.text.length > MAX_MESSAGE_LENGTH) return "Message trop long.";
  }
  const sent = messages.filter((m) => m.role === "pharmacist").length;
  if (sent > MAX_PHARMACIST_MESSAGES) return "Nombre maximum de messages atteint.";
  return null;
}

// The customer is the "assistant" the model plays; the pharmacist is the "user".
// An empty conversation gets a stage direction so the customer speaks first.
function toModelMessages(conversation) {
  if (!conversation.length) return [{ role: "user", content: OPENING_CUE }];
  return conversation.map((m) =>
    m.role === "pharmacist"
      ? { role: "user", content: redact(m.text) }
      : { role: "assistant", content: m.text },
  );
}

// Facts this reply reveals: the model's tags, or the fact's own words when the tag was forgotten.
function revealedFacts(persona, raw, reply) {
  const tagged = [...raw.matchAll(/\[FAIT:([a-z]+)\]/g)].map((m) => m[1]);
  return Object.entries(persona.facts)
    .filter(([id, fact]) => tagged.includes(id) || fact.said.test(reply))
    .map(([id]) => id);
}

export async function handleChat(body, apiKey, model) {
  const problem = validateConversation(body, { allowEmpty: true });
  if (problem) return { status: 400, body: { error: problem } };
  const last = body.messages[body.messages.length - 1];
  if (last && last.role !== "pharmacist") return { status: 400, body: { error: "Le dernier message doit venir du pharmacien." } };
  if (!apiKey) return { status: 500, body: { error: "Service non configuré." } };

  let raw;
  try {
    raw = await complete({
      apiKey,
      model,
      messages: [{ role: "system", content: systemPrompt(resolveCase(body).persona) }, ...toModelMessages(body.messages)],
      maxTokens: 200,
      temperature: 0.8,
    });
  } catch (error) {
    return { status: error.status, body: { error: "La cliente ne répond pas." } };
  }
  const left = raw.includes(END_MARK);
  const reply = raw.replaceAll(END_MARK, "").replace(/\[FAIT:[a-z]*\]/g, "").trim();
  return { status: 200, body: { reply, left, facts: revealedFacts(resolveCase(body).persona, raw, reply) } };
}
