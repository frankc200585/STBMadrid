# 10 — Volcado del móvil y triaje de material

**Fecha:** 2026-08-18

---

## El problema real

Estado actual del OnePlus 12 (según captura de O+ Connect, 2026-08-25):

| Dato | Valor |
|---|---|
| Imágenes | **14.282** |
| Vídeos | **984** |
| Archivos de WhatsApp | **22.520** |
| Descargas | 240 |

**El 95 % de eso no sirve para reels.** Entre las 14.282 imágenes hay reenvíos
de WhatsApp, carteles de otras fiestas, capturas de pantalla y stickers. El
material aprovechable es el que grabó la propia cámara los días de evento — unos
pocos cientos de archivos.

Buscarlos a mano es inviable. De ahí `scripts/triaje.py`.

---

## Cómo distinguir el material propio

El nombre del archivo delata el origen. Es el filtro más fiable:

| Patrón | Origen | ¿Sirve? |
|---|---|---|
| `IMG_20260830_183045.jpg` | Cámara (guion bajo) | ✅ **Sí** |
| `VID_20260830_183045.mp4` | Cámara | ✅ **Sí** |
| `IMG-20260824-WA0007.jpg` | **WhatsApp** (guion + `WA`) | ❌ Recomprimido |
| `Screenshot_20260825-…png` | Captura de pantalla | ❌ |
| Pesos de 40–90 KB | Recomprimido o miniatura | ❌ |

⚠️ **Todo lo que venga de WhatsApp está recomprimido y no tiene arreglo.** No es
recuperable subiéndolo mejor: la calidad se perdió en el envío original. Sirve
como referencia visual, nunca como material de publicación.

---

## Paso 1 — Sacar el material del móvil

**Opción recomendada: cable USB.** Para 15.000 archivos es más rápido y fiable
que la app.

```
1. Conecta el móvil por USB
2. En el móvil: notificación USB → "Transferencia de archivos" (MTP)
3. En el PC: Este equipo → OnePlus 12 → Almacenamiento interno
4. Copia ENTERA la carpeta:  DCIM/Camera
   (ahí está el material de cámara, sin WhatsApp de por medio)
5. Pégala en:  D:\STBMadrid\_VOLCADO_MOVIL\
```

**Opción alternativa: O+ Connect.** Sirve, pero para volúmenes grandes va lento.
Si la usas: `Todos los archivos` → navega a `DCIM/Camera` → seleccionar →
`Importar`. **No uses `Archivos recientes`** — ahí se mezcla todo.

> 💡 Copiar solo `DCIM/Camera` ya elimina de golpe los 22.520 archivos de
> WhatsApp. Es el filtro más eficaz y se hace antes de ejecutar nada.

## Paso 2 — Triaje automático

```bash
pip install opencv-python pillow

python scripts/triaje.py _VOLCADO_MOVIL --eventos 2026-08-16,2026-08-30 --top 50
```

Qué hace:

1. **Descarta** WhatsApp, capturas, descargas, stickers y carteles (por ruta y
   por nombre).
2. **Filtra por fecha** de evento — solo lo grabado esos días.
3. **Puntúa cada foto** con seis métricas.
4. **Copia las mejores** a `CANDIDATAS/<fecha>/`, renombradas por ranking.
5. **Vuelca todo a `triaje.csv`** por si quieres revisar el criterio.

### Cómo puntúa

| Métrica | Peso | Qué busca |
|---|---|---|
| **Nitidez** (Laplaciano) | 25 | Que esté enfocada. Lo primero de todo |
| **Exposición** | 20 | Ni quemada ni oscura. Penaliza cielos reventados |
| **Caras detectadas** | 20 | Que haya gente → ambiente de fiesta |
| **Sonrisas** | 15 | **Alegría** — el criterio que pediste |
| **Colorido** (Hasler-Süsstrunk) | 10 | **Fiesta** — color saturado, no apagado |
| **Azul/cian dominante** | 5 | **Piscina** — detecta agua |
| **Peso del archivo** | 5 | Penaliza lo recomprimido |

### Los mejores segundos de cada vídeo

```bash
python scripts/triaje.py _VOLCADO_MOVIL --eventos 2026-08-30 --videos
```

Muestrea un fotograma cada 2 segundos, lo puntúa igual, y te dice **en qué
segundo está el momento bueno** de cada vídeo:

```
  VID_20260830_192245.mp4
      48.0s  ·   78.4 pts  ·  5 caras, 3 sonrisas
      12.0s  ·   71.2 pts  ·  4 caras, 2 sonrisas
```

Vas directo a ese segundo en CapCut en vez de ver el vídeo entero.

---

## Paso 3 — La selección la haces tú

El script **no elige**: reduce 14.000 a 50 y las ordena. La decisión final es
humana, y son cinco minutos en vez de tres horas.

Al revisar `CANDIDATAS/`, descarta sin piedad:

- Cualquiera con **menores**
- Primeros planos identificables de quien esté en la lista de retirada
  (`consentimientos.csv`)
- Planos comprometidos o poco favorecedores
- Repeticiones del mismo momento — quédate con una

Lo que sobreviva va a `02_SELECCION/` y de ahí a los formatos de
`09-produccion-reels.md`.

---

## Límites del script — sé consciente

- **Las sonrisas son una heurística**, no una certeza. El detector de OpenCV
  falla con caras de perfil, con gafas de sol y a contraluz. Sirve para
  **ordenar**, no para decidir.
- **No entiende composición ni momento.** Una foto técnicamente perfecta de una
  silla vacía puntúa alto. Por eso hay revisión humana.
- **HEIC**: si OpenCV no lo lee en tu equipo, convierte antes con
  `scripts/reels.sh` o desactiva HEIC en la cámara del móvil (Ajustes → Cámara →
  formato JPEG).
- **Las fechas** se leen del nombre del archivo; si falla, del `mtime`. Si un
  archivo pasó por otra app, la fecha puede estar mal. Comprueba `triaje.csv`.

---

## Lo que hay que hacer ya

1. **Copiar `DCIM/Camera` al PC** — antes de que el móvil se llene y empieces a
   borrar. 14.282 imágenes es un móvil al límite.
2. **Activar formato JPEG** en la cámara si HEIC te da problemas.
3. **Pedir a los colaboradores su `DCIM/Camera`** del día del evento, no lo que
   tengan en WhatsApp.
