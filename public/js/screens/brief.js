// Who comes in, and what is on the shelf. Then straight to the conversation.

import { esc, productLine } from "../html.js";

export default {
  title: "Brief",

  render({ module }) {
    return `
      <h1 tabindex="-1">${esc(module.title)}</h1>
      <p class="situation">${esc(module.brief)}</p>

      <h2 class="register-title">Votre rayon</h2>
      <ul class="products">${module.products.map((product) => productLine(product)).join("")}</ul>

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
