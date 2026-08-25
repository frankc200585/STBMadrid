#!/usr/bin/env bash
#
# reels.sh — Normaliza material bruto y genera variantes para reels.
#
# Uso:
#   ./reels.sh normalizar  <origen> <destino>   Normaliza todo (HDR->SDR, CFR, audio)
#   ./reels.sh vertical    <archivo> [salida]   Recorta a 9:16 (1080x1920)
#   ./reels.sh vertical-bg <archivo> [salida]   9:16 con fondo desenfocado
#   ./reels.sh lento       <archivo> [salida]   Camara lenta al 50% (necesita 60fps)
#   ./reels.sh tiempos     <carpeta>            Vuelca fechas de captura a CSV
#   ./reels.sh comprimidos <carpeta>            Detecta material enviado sin "como archivo"
#
# Requiere: ffmpeg (con libzimg), ffprobe, exiftool
#
set -euo pipefail

CRF=18
PRESET=slow

die() { echo "❌ $*" >&2; exit 1; }
comprobar() { command -v "$1" >/dev/null 2>&1 || die "Falta $1. Instálalo antes de seguir."; }

# ¿El archivo viene en HDR (Dolby Vision / HLG / PQ)?
es_hdr() {
  local trc
  trc=$(ffprobe -v error -select_streams v:0 \
        -show_entries stream=color_transfer -of csv=p=0 "$1" 2>/dev/null || true)
  [[ "$trc" == "smpte2084" || "$trc" == "arib-std-b67" ]]
}

normalizar() {
  local origen="${1:?falta carpeta origen}" destino="${2:?falta carpeta destino}"
  comprobar ffmpeg; comprobar ffprobe
  mkdir -p "$destino"

  find "$origen" -type f \( -iname '*.mov' -o -iname '*.mp4' -o -iname '*.m4v' \) -print0 |
  while IFS= read -r -d '' f; do
    local salida="$destino/$(basename "${f%.*}").mp4"
    [[ -f "$salida" ]] && { echo "⏭  ya existe: $(basename "$salida")"; continue; }

    if es_hdr "$f"; then
      echo "🎨 HDR→SDR: $(basename "$f")"
      ffmpeg -hide_banner -loglevel error -i "$f" -vf \
"zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,\
tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p" \
        -c:v libx264 -crf "$CRF" -preset "$PRESET" \
        -r 30 -fps_mode cfr \
        -c:a aac -b:a 192k -movflags +faststart "$salida"
    else
      echo "🎬 SDR:     $(basename "$f")"
      ffmpeg -hide_banner -loglevel error -i "$f" \
        -c:v libx264 -crf "$CRF" -preset "$PRESET" -pix_fmt yuv420p \
        -r 30 -fps_mode cfr \
        -c:a aac -b:a 192k -movflags +faststart "$salida"
    fi
  done
  echo "✅ Normalizado en $destino"
}

vertical() {
  local f="${1:?falta archivo}" salida="${2:-${1%.*}_9x16.mp4}"
  comprobar ffmpeg
  ffmpeg -hide_banner -loglevel error -i "$f" \
    -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" \
    -c:v libx264 -crf 20 -preset "$PRESET" -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart "$salida"
  echo "✅ $salida"
}

vertical_bg() {
  local f="${1:?falta archivo}" salida="${2:-${1%.*}_9x16bg.mp4}"
  comprobar ffmpeg
  ffmpeg -hide_banner -loglevel error -i "$f" -filter_complex \
"[0:v]split[a][b];\
[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=25[bg];\
[b]scale=1080:-2[fg];\
[bg][fg]overlay=(W-w)/2:(H-h)/2,format=yuv420p" \
    -c:v libx264 -crf 20 -preset "$PRESET" \
    -c:a aac -b:a 192k -movflags +faststart "$salida"
  echo "✅ $salida"
}

lento() {
  local f="${1:?falta archivo}" salida="${2:-${1%.*}_lento.mp4}"
  comprobar ffmpeg
  ffmpeg -hide_banner -loglevel error -i "$f" \
    -vf "setpts=2.0*PTS" -af "atempo=0.5" \
    -c:v libx264 -crf 20 -preset "$PRESET" -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart "$salida"
  echo "✅ $salida  (usa material a 60 fps o se verá a tirones)"
}

tiempos() {
  local carpeta="${1:?falta carpeta}"
  comprobar exiftool
  exiftool -r -time:all -s -csv \
    -ext mov -ext mp4 -ext m4v -ext jpg -ext heic "$carpeta" > tiempos.csv
  echo "✅ tiempos.csv — revisa si algún dispositivo va desfasado."
  echo "   Corregir:  exiftool \"-AllDates+=0:0:0 1:23:0\" -ext mov CARPETA/"
}

# Material enviado por Telegram "como vídeo" en vez de "como archivo" llega
# recomprimido: resolución baja y bitrate pobre. Esto lo detecta.
comprimidos() {
  local carpeta="${1:?falta carpeta}"
  comprobar ffprobe
  echo "Revisando material sospechoso de venir comprimido…"
  find "$carpeta" -type f \( -iname '*.mp4' -o -iname '*.mov' \) -print0 |
  while IFS= read_r_dummy= read -r -d '' f 2>/dev/null || IFS= read -r -d '' f; do
    local info alto tasa
    info=$(ffprobe -v error -select_streams v:0 \
           -show_entries stream=height,bit_rate -of csv=p=0 "$f" 2>/dev/null || true)
    alto=${info%%,*}; tasa=${info##*,}
    [[ -z "$alto" || "$alto" == "N/A" ]] && continue
    if (( alto < 1080 )); then
      echo "⚠️  $(basename "$f") — solo ${alto}px de alto. Probablemente comprimido."
    elif [[ "$tasa" =~ ^[0-9]+$ ]] && (( tasa < 3000000 )); then
      echo "⚠️  $(basename "$f") — bitrate bajo ($((tasa/1000)) kbps). Revísalo."
    fi
  done
  echo "✅ Revisión terminada."
}

# ---------------------------------------------------------------- marca de agua

# Posicion por defecto: arriba a la derecha, fuera de la zona que tapa
# la interfaz de Instagram (15% superior / 20% inferior).
MARGEN=45
ANCHO_LOGO=190   # px sobre un video de 1080 de ancho

marca() {
  local f="${1:?falta video}" logo="${2:?falta logo.png}" salida="${3:-${1%.*}_marca.mp4}"
  comprobar ffmpeg
  [[ -f "$logo" ]] || die "No encuentro el logo: $logo"
  ffmpeg -hide_banner -loglevel error -i "$f" -i "$logo" -filter_complex \
"[1:v]scale=${ANCHO_LOGO}:-1,format=rgba,colorchannelmixer=aa=0.75[wm];\
[0:v][wm]overlay=W-w-${MARGEN}:${MARGEN},format=yuv420p" \
    -c:v libx264 -crf 20 -preset "$PRESET" \
    -c:a copy -movflags +faststart "$salida"
  echo "✅ $salida"
}

marca_lote() {
  local carpeta="${1:?falta carpeta}" logo="${2:?falta logo.png}"
  local destino="${carpeta%/}_CON_MARCA"
  mkdir -p "$destino"
  find "$carpeta" -maxdepth 1 -type f \( -iname '*.mp4' -o -iname '*.mov' \) -print0 |
  while IFS= read -r -d '' f; do
    echo "🏷  $(basename "$f")"
    marca "$f" "$logo" "$destino/$(basename "${f%.*}").mp4"
  done
  echo "✅ Todo en $destino"
}

# Cadena completa: normaliza + recorta a 9:16 + marca de agua, en una pasada.
# Es el comando que usaras el 90% de las veces.
reel() {
  local f="${1:?falta video}" logo="${2:?falta logo.png}" salida="${3:-${1%.*}_reel.mp4}"
  comprobar ffmpeg; comprobar ffprobe
  [[ -f "$logo" ]] || die "No encuentro el logo: $logo"

  local pre_hdr=""
  if es_hdr "$f"; then
    echo "🎨 Origen HDR — se convierte a SDR"
    pre_hdr="zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,\
tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,"
  fi

  ffmpeg -hide_banner -loglevel error -i "$f" -i "$logo" -filter_complex \
"[0:v]${pre_hdr}scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920[v];\
[1:v]scale=${ANCHO_LOGO}:-1,format=rgba,colorchannelmixer=aa=0.75[wm];\
[v][wm]overlay=W-w-${MARGEN}:${MARGEN},format=yuv420p" \
    -c:v libx264 -crf 20 -preset "$PRESET" -r 30 -fps_mode cfr \
    -c:a aac -b:a 192k -movflags +faststart "$salida"
  echo "✅ $salida  (1080x1920, listo para subir)"
}

reel_lote() {
  local carpeta="${1:?falta carpeta}" logo="${2:?falta logo.png}"
  local destino="${carpeta%/}_REELS"
  mkdir -p "$destino"
  find "$carpeta" -maxdepth 1 -type f \( -iname '*.mp4' -o -iname '*.mov' \) -print0 |
  while IFS= read -r -d '' f; do
    echo "🎬 $(basename "$f")"
    reel "$f" "$logo" "$destino/$(basename "${f%.*}")_reel.mp4"
  done
  echo "✅ Todo en $destino — listos para CapCut o para subir directamente"
}

case "${1:-}" in
  normalizar)   shift; normalizar "$@" ;;
  vertical)     shift; vertical "$@" ;;
  vertical-bg)  shift; vertical_bg "$@" ;;
  lento)        shift; lento "$@" ;;
  tiempos)      shift; tiempos "$@" ;;
  comprimidos)  shift; comprimidos "$@" ;;
  marca)        shift; marca "$@" ;;
  marca-lote)   shift; marca_lote "$@" ;;
  reel)         shift; reel "$@" ;;
  reel-lote)    shift; reel_lote "$@" ;;
  *) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//' ;;
esac
