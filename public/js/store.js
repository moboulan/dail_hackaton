// Everything lives in this browser: one pharmacy computer shared by the team. Every storage call
// is guarded: private windows and strict settings can block localStorage, and the app must keep
// working without it.
//
// pharmacy = { staff: [{ id, name }], current, records: { [staffId]: { modules, memoHints } },
//              customModules: [...] }   (cases written in the editor belong to the pharmacy)

import { MODULES } from "./content.js";

const KEY = "bp-learning-eagle-v4";
const FIRST_STAFF = { id: "alami", name: "Dr Alami" };

let storageWorks = true;

export function freshProgress() {
  return {
    started: false,
    chat: { messages: [], facts: [], left: false, ended: false },
    debrief: null,
    quiz: {}, // question id -> the answer chosen; submitted once
    score: null,
    completedAt: null,
  };
}

// memoHints: réflexe id -> the short tip from the last Bilan that missed it (per person).
export function freshRecord() {
  return { modules: Object.fromEntries(MODULES.map((m) => [m.id, freshProgress()])), memoHints: {} };
}

export function freshPharmacy() {
  return { staff: [{ ...FIRST_STAFF }], current: FIRST_STAFF.id, records: { [FIRST_STAFF.id]: freshRecord() }, customModules: [] };
}

// What the screens read and change: the current person's record plus the shared cases.
// The objects are the pharmacy's own, so changes persist with save(pharmacy).
export function view(pharmacy) {
  const record = pharmacy.records[pharmacy.current];
  for (const c of pharmacy.customModules) record.modules[c.id] ??= freshProgress();
  const person = pharmacy.staff.find((s) => s.id === pharmacy.current);
  return { modules: record.modules, memoHints: record.memoHints, customModules: pharmacy.customModules, staffName: person.name };
}

export function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    storageWorks = false;
    return freshPharmacy();
  }
  if (!raw) return freshPharmacy();
  try {
    return sanitizePharmacy(JSON.parse(raw));
  } catch {
    return freshPharmacy(); // corrupted entry: start over, storage itself still works
  }
}

export function save(pharmacy) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pharmacy));
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
}

export function storageAvailable() {
  return storageWorks;
}

// Keep only fields of the expected type, so a hand-edited or stale entry cannot break rendering.
function sanitizePharmacy(saved) {
  const pharmacy = freshPharmacy();
  if (Array.isArray(saved?.customModules)) {
    pharmacy.customModules = saved.customModules.filter(
      (c) => c && /^cas-\d{6,}$/.test(c.id) && typeof c.title === "string" && Array.isArray(c.products),
    );
  }
  if (Array.isArray(saved?.staff)) {
    const staff = saved.staff.filter((s) => s && typeof s.id === "string" && typeof s.name === "string" && s.name.trim());
    if (staff.length) pharmacy.staff = staff;
  }
  const ids = [...MODULES.map((m) => m.id), ...pharmacy.customModules.map((c) => c.id)];
  pharmacy.records = Object.fromEntries(
    pharmacy.staff.map((s) => [s.id, sanitizeRecord(saved?.records?.[s.id], ids)]),
  );
  pharmacy.current = pharmacy.staff.some((s) => s.id === saved?.current) ? saved.current : pharmacy.staff[0].id;
  return pharmacy;
}

function sanitizeRecord(saved, moduleIds) {
  const record = freshRecord();
  if (saved?.memoHints && typeof saved.memoHints === "object") {
    for (const [id, hint] of Object.entries(saved.memoHints)) {
      if (typeof hint === "string") record.memoHints[id] = hint;
    }
  }
  for (const id of moduleIds) {
    record.modules[id] ??= freshProgress();
    const stored = saved?.modules?.[id];
    if (!stored || typeof stored !== "object") continue;
    const progress = record.modules[id];
    if (typeof stored.started === "boolean") progress.started = stored.started;
    if (Array.isArray(stored.chat?.messages)) {
      progress.chat.messages = stored.chat.messages.filter(
        (m) => m && (m.role === "customer" || m.role === "pharmacist") && typeof m.text === "string",
      );
      progress.chat.left = stored.chat.left === true;
      if (Array.isArray(stored.chat.facts)) progress.chat.facts = stored.chat.facts.filter((f) => typeof f === "string");
      progress.chat.ended = stored.chat.ended === true;
    }
    if (stored.debrief && typeof stored.debrief === "object") progress.debrief = stored.debrief;
    if (stored.quiz && typeof stored.quiz === "object" && !Array.isArray(stored.quiz)) {
      for (const [qid, answer] of Object.entries(stored.quiz)) {
        if (Number.isInteger(answer)) progress.quiz[qid] = answer;
      }
    }
    if (Number.isFinite(stored.score)) progress.score = stored.score;
    if (typeof stored.completedAt === "string") progress.completedAt = stored.completedAt;
  }
  return record;
}
