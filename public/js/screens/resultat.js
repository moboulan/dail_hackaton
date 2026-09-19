// The module's outcome: the cachet (or what to redo), the two scores, the quiz corrections,
// and the printable attestation.

import { PASS_MARK, PROFILE } from "../content.js";
import { esc, icon, stamp } from "../html.js";
import { freshProgress } from "../store.js";
import { quizQuestions, quizScore } from "../quiz-questions.js";

// The cachet is pressed once: on the first view after the quiz is submitted.
const pressed = new Set();

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function correction(q, answer, number) {
  const right = answer === q.correct;
  return `
    <li class="correction ${right ? "is-right" : "is-wrong"}">
      <p class="correction-question"><span class="question-number">${number}</span>${esc(q.question)}</p>
      <p class="correction-answer">${icon(right ? "check" : "cross")}<span class="visually-hidden">${right ? "Juste" : "Faux"} : </span>${esc(q.options[answer].text)}</p>
      ${right ? "" : `<p class="correction-right">Réponse juste : ${esc(q.options[q.correct].text)}</p>`}
      <p class="correction-why">${esc(q.options[q.correct].why)}</p>
    </li>`;
}

export default {
  title: "Résultat",

  render({ module, progress }) {
    const questions = quizQuestions(module, progress);
    const passed = progress.score >= PASS_MARK;
    const press = passed && !pressed.has(`${module.id}:${progress.completedAt}`);
    if (press) pressed.add(`${module.id}:${progress.completedAt}`);

    return `
      <section class="outcome ${passed ? "is-passed" : ""}">
        ${passed ? stamp(progress.score, progress.completedAt, { pressing: press }) : ""}
        <div class="outcome-body">
          <h1 tabindex="-1">${passed ? "Module validé" : `Pas encore validé : ${progress.score}&nbsp;%`}</h1>
          <p>${passed ? "Votre attestation est prête." : `Il faut ${PASS_MARK} % pour valider le module.`}</p>
          <div class="result-actions">
            ${passed
              ? `<button class="button primary" type="button" data-action="print">Imprimer l'attestation</button>
                 <a class="button" href="#accueil">Tableau de bord</a>`
              : `<button class="button primary" type="button" data-action="restart">Recommencer le module</button>`}
          </div>
        </div>
      </section>

      <table class="scores">
        <tbody>
          <tr><th scope="row">Échange</th><td>${progress.debrief.score}&nbsp;%</td></tr>
          <tr><th scope="row">Quiz</th><td>${quizScore(questions, progress.quiz)}&nbsp;%</td></tr>
          <tr class="scores-total"><th scope="row">Module</th><td>${progress.score}&nbsp;%</td></tr>
        </tbody>
      </table>

      <h2 class="register-title">Corrections du quiz</h2>
      <ol class="corrections">${questions.map((q, i) => correction(q, progress.quiz[q.id], i + 1)).join("")}</ol>

      ${passed ? `
      <section class="attestation" aria-hidden="true">
        <p class="attestation-brand">BP Learning · Formation continue</p>
        <h2>Attestation de formation</h2>
        <p><strong>${esc(PROFILE.name)}</strong> a validé le module « ${esc(module.title)} »</p>
        <p>le ${formatDate(progress.completedAt)}, avec un score de ${progress.score} %.</p>
        ${stamp(progress.score, progress.completedAt)}
        <p class="attestation-note">Formation sur cas et produits fictifs.</p>
      </section>` : ""}`;
  },

  actions: {
    print() {
      window.print();
    },

    restart(_el, ctx) {
      ctx.update((progress) => {
        Object.assign(progress, freshProgress());
      });
      ctx.go("brief");
    },
  },
};
