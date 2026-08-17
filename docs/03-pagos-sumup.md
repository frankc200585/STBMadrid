# 03 — Pago con tarjeta: SumUp

**Estado:** diseño cerrado, sin implementar. Depende del bloqueante **B3**.
**Fecha:** 2026-08-17

---

## La decisión

**Lector SumUp Solo + SumUp Cloud API (Terminal Payments).**

La tablet **no** captura la tarjeta. Manda crear el cobro al backend, el backend
lo lanza contra el lector Solo por API, el cliente paga en el lector, y el
resultado vuelve por webhook.

Decisión formal y alternativas descartadas: `adr/0002-pago-con-sumup-solo-cloud-api.md`.

## Por qué no las otras opciones

| Opción | Por qué se descarta |
|---|---|
| **SoftPOS / Tap to Pay en la tablet** | SumUp no tiene SoftPOS certificado para Android genérico. Tap to Pay exige hardware y SO certificados. La Oukitel no lo es |
| **SDK móvil de SumUp (Android)** | Empotra la experiencia del lector en la app, pero está pensado para flujos **atendidos** y depende de la app de SumUp instalada. Frágil en kiosko desatendido |
| **URL scheme de Android** | Lanza la app de SumUp para cobrar. Rompe el modo kiosko: saca al cliente de nuestra app. Descartado |
| **Readers Air / Plus** | Dependen del SDK móvil o de la app. La Cloud API es la vía servidor→lector, y su familia de lector es **Solo** |
| **Nuestro propio formulario de tarjeta** | Nos metería en alcance PCI-DSS completo. Prohibido en este proyecto |

## Cómo funciona la Cloud API

La Cloud API permite lanzar una transacción presencial desde cualquier plataforma
capaz de hacer peticiones HTTPS (Windows, Android, Linux, iOS, web) y completarla
en un lector Solo emparejado con la cuenta.

```
1. Emparejar el Solo con la cuenta SumUp (una vez, desde el portal)
2. Backend → POST Reader Checkout (importe, moneda, referencia, affiliate key)
3. El Solo despierta y pide la tarjeta al cliente
4. El cliente paga (contactless / chip / wallet)
5. SumUp → webhook al backend con el resultado
6. (respaldo) Backend consulta el estado del checkout por API
```

Los datos de tarjeta van cifrados de extremo a extremo entre el lector y SumUp.
Nuestro código nunca los ve.

## Requisitos administrativos — hacer ANTES de programar

Estos trámites no son código y tienen tiempos de espera. Arrancarlos ya:

1. **Cuenta de empresa SumUp** para STBMadrid.
2. **Lector SumUp Solo** (no Air, no Plus).
3. **API key** en el portal de developers de SumUp.
4. **Affiliate Key** — obligatoria: la Cloud API la exige en cada petición de
   checkout. Se genera en la página de *Affiliate Keys* del portal.
5. **Activación del scope `payments`.** ⚠️ No viene activado por defecto. Si no
   está, la API responde:
   ```
   403 { "error": "request_not_allowed" }
   ```
   Hay que **pedir a SumUp por el formulario de contacto que lo activen**. Este
   es el trámite con más riesgo de retraso: iniciarlo el primer día.
6. **🚧 BLOQUEANTE B3 — Confirmación escrita de uso desatendido.** Preguntar a
   SumUp explícitamente si autorizan uso **desatendido / self-service** del Solo
   para el tipo de negocio y MCC de STBMadrid.

   Contexto a favor: SumUp comercializa su propio producto **SumUp Kiosk**
   (pantalla de 21,5" con lector SumUp Plus), luego el caso de uso lo apoyan
   comercialmente. Pero eso no es lo mismo que tenerlo autorizado en **nuestro**
   contrato. Que lo digan por escrito.

## Endpoints y conceptos a manejar

| Concepto | Uso |
|---|---|
| *Reader Checkout* | Crear el cobro y lanzarlo al lector |
| *Readers* API | Listar y consultar el estado de los lectores emparejados |
| *Affiliate Key* | Identificador de nuestra app; obligatorio en el checkout |
| *Webhooks* | Notificación en tiempo real del cambio de estado del checkout |
| *Virtual Solo* | Lector simulado de SumUp. **Usarlo para desarrollo** y no gastar tarjetas reales |

> Nota: la documentación exacta de payloads hay que leerla del portal en el
> momento de implementar; las APIs cambian. No copiar payloads de este documento
> (no los hay a propósito).

## Puntos duros de la implementación

### Idempotencia
Una referencia de pedido → un checkout. Si el cliente pulsa dos veces, o si la
red reintenta, no se puede crear un segundo cobro. Clave de idempotencia
generada en el backend.

### El webhook no es fiable por sí solo
Puede llegar tarde, duplicado, o no llegar. Reglas:
- Tratar el webhook como **una** fuente, no como la única.
- *Polling* de respaldo del estado del checkout con backoff.
- Procesamiento idempotente: recibir el mismo webhook dos veces no puede vender
  dos veces.
- Verificar la autenticidad de la llamada entrante antes de actuar.

### Estados indeterminados
Si se corta la luz o la red entre el paso 3 y el 5, hay un cobro cuyo resultado no
conocemos. Al arrancar, el backend debe **reconciliar** todos los checkouts en
estado no final antes de aceptar nuevas ventas. Un cobro huérfano no reconciliado
es un cliente enfadado.

### Cancelación por inactividad
Si el cliente se va sin pagar, hay que **cancelar el checkout en SumUp**, no solo
resetear la pantalla. Si no, el lector se queda esperando y el siguiente cliente
paga el pedido anterior.

### Reembolsos
Fuera del alcance de la fase 1, pero hay que decidir cómo se gestionan: ¿desde el
panel de SumUp por el personal, o desde nuestro backend por API? Anotarlo como
decisión pendiente.

## Alcance PCI-DSS

Con esta arquitectura, los datos de tarjeta no pasan nunca por nuestro hardware ni
nuestro software: el lector Solo los cifra de extremo a extremo hacia SumUp.
Nuestro alcance PCI queda mínimo. Ver `05-cumplimiento.md`.

**Esto se pierde en el instante en que alguien implemente un formulario de
tarjeta en la app.** Es la razón de que ADR-0002 sea vinculante.

## Fuentes

- [SumUp Developer — Cloud API](https://developer.sumup.com/terminal-payments/cloud-api)
- [SumUp Developer — In-Person Payments](https://developer.sumup.com/terminal-payments)
- [SumUp Developer — lector Solo](https://developer.sumup.com/terminal-payments/readers/solo)
- [SumUp Developer — Affiliate Keys](https://developer.sumup.com/tools/authorization/affiliate-keys)
- [SumUp Developer — Authorization](https://developer.sumup.com/tools/authorization/authorization)
- [SumUp Developer — Readers API](https://developer.sumup.com/api/readers/get)
- [SumUp Developer — FAQ (error 403 `request_not_allowed`)](https://developer.sumup.com/help)
- [SumUp Virtual Solo (lector simulado para desarrollo)](https://virtual-solo.sumup.com/)
- [SumUp Kiosk — producto propio de SumUp](https://www.sumup.com/en-us/press/kiosk-launch-us/)
- [Ejemplo de integración de terceros (Goodtill / Solo API)](https://support.thegoodtill.com/solo-api)
