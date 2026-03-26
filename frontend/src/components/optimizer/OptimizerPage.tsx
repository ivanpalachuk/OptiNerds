import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOptimizerStore } from '../../store/optimizerStore'
import { optimize } from '../../lib/algorithm/optimizer'
import { BoardConfig } from './BoardConfig'
import { PieceForm } from './PieceForm'
import { ResultsPanel } from './ResultsPanel'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { cutsApi } from '../../lib/api/cuts'

const DEMO_PIECES = [
  { name: 'Tapa superior', w: 900, h: 450, qty: 1, cantosW: 2, cantosH: 0 },
  { name: 'Tapa inferior', w: 900, h: 450, qty: 1, cantosW: 2, cantosH: 0 },
  { name: 'Lateral',       w: 450, h: 600, qty: 2, cantosW: 0, cantosH: 2 },
  { name: 'Fondo',         w: 880, h: 580, qty: 1, cantosW: 0, cantosH: 0 },
  { name: 'Estante',       w: 860, h: 350, qty: 3, cantosW: 2, cantosH: 0 },
  { name: 'Puerta',        w: 430, h: 580, qty: 2, cantosW: 1, cantosH: 2 },
]

export function OptimizerPage() {
  const store = useOptimizerStore()
  const qc = useQueryClient()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [cutName, setCutName] = useState('')

  const saveMutation = useMutation({
    mutationFn: (name: string) => {
      const body = {
        name,
        boardWidth: store.boardWidth,
        boardHeight: store.boardHeight,
        boardThick: store.boardThick,
        boardQty: store.boardQty,
        kerf: store.kerf,
        pieces: store.pieces,
        result: store.lastResult,
      }
      return store.currentCutId
        ? cutsApi.update(store.currentCutId, body)
        : cutsApi.create(body)
    },
    onSuccess: (data) => {
      store.markSaved(data.id)
      qc.invalidateQueries({ queryKey: ['cuts'] })
      setSaveModalOpen(false)
      setCutName('')
    },
  })

  const handleOptimize = () => {
    if (store.pieces.length === 0) return
    setIsOptimizing(true)
    setTimeout(() => {
      const result = optimize(store.pieces, store.boardWidth, store.boardHeight, store.kerf, store.boardQty)
      store.setResult(result)
      setIsOptimizing(false)
    }, 10)
  }

  const handleLoadDemo = () => {
    store.resetAll()
    DEMO_PIECES.forEach((p) => store.addPiece({ ...p }))
  }

  const handleSave = () => {
    if (store.currentCutId && !store.isDirty) return
    if (store.currentCutId) {
      saveMutation.mutate(store.currentCutId)
    } else {
      setSaveModalOpen(true)
    }
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-5 flex gap-5 items-start">
      {/* Panel izquierdo */}
      <aside className="w-96 flex-shrink-0 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">
            {store.currentCutId ? (store.isDirty ? '● Sin guardar' : '✓ Guardado') : 'Nuevo corte'}
          </span>
          <button onClick={handleLoadDemo} className="text-xs text-slate-400 hover:text-slate-600 underline">
            Cargar ejemplo
          </button>
        </div>

        <BoardConfig />
        <PieceForm />

        <Button
          onClick={handleOptimize}
          loading={isOptimizing}
          disabled={store.pieces.length === 0}
          className="w-full !bg-emerald-600 hover:!bg-emerald-700 !py-3.5 !text-base"
        >
          Optimizar Cortes
        </Button>

        {store.lastResult && (
          <Button
            variant="ghost"
            onClick={handleSave}
            loading={saveMutation.isPending}
            disabled={!store.isDirty && !!store.currentCutId}
            className="w-full"
          >
            {store.currentCutId ? (store.isDirty ? 'Guardar cambios' : 'Guardado ✓') : 'Guardar corte'}
          </Button>
        )}
      </aside>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <ResultsPanel />
      </div>

      {/* Modal guardar */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-lg">Guardar corte</h3>
            <Input label="Nombre del proyecto" placeholder="Ej: Ropero dormitorio" value={cutName}
              onChange={(e) => setCutName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && cutName.trim()) saveMutation.mutate(cutName.trim()) }} />
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setSaveModalOpen(false)}>Cancelar</Button>
              <Button className="flex-1" loading={saveMutation.isPending}
                disabled={!cutName.trim()}
                onClick={() => saveMutation.mutate(cutName.trim())}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
