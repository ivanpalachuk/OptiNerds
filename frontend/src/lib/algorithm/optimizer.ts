import { MaxRectsBin } from './MaxRectsBin'
import type { Piece, OptimizeResult, BinResult } from './types'

export function optimize(
  pieces: Piece[],
  boardWidth: number,
  boardHeight: number,
  kerf: number,
  maxSheets = 99,
): OptimizeResult {
  // Expandir qty en instancias individuales
  const items: Piece[] = pieces.flatMap((p) =>
    Array.from({ length: p.qty }, () => ({ ...p })),
  )

  // FFD: ordenar por area descendente
  items.sort((a, b) => b.w * b.h - a.w * a.h)

  const bins: MaxRectsBin[] = []
  const unfitted: Piece[] = []

  for (const item of items) {
    const fitsNormal = item.w <= boardWidth && item.h <= boardHeight
    const fitsRotated = item.h <= boardWidth && item.w <= boardHeight

    if (!fitsNormal && !fitsRotated) {
      unfitted.push(item)
      continue
    }

    let placed = false
    for (const bin of bins) {
      if (bin.insert(item)) {
        placed = true
        break
      }
    }

    if (!placed) {
      if (bins.length >= maxSheets) {
        unfitted.push(item)
        continue
      }
      const newBin = new MaxRectsBin(boardWidth, boardHeight, kerf)
      bins.push(newBin)
      newBin.insert(item)
    }
  }

  const binResults: BinResult[] = bins.map((bin) => ({
    width: bin.width,
    height: bin.height,
    placements: bin.placements,
    efficiency: bin.efficiency,
    usedArea: bin.usedArea,
  }))

  return { bins: binResults, unfitted, sw: boardWidth, sh: boardHeight, k: kerf }
}
