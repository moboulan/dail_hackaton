// All training content. Every person and product here is fictional.
// The product sheets are the only source of product facts for the app, the AI and the grading.

export const MODULE = {
  title: "Conseiller une cliente enrhumée, clairement et en sécurité",
  duration: "Environ 15 minutes",
  passMark: 80,
};

export const PRODUCTS = [
  {
    id: "respira",
    name: "Respira Mer",
    form: "Spray nasal d'eau de mer",
    forWhat: "Nez bouché ou qui coule pendant un rhume.",
    use: "Se moucher, puis pulvériser dans chaque narine, plusieurs fois par jour selon la notice.",
    caution: "Ne pas partager le flacon. Compatible avec une tension élevée.",
  },
  {
    id: "gorgea",
    name: "Gorgéa Miel",
    form: "Pastilles pour la gorge",
    forWhat: "Gorge qui gratte ou irritée.",
    use: "Laisser fondre lentement en bouche, selon la notice.",
    caution: "Contient du sucre : en cas de diabète, demander l'avis du médecin.",
  },
  {
    id: "decongest",
    name: "Décongest Nuit",
    form: "Comprimés contre le nez bouché la nuit",
    forWhat: "Nez très bouché qui empêche de dormir.",
    use: "Le soir, selon la notice.",
    caution: "Contre-indiqué en cas de tension élevée, de problème cardiaque ou de grossesse. Toujours poser la question avant de le proposer.",
  },
];

// Completes the sentence "Orientez vers un médecin en cas de ...".
export const SEE_A_DOCTOR =
  "forte fièvre, de symptômes depuis plus de 7 jours, de difficulté à respirer ou de douleur à l'oreille";

// What the pharmacist knows before the conversation. Her blood pressure treatment is not
// revealed here: the pharmacist has to ask.
export const SCENARIO = {
  customer: "Mme Naïma",
  summary:
    "Mme Naïma, une cliente habituée, entre à la pharmacie. Elle a le nez bouché et dort mal. Elle lit le français mais préfère souvent qu'on lui explique en darija.",
};

export const REFLEXES = [
  {
    title: "Demander la langue préférée",
    body: "« Vous préférez qu'on en parle en français ou en darija ? » Ne supposez jamais.",
  },
  {
    title: "Questionner avant de conseiller",
    body: "Les symptômes, depuis quand, les traitements en cours, une grossesse ou un problème de santé.",
  },
  {
    title: "Expliquer une étape à la fois, puis vérifier",
    body: "Une consigne, puis invitez la personne à reformuler avec ses mots.",
  },
  {
    title: "Proposer un complément seulement s'il aide",
    body: "S'il répond à un besoin réel et n'est pas contre-indiqué. Sinon, expliquez pourquoi vous ne le proposez pas.",
  },
];

// Preparation checks. `correct` is the index of the right option; order is deliberately mixed.
export const CHECKS = [
  {
    id: "first-step",
    question:
      "Mme Naïma demande « quelque chose de fort pour dormir avec le nez bouché ». Que faites-vous d'abord ?",
    options: [
      {
        text: "Je lui propose Décongest Nuit : c'est fait pour ça.",
        why: "Décongest Nuit a des contre-indications (tension élevée, problème cardiaque, grossesse). Sans poser la question, vous ne savez pas s'il est sûr pour elle.",
      },
      {
        text: "Je lui demande si elle prend un traitement ou a un problème de santé.",
        why: "On questionne avant de conseiller : c'est ce qui permet de choisir un produit sûr.",
      },
      {
        text: "Je lui donne les trois produits pour être sûr.",
        why: "Vendre sans besoin identifié n'aide pas la cliente et peut l'exposer à une contre-indication.",
      },
    ],
    correct: 1,
  },
  {
    id: "complement",
    question:
      "Un autre client, M. Karim, est enrhumé. Il prend un traitement pour la tension, sa gorge gratte et il n'est pas diabétique. Quel complément pouvez-vous lui proposer ?",
    options: [
      {
        text: "Aucun : on ne propose jamais de complément.",
        why: "Un complément est utile quand il répond à un besoin réel. Ici, sa gorge gratte : Gorgéa Miel l'aide.",
      },
      {
        text: "Décongest Nuit, pour qu'il dorme mieux.",
        why: "Non : Décongest Nuit est contre-indiqué en cas de tension élevée.",
      },
      {
        text: "Gorgéa Miel, pour sa gorge.",
        why: "Il répond à un besoin réel et n'est pas contre-indiqué pour lui.",
      },
    ],
    correct: 2,
  },
];
