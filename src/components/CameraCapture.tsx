import { useRef, useState, useEffect, useCallback } from 'react'
import {
  RESOLUTION_PRESETS,
  CAMERA_CONSTRAINTS,
  captureOptimizedImage,
  formatBytes,
  type ImageFormat,
  type OptimizationOptions,
  type ResolutionPreset,
} from '../utils/imageOptimizer'

interface CapturedImage {
  url: string
  blob: Blob
  width: number
  height: number
}

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [selectedPreset, setSelectedPreset] = useState<ResolutionPreset>(RESOLUTION_PRESETS[1])
  const [quality, setQuality] = useState(0.85)
  const [format, setFormat] = useState<ImageFormat>('jpeg')
  const [capturedImage, setCapturedImage] = useState<CapturedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [actualResolution, setActualResolution] = useState<{ w: number; h: number } | null>(null)

  const startCamera = useCallback(async (preset: ResolutionPreset) => {
    setError(null)
    setIsLoading(true)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: CAMERA_CONSTRAINTS[preset.label],
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        const track = stream.getVideoTracks()[0]
        const settings = track.getSettings()
        setActualResolution({ w: settings.width ?? 0, h: settings.height ?? 0 })
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Revisa los permisos del navegador.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    startCamera(selectedPreset)
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handlePresetChange = (preset: ResolutionPreset) => {
    setSelectedPreset(preset)
    setCapturedImage(null)
    startCamera(preset)
  }

  const handleCapture = async () => {
    if (!videoRef.current) return

    const options: OptimizationOptions = {
      quality,
      maxWidth: selectedPreset.width,
      maxHeight: selectedPreset.height,
      format,
    }

    try {
      const blob = await captureOptimizedImage(videoRef.current, options)
      const url = URL.createObjectURL(blob)
      setCapturedImage({
        url,
        blob,
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      })
    } catch (err) {
      setError('Error al capturar la imagen.')
      console.error(err)
    }
  }

  const handleDownload = () => {
    if (!capturedImage) return
    const a = document.createElement('a')
    a.href = capturedImage.url
    a.download = `stbmadrid-${Date.now()}.${format}`
    a.click()
  }

  return (
    <div className="camera-container">
      <h1>STB Madrid – Cámara</h1>

      {/* Controls */}
      <div className="controls">
        <fieldset>
          <legend>Resolución</legend>
          {RESOLUTION_PRESETS.map((preset) => (
            <label key={preset.label} className="radio-label">
              <input
                type="radio"
                name="resolution"
                checked={selectedPreset.label === preset.label}
                onChange={() => handlePresetChange(preset)}
              />
              {preset.label}
            </label>
          ))}
        </fieldset>

        <div className="quality-section">
          <label htmlFor="quality">
            Calidad: <strong>{Math.round(quality * 100)}%</strong>
          </label>
          <input
            id="quality"
            type="range"
            min="10"
            max="100"
            value={Math.round(quality * 100)}
            onChange={(e) => setQuality(Number(e.target.value) / 100)}
          />
        </div>

        <fieldset>
          <legend>Formato</legend>
          {(['jpeg', 'png', 'webp'] as ImageFormat[]).map((fmt) => (
            <label key={fmt} className="radio-label">
              <input
                type="radio"
                name="format"
                checked={format === fmt}
                onChange={() => setFormat(fmt)}
              />
              {fmt.toUpperCase()}
            </label>
          ))}
        </fieldset>
      </div>

      {/* Camera preview */}
      <div className="preview-wrapper">
        {isLoading && <p className="status-msg">Iniciando cámara…</p>}
        {error && <p className="error-msg">{error}</p>}
        <video ref={videoRef} muted playsInline className="video-preview" />
        {actualResolution && (
          <p className="resolution-badge">
            Cámara: {actualResolution.w}×{actualResolution.h}
          </p>
        )}
      </div>

      <button onClick={handleCapture} disabled={!!error || isLoading} className="btn-capture">
        Capturar imagen
      </button>

      {/* Result */}
      {capturedImage && (
        <div className="result">
          <h2>Imagen capturada</h2>
          <img src={capturedImage.url} alt="Captura" className="captured-img" />
          <p className="meta">
            Resolución exportada: {capturedImage.width}×{capturedImage.height} |
            Tamaño: {formatBytes(capturedImage.blob.size)} |
            Calidad: {Math.round(quality * 100)}% | Formato: {format.toUpperCase()}
          </p>
          <button onClick={handleDownload} className="btn-download">
            Descargar ({format.toUpperCase()})
          </button>
        </div>
      )}
    </div>
  )
}
