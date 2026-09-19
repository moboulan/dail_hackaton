// All training content. Every person and product is fictional.
// Product cards are the only source of product facts for the app, the AI and the grading.
// What each customer hides until asked lives on the server (lib/personas.js), not here.

export const PROFILE = { name: "Dr Alami", licenceYear: 2026 };

export const PASS_MARK = 80;

// The scoring grid of every debrief, also shown as the "Mémo" during the chat.
export const REFLEXES = [
  { title: "Demander la langue", body: "« Vous préférez en français ou en darija ? »" },
  { title: "Questionner avant de conseiller", body: "Symptômes, depuis quand, traitements, grossesse." },
  { title: "Une étape à la fois", body: "Une consigne, puis faites reformuler." },
  { title: "Un complément seulement s'il aide", body: "Jamais s'il est contre-indiqué." },
];

export const MODULES = [
  {
    id: "rhume",
    title: "Rhume",
    duration: "10 min",
    customer: "Mme Naïma",
    brief: "Mme Naïma a le nez bouché et dort mal. Elle préfère souvent qu'on lui explique en darija.",
    opening: "Salam, bonjour. J'ai le nez bouché, je dors très mal. Vous avez quelque chose de fort pour la nuit ?",
    products: [
      { name: "Respira Mer", price: 45, form: "Spray d'eau de mer", forWhat: "Nez bouché ou qui coule.", use: "Se moucher, puis une pulvérisation par narine, plusieurs fois par jour.", caution: "Aucune contre-indication. Ne pas partager le flacon." },
      { name: "Gorgéa Miel", price: 30, form: "Pastilles", forWhat: "Gorge qui gratte.", use: "Laisser fondre en bouche.", caution: "Contient du sucre : pas en cas de diabète." },
      { name: "Décongest Nuit", price: 55, form: "Comprimés", forWhat: "Nez très bouché la nuit.", use: "Le soir.", caution: "Contre-indiqué si tension élevée, problème cardiaque ou grossesse." },
    ],
    quiz: [
      {
        id: "q1",
        question: "Une cliente veut « quelque chose de fort pour dormir avec le nez bouché ». Que faites-vous d'abord ?",
        options: [
          { text: "Je propose Décongest Nuit.", why: "Il a des contre-indications : posez d'abord la question." },
          { text: "Je demande si elle a un traitement ou un problème de santé.", why: "Questionner d'abord permet de choisir un produit sûr." },
          { text: "Je donne les trois produits.", why: "Sans besoin identifié, on n'aide pas la cliente." },
        ],
        correct: 1,
      },
      {
        id: "q2",
        question: "M. Karim, enrhumé, traite sa tension, a mal à la gorge et n'est pas diabétique. Quel complément ?",
        options: [
          { text: "Aucun : jamais de complément.", why: "Sa gorge gratte : Gorgéa Miel l'aide." },
          { text: "Décongest Nuit, pour mieux dormir.", why: "Contre-indiqué avec une tension élevée." },
          { text: "Gorgéa Miel, pour sa gorge.", why: "Utile pour lui, sans contre-indication." },
        ],
        correct: 2,
      },
      {
        id: "q3",
        question: "Quelle première question respecte le mieux la cliente ?",
        options: [
          { text: "« Vous comprenez le français ? »", why: "Elle peut se sentir jugée : proposez plutôt un choix." },
          { text: "« Vous parlez darija, non ? »", why: "On ne suppose jamais la langue de quelqu'un." },
          { text: "« Vous préférez en français ou en darija ? »", why: "Elle choisit, sans être jugée." },
        ],
        correct: 2,
      },
    ],
  },
  {
    id: "soleil",
    title: "Coup de soleil",
    duration: "10 min",
    customer: "Yasmine",
    brief: "Yasmine a les épaules brûlées par le soleil. Elle retourne à la plage demain.",
    opening: "Bonjour ! J'ai pris un gros coup de soleil sur les épaules hier, ça brûle. Vous avez quelque chose ?",
    products: [
      { name: "Apaisa Gel", price: 60, form: "Gel après-soleil", forWhat: "Coup de soleil léger, peau rouge.", use: "En couche fine, plusieurs fois par jour.", caution: "Pas sur des cloques ni une peau abîmée." },
      { name: "Solaris 50", price: 120, form: "Crème solaire SPF 50", forWhat: "Protéger la peau du soleil.", use: "Avant l'exposition, à renouveler toutes les 2 heures.", caution: "Aucune contre-indication." },
      { name: "Bronz'Express", price: 90, form: "Autobronzant", forWhat: "Donner un teint hâlé.", use: "Sur peau propre et saine.", caution: "Ne protège pas du soleil. Pas sur une peau brûlée." },
    ],
    quiz: [
      {
        id: "q1",
        question: "Yasmine retourne à la plage demain. Que proposez-vous en plus d'Apaisa Gel ?",
        options: [
          { text: "Rien de plus.", why: "Elle s'expose demain : une protection lui évite une nouvelle brûlure." },
          { text: "Solaris 50.", why: "Elle s'expose demain : c'est un complément vraiment utile." },
          { text: "Bronz'Express.", why: "Un autobronzant ne protège pas du soleil." },
        ],
        correct: 1,
      },
      {
        id: "q2",
        question: "Sa peau présente des cloques. Que faites-vous ?",
        options: [
          { text: "Je l'oriente vers un médecin.", why: "Des cloques dépassent le conseil au comptoir." },
          { text: "Je conseille Apaisa Gel.", why: "Pas sur des cloques : orientez vers un médecin." },
          { text: "Je conseille Solaris 50.", why: "Une crème solaire ne soigne pas une brûlure." },
        ],
        correct: 0,
      },
      {
        id: "q3",
        question: "Comment vérifier qu'elle a compris l'utilisation ?",
        options: [
          { text: "« C'est clair ? »", why: "Un oui ne prouve pas la compréhension." },
          { text: "« Lisez bien la notice. »", why: "Cela ne vérifie rien." },
          { text: "« Vous pouvez me redire comment vous allez l'appliquer ? »", why: "La reformulation montre ce qu'elle a retenu." },
        ],
        correct: 2,
      },
    ],
  },
  {
    id: "ventre",
    title: "Mal de ventre",
    duration: "10 min",
    customer: "M. Driss",
    brief: "M. Driss a mal au ventre depuis deux jours. Il veut « quelque chose qui calme ».",
    opening: "Bonjour. J'ai mal au ventre depuis deux jours, donnez-moi quelque chose qui calme, je n'ai pas le temps d'aller chez le médecin.",
    products: [
      { name: "Digestia", price: 35, form: "Comprimés à croquer", forWhat: "Brûlures d'estomac après un repas.", use: "Après le repas.", caution: "Pas en cas de douleur forte ou de fièvre." },
      { name: "Flora+", price: 70, form: "Gélules", forWhat: "Digestion difficile, ballonnements.", use: "Le matin.", caution: "Ne remplace pas une consultation." },
      { name: "Spasmo Doux", price: 40, form: "Comprimés", forWhat: "Crampes légères.", use: "Au moment de la crampe.", caution: "Peut masquer un problème grave : pas si douleur forte ou fièvre." },
    ],
    quiz: [
      {
        id: "q1",
        question: "Avant de conseiller pour un mal de ventre, que demandez-vous ?",
        options: [
          { text: "« Quel produit voulez-vous ? »", why: "Le client ne connaît pas la cause : questionnez d'abord." },
          { text: "« Où avez-vous mal, depuis quand, avez-vous de la fièvre ? »", why: "Ces questions font apparaître les signes d'alerte." },
          { text: "Rien : je propose Digestia.", why: "Sans questions, vous pouvez manquer un signe d'alerte." },
        ],
        correct: 1,
      },
      {
        id: "q2",
        question: "M. Driss a très mal en bas à droite et de la fièvre. Que faites-vous ?",
        options: [
          { text: "Spasmo Doux pour calmer la douleur.", why: "Signe d'alerte : il ne faut pas masquer la douleur." },
          { text: "Digestia et Flora+.", why: "Vendre retarde une consultation urgente." },
          { text: "Je l'oriente vers un médecin aujourd'hui.", why: "Douleur localisée et fièvre : il doit consulter vite." },
        ],
        correct: 2,
      },
      {
        id: "q3",
        question: "Il insiste pour acheter quelque chose. Que faites-vous ?",
        options: [
          { text: "Je lui explique pourquoi un médecin doit le voir d'abord.", why: "Expliquer l'aide à accepter la consultation." },
          { text: "Je vends Spasmo Doux pour lui faire plaisir.", why: "Cela peut masquer un problème grave." },
          { text: "Je refuse sans explication.", why: "Sans explication, il risque de ne pas consulter." },
        ],
        correct: 0,
      },
    ],
  },
];

export function moduleById(id) {
  return MODULES.find((m) => m.id === id);
}
