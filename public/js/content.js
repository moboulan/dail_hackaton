// All training content. Every person and product here is fictional.
// The product sheets are the only source of product facts for the app, the AI and the grading.

export const PROFILE = {
  name: "Dr Alami",
  licenceYear: 2026,
  modulesRequired: 1,
};

export const MODULE = {
  title: "Conseil rhume et complément",
  duration: "15 min",
  passMark: 80,
};

export const PRODUCTS = [
  {
    id: "respira",
    name: "Respira Mer",
    form: "Spray d'eau de mer",
    forWhat: "Nez bouché ou qui coule.",
    use: "Se moucher, puis une pulvérisation par narine, plusieurs fois par jour.",
    caution: "Aucune contre-indication. Ne pas partager le flacon.",
  },
  {
    id: "gorgea",
    name: "Gorgéa Miel",
    form: "Pastilles",
    forWhat: "Gorge qui gratte.",
    use: "Laisser fondre en bouche.",
    caution: "Contient du sucre : pas en cas de diabète.",
  },
  {
    id: "decongest",
    name: "Décongest Nuit",
    form: "Comprimés",
    forWhat: "Nez très bouché la nuit.",
    use: "Le soir.",
    caution: "Contre-indiqué si tension élevée, problème cardiaque ou grossesse.",
  },
];

export const SEE_A_DOCTOR = "forte fièvre, plus de 7 jours, gêne respiratoire, douleur à l'oreille";

// What the pharmacist knows before the conversation. Her blood pressure treatment is not
// revealed here: the pharmacist has to ask.
export const SCENARIO = {
  customer: "Mme Naïma",
  summary:
    "Mme Naïma a le nez bouché et dort mal. Elle lit le français mais préfère souvent qu'on lui explique en darija.",
};

export const REFLEXES = [
  { title: "Demander la langue", body: "« Vous préférez en français ou en darija ? »" },
  { title: "Questionner avant de conseiller", body: "Symptômes, traitements en cours, grossesse." },
  { title: "Une étape à la fois", body: "Une consigne, puis faites reformuler." },
  { title: "Un complément seulement s'il aide", body: "Jamais s'il est contre-indiqué." },
];

// Preparation checks. `correct` is the index of the right option; order is deliberately mixed.
export const CHECKS = [
  {
    id: "first-step",
    question: "Mme Naïma veut « quelque chose de fort pour dormir avec le nez bouché ». Que faites-vous d'abord ?",
    options: [
      { text: "Je propose Décongest Nuit.", why: "Il a des contre-indications : posez d'abord la question." },
      { text: "Je demande si elle a un traitement ou un problème de santé.", why: "Questionner d'abord permet de choisir un produit sûr." },
      { text: "Je donne les trois produits.", why: "Sans besoin identifié, on n'aide pas la cliente." },
    ],
    correct: 1,
  },
  {
    id: "complement",
    question: "M. Karim, enrhumé, traite sa tension, a mal à la gorge et n'est pas diabétique. Quel complément ?",
    options: [
      { text: "Aucun : jamais de complément.", why: "Sa gorge gratte : Gorgéa Miel l'aide." },
      { text: "Décongest Nuit, pour mieux dormir.", why: "Contre-indiqué avec une tension élevée." },
      { text: "Gorgéa Miel, pour sa gorge.", why: "Utile pour lui, sans contre-indication." },
    ],
    correct: 2,
  },
];
