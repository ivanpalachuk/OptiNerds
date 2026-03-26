import { create } from 'zustand'
import type { Piece, OptimizeResult } from '../lib/algorithm/types'

const COLORS = [
  '#93C5FD','#FCA5A5','#86EFAC','#FDE68A','#C4B5FD',
  '#FDBA74','#6EE7B7','#F9A8D4','#BAE6FD','#D9F99D',
  '#A5F3FC','#FECDD3','#BBF7D0','#FEF08A','#DDD6FE',
  '#FED7AA','#CFFAFE','#FCE7F3','#DCFCE7','#FEF9C3',
]

export interface LoadCutPayload {
  cutId: string
  boardWidth: number
  boardHeight: number
  boardThick: number
  boardQty: number
  kerf: number
  pieces: Piece[]
  result: OptimizeResult | null
}

interface OptimizerState {
  boardWidth: number
  boardHeight: number
  boardThick: number
  boardQty: number
  kerf: number
  pieces: Piece[]
  nextId: number
  colorIdx: number
  lastResult: OptimizeResult | null
  isOptimizing: boolean
  currentCutId: string | null
  isDirty: boolean

  setBoardConfig: (cfg: Partial<Pick<OptimizerState, 'boardWidth' | 'boardHeight' | 'boardThick' | 'boardQty' | 'kerf'>>) => void
  addPiece: (piece: Omit<Piece, 'id' | 'color'>) => void
  removePiece: (id: number) => void
  updatePiece: (id: number, field: keyof Piece, value: unknown) => void
  clearPieces: () => void
  setResult: (result: OptimizeResult | null) => void
  setOptimizing: (val: boolean) => void
  loadCut: (payload: LoadCutPayload) => void
  resetAll: () => void
  markSaved: (cutId: string) => void
}

const DEFAULT: Pick<OptimizerState,
  'boardWidth'|'boardHeight'|'boardThick'|'boardQty'|'kerf'|
  'pieces'|'nextId'|'colorIdx'|'lastResult'|'isOptimizing'|'currentCutId'|'isDirty'
> = {
  boardWidth: 2440,
  boardHeight: 1220,
  boardThick: 18,
  boardQty: 1,
  kerf: 3,
  pieces: [],
  nextId: 1,
  colorIdx: 0,
  lastResult: null,
  isOptimizing: false,
  currentCutId: null,
  isDirty: false,
}

export const useOptimizerStore = create<OptimizerState>()((set, get) => ({
  ...DEFAULT,

  setBoardConfig: (cfg) => set((s) => ({ ...s, ...cfg, isDirty: true })),

  addPiece: (piece) =>
    set((s) => ({
      pieces: [...s.pieces, { ...piece, id: s.nextId, color: COLORS[s.colorIdx % COLORS.length] }],
      nextId: s.nextId + 1,
      colorIdx: s.colorIdx + 1,
      isDirty: true,
    })),

  removePiece: (id) =>
    set((s) => ({ pieces: s.pieces.filter((p) => p.id !== id), isDirty: true })),

  updatePiece: (id, field, value) =>
    set((s) => ({
      pieces: s.pieces.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      isDirty: true,
    })),

  clearPieces: () => set({ pieces: [], isDirty: true }),

  setResult: (result) => set({ lastResult: result }),

  setOptimizing: (val) => set({ isOptimizing: val }),

  loadCut: (payload) =>
    set({
      boardWidth: payload.boardWidth,
      boardHeight: payload.boardHeight,
      boardThick: payload.boardThick,
      boardQty: payload.boardQty,
      kerf: payload.kerf,
      pieces: payload.pieces,
      lastResult: payload.result,
      currentCutId: payload.cutId,
      isDirty: false,
      nextId: payload.pieces.length > 0 ? Math.max(...payload.pieces.map((p) => p.id)) + 1 : 1,
      colorIdx: payload.pieces.length,
    }),

  resetAll: () => set({ ...DEFAULT }),

  markSaved: (cutId) => set({ currentCutId: cutId, isDirty: false }),
}))
