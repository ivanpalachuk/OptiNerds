import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { cutsApi, type CutResponse } from '../../lib/api/cuts'
import { useOptimizerStore } from '../../store/optimizerStore'
import { Button } from '../ui/Button'

export function CutsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const loadCut = useOptimizerStore((s) => s.loadCut)

  const { data: cuts = [], isLoading } = useQuery({
    queryKey: ['cuts'],
    queryFn: cutsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: cutsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuts'] }),
  })

  const handleLoad = (cut: CutResponse) => {
    loadCut({
      cutId: cut.id,
      boardWidth: cut.boardWidth,
      boardHeight: cut.boardHeight,
      boardThick: cut.boardThick ?? 18,
      boardQty: cut.boardQty ?? 1,
      kerf: cut.kerf,
      pieces: cut.pieces,
      result: cut.result,
    })
    navigate({ to: '/optimizer' })
  }

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Cargando cortes...</div>
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Mis Cortes</h1>
        <Button variant="secondary" onClick={() => navigate({ to: '/optimizer' })}>+ Nuevo corte</Button>
      </div>

      {cuts.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-16 text-center text-slate-400">
          <p className="text-lg mb-2">No tenés cortes guardados</p>
          <p className="text-sm">Optimizá un corte y guardalo desde el optimizador.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cuts.map((cut) => (
            <div key={cut.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{cut.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(cut.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                <span>Placa: {cut.boardWidth} × {cut.boardHeight}mm</span>
                <span>{cut.pieces.length} tipo{cut.pieces.length !== 1 ? 's' : ''} de pieza · kerf {cut.kerf}mm</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleLoad(cut)}>
                  Cargar
                </Button>
                <Button variant="danger" size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => { if (confirm('¿Eliminar este corte?')) deleteMutation.mutate(cut.id) }}>
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
