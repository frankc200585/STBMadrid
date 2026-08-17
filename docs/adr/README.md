# Registros de decisiones de arquitectura (ADR)

Cada decisión de arquitectura relevante se documenta aquí, numerada y con el
formato **Contexto / Decisión / Consecuencias / Alternativas descartadas**.

## Reglas

1. **Un ADR cerrado no se edita.** Si la decisión cambia, se escribe un ADR nuevo
   que lo **supersede**, y en el antiguo se anota `Superseded by ADR-XXXX`.
2. Estados posibles: `Propuesto`, `Aceptado`, `Rechazado`, `Superseded by ADR-XXXX`.
3. Numeración secuencial de cuatro dígitos.

## Índice

| ADR | Título | Estado |
|---|---|---|
| [0001](0001-dos-dispositivos-un-rol-cada-uno.md) | Un dispositivo por rol, no compartir | Aceptado |
| [0002](0002-pago-con-sumup-solo-cloud-api.md) | Pago con SumUp Solo + Cloud API | Aceptado (**vinculante**) |
| [0003](0003-verifactu-desde-el-diseno.md) | Verifactu en el modelo de datos desde el inicio | Aceptado |
