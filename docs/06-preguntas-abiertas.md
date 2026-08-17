# 06 — Preguntas abiertas y bloqueantes

**Última revisión:** 2026-08-17

> 📌 **Este es el documento que hay que mirar primero para saber si se puede
> avanzar.** Mantenlo actualizado: cuando algo se resuelva, márcalo y refleja el
> cambio en la tabla §4 de `AGENTS.md`.

---

## 🔴 Bloqueantes — no comprar hardware ni programar sin resolverlos

### B1 — ¿Soporta el escáner de la RT10 Industry modo presentación/continuo?

- **Estado:** ❌ Sin resolver
- **Qué hay que saber:** que el servicio de escáner permita **disparo automático
  al detectar un código**, sin pulsar botón físico ni tocar la pantalla.
- **Por qué bloquea:** en un kiosko desatendido nadie va a pulsar un gatillo. Si
  el escáner solo dispara por botón, el rol A (puerta) **no funciona**.
- **Cómo se resuelve:** con una **unidad de demo**. Revisar la app de
  configuración del escáner que trae Oukitel, buscar los modos de disparo
  (*trigger mode*: manual / continuo / presentación) y verificar también qué
  interfaz de salida ofrece (*keyboard wedge* y/o *broadcast intents*).
- **Plan B si falla:** escáner de presentación fijo dedicado en la puerta, con la
  tablet solo como pantalla. O cambiar a Newland Manta III, que nace para esto.
- **Responsable:** — · **Fecha objetivo:** —

### B2 — ¿Está la RT10 Industry certificada en GMS / Android Enterprise?

- **Estado:** ❌ Sin resolver. No está documentado públicamente.
- **Qué hay que saber:** si el equipo está certificado en **Android Enterprise**,
  lo que permite enrolamiento como *dedicated device* (COSU) con un EMM (Intune u
  otro) y gestión remota de verdad.
- **Por qué bloquea:** sin certificación no hay MDM. El bloqueo del kiosko habría
  que hacerlo artesanalmente con `dpm set-device-owner` por ADB: funciona, pero es
  manual, hay que repetirlo en cada dispositivo y **se pierde en cada factory
  reset**. Para un parque de kioskos de cara al público es un problema operativo
  real.
- **Cómo se resuelve:** pedir confirmación **por escrito** a Oukitel o al
  distribuidor. Preguntar literalmente: *"¿Está el RT10 Industry certificado en
  Android Enterprise? ¿Soporta enrolamiento como dedicated device / COSU y
  aprovisionamiento por QR?"*
- **Plan B si falla:** aceptar el kiosko artesanal (viable con 1–2 equipos,
  insostenible con 10), o pasar a Zebra ET40 / Honeywell RT10A, que sí lo
  garantizan.
- **Responsable:** — · **Fecha objetivo:** —

### B3 — ¿Autoriza SumUp el uso desatendido del Solo para STBMadrid?

- **Estado:** ❌ Sin resolver
- **Qué hay que saber:** si el contrato de SumUp con STBMadrid permite uso
  **desatendido / self-service** del lector Solo para su MCC.
- **Por qué bloquea:** si no lo autorizan, hay que cambiar de proveedor de cobro y
  se rehace toda la capa de pago.
- **Contexto a favor:** SumUp vende su propio producto **SumUp Kiosk**, luego el
  caso de uso lo apoyan comercialmente. Pero eso no equivale a tenerlo autorizado
  en nuestro contrato.
- **Cómo se resuelve:** preguntar a SumUp por escrito. En la misma gestión, pedir
  la **activación del scope `payments`** (ver `03-pagos-sumup.md`), que es el
  trámite con más riesgo de retraso.
- **Responsable:** — · **Fecha objetivo:** —

---

## 🟡 Datos que faltan del cliente

Sin estos no se puede empezar a construir, aunque no bloquean la compra de
hardware.

### P1 — ¿Qué modelo exacto de Bixolon y con qué interfaz?
Condiciona el SDK, la interfaz de conexión y el ancho del ticket (58 vs 80 mm).
Si es de la serie móvil **SPP-R** habrá que replantear la conexión (esas no suelen
llevar Ethernet). Ver `04-impresion-bixolon.md`.
**Estado:** ❌

### P2 — ¿Qué vende STBMadrid en el kiosko?
Catálogo, precios, tipos de IVA aplicables. ¿Son entradas o pases (y por tanto el
ticket genera acceso), consumibles, o ambos? Condiciona el modelo de datos y el
diseño del ticket.
**Estado:** ❌

### P3 — ¿La entrada es totalmente desatendida?
Si hay personal cerca, el modo degradado sin red es aceptable y baja mucho el
riesgo. Si es 100 % desatendido, hacen falta más garantías y monitorización.
**Estado:** ❌

### P4 — ¿Qué significa exactamente "entrar"?
¿Hay torno o puerta motorizada que el kiosko deba accionar (relé, API del
controlador de acceso), o basta con validar en pantalla y que pase? Cambia el
alcance del rol A por completo.
**Estado:** ❌

### P5 — ¿Existe ya backend o sistema de pases QR?
El repositorio está vacío. Si hay un sistema previo (web de venta, CRM, sistema de
reservas) hay que integrarse con él, no reinventarlo. Si no hay nada, se construye
desde cero.
**Estado:** ❌

### P6 — ¿Hay unidad de demo de la RT10 Industry?
Sin ella no se pueden cerrar B1 ni B2. Es la vía más rápida para desbloquear el
proyecto.
**Estado:** ❌

---

## 🟢 Decisiones pendientes (no bloqueantes, pero hay que tomarlas)

| # | Decisión | Notas |
|---|---|---|
| D1 | ¿Uno o dos dispositivos? | Recomendado: dos (Newland en puerta + Oukitel en venta). Ver `01-hardware.md` §3 |
| D2 | ¿PWA en WebView o Kotlin nativo? | Ver `02-arquitectura.md`. Depende en parte de B1 |
| D3 | Lenguaje y stack del backend | Sin restricción conocida |
| D4 | Modo Verifactu o no-Verifactu | Requiere asesor fiscal. Ver `05-cumplimiento.md` |
| D5 | ¿Qué lleva dentro el QR del pase? | Recomendado: identificador opaco sin datos personales |
| D6 | ¿Se usa alguna cámara del dispositivo? | Si no, deshabilitarlas por política |
| D7 | Gestión de reembolsos | ¿Panel de SumUp o nuestro backend? Fuera de fase 1 |
| D8 | ¿Cuántos locales? | Si es más de uno, revisar arquitectura del backend antes de empezar |
| D9 | Presupuesto disponible | Determina el escenario A, B o C de `01-hardware.md` |
| D10 | ¿Se compra la carcasa antivandálica y el dock pogo? | Confirmar antes que existen para la variante *Industry* (riesgo R8) |

---

## Camino crítico para desbloquear el proyecto

```
1. Conseguir unidad de demo RT10 Industry (P6)
        └──► probar escáner en modo continuo (B1)
        └──► verificar Android Enterprise (B2)

2. En paralelo: escribir a SumUp
        └──► autorización de uso desatendido (B3)
        └──► activación del scope `payments`

3. En paralelo: pedir al cliente P1–P5

4. Con B1+B2+B3 resueltos ──► decidir escenario de hardware (D1, D9)
        └──► empezar fase 1 de `07-plan-implementacion.md`
```

Los tres frentes son independientes: se pueden atacar a la vez. El más lento
suele ser el 2, por eso conviene empezarlo el primer día.
