import type { BinResult } from '../algorithm/types'

export function drawBin(
  canvas: HTMLCanvasElement,
  bin: BinResult,
  sw: number,
  sh: number,
  k: number,
): void {
  const MAX_W = Math.min(900, canvas.parentElement?.clientWidth ?? 700)
  const MAX_H = 520
  const scale = Math.min(MAX_W / sw, MAX_H / sh)

  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)

  const ctx = canvas.getContext('2d')!

  // Fondo madera
  ctx.fillStyle = '#F5EDD8'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Grilla cada 100mm
  ctx.strokeStyle = '#EAE0C8'
  ctx.lineWidth = 0.5
  const step = 100 * scale
  for (let x = step; x < canvas.width; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
  }
  for (let y = step; y < canvas.height; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
  }

  for (const p of bin.placements) {
    const x = p.x * scale
    const y = p.y * scale
    const w = p.w * scale
    const h = p.h * scale

    ctx.fillStyle = p.piece.color + 'D0'
    ctx.fillRect(x, y, w, h)

    ctx.strokeStyle = hexToRgba(p.piece.color, 0.7)
    ctx.lineWidth = 1.5
    ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5)

    // Zona kerf
    if (k > 0) {
      const ks = k * scale
      ctx.fillStyle = 'rgba(0,0,0,0.07)'
      ctx.fillRect(x + w, y, ks, h)
      ctx.fillRect(x, y + h, w, ks)
    }

    // Texto
    if (w > 24 && h > 14) {
      const fontSize = Math.max(8, Math.min(13, h * 0.22, w * 0.12))
      ctx.font = `600 ${fontSize}px -apple-system,sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const cx = x + w / 2
      const cy = y + h / 2

      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(truncate(p.piece.name, 16), cx + 0.5, cy - fontSize * 0.6 + 0.5)
      ctx.fillStyle = '#1E3A5F'
      ctx.fillText(truncate(p.piece.name, 16), cx, cy - fontSize * 0.6)

      if (h > 28) {
        const dimFont = Math.max(7, fontSize * 0.8)
        ctx.font = `${dimFont}px -apple-system,sans-serif`
        ctx.fillStyle = 'rgba(30,58,95,0.55)'
        ctx.fillText(
          `${p.piece.w}×${p.piece.h}${p.rotated ? ' ®' : ''}`,
          cx,
          cy + fontSize * 0.55,
        )
      }
    }
  }

  // Marco y cotas
  ctx.strokeStyle = '#94A3B8'
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

  ctx.fillStyle = '#64748B'
  ctx.font = '10px -apple-system,sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText(`${sw} mm`, canvas.width - 4, canvas.height - 2)
  ctx.save()
  ctx.translate(4, canvas.height - 4)
  ctx.rotate(-Math.PI / 2)
  ctx.textAlign = 'right'
  ctx.fillText(`${sh} mm`, 0, 0)
  ctx.restore()
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function exportCanvasAsPng(canvases: HTMLCanvasElement[], filename = 'OptiNerds_cortes.png') {
  if (canvases.length === 0) return
  if (canvases.length === 1) {
    download(canvases[0].toDataURL('image/png'), filename)
    return
  }
  const padding = 20
  const maxW = Math.max(...canvases.map((c) => c.width))
  const totalH = canvases.reduce((s, c) => s + c.height + padding, 0)
  const merged = document.createElement('canvas')
  merged.width = maxW + padding * 2
  merged.height = totalH + padding
  const ctx = merged.getContext('2d')!
  ctx.fillStyle = '#F1F5F9'
  ctx.fillRect(0, 0, merged.width, merged.height)
  let oy = padding / 2
  canvases.forEach((c) => { ctx.drawImage(c, padding, oy); oy += c.height + padding })
  download(merged.toDataURL('image/png'), filename)
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}
