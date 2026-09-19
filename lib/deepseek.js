// One place that talks to DeepSeek. Returns the reply text, or throws an Error whose
// `status` is the HTTP status the API routes should answer with (502 or 504).

const URL = "https://api.deepseek.com/chat/completions";
const TIMEOUT_MS = 25000;

export async function complete({ apiKey, model, messages, maxTokens, temperature, json = false }) {
  let response;
  try {
    response = await fetch(URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw Object.assign(new Error("upstream"), { status: error.name === "TimeoutError" ? 504 : 502 });
  }
  if (!response.ok) throw Object.assign(new Error("upstream"), { status: 502 });
  const data = await response.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw Object.assign(new Error("upstream"), { status: 502 });
  return text;
}
