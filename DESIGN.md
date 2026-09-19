# Design: BP Learning, the ordonnancier

Direction: the pharmacy's register (ordonnancier) and the officine's cachet. Training is a
ruled register of numbered entries; a module is validated with a stamp. Built from
`nomadkit-DESIGN.md` (palette and rules) on 19 September 2026. Source of truth: `public/styles.css`.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | #FFFDF7 | Page ground (NomadKit background) |
| `--surface` | #FFFFFF | Chat bubbles, quiz options, text field |
| `--sand` | #D4A373 | Primary buttons, brand mark, current-step underline, register numerals |
| `--sand-ink` | #2B1D0E | Text on sand (white on sand fails contrast) |
| `--sand-wash` | #F6EAD9 | Pharmacist bubbles, hover, notices |
| `--ink` / `--ink-soft` | #2A2118 / #5E5244 | Text; secondary text |
| `--rule` / `--rule-strong` | #E8DCC8 / #CDB899 | Register hairlines; field borders |
| `--ocean` / `--ocean-text` | #0891B2 / #0E6F8A | Focus rings; links and "better phrasing" text |
| `--forest` | #166534 | Cachet, done steps, right answers |
| `--warning-text` | #8A5A08 | "À améliorer", "à repasser" (NomadKit #CA8A04 is too light for text) |
| `--error-text` | #B91C1C | Product cautions, wrong answers |

Rule: meaning never rides on colour alone. Levels carry a word and an icon; cautions carry an
alert icon and a hidden "Attention :" label.

## Type

- **Atkinson Hyperlegible** (400, 400 italic, 700), self-hosted: everything you read. Chosen for
  legibility; its slashed zero is intentional.
- **Barlow Condensed** (600, 700), self-hosted as "Register": register caps (column heads,
  section titles, criterion levels, question numbers), brand name, licence count, scores, stamp.
- Tabular figures everywhere. Base 18 px (17 px on phones).

## Components

- **Register table** (dashboard): N°, Module (+ customer), Durée, État, one action per line;
  2 px ink rule under the head, 1 px sand hairlines between lines.
- **Register title**: condensed caps over a 2 px ink rule; used for "Votre rayon", "Mémo",
  "Vos produits".
- **Product line**: name, form in register caps, price right-aligned; purpose; usage (soft);
  caution (red, alert icon). Same markup on the Brief and the chat shelf (`.is-compact`).
- **Cachet** (`stamp()` in `js/html.js`): 3 px forest ring with an inner 1.5 px ring, "VALIDÉ",
  score, date, rotated -9°, ink-speckle SVG filter (`#ink`). Sizes: 84 px in the register,
  132 px on the result, 150 px on the printed attestation.
- **Buttons**: primary sand with dark ink text; secondary ink outline; 48 px min height.
- **Step bar**: numbered circles; current = ink disc + sand underline; done = forest disc with
  a check; locked = muted, not a link.
- **Chat**: Mémo (numbered, sand numerals) | conversation | compact shelf; side columns sticky.
- **Bilan criterion**: level column (icon + word) beside title, comment, "Vous avez dit",
  "Vous auriez pu dire" (ocean).
- **Quiz**: sand numerals, full-width options (52 px), right/wrong by border, wash and text.

## Motion

One authored moment: the cachet presses onto the result when a module is validated
(620 ms, exponential ease-out, scale 1.7 to 1 with a slight rotation). Skeleton shimmer while
the Bilan loads. Both disabled under `prefers-reduced-motion`.

## Print

Printing shows only the attestation: register-caps title, name, module, date, score and a
150 px cachet between two 3 px ink rules.

## Refused

Course-card grids, progress rings, eyebrow labels, coloured side borders on cards, gradient
text, emoji or glyph icons.
