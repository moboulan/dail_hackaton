// Licence status and the modules. One action per module.

import { MODULES, PASS_MARK, PROFILE } from "../content.js";
import { esc } from "../html.js";
import { STEPS, furthestUnlocked } from "../steps.js";

function passed(progress) {
  return progress.score !== null && progress.score >= PASS_MARK;
}

function cardStatus(progress) {
  if (passed(progress)) return { label: `Validé · ${progress.score} %`, action: "Revoir" };
  if (progress.score !== null) return { label: `${progress.score} % · à repasser`, action: "Réessayer" };
  if (!progress.started) return { label: "À faire", action: "Commencer" };
  const step = STEPS.find((s) => s.id === furthestUnlocked(progress));
  return { label: `En cours · ${step.label}`, action: "Reprendre" };
}

export default {
  title: "Tableau de bord",

  render({ state, notice }) {
    const validated = MODULES.filter((m) => passed(state.modules[m.id]));
    const cards = MODULES.map((module) => {
      const status = cardStatus(state.modules[module.id]);
      return `
        <li class="module-card">
          <div>
            <h2>${esc(module.title)}</h2>
            <p class="module-meta">${esc(module.duration)} · ${esc(status.label)}</p>
          </div>
          <a class="button primary" href="#${module.id}" aria-label="${esc(status.action)} : ${esc(module.title)}">${esc(status.action)}</a>
        </li>`;
    }).join("");
    return `
      <h1 tabindex="-1">Bonjour, ${esc(PROFILE.name)}</h1>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ""}
      <p class="licence">Licence ${PROFILE.licenceYear} : <strong>${validated.length} / ${MODULES.length}</strong> modules validés</p>
      <ul class="modules">${cards}</ul>`;
  },

  actions: {},
};
