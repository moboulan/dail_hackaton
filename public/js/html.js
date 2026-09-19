// Markup shared by several screens. Every text that reaches innerHTML goes through esc().

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

// One stroke icon set, drawn on a 20 px grid, 1.75 px stroke, currentColor.
const ICON_PATHS = {
  check: '<path d="M4.5 10.5l3.5 3.5 7.5-8"/>',
  partial: '<circle cx="10" cy="10" r="6.5"/><path d="M10 3.5a6.5 6.5 0 0 1 0 13z" fill="currentColor"/>',
  cross: '<path d="M5.5 5.5l9 9M14.5 5.5l-9 9"/>',
  alert: '<path d="M10 3l7.5 13.5h-15z"/><path d="M10 8.5v3.5M10 14.2v.1"/>',
  lock: '<rect x="4.5" y="9" width="11" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>',
};

export function icon(name, label = "") {
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${ICON_PATHS[name]}</svg>`;
}

// A product as a line of the pharmacy's register. Same markup on the Brief and the chat shelf.
// `excluded` is the reason a revealed fact rules the product out, shown on the chat shelf.
export function productLine(product, excluded = "") {
  return `
    <li class="product${excluded ? " is-excluded" : ""}">
      <p class="product-head"><strong>${esc(product.name)}</strong><span class="product-form">${esc(product.form)}</span><span class="price">${product.price} DH</span></p>
      <p class="product-for">${esc(product.forWhat)}</p>
      <p class="product-use">${esc(product.use)}</p>
      ${product.caution ? `<p class="product-caution">${icon("alert")}<span class="visually-hidden">Attention : </span>${esc(product.caution)}</p>` : ""}
      ${excluded ? `<p class="product-excluded">${icon("cross")}${esc(excluded)}</p>` : ""}
    </li>`;
}

// The officine's cachet: a round forest stamp with the score and date.
export function stamp(score, isoDate, { pressing = false } = {}) {
  const date = new Date(isoDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `
    <span class="stamp${pressing ? " is-pressing" : ""}" role="img" aria-label="Validé, ${score} %, le ${esc(date)}">
      <span class="stamp-top">Validé</span>
      <span class="stamp-score">${score}&nbsp;%</span>
      <span class="stamp-date">${esc(date)}</span>
    </span>`;
}

// The printable attestation. Hidden on screen; printAttestation() prints exactly this one.
export function attestation(module, progress, profile) {
  const date = new Date(progress.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `
    <section class="attestation" data-attestation="${esc(module.id)}" aria-hidden="true">
      <p class="attestation-brand">BP Learning · Formation continue</p>
      <h2>Attestation de formation</h2>
      <p><strong>${esc(profile.name)}</strong> a validé le module « ${esc(module.title)} »</p>
      <p>le ${esc(date)}, avec un score de ${progress.score} %.</p>
      ${stamp(progress.score, progress.completedAt)}
      <p class="attestation-note">Formation sur cas et produits fictifs.</p>
    </section>`;
}

export function printAttestation(moduleId) {
  const sheet = document.querySelector(`[data-attestation="${CSS.escape(moduleId)}"]`);
  sheet.classList.add("is-printing");
  window.addEventListener("afterprint", () => sheet.classList.remove("is-printing"), { once: true });
  window.print();
}
