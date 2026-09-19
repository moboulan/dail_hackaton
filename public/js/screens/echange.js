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
  return `<li class="message ${message.role}"><span class="visually-hidden">${esc(who)} : </span>${esc(message.text)}</li>`;
}

function memo() {
  return `
    <h2 class="register-title">Mémo</h2>
    <ol class="memo-list">${REFLEXES.map((r) => `<li><strong>${esc(r.title)}</strong><span>${esc(r.body)}</span></li>`).join("")}</ol>`;
}

// The same register lines as the Brief, set compact beside the conversation.
function shelf(module) {
  return `<ul class="products is-compact">${module.products.map(productLine).join("")}</ul>`;
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
        placeholder="Votre réponse" aria-describedby="composer-note"></textarea>
      <button class="button primary" type="submit" id="send" ${opened ? "" : "disabled"}>Envoyer</button>
    </form>
    <p class="composer-note" id="composer-note">Cas fictif : n'écrivez aucune donnée réelle de patient.${remaining <= 3 ? ` Encore ${remaining} message${remaining > 1 ? "s" : ""}.` : ""}</p>
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

// The customer walks in and speaks first.
async function openConversation(ctx) {
  const { module, progress } = ctx;
  waiting = true;
  setStatus(`${esc(module.customer)} écrit…`);
  try {
    const { reply } = await askCustomer(module, []);
    waiting = false;
    if (progress.chat.messages.length) return; // opened meanwhile in another tab
    progress.chat.messages.push({ role: "customer", text: reply });
    ctx.save();
    if (document.getElementById("messages")) ctx.update(() => {}, { focus: "#reply" });
  } catch (error) {
    waiting = false;
    setStatus(`${esc(error.message)} <button class="link-button" type="button" data-action="open-retry">Réessayer</button>`, true);
  }
}

export default {
  title: "Échange",

  render({ module, progress }) {
    return `
      <div class="chat-layout">
        <aside class="memo" aria-label="Mémo">${memo()}</aside>
        <section class="chat" aria-labelledby="chat-title">
          <div class="chat-head">
            <h1 id="chat-title" tabindex="-1">${esc(module.customer)}</h1>
            <button class="button shelf-open" type="button" data-action="shelf-open">Vos produits</button>
          </div>
          <ol class="messages" id="messages">${progress.chat.messages.map((m) => messageItem(m, module.customer)).join("")}</ol>
          <p id="chat-status" class="chat-status" role="status" aria-live="polite"></p>
          ${progress.chat.ended ? `<p class="chat-closed">Échange terminé.</p>` : composer(progress, module.customer)}
        </section>
        <aside class="shelf" aria-labelledby="shelf-title"><h2 id="shelf-title" class="register-title">Vos produits</h2>${shelf(module)}</aside>
      </div>
      <dialog id="shelf-dialog" class="shelf-dialog" aria-labelledby="shelf-dialog-title">
        <div class="dialog-head">
          <h2 id="shelf-dialog-title">Vos produits</h2>
          <button class="button" type="button" data-action="shelf-close">Fermer</button>
        </div>
        ${shelf(module)}
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

    typing() {
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
      scrollToLatest();

      waiting = true;
      form.querySelector("#send").disabled = true;
      setStatus(`${esc(module.customer)} écrit…`);
      try {
        const { reply, left } = await askCustomer(module, progress.chat.messages);
        progress.chat.messages.push({ role: "customer", text: reply });
        progress.chat.left = left;
        ctx.save();
        waiting = false;
        // Re-render: the composer may change (cap reached, customer left, end link now visible).
        if (form.isConnected) ctx.update(() => {}, { focus: "#reply" });
        ctx.announce(`${module.customer} : ${reply}`);
      } catch (error) {
        // Not delivered: take the message back out and return the text to the box.
        progress.chat.messages.pop();
        ctx.save();
        waiting = false;
        if (!form.isConnected) return; // screen changed meanwhile: its DOM is gone
        document.querySelector("#messages li:last-child")?.remove();
        textarea.value = text;
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
