// Debrief of the conversation: computed once by the AI grader, then stored.

import { CRITERIA } from "../content.js";
import { requestDebrief } from "../api.js";
import { esc, icon } from "../html.js";

// By score 0, 1, 2: a word and a mark, so the level never depends on colour alone.
const LEVELS = [
  { word: "Manqué", mark: "cross" },
  { word: "À améliorer", mark: "partial" },
  { word: "Réussi", mark: "check" },
];

let loading = false;

function criterionItem(result) {
  const { title } = CRITERIA.find((c) => c.id === result.id);
  const level = LEVELS[result.score];
  return `
    <li class="criterion level-${result.score}">
      <p class="criterion-level">${icon(level.mark)}${level.word}</p>
      <h2 class="criterion-title">${esc(title)}</h2>
      <p class="criterion-comment">${esc(result.comment)}</p>
      ${result.quote ? `<p class="said">Vous avez dit : « ${esc(result.quote)} »</p>` : ""}
      ${result.better ? `<p class="better">Vous auriez pu dire : « ${esc(result.better)} »</p>` : ""}
    </li>`;
}

async function grade(ctx) {
  const { module, progress } = ctx;
  loading = true;
  try {
    const debrief = await requestDebrief(module, progress.chat.messages);
    loading = false;
    progress.debrief = debrief;
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

  render({ progress }) {
    const debrief = progress.debrief;
    if (!debrief) {
      return `
        <h1 tabindex="-1" class="visually-hidden">Bilan</h1>
        <div class="skeleton" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <p id="bilan-pending" class="pending" role="status">Analyse de votre échange…</p>`;
    }
    return `
      <div class="bilan-head">
        <h1 tabindex="-1">Votre échange <span class="bilan-score">${debrief.score}&nbsp;%</span></h1>
        ${debrief.summary ? `<p class="bilan-summary">${esc(debrief.summary)}</p>` : ""}
      </div>
      <ol class="criteria">${debrief.criteria.map(criterionItem).join("")}</ol>
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
