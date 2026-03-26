import { useState } from 'react'
import { useOptimizerStore } from '../../store/optimizerStore'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function PieceForm() {
  const { addPiece, clearPieces, pieces, boardWidth, boardHeight } = useOptimizerStore()
  const [name, setName] = useState('')
  const [w, setW] = useState('')
  const [h, setH] = useState('')
  const [qty, setQty] = useState('1')
  const [cantosW, setCantosW] = useState('0')
  const [cantosH, setCantosH] = useState('0')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const pw = parseFloat(w), ph = parseFloat(h), pq = Math.max(1, parseInt(qty) || 1)
    if (!pw || !ph || pw <= 0 || ph <= 0) { setError('Ingresá dimensiones válidas.'); return }
    const fitsN = pw <= boardWidth && ph <= boardHeight
    const fitsR = ph <= boardWidth && pw <= boardHeight
    if (!fitsN && !fitsR) { setError(`La pieza ${pw}×${ph}mm no entra en la placa ${boardWidth}×${boardHeight}mm.`); return }
    addPiece({ name: name.trim() || `Pieza ${Date.now() % 1000}`, w: pw, h: ph, qty: pq, cantosW: +cantosW, cantosH: +cantosH })
    setName(''); setW(''); setH(''); setQty('1'); setCantosW('0'); setCantosH('0'); setError('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleAdd() }

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).split('\n').filter((l) => l.trim() && !l.startsWith('#'))
      lines.forEach((line) => {
        const [n, rw, rh, rq] = line.split(/[,;]/).map((s) => s.trim())
        const pw = parseFloat(rw), ph = parseFloat(rh)
        if (!isNaN(pw) && !isNaN(ph) && pw > 0 && ph > 0) {
          addPiece({ name: n || 'Pieza', w: pw, h: ph, qty: parseInt(rq) || 1, cantosW: 0, cantosH: 0 })
        }
      })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Piezas a Cortar</h2>

      <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 mb-3">
        <Input label="Nombre / Etiqueta" placeholder="Lateral, Tapa, Estante..." value={name}
          onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} maxLength={24} />
        <div className="grid grid-cols-3 gap-2">
          <Input label="Ancho (mm)" type="number" min={1} placeholder="400" value={w}
            onChange={(e) => setW(e.target.value)} onKeyDown={handleKeyDown} />
          <Input label="Alto (mm)" type="number" min={1} placeholder="300" value={h}
            onChange={(e) => setH(e.target.value)} onKeyDown={handleKeyDown} />
          <Input label="Cantidad" type="number" min={1} value={qty}
            onChange={(e) => setQty(e.target.value)} onKeyDown={handleKeyDown} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cantos ancho</span>
            <select value={cantosW} onChange={(e) => setCantosW(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
              <option value="0">0 cantos</option>
              <option value="1">1 canto</option>
              <option value="2">2 cantos</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Cantos alto</span>
            <select value={cantosH} onChange={(e) => setCantosH(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm bg-white focus:border-blue-500 outline-none">
              <option value="0">0 cantos</option>
              <option value="1">1 canto</option>
              <option value="2">2 cantos</option>
            </select>
          </label>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button variant="secondary" onClick={handleAdd} className="w-full">+ Agregar Pieza</Button>
      </div>

      {/* Lista */}
      <div className="max-h-64 overflow-y-auto flex flex-col gap-1.5 mb-3">
        {pieces.length === 0
          ? <p className="text-center text-slate-400 text-sm py-4">No hay piezas cargadas</p>
          : pieces.map((p) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md border border-slate-100 text-sm">
              <span className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10" style={{ background: p.color }}/>
              <span className="flex-1 font-medium truncate">{p.name}</span>
              <span className="text-slate-400 text-xs flex-shrink-0">{p.w}×{p.h}mm</span>
              {(p.cantosW > 0 || p.cantosH > 0) && (
                <span className="text-xs text-slate-400 bg-slate-100 rounded px-1.5 py-0.5 border border-slate-200 flex-shrink-0">
                  ↔{p.cantosW} ↕{p.cantosH}
                </span>
              )}
              <span className="text-blue-600 font-semibold text-xs flex-shrink-0">×{p.qty}</span>
              <button onClick={() => useOptimizerStore.getState().removePiece(p.id)}
                className="text-slate-300 hover:text-red-500 transition-colors text-xs ml-1 flex-shrink-0">✕</button>
            </div>
          ))
        }
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={clearPieces} disabled={pieces.length === 0}>Limpiar todo</Button>
        <label className="cursor-pointer">
          <Button variant="ghost" size="sm" as="span">Importar CSV</Button>
          <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
        </label>
      </div>
      <p className="text-xs text-slate-400 mt-2">CSV: nombre, ancho, alto, cantidad</p>
    </section>
  )
}
