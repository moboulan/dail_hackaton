// Manager view: every pharmacist's level per module, their licence count and their
// attestations, printable from here.

import { MODULES, PASS_MARK } from "../content.js";
import { attestation, esc, icon, printAttestation } from "../html.js";
import { allModules } from "../modules.js";
import { freshProgress } from "../store.js";

function passed(progress) {
  return progress?.score !== null && progress?.score !== undefined && progress.score >= PASS_MARK;
}

// A person's level on one module, as a word and a mark (never colour alone).
function level(progress = freshProgress()) {
  if (passed(progress)) return `<span class="lvl is-ok">${icon("check")}${progress.score}&nbsp;%</span>`;
  if (progress.score !== null) return `<span class="lvl is-low">${progress.score}&nbsp;%</span>`;
  if (progress.started) return `<span class="lvl">En cours</span>`;
  return `<span class="lvl is-none">À faire</span>`;
}

export default {
  title: "Équipe",

  render({ pharmacy, state }) {
    const modules = allModules(state);
    const sheets = [];
    const rows = pharmacy.staff.map((person) => {
      const record = pharmacy.records[person.id];
      const validated = MODULES.filter((m) => passed(record.modules[m.id])).length;
      const earned = modules.filter((m) => passed(record.modules[m.id]));
      for (const m of earned) sheets.push(attestation(m, record.modules[m.id], person, `${person.id}-${m.id}`));
      const prints = earned.length
        ? earned.map((m) => `<button class="link-button" type="button" data-action="print" data-sheet="${esc(person.id)}-${esc(m.id)}" aria-label="Imprimer l'attestation ${esc(m.title)} de ${esc(person.name)}">${esc(m.title)}</button>`).join(" · ")
        : `<span class="lvl is-none">Aucune</span>`;
      return `
        <tr>
          <th scope="row" class="col-module">${esc(person.name)}</th>
          <td class="col-licence"><strong>${validated}</strong>/${MODULES.length}</td>
          ${modules.map((m) => `<td>${level(record.modules[m.id])}</td>`).join("")}
          <td class="col-prints">${prints}</td>
        </tr>`;
    }).join("");

    return `
      <h1 tabindex="-1">Équipe</h1>
      <p class="editor-lead">Le niveau de chaque pharmacien et ses attestations. Les données restent sur cet ordinateur.</p>
      <div class="table-scroll">
        <table class="register team">
          <thead>
            <tr><th scope="col">Pharmacien</th><th scope="col">Licence</th>${modules.map((m) => `<th scope="col">${esc(m.title)}</th>`).join("")}<th scope="col">Attestations</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      ${sheets.join("")}`;
  },

  actions: {
    print(button) {
      printAttestation(button.dataset.sheet);
    },
  },
};
