import { useOptimizerStore } from '../../store/optimizerStore'
import { Input } from '../ui/Input'

export function BoardConfig() {
  const { boardWidth, boardHeight, boardThick, boardQty, kerf, setBoardConfig } = useOptimizerStore()

  const areaM2 = ((boardWidth * boardHeight) / 1_000_000).toFixed(4)

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Placa / Tablero</h2>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Ancho (mm)" type="number" min={1} value={boardWidth}
          onChange={(e) => setBoardConfig({ boardWidth: +e.target.value })} />
        <Input label="Alto (mm)" type="number" min={1} value={boardHeight}
          onChange={(e) => setBoardConfig({ boardHeight: +e.target.value })} />
        <Input label="Espesor (mm)" type="number" min={1} value={boardThick}
          onChange={(e) => setBoardConfig({ boardThick: +e.target.value })} />
        <Input label="Cantidad placas" type="number" min={1} value={boardQty}
          onChange={(e) => setBoardConfig({ boardQty: +e.target.value })} />
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {boardWidth} × {boardHeight}mm — {areaM2} m² por placa
      </p>

      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-4">Hoja de Sierra (Kerf)</h2>
      <Input label="Grosor del corte (mm)" type="number" min={0} step={0.5} value={kerf}
        onChange={(e) => setBoardConfig({ kerf: +e.target.value })} />
      {kerf > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
          Kerf de <strong>{kerf}mm</strong> — cada corte consume {kerf}mm de material.
        </p>
      )}
    </section>
  )
}
