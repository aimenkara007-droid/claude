# Napoléon Services — site web

Site vitrine de **Napoléon Services** (Paris 8e) : location de voitures de luxe avec ou sans chauffeur, conciergerie, jets et yachts.

- **Technique :** site statique (HTML + CSS + JS), sans compilation. Il s'héberge tel quel sur Netlify ou n'importe quel hébergement de fichiers.
- **Langues :** français, anglais, arabe, espagnol, italien, russe et chinois simplifié.
- **3D :** les scènes 3D utilisent Three.js, chargé depuis un CDN. Il faut donc une connexion Internet ; sans elle, le site affiche des images à la place (voir plus bas).

## Structure

```
index.html          structure de la page (pas besoin d'y toucher)
css/styles.css      design et animations
js/content.js       ← données : contact, flotte, chauffeurs, destinations, jets, photos, mentions légales
js/i18n/fr.js …     ← textes de chaque langue (fr, en, ar, es, it, ru, zh)
js/main.js          construit la page à partir des deux précédents, gère les animations
js/scene3d.js       scènes 3D : voiture d'accueil, showroom, jet
images/             photos (flotte, chauffeur, destinations, hôtels, jets, yachts, équipe, ambiance)
```

## Sections

Dans l'ordre de la page :

1. **Ouverture.** Animation avec l'emblème, une fois par visite.
2. **Accueil.** Une berline 3D arrive devant l'Arc de Triomphe et allume ses phares.
3. **Bande défilante.**
4. **Manifeste.** Trois valeurs et des compteurs animés.
5. **La flotte.**
   - Showroom 3D : la voiture tourne à la souris ou au doigt, change de silhouette selon le filtre (SUV, berline, coupé, compacte) et de teinte au choix.
   - Neuf cartes de voitures, avec effet de relief au survol.
6. **Avec chauffeur.** Services et flotte avec chauffeur.
7. **Jets & yachts.**
   - Un jet 3D traverse le ciel au rythme du défilement.
   - Galerie horizontale, épinglée pendant le défilement sur ordinateur.
8. **Destinations.** 29 destinations sur deux rangées défilantes, et trois hôtels.
9. **Conciergerie.**
10. **Club Napoléon.** Cartes Premium, Gold et Black en relief.
11. **Témoignages.**
12. **La Maison.** Texte, villes et fondateur.
13. **Comment réserver.**
14. **Formulaire de réservation.**
15. **Contact.**
16. **Pied de page** et **mentions légales.**

**Fiches détaillées.** Un clic sur une voiture (location ou chauffeur), une destination, un jet ou un yacht ouvre sa fiche :
- grande photo, description, caractéristiques ;
- bouton qui pré-remplit le formulaire de réservation (modèle choisi, ou « Destination : Monaco », « Yacht : Riva 100 ») ;
- pour les voitures, bouton « Voir en 3D » qui affiche la silhouette correspondante dans le showroom ;
- passage à la fiche suivante avec les flèches, le clavier ou en glissant le doigt ; fermeture avec la croix, Échap ou un clic à côté.

Toutes les animations respectent le réglage « réduire les animations » du système du visiteur.

Le curseur doré et l'effet de relief au survol n'apparaissent que sur ordinateur, avec une souris.

## 3D

- **Chargement :** Three.js 0.170 est chargé depuis `cdn.jsdelivr.net`, déclaré dans `index.html` (bloc `importmap`).
- **Modèles :** voiture et jet sont modélisés dans le code (`js/scene3d.js`). Aucun fichier 3D à fournir.
- **Si la 3D ne se charge pas** (pas d'Internet, navigateur trop ancien, WebGL désactivé), le site reste complet :
  - à l'accueil, l'Arc de Triomphe est dessiné au trait doré ;
  - le showroom affiche un bandeau ;
  - le ciel des jets montre la photo du Cessna.
- **Performance :** une scène n'est calculée que lorsqu'elle est visible à l'écran.

## Langues

- **Langue affichée :** celle du navigateur du visiteur si elle est proposée, sinon l'anglais. Le visiteur peut en changer avec le sélecteur en haut ; son choix est mémorisé.
- **Lien direct :** `?lang=fr`, `?lang=en`, `?lang=ar`, `?lang=es`, `?lang=it`, `?lang=ru` ou `?lang=zh`. Ces adresses sont signalées à Google par les balises `hreflang`.
- **Arabe :**
  - la page passe de droite à gauche ;
  - les scènes 3D sont reflétées pour suivre le sens de lecture ;
  - les numéros, l'adresse et les noms de modèles restent de gauche à droite.
- **Mise en valeur :** dans `js/i18n/*.js`, le texte entre `*astérisques*` s'affiche en italique doré.
- **Relecture :** faire relire l'arabe, le russe et le chinois par un locuteur natif avant la mise en ligne.

## Modifier le contenu (`js/content.js`)

- **Contact :** `contact`. Le numéro `whatsapp` s'écrit au format international, chiffres seulement (ex. `"33612345678"`).
- **Horaires :** 7 valeurs, du lundi au dimanche, au format `"09:00-19:00"`, `"24h"` ou `"ferme"`. Avec `null`, le bloc affiche « à compléter » pendant le brouillon, puis disparaît.
- **Flotte :** une ligne par voiture dans `flotte`.
  - `categorie` vaut `"suv"`, `"sedan"`, `"coupe"` ou `"compact"`.
  - La catégorie décide aussi de la silhouette 3D du showroom.
  - `prix: null` affiche « Sur demande ».
  - La description se trouve dans chaque fichier de langue, sous `fleet.cars.<id>`.
- **Avec chauffeur :** `chauffeurs`, dont `type` vaut `"sedan"`, `"suv"` ou `"van"`.
- **Destinations :** `destinations`, une ligne par destination.
  - `pays` : code ISO à deux lettres (`"FR"`, `"US"`…). Le navigateur affiche le nom du pays dans la langue du visiteur. `null` pour ne rien afficher (Monaco, Singapour…).
  - `saison` : meilleurs mois `[début, fin]`, de 1 à 12 (`[12, 4]` = décembre – avril) ; `null` = toute l'année.
  - La photo est `images/destinations/<id>.jpg`. Le nom et la description sont dans chaque langue, sous `destinations.names` et `destinations.desc`.
- **Hôtels :** `hotels`.
- **Jets et yachts :** `jets`. `type` vaut `"jet"` ou `"yacht"` ; avec `photo: null`, un emblème remplace la photo.
  - Caractéristiques de la fiche : `passagers` et `autonomieKm` pour un jet, `longueurM` pour un yacht. Une valeur absente n'est pas affichée.
  - La description est dans chaque langue, sous `jets.desc.<id>`.
- **Descriptions des voitures :** le texte court de la carte est sous `fleet.cars.<id>`, le texte long de la fiche sous `fleet.more.<id>`. Pour les voitures avec chauffeur : `chauffeur.more.<id>`.
- **Cartes du club :** `cartes`.
- **Témoignages :** `temoignages`, cités en anglais comme sur l'ancien site.
- **Teintes du showroom :** `peintures`.
- **Valeurs manquantes :** toute valeur `"TODO"` ou `null` s'affiche comme une étiquette jaune « à compléter » tant que `brouillon: true`.
- **Avant publication :** passer `brouillon: false`. Le bandeau « Version provisoire » et les étiquettes jaunes disparaissent.
- **Formulaire de réservation :** il ne stocke rien. Il ouvre WhatsApp ou la messagerie du visiteur avec un message pré-rempli. Les boutons n'apparaissent que si `whatsapp` ou `email` est renseigné ; sinon, le site invite à téléphoner.

## Photos

Les photos actuelles sont découpées dans les captures d'écran de l'ancien site. Elles sont donc en basse définition (environ 620 px de large ; 1 900 px pour les jets et yachts).

Pour une meilleure qualité, il suffit de remplacer chaque fichier par l'original, sous le même nom :

| Dossier | Contenu | Format conseillé |
|---|---|---|
| `images/flotte/` | 9 voitures de location | paysage 16:10, ~1600×1000 |
| `images/chauffeur/` | Classe V, C, E | paysage 4:3, ~1200×900 |
| `images/destinations/` | 29 destinations | paysage 4:3, ~1200×900 |
| `images/hotels/` | Plaza Athénée, L'Apogée, L'Auberge | paysage 4:3, ~1200×900 |
| `images/jets/`, `images/yachts/` | jets et yachts | paysage 2:1, ~2000×1000 |
| `images/equipe/nassim-kara.jpg` | fondateur | carré, ~800×800 |
| `images/ambiance/` | chauffeur, réservation (Porsche de nuit), piscine (conciergerie) | selon l'emplacement |
| `images/logo.png` | facultatif : remplace l'emblème « N » | PNG transparent, version claire |

- **Si une photo manque :** un décor la remplace (emblème doré ou nom du modèle).
- **Compression :** moins de 300 Ko par photo, par exemple avec squoosh.app.

## À valider avec le client avant la mise en ligne

- [ ] **Contact en ligne :** e-mail et numéro WhatsApp. Ils n'apparaissent pas sur l'ancien site ; sans eux, le formulaire ne peut pas envoyer de demande.
- [ ] **Horaires** d'ouverture.
- [ ] **Coordonnées :** adresse (9-11 avenue Franklin-D.-Roosevelt) et téléphone (+33 9 52 56 66 63), toujours valables ?
- [ ] **Flotte :**
  - liste actuelle ;
  - nombre de places du CLS (4 supposé) ;
  - tarifs éventuels.
- [ ] **Club :** avantages des cartes Premium, Gold et Black.
- [ ] **Jets et yachts :**
  - photo du Falcon 200 (absente de l'ancien site) ;
  - caractéristiques des fiches, données à titre indicatif d'après les modèles : passagers et autonomie des jets, longueur des yachts. À confirmer selon les appareils et les yachts que le client propose vraiment.
- [ ] **Destinations :** meilleures saisons et descriptions, rédigées comme des propositions.
- [ ] **Photos :**
  - originaux en haute définition ;
  - la photo « Mykonos » de l'ancien site montre Santorin ;
  - le logo.
- [ ] **Témoignages et photo du fondateur :** accord pour les reprendre.
- [ ] **Mentions légales :**
  - forme sociale et capital (SAS au capital de 10 500 € ?) ;
  - n° de TVA ;
  - directeur de la publication ;
  - hébergeur.
- [ ] **Traductions :** relecture de l'arabe, du russe et du chinois.

## Voir le site

- **Sur son ordinateur :** double-cliquer sur `index.html`. Tout fonctionne sans serveur ; la 3D demande une connexion Internet.
- **En ligne avec Netlify :**
  1. Aller sur app.netlify.com/drop.
  2. Glisser le dossier du site, celui qui contient `index.html`.
  3. Netlify donne une adresse du type `xxx.netlify.app`.

## Mise en ligne sur le domaine

Il faut ensuite faire pointer `napoleonservices.com` vers le nouvel hébergement : seuls les enregistrements A/CNAME du site sont à modifier.

**Attention :** si le client reçoit des e-mails sur ce domaine, ne pas toucher aux enregistrements **MX** ni TXT/SPF.
