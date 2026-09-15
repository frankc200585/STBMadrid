# 00 — Visión y alcance

**Estado:** borrador pendiente de validación con el cliente.
**Fecha:** 2026-08-17

## Objetivo

Reducir la necesidad de personal en el punto de entrada y en el punto de venta de
STBMadrid, mediante dos kioskos de autoservicio.

## Alcance funcional

### Rol A — Kiosko de control de acceso

1. El cliente llega con su pase en formato QR (móvil o papel).
2. Lo presenta al escáner del kiosko.
3. El sistema valida el pase contra el backend: existe, no está usado, está en
   vigor, corresponde a este acceso.
4. Feedback inmediato en pantalla + sonido (válido / no válido / motivo).
5. Si es válido, se registra la entrada y se acciona la apertura (torno, puerta,
   o simplemente aviso visual al personal — **por definir**, ver P4 en
   `06-preguntas-abiertas.md`).

**Fuera de alcance de la fase 1:** reconocimiento facial, lectura de DNI,
antipassback biométrico.

### Rol B — Kiosko de venta

1. El cliente ve el catálogo en pantalla y monta su pedido.
2. Confirma el importe.
3. Paga con tarjeta en el lector SumUp Solo anclado al kiosko (contactless,
   chip, o wallet del móvil).
4. Se imprime el ticket en la impresora Bixolon.
5. Si el producto vendido da acceso, el ticket incluye el **QR de acceso**, que
   es el mismo formato que lee el rol A. El círculo se cierra: vender genera un
   pase, el pase se consume en la puerta.

**Fuera de alcance de la fase 1:** efectivo, devolución de cambio, vales,
fidelización, pedidos anticipados por web.

## Principios de diseño

1. **El kiosko nunca ve datos de tarjeta.** Delegación total al lector
   certificado. Esto es no negociable, ver ADR-0002.
2. **Fallo con dignidad.** Si cae la red, el kiosko debe decirlo claramente y
   permitir que el personal atienda manualmente. Nunca dejar al cliente ante una
   pantalla congelada.
3. **Cumplimiento por diseño, no por parche.** La cadena de registros de
   facturación (Verifactu) va en el modelo de datos desde el primer día.
4. **Un rol, un dispositivo.** No compartir la misma tablet entre puerta y venta:
   serializa la cola y un cliente comprando bloquea la entrada.
5. **Operable por no técnicos.** Reinicio, cambio de rollo de papel y
   reconexión del lector deben ser resolubles por el personal del local.

## Métricas de éxito propuestas

| Métrica | Objetivo |
|---|---|
| Tiempo de validación del pase (presentar → feedback) | < 1,5 s |
| Tasa de lectura de QR al primer intento | > 97 % |
| Tiempo de compra completa (inicio → ticket impreso) | < 90 s |
| Transacciones caídas por fallo técnico | < 0,5 % |
| Disponibilidad en horario de apertura | > 99 % |

Estos números son una propuesta de partida, no un compromiso. Hay que validarlos
con el cliente.

## Supuestos

- Hay conectividad de red en ambos puntos, preferiblemente cableada.
- Hay alimentación eléctrica permanente en ambos puntos.
- STBMadrid ya tiene o tendrá cuenta de empresa con SumUp.
- El volumen de transacciones es de local único, no de cadena. Si va a haber
  varios locales, hay que revisar la arquitectura del backend antes de empezar.
