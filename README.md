# BP Learning: Eagle Day version

French communication practice for pharmacy employees in Casablanca: ask the customer's
language preference, explain one step at a time, check understanding. All people and
dialogue are synthetic. The app gives no health advice.

Built for DaiL Eagle Day, 19 September 2026, Challenge A, from the organisers' starter
(baseline commit `aa0dfd0`, originals in `docs/original/`).

## Run (current state)

The app is still static until the chat server lands (see `docs/SPEC.md`, step 4).

```sh
cd public
python3 -m http.server 8089
```

Open http://127.0.0.1:8089/. Progress is saved in this browser only.

## Configuration

Copy `.env.example` to `.env` and set `DEEPSEEK_API_KEY`. `.env` is git-ignored and must
never be committed or served.

## Docs

- `docs/SPEC.md`: scope, decisions, steps, open questions.
- `docs/PROBLEMS.md`: every problem found and how it was fixed.
- `docs/SUBMISSION-CHECKLIST.md`: DaiL submission checklist with status.
- `docs/evidence/`: before and after screenshots.
