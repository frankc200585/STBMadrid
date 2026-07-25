export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`
}

/**
 * Captures a frame from a video element via canvas (fallback when ImageCapture
 * is unavailable). Downscales to maxWidth/maxHeight preserving aspect ratio.
 */
export function captureFrameFromVideo(
  video: HTMLVideoElement,
  maxWidth: number,
  maxHeight: number,
): HTMLCanvasElement {
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
  return canvas
}

/** Returns a Blob from a canvas. */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'jpeg' | 'webp' | 'png',
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
      `image/${format}`,
      quality,
    )
  })
}
