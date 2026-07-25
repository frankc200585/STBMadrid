export interface ColorGrade {
  brightness: number  // -100 to +100
  contrast: number    // -100 to +100
  saturation: number  // -100 to +100
  warmth: number      // -100 (frío/azul) to +100 (cálido/naranja)
  sharpness: number   // 0 to 100
}

/**
 * Applies colour grading to a canvas in-place via pixel manipulation.
 * Order: sharpen → brightness → contrast → warmth → saturation.
 */
export async function applyColorGrade(
  canvas: HTMLCanvasElement,
  grade: ColorGrade,
): Promise<void> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const { width, height } = canvas

  if (grade.sharpness > 0 && width * height <= 4_000_000) {
    applySharpen(ctx, width, height, grade.sharpness / 200)
  }

  const imageData = ctx.getImageData(0, 0, width, height)
  const d = imageData.data

  const bDelta = grade.brightness * 2.55
  const cVal = grade.contrast * 2.55
  const cFactor = (259 * (cVal + 255)) / (255 * (259 - cVal))
  const sFactor = 1 + grade.saturation / 100
  const wDelta = grade.warmth * 0.7

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i] + bDelta
    let g = d[i + 1] + bDelta
    let b = d[i + 2] + bDelta

    // Contrast around midpoint
    r = cFactor * (r - 128) + 128
    g = cFactor * (g - 128) + 128
    b = cFactor * (b - 128) + 128

    // Colour temperature (warmth)
    r += wDelta
    b -= wDelta

    // Saturation using perceptual luminance weights
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    r = lum + (r - lum) * sFactor
    g = lum + (g - lum) * sFactor
    b = lum + (b - lum) * sFactor

    d[i]     = clamp(r)
    d[i + 1] = clamp(g)
    d[i + 2] = clamp(b)
  }

  ctx.putImageData(imageData, 0, 0)
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0
}

/** 3×3 unsharp-mask sharpen kernel via pixel loop. Skips border row/col. */
function applySharpen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  k: number,
): void {
  const src = ctx.getImageData(0, 0, w, h)
  const dst = ctx.createImageData(w, h)
  const s = src.data
  const d = dst.data

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4
      for (let c = 0; c < 3; c++) {
        const center = s[i + c]
        const sharpened =
          center * (1 + 4 * k) -
          k * s[((y - 1) * w + x) * 4 + c] -
          k * s[((y + 1) * w + x) * 4 + c] -
          k * s[(y * w + x - 1) * 4 + c] -
          k * s[(y * w + x + 1) * 4 + c]
        d[i + c] = clamp(sharpened)
      }
      d[i + 3] = 255
    }
  }

  // Copy border pixels unchanged
  for (let x = 0; x < w; x++) {
    const t = x * 4, bt = ((h - 1) * w + x) * 4
    d[t] = s[t]; d[t+1] = s[t+1]; d[t+2] = s[t+2]; d[t+3] = s[t+3]
    d[bt] = s[bt]; d[bt+1] = s[bt+1]; d[bt+2] = s[bt+2]; d[bt+3] = s[bt+3]
  }
  for (let y = 0; y < h; y++) {
    const l = y * w * 4, r2 = (y * w + w - 1) * 4
    d[l] = s[l]; d[l+1] = s[l+1]; d[l+2] = s[l+2]; d[l+3] = s[l+3]
    d[r2] = s[r2]; d[r2+1] = s[r2+1]; d[r2+2] = s[r2+2]; d[r2+3] = s[r2+3]
  }

  ctx.putImageData(dst, 0, 0)
}

/**
 * Draws an image Blob on a canvas, applies colour grading, and returns the
 * result as an optimised Blob in the requested format/quality.
 */
export async function processImage(
  sourceBlob: Blob,
  grade: ColorGrade,
  format: 'jpeg' | 'webp' | 'png',
  quality: number,
): Promise<Blob> {
  const bitmap = await createImageBitmap(sourceBlob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  await applyColorGrade(canvas, grade)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      `image/${format}`,
      quality,
    )
  })
}
