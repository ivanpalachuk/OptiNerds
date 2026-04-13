export interface Piece {
  id: number
  name: string
  w: number
  h: number
  qty: number
  cantosW: number
  cantosH: number
  color: string
}

export interface FreeRect {
  x: number
  y: number
  w: number
  h: number
}

export interface Placement {
  x: number
  y: number
  w: number        // ancho colocado (post-rotacion, sin kerf)
  h: number        // alto colocado (post-rotacion, sin kerf)
  rotated: boolean
  piece: Piece
}

export interface BinResult {
  width: number
  height: number
  placements: Placement[]
  usedArea: number
  efficiency: string
}

export interface OptimizeResult {
  bins: BinResult[]
  unfitted: Piece[]
  sw: number
  sh: number
  k: number
}

export interface BoardConfig {
  boardWidth: number
  boardHeight: number
  boardThick: number
  boardQty: number
  kerf: number
}
