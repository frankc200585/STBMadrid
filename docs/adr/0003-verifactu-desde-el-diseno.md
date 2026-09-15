# ADR-0003 — Verifactu en el modelo de datos desde el inicio

- **Estado:** Aceptado
- **Fecha:** 2026-08-17

## Contexto

El kiosko de venta emite tickets. En España, **los tickets son facturas
simplificadas**, y la normativa Verifactu de la AEAT aplica a los sistemas que las
emiten — incluidos los TPV de hostelería y retail.

Calendario de obligación:
- **2026** — periodo de transición y pruebas voluntarias.
- **01-01-2027** — obligatorio para sujetos del Impuesto de Sociedades.
- **01-07-2027** — obligatorio para el resto de empresas y autónomos.

Hoy (agosto de 2026) estamos en el periodo de transición. La tentación natural es
construir el módulo de ventas ahora y "añadir Verifactu" en 2027.

## Decisión

**La cadena de registros de facturación conforme a Verifactu se implementa en el
modelo de datos desde el primer commit del backend de ventas**, no como tarea
posterior.

Concretamente, desde el inicio:

1. Registros de facturación **encadenados por hash** (cada registro incluye el
   hash del anterior).
2. **Inalterabilidad**: nada se modifica ni se borra. Las correcciones son
   registros de anulación nuevos.
3. **QR Verifactu** en el ticket impreso, distinto del QR de acceso.
4. **Conservación y exportabilidad** en el formato que exige la AEAT.
5. Trazabilidad y legibilidad de la cadena completa.

## Motivos

1. **Retrofitear una cadena de hash sobre un modelo de datos que no la previó es
   rehacer la capa de ventas.** El encadenamiento afecta al orden de escritura, a
   las transacciones, a la unicidad y a la imposibilidad de borrar. No es una
   columna que se añade.
2. **El coste de hacerlo bien ahora es bajo**; el de hacerlo en 2027 sobre datos
   de producción reales, con histórico ya emitido, es alto y arriesgado.
3. **El periodo de transición sirve exactamente para esto**: la AEAT permite
   emitir de forma verificable voluntariamente en 2026 para que los sistemas se
   validen antes de que empiecen las sanciones.
4. Si el proyecto se retrasa, es muy posible que entre en producción ya dentro del
   periodo obligatorio.

## Consecuencias

- Más trabajo en la fase 2 (`07-plan-implementacion.md`, tarea 2.3), que no se
  puede posponer.
- El modelo de datos de ventas queda con restricciones de solo-escritura y orden
  estricto. Hay que diseñarlo así conscientemente.
- El ticket lleva **dos QR** y hay que documentarlo para no confundirlos.
- **Queda una decisión pendiente (D4):** modo Verifactu (remisión de registros a
  la AEAT) frente a modo no-Verifactu (registros firmados conservados localmente).
  Impacta arquitectura y **requiere al asesor fiscal de STBMadrid**. Este ADR no
  la resuelve.
- Durante 2026 se puede operar en modo verificable voluntario y validar el sistema
  sin presión sancionadora.

## Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Añadir Verifactu en 2027 | Implica rehacer la capa de ventas sobre datos de producción. Riesgo alto, coste mayor |
| Usar un TPV comercial ya homologado y renunciar al kiosko propio | Opción legítima si el cliente prioriza cumplimiento sobre control, pero renuncia al proyecto. Mencionado para constancia |
| Delegar la facturación en un tercero por API | Viable, reduce el trabajo propio de cumplimiento. **No descartado del todo:** merece evaluarse al decidir D4 |

## Advertencia

Este ADR **no es asesoramiento legal**. Confirma el calendario aplicable a la
forma jurídica concreta de STBMadrid y el modo elegido con su asesor fiscal antes
de producción.

## Referencias

Detalle y fuentes en `../05-cumplimiento.md`.
