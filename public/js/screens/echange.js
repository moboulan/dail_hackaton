// The conversation. Updates its own DOM while typing and waiting, so the text box never
// loses focus or content; the full screen re-renders only when the chat ends.

import { REFLEXES } from "../content.js";
import { askCustomer } from "../api.js";
import { esc, productCard } from "../html.js";

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

function shelf(module) {
  return `
    <div class="sheets">${module.products.map(productCard).join("")}</div>
    <details class="memo">
      <summary>Mémo : les 4 réflexes</summary>
      <ol>${REFLEXES.map((r) => `<li><strong>${esc(r.title)}</strong> ${esc(r.body)}</li>`).join("")}</ol>
    </details>`;
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
  return `
    <form class="composer" data-submit="send">
      <label class="visually-hidden" for="reply">Votre réponse</label>
      <textarea id="reply" rows="2" maxlength="${MAX_LENGTH}" data-keydown="composeKey" data-input="typing"
        placeholder="Votre réponse" aria-describedby="composer-note"></textarea>
      <button class="button primary" type="submit" id="send">Envoyer</button>
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
function setStatus(text, isError = false) {
  const status = document.getElementById("chat-status");
  if (!status) return;
  status.textContent = text;
  status.classList.toggle("is-error", isError);
}

export default {
  title: "Échange",

  render({ module, progress, notice }) {
    const readOnly = progress.chat.ended;
    return `
      <div class="chat-head">
        <h1 tabindex="-1" class="chat-title">Échange avec ${esc(module.customer)}</h1>
        <button class="button shelf-open" type="button" data-action="shelf-open">Vos produits</button>
      </div>
      ${notice ? `<p class="notice">${esc(notice)}</p>` : ""}
      <div class="chat-layout">
        <section class="chat" aria-label="Conversation">
          <ol class="messages" id="messages">${progress.chat.messages.map((m) => messageItem(m, module.customer)).join("")}</ol>
          <p id="chat-status" class="chat-status" role="status" aria-live="polite"></p>
          ${readOnly ? `<p class="chat-closed">Échange terminé.</p>` : composer(progress, module.customer)}
        </section>
        <aside class="shelf" aria-label="Vos produits"><h2>Vos produits</h2>${shelf(module)}</aside>
      </div>
      <dialog id="shelf-dialog" class="shelf-dialog" aria-labelledby="shelf-dialog-title">
        <div class="dialog-head">
          <h2 id="shelf-dialog-title">Vos produits</h2>
          <button class="button" type="button" data-action="shelf-close">Fermer</button>
        </div>
        ${shelf(module)}
      </dialog>`;
  },

  afterRender() {
    scrollToLatest();
  },

  actions: {
    composeKey(textarea, ctx, event) {
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
      if (!text || waiting) return;

      const { module, progress } = ctx;
      progress.chat.messages.push({ role: "pharmacist", text });
      ctx.save();
      document.getElementById("messages").insertAdjacentHTML("beforeend", messageItem({ role: "pharmacist", text }, module.customer));
      textarea.value = "";
      scrollToLatest();

      waiting = true;
      form.querySelector("#send").disabled = true;
      setStatus(`${module.customer} écrit…`);
      try {
        const { reply, left } = await askCustomer(module, progress.chat.messages);
        progress.chat.messages.push({ role: "customer", text: reply });
        progress.chat.left = left;
        ctx.save();
        waiting = false;
        // Re-render: the composer changes (cap reached, customer left, end link now visible).
        ctx.update(() => {}, { focus: "#reply" });
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
        setStatus(error.message, true);
        textarea.focus();
      }
    },

    "end-ask"(_el, ctx) {
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
