# Napoléon Services — site web

Site vitrine pour **Napoléon Services** (Paris 8e) : location de voitures de luxe avec ou sans chauffeur, et conciergerie.
Le site est statique (HTML + CSS + JS), sans dépendances ni compilation. Il est traduit en 7 langues : français, anglais, arabe, espagnol, italien, russe et chinois simplifié.

## Structure

```
index.html          structure de la page (pas besoin d'y toucher)
css/styles.css      design
js/content.js       ← données communes : contact, horaires, flotte, photos, mentions légales
js/i18n/fr.js …     ← textes de chaque langue (fr, en, ar, es, it, ru, zh)
js/main.js          affiche la page à partir des deux précédents (pas besoin d'y toucher)
images/             logo, photos, favicon ; images/flotte/ pour les voitures
```

Sections : accueil · bande défilante · manifeste · la flotte (avec filtres) · avec chauffeur · conciergerie · la Maison · comment réserver · formulaire de réservation · contact (horaires, carte) · pied de page · mentions légales.

## Langues

- **Langue affichée :** celle du navigateur du visiteur si elle est proposée, sinon l'anglais. Le visiteur peut en changer avec le sélecteur en haut à droite ou dans le pied de page, et son choix est mémorisé.
- **Lien direct :** `?lang=fr`, `?lang=en`, `?lang=ar`, `?lang=es`, `?lang=it`, `?lang=ru` ou `?lang=zh`. Google reçoit ces adresses via les balises `hreflang`.
- **Arabe :** toute la page passe de droite à gauche (`dir: "rtl"` dans `ar.js`), avec des polices arabes (Amiri pour les titres, Tajawal pour le texte). Les numéros, l'adresse, l'e-mail et les noms de voitures restent écrits de gauche à droite.
- **Polices du chinois et de l'arabe :** elles ne sont chargées que lorsque la langue est choisie (champ `fonts`).
- **Mise en valeur :** dans les fichiers `js/i18n/*.js`, le texte entre `*astérisques*` s'affiche en italique doré.
- **Relecture :** les traductions arabe, russe et chinoise doivent être relues par un locuteur natif avant la mise en ligne. Les tournures sont correctes, mais le ton « luxe » mérite une validation.
- **Ajouter une langue :**
  1. Copier `js/i18n/en.js` sous un nouveau nom et traduire le texte. Pour une langue qui s'écrit de droite à gauche, partir de `ar.js`.
  2. L'ajouter dans `langues` (`content.js`), dans `index.html` à côté des autres `<script>`, et dans les balises `hreflang`.

## Modifier le contenu

- **Contact :** `contact` dans `content.js`. `whatsapp` s'écrit au format international, chiffres seulement (ex. `"33612345678"`).
- **Horaires :** 7 valeurs, du lundi au dimanche, au format `"09:00-19:00"`, `"24h"` ou `"ferme"`.
- **Flotte :** une ligne par voiture dans `flotte`.
  - `categorie` vaut `"suv"`, `"sedan"` ou `"sport"`.
  - `prix: null` affiche « Sur demande ».
  - La description de chaque voiture se trouve dans chaque fichier de langue, sous `fleet.cars.<id>`.
- **Valeurs manquantes :** toute valeur `"TODO"` ou `null` s'affiche comme une étiquette jaune « à compléter » tant que `brouillon: true`.
- **Avant publication :** passer `brouillon: false`. L'étiquette « Version provisoire » et les cases vides disparaissent alors.
- **Formulaire de réservation :** il ne stocke rien. Il ouvre WhatsApp ou la messagerie du visiteur avec un message pré-rempli, dans la langue du visiteur. Les boutons n'apparaissent que si `whatsapp` ou `email` est renseigné.

## Photos

| Fichier | Où | Format conseillé |
|---|---|---|
| `images/accueil.jpg` | grande photo d'accueil (remplace le dessin de l'Arc de Triomphe) | paysage, ~2400×1400 |
| `images/chauffeur.jpg` | section « Avec chauffeur » | portrait, ~1200×1500 |
| `images/maison.jpg` | section « La Maison » | portrait, ~1200×1500 |
| `images/flotte/g63.jpg`, `range-rover-vogue.jpg`, `range-rover-sport.jpg`, `gle.jpg`, `cls.jpg`, `911-carrera.jpg` | cartes de la flotte | paysage 16:10, ~1600×1000 |
| `images/logo.png` | facultatif : remplace l'emblème « N » | PNG transparent, version claire |

- **Si une photo manque :** un décor la remplace (emblème doré, ou nom du modèle en grand pour les voitures).
- **Compression :** moins de 300 Ko par photo, par exemple avec squoosh.app.

## À valider avec le client avant la mise en ligne

Ces informations viennent de l'ancien site, tel qu'indexé par les moteurs de recherche, et du registre du commerce. Elles peuvent être anciennes.

- [ ] **Coordonnées :** adresse et téléphone (+33 9 52 56 66 63), toujours valables ?
- [ ] **Contact en ligne :** e-mail, numéro WhatsApp, Instagram.
- [ ] **Horaires** d'ouverture.
- [ ] **Flotte :** liste actuelle, nombre de places du CLS, tarifs éventuels.
- [ ] **Services :** chauffeur (aéroports desservis, types de véhicules) et conciergerie (yacht, jet, villas). Les détails ont été rédigés comme des propositions.
- [ ] **Mentions légales :** forme sociale (SAS ou SASU ?), capital, n° de TVA, directeur de la publication, hébergeur.
- [ ] **Photos et logo.**
- [ ] **Traductions :** relecture arabe, russe et chinoise.

## Voir le site en local

Ouvrir `index.html` d'un double clic. Il fonctionne sans serveur.

## Mise en ligne

N'importe quel hébergement statique convient : Netlify (glisser le dossier sur app.netlify.com/drop), GitHub Pages, ou l'hébergeur actuel du client.

Ensuite, on fait pointer `napoleonservices.com` vers le nouvel hébergement. **Attention :** si le client reçoit des e-mails sur ce domaine, les enregistrements **MX** (et TXT/SPF) doivent rester inchangés. Seuls les enregistrements A/CNAME du site sont à modifier.
