// Every piece of text that reaches innerHTML goes through esc().

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

export function productCard(product) {
  return `
    <article class="sheet">
      <h3>${esc(product.name)} <span class="sheet-form">· ${esc(product.form)}</span></h3>
      <dl>
        <dt>Pour</dt><dd>${esc(product.forWhat)}</dd>
        <dt>Usage</dt><dd>${esc(product.use)}</dd>
        <dt>Attention</dt><dd>${esc(product.caution)}</dd>
      </dl>
    </article>`;
}
