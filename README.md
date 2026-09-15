# STBMadrid — Kiosko de autoservicio

> **Estado del proyecto: 📋 PENDIENTE — fase de diseño / evaluación de hardware.**
> No hay código todavía. Este repositorio contiene, por ahora, el **estudio de
> viabilidad técnica completo** y el **plan de implementación**.

Sistema de autoservicio para STBMadrid, en dos roles:

1. **Control de acceso** — el cliente escanea su pase QR y entra.
2. **Kiosko de venta** — el cliente selecciona producto, paga con tarjeta y se
   imprime el ticket.

---

## 🤖 Si eres un agente de IA leyendo esto

**Empieza por [`AGENTS.md`](AGENTS.md).** Contiene el contexto completo, el
estado real de cada decisión, lo que está bloqueado y por qué, y qué NO debes
volver a investigar. Está escrito para que cualquier modelo (Claude Opus,
Sonnet, Haiku, Fable, GPT, Gemini…) pueda retomar el trabajo sin repetir la
investigación ya hecha.

---

## Documentación

| Documento | Contenido |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Punto de entrada.** Contexto para agentes de IA y humanos nuevos |
| [`docs/00-vision-y-alcance.md`](docs/00-vision-y-alcance.md) | Qué se construye y qué no |
| [`docs/01-hardware.md`](docs/01-hardware.md) | Oukitel RT10 Industry + 7 alternativas con precios |
| [`docs/02-arquitectura.md`](docs/02-arquitectura.md) | Arquitectura técnica y flujos |
| [`docs/03-pagos-sumup.md`](docs/03-pagos-sumup.md) | Integración de pago con tarjeta (SumUp Cloud API) |
| [`docs/04-impresion-bixolon.md`](docs/04-impresion-bixolon.md) | Impresión de tickets |
| [`docs/05-cumplimiento.md`](docs/05-cumplimiento.md) | Verifactu, PCI-DSS, RGPD |
| [`docs/06-preguntas-abiertas.md`](docs/06-preguntas-abiertas.md) | 🚧 **Bloqueantes y decisiones pendientes** |
| [`docs/07-plan-implementacion.md`](docs/07-plan-implementacion.md) | Fases, entregables, estimaciones |
| [`docs/adr/`](docs/adr/) | Registros de decisiones de arquitectura (ADR) |

## Resumen ejecutivo en tres líneas

- **Sí es viable.** La Oukitel RT10 Industry sirve para las dos cosas, gracias a
  su escáner Zebra SE4710 y a sus puertos USB-A / RJ45.
- **El pago no lo hace la tablet.** Se hace con un lector **SumUp Solo**
  gobernado por la **Cloud API** de SumUp. La tablet nunca ve datos de tarjeta.
- **Hay 3 bloqueantes** antes de comprar hardware o escribir código: ver
  [`docs/06-preguntas-abiertas.md`](docs/06-preguntas-abiertas.md).
