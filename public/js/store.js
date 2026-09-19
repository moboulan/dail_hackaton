// Progress lives only in this browser. Every storage call is guarded: private windows and
// strict settings can block localStorage, and the app must keep working without it.

import { MODULES } from "./content.js";

const KEY = "bp-learning-eagle-v2";

let storageWorks = true;

export function freshProgress() {
  return {
    started: false,
    chat: { messages: [], left: false, ended: false },
    debrief: null,
    quiz: {},
    score: null,
  };
}

export function freshState() {
  return { modules: Object.fromEntries(MODULES.map((m) => [m.id, freshProgress()])) };
}

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    storageWorks = false;
    return freshState();
  }
  if (!raw) return freshState();
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    return freshState(); // corrupted entry: start over, storage itself still works
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    storageWorks = false;
  }
}

export function storageAvailable() {
  return storageWorks;
}

// Keep only fields of the expected type, so a hand-edited or stale entry cannot break rendering.
function sanitize(saved) {
  const state = freshState();
  for (const module of MODULES) {
    const stored = saved?.modules?.[module.id];
    if (!stored || typeof stored !== "object") continue;
    const progress = state.modules[module.id];
    if (typeof stored.started === "boolean") progress.started = stored.started;
    if (Array.isArray(stored.chat?.messages)) {
      progress.chat.messages = stored.chat.messages.filter(
        (m) => m && (m.role === "customer" || m.role === "pharmacist") && typeof m.text === "string",
      );
      progress.chat.left = stored.chat.left === true;
      progress.chat.ended = stored.chat.ended === true;
    }
    if (stored.debrief && typeof stored.debrief === "object") progress.debrief = stored.debrief;
    if (stored.quiz && typeof stored.quiz === "object" && !Array.isArray(stored.quiz)) {
      for (const [id, value] of Object.entries(stored.quiz)) {
        if (Number.isInteger(value)) progress.quiz[id] = value;
      }
    }
    if (Number.isFinite(stored.score)) progress.score = stored.score;
  }
  return state;
}
