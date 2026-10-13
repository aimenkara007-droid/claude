/* ============================================================
   Napoléon Services — données du site (communes à toutes les langues)

   Les textes traduits sont dans js/i18n/<langue>.js.
   Toute valeur qui commence par "TODO" (ou vaut null) s'affiche
   comme « à compléter » tant que `brouillon: true`, puis disparaît.
   ============================================================ */
window.NS = {
  // Passer à false avant la mise en ligne.
  brouillon: true,

  nomOfficiel: "Napoléon Services",
  siteWeb: "https://www.napoleonservices.com/",

  // Ordre du sélecteur de langue. Une langue absente de js/i18n/ est ignorée.
  langues: ["fr", "en", "ar", "es", "it", "ru", "zh"],
  langueParDefaut: "fr",

  contact: {
    adresse: "9-11 avenue Franklin-D.-Roosevelt",
    codePostal: "75008",
    ville: "Paris",
    pays: "FR",
    telephone: { affiche: "+33 9 52 56 66 63", lien: "+33952566663" },
    email: "TODO",
    // Numéro WhatsApp au format international, chiffres uniquement : "33612345678"
    whatsapp: "TODO",
  },

  reseaux: {
    instagram: null, // "https://www.instagram.com/…"
    facebook: null,
  },

  // Du lundi au dimanche : "09:00-19:00", "24h" ou "ferme". null = à compléter.
  horaires: null,

  // Fichiers à déposer dans images/. Si une photo manque, un décor la remplace.
  photos: {
    logo: "images/logo.png",           // facultatif : remplace l'emblème N
    accueil: "images/accueil.jpg",     // grande photo d'accueil (paysage, ~2400×1400)
    chauffeur: "images/chauffeur.jpg", // section « Avec chauffeur » (portrait, ~1200×1500)
    maison: "images/maison.jpg",       // section « La Maison » (portrait, ~1200×1500)
  },

  // Flotte. `categorie` : "suv", "sedan" ou "sport". Le texte de chaque modèle
  // est dans js/i18n/<langue>.js → fleet.cars.<id>.
  // `prix` : null = « Sur demande », sinon texte libre (ex. "dès 950 € / jour").
  flotte: [
    { id: "g63", marque: "Mercedes-AMG", modele: "G 63", embleme: "G 63", categorie: "suv", places: 5, prix: null, photo: "images/flotte/g63.jpg" },
    { id: "rrvogue", marque: "Land Rover", modele: "Range Rover Vogue", embleme: "Vogue", categorie: "suv", places: 5, prix: null, photo: "images/flotte/range-rover-vogue.jpg" },
    { id: "rrsport", marque: "Land Rover", modele: "Range Rover Sport", embleme: "Sport", categorie: "suv", places: 5, prix: null, photo: "images/flotte/range-rover-sport.jpg" },
    { id: "gle", marque: "Mercedes-Benz", modele: "GLE", embleme: "GLE", categorie: "suv", places: 5, prix: null, photo: "images/flotte/gle.jpg" },
    // CLS : 4 places avant 2018, 5 places depuis — à vérifier selon le modèle loué.
    { id: "cls", marque: "Mercedes-Benz", modele: "CLS", embleme: "CLS", categorie: "sedan", places: "TODO", prix: null, photo: "images/flotte/cls.jpg" },
    { id: "carrera", marque: "Porsche", modele: "911 Carrera", embleme: "911", categorie: "sport", places: 4, prix: null, photo: "images/flotte/911-carrera.jpg" },
  ],

  // Mentions légales (obligatoires en France). Affichées en français dans toutes les langues.
  mentions: {
    raisonSociale: "NAPOLEON SERVICES (N.S.)",
    forme: "SAS au capital de 10 500 €", // à confirmer : un registre indique une SASU
    rcs: "RCS Paris 808 344 675",
    siege: "9-11 avenue Franklin-D.-Roosevelt, 75008 Paris",
    tva: "TODO",
    directeurPublication: "TODO",
    hebergeur: "TODO", // nom, adresse et téléphone de l'hébergeur du site
  },
};
