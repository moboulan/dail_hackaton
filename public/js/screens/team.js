// Équipe: the pharmacy manager's view of everyone using this computer. One line per person, one
// column per module with their level; add a member, open someone's session, write cases.

import { MODULES, PASS_MARK } from "../content.js";
import { esc, icon } from "../html.js";
import { allModules } from "../modules.js";
import { freshProgress } from "../store.js";

// A person's level on one module, as a word and a mark (never colour alone).
function level(progress = freshProgress()) {
  if (progress.score !== null && progress.score >= PASS_MARK) return `<span class="lvl is-ok">${icon("check")}${progress.score}&nbsp;%</span>`;
  if (progress.score !== null) return `<span class="lvl is-low">${progress.score}&nbsp;%</span>`;
  if (progress.started) return `<span class="lvl">En cours</span>`;
  return `<span class="lvl is-none">À faire</span>`;
}

export default {
  title: "Équipe",

  render({ pharmacy, state }) {
    const modules = allModules(state);
    const rows = pharmacy.staff.map((person) => {
      const record = pharmacy.records[person.id];
      const validated = MODULES.filter((m) => (record.modules[m.id]?.score ?? -1) >= PASS_MARK).length;
      const current = person.id === pharmacy.current;
      return `
        <tr>
          <th scope="row" class="col-module">${esc(person.name)}${current ? '<span class="col-customer">Session ouverte</span>' : ""}</th>
          <td class="col-licence"><strong>${validated}</strong>/${MODULES.length}</td>
          ${modules.map((m) => `<td>${level(record.modules[m.id])}</td>`).join("")}
          <td class="col-action">${current
            ? `<a class="button" href="#accueil">Continuer</a>`
            : `<button class="button" type="button" data-action="open" data-staff="${esc(person.id)}" aria-label="Ouvrir la session de ${esc(person.name)}">Ouvrir</button>`}</td>
        </tr>`;
    }).join("");

    return `
      <h1 tabindex="-1">Équipe</h1>
      <p class="editor-lead">Le niveau de chaque membre de la pharmacie. Les données restent sur cet ordinateur.</p>
      <div class="table-scroll">
        <table class="register team">
          <thead>
            <tr><th scope="col">Nom</th><th scope="col">Licence</th>${modules.map((m) => `<th scope="col">${esc(m.title)}</th>`).join("")}<th scope="col"><span class="visually-hidden">Action</span></th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <form class="add-staff" data-submit="add">
        <label class="field" for="f-staff">
          <span class="field-label">Ajouter un membre</span>
          <input id="f-staff" name="name" type="text" maxlength="40" required placeholder="Dr Bennani">
        </label>
        <button class="button primary" type="submit">Ajouter</button>
      </form>

      <section class="cases">
        <h2 class="register-title">Cas de la pharmacie</h2>
        ${state.customModules.length
          ? `<ul class="case-list">${state.customModules.map((c) => `<li><strong>${esc(c.title)}</strong> <span>${esc(c.customer)}</span></li>`).join("")}</ul>`
          : `<p class="field-hint">Aucun cas pour l'instant. Écrivez une situation que votre équipe rencontre au comptoir.</p>`}
        <a class="button primary" href="#nouveau-cas">Créer un cas</a>
      </section>`;
  },

  actions: {
    open(button, ctx) {
      ctx.switchStaff(button.dataset.staff);
      ctx.navigate("accueil");
    },

    add(form, ctx) {
      const name = new FormData(form).get("name").trim();
      if (!name) return;
      ctx.addStaff(name);
      ctx.update(() => {}, { focus: "#f-staff" });
      ctx.announce(`${name} a été ajouté à l'équipe.`);
    },
  },
};
