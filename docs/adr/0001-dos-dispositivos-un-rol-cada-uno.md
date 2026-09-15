# ADR-0001 — Un dispositivo por rol, no compartir

- **Estado:** Aceptado
- **Fecha:** 2026-08-17

## Contexto

El planteamiento inicial del cliente contempla usar una tablet Oukitel RT10
Industry para las dos funciones: leer el pase QR en la entrada y, después, hacer
de kiosko de venta con pago y ticket.

Técnicamente el equipo puede hacer las dos cosas: tiene el escáner Zebra SE4710
para la puerta y pantalla, USB-A y RJ45 para la venta.

## Decisión

**Cada rol va en su propio dispositivo.** No se comparte un único equipo entre el
control de acceso y el punto de venta.

Configuración recomendada:
- **Puerta:** Newland NQuire 1000 Manta III (~635 €, PoE) — o una segunda RT10
  Industry si se prefiere unificar proveedor.
- **Venta:** Oukitel RT10 Industry en carcasa de kiosko.

## Motivos

1. **Se serializa la cola.** Un cliente comprando durante 90 segundos bloquea la
   entrada de todos los demás. Es el fallo de diseño más probable del proyecto y
   solo se ve cuando hay gente de verdad esperando.
2. **Los perfiles de uso son incompatibles.** La puerta necesita interacción de
   1,5 segundos y disparo automático del escáner; la venta necesita pantalla
   grande, sesión larga y periféricos colgando.
3. **Los requisitos físicos son distintos.** La puerta quiere ir atornillada, sin
   batería que degradar y con un solo cable (PoE). La venta quiere mostrador,
   impresora y lector de tarjeta anclado.
4. **Un fallo no debe tumbar las dos funciones.** Si el equipo de venta se cuelga,
   la gente debe poder seguir entrando.
5. **El coste diferencial es bajo.** Un Newland Manta III cuesta ~635 €, muy por
   debajo del coste de una cola en la puerta un día de aforo alto.

## Consecuencias

- Coste de hardware mayor: dos equipos en vez de uno.
- Dos apps (o una app con dos modos), dos configuraciones de MDM, dos puntos de
  monitorización.
- El rol A gana PoE: un solo cable y sin batería en degradación permanente
  (elimina el riesgo R4 de `01-hardware.md` para ese dispositivo).
- Se puede desplegar el rol A primero y en producción, con el rol B aún en
  desarrollo. Ver fases en `07-plan-implementacion.md`.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Una RT10 Industry haciendo los dos roles con conmutación de modo | Serializa la cola. Es el problema que este ADR existe para evitar |
| Dos RT10 Industry (una por rol) | Válido y más simple de aprovisionar (un solo modelo), pero para la puerta se paga potencia que no se usa y se pierde el PoE. Aceptable si se prioriza homogeneidad del parque |
| Sunmi K2 Mini para el rol B + Newland para el rol A | Válido y posiblemente más barato en conjunto. **Pendiente de presupuesto** — si el K2 Mini sale bien de precio, revisar esta decisión |

## Notas

Si el cliente confirma que el volumen de entrada es muy bajo (p. ej. menos de 10
personas/hora) y el presupuesto es el factor dominante, esta decisión se puede
revisar con un ADR nuevo. Pero la recomendación por defecto es separar.
