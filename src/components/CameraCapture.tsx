import { useRef, useState, useEffect, useCallback } from 'react'
import { SCENES, type ScenePreset } from '../utils/scenePresets'
import { processImage, type ColorGrade } from '../utils/postProcess'
import { captureFrameFromVideo, canvasToBlob, formatBytes } from '../utils/imageOptimizer'

interface CapturedImage {
  url: string
  blob: Blob
  width: number
  height: number
}

interface CameraInfo {
  actualW: number
  actualH: number
  hasImageCapture: boolean
  torch: boolean
  exposureCompSupported: boolean
  wbSupported: boolean
}

const defaultGrade = (scene: ScenePreset): ColorGrade => ({ ...scene.grade })

export default function CameraCapture() {
  const videoRef    = useRef<HTMLVideoElement>(null)
  const streamRef   = useRef<MediaStream | null>(null)
  const icRef       = useRef<ImageCapture | null>(null)

  const [scene, setScene]           = useState<ScenePreset>(SCENES[0])
  const [grade, setGrade]           = useState<ColorGrade>(defaultGrade(SCENES[0]))
  const [torchOn, setTorchOn]       = useState(false)
  const [processing, setProcessing] = useState(false)
  const [capturing, setCapturing]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null)
  const [captured, setCaptured]     = useState<CapturedImage | null>(null)
  const [showInfo, setShowInfo]     = useState(false)

  // ─── Start / restart camera ───────────────────────────────────────────────
  const startCamera = useCallback(async (s: ScenePreset, torch: boolean) => {
    setError(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          ...s.constraints,
          width:  { ideal: s.resolution.width  },
          height: { ideal: s.resolution.height },
        },
        audio: false,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const track = stream.getVideoTracks()[0]

      // Try applying advanced constraints
      try {
        const advanced: ExtendedTrackConstraints = { ...s.constraints }
        if (torch) advanced.torch = true
        await (track as MediaStreamTrack & { applyConstraints(c: ExtendedTrackConstraints): Promise<void> })
          .applyConstraints(advanced)
      } catch { /* ignored – device may not support advanced constraints */ }

      // Detect capabilities
      const caps = track.getCapabilities() as ExtendedMediaTrackCapabilities
      const settings = track.getSettings() as ExtendedMediaTrackSettings
      const hasIC = typeof ImageCapture !== 'undefined'

      if (hasIC) {
        icRef.current = new ImageCapture(track)
      } else {
        icRef.current = null
      }

      setCameraInfo({
        actualW: settings.width  ?? 0,
        actualH: settings.height ?? 0,
        hasImageCapture: hasIC,
        torch: !!caps.torch,
        exposureCompSupported: !!caps.exposureCompensation,
        wbSupported: !!(caps.whiteBalanceMode?.length),
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (e) {
      setError('No se pudo acceder a la cámara. Comprueba los permisos del navegador.')
      console.error(e)
    }
  }, [])

  // Start on mount
  useEffect(() => {
    startCamera(scene, torchOn)
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Scene change ─────────────────────────────────────────────────────────
  const handleScene = (s: ScenePreset) => {
    setScene(s)
    setGrade(defaultGrade(s))
    setCaptured(null)
    startCamera(s, torchOn)
  }

  // ─── Torch toggle ─────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    const newVal = !torchOn
    setTorchOn(newVal)
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await (track as MediaStreamTrack & { applyConstraints(c: ExtendedTrackConstraints): Promise<void> })
        .applyConstraints({ torch: newVal })
    } catch { /* not supported */ }
  }

  // ─── Capture ──────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (capturing || processing) return
    setCapturing(true)
    setCaptured(null)

    try {
      let rawBlob: Blob

      // Prefer ImageCapture for native full-resolution capture
      if (icRef.current) {
        try {
          rawBlob = await icRef.current.takePhoto()
        } catch {
          rawBlob = await fallbackCapture()
        }
      } else {
        rawBlob = await fallbackCapture()
      }

      setCapturing(false)
      setProcessing(true)

      const finalBlob = await processImage(rawBlob, grade, scene.format, scene.quality)

      // Read actual dimensions from the raw blob
      const bm = await createImageBitmap(rawBlob)
      const w = bm.width; const h = bm.height
      bm.close()

      setCaptured({ url: URL.createObjectURL(finalBlob), blob: finalBlob, width: w, height: h })
    } catch (e) {
      setError('Error al capturar la imagen. Inténtalo de nuevo.')
      console.error(e)
    } finally {
      setCapturing(false)
      setProcessing(false)
    }
  }

  const fallbackCapture = async (): Promise<Blob> => {
    if (!videoRef.current) throw new Error('No video')
    const canvas = captureFrameFromVideo(
      videoRef.current,
      scene.resolution.width,
      scene.resolution.height,
    )
    return canvasToBlob(canvas, scene.format, scene.quality)
  }

  const handleDownload = () => {
    if (!captured) return
    const a = document.createElement('a')
    a.href = captured.url
    a.download = `stbmadrid-${scene.id}-${Date.now()}.${scene.format}`
    a.click()
  }

  const updateGrade = (key: keyof ColorGrade, value: number) =>
    setGrade((g) => ({ ...g, [key]: value }))

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="app-header">
        <h1>STB Madrid</h1>
        <span className="subtitle">Cámara Profesional</span>
      </header>

      {/* Scene selector */}
      <div className="scene-bar">
        {SCENES.map((s) => (
          <button
            key={s.id}
            className={`scene-btn ${scene.id === s.id ? 'active' : ''}`}
            onClick={() => handleScene(s)}
            title={s.description}
          >
            <span className="scene-emoji">{s.emoji}</span>
            <span className="scene-label">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Scene description */}
      <p className="scene-desc">{scene.description}</p>

      {/* Camera preview */}
      <div className="viewfinder">
        {error && <div className="overlay-msg error">{error}</div>}
        {(capturing || processing) && (
          <div className="overlay-msg processing">
            {capturing ? '📸 Capturando…' : '✨ Procesando…'}
          </div>
        )}
        <video ref={videoRef} muted playsInline className="video" />

        {cameraInfo && (
          <div className="badge-row">
            <span className="badge">{cameraInfo.actualW}×{cameraInfo.actualH}</span>
            {cameraInfo.hasImageCapture && <span className="badge green">RAW ✓</span>}
            {torchOn && <span className="badge yellow">🔦 ON</span>}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="action-bar">
        {cameraInfo?.torch && (
          <button className={`btn-icon ${torchOn ? 'active' : ''}`} onClick={toggleTorch} title="Flash / Linterna">
            🔦
          </button>
        )}

        <button
          className="btn-shutter"
          onClick={handleCapture}
          disabled={!!error || capturing || processing}
        >
          {capturing ? '…' : processing ? '✨' : '📸'}
        </button>

        <button className={`btn-icon ${showInfo ? 'active' : ''}`} onClick={() => setShowInfo(!showInfo)} title="Info cámara">
          ℹ️
        </button>
      </div>

      {/* Camera info panel */}
      {showInfo && cameraInfo && (
        <div className="info-panel">
          <h3>Capacidades de la cámara</h3>
          <table>
            <tbody>
              <tr><td>Resolución obtenida</td><td>{cameraInfo.actualW}×{cameraInfo.actualH}</td></tr>
              <tr><td>ImageCapture API</td><td className={cameraInfo.hasImageCapture ? 'ok' : 'no'}>{cameraInfo.hasImageCapture ? '✓ Soportado (máxima calidad)' : '✗ No disponible (modo canvas)'}</td></tr>
              <tr><td>Flash / Linterna</td><td className={cameraInfo.torch ? 'ok' : 'no'}>{cameraInfo.torch ? '✓' : '✗'}</td></tr>
              <tr><td>Compensación de exposición</td><td className={cameraInfo.exposureCompSupported ? 'ok' : 'no'}>{cameraInfo.exposureCompSupported ? '✓' : '✗'}</td></tr>
              <tr><td>Balance de blancos manual</td><td className={cameraInfo.wbSupported ? 'ok' : 'no'}>{cameraInfo.wbSupported ? '✓' : '✗'}</td></tr>
            </tbody>
          </table>
          <p className="info-note">* El post-procesado por color siempre está disponible independientemente del hardware.</p>
        </div>
      )}

      {/* Fine-tune controls */}
      <div className="controls-panel">
        <h3>Ajuste fino de color</h3>
        <div className="sliders">
          {(
            [
              { key: 'brightness' as const, label: 'Brillo',     emoji: '☀️', min: -100, max: 100 },
              { key: 'contrast'   as const, label: 'Contraste',  emoji: '◑',  min: -100, max: 100 },
              { key: 'saturation' as const, label: 'Saturación', emoji: '🎨', min: -100, max: 100 },
              { key: 'warmth'     as const, label: 'Temperatura',emoji: '🌡️', min: -100, max: 100 },
              { key: 'sharpness'  as const, label: 'Nitidez',    emoji: '🔍', min:    0, max: 100 },
            ] as { key: keyof ColorGrade; label: string; emoji: string; min: number; max: number }[]
          ).map(({ key, label, emoji, min, max }) => (
            <div className="slider-row" key={key}>
              <span className="slider-label">{emoji} {label}</span>
              <input
                type="range"
                min={min}
                max={max}
                value={grade[key]}
                onChange={(e) => updateGrade(key, Number(e.target.value))}
              />
              <span className="slider-val">{grade[key] > 0 ? '+' : ''}{grade[key]}</span>
            </div>
          ))}
        </div>
        <button className="btn-reset" onClick={() => setGrade(defaultGrade(scene))}>
          Resetear a valores del modo
        </button>
      </div>

      {/* Captured image result */}
      {captured && (
        <div className="result-panel">
          <h3>Imagen capturada</h3>
          <img src={captured.url} alt="Captura" className="captured-img" />
          <div className="result-meta">
            <span>📐 {captured.width}×{captured.height}</span>
            <span>💾 {formatBytes(captured.blob.size)}</span>
            <span>🎞 {scene.format.toUpperCase()}</span>
            <span>✨ Calidad {Math.round(scene.quality * 100)}%</span>
          </div>
          <button className="btn-download" onClick={handleDownload}>
            Descargar ({scene.format.toUpperCase()})
          </button>
        </div>
      )}
    </div>
  )
}
