// Sign in on the pharmacy computer. Demo accounts only: the check runs in the page.

import { authenticate } from "../store.js";

export default {
  title: "Connexion",

  render() {
    return `
      <section class="login">
        <h1 tabindex="-1">Connexion</h1>
        <form class="login-form" data-submit="signIn" novalidate>
          <label class="field" for="f-login">
            <span class="field-label">Identifiant</span>
            <input id="f-login" name="login" type="text" autocomplete="username" autocapitalize="none" required>
          </label>
          <label class="field" for="f-password">
            <span class="field-label">Mot de passe</span>
            <input id="f-password" name="password" type="password" autocomplete="current-password" required>
          </label>
          <p id="login-error" class="login-error" role="alert"></p>
          <button class="button primary" type="submit">Se connecter</button>
        </form>
        <div class="login-demo">
          <p class="register-title">Comptes de démonstration</p>
          <ul>
            <li><span>Pharmacien</span><code><strong>alami</strong> / alami</code></li>
            <li><span>Pharmacien</span><code><strong>bennani</strong> / bennani</code></li>
            <li><span>Responsable</span><code><strong>admin</strong> / admin</code></li>
          </ul>
        </div>
      </section>`;
  },

  actions: {
    signIn(form, ctx) {
      const data = new FormData(form);
      const account = authenticate(data.get("login"), data.get("password"));
      if (!account) {
        document.getElementById("login-error").textContent = "Identifiant ou mot de passe incorrect.";
        form.querySelector("#f-password").value = "";
        form.querySelector("#f-login").focus();
        return;
      }
      ctx.signIn(account);
    },
  },
};
