# Problems found and how they were fixed

Audit of the original starter (live at https://eagle-day-materials.vercel.app/learning-demo/,
identical to the baseline commit `aa0dfd0`), done 19 September 2026 in Chrome at 1440 px and
390 px wide. Each row is updated in the same commit that fixes it.

Severity: High = the learner is misled or the core task fails. Medium = friction or a broken
promise. Low = polish or hidden risk.
Evidence: a screenshot in `evidence/before/`, "browser" (reproduced by hand, no screenshot) or
"code" (found by reading the source, not yet reproduced).

## Simulation (the core task)

| ID | Problem | Evidence | Sev | Status | Fix (commit) |
| --- | --- | --- | --- | --- | --- |
| P01 | The customer's next line is fixed. A rude reply ("Je vais choisir la langue pour aller plus vite") gets the same polite answer as the best one, so it is not a conversation. | 03 | High | open | |
| P02 | Feedback is one sentence per turn, identical for every choice, so it praises weak replies ("Ce document est pourtant très clair" is followed by praise). | 03 | High | open | |
| P03 | Feedback appears only in a small bottom-right toast for 2.6 s, away from the answer. Easy to miss, impossible to reread. | 03, browser | High | open | |
| P04 | A weak reply gets no explanation, no better alternative and no retry. | browser | Medium | open | |
| P05 | The best reply is always option 1, in every dialogue turn and every quiz, so the right answer can be guessed. | code | Medium | open | |
| P06 | A green "Simulation terminée" box looks like success even when every reply was weak (0 %). | browser | Medium | open | |
| P07 | Mobile: header and navigation take about 190 px and the scenario card fills the first screen. The dialogue and the choices are below the fold. | 07 | Medium | open | |

## Result and quiz

| ID | Problem | Evidence | Sev | Status | Fix (commit) |
| --- | --- | --- | --- | --- | --- |
| P08 | The result shows a score (0 %) but not which replies were weak or why. | 04 | High | open | |
| P09 | "Parcours adapté à tes décisions" is false: the three modules are identical whatever the learner did. | 04, code | Medium | open | |
| P10 | The quiz sits inside the result page instead of being a clear final step. | 04 | Medium | open | |
| P11 | The quiz marks right and wrong but never explains why. | 04 | Medium | open | |
| P12 | Quiz answers lock after one click. The only way back is a full reset. | browser | Medium | open | |
| P13 | Answered quiz options turn pale grey (disabled styling), hard to read. | 04 | Low | open | |

## Progress and navigation

| ID | Problem | Evidence | Sev | Status | Fix (commit) |
| --- | --- | --- | --- | --- | --- |
| P14 | Progress counts clicks, not learning: 78 % with a 0 % dialogue score and a wrong quiz answer. | 05 | High | open | |
| P15 | "Prochaines étapes" keeps listing finished steps as next steps. | 05 | Low | open | |
| P16 | The disabled "Démarrer la simulation" button is a dummy gate: the Simulation nav link opens it without preparation. | browser | Medium | open | |
| P17 | The "NA / Profil fictif" button is not a profile; it opens the progress page. | browser | Low | open | |
| P18 | "Réinitialiser la progression locale" erases everything with no confirmation and no undo. | code | Medium | open | |
| P19 | The home page calls stage 3 "Modules", the result page calls it "Étape 3 · Résultat". | 01, 04 | Low | open | |

## Content and onboarding

| ID | Problem | Evidence | Sev | Status | Fix (commit) |
| --- | --- | --- | --- | --- | --- |
| P20 | No intro: the first screen does not explain what the app is, how it works or what is stored. | 01 | Medium | open | |
| P21 | Preparation is three checkboxes to tick. Nothing is practised or checked. | 02 | Medium | open | |
| P22 | German route names (`#vorbereitung`, `#abschluss`, `#lernplan`) in a French app, visible in the URL. | browser | Low | open | |

## Accessibility and robustness

| ID | Problem | Evidence | Sev | Status | Fix (commit) |
| --- | --- | --- | --- | --- | --- |
| P23 | Ticking a preparation box re-renders the page and sends keyboard focus to `<body>`. | browser (`document.activeElement` = BODY) | Medium | open | |
| P24 | `save()` writes to localStorage without try/catch, so it can throw when storage is blocked or full. | code | Low | open | |
| P25 | Every render re-attaches click listeners to the header nav links, so listeners pile up over a session. | code | Low | open | |
