/*
 * ============================================================
 *  CONTENU DU SITE — c'est le SEUL fichier à modifier.
 * ============================================================
 *
 *  Règle : toute valeur qui commence par "TODO" (ou qui vaut null)
 *  s'affiche sur le site comme « à compléter » en surbrillance.
 *  Remplacez-la par la vraie information.
 *
 *  Quand tout est rempli, passez `brouillon` à false pour retirer
 *  le bandeau « version provisoire ».
 *
 *  Pour vérifier qu'il ne reste rien à compléter : ouvrez le site,
 *  il ne doit plus y avoir aucun repère jaune « à compléter ».
 */

window.SALON = {
  brouillon: true,

  nom: "Jolie Vue",
  typeSalon: "Salon de coiffure pour femmes",
  slogan: "TODO slogan court (ex. une phrase qui résume l'esprit du salon)",

  presentation: [
    "TODO premier paragraphe de présentation : qui vous êtes, depuis quand, votre approche.",
    "TODO second paragraphe (facultatif) : vos spécialités, les marques de produits utilisées…",
  ],

  // Trois points forts affichés sous la présentation.
  pointsForts: [
    { titre: "Salon dédié aux femmes", texte: "TODO une phrase" },
    { titre: "TODO point fort 2", texte: "TODO une phrase" },
    { titre: "TODO point fort 3", texte: "TODO une phrase" },
  ],

  contact: {
    telephone: "TODO 00 00 00 00 00",       // format affiché
    telephoneLien: null,                    // ex. "+33600000000" (sans espaces)
    whatsapp: null,                         // ex. "33600000000" (sans + ni espaces) — laisser null si pas de WhatsApp
    email: null,                            // ex. "contact@salonjolievue.com"
    adresse: "TODO numéro et rue",
    codePostal: "TODO",
    ville: "TODO",
    pays: "FR",                             // code pays : FR, BE, CH, CA…
    // Lien de réservation en ligne (Planity, Treatwell, Google…). null = réservation par téléphone uniquement.
    reservationEnLigne: null,
  },

  reseaux: {
    instagram: null,                        // ex. "https://www.instagram.com/salonjolievue/"
    facebook: null,
    tiktok: null,
  },

  // Horaires : une ligne par jour. "Fermé" pour les jours de fermeture.
  horaires: [
    { jour: "Lundi",    heures: "TODO" },
    { jour: "Mardi",    heures: "TODO" },
    { jour: "Mercredi", heures: "TODO" },
    { jour: "Jeudi",    heures: "TODO" },
    { jour: "Vendredi", heures: "TODO" },
    { jour: "Samedi",   heures: "TODO" },
    { jour: "Dimanche", heures: "TODO" },
  ],

  /*
   * PRESTATIONS
   * Les catégories et noms ci-dessous sont des EXEMPLES de structure :
   * remplacez-les par la liste réelle du salon (copiée depuis la page
   * « Prestations » de l'ancien site).
   *   prix  : texte libre, ex. "35 €", "à partir de 60 €", "sur devis"
   *   duree : facultatif, ex. "45 min"
   *   detail: facultatif, une courte description
   */
  noteTarifs: "TODO ex. « Tarifs indicatifs, susceptibles de varier selon la longueur et l'épaisseur des cheveux. »",

  prestations: [
    {
      categorie: "Coupe & coiffage",
      items: [
        { nom: "Shampoing, coupe, brushing", prix: "TODO", duree: null, detail: null },
        { nom: "Shampoing, brushing", prix: "TODO", duree: null, detail: null },
        { nom: "Coupe frange", prix: "TODO", duree: null, detail: null },
      ],
    },
    {
      categorie: "Couleur",
      items: [
        { nom: "Couleur racines", prix: "TODO", duree: null, detail: null },
        { nom: "Couleur complète", prix: "TODO", duree: null, detail: null },
        { nom: "Patine / gloss", prix: "TODO", duree: null, detail: null },
      ],
    },
    {
      categorie: "Mèches & balayage",
      items: [
        { nom: "Balayage", prix: "TODO", duree: null, detail: null },
        { nom: "Mèches", prix: "TODO", duree: null, detail: null },
      ],
    },
    {
      categorie: "Soins",
      items: [
        { nom: "Soin profond", prix: "TODO", duree: null, detail: null },
      ],
    },
    {
      categorie: "Événements",
      items: [
        { nom: "Chignon / coiffure de soirée", prix: "TODO", duree: null, detail: null },
        { nom: "Forfait mariée", prix: "TODO", duree: null, detail: "TODO ex. « Essai inclus »" },
      ],
    },
  ],

  /*
   * PHOTOS — déposez les fichiers dans le dossier images/ avec ces noms.
   * Tant qu'un fichier manque, un fond décoratif s'affiche à sa place.
   */
  photos: {
    accueil: "images/accueil.jpg",          // grande photo à droite du titre (format vertical)
    salon: "images/salon.jpg",              // photo de l'intérieur du salon
    galerie: [
      "images/galerie-1.jpg",
      "images/galerie-2.jpg",
      "images/galerie-3.jpg",
      "images/galerie-4.jpg",
      "images/galerie-5.jpg",
      "images/galerie-6.jpg",
    ],
  },
};
