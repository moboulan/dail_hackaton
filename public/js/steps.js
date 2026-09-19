// The 4 steps of a module, when each unlocks and when it counts as done.
// Unlocks are derived from the saved progress, never stored, so they cannot drift out of sync.

export const STEPS = [
  { id: "brief", label: "Brief" },
  { id: "echange", label: "Échange" },
  { id: "bilan", label: "Bilan" },
  { id: "quiz", label: "Quiz" },
];

export const STEP_IDS = new Set(STEPS.map((s) => s.id));

export function isUnlocked(step, progress) {
  switch (step) {
    case "brief":
      return true;
    case "echange":
      return progress.started;
    case "bilan":
      return progress.chat.ended;
    case "quiz":
      return progress.debrief !== null;
    default:
      return false;
  }
}

export function isDone(step, progress) {
  switch (step) {
    case "brief":
      return progress.started;
    case "echange":
      return progress.chat.ended;
    case "bilan":
      return progress.debrief !== null;
    case "quiz":
      return progress.score !== null;
    default:
      return false;
  }
}

export function lockReason(step) {
  switch (step) {
    case "echange":
      return "Lisez d'abord le brief.";
    case "bilan":
      return "Le bilan s'ouvre quand l'échange est terminé.";
    case "quiz":
      return "Le quiz s'ouvre après le bilan.";
    default:
      return "";
  }
}

export function furthestUnlocked(progress) {
  const open = STEPS.filter((s) => isUnlocked(s.id, progress));
  return open[open.length - 1].id;
}
