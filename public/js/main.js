import * as store from "./store.js";
import { STEPS, furthestUnlocked, isDone, isUnlocked, lockReason } from "./steps.js";
import accueil from "./screens/accueil.js";
import preparation from "./screens/preparation.js";
import echange from "./screens/echange.js";

const SCREENS = { accueil, preparation, echange };

const main = document.getElementById("main");
const stepBar = document.getElementById("steps");
const status = document.getElementById("status");
const storageWarning = document.getElementById("storage-warning");
const resetZone = document.getElementById("reset");

let state = store.load();
let current = "accueil";

// Shared with every screen.
const ctx = {
  get state() {
    return state;
  },
  notice: "",
  update(change, { focus } = {}) {
    change(state);
    persist();
    renderScreen();
    if (focus) main.querySelector(focus)?.focus();
  },
  navigate(id) {
    if (location.hash === `#${id}`) show(id, { moveFocus: true });
    else location.hash = id; // triggers hashchange, which calls show()
  },
  announce,
};

function persist() {
  store.save(state);
  storageWarning.hidden = store.storageAvailable();
}

// Screen readers read #status; clearing first makes a repeated message be read again.
function announce(message) {
  status.textContent = "";
  window.setTimeout(() => {
    status.textContent = message;
  }, 50);
}

function defaultRoute() {
  return state.started ? state.lastStep : "accueil";
}

// The furthest step that is both unlocked and already built.
function fallbackRoute() {
  const id = furthestUnlocked(state);
  return SCREENS[id] ? id : "accueil";
}

function show(requested, { moveFocus }) {
  const askedExplicitly = Boolean(SCREENS[requested]);
  let id = askedExplicitly ? requested : defaultRoute();
  ctx.notice = "";
  if (!SCREENS[id] || !isUnlocked(id, state)) {
    // Explain only when the pharmacist asked for this step; a silent resume needs no message.
    if (askedExplicitly) ctx.notice = lockReason(id);
    id = fallbackRoute();
  }
  if (location.hash !== `#${id}`) history.replaceState(null, "", `#${id}`);

  current = id;
  if (id !== "accueil") {
    state.lastStep = id;
    persist();
  }
  renderScreen();
  renderResetLink();
  if (moveFocus) {
    window.scrollTo(0, 0);
    main.querySelector("h1")?.focus();
  }
}

function renderScreen() {
  const screen = SCREENS[current];
  main.innerHTML = screen.render(ctx);
  document.title = `${screen.title} · BP Learning`;
  renderStepBar();
}

function renderStepBar() {
  if (current === "accueil") {
    stepBar.hidden = true;
    return;
  }
  stepBar.hidden = false;
  const position = STEPS.findIndex((s) => s.id === current) + 1;
  const items = STEPS.map((step, index) => {
    const number = `<span class="step-number">${index + 1}</span>`;
    const label = `<span class="step-label-text">${step.label}</span>`;
    if (step.id === current) {
      return `<li class="is-current"><span aria-current="step">${number}${label}</span></li>`;
    }
    if (isUnlocked(step.id, state)) {
      const done = isDone(step.id, state) ? `<span class="visually-hidden"> (terminé)</span>` : "";
      return `<li class="is-open"><a href="#${step.id}">${number}${label}${done}</a></li>`;
    }
    return `<li class="is-locked"><span>${number}${label}<span class="visually-hidden"> (pas encore disponible)</span></span></li>`;
  }).join("");
  stepBar.innerHTML = `
    <p class="step-count">Étape ${position} sur ${STEPS.length}</p>
    <ol>${items}</ol>`;
}

// One listener per event type for the whole page, attached once.
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (RESET_ACTIONS[action]) return RESET_ACTIONS[action]();
  SCREENS[current].actions[action]?.(target, ctx);
});

document.addEventListener("change", (event) => {
  const target = event.target.closest("[data-change]");
  if (target) SCREENS[current].actions[target.dataset.change]?.(target, ctx);
});

window.addEventListener("hashchange", () => show(location.hash.slice(1), { moveFocus: true }));

// Reset lives in the footer on every screen and always asks first, inside the page.
const RESET_ACTIONS = {
  "reset-ask"() {
    resetZone.innerHTML = `
      <p id="reset-question">Effacer toute votre progression et recommencer au début ?</p>
      <button class="button danger" type="button" data-action="reset-confirm" aria-describedby="reset-question">Oui, tout effacer</button>
      <button class="button" type="button" data-action="reset-cancel">Annuler</button>`;
    resetZone.querySelector("[data-action=reset-cancel]").focus();
  },
  "reset-cancel"() {
    renderResetLink();
    resetZone.querySelector("button").focus();
  },
  "reset-confirm"() {
    store.clear();
    state = store.freshState();
    ctx.navigate("accueil");
    announce("Votre progression a été effacée.");
  },
};

// Offered only once there is progress to erase.
function renderResetLink() {
  resetZone.innerHTML = state.started
    ? `<button class="link-button" type="button" data-action="reset-ask">Recommencer depuis le début</button>`
    : "";
}

renderResetLink();
storageWarning.hidden = store.storageAvailable();
show(location.hash.slice(1), { moveFocus: false });
