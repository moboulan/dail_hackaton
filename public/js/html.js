// Every piece of text that reaches innerHTML goes through esc().

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

export function productSheet(product) {
  return `
    <article class="sheet">
      <p class="sheet-tag">Produit fictif</p>
      <h3>${esc(product.name)}</h3>
      <p class="sheet-form">${esc(product.form)}</p>
      <dl>
        <dt>Pour quoi</dt><dd>${esc(product.forWhat)}</dd>
        <dt>Utilisation</dt><dd>${esc(product.use)}</dd>
        <dt>Attention</dt><dd>${esc(product.caution)}</dd>
      </dl>
    </article>`;
}
