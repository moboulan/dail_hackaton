// Basic abuse brake: 40 API requests per client per 10 minutes. In memory: on Vercel each
// function instance keeps its own count and cold starts reset it, so this only slows abuse.

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 40;
const hits = new Map();

export function rateLimited(client) {
  const now = Date.now();
  const recent = (hits.get(client) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(client, recent);
  return recent.length > LIMIT;
}
