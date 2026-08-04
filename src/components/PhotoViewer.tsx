import { formatBytes } from '../utils/imageOptimizer'

export interface GalleryItem {
  rawUrl: string
  processedUrl: string
  blob: Blob
  width: number
  height: number
  sceneName: string
  timestamp: number
  format: string
}

interface Props {
  item: GalleryItem
  onClose: () => void
}

export function PhotoViewer({ item, onClose }: Props) {
  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = item.processedUrl
    a.download = `stbmadrid-${item.sceneName.toLowerCase().replace(/\s/g, '-')}-${item.timestamp}.${item.format}`
    a.click()
  }

  return (
    <div className="viewer-overlay" onClick={onClose}>
      <div className="viewer-content" onClick={(e) => e.stopPropagation()}>
        <div className="viewer-header">
          <div className="viewer-meta">
            <span className="viewer-scene">{item.sceneName}</span>
            <span className="viewer-dim">{item.width}×{item.height}</span>
            <span className="viewer-size">{formatBytes(item.blob.size)}</span>
          </div>
          <button className="viewer-close" onClick={onClose}>✕</button>
        </div>

        <BeforeAfter rawUrl={item.rawUrl} processedUrl={item.processedUrl} />

        <button className="btn-download viewer-dl" onClick={handleDownload}>
          Descargar ({item.format.toUpperCase()})
        </button>
      </div>
    </div>
  )
}

// ── Before / After slider ─────────────────────────────────────────────────
function BeforeAfter({ rawUrl, processedUrl }: { rawUrl: string; processedUrl: string }) {
  return (
    <div className="ba-wrap">
      {/* After layer (bottom) */}
      <img src={processedUrl} className="ba-img" alt="Procesado" draggable={false} />

      {/* Before layer clipped from left */}
      <div className="ba-before" id="ba-before-clip">
        <img src={rawUrl} className="ba-img" alt="Original" draggable={false} />
      </div>

      {/* Draggable divider using a range input */}
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={50}
        className="ba-range"
        onInput={(e) => {
          const pct = (e.target as HTMLInputElement).value
          const before = (e.target as HTMLInputElement)
            .closest('.ba-wrap')!
            .querySelector('.ba-before') as HTMLElement
          before.style.clipPath = `inset(0 ${100 - Number(pct)}% 0 0)`
          const handle = (e.target as HTMLInputElement)
            .closest('.ba-wrap')!
            .querySelector('.ba-handle') as HTMLElement
          handle.style.left = `${pct}%`
        }}
      />

      {/* Visual divider handle */}
      <div className="ba-handle" style={{ left: '50%' }}>
        <span>◀ ▶</span>
      </div>

      <span className="ba-label ba-label-l">Original</span>
      <span className="ba-label ba-label-r">Procesado</span>
    </div>
  )
}
