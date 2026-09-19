// 3 questions on what the pharmacist missed in the conversation. Answers are chosen freely,
// then submitted once; corrections and scores are on the Résultat step.

import { esc } from "../html.js";
import { quizQuestions, quizScore } from "../quiz-questions.js";

function question(q, answers, number, locked) {
  const options = q.options.map((option, index) => `
      <label class="option">
        <input type="radio" name="${esc(q.id)}" value="${index}" id="${esc(q.id)}-${index}"
          data-change="answer" data-question="${esc(q.id)}" ${answers[q.id] === index ? "checked" : ""} ${locked ? "disabled" : ""}>
        <span>${esc(option.text)}</span>
      </label>`).join("");
  return `
    <fieldset class="question">
      <legend><span class="question-number">${number}</span>${esc(q.question)}</legend>
      ${options}
    </fieldset>`;
}

export default {
  title: "Quiz",

  render({ module, progress }) {
    const questions = quizQuestions(module, progress);
    const locked = progress.score !== null;
    const missing = questions.filter((q) => progress.quiz[q.id] === undefined).length;
    return `
      <h1 tabindex="-1" class="visually-hidden">Quiz</h1>
      <ol class="questions">${questions.map((q, i) => `<li>${question(q, progress.quiz, i + 1, locked)}</li>`).join("")}</ol>
      ${locked
        ? `<a class="button primary next" href="#${module.id}/resultat">Voir le résultat</a>`
        : `<div class="submit-zone">
            <button class="button primary" type="button" data-action="submit" ${missing ? 'aria-describedby="quiz-left"' : ""}>Valider mes réponses</button>
            ${missing ? `<p id="quiz-left" class="hint">${missing === 1 ? "Encore 1 question." : `Encore ${missing} questions.`}</p>` : ""}
          </div>`}`;
  },

  actions: {
    answer(input, ctx) {
      ctx.update(
        (progress) => {
          progress.quiz[input.dataset.question] = Number(input.value);
        },
        { focus: `#${CSS.escape(input.id)}` },
      );
    },

    submit(_el, ctx) {
      const { module, progress } = ctx;
      const questions = quizQuestions(module, progress);
      const unanswered = questions.find((q) => progress.quiz[q.id] === undefined);
      if (unanswered) {
        document.getElementById(`${unanswered.id}-0`).focus();
        ctx.announce("Répondez aux 3 questions avant de valider.");
        return;
      }
      ctx.update((p) => {
        p.score = Math.round((p.debrief.score + quizScore(questions, p.quiz)) / 2);
        p.completedAt = new Date().toISOString();
      });
      ctx.go("resultat");
    },
  },
};
