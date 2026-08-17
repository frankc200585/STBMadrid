# CLAUDE.md

El contexto completo de este repositorio está en **[`AGENTS.md`](AGENTS.md)**.
Léelo antes de trabajar. Este archivo solo añade notas específicas de Claude Code.

## Estado

Proyecto **PENDIENTE**: hay diseño y estudio de viabilidad, no hay código.
Rama de trabajo: `claude/stbmadrid-self-service-kiosk-icqwjj`.

## Antes de escribir código

Lee, en este orden:

1. `AGENTS.md` — contexto, decisiones cerradas y bloqueantes.
2. `docs/06-preguntas-abiertas.md` — **hay 3 bloqueantes sin resolver.** Si
   siguen abiertos, no empieces la implementación: resuélvelos o pregunta al
   usuario.
3. `docs/07-plan-implementacion.md` — por dónde se empieza.

## Convenciones

- Documentación y mensajes de commit en **español**; código e identificadores en
  **inglés**.
- Decisiones de arquitectura → un ADR nuevo en `docs/adr/`, nunca editar uno
  cerrado.
- Datos sin verificar se marcan `SIN VERIFICAR` / `PEDIR PRESUPUESTO`. No los
  rellenes a ojo.
- Los precios del hardware llevan fecha. Si citas uno nuevo, ponle fecha.

## No hagas

- No implementes captura de datos de tarjeta en la app del kiosko. Ver
  `docs/adr/0002-pago-con-sumup-solo-cloud-api.md`.
- No añadas el módulo de tickets sin la cadena de registros Verifactu prevista en
  `docs/05-cumplimiento.md`.
- No hagas push a `master`.
