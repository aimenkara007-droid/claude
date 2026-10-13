# Salon Jolie Vue — web del instituto de belleza

Web estática (HTML + CSS + JS, sin dependencias ni compilación) para **Salon Jolie Vue**, instituto de belleza para mujeres en la Frange Maritime de Orán (Argelia). El texto de la web está en francés.

## Estructura

```
index.html        estructura de la página (no hace falta tocarla)
css/styles.css    diseño
js/content.js     ← TODO el contenido: textos, precios, horarios, contacto, redes, opiniones
js/main.js        genera la página a partir de content.js (no hace falta tocarlo)
images/           fotos, logo y favicon
```

Secciones: portada · le salon · manifiesto · la carte (prestaciones y precios por pestañas) · galería · opiniones · rendez-vous · infos pratiques (dirección, teléfonos, horario con el día de hoy resaltado según la hora de Orán, mapa) · pie. En móvil hay una barra fija abajo con «Appeler» y «Message» (Instagram).

## Editar el contenido

Todo se edita en `js/content.js`.

- **Precios:** texto libre (`"6 000 DA"`, `"4 000 – 5 500 DA"`, `"Sur demande"`). Cada categoría es una pestaña y puede tener subgrupos (`groupes`).
- **Horario:** una línea por día con el formato `"9h30 – 17h30"`, o `"Fermé"`. Con ese formato, Google también recibe el horario estructurado.
- **Botones:** aparecen solos según lo que esté relleno: teléfonos, `messageInstagram`, `whatsapp` y `reservationEnLigne`.
- **Valores pendientes:** cualquier valor que empiece por `"TODO"` o valga `null` se muestra como etiqueta amarilla «à compléter» mientras `brouillon: true`.
- **Publicar:** antes de publicar se pone `brouillon: false`. Así desaparece el banner de «Version provisoire» y lo que siga vacío se oculta; por ejemplo, la galería entera si no hay fotos.

## Fotos y logo

Se copian en `images/` con estos nombres exactos:

| Archivo | Dónde sale | Formato ideal |
|---|---|---|
| `logo.png` | cabecera y pie (en el pie se invierte a blanco) | PNG con fondo transparente, logo en negro |
| `accueil.jpg` | foto grande en arco, junto al título | vertical, ~1200×1500 |
| `salon.jpg` | sección «Le salon» | vertical, ~1200×1500 |
| `galerie-1.jpg` … `galerie-6.jpg` | galería en mosaico | 1, 3 y 4 verticales; el resto, cuadradas o verticales |

- **Si falta una foto:** se muestra un fondo decorativo neutro en su lugar.
- **Si falta el logo:** se muestra el nombre en texto («Institut de beauté / Jolie Vue»).
- **Calidad:** conviene usar las fotos originales, no capturas de Instagram (esas tienen el texto superpuesto y poca resolución). Hay que comprimirlas a menos de 300 KB cada una, por ejemplo con squoosh.app.

## Ver la web en local

Abrir `index.html` con doble clic en el navegador. Funciona sin servidor.

## Publicarla

Cualquier hosting estático sirve, por ejemplo:

- **Netlify** (lo más simple): arrastrar la carpeta a app.netlify.com/drop.
- **GitHub Pages**: Settings → Pages → Deploy from branch → carpeta raíz.

Después se apunta el dominio `salonjolievue.com` al hosting, desde el panel del registrador del dominio.

**Importante:** el salón usa el email `resa@salonjolievue.com`. Al cambiar los DNS, los registros **MX** (y TXT/SPF) del dominio tienen que quedarse como están. Si se tocan, el email deja de funcionar. Solo se modifican los registros A/CNAME de la web.
