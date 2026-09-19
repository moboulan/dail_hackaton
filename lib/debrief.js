// POST /api/debrief: grades a finished conversation on 5 criteria (0 to 2, or not applicable)
// and writes a 3-question quiz on what the pharmacist missed. The model returns JSON; everything
// is validated here, and an exchange is shown only if the pharmacist really wrote the quote.

import { complete } from "./deepseek.js";
import { validateConversation } from "./chat.js";
import { resolveCase } from "./cases.js";
import { redact } from "./redact.js";

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
    .map((p) => `- ${p.name} (${p.price} DH), ${p.form}. Pour : ${p.forWhat} Usage : ${p.use}${p.caution ? ` Attention : ${p.caution}` : " Aucune contre-indication."}`)
    .join("\n");
}

function prompt({ module, persona }, messages) {
  const transcript = messages
    .map((m) => `${m.role === "pharmacist" ? "Pharmacien" : "Client"} : ${m.role === "pharmacist" ? redact(m.text) : m.text}`)
    .join("\n");
  return `Tu évalues un pharmacien en formation continue au Maroc, après une conversation avec un client fictif.

Ce que le pharmacien savait avant la conversation : ${module.brief}

Produits disponibles (seule source de vérité) :
${productSheet(module)}

Informations cachées du client :
${persona.hidden.map((h) => `- ${h}`).join("\n")}

Ce qu'un bon pharmacien fait dans ce cas :
${persona.expected}

Critères, notés 0 (non fait), 1 (partiel), 2 (bien fait) ou null (non nécessaire dans cette conversation) :
${CRITERIA.map((c) => `- ${c.id} : ${c.rule}`).join("\n")}

Conversation :
${transcript}

Réponds uniquement avec un objet JSON de cette forme :
{"criteria":[{"id":"langue","score":0,"comment":"...","quote":"...","better":"...","tip":"..."}, ...les 5 critères dans l'ordre...],"summary":"...","quiz":[{"question":"...","options":["...","...","..."],"correct":0,"reasons":["...","...","..."]}, ...3 questions...]}
Règles :
- Évalue l'ensemble de la conversation, pas chaque message isolément : une question déjà posée ou une information déjà obtenue plus tôt compte pour la suite. Ne reproche jamais ce qui a déjà été fait avant.
- Sois juste, pas pointilleux. 2 = l'essentiel est fait, même si la formulation n'est pas parfaite ou comporte des fautes de frappe. 1 = fait en partie, avec un oubli réel. 0 = pas fait ou erreur dangereuse.
- La note et le commentaire doivent concorder : si le commentaire signale un oubli ou une erreur, la note est 0 ou 1, jamais 2.
- "comment" : une phrase courte (moins de 20 mots) qui s'adresse au pharmacien en le vouvoyant.
- "quote" : une phrase du pharmacien recopiée mot pour mot qui illustre la note, ou "" s'il n'y en a pas.
- "better" : si la note est inférieure à 2, la phrase exacte que le pharmacien aurait pu dire au client (moins de 25 mots), sans introduction ni guillemets ; sinon "".
- "tip" : si la note est inférieure à 2, un exemple de phrase à dire au client, de 4 à 10 mots, en français simple, sans guillemets, qui ne répète pas le nom du critère (exemples : Depuis quand ? Vous avez de la fièvre ? / Vous pouvez me redire comment faire ?) ; sinon "". Elle applique toujours la bonne décision du cas (jamais un produit contre-indiqué) et n'ajoute aucun fait absent des fiches.
- "summary" : une phrase adressée au pharmacien en le vouvoyant ("Vous..."), sur le point le plus important à retenir.
- score null : seulement si la situation ne demandait pas ce critère. Pour "langue" : juge seulement sur la conversation. Bien fait = le pharmacien a demandé la langue ou s'est adapté à la langue que le client utilise ; ne reproche jamais une préférence que le client n'a pas exprimée dans la conversation. Pour "complement" : null si aucun complément n'avait de sens. "questions" et "produit" ne sont jamais null. Avec null, "comment", "quote" et "better" sont "".
- "quiz" : 3 questions à choix unique pour s'entraîner sur ce que le pharmacien a manqué ou mal fait (sinon sur les points clés du cas). Chaque question : une situation courte au comptoir, 3 réponses dont une seule juste, "correct" = index de la bonne, "reasons" = pour chaque réponse une phrase courte qui explique pourquoi elle est juste ou non. Une seule réponse est clairement juste ; les deux autres sont clairement fausses, jamais « juste sous condition ». N'utilise que les faits des fiches produits ; aucun dosage, aucun médicament réel. Vouvoie le pharmacien.`;
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

// Only the sentence itself: drop a lead-in ("Vous auriez pu dire :") and wrapping quotes.
function bare(value) {
  const unquote = (text) => text.replace(/^[«"“\s]+|[»"”\s]+$/g, "");
  return unquote(unquote(clip(value)).replace(/^vous (auriez|pourriez) pu \w+\s*:\s*/i, "")).trim();
}

// The pharmacist line that contains the quote, and the customer line just before it, so the
// Bilan shows a real exchange instead of a fragment. Null when the quote was never written.
function findExchange(quote, messages) {
  const target = normalize(quote);
  if (!target) return null;
  const index = messages.findIndex((m) => m.role === "pharmacist" && normalize(m.text).includes(target));
  if (index === -1) return null;
  const before = messages[index - 1]?.role === "customer" ? messages[index - 1].text : "";
  return { before: clip(before), said: clip(messages[index].text) };
}

// Fisher-Yates on the option indexes: models tend to put the right answer first.
function shuffledQuestion(q, number) {
  const order = [0, 1, 2];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    id: `ia${number}`,
    question: clip(q.question),
    options: order.map((i) => ({ text: clip(q.options[i]), why: clip(q.reasons[i]) })),
    correct: order.indexOf(q.correct),
  };
}

function validQuizQuestion(q) {
  const texts = (list) => Array.isArray(list) && list.length === 3 && list.every((t) => typeof t === "string" && t.trim());
  return q && typeof q.question === "string" && q.question.trim() && texts(q.options) && texts(q.reasons) && [0, 1, 2].includes(q.correct);
}

function validateGrading(raw, messages, persona) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data?.criteria)) return null;
  const criteria = [];
  for (const { id } of CRITERIA) {
    const item = data.criteria.find((c) => c?.id === id);
    if (!item) return null;
    // Language is graded only where the case calls for it; the persona decides, not the model.
    if (id === "langue" && !persona.languageMatters) {
      criteria.push({ id, score: null });
      continue;
    }
    const optional = id === "langue" || id === "complement";
    if (item.score === null && optional) {
      criteria.push({ id, score: null });
      continue;
    }
    if (![0, 1, 2].includes(item.score)) return null;
    criteria.push({
      id,
      score: item.score,
      comment: clip(item.comment),
      exchange: findExchange(clip(item.quote), messages),
      better: item.score < 2 ? bare(item.better) : "",
      tip: item.score < 2 ? bare(item.tip) : "",
    });
  }
  const graded = criteria.filter((c) => c.score !== null);
  const points = graded.reduce((sum, c) => sum + c.score, 0);
  // A personalised quiz is used only when all 3 questions are well formed.
  const quiz = Array.isArray(data.quiz) && data.quiz.length >= 3 && data.quiz.slice(0, 3).every(validQuizQuestion)
    ? data.quiz.slice(0, 3).map((q, i) => shuffledQuestion(q, i + 1))
    : [];
  return {
    criteria,
    summary: clip(data.summary),
    score: Math.round((points / (graded.length * 2)) * 100),
    quiz,
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
        messages: [{ role: "user", content: prompt(resolveCase(body), body.messages) }],
        maxTokens: 1800,
        temperature: 0.2,
        json: true,
      });
    } catch (error) {
      return { status: error.status, body: { error: "Le bilan n'a pas pu être calculé." } };
    }
    const grading = validateGrading(raw, body.messages, resolveCase(body).persona);
    if (grading) return { status: 200, body: grading };
  }
  return { status: 502, body: { error: "Le bilan n'a pas pu être calculé." } };
}
