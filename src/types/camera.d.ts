// Extended MediaTrack constraints not yet in standard TypeScript DOM lib
interface ExtendedTrackConstraints extends MediaTrackConstraintSet {
  whiteBalanceMode?: ConstrainDOMString
  exposureMode?: ConstrainDOMString
  focusMode?: ConstrainDOMString
  exposureCompensation?: ConstrainDouble
  exposureTime?: ConstrainDouble
  colorTemperature?: ConstrainDouble
  iso?: ConstrainDouble
  brightness?: ConstrainDouble
  contrast?: ConstrainDouble
  saturation?: ConstrainDouble
  sharpness?: ConstrainDouble
  torch?: boolean
  zoom?: ConstrainDouble
}

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  whiteBalanceMode?: string[]
  exposureMode?: string[]
  focusMode?: string[]
  exposureCompensation?: { min: number; max: number; step: number }
  exposureTime?: { min: number; max: number; step: number }
  colorTemperature?: { min: number; max: number; step: number }
  iso?: { min: number; max: number; step: number }
  brightness?: { min: number; max: number; step: number }
  contrast?: { min: number; max: number; step: number }
  saturation?: { min: number; max: number; step: number }
  sharpness?: { min: number; max: number; step: number }
  torch?: boolean
  zoom?: { min: number; max: number; step: number }
}

interface ExtendedMediaTrackSettings extends MediaTrackSettings {
  whiteBalanceMode?: string
  exposureMode?: string
  focusMode?: string
  exposureCompensation?: number
  colorTemperature?: number
  iso?: number
  torch?: boolean
}
