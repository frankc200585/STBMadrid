# ADR-0002 — Pago con SumUp Solo + Cloud API

- **Estado:** Aceptado — **VINCULANTE**
- **Fecha:** 2026-08-17

> 🔒 Este ADR es vinculante. Ningún agente ni desarrollador debe implementar
> captura de datos de tarjeta en la aplicación del kiosko. Si crees que hay
> motivo para cambiarlo, escribe un ADR nuevo y consúltalo con el cliente antes
> de tocar una línea de código.

## Contexto

STBMadrid quiere contratar el servicio de cobro con tarjeta de **SumUp** para el
kiosko de venta. El planteamiento inicial sugiere que el cobro lo haga la propia
tablet.

SumUp ofrece varias vías de integración para pagos presenciales:
- **Cloud API (Terminal Payments)** — el backend lanza el cobro al lector Solo.
- **SDK móvil (Android / iOS)** — empotra la experiencia del lector en la app.
- **URL scheme** — lanza la app de SumUp para cobrar.
- **APIs de pago online** — para card-not-present.

## Decisión

**Lector SumUp Solo gobernado por la Cloud API de SumUp.** La aplicación del
kiosko nunca captura, transmite ni almacena datos de tarjeta.

```
[Tablet kiosko] --HTTPS--> [Backend] --Cloud API--> [SumUp Solo] <-- tarjeta del cliente
                               ^                          |
                               +---- webhook resultado ----+
```

La tablet muestra "esperando pago…" y espera. El cliente interactúa con el lector,
no con la tablet, en el momento del pago.

## Motivos

1. **SumUp no tiene SoftPOS certificado para Android genérico.** Tap to Pay exige
   hardware y sistema operativo certificados. La Oukitel RT10 Industry no lo es.
2. **Alcance PCI-DSS.** Con el lector certificado los datos van cifrados de extremo
   a extremo hacia SumUp. Nuestro alcance PCI queda mínimo. Implementar un
   formulario de tarjeta nos metería en alcance completo, con auditoría y coste
   recurrente.
3. **La Cloud API está diseñada exactamente para esto:** lanzar transacciones
   presenciales desde cualquier plataforma capaz de hacer HTTPS y completarlas en un
   lector Solo.
4. **El SDK móvil es para flujos atendidos** y depende de la app de SumUp
   instalada en el dispositivo. En un kiosko desatendido y bloqueado es frágil.
5. **El URL scheme rompe el modo kiosko:** saca al cliente de nuestra aplicación
   hacia otra app. Inaceptable en autoservicio.
6. **Resiliencia.** El Solo lleva su propia conectividad (WiFi propio o 4G
   incluido). Si cae la red de la tablet, el lector sigue pudiendo operar.

## Consecuencias

### Positivas
- Alcance PCI-DSS mínimo.
- El lector es una pieza sustituible sin tocar el código del kiosko.
- El Solo no necesita estar en nuestra VLAN.
- La lógica de pago vive en el backend, que es donde hay persistencia
  transaccional para reconciliar.

### Negativas / a gestionar
- **Dependencia de webhooks**, que no son fiables por sí solos: hace falta
  *polling* de respaldo y procesamiento idempotente.
- **Estados indeterminados** si se corta luz o red a mitad del cobro: hay que
  reconciliar al arrancar.
- **El backend necesita ser alcanzable desde internet** para recibir webhooks.
- **Trámites previos con SumUp:** API key, Affiliate Key y **activación del scope
  `payments`** (si no está activado, la API devuelve `403 request_not_allowed`).
- **Hay que anclar físicamente el lector** al kiosko: es una pieza suelta y
  robable.
- **Depende del bloqueante B3:** confirmación escrita de que SumUp autoriza el uso
  desatendido.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| SoftPOS / Tap to Pay en la tablet | SumUp no lo ofrece certificado en Android genérico |
| SDK móvil de SumUp | Pensado para atendido; depende de la app de SumUp; frágil en kiosko |
| URL scheme de Android | Saca al cliente de nuestra app; rompe el modo kiosko |
| Lectores Air / Plus | Dependen del SDK o de la app. La Cloud API va con la familia Solo |
| Formulario de tarjeta propio | Alcance PCI-DSS completo. Prohibido en este proyecto |
| SumUp Kiosk (producto cerrado de SumUp) | Solución empaquetada de SumUp (21,5" + SumUp Plus). Es una alternativa real al proyecto entero, pero renuncia al control del software y al hardware ya elegido. Vale como referencia de que el caso de uso está apoyado comercialmente |

## Reglas derivadas (obligatorias)

1. Nunca implementar entrada de datos de tarjeta en la app del kiosko.
2. Nunca registrar en logs datos del payload de pago más allá del ID de
   transacción, el estado y el importe.
3. Nunca imprimir el ticket antes de tener el pago confirmado.
4. Nunca dar un pago por bueno solo con el webhook: siempre *polling* de respaldo.
5. Nunca cobrar dos veces cuando falla la impresión: la venta ya existe.
6. Desarrollar contra **Virtual Solo** (lector simulado de SumUp), no contra
   tarjetas reales.

## Referencias

Detalle de implementación y enlaces en `../03-pagos-sumup.md`.
