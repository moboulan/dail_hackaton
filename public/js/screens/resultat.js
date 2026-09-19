// The module's outcome. The module score lives in one place (the cachet, or the large figure when
// not validated); the two parts are bars against the 80 % mark; then what to rework, the quiz
// corrections and the printable attestation.

import { CRITERIA, PASS_MARK, PROFILE } from "../content.js";
import { esc, icon, stamp } from "../html.js";
import { freshProgress } from "../store.js";
import { quizQuestions, quizScore } from "../quiz-questions.js";

// The cachet is pressed once: on the first view after the quiz is submitted.
const pressed = new Set();

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function bar(label, value) {
  return `
    <li class="part">
      <span class="part-label">${label}</span>
      <span class="part-track" aria-hidden="true"><span class="part-fill part-${value >= PASS_MARK ? "ok" : "low"}" data-value="${value}"></span></span>
      <span class="part-value">${value}&nbsp;%</span>
    </li>`;
}

// The Bilan criteria that were not fully met, in the Bilan's order, with their level mark.
function toRework(debrief) {
  return debrief.criteria
    .filter((c) => c.score !== null && c.score < 2)
    .map((c) => `<li class="level-${c.score}">${icon(c.score === 0 ? "cross" : "partial")}${esc(CRITERIA.find((item) => item.id === c.id).title)}</li>`);
}

function correction(q, answer, number) {
  const right = answer === q.correct;
  const given = q.options[answer]?.text ?? "Sans réponse";
  return `
    <li class="correction ${right ? "is-right" : "is-wrong"}">
      <p class="correction-question"><span class="question-number">${number}</span>${esc(q.question)}</p>
      <p class="correction-answer">${icon(right ? "check" : "cross")}<span class="visually-hidden">${right ? "Juste" : "Faux"} : </span>${esc(given)}</p>
      ${right ? "" : `<p class="correction-right">Réponse juste : ${esc(q.options[q.correct].text)}</p>`}
      <p class="correction-why">${esc(q.options[q.correct].why)}</p>
    </li>`;
}

export default {
  title: "Résultat",

  render({ module, progress }) {
    const questions = quizQuestions(module, progress);
    const passed = progress.score >= PASS_MARK;
    const key = `${module.id}:${progress.completedAt}`;
    const press = passed && !pressed.has(key);
    if (press) pressed.add(key);
    const rework = toRework(progress.debrief);

    return `
      <section class="outcome ${passed ? "is-passed" : "is-short"}">
        ${passed
          ? stamp(progress.score, progress.completedAt, { pressing: press })
          : `<p class="outcome-score"><span>${progress.score}</span><small>%</small><span class="outcome-mark">${PASS_MARK} % requis</span></p>`}
        <div class="outcome-body">
          <h1 tabindex="-1">${passed ? "Module validé" : "Pas encore validé"}</h1>
          ${!passed && rework.length ? `<div class="rework"><p class="speaker">À retravailler</p><ul>${rework.join("")}</ul></div>` : ""}
          ${passed ? `<p>${esc(module.title)} rejoint votre licence ${PROFILE.licenceYear}.</p>` : ""}
          <div class="result-actions">
            ${passed
              ? `<button class="button primary" type="button" data-action="print">Imprimer l'attestation</button>
                 <a class="button" href="#accueil">Tableau de bord</a>`
              : `<button class="button primary" type="button" data-action="restart">Recommencer le module</button>`}
          </div>
        </div>
      </section>

      <ul class="parts" aria-label="Détail du score, ${PASS_MARK} % requis">
        ${bar("Échange", progress.debrief.score)}
        ${bar("Quiz", quizScore(questions, progress.quiz))}
      </ul>

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

  // Bar widths are set here: the CSP forbids inline style attributes.
  afterRender() {
    document.querySelectorAll(".part-fill").forEach((fill) => {
      fill.style.width = `${fill.dataset.value}%`;
    });
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
