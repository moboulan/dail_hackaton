// Progress lives only in this browser. Every storage call is guarded: private windows and
// strict settings can block localStorage, and the app must keep working without it.

const KEY = "bp-learning-eagle-v1";

let storageWorks = true;

export function freshState() {
  return {
    started: false,
    lastStep: "preparation",
    checks: {},
    conversation: { messages: [], ended: false },
    quizDone: false,
  };
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
  if (!saved || typeof saved !== "object") return state;
  if (typeof saved.started === "boolean") state.started = saved.started;
  if (typeof saved.lastStep === "string") state.lastStep = saved.lastStep;
  if (saved.checks && typeof saved.checks === "object" && !Array.isArray(saved.checks)) {
    for (const [id, value] of Object.entries(saved.checks)) {
      if (Number.isInteger(value)) state.checks[id] = value;
    }
  }
  const conversation = saved.conversation;
  if (conversation && Array.isArray(conversation.messages)) {
    state.conversation.messages = conversation.messages.filter(
      (m) => m && (m.role === "customer" || m.role === "pharmacist") && typeof m.text === "string",
    );
    state.conversation.ended = conversation.ended === true;
  }
  if (typeof saved.quizDone === "boolean") state.quizDone = saved.quizDone;
  return state;
}
