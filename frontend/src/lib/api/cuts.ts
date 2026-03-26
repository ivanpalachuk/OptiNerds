import { api } from './client'
import type { Piece, OptimizeResult } from '../algorithm/types'

export interface CutResponse {
  id: string
  userId: string
  name: string
  boardWidth: number
  boardHeight: number
  boardThick: number
  boardQty: number
  kerf: number
  pieces: Piece[]
  result: OptimizeResult | null
  createdAt: string
  updatedAt: string
}

export interface CreateCutRequest {
  name: string
  boardWidth: number
  boardHeight: number
  boardThick: number
  boardQty: number
  kerf: number
  pieces: Piece[]
  result?: OptimizeResult | null
}

export const cutsApi = {
  list: () => api.get<CutResponse[]>('/cuts').then((r) => r.data),

  get: (id: string) => api.get<CutResponse>(`/cuts/${id}`).then((r) => r.data),

  create: (body: CreateCutRequest) =>
    api.post<CutResponse>('/cuts', body).then((r) => r.data),

  update: (id: string, body: Partial<CreateCutRequest>) =>
    api.put<CutResponse>(`/cuts/${id}`, body).then((r) => r.data),

  remove: (id: string) => api.delete(`/cuts/${id}`),
}
