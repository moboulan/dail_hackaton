// The only network calls the browser makes: same-origin /api/chat and /api/debrief.

const TIMEOUT_MS = 30000;

// Returns { reply, left }. Throws an Error whose message can be shown as is.
export async function askCustomer(module, messages) {
  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: module.id, custom: module.custom, messages }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new Error(`${module.customer} ne répond pas. Vérifiez la connexion.`);
  }
  const data = await response.json().catch(() => ({}));
  if (response.ok && typeof data.reply === "string") return data;
  // Rate limits and invalid input carry a message written for the pharmacist.
  if (response.status === 429 || response.status === 400) throw new Error(data.error);
  throw new Error(`${module.customer} ne répond pas. Réessayez dans un instant.`);
}

// Returns { criteria, summary, score }. Throws an Error whose message can be shown as is.
export async function requestDebrief(module, messages) {
  let response;
  try {
    response = await fetch("/api/debrief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: module.id, custom: module.custom, messages }),
      signal: AbortSignal.timeout(TIMEOUT_MS * 2),
    });
  } catch {
    throw new Error("Le bilan n'a pas pu être calculé. Vérifiez la connexion.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.ok && Array.isArray(data.criteria)) return data;
  if (response.status === 429 || response.status === 400) throw new Error(data.error);
  throw new Error("Le bilan n'a pas pu être calculé.");
}
