# Jolie Vue — web del salón

Web estática (HTML + CSS + JS, sin dependencias ni compilación) para el salón de peluquería para mujeres **Jolie Vue**. El texto de la web está en francés.

## Estructura

```
index.html        estructura de la página (no hace falta tocarla)
css/styles.css    diseño
js/content.js     ← TODO el contenido: textos, precios, horarios, contacto, redes
js/main.js        genera la página a partir de content.js (no hace falta tocarlo)
images/           fotos del salón + favicon
```

Secciones: inicio · le salon · prestations & tarifs (pestañas por categoría) · galerie · rendez-vous · infos pratiques (dirección, teléfono, horarios con el día actual resaltado, mapa de Google) · pie con redes sociales. En móvil hay una barra fija abajo con «Appeler» y «Réserver».

## Rellenar el contenido

Todo se edita en `js/content.js`.

- Cualquier valor que empiece por `"TODO"` (o que valga `null`) aparece en la web como una etiqueta amarilla **« à compléter »**.
- Las prestaciones de ejemplo (nombres y categorías) son solo estructura: hay que sustituirlas por la lista real con sus precios.
- Los botones se activan solos según lo que se rellene: `telephoneLien` → botón «Appeler», `whatsapp` → botón WhatsApp, `reservationEnLigne` (Planity, Treatwell…) → botón «Réserver en ligne», `instagram` → enlace en galería y pie de página.
- El mapa aparece en cuanto `adresse` y `ville` están rellenados.
- Cuando no quede nada amarillo, poner `brouillon: false` para quitar el banner de «Version provisoire».

## Fotos

Copiar en `images/` con estos nombres exactos (JPG):

| Archivo | Dónde sale | Formato ideal |
|---|---|---|
| `accueil.jpg` | foto grande en arco, al lado del título | vertical, ~1200×1600 |
| `salon.jpg` | sección «Le salon» | vertical, ~1200×1500 |
| `galerie-1.jpg` … `galerie-6.jpg` | galería | 1, 3 y 4 verticales; el resto, cuadradas o verticales |

Mientras falte una foto se muestra un fondo decorativo en su lugar. Conviene comprimirlas (< 300 KB cada una, p. ej. con squoosh.app) para que la web cargue rápido en móvil.

## Ver la web en local

Abrir `index.html` con doble clic en el navegador. Funciona sin servidor.

## Publicarla

Cualquier hosting estático sirve, por ejemplo:

- **Netlify** (lo más simple): arrastrar la carpeta a app.netlify.com/drop.
- **GitHub Pages**: Settings → Pages → Deploy from branch → carpeta raíz.

Después, apuntar el dominio `salonjolievue.com` al hosting elegido desde el panel del registrador del dominio (los registros DNS exactos los indica Netlify/GitHub al añadir el dominio).
