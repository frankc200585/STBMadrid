#!/usr/bin/env python3
"""
triaje.py — Encuentra el mejor material de una descarga masiva del movil.

Pensado para el caso real: 14.000 imagenes en el movil, de las cuales el 95%
son reenvios de WhatsApp, carteles y capturas de pantalla. Esto separa el
material propio, lo filtra por fechas de evento y puntua las mejores tomas.

Uso:
    python triaje.py <carpeta_origen> --eventos 2026-08-16,2026-08-30
    python triaje.py <carpeta_origen> --eventos 2026-08-30 --top 60
    python triaje.py <carpeta_origen> --eventos 2026-08-30 --videos

Instalacion:
    pip install opencv-python pillow

Salida:
    CANDIDATAS/<fecha>/  copias de las mejores fotos, renombradas por puntuacion
    triaje.csv           todas las puntuaciones, para revisar a mano
"""

import argparse
import csv
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError:
    sys.exit("Falta OpenCV.  Instalalo con:  pip install opencv-python pillow")

IMG_EXT = {".jpg", ".jpeg", ".png", ".heic", ".webp"}
VID_EXT = {".mp4", ".mov", ".m4v", ".3gp"}

# Material que NO es nuestro: reenvios, carteles, capturas.
DESCARTAR_NOMBRE = re.compile(
    r"(-WA\d+|screenshot|captura|whatsapp|telegram|download|descarga|sticker)",
    re.IGNORECASE,
)
DESCARTAR_RUTA = re.compile(
    r"(whatsapp|telegram|download|descarga|screenshot|captura|messenger|sticker|\.thumbnails)",
    re.IGNORECASE,
)
# Nombres de camara: IMG_20260830_183045.jpg / VID_20260830_183045.mp4
FECHA_NOMBRE = re.compile(r"(20\d{2})[-_]?(\d{2})[-_]?(\d{2})")


# ---------------------------------------------------------------- utilidades

def es_material_propio(ruta: Path) -> bool:
    if DESCARTAR_RUTA.search(str(ruta.parent)):
        return False
    if DESCARTAR_NOMBRE.search(ruta.name):
        return False
    return True


def fecha_de(ruta: Path) -> str:
    """Fecha en YYYY-MM-DD, del nombre si se puede, si no del mtime."""
    m = FECHA_NOMBRE.search(ruta.name)
    if m:
        y, mo, d = m.groups()
        try:
            return datetime(int(y), int(mo), int(d)).strftime("%Y-%m-%d")
        except ValueError:
            pass
    return datetime.fromtimestamp(ruta.stat().st_mtime).strftime("%Y-%m-%d")


def cargar(ruta: Path, ancho=900):
    img = cv2.imread(str(ruta))
    if img is None:
        return None
    h, w = img.shape[:2]
    if w > ancho:
        img = cv2.resize(img, (ancho, int(h * ancho / w)))
    return img


# ---------------------------------------------------------------- metricas

def nitidez(img) -> float:
    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gris, cv2.CV_64F).var())


def exposicion(img) -> float:
    """1.0 = bien expuesta. Penaliza quemadas y subexpuestas."""
    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    media = gris.mean()
    quemado = (gris > 250).mean()
    negro = (gris < 5).mean()
    p = 1.0 - abs(media - 128) / 128.0
    return float(max(0.0, p - quemado * 2 - negro * 2))


def colorido(img) -> float:
    """Hasler-Susstrunk. Fiesta y piscina = color saturado."""
    b, g, r = cv2.split(img.astype("float"))
    rg, yb = r - g, 0.5 * (r + g) - b
    return float(np.sqrt(rg.std() ** 2 + yb.std() ** 2)
                 + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))


def agua(img) -> float:
    """Fraccion de pixeles azul/cian saturados. Heuristica de piscina."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]
    return float(((h > 85) & (h < 130) & (s > 60) & (v > 60)).mean())


_cara = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
_sonrisa = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_smile.xml")


def gente(img):
    """Devuelve (n_caras, n_sonrisas). Heuristica: mas caras = mas ambiente."""
    gris = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    caras = _cara.detectMultiScale(gris, 1.15, 5, minSize=(35, 35))
    sonrisas = 0
    for (x, y, w, h) in caras:
        roi = gris[y + h // 2: y + h, x: x + w]
        if roi.size and len(_sonrisa.detectMultiScale(roi, 1.7, 20, minSize=(20, 20))):
            sonrisas += 1
    return len(caras), sonrisas


def puntuar(img, peso_kb: float) -> dict:
    nit = nitidez(img)
    exp = exposicion(img)
    col = colorido(img)
    ag = agua(img)
    caras, sonrisas = gente(img)

    # Normalizacion a 0-1 con topes razonables
    n_nit = min(nit / 400.0, 1.0)
    n_col = min(col / 90.0, 1.0)
    n_ag = min(ag / 0.35, 1.0)
    n_caras = min(caras / 6.0, 1.0)
    n_son = min(sonrisas / 3.0, 1.0)
    n_peso = min(peso_kb / 2500.0, 1.0)   # penaliza material recomprimido

    total = (
        n_nit * 25 +      # que este enfocada es lo primero
        exp * 20 +        # bien expuesta
        n_caras * 20 +    # que haya gente
        n_son * 15 +      # ALEGRIA
        n_col * 10 +      # FIESTA (color)
        n_ag * 5 +        # PISCINA
        n_peso * 5        # calidad de origen
    )
    return {
        "puntuacion": round(total, 1),
        "nitidez": round(nit, 1),
        "exposicion": round(exp, 2),
        "colorido": round(col, 1),
        "agua": round(ag, 3),
        "caras": caras,
        "sonrisas": sonrisas,
    }


# ---------------------------------------------------------------- video

def mejores_momentos(ruta: Path, cada_seg=2.0, top=5):
    cap = cv2.VideoCapture(str(ruta))
    if not cap.isOpened():
        return []
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    salto = max(1, int(fps * cada_seg))
    res, i = [], 0
    while i < total:
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ok, frame = cap.read()
        if not ok:
            break
        h, w = frame.shape[:2]
        if w > 900:
            frame = cv2.resize(frame, (900, int(h * 900 / w)))
        p = puntuar(frame, 2500)
        res.append((round(i / fps, 1), p["puntuacion"], p["caras"], p["sonrisas"]))
        i += salto
    cap.release()
    return sorted(res, key=lambda x: -x[1])[:top]


# ---------------------------------------------------------------- principal

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("origen", type=Path)
    ap.add_argument("--eventos", required=True,
                    help="Fechas separadas por coma: 2026-08-16,2026-08-30")
    ap.add_argument("--top", type=int, default=40, help="Candidatas por evento")
    ap.add_argument("--videos", action="store_true",
                    help="Analiza tambien videos y reporta los mejores segundos")
    ap.add_argument("--salida", type=Path, default=Path("CANDIDATAS"))
    args = ap.parse_args()

    fechas = {f.strip() for f in args.eventos.split(",")}
    if not args.origen.is_dir():
        sys.exit(f"No existe la carpeta: {args.origen}")

    print(f"Buscando en {args.origen} …")
    todo = [p for p in args.origen.rglob("*") if p.is_file()]
    print(f"  {len(todo)} archivos en total")

    propios = [p for p in todo if es_material_propio(p)]
    print(f"  {len(propios)} tras descartar WhatsApp / capturas / carteles"
          f"  ({len(todo) - len(propios)} descartados)")

    fotos, videos, filas = [], [], []
    for p in propios:
        ext = p.suffix.lower()
        if ext not in IMG_EXT and ext not in VID_EXT:
            continue
        if fecha_de(p) not in fechas:
            continue
        (fotos if ext in IMG_EXT else videos).append(p)

    print(f"  {len(fotos)} fotos y {len(videos)} videos en las fechas indicadas\n")
    if not fotos and not videos:
        sys.exit("Nada coincide. Revisa las fechas o la carpeta de origen.")

    for n, p in enumerate(fotos, 1):
        img = cargar(p)
        if img is None:
            continue
        r = puntuar(img, p.stat().st_size / 1024)
        r.update(archivo=str(p), nombre=p.name, fecha=fecha_de(p))
        filas.append(r)
        if n % 25 == 0 or n == len(fotos):
            print(f"  analizadas {n}/{len(fotos)} fotos", end="\r")
    print()

    filas.sort(key=lambda r: -r["puntuacion"])

    with open("triaje.csv", "w", newline="", encoding="utf-8") as fh:
        if filas:
            w = csv.DictWriter(fh, fieldnames=list(filas[0].keys()))
            w.writeheader()
            w.writerows(filas)

    for fecha in sorted(fechas):
        del_dia = [r for r in filas if r["fecha"] == fecha][: args.top]
        if not del_dia:
            continue
        destino = args.salida / fecha
        destino.mkdir(parents=True, exist_ok=True)
        for i, r in enumerate(del_dia, 1):
            nuevo = destino / f"{i:03d}_{int(r['puntuacion']):02d}pts_{r['nombre']}"
            shutil.copy2(r["archivo"], nuevo)
        print(f"✅ {fecha}: {len(del_dia)} candidatas en {destino}")

    if args.videos and videos:
        print("\n🎬 Mejores momentos por video:")
        for v in videos:
            momentos = mejores_momentos(v)
            if momentos:
                print(f"\n  {v.name}")
                for seg, pts, caras, son in momentos:
                    print(f"    {seg:>6.1f}s  ·  {pts:>5.1f} pts  ·  "
                          f"{caras} caras, {son} sonrisas")

    print(f"\n📄 Detalle completo en triaje.csv ({len(filas)} fotos puntuadas)")
    print("   Revisa CANDIDATAS/ — el orden del nombre es el ranking.")


if __name__ == "__main__":
    main()
