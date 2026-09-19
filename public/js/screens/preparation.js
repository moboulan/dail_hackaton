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
        <strong>${right ? "Oui." : "Non."}</strong>
        ${esc(check.options[chosen].why)}
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
      <h1 tabindex="-1">Préparation</h1>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ""}
      <p class="scenario">${esc(SCENARIO.summary)}</p>

      <h2>Produits</h2>
      <div class="sheets">${PRODUCTS.map(productSheet).join("")}</div>
      <p class="doctor"><strong>Médecin si :</strong> ${esc(SEE_A_DOCTOR)}.</p>

      <h2>Les 4 réflexes</h2>
      <ol class="reflexes">
        ${REFLEXES.map((r) => `<li><strong>${esc(r.title)}</strong> <span>${esc(r.body)}</span></li>`).join("")}
      </ol>

      <h2>2 questions</h2>
      ${CHECKS.map((check) => renderCheck(check, state)).join("")}

      <div class="next">
        ${done ? "" : `<p class="hint" id="prep-hint">Réussissez les 2 questions pour continuer.</p>`}
        <button class="button primary" type="button" data-action="continue" ${done ? "" : 'aria-describedby="prep-hint"'}>Continuer</button>
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
      ctx.announce((index === check.correct ? "Oui. " : "Non. ") + check.options[index].why);
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
      ctx.announce("Il reste une question à réussir.");
    },
  },
};
