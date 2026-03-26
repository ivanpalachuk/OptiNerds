import type { FreeRect, Placement, Piece } from './types'

export class MaxRectsBin {
  readonly width: number
  readonly height: number
  readonly kerf: number
  private freeRects: FreeRect[]
  readonly placements: Placement[]

  constructor(width: number, height: number, kerf: number) {
    this.width = width
    this.height = height
    this.kerf = kerf
    this.freeRects = [{ x: 0, y: 0, w: width, h: height }]
    this.placements = []
  }

  // BSSF — Best Short Side Fit con soporte de rotacion
  insert(piece: Piece): boolean {
    let bestScore = Infinity
    let bestFree: FreeRect | null = null
    let bestRotated = false

    for (const fr of this.freeRects) {
      // Orientacion normal
      if (piece.w <= fr.w && piece.h <= fr.h) {
        const score = Math.min(fr.w - piece.w, fr.h - piece.h)
        if (score < bestScore) {
          bestScore = score
          bestFree = fr
          bestRotated = false
        }
      }
      // Orientacion rotada (solo si es distinta)
      if (piece.w !== piece.h && piece.h <= fr.w && piece.w <= fr.h) {
        const score = Math.min(fr.w - piece.h, fr.h - piece.w)
        if (score < bestScore) {
          bestScore = score
          bestFree = fr
          bestRotated = true
        }
      }
    }

    if (!bestFree) return false

    const pw = bestRotated ? piece.h : piece.w
    const ph = bestRotated ? piece.w : piece.h

    const placed: Placement = {
      x: bestFree.x,
      y: bestFree.y,
      w: pw,
      h: ph,
      rotated: bestRotated,
      piece,
    }

    this._split(bestFree, placed)
    this._prune()
    this.placements.push(placed)
    return true
  }

  private _split(free: FreeRect, used: Placement): void {
    const k = this.kerf
    this.freeRects = this.freeRects.filter((r) => r !== free)

    const newRects: FreeRect[] = []

    // Espacio arriba del bloque usado (dentro del free)
    if (used.y > free.y) {
      newRects.push({ x: free.x, y: free.y, w: free.w, h: used.y - free.y })
    }
    // Espacio abajo (con kerf)
    const belowY = used.y + used.h + k
    if (belowY < free.y + free.h) {
      newRects.push({ x: free.x, y: belowY, w: free.w, h: (free.y + free.h) - belowY })
    }
    // Espacio a la izquierda
    if (used.x > free.x) {
      newRects.push({ x: free.x, y: free.y, w: used.x - free.x, h: free.h })
    }
    // Espacio a la derecha (con kerf)
    const rightX = used.x + used.w + k
    if (rightX < free.x + free.w) {
      newRects.push({ x: rightX, y: free.y, w: (free.x + free.w) - rightX, h: free.h })
    }

    this.freeRects.push(...newRects)
  }

  private _prune(): void {
    this.freeRects = this.freeRects.filter(
      (a, i) =>
        !this.freeRects.some(
          (b, j) =>
            i !== j &&
            b.x <= a.x &&
            b.y <= a.y &&
            b.x + b.w >= a.x + a.w &&
            b.y + b.h >= a.y + a.h,
        ),
    )
  }

  get usedArea(): number {
    return this.placements.reduce((s, p) => s + p.w * p.h, 0)
  }

  get efficiency(): string {
    return ((this.usedArea / (this.width * this.height)) * 100).toFixed(1)
  }
}
