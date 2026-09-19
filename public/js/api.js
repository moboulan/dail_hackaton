// The only network call the browser makes: same-origin /api/chat.

const TIMEOUT_MS = 30000;

// Returns { reply, left }. Throws an Error whose message can be shown as is.
export async function askCustomer(module, messages) {
  let response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module: module.id, messages }),
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
