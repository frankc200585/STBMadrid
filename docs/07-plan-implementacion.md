# 07 — Plan de implementación

**Estado:** propuesta. Nada iniciado.
**Fecha:** 2026-08-17

> ⚠️ **No empezar la fase 1 sin haber cerrado los bloqueantes B1, B2 y B3** de
> `06-preguntas-abiertas.md`. La fase 0 existe precisamente para eso.

---

## Fase 0 — Desbloqueo (antes de escribir código)

| # | Tarea | Depende de |
|---|---|---|
| 0.1 | Conseguir unidad de demo de la RT10 Industry | P6 |
| 0.2 | Probar modo presentación/continuo del escáner | B1, 0.1 |
| 0.3 | Verificar certificación Android Enterprise / GMS | B2, 0.1 |
| 0.4 | Escribir a SumUp: uso desatendido + activar scope `payments` | B3 |
| 0.5 | Recabar del cliente P1–P5 (Bixolon, catálogo, torno, backend previo) | — |
| 0.6 | Consultar al asesor fiscal: modo Verifactu | D4 |
| 0.7 | Decidir escenario de hardware y presupuesto | D1, D9 |

**Entregable:** los tres bloqueantes cerrados y el escenario de hardware elegido.
**Sin esto, todo lo que venga después puede tener que rehacerse.**

---

## Fase 1 — Rol A: kiosko de acceso

El rol más simple y el que da valor antes. Se hace primero para validar la
plataforma con poco riesgo.

| # | Tarea |
|---|---|
| 1.1 | Modelo de datos de pases QR (identificador opaco, ver D5) |
| 1.2 | Endpoint de validación de pase: existe / en vigor / no consumido / antipassback |
| 1.3 | App de kiosko del rol A: pantalla de reposo, captura del escáner, verde/rojo con motivo legible |
| 1.4 | Modo degradado sin red: mensaje claro + registro local + reconciliación posterior |
| 1.5 | Bloqueo del dispositivo (`LockTask` + Device Owner o EMM según B2) |
| 1.6 | Integración con el mecanismo de apertura, si aplica (según P4) |
| 1.7 | Montaje físico y prueba de geometría de lectura con usuarios reales |
| 1.8 | Métrica: tasa de lectura al primer intento (objetivo > 97 %) |

**Entregable:** un cliente con un QR entra sin intervención de personal.

---

## Fase 2 — Backend de venta

| # | Tarea |
|---|---|
| 2.1 | Catálogo, precios, tipos de IVA |
| 2.2 | Ciclo de vida del pedido con idempotencia por referencia |
| 2.3 | **Cadena de registros Verifactu (hash encadenado, anulaciones, conservación)** |
| 2.4 | Emisión de pases QR desde una venta (enlaza con la fase 1) |
| 2.5 | Cola de impresión con reintentos y estados |

⚠️ La 2.3 no es opcional ni posterior: va aquí, con el modelo de datos. Ver
`05-cumplimiento.md`.

---

## Fase 3 — Pago

| # | Tarea |
|---|---|
| 3.1 | Emparejar el Solo; configurar API key y Affiliate Key |
| 3.2 | Desarrollo contra **Virtual Solo** (lector simulado), sin tarjetas reales |
| 3.3 | Crear Reader Checkout desde el backend |
| 3.4 | Recepción y verificación de webhooks |
| 3.5 | *Polling* de respaldo del estado del checkout |
| 3.6 | Cancelación por inactividad del cliente |
| 3.7 | Reconciliación al arranque de checkouts en estado indeterminado |
| 3.8 | Pruebas con tarjeta real: éxito, rechazo, cancelación, corte de red a mitad |

**Entregable:** cobro fiable y sin cobros duplicados ni huérfanos.

---

## Fase 4 — Impresión

| # | Tarea |
|---|---|
| 4.1 | Conexión con la Bixolon (Ethernet preferido) |
| 4.2 | Plantilla de ticket con datos fiscales |
| 4.3 | QR de acceso vía ESC/POS `GS ( k` (nativo de la impresora) |
| 4.4 | QR Verifactu |
| 4.5 | Detección de fin de papel y de atasco → aviso y salida de servicio |
| 4.6 | Reimpresión sin recobro |
| 4.7 | Prueba del círculo completo: comprar → ticket → escanear ese ticket en la puerta |

La 4.7 es la prueba que valida el proyecto entero de punta a punta.

---

## Fase 5 — Rol B completo y puesta en producción

| # | Tarea |
|---|---|
| 5.1 | UI de venta: catálogo, carrito, confirmación, estados de pago |
| 5.2 | Timeouts, abandono, vuelta a reposo |
| 5.3 | Monitorización y alertas (kiosko caído, sin papel, lector desconectado) |
| 5.4 | Manual de operación para el personal (papel, reinicio, reconexión del lector) |
| 5.5 | Información de protección de datos visible en el kiosko |
| 5.6 | Piloto con clientes reales en horario de bajo volumen |
| 5.7 | Producción |

---

## Fuera de alcance de este plan

Anotado para que no se cuele por la puerta de atrás:

- Efectivo y devolución de cambio
- Reembolsos automatizados desde el kiosko (fase posterior, ver D7)
- Fidelización y promociones
- Pedido anticipado por web o app
- Reconocimiento facial, lectura de DNI
- Biometría para clientes (descartada por `05-cumplimiento.md`)
- Multi-local (revisar arquitectura antes, ver D8)

---

## Estimaciones

**No hay estimaciones en este documento a propósito.** Dar plazos con B1, B2, B3
abiertos y con P1–P5 sin responder sería inventárselos: si B2 falla, cambia el
hardware; si B3 falla, cambia el proveedor de cobro; si P5 revela un sistema
previo, cambia medio backend.

Se estimará al cerrar la fase 0.
