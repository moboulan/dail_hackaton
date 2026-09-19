// POST /api/debrief: grades a finished conversation on 5 criteria, 0 to 2 points each.
// The model returns JSON; everything it returns is validated here, and a quote is kept only
// if the pharmacist really wrote it.

import { complete } from "./deepseek.js";
import { validateConversation } from "./chat.js";
import { PERSONAS } from "./personas.js";
import { redact } from "./redact.js";
import { MODULES } from "../public/js/content.js";

// Ids must match CRITERIA in public/js/content.js.
const CRITERIA = [
  { id: "langue", rule: "A demandé la langue préférée du client, sans la supposer, et l'a respectée." },
  { id: "questions", rule: "A posé les questions utiles (symptômes, durée, traitements, signes d'alerte) AVANT de conseiller un produit." },
  { id: "etapes", rule: "A expliqué une étape à la fois, simplement, et a vérifié la compréhension (par exemple en faisant reformuler)." },
  { id: "complement", rule: "A proposé un complément seulement s'il répond à un besoin réel et n'est pas contre-indiqué ; n'a rien poussé d'inutile." },
  { id: "produit", rule: "A pris la bonne décision pour ce cas et n'a dit aucune information fausse par rapport aux fiches produits." },
];
const MAX_TEXT = 300;

function productSheet(module) {
  return module.products
    .map((p) => `- ${p.name} (${p.price} DH), ${p.form}. Pour : ${p.forWhat} Usage : ${p.use} Attention : ${p.caution}`)
    .join("\n");
}

function prompt(moduleId, messages) {
  const module = MODULES.find((m) => m.id === moduleId);
  const persona = PERSONAS[moduleId];
  const transcript = messages
    .map((m) => `${m.role === "pharmacist" ? "Pharmacien" : "Client"} : ${m.role === "pharmacist" ? redact(m.text) : m.text}`)
    .join("\n");
  return `Tu évalues un pharmacien en formation continue au Maroc, après une conversation avec un client fictif.

Produits disponibles (seule source de vérité) :
${productSheet(module)}

Informations cachées du client :
${persona.hidden.map((h) => `- ${h}`).join("\n")}

Ce qu'un bon pharmacien fait dans ce cas :
${persona.expected}

Critères, notés 0 (non fait), 1 (partiel) ou 2 (bien fait) :
${CRITERIA.map((c) => `- ${c.id} : ${c.rule}`).join("\n")}

Conversation :
${transcript}

Réponds uniquement avec un objet JSON de cette forme :
{"criteria":[{"id":"langue","score":0,"comment":"...","quote":"...","better":"..."}, ...les 5 critères dans l'ordre...],"summary":"..."}
Règles :
- Sois juste et exigeant. Ne note que ce qui est écrit dans la conversation.
- La note et le commentaire doivent concorder : si le commentaire signale un oubli ou une erreur, la note est 0 ou 1, jamais 2.
- "comment" : une phrase courte (moins de 20 mots) qui s'adresse au pharmacien en le vouvoyant.
- "quote" : une phrase du pharmacien recopiée mot pour mot qui illustre la note, ou "" s'il n'y en a pas.
- "better" : si la note est inférieure à 2, une phrase que le pharmacien aurait pu dire (moins de 25 mots) ; sinon "".
- "summary" : une phrase adressée au pharmacien en le vouvoyant ("Vous..."), sur le point le plus important à retenir.`;
}

// Lowercase, straight quotes, single spaces, no surrounding punctuation: tolerant matching
// for "did the pharmacist really write this?".
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[«»"“”]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:!?]+|[\s.,;:!?]+$/g, "");
}

function clip(value) {
  return typeof value === "string" ? value.trim().slice(0, MAX_TEXT) : "";
}

function validateGrading(raw, messages) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data?.criteria)) return null;
  const written = messages.filter((m) => m.role === "pharmacist").map((m) => normalize(m.text));
  const criteria = [];
  for (const { id } of CRITERIA) {
    const item = data.criteria.find((c) => c?.id === id);
    if (!item || ![0, 1, 2].includes(item.score)) return null;
    const quote = clip(item.quote);
    const real = quote && written.some((line) => line.includes(normalize(quote)));
    criteria.push({
      id,
      score: item.score,
      comment: clip(item.comment),
      quote: real ? quote : "",
      better: item.score < 2 ? clip(item.better) : "",
    });
  }
  const points = criteria.reduce((sum, c) => sum + c.score, 0);
  return {
    criteria,
    summary: clip(data.summary),
    score: Math.round((points / (CRITERIA.length * 2)) * 100),
  };
}

export async function handleDebrief(body, apiKey, model) {
  const problem = validateConversation(body, { allowEmpty: false });
  if (problem) return { status: 400, body: { error: problem } };
  if (!body.messages.some((m) => m.role === "pharmacist")) {
    return { status: 400, body: { error: "Aucune réponse du pharmacien à évaluer." } };
  }
  if (!apiKey) return { status: 500, body: { error: "Service non configuré." } };

  // One retry: a malformed grading is rare but should not reach the pharmacist.
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw;
    try {
      raw = await complete({
        apiKey,
        model,
        messages: [{ role: "user", content: prompt(body.module, body.messages) }],
        maxTokens: 900,
        temperature: 0.2,
        json: true,
      });
    } catch (error) {
      return { status: error.status, body: { error: "Le bilan n'a pas pu être calculé." } };
    }
    const grading = validateGrading(raw, body.messages);
    if (grading) return { status: 200, body: grading };
  }
  return { status: 502, body: { error: "Le bilan n'a pas pu être calculé." } };
}
