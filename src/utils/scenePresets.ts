import type { ColorGrade } from './postProcess'

export interface ScenePreset {
  id: string
  label: string
  emoji: string
  description: string
  resolution: { width: number; height: number }
  constraints: ExtendedTrackConstraints
  grade: ColorGrade
  quality: number
  format: 'jpeg' | 'webp' | 'png'
}

export const SCENES: ScenePreset[] = [
  {
    id: 'auto',
    label: 'Auto',
    emoji: '🔄',
    description: 'Automático – deja que la cámara decida todo',
    resolution: { width: 1920, height: 1080 },
    constraints: { facingMode: 'environment' },
    grade: { brightness: 0, contrast: 5, saturation: 10, warmth: 0, sharpness: 20 },
    quality: 0.90,
    format: 'jpeg',
  },
  {
    id: 'day',
    label: 'Día',
    emoji: '☀️',
    description: 'Exterior con luz natural – máxima resolución y nitidez',
    resolution: { width: 3840, height: 2160 },
    constraints: {
      facingMode: 'environment',
      whiteBalanceMode: 'continuous',
      exposureMode: 'continuous',
      focusMode: 'continuous',
    },
    grade: { brightness: 0, contrast: 15, saturation: 22, warmth: 5, sharpness: 45 },
    quality: 0.95,
    format: 'jpeg',
  },
  {
    id: 'night-event',
    label: 'Noche Evento',
    emoji: '🎉',
    description: 'Eventos nocturnos con iluminación artificial (pistas de baile, terrazas)',
    resolution: { width: 1920, height: 1080 },
    constraints: {
      facingMode: 'environment',
      exposureMode: 'continuous',
      exposureCompensation: 1.5,
      whiteBalanceMode: 'manual',
      colorTemperature: 4500,
      focusMode: 'continuous',
    },
    grade: { brightness: 20, contrast: 22, saturation: 32, warmth: -20, sharpness: 25 },
    quality: 0.92,
    format: 'jpeg',
  },
  {
    id: 'night-outdoor',
    label: 'Noche Exterior',
    emoji: '🌙',
    description: 'Exterior nocturno con poca luz ambiental',
    resolution: { width: 1920, height: 1080 },
    constraints: {
      facingMode: 'environment',
      exposureMode: 'continuous',
      exposureCompensation: 2.5,
      whiteBalanceMode: 'continuous',
      focusMode: 'continuous',
    },
    grade: { brightness: 30, contrast: 20, saturation: 18, warmth: 0, sharpness: 15 },
    quality: 0.92,
    format: 'jpeg',
  },
  {
    id: 'portrait',
    label: 'Retrato',
    emoji: '👤',
    description: 'Personas y grupos – tonos de piel naturales',
    resolution: { width: 1920, height: 1080 },
    constraints: {
      facingMode: 'environment',
      exposureMode: 'continuous',
      whiteBalanceMode: 'continuous',
      focusMode: 'continuous',
    },
    grade: { brightness: 5, contrast: 10, saturation: 14, warmth: 10, sharpness: 30 },
    quality: 0.93,
    format: 'jpeg',
  },
]
