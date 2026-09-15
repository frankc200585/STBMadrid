# 02 — Arquitectura técnica

**Estado:** propuesta. No implementada.
**Fecha:** 2026-08-17

---

## Vista general

```
┌─────────────────────────┐         ┌─────────────────────────────┐
│  ROL A — PUERTA         │         │  ROL B — VENTA              │
│  Newland Manta III      │         │  Oukitel RT10 Industry      │
│  (o Oukitel RT10 Ind.)  │         │  en carcasa de kiosko       │
│                         │         │                             │
│  escáner 2D ──► QR      │         │  pantalla táctil 11"        │
│  PoE (1 cable)          │         │  RJ45 + dock pogo           │
└───────────┬─────────────┘         └──────────┬──────────────────┘
            │ HTTPS                            │ HTTPS
            └───────────────┬──────────────────┘
                            ▼
              ┌───────────────────────────────┐
              │   BACKEND STBMadrid           │
              │                               │
              │  · catálogo y precios         │
              │  · pedidos                    │
              │  · pases QR (emisión/consumo) │
              │  · registros Verifactu        │
              │  · orquestación de pago       │
              │  · cola de impresión          │
              └───┬───────────────────────┬───┘
                  │                       │
       Cloud API  │                       │  ESC/POS (red)
       (HTTPS)    ▼                       ▼
         ┌─────────────────┐      ┌──────────────────┐
         │   SumUp Solo    │      │  Bixolon         │
         │   (lector EMV)  │      │  (ticket + QR)   │
         └────────┬────────┘      └──────────────────┘
                  │
                  │ webhook: resultado de la transacción
                  ▼
              BACKEND STBMadrid
```

---

## Flujo A — Validación de pase en la puerta

```
Cliente presenta QR
      │
      ▼
Escáner lee el código  ──(sin lectura en 30 s)──► pantalla en reposo
      │
      ▼
App envía el código al backend  ──(sin red)──► modo degradado (ver abajo)
      │
      ▼
Backend valida: ¿existe? ¿en vigor? ¿ya consumido? ¿este acceso?
      │
      ├── VÁLIDO ──► registrar entrada · pantalla verde · sonido OK · abrir acceso
      │
      └── NO VÁLIDO ──► pantalla roja · motivo concreto en texto legible
                        ("pase ya utilizado a las 18:42", no "error 403")
```

**Modo degradado sin red:** el kiosko debe mostrar un mensaje claro
("Validación manual, avise al personal") y registrar localmente los códigos
escaneados para reconciliarlos cuando vuelva la conexión. Nunca dejar la pantalla
en blanco ni aceptar todo a ciegas.

## Flujo B — Compra en el kiosko

```
1. Pantalla de reposo → el cliente toca
2. Catálogo → arma el carrito
3. Resumen y confirmación de importe
4. "Pase la tarjeta por el lector"
      │
      ▼
5. Backend crea un Reader Checkout vía SumUp Cloud API
      │
      ▼
6. El Solo pide la tarjeta. El cliente paga en el lector.
      │  (la tablet solo muestra "esperando pago…" — no toca la tarjeta)
      ▼
7. SumUp notifica el resultado por webhook al backend
      │
      ├── OK ──► registrar venta + registro Verifactu + generar pase QR si aplica
      │           └──► imprimir ticket en Bixolon
      │                └──► pantalla "Recoja su ticket" → volver a reposo
      │
      └── KO ──► mensaje del motivo · ofrecer reintentar o cancelar
```

### Puntos delicados del flujo B

| Situación | Qué debe pasar |
|---|---|
| El cliente abandona a mitad | Timeout de inactividad (p. ej. 60 s) → cancelar checkout en SumUp y volver a reposo |
| El pago sale bien pero **falla la impresión** | La venta **existe**. No repetir el cobro. Encolar el ticket, avisar en pantalla y mostrar un QR en pantalla como respaldo |
| El webhook no llega | Consultar el estado del checkout por API (*polling* de respaldo). Nunca asumir el resultado |
| Doble pulsación en "Pagar" | Idempotencia: una referencia de pedido, un checkout. Bloquear la UI |
| Se va la luz a mitad del pago | Al arrancar, el backend reconcilia checkouts en estado indeterminado antes de volver a operar |

---

## Componentes

### 1. App de kiosko (dispositivo)

Dos opciones, sin decidir:

| Opción | A favor | En contra |
|---|---|---|
| **PWA en WebView bloqueado** | Un solo código para ambos roles, despliegue instantáneo, no depende de la tienda | Depende de que el escáner funcione como *keyboard wedge*; menos control del hardware |
| **Kotlin nativo** | Acceso total al SDK del escáner, SDK de Bixolon por USB, control del ciclo de vida | Dos bases de código si luego hay web; despliegue por MDM |

**Recomendación:** empezar en PWA para el rol A (es solo leer un código y pintar
verde/rojo) y valorar nativo para el rol B si la impresión por USB lo exige.

**Bloqueo del dispositivo** (imprescindible en ambos casos):
- Vía preferente: Android Enterprise *dedicated device* (COSU) + `LockTask` con
  un EMM. **Depende del bloqueante B2.**
- Alternativa: Device Owner por ADB (`dpm set-device-owner`) + `LockTask`.
  Funciona, pero es manual y se pierde en cada *factory reset*.

**Lectura del escáner:** el camino pragmático es el *keyboard wedge* (el escáner
escribe el código en el campo con foco). Requiere un input oculto siempre
enfocado. La alternativa es la API de *broadcast intents* del fabricante, que da
más control. **Depende del bloqueante B1** (modo presentación/continuo).

### 2. Backend

Responsabilidades:
- Catálogo, precios e IVA.
- Ciclo de vida del pedido, con idempotencia por referencia.
- Emisión y consumo de pases QR (firmados, con antipassback).
- **Cadena de registros de facturación Verifactu** (ver `05-cumplimiento.md`).
- Orquestación del pago: crear el checkout, recibir el webhook, hacer *polling*
  de respaldo, reconciliar.
- Cola de impresión con reintentos.

Lenguaje y framework: **sin decidir**. Requisitos: recibir webhooks HTTPS
entrantes con IP pública o túnel estable, y persistencia transaccional.

### 3. Impresión

Ver `04-impresion-bixolon.md`. Resumen: **Ethernet o USB, nunca Bluetooth** en
instalación fija.

### 4. Pago

Ver `03-pagos-sumup.md` y `adr/0002-pago-con-sumup-solo-cloud-api.md`.

---

## Red

```
Internet ── Router ── Switch (PoE) ──┬── Newland Manta III (PoE, rol A)
                                     ├── Oukitel RT10 Industry (RJ45, rol B)
                                     ├── Bixolon (Ethernet)
                                     └── (SumUp Solo va por su cuenta:
                                          WiFi propio o 4G incluido)
```

Recomendaciones:
- **VLAN dedicada** para los kioskos, separada de la WiFi de clientes. Esto
  mitiga el riesgo R3 (parches inciertos en la Oukitel).
- Cableado siempre que se pueda. El 5G de la tablet queda como respaldo, no como
  vía principal.
- El Solo no necesita estar en nuestra red: habla con SumUp por su cuenta. Eso es
  bueno para el alcance PCI.

---

## Lo que NO se debe hacer

1. **No capturar datos de tarjeta en la app.** Ver ADR-0002.
2. **No confiar solo en el webhook** para dar un pago por bueno. Siempre *polling*
   de respaldo.
3. **No imprimir el ticket antes de tener el pago confirmado.**
4. **No usar Bluetooth para la impresora** en instalación fija.
5. **No compartir un dispositivo entre rol A y rol B.**
6. **No cobrar dos veces** cuando falla la impresión: la venta ya está hecha.
