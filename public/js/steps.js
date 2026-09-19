// The guided path: which steps exist, when each one unlocks and when it counts as done.
// Unlocks are derived from the saved answers, never stored, so they cannot drift out of sync.

import { CHECKS } from "./content.js";

export const STEPS = [
  { id: "preparation", label: "Préparation" },
  { id: "echange", label: "Échange" },
  { id: "bilan", label: "Bilan et quiz" },
  { id: "resultat", label: "Résultat" },
];

export function preparationDone(state) {
  return CHECKS.every((check) => state.checks[check.id] === check.correct);
}

export function isUnlocked(id, state) {
  switch (id) {
    case "accueil":
      return true;
    case "preparation":
      return state.started;
    case "echange":
      return state.started && preparationDone(state);
    case "bilan":
      return isUnlocked("echange", state) && state.conversation.ended;
    case "resultat":
      return isUnlocked("bilan", state) && state.quizDone;
    default:
      return false;
  }
}

export function isDone(id, state) {
  switch (id) {
    case "preparation":
      return preparationDone(state);
    case "echange":
      return state.conversation.ended;
    case "bilan":
      return state.quizDone;
    default:
      return false;
  }
}

export function lockReason(id) {
  switch (id) {
    case "preparation":
      return "Cliquez sur « Commencer » pour ouvrir la préparation.";
    case "echange":
      return "L'échange s'ouvre quand les deux questions de la préparation sont réussies.";
    case "bilan":
      return "Le bilan s'ouvre quand vous avez terminé l'échange.";
    case "resultat":
      return "Le résultat s'affiche quand vous avez terminé le quiz.";
    default:
      return "";
  }
}

// The furthest step the pharmacist may open right now.
export function furthestUnlocked(state) {
  const open = STEPS.filter((step) => isUnlocked(step.id, state));
  return open.length ? open[open.length - 1].id : "accueil";
}
