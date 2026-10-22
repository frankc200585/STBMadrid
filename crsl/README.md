# crsl — Carousel

Carpeta de **Carousel** (forma corta `crsl`), el sistema de mensajes en carrusel. Es un **producto
aparte**, integrable con STB pero no parte de stbmadrid.com: vive aquí solo por la dirección, como se
decidió el 21-oct (decisión 14 del proyecto: «no se compra dominio al principio, se usa la estructura
`stbmadrid.com/crsl`»).

**Esto es la única carpeta de este repo que toca una sesión de STB Social** (D-191, orden de Franklin
del 22-oct). Nada de lo demás de stbmadrid.com se toca desde ahí: ni las páginas que ya existen, ni
Firebase, ni los bots, ni el DNS.

## Qué hay

| Archivo | Qué es |
|---|---|
| `interprete.html` | **Modo intérprete** (decisión 12, Fase 3): conversación cara a cara entre dos personas, la voz del dueño reconocida de memoria y la traducción en la banda del carrusel. Prototipo para aprobar antes de programar. |

## Importante: no se edita aquí

Estos archivos **se generan**. El original vive en el repo de STB Social, en
`PROYECTOS/carrusel/`, y es el mismo que se publica para verlo en el móvil. La copia de aquí es la
versión suelta (documento HTML completo, con `<!doctype html>` y cabecera, que es lo que necesita un
servidor de verdad):

```
python PROYECTOS/carrusel/suelta.py interprete <ruta>/crsl/interprete.html
```

Si se edita esta copia a mano, la próxima vez que se mejore el original se pierde el cambio.

## Todavía no está en internet

La web viva de stbmadrid.com no se sirve desde este repo, así que dejar la página aquí **no la
publica**. Para que `stbmadrid.com/crsl` se vea hace falta decidir antes la **nota 14 bis**:
¿subdominio `crsl.stbmadrid.com` (gratis, origen aislado) o carpeta dentro de la web actual? Eso lo
decide Franklin, y tocar el DNS necesita su orden.

Decisiones, riesgos y lo investigado del proyecto: `PROYECTOS/CARRUSEL-MENSAJES.md` en el repo de STB
Social.
