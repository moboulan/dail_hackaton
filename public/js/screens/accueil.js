import { MODULE } from "../content.js";
import { esc } from "../html.js";

export default {
  title: "Accueil",

  render({ state, notice }) {
    const label = state.started ? "Reprendre la formation" : "Commencer";
    return `
      <section class="intro">
        <p class="eyebrow">Formation continue · Officine</p>
        <h1 tabindex="-1">${esc(MODULE.title)}</h1>
        ${notice ? `<p class="notice">${esc(notice)}</p>` : ""}
        <p class="lead">Entraînez-vous à conseiller une cliente : connaître le produit, poser les bonnes questions, expliquer simplement et proposer un complément seulement s'il l'aide.</p>
        <ul class="facts">
          <li><strong>${esc(MODULE.duration)}.</strong> Vous pouvez vous arrêter et reprendre plus tard.</li>
          <li><strong>4 étapes :</strong> préparation, échange avec une cliente, bilan et quiz, résultat.</li>
          <li><strong>Réussite à ${MODULE.passMark} % :</strong> vous pourrez imprimer une attestation.</li>
        </ul>
        <button class="button primary" type="button" data-action="start">${label}</button>
        <div class="privacy">
          <h2>Vos données</h2>
          <p><strong>Enregistré :</strong> votre progression, uniquement dans ce navigateur.</p>
          <p><strong>Envoyé :</strong> vos messages pendant l'échange, à un service d'intelligence artificielle qui joue la cliente. Les numéros de téléphone et les e-mails sont retirés avant l'envoi.</p>
          <p><strong>À éviter :</strong> n'écrivez aucune donnée réelle de patient.</p>
        </div>
      </section>`;
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
