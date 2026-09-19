import * as store from "./store.js";
import { findModule } from "./modules.js";
import { icon } from "./html.js";
import { STEPS, STEP_IDS, isDone, isUnlocked } from "./steps.js";
import dashboard from "./screens/dashboard.js";
import login from "./screens/login.js";
import team from "./screens/team.js";
import brief from "./screens/brief.js";
import echange from "./screens/echange.js";
import bilan from "./screens/bilan.js";
import quiz from "./screens/quiz.js";
import resultat from "./screens/resultat.js";

const STEP_SCREENS = { brief, echange, bilan, quiz, resultat };

const main = document.getElementById("main");
const stepBar = document.getElementById("steps");
const account = document.getElementById("account");
const status = document.getElementById("status");
const storageWarning = document.getElementById("storage-warning");

let pharmacy = store.load();
let state = store.view(pharmacy); // the current person's record plus the shared cases
let route = { module: null, step: null, page: "dashboard" }; // module null: dashboard, team or login

// Shared with every screen. Inside a module, update() hands over that module's progress.
const ctx = {
  get state() {
    return state;
  },
  get pharmacy() {
    return pharmacy;
  },
  signIn(accountId) {
    pharmacy.current = accountId;
    state = store.view(pharmacy);
    persist();
    renderAccount();
    navigate(state.isAdmin ? "equipe" : "accueil");
  },

  get module() {
    return route.module;
  },
  get progress() {
    return route.module ? state.modules[route.module.id] : null;
  },
  // Persist without re-rendering, for screens that update their own DOM (the chat).
  save() {
    persist();
  },
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
  store.save(pharmacy);
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
  if (moduleId === "equipe") return { module: null, step: null, page: "team" };
  const module = findModule(moduleId, state);
  if (!module) return { module: null, step: null };
  return { module, step: STEP_IDS.has(step) ? step : null };
}

// Where "Reprendre" lands: the furthest step that is unlocked and already built.
function furthestBuilt(progress) {
  const open = STEPS.map((s) => s.id).filter((id) => isUnlocked(id, progress) && STEP_SCREENS[id]);
  return open[open.length - 1];
}

function show({ moveFocus }) {
  const parsed = parseHash();

  // Signed out: only the login page. The manager only has the team page; pharmacists never see it.
  if (state.signedOut) {
    parsed.page = "login";
    parsed.module = null;
  } else if (state.isAdmin) {
    parsed.page = "team";
    parsed.module = null;
  } else if (parsed.page === "team") {
    parsed.page = null;
  }
  if (parsed.page) {
    route = { module: null, step: null, page: parsed.page };
    const hash = parsed.page === "team" ? "#equipe" : "#connexion";
    if (location.hash !== hash) history.replaceState(null, "", hash);
  } else if (!parsed.module) {
    route = { module: null, step: null, page: "dashboard" };
    if (location.hash !== "#accueil") history.replaceState(null, "", "#accueil");
  } else {
    const progress = state.modules[parsed.module.id];
    let step = parsed.step ?? furthestBuilt(progress);
    // A locked or unbuilt step quietly resolves to where the pharmacist can be.
    if (!STEP_SCREENS[step] || !isUnlocked(step, progress)) step = furthestBuilt(progress);
    route = { module: parsed.module, step };
    const hash = `#${parsed.module.id}/${step}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
  }

  renderScreen();
  if (moveFocus) {
    window.scrollTo(0, 0);
    main.querySelector("h1")?.focus();
  }
}

function currentScreen() {
  if (route.module) return STEP_SCREENS[route.step];
  return { login, team }[route.page] ?? dashboard;
}

function renderScreen() {
  const screen = currentScreen();
  main.innerHTML = screen.render(ctx);
  main.dataset.screen = route.module ? route.step : route.page;
  screen.afterRender?.(ctx);
  document.title = route.module
    ? `${route.module.title} · ${screen.title} · BP Learning`
    : `${screen.title} · BP Learning`;
  renderStepBar();
}

function renderStepBar() {
  const inModule = Boolean(route.module);
  stepBar.hidden = !inModule;

  if (!inModule) return;

  const progress = state.modules[route.module.id];
  const items = STEPS.map((step, index) => {
    const number = `<span class="step-number">${index + 1}</span>`;
    const label = `<span class="step-label-text">${step.label}</span>`;
    if (step.id === route.step) {
      return `<li class="is-current"><span aria-current="step">${number}${label}</span></li>`;
    }
    if (isUnlocked(step.id, progress) && STEP_SCREENS[step.id]) {
      const done = isDone(step.id, progress);
      const mark = done ? `<span class="step-number is-done">${icon("check")}</span>` : number;
      return `<li class="is-open"><a href="#${route.module.id}/${step.id}">${mark}${label}${done ? `<span class="visually-hidden"> (terminé)</span>` : ""}</a></li>`;
    }
    return `<li class="is-locked"><span>${number}${label}<span class="visually-hidden"> (pas encore disponible)</span></span></li>`;
  }).join("");
  stepBar.innerHTML = `<ol>${items}</ol>`;
}

// One listener per event type for the whole page, attached once.
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  currentScreen().actions[action]?.(target, ctx);
});

// Other events route the same way: data-change, data-input, data-keydown, data-submit, data-focus.
const ROUTED = { change: "change", input: "input", keydown: "keydown", submit: "submit", focusin: "focus" };
for (const [type, attribute] of Object.entries(ROUTED)) {
  document.addEventListener(type, (event) => {
    const target = event.target.closest(`[data-${attribute}]`);
    if (!target) return;
    if (type === "submit") event.preventDefault();
    currentScreen().actions[target.dataset[attribute]]?.(target, ctx, event);
  });
}

// iOS does not shrink the page when the keyboard opens. Expose the visible height as --vvh and
// flag an open keyboard, so the chat can fit what the pharmacist actually sees.
function syncViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  document.documentElement.style.setProperty("--vvh", `${viewport.height}px`);
  document.body.classList.toggle("keyboard-open", viewport.height < window.innerHeight * 0.8);
}
window.visualViewport?.addEventListener("resize", syncViewport);
syncViewport();

window.addEventListener("hashchange", () => show({ moveFocus: true }));

// Who is signed in, and the way out.
function renderAccount() {
  account.innerHTML = state.signedOut
    ? ""
    : `<span class="account-name">${state.staffName}</span><button class="link-button" type="button" id="sign-out">Se déconnecter</button>`;
}

account.addEventListener("click", (event) => {
  if (event.target.id !== "sign-out") return;
  pharmacy.current = null;
  state = store.view(pharmacy);
  persist();
  renderAccount();
  navigate("connexion");
});

renderAccount();
storageWarning.hidden = store.storageAvailable();
show({ moveFocus: false });
