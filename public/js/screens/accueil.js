// Dashboard: licence status, the one module, attestations. Nothing to read, one action.

import { MODULE, PROFILE } from "../content.js";
import { esc } from "../html.js";
import { STEPS } from "../steps.js";

function moduleStatus(state) {
  if (!state.started) return { label: "À faire", action: "Commencer" };
  const position = STEPS.findIndex((s) => s.id === state.lastStep) + 1;
  return { label: `En cours · étape ${position} sur ${STEPS.length}`, action: "Reprendre" };
}

export default {
  title: "Tableau de bord",

  render({ state, notice }) {
    const status = moduleStatus(state);
    return `
      <h1 tabindex="-1">Bonjour, ${esc(PROFILE.name)}</h1>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ""}
      <p class="licence">Licence ${PROFILE.licenceYear} : <strong>0 / ${PROFILE.modulesRequired}</strong> module validé</p>

      <article class="module-card">
        <div>
          <h2>${esc(MODULE.title)}</h2>
          <p class="module-meta">${esc(MODULE.duration)} · ${esc(status.label)}</p>
        </div>
        <button class="button primary" type="button" data-action="start">${status.action}</button>
      </article>

      <p class="attestations">Attestations : aucune</p>`;
  },

  actions: {
    start(_el, ctx) {
      ctx.update((state) => {
        state.started = true;
      });
      ctx.navigate(ctx.state.lastStep);
    },
  },
};
