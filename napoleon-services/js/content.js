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
  fondation: 2014,

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

  // Villes où les véhicules sont aussi disponibles (noms traduits dans js/i18n → cities).
  villes: ["paris", "geneve", "cannes", "monaco", "londres", "losangeles", "newyork"],

  photos: {
    logo: "images/logo.png",                         // facultatif : remplace l'emblème N
    chauffeur: "images/ambiance/chauffeur-gants.jpg",
    reservation: "images/ambiance/porsche-nuit.jpg",
    conciergerie: "images/ambiance/piscine.jpg",     // bandeau derrière le titre « Conciergerie »
    fondateur: "images/equipe/nassim-kara.jpg",
  },

  // Flotte en location. `categorie` : "suv", "sedan", "coupe" ou "compact".
  // `modele` : nom international ; une langue peut le traduire (fleet.modelNames).
  // Le texte de chaque modèle est dans js/i18n/<langue>.js → fleet.cars.<id>.
  // `prix` : null = « Sur demande », sinon texte libre (ex. "dès 950 € / jour").
  flotte: [
    { id: "s", marque: "Mercedes-Benz", modele: "S-Class", embleme: "S", categorie: "sedan", places: 5, prix: null, photo: "images/flotte/classe-s.jpg" },
    { id: "cls", marque: "Mercedes-Benz", modele: "CLS", embleme: "CLS", categorie: "sedan", places: 4, prix: null, photo: "images/flotte/cls.jpg" },
    { id: "g63", marque: "Mercedes-AMG", modele: "G 63", embleme: "G 63", categorie: "suv", places: 5, prix: null, photo: "images/flotte/g63.jpg" },
    { id: "gle", marque: "Mercedes-Benz", modele: "GLE", embleme: "GLE", categorie: "suv", places: 5, prix: null, photo: "images/flotte/gle.jpg" },
    { id: "rrvogue", marque: "Land Rover", modele: "Range Rover Vogue", embleme: "Vogue", categorie: "suv", places: 5, prix: null, photo: "images/flotte/range-rover-vogue.jpg" },
    { id: "rrsport", marque: "Land Rover", modele: "Range Rover Sport", embleme: "Sport", categorie: "suv", places: 5, prix: null, photo: "images/flotte/range-rover-sport.jpg" },
    { id: "carrera", marque: "Porsche", modele: "911 Carrera Cabriolet", embleme: "911", categorie: "coupe", places: 4, prix: null, photo: "images/flotte/911-carrera.jpg" },
    { id: "ccoupe", marque: "Mercedes-Benz", modele: "C-Class Coupé", embleme: "C", categorie: "coupe", places: 4, prix: null, photo: "images/flotte/classe-c-coupe.jpg" },
    { id: "a", marque: "Mercedes-Benz", modele: "A-Class", embleme: "A", categorie: "compact", places: 5, prix: null, photo: "images/flotte/classe-a.jpg" },
  ],

  // Flotte avec chauffeur (« à la journée ou à la course »).
  // `type` : "sedan", "suv" ou "van" (libellés traduits dans fleet.cat).
  chauffeurs: [
    { id: "s-chauffeur", marque: "Mercedes-Benz", modele: "S-Class · S 350 · S 500", type: "sedan", photo: "images/flotte/classe-s.jpg" },
    { id: "e-chauffeur", marque: "Mercedes-Benz", modele: "E-Class", type: "sedan", photo: "images/chauffeur/classe-e.jpg" },
    { id: "c-chauffeur", marque: "Mercedes-Benz", modele: "C-Class", type: "sedan", photo: "images/chauffeur/classe-c.jpg" },
    { id: "gle-chauffeur", marque: "Mercedes-Benz", modele: "GLE", type: "suv", photo: "images/flotte/gle.jpg" },
    { id: "v-chauffeur", marque: "Mercedes-Benz", modele: "V-Class", type: "van", photo: "images/chauffeur/classe-v.jpg" },
  ],

  // Destinations (noms traduits dans js/i18n → destinations.names), en deux rangées défilantes.
  destinations: [
    "paris", "saint-tropez", "monaco", "cannes", "courchevel", "gstaad", "geneve", "londres", "milan", "rome",
    "porto-cervo", "mykonos", "ibiza", "palma", "saint-barthelemy",
    "new-york", "miami", "los-angeles", "tulum", "mexico", "rio", "florianopolis", "punta-del-este",
    "le-cap", "phuket", "singapour", "hong-kong", "shanghai", "tokyo",
  ],

  // Adresses mises en avant par la conciergerie (noms propres, non traduits).
  hotels: [
    { nom: "Plaza Athénée", photo: "images/hotels/plaza-athenee.jpg" },
    { nom: "L’Apogée", photo: "images/hotels/lapogee.jpg" },
    { nom: "L’Auberge", photo: "images/hotels/lauberge.jpg" },
  ],

  // Jets privés et yachts (noms de modèles, non traduits). photo: null = carte sans photo.
  jets: [
    { nom: "Gulfstream GV", type: "jet", photo: "images/jets/gulfstream-gv.jpg" },
    { nom: "Cessna Citation CJ3", type: "jet", photo: "images/jets/cessna-cj3.jpg" },
    { nom: "Falcon 200", type: "jet", photo: null },
    { nom: "Princess 115", type: "yacht", photo: "images/yachts/princess-115.jpg" },
    { nom: "Mangusta 105", type: "yacht", photo: "images/yachts/mangusta-105.jpg" },
    { nom: "Riva 100", type: "yacht", photo: "images/yachts/riva-100.jpg" },
    { nom: "Sunseeker Predator 92", type: "yacht", photo: "images/yachts/sunseeker-predator-92.jpg" },
    { nom: "Pershing 90", type: "yacht", photo: "images/yachts/pershing-90.jpg" },
    { nom: "Azimut 68S", type: "yacht", photo: "images/yachts/azimut-68s.jpg" },
  ],

  // Cartes de membre présentées sur l'ancien site.
  cartes: ["Premium", "Gold", "Black"],

  // Témoignages de partenaires, cités dans leur langue d'origine (anglais).
  temoignages: [
    {
      texte: "The hotel Prince de Galles confirms that the professional relation with Mr. Kara Nassim of Napoleon Services has always been outstanding and serious.",
      auteur: "Leon Reinard", role: "Front Office Manager", societe: "Prince de Galles",
    },
    {
      texte: "We consider the partnership with Napoleon Services to be a mutual benefit to our respective business.",
      auteur: "Trond Sorensen", role: "Chief Sales Officer", societe: "Onyx",
    },
  ],

  fondateur: { nom: "Nassim Kara" },

  // Teintes du showroom 3D (les noms sont traduits dans showroom.paints).
  peintures: [
    { id: "obsidian", hex: "#0e0f12" },
    { id: "silver", hex: "#b9bdc3" },
    { id: "champagne", hex: "#c7ae84" },
    { id: "midnight", hex: "#16223d" },
    { id: "pearl", hex: "#ebe8e2" },
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
