# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Licensed pharmacists in Morocco doing mandatory continuing education to keep their licence. Not
tech-savvy, short on time, reading on a laptop at the pharmacy or at home. They want to validate
their modules with as little reading and as few clicks as possible.

## Product Purpose

BP Learning trains pharmacists to know what they sell and to advise a customer well: ask the
language preference, question before advising, explain one step at a time, and offer a
complementary product only when it helps. Success means a pharmacist validates their modules
and has actually practised the decision each one teaches.

## Positioning

Practice on a live AI customer who speaks French with darija and reacts to how she is spoken
to, followed by an honest debrief that quotes the pharmacist's own words, a short quiz, and an
attestation. Not a slide course with a multiple-choice test.

## Operating Context

Dashboard with licence status (validated / 3 modules). Each module: Brief, Échange (chat),
Bilan (AI debrief), Quiz with result and printable attestation. Modules: Rhume (do not
upsell), Coup de soleil (upsell when it helps), Mal de ventre (refer to a doctor).

## Capabilities and Constraints

- French interface, "vous" throughout; the AI customer mixes common darija words.
- All people, products and prices are fictional; no real drug facts or doses.
- No personal data leaves the browser unredacted; the chat warns against real patient data.
- Static front end plus Node API routes (`/api/chat`, `/api/debrief`) calling DeepSeek; deployed
  on Vercel. No build step, no dependencies. CSP: self-hosted assets only.

## Brand Commitments

- Design system provided by the team: `nomadkit-DESIGN.md` (sand primary #D4A373, ocean
  #0891B2, forest #166534, background #FFFDF7). Its rules: sand is the dominant primary
  action colour; never rely on colour alone; skeleton states for loading.
- Minimal copy. No duplicated information on a screen. No explainer or compliance blocks on
  client-facing screens.

## Evidence on Hand

Working app in `public/`, spec and audit in `docs/`. No logos, testimonials or real user data;
none may be invented.

## Product Principles

1. The pharmacist reads as little as possible and always sees one obvious next action.
2. Each piece of information appears once, where it is needed.
3. Feedback is honest and specific: scores match comments, quotes are real.
4. Practice first, rules learned through feedback.

## Accessibility & Inclusion

Not tech-savvy adults: large readable text, 44 px targets, keyboard and screen-reader support,
meaning never carried by colour alone.
