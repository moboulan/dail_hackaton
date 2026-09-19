// The conversation. The customer (AI) speaks first. The screen updates its own DOM while
// typing and waiting, so the text box never loses focus or content.
// Layout: Mémo (how to talk) | conversation | shelf (what you sell), each shown once.

import { REFLEXES } from "../content.js";
import { askCustomer } from "../api.js";
import { esc, productLine } from "../html.js";

const MAX_MESSAGES = 12; // pharmacist messages, same cap as the server
const MAX_LENGTH = 500;

let waiting = false;

function sentCount(progress) {
  return progress.chat.messages.filter((m) => m.role === "pharmacist").length;
}

function messageItem(message, customer) {
  const who = message.role === "customer" ? customer : "Vous";
  return `<li class="message ${message.role}"><span class="speaker">${esc(who)}</span>${esc(message.text)}</li>`;
}

// The 4 réflexes; one missed in an earlier Bilan shows that Bilan's short tip instead.
function memo(state) {
  const item = (r) => {
    const hint = state.memoHints[r.id];
    // A hint replaces the generic line: one reminder per réflexe, the personal one when it exists.
    const detail = hint ? `<span class="memo-hint">${esc(hint)}</span>` : `<span>${esc(r.body)}</span>`;
    return `<li${hint ? ' class="has-hint"' : ""}><strong>${esc(r.title)}</strong>${detail}</li>`;
  };
  return `
    <h2 class="register-title">Mémo</h2>
    <ol class="memo-list">${REFLEXES.map(item).join("")}</ol>`;
}

// What the customer has revealed so far says about a product: ruled out, confirmed, or nothing.
// A ruling-out wins over a confirmation.
function verdictFor(module, progress, product) {
  const applies = (rule) => progress.chat.facts.includes(rule.fact) && rule.products.includes(product.name);
  const out = module.exclusions.find(applies);
  if (out) return { kind: "excluded", reason: out.reason };
  const ok = module.confirmations.find(applies);
  return ok ? { kind: "confirmed", reason: ok.reason } : null;
}

// The same register lines as the Brief, set compact beside the conversation. Products the
// conversation has ruled out are greyed with the reason: the payoff of asking the right question.
function shelf(module, progress) {
  return `<ul class="products is-compact">${module.products.map((p) => productLine(p, verdictFor(module, progress, p))).join("")}</ul>`;
}

// New facts from a reply: record them, redraw both shelves (side column and phone sheet).
function applyFacts(ctx, facts) {
  const { module, progress } = ctx;
  const fresh = (facts || []).filter((f) => !progress.chat.facts.includes(f));
  if (!fresh.length) return;
  progress.chat.facts.push(...fresh);
  ctx.save();
  document.querySelectorAll(".products.is-compact").forEach((list) => {
    list.outerHTML = shelf(module, progress);
  });
  const changed = [...module.exclusions, ...module.confirmations].filter((rule) => fresh.includes(rule.fact));
  if (changed.length) ctx.announce(changed.map((rule) => `${rule.products.join(", ")} : ${rule.reason}`).join(" "));
}

function composer(progress, customer) {
  if (progress.chat.left) {
    return `<div class="chat-closed"><p>${esc(customer)} a quitté la pharmacie.</p>
      <button class="button primary" type="button" data-action="end">Voir le bilan</button></div>`;
  }
  const remaining = MAX_MESSAGES - sentCount(progress);
  if (remaining <= 0) {
    return `<div class="chat-closed"><p>Vous avez envoyé ${MAX_MESSAGES} messages.</p>
      <button class="button primary" type="button" data-action="end">Voir le bilan</button></div>`;
  }
  const opened = progress.chat.messages.length > 0;
  return `
    <form class="composer" data-submit="send">
      <label class="visually-hidden" for="reply">Votre réponse</label>
      <textarea id="reply" rows="2" maxlength="${MAX_LENGTH}" data-keydown="composeKey" data-input="typing"
        placeholder="Votre réponse"></textarea>
      <button class="button primary" type="submit" id="send" ${opened ? "" : "disabled"}>Envoyer</button>
    </form>
    <p class="composer-note" id="composer-note" aria-live="polite">${remaining <= 3 ? `Encore ${remaining} message${remaining > 1 ? "s" : ""}.` : ""}</p>
    <div id="end-zone" class="end-zone">
      <button class="link-button" type="button" data-action="end-ask" ${sentCount(progress) ? "" : "hidden"}>Terminer l'échange</button>
    </div>`;
}

function scrollToLatest() {
  const list = document.getElementById("messages");
  if (list) list.scrollTop = list.scrollHeight;
}

// The pharmacist may have left the screen while a reply was loading: then there is nothing to update.
function setStatus(html, isError = false) {
  const status = document.getElementById("chat-status");
  if (!status) return;
  status.innerHTML = html;
  status.classList.toggle("is-error", isError);
}

// After a reply: append it in place so the text box keeps focus and the phone keyboard stays
// open. Only a change of composer (customer left, message cap reached) re-renders the screen.
function showReply(ctx, form, reply) {
  const { module, progress } = ctx;
  const remaining = MAX_MESSAGES - sentCount(progress);
  if (progress.chat.left || remaining <= 0) {
    ctx.update(() => {});
    return;
  }
  document.getElementById("messages").insertAdjacentHTML("beforeend", messageItem({ role: "customer", text: reply }, module.customer));
  scrollToLatest();
  setStatus("");
  form.querySelector("#send").disabled = false;
  document.querySelector("[data-action=end-ask]")?.removeAttribute("hidden");
  const note = document.getElementById("composer-note");
  if (remaining <= 3) note.textContent = `Encore ${remaining} message${remaining > 1 ? "s" : ""}.`;
}

// The text box grows with its content, up to about 5 lines, instead of a drag handle.
function fitTextarea(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
}

// The customer walks in and speaks first.
async function openConversation(ctx) {
  const { module, progress } = ctx;
  waiting = true;
  setStatus(`${esc(module.customer)} écrit…`);
  try {
    const { reply, facts } = await askCustomer(module, []);
    waiting = false;
    if (progress.chat.messages.length) return; // opened meanwhile in another tab
    progress.chat.messages.push({ role: "customer", text: reply });
    progress.chat.facts.push(...(facts || []).filter((f) => !progress.chat.facts.includes(f)));
    ctx.save();
    if (document.getElementById("messages")) ctx.update(() => {}, { focus: "#reply" });
  } catch (error) {
    waiting = false;
    setStatus(`${esc(error.message)} <button class="link-button" type="button" data-action="open-retry">Réessayer</button>`, true);
  }
}

export default {
  title: "Échange",

  render({ module, progress, state }) {
    return `
      <div class="chat-layout">
        <aside class="memo" aria-label="Mémo">${memo(state)}</aside>
        <section class="chat" aria-labelledby="chat-title">
          <div class="chat-head">
            <h1 id="chat-title" tabindex="-1">${esc(module.customer)}</h1>
            <button class="button shelf-open" type="button" data-action="shelf-open">Produits et mémo</button>
          </div>
          <ol class="messages" id="messages">${progress.chat.messages.map((m) => messageItem(m, module.customer)).join("")}</ol>
          <p id="chat-status" class="chat-status" role="status" aria-live="polite"></p>
          ${progress.chat.ended ? `<p class="chat-closed">Échange terminé.</p>` : composer(progress, module.customer)}
        </section>
        <aside class="shelf" aria-labelledby="shelf-title"><h2 id="shelf-title" class="register-title">Vos produits</h2>${shelf(module, progress)}</aside>
      </div>
      <dialog id="shelf-dialog" class="shelf-dialog" aria-labelledby="shelf-dialog-title">
        <div class="dialog-head">
          <h2 id="shelf-dialog-title" class="register-title">Vos produits</h2>
          <button class="button" type="button" data-action="shelf-close">Fermer</button>
        </div>
        ${shelf(module, progress)}
        <div class="dialog-memo">${memo(state)}</div>
      </dialog>`;
  },

  afterRender(ctx) {
    scrollToLatest();
    if (!ctx.progress.chat.messages.length && !ctx.progress.chat.ended && !waiting) openConversation(ctx);
  },

  actions: {
    "open-retry"(_el, ctx) {
      openConversation(ctx);
    },

    composeKey(textarea, _ctx, event) {
      // Enter sends, Shift+Enter makes a new line.
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        textarea.form.requestSubmit();
      }
    },

    typing(textarea) {
      fitTextarea(textarea);
      if (!waiting) setStatus("");
    },

    async send(form, ctx) {
      const textarea = form.querySelector("textarea");
      const text = textarea.value.trim();
      if (!text || waiting || !ctx.progress.chat.messages.length) return;

      const { module, progress } = ctx;
      progress.chat.messages.push({ role: "pharmacist", text });
      ctx.save();
      document.getElementById("messages").insertAdjacentHTML("beforeend", messageItem({ role: "pharmacist", text }, module.customer));
      textarea.value = "";
      fitTextarea(textarea);
      scrollToLatest();

      waiting = true;
      form.querySelector("#send").disabled = true;
      setStatus(`${esc(module.customer)} écrit…`);
      try {
        const { reply, left, facts } = await askCustomer(module, progress.chat.messages);
        progress.chat.messages.push({ role: "customer", text: reply });
        progress.chat.left = left;
        ctx.save();
        waiting = false;
        if (form.isConnected) {
          showReply(ctx, form, reply);
          applyFacts(ctx, facts);
        } else {
          progress.chat.facts.push(...(facts || []).filter((f) => !progress.chat.facts.includes(f)));
          ctx.save();
        }
        ctx.announce(`${module.customer} : ${reply}`);
      } catch (error) {
        // Not delivered: take the message back out and return the text to the box.
        progress.chat.messages.pop();
        ctx.save();
        waiting = false;
        if (!form.isConnected) return; // screen changed meanwhile: its DOM is gone
        document.querySelector("#messages li:last-child")?.remove();
        textarea.value = text;
        fitTextarea(textarea);
        form.querySelector("#send").disabled = false;
        setStatus(esc(error.message), true);
        textarea.focus();
      }
    },

    "end-ask"() {
      document.getElementById("end-zone").innerHTML = `
        <p id="end-question">Terminer l'échange ? Vous ne pourrez plus écrire.</p>
        <button class="button primary" type="button" data-action="end" aria-describedby="end-question">Oui, voir le bilan</button>
        <button class="button" type="button" data-action="end-cancel">Continuer</button>`;
      document.querySelector("[data-action=end-cancel]").focus();
    },

    "end-cancel"() {
      document.getElementById("end-zone").innerHTML =
        `<button class="link-button" type="button" data-action="end-ask">Terminer l'échange</button>`;
      document.getElementById("reply")?.focus();
    },

    end(_el, ctx) {
      ctx.update((progress) => {
        progress.chat.ended = true;
      });
      ctx.go("bilan");
    },

    "shelf-open"() {
      document.getElementById("shelf-dialog").showModal();
    },

    "shelf-close"() {
      document.getElementById("shelf-dialog").close();
    },
  },
};
