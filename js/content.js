/*
 * ============================================================
 *  CONTENU DU SITE — c'est le SEUL fichier à modifier.
 * ============================================================
 *
 *  Règle : toute valeur qui commence par "TODO" (ou qui vaut null)
 *  s'affiche sur le site comme « à compléter » en surbrillance.
 *  Remplacez-la par la vraie information.
 *
 *  Quand tout est prêt (photos comprises), passez `brouillon` à false
 *  pour retirer le bandeau « version provisoire ». Hors brouillon, ce
 *  qui reste vide est simplement masqué.
 */

window.SALON = {
  brouillon: true,

  nom: "Jolie Vue",                         // affiché en grand
  nomOfficiel: "Salon Jolie Vue",           // Google, pied de page
  mentionLogo: "Institut de beauté",        // petite ligne au-dessus du nom dans le logo
  accroche: "Salon de beauté · Oran",       // petite ligne au-dessus du titre
  slogan: "Laissez-nous sublimer votre beauté.",
  siteWeb: "https://salonjolievue.com/",
  fuseau: "Africa/Algiers",                 // pour mettre en avant le jour en cours à Oran

  titreSalon: "Un salon tout en un",
  presentation: [
    "Le salon Jolie Vue vous accueille dans un espace spacieux et élégant situé sur la frange maritime d’Oran, pensé pour offrir une expérience beauté haut de gamme : coiffure, soins esthétiques, maquillage, onglerie, soins du visage et du corps.",
    "Salon Jolie Vue s’engage à vous offrir une expérience inégalée, avec une attention personnalisée, des produits de qualité et des stylistes hautement qualifiés — que ce soit pour les soins, la coiffure ou la beauté de vos ongles.",
  ],

  // Trois points forts affichés sous la présentation.
  pointsForts: [
    { titre: "Tout en un seul lieu", texte: "Coiffure, soins du visage, maquillage, onglerie, épilations et massages." },
    { titre: "Des produits de qualité", texte: "Kérastase et L’Oréal Professionnel, pour des résultats à la hauteur de vos attentes." },
    { titre: "Un cadre raffiné", texte: "Un espace spacieux et élégant, dédié à la détente, sur la frange maritime d’Oran." },
  ],

  // Bandeau photo « Nos marques » (photo : photos.marques).
  marques: "Kérastase · L’Oréal Professionnel",

  // Grande phrase sur fond sombre.
  manifeste: {
    titre: "Nous prenons soin de votre bien-être.",
    texte: "Des conseils adaptés à votre personnalité : notre démarche est de vous apporter le meilleur des services et le meilleur des conseils.",
  },

  contact: {
    // affiche : tel qu'il apparaît ; lien : format international, sans espaces.
    telephones: [
      { libelle: "Mobile", affiche: "0553 75 24 61", lien: "+213553752461" },
      { libelle: "Fixe", affiche: "041 62 20 34", lien: "+21341622034" },
    ],
    whatsapp: null,                         // ex. "213553752461" (sans + ni espaces) — null si pas de WhatsApp
    email: "resa@salonjolievue.com",
    adresse: "Résidence Sahraoui, rue Belhadj Said, Hai\u00a0Khmisti",
    quartier: "Frange Maritime",
    codePostal: "31000",
    ville: "Oran",
    pays: "DZ",                             // code pays : DZ, FR, BE…
    googleMaps: null,                       // lien de la fiche Google Maps du salon (sinon calculé depuis l'adresse)
    reservationEnLigne: null,               // lien de réservation en ligne, s'il y en a un
  },

  texteRendezVous: "Par téléphone, ou par message sur Instagram.",

  reseaux: {
    instagram: "https://www.instagram.com/salon_jolie_vue/",
    messageInstagram: "https://ig.me/m/salon_jolie_vue", // ouvre une conversation privée (DM)
    facebook: null,                         // ex. "https://www.facebook.com/…"
    tiktok: null,
  },

  // Horaires : une ligne par jour, dans l'ordre voulu. "Fermé" pour les jours de fermeture.
  horaires: [
    { jour: "Samedi",   heures: "9h30 – 17h30" },
    { jour: "Dimanche", heures: "9h30 – 17h30" },
    { jour: "Lundi",    heures: "9h30 – 17h30" },
    { jour: "Mardi",    heures: "9h30 – 17h30" },
    { jour: "Mercredi", heures: "9h30 – 17h30" },
    { jour: "Jeudi",    heures: "9h30 – 17h30" },
    { jour: "Vendredi", heures: "Fermé" },
  ],
  horairesResume: "Du samedi au jeudi · 9h30 – 17h30",

  /*
   * PRESTATIONS
   * Une catégorie = un onglet. Une catégorie contient soit `items`,
   * soit des `groupes` (sous-titres) qui contiennent chacun des `items`.
   *   prix  : texte libre, ex. "6 000 DA", "4 000 – 5 500 DA", "Sur demande"
   *   duree : facultatif, ex. "45 min"
   */
  noteTarifs: "Tarifs en dinars algériens (DA). Pour les prix en fourchette, le tarif exact vous est confirmé au salon.",

  prestations: [
    {
      categorie: "Coiffure",
      groupes: [
        {
          titre: "Coupes & brushing",
          items: [
            { nom: "Coupe + brushing enfant", prix: "1 000 – 1 500 DA" },
            { nom: "Coupe + brushing adulte", prix: "2 000 – 3 000 DA" },
            { nom: "Brushing cheveux courts", prix: "800 DA" },
            { nom: "Brushing cheveux mi-longs", prix: "1 000 DA" },
            { nom: "Brushing cheveux longs ou épais", prix: "1 500 DA" },
            { nom: "Brushing cheveux extra longs", prix: "2 000 DA" },
          ],
        },
        {
          titre: "Colorations",
          items: [
            { nom: "Coloration racines", prix: "4 200 – 5 500 DA" },
            { nom: "Coloration globale", prix: "5 000 – 8 000 DA" },
            { nom: "Mèches avec papier", prix: "13 000 – 20 000 DA" },
            { nom: "Mèches avec bonnet", prix: "12 000 – 18 000 DA" },
            { nom: "Balayage à l’huile éclaircissante", prix: "7 000 – 12 000 DA" },
            { nom: "Contouring", prix: "15 000 – 20 000 DA" },
            { nom: "Patine", prix: "4 000 – 5 500 DA" },
          ],
        },
      ],
    },
    {
      categorie: "Soins capillaires",
      items: [
        { nom: "Soin hydratant", prix: "5 000 – 8 000 DA" },
        { nom: "Soin lissant — cheveux courts", prix: "20 000 DA" },
        { nom: "Soin lissant — carré", prix: "28 000 DA" },
        { nom: "Soin lissant — cheveux mi-longs", prix: "30 000 – 35 000 DA" },
        { nom: "Soin lissant — cheveux longs", prix: "35 000 – 38 000 DA" },
        { nom: "Soin lissant — cheveux très longs", prix: "40 000 – 45 000 DA" },
      ],
    },
    {
      categorie: "Soins du visage",
      items: [
        { nom: "Soin hydratant A (basique)", prix: "6 000 DA" },
        { nom: "Soin hydratant B (profond)", prix: "8 000 DA" },
        { nom: "Soin spécifique", prix: "10 000 DA" },
        { nom: "Soin oxygénant", prix: "6 000 DA" },
        { nom: "Soin éclaircissant", prix: "12 000 DA" },
        { nom: "Soin jeunesse globale", prix: "11 000 DA" },
        { nom: "Soin excelage A (basique)", prix: "15 000 DA" },
        { nom: "Soin excelage B (profond)", prix: "17 000 DA" },
        { nom: "Soin reconstituant", prix: "8 000 DA" },
        { nom: "Soin purifiant", prix: "8 000 DA" },
        { nom: "Soin lumière", prix: "8 000 DA" },
        { nom: "Soin 4 saisons A (basique)", prix: "12 000 DA" },
        { nom: "Soin 4 saisons B (profond)", prix: "15 000 DA" },
        { nom: "Soin oxypeeling", prix: "12 000 DA" },
        { nom: "Soin du regard", prix: "4 000 DA" },
      ],
    },
    {
      categorie: "Mise en beauté",
      groupes: [
        {
          titre: "Coiffures",
          items: [
            { nom: "Coiffure ondulée ramassée", prix: "3 000 – 5 000 DA" },
            { nom: "Coiffure mariée", prix: "8 000 – 15 000 DA" },
          ],
        },
        {
          titre: "Maquillage",
          items: [
            { nom: "Maquillage simple", prix: "5 000 DA" },
            { nom: "Maquillage soirée", prix: "10 000 DA" },
            { nom: "Maquillage mariée", prix: "15 000 DA" },
          ],
        },
        {
          titre: "Cils",
          items: [
            { nom: "Pose de cils effet naturel", prix: "12 000 DA" },
            { nom: "Pose de cils effet chargé", prix: "10 000 – 15 000 DA" },
            { nom: "Dépose de cils", prix: "Sur demande" },
          ],
        },
      ],
    },
    {
      categorie: "Manucure & pédicure",
      groupes: [
        {
          titre: "Manucure",
          items: [
            { nom: "Manucure", prix: "4 000 DA" },
            { nom: "Manucure + pose de vernis", prix: "5 000 DA" },
            { nom: "Pose de vernis", prix: "1 500 DA" },
            { nom: "French manucure", prix: "1 500 DA" },
            { nom: "Vernis semi-permanent", prix: "3 500 DA" },
            { nom: "Gel sur ongles naturels", prix: "3 500 DA" },
            { nom: "Gel sur capsules", prix: "4 500 DA" },
            { nom: "Gel + french / baby boomer", prix: "5 000 DA" },
            { nom: "Décoration sur gel", prix: "+ 500 DA" },
            { nom: "Dépose vernis semi-permanent", prix: "1 000 DA" },
            { nom: "Dépose gel", prix: "1 500 DA" },
          ],
        },
        {
          titre: "Pédicure",
          items: [
            { nom: "Pédicure", prix: "7 000 DA" },
            { nom: "Beauté des pieds", prix: "4 000 DA" },
            { nom: "Pose vernis semi-permanent", prix: "2 000 DA" },
            { nom: "Pose gel", prix: "3 800 DA" },
            { nom: "Dépose vernis semi-permanent", prix: "1 000 DA" },
            { nom: "Dépose gel", prix: "1 500 DA" },
          ],
        },
      ],
    },
    {
      categorie: "Épilations",
      items: [
        { nom: "Sourcils (forme)", prix: "1 000 DA" },
        { nom: "Sourcils (repousses)", prix: "700 DA" },
        { nom: "Moustache", prix: "500 DA" },
        { nom: "Menton", prix: "400 DA" },
        { nom: "Visage", prix: "3 000 DA" },
        { nom: "Maillot échancré", prix: "2 000 DA" },
        { nom: "Demi-bras", prix: "1 300 DA" },
        { nom: "Bras complets", prix: "1 500 DA" },
        { nom: "Demi-jambes", prix: "1 500 DA" },
        { nom: "Jambes complètes", prix: "3 000 DA" },
      ],
    },
    {
      categorie: "Massages",
      items: [
        { nom: "Massage crânien", duree: "30 min", prix: "4 000 DA" },
        { nom: "Massage du corps", duree: "45 min", prix: "6 000 DA" },
        { nom: "Massage du corps relaxant", duree: "1 h", prix: "6 000 DA" },
        { nom: "Massage du corps tonique", duree: "1 h", prix: "8 000 DA" },
        { nom: "Massage aux pierres chaudes", duree: "1 h", prix: "Sur demande" },
      ],
    },
  ],

  // Avis clients repris de l'ancien site : seules l'orthographe et la ponctuation
  // sont corrigées ; le 2e avis est abrégé […].
  avis: [
    "Accueil chaleureux, coupe courte réussie, joli salon, je recommande vivement !",
    "L’année passée, j’ai visité la ville d’Oran et j’ai fait ma coupe chez vous : très bon salon professionnel, et le personnel était sympathique et souriant. […] Je vais retourner sans hésitations.",
    "Ce joli salon, je le recommande vivement. Pour mon premier essayage, je suis très satisfaite du résultat. Je remercie toute l’équipe pour leur accueil ainsi que leur professionnalisme et leur sérieux. Bravo et bonne continuation à toutes, à bientôt inchallah !",
  ],

  /*
   * PHOTOS — déposez les fichiers dans le dossier images/ avec ces noms.
   * Accueil et salon : tant que le fichier manque, un fond décoratif
   * s'affiche à sa place. Marques et galerie : ce qui manque est masqué.
   */
  photos: {
    logo: "images/logo.png",                // logo (fond transparent de préférence) — sinon le nom s'affiche en texte
    accueil: "images/accueil.jpg",          // grande photo en arche, à côté du titre (verticale)
    salon: "images/salon.jpg",              // intérieur du salon
    marques: "images/marques.jpg",          // bandeau panoramique « Nos marques »
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
