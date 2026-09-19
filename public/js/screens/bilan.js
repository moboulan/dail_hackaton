// Debrief of the conversation: computed once by the AI grader, then stored. No score here:
// scores belong to the Résultat. Criteria the situation did not call for are not shown.

import { CRITERIA, REFLEXES } from "../content.js";

const REFLEX_IDS = new Set(REFLEXES.map((r) => r.id));
import { requestDebrief } from "../api.js";
import { esc, icon } from "../html.js";

// By score 0, 1, 2: a word and a mark, so the level never depends on colour alone.
const LEVELS = [
  { word: "Manqué", mark: "cross" },
  { word: "À améliorer", mark: "partial" },
  { word: "Réussi", mark: "check" },
];

let loading = false;

// A real moment of the conversation, with who said what.
function exchange(result, customer) {
  if (!result.exchange) return "";
  const { before, said } = result.exchange;
  return `
      <div class="excerpt">
        ${before ? `<p class="excerpt-line"><span class="speaker">${esc(customer)}</span>${esc(before)}</p>` : ""}
        <p class="excerpt-line is-you"><span class="speaker">Vous</span>${esc(said)}</p>
      </div>`;
}

function criterionItem(result, customer, shown) {
  const { title } = CRITERIA.find((c) => c.id === result.id);
  const level = LEVELS[result.score];
  return `
    <li class="criterion level-${result.score}">
      <p class="criterion-level">${icon(level.mark)}${level.word}</p>
      <h2 class="criterion-title">${esc(title)}</h2>
      <p class="criterion-comment">${esc(result.comment)}</p>
      ${shown.has(result.exchange?.said) ? "" : exchange(result, customer)}
      ${result.better ? `<p class="better"><span class="speaker">Vous auriez pu dire</span>${esc(result.better)}</p>` : ""}
    </li>`;
}

// Criteria the situation called for; an exchange quoted by several criteria is shown once.
function criteriaList(debrief, customer) {
  const shown = new Set();
  return debrief.criteria
    .filter((c) => c.score !== null)
    .map((c) => {
      const item = criterionItem(c, customer, shown);
      if (c.exchange) shown.add(c.exchange.said);
      return item;
    })
    .join("");
}

// Feed the Mémo: a missed réflexe keeps its better phrasing as a hint, a mastered one loses it.
function rememberForMemo(state, debrief) {
  for (const c of debrief.criteria) {
    if (!REFLEX_IDS.has(c.id) || c.score === null) continue;
    if (c.score === 2) delete state.memoHints[c.id];
    else if (c.better) state.memoHints[c.id] = c.better;
  }
}

async function grade(ctx) {
  const { module, progress } = ctx;
  loading = true;
  try {
    const debrief = await requestDebrief(module, progress.chat.messages);
    loading = false;
    progress.debrief = debrief;
    rememberForMemo(ctx.state, debrief);
    ctx.save();
    if (document.getElementById("bilan-pending")) ctx.update(() => {}, { focus: "h1" });
  } catch (error) {
    loading = false;
    const pending = document.getElementById("bilan-pending");
    if (pending) {
      pending.innerHTML = `${esc(error.message)} <button class="link-button" type="button" data-action="retry">Réessayer</button>`;
      pending.classList.add("is-error");
    }
  }
}

export default {
  title: "Bilan",

  render({ module, progress }) {
    const debrief = progress.debrief;
    if (!debrief) {
      return `
        <h1 tabindex="-1" class="visually-hidden">Bilan</h1>
        <div class="skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <p id="bilan-pending" class="pending" role="status">Analyse de votre échange…</p>`;
    }
    return `
      <div class="bilan-head">
        <h1 tabindex="-1">Votre échange avec ${esc(module.customer)}</h1>
        ${debrief.summary ? `<p class="bilan-summary">${esc(debrief.summary)}</p>` : ""}
      </div>
      <ol class="criteria">${criteriaList(debrief, module.customer)}</ol>
      <button class="button primary next" type="button" data-action="to-quiz">Passer au quiz</button>`;
  },

  afterRender(ctx) {
    if (!ctx.progress.debrief && !loading) grade(ctx);
  },

  actions: {
    retry(_el, ctx) {
      const pending = document.getElementById("bilan-pending");
      pending.textContent = "Analyse de votre échange…";
      pending.classList.remove("is-error");
      grade(ctx);
    },

    "to-quiz"(_el, ctx) {
      ctx.go("quiz");
    },
  },
};
