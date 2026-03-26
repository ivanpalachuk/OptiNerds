import { useOptimizerStore } from '../../store/optimizerStore'
import { BinCanvas } from './BinCanvas'
import { Button } from '../ui/Button'
import { exportCanvasAsPng } from '../../lib/utils/canvas'
import { useRef } from 'react'

export function ResultsPanel() {
  const { lastResult, pieces } = useOptimizerStore()
  const areaRef = useRef<HTMLDivElement>(null)

  if (!lastResult) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 flex-1 flex items-center justify-center min-h-80 shadow-sm">
        <div className="text-center text-slate-400 flex flex-col items-center gap-3">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="4" y="4" width="56" height="56" rx="4" stroke="#CBD5E1" strokeWidth="2" fill="#F1F5F9"/>
            <rect x="12" y="12" width="18" height="14" rx="2" fill="#BFDBFE"/>
            <rect x="34" y="12" width="18" height="22" rx="2" fill="#BBF7D0"/>
            <rect x="12" y="30" width="18" height="22" rx="2" fill="#FED7AA"/>
            <rect x="34" y="38" width="18" height="14" rx="2" fill="#FECACA"/>
          </svg>
          <p className="text-sm">Ingresá las piezas y hacé click en<br/><strong className="text-slate-600">Optimizar Cortes</strong></p>
        </div>
      </div>
    )
  }

  const { bins, unfitted, sw, sh, k } = lastResult
  const totalPieces = pieces.reduce((s, p) => s + p.qty, 0)
  const placedCount = bins.reduce((s, b) => s + b.placements.length, 0)
  const totalArea = bins.length * sw * sh
  const usedArea = bins.reduce((s, b) => s + (b as any).usedArea, 0)
  const efficiency = totalArea > 0 ? (usedArea / totalArea * 100).toFixed(1) : '0'
  const wasteM2 = ((totalArea - usedArea) / 1_000_000).toFixed(4)
  const cantosMm = pieces.reduce((s, p) => s + ((p.cantosW ?? 0) * p.w + (p.cantosH ?? 0) * p.h) * p.qty, 0)

  const handleExportPng = () => {
    const canvases = Array.from(areaRef.current?.querySelectorAll('canvas') ?? [])
    exportCanvasAsPng(canvases as HTMLCanvasElement[])
  }

  const handleCopyText = () => {
    const lines = ['📋 Lista de Cortes — OptiNerds', `Placa: ${sw}×${sh}mm | Kerf: ${k}mm | Eficiencia: ${efficiency}%`, '']
    bins.forEach((bin, i) => {
      lines.push(`Placa ${i + 1}  (${(bin as any).efficiency}% eficiencia)`)
      const groups = new Map<string, { name: string; w: number; h: number; qty: number }>()
      for (const p of bin.placements) {
        const k = `${p.piece.w}x${p.piece.h}|${p.piece.name}`
        if (!groups.has(k)) groups.set(k, { name: p.piece.name, w: p.piece.w, h: p.piece.h, qty: 0 })
        groups.get(k)!.qty++
      }
      groups.forEach((g) => lines.push(`  ✂  ${g.name.padEnd(20)}  ${g.w} × ${g.h}mm  ×${g.qty}`))
      lines.push('')
    })
    lines.push(`Total: ${placedCount}/${totalPieces} piezas en ${bins.length} placa${bins.length !== 1 ? 's' : ''}`)
    lines.push(`Desperdicio: ${wasteM2} m²`)
    if (cantosMm > 0) lines.push(`Canto: ${(cantosMm / 1000).toFixed(2)} m lineales`)
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
  }

  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* Stats bar */}
      <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-0 shadow-sm">
        {[
          { val: String(bins.length), lbl: 'Placas usadas' },
          { val: efficiency + '%', lbl: 'Eficiencia' },
          { val: `${placedCount}/${totalPieces}`, lbl: 'Piezas' },
          { val: wasteM2 + ' m²', lbl: 'Desperdicio' },
        ].map((s, i) => (
          <div key={i} className={`flex flex-col items-center flex-1 px-4 ${i < 3 ? 'border-r border-slate-200' : ''}`}>
            <span className="text-xl font-bold text-slate-900">{s.val}</span>
            <span className="text-xs text-slate-500 uppercase tracking-wide">{s.lbl}</span>
          </div>
        ))}
        <div className="flex gap-2 ml-4">
          <Button variant="ghost" size="sm" onClick={handleExportPng}>PNG</Button>
          <Button variant="ghost" size="sm" onClick={handleCopyText}>Copiar lista</Button>
        </div>
      </div>

      {unfitted.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
          <strong>⚠ {unfitted.length} pieza{unfitted.length > 1 ? 's' : ''} no entraron</strong>
          {' — '}{unfitted.map((p) => `${p.name} (${p.w}×${p.h}mm)`).join(', ')}
        </div>
      )}

      {cantosMm > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Canto necesario: <strong>{(cantosMm / 1000).toFixed(2)} m lineales</strong>
        </div>
      )}

      <div ref={areaRef} className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-6 shadow-sm">
        {(bins as any[]).map((bin, i) => (
          <BinCanvas key={i} bin={bin} index={i} sw={sw} sh={sh} k={k} />
        ))}
      </div>
    </div>
  )
}
