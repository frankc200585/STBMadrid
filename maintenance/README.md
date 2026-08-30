# Modo mantenimiento — STBMadrid.com

Kit para dejar la web fuera del acceso publico de forma **temporal y reversible**.

Contenido:

| Archivo | Para que sirve |
|---|---|
| `index.html` | Pagina de aviso ("Volvemos enseguida"). Subela como `maintenance.html`. |
| `htaccess-maintenance.txt` | Bloque para el `.htaccess` (Apache, Hostinger, cPanel, WordPress). |
| `nginx-maintenance.conf` | Bloque equivalente para Nginx / VPS. |

## Recomendacion importante: usar 503, no 403 ni borrar la web

El bloqueo devuelve **HTTP 503 + Retry-After**. Es la respuesta correcta para una
parada temporal: Google entiende que es pasajero y **no pierdes posicionamiento**.
Si en cambio se apaga el dominio, se devuelve 404 o se despublica, el buscador
puede empezar a desindexar paginas en pocos dias.

## Segun donde este alojada la web

### Hostinger / cPanel / cualquier Apache
1. Sube `index.html` al raiz del dominio (`public_html/`) con el nombre `maintenance.html`.
2. Edita `public_html/.htaccess` y pega arriba del todo el contenido de `htaccess-maintenance.txt`.
3. Cambia `0.0.0.0` por tu IP publica (la ves en https://ifconfig.me) para poder seguir entrando tu.
4. Para reactivar la web: borra ese bloque del `.htaccess`.

### WordPress
Igual que arriba. Alternativa sin tocar ficheros: cualquier plugin de tipo
"Maintenance Mode" / "Coming Soon", activando la opcion de responder 503.

### VPS con Nginx
1. Deja `maintenance.html` en la raiz del sitio.
2. Pega `nginx-maintenance.conf` dentro del bloque `server { ... }`.
3. `sudo nginx -t && sudo systemctl reload nginx`.
4. Para reactivar: comenta o borra el bloque y recarga de nuevo.

### Cloudflare (si el dominio pasa por Cloudflare)
Lo mas rapido, sin tocar el hosting:
- **Rules → Redirect/Response Rules**: regla que a todo `hostname = stbmadrid.com`
  responda con la pagina de mantenimiento.
- O bien **Security → WAF**: regla `Block` para todo el trafico salvo tu IP.
- Se desactiva con un clic desde el panel.

### Netlify / Vercel / hosting estatico
- Netlify: `Site settings → General → Danger zone → Stop builds`, o publicar una
  rama que solo contenga `maintenance.html` como `index.html`.
- Vercel: `Settings → Deployment Protection` (protege el sitio con contrasena),
  o promocionar un deployment que solo sirva la pagina de aviso.

## Lo que NO conviene hacer
- Borrar los DNS o suspender el dominio: corta tambien el correo del dominio y
  tarda horas en propagarse al volver.
- Poner `Disallow: /` en robots.txt: no bloquea a los visitantes y si perjudica al SEO.
