# 04 — Impresión de tickets: Bixolon

**Estado:** diseño cerrado a falta del modelo concreto (pregunta **P1**).
**Fecha:** 2026-08-17

---

## Situación

STBMadrid ya tiene una impresora **Bixolon**. El modelo exacto está pendiente de
confirmar y **condiciona la interfaz de conexión y el SDK**. Ver pregunta P1 en
`06-preguntas-abiertas.md`.

## Viabilidad: sin problema

Bixolon publica el **BXL SDK for Android**, compatible con UPOS, y sus impresoras
soportan **USB, Bluetooth, Wi-Fi y Ethernet**. La Oukitel RT10 Industry tiene
**USB-A (host)**, **USB-C con OTG** y **RJ45**, así que cualquiera de las vías
está disponible.

## Elección de interfaz

| Interfaz | Veredicto | Motivo |
|---|---|---|
| **Ethernet** | ✅ **Preferida** | Independiente de la tablet: si la tablet se reinicia, la impresora sigue accesible. El backend puede imprimir directamente. Cable robusto |
| **USB-A (host)** | ✅ Buena | Un cable menos, sin configuración de red. Pero la impresión depende de que la tablet esté viva y con la app en marcha |
| **Wi-Fi** | 🟡 Aceptable | Solo si no hay forma de cablear. Un punto de fallo más |
| **Bluetooth** | ❌ **Descartada** | En instalación fija es la peor opción: emparejamientos que se caen, alcance, interferencias. No usar |

**Recomendación:** Ethernet, y que **imprima el backend**, no la tablet. Así el
ticket se imprime aunque la app del kiosko esté reiniciándose, y la cola de
reintentos vive en un sitio con persistencia de verdad.

Si el modelo confirmado (P1) es de la serie móvil **SPP-R** (que suele ser
Bluetooth/USB y no Ethernet), habrá que replantear: o se conecta por USB a la
tablet, o se compra una de sobremesa. Anotarlo cuando se responda P1.

## Modelos y compatibilidad

Bixolon tiene SDK de Android publicado para, entre otros: **SRP-350III**,
**SRP-380**, **SRP-275III**, **SRP-F310II**, **SRP-S300II**, **SRP-350plusV**,
**SPP-R410**, **SPP-C300**.

Modelos de sobremesa con interfaz múltiple (los ideales para este proyecto):
- **SRP-350plusV** — USB, Serie, **Ethernet**, Bluetooth
- **SRP-S300II** — USB 2.0, **Ethernet**, Serie, WLAN, Bluetooth

## El ticket debe imprimir el QR

Punto clave del diseño: **las impresoras Bixolon generan códigos QR en firmware**
vía ESC/POS (comando `GS ( k`). No hay que renderizar una imagen y mandarla como
bitmap — se manda el contenido y la impresora lo dibuja. Más rápido, más nítido y
mucho más fácil de mantener.

Esto cierra el círculo del proyecto:

```
Rol B (venta) ──► imprime ticket con QR de acceso
                              │
                              ▼
                    Rol A (puerta) lo lee y valida
```

Vender genera el pase; el pase se consume en la entrada. Mismo formato de QR en
los dos lados.

## Contenido del ticket — a definir con el cliente

Borrador, pendiente de validación:

```
┌────────────────────────────────┐
│         [LOGO STBMadrid]       │
│  Razón social / NIF / dirección│
│  ──────────────────────────    │
│  Nº ticket · fecha · hora      │
│  ──────────────────────────    │
│  Producto        Ud   Importe  │
│  ...                           │
│  ──────────────────────────    │
│  Base imponible                │
│  IVA (%)                       │
│  TOTAL                         │
│  Pagado con tarjeta ****1234   │
│  ──────────────────────────    │
│      [QR DE ACCESO]            │
│      [QR VERIFACTU]  ⚠️        │
│  ──────────────────────────    │
│         Gracias                │
└────────────────────────────────┘
```

⚠️ **Dos QR distintos, no confundirlos:**
- **QR de acceso** — nuestro, lo lee el rol A.
- **QR Verifactu** — obligatorio en factura simplificada según normativa AEAT.
  Ver `05-cumplimiento.md`.

## Detalles operativos que se olvidan siempre

| Tema | Qué hacer |
|---|---|
| **Fin de papel** | La impresora lo reporta. Hay que detectarlo, avisar en pantalla y notificar al personal **antes** de que el cliente pague |
| **Autocorte** | Verificar que el modelo lo tiene. Sin autocorte, un kiosko desatendido no es viable |
| **Ancho de papel** | 58 mm vs 80 mm cambia el diseño del ticket. Confirmar con P1 |
| **Atasco** | Estado de error → el kiosko sale de servicio con mensaje claro, no sigue vendiendo |
| **Reimpresión** | Si el ticket sale mal, debe poder reimprimirse **sin volver a cobrar** |
| **Cajón portamonedas** | Las Bixolon tienen puerto DK. Fuera de alcance en fase 1 (no hay efectivo), pero está disponible si se añade |
| **Rollo de repuesto** | Que el personal sepa cambiarlo. Documentarlo en el manual de operación |

## Fuentes

- [Bixolon — impresoras POS](https://www.bixolon.com/product.php?key=pos)
- [Bixolon — descargas SDK SRP-350III](https://www.bixolon.com/download_view.php?idx=24&s_key=SDK)
- [Bixolon — descargas SDK SRP-F310II](https://www.bixolon.com/download_view.php?idx=22&s_key=SDK)
- [Bixolon — descargas Android SRP-380](https://www.bixolon.com/download_view.php?idx=28&s_key=Android)
- [Bixolon — Native App Print for Android](https://docs.bixolon.com/index.php?kind=app&key=42)
- [BXL SDK for UPOS Android — guía de referencia de API (PDF)](https://www.bilkur.com/download/Bixolon/dokuman/Bixolon_SPP-R310_Android_SDK_Reference_Guide.pdf)
- [Bixolon EU — impresoras POS](https://bixoloneu.com/product-type/pos-printers/)

Ejemplos de terceros (útiles como referencia, no como dependencia):
- [Fewlaps/bixolon-printer-example](https://github.com/Fewlaps/bixolon-printer-example)
- [IstraTech/bixolon-driver](https://github.com/IstraTech/bixolon-driver)
