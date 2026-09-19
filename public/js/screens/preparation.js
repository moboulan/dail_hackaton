import { CHECKS, PRODUCTS, REFLEXES, SCENARIO, SEE_A_DOCTOR } from "../content.js";
import { esc, productSheet } from "../html.js";
import { preparationDone } from "../steps.js";

function renderCheck(check, state) {
  const chosen = state.checks[check.id];
  const answered = Number.isInteger(chosen) && check.options[chosen];
  const right = chosen === check.correct;
  const options = check.options
    .map((option, index) => {
      const mark = chosen === index ? (right ? " is-right" : " is-wrong") : "";
      return `
        <label class="option${mark}">
          <input type="radio" name="${esc(check.id)}" value="${index}" id="${esc(check.id)}-${index}"
            data-change="answer" data-check="${esc(check.id)}" ${chosen === index ? "checked" : ""}>
          <span>${esc(option.text)}</span>
        </label>`;
    })
    .join("");
  const feedback = answered
    ? `<p class="feedback ${right ? "is-right" : "is-wrong"}">
        <strong>${right ? "Bonne réponse." : "Pas tout à fait."}</strong>
        ${esc(check.options[chosen].why)}${right ? "" : " Choisissez une autre réponse."}
       </p>`
    : "";
  return `
    <fieldset class="check" id="check-${esc(check.id)}" tabindex="-1">
      <legend>${esc(check.question)}</legend>
      ${options}
      ${feedback}
    </fieldset>`;
}

export default {
  title: "Préparation",

  render({ state, notice }) {
    const done = preparationDone(state);
    return `
      <h1 tabindex="-1">Préparez l'échange</h1>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ""}

      <section>
        <h2>La situation</h2>
        <p class="scenario">${esc(SCENARIO.summary)}</p>
      </section>

      <section>
        <h2>Ce que vous vendez</h2>
        <div class="sheets">${PRODUCTS.map(productSheet).join("")}</div>
        <p class="doctor"><strong>Orientez vers un médecin</strong> en cas de ${esc(SEE_A_DOCTOR)}.</p>
      </section>

      <section>
        <h2>Les 4 réflexes</h2>
        <ol class="reflexes">
          ${REFLEXES.map((r) => `<li><strong>${esc(r.title)}</strong><span>${esc(r.body)}</span></li>`).join("")}
        </ol>
      </section>

      <section>
        <h2>Vérifiez-vous</h2>
        ${CHECKS.map((check) => renderCheck(check, state)).join("")}
      </section>

      <div class="next">
        <p class="hint" id="prep-hint">${done ? "Tout est prêt. Mme Naïma vous attend." : "Réussissez les deux questions pour passer à l'échange."}</p>
        <button class="button primary" type="button" data-action="continue" aria-describedby="prep-hint">Continuer vers l'échange</button>
      </div>`;
  },

  actions: {
    answer(input, ctx) {
      const check = CHECKS.find((c) => c.id === input.dataset.check);
      const index = Number(input.value);
      ctx.update(
        (state) => {
          state.checks[check.id] = index;
        },
        { focus: `#${check.id}-${index}` },
      );
      ctx.announce(index === check.correct ? "Bonne réponse." : "Pas tout à fait. " + check.options[index].why);
    },

    continue(_el, ctx) {
      if (preparationDone(ctx.state)) {
        ctx.navigate("echange");
        return;
      }
      const pending = CHECKS.find((c) => ctx.state.checks[c.id] !== c.correct);
      const fieldset = document.getElementById(`check-${pending.id}`);
      fieldset.scrollIntoView({ block: "center" });
      fieldset.focus();
      ctx.announce("Il reste une question à réussir avant l'échange.");
    },
  },
};
