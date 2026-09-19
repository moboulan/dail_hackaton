// Who comes in, and what is on the shelf. Then straight to the conversation.

import { esc, productCard } from "../html.js";

export default {
  title: "Brief",

  render({ module }) {
    return `
      <h1 tabindex="-1">${esc(module.title)}</h1>
      <p class="scenario">${esc(module.brief)}</p>

      <h2>Votre rayon</h2>
      <div class="sheets">${module.products.map(productCard).join("")}</div>

      <button class="button primary next" type="button" data-action="start">Commencer l'échange</button>`;
  },

  actions: {
    start(_el, ctx) {
      ctx.update((progress) => {
        progress.started = true;
      });
      ctx.go("echange");
    },
  },
};
