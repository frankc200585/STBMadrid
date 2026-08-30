# Modo mantenimiento — STBMadrid.com

Cierre **temporal** de la web al publico, con **reapertura automatica**.

- Cierre: en cuanto lo instales.
- Reapertura: **miercoles 2 de septiembre de 2026, 08:00** (configurable).
- No hay que volver a entrar a quitar nada.

| Archivo | Para que sirve |
|---|---|
| `index.html` | Pagina de aviso. Subela al raiz como `maintenance.html`. |
| `htaccess-maintenance.txt` | Bloque para el `.htaccess`, con fecha de fin automatica. |
| `nginx-maintenance.conf` | Equivalente para Nginx / VPS. |

## Instalacion (Hostinger / cPanel / WordPress / cualquier Apache)

1. Administrador de archivos → carpeta `public_html/`.
2. Sube `index.html` y renombralo a **`maintenance.html`**.
3. Abre `public_html/.htaccess` (creale si no existe) y pega el contenido de
   `htaccess-maintenance.txt` **al principio del archivo**. Guarda.
4. Hecho. La web queda cerrada y se reabre sola el miercoles.

**Cambiar la fecha de vuelta:** edita el numero de la linea
`RewriteCond %{TIME} <20260902080000` (formato `AAAAMMDDHHMMSS`).
**Reabrir antes de tiempo:** borra ese bloque del `.htaccess`.
**Seguir viendo la web tu:** sustituye `0.0.0.0` por tu IP (https://ifconfig.me).

### Sobre la hora
`%{TIME}` usa la hora del **servidor**, que en muchos hostings va en UTC
(2 h menos que Madrid en verano). En el peor caso la web reabre un par de
horas mas tarde. Si necesitas precision, mira la hora del servidor en el panel
del hosting y ajusta el numero.

## VPS con Nginx
Ver las instrucciones dentro de `nginx-maintenance.conf`. Funciona con un
fichero interruptor y un `at` programado para el miercoles.

## Cloudflare (si el dominio pasa por Cloudflare)
La via mas rapida y sin tocar el hosting:
- **Security → WAF → Custom rules**: regla `Block` para todo el trafico salvo tu IP.
- O **Rules → Response Rules** devolviendo la pagina de aviso.
- Ojo: Cloudflare **no** tiene caducidad automatica en el plan gratuito;
  tendrias que desactivar la regla a mano el miercoles.

## Por que 503 y no apagar la web

El bloqueo responde **HTTP 503 + Retry-After**, que es lo correcto para una
parada temporal: Google lo lee como "vuelve pronto" y **mantiene el
posicionamiento**. Un cierre de 2-3 dias con 503 no tiene impacto en SEO
(a partir de una semana larga si conviene revisarlo).

## Lo que NO conviene hacer
- **Borrar los DNS o suspender el dominio**: tumba tambien el correo del dominio
  y tarda horas en propagarse al volver.
- **Devolver 404 o 403**: Google puede empezar a desindexar paginas.
- **`Disallow: /` en robots.txt**: no bloquea a los visitantes y si perjudica al SEO.
