# 01 — Hardware: evaluación y alternativas

**Fecha de la investigación:** 2026-08-17
**⚠️ Los precios caducan.** Todos los importes de este documento llevan fecha.
Verifícalos antes de tomar una decisión de compra.

---

## 1. Oukitel RT10 Industry — el candidato propuesto

| Componente | Especificación | Valoración para kiosko |
|---|---|---|
| Sistema operativo | Android 15 | ✅ WebView moderno, `LockTask` disponible |
| SoC | MediaTek Dimensity 7400X, GPU Mali-G615 MP2 | ✅ Muy sobrado |
| RAM / almacenamiento | 12–16 GB / 512 GB (ampliable a 36 GB* / 2 TB) | ✅ Sobrado |
| Pantalla | 11" FHD+ 1200×1920, 500 nits | ⚠️ Bien en interior, justo a pleno sol |
| **Escáner 2D** | **Zebra SE4710** | ✅✅ Motor de imagen Zebra real. Lee QR en pantalla de móvil |
| NFC | Sí | ✅ Alternativa o complemento al QR (Wallet) |
| Biometría | Módulo de huella industrial FAP10 | ✅ Útil para identificar personal |
| Puertos | USB-C (OTG), **USB-A**, **RJ45**, pogo 12 pines | ✅✅ Crítico: impresora por USB o red |
| Conectividad | 5G, Wi-Fi 6E, Bluetooth 5.4, GPS, doble nano-SIM | ✅ |
| Cámaras | 64 + 20 + 5 MP traseras, 32 MP frontal | ➖ Irrelevante para el caso de uso |
| Batería | 25.000 mAh | ✅ Aguanta cortes de luz; ⚠️ ver riesgo R4 |
| Robustez | IP68, IP69K, MIL-STD-810H | ✅ Sobra para uso público |
| Audio | Doble altavoz 5 W, >130 dB | ✅ Feedback audible en local ruidoso |
| Dimensiones / peso | 266,5 × 178 × 22,5 mm · 1.280 g | ⚠️ Es tablet de mano, no kiosko |

\* Los 36 GB son RAM ampliada por software (memoria virtual), no física.

### Precio (feb 2026, canal oficial Oukitel)

- PVP: **1.299 $ / 949 £**
- Oferta de lanzamiento: **999 $ / 730 £**
- **SIN VERIFICAR:** precio en € con IVA en canal español y disponibilidad de
  factura española. Hay que confirmarlo antes de comprar.

### Por qué es interesante

Dos cosas la separan de una tablet normal, y son justo las que necesita el
proyecto:

1. **El escáner Zebra SE4710.** Es el mismo motor que Zebra monta en sus propios
   terminales. Lee QR desde pantallas de móvil con brillo bajo, con protector o
   con la pantalla rayada — muy por encima de lo que consigue una cámara con
   librería de software.
2. **El RJ45.** Red cableada en un kiosko de pago no es un lujo, es fiabilidad.
   Casi ninguna tablet Android lo lleva integrado.

### Riesgos identificados

| # | Riesgo | Gravedad | Mitigación |
|---|---|---|---|
| R1 | El servicio de escáner puede no soportar **modo presentación/continuo** (disparo automático sin pulsar botón) | 🔴 Bloqueante | Probar con unidad de demo. Bloqueante **B1** |
| R2 | **Certificación GMS / Android Enterprise no documentada** | 🔴 Bloqueante | Pedir confirmación por escrito a Oukitel. Bloqueante **B2** |
| R3 | Ciclo de vida y cadencia de parches sin compromiso público. Oukitel no es Zebra ni Honeywell | 🟠 Alto | Exigir compromiso por escrito, o aceptar el riesgo y aislar el dispositivo en VLAN propia |
| R4 | Batería siempre conectada a red en kiosko 24/7 → degradación e hinchazón a 2–3 años | 🟠 Alto | Limitar carga por firmware si se puede; si no, presupuestar sustitución |
| R5 | Sin VESA, 1,28 kg, formato de mano → necesita carcasa de kiosko con cierre | 🟡 Medio | Presupuestar soporte antivandálico + dock pogo |
| R6 | Geometría del escáner: el cliente debe presentar el móvil en el punto exacto | 🟡 Medio | Estudio de montaje + vinilo indicador. O usar equipo dedicado en la puerta |
| R7 | 500 nits sin mención de bonding óptico → pobre a pleno sol | 🟡 Medio | Solo relevante si la puerta está al exterior |
| R8 | Dock de sobremesa para la variante *Industry* con paso de Ethernet: existencia **SIN VERIFICAR** | 🟡 Medio | Confirmar con el distribuidor antes de comprar |

---

## 2. Alternativas

### Tabla comparativa

| Modelo | Pantalla | SO | Escáner | Precio (fecha) | Encaje |
|---|---|---|---|---|---|
| **Oukitel RT10 Industry** | 11" | Android 15 | Zebra SE4710 | ~999–1.299 $ (feb-2026) | Rol B ✅ / Rol A ✅ |
| **Newland NQuire 1000 Manta III** | 10,1" | Android 13 | 2D integrado | **~635 €/ud, mín. 3 uds** (ago-2026) | **Rol A ✅✅** |
| **Honeywell RT10A** | 10" | Android | S6703 o S6803 FlexRange | **2.057–3.400 €** según config. (ago-2026) | Rol A/B ✅ pero caro |
| **Zebra ET40 / ET45** | 8" / 10" | Android | Integrado empresarial | SIN PRECIO PÚBLICO — pedir presupuesto | Rol A/B ✅ pero caro |
| **Chainway P80** | 8" | Android 13 | **Zebra SE4710** | SIN PRECIO PÚBLICO (canal Alibaba/Amazon) | Rol A ✅, alternativa barata |
| **Urovo P8100 / P8100P** | 8" / 10,1" | Android 13 | 1D/2D integrado | SIN PRECIO PÚBLICO — pedir presupuesto | Rol A ✅ |
| **Sunmi K2 Mini** | 15,6" | SUNMI OS (Android) | 2D + **impresora 80 mm integrada** | SIN PRECIO PÚBLICO — pedir presupuesto | **Rol B ✅✅ (todo en uno)** |
| **Sunmi K2** | 24" | SUNMI OS (Android) | 2D + impresora 80 mm con autocorte | SIN PRECIO PÚBLICO — pedir presupuesto | Rol B ✅, gama alta |

### Análisis por candidato

#### 🏆 Newland NQuire 1000 Manta III — el mejor para el rol A (acceso)

**~635 €/unidad (pedido mínimo 3 uds), ago-2026.**

Es un **micro-kiosko**, no una tablet: nace para ir atornillado a una pared o a
un mostrador. 10,1", Android 13, 4 GB / 64 GB, escáner 2D, cámara frontal 5 MP.

Su gran ventaja sobre la Oukitel para la puerta es **PoE**: un único cable de red
lleva datos y alimentación. En un torno de entrada eso elimina el enchufe, el
cargador y el riesgo de que alguien lo desenchufe. Y no tiene batería que se
degrade estando siempre enchufado (riesgo R4 eliminado).

Sus desventajas: menos potencia, Android 13 en vez de 15, y no sirve para el rol
B porque no tiene dónde colgar impresora ni tanta pantalla.

> **Recomendación:** si el proyecto se hace en dos dispositivos, este es el de la
> puerta.

#### 🏆 Sunmi K2 Mini — el mejor "todo en uno" para el rol B (venta)

15,6", Android, escáner 2D **e impresora de 80 mm ya integrada**. Es literalmente
un kiosko de autoservicio de fábrica: pantalla grande, escáner e impresora en un
solo chasis con un solo cable.

**El cálculo que hay que hacer:** Oukitel (~1.100 €) + Bixolon (~200–400 €) +
carcasa de kiosko (~200–400 €) + soporte del lector SumUp puede acabar costando
lo mismo o más que un K2 Mini, con tres cables y tres puntos de fallo en vez de
uno.

Contras: si ya tenéis la Bixolon comprada, la impresora integrada del Sunmi es
gasto duplicado; el hardware es menos potente; y `SUNMI OS` es un Android
modificado, lo que ata a su ecosistema y a su cadencia de actualizaciones.
También hay que verificar que su impresora integrada dé la calidad y el ancho de
ticket que necesitáis. **Pedir presupuesto.**

#### Honeywell RT10A — la referencia de tier 1, y el dato más revelador

**2.057 € – 3.400 € según configuración (Logiscenter, ago-2026, IVA incl.).**

10", pantalla de **800 nits** (frente a los 500 de la Oukitel), IP65, caída de
1,2 m, y dos opciones de escáner, incluido el **S6803 FlexRange** que lee de
0,1 m a 10,7 m.

Lo importante de este dato no es el Honeywell: es que **la Oukitel cuesta entre
2× y 3× menos que el equivalente de marca tier 1**. Eso valida que la Oukitel es
buen precio. Lo que se paga de más en Honeywell es soporte plurianual, parches
garantizados, RMA europeo y accesorios certificados — exactamente los riesgos R3
y R8 de la Oukitel. La pregunta real no es "cuál es mejor" sino **"¿cuánto vale
para STBMadrid tener soporte a 5 años?"**.

#### Zebra ET40 / ET45

Tier 1, escaneado integrado de categoría empresarial, ciclo de vida plurianual
declarado. Sin precio público: hay que pedir presupuesto. Es la opción de
referencia si el proyecto crece a varios locales y hace falta MDM serio y
garantía de parches, porque el soporte de Android Enterprise está garantizado
(elimina el bloqueante B2 de un plumazo).

#### Chainway P80 — el comodín barato

8", Android 13, y **el mismo escáner Zebra SE4710 que la Oukitel**. Batería
8.700 mAh, NFC, huella opcional, UHF RFID opcional. Canal Alibaba / Amazon, sin
precio público fiable.

Es la alternativa a considerar si solo hace falta el rol A y la Oukitel resulta
caro o falla el bloqueante B1: mismo motor de escaneo por bastante menos. Contras:
pantalla pequeña para un kiosko de venta, **sin RJ45**, y soporte y garantía en
Europa poco claros.

#### Urovo P8100 / P8100P

8" o 10,1", Android 13, 5G, Wi-Fi 6E, IP65–IP67, caída 1,2 m, biometría en el
P8100. Perfil muy parecido a la Oukitel. Sin precio público. Urovo tiene filial
EMEA, lo que ayuda con garantía y RMA en Europa frente a Oukitel o Chainway.
Merece pedir presupuesto como plan B directo.

---

## 3. Recomendación

### Escenario A — Presupuesto contenido, dos dispositivos (recomendado)

| Rol | Equipo | Coste orientativo |
|---|---|---|
| Puerta | Newland NQuire 1000 Manta III (PoE) | ~635 € |
| Venta | Oukitel RT10 Industry + carcasa + dock | ~1.100 € + accesorios |
| Cobro | SumUp Solo + soporte anclado | según tarifa SumUp |
| Ticket | Bixolon (modelo a confirmar) por Ethernet o USB | ~200–400 € |

Por qué: cada dispositivo hace lo que mejor sabe, la puerta queda con un solo
cable y sin batería que degradar, y no se serializa la cola.

### Escenario B — Un solo kiosko de venta, mínimo cableado

Sunmi K2 Mini (pantalla + escáner + impresora integrados) + SumUp Solo. Un
chasis, un cable, un proveedor. **Pedir presupuesto para comparar** contra el
escenario A. Descartar si la Bixolon ya está comprada.

### Escenario C — Se prioriza soporte y vida útil

Zebra ET40 o Honeywell RT10A en ambos roles. Cuesta 2–3× más y elimina los
riesgos R2, R3 y R8. Justificable si el sistema va a ser crítico para el negocio
o si se va a replicar en varios locales.

### Si solo se compra un equipo ahora

**Oukitel RT10 Industry**, pero **solo después de resolver los bloqueantes B1 y
B2 con una unidad de demo**. Es buen precio y buen escáner; el riesgo no está en
las prestaciones, está en el software y en el soporte.

---

## Fuentes

**Oukitel RT10 Industry**
- [Página oficial](https://oukitel.com/pages/oukitel-rt10-industry)
- [Especificaciones detalladas](https://oukitel.store/pages/oukitel-rt10-industry-specs)
- [TechRadar — review](https://www.techradar.com/pro/oukitel-industry-rt10-rugged-tablet-review)
- [TechRadar — presentación IFA 2025](https://www.techradar.com/pro/oukitel-aims-at-zebra-getac-with-rugged-tablet-rt10-industry-has-a-2d-barcode-scanner-nfc-and-5g-connectivity)
- [GSMArena — ficha](https://www.gsmarena.com/oukitel_rt10_industry_5g-14462.php)
- [Smartprix — precio](https://us.smartprix.com/tablets/oukitel-rt10-industry-ppd163szsb1p)

**Alternativas**
- [Newland NQuire 1000 Manta III (oficial)](https://www.newland-id.com/en/products/micro-kiosks/nquire-1000-manta-iii)
- [Newland Manta III — precio](https://industry-electronics.com/newland/nls-nquire1000-w4-sp-nquire-1000-manta-iii-4g-poe-portrait-2d-25.4-cm-10-gps-usb-lieske_282733.htm)
- [Honeywell RT10A (oficial)](https://automation.honeywell.com/us/en/products/productivity-solutions/mobile-computers/tablets/rt10-rugged-tablet-android)
- [Honeywell RT10A — precios Logiscenter](https://www.logiscenter.com/terminal-honeywell-rt10a-l1n-17c12s0e)
- [Zebra ET40/ET45 — ficha técnica](https://www.zebra.com/us/en/products/spec-sheets/tablets/et40-et45.html)
- [Chainway P80 (oficial)](https://www.chainway.net/Products/Info/158)
- [Urovo P8100 (oficial)](https://en.urovo.com/products/tablets/p8100.html)
- [Sunmi K2 Mini (oficial)](https://www.sunmi.com/en/k2-mini/)
- [Sunmi K2 (oficial)](https://www.sunmi.com/en/k2/)
