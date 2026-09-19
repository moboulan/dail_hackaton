# Design: BP Learning, the ordonnancier

Direction: the pharmacy's register (ordonnancier) and the officine's cachet. Training is a
ruled register of numbered entries; a module is validated with a stamp. Built from
`nomadkit-DESIGN.md` (palette and rules) on 19 September 2026. Source of truth: `public/styles.css`.

## Palette

Forest-led. Forest acts (buttons, cachet, done and current step, numerals); green-tinted
neutrals structure; amber and red only carry meaning. NomadKit's sand was retired at the
user's request because it clashed with the green actions; its ocean and forest hues remain.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | #FBFCF8 | Page ground |
| `--surface` | #FFFFFF | Customer bubbles, quiz options, text field |
| `--wash` | #EDF4EE | Pharmacist bubbles, hover, notices |
| `--forest-wash` | #E3EFE6 | Chosen quiz answer |
| `--ink` / `--ink-soft` | #1D2621 / #56625A | Text; secondary text |
| `--rule` / `--rule-strong` | #E1E7E1 / #BCCABF | Register hairlines; field borders |
| `--forest` / `--forest-dark` | #166534 / #125429 | Primary buttons (white text, 7:1), brand mark, cachet, steps, numerals |
| `--forest-soft` | #8FB59A | Licence "/3", score parts below the 80 % mark |
| `--ocean` / `--ocean-text` | #0891B2 / #0E6F8A | Focus rings; "Vous auriez pu dire" |
| `--warning-text` | #8A5A08 | "À améliorer", "à repasser" |
| `--error-text` | #B91C1C | Product cautions, "Manqué", wrong answers |

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
- **Buttons**: primary forest with white text; secondary ink outline; 48 px min height.
- **Step bar** (centred in the header): numbered circles; current = ink disc + forest underline; done = forest disc with
  a check; locked = muted, not a link.
- **Chat**: Mémo (numbered, forest numerals) | conversation | compact shelf; side columns sticky.
- **Speaker label**: register caps above every chat message and excerpt line (customer name or "Vous").
- **Bilan criterion**: level column (icon + word) beside title, comment, the real exchange as two
  bubbles, "Vous auriez pu dire" in a dashed ocean bubble.
- **Résultat**: the module score lives once: the cachet, or a large ink figure with "80 % requis"
  and the criteria to rework (with level icons). Échange and Quiz as bars with an 80 % tick.
  Quiz corrections: your answer with a check or struck through, the right answer, the reason.
- **Quiz**: forest numerals, full-width options (52 px), chosen answer in forest wash; no correction until the Résultat.

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
