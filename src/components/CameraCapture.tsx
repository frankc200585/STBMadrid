import { useRef, useState, useEffect, useCallback } from 'react'
import { SCENES, gradeToFilterStyle, type ScenePreset } from '../utils/scenePresets'
import { processImage, type ColorGrade } from '../utils/postProcess'
import { captureFrameFromVideo, canvasToBlob, formatBytes } from '../utils/imageOptimizer'
import { PhotoViewer, type GalleryItem } from './PhotoViewer'

interface CameraInfo {
  actualW: number
  actualH: number
  hasImageCapture: boolean
  torch: boolean
  exposureCompSupported: boolean
  wbSupported: boolean
  zoomSupported: boolean
  zoomMin: number
  zoomMax: number
}

const defaultGrade = (s: ScenePreset): ColorGrade => ({ ...s.grade })

const MAX_GALLERY = 20

export default function CameraCapture() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const icRef     = useRef<ImageCapture | null>(null)

  const [scene, setScene]           = useState<ScenePreset>(SCENES[0])
  const [grade, setGrade]           = useState<ColorGrade>(defaultGrade(SCENES[0]))
  const [torchOn, setTorchOn]       = useState(false)
  const [showGrid, setShowGrid]     = useState(false)
  const [zoom, setZoom]             = useState(1)
  const [capturing, setCapturing]   = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null)
  const [gallery, setGallery]       = useState<GalleryItem[]>([])
  const [viewing, setViewing]       = useState<GalleryItem | null>(null)
  const [showInfo, setShowInfo]     = useState(false)

  // ── Start camera ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async (s: ScenePreset, torch: boolean) => {
    setError(null)
    streamRef.current?.getTracks().forEach((t) => t.stop())

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...s.constraints,
          width:  { ideal: s.resolution.width  },
          height: { ideal: s.resolution.height },
        },
        audio: false,
      })
      streamRef.current = stream

      const track = stream.getVideoTracks()[0]

      // Apply advanced constraints (silently ignore unsupported ones)
      try {
        const adv: ExtendedTrackConstraints = { ...s.constraints }
        if (torch) adv.torch = true
        await (track as MediaStreamTrack & {
          applyConstraints(c: ExtendedTrackConstraints): Promise<void>
        }).applyConstraints(adv)
      } catch { /* device does not support advanced constraints */ }

      const caps     = track.getCapabilities()  as ExtendedMediaTrackCapabilities
      const settings = track.getSettings()      as ExtendedMediaTrackSettings
      const hasIC    = typeof ImageCapture !== 'undefined'

      icRef.current = hasIC ? new ImageCapture(track) : null

      const zoomCaps = caps.zoom
      setCameraInfo({
        actualW:              settings.width  ?? 0,
        actualH:              settings.height ?? 0,
        hasImageCapture:      hasIC,
        torch:                !!caps.torch,
        exposureCompSupported: !!caps.exposureCompensation,
        wbSupported:          !!caps.whiteBalanceMode?.length,
        zoomSupported:        !!zoomCaps,
        zoomMin:              zoomCaps?.min ?? 1,
        zoomMax:              zoomCaps?.max ?? 1,
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (e) {
      setError('No se pudo acceder a la cámara. Comprueba los permisos.')
      console.error(e)
    }
  }, [])

  useEffect(() => {
    startCamera(scene, torchOn)
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scene change ──────────────────────────────────────────────────────────
  const handleScene = (s: ScenePreset) => {
    setScene(s)
    setGrade(defaultGrade(s))
    setZoom(1)
    startCamera(s, torchOn)
  }

  // ── Torch ─────────────────────────────────────────────────────────────────
  const toggleTorch = async () => {
    const next = !torchOn
    setTorchOn(next)
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await (track as MediaStreamTrack & {
        applyConstraints(c: ExtendedTrackConstraints): Promise<void>
      }).applyConstraints({ torch: next })
    } catch { /* not supported */ }
  }

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const handleZoom = async (value: number) => {
    setZoom(value)
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await (track as MediaStreamTrack & {
        applyConstraints(c: ExtendedTrackConstraints): Promise<void>
      }).applyConstraints({ zoom: value })
    } catch { /* not supported */ }
  }

  // ── Capture ───────────────────────────────────────────────────────────────
  const handleCapture = async () => {
    if (capturing || processing) return
    setCapturing(true)

    try {
      let rawBlob: Blob

      if (icRef.current) {
        try {
          rawBlob = await icRef.current.takePhoto()
        } catch {
          rawBlob = await canvasFallback()
        }
      } else {
        rawBlob = await canvasFallback()
      }

      const rawUrl = URL.createObjectURL(rawBlob)
      setCapturing(false)
      setProcessing(true)

      const processedBlob = await processImage(rawBlob, grade, scene.format, scene.quality)
      const processedUrl  = URL.createObjectURL(processedBlob)

      const bm = await createImageBitmap(rawBlob)
      const { width, height } = bm
      bm.close()

      const item: GalleryItem = {
        rawUrl,
        processedUrl,
        blob:      processedBlob,
        width,
        height,
        sceneName: scene.label,
        timestamp: Date.now(),
        format:    scene.format,
      }

      setGallery((prev) => {
        const next = [item, ...prev].slice(0, MAX_GALLERY)
        // Revoke URLs of items that were evicted
        prev.slice(MAX_GALLERY - 1).forEach((old) => {
          URL.revokeObjectURL(old.rawUrl)
          URL.revokeObjectURL(old.processedUrl)
        })
        return next
      })
      setViewing(item)
    } catch (e) {
      setError('Error al capturar. Inténtalo de nuevo.')
      console.error(e)
    } finally {
      setCapturing(false)
      setProcessing(false)
    }
  }

  const canvasFallback = async (): Promise<Blob> => {
    if (!videoRef.current) throw new Error('No video element')
    const canvas = captureFrameFromVideo(
      videoRef.current,
      scene.resolution.width,
      scene.resolution.height,
    )
    return canvasToBlob(canvas, scene.format, scene.quality)
  }

  const updateGrade = (key: keyof ColorGrade, value: number) =>
    setGrade((g) => ({ ...g, [key]: value }))

  const liveFilter = gradeToFilterStyle(grade)

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {viewing && (
        <PhotoViewer item={viewing} onClose={() => setViewing(null)} />
      )}

      <div className="app">
        {/* Header */}
        <header className="app-header">
          <h1>STB Madrid</h1>
          <span className="subtitle">Cámara Profesional</span>
        </header>

        {/* Scene bar */}
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

        <p className="scene-desc">{scene.description}</p>

        {/* Viewfinder */}
        <div className="viewfinder">
          {error && <div className="overlay-msg error">{error}</div>}
          {(capturing || processing) && (
            <div className="overlay-msg processing">
              {capturing ? '📸 Capturando…' : '✨ Procesando…'}
            </div>
          )}

          {/* Live CSS-filter preview — GPU accelerated */}
          <video
            ref={videoRef}
            muted
            playsInline
            className="video"
            style={{ filter: liveFilter }}
          />

          {/* Rule-of-thirds grid */}
          {showGrid && (
            <svg className="grid-overlay" viewBox="0 0 3 3" preserveAspectRatio="none">
              <line x1="1" y1="0" x2="1" y2="3" className="grid-line" />
              <line x1="2" y1="0" x2="2" y2="3" className="grid-line" />
              <line x1="0" y1="1" x2="3" y2="1" className="grid-line" />
              <line x1="0" y1="2" x2="3" y2="2" className="grid-line" />
              <circle cx="1" cy="1" r="0.06" className="grid-point" />
              <circle cx="2" cy="1" r="0.06" className="grid-point" />
              <circle cx="1" cy="2" r="0.06" className="grid-point" />
              <circle cx="2" cy="2" r="0.06" className="grid-point" />
            </svg>
          )}

          {/* HUD badges */}
          {cameraInfo && (
            <div className="badge-row">
              <span className="badge">{cameraInfo.actualW}×{cameraInfo.actualH}</span>
              {cameraInfo.hasImageCapture && <span className="badge green">RAW ✓</span>}
              {torchOn && <span className="badge yellow">🔦</span>}
              {zoom > 1 && <span className="badge yellow">{zoom.toFixed(1)}×</span>}
            </div>
          )}
        </div>

        {/* Zoom slider */}
        {cameraInfo?.zoomSupported && (
          <div className="zoom-bar">
            <span className="zoom-ico">🔭</span>
            <input
              type="range"
              min={cameraInfo.zoomMin}
              max={cameraInfo.zoomMax}
              step={0.1}
              value={zoom}
              onChange={(e) => handleZoom(Number(e.target.value))}
            />
            <span className="zoom-val">{zoom.toFixed(1)}×</span>
          </div>
        )}

        {/* Action bar */}
        <div className="action-bar">
          {cameraInfo?.torch && (
            <button
              className={`btn-icon ${torchOn ? 'active' : ''}`}
              onClick={toggleTorch}
              title="Flash / Linterna"
            >
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

          <button
            className={`btn-icon ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid((v) => !v)}
            title="Cuadrícula de composición"
          >
            ⊞
          </button>

          <button
            className={`btn-icon ${showInfo ? 'active' : ''}`}
            onClick={() => setShowInfo((v) => !v)}
            title="Info cámara"
          >
            ℹ️
          </button>
        </div>

        {/* Gallery strip */}
        {gallery.length > 0 && (
          <div className="gallery-strip">
            <p className="gallery-label">Galería de sesión — toca para ver</p>
            <div className="gallery-row">
              {gallery.map((item) => (
                <button
                  key={item.timestamp}
                  className={`gallery-thumb ${viewing?.timestamp === item.timestamp ? 'selected' : ''}`}
                  onClick={() => setViewing(item)}
                >
                  <img src={item.processedUrl} alt={item.sceneName} />
                  <span className="thumb-meta">{item.sceneName}</span>
                  <span className="thumb-size">{formatBytes(item.blob.size)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Camera capabilities info */}
        {showInfo && cameraInfo && (
          <div className="info-panel">
            <h3>Capacidades detectadas</h3>
            <table>
              <tbody>
                <tr>
                  <td>Resolución real</td>
                  <td>{cameraInfo.actualW}×{cameraInfo.actualH}</td>
                </tr>
                <tr>
                  <td>ImageCapture API</td>
                  <td className={cameraInfo.hasImageCapture ? 'ok' : 'no'}>
                    {cameraInfo.hasImageCapture ? '✓ Sensor nativo completo' : '✗ Modo canvas (fallback)'}
                  </td>
                </tr>
                <tr>
                  <td>Flash / Linterna</td>
                  <td className={cameraInfo.torch ? 'ok' : 'no'}>{cameraInfo.torch ? '✓' : '✗'}</td>
                </tr>
                <tr>
                  <td>Compensación exposición</td>
                  <td className={cameraInfo.exposureCompSupported ? 'ok' : 'no'}>
                    {cameraInfo.exposureCompSupported ? '✓' : '✗'}
                  </td>
                </tr>
                <tr>
                  <td>Balance blancos manual</td>
                  <td className={cameraInfo.wbSupported ? 'ok' : 'no'}>{cameraInfo.wbSupported ? '✓' : '✗'}</td>
                </tr>
                <tr>
                  <td>Zoom óptico/digital</td>
                  <td className={cameraInfo.zoomSupported ? 'ok' : 'no'}>
                    {cameraInfo.zoomSupported
                      ? `✓ ${cameraInfo.zoomMin}× – ${cameraInfo.zoomMax}×`
                      : '✗'}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="info-note">
              El post-procesado de color está siempre disponible, independientemente del hardware.
              La preview en vivo usa filtros CSS acelerados por GPU.
            </p>
          </div>
        )}

        {/* Fine-tune controls */}
        <div className="controls-panel">
          <h3>Ajuste fino de color</h3>
          <div className="sliders">
            {(
              [
                { key: 'brightness' as const, label: 'Brillo',      emoji: '☀️', min: -100, max: 100 },
                { key: 'contrast'   as const, label: 'Contraste',   emoji: '◑',  min: -100, max: 100 },
                { key: 'saturation' as const, label: 'Saturación',  emoji: '🎨', min: -100, max: 100 },
                { key: 'warmth'     as const, label: 'Temperatura', emoji: '🌡️', min: -100, max: 100 },
                { key: 'sharpness'  as const, label: 'Nitidez',     emoji: '🔍', min:    0, max: 100 },
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
      </div>
    </>
  )
}
