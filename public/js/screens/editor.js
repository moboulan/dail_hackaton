// "Créer un cas" (manager only): a new training case for the team. Saved on this computer, it
// appears in every pharmacist's register and plays with the same AI flow; the server validates
// every field again.

import { esc } from "../html.js";

const MAX_SHORT = 60;
const MAX_LONG = 400;

function field(name, label, { long = false, required = false, placeholder = "", hint = "" } = {}) {
  const attributes = `id="f-${name}" name="${name}" ${required ? "required" : ""} maxlength="${long ? MAX_LONG : MAX_SHORT}" placeholder="${esc(placeholder)}"`;
  return `
    <label class="field" for="f-${name}">
      <span class="field-label">${esc(label)}${required ? "" : ' <span class="field-optional">facultatif</span>'}</span>
      ${hint ? `<span class="field-hint">${esc(hint)}</span>` : ""}
      ${long ? `<textarea ${attributes} rows="2"></textarea>` : `<input type="text" ${attributes}>`}
    </label>`;
}

function productFields(n) {
  const required = n === 1;
  return `
    <fieldset class="product-fields">
      <legend>Produit ${n}${required ? "" : ' <span class="field-optional">facultatif</span>'}</legend>
      <div class="field-row">
        ${field(`p${n}-name`, "Nom", { required, placeholder: n === 1 ? "Toux Calm" : "" })}
        ${field(`p${n}-form`, "Forme", { placeholder: n === 1 ? "Sirop" : "" })}
        <label class="field field-price" for="f-p${n}-price">
          <span class="field-label">Prix (DH)</span>
          <input type="number" id="f-p${n}-price" name="p${n}-price" min="0" max="9999" inputmode="numeric">
        </label>
      </div>
      ${field(`p${n}-forWhat`, "Pour quoi", { long: true })}
      ${field(`p${n}-use`, "Usage", { long: true })}
      ${field(`p${n}-caution`, "Attention", { long: true, placeholder: "Contre-indications, si il y en a" })}
    </fieldset>`;
}

function readProduct(data, n) {
  const name = data.get(`p${n}-name`).trim();
  if (!name) return null;
  return {
    name,
    form: data.get(`p${n}-form`).trim(),
    price: Number(data.get(`p${n}-price`)) || 0,
    forWhat: data.get(`p${n}-forWhat`).trim(),
    use: data.get(`p${n}-use`).trim(),
    caution: data.get(`p${n}-caution`).trim(),
  };
}

export default {
  title: "Créer un cas",

  render() {
    return `
      <h1 tabindex="-1">Créer un cas</h1>
      <p class="editor-lead">Un nouveau client pour l'équipe. Il sera joué par l'IA, évalué et suivi d'un quiz.</p>
      <form class="editor" data-submit="create">
        <section class="editor-part">
          <h2 class="register-title">Le client</h2>
          <div class="field-row">
            ${field("title", "Titre du module", { required: true, placeholder: "Toux sèche" })}
            ${field("customer", "Nom du client", { required: true, placeholder: "M. Karim" })}
          </div>
          <label class="check-field"><input type="checkbox" name="darija"> Le client parle surtout darija</label>
          ${field("brief", "Ce que le pharmacien voit", { long: true, required: true, placeholder: "M. Karim tousse depuis 3 jours et dort mal." })}
          ${field("need", "Ce que le client demande", { long: true, required: true, placeholder: "Un sirop fort pour arrêter la toux." })}
          ${field("hidden", "Ce qu'il dit seulement si on lui demande", { long: true, hint: "Une information par ligne.", placeholder: "Il fume.\nIl a de la fièvre depuis hier." })}
        </section>
        <section class="editor-part">
          <h2 class="register-title">Le rayon</h2>
          ${productFields(1)}
          ${productFields(2)}
          ${productFields(3)}
        </section>
        <section class="editor-part">
          <h2 class="register-title">La bonne réponse</h2>
          ${field("expected", "Ce qu'un bon pharmacien fait", { long: true, required: true, placeholder: "Demander s'il fume et depuis quand, conseiller Toux Calm, orienter vers un médecin si fièvre." })}
        </section>
        <div class="result-actions">
          <button class="button primary" type="submit">Enregistrer le cas</button>
          <a class="button" href="#equipe">Annuler</a>
        </div>
      </form>`;
  },

  actions: {
    create(form, ctx) {
      const data = new FormData(form);
      const id = `cas-${Date.now()}`;
      const raw = {
        id,
        title: data.get("title").trim(),
        customer: data.get("customer").trim(),
        darija: data.get("darija") === "on",
        brief: data.get("brief").trim(),
        need: data.get("need").trim(),
        hidden: data.get("hidden").split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 4),
        expected: data.get("expected").trim(),
        products: [1, 2, 3].map((n) => readProduct(data, n)).filter(Boolean),
      };
      ctx.update((state) => {
        state.customModules.push(raw);
      });
      ctx.navigate("equipe");
      ctx.announce(`Cas « ${raw.title} » ajouté : l'équipe le voit dans son registre.`);
    },
  },
};
