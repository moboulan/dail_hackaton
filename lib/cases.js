// Resolves the case a request is about: a built-in module (persona on the server) or a case the
// pharmacy wrote in the "Créer un cas" editor (sent by the browser, validated field by field
// here before any of it reaches the model).

import { PERSONAS } from "./personas.js";
import { MODULES } from "../public/js/content.js";

const MAX_TEXT = 400;

function text(value, max = MAX_TEXT) {
  return typeof value === "string" && value.trim() && value.length <= max ? value.trim() : null;
}

function customCase(id, raw) {
  if (!raw || typeof raw !== "object") return null;
  const customer = text(raw.customer, 60);
  const brief = text(raw.brief);
  const need = text(raw.need);
  const expected = text(raw.expected);
  const hidden = Array.isArray(raw.hidden) ? raw.hidden.map((h) => text(h)).filter(Boolean).slice(0, 4) : [];
  const products = Array.isArray(raw.products)
    ? raw.products.slice(0, 3).map((p) => ({
        name: text(p?.name, 60),
        form: text(p?.form, 60) || "",
        price: Number.isFinite(p?.price) && p.price >= 0 && p.price < 10000 ? p.price : 0,
        forWhat: text(p?.forWhat) || "",
        use: text(p?.use) || "",
        caution: text(p?.caution) || "",
      })).filter((p) => p.name)
    : [];
  if (!customer || !brief || !need || !expected || !products.length) return null;
  const darija = raw.darija === true;
  return {
    persona: {
      name: customer,
      languageMatters: false,
      facts: {},
      who: `Tu es ${customer}, client d'une pharmacie à Casablanca. ${darija
        ? "Tu parles surtout darija en lettres latines, avec quelques mots de français."
        : "Tu parles français simple, avec parfois un mot courant de darija."}`,
      need,
      hidden,
      expected,
    },
    module: { id, title: text(raw.title, 60) || "Cas de la pharmacie", brief, products },
  };
}

// { persona, module } or null when the request names no valid case.
export function resolveCase(body) {
  if (!body || typeof body !== "object" || typeof body.module !== "string") return null;
  const builtIn = MODULES.find((m) => m.id === body.module);
  if (builtIn) return { persona: PERSONAS[builtIn.id], module: builtIn };
  if (!/^cas-\d{6,}$/.test(body.module)) return null;
  return customCase(body.module, body.custom);
}
