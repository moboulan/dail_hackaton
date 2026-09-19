// The register: licence status and one numbered line per module, one action per line.
// A validated line carries the officine's cachet instead of a status word.

import { MODULES, PASS_MARK, PROFILE } from "../content.js";
import { esc, stamp } from "../html.js";
import { STEPS, furthestUnlocked } from "../steps.js";

function passed(progress) {
  return progress.score !== null && progress.score >= PASS_MARK;
}

function status(progress) {
  if (passed(progress)) return { cell: stamp(progress.score, progress.completedAt), action: "Revoir" };
  if (progress.score !== null) return { cell: `<span class="state is-retry">${progress.score} %, à repasser</span>`, action: "Réessayer" };
  if (!progress.started) return { cell: `<span class="state">À faire</span>`, action: "Commencer" };
  const step = STEPS.find((s) => s.id === furthestUnlocked(progress));
  return { cell: `<span class="state is-open">En cours : ${esc(step.label)}</span>`, action: "Reprendre" };
}

export default {
  title: "Tableau de bord",

  render({ state }) {
    const validated = MODULES.filter((m) => passed(state.modules[m.id])).length;
    const rows = MODULES.map((module, index) => {
      const { cell, action } = status(state.modules[module.id]);
      return `
        <tr>
          <td class="col-number">${String(index + 1).padStart(2, "0")}</td>
          <th scope="row" class="col-module">${esc(module.title)}<span class="col-customer">${esc(module.customer)}</span></th>
          <td class="col-duration">${esc(module.duration)}</td>
          <td class="col-state">${cell}</td>
          <td class="col-action"><a class="button${action === "Revoir" ? "" : " primary"}" href="#${module.id}" aria-label="${esc(action)} : ${esc(module.title)}">${esc(action)}</a></td>
        </tr>`;
    }).join("");

    return `
      <div class="register-head">
        <h1 tabindex="-1">Bonjour, ${esc(PROFILE.name)}</h1>
        <p class="licence"><span class="licence-count">${validated}<span class="licence-of">/${MODULES.length}</span></span> modules validés pour la licence ${PROFILE.licenceYear}</p>
      </div>
      <table class="register">
        <thead>
          <tr><th scope="col" class="col-number">N°</th><th scope="col">Module</th><th scope="col" class="col-duration">Durée</th><th scope="col">État</th><th scope="col"><span class="visually-hidden">Action</span></th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  },

  actions: {},
};
