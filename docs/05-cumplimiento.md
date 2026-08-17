# 05 — Cumplimiento normativo

**Estado:** identificado, no implementado.
**Fecha:** 2026-08-17
**⚠️ Este documento no es asesoramiento legal.** Antes de poner el sistema en
producción, validar con el asesor fiscal de STBMadrid.

---

## 1. Verifactu (AEAT) — el que condiciona el diseño

### Qué es

Un conjunto de requisitos técnicos y funcionales de la Agencia Tributaria que el
software de facturación español debe cumplir obligatoriamente. No es un tipo nuevo
de factura: es un estándar de **integridad, conservación, accesibilidad,
legibilidad, trazabilidad e inalterabilidad** de los registros de facturación.

### Calendario

| Fecha | Quién |
|---|---|
| **2026** | Periodo de transición y pruebas. La AEAT permite emitir facturas verificables con QR de forma **voluntaria** |
| **01-01-2027** | Obligatorio para sujetos del **Impuesto de Sociedades** |
| **01-07-2027** | Obligatorio para el **resto de empresas y autónomos** |

### Por qué nos afecta directamente

**Los tickets son facturas simplificadas.** La normativa aplica a las facturas
simplificadas, luego los TPV de hostelería, retail y cualquier comercio al público
tienen que adaptarse. Nuestro kiosko de venta **es** un TPV.

### La consecuencia de diseño

**El módulo de tickets tiene que nacer con Verifactu dentro, no parchearse en
2027.** Lo que implica, desde el primer commit del backend:

1. **Cadena de registros encadenados por hash.** Cada registro de facturación
   incluye el hash del anterior. Modificar uno rompe la cadena — eso es
   precisamente el objetivo (inalterabilidad).
2. **QR Verifactu impreso en el ticket.** Distinto del QR de acceso. Ver
   `04-impresion-bixolon.md`.
3. **Registros de anulación**, no borrados. Nada se elimina: se anula con un
   registro nuevo.
4. **Conservación y exportabilidad** de los registros en el formato que exige la
   AEAT.
5. **Decisión pendiente:** modo Verifactu (remisión de los registros a la AEAT) o
   modo no-Verifactu (registros firmados conservados localmente, con obligación de
   remisión a requerimiento). Impacta arquitectura. **A decidir con el asesor
   fiscal.**

> Retrofitear esto sobre un modelo de datos que no lo previó es rehacer la capa de
> ventas. Por eso está aquí, en fase de diseño, y no en una tarea de 2027.

## 2. PCI-DSS

### Alcance actual: mínimo

Con la arquitectura elegida (SumUp Solo + Cloud API, ver `03-pagos-sumup.md`), los
datos de tarjeta:
- nunca entran en la tablet,
- nunca entran en nuestro backend,
- van cifrados de extremo a extremo entre el lector certificado y SumUp.

Nuestro sistema maneja importes, referencias de pedido y resultados de
transacción. No maneja PAN.

### Cómo se pierde ese beneficio

En el momento en que alguien:
- implemente un formulario de tarjeta en la app del kiosko,
- integre un SoftPOS no certificado,
- registre en logs cualquier dato de tarjeta que devuelva la API.

Por eso ADR-0002 es vinculante y por eso está en la lista de "no hagas" de
`CLAUDE.md`.

### Regla operativa
**Nunca escribir en logs nada que venga del payload de pago más allá del ID de
transacción, el estado y el importe.** Ni los últimos 4 dígitos si se puede
evitar.

## 3. RGPD / LOPDGDD

El sistema trata datos personales. Puntos a resolver:

| Tema | Estado |
|---|---|
| **¿Qué datos lleva el pase QR?** | ⚠️ **A definir.** Si lleva nombre, DNI o email, hay tratamiento de datos personales y hay que justificarlo. Recomendación: que el QR sea un **identificador opaco** sin datos personales dentro |
| **Registro de accesos** | Es un dato personal (quién entró y cuándo). Necesita base legal, plazo de conservación definido y política de borrado |
| **Cámaras del dispositivo** | La Oukitel tiene 4 cámaras. Si no se usan, **deshabilitarlas por política del MDM** y decirlo. Un kiosko con cámara frontal apuntando al cliente genera dudas legítimas |
| **Huella dactilar (FAP10)** | Dato biométrico = **categoría especial** del art. 9 RGPD. Umbral legal alto. Recomendación: **no usarla para clientes**. Para personal, solo con evaluación de impacto |
| **Registro de actividades de tratamiento** | Hay que documentar el tratamiento |
| **Información al interesado** | Cartel visible en el kiosko + política accesible |
| **Encargados del tratamiento** | SumUp es un tercero que trata datos. Contrato de encargo |

**Recomendación fuerte:** diseñar el pase QR como identificador opaco aleatorio,
sin datos personales embebidos. Simplifica enormemente el cumplimiento y no
cuesta nada hacerlo así desde el principio.

## 4. Otros

| Tema | Nota |
|---|---|
| **Accesibilidad** | Un kiosko de autoservicio de cara al público debería considerar altura de montaje, contraste y tamaño de texto. Revisar si aplica normativa de accesibilidad al local |
| **Precios al público** | Obligación de mostrar precios con IVA incluido |
| **Derecho de desistimiento / reclamaciones** | Procedimiento para el cliente si algo falla. Hoja de reclamaciones |
| **Marcado y seguridad eléctrica** | Que el conjunto montado (tablet + carcasa + fuente) sea seguro y conforme |

## Acciones concretas pendientes

1. **Consultar al asesor fiscal de STBMadrid**: modo Verifactu vs no-Verifactu, y
   confirmar la fecha de obligación aplicable a la forma jurídica de STBMadrid
   (sociedad → 01-01-2027; autónomo → 01-07-2027).
2. **Definir el contenido del pase QR** (recomendación: identificador opaco).
3. **Decidir si se usa alguna cámara.** Si no, deshabilitarlas por política.
4. **Descartar biometría para clientes.**
5. Redactar la información de protección de datos visible en el kiosko.

## Fuentes

- [Verifactu — nuevo calendario tras el aplazamiento](https://www.verifactu.com/el-nuevo-calendario-de-verifactu-guia-tras-el-aplazamiento-a-2027/)
- [VeriFactu 2027: plazos, TPV y sistemas de facturación](https://www.consumiblestpv.com/verifactu-2027-plazos-tpv)
- [Obligaciones VeriFactu 2026–2027](https://www.reixmor.com/obligaciones-verifactu-2027/)
- [Qué es el sistema Verifactu (Cegid)](https://www.cegid.com/ib/es/sistema-verifactu/)
- [VeriFactu — entrada en vigor actualizada](https://muaytax.com/es/verifactu-entrada-en-vigor/)
