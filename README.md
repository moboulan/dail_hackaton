# BP Learning: Eagle Day version

Continuing-education modules for pharmacists in Morocco. In each module the pharmacist reads a
short brief, advises an AI-played customer in free text, gets a debrief and takes a short quiz.
Three modules, one decision each: do not upsell (Rhume), upsell when it helps (Coup de soleil),
refer to a doctor (Mal de ventre). All people and products are fictional.

Built for DaiL Eagle Day, 19 September 2026, Challenge A, from the organisers' starter
(baseline commit `aa0dfd0`, originals in `docs/original/`).

## Run

Requires Node 18 or later. No install step, no dependencies.

```sh
cp .env.example .env   # then set DEEPSEEK_API_KEY
node server.js
```

Open http://127.0.0.1:8089/. Progress is saved in this browser only. The API key stays on the
server: the browser only calls `/api/chat` on the same origin, and `.env` is never served.

## Live demo

https://dail-bp-learning.vercel.app

Demo accounts (the login runs in the browser: a demonstration of roles, not security):

| Role | Login | Password |
| --- | --- | --- |
| Pharmacist | alami | alami |
| Pharmacist | bennani | bennani |
| Manager (team progress and attestations) | admin | admin |

Deployed with the Vercel CLI (`vercel deploy --prod`). `public/` is the static output, and
`api/chat.js` and `api/debrief.js` wrap the same handlers the local server uses (`lib/`).
`DEEPSEEK_API_KEY` is a Vercel production secret. `.vercelignore` keeps `.env` files out of
every upload.

## Docs

- `docs/SPEC.md`: scope, decisions, steps, open questions.
- `docs/PROBLEMS.md`: every problem found and how it was fixed.
- `docs/SUBMISSION-CHECKLIST.md`: DaiL submission checklist with status.
- `docs/evidence/`: before and after screenshots.
