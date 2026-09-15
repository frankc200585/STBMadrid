# Calendario de eventos STBMadrid

> Fuente de la verdad para las fechas. El triaje de material y los nombres de
> carpeta salen de aquí. Actualízalo después de cada fiesta.

## 2026

| Fecha | Día | Evento | Material | Estado |
|---|---|---|---|---|
| **2026-08-02** | Domingo | Pool Party | 📥 Pendiente de volcar | ✅ Celebrado |
| **2026-08-15** | Sábado (festivo) | Pool Party | 📥 Pendiente de volcar | ✅ Celebrado |
| **2026-08-30** | Domingo | Pool Party | — | 🔜 Próximo |

**Lugar:** Rivas Vaciamadrid, junto a la M-832
**Formato:** Piscina · BBQ · Clases · DJs · Social hasta el final
**Música:** Salsa · Timba · Bachata
**Entradas:** stbmadrid.com

## Carpetas de trabajo

```
2026-08-02_poolparty/
2026-08-15_poolparty/
2026-08-30_poolparty/
```

Estructura interna de cada una: ver `02-arquitectura.md` §Organización.

## Uso en los scripts

```bash
# Triaje del material ya celebrado
python scripts/triaje.py _VOLCADO_MOVIL --eventos 2026-08-02,2026-08-15 --top 50

# Con los mejores momentos de cada vídeo
python scripts/triaje.py _VOLCADO_MOVIL --eventos 2026-08-15 --videos
```

## Pendiente de confirmar

- Hora de inicio y fin
- Precio de los pases y qué incluyen
- DJs / lineup por fecha
- Si el 30 de agosto es el cierre de temporada (condiciona los textos
  promocionales, ver `plantillas/pies-reels.md`)
