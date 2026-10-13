/* Italiano — il testo tra *asterischi* è messo in risalto (corsivo dorato). */
(window.NS_I18N = window.NS_I18N || {}).it = {
  nom: "Italiano",
  code: "IT",
  htmlLang: "it",
  locale: "it_IT",

  meta: {
    title: "Napoléon Services — Noleggio auto di lusso con o senza autista a Parigi",
    description: "Noleggio di auto di prestigio con o senza autista e concierge di lusso a Parigi (8° arrondissement): Mercedes-AMG, Porsche, Range Rover, accoglienza VIP, hotel, jet privati, yacht e ville.",
  },

  ui: {
    skip: "Vai al contenuto",
    menuOpen: "Apri il menu",
    menuClose: "Chiudi il menu",
    language: "Lingua",
    todo: "da completare",
    draft: "Versione provvisoria — foto e informazioni in fase di inserimento",
  },

  nav: {
    fleet: "La flotta",
    chauffeur: "Con autista",
    concierge: "Concierge",
    house: "La Maison",
    contact: "Contatti",
    book: "Prenota",
  },

  hero: {
    eyebrow: "Parigi · Dal 2014",
    title: "Parigi, *in grande stile*.",
    lead: "Noleggio di auto di prestigio con o senza autista e servizi di concierge di lusso, nel cuore dell’8° arrondissement.",
    ctaBook: "Prenota",
    ctaFleet: "Scopri la flotta",
    scroll: "Scorri",
  },

  marquee: ["Con autista", "Senza autista", "Accoglienza VIP", "Jet privato", "Yacht", "Ville", "Hotel di lusso"],

  manifesto: {
    eyebrow: "Napoléon Services",
    title: "Una guida *imperiale*, un servizio *su misura*.",
    text: "Dal 2014 mettiamo a vostra disposizione automobili d’eccezione e un servizio di concierge che pensa a tutto. Un’auto pronta all’ora stabilita, un autista che conosce Parigi a memoria, una suite prenotata nell’hotel di lusso che preferite: a voi non resta che godervi il momento.",
    pillars: [
      { title: "Discrezione", text: "La riservatezza dei nostri clienti è la nostra prima regola, in ogni circostanza." },
      { title: "Eccellenza", text: "Ogni veicolo viene preparato con cura e controllato prima della consegna." },
      { title: "Su misura", text: "Un unico referente adatta ogni dettaglio al vostro programma e ai vostri desideri." },
    ],
  },

  fleet: {
    eyebrow: "La flotta",
    title: "Automobili *d’eccezione*",
    lead: "SUV, berline e sportive dei marchi più prestigiosi, disponibili con o senza autista.",
    filters: { all: "Tutta la flotta", suv: "SUV", sedan: "Berline", sport: "Sportive" },
    cat: { suv: "SUV", sedan: "Berlina", sport: "Sportiva" },
    seats: { one: "{n} posto", other: "{n} posti" },
    chauffeur: "Con o senza autista",
    price: "Tariffa",
    onRequest: "Su richiesta",
    cta: "Prenota questo modello",
    note: "La nostra flotta si rinnova: contattateci per conoscere le disponibilità del momento.",
    cars: {
      g63: "L’icona di AMG: una silhouette leggendaria e un V8 biturbo dal carattere inconfondibile.",
      rrvogue: "Il SUV di lusso per eccellenza: silenzio, raffinatezza e una vista dominante sulla città.",
      rrsport: "Tutto il carattere sportivo di Range Rover, senza rinunciare al comfort.",
      gle: "Il grande SUV di Mercedes-Benz: spazio, comfort e tecnologia per ogni spostamento.",
      cls: "La coupé a quattro porte di Mercedes-Benz, tra eleganza e dinamismo.",
      carrera: "La sportiva di riferimento dal 1963, per vivere Parigi al volante di una leggenda.",
    },
  },

  chauffeur: {
    eyebrow: "Con autista",
    title: "Il vostro autista *privato* a Parigi",
    lead: "Autisti professionisti, discreti e puntuali, per un’ora, una giornata o l’intero soggiorno.",
    services: [
      { title: "Transfer aeroporti e stazioni", text: "Servizio di prelievo a Roissy-Charles de Gaulle, Orly, Le Bourget e in tutte le stazioni di Parigi." },
      { title: "Servizio a disposizione", text: "Un’auto con autista al vostro servizio, a ore o a giornata." },
      { title: "Eventi", text: "Serate, matrimoni, sfilate, gala: un arrivo all’altezza dell’occasione." },
      { title: "Viaggi d’affari", text: "Riunioni, roadshow, delegazioni: un servizio affidabile per i vostri team e ospiti." },
    ],
    typesLabel: "La nostra flotta con autista",
    types: ["Berline", "SUV", "Limousine", "Van"],
  },

  concierge: {
    eyebrow: "Concierge di lusso",
    title: "Il vostro soggiorno, *orchestrato* per voi",
    lead: "Oltre all’automobile, il nostro servizio di concierge si occupa di ogni dettaglio della vostra visita.",
    items: {
      hotel: { title: "Hotel di lusso", text: "Prenotazioni nelle strutture più esclusive di Parigi e del mondo." },
      apartment: { title: "Appartamenti", text: "Appartamenti e residenze di pregio, per qualche notte o diversi mesi." },
      vip: { title: "Accoglienza VIP", text: "Accoglienza personalizzata in aeroporto e accompagnamento fino al vostro veicolo." },
      jet: { title: "Jet privato", text: "Noleggio di jet privati verso la destinazione che preferite." },
      yacht: { title: "Yacht", text: "Noleggio di yacht con equipaggio per le vostre fughe in mare." },
      villa: { title: "Ville", text: "Ville d’eccezione per vacanze, eventi o soggiorni in famiglia." },
    },
  },

  house: {
    eyebrow: "La Maison",
    title: "Nel cuore dell’*8° arrondissement*",
    paragraphs: [
      "Fondata nel 2014, Napoléon Services ha sede in avenue Franklin-D.-Roosevelt, a pochi passi dagli Champs-Élysées.",
      "Il nostro mestiere: offrire a una clientela esigente, francese e internazionale, la libertà di spostarsi e soggiornare a Parigi nelle migliori condizioni, con l’eleganza e la discrezione che si aspetta.",
    ],
    signature: "Napoléon Services — Parigi",
  },

  process: {
    eyebrow: "Come prenotare",
    title: "Tre passaggi, *nessun pensiero*",
    steps: [
      { title: "La vostra richiesta", text: "Per telefono, WhatsApp o tramite il modulo: diteci cosa desiderate." },
      { title: "La nostra proposta", text: "Vi rispondiamo con un’offerta personalizzata, adatta alle vostre date e ai vostri desideri." },
      { title: "La vostra esperienza", text: "La vostra auto, il vostro autista o il vostro soggiorno vi aspettano. Non vi resta che godervelo." },
    ],
  },

  booking: {
    eyebrow: "Prenotazione",
    title: "Prenotate la vostra *esperienza*",
    lead: "Descriveteci la vostra richiesta: vi risponderemo con una proposta su misura.",
    fields: {
      name: "Nome e cognome",
      phone: "Telefono",
      email: "E-mail",
      service: "Servizio",
      vehicle: "Veicolo desiderato",
      from: "Dal",
      to: "Al",
      message: "Il vostro messaggio",
      messagePlaceholder: "Luogo di partenza, numero di passeggeri, richieste particolari…",
    },
    services: {
      rent: "Noleggio senza autista",
      chauffeur: "Noleggio con autista",
      concierge: "Concierge",
      other: "Altra richiesta",
    },
    vehicleAny: "Nessuna preferenza",
    sendWhatsapp: "Invia via WhatsApp",
    sendEmail: "Invia per e-mail",
    orCall: "Oppure chiamateci",
    error: "Indicate il vostro nome e almeno un recapito (telefono o e-mail).",
    privacy: "I vostri dati sono utilizzati esclusivamente per gestire la vostra richiesta.",
    noChannel: "L’invio online sarà disponibile a breve. Nel frattempo, chiamateci.",
    mail: {
      subject: "Richiesta di prenotazione",
      intro: "Buongiorno, desidero effettuare una richiesta di prenotazione.",
    },
  },

  contact: {
    eyebrow: "Contatti",
    title: "Dove *trovarci*",
    address: "Indirizzo",
    phone: "Telefono",
    email: "E-mail",
    whatsapp: "WhatsApp",
    hours: "Orari",
    directions: "Indicazioni",
    mapTitle: "Mappa per raggiungere Napoléon Services",
    closed: "Chiuso",
    open24: "Aperto 24 ore su 24",
    today: "Oggi",
  },

  footer: {
    tagline: "Noleggio auto di lusso con o senza autista · Concierge · Parigi",
    legal: "Note legali",
    rights: "Tutti i diritti riservati.",
    close: "Chiudi",
  },

  legal: {
    title: "Note legali",
    note: "Le note legali sono fornite in francese, in conformità con la legge francese.",
  },

  mobile: {
    call: "Chiama",
    whatsapp: "WhatsApp",
    book: "Prenota",
  },
};
