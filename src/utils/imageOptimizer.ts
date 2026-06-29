export type ImageFormat = 'jpeg' | 'png' | 'webp'

export interface OptimizationOptions {
  quality: number        // 0.1 - 1.0
  maxWidth: number
  maxHeight: number
  format: ImageFormat
}

export interface ResolutionPreset {
  label: string
  width: number
  height: number
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: 'HD (1280×720)',    width: 1280, height: 720  },
  { label: 'Full HD (1920×1080)', width: 1920, height: 1080 },
  { label: '4K (3840×2160)',   width: 3840, height: 2160 },
]

export const CAMERA_CONSTRAINTS: Record<string, MediaTrackConstraints> = {
  'HD (1280×720)':      { width: { ideal: 1280 }, height: { ideal: 720  }, facingMode: 'environment' },
  'Full HD (1920×1080)': { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' },
  '4K (3840×2160)':    { width: { ideal: 3840 }, height: { ideal: 2160 }, facingMode: 'environment' },
}

/**
 * Captures a frame from a video element and returns an optimized Blob.
 * Downscales if the captured frame exceeds maxWidth/maxHeight while preserving aspect ratio.
 */
export async function captureOptimizedImage(
  video: HTMLVideoElement,
  options: OptimizationOptions,
): Promise<Blob> {
  const { quality, maxWidth, maxHeight, format } = options

  const srcW = video.videoWidth
  const srcH = video.videoHeight

  const scale = Math.min(maxWidth / srcW, maxHeight / srcH, 1)
  const dstW = Math.round(srcW * scale)
  const dstH = Math.round(srcH * scale)

  const canvas = document.createElement('canvas')
  canvas.width = dstW
  canvas.height = dstH

  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(video, 0, 0, dstW, dstH)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('No se pudo generar la imagen'))
      },
      `image/${format}`,
      quality,
    )
  })
}

/** Returns human-readable file size. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`
}
