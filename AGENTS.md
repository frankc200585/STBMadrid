# AGENTS.md — Contexto para agentes de IA

> Documento canónico de contexto de este repositorio. Válido para cualquier
> agente o modelo: Claude (Opus / Sonnet / Haiku / Fable), GPT, Gemini, Cursor,
> Copilot, Codex, etc. `CLAUDE.md` es un puntero a este archivo.

**Última actualización:** 2026-08-17
**Estado del proyecto:** PENDIENTE — diseño cerrado, implementación no iniciada.
**Rama de trabajo:** `claude/stbmadrid-self-service-kiosk-icqwjj`

---

## 1. Qué es este proyecto

STBMadrid quiere dos kioskos de autoservicio:

| Rol | Función | Estado del diseño |
|---|---|---|
| **A — Acceso** | El cliente escanea su pase QR → se valida → se abre la entrada | ✅ Diseñado |
| **B — Venta** | El cliente elige producto → paga con tarjeta → se imprime el ticket | ✅ Diseñado |

Hardware propuesto por el cliente: **tablet Oukitel RT10 Industry**, impresora
**Bixolon** (modelo por confirmar) y **SumUp** como proveedor de cobro.

**Veredicto de viabilidad: SÍ, con una corrección de arquitectura en el pago
(ver §3).**

## 2. Lo que ya está investigado — NO lo repitas

Estos puntos están cerrados y documentados con fuentes. No vuelvas a buscarlos:

- **Especificaciones de la Oukitel RT10 Industry** → `docs/01-hardware.md`.
  Lo relevante: Android 15, Dimensity 7400X, escáner **Zebra SE4710**, NFC,
  **USB-A + RJ45 + pogo 12 pines**, IP68/IP69K, 25.000 mAh, 1.280 g.
- **Alternativas de hardware con precios** (7 modelos comparados) →
  `docs/01-hardware.md`. Conclusión: la RT10 Industry es la mejor relación
  prestaciones/precio para el rol B; el **Newland NQuire 1000 Manta III (~635 €,
  PoE)** es mejor que la tablet para el rol A.
- **Cómo se cobra con SumUp desde un kiosko** → `docs/03-pagos-sumup.md`.
  Conclusión: **SumUp Solo + Cloud API**, no SDK móvil, no SoftPOS.
- **Cómo se imprime en Bixolon desde Android** → `docs/04-impresion-bixolon.md`.
  Conclusión: **BXL SDK for Android (UPOS)** sobre **Ethernet o USB-A**.
- **Obligaciones legales en España** → `docs/05-cumplimiento.md`.
  Conclusión: Verifactu obligatorio 01-01-2027 (sociedades); hay que diseñarlo
  desde el inicio, no parchearlo.

## 3. La decisión de arquitectura más importante

**La tablet NO cobra la tarjeta.** Nunca implementes entrada de datos de tarjeta
en la app, ni busques SoftPOS / Tap to Pay en Android genérico.

```
[Tablet: app kiosko] --HTTPS--> [Backend STBMadrid] --Cloud API--> [SumUp Solo]
                                        ^                               |
                                        |------- webhook resultado ------|
                                        |
                                        +--ESC/POS--> [Bixolon] --> ticket + QR
```

Razones: SumUp no tiene SoftPOS certificado para Android genérico, y meter datos
de tarjeta en nuestro código nos mete en alcance PCI-DSS completo. Con Solo +
Cloud API el alcance PCI es mínimo. Detalle en `docs/adr/0002-pago-con-sumup-solo-cloud-api.md`.

## 4. Bloqueantes activos 🚧

**No compres hardware ni empieces a programar sin resolver estos tres.** Detalle
y forma de resolverlos en `docs/06-preguntas-abiertas.md`.

| # | Bloqueante | Impacto si falla |
|---|---|---|
| B1 | ¿El escáner de la RT10 Industry soporta **modo presentación/continuo**? | Sin él, el kiosko de acceso no funciona desatendido |
| B2 | ¿Está la RT10 Industry **certificada en Android Enterprise / GMS**? | Sin ello, no hay MDM: kiosko artesanal y frágil |
| B3 | ¿Autoriza SumUp el **uso desatendido** de Solo para nuestro negocio? | Sin ello, hay que cambiar de proveedor de cobro |

Además hay 5 datos que faltan del cliente (modelo de Bixolon, catálogo de
productos, etc.) listados en el mismo documento.

## 5. Reglas de trabajo en este repositorio

1. **Actualiza los documentos cuando aprendas algo.** Este repositorio es el
   estado de la verdad del proyecto. Si resuelves un bloqueante, cámbialo en
   `docs/06-preguntas-abiertas.md` **y** en la tabla de §4 de este archivo.
2. **Las decisiones de arquitectura van a `docs/adr/`**, numeradas, con formato
   Contexto / Decisión / Consecuencias. No cambies una decisión de un ADR sin
   escribir un ADR nuevo que lo supersede.
3. **Cita fuentes.** Todo dato de hardware, precio o API debe llevar enlace. Los
   precios llevan fecha, porque caducan.
4. **No inventes precios ni especificaciones.** Si no lo has verificado, escribe
   `SIN VERIFICAR` o `PEDIR PRESUPUESTO`. Hay ya casos marcados así a propósito.
5. **Rama de trabajo:** `claude/stbmadrid-self-service-kiosk-icqwjj`. No hagas
   push a `master` sin permiso explícito.
6. **Idioma:** documentación y commits en español. Código e identificadores en
   inglés.

## 6. Stack técnico previsto (aún no implementado)

Nada de esto está decidido en firme; son las opciones recomendadas en
`docs/02-arquitectura.md`. Si el cliente prefiere otra cosa, se cambia.

- **App kiosko:** PWA en WebView bloqueado (Android `LockTask`) o Kotlin nativo.
  La PWA gana si se quiere reutilizar la UI en más dispositivos.
- **Backend:** API HTTP con webhooks entrantes de SumUp. Lenguaje sin decidir.
- **Persistencia:** catálogo, pedidos, pases QR, cadena de registros Verifactu.
- **Impresión:** módulo Android sobre BXL SDK, o servicio de red hablando ESC/POS
  directo si la impresora va por Ethernet.

## 7. Glosario rápido

- **Pase QR** — código que trae el cliente para entrar (rol A).
- **Rol A / Rol B** — kiosko de acceso / kiosko de venta. Ver §1.
- **Cloud API** — API de SumUp para lanzar cobros presenciales en un lector Solo
  desde cualquier backend. No confundir con el SDK móvil de SumUp.
- **Verifactu** — normativa AEAT de sistemas de facturación verificables.
- **COSU / dedicated device** — modo de Android Enterprise para kioskos.
