// 3 questions. The first answer to each question counts; the pharmacist can keep trying
// until right. Once all are answered, the module result and the attestation appear below.

import { PASS_MARK, PROFILE } from "../content.js";
import { esc } from "../html.js";
import { freshProgress } from "../store.js";

function allAnswered(module, progress) {
  return module.quiz.every((q) => progress.quiz[q.id]?.length);
}

function quizScore(module, progress) {
  const right = module.quiz.filter((q) => progress.quiz[q.id][0] === q.correct).length;
  return Math.round((right / module.quiz.length) * 100);
}

function question(q, progress) {
  const answers = progress.quiz[q.id] ?? [];
  const chosen = answers[answers.length - 1];
  const answered = chosen !== undefined;
  const right = chosen === q.correct;
  const options = q.options.map((option, index) => {
    const mark = chosen === index ? (right ? " is-right" : " is-wrong") : "";
    return `
      <label class="option${mark}">
        <input type="radio" name="${q.id}" value="${index}" id="${q.id}-${index}"
          data-change="answer" data-question="${q.id}" ${chosen === index ? "checked" : ""}>
        <span>${esc(option.text)}</span>
      </label>`;
  }).join("");
  return `
    <fieldset class="check">
      <legend>${esc(q.question)}</legend>
      ${options}
      ${answered ? `<p class="feedback ${right ? "is-right" : "is-wrong"}"><strong>${right ? "Oui." : "Non."}</strong> ${esc(q.options[chosen].why)}</p>` : ""}
    </fieldset>`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function result(module, progress) {
  const passed = progress.score >= PASS_MARK;
  const detail = `Échange ${progress.debrief.score} % · Quiz ${quizScore(module, progress)} %`;
  if (!passed) {
    return `
      <section class="result" aria-labelledby="result-title">
        <h2 id="result-title">Pas encore validé : ${progress.score} %</h2>
        <p>${detail}. Il faut ${PASS_MARK} % pour valider le module.</p>
        <button class="button primary" type="button" data-action="restart">Recommencer le module</button>
      </section>`;
  }
  return `
    <section class="result is-passed" aria-labelledby="result-title">
      <h2 id="result-title">Module validé : ${progress.score} %</h2>
      <p>${detail}.</p>
      <button class="button primary" type="button" data-action="print">Imprimer l'attestation</button>
      <a class="button" href="#accueil">Tableau de bord</a>
    </section>
    <section class="attestation" aria-hidden="true">
      <p class="attestation-brand">BP Learning · Formation continue</p>
      <h2>Attestation de formation</h2>
      <p><strong>${esc(PROFILE.name)}</strong> a validé le module « ${esc(module.title)} »</p>
      <p>le ${formatDate(progress.completedAt)}, avec un score de ${progress.score} %.</p>
      <p class="attestation-note">Formation sur cas et produits fictifs.</p>
    </section>`;
}

export default {
  title: "Quiz",

  render({ module, progress }) {
    return `
      <h1 tabindex="-1" class="visually-hidden">Quiz</h1>
      ${module.quiz.map((q) => question(q, progress)).join("")}
      ${progress.score !== null ? result(module, progress) : ""}`;
  },

  actions: {
    answer(input, ctx) {
      const { module } = ctx;
      const id = input.dataset.question;
      const index = Number(input.value);
      const q = module.quiz.find((item) => item.id === id);
      const alreadyScored = ctx.progress.score !== null;
      ctx.update(
        (progress) => {
          (progress.quiz[id] ??= []).push(index);
          // The module is scored once, the first time every question has an answer.
          if (progress.score === null && allAnswered(module, progress)) {
            progress.score = Math.round((progress.debrief.score + quizScore(module, progress)) / 2);
            progress.completedAt = new Date().toISOString();
          }
        },
        { focus: `#${id}-${index}` },
      );
      const justScored = !alreadyScored && ctx.progress.score !== null;
      ctx.announce(
        (index === q.correct ? "Oui. " : "Non. ") + q.options[index].why +
        (justScored ? ` Résultat du module : ${ctx.progress.score} %.` : ""),
      );
    },

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
