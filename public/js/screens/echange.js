// Temporary: the real conversation is built in spec step 4.

import { esc } from "../html.js";

export default {
  title: "Échange",

  render({ module }) {
    return `
      <h1 tabindex="-1">Échange avec ${esc(module.customer)}</h1>
      <p class="notice">En construction : la conversation arrive à la prochaine étape du développement.</p>`;
  },

  actions: {},
};
