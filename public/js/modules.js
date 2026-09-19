// The modules a pharmacist can take: the built-in ones plus the cases the pharmacy wrote in the
// editor (saved in this browser). Custom cases use the generic quiz and have no live product
// verdicts; `custom` carries the raw case the server needs to play and grade it.

import { GENERIC_QUIZ, MODULES } from "./content.js";

export function customModule(raw) {
  return {
    id: raw.id,
    title: raw.title,
    duration: "10 min",
    customer: raw.customer,
    brief: raw.brief,
    products: raw.products,
    quiz: GENERIC_QUIZ,
    exclusions: [],
    confirmations: [],
    custom: raw,
  };
}

export function allModules(state) {
  return [...MODULES, ...state.customModules.map(customModule)];
}

export function findModule(id, state) {
  return allModules(state).find((m) => m.id === id);
}
