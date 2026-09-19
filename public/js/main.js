import * as store from "./store.js";
import { moduleById } from "./content.js";
import { STEPS, STEP_IDS, isDone, isUnlocked, lockReason } from "./steps.js";
import dashboard from "./screens/dashboard.js";
import brief from "./screens/brief.js";
import echange from "./screens/echange.js";

// Module steps that exist so far. A step missing here falls back to the furthest built one.
const STEP_SCREENS = { brief, echange };

const main = document.getElementById("main");
const stepBar = document.getElementById("steps");
const backLink = document.getElementById("back");
const status = document.getElementById("status");
const storageWarning = document.getElementById("storage-warning");
const resetZone = document.getElementById("reset");

let state = store.load();
let route = { module: null, step: null }; // module null = dashboard

// Shared with every screen. Inside a module, update() hands over that module's progress.
const ctx = {
  get state() {
    return state;
  },
  get module() {
    return route.module;
  },
  get progress() {
    return route.module ? state.modules[route.module.id] : null;
  },
  notice: "",
  update(change, { focus } = {}) {
    change(route.module ? state.modules[route.module.id] : state);
    persist();
    renderScreen();
    if (focus) main.querySelector(focus)?.focus();
  },
  go(step) {
    navigate(`${route.module.id}/${step}`);
  },
  navigate,
  announce,
};

function navigate(hash) {
  if (location.hash === `#${hash}`) show({ moveFocus: true });
  else location.hash = hash; // triggers hashchange, which calls show()
}

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

// "#rhume/echange" -> module + requested step. Anything unknown -> dashboard.
function parseHash() {
  const [moduleId, step] = location.hash.slice(1).split("/");
  const module = moduleById(moduleId);
  if (!module) return { module: null, step: null };
  return { module, step: STEP_IDS.has(step) ? step : null };
}

// The furthest step that is unlocked and already built.
function furthestBuilt(progress) {
  const open = STEPS.map((s) => s.id).filter((id) => isUnlocked(id, progress) && STEP_SCREENS[id]);
  return open[open.length - 1];
}

function show({ moveFocus }) {
  const parsed = parseHash();
  ctx.notice = "";

  if (!parsed.module) {
    route = { module: null, step: null };
    if (location.hash !== "#accueil") history.replaceState(null, "", "#accueil");
  } else {
    const progress = state.modules[parsed.module.id];
    let step = parsed.step ?? progress.lastStep;
    if (!STEP_SCREENS[step] || !isUnlocked(step, progress)) {
      // Explain only when a step was asked for explicitly; resuming needs no message.
      if (parsed.step) ctx.notice = lockReason(step);
      step = furthestBuilt(progress);
    }
    route = { module: parsed.module, step };
    progress.lastStep = step;
    persist();
    const hash = `#${parsed.module.id}/${step}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  renderScreen();
  renderResetLink();
  if (moveFocus) {
    window.scrollTo(0, 0);
    main.querySelector("h1")?.focus();
  }
}

function currentScreen() {
  return route.module ? STEP_SCREENS[route.step] : dashboard;
}

function renderScreen() {
  const screen = currentScreen();
  main.innerHTML = screen.render(ctx);
  document.title = route.module
    ? `${route.module.title} · ${screen.title} · BP Learning`
    : `${screen.title} · BP Learning`;
  renderStepBar();
}

function renderStepBar() {
  const inModule = Boolean(route.module);
  stepBar.hidden = !inModule;
  backLink.hidden = !inModule;
  if (!inModule) return;

  const progress = state.modules[route.module.id];
  const position = STEPS.findIndex((s) => s.id === route.step) + 1;
  const items = STEPS.map((step, index) => {
    const number = `<span class="step-number">${index + 1}</span>`;
    const label = `<span class="step-label-text">${step.label}</span>`;
    if (step.id === route.step) {
      return `<li class="is-current"><span aria-current="step">${number}${label}</span></li>`;
    }
    if (isUnlocked(step.id, progress) && STEP_SCREENS[step.id]) {
      const done = isDone(step.id, progress) ? `<span class="visually-hidden"> (terminé)</span>` : "";
      return `<li class="is-open"><a href="#${route.module.id}/${step.id}">${number}${label}${done}</a></li>`;
    }
    return `<li class="is-locked"><span>${number}${label}<span class="visually-hidden"> (pas encore disponible)</span></span></li>`;
  }).join("");
  stepBar.innerHTML = `
    <p class="step-count">${route.module.title} · étape ${position} sur ${STEPS.length}</p>
    <ol>${items}</ol>`;
}

// One listener per event type for the whole page, attached once.
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (RESET_ACTIONS[action]) return RESET_ACTIONS[action]();
  currentScreen().actions[action]?.(target, ctx);
});

document.addEventListener("change", (event) => {
  const target = event.target.closest("[data-change]");
  if (target) currentScreen().actions[target.dataset.change]?.(target, ctx);
});

window.addEventListener("hashchange", () => show({ moveFocus: true }));

// Reset lives in the footer and always asks first, inside the page.
const RESET_ACTIONS = {
  "reset-ask"() {
    resetZone.innerHTML = `
      <p id="reset-question">Effacer toute votre progression ?</p>
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
    navigate("accueil");
    announce("Progression effacée.");
  },
};

// Offered only once there is progress to erase.
function renderResetLink() {
  const anyProgress = Object.values(state.modules).some((p) => p.started);
  resetZone.innerHTML = anyProgress
    ? `<button class="link-button" type="button" data-action="reset-ask">Effacer ma progression</button>`
    : "";
}

storageWarning.hidden = store.storageAvailable();
show({ moveFocus: false });
