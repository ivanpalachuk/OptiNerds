import { useEffect, useRef } from 'react'
import type { BinResult } from '../../lib/algorithm/types'
import { drawBin } from '../../lib/utils/canvas'

interface BinCanvasProps {
  bin: BinResult & { efficiency: string }
  index: number
  sw: number
  sh: number
  k: number
}

export function BinCanvas({ bin, index, sw, sh, k }: BinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) drawBin(canvasRef.current, bin, sw, sh, k)
  }, [bin, sw, sh, k])

  const eff = parseFloat(bin.efficiency)
  const badgeColor = eff >= 70 ? 'bg-green-100 text-green-800' : eff >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

  // Piezas únicas para leyenda
  const unique = [...new Map(bin.placements.map((p) => [p.piece.color, p.piece])).values()]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
        Placa {index + 1}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {bin.efficiency}% eficiencia
        </span>
        <span className="text-xs font-normal text-slate-400">— {bin.placements.length} piezas</span>
      </div>
      <canvas ref={canvasRef} className="rounded border border-slate-200 max-w-full" />
      {unique.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unique.map((p) => (
            <div key={p.color} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-3.5 h-3.5 rounded-sm border border-black/10 flex-shrink-0" style={{ background: p.color }}/>
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
